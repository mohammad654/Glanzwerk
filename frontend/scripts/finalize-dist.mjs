// Localized builds output into dist/<locale>/, which leaves nothing at the domain
// root. Crawlers fetch /robots.txt and /sitemap.xml from there, and a visitor who
// types the bare domain has to land somewhere. Runs as `postbuild`.
import { copyFileSync, writeFileSync } from 'node:fs';

const OUT = 'dist/glanzwerk/browser';
const DEFAULT_LOCALE = 'de';

for (const file of ['robots.txt', 'sitemap.xml']) {
  copyFileSync(`public/${file}`, `${OUT}/${file}`);
}

// A fallback only. The host should answer / with a 301 to /de/ — a redirect page
// that search engines can see is a page they can index, hence the noindex.
writeFileSync(
  `${OUT}/index.html`,
  `<!doctype html>
<html lang="${DEFAULT_LOCALE}">
<head>
<meta charset="utf-8">
<title>Glanzwerk</title>
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=/${DEFAULT_LOCALE}/">
<link rel="canonical" href="https://www.glanzwerk.de/${DEFAULT_LOCALE}">
</head>
<body>
<a href="/${DEFAULT_LOCALE}/">Glanzwerk</a>
</body>
</html>
`,
);

console.log(`dist root: robots.txt, sitemap.xml, index.html -> /${DEFAULT_LOCALE}/`);
