import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Tag, Loader2, X } from 'lucide-react';
import { eventApi } from './eventApi';
import { toast } from '../../../hooks/use-toast';

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#0f0a1a] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50';

const EventCategories = () => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {id?, name, description, color}

  const load = () => {
    setLoading(true);
    eventApi.listCategories().then((r) => setCats(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!modal.name?.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    try {
      if (modal.id) await eventApi.updateCategory(modal.id, modal);
      else await eventApi.createCategory(modal);
      toast({ title: modal.id ? 'Category updated' : 'Category created' });
      setModal(null); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    await eventApi.deleteCategory(id); toast({ title: 'Deleted' }); load();
  };

  return (
    <div className="-m-4 min-h-screen bg-[#0b0712] p-5 text-white lg:-m-6 lg:p-8" data-testid="event-categories-page">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Event Categories</h1>
          <p className="text-sm text-white/40">{cats.length} categories</p>
        </div>
        <button onClick={() => setModal({ name: '', description: '', color: '#7c3aed' })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold" data-testid="add-category-btn">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-purple-400" /></div>
        : cats.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#150f22] py-16 text-center text-white/40" data-testid="categories-empty">No categories yet.</div>
        : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#150f22] p-4" data-testid={`category-${c.id}`}>
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-lg" style={{ background: c.color }} />
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
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#150f22] p-6 text-white" onClick={(e) => e.stopPropagation()} data-testid="category-modal">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Tag className="h-5 w-5 text-purple-300" /> {modal.id ? 'Edit' : 'New'} Category</h2>
              <button onClick={() => setModal(null)}><X className="h-5 w-5 text-white/50" /></button>
            </div>
            <div className="space-y-3">
              <input className={inputCls} placeholder="Category name" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} data-testid="category-name-input" />
              <input className={inputCls} placeholder="Description (optional)" value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} />
              <div className="flex items-center gap-3">
                <label className="text-sm text-white/60">Color</label>
                <input type="color" value={modal.color} onChange={(e) => setModal({ ...modal, color: e.target.value })} className="h-9 w-16 cursor-pointer rounded bg-transparent" />
              </div>
              <button onClick={save} className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-2.5 text-sm font-semibold" data-testid="category-save-btn">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCategories;
