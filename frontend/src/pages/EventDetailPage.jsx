import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, MapPin, Minus, Plus, Loader2, X, Share2, Map as MapIcon,
  Info, UserRound, ReceiptText, Copy, Check, Ticket,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from '../hooks/use-toast';
import { setSeoMetadata } from '../lib/seo';

const API = process.env.REACT_APP_BACKEND_URL;
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const inputCls = 'w-full rounded-lg border border-white/10 bg-[#0f0f12] px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/60';

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const day = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
};

const EventDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isPreview = params.get('preview') === '1';

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState(false);
  const [venueOpen, setVenueOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // purchase state
  const [qty, setQty] = useState({});
  const [buyer, setBuyer] = useState({ buyer_name: '', buyer_email: '', buyer_phone: '' });
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`${API}/api/public/events/${slug}`, { params: isPreview ? { preview: true } : {} });
        setEvent(r.data);
        setSeoMetadata({ title: `${r.data.title} | 123Bots Events`, description: r.data.short_description || '' });
      } catch {
        toast({ title: 'Event not found', variant: 'destructive' });
        navigate('/events');
      } finally { setLoading(false); }
    })();
  }, [slug, navigate, isPreview]);

  const setTicketQty = (id, delta) => setQty((p) => ({ ...p, [id]: Math.max(0, (p[id] || 0) + delta) }));

  const items = event ? (event.ticket_types || []).filter((t) => (qty[t.id] || 0) > 0)
    .map((t) => ({ ticket_type_id: t.id, quantity: qty[t.id], price: t.price, name: t.name })) : [];
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const ticketCount = items.reduce((s, it) => s + it.quantity, 0);

  const handleRegister = async () => {
    if (ticketCount === 0) { toast({ title: 'Select at least one ticket', variant: 'destructive' }); return; }
    if (!buyer.buyer_name.trim() || !buyer.buyer_email.trim()) { toast({ title: 'Name and email required', variant: 'destructive' }); return; }
    for (const f of event.custom_form_fields || []) {
      if (f.required && !formData[f.label]) { toast({ title: `"${f.label}" is required`, variant: 'destructive' }); return; }
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/api/public/events/${slug}/register`, {
        ...buyer,
        items: items.map((it) => ({ ticket_type_id: it.ticket_type_id, quantity: it.quantity })),
        custom_form_data: formData,
      });
      if (res.data.status === 'completed') {
        const pay = res.data.payment_link ? `&pay=${encodeURIComponent(res.data.payment_link)}` : '';
        navigate(`/events/confirmation?order=${res.data.order_id}${pay}`);
      } else if (res.data.status === 'pending_payment' && res.data.approval_url) {
        window.location.href = res.data.approval_url;
      }
    } catch (e) {
      toast({ title: 'Registration failed', description: e.response?.data?.detail || 'Please try again', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const handleShare = async () => {
    const url = window.location.href.split('?')[0];
    if (navigator.share) {
      try { await navigator.share({ title: event.title, url }); return; } catch { /* fall through */ }
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); toast({ title: 'Link copied!' }); } catch { /* ignore */ }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0c]"><Header /><div className="flex items-center justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div></div>;
  if (!event) return null;

  const cover = event.banner_url || event.ticket_background_url || (event.images && event.images[0]);
  const venue = event.venue;
  const salesEnded = ['ended', 'cancelled'].includes(event.status);
  const hasTickets = (event.ticket_types || []).length > 0;
  const soldOut = hasTickets && (event.ticket_types || []).every((t) => t.quantity > 0 && (t.sold || 0) >= t.quantity);
  const canBuy = !salesEnded && hasTickets && !soldOut;
  const mapQuery = venue ? [venue.address, venue.city, venue.state, venue.zip_code].filter(Boolean).join(', ') : '';
  const mapUrl = venue?.map_url || (mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null);
  const descLong = (event.description || '').length > 320;
  const descText = showFull || !descLong ? event.description : `${event.description.slice(0, 320)}...`;

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-white" data-testid="event-detail-page">
      {/* ambient backdrop from poster */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        {cover && <img src={cover} alt="" className="h-full w-full scale-110 object-cover opacity-25 blur-3xl" />}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/70 via-[#0a0a0c]/90 to-[#0a0a0c]" />
      </div>

      <div className="relative z-10">
        <Header />
        {isPreview && (
          <div className="fixed left-0 right-0 top-16 z-40 bg-amber-500 py-1.5 text-center text-xs font-bold text-black" data-testid="preview-banner">
            PREVIEW MODE — not visible to the public unless status is On Sale or Live.
          </div>
        )}

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-40 pt-28 lg:grid-cols-[minmax(0,360px)_1fr] lg:pt-32">
          {/* LEFT */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              {cover ? <img src={cover} alt={event.title} className="aspect-square w-full object-cover" data-testid="event-poster" />
                : <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-purple-900 to-fuchsia-900"><CalendarDays className="h-16 w-16 text-white/30" /></div>}
            </div>
            {venue && (
              <div className="mt-6">
                <h2 className="text-2xl font-bold" data-testid="venue-name">{venue.name}</h2>
                <p className="mt-1 text-sm text-white/50">{[venue.address, venue.city, venue.state, venue.zip_code].filter(Boolean).join(', ')}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => setVenueOpen(true)} className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/15" data-testid="venue-info-btn">Venue Info</button>
                  {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/15" data-testid="open-maps-btn"><MapIcon className="h-4 w-4" /> Open in maps</a>}
                </div>
                {mapQuery && (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-white/10" data-testid="venue-map">
                    <iframe
                      title="Venue location"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                      width="100%" height="220" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            )}
            <button onClick={handleShare} className="mt-6 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white" data-testid="share-event-btn">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />} Share Event
            </button>
          </div>

          {/* RIGHT */}
          <div className="min-w-0">
            {salesEnded && (
              <div className="mb-8 rounded-2xl bg-[#7f1d1d] px-6 py-8 text-center" data-testid="availability-banner">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200/90">Ticket Sales {event.status === 'cancelled' ? 'Cancelled' : 'Ended'}</p>
                <p className="mt-3 text-2xl font-medium text-red-100">Tickets are no longer available</p>
              </div>
            )}
            {!salesEnded && soldOut && (
              <div className="mb-8 rounded-2xl bg-[#7f1d1d] px-6 py-8 text-center" data-testid="availability-banner">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200/90">Sold Out</p>
                <p className="mt-3 text-2xl font-medium text-red-100">This event is fully booked</p>
              </div>
            )}

            {event.category?.name && <p className="text-lg text-white/55" data-testid="category-label">{event.category.name}</p>}
            <h1 className="mt-1 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl" data-testid="event-title">{event.title}</h1>

            {event.start_datetime && (
              <div className="mt-6 flex items-center gap-3 text-xl font-medium" data-testid="event-date">
                <CalendarDays className="h-5 w-5 text-white/50" /> {fmtDate(event.start_datetime)}
              </div>
            )}

            {event.description && (
              <div className="mt-8" data-testid="event-description">
                <h2 className="text-2xl font-bold">Description</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-white/75">{descText}</p>
                {descLong && (
                  <button onClick={() => setShowFull((s) => !s)} className="mt-2 text-sm font-medium text-white/90 underline-offset-2 hover:underline" data-testid="read-more-btn">
                    {showFull ? 'Read less' : 'Read more'} ▾
                  </button>
                )}
              </div>
            )}

            {(event.age_limit || event.refund_policy || event.additional_info) && (
              <>
                <div className="my-8 border-t border-white/10" />
                <div data-testid="event-information">
                  <h2 className="mb-5 text-2xl font-bold">Event Information</h2>
                  <div className="space-y-5">
                    {event.age_limit && (
                      <div className="flex gap-3" data-testid="info-age-limit">
                        <UserRound className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/50" />
                        <div><p className="font-semibold">Age Limit</p><p className="text-sm text-white/65">{event.age_limit}</p></div>
                      </div>
                    )}
                    {event.refund_policy && (
                      <div className="flex gap-3" data-testid="info-refund-policy">
                        <ReceiptText className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/50" />
                        <div><p className="font-semibold">Refund Policy</p><p className="whitespace-pre-line text-sm text-white/65">{event.refund_policy}</p></div>
                      </div>
                    )}
                    {event.additional_info && (
                      <div className="flex gap-3" data-testid="info-additional">
                        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/50" />
                        <div><p className="font-semibold">Additional Information</p><p className="whitespace-pre-line text-sm text-white/65">{event.additional_info}</p></div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Footer />
      </div>

      {/* Sticky bottom Buy bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0a0c]/90 backdrop-blur-md" data-testid="buy-tickets-bar">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-6 py-4 sm:justify-between">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">{event.title}</p>
            <p className="text-xs text-white/50">{fmtDate(event.start_datetime)}{venue ? ` · ${venue.name}` : ''}</p>
          </div>
          <button
            onClick={() => canBuy && setBuyOpen(true)}
            disabled={!canBuy}
            className={`w-auto min-w-[220px] rounded-xl px-8 py-3 text-sm font-bold transition sm:ml-auto sm:min-w-0 ${canBuy ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:opacity-90' : 'cursor-not-allowed bg-white/10 text-white/40'}`}
            data-testid="buy-tickets-btn"
          >
            {salesEnded ? 'Sales Ended' : soldOut ? 'Sold Out' : !hasTickets ? 'Unavailable' : 'Buy Tickets'}
          </button>
        </div>
      </div>

      {/* Venue modal */}
      <AnimatePresence>
        {venueOpen && venue && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setVenueOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#141417]" onClick={(e) => e.stopPropagation()} data-testid="venue-modal">
              {venue.images?.[0] && <img src={venue.images[0]} alt={venue.name} className="h-44 w-full object-cover" />}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold">{venue.name}</h3>
                  <button onClick={() => setVenueOpen(false)}><X className="h-5 w-5 text-white/50" /></button>
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-white/60"><MapPin className="h-4 w-4" />{[venue.address, venue.city, venue.state, venue.zip_code].filter(Boolean).join(', ')}</p>
                {venue.capacity > 0 && <p className="mt-2 text-sm text-white/60">Capacity: {venue.capacity}</p>}
                {venue.description && <p className="mt-3 text-sm text-white/70">{venue.description}</p>}
                {mapQuery && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                    <iframe title="Venue map" src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`} width="100%" height="200" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  </div>
                )}
                {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold">Open in maps</a>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy Tickets bottom sheet */}
      <AnimatePresence>
        {buyOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70" onClick={() => setBuyOpen(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.25}
              onDragEnd={(e, info) => { if (info.offset.y > 120) setBuyOpen(false); }}
              className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141417] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()} data-testid="ticket-modal"
            >
              <div className="flex justify-center pt-3" data-testid="sheet-handle"><div className="h-1.5 w-12 rounded-full bg-white/25" /></div>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#141417] px-6 py-3">
                <h3 className="flex items-center gap-2 text-lg font-bold"><Ticket className="h-5 w-5 text-purple-400" /> Get Tickets</h3>
                <button onClick={() => setBuyOpen(false)} data-testid="ticket-modal-close"><X className="h-5 w-5 text-white/50" /></button>
              </div>
              <div className="space-y-5 p-6" data-testid="ticket-selector">
                {/* tickets */}
                <div className="space-y-3">
                  {event.ticket_types.map((t) => {
                    const remaining = t.quantity > 0 ? Math.max(0, t.quantity - (t.sold || 0)) : null;
                    const out = remaining === 0;
                    return (
                      <div key={t.id} className="rounded-xl border border-white/10 bg-[#0f0f12] p-4" data-testid={`ticket-option-${t.id}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{t.name}</p>
                            <p className="text-sm text-purple-300">{t.price === 0 ? 'Free' : fmtMoney(t.price)}</p>
                            {t.description && <p className="mt-0.5 text-xs text-white/40">{t.description}</p>}
                            {remaining !== null && <p className="mt-0.5 text-xs text-white/40">{out ? 'Sold out' : `${remaining} left`}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setTicketQty(t.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10" data-testid={`qty-minus-${t.id}`}><Minus className="h-4 w-4" /></button>
                            <span className="w-6 text-center font-semibold" data-testid={`qty-value-${t.id}`}>{qty[t.id] || 0}</span>
                            <button disabled={out} onClick={() => setTicketQty(t.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40" data-testid={`qty-plus-${t.id}`}><Plus className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* buyer */}
                <div data-testid="registration-form">
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/60">Your Information</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input className={inputCls} placeholder="Full name *" value={buyer.buyer_name} onChange={(e) => setBuyer({ ...buyer, buyer_name: e.target.value })} data-testid="buyer-name-input" />
                    <input className={inputCls} placeholder="Email *" value={buyer.buyer_email} onChange={(e) => setBuyer({ ...buyer, buyer_email: e.target.value })} data-testid="buyer-email-input" />
                    <input className={`${inputCls} sm:col-span-2`} placeholder="Phone (optional)" value={buyer.buyer_phone} onChange={(e) => setBuyer({ ...buyer, buyer_phone: e.target.value })} data-testid="buyer-phone-input" />
                  </div>
                  {(event.custom_form_fields || []).length > 0 && (
                    <div className="mt-4 space-y-3">
                      {event.custom_form_fields.map((f) => (
                        <div key={f.id}>
                          <label className="mb-1 block text-xs font-medium text-white/50">{f.label}{f.required && ' *'}</label>
                          {f.type === 'textarea' ? (
                            <textarea rows={3} className={inputCls} value={formData[f.label] || ''} onChange={(e) => setFormData({ ...formData, [f.label]: e.target.value })} data-testid={`custom-field-${f.id}`} />
                          ) : f.type === 'select' ? (
                            <select className={inputCls} value={formData[f.label] || ''} onChange={(e) => setFormData({ ...formData, [f.label]: e.target.value })} data-testid={`custom-field-${f.id}`}>
                              <option value="">Select...</option>
                              {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : f.type === 'checkbox' ? (
                            <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" className="h-4 w-4 accent-purple-600" checked={!!formData[f.label]} onChange={(e) => setFormData({ ...formData, [f.label]: e.target.checked })} data-testid={`custom-field-${f.id}`} /> Yes</label>
                          ) : (
                            <input type={f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'} className={inputCls} placeholder={f.placeholder} value={formData[f.label] || ''} onChange={(e) => setFormData({ ...formData, [f.label]: e.target.value })} data-testid={`custom-field-${f.id}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="sticky bottom-0 border-t border-white/10 bg-[#141417] px-6 py-4" data-testid="sheet-footer">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-white/50">Total</span>
                  <span className="text-2xl font-black" data-testid="cart-total">{total === 0 ? (ticketCount > 0 ? 'Free' : '$0.00') : fmtMoney(total)}</span>
                </div>
                <button onClick={handleRegister} disabled={submitting || ticketCount === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3.5 text-sm font-bold shadow-lg shadow-purple-900/40 transition hover:opacity-90 disabled:opacity-50" data-testid="register-submit-btn">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {ticketCount === 0 ? 'Select tickets' : total > 0 ? 'Continue to PayPal' : 'Get Tickets'}
                </button>
                <p className="mt-2 text-center text-xs text-white/40">Tickets with a QR code are emailed to you instantly.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetailPage;
