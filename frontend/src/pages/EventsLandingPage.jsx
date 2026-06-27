import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, ChevronLeft, ChevronRight, ArrowRight, Ticket, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { setSeoMetadata } from '../lib/seo';

const API = process.env.REACT_APP_BACKEND_URL;
const posterOf = (ev) => ev.banner_url || ev.ticket_background_url || (ev.images && ev.images[0]) || '';
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const EventsLandingPage = ({ centerName = 'Event Center' }) => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);
  const [slide, setSlide] = useState(0);
  const timer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setSeoMetadata({ title: `${centerName} | 123Bots`, description: 'Browse upcoming events and grab your tickets.' });
    (async () => {
      try {
        const [evRes, catRes] = await Promise.all([
          axios.get(`${API}/api/public/events`),
          axios.get(`${API}/api/public/events/meta/categories`),
        ]);
        setEvents(evRes.data || []);
        setCategories(catRes.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const slides = events.filter(posterOf).slice(0, 8);
  const slideCount = slides.length;

  useEffect(() => {
    if (slideCount <= 1) return;
    timer.current = setInterval(() => setSlide((s) => (s + 1) % slideCount), 4500);
    return () => clearInterval(timer.current);
  }, [slideCount]);

  const go = (dir) => { clearInterval(timer.current); setSlide((s) => (s + dir + slideCount) % slideCount); };

  const upcoming = (activeCat ? events.filter((e) => e.category_id === activeCat) : events)
    .slice().sort((a, b) => new Date(a.start_datetime || 0) - new Date(b.start_datetime || 0));

  const dateBadge = (iso) => {
    if (!iso) return { d: '--', m: '' };
    const dt = new Date(iso);
    return { d: dt.getDate().toString().padStart(2, '0'), m: dt.toLocaleString('en-US', { month: 'short' }).toUpperCase() };
  };

  if (loading) return <div className="min-h-screen bg-[#070708]"><Header /><div className="flex items-center justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div></div>;

  return (
    <div className="min-h-screen bg-[#070708] text-white" data-testid="events-landing-page">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.18),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold uppercase tracking-[0.4em] text-amber-400/80">123Bots Presents</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{centerName}</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="mx-auto mt-4 max-w-2xl text-base text-white/60">Discover what's coming up. Pick a category, grab your tickets, and we'll see you there.</motion.p>
        </div>
      </section>

      {/* 3-column: 2 category tiles (wrap) + upcoming list */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* category tiles -> span 2 cols, 2-up grid wrapping */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-bold uppercase tracking-wider text-white/70">Categories</h2>
            {categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] py-16 text-center text-white/40" data-testid="landing-categories-empty">No categories yet.</div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2" data-testid="landing-categories">
                {categories.map((c) => {
                  const isActive = activeCat === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCat(isActive ? null : c.id)}
                      className={`group relative h-44 overflow-hidden rounded-2xl border text-left transition ${isActive ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/10 hover:border-white/30'}`}
                      data-testid={`landing-category-${c.id}`}
                    >
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c.color}, #111)` }} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-5">
                        <h3 className="text-xl font-black">{c.name}</h3>
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-300">{isActive ? 'Showing →' : 'View events'} <ArrowRight className="h-3.5 w-3.5" /></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* upcoming events list */}
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold uppercase tracking-wider text-white/70">Upcoming</h2>
              {activeCat && <button onClick={() => setActiveCat(null)} className="text-xs text-amber-300 hover:underline">Clear filter</button>}
            </div>
            <div className="space-y-3" data-testid="landing-upcoming">
              {upcoming.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] py-10 text-center text-sm text-white/40">No upcoming events.</p>
              ) : upcoming.slice(0, 6).map((ev) => {
                const { d, m } = dateBadge(ev.start_datetime);
                const minPrice = (ev.ticket_types || []).reduce((mn, t) => (t.price < mn ? t.price : mn), Infinity);
                return (
                  <Link key={ev.id} to={`/events/${ev.slug}`} className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-amber-400/40 hover:bg-white/[0.06]" data-testid={`landing-upcoming-${ev.slug}`}>
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {posterOf(ev) ? <img src={posterOf(ev)} alt={ev.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><CalendarDays className="h-7 w-7 text-white/25" /></div>}
                      <div className="absolute left-1 top-1 flex flex-col items-center rounded-md bg-black/70 px-1.5 py-0.5 text-center leading-none">
                        <span className="text-sm font-bold">{d}</span><span className="text-[8px]">{m}</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{ev.title}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-white/50"><CalendarDays className="h-3 w-3" />{ev.start_datetime ? new Date(ev.start_datetime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA'}</p>
                      {ev.venue && <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-white/50"><MapPin className="h-3 w-3" />{ev.venue.name}</p>}
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-amber-300"><Ticket className="h-3 w-3" />{minPrice === Infinity ? '—' : minPrice === 0 ? 'Free' : `From ${fmtMoney(minPrice)}`}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Coverflow slideshow */}
      {slideCount > 0 && (
        <section className="relative overflow-hidden pb-8" data-testid="landing-slideshow">
          <div className="relative mx-auto h-[440px] max-w-6xl [perspective:1400px] sm:h-[520px]">
            {slides.map((ev, i) => {
              let offset = i - slide;
              if (offset > slideCount / 2) offset -= slideCount;
              if (offset < -slideCount / 2) offset += slideCount;
              const abs = Math.abs(offset);
              const visible = abs <= 2;
              return (
                <div
                  key={ev.id}
                  onClick={() => (offset === 0 ? navigate(`/events/${ev.slug}`) : go(offset > 0 ? 1 : -1))}
                  className="absolute left-1/2 top-1/2 h-[400px] w-[260px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 ease-out sm:h-[480px] sm:w-[320px]"
                  style={{
                    transform: `translate(-50%, -50%) translateX(${offset * 58}%) rotateY(${offset * -38}deg) scale(${offset === 0 ? 1 : 0.82})`,
                    zIndex: 20 - abs,
                    opacity: visible ? 1 : 0,
                    pointerEvents: visible ? 'auto' : 'none',
                  }}
                  data-testid={`slide-${i}`}
                >
                  {posterOf(ev)
                    ? <img src={posterOf(ev)} alt={ev.title} className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-900 to-fuchsia-900"><CalendarDays className="h-14 w-14 text-white/40" /></div>}
                  {offset !== 0 && <div className="absolute inset-0 bg-black/45" />}
                  {offset === 0 && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                      <p className="truncate text-sm font-bold">{ev.title}</p>
                      <p className="text-xs text-white/60">{ev.start_datetime ? new Date(ev.start_datetime).toLocaleDateString() : ''}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {slideCount > 1 && (
              <>
                <button onClick={() => go(-1)} className="absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur transition hover:bg-black/80 sm:left-8" data-testid="slide-prev"><ChevronLeft className="h-6 w-6" /></button>
                <button onClick={() => go(1)} className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur transition hover:bg-black/80 sm:right-8" data-testid="slide-next"><ChevronRight className="h-6 w-6" /></button>
              </>
            )}
          </div>
          {/* gold CTA */}
          <div className="mx-auto mt-2 max-w-6xl px-6">
            <Link to="/events?view=list" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-4 text-lg font-black uppercase tracking-wide text-black transition hover:brightness-110" data-testid="see-all-events-btn">
              <CalendarDays className="h-5 w-5" /> See All Upcoming Events
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default EventsLandingPage;
