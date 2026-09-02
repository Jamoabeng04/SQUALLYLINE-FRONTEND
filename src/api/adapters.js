// api/adapters.js
// The backend speaks snake_case DRF; the screens were written against a
// camelCase card shape. Everything crosses that boundary here so no screen has
// to know both vocabularies.

import { API_BASE_URL } from './config';
import { itemImages, categoryImages } from './catalogImages';

// Ghana cedi everywhere — the client sells in GHS only.
export const formatPrice = (value) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatMoney = (value) =>
  `GHS ${Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

// Media paths come back relative ("/media/products/x.jpg"); absolutise them
// against whichever host the API is on so LAN devices load images too.
export const mediaUrl = (path) => {
  if (!path) return null;
  // List endpoints return `primary_image` as a serialized image row, not a bare
  // path, so accept either shape rather than making every caller unwrap it.
  const raw = typeof path === 'string' ? path : path.image || path.url || '';
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API_BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

// Deterministic stand-in art for records with no uploaded image. Same slug
// always yields the same tile, so the grid doesn't shuffle between renders.
export const placeholderFor = (seed = '', label = '') => {
  let hash = 0;
  for (let i = 0; i < String(seed).length; i += 1) hash = (hash * 31 + String(seed).charCodeAt(i)) % 997;
  const bg = ['0A0A0A', '1A1200', '141414', '241A05'][hash % 4];
  const fg = ['C9A84C', 'E8D5A3', 'B8963F'][hash % 3];
  const text = encodeURIComponent((label || 'Squally Line').slice(0, 22));
  return `https://placehold.co/600x800/${bg}/${fg}?text=${text}`;
};

// Frontend-hosted catalogue images (public/catalog/, keyed by slug) stand in
// for the backend /media/ paths, which Railway wipes on every API redeploy.
// Prefer them wherever we have them; fall back to the (often dead) media path,
// then the generated placeholder. Regenerate the maps with `npm run catalog:images`.
const localItemImages = (slug) => (slug && itemImages[slug]) || null;
const localItemCover = (slug) => localItemImages(slug)?.[0] || null;

export const GENDER_LABEL = { M: 'Men', F: 'Women', K: 'Kids', U: 'Unisex' };

const badgeFor = (row) => {
  if (row.is_on_sale) return { type: 'sale', label: 'Sale' };
  if (row.is_featured) return { type: 'limited', label: 'Featured' };
  // Anything added in the last fortnight still reads as new.
  if (row.created_at && Date.now() - new Date(row.created_at).getTime() < 14 * 864e5) {
    return { type: 'new', label: 'New' };
  }
  return null;
};

// Ready-to-wear product -> ProductCard shape.
export const adaptProduct = (row) => ({
  id: row.id,
  slug: row.slug,
  kind: 'product',
  name: row.name,
  description: row.description || '',
  category: row.category_name || '',
  categorySlug: row.category_slug || '',
  price: Number(row.final_price ?? row.price ?? 0),
  originalPrice: row.discount_price ? Number(row.price) : null,
  image: localItemCover(row.slug) || mediaUrl(row.primary_image) || placeholderFor(row.slug || row.id, row.name),
  gender: row.gender,
  size: row.size,
  stock: row.stock_quantity ?? 0,
  inStock: row.is_in_stock !== false && (row.stock_quantity ?? 0) > 0,
  rating: row.average_rating != null ? Number(row.average_rating).toFixed(1) : null,
  reviews: row.review_count ?? 0,
  views: row.views ?? 0,
  likes: row.likes_count ?? 0,
  isLiked: Boolean(row.is_liked),
  isSaved: Boolean(row.is_saved),
  isFeatured: Boolean(row.is_featured),
  badge: badgeFor(row),
  createdAt: row.created_at ? new Date(row.created_at) : null,
  raw: row,
});

export const adaptReview = (row) => ({
  id: row.id,
  user: row.user_name || 'Customer',
  rating: Number(row.rating ?? 0),
  text: row.comment || '',
  images: (row.images || []).map((i) => mediaUrl(i.image)).filter(Boolean),
  createdAt: row.created_at,
  raw: row,
});

// Detail rows carry everything the card shape has plus the gallery, the
// garment's own measurements and the first page of reviews.
export const adaptProductDetail = (row) => ({
  ...adaptProduct(row),
  images: localItemImages(row.slug) || (row.images || []).map((i) => mediaUrl(i.image)).filter(Boolean),
  tags: (row.tags || []).map((t) => t.name),
  reviewList: (row.reviews || []).map(adaptReview),
  measurements: {
    bust: row.bust_measurement,
    waist: row.waist_measurement,
    hip: row.hip_measurement,
    shoulder: row.shoulder_measurement,
  },
  updatedAt: row.updated_at,
});

