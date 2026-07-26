import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ArrowLeft, Clock, Anchor, ExternalLink } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { setSeoMetadata } from '../../lib/seo';
import { useActivityMarketplaceGate, API } from './activityMarketplaceShared';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import axios from 'axios';

// Renders the activities within a single category OR a single charter company,
// depending on which slug param is present. Same excursion-card grid look either way.
const ActivityListPage = ({ mode }) => {
  const ready = useActivityMarketplaceGate();
  const { slug } = useParams();
  const [activities, setActivities] = useState([]);
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(null);
  const [bookingActivity, setBookingActivity] = useState(null);

  useEffect(() => {
    setSeoMetadata({ title: 'Activities | 123Bots', description: 'Browse activities and book with the charter company directly.' });
  }, []);

  useEffect(() => {
    if (!ready) return;
    setActiveTag(null);
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

  // Tag filter pills, deduped, ordered by each activity's priority (activities already arrive priority-sorted)
  const tagPills = useMemo(() => {
    const seen = [];
    activities.forEach((a) => (a.tags || []).forEach((t) => { if (!seen.includes(t)) seen.push(t); }));
    return seen;
  }, [activities]);

  const filteredActivities = activeTag ? activities.filter((a) => a.tags?.includes(activeTag)) : activities;

  const handleBookNow = (a, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (a.booking_type === 'external_link' && a.booking_provider === 'fareharbor' && a.effective_fareharbor_shortname) {
      setBookingActivity(a);
    } else if (a.booking_type === 'external_link' && a.booking_url) {
      window.open(a.booking_url, '_blank', 'noopener,noreferrer');
    } else {
      setBookingActivity(a);
    }
  };

  if (!ready) return <div className="min-h-screen bg-[#061a1f]"><Header /></div>;

  const backHref = mode === 'company' ? '/activities/companies' : '/activities';
  const backLabel = mode === 'company' ? 'All Charter Companies' : 'All Activities';

  return (
    <div className="min-h-screen bg-[#061a1f]" data-testid="activity-list-page">
      <Header />
      <section className="relative overflow-hidden pt-36 pb-8">
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

      {!loading && tagPills.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-4" data-testid="activity-list-filter-bar">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-white/30">Filter</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${!activeTag ? 'bg-teal-500 text-black' : 'border border-white/15 text-white/60 hover:border-white/30 hover:text-white'}`}
              data-testid="activity-filter-show-all"
            >
              Show all
            </button>
            {tagPills.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(t === activeTag ? null : t)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${activeTag === t ? 'bg-teal-500 text-black' : 'border border-white/15 text-white/60 hover:border-white/30 hover:text-white'}`}
                data-testid={`activity-filter-tag-${t.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-400" /></div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-20 text-center text-slate-400" data-testid="activity-list-empty">
            No activities here yet. Check back soon!
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-20 text-center text-slate-400" data-testid="activity-list-filter-empty">
            No activities match this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {filteredActivities.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} data-testid={`public-activity-${a.alias}`}>
                <Link to={`/activities/view/${a.alias}`} className="group block overflow-hidden rounded-2xl border border-white/10 bg-[#0b1f24] transition hover:border-teal-500/50">
                  <div className="relative h-56 bg-gradient-to-br from-teal-900/40 to-cyan-900/30">
                    {a.images?.[0] ? <img src={a.images[0]} alt={a.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-white/20"><Sparkles className="h-12 w-12" /></div>}
                    {a.seller_logo_url && (
                      <div className="absolute left-3 top-3 max-w-[45%] rounded-md bg-white/95 px-2 py-1 shadow-lg" data-testid={`activity-card-seller-logo-${a.alias}`}>
                        <img src={a.seller_logo_url} alt={a.seller_name} className="h-8 max-w-full object-contain" />
                      </div>
                    )}
                    {(a.duration || a.location) && (
                      <div className="absolute bottom-0 left-0 max-w-[70%] bg-black/70 px-3 py-1.5 text-xs font-medium text-white" data-testid={`activity-card-info-banner-${a.alias}`}>
                        {[a.duration, a.location].filter(Boolean).join(' - ')}
                      </div>
                    )}
                    {a.price_from && (
                      <div className="absolute bottom-0 right-0 bg-white px-3 py-1.5 text-center leading-tight text-black" data-testid={`activity-card-price-badge-${a.alias}`}>
                        <span className="block text-[10px] font-semibold uppercase tracking-wide">From</span>
                        <span className="block text-sm font-black">${a.price_from}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white">{a.title}</h3>
                    {mode !== 'company' && a.seller_slug && (
                      <Link
                        to={`/activities/company/${a.seller_slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 inline-block text-sm font-semibold text-orange-400 hover:text-orange-300"
                        data-testid={`activity-card-seller-link-${a.alias}`}
                      >
                        {a.seller_name}
                      </Link>
                    )}
                    <p className="mt-2 line-clamp-3 text-sm text-slate-400">{a.short_description || a.description || ''}</p>
                    <button
                      onClick={(e) => handleBookNow(a, e)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                      data-testid={`activity-card-book-now-${a.alias}`}
                    >
                      {a.booking_type === 'external_link' && a.booking_provider !== 'fareharbor' && a.booking_url ? <ExternalLink className="h-4 w-4" /> : <Anchor className="h-4 w-4" />} Book Now
                    </button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
      <Footer />

      {bookingActivity && (
        <Sheet open={!!bookingActivity} onOpenChange={(open) => !open && setBookingActivity(null)}>
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
