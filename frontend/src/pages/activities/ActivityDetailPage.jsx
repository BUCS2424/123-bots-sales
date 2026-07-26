import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ArrowLeft, Building2, Clock, Tag, ExternalLink, Anchor } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { setSeoMetadata } from '../../lib/seo';
import { useActivityMarketplaceGate, API, trackBookingEvent, newBookingSessionId } from './activityMarketplaceShared';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import axios from 'axios';

const ActivityDetailPage = () => {
  const ready = useActivityMarketplaceGate();
  const { slug } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const bookingSessionRef = useRef(null);

  useEffect(() => {
    if (!ready) return;
    axios.get(`${API}/api/public/tours-charters/activities/${slug}`)
      .then((r) => {
        setActivity(r.data);
        const robotsMap = {
          index_follow: 'index, follow',
          index_nofollow: 'index, nofollow',
          noindex_follow: 'noindex, follow',
          noindex_nofollow: 'noindex, nofollow',
        };
        setSeoMetadata({
          title: r.data.seo_title || r.data.title,
          description: r.data.seo_description || r.data.description?.slice(0, 160) || 'Book this activity.',
          robots: robotsMap[r.data.seo_robots] || 'index, follow',
          canonicalPath: `/activities/view/${r.data.alias}`,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [ready, slug]);

  const trackAndOpenDrawer = () => {
    const sessionId = newBookingSessionId();
    const baseEvent = { activity_id: activity.id, activity_title: activity.title, seller_id: activity.seller_id, seller_name: activity.seller?.name, booking_provider: activity.booking_provider, page_context: 'detail', session_id: sessionId };
    trackBookingEvent({ ...baseEvent, event_type: 'book_now_click' });
    trackBookingEvent({ ...baseEvent, event_type: 'drawer_opened' });
    bookingSessionRef.current = { baseEvent, openedAt: Date.now() };
    setBookingOpen(true);
  };

  const trackExternalClick = (e) => {
    e.preventDefault();
    const sessionId = newBookingSessionId();
    const baseEvent = { activity_id: activity.id, activity_title: activity.title, seller_id: activity.seller_id, seller_name: activity.seller?.name, booking_provider: activity.booking_provider, page_context: 'detail', session_id: sessionId };
    trackBookingEvent({ ...baseEvent, event_type: 'book_now_click' });
    trackBookingEvent({ ...baseEvent, event_type: 'external_redirect' });
    window.open(activity.booking_url, '_blank', 'noopener,noreferrer');
  };

  const handleDrawerOpenChange = (open) => {
    setBookingOpen(open);
    if (!open && bookingSessionRef.current) {
      const { baseEvent, openedAt } = bookingSessionRef.current;
      trackBookingEvent({ ...baseEvent, event_type: 'drawer_closed', duration_seconds: (Date.now() - openedAt) / 1000 });
      bookingSessionRef.current = null;
    }
  };

  if (!ready) return <div className="min-h-screen bg-[#061a1f]"><Header /></div>;

  return (
    <div className="min-h-screen bg-[#061a1f]" data-testid="activity-detail-page">
      <Header />
      <section className="pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <Link to="/activities" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300 hover:text-teal-200" data-testid="activity-detail-back-link">
            <ArrowLeft className="h-4 w-4" /> All Activities
          </Link>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-400" /></div>
          ) : notFound || !activity ? (
            <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-20 text-center text-slate-400" data-testid="activity-detail-not-found">
              Activity not found.
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1f24]">
                <div className="relative h-72 bg-gradient-to-br from-teal-900/40 to-cyan-900/30">
                  {activity.images?.[0] ? <img src={activity.images[0]} alt={activity.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/20"><Sparkles className="h-16 w-16" /></div>}
                </div>
                <div className="p-8">
                  <h1 className="text-3xl font-black text-white">{activity.title}</h1>
                  {activity.seller && (
                    <Link to={`/activities/company/${activity.seller.slug}`} className="mt-2 inline-flex items-center gap-1.5 text-sm text-teal-300 hover:text-teal-200" data-testid="activity-detail-seller-link">
                      <Building2 className="h-4 w-4" /> {activity.seller.name}
                    </Link>
                  )}

                  {activity.categories?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {activity.categories.map((c) => (
                        <span key={c.id} className="rounded-full bg-teal-500/15 px-2.5 py-1 text-xs text-teal-300">{c.name}</span>
                      ))}
                    </div>
                  )}

                  {activity.description && <p className="mt-5 text-slate-300 whitespace-pre-line">{activity.description}</p>}

                  <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-slate-400">
                    {activity.price_display && <span className="flex items-center gap-1.5"><Tag className="h-4 w-4 text-teal-400" /> {activity.price_display}</span>}
                    {activity.duration && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-400" /> {activity.duration}</span>}
                  </div>

                  {activity.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {activity.tags.map((t) => (
                        <span key={t} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">#{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-8">
                    {activity.booking_type === 'external_link' && activity.booking_provider === 'fareharbor' && activity.effective_fareharbor_shortname ? (
                      <button onClick={trackAndOpenDrawer} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90" data-testid="activity-book-now-button">
                        <Anchor className="h-4 w-4" /> Book Now
                      </button>
                    ) : activity.booking_type === 'external_link' && activity.booking_url ? (
                      <button onClick={trackExternalClick} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90" data-testid="activity-book-now-button">
                        Book Now <ExternalLink className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-6 py-3 text-sm font-semibold text-white/40" data-testid="activity-booking-coming-soon">
                        In-App Booking Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
      <Footer />

      {activity && (
        <Sheet open={bookingOpen} onOpenChange={handleDrawerOpenChange}>
          <SheetContent side="right" className="w-full sm:max-w-4xl bg-[#061a1f] border-white/10 text-white p-0 flex flex-col" data-testid="activity-booking-drawer">
            <SheetHeader className="p-4 border-b border-white/10">
              <SheetTitle className="flex items-center gap-2 text-white">
                <Anchor className="h-4 w-4 text-teal-300" /> Book {activity.title}
              </SheetTitle>
            </SheetHeader>
            {activity.effective_fareharbor_shortname && (
              <iframe
                title={`Book ${activity.title} on FareHarbor`}
                src={`https://fareharbor.com/embeds/book/${activity.effective_fareharbor_shortname}/${activity.fareharbor_item_pk ? `items/${activity.fareharbor_item_pk}/` : ''}?full-items=yes`}
                className="flex-1 w-full border-0"
                data-testid="activity-booking-iframe"
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default ActivityDetailPage;