// Tailored style -> same card shape, so one grid renders both.
export const adaptStyle = (row) => ({
  id: row.id,
  slug: row.slug,
  kind: 'style',
  name: row.name,
  description: row.description || '',
  category: row.category_name || '',
  categorySlug: row.category_slug || '',
  price: Number(row.base_price ?? 0),
  originalPrice: null,
  image: localItemCover(row.slug) || mediaUrl(row.primary_image) || placeholderFor(row.slug || row.id, row.name),
  gender: row.gender,
  makingDays: row.estimated_making_time ?? null,
  isCustomizable: row.is_customizable !== false,
  videoLink: row.video_link || '',
  inStock: true,
  rating: row.average_rating != null ? Number(row.average_rating).toFixed(1) : null,
  reviews: row.review_count ?? 0,
  views: row.views ?? 0,
  likes: row.likes_count ?? 0,
  isLiked: Boolean(row.is_liked),
  isSaved: Boolean(row.is_saved),
  isFeatured: Boolean(row.is_featured),
  badge: badgeFor(row),
  createdAt: row.created_at ? new Date(row.created_at) : null,
  raw: row,
});

export const adaptStyleDetail = (row) => ({
  ...adaptStyle(row),
  images: localItemImages(row.slug) || (row.images || []).map((i) => mediaUrl(i.image)).filter(Boolean),
  tags: (row.tags || []).map((t) => t.name),
  reviewList: (row.reviews || []).map(adaptReview),
  updatedAt: row.updated_at,
});

export const adaptCategory = (row) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description || '',
  image: categoryImages[row.slug] || mediaUrl(row.image) || placeholderFor(row.slug || row.id, row.name),
  gender: row.gender,
  productCount: row.product_count ?? 0,
  styleCount: row.style_count ?? 0,
  subcategoryCount: row.subcategory_count ?? 0,
  subcategories: (row.subcategories || []).map(adaptCategory),
  raw: row,
});

// A cart line carries exactly one of product/style/appointment/custom, and the
// serializer nests the full row under `*_details`. Snapshots are the fallback:
// they are frozen copies taken when the item was added, so a line survives its
// product being deactivated.
export const adaptCartItem = (row) => {
  const kind = row.item_type || 'product';
  const detail = row.product_details || row.style_details || null;
  const snapshot = row.product_snapshot || row.style_snapshot || row.appointment_snapshot || null;
  const appointment = row.appointment_details || null;
  const slug = detail?.slug || snapshot?.slug || '';

  return {
    id: row.id,
    kind,
    name: row.item_name || detail?.name || snapshot?.name || 'Item',
    slug,
    productId: row.product || detail?.id || null,
    styleId: row.style || null,
    appointmentId: row.appointment || null,
    image:
      localItemCover(slug) ||
      mediaUrl(detail?.primary_image) ||
      mediaUrl(snapshot?.primary_image) ||
      placeholderFor(row.id, row.item_name || 'Item'),
    category: detail?.category_name || snapshot?.category_name || '',
    gender: detail?.gender || snapshot?.gender || '',
    size: detail?.size || snapshot?.size || '',
    // Only ready-to-wear has stock; tailored work is made to order.
    inStock: kind === 'product' ? detail?.is_in_stock !== false : true,
    maxQuantity: kind === 'product' ? detail?.stock_quantity ?? 99 : 99,
    makingDays: detail?.estimated_making_time ?? snapshot?.estimated_making_time ?? null,
    quantity: row.quantity ?? 1,
    price: Number(row.price ?? 0),
    total: Number(row.total_price ?? (row.price || 0) * (row.quantity || 1)),
    personId: row.person || null,
    personName: row.person_details?.name || row.person_snapshot?.name || '',
    measurementId: row.measurement || null,
    measurementData: row.measurement_details?.data || row.measurement_snapshot?.data || null,
    // Appointment lines are consultation fees already booked on the calendar.
    appointmentDate: appointment?.slot_date || snapshot?.slot_date || '',
    appointmentTime: appointment?.slot_time || snapshot?.slot_time || '',
    appointmentStatus: appointment?.status || snapshot?.status || '',
    tierName: appointment?.tier_name || snapshot?.tier || '',
    customName: row.custom_name || '',
    customFabric: row.custom_fabric || '',
    notes: row.custom_notes || '',
    addedAt: row.created_at,
    raw: row,
  };
};

