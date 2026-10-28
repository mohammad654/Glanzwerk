// Localized builds output into dist/<locale>/, which leaves nothing at the domain
// root. Crawlers fetch /robots.txt and /sitemap.xml from there, and a visitor who
// types the bare domain has to land somewhere. Runs as `postbuild`.
import { writeFileSync } from 'node:fs';

const OUT = 'dist/glanzwerk/browser';
const LOCALES = ['de', 'en'];
const DEFAULT_LOCALE = 'de';
// '/' locally, '/Glanzwork/' on GitHub Pages. Both slashes required.
const BASE = process.env.DEPLOY_BASE ?? '/';
const ORIGIN = process.env.SITE_ORIGIN ?? 'https://www.glanzwerk.de';

// sitemap.xml is written straight into this folder by generate-sitemap.mjs, which
// runs next and reads the prerendered pages.

// Generated rather than copied: the disallow paths carry the deploy base and the
// sitemap line carries the origin, and both change per deployment.
writeFileSync(
  `${OUT}/robots.txt`,
  `User-agent: *
Allow: /

# Not public pages, and nothing to index behind them.
${LOCALES.map((locale) => `Disallow: ${BASE}${locale}/login`).join('\n')}

Sitemap: ${ORIGIN}/sitemap.xml
`,
);

// Sent to the default locale. A redirect page search engines can see is a page
// they can index, hence the noindex and the canonical pointing at the real one.
const redirect = `<!doctype html>
<html lang="${DEFAULT_LOCALE}">
<head>
<meta charset="utf-8">
<title>Glanzwork</title>
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${BASE}${DEFAULT_LOCALE}/">
<link rel="canonical" href="${ORIGIN}/${DEFAULT_LOCALE}">
</head>
<body>
<a href="${BASE}${DEFAULT_LOCALE}/">Glanzwork</a>
</body>
</html>
`;

writeFileSync(`${OUT}/index.html`, redirect);

// GitHub Pages has no rewrite rules: it serves 404.html for anything it cannot
// find, which is the only hook available for an unmatched deep link.
writeFileSync(`${OUT}/404.html`, redirect);

// Without this, Pages runs the output through Jekyll and drops _-prefixed files.
writeFileSync(`${OUT}/.nojekyll`, '');

console.log(`dist root: robots.txt, index.html, 404.html -> ${BASE}${DEFAULT_LOCALE}/`);
