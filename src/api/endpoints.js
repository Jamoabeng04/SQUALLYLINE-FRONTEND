// api/endpoints.js
// Every Squally Line API call in one place, grouped by domain.
//
// Response shapes vary by endpoint (the backend returns either a wrapped
// {status, <key>} object or a paginated {count, results} envelope), so each
// function unwraps to the thing callers actually want.

import api from './client';

const unwrap = (data, key, fallback = null) => {
  if (!data) return fallback;
  if (key in data) return data[key];
  return fallback;
};

// ------------------------------------------------------------------ accounts

export const auth = {
  register: (payload) => api.post('/accounts/auth/register/', payload, { auth: false }),
  login: (email, password) => api.post('/accounts/auth/login/', { email, password }, { auth: false }),
  logout: (refresh) => api.post('/accounts/auth/logout/', { refresh }),
  me: () => api.get('/accounts/auth/me/'),
  updateProfile: (payload) => api.raw('/accounts/profile/', { method: 'PATCH', body: payload }),
  changePassword: (payload) => api.post('/accounts/profile/change-password/', payload),
  mySummary: () => api.get('/accounts/dashboard/my-summary/'),
};

export const people = {
  list: () => api.get('/accounts/people/').then((d) => unwrap(d, 'people', [])),
  create: (payload) => api.post('/accounts/people/', payload).then((d) => unwrap(d, 'person', d)),
  detail: (id) => api.get(`/accounts/people/${id}/`).then((d) => unwrap(d, 'person', d)),
  update: (id, payload) => api.patch(`/accounts/people/${id}/`, payload).then((d) => unwrap(d, 'person', d)),
  remove: (id) => api.delete(`/accounts/people/${id}/`),
  measurements: (id) => api.get(`/accounts/people/${id}/measurements/`).then((d) => unwrap(d, 'measurements', [])),
};

export const measurements = {
  list: (params) => api.get('/accounts/measurements/', { params }).then((d) => unwrap(d, 'measurements', [])),
  create: (payload) => api.post('/accounts/measurements/', payload).then((d) => unwrap(d, 'measurement', d)),
  detail: (id) => api.get(`/accounts/measurements/${id}/`).then((d) => unwrap(d, 'measurement', d)),
  update: (id, payload) => api.patch(`/accounts/measurements/${id}/`, payload).then((d) => unwrap(d, 'measurement', d)),
  remove: (id) => api.delete(`/accounts/measurements/${id}/`),
  history: (id) => api.get(`/accounts/measurements/${id}/history/`).then((d) => unwrap(d, 'history', [])),
  setActive: (id) => api.post(`/accounts/measurements/${id}/set-active/`),
};

// ---------------------------------------------------------------------- shop

export const shop = {
  // Pass {tree: 'true'} to get subcategories nested inside each parent.
  categories: (params) => api.get('/shop/categories/', { params }).then((d) => unwrap(d, 'categories', [])),
  // The detail endpoint returns the category and its children as siblings;
  // fold the children in so callers get one object.
  category: (slug) =>
    api.get(`/shop/categories/${slug}/`).then((d) => ({
      ...(unwrap(d, 'category', d) || {}),
      subcategories: unwrap(d, 'subcategories', []),
    })),
  categoryTree: () => api.get('/shop/categories/', { params: { tree: 'true' } }).then((d) => unwrap(d, 'categories', [])),

  // Paginated: {count, total_pages, current_page, per_page, results}
  products: (params) => api.get('/shop/products/', { params }),
  product: (slug) =>
    api.get(`/shop/products/${slug}/`).then((d) => ({
      ...(unwrap(d, 'product', d) || {}),
      related_products: unwrap(d, 'related_products', []),
    })),
  productReviews: (slug) => api.get(`/shop/products/${slug}/reviews/`),
  reviewProduct: (slug, payload) => api.post(`/shop/products/${slug}/review/`, payload),
  likeProduct: (slug) => api.post(`/shop/products/${slug}/like/`),
  saveProduct: (slug) => api.post(`/shop/products/${slug}/save/`),

  styles: (params) => api.get('/shop/styles/', { params }),
  style: (slug) =>
    api.get(`/shop/styles/${slug}/`).then((d) => ({
      ...(unwrap(d, 'style', d) || {}),
      related_styles: unwrap(d, 'related_styles', []),
    })),
  styleReviews: (slug) => api.get(`/shop/styles/${slug}/reviews/`),
  reviewStyle: (slug, payload) => api.post(`/shop/styles/${slug}/review/`, payload),
  likeStyle: (slug) => api.post(`/shop/styles/${slug}/like/`),
  saveStyle: (slug) => api.post(`/shop/styles/${slug}/save/`),

  // Newest approved reviews across both catalogues, for the homepage.
  latestReviews: (limit = 6) =>
    api.get('/shop/reviews/latest/', { params: { limit } }).then((d) => unwrap(d, 'reviews', [])),

  savedProducts: () => api.get('/shop/my/saved-products/'),
  savedStyles: () => api.get('/shop/my/saved-styles/'),
  likedProducts: () => api.get('/shop/my/liked-products/'),
  likedStyles: () => api.get('/shop/my/liked-styles/'),
};