export const adaptOrder = (row) => ({
  id: row.id,
  number: row.order_number || String(row.id || '').slice(0, 8),
  type: row.order_type || 'product',
  typeLabel: row.order_type_display || '',
  status: row.status,
  statusLabel: row.status_display || row.status,
  paymentStatus: row.payment_status,
  paymentStatusLabel: row.payment_status_display || row.payment_status,
  isPaid: row.payment_status === 'paid',
  // Order.can_cancel on the model: pending/confirmed and not yet paid.
  canCancel: ['pending', 'confirmed'].includes(row.status) && row.payment_status !== 'paid',
  // Anything unpaid and still live can be sent back through Paystack.
  canPay:
    ['pending', 'failed'].includes(row.payment_status) &&
    !['cancelled', 'refunded'].includes(row.status),
  subtotal: Number(row.subtotal ?? 0),
  shippingFee: Number(row.shipping_fee ?? 0),
  tax: Number(row.tax ?? 0),
  discount: Number(row.discount ?? 0),
  total: Number(row.total ?? 0),
  itemCount: row.item_count ?? (row.items || []).length,
  items: (row.items || []).map((i) => ({
    id: i.id,
    name: i.item_name,
    kind: i.item_type,
    quantity: i.quantity ?? 1,
    price: Number(i.price ?? 0),
    total: Number(i.total_price ?? 0),
    // The snapshot is the only image source once an order is placed.
    image: localItemCover(i.snapshot?.slug) || mediaUrl(i.snapshot?.primary_image) || placeholderFor(i.id, i.item_name || 'Item'),
    slug: i.snapshot?.slug || '',
    // Everything below is frozen in the snapshot at order time — the live
    // product may have changed price, stock or category since.
    snapshot: i.snapshot || {},
    description: i.snapshot?.description || '',
    category: i.snapshot?.category_name || '',
    gender: i.snapshot?.gender || '',
    size: i.snapshot?.size || '',
    makingDays: i.snapshot?.estimated_making_time ?? null,
    appointmentDate: i.snapshot?.slot_date || '',
    appointmentType: i.snapshot?.appointment_type || '',
    tierName: i.snapshot?.tier || '',
    fabric: i.snapshot?.fabric || '',
    personName: i.person_name || i.snapshot?.person?.name || '',
    productionStage: i.production_stage || null,
    isReady: Boolean(i.is_ready),
    isCompleted: Boolean(i.is_completed),
    notes: i.production_notes || '',
    measurements: i.measurement_data || null,
    raw: i,
  })),
  shippingAddress: row.shipping_address || '',
  shippingCity: row.shipping_city || '',
  shippingState: row.shipping_state || '',
  shippingCountry: row.shipping_country || '',
  shippingPhone: row.shipping_phone || '',
  trackingNumber: row.tracking_number || '',
  trackingUrl: row.tracking_url || '',
  courier: row.courier || '',
  notes: row.customer_notes || '',
  adminNotes: row.admin_notes || '',
  transactions: row.transactions || [],
  history: row.history || [],
  orderedAt: row.order_date || row.created_at,
  paidAt: row.payment_date || null,
  completedAt: row.completion_date || null,
  estimatedDelivery: row.estimated_delivery_date || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  raw: row,
});

// Appointment.STATUS_CHOICES / APPOINTMENT_TYPE_CHOICES have no *_display
// counterpart on the serializer, so the labels live here.
export const APPOINTMENT_STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

export const APPOINTMENT_TYPE_LABEL = {
  consultation: 'Consultation',
  style_order: 'Style order',
  custom_order: 'Custom order',
  fitting: 'Fitting',
  other: 'Other',
};

export const adaptAppointment = (row) => ({
  id: row.id,
  status: row.status,
  statusLabel: APPOINTMENT_STATUS_LABEL[row.status] || row.status || '',
  // The serializer exposes a plain flag, not a payment status ladder.
  isPaid: Boolean(row.is_paid),
  tierName: row.tier_name || '',
  tierFee: Number(row.tier_fee ?? 0),
  // Set by the studio when it reviews the booking; null until then.
  finalPrice: row.final_price != null ? Number(row.final_price) : null,
  type: row.appointment_type || '',
  typeLabel: APPOINTMENT_TYPE_LABEL[row.appointment_type] || row.appointment_type || '',
  slotId: row.slot || null,
  date: row.slot_date || '',
  // Already a formatted range ("10:00 AM - 11:00 AM") — never split it.
  time: row.slot_time || '',
  styleId: row.style || null,
  styleName: row.style_name || '',
  styleSlug: row.style_slug || '',
  personId: row.person || null,
  personName: row.person_name || '',
  measurementId: row.measurement || null,
  fabricProvider: row.fabric_provider || '',
  fabricType: row.fabric_type || '',
  quantity: row.quantity ?? 1,
  contactPhone: row.contact_phone || '',
  contactEmail: row.contact_email || '',
  notes: row.additional_notes || '',
  adminNotes: row.admin_notes || '',
  estimatedCompletion: row.estimated_completion_date || '',
  // cancel_appointment rejects anything past confirmed.
  canCancel: ['pending', 'confirmed'].includes(row.status),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  raw: row,
});

// The detail serializer nests the whole style, person and measurement rows.
export const adaptAppointmentDetail = (row) => ({
  ...adaptAppointment(row),
  style: row.style_detail ? adaptStyle(row.style_detail) : null,
  person: row.person_detail || null,
  measurement: row.measurement_detail || null,
});

// DRF paginators here return {count, total_pages, current_page, per_page, results}.
export const adaptPage = (payload, adapt = (x) => x) => ({
  count: payload?.count ?? 0,
  totalPages: payload?.total_pages ?? 1,
  page: payload?.current_page ?? 1,
  perPage: payload?.per_page ?? 0,
  results: (payload?.results || []).map(adapt),
});

// Turns any thrown API error into one line safe to put in front of a customer.
export const errorText = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.message && !/^\[object/.test(error.message)) return error.message;
  return fallback;
};
