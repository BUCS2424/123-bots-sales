import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Pencil, Sparkles, Loader2, X, Upload, Building2, Link2, ShoppingCart, Anchor, Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import { toursChartersApi, uploadTourImage } from './toursChartersApi';
import { toast } from '../../../hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#061a1f] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50';
const emptyActivity = {
  name: '', seller_id: '', category_ids: [], tags: [], images: [],
  description: '', price_display: '', duration: '', booking_type: 'external_link',
  booking_provider: 'generic', booking_url: '', fareharbor_shortname: '', fareharbor_item_pk: '',
};

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSellerModal, setNewSellerModal] = useState(null); // {name, fareharbor_shortname}
  const [viewMode, setViewMode] = useState('block'); // block | list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSellerId, setFilterSellerId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      toursChartersApi.listActivities(),
      toursChartersApi.listSellers(),
      toursChartersApi.listCategories(),
    ]).then(([a, s, c]) => {
      setActivities(a.data || []);
      setSellers(s.data || []);
      setCategories(c.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const uploadImg = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadTourImage(file);
      setModal((m) => ({ ...m, images: [...(m.images || []), url] }));
    } catch { toast({ title: 'Upload failed', variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  const removeImg = (idx) => setModal((m) => ({ ...m, images: m.images.filter((_, i) => i !== idx) }));

  const toggleCategory = (id) => setModal((m) => ({
    ...m,
    category_ids: m.category_ids.includes(id) ? m.category_ids.filter((c) => c !== id) : [...m.category_ids, id],
  }));

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!modal.tags.includes(t)) setModal((m) => ({ ...m, tags: [...m.tags, t] }));
    setTagInput('');
  };
  const removeTag = (t) => setModal((m) => ({ ...m, tags: m.tags.filter((x) => x !== t) }));

  const createQuickSeller = async () => {
    if (!newSellerModal?.name?.trim()) { toast({ title: 'Company name required', variant: 'destructive' }); return; }
    try {
      const res = await toursChartersApi.createSeller({ name: newSellerModal.name.trim(), fareharbor_shortname: (newSellerModal.fareharbor_shortname || '').trim() });
      setSellers((prev) => [...prev, res.data]);
      setModal((m) => ({ ...m, seller_id: res.data.id }));
      setNewSellerModal(null);
      toast({ title: 'Charter company added' });
    } catch (e) { toast({ title: 'Error', description: e.response?.data?.detail, variant: 'destructive' }); }
  };

  const save = async () => {
    if (!modal.name?.trim()) { toast({ title: 'Activity name required', variant: 'destructive' }); return; }
    if (!modal.seller_id) { toast({ title: 'Select a charter company', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (modal.id) await toursChartersApi.updateActivity(modal.id, modal);
      else await toursChartersApi.createActivity(modal);
      toast({ title: modal.id ? 'Activity updated' : 'Activity created' });
      setModal(null); load();
    } catch (e) { toast({ title: 'Error', description: e.response?.data?.detail, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete activity "${name}"?`)) return;
    await toursChartersApi.deleteActivity(id); toast({ title: 'Deleted' }); load();
  };

  const catName = (id) => categories.find((c) => c.id === id)?.name || '';

  const filteredActivities = activities.filter((a) => {
    if (searchQuery.trim() && !a.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    if (filterSellerId && a.seller_id !== filterSellerId) return false;
    if (filterCategoryId && !a.category_ids?.includes(filterCategoryId)) return false;
    return true;
  });
  const hasActiveFilters = searchQuery.trim() || filterSellerId || filterCategoryId;
  const clearFilters = () => { setSearchQuery(''); setFilterSellerId(''); setFilterCategoryId(''); };

  return (
    <div className="-m-4 min-h-screen bg-[#061a1f] p-5 text-white lg:-m-6 lg:p-8" data-testid="activities-page">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black"><Sparkles className="h-6 w-6 text-teal-400" /> Activities</h1>
          <p className="text-sm text-white/40">{filteredActivities.length} of {activities.length} activities across {sellers.length} charter companies</p>
        </div>
        <button onClick={() => { setModal({ ...emptyActivity }); setTagInput(''); }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold" data-testid="add-activity-btn">
          <Plus className="h-4 w-4" /> Add Activity
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2" data-testid="activities-filter-bar">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input className={`${inputCls} pl-9`} placeholder="Search activity name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} data-testid="activities-search-input" />
        </div>
        <select className={`${inputCls} w-auto min-w-[170px]`} value={filterSellerId} onChange={(e) => setFilterSellerId(e.target.value)} data-testid="activities-filter-seller-select">
          <option value="">All Charter Companies</option>
          {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={`${inputCls} w-auto min-w-[160px]`} value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)} data-testid="activities-filter-category-select">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/10" data-testid="activities-clear-filters-btn">
            Clear
          </button>
        )}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1">
          <button onClick={() => setViewMode('block')} className={`rounded p-1.5 ${viewMode === 'block' ? 'bg-teal-500/20 text-teal-300' : 'text-white/40 hover:text-white/70'}`} data-testid="activities-view-block-btn" title="Block view">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`rounded p-1.5 ${viewMode === 'list' ? 'bg-teal-500/20 text-teal-300' : 'text-white/40 hover:text-white/70'}`} data-testid="activities-view-list-btn" title="List view">
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-teal-400" /></div>
        : activities.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-16 text-center text-white/40" data-testid="activities-empty">No activities yet. Add your first one.</div>
        : filteredActivities.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-16 text-center text-white/40" data-testid="activities-filter-empty">No activities match your filters.</div>
        : viewMode === 'list' ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1f24]" data-testid="activities-list-view">
            {filteredActivities.map((a) => (
              <div key={a.id} className="flex items-center gap-4 border-b border-white/5 p-3 last:border-b-0 hover:bg-white/5" data-testid={`activity-row-${a.id}`}>
                <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {a.images?.[0] ? <img src={a.images[0]} alt={a.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/20"><Sparkles className="h-5 w-5" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-white/40"><Building2 className="h-3 w-3" /> {a.seller_name}</p>
                </div>
                <div className="hidden flex-wrap gap-1 sm:flex">
                  {a.category_ids?.slice(0, 2).map((cid) => (
                    <span key={cid} className="rounded-full bg-teal-500/15 px-2 py-0.5 text-xs text-teal-300">{catName(cid)}</span>
                  ))}
                </div>
                <span className="hidden w-28 flex-shrink-0 text-xs text-white/40 md:block">{a.price_display || 'Price TBD'}</span>
                <span className="flex w-28 flex-shrink-0 items-center gap-1 text-xs text-white/40">
                  {a.booking_type === 'native_checkout' ? <ShoppingCart className="h-3 w-3" /> : a.booking_provider === 'fareharbor' ? <Anchor className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                  {a.booking_type === 'native_checkout' ? 'In-App' : a.booking_provider === 'fareharbor' ? 'FareHarbor' : 'External'}
                </span>
                <div className="flex flex-shrink-0 gap-1">
                  <button onClick={() => { setModal({ ...emptyActivity, ...a }); setTagInput(''); }} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10" data-testid={`activity-edit-${a.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => del(a.id, a.name)} className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10" data-testid={`activity-delete-${a.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="activities-block-view">
            {filteredActivities.map((a) => (
              <div key={a.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1f24]" data-testid={`activity-${a.id}`}>
                <div className="h-32 w-full bg-white/5">
                  {a.images?.[0] ? <img src={a.images[0]} alt={a.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/20"><Sparkles className="h-8 w-8" /></div>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{a.name}</p>
                      <p className="flex items-center gap-1 text-xs text-white/40"><Building2 className="h-3 w-3" /> {a.seller_name}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setModal({ ...emptyActivity, ...a }); setTagInput(''); }} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10" data-testid={`activity-edit-${a.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => del(a.id, a.name)} className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10" data-testid={`activity-delete-${a.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {a.category_ids?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {a.category_ids.map((cid) => (
                        <span key={cid} className="rounded-full bg-teal-500/15 px-2 py-0.5 text-xs text-teal-300">{catName(cid)}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                    <span>{a.price_display || 'Price TBD'}</span>
                    <span className="flex items-center gap-1">
                      {a.booking_type === 'native_checkout' ? <ShoppingCart className="h-3 w-3" /> : a.booking_provider === 'fareharbor' ? <Anchor className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                      {a.booking_type === 'native_checkout' ? 'In-App Checkout' : a.booking_provider === 'fareharbor' ? 'FareHarbor' : 'External Booking'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {modal && (
        <Sheet open={!!modal} onOpenChange={(open) => !open && setModal(null)}>
          <SheetContent side="right" className="w-full sm:max-w-xl bg-[#0b1f24] border-white/10 text-white overflow-y-auto" data-testid="activity-modal">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-white"><Sparkles className="h-5 w-5 text-teal-300" /> {modal.id ? 'Edit' : 'New'} Activity</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              <input className={inputCls} placeholder="Activity name (e.g. Sunset Sail)" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} data-testid="activity-name-input" />

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Charter Company (Seller)</label>
                <div className="flex items-center gap-2">
                  <select className={inputCls} value={modal.seller_id} onChange={(e) => setModal({ ...modal, seller_id: e.target.value })} data-testid="activity-seller-select">
                    <option value="">Select company...</option>
                    {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button onClick={() => setNewSellerModal({ name: '', fareharbor_shortname: '' })} className="whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/10" data-testid="activity-add-seller-btn">
                    + New Company
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Categories</label>
                <div className="flex flex-wrap gap-1.5" data-testid="activity-category-checkboxes">
                  {categories.length === 0 && <p className="text-xs text-white/30">No categories yet — add one first from Activity Categories.</p>}
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`rounded-full border px-3 py-1 text-xs ${modal.category_ids.includes(c.id) ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-white/15 text-white/50 hover:border-white/30'}`}
                      data-testid={`activity-category-toggle-${c.id}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <textarea className={inputCls} rows={3} placeholder="Description" value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} data-testid="activity-description-input" />

              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Price display (e.g. $150/person)" value={modal.price_display} onChange={(e) => setModal({ ...modal, price_display: e.target.value })} data-testid="activity-price-input" />
                <input className={inputCls} placeholder="Duration (e.g. 3 hours)" value={modal.duration} onChange={(e) => setModal({ ...modal, duration: e.target.value })} data-testid="activity-duration-input" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Tags</label>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="Add tag and press Enter" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} data-testid="activity-tag-input" />
                  <button onClick={addTag} className="rounded-lg border border-white/10 px-3 text-xs text-white/60 hover:bg-white/10">Add</button>
                </div>
                {modal.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {modal.tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs">
                        {t} <button onClick={() => removeTag(t)}><X className="h-3 w-3 text-white/50" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Images</label>
                <div className="flex flex-wrap items-center gap-3">
                  {modal.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt="" className="h-16 w-24 rounded-lg object-cover" />
                      <button onClick={() => removeImg(idx)} className="absolute -right-2 -top-2 rounded-full bg-black p-0.5 text-red-300"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => fileRef.current?.click()} className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-white/20 text-white/40 hover:border-white/40" data-testid="activity-image-upload">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadImg(e.target.files?.[0])} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Booking</label>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setModal({ ...modal, booking_type: 'external_link' })} className={`flex-1 rounded-lg border px-3 py-2 text-xs ${modal.booking_type === 'external_link' ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-white/15 text-white/50'}`} data-testid="activity-booking-type-external">
                    <Link2 className="mx-auto mb-1 h-4 w-4" /> External Booking Link
                  </button>
                  <button onClick={() => setModal({ ...modal, booking_type: 'native_checkout' })} className={`flex-1 rounded-lg border px-3 py-2 text-xs ${modal.booking_type === 'native_checkout' ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-white/15 text-white/50'}`} data-testid="activity-booking-type-native">
                    <ShoppingCart className="mx-auto mb-1 h-4 w-4" /> In-App Checkout (soon)
                  </button>
                </div>
                {modal.booking_type === 'external_link' && (
                  <div className="space-y-2 rounded-lg border border-white/10 p-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ ...modal, booking_provider: 'generic' })} className={`flex-1 rounded-lg border px-3 py-1.5 text-xs ${modal.booking_provider === 'generic' ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-white/15 text-white/50'}`} data-testid="activity-booking-provider-generic">
                        Generic URL
                      </button>
                      <button onClick={() => setModal({ ...modal, booking_provider: 'fareharbor' })} className={`flex-1 rounded-lg border px-3 py-1.5 text-xs ${modal.booking_provider === 'fareharbor' ? 'border-teal-400 bg-teal-500/20 text-teal-200' : 'border-white/15 text-white/50'}`} data-testid="activity-booking-provider-fareharbor">
                        <Anchor className="mr-1 inline h-3.5 w-3.5" /> FareHarbor
                      </button>
                    </div>
                    {modal.booking_provider === 'fareharbor' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input className={inputCls} placeholder="Shortname (defaults to company's)" value={modal.fareharbor_shortname} onChange={(e) => setModal({ ...modal, fareharbor_shortname: e.target.value })} data-testid="activity-fareharbor-shortname-input" />
                        <input className={inputCls} placeholder="Item PK (optional)" value={modal.fareharbor_item_pk} onChange={(e) => setModal({ ...modal, fareharbor_item_pk: e.target.value })} data-testid="activity-fareharbor-item-input" />
                      </div>
                    ) : (
                      <input className={inputCls} placeholder="https://example.com/book/..." value={modal.booking_url} onChange={(e) => setModal({ ...modal, booking_url: e.target.value })} data-testid="activity-booking-url-input" />
                    )}
                  </div>
                )}
              </div>

              <button onClick={save} disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 text-sm font-semibold disabled:opacity-50" data-testid="activity-save-btn">
                {saving ? 'Saving...' : 'Save Activity'}
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {newSellerModal && (
        <Sheet open={!!newSellerModal} onOpenChange={(open) => !open && setNewSellerModal(null)}>
          <SheetContent side="right" className="w-full sm:max-w-sm bg-[#0b1f24] border-white/10 text-white" data-testid="new-seller-modal">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-white"><Building2 className="h-4 w-4 text-teal-300" /> New Charter Company</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              <input className={inputCls} placeholder="Company name" value={newSellerModal.name} onChange={(e) => setNewSellerModal({ ...newSellerModal, name: e.target.value })} data-testid="new-seller-name-input" />
              <input className={inputCls} placeholder="FareHarbor shortname (optional)" value={newSellerModal.fareharbor_shortname} onChange={(e) => setNewSellerModal({ ...newSellerModal, fareharbor_shortname: e.target.value })} data-testid="new-seller-fareharbor-input" />
              <button onClick={createQuickSeller} className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 py-2 text-sm font-semibold" data-testid="new-seller-save-btn">Add Company</button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default Activities;