export const shopAdmin = {
  categories: () => api.get('/shop/admin/categories/').then((d) => unwrap(d, 'categories', [])),
  createCategory: (payload) => api.post('/shop/admin/categories/', payload),
  updateCategory: (slug, payload) => api.patch(`/shop/admin/categories/${slug}/`, payload),
  category: (slug) => api.get(`/shop/admin/categories/${slug}/`).then((d) => unwrap(d, 'category', d)),
  deleteCategory: (slug) => api.delete(`/shop/admin/categories/${slug}/`),
  createProduct: (payload) => api.post('/shop/admin/products/create/', payload),
  updateProduct: (slug, payload) => api.raw(`/shop/admin/products/${slug}/update/`, { method: 'PATCH', body: payload }),
  product: (slug) => api.get(`/shop/admin/products/${slug}/update/`).then((d) => unwrap(d, 'product', d)),
  uploadProductImages: (slug, payload) => api.post(`/shop/admin/products/${slug}/images/`, payload),
  updateProductImage: (slug, id, payload) => api.patch(`/shop/admin/products/${slug}/images/${id}/`, payload),
  deleteProductImage: (slug, id) => api.delete(`/shop/admin/products/${slug}/images/${id}/`),
  deleteProduct: (slug) => api.delete(`/shop/admin/products/${slug}/delete/`),
  createStyle: (payload) => api.post('/shop/admin/styles/create/', payload),
  updateStyle: (slug, payload) => api.raw(`/shop/admin/styles/${slug}/update/`, { method: 'PATCH', body: payload }),
  style: (slug) => api.get(`/shop/admin/styles/${slug}/update/`).then((d) => unwrap(d, 'style', d)),
  uploadStyleImages: (slug, payload) => api.post(`/shop/admin/styles/${slug}/images/`, payload),
  updateStyleImage: (slug, id, payload) => api.patch(`/shop/admin/styles/${slug}/images/${id}/`, payload),
  deleteStyleImage: (slug, id) => api.delete(`/shop/admin/styles/${slug}/images/${id}/`),
  deleteStyle: (slug) => api.delete(`/shop/admin/styles/${slug}/delete/`),
};

// -------------------------------------------------------------- cart /orders

export const cart = {
  get: () => api.get('/orders/cart/').then((d) => unwrap(d, 'cart', d)),
  add: (payload) => api.post('/orders/cart/add/', payload),
  updateItem: (itemId, payload) => api.raw(`/orders/cart/item/${itemId}/update/`, { method: 'PATCH', body: payload }),
  removeItem: (itemId) => api.delete(`/orders/cart/item/${itemId}/remove/`),
  clear: () => api.delete('/orders/cart/clear/'),
};

export const orders = {
  create: (payload) => api.post('/orders/orders/create/', payload).then((d) => unwrap(d, 'order', d)),
  // Not paginated — the view returns {status, count, orders}.
  mine: (params) => api.get('/orders/orders/my/', { params }).then((d) => unwrap(d, 'orders', [])),
  detail: (id) => api.get(`/orders/orders/${id}/`).then((d) => unwrap(d, 'order', d)),
  cancel: (id, reason) => api.post(`/orders/orders/${id}/cancel/`, { reason }),
  history: (id) => api.get(`/orders/orders/${id}/history/`).then((d) => unwrap(d, 'history', [])),
};

export const payments = {
  // Resolves to {reference, transaction_id, authorization_url, access_code}.
  initialize: (payload) => api.post('/orders/payments/initialize/', payload).then((d) => unwrap(d, 'data', d)),
  verify: (reference) => api.post('/orders/payments/verify/', { reference }),
  status: (reference) => api.get(`/orders/payments/status/${reference}/`).then((d) => unwrap(d, 'transaction', d)),
};

export const ordersAdmin = {
  list: (params) => api.get('/orders/admin/orders/', { params }),
  updateStatus: (orderId, payload) => api.post(`/orders/admin/orders/${orderId}/status/`, payload),
  updateProduction: (itemId, payload) => api.post(`/orders/admin/orders/items/${itemId}/production/`, payload),
  productionHistory: (itemId) => api.get(`/orders/admin/orders/items/${itemId}/production-history/`),
  dashboardStats: () => api.get('/orders/admin/dashboard/stats/'),
  productionQueue: () => api.get('/orders/admin/production-queue/').then((d) => unwrap(d, 'queue', {})),
};

// ----------------------------------------------------------------- analytics

