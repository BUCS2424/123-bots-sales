import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Users, Search, CheckCircle2, Plus, Trash2, Loader2, X, QrCode, Ticket, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { eventApi } from './eventApi';
import { toast } from '../../../hooks/use-toast';

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#0f0a1a] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50';

const EventAttendees = () => {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => { eventApi.listEvents().then((r) => setEvents(r.data || [])).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (eventId) params.event_id = eventId;
      if (search) params.search = search;
      const r = await eventApi.listAttendees(params);
      setAttendees(r.data || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); } finally { setLoading(false); }
  }, [eventId, search]);
  useEffect(() => { load(); }, [load]);

  const checkin = async (id) => {
    try {
      const r = await eventApi.checkinAttendee(id);
      toast({ title: r.data.already ? 'Already checked in' : 'Checked in ✓' });
      load();
    } catch (e) { toast({ title: 'Error', description: e.response?.data?.detail, variant: 'destructive' }); }
  };

  const del = async (id) => { if (!window.confirm('Remove this attendee?')) return; await eventApi.deleteAttendee(id); load(); };

  const addAttendee = async () => {
    if (!addModal.name?.trim() || !addModal.email?.trim()) { toast({ title: 'Name & email required', variant: 'destructive' }); return; }
    try { await eventApi.createAttendee(addModal); toast({ title: 'Attendee added' }); setAddModal(null); load(); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const doVerify = async (codeArg) => {
    const code = (codeArg || verifyCode).trim();
    if (!code) return;
    setVerifyCode(code);
    try { const r = await eventApi.verifyTicket(code); setVerifyResult({ ok: true, ...r.data }); }
    catch { setVerifyResult({ ok: false }); }
  };

  const stopScan = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    const start = async () => {
      try {
        const html5 = new Html5Qrcode('event-qr-reader');
        scannerRef.current = html5;
        await html5.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          async (decodedText) => {
            await stopScan();
            doVerify(decodedText);
          },
          () => {}
        );
        if (cancelled) await stopScan();
      } catch (e) {
        toast({ title: 'Camera error', description: 'Could not start camera. Use manual entry.', variant: 'destructive' });
        setScanning(false);
      }
    };
    start();
    return () => { cancelled = true; };
  }, [scanning, stopScan]); // eslint-disable-line

  useEffect(() => () => { stopScan(); }, [stopScan]);

  const statusBadge = (s) => {
    if (s === 'checked_in') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (s === 'cancelled') return 'bg-red-500/15 text-red-300 border-red-500/30';
    return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  };

  const selectedEvent = events.find((e) => e.id === eventId);

  return (
    <div className="-m-4 min-h-screen bg-[#0b0712] p-5 text-white lg:-m-6 lg:p-8" data-testid="event-attendees-page">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Attendees</h1>
          <p className="text-sm text-white/40">{attendees.length} attendee{attendees.length !== 1 ? 's' : ''}{selectedEvent ? ` · ${selectedEvent.title}` : ' · all events'}</p>
        </div>
        <button onClick={() => setAddModal({ event_id: eventId || '', name: '', email: '', phone: '', ticket_type_id: '', quantity: 1, amount_paid: 0 })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold" data-testid="add-attendee-btn">
          <Plus className="h-4 w-4" /> Add Attendee
        </button>
      </div>

      {/* Door check-in / verify box */}
      <div className="mb-6 rounded-2xl border border-purple-500/20 bg-[#150f22] p-5" data-testid="door-verify-box">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70"><QrCode className="h-4 w-4 text-purple-300" /> Door Check-In — Verify Ticket Code</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input className={`${inputCls} flex-1`} placeholder="Scan or type ticket code (e.g. EVT-XXXX-XX)" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doVerify()} data-testid="verify-code-input" />
          <button onClick={() => doVerify()} className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold hover:bg-purple-500" data-testid="verify-btn">Verify</button>
          <button onClick={() => (scanning ? stopScan() : setScanning(true))} className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200 hover:bg-purple-500/20" data-testid="scan-toggle-btn">
            <Camera className="h-4 w-4" /> {scanning ? 'Stop' : 'Scan QR'}
          </button>
        </div>
        {scanning && (
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black" data-testid="qr-scanner">
            <div id="event-qr-reader" className="mx-auto w-full max-w-sm" />
          </div>
        )}
        {verifyResult && (
          <div className={`mt-3 rounded-xl border p-4 ${verifyResult.ok ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'}`} data-testid="verify-result">
            {verifyResult.ok ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-200">{verifyResult.name} — {verifyResult.event_title}</p>
                  <p className="text-xs text-white/60">{verifyResult.ticket_type_name || 'Ticket'} · Status: {verifyResult.status}</p>
                </div>
                {verifyResult.status !== 'checked_in' ? (
                  <button onClick={() => { checkin(verifyResult.id); setVerifyResult({ ...verifyResult, status: 'checked_in' }); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500" data-testid="verify-checkin-btn">Allow & Check In</button>
                ) : <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200">Already Checked In</span>}
              </div>
            ) : <p className="font-semibold text-red-200">❌ Invalid ticket code — not found.</p>}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="rounded-xl border border-white/10 bg-[#150f22] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/50" data-testid="attendees-event-filter">
          <option value="">All events</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, code..." className="w-full rounded-xl border border-white/10 bg-[#150f22] py-2.5 pl-9 pr-3 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50" data-testid="attendees-search" />
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-purple-400" /></div>
        : attendees.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#150f22] py-16 text-center text-white/40" data-testid="attendees-empty">No attendees found.</div>
        : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#150f22]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase text-white/40">
                    <th className="p-4">Attendee</th>
                    <th className="p-4">Event</th>
                    <th className="p-4">Ticket</th>
                    <th className="p-4">Code</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a) => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]" data-testid={`attendee-row-${a.id}`}>
                      <td className="p-4"><p className="font-medium">{a.name}</p><p className="text-xs text-white/40">{a.email}</p></td>
                      <td className="p-4 text-white/70">{a.event_title}</td>
                      <td className="p-4 text-white/70">{a.ticket_type_name || '—'}</td>
                      <td className="p-4"><span className="rounded bg-white/5 px-2 py-1 font-mono text-xs">{a.ticket_code}</span></td>
                      <td className="p-4"><span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusBadge(a.status)}`}>{a.status.replace('_', ' ')}</span></td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {a.status !== 'checked_in' && (
                            <button onClick={() => checkin(a.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/20 px-2.5 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-600/30" data-testid={`checkin-${a.id}`}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Check In
                            </button>
                          )}
                          <button onClick={() => del(a.id)} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10" data-testid={`attendee-delete-${a.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {addModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={() => setAddModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#150f22] p-6 text-white" onClick={(e) => e.stopPropagation()} data-testid="add-attendee-modal">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Ticket className="h-5 w-5 text-purple-300" /> Add Attendee</h2>
              <button onClick={() => setAddModal(null)}><X className="h-5 w-5 text-white/50" /></button>
            </div>
            <div className="space-y-3">
              <select className={inputCls} value={addModal.event_id} onChange={(e) => setAddModal({ ...addModal, event_id: e.target.value, ticket_type_id: '' })} data-testid="add-attendee-event">
                <option value="">Select event *</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
              {(() => {
                const ev = events.find((e) => e.id === addModal.event_id);
                return ev?.ticket_types?.length ? (
                  <select className={inputCls} value={addModal.ticket_type_id} onChange={(e) => setAddModal({ ...addModal, ticket_type_id: e.target.value })}>
                    <option value="">Select ticket type</option>
                    {ev.ticket_types.map((t) => <option key={t.id} value={t.id}>{t.name} (${t.price})</option>)}
                  </select>
                ) : null;
              })()}
              <input className={inputCls} placeholder="Full name *" value={addModal.name} onChange={(e) => setAddModal({ ...addModal, name: e.target.value })} data-testid="add-attendee-name" />
              <input className={inputCls} placeholder="Email *" value={addModal.email} onChange={(e) => setAddModal({ ...addModal, email: e.target.value })} data-testid="add-attendee-email" />
              <input className={inputCls} placeholder="Phone" value={addModal.phone} onChange={(e) => setAddModal({ ...addModal, phone: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className={inputCls} placeholder="Quantity" value={addModal.quantity} onChange={(e) => setAddModal({ ...addModal, quantity: Number(e.target.value) })} />
                <input type="number" className={inputCls} placeholder="Amount paid" value={addModal.amount_paid} onChange={(e) => setAddModal({ ...addModal, amount_paid: Number(e.target.value) })} />
              </div>
              <button onClick={addAttendee} className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-2.5 text-sm font-semibold" data-testid="add-attendee-save">Add Attendee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAttendees;
