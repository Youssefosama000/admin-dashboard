import { api } from './api';

/**
 * Map either a LIST item  { applicationId, brandName, status, createdAt }
 * or a DETAIL item { id, brandName, ownerFirstName, ... streetName, city, ... }
 * into the shape the UI expects.
 */
function mapApplication(app) {
  const id = app.applicationId ?? app.id ?? '';
  const owner = `${app.ownerFirstName ?? ''}${app.ownerLastName ? ' ' + app.ownerLastName : ''}`.trim() || app.owner || '';
  const initials = (app.brandName ?? app.name ?? 'R').slice(0, 2).toUpperCase();
  const colors = ['#E67E22', '#3DBF52', '#3B82F6', '#8B5CF6', '#E74C3C', '#F59E0B'];
  const logoColor = app.logoColor ?? colors[initials.charCodeAt(0) % colors.length];
  const location = app.streetName
    ? [app.streetName, app.streetNumber, app.area, app.city].filter(Boolean).join(', ')
    : app.location ?? '';
  return {
    id,
    restaurantId:       app.restaurantId          ?? null,
    isRestaurantActive: app.isRestaurantActive ?? app.restaurantIsActive ?? false,
    name:               app.brandName ?? app.name ?? 'Unknown Restaurant',
    owner,
    email:              app.companyEmail ?? app.ownerEmail ?? app.email ?? '',
    phone:              app.ownerMobileNumber ?? app.companyMobileNumber ?? app.phone ?? '',
    location,
    cuisine:            app.restaurantType ?? app.cuisine ?? '',
    submittedAt:        (app.submittedAt ?? app.createdAt ?? '').slice(0, 10),
    status:             (app.status ?? 'pending').toLowerCase(),
    description:        app.description ?? '',
    rejectionReason:    app.rejectionReason ?? null,
    reviewedAt:         app.reviewedAt ?? null,
    logo:               app.logo ?? initials,
    logoColor,
    branchCount:        app.branchCount ?? 1,
  };
}

/** GET /v1/restaurant-applications */
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
  const name = r.name ?? r.brandName ?? 'Unknown';
  const initials = name.slice(0, 2).toUpperCase();
  const colors = ['#E67E22', '#3DBF52', '#3B82F6', '#8B5CF6', '#E74C3C', '#F59E0B'];
  const logoColor = r.logoColor ?? colors[initials.charCodeAt(0) % colors.length];
  return {
    id:          r.id ?? r.restaurantId,
    name,
    city:        r.city ?? '',
    status:      r.status ?? (r.isActive ? 'Active' : 'UnderReview'),
    isActive:    r.status === 'Active' || r.isActive || false,
    branchCount: r.branchCount ?? 0,
    logoUrl:     r.logoUrl ?? null,
    logo:        r.logo ?? initials,
    logoColor,
    createdAt:   (r.createdAt ?? r.submittedAt ?? '').slice(0, 10),
  };
}

function mapBranch(b) {
  return {
    id:             b.id ?? b.branchId,
    restaurantId:   b.restaurantId ?? null,
    restaurantName: b.restaurantName ?? b.brandName ?? b.restaurantBrandName ?? '',
    name:           b.branchName ?? b.name ?? 'Branch',
    contactNumber:  b.branchContactNumber ?? b.contactNumber ?? b.phone ?? '',
    city:           b.city ?? '',
    area:           b.area ?? '',
    streetName:     b.streetName ?? '',
    streetNumber:   b.streetNumber ?? '',
    isActive:       b.isActive ?? false,
    createdAt:      (b.createdAt ?? '').slice(0, 10),
  };
}

/** GET /v1/restaurants?status=UnderReview|Active|Suspended */
export async function listRestaurants({ status = '', page, pageSize } = {}) {
  const params = new URLSearchParams();
  if (status)   params.set('status', status);
  if (page)     params.set('page', page);
  if (pageSize) params.set('pagesize', pageSize);
  const query = params.toString() ? `?${params}` : '';
  const res = await api.get(`/v1/restaurants${query}`);
  const raw = Array.isArray(res) ? res : (res.items ?? res.data ?? []);
  return {
    items:      raw.map(mapRestaurant),
    total:      res.total      ?? raw.length,
    totalPages: res.totalPages ?? 1,
    hasNext:    res.hasNext    ?? false,
    hasPrev:    res.hasPrevious ?? false,
  };
}

