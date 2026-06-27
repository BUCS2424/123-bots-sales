import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Ticket, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const posterOf = (ev) => ev.banner_url || ev.ticket_background_url || (ev.images && ev.images[0]) || '';
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const EventCoverflow = ({ events = [], ctaLabel = 'See All Paid Events', ctaTo = '/events?view=list' }) => {
  const [slide, setSlide] = useState(0);
  const timer = useRef(null);
  const slides = events.filter(posterOf).slice(0, 8);
  const slideCount = slides.length;

  useEffect(() => { setSlide(0); }, [slideCount]);

  useEffect(() => {
    if (slideCount <= 1) return undefined;
    timer.current = setInterval(() => setSlide((s) => (s + 1) % slideCount), 4500);
    return () => clearInterval(timer.current);
  }, [slideCount]);

  const go = (dir) => { clearInterval(timer.current); setSlide((s) => (s + dir + slideCount) % slideCount); };

  if (slideCount === 0) return null;

  return (
    <section className="relative overflow-hidden pb-8" data-testid="landing-slideshow">
      <div className="relative mx-auto h-[360px] max-w-6xl [perspective:1600px] sm:h-[400px]">
        {slides.map((ev, i) => {
          let offset = i - slide;
          if (offset > slideCount / 2) offset -= slideCount;
          if (offset < -slideCount / 2) offset += slideCount;
          const abs = Math.abs(offset);
          const visible = abs <= 2;
          const minPrice = (ev.ticket_types || []).reduce((mn, t) => (t.price < mn ? t.price : mn), Infinity);
          return (
            <div
              key={ev.id}
              onClick={() => (offset === 0 ? null : go(offset > 0 ? 1 : -1))}
              className="absolute left-1/2 top-1/2 h-[280px] w-[340px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 ease-out sm:h-[320px] sm:w-[680px]"
              style={{
                transform: `translate(-50%, -50%) translateX(${offset * 46}%) rotateY(${offset * -32}deg) scale(${offset === 0 ? 1 : 0.82})`,
                zIndex: 20 - abs,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'auto' : 'none',
                cursor: offset === 0 ? 'default' : 'pointer',
              }}
              data-testid={`slide-${i}`}
            >
              {offset === 0 ? (
                <div className="flex h-full w-full bg-[#111114]">
                  <div className="h-full w-1/2 flex-shrink-0">
                    {posterOf(ev) ? <img src={posterOf(ev)} alt={ev.title} className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-900 to-fuchsia-900"><CalendarDays className="h-12 w-12 text-white/40" /></div>}
                  </div>
                  <div className="flex w-1/2 flex-col justify-center gap-2 p-5 sm:p-7">
                    {ev.category?.name && <p className="text-xs font-bold uppercase tracking-widest text-amber-400/80">{ev.category.name}</p>}
                    <h3 className="text-lg font-black leading-tight sm:text-2xl">{ev.title}</h3>
                    <p className="flex items-center gap-2 text-sm text-white/60"><CalendarDays className="h-4 w-4 text-amber-400" />{ev.start_datetime ? new Date(ev.start_datetime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA'}</p>
                    {ev.venue && <p className="flex items-center gap-2 text-sm text-white/60"><MapPin className="h-4 w-4 text-amber-400" />{ev.venue.name}</p>}
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-300"><Ticket className="h-4 w-4" />{minPrice === Infinity ? '—' : minPrice === 0 ? 'Free' : `From ${fmtMoney(minPrice)}`}</p>
                    <Link to={`/events/${ev.slug}`} className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110" data-testid={`slide-buy-${ev.slug}`}>Buy Tickets <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                </div>
              ) : (
                <>
                  {posterOf(ev) ? <img src={posterOf(ev)} alt={ev.title} className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-900 to-fuchsia-900"><CalendarDays className="h-12 w-12 text-white/40" /></div>}
                  <div className="absolute inset-0 bg-black/55" />
                </>
              )}
            </div>
          );
        })}
        {slideCount > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur transition hover:bg-black/80 sm:left-4" data-testid="slide-prev"><ChevronLeft className="h-6 w-6" /></button>
            <button onClick={() => go(1)} className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur transition hover:bg-black/80 sm:right-4" data-testid="slide-next"><ChevronRight className="h-6 w-6" /></button>
          </>
        )}
      </div>
      <div className="mx-auto mt-2 max-w-6xl px-6">
        <Link to={ctaTo} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-4 text-lg font-black uppercase tracking-wide text-black transition hover:brightness-110" data-testid="see-all-events-btn">
          <Ticket className="h-5 w-5" /> {ctaLabel}
        </Link>
      </div>
    </section>
  );
};

export default EventCoverflow;
