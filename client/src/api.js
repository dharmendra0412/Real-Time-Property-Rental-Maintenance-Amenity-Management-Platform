// React API Client Module
const API_BASE = '/api';

export const API = {
  getToken() {
    return localStorage.getItem('pm_auth_token');
  },

  setToken(token) {
    if (token) localStorage.setItem('pm_auth_token', token);
    else localStorage.removeItem('pm_auth_token');
  },

  logout() {
    this.setToken(null);
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = options.headers || {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = { ...options, headers };
    const response = await fetch(url, config);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: response.status === 404 ? 'API route not found (HTTP 404)' : `Server Error (HTTP ${response.status})` };
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: Request failed`);
    }

    return data;
  },

  // Auth
  login: (email, password) => API.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) => API.request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  validateEmail: (email) => API.request('/auth/validate-email', { method: 'POST', body: JSON.stringify({ email }) }),
  getMe: () => API.request('/auth/me'),
  getUsers: (role) => API.request(role ? `/auth/users?role=${role}` : '/auth/users'),

  // Properties & Units
  getPublicProperties: () => API.request('/properties/public-list'),
  getProperties: () => API.request('/properties'),
  getProperty: (id) => API.request(`/properties/${id}`),
  createProperty: (payload) => API.request('/properties', { method: 'POST', body: JSON.stringify(payload) }),
  createUnit: (propertyId, payload) => API.request(`/properties/${propertyId}/units`, { method: 'POST', body: JSON.stringify(payload) }),

  // Dashboard Stats
  getStats: () => API.request('/dashboard/stats'),

  // Maintenance
  getMaintenanceRequests: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    const query = params.toString() ? `?${params.toString()}` : '';
    return API.request(`/maintenance${query}`);
  },
  getMaintenanceRequest: (id) => API.request(`/maintenance/${id}`),
  createMaintenanceRequest: (formData) => API.request('/maintenance', { method: 'POST', body: formData }),
  updateTicketStatus: (id, payload) => API.request(`/maintenance/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  rateTicket: (id, rating, feedback) => API.request(`/maintenance/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, feedback }) }),

  // Amenities
  getAmenities: (propertyId) => API.request(propertyId ? `/amenities?property_id=${propertyId}` : '/amenities'),
  createAmenity: (payload) => API.request('/amenities', { method: 'POST', body: JSON.stringify(payload) }),
  getAmenityAvailability: (id, date) => API.request(`/amenities/${id}/availability?date=${date}`),
  bookAmenity: (payload) => API.request('/amenities/book', { method: 'POST', body: JSON.stringify(payload) }),
  getMyBookings: () => API.request('/amenities/my-bookings'),
  checkInBooking: (id) => API.request(`/amenities/bookings/${id}/check-in`, { method: 'PATCH' }),
  checkOutBooking: (id) => API.request(`/amenities/bookings/${id}/check-out`, { method: 'PATCH' }),
  cancelBooking: (id) => API.request(`/amenities/bookings/${id}/cancel`, { method: 'PATCH' })
};
