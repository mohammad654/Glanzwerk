// Fails when messages.de.xlf has drifted from messages.xlf.
//
// Angular matches translations by id, not by text. Edit an English string without
// changing its @@id and the German build silently keeps the old translation — which
// is how the German home page went on advertising Berlin after the company moved to
// Dresden. Nothing in the normal build catches that, so this does.
//
// Run `npm run i18n:check` (which re-extracts first).
import { readFileSync } from 'node:fs';

const SOURCE = 'src/locale/messages.xlf';
const TARGET = 'src/locale/messages.de.xlf';

const unitsIn = (file) => {
  const xml = readFileSync(file, 'utf8');
  const units = new Map();
  for (const [, id, body] of xml.matchAll(/<trans-unit id="([^"]+)"[^>]*>(.*?)<\/trans-unit>/gs)) {
    units.set(id, {
      source: body.match(/<source>(.*?)<\/source>/s)?.[1].trim() ?? '',
      target: body.match(/<target[^>]*>(.*?)<\/target>/s)?.[1].trim() ?? null,
    });
  }
  return units;
};

const source = unitsIn(SOURCE);
const german = unitsIn(TARGET);

const stale = [];
const missing = [];
const orphaned = [];

for (const [id, unit] of source) {
  const translated = german.get(id);
  if (!translated || translated.target === null) {
    missing.push(id);
  } else if (translated.source !== unit.source) {
    stale.push({ id, was: translated.source, now: unit.source });
  }
}

for (const id of german.keys()) {
  if (!source.has(id)) orphaned.push(id);
}

const truncate = (text) => (text.length > 70 ? `${text.slice(0, 70)}…` : text);

if (stale.length) {
  console.error(`\n${stale.length} stale translation(s) — English changed, German did not:`);
  for (const { id, was, now } of stale) {
    console.error(`  ${id}\n     translated from: ${truncate(was)}\n     source is now:   ${truncate(now)}`);
  }
}

if (missing.length) {
  console.error(`\n${missing.length} untranslated id(s):`);
  for (const id of missing) console.error(`  ${id}`);
}

if (orphaned.length) {
  console.warn(`\n${orphaned.length} orphaned id(s) — translated but no longer used:`);
  for (const id of orphaned) console.warn(`  ${id}`);
}

if (stale.length || missing.length) {
  console.error(`\nFix src/locale/messages.de.xlf, or give the changed string a new @@id.`);
  process.exit(1);
}

console.log(
  `translations ok: ${source.size} ids, all translated and in sync` +
    (orphaned.length ? ` (${orphaned.length} orphaned, safe to delete)` : ''),
);
