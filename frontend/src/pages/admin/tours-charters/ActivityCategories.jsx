import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Pencil, Tag, Loader2, X, Upload } from 'lucide-react';
import { toursChartersApi, uploadTourImage } from './toursChartersApi';
import { toast } from '../../../hooks/use-toast';

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#061a1f] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50';

const ActivityCategories = () => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {id?, name, description, image_url, sort_order}
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    toursChartersApi.listCategories().then((r) => setCats(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const uploadImg = async (file) => {
    if (!file) return;
    setUploading(true);
    try { const url = await uploadTourImage(file); setModal((m) => ({ ...m, image_url: url })); }
    catch { toast({ title: 'Upload failed', variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!modal.name?.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (modal.id) await toursChartersApi.updateCategory(modal.id, modal);
      else await toursChartersApi.createCategory(modal);
      toast({ title: modal.id ? 'Category updated' : 'Category created' });
      setModal(null); load();
    } catch (e) { toast({ title: 'Error', description: e.response?.data?.detail, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Activities using it will simply lose this tag.`)) return;
    await toursChartersApi.deleteCategory(id); toast({ title: 'Deleted' }); load();
  };

  return (
    <div className="-m-4 min-h-screen bg-[#061a1f] p-5 text-white lg:-m-6 lg:p-8" data-testid="activity-categories-page">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Activity Categories</h1>
          <p className="text-sm text-white/40">{cats.length} categories</p>
        </div>
        <button onClick={() => setModal({ name: '', description: '', image_url: '', sort_order: 0 })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold" data-testid="add-category-btn">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-teal-400" /></div>
        : cats.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] py-16 text-center text-white/40" data-testid="categories-empty">No categories yet.</div>
        : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b1f24] p-4" data-testid={`category-${c.id}`}>
                <div className="flex items-center gap-3">
                  {c.image_url ? <img src={c.image_url} alt={c.name} className="h-10 w-10 rounded-lg object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20"><Tag className="h-4 w-4 text-teal-300" /></span>}
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    {c.description && <p className="text-xs text-white/40">{c.description}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModal({ ...c })} className="rounded-lg p-2 text-white/60 hover:bg-white/10" data-testid={`category-edit-${c.id}`}><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(c.id, c.name)} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10" data-testid={`category-delete-${c.id}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

      {modal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1f24] p-6 text-white" onClick={(e) => e.stopPropagation()} data-testid="category-modal">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Tag className="h-5 w-5 text-teal-300" /> {modal.id ? 'Edit' : 'New'} Category</h2>
              <button onClick={() => setModal(null)}><X className="h-5 w-5 text-white/50" /></button>
            </div>
            <div className="space-y-3">
              <input className={inputCls} placeholder="Category name (e.g. Boat Charters)" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} data-testid="category-name-input" />
              <input className={inputCls} placeholder="Description (optional)" value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} data-testid="category-description-input" />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Category Image (shown on the public directory)</label>
                <div className="flex items-center gap-3">
                  {modal.image_url ? (
                    <div className="relative">
                      <img src={modal.image_url} alt="" className="h-16 w-24 rounded-lg object-cover" />
                      <button onClick={() => setModal({ ...modal, image_url: '' })} className="absolute -right-2 -top-2 rounded-full bg-black p-0.5 text-red-300"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()} className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-white/20 text-white/40 hover:border-white/40" data-testid="category-image-upload">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadImg(e.target.files?.[0])} />
                </div>
              </div>
              <button onClick={save} disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 text-sm font-semibold disabled:opacity-50" data-testid="category-save-btn">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityCategories;
