import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Pencil, CalendarDays, MapPin, Ticket, Loader2 } from 'lucide-react';
import { eventApi, STATUS_META, fmtMoney } from './eventApi';
import { toast } from '../../../hooks/use-toast';

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const [evRes, catRes] = await Promise.all([eventApi.listEvents(params), eventApi.listCategories()]);
      setEvents(evRes.data || []);
      setCategories(catRes.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load events', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This also removes its attendees.`)) return;
    try {
      await eventApi.deleteEvent(id);
      toast({ title: 'Event Deleted' });
      fetchEvents();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const catName = (id) => categories.find((c) => c.id === id)?.name;

  return (
    <div className="-m-4 min-h-screen bg-[#0b0712] p-5 text-white lg:-m-6 lg:p-8" data-testid="events-list-page">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Events</h1>
          <p className="text-sm text-white/40">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => navigate('/admin/events/new')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-purple-900/40 transition hover:opacity-90"
          data-testid="events-list-create-btn"
        >
          <Plus className="h-4 w-4" /> Create An Event
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-xl border border-white/10 bg-[#150f22] py-2.5 pl-9 pr-3 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
            data-testid="events-search-input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#150f22] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
          data-testid="events-status-filter"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-purple-400" /></div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#150f22] py-16 text-center text-white/40" data-testid="events-empty">
          No events found. Click "Create An Event" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((ev) => {
            const meta = STATUS_META[ev.status] || STATUS_META.draft;
            const cover = ev.banner_url || ev.ticket_background_url || (ev.images && ev.images[0]);
            const minPrice = (ev.ticket_types || []).reduce((m, t) => (t.price < m ? t.price : m), Infinity);
            return (
              <div key={ev.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#150f22] transition hover:border-purple-500/40" data-testid={`event-card-${ev.id}`}>
                <div className="relative h-36 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/30">
                  {cover ? (
                    <img src={cover} alt={ev.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/20"><CalendarDays className="h-10 w-10" /></div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${meta.color}`}>{meta.label}</span>
                </div>
                <div className="p-4">
                  <h3 className="truncate text-base font-bold text-white">{ev.title}</h3>
                  <div className="mt-2 space-y-1 text-xs text-white/50">
                    <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{ev.start_datetime ? new Date(ev.start_datetime).toLocaleString() : 'No date set'}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{ev.venue?.name || 'No venue'}</p>
                    <p className="flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5" />{ev.tickets_sold || 0} sold{minPrice !== Infinity ? ` · from ${fmtMoney(minPrice)}` : ''}</p>
                  </div>
                  {catName(ev.category_id) && (
                    <span className="mt-3 inline-block rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-medium text-purple-200">{catName(ev.category_id)}</span>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <Link to={`/admin/events/${ev.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10" data-testid={`event-edit-${ev.id}`}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <button onClick={() => handleDelete(ev.id, ev.title)} className="inline-flex items-center justify-center rounded-lg bg-red-500/10 px-3 py-2 text-red-300 transition hover:bg-red-500/20" data-testid={`event-delete-${ev.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsList;
