import { api } from './api';

/**
 * Map either a LIST item  { applicationId, brandName, status, createdAt }
 * or a DETAIL item { id, brandName, ownerFirstName, ... streetName, city, ... }
 * into the shape the UI expects.
 */
function mapApplication(app) {
  // List uses "applicationId", detail uses "id"
  const id = app.applicationId ?? app.id ?? '';

  const owner = `${app.ownerFirstName ?? ''} ${app.ownerLastName ?? ''}`.trim();
  const initials = (app.brandName ?? 'R').slice(0, 2).toUpperCase();
  const colors = ['#E67E22', '#3DBF52', '#3B82F6', '#8B5CF6', '#E74C3C', '#F59E0B'];
  const logoColor = colors[initials.charCodeAt(0) % colors.length];

  // Application detail returns flat address fields at the top level
  const location = app.streetName
    ? [app.streetName, app.streetNumber, app.area, app.city].filter(Boolean).join(', ')
    : '';

  return {
    id,
    restaurantId:    app.restaurantId          ?? null,
    isRestaurantActive: app.isRestaurantActive ?? app.restaurantIsActive ?? false,
    name:            app.brandName            ?? 'Unknown Restaurant',
    owner,
    email:           app.companyEmail         ?? app.ownerEmail ?? '',
    phone:           app.ownerMobileNumber     ?? app.companyMobileNumber ?? '',
    location,
    cuisine:         app.restaurantType        ?? '',
    submittedAt:     (app.submittedAt ?? app.createdAt ?? '').slice(0, 10),
    status:          (app.status ?? 'pending').toLowerCase(),
    description:     app.description           ?? '',
    rejectionReason: app.rejectionReason       ?? null,
    reviewedAt:      app.reviewedAt            ?? null,
    logo:            initials,
    logoColor,
    branchCount:     app.branchCount           ?? 1,
  };
}

/**
 * GET /v1/restaurant-applications
 * Returns paginated list: { total, perPage, currentPage, totalPages, hasNext, hasPrevious, items[] }
 */
