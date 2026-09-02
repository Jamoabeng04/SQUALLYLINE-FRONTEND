// scripts/seed/catalog.mjs
//
// The seed manifest for the live Squally Line catalogue.
//
// Every entry here is derived from the studio photography in docs/images/. The
// WhatsApp exports are grouped by their capture second (the "key" below): the
// base file for a second becomes the cover, and any "(1)", "(2)", "(3)"
// siblings from the same second become the gallery images for that garment.
//
// Two record types exist, matching the two backend catalogues:
//   - product : ready-to-wear, sold from stock (price + stock_quantity)
//   - style   : made-to-measure, sold to order (base_price + making days).
//               The public Gallery renders styles only.
//
// Gender codes follow the API: U = Unisex, M = Men, F = Women, K = Kids.
// Prices are in Ghana cedis (GHS), whole numbers.
//
// Edit names, prices and copy freely — the importer keys off `slug`, so keep
// slugs stable once a run has published them or you will create duplicates.

// ---------------------------------------------------------------- categories
// Parents first (parent: null), then their subcategories. `coverKey` points at
// the photo group whose cover image should front the collection.

export const categories = [
  // Top-level collections — these become the Gallery filter chips.
  {
    slug: 'men',
    name: 'Men',
    parent: null,
    coverKey: '2.54.05',
    description: 'Tailored shirts, kaftans and native two-pieces for the modern Ghanaian gentleman.',
  },
  {
    slug: 'women',
    name: 'Women',
    parent: null,
    coverKey: '2.53.46',
    description: 'Occasion gowns, kente couture and sharp corporate tailoring, made to measure.',
  },
  {
    slug: 'kids',
    name: 'Kids',
    parent: null,
    coverKey: '2.54.54',
    description: 'Playful, hard-wearing pieces for the little ones, cut from the same fabrics we love.',
  },

  // Men subcategories.
  {
    slug: 'mens-shirts',
    name: 'Shirts',
    parent: 'men',
    coverKey: '2.54.11',
    description: 'Adinkra prints, KNUST heritage cuts and everyday shirting in short and long sleeve.',
  },
  {
    slug: 'mens-polos',
    name: 'Polos',
    parent: 'men',
    coverKey: '2.54.43',
    description: 'Textured piqué and waffle polos for smart-casual days.',
  },
  {
    slug: 'mens-kaftans',
    name: 'Kaftans',
    parent: 'men',
    coverKey: '2.53.51',
    description: 'Clean-lined kaftans with contrast collars and considered detailing.',
  },
  {
    slug: 'mens-native',
    name: 'Native & Two-Piece',
    parent: 'men',
    coverKey: '2.54.49',
    description: 'Embroidered native two-pieces, from ready-to-wear sets to made-to-measure statement suits.',
  },
  {
    slug: 'mens-agbada',
    name: 'Agbada',
    parent: 'men',
    coverKey: '2.57.10',
    description: 'Grand, gold-embroidered agbada for weddings and the biggest occasions.',
  },

  // Women subcategories.
  {
    slug: 'womens-gowns',
    name: 'Gowns',
    parent: 'women',
    coverKey: '2.53.55',
    description: 'Beaded mermaid gowns and floor-length silhouettes for red-carpet moments.',
  },
  {
    slug: 'womens-kente',
    name: 'Kente Styles',
    parent: 'women',
    coverKey: '2.54.37',
    description: 'Handwoven kente reimagined as corseted, contemporary couture.',
  },
  {
    slug: 'womens-ankara',
    name: 'Ankara Dresses',
    parent: 'women',
    coverKey: '2.53.57',
    description: 'Bold ankara prints tailored into structured, statement dresses.',
  },
  {
    slug: 'womens-corporate',
    name: 'Corporate & Suits',
    parent: 'women',
    coverKey: '2.54.42',
    description: 'Blazer dresses and sharply tailored suits for the boardroom and beyond.',
  },
  {
    slug: 'womens-bridal',
    name: 'Bridal',
    parent: 'women',
    coverKey: '2.57.09',
    description: 'Bespoke bridal couture, beaded and finished by hand for your day.',
  },
  {
    slug: 'couple-sets',
    name: 'Couple Sets',
    parent: 'women',
    coverKey: '2.54.45',
    description: 'Coordinated his-and-hers looks, cut from matching fabrics.',
  },

  // Kids subcategories.
  {
    slug: 'kids-girls',
    name: 'Girls',
    parent: 'kids',
    coverKey: '2.54.54',
    description: 'Ankara dresses and party pieces for girls.',
  },
  {
    slug: 'kids-boys',
    name: 'Boys',
    parent: 'kids',
    coverKey: '2.57.16',
    description: 'Sharp little two-pieces and polos for boys.',
  },
];

