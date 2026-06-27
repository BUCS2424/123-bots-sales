import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export const eventApi = {
  // dashboard
  dashboardStats: () => axios.get(`${API}/events/dashboard/stats`, { headers: authHeaders() }),
  // events
  listEvents: (params = {}) => axios.get(`${API}/events`, { headers: authHeaders(), params }),
  getEvent: (id) => axios.get(`${API}/events/${id}`, { headers: authHeaders() }),
  createEvent: (data) => axios.post(`${API}/events`, data, { headers: authHeaders() }),
  updateEvent: (id, data) => axios.put(`${API}/events/${id}`, data, { headers: authHeaders() }),
  deleteEvent: (id) => axios.delete(`${API}/events/${id}`, { headers: authHeaders() }),
  // categories
  listCategories: () => axios.get(`${API}/events/categories`, { headers: authHeaders() }),
  createCategory: (data) => axios.post(`${API}/events/categories`, data, { headers: authHeaders() }),
  updateCategory: (id, data) => axios.put(`${API}/events/categories/${id}`, data, { headers: authHeaders() }),
  deleteCategory: (id) => axios.delete(`${API}/events/categories/${id}`, { headers: authHeaders() }),
  // venues
  listVenues: () => axios.get(`${API}/events/venues`, { headers: authHeaders() }),
  createVenue: (data) => axios.post(`${API}/events/venues`, data, { headers: authHeaders() }),
  updateVenue: (id, data) => axios.put(`${API}/events/venues/${id}`, data, { headers: authHeaders() }),
  deleteVenue: (id) => axios.delete(`${API}/events/venues/${id}`, { headers: authHeaders() }),
  // attendees
  listAttendees: (params = {}) => axios.get(`${API}/events/attendees/list`, { headers: authHeaders(), params }),
  createAttendee: (data) => axios.post(`${API}/events/attendees`, data, { headers: authHeaders() }),
  checkinAttendee: (id) => axios.post(`${API}/events/attendees/${id}/checkin`, {}, { headers: authHeaders() }),
  deleteAttendee: (id) => axios.delete(`${API}/events/attendees/${id}`, { headers: authHeaders() }),
  verifyTicket: (code) => axios.get(`${API}/events/verify/${encodeURIComponent(code)}`, { headers: authHeaders() }),
};

export const uploadEventImage = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', 'events');
  const res = await axios.post(`${API}/storage/upload`, fd, {
    headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};

export const STATUS_META = {
  draft: { label: 'Draft', color: 'text-amber-300 bg-amber-500/15 border-amber-500/30', bar: 'bg-amber-400' },
  on_sale: { label: 'On Sale', color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30', bar: 'bg-emerald-400' },
  live: { label: 'Live', color: 'text-rose-300 bg-rose-500/15 border-rose-500/30', bar: 'bg-rose-400' },
  ended: { label: 'Ended', color: 'text-slate-300 bg-slate-500/15 border-slate-500/30', bar: 'bg-slate-400' },
  cancelled: { label: 'Cancelled', color: 'text-red-300 bg-red-500/15 border-red-500/30', bar: 'bg-red-400' },
};

export const fmtMoney = (n) =>
  (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const fmtMoneyFull = (n) =>
  (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
