# Catalogue seeder

Populates the live Squally Line catalogue from the studio photography in
`docs/images/`. It creates the category tree, the ready-to-wear **products** and
the made-to-measure **styles** (the Gallery renders styles), uploading each
garment's cover photo plus its extra angles.

The data lives in [`catalog.mjs`](./catalog.mjs) — names, prices, descriptions
and the photo group each item uses. Edit that file to adjust the catalogue.

## How the photos are grouped

The WhatsApp exports share a capture second in their filename, e.g.

```
WhatsApp Image 2026-08-27 at 2.53.48 PM.jpeg        <- cover
WhatsApp Image 2026-08-27 at 2.53.48 PM (1).jpeg    <- extra angle
WhatsApp Image 2026-08-27 at 2.53.48 PM (2).jpeg    <- extra angle
```

Every item in `catalog.mjs` has a `key` (here `2.53.48`). The base file becomes
the cover image; the numbered siblings become the gallery.

## Running it

Requires **Node 18+** (for the built-in `fetch`, `FormData` and `Blob`).

1. Provide an admin login. Copy the template and fill it in:

   ```
   cp scripts/seed/.env.seed.example scripts/seed/.env.seed
   ```

   Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env.seed`. That file is
   gitignored — never commit it. The account needs admin rights on the shop API.

2. Dry run first (validates the manifest and photo grouping, makes no network
   calls):

   ```
   node scripts/seed/import-catalog.mjs --dry-run
   ```

3. Publish to the live catalogue:

   ```
   node scripts/seed/import-catalog.mjs
   ```

The importer prints a reconciliation report at the end: how many categories,
products and styles were created, skipped or failed, plus any photo groups the
manifest does not use.

## Safe to re-run

The importer is idempotent. Categories, products and styles are matched by
`slug`; anything that already exists is skipped and left untouched, so a second
run only fills in what is missing. It never deletes anything.

By default it targets production. Point it elsewhere by setting `API_URL` in
`.env.seed`.
