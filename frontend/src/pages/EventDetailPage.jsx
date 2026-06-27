import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Minus, Plus, Loader2, Ticket, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from '../hooks/use-toast';
import { setSeoMetadata } from '../lib/seo';

const API = process.env.REACT_APP_BACKEND_URL;
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const inputCls = 'w-full rounded-lg border border-white/10 bg-[#081420] px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/60';

const EventDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState({});            // ticket_type_id -> qty
  const [buyer, setBuyer] = useState({ buyer_name: '', buyer_email: '', buyer_phone: '' });
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`${API}/api/public/events/${slug}`);
        setEvent(r.data);
        setSeoMetadata({ title: `${r.data.title} | 123Bots Events`, description: r.data.short_description || '' });
      } catch {
        toast({ title: 'Event not found', variant: 'destructive' });
        navigate('/events');
      } finally { setLoading(false); }
    })();
  }, [slug, navigate]);

  const setTicketQty = (id, delta) => setQty((p) => ({ ...p, [id]: Math.max(0, (p[id] || 0) + delta) }));

  const items = event ? (event.ticket_types || []).filter((t) => (qty[t.id] || 0) > 0).map((t) => ({ ticket_type_id: t.id, quantity: qty[t.id], price: t.price, name: t.name })) : [];
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
        navigate(`/events/confirmation?order=${res.data.order_id}`);
      } else if (res.data.status === 'pending_payment' && res.data.approval_url) {
        window.location.href = res.data.approval_url;
      }
    } catch (e) {
      toast({ title: 'Registration failed', description: e.response?.data?.detail || 'Please try again', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#050f17]"><Header /><div className="flex items-center justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div></div>;
  if (!event) return null;

  const cover = event.banner_url || event.ticket_background_url || (event.images && event.images[0]);
  const dt = event.start_datetime ? new Date(event.start_datetime) : null;

  return (
    <div className="min-h-screen bg-[#050f17]" data-testid="event-detail-page">
      <Header />
      {/* Hero */}
      <section className="relative h-[42vh] min-h-[320px] w-full overflow-hidden pt-20">
        {cover ? <img src={cover} alt={event.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-fuchsia-900" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050f17] via-[#050f17]/60 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-8">
          <button onClick={() => navigate('/events')} className="mb-3 inline-flex w-fit items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> All Events</button>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black text-white sm:text-5xl">{event.title}</motion.h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
            {dt && <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-purple-400" />{dt.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            {event.venue && <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-purple-400" />{event.venue.name}{event.venue.city ? `, ${event.venue.city}` : ''}</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 lg:grid-cols-3">
        {/* Left: details + form */}
        <div className="space-y-8 lg:col-span-2">
          {event.description && (
            <div data-testid="event-description">
              <h2 className="mb-3 text-lg font-bold text-white">About This Event</h2>
              <p className="whitespace-pre-line text-slate-300">{event.description}</p>
            </div>
          )}
          {event.venue && (
            <div className="rounded-2xl border border-white/10 bg-[#0a1929] p-5">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-white"><MapPin className="h-5 w-5 text-purple-400" /> Venue</h2>
              <p className="font-medium text-white">{event.venue.name}</p>
              <p className="text-sm text-slate-400">{[event.venue.address, event.venue.city, event.venue.state, event.venue.zip_code].filter(Boolean).join(', ')}</p>
            </div>
          )}

          {/* Registration form */}
          <div className="rounded-2xl border border-white/10 bg-[#0a1929] p-6" data-testid="registration-form">
            <h2 className="mb-4 text-lg font-bold text-white">Your Information</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className={inputCls} placeholder="Full name *" value={buyer.buyer_name} onChange={(e) => setBuyer({ ...buyer, buyer_name: e.target.value })} data-testid="buyer-name-input" />
              <input className={inputCls} placeholder="Email *" value={buyer.buyer_email} onChange={(e) => setBuyer({ ...buyer, buyer_email: e.target.value })} data-testid="buyer-email-input" />
              <input className={`${inputCls} sm:col-span-2`} placeholder="Phone (optional)" value={buyer.buyer_phone} onChange={(e) => setBuyer({ ...buyer, buyer_phone: e.target.value })} data-testid="buyer-phone-input" />
            </div>
            {(event.custom_form_fields || []).length > 0 && (
              <div className="mt-4 space-y-3">
                {event.custom_form_fields.map((f) => (
                  <div key={f.id}>
                    <label className="mb-1 block text-xs font-medium text-slate-400">{f.label}{f.required && ' *'}</label>
                    {f.type === 'textarea' ? (
                      <textarea rows={3} className={inputCls} value={formData[f.label] || ''} onChange={(e) => setFormData({ ...formData, [f.label]: e.target.value })} data-testid={`custom-field-${f.id}`} />
                    ) : f.type === 'select' ? (
                      <select className={inputCls} value={formData[f.label] || ''} onChange={(e) => setFormData({ ...formData, [f.label]: e.target.value })} data-testid={`custom-field-${f.id}`}>
                        <option value="">Select...</option>
                        {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" className="h-4 w-4 accent-purple-600" checked={!!formData[f.label]} onChange={(e) => setFormData({ ...formData, [f.label]: e.target.checked })} data-testid={`custom-field-${f.id}`} /> Yes</label>
                    ) : (
                      <input type={f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'} className={inputCls} placeholder={f.placeholder} value={formData[f.label] || ''} onChange={(e) => setFormData({ ...formData, [f.label]: e.target.value })} data-testid={`custom-field-${f.id}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: ticket selector */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 rounded-2xl border border-white/10 bg-[#0a1929] p-6" data-testid="ticket-selector">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white"><Ticket className="h-5 w-5 text-purple-400" /> Tickets</h2>
            {(event.ticket_types || []).length === 0 ? (
              <p className="text-sm text-slate-400">No tickets available.</p>
            ) : (
              <div className="space-y-3">
                {event.ticket_types.map((t) => (
                  <div key={t.id} className="rounded-xl border border-white/10 bg-[#081420] p-4" data-testid={`ticket-option-${t.id}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{t.name}</p>
                        <p className="text-sm text-purple-300">{t.price === 0 ? 'Free' : fmtMoney(t.price)}</p>
                        {t.description && <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setTicketQty(t.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white hover:bg-white/10" data-testid={`qty-minus-${t.id}`}><Minus className="h-4 w-4" /></button>
                        <span className="w-6 text-center font-semibold text-white" data-testid={`qty-value-${t.id}`}>{qty[t.id] || 0}</span>
                        <button onClick={() => setTicketQty(t.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-500" data-testid={`qty-plus-${t.id}`}><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-slate-400">Total</span>
              <span className="text-2xl font-black text-white" data-testid="cart-total">{total === 0 ? (ticketCount > 0 ? 'Free' : '$0.00') : fmtMoney(total)}</span>
            </div>
            <button onClick={handleRegister} disabled={submitting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/40 transition hover:opacity-90 disabled:opacity-50" data-testid="register-submit-btn">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {total > 0 ? 'Continue to PayPal' : 'Get Tickets'}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">Tickets with a QR code are emailed to you instantly.</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default EventDetailPage;
