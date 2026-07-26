import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ArrowLeft, Clock, Anchor, ExternalLink, SlidersHorizontal, Navigation, Hourglass, ChevronDown } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { setSeoMetadata } from '../../lib/seo';
import { useActivityMarketplaceGate, API, trackBookingEvent, newBookingSessionId } from './activityMarketplaceShared';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import axios from 'axios';

// Renders the activities within a single category OR a single charter company,
// depending on which slug param is present. Same excursion-card grid look either way.
const ActivityListPage = ({ mode }) => {
  const ready = useActivityMarketplaceGate();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [activities, setActivities] = useState([]);
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState(null);
  const [durationFilter, setDurationFilter] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [bookingActivity, setBookingActivity] = useState(null);

  useEffect(() => {
    setSeoMetadata({ title: 'Activities | 123Bots', description: 'Browse activities and book with the charter company directly.' });
  }, []);

  useEffect(() => {
    if (!ready) return;
    setLocationFilter(null);
    setDurationFilter(null);
    const param = mode === 'company' ? { seller_slug: slug } : { category_slug: slug };
    const entityEndpoint = mode === 'company' ? 'sellers' : 'categories';
    Promise.all([
      axios.get(`${API}/api/public/tours-charters/activities`, { params: param }),
      axios.get(`${API}/api/public/tours-charters/${entityEndpoint}`),
    ]).then(([actRes, entRes]) => {
      setActivities(actRes.data || []);
      const match = (entRes.data || []).find((e) => e.slug === slug);
      setEntityName(match?.name || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [ready, slug, mode]);

  // Location / Duration filter option lists, deduped in first-seen order
  const locationOptions = useMemo(() => {
    const seen = [];
    activities.forEach((a) => { if (a.location && !seen.includes(a.location)) seen.push(a.location); });
    return seen;
  }, [activities]);

  const durationOptions = useMemo(() => {
    const seen = [];
    activities.forEach((a) => { if (a.duration && !seen.includes(a.duration)) seen.push(a.duration); });
    return seen;
  }, [activities]);

  const filteredActivities = activities.filter((a) => (!locationFilter || a.location === locationFilter) && (!durationFilter || a.duration === durationFilter));

  const handleBookNow = (a, e) => {
    e.preventDefault();
    e.stopPropagation();
    const sessionId = newBookingSessionId();
    const baseEvent = { activity_id: a.id, activity_title: a.title, seller_id: a.seller_id, seller_name: a.seller_name, booking_provider: a.booking_provider, page_context: 'list', session_id: sessionId };
    trackBookingEvent({ ...baseEvent, event_type: 'book_now_click' });
    if (a.booking_type === 'external_link' && a.booking_provider === 'fareharbor' && a.effective_fareharbor_shortname) {
      trackBookingEvent({ ...baseEvent, event_type: 'drawer_opened' });
      setBookingActivity({ ...a, _sessionId: sessionId, _baseEvent: baseEvent, _openedAt: Date.now() });
    } else if (a.booking_type === 'external_link' && a.booking_url) {
      trackBookingEvent({ ...baseEvent, event_type: 'external_redirect' });
      window.open(a.booking_url, '_blank', 'noopener,noreferrer');
    } else {
      trackBookingEvent({ ...baseEvent, event_type: 'drawer_opened' });
      setBookingActivity({ ...a, _sessionId: sessionId, _baseEvent: baseEvent, _openedAt: Date.now() });
    }
  };

  const closeBookingDrawer = () => {
    if (bookingActivity?._baseEvent) {
      const duration_seconds = (Date.now() - bookingActivity._openedAt) / 1000;
      trackBookingEvent({ ...bookingActivity._baseEvent, event_type: 'drawer_closed', duration_seconds });
    }
    setBookingActivity(null);
  };

  if (!ready) return <div className="min-h-screen bg-[#061a1f]"><Header /></div>;

  const backHref = mode === 'company' ? '/activities/companies' : '/activities';
  const backLabel = mode === 'company' ? 'All Charter Companies' : 'All Activities';

  return (
    <div className="min-h-screen bg-white" data-testid="activity-list-page">
      <Header />
      <section className="relative overflow-hidden bg-[#061a1f] pt-36 pb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Link to={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300 hover:text-teal-200" data-testid="activity-list-back-link">
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
            <h1 className="text-3xl font-black text-white sm:text-4xl">{entityName || 'Activities'}</h1>
          </motion.div>
        </div>
      </section>

      {openDropdown && <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />}

      {!loading && activities.length > 0 && (
        <div className="flex flex-wrap items-center gap-5 border-b border-gray-200 bg-gray-50 px-6 py-3.5" data-testid="activity-list-filter-bar">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filter By:
          </span>

          {locationOptions.length > 0 && (
            <div className="relative z-20">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
                data-testid="activity-filter-location-btn"
              >
                <Navigation className="h-3.5 w-3.5" /> {locationFilter || 'Location'} <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {openDropdown === 'location' && (
                <div className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg" data-testid="activity-filter-location-menu">
                  <button onClick={() => { setLocationFilter(null); setOpenDropdown(null); }} className="block w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50" data-testid="activity-filter-location-all">All Locations</button>
                  {locationOptions.map((loc) => (
                    <button key={loc} onClick={() => { setLocationFilter(loc); setOpenDropdown(null); }} className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${locationFilter === loc ? 'font-semibold text-teal-700' : 'text-gray-600'}`} data-testid={`activity-filter-location-${loc.toLowerCase().replace(/\s+/g, '-')}`}>{loc}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {durationOptions.length > 0 && (
            <div className="relative z-20">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'duration' ? null : 'duration')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
                data-testid="activity-filter-duration-btn"
              >
                <Hourglass className="h-3.5 w-3.5" /> {durationFilter || 'Duration'} <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {openDropdown === 'duration' && (
                <div className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg" data-testid="activity-filter-duration-menu">
                  <button onClick={() => { setDurationFilter(null); setOpenDropdown(null); }} className="block w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50" data-testid="activity-filter-duration-all">All Durations</button>
                  {durationOptions.map((d) => (
                    <button key={d} onClick={() => { setDurationFilter(d); setOpenDropdown(null); }} className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${durationFilter === d ? 'font-semibold text-teal-700' : 'text-gray-600'}`} data-testid={`activity-filter-duration-${d.toLowerCase().replace(/\s+/g, '-')}`}>{d}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          <span className="ml-auto text-sm text-gray-500" data-testid="activity-list-results-count">{filteredActivities.length} results</span>
        </div>
      )}

      <section className="mx-auto max-w-6xl bg-white px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center text-gray-400" data-testid="activity-list-empty">
            No activities here yet. Check back soon!
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center text-gray-400" data-testid="activity-list-filter-empty">
            No activities match this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} data-testid={`public-activity-${a.alias}`}>
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/activities/view/${a.alias}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/activities/view/${a.alias}`); }}
                  className="group block cursor-pointer overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative h-52 bg-gray-100">
                    {a.images?.[0] ? <img src={a.images[0]} alt={a.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-gray-300"><Sparkles className="h-12 w-12" /></div>}
                    {a.duration && (
                      <div className="absolute left-0 top-0 flex items-center gap-1 bg-black/70 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white" data-testid={`activity-card-duration-badge-${a.alias}`}>
                        <Hourglass className="h-3 w-3" /> {a.duration}
                      </div>
                    )}
                    {a.price_from && (
                      <div className="absolute bottom-0 right-0 overflow-hidden rounded-tl-md text-center" data-testid={`activity-card-price-badge-${a.alias}`}>
                        <div className="bg-white/95 px-3 py-1"><span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">From</span></div>
                        <div className="bg-slate-800 px-3 py-1"><span className="text-sm font-black text-white">${a.price_from}</span></div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900">{a.title}</h3>
                    {mode !== 'company' && a.seller_slug && (
                      <Link
                        to={`/activities/company/${a.seller_slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 inline-block text-sm text-gray-500 hover:text-gray-700"
                        data-testid={`activity-card-seller-link-${a.alias}`}
                      >
                        {a.seller_name}
                      </Link>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">{a.short_description || a.description || ''}</p>
                    <button
                      onClick={(e) => handleBookNow(a, e)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-blue-800 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-blue-900"
                      data-testid={`activity-card-book-now-${a.alias}`}
                    >
                      {a.booking_type === 'external_link' && a.booking_provider !== 'fareharbor' && a.booking_url ? <ExternalLink className="h-4 w-4" /> : <Anchor className="h-4 w-4" />} Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
      <Footer />

      {bookingActivity && (
        <Sheet open={!!bookingActivity} onOpenChange={(open) => !open && closeBookingDrawer()}>
          <SheetContent side="right" className="w-full sm:max-w-4xl bg-[#061a1f] border-white/10 text-white p-0 flex flex-col" data-testid="activity-list-booking-drawer">
            <SheetHeader className="p-4 border-b border-white/10">
              <SheetTitle className="flex items-center gap-2 text-white">
                <Anchor className="h-4 w-4 text-teal-300" /> Book {bookingActivity.title}
              </SheetTitle>
            </SheetHeader>
            {bookingActivity.effective_fareharbor_shortname ? (
              <iframe
                title={`Book ${bookingActivity.title} on FareHarbor`}
                src={`https://fareharbor.com/embeds/book/${bookingActivity.effective_fareharbor_shortname}/${bookingActivity.fareharbor_item_pk ? `items/${bookingActivity.fareharbor_item_pk}/` : ''}?full-items=yes`}
                className="flex-1 w-full border-0"
                data-testid="activity-list-booking-iframe"
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-white/40" data-testid="activity-list-booking-coming-soon">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Booking for this activity is coming soon.</span>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default ActivityListPage;
