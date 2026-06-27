import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Ticket, ArrowRight, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { setSeoMetadata } from '../lib/seo';

const API = process.env.REACT_APP_BACKEND_URL;

const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const EventsPublicPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setSeoMetadata({ title: 'Events | 123Bots', description: 'Upcoming events and tickets.' });
    (async () => {
      try {
        const flags = await axios.get(`${API}/api/settings/feature-flags`);
        if (!flags.data?.events_enabled) { navigate('/'); return; }
        const r = await axios.get(`${API}/api/public/events`);
        setEvents(r.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  const dateBadge = (iso) => {
    if (!iso) return { d: '--', m: '' };
    const dt = new Date(iso);
    return { d: dt.getDate().toString().padStart(2, '0'), m: dt.toLocaleString('en-US', { month: 'short' }).toUpperCase() };
  };

  return (
    <div className="min-h-screen bg-[#050f17]" data-testid="events-public-page">
      <Header />
      <section className="relative overflow-hidden pt-36 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300/80">123Bots Presents</p>
            <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl lg:text-6xl">Upcoming Events</h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">Grab your tickets for our latest experiences, demos, and showcases.</p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0a1929] py-20 text-center text-slate-400" data-testid="events-public-empty">
            No upcoming events right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev, i) => {
              const { d, m } = dateBadge(ev.start_datetime);
              const cover = ev.banner_url || ev.ticket_background_url || (ev.images && ev.images[0]);
              const minPrice = (ev.ticket_types || []).reduce((mn, t) => (t.price < mn ? t.price : mn), Infinity);
              return (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link to={`/events/${ev.slug}`} className="group block overflow-hidden rounded-2xl border border-white/10 bg-[#0a1929] transition hover:border-purple-500/50" data-testid={`public-event-${ev.slug}`}>
                    <div className="relative h-48 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/30">
                      {cover ? <img src={cover} alt={ev.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-white/20"><CalendarDays className="h-12 w-12" /></div>}
                      <div className="absolute left-4 top-4 flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-black/70 text-white backdrop-blur">
                        <span className="text-lg font-bold leading-none">{d}</span>
                        <span className="text-[10px] font-medium">{m}</span>
                      </div>
                      {ev.status === 'live' && <span className="absolute right-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white">LIVE</span>}
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-white">{ev.title}</h3>
                      {ev.short_description && <p className="mt-1 line-clamp-2 text-sm text-slate-400">{ev.short_description}</p>}
                      <div className="mt-3 space-y-1.5 text-sm text-slate-400">
                        {ev.venue && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-purple-400" />{ev.venue.name}{ev.venue.city ? `, ${ev.venue.city}` : ''}</p>}
                        <p className="flex items-center gap-2"><Ticket className="h-4 w-4 text-purple-400" />{minPrice === Infinity ? '—' : minPrice === 0 ? 'Free' : `From ${fmtMoney(minPrice)}`}</p>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-purple-300 transition group-hover:gap-3">Get Tickets <ArrowRight className="h-4 w-4" /></span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default EventsPublicPage;
