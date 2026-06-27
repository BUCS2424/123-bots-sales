import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, Upload, Loader2, Image as ImageIcon,
  Ticket as TicketIcon, ListChecks, GripVertical, QrCode, ExternalLink,
} from 'lucide-react';
import { eventApi, uploadEventImage, fmtMoneyFull } from './eventApi';
import { toast } from '../../../hooks/use-toast';

const FIELD_TYPES = ['text', 'textarea', 'email', 'phone', 'number', 'select', 'checkbox'];
const newId = () => Math.random().toString(36).slice(2, 10);

const emptyEvent = {
  title: '', short_description: '', description: '', category_id: '', venue_id: '',
  status: 'draft', start_datetime: '', end_datetime: '', timezone: 'America/Denver',
  banner_url: '', images: [], ticket_background_url: '', ticket_tagline: 'PREPARE YOURSELF',
  ticket_types: [], custom_form_fields: [], capacity: 0, is_featured: false,
  seo_title: '', seo_description: '', age_limit: '', refund_policy: '', additional_info: '',
};

// ---- Live concert-style ticket preview ----
const TicketPreview = ({ data, venue }) => {
  const price = (data.ticket_types || [])[0]?.price ?? 0;
  const dateStr = data.start_datetime ? new Date(data.start_datetime) : null;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl" data-testid="ticket-preview">
      <div className="relative aspect-[16/9] w-full bg-black">
        {data.ticket_background_url ? (
          <img src={data.ticket_background_url} alt="ticket bg" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-fuchsia-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />
        {/* QR top-left */}
        <div className="absolute left-4 top-4 flex h-16 w-16 items-center justify-center rounded bg-white/95">
          <QrCode className="h-12 w-12 text-black" />
        </div>
        {/* Admit one + price */}
        <div className="absolute right-5 top-5 text-right text-white">
          <p className="text-lg font-light tracking-[0.2em]">ADMIT ONE</p>
          <p className="text-2xl font-bold">{fmtMoneyFull(price)}</p>
        </div>
        {/* bottom title */}
        <div className="absolute bottom-4 left-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">{data.ticket_tagline || 'PREPARE YOURSELF'}</p>
          <h3 className="max-w-[60%] text-2xl font-black uppercase leading-tight">{data.title || 'Event Title'}</h3>
        </div>
        {/* details bottom right */}
        <div className="absolute bottom-4 right-5 grid grid-cols-3 gap-3 text-right text-white">
          <div>
            <p className="text-[9px] uppercase text-white/50">Date</p>
            <p className="text-xs font-medium">{dateStr ? dateStr.toLocaleDateString() : '--'}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase text-white/50">Time</p>
            <p className="text-xs font-medium">{dateStr ? dateStr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase text-white/50">Venue</p>
            <p className="truncate text-xs font-medium">{venue?.name || '--'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon: Icon, children, testid }) => (
  <div className="rounded-2xl border border-white/10 bg-[#150f22] p-5" data-testid={testid}>
    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
      {Icon && <Icon className="h-4 w-4 text-purple-300" />} {title}
    </h2>
    {children}
  </div>
);

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#0f0a1a] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50';
const labelCls = 'mb-1.5 block text-xs font-medium text-white/60';

const EventEditor = ({ eventId }) => {
  const isNew = !eventId || eventId === 'new';
  const navigate = useNavigate();
  const [data, setData] = useState(emptyEvent);
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState('');
  const ticketBgRef = useRef(null);
  const bannerRef = useRef(null);

  const set = (k, v) => setData((p) => ({ ...p, [k]: v }));

  const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  };

  useEffect(() => {
    Promise.all([eventApi.listCategories(), eventApi.listVenues()])
      .then(([c, v]) => { setCategories(c.data || []); setVenues(v.data || []); })
      .catch(() => {});
    if (!isNew) {
      eventApi.getEvent(eventId)
        .then((r) => {
          const ev = r.data;
          setData({
            ...emptyEvent, ...ev,
            category_id: ev.category_id || '', venue_id: ev.venue_id || '',
            start_datetime: toLocalInput(ev.start_datetime), end_datetime: toLocalInput(ev.end_datetime),
          });
        })
        .catch(() => toast({ title: 'Error', description: 'Failed to load event', variant: 'destructive' }))
        .finally(() => setLoading(false));
    }
  }, [eventId, isNew]);

  const handleUpload = async (file, key) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      const url = await uploadEventImage(file);
      if (key === 'gallery') set('images', [...(data.images || []), url]);
      else set(key, url);
      toast({ title: 'Image uploaded' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploadingKey('');
    }
  };

  const onDrop = useCallback((e, key) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file, key);
  }, [data]); // eslint-disable-line

  // ticket types
  const addTicket = () => set('ticket_types', [...data.ticket_types, { id: newId(), name: '', price: 0, quantity: 0, description: '', is_active: true, currency: 'USD', sold: 0 }]);
  const updTicket = (id, patch) => set('ticket_types', data.ticket_types.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const delTicket = (id) => set('ticket_types', data.ticket_types.filter((t) => t.id !== id));

  // custom form fields
  const addField = () => set('custom_form_fields', [...data.custom_form_fields, { id: newId(), label: '', type: 'text', required: false, placeholder: '', options: [] }]);
  const updField = (id, patch) => set('custom_form_fields', data.custom_form_fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const delField = (id) => set('custom_form_fields', data.custom_form_fields.filter((f) => f.id !== id));

  const handleSave = async () => {
    if (!data.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      ...data,
      category_id: data.category_id || null,
      venue_id: data.venue_id || null,
      capacity: Number(data.capacity) || 0,
      start_datetime: data.start_datetime ? new Date(data.start_datetime).toISOString() : null,
      end_datetime: data.end_datetime ? new Date(data.end_datetime).toISOString() : null,
      ticket_types: data.ticket_types.map((t) => ({ ...t, price: Number(t.price) || 0, quantity: Number(t.quantity) || 0 })),
    };
    try {
      if (isNew) {
        const r = await eventApi.createEvent(payload);
        toast({ title: 'Event created' });
        navigate(`/admin/events/${r.data.id}`);
      } else {
        await eventApi.updateEvent(eventId, payload);
        toast({ title: 'Event saved' });
      }
    } catch (e) {
      toast({ title: 'Error', description: e.response?.data?.detail || 'Failed to save event', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="-m-4 flex min-h-[80vh] items-center justify-center bg-[#0b0712] lg:-m-6"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>;
  }

  const selectedVenue = venues.find((v) => v.id === data.venue_id);

  return (
    <div className="-m-4 min-h-screen bg-[#0b0712] p-5 text-white lg:-m-6 lg:p-8" data-testid="event-editor">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate('/admin/events/list')} className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white" data-testid="editor-back-btn">
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </button>
        <div className="flex items-center gap-3">
          {!isNew && data.slug && (
            <a href={`/events/${data.slug}?preview=1`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10" data-testid="editor-preview-btn">
              <ExternalLink className="h-4 w-4" /> Preview Live Page
            </a>
          )}
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-purple-900/40 transition hover:opacity-90 disabled:opacity-50" data-testid="editor-save-btn">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isNew ? 'Create Event' : 'Save Changes'}
          </button>
        </div>
      </div>

      <h1 className="mb-6 text-2xl font-black tracking-tight">{isNew ? 'Create An Event' : data.title || 'Edit Event'}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Basic info */}
          <Section title="Event Details" testid="section-details">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Event Title *</label>
                <input className={inputCls} value={data.title} onChange={(e) => set('title', e.target.value)} placeholder="Neon Frequencies Festival" data-testid="event-title-input" />
              </div>
              <div>
                <label className={labelCls}>Short Description</label>
                <input className={inputCls} value={data.short_description} onChange={(e) => set('short_description', e.target.value)} placeholder="One-line summary shown on cards" data-testid="event-short-desc-input" />
              </div>
              <div>
                <label className={labelCls}>Full Description</label>
                <textarea rows={4} className={inputCls} value={data.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell attendees what to expect..." data-testid="event-desc-input" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={data.category_id} onChange={(e) => set('category_id', e.target.value)} data-testid="event-category-select">
                    <option value="">— None —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Venue / Location</label>
                  <select className={inputCls} value={data.venue_id} onChange={(e) => set('venue_id', e.target.value)} data-testid="event-venue-select">
                    <option value="">— None —</option>
                    {venues.map((v) => <option key={v.id} value={v.id}>{v.name}{v.city ? ` — ${v.city}` : ''}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Start Date & Time</label>
                  <input type="datetime-local" className={inputCls} value={data.start_datetime} onChange={(e) => set('start_datetime', e.target.value)} data-testid="event-start-input" />
                </div>
                <div>
                  <label className={labelCls}>End Date & Time</label>
                  <input type="datetime-local" className={inputCls} value={data.end_datetime} onChange={(e) => set('end_datetime', e.target.value)} data-testid="event-end-input" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={data.status} onChange={(e) => set('status', e.target.value)} data-testid="event-status-select">
                    <option value="draft">Draft</option>
                    <option value="on_sale">On Sale</option>
                    <option value="live">Live</option>
                    <option value="ended">Ended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Capacity</label>
                  <input type="number" className={inputCls} value={data.capacity} onChange={(e) => set('capacity', e.target.value)} data-testid="event-capacity-input" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70" data-testid="event-featured-toggle">
                    <input type="checkbox" checked={data.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="h-4 w-4 accent-purple-600" />
                    Featured event
                  </label>
                </div>
              </div>
            </div>
          </Section>

          {/* Ticket types */}
          <Section title="Ticket Types" icon={TicketIcon} testid="section-tickets">
            <div className="space-y-3">
              {data.ticket_types.length === 0 && <p className="text-sm text-white/40">No ticket types yet. Add one below.</p>}
              {data.ticket_types.map((t) => (
                <div key={t.id} className="rounded-xl border border-white/10 bg-[#0f0a1a] p-3" data-testid={`ticket-row-${t.id}`}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <input className={`${inputCls} sm:col-span-4`} placeholder="Ticket name (e.g. General Admission)" value={t.name} onChange={(e) => updTicket(t.id, { name: e.target.value })} data-testid={`ticket-name-${t.id}`} />
                    <input type="number" className={`${inputCls} sm:col-span-3`} placeholder="Price" value={t.price} onChange={(e) => updTicket(t.id, { price: e.target.value })} data-testid={`ticket-price-${t.id}`} />
                    <input type="number" className={`${inputCls} sm:col-span-3`} placeholder="Qty (0=∞)" value={t.quantity} onChange={(e) => updTicket(t.id, { quantity: e.target.value })} data-testid={`ticket-qty-${t.id}`} />
                    <button onClick={() => delTicket(t.id)} className="flex items-center justify-center rounded-lg bg-red-500/10 text-red-300 transition hover:bg-red-500/20 sm:col-span-2" data-testid={`ticket-delete-${t.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addTicket} className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 transition hover:bg-purple-500/20" data-testid="add-ticket-btn">
                <Plus className="h-4 w-4" /> Add Ticket Type
              </button>
            </div>
          </Section>

          {/* Custom registration form */}
          <Section title="Custom Registration Form" icon={ListChecks} testid="section-form">
            <p className="mb-3 text-xs text-white/40">Add custom questions attendees answer when registering.</p>
            <div className="space-y-3">
              {data.custom_form_fields.map((f) => (
                <div key={f.id} className="rounded-xl border border-white/10 bg-[#0f0a1a] p-3" data-testid={`field-row-${f.id}`}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <div className="flex items-center text-white/20 sm:col-span-1"><GripVertical className="h-4 w-4" /></div>
                    <input className={`${inputCls} sm:col-span-4`} placeholder="Question label" value={f.label} onChange={(e) => updField(f.id, { label: e.target.value })} data-testid={`field-label-${f.id}`} />
                    <select className={`${inputCls} sm:col-span-3`} value={f.type} onChange={(e) => updField(f.id, { type: e.target.value })} data-testid={`field-type-${f.id}`}>
                      {FIELD_TYPES.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-xs text-white/60 sm:col-span-2">
                      <input type="checkbox" checked={f.required} onChange={(e) => updField(f.id, { required: e.target.checked })} className="h-4 w-4 accent-purple-600" /> Required
                    </label>
                    <button onClick={() => delField(f.id)} className="flex items-center justify-center rounded-lg bg-red-500/10 text-red-300 transition hover:bg-red-500/20 sm:col-span-2"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {f.type === 'select' && (
                    <input className={`${inputCls} mt-2`} placeholder="Comma-separated options (e.g. Small, Medium, Large)" value={(f.options || []).join(', ')} onChange={(e) => updField(f.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} data-testid={`field-options-${f.id}`} />
                  )}
                </div>
              ))}
              <button onClick={addField} className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 transition hover:bg-purple-500/20" data-testid="add-field-btn">
                <Plus className="h-4 w-4" /> Add Form Field
              </button>
            </div>
          </Section>

          {/* Event information */}
          <Section title="Event Information" icon={ListChecks} testid="section-info">
            <p className="mb-3 text-xs text-white/40">Shown in the "Event Information" area of the public event page.</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Age Limit</label>
                <input className={inputCls} value={data.age_limit} onChange={(e) => set('age_limit', e.target.value)} placeholder="e.g. All Ages, 18+, 21+" data-testid="event-age-limit-input" />
              </div>
              <div>
                <label className={labelCls}>Refund Policy</label>
                <textarea rows={3} className={inputCls} value={data.refund_policy} onChange={(e) => set('refund_policy', e.target.value)} placeholder="e.g. No refunds, exchanges, or transfers on any ticket purchases." data-testid="event-refund-policy-input" />
              </div>
              <div>
                <label className={labelCls}>Additional Information</label>
                <textarea rows={3} className={inputCls} value={data.additional_info} onChange={(e) => set('additional_info', e.target.value)} placeholder="Doors, parking, accessibility, or any other details." data-testid="event-additional-info-input" />
              </div>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Ticket background (drag n drop) */}
          <Section title="Ticket Background" icon={ImageIcon} testid="section-ticket-bg">
            <p className="mb-3 text-xs text-white/40">Drag & drop the background image for the printable / emailed ticket.</p>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, 'ticket_background_url')}
              onClick={() => ticketBgRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-500/30 bg-[#0f0a1a] p-6 text-center transition hover:border-purple-500/60"
              data-testid="ticket-bg-dropzone"
            >
              {uploadingKey === 'ticket_background_url' ? (
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              ) : data.ticket_background_url ? (
                <img src={data.ticket_background_url} alt="ticket bg" className="h-28 w-full rounded-lg object-cover" />
              ) : (
                <>
                  <Upload className="h-7 w-7 text-purple-300" />
                  <p className="text-xs text-white/50">Drop image or click to upload</p>
                </>
              )}
              <input ref={ticketBgRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'ticket_background_url')} data-testid="ticket-bg-input" />
            </div>
            {data.ticket_background_url && (
              <button onClick={() => set('ticket_background_url', '')} className="mt-2 text-xs text-red-300 hover:underline">Remove background</button>
            )}
            <div className="mt-4">
              <label className={labelCls}>Ticket Tagline</label>
              <input className={inputCls} value={data.ticket_tagline} onChange={(e) => set('ticket_tagline', e.target.value)} placeholder="PREPARE YOURSELF" data-testid="ticket-tagline-input" />
            </div>
            <p className="mb-2 mt-4 text-xs font-medium text-white/60">Live Ticket Preview</p>
            <TicketPreview data={data} venue={selectedVenue} />
          </Section>

          {/* Event image */}
          <Section title="Event Image" icon={ImageIcon} testid="section-images">
            <label className={labelCls}>Cover Image</label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, 'banner_url')}
              onClick={() => bannerRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-[#0f0a1a] p-6 text-center transition hover:border-white/30"
              data-testid="banner-dropzone"
            >
              {uploadingKey === 'banner_url' ? <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                : data.banner_url ? <img src={data.banner_url} alt="event" className="h-32 w-full rounded-lg object-cover" />
                : <><Upload className="h-7 w-7 text-purple-300" /><span className="text-xs text-white/50">Drop image or click to upload the event image</span></>}
              <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'banner_url')} data-testid="banner-input" />
            </div>
            {data.banner_url && (
              <button onClick={() => set('banner_url', '')} className="mt-2 text-xs text-red-300 hover:underline" data-testid="remove-banner-btn">Remove image</button>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

export default EventEditor;
