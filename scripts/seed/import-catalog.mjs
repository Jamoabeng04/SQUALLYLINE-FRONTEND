// scripts/seed/import-catalog.mjs
//
// Seeds the live Squally Line catalogue from the studio photography in
// docs/images/ and the manifest in ./catalog.mjs.
//
// What it does, in order:
//   1. Reads admin credentials from scripts/seed/.env.seed (gitignored).
//   2. Logs in and keeps the JWT access token.
//   3. Groups docs/images/*.{jpeg,jpg,png,webp} by capture second. The base
//      file for a second is the cover; its "(1)", "(2)" siblings are gallery
//      images.
//   4. Creates the category tree (parents first, then subcategories), skipping
//      any slug that already exists and reusing its id.
//   5. Creates each product and style, uploads the cover as primary_image and
//      the rest as a gallery batch, skipping any slug that already exists.
//   6. Prints a reconciliation report.
//
// It is idempotent: existing categories/products/styles are matched by slug and
// left alone, so re-running only fills in what is missing. Nothing is deleted.
//
// Requirements: Node 18+ (uses the global fetch, FormData and Blob).
//
// Usage:
//   node scripts/seed/import-catalog.mjs            # publish to the live API
//   node scripts/seed/import-catalog.mjs --dry-run  # validate only, no network
//
// The API base defaults to production. Override with API_URL in .env.seed to
// point at a staging or local backend.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, items } from './catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const IMAGES_DIR = path.join(REPO_ROOT, 'docs', 'images');
const ENV_FILE = path.join(__dirname, '.env.seed');

const DRY_RUN = process.argv.includes('--dry-run');

const DEFAULT_API = 'https://squallyline-api.up.railway.app';

// ------------------------------------------------------------------ helpers

const log = (...args) => console.log(...args);
const warn = (...args) => console.warn('  ! ', ...args);

// Minimal KEY=VALUE parser so the importer needs no dependencies. Ignores blank
// lines and # comments; strips matching surrounding quotes.
function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

// A WhatsApp export looks like:
//   "WhatsApp Image 2026-08-27 at 2.53.48 PM.jpeg"          (base)
//   "WhatsApp Image 2026-08-27 at 2.53.48 PM (1).jpeg"      (sibling)
// The capture second ("2.53.48") is the grouping key; the parenthesised number
// orders the siblings, with the base counting as 0.
const FILE_RE = /at (\d{1,2}\.\d{2}\.\d{2}) (AM|PM)(?: \((\d+)\))?\.(jpe?g|png|webp)$/i;