export const analytics = {
  overview: (params) => api.get('/analytics/dashboard/overview/', { params }),
  revenueChart: (params) => api.get('/analytics/dashboard/revenue-chart/', { params }),
  orderAnalytics: (params) => api.get('/analytics/dashboard/order-analytics/', { params }),
  productionAnalytics: (params) => api.get('/analytics/dashboard/production-analytics/', { params }),
  customerAnalytics: (params) => api.get('/analytics/dashboard/customer-analytics/', { params }),
  exportData: (params) => api.get('/analytics/dashboard/export/', { params }),
};

// --------------------------------------------------------------- appointments

export const appointments = {
  tiers: () => api.get('/appointments/tiers/').then((d) => unwrap(d, 'tiers', [])),
  slots: (params) => api.get('/appointments/slots/', { params }).then((d) => unwrap(d, 'slots', [])),
  availableSlots: (date, tier) =>
    api.get('/appointments/slots/available/', { params: { date, tier } }).then((d) => unwrap(d, 'slots', [])),

  create: (payload) => api.post('/appointments/appointments/create/', payload).then((d) => unwrap(d, 'appointment', d)),
  mine: (params) => api.get('/appointments/appointments/my/', { params }),
  detail: (id) => api.get(`/appointments/appointments/${id}/`).then((d) => unwrap(d, 'appointment', d)),
  update: (id, payload) => api.raw(`/appointments/appointments/${id}/update/`, { method: 'PATCH', body: payload }),
  cancel: (id) => api.post(`/appointments/appointments/${id}/cancel/`),
  history: (id) => api.get(`/appointments/appointments/${id}/history/`).then((d) => unwrap(d, 'history', [])),
  proposals: (id) => api.get(`/appointments/appointments/${id}/proposals/`).then((d) => unwrap(d, 'proposals', [])),
  acceptProposal: (id) => api.post(`/appointments/proposals/${id}/accept/`, {}),
  rejectProposal: (id, reason) => api.post(`/appointments/proposals/${id}/reject/`, { reason }),
  requestRevision: (id, reason) => api.post(`/appointments/proposals/${id}/request-revision/`, { reason }),
};

export const appointmentsAdmin = {
  list: (params) => api.get('/appointments/admin/appointments/', { params }),
  review: (id, payload) => api.post(`/appointments/admin/appointments/${id}/review/`, payload),
  updateStatus: (id, payload) => api.post(`/appointments/admin/appointments/${id}/status/`, payload),
  markPaid: (id) => api.post(`/appointments/admin/appointments/${id}/mark-paid/`),
  proposals: (id) => api.get(`/appointments/admin/appointments/${id}/proposals/`).then((d) => unwrap(d, 'proposals', [])),
  createProposal: (id, payload) => api.post(`/appointments/admin/appointments/${id}/proposals/`, payload).then((d) => unwrap(d, 'proposal', d)),
  proposal: (id) => api.get(`/appointments/admin/proposals/${id}/`),
  updateProposal: (id, payload) => api.patch(`/appointments/admin/proposals/${id}/`, payload),
  sendProposal: (id) => api.post(`/appointments/admin/proposals/${id}/send/`, {}),
  reviseProposal: (id, payload) => api.post(`/appointments/admin/proposals/${id}/revise/`, payload),
  uploadProposalImages: (id, payload) => api.post(`/appointments/admin/proposals/${id}/images/`, payload),
  updateProposalImage: (proposalId, imageId, payload) => api.patch(`/appointments/admin/proposals/${proposalId}/images/${imageId}/`, payload),
  deleteProposalImage: (proposalId, imageId) => api.delete(`/appointments/admin/proposals/${proposalId}/images/${imageId}/`),

  createTier: (payload) => api.post('/appointments/admin/tiers/create/', payload),
  updateTier: (id, payload) => api.patch(`/appointments/admin/tiers/${id}/`, payload),
  deleteTier: (id) => api.delete(`/appointments/admin/tiers/${id}/`),

  createSlot: (payload) => api.post('/appointments/admin/slots/create/', payload),
  bulkCreateSlots: (slots) => api.post('/appointments/admin/slots/bulk-create/', { slots }),
  updateSlot: (id, payload) => api.patch(`/appointments/admin/slots/${id}/`, payload),
  deleteSlot: (id) => api.delete(`/appointments/admin/slots/${id}/`),
};

// ---------------------------------------------------------------------- users

export const users = {
  list: (params) => api.get('/accounts/users/', { params }),
  detail: (id) => api.get(`/accounts/users/${id}/`).then((d) => unwrap(d, 'user', d)),
  update: (id, payload) => api.patch(`/accounts/users/${id}/`, payload),
  remove: (id) => api.delete(`/accounts/users/${id}/`),
  toggleStatus: (id) => api.post(`/accounts/users/${id}/toggle-status/`),
  dashboardStats: () => api.get('/accounts/dashboard/stats/'),
};

export const health = () => api.get('/health/', { auth: false });
