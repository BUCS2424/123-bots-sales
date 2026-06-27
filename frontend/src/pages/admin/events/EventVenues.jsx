import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Pencil, MapPin, Loader2, X, Upload } from 'lucide-react';
import { eventApi, uploadEventImage } from './eventApi';
import { toast } from '../../../hooks/use-toast';

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#0f0a1a] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50';
const empty = { name: '', address: '', city: '', state: '', zip_code: '', country: 'USA', capacity: 0, description: '', map_url: '', images: [] };

const EventVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => { setLoading(true); eventApi.listVenues().then((r) => setVenues(r.data || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(load, []);

  const save = async () => {
    if (!modal.name?.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    const payload = { ...modal, capacity: Number(modal.capacity) || 0 };
    try {
      if (modal.id) await eventApi.updateVenue(modal.id, payload);
      else await eventApi.createVenue(payload);
      toast({ title: modal.id ? 'Venue updated' : 'Venue created' });
      setModal(null); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const del = async (id, name) => { if (!window.confirm(`Delete venue "${name}"?`)) return; await eventApi.deleteVenue(id); toast({ title: 'Deleted' }); load(); };

  const upload = async (file) => {
    if (!file) return; setUploading(true);
    try { const url = await uploadEventImage(file); setModal((m) => ({ ...m, images: [...(m.images || []), url] })); }
    catch { toast({ title: 'Upload failed', variant: 'destructive' }); } finally { setUploading(false); }
  };

  return (
    <div className="-m-4 min-h-screen bg-[#0b0712] p-5 text-white lg:-m-6 lg:p-8" data-testid="event-venues-page">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Venues / Locations</h1>
          <p className="text-sm text-white/40">{venues.length} venues</p>
        </div>
        <button onClick={() => setModal({ ...empty })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold" data-testid="add-venue-btn">
          <Plus className="h-4 w-4" /> Add Venue
        </button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-purple-400" /></div>
        : venues.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#150f22] py-16 text-center text-white/40" data-testid="venues-empty">No venues yet.</div>
        : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {venues.map((v) => (
              <div key={v.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#150f22]" data-testid={`venue-${v.id}`}>
                <div className="h-28 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/30">
                  {v.images?.[0] ? <img src={v.images[0]} alt={v.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/20"><MapPin className="h-8 w-8" /></div>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold">{v.name}</p>
                      <p className="text-xs text-white/40">{[v.city, v.state].filter(Boolean).join(', ') || 'No location'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setModal({ ...v })} className="rounded-lg p-2 text-white/60 hover:bg-white/10" data-testid={`venue-edit-${v.id}`}><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => del(v.id, v.name)} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10" data-testid={`venue-delete-${v.id}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/50">Capacity: {v.capacity || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      {modal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/60 p-4" onClick={() => setModal(null)}>
          <div className="my-8 w-full max-w-lg rounded-2xl border border-white/10 bg-[#150f22] p-6 text-white" onClick={(e) => e.stopPropagation()} data-testid="venue-modal">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><MapPin className="h-5 w-5 text-purple-300" /> {modal.id ? 'Edit' : 'New'} Venue</h2>
              <button onClick={() => setModal(null)}><X className="h-5 w-5 text-white/50" /></button>
            </div>
            <div className="space-y-3">
              <input className={inputCls} placeholder="Venue name *" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} data-testid="venue-name-input" />
              <input className={inputCls} placeholder="Address" value={modal.address} onChange={(e) => setModal({ ...modal, address: e.target.value })} />
              <div className="grid grid-cols-3 gap-3">
                <input className={inputCls} placeholder="City" value={modal.city} onChange={(e) => setModal({ ...modal, city: e.target.value })} />
                <input className={inputCls} placeholder="State" value={modal.state} onChange={(e) => setModal({ ...modal, state: e.target.value })} />
                <input className={inputCls} placeholder="Zip" value={modal.zip_code} onChange={(e) => setModal({ ...modal, zip_code: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className={inputCls} placeholder="Capacity" value={modal.capacity} onChange={(e) => setModal({ ...modal, capacity: e.target.value })} />
                <input className={inputCls} placeholder="Map URL" value={modal.map_url} onChange={(e) => setModal({ ...modal, map_url: e.target.value })} />
              </div>
              <textarea rows={2} className={inputCls} placeholder="Description" value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} />
              <div className="flex flex-wrap items-center gap-2">
                {(modal.images || []).map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="h-14 w-14 rounded object-cover" />
                    <button onClick={() => setModal({ ...modal, images: modal.images.filter((_, idx) => idx !== i) })} className="absolute -right-1 -top-1 rounded-full bg-black p-0.5 text-red-300"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <button onClick={() => fileRef.current?.click()} className="flex h-14 w-14 items-center justify-center rounded border border-dashed border-white/20 text-white/40" data-testid="venue-image-upload">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
              </div>
              <button onClick={save} className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-2.5 text-sm font-semibold" data-testid="venue-save-btn">Save Venue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventVenues;
