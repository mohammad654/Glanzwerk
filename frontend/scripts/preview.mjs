// Serves the built output the way the real host must: / redirects to the default
// locale, and each locale falls back to its own index.html. `ng serve` cannot show
// this — it serves a single locale at the root, so the language switcher has nowhere
// to go. Doubles as the specification for the production host's rewrite rules.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const ROOT = 'dist/glanzwerk/browser';
const LOCALES = ['de', 'en'];
const DEFAULT_LOCALE = 'de';
const PORT = Number(process.argv[2] ?? 4300);

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

  // Deep link into a locale that was not prerendered: hand back that locale's shell.
  const locale = LOCALES.find((code) => safe === code || safe.startsWith(`${code}/`));
  return locale ? join(ROOT, locale, 'index.html') : null;
};

createServer((request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');

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
});