function groupImages(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Image directory not found: ${dir}`);
  }
  const groups = new Map(); // key -> [{ file, order }]
  const unmatched = [];

  for (const name of fs.readdirSync(dir)) {
    const ext = path.extname(name).toLowerCase();
    if (!CONTENT_TYPES[ext]) continue;
    const match = name.match(FILE_RE);
    if (!match) {
      unmatched.push(name);
      continue;
    }
    const key = match[1];
    const order = match[3] ? Number(match[3]) : 0;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ file: path.join(dir, name), order, name });
  }

  // Order every group's files so the base (cover) is always first.
  for (const files of groups.values()) {
    files.sort((a, b) => a.order - b.order);
  }
  return { groups, unmatched };
}

// Wrap a file on disk as the multipart part the API expects.
function filePart(filePath) {
  const buffer = fs.readFileSync(filePath);
  const type = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  return new Blob([buffer], { type });
}

// -------------------------------------------------------------- API wrapper

class Api {
  constructor(base) {
    this.root = `${base.replace(/\/$/, '')}/api`;
    this.token = null;
  }

  headers(extra = {}) {
    return this.token ? { Authorization: `Bearer ${this.token}`, ...extra } : extra;
  }

  async login(email, password) {
    const res = await fetch(`${this.root}/accounts/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Login failed (${res.status}): ${body.detail || body.message || JSON.stringify(body)}`);
    }
    const token = body?.tokens?.access;
    if (!token) throw new Error('Login succeeded but no access token was returned.');
    this.token = token;
    return body.user;
  }

  async getJson(endpoint) {
    const res = await fetch(`${this.root}${endpoint}`, { headers: this.headers() });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`GET ${endpoint} failed (${res.status})`);
    return body;
  }

  async postForm(endpoint, form) {
    const res = await fetch(`${this.root}${endpoint}`, {
      method: 'POST',
      headers: this.headers(),
      body: form,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`POST ${endpoint} failed (${res.status}): ${JSON.stringify(body)}`);
    }
    return body;
  }
}

// Collect every existing slug from a paginated public list endpoint.
async function existingSlugs(api, endpoint) {
  const slugs = new Set();
  let page = 1;
  let totalPages = 1;
  do {
    const sep = endpoint.includes('?') ? '&' : '?';
    const data = await api.getJson(`${endpoint}${sep}page=${page}&page_size=100`);
    for (const row of data?.results || []) if (row.slug) slugs.add(row.slug);
    totalPages = data?.total_pages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return slugs;
}

// ----------------------------------------------------------------- seeding

async function seedCategories(api, groups, report) {
  // Map slug -> id, seeded with whatever already exists so re-runs are cheap.
  const idBySlug = new Map();
  const existing = await api.getJson('/shop/admin/categories/');
  const existingRows = Array.isArray(existing) ? existing : existing?.categories || [];
  for (const row of existingRows) idBySlug.set(row.slug, row.id);

  for (const category of categories) {
    if (idBySlug.has(category.slug)) {
      report.categories.skipped.push(category.slug);
      continue;
    }

    const form = new FormData();
    form.append('name', category.name);
    form.append('slug', category.slug);
    form.append('description', category.description);
    form.append('is_active', 'true');
    if (category.parent) {
      const parentId = idBySlug.get(category.parent);
      if (parentId == null) {
        warn(`Category ${category.slug}: parent ${category.parent} not found, creating at top level.`);
      } else {
        form.append('parent', String(parentId));
      }
    }

    const cover = category.coverKey && groups.get(category.coverKey);
    if (cover && cover.length) {
      form.append('image', filePart(cover[0].file), path.basename(cover[0].file));
    } else if (category.coverKey) {
      warn(`Category ${category.slug}: no image found for key ${category.coverKey}.`);
    }

    try {
      const body = await api.postForm('/shop/admin/categories/', form);
      const saved = body?.category || body;
      idBySlug.set(category.slug, saved.id);
      report.categories.created.push(category.slug);
      log(`  + category  ${category.slug}`);
    } catch (error) {
      report.categories.failed.push({ slug: category.slug, error: error.message });
      warn(`Category ${category.slug} failed: ${error.message}`);
    }
  }

  return idBySlug;
}

async function seedItems(api, groups, idBySlug, report) {
  const productSlugs = await existingSlugs(api, '/shop/products/');
  const styleSlugs = await existingSlugs(api, '/shop/styles/');

  for (const item of items) {
    const bucket = item.kind === 'product' ? report.products : report.styles;
    const known = item.kind === 'product' ? productSlugs : styleSlugs;

    if (known.has(item.slug)) {
      bucket.skipped.push(item.slug);
      continue;
    }

    const files = groups.get(item.key);
    if (!files || !files.length) {
      bucket.failed.push({ slug: item.slug, error: `no images for key ${item.key}` });
      warn(`${item.kind} ${item.slug}: no images for key ${item.key}, skipping.`);
      continue;
    }

    const categoryId = idBySlug.get(item.category);
    if (categoryId == null) {
      bucket.failed.push({ slug: item.slug, error: `category ${item.category} missing` });
      warn(`${item.kind} ${item.slug}: category ${item.category} missing, skipping.`);
      continue;
    }

    const form = new FormData();
    form.append('name', item.name);
    form.append('slug', item.slug);
    form.append('description', item.description);
    form.append('category', String(categoryId));
    form.append('gender', item.gender);
    form.append('is_active', 'true');
    form.append('is_featured', item.featured ? 'true' : 'false');

    if (item.kind === 'product') {
      form.append('price', String(item.price));
      form.append('stock_quantity', String(item.stock));
      form.append('is_in_stock', 'true');
    } else {
      form.append('base_price', String(item.base_price));
      form.append('estimated_making_time', String(item.makingDays));
      form.append('is_customizable', 'true');
    }

    // Cover first, gallery second.
    form.append('primary_image', filePart(files[0].file), path.basename(files[0].file));

    const endpoint = item.kind === 'product'
      ? '/shop/admin/products/create/'
      : '/shop/admin/styles/create/';

    try {
      const body = await api.postForm(endpoint, form);
      const saved = body?.[item.kind] || body;
      const savedSlug = saved?.slug || item.slug;

      const gallery = files.slice(1);
      if (gallery.length) {
        const batch = new FormData();
        for (const image of gallery) {
          batch.append('images', filePart(image.file), path.basename(image.file));
        }
        const imagesEndpoint = item.kind === 'product'
          ? `/shop/admin/products/${savedSlug}/images/`
          : `/shop/admin/styles/${savedSlug}/images/`;
        await api.postForm(imagesEndpoint, batch);
      }

      bucket.created.push(item.slug);
      log(`  + ${item.kind.padEnd(7)} ${item.slug}  (${files.length} image${files.length === 1 ? '' : 's'})`);
    } catch (error) {
      bucket.failed.push({ slug: item.slug, error: error.message });
      warn(`${item.kind} ${item.slug} failed: ${error.message}`);
    }
  }
}

// ------------------------------------------------------------------- report

function blankBucket() {
  return { created: [], skipped: [], failed: [] };
}

function printReport(report, unmatched, unusedKeys) {
  const line = (label, bucket) =>
    log(`  ${label.padEnd(12)} created ${bucket.created.length}, skipped ${bucket.skipped.length}, failed ${bucket.failed.length}`);

  log('\n──────────────── reconciliation ────────────────');
  line('categories', report.categories);
  line('products', report.products);
  line('styles', report.styles);

  const allFailed = [
    ...report.categories.failed,
    ...report.products.failed,
    ...report.styles.failed,
  ];
  if (allFailed.length) {
    log('\n  Failures:');
    for (const failure of allFailed) log(`    - ${failure.slug}: ${failure.error}`);
  }
  if (unusedKeys.length) {
    log(`\n  Photo groups not referenced by the manifest (${unusedKeys.length}): ${unusedKeys.join(', ')}`);
  }
  if (unmatched.length) {
    log(`\n  Files whose names did not parse (${unmatched.length}): ${unmatched.slice(0, 8).join(', ')}${unmatched.length > 8 ? ' …' : ''}`);
  }
  log('────────────────────────────────────────────────');
}

// --------------------------------------------------------------------- main

async function main() {
  log(`Squally Line catalogue seeder${DRY_RUN ? ' (dry run)' : ''}`);
  log(`Images: ${IMAGES_DIR}`);

  const { groups, unmatched } = groupImages(IMAGES_DIR);
  log(`Found ${groups.size} photo groups from ${[...groups.values()].reduce((n, g) => n + g.length, 0)} files.`);

  // Which manifest keys have no matching photo group, and vice versa.
  const referenced = new Set([
    ...categories.map((c) => c.coverKey).filter(Boolean),
    ...items.map((i) => i.key),
  ]);
  const missingForItems = items.filter((i) => !groups.has(i.key)).map((i) => `${i.slug} (${i.key})`);
  const unusedKeys = [...groups.keys()].filter((k) => !referenced.has(k));

  if (missingForItems.length) {
    warn(`Manifest items with no photo group: ${missingForItems.join(', ')}`);
  }

  const report = {
    categories: blankBucket(),
    products: blankBucket(),
    styles: blankBucket(),
  };

  if (DRY_RUN) {
    log(`\nManifest: ${categories.length} categories, ` +
        `${items.filter((i) => i.kind === 'product').length} products, ` +
        `${items.filter((i) => i.kind === 'style').length} styles.`);
    log('Dry run only — no network calls made.');
    printReport(report, unmatched, unusedKeys);
    return;
  }

  const env = { ...readEnvFile(ENV_FILE), ...process.env };
  const email = env.SEED_ADMIN_EMAIL;
  const password = env.SEED_ADMIN_PASSWORD;
  const base = env.API_URL || DEFAULT_API;

  if (!email || !password) {
    throw new Error(
      `Missing credentials. Copy scripts/seed/.env.seed.example to scripts/seed/.env.seed ` +
      `and set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.`,
    );
  }

  const api = new Api(base);
  log(`\nAPI: ${api.root}`);
  const user = await api.login(email, password);
  log(`Logged in as ${user?.email || email}.`);

  log('\nCategories:');
  const idBySlug = await seedCategories(api, groups, report);

  log('\nItems:');
  await seedItems(api, groups, idBySlug, report);

  printReport(report, unmatched, unusedKeys);
}

main().catch((error) => {
  console.error(`\nFatal: ${error.message}`);
  process.exit(1);
});
