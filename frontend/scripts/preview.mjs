// Serves the built output the way the real host must, and doubles as the
// specification for the production host's rewrite rules:
//
//   1. `/` redirects to the default locale.
//   2. A prerendered path is served as a file.
//   3. Anything else inside a locale falls back to that locale's *client-render
//      shell*, `index.csr.html` — not its prerendered `index.html`. This matters:
//      `index.html` is the fully rendered home page, so handing it back for
//      `/de/admin` would paint the home page and then make Angular hydrate it as
//      the dashboard, which is a guaranteed hydration mismatch (NG0500). The shell
//      has no prerendered content, so there is nothing to mismatch.
//   4. `/api` is proxied to the Spring API, because `environment`'s base URL is
//      relative. The production host needs the same rewrite.
//
// `ng serve` cannot show any of this: it serves a single locale at the root, so the
// language switcher has nowhere to go.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { extname, join, normalize } from 'node:path';

const ROOT = 'dist/glanzwerk/browser';
const LOCALES = ['de', 'en'];
const DEFAULT_LOCALE = 'de';
const PORT = Number(process.argv[2] ?? 4300);
const API_TARGET = { host: 'localhost', port: Number(process.env.API_PORT ?? 8081) };

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
};

/** That locale's client-render shell, or its prerendered home page as a last resort. */
const shellFor = (locale) => {
  const csr = join(ROOT, locale, 'index.csr.html');
  return existsSync(csr) ? csr : join(ROOT, locale, 'index.html');
};

const fileFor = (pathname) => {
  // Strip the leading slash so join() cannot escape ROOT.
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '').replace(/^\/+/, '');
  const candidate = join(ROOT, safe);

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }

  const asDirectory = join(candidate, 'index.html');
  if (existsSync(asDirectory)) {
    return asDirectory;
  }

  const locale = LOCALES.find((code) => safe === code || safe.startsWith(`${code}/`));
  return locale ? shellFor(locale) : null;
};

/** Streams the request through to the API and the response back, unaltered. */
const proxyToApi = (request, response) => {
  const upstream = httpRequest(
    {
      host: API_TARGET.host,
      port: API_TARGET.port,
      method: request.method,
      path: request.url,
      headers: { ...request.headers, host: `${API_TARGET.host}:${API_TARGET.port}` },
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );

  upstream.on('error', () => {
    response.writeHead(502, { 'Content-Type': 'application/json' });
    response.end(
      JSON.stringify({
        status: 502,
        message: `No API on ${API_TARGET.host}:${API_TARGET.port}. Start the backend with: cd backend && mvn spring-boot:run`,
      }),
    );
  });

  request.pipe(upstream);
};

createServer((request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');

  if (pathname.startsWith('/api/')) {
    proxyToApi(request, response);
    return;
  }

  if (pathname === '/') {
    response.writeHead(302, { Location: `/${DEFAULT_LOCALE}/` });
    response.end();
    return;
  }

  const file = fileFor(pathname);
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(PORT, () => {
  console.log(`Preview: http://localhost:${PORT}/  (redirects to /${DEFAULT_LOCALE}/)`);
  console.log(`API proxy: /api -> http://${API_TARGET.host}:${API_TARGET.port}`);
});