/** GET /v1/restaurants/:id/branches */
export async function getRestaurantBranches(restaurantId) {
  const res = await api.get(`/v1/restaurants/${restaurantId}/branches`);
  const raw = Array.isArray(res) ? res : (res.items ?? res.data ?? []);
  return raw.map(mapBranch);
}

/** GET /v1/branches/dropdown */
export async function getBranchesDropdown() {
  const res = await api.get('/v1/branches/dropdown');
  const raw = res.branches ?? res.items ?? (Array.isArray(res) ? res : []);
  return raw.map(b => ({ id: b.branchId ?? b.id, name: b.name ?? b.branchName ?? 'Branch' }));
}

/** GET /v1/branches/pending */
export async function getPendingBranches() {
  const res = await api.get('/v1/branches/pending');
  const raw = Array.isArray(res) ? res : (res.branches ?? res.items ?? res.data ?? []);
  return raw.map(b => ({
    id:             b.id ?? b.branchId,
    restaurantId:   b.restaurantId ?? null,
    restaurantName: b.restaurantName ?? b.brandName ?? b.restaurantBrandName ?? '',
    name:           b.branchName ?? b.name ?? 'Branch',
    contactNumber:  b.branchContactNumber ?? b.contactNumber ?? '',
    city:           b.city ?? '',
    area:           b.area ?? '',
    streetName:     b.streetName ?? '',
    streetNumber:   b.streetNumber ?? '',
    isActive:       b.isActive ?? false,
  }));
}

/** GET /v1/branches/:id/details */
export async function getBranchDetails(id) {
  const res = await api.get(`/v1/branches/${id}/details`);
  return mapBranch(res);
}

/** POST /v1/restaurants/:id/activate */
export async function activateRestaurant(id) {
  return api.post(`/v1/restaurants/${id}/activate`, {});
}

/** PATCH /v1/branches/:id/activate */
export async function activateBranch(id) {
  return api.patch(`/v1/branches/${id}/activate`, {});
}

// ── Meals ─────────────────────────────────────────────────

function mapMeal(m) {
  const sizes = Array.isArray(m.sizes)
    ? m.sizes.map(s => ({ id: s.id, name: s.name ?? '', price: s.price ?? 0, calories: s.calories ?? null, sortOrder: s.sortOrder ?? 0 }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  const firstSize = sizes[0] ?? null;
  const minPrice  = sizes.length ? Math.min(...sizes.map(s => s.price)) : null;
  return {
    id:             m.id ?? m.mealId,
    name:           m.name ?? m.mealName ?? 'Unnamed Meal',
    description:    m.description ?? '',
    imgUrl:         m.image ?? m.mealImage ?? m.imgUrl ?? m.imageUrl ?? null,
    restaurantId:   m.restaurantId   ?? null,
    restaurantName: m.restaurantName ?? m.brandName ?? '',
    restaurantLogo: m.restaurantLogo ?? null,
    calories:       firstSize?.calories ?? null,
    price:          minPrice,
    sizes,
    ingredients:    Array.isArray(m.ingredients)
      ? m.ingredients.map(ing => typeof ing === 'string' ? ing : (ing.name ?? String(ing)))
      : [],
    category:       m.categoryName ?? m.category ?? '',
    status:         'pending',
    submittedAt:    (m.createdAt ?? m.submittedAt ?? '').slice(0, 10),
  };
}

/** GET /v1/meals/pending */
export async function getUnreviewedMeals() {
  const first = await api.get('/v1/meals/pending');
  if (Array.isArray(first)) return first.map(mapMeal);
  const items      = first.meals ?? first.items ?? first.data ?? [];
  const totalPages = first.totalPages ?? 1;
  if (totalPages <= 1) return items.map(mapMeal);
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      api.get(`/v1/meals/pending?Page=${i + 2}`)
        .then(r => Array.isArray(r) ? r : (r.meals ?? r.items ?? r.data ?? []))
        .catch(() => [])
    )
  );
  return [...items, ...rest.flat()].map(mapMeal);
}

/** GET /v1/meals/pending/:id */
export async function getMealDetail(id) {
  const res = await api.get(`/v1/meals/pending/${id}`);
  return mapMeal(res);
}

/** PATCH /v1/meals/pending/:id/approve */
export async function approveMeal(id) {
  return api.patch(`/v1/meals/pending/${id}/approve`, {});
}