export async function listApplications({ status = '', page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams({ Page: page, PageSize: pageSize });
  if (status) params.set('Status', status.charAt(0).toUpperCase() + status.slice(1));
  const res = await api.get(`/v1/restaurant-applications?${params}`);
  const raw = Array.isArray(res) ? res : (res.items ?? res.data ?? []);
  return {
    items:      raw.map(mapApplication),
    total:      res.total      ?? raw.length,
    totalPages: res.totalPages ?? 1,
    hasNext:    res.hasNext    ?? false,
    hasPrev:    res.hasPrevious ?? false,
  };
}

/** GET /v1/restaurant-applications/:id */
export async function getApplication(id) {
  const res = await api.get(`/v1/restaurant-applications/${id}`);
  return mapApplication(res);
}

/** POST /v1/restaurant-applications/:id/approve */
export async function approveApplication(id) {
  return api.post(`/v1/restaurant-applications/${id}/approve`, {});
}

/** POST /v1/restaurant-applications/:id/reject */
export async function rejectApplication(id, reason = 'Application rejected by admin') {
  return api.post(`/v1/restaurant-applications/${id}/reject`, { rejectionReason: reason });
}

// ── Restaurants ───────────────────────────────────────────

function mapRestaurant(r) {
  const initials = (r.brandName ?? r.name ?? 'R').slice(0, 2).toUpperCase()
  const colors = ['#E67E22', '#3DBF52', '#3B82F6', '#8B5CF6', '#E74C3C', '#F59E0B']
  const logoColor = colors[initials.charCodeAt(0) % colors.length]
  return {
    id:          r.id,
    name:        r.brandName ?? r.name ?? 'Unknown',
    type:        r.restaurantType ?? r.type ?? '',
    isActive:    r.isActive ?? false,
    branchCount: r.branchCount ?? 0,
    logoUrl:     r.logoUrl ?? null,
    logo:        initials,
    logoColor,
    createdAt:   (r.createdAt ?? '').slice(0, 10),
  }
}

function mapBranch(b) {
  return {
    id:            b.id,
    restaurantId:  b.restaurantId ?? null,
    name:          b.branchName ?? b.name ?? 'Branch',
    contactNumber: b.branchContactNumber ?? b.contactNumber ?? '',
    city:          b.city ?? '',
    area:          b.area ?? '',
    streetName:    b.streetName ?? '',
    streetNumber:  b.streetNumber ?? '',
    isActive:      b.isActive ?? false,
    createdAt:     (b.createdAt ?? '').slice(0, 10),
  }
}

/** GET /v1/restaurants */
export async function listRestaurants({ page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams({ Page: page, PageSize: pageSize })
  const res = await api.get(`/v1/restaurants?${params}`)
  const raw = Array.isArray(res) ? res : (res.items ?? res.data ?? [])
  return {
    items:      raw.map(mapRestaurant),
    totalPages: res.totalPages ?? 1,
    hasNext:    res.hasNext ?? false,
    hasPrev:    res.hasPrevious ?? false,
  }
}

/** GET /v1/restaurants/:id/branches */
export async function getRestaurantBranches(restaurantId) {
  const res = await api.get(`/v1/restaurants/${restaurantId}/branches`)
  const raw = Array.isArray(res) ? res : (res.items ?? res.data ?? [])
  return raw.map(mapBranch)
}

/** GET /v1/branches/dropdown → { branches: [{ branchId, name }] } */
export async function getBranchesDropdown() {
  const res = await api.get('/v1/branches/dropdown')
  const raw = res.branches ?? res.items ?? (Array.isArray(res) ? res : [])
  return raw.map(b => ({ id: b.branchId ?? b.id, name: b.name ?? b.branchName ?? 'Branch' }))
}

/** GET /v1/branches/pending — branches waiting for admin activation */
export async function getPendingBranches() {
  const res = await api.get('/v1/branches/pending')
  // response may be a full array, or { branches: [...] }, or { items: [...] }
  const raw = Array.isArray(res) ? res : (res.branches ?? res.items ?? res.data ?? [])
  return raw.map(b => ({
    id:            b.id ?? b.branchId,
    restaurantId:  b.restaurantId ?? null,
    name:          b.branchName ?? b.name ?? 'Branch',
    contactNumber: b.branchContactNumber ?? b.contactNumber ?? '',
    city:          b.city ?? '',
    area:          b.area ?? '',
    streetName:    b.streetName ?? '',
    streetNumber:  b.streetNumber ?? '',
    isActive:      b.isActive ?? false,
  }))
}

/** GET /v1/branches/:id/details */
export async function getBranchDetails(id) {
  const res = await api.get(`/v1/branches/${id}/details`)
  return mapBranch(res)
}

/** POST /v1/restaurants/:id/activate */
export async function activateRestaurant(id) {
  return api.post(`/v1/restaurants/${id}/activate`, {})
}

/** PATCH /v1/branches/:id/activate */
export async function activateBranch(id) {
  return api.patch(`/v1/branches/${id}/activate`, {})
}

// ── Meals ─────────────────────────────────────────────────

function mapMeal(m) {
  const sizes = Array.isArray(m.sizes)
    ? m.sizes
        .map(s => ({
          id:        s.id,
          name:      s.name ?? '',
          price:     s.price ?? 0,
          calories:  s.calories ?? null,
          sortOrder: s.sortOrder ?? 0,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : []

  const firstSize = sizes[0] ?? null
  const minPrice  = sizes.length ? Math.min(...sizes.map(s => s.price)) : null

  return {
    // real API uses id/name/image (no "meal" prefix); keep legacy fallbacks for list endpoint
    id:             m.id    ?? m.mealId,
    name:           m.name  ?? m.mealName  ?? 'Unnamed Meal',
    description:    m.description ?? m.mealDescription ?? '',
    imgUrl:         m.image ?? m.mealImage ?? m.imgUrl  ?? null,
    restaurantId:   m.restaurantId   ?? null,
    restaurantName: m.restaurantName ?? m.brandName ?? '',
    restaurantLogo: m.restaurantLogo ?? null,
    calories:       firstSize?.calories ?? m.smallestSizeKcal ?? null,
    price:          minPrice,
    sizes,
    ingredients:    Array.isArray(m.ingredients)
      ? m.ingredients.map(ing => typeof ing === 'string' ? ing : (ing.name ?? ing.ingredient ?? ing.label ?? String(ing)))
      : [],
    category:       m.categoryName ?? m.category ?? '',
    status:         'pending',
    submittedAt:    (m.createdAt ?? m.submittedAt ?? '').slice(0, 10),
  }
}

/** GET /v1/meals/pending — fetches all pages using default server page size */
export async function getUnreviewedMeals() {
  const first = await api.get('/v1/meals/pending')

  if (Array.isArray(first)) return first.map(mapMeal)

  const items      = first.meals ?? first.items ?? first.data ?? []
  const totalPages = first.totalPages ?? 1

  if (totalPages <= 1) return items.map(mapMeal)

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      api.get(`/v1/meals/pending?Page=${i + 2}`)
        .then(r => Array.isArray(r) ? r : (r.meals ?? r.items ?? r.data ?? []))
        .catch(() => [])
    )
  )

  return [...items, ...rest.flat()].map(mapMeal)
}

/** GET /v1/meals/pending/:id */
export async function getMealDetail(id) {
  const res = await api.get(`/v1/meals/pending/${id}`)
  return mapMeal(res)
}

/** PATCH /v1/meals/pending/:id/approve */
export async function approveMeal(id) {
  return api.patch(`/v1/meals/pending/${id}/approve`, {})
}
