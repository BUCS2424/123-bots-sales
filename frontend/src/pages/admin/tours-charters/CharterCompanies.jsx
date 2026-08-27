import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Pencil, Building2, Loader2, X, Upload, Search, LayoutGrid, List as ListIcon, Mail, Phone, Globe2, Percent, Anchor, CheckCircle2, XCircle, BadgeCheck, Receipt, MapPin, FileText } from 'lucide-react';
import { toursChartersApi, uploadTourImage } from './toursChartersApi';
import { toast } from '../../../hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#061a1f] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50';
const emptySeller = {
  name: '', description: '', logo_url: '', contact_email: '', contact_phone: '', website: '',
  commission_rate: 0, fareharbor_shortname: '', is_active: true,
  billing_address: '', billing_city: '', billing_state: '', billing_zip: '',
  tax_id: '', invoice_email: '', payment_terms: 'Net 30',
};

const CharterCompanies = () => {
  const [sellers, setSellers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('block');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      toursChartersApi.listSellers(),
      toursChartersApi.listActivities(),
    ]).then(([s, a]) => {
      setSellers(s.data || []);
      setActivities(a.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const activityCount = (sellerId) => activities.filter((a) => a.seller_id === sellerId).length;

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploading(true);
    try { const url = await uploadTourImage(file); setModal((m) => ({ ...m, logo_url: url })); }
    catch { toast({ title: 'Upload failed', variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadLogo(file);
  };

  const save = async () => {
    if (!modal.name?.trim()) { toast({ title: 'Company name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = { ...modal, commission_rate: parseFloat(modal.commission_rate) || 0 };
      if (modal.id) await toursChartersApi.updateSeller(modal.id, payload);
      else await toursChartersApi.createSeller(payload);
      toast({ title: modal.id ? 'Charter company updated' : 'Charter company created' });
      setModal(null); load();
    } catch (e) { toast({ title: 'Error', description: e.response?.data?.detail, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete charter company "${name}"?`)) return;
    try { await toursChartersApi.deleteSeller(id); toast({ title: 'Deleted' }); load(); }
    catch (e) { toast({ title: 'Cannot delete', description: e.response?.data?.detail, variant: 'destructive' }); }
  };

  const filteredSellers = sellers.filter((s) => {
    if (searchQuery.trim() && !s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    if (filterStatus === 'active' && !s.is_active) return false;
    if (filterStatus === 'inactive' && s.is_active) return false;
    return true;
  });
  const hasActiveFilters = searchQuery.trim() || filterStatus;
  const clearFilters = () => { setSearchQuery(''); setFilterStatus(''); };

  return (
    <div className="-m-4 min-h-screen bg-[#061a1f] p-5 text-white lg:-m-6 lg:p-8" data-testid="charter-companies-page">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black"><Building2 className="h-6 w-6 text-teal-400" /> Charter Companies</h1>
          <p className="text-sm text-white/40">{filteredSellers.length} of {sellers.length} charter companies</p>
        </div>
        <button onClick={() => setModal({ ...emptySeller })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold" data-testid="add-charter-company-btn">
          <Plus className="h-4 w-4" /> Add Charter Company
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2" data-testid="charter-companies-filter-bar">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input className={`${inputCls} pl-9`} placeholder="Search by company name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} data-testid="charter-companies-search-input" />
        </div>
        <select className={`${inputCls} w-auto min-w-[160px]`} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} data-testid="charter-companies-filter-status-select">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/10" data-testid="charter-companies-clear-filters-btn">
            Clear
          </button>
        )}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1">
          <button onClick={() => setViewMode('block')} className={`rounded p-1.5 ${viewMode === 'block' ? 'bg-teal-500/20 text-teal-300' : 'text-white/40 hover:text-white/70'}`} data-testid="charter-companies-view-block-btn" title="Block view">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`rounded p-1.5 ${viewMode === 'list' ? 'bg-teal-500/20 text-teal-300' : 'text-white/40 hover:text-white/70'}`} data-testid="charter-companies-view-list-btn" title="List view">
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-teal-400" /></div>
        : sellers.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-16 text-center text-white/40" data-testid="charter-companies-empty">No charter companies yet. Add your first one.</div>
        : filteredSellers.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-16 text-center text-white/40" data-testid="charter-companies-filter-empty">No charter companies match your filters.</div>
        : viewMode === 'list' ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1f24]" data-testid="charter-companies-list-view">
            {filteredSellers.map((s) => (
              <div key={s.id} className="flex items-center gap-4 border-b border-white/5 p-3 last:border-b-0 hover:bg-white/5" data-testid={`charter-company-row-${s.id}`}>
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/20"><Building2 className="h-5 w-5" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.name}</p>
                  <p className="truncate text-xs text-white/40">{s.contact_email || 'No contact email'}</p>
                </div>
                <span className="hidden w-24 flex-shrink-0 text-xs text-white/40 sm:block">{activityCount(s.id)} activities</span>
                <span className="hidden w-20 flex-shrink-0 items-center gap-1 text-xs text-white/40 md:flex"><Percent className="h-3 w-3" /> {s.commission_rate ?? 0}%</span>
                {s.fareharbor_shortname && <span className="hidden items-center gap-1 rounded-full bg-teal-500/15 px-2 py-0.5 text-xs text-teal-300 lg:flex"><Anchor className="h-3 w-3" /> {s.fareharbor_shortname}</span>}
                <span className={`flex w-20 flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-center text-xs ${s.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-white/40'}`} data-testid={`charter-company-status-${s.id}`}>
                  {s.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {s.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex flex-shrink-0 gap-1">
                  <Link to={`/admin/tours-charters/invoices?seller_id=${s.id}`} className="rounded-lg p-1.5 text-teal-300 hover:bg-teal-500/10" data-testid={`charter-company-invoice-${s.id}`} title="Create invoice"><Receipt className="h-3.5 w-3.5" /></Link>
                  <button onClick={() => setModal({ ...emptySeller, ...s })} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10" data-testid={`charter-company-edit-${s.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => del(s.id, s.name)} className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10" data-testid={`charter-company-delete-${s.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="charter-companies-block-view">
            {filteredSellers.map((s) => (
              <div key={s.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1f24]" data-testid={`charter-company-${s.id}`}>
                <div className="relative h-24 w-full bg-white/5">
                  {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/20"><Building2 className="h-8 w-8" /></div>}
                  <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${s.is_active ? 'bg-emerald-500/90 text-black' : 'bg-black/60 text-white/60'}`} data-testid={`charter-company-status-${s.id}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.name}</p>
                      {s.contact_email && <p className="flex items-center gap-1 truncate text-xs text-white/40"><Mail className="h-3 w-3" /> {s.contact_email}</p>}
                    </div>
                    <div className="flex flex-shrink-0 gap-1">
                      <Link to={`/admin/tours-charters/invoices?seller_id=${s.id}`} className="rounded-lg p-1.5 text-teal-300 hover:bg-teal-500/10" data-testid={`charter-company-invoice-${s.id}`} title="Create invoice"><Receipt className="h-3.5 w-3.5" /></Link>
                      <button onClick={() => setModal({ ...emptySeller, ...s })} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10" data-testid={`charter-company-edit-${s.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => del(s.id, s.name)} className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10" data-testid={`charter-company-delete-${s.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                    <span>{activityCount(s.id)} activities</span>
                    <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> {s.commission_rate ?? 0}% commission</span>
                  </div>
                  {s.fareharbor_shortname && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-teal-300"><Anchor className="h-3 w-3" /> FareHarbor: {s.fareharbor_shortname}</div>
                  )}
                  {s.customer_id && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-sky-300" data-testid={`charter-company-synced-${s.id}`}><BadgeCheck className="h-3 w-3" /> Synced to Customers</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      {modal && (
        <Sheet open={!!modal} onOpenChange={(open) => !open && setModal(null)}>
          <SheetContent side="right" className="w-full sm:max-w-xl bg-[#0b1f24] border-white/10 text-white overflow-y-auto" data-testid="charter-company-modal">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-white"><Building2 className="h-5 w-5 text-teal-300" /> {modal.id ? 'Edit' : 'New'} Charter Company</SheetTitle>
              {modal.customer_id && (
                <p className="flex items-center gap-1.5 text-xs text-sky-300" data-testid="charter-company-sync-status"><BadgeCheck className="h-3.5 w-3.5" /> Synced to Customers (User Management)</p>
              )}
            </SheetHeader>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Company Name</label>
                <input className={inputCls} placeholder="e.g. Blue Water Charters" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} data-testid="charter-company-name-input" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Status</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModal({ ...modal, is_active: true })} className={`flex-1 rounded-lg border px-3 py-2 text-xs ${modal.is_active ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-white/15 text-white/50'}`} data-testid="charter-company-status-active-btn">
                    Active
                  </button>
                  <button type="button" onClick={() => setModal({ ...modal, is_active: false })} className={`flex-1 rounded-lg border px-3 py-2 text-xs ${!modal.is_active ? 'border-white/40 bg-white/10 text-white' : 'border-white/15 text-white/50'}`} data-testid="charter-company-status-inactive-btn">
                    Inactive
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Logo</label>
                <div className="flex items-center gap-3">
                  {modal.logo_url ? (
                    <div className="relative">
                      <img src={modal.logo_url} alt="" className="h-16 w-24 rounded-lg object-cover" />
                      <button onClick={() => setModal({ ...modal, logo_url: '' })} className="absolute -right-2 -top-2 rounded-full bg-black p-0.5 text-red-300"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleLogoDrop}
                      onClick={() => fileRef.current?.click()}
                      className="flex h-16 w-24 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-white/20 text-white/40 hover:border-teal-400/50 hover:text-white/60"
                      data-testid="charter-company-logo-upload"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4" /><span className="text-[9px]">Drop or click</span></>}
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
                </div>
              </div>

              <textarea className={inputCls} rows={2} placeholder="Description (optional)" value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} data-testid="charter-company-description-input" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-white/60"><Mail className="h-3 w-3" /> Contact Email</label>
                  <input className={inputCls} type="email" placeholder="hello@charter.com" value={modal.contact_email} onChange={(e) => setModal({ ...modal, contact_email: e.target.value })} data-testid="charter-company-email-input" />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-white/60"><Phone className="h-3 w-3" /> Contact Phone</label>
                  <input className={inputCls} placeholder="(555) 123-4567" value={modal.contact_phone} onChange={(e) => setModal({ ...modal, contact_phone: e.target.value })} data-testid="charter-company-phone-input" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-white/60"><Globe2 className="h-3 w-3" /> Website</label>
                <input className={inputCls} placeholder="https://charter.com" value={modal.website} onChange={(e) => setModal({ ...modal, website: e.target.value })} data-testid="charter-company-website-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-white/60"><Percent className="h-3 w-3" /> Commission Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.1" className={inputCls} value={modal.commission_rate} onChange={(e) => setModal({ ...modal, commission_rate: e.target.value })} data-testid="charter-company-commission-input" />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-white/60"><Anchor className="h-3 w-3" /> FareHarbor Shortname</label>
                  <input className={inputCls} placeholder="e.g. blue-water" value={modal.fareharbor_shortname} onChange={(e) => setModal({ ...modal, fareharbor_shortname: e.target.value })} data-testid="charter-company-fareharbor-input" />
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/50"><FileText className="h-3.5 w-3.5" /> Billing &amp; Invoicing</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-white/60"><MapPin className="h-3 w-3" /> Billing Address</label>
                    <input className={inputCls} placeholder="123 Bay St" value={modal.billing_address} onChange={(e) => setModal({ ...modal, billing_address: e.target.value })} data-testid="charter-company-billing-address-input" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <input className={inputCls} placeholder="City" value={modal.billing_city} onChange={(e) => setModal({ ...modal, billing_city: e.target.value })} data-testid="charter-company-billing-city-input" />
                    <input className={inputCls} placeholder="State" value={modal.billing_state} onChange={(e) => setModal({ ...modal, billing_state: e.target.value })} data-testid="charter-company-billing-state-input" />
                    <input className={inputCls} placeholder="ZIP" value={modal.billing_zip} onChange={(e) => setModal({ ...modal, billing_zip: e.target.value })} data-testid="charter-company-billing-zip-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/60">Tax ID / EIN</label>
                      <input className={inputCls} placeholder="98-1234567" value={modal.tax_id} onChange={(e) => setModal({ ...modal, tax_id: e.target.value })} data-testid="charter-company-tax-id-input" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-white/60">Payment Terms</label>
                      <select className={inputCls} value={modal.payment_terms} onChange={(e) => setModal({ ...modal, payment_terms: e.target.value })} data-testid="charter-company-payment-terms-select">
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-white/60"><Mail className="h-3 w-3" /> Invoice Email (defaults to Contact Email)</label>
                    <input className={inputCls} type="email" placeholder="billing@charter.com" value={modal.invoice_email} onChange={(e) => setModal({ ...modal, invoice_email: e.target.value })} data-testid="charter-company-invoice-email-input" />
                  </div>
                </div>
              </div>

              <button onClick={save} disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 text-sm font-semibold disabled:opacity-50" data-testid="charter-company-save-btn">
                {saving ? 'Saving...' : 'Save Charter Company'}
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default CharterCompanies;
