import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export const toursChartersApi = {
  // dashboard
  dashboardStats: () => axios.get(`${API}/tours-charters/dashboard/stats`, { headers: authHeaders() }),
  // categories
  listCategories: () => axios.get(`${API}/tours-charters/categories`, { headers: authHeaders() }),
  createCategory: (data) => axios.post(`${API}/tours-charters/categories`, data, { headers: authHeaders() }),
  updateCategory: (id, data) => axios.put(`${API}/tours-charters/categories/${id}`, data, { headers: authHeaders() }),
  deleteCategory: (id) => axios.delete(`${API}/tours-charters/categories/${id}`, { headers: authHeaders() }),
  // sellers (charter companies)
  listSellers: () => axios.get(`${API}/tours-charters/sellers`, { headers: authHeaders() }),
  createSeller: (data) => axios.post(`${API}/tours-charters/sellers`, data, { headers: authHeaders() }),
  updateSeller: (id, data) => axios.put(`${API}/tours-charters/sellers/${id}`, data, { headers: authHeaders() }),
  deleteSeller: (id) => axios.delete(`${API}/tours-charters/sellers/${id}`, { headers: authHeaders() }),
  // activities
  listActivities: (params = {}) => axios.get(`${API}/tours-charters/activities`, { headers: authHeaders(), params }),
  createActivity: (data) => axios.post(`${API}/tours-charters/activities`, data, { headers: authHeaders() }),
  updateActivity: (id, data) => axios.put(`${API}/tours-charters/activities/${id}`, data, { headers: authHeaders() }),
  deleteActivity: (id) => axios.delete(`${API}/tours-charters/activities/${id}`, { headers: authHeaders() }),
  // invoices (charter company billing)
  listInvoices: (sellerId) => axios.get(`${API}/tours-charters/invoices`, { headers: authHeaders(), params: sellerId ? { seller_id: sellerId } : {} }),
  createInvoice: (data) => axios.post(`${API}/tours-charters/invoices`, data, { headers: authHeaders() }),
  updateInvoice: (id, data) => axios.put(`${API}/tours-charters/invoices/${id}`, data, { headers: authHeaders() }),
  deleteInvoice: (id) => axios.delete(`${API}/tours-charters/invoices/${id}`, { headers: authHeaders() }),
  sendInvoiceEmail: (id, data) => axios.post(`${API}/tours-charters/invoices/${id}/send-email`, data, { headers: authHeaders() }),
  getInvoiceSettings: () => axios.get(`${API}/tours-charters/invoice-settings`, { headers: authHeaders() }),
  updateInvoiceSettings: (data) => axios.put(`${API}/tours-charters/invoice-settings`, data, { headers: authHeaders() }),
  // booking funnel tracking
  bookingEventsSummary: (days = 30) => axios.get(`${API}/tours-charters/booking-events/summary`, { headers: authHeaders(), params: { days } }),
};

export const uploadTourImage = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', 'tours-charters');
  const res = await axios.post(`${API}/storage/upload`, fd, {
    headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};