// --------------------------------------------------------------------- items
// One entry per photo group. `key` is the capture second shared by the group's
// files in docs/images/.

export const items = [
  // ---------------------------------------------------------- men · shirts
  {
    key: '2.53.48', kind: 'product', slug: 'horseshoe-applique-shirt',
    name: 'Horseshoe Appliqué Short-Sleeve Shirt', category: 'mens-shirts', gender: 'M',
    price: 320, stock: 15, featured: false,
    description: 'A relaxed short-sleeve shirt lifted by a hand-finished horseshoe appliqué at the chest.',
  },
  {
    key: '2.53.52', kind: 'product', slug: 'floral-resort-shirt',
    name: 'Floral Print Resort Shirt', category: 'mens-shirts', gender: 'M',
    price: 280, stock: 18, featured: false,
    description: 'An easy resort shirt in an all-over floral print, made for warm evenings.',
  },
  {
    key: '2.54.05', kind: 'product', slug: 'burgundy-adinkra-shirt',
    name: 'Burgundy Adinkra Long-Sleeve Shirt', category: 'mens-shirts', gender: 'M',
    price: 380, stock: 12, featured: true,
    description: 'Adinkra symbols woven across a deep burgundy ground, tailored for a clean long-sleeve fit.',
  },
  {
    key: '2.54.08', kind: 'product', slug: 'emerald-adinkra-shirt',
    name: 'Emerald Adinkra Long-Sleeve Shirt', category: 'mens-shirts', gender: 'M',
    price: 380, stock: 12, featured: false,
    description: 'The adinkra long-sleeve in a rich emerald colourway, ready for the office or the outing.',
  },
  {
    key: '2.54.09', kind: 'product', slug: 'sky-adinkra-panelled-shirt',
    name: 'Sky Adinkra Panelled Shirt', category: 'mens-shirts', gender: 'M',
    price: 390, stock: 10, featured: false,
    description: 'A light-blue long-sleeve with contrast adinkra panelling across the yoke and cuffs.',
  },
  {
    key: '2.54.10', kind: 'product', slug: 'amber-adinkra-ankara-shirt',
    name: 'Amber Adinkra Ankara Shirt', category: 'mens-shirts', gender: 'M',
    price: 390, stock: 10, featured: false,
    description: 'Warm amber adinkra paired with an ankara panel for a shirt that reads bold up close.',
  },
  {
    key: '2.54.11', kind: 'product', slug: 'knust-75th-anniversary-shirt',
    name: 'KNUST 75th Anniversary Shirt', category: 'mens-shirts', gender: 'M',
    price: 350, stock: 20, featured: true,
    description: 'A cream commemorative shirt marking KNUST at 75, printed with the university crest and motifs.',
  },
  {
    key: '2.54.15', kind: 'product', slug: 'knust-heritage-shirt',
    name: 'KNUST Heritage Long-Sleeve Shirt', category: 'mens-shirts', gender: 'M',
    price: 360, stock: 15, featured: false,
    description: 'A long-sleeve heritage shirt with a contrast green collar and campus-inspired print.',
  },
  {
    key: '2.54.18', kind: 'product', slug: 'knust-heritage-shirt-ii',
    name: 'KNUST Heritage Long-Sleeve Shirt II', category: 'mens-shirts', gender: 'M',
    price: 360, stock: 15, featured: false,
    description: 'The heritage shirt in an alternate layout, same contrast collar and considered finish.',
  },
  {
    key: '2.54.23', kind: 'product', slug: 'mustard-kente-pocket-shirt',
    name: 'Mustard Kente-Pocket Shirt', category: 'mens-shirts', gender: 'M',
    price: 370, stock: 12, featured: false,
    description: 'A mustard long-sleeve with white shoulder detailing and a woven kente pocket.',
  },
  {
    key: '2.54.24', kind: 'product', slug: 'gold-kente-pocket-shirt',
    name: 'Gold Kente-Pocket Shirt', category: 'mens-shirts', gender: 'M',
    price: 360, stock: 12, featured: false,
    description: 'Bright gold shirting finished with a handwoven kente chest pocket.',
  },
  {
    key: '2.54.32', kind: 'product', slug: 'burgundy-utility-shirt',
    name: 'Burgundy Utility Short-Sleeve Shirt', category: 'mens-shirts', gender: 'M',
    price: 300, stock: 16, featured: false,
    description: 'A short-sleeve shirt with twin flap pockets in a deep, wearable burgundy.',
  },
  {
    key: '2.54.33', kind: 'product', slug: 'emerald-mandarin-shirt',
    name: 'Emerald Mandarin Utility Shirt', category: 'mens-shirts', gender: 'M',
    price: 300, stock: 16, featured: false,
    description: 'A mandarin-collar short-sleeve with twin pockets, cut in cool emerald.',
  },
  {
    key: '2.54.34', kind: 'product', slug: 'cathedral-adinkra-shirt',
    name: 'Cathedral Adinkra Long-Sleeve Shirt', category: 'mens-shirts', gender: 'M',
    price: 400, stock: 10, featured: true,
    description: 'A white long-sleeve printed with a stained-glass and adinkra motif for standout occasions.',
  },
  {
    key: '2.54.36', kind: 'product', slug: 'crimson-print-overshirt',
    name: 'Crimson Print Overshirt', category: 'mens-shirts', gender: 'M',
    price: 420, stock: 9, featured: false,
    description: 'A structured print overshirt that layers like a light jacket over a tee or polo.',
  },
  {
    key: '2.54.39', kind: 'product', slug: 'royal-mudcloth-shirt',
    name: 'Royal Mudcloth Long-Sleeve Shirt', category: 'mens-shirts', gender: 'M',
    price: 380, stock: 12, featured: false,
    description: 'Royal-blue shirting in a mudcloth-inspired print, long-sleeve and smart.',
  },
  {
    key: '2.54.41', kind: 'product', slug: 'navy-batik-shirt',
    name: 'Navy Batik Short-Sleeve Shirt', category: 'mens-shirts', gender: 'M',
    price: 300, stock: 16, featured: false,
    description: 'A navy-and-white batik short-sleeve, easy to wear from desk to dinner.',
  },
  {
    key: '2.54.52', kind: 'product', slug: 'savanna-abstract-shirt',
    name: 'Savanna Abstract Shirt', category: 'mens-shirts', gender: 'M',
    price: 300, stock: 14, featured: false,
    description: 'Green and brown abstract print with a crisp white collar, cut short-sleeve.',
  },
  {
    key: '2.54.53', kind: 'product', slug: 'ankara-stripe-shirt',
    name: 'Ankara Stripe Short-Sleeve Shirt', category: 'mens-shirts', gender: 'M',
    price: 290, stock: 15, featured: false,
    description: 'A red-and-blue ankara stripe short-sleeve with plenty of everyday character.',
  },
  {
    key: '2.57.14', kind: 'product', slug: 'palm-resort-shirt',
    name: 'Palm Resort Long-Sleeve Shirt', category: 'mens-shirts', gender: 'M',
    price: 300, stock: 14, featured: false,
    description: 'A palm-print long-sleeve with holiday ease and a relaxed drape.',
  },

  // ----------------------------------------------------------- men · polos
  {
    key: '2.54.43', kind: 'product', slug: 'navy-stripe-polo',
    name: 'Navy Stripe Piqué Polo', category: 'mens-polos', gender: 'M',
    price: 220, stock: 20, featured: false,
    description: 'A navy piqué polo with a clean white stripe, an everyday smart-casual staple.',
  },
  {
    key: '2.57.15', kind: 'product', slug: 'charcoal-waffle-polo',
    name: 'Charcoal Waffle Polo', category: 'mens-polos', gender: 'M',
    price: 230, stock: 20, featured: false,
    description: 'A textured waffle-knit polo in charcoal with a fine white stripe.',
  },

  // --------------------------------------------------------- men · kaftans
  {
    key: '2.53.51', kind: 'product', slug: 'emerald-laceup-kaftan',
    name: 'Emerald Lace-Up Kaftan', category: 'mens-kaftans', gender: 'M',
    price: 520, stock: 8, featured: false,
    description: 'A flowing emerald kaftan with a laced placket, made for relaxed evenings.',
  },
  {
    key: '2.53.58', kind: 'product', slug: 'gold-folded-kaftan',
    name: 'Gold Folded-Collar Kaftan', category: 'mens-kaftans', gender: 'M',
    price: 500, stock: 8, featured: false,
    description: 'A gold kaftan with a folded collar and a clean, uncluttered line.',
  },
  {
    key: '2.54.01', kind: 'product', slug: 'mustard-mandarin-kaftan',
    name: 'Mustard Mandarin Kaftan', category: 'mens-kaftans', gender: 'M',
    price: 500, stock: 8, featured: false,
    description: 'A mustard kaftan with a mandarin collar, understated and easy to wear.',
  },
  {
    key: '2.54.40', kind: 'product', slug: 'teal-contrast-kaftan',
    name: 'Teal Contrast-Pocket Kaftan', category: 'mens-kaftans', gender: 'M',
    price: 520, stock: 8, featured: false,
    description: 'A teal kaftan finished with a navy contrast pocket for a subtle lift.',
  },

  // -------------------------------------------- men · native (ready-to-wear)
  {
    key: '2.54.35', kind: 'product', slug: 'brown-placket-two-piece',
    name: 'Brown Contrast-Placket Two-Piece', category: 'mens-native', gender: 'M',
    price: 650, stock: 6, featured: false,
    description: 'A short-sleeve brown native set with a cream contrast placket, ready to wear.',
  },
  {
    key: '2.54.46', kind: 'product', slug: 'cream-marble-native',
    name: 'Cream Marble-Collar Native', category: 'mens-native', gender: 'M',
    price: 680, stock: 6, featured: false,
    description: 'A cream native two-piece with an orange marbled collar and matching trousers.',
  },
  {
    key: '2.54.47', kind: 'product', slug: 'olive-kente-native',
    name: 'Olive Kente-Pocket Native', category: 'mens-native', gender: 'M',
    price: 680, stock: 6, featured: false,
    description: 'An olive native set detailed with a woven kente pocket.',
  },
  {
    key: '2.54.48', kind: 'product', slug: 'tan-ankara-native',
    name: 'Tan Ankara-Panel Native', category: 'mens-native', gender: 'M',
    price: 680, stock: 6, featured: false,
    description: 'A tan native two-piece with a blue ankara panel running through it.',
  },

  // ------------------------------------------ men · native (made-to-measure)
  {
    key: '2.54.49', kind: 'style', slug: 'emerald-gold-two-piece',
    name: 'Emerald Gold-Distress Two-Piece', category: 'mens-native', gender: 'M',
    base_price: 950, makingDays: 10, featured: true,
    description: 'An emerald native two-piece with a gold distressed finish, tailored to your measurements.',
  },
  {
    key: '2.54.50', kind: 'style', slug: 'onyx-zigzag-two-piece',
    name: 'Onyx Zigzag Two-Piece', category: 'mens-native', gender: 'M',
    base_price: 950, makingDays: 10, featured: false,
    description: 'A black native set with a striking red zigzag, made to order for a precise fit.',
  },
  {
    key: '2.54.51', kind: 'style', slug: 'ivory-medallion-two-piece',
    name: 'Ivory Gold-Medallion Two-Piece', category: 'mens-native', gender: 'M',
    base_price: 1050, makingDays: 12, featured: true,
    description: 'An ivory native two-piece with hand-worked gold medallion embroidery.',
  },
  {
    key: '2.57.12', kind: 'style', slug: 'savanna-abstract-two-piece',
    name: 'Savanna Abstract Two-Piece', category: 'mens-native', gender: 'M',
    base_price: 900, makingDays: 10, featured: false,
    description: 'A green-and-orange abstract native two-piece, cut to measure.',
  },
  {
    key: '2.57.13', kind: 'style', slug: 'mosaic-print-two-piece',
    name: 'Mosaic Print Two-Piece', category: 'mens-native', gender: 'M',
    base_price: 900, makingDays: 10, featured: false,
    description: 'A puzzle-print native two-piece with a graphic, mosaic-like pattern.',
  },

  // --------------------------------------------------------- men · agbada
  {
    key: '2.57.10', kind: 'style', slug: 'regal-gold-agbada',
    name: 'Regal Gold-Embroidered Agbada', category: 'mens-agbada', gender: 'M',
    base_price: 2200, makingDays: 21, featured: true,
    description: 'A grand white agbada with dense gold embroidery, tailored for the groom and the grandest days.',
  },

  // -------------------------------------------------------- women · gowns
  {
    key: '2.53.46', kind: 'style', slug: 'onyx-cape-gown',
    name: 'Onyx Beaded Cape Gown', category: 'womens-gowns', gender: 'F',
    base_price: 1800, makingDays: 18, featured: true,
    description: 'A black beaded gown with a dramatic cape, made to measure for red-carpet nights.',
  },
  {
    key: '2.53.55', kind: 'style', slug: 'nude-mermaid-gown',
    name: 'Nude Beaded Mermaid Gown', category: 'womens-gowns', gender: 'F',
    base_price: 2000, makingDays: 21, featured: true,
    description: 'A brown-nude mermaid gown finished with hand-set beading that catches the light.',
  },
  {
    key: '2.57.11', kind: 'style', slug: 'graduation-lace-dress',
    name: 'Graduation Lace Dress', category: 'womens-gowns', gender: 'F',
    base_price: 900, makingDays: 12, featured: false,
    description: 'A refined black lace dress cut for graduation and ceremony, tailored to you.',
  },

  // -------------------------------------------------------- women · kente
  {
    key: '2.54.37', kind: 'style', slug: 'kente-corset-gown',
    name: 'Kente Corset Mermaid Gown', category: 'womens-kente', gender: 'F',
    base_price: 2400, makingDays: 21, featured: true,
    description: 'A strapless kente corset gown in a mermaid silhouette, handwoven and made to measure.',
  },
  {
    key: '2.57.08', kind: 'style', slug: 'kente-peplum-gown',
    name: 'Kente Peplum Mermaid Gown', category: 'womens-kente', gender: 'F',
    base_price: 2600, makingDays: 24, featured: true,
    description: 'A beaded kente mermaid gown with a red peplum flourish for a bold, regal finish.',
  },

  // ------------------------------------------------------- women · ankara
  {
    key: '2.53.57', kind: 'style', slug: 'scarlet-ankara-corset',
    name: 'Scarlet Ankara Corset Dress', category: 'womens-ankara', gender: 'F',
    base_price: 1200, makingDays: 14, featured: false,
    description: 'A red-and-black ankara corset dress with a matching bolero, tailored to your shape.',
  },

  // ---------------------------------------------------- women · corporate
  {
    key: '2.53.43', kind: 'style', slug: 'burgundy-blazer-dress',
    name: 'Burgundy Blazer Dress', category: 'womens-corporate', gender: 'F',
    base_price: 850, makingDays: 10, featured: true,
    description: 'A sharp burgundy blazer dress that moves from the boardroom to the evening.',
  },
  {
    key: '2.53.45', kind: 'style', slug: 'navy-blazer-dress',
    name: 'Navy Blazer Dress', category: 'womens-corporate', gender: 'F',
    base_price: 850, makingDays: 10, featured: false,
    description: 'The blazer dress in navy — structured, confident and made to measure.',
  },
  {
    key: '2.54.38', kind: 'style', slug: 'pinstripe-grad-suit',
    name: 'Pinstripe Graduation Suit', category: 'womens-corporate', gender: 'F',
    base_price: 1100, makingDays: 14, featured: false,
    description: 'A navy pinstripe suit finished with a kente stole, tailored for graduation day.',
  },
  {
    key: '2.54.42', kind: 'style', slug: 'navy-db-suit',
    name: 'Navy Double-Breasted Suit', category: 'womens-corporate', gender: 'F',
    base_price: 1200, makingDays: 14, featured: true,
    description: 'A double-breasted navy suit cut for a clean, powerful line, made to measure.',
  },

  // -------------------------------------------------------- women · bridal
  {
    key: '2.57.09', kind: 'style', slug: 'golden-bridal-gown',
    name: 'Golden Bridal Mermaid Gown', category: 'womens-bridal', gender: 'F',
    base_price: 3500, makingDays: 30, featured: true,
    description: 'A gold beaded bridal mermaid gown with a matching veil, hand-finished for your day.',
  },

  // --------------------------------------------------------- couple sets
  {
    key: '2.54.44', kind: 'style', slug: 'his-hers-signature-set',
    name: 'His & Hers Signature Set', category: 'couple-sets', gender: 'U',
    base_price: 1500, makingDays: 16, featured: true,
    description: 'A coordinated his-and-hers look, cut from matching fabric and made to measure for both.',
  },
  {
    key: '2.54.45', kind: 'style', slug: 'ankara-his-hers-set',
    name: 'Ankara His & Hers Set', category: 'couple-sets', gender: 'U',
    base_price: 1400, makingDays: 16, featured: false,
    description: 'A green-and-maroon ankara flare dress with a lace collar, paired with a matching men\'s shirt.',
  },

  // ------------------------------------------------------------- kids
  {
    key: '2.54.54', kind: 'product', slug: 'magenta-ankara-girls-dress',
    name: 'Magenta Ankara Girls\' Dress', category: 'kids-girls', gender: 'K',
    price: 260, stock: 10, featured: false,
    description: 'A bright magenta ankara dress for girls, made to twirl.',
  },
  {
    key: '2.57.16', kind: 'product', slug: 'red-abstract-boys-set',
    name: 'Red Abstract Boys\' Two-Piece', category: 'kids-boys', gender: 'K',
    price: 300, stock: 10, featured: false,
    description: 'A red abstract-print two-piece for boys, smart enough for any family occasion.',
  },
];
