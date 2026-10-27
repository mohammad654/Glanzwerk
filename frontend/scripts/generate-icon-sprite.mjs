// Builds public/assets/icons/sprite.svg from the icons the source actually uses.
// Wired to `prebuild`, so adding an icon can never leave the sprite behind.
//
// Shipping bootstrap-icons' stylesheet meant 100 kB of CSS and a 132 kB webfont
// carrying ~2000 glyphs for the few dozen in use. A sprite of only those is a
// fraction of the size, and `bi-` stays as the name prefix so one grep over the
// source still finds every usage.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_DIR = 'src';
const ICON_DIR = 'node_modules/bootstrap-icons/icons';
const OUTPUT = 'public/assets/icons/sprite.svg';
const SOURCE_EXTENSIONS = ['.html', '.ts'];
const NAME_PATTERN = /\bbi-[a-z0-9]+(?:-[a-z0-9]+)*\b/g;

const sourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(path);
    }

    return SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension)) ? [path] : [];
  });

const usedNames = () => {
  const names = new Set();

  for (const file of sourceFiles(SOURCE_DIR)) {
    for (const [name] of readFileSync(file, 'utf8').matchAll(NAME_PATTERN)) {
      names.add(name);
    }
  }

  return [...names].sort();
};

// Each icon file is a standalone <svg>; a sprite wants its guts under a <symbol>
// that carries the viewBox, so `width`/`height` can come from CSS instead.
const toSymbol = (name) => {
  const file = join(ICON_DIR, `${name.replace(/^bi-/, '')}.svg`);
  const svg = readFileSync(file, 'utf8');

  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1];
  const body = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg)?.[1];

  if (!viewBox || !body) {
    throw new Error(`Could not read ${file}`);
  }

  return `<symbol id="${name}" viewBox="${viewBox}">${body.trim()}</symbol>`;
};

const names = usedNames();
const missing = [];
const symbols = [];

for (const name of names) {
  try {
    symbols.push(toSymbol(name));
  } catch {
    // A name with no icon behind it is a typo: report every one, then fail.
    missing.push(name);
  }
}

if (missing.length > 0) {
  throw new Error(`No bootstrap-icons SVG for: ${missing.join(', ')}`);
}

mkdirSync('public/assets/icons', { recursive: true });
writeFileSync(
  OUTPUT,
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols.join('')}</svg>\n`,
);

console.log(`${OUTPUT}: ${symbols.length} icons`);
