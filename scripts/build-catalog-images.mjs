// scripts/build-catalog-images.mjs
//
// Temporal fix for images vanishing on backend redeploy.
//
// The Django API stores uploaded media on Railway's container disk, which is
// wiped on every redeploy — so every product/style loses its /media/... image
// while its database row survives. Until real object storage / a CDN is wired
// up, we host the catalogue photography from the FRONTEND instead: the images
// ship inside the React build (committed to git, immutable per deploy), so no
// backend redeploy can touch them.
//
// This script:
//   1. Groups the studio photos in docs/images/ by capture second (the same
//      grouping the seeder uses: base file = cover, "(1)/(2)" = gallery).
//   2. Copies every photo referenced by scripts/seed/catalog.mjs into
//      public/catalog/ under a stable, URL-safe name derived from its key.
//   3. Writes src/api/catalogImages.js — slug -> image URL maps the adapters
//      use to render local images in place of the dead /media/ paths.
//
// Re-run it whenever the catalogue manifest or the photos change:
//   node scripts/build-catalog-images.mjs        (or: npm run catalog:images)
//
// Requires Node 18+.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, items } from './seed/catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(REPO_ROOT, 'docs', 'images');
const OUT_DIR = path.join(REPO_ROOT, 'public', 'catalog');
const OUT_MAP = path.join(REPO_ROOT, 'src', 'api', 'catalogImages.js');

// Public URL prefix the browser uses (public/catalog -> /catalog).
const URL_PREFIX = '/catalog';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const log = (...a) => console.log(...a);
const warn = (...a) => console.warn('  ! ', ...a);

// Same filename grammar as the seeder: "... at 2.53.48 PM.jpeg" (base = order 0)
// and "... at 2.53.48 PM (1).jpeg" (sibling = order 1, 2, ...). The capture
// second is the grouping key.
const FILE_RE = /at (\d{1,2}\.\d{2}\.\d{2}) (AM|PM)(?: \((\d+)\))?\.(jpe?g|png|webp)$/i;

function groupImages(dir) {
  if (!fs.existsSync(dir)) throw new Error(`Image directory not found: ${dir}`);
  const groups = new Map(); // key -> [{ file, order, ext }]
  for (const name of fs.readdirSync(dir)) {
    const ext = path.extname(name).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;
    const match = name.match(FILE_RE);
    if (!match) continue;
    const key = match[1];
    const order = match[3] ? Number(match[3]) : 0;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ file: path.join(dir, name), order, ext });
  }
  for (const files of groups.values()) files.sort((a, b) => a.order - b.order);
  return groups;
}

// A stable, URL-safe basename for a group member: "2.54.49" + order 0 ->
// "2-54-49-0.jpeg". Deterministic, so re-runs and multiple referents (e.g. a
// category cover that reuses a product's photo) resolve to the same file.
const emittedName = (key, order, ext) => `${key.replace(/\./g, '-')}-${order}${ext}`;

function main() {
  log('Building frontend-hosted catalogue images');
  log(`Source: ${IMAGES_DIR}`);
  log(`Output: ${OUT_DIR}`);

  const groups = groupImages(IMAGES_DIR);
  log(`Found ${groups.size} photo groups.`);

  // Start from a clean output dir so removed photos don't linger.
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const copied = new Set(); // emitted basenames already written this run
  const itemImages = {};    // slug -> [url, ...] (cover first)
  const categoryImages = {}; // slug -> url (cover only)
  const missing = [];

  // Copy one group member and return its public URL, writing bytes only once
  // (multiple referents of the same photo share one file).
  const emit = (key, member) => {
    const name = emittedName(key, member.order, member.ext);
    if (!copied.has(name)) {
      fs.copyFileSync(member.file, path.join(OUT_DIR, name));
      copied.add(name);
    }
    return `${URL_PREFIX}/${name}`;
  };

  // Items (products + styles): full ordered gallery, cover first.
  for (const item of items) {
    const files = groups.get(item.key);
    if (!files || !files.length) {
      missing.push(`${item.kind} ${item.slug} (key ${item.key})`);
      continue;
    }
    itemImages[item.slug] = files.map((f) => emit(item.key, f));
  }

  // Categories: cover image only.
  for (const category of categories) {
    if (!category.coverKey) continue;
    const files = groups.get(category.coverKey);
    if (!files || !files.length) {
      missing.push(`category ${category.slug} (key ${category.coverKey})`);
      continue;
    }
    categoryImages[category.slug] = emit(category.coverKey, files[0]);
  }

  writeMap(itemImages, categoryImages);

  const itemUrls = Object.values(itemImages).reduce((n, a) => n + a.length, 0);
  log(`\nCopied ${copied.size} files into public/catalog/.`);
  log(`Mapped ${Object.keys(itemImages).length} items (${itemUrls} image URLs) ` +
      `and ${Object.keys(categoryImages).length} category covers.`);
  if (missing.length) {
    warn(`No photo group for ${missing.length} entries:`);
    for (const m of missing) log(`    - ${m}`);
  }
  log(`\nWrote ${path.relative(REPO_ROOT, OUT_MAP)}.`);
}

function writeMap(itemImages, categoryImages) {
  const banner =
    '// AUTO-GENERATED by scripts/build-catalog-images.mjs — do not edit by hand.\n' +
    '//\n' +
    '// Maps catalogue slugs to frontend-hosted image URLs (served from\n' +
    '// public/catalog/). These stand in for the backend /media/ paths, which are\n' +
    "// wiped whenever the API redeploys on Railway's ephemeral disk. Regenerate\n" +
    '// with: npm run catalog:images\n\n';

  const body =
    `export const itemImages = ${JSON.stringify(sortKeys(itemImages), null, 2)};\n\n` +
    `export const categoryImages = ${JSON.stringify(sortKeys(categoryImages), null, 2)};\n`;

  fs.mkdirSync(path.dirname(OUT_MAP), { recursive: true });
  fs.writeFileSync(OUT_MAP, banner + body, 'utf8');
}

// Stable key order so the generated file has a clean, reviewable diff.
const sortKeys = (obj) =>
  Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));

main();
