import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Ticket, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EventCoverflow from '../components/EventCoverflow';
import { setSeoMetadata } from '../lib/seo';

const API = process.env.REACT_APP_BACKEND_URL;
const posterOf = (ev) => ev.banner_url || ev.ticket_background_url || (ev.images && ev.images[0]) || '';
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const EventCategoryPage = () => {
  const { catSlug } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [evRes, catRes] = await Promise.all([
          axios.get(`${API}/api/public/events`),
          axios.get(`${API}/api/public/events/meta/categories`),
        ]);
        const cat = (catRes.data || []).find((c) => c.slug === catSlug);
        setCategory(cat || null);
        if (cat) setSeoMetadata({ title: `${cat.name} | 123Bots Events`, description: `Events in ${cat.name}` });
        const list = (evRes.data || []).filter((e) => e.category_id === (cat ? cat.id : null))
          .sort((a, b) => new Date(a.start_datetime || 0) - new Date(b.start_datetime || 0));
        setEvents(list);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [catSlug]);

  if (loading) return <div className="min-h-screen bg-[#070708]"><Header /><div className="flex items-center justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div></div>;

  return (
    <div className="min-h-screen bg-[#070708] text-white" data-testid="event-category-page">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-8">
        {category?.image_url && (
          <>
            <img src={category.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#070708]/70 to-[#070708]" />
          </>
        )}
        <div className="relative mx-auto max-w-6xl px-6">
          <button onClick={() => navigate('/events')} className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white" data-testid="category-back-btn">
            <ArrowLeft className="h-4 w-4" /> All Categories
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400/80">Category</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{category ? category.name : 'Events'}</h1>
          <p className="mt-2 text-sm text-white/55">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
      </section>

      {/* Full-width event list */}
      <section className="mx-auto max-w-6xl px-6 pb-12" data-testid="category-event-list">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] py-20 text-center text-white/40" data-testid="category-empty">
            No events in this category yet.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((ev, i) => {
              const minPrice = (ev.ticket_types || []).reduce((mn, t) => (t.price < mn ? t.price : mn), Infinity);
              const dt = ev.start_datetime ? new Date(ev.start_datetime) : null;
              return (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/events/${ev.slug}`} className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-amber-400/40 hover:bg-white/[0.06] sm:flex-row sm:items-center" data-testid={`category-event-${ev.slug}`}>
                    <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-xl bg-white/5 sm:h-28 sm:w-48">
                      {posterOf(ev) ? <img src={posterOf(ev)} alt={ev.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><CalendarDays className="h-9 w-9 text-white/25" /></div>}
                      {dt && (
                        <div className="absolute left-2 top-2 flex flex-col items-center rounded-lg bg-black/75 px-2 py-1 text-center leading-none">
                          <span className="text-base font-bold">{dt.getDate().toString().padStart(2, '0')}</span>
                          <span className="text-[9px]">{dt.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold">{ev.title}</h3>
                      {ev.short_description && <p className="mt-1 line-clamp-1 text-sm text-white/50">{ev.short_description}</p>}
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/60">
                        <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-amber-400" />{dt ? dt.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA'}</span>
                        {ev.venue && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-amber-400" />{ev.venue.name}{ev.venue.city ? `, ${ev.venue.city}` : ''}</span>}
                        <span className="flex items-center gap-1.5 font-semibold text-amber-300"><Ticket className="h-4 w-4" />{minPrice === Infinity ? '—' : minPrice === 0 ? 'Free' : `From ${fmtMoney(minPrice)}`}</span>
                      </div>
                    </div>
                    <span className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2.5 text-sm font-bold text-black transition group-hover:brightness-110">Get Tickets <ArrowRight className="h-4 w-4" /></span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Coverflow of this category's events */}
      <EventCoverflow events={events} ctaLabel="See All Paid Events" ctaTo="/events?view=list" />

      <Footer />
    </div>
  );
};

export default EventCategoryPage;
