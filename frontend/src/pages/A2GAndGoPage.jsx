import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "../lib/apiClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Plus, Pencil, Trash2, ExternalLink, GripVertical, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

/* ── colour palette for picker ─────────────────────────────────────────────── */
const COLORS = [
  "#3b82f6","#6366f1","#8b5cf6","#ec4899","#ef4444",
  "#f97316","#eab308","#22c55e","#14b8a6","#0ea5e9",
  "#64748b","#1e293b",
];

/* ── get favicon via Google S2 service ──────────────────────────────────────── */
const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
};

/* ── single shortcut card ────────────────────────────────────────────────────── */
const GoCard = ({
  link, index, onEdit, onDelete,
  onDragStart, onDragOver, onDrop, onDragEnd, isDraggingOver,
}) => {
  const [faviconOk, setFaviconOk] = useState(true);
  const faviconUrl = getFaviconUrl(link.url);
  const letter = link.title?.charAt(0).toUpperCase() || "?";

  const openLink = (e) => {
    // only open if we're not clicking an action button
    if (e.target.closest("button")) return;
    const href = link.url.startsWith("http") ? link.url : `https://${link.url}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      onClick={openLink}
      className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl cursor-pointer
        transition-all duration-200 select-none
        bg-card border border-border/60
        hover:shadow-lg hover:border-primary/30 hover:-translate-y-1
        ${isDraggingOver ? "ring-2 ring-primary scale-105 shadow-xl" : ""}
      `}
    >
      {/* drag handle */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-30 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(link); }}
          className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(link.id); }}
          className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md overflow-hidden shrink-0"
        style={{ backgroundColor: faviconOk && faviconUrl ? "transparent" : link.color }}
      >
        {faviconUrl && faviconOk ? (
          <img
            src={faviconUrl}
            alt=""
            className="w-10 h-10 object-contain"
            onError={() => setFaviconOk(false)}
          />
        ) : (
          <span className="text-2xl font-bold text-white">{letter}</span>
        )}
      </div>

      {/* title */}
      <p className="text-sm font-medium text-center text-foreground leading-tight line-clamp-2 w-full">
        {link.title}
      </p>

      {/* open indicator */}
      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity absolute bottom-3 right-3" />
    </div>
  );
};

/* ── main page ───────────────────────────────────────────────────────────────── */
const AndGoPage = () => {
  const [links, setLinks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({ title: "", url: "", color: COLORS[0] });

  // DnD state
  const dragIndex   = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiClient.get("/goto-links");
      setLinks(res.data);
    } catch { toast.error("Failed to load shortcuts"); }
    finally { setLoading(false); }
  };

  /* ── dialog helpers ──────────────────────────────────────────────────────── */
  const openAdd = () => {
    setEditingLink(null);
    setForm({ title: "", url: "", color: COLORS[0] });
    setShowDialog(true);
  };

  const openEdit = (link) => {
    setEditingLink(link);
    setForm({ title: link.title, url: link.url, color: link.color });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    setSaving(true);
    try {
      if (editingLink) {
        await apiClient.put(`/goto-links/${editingLink.id}`, form);
        setLinks((l) => l.map((x) => x.id === editingLink.id ? { ...x, ...form } : x));
        toast.success("Shortcut updated");
      } else {
        const res = await apiClient.post("/goto-links", form);
        setLinks((l) => [...l, res.data]);
        toast.success("Shortcut added");
      }
      setShowDialog(false);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const deleteLink = async (id) => {
    try {
      await apiClient.delete(`/goto-links/${id}`);
      setLinks((l) => l.filter((x) => x.id !== id));
      toast.success("Removed");
    } catch { toast.error("Failed to delete"); }
  };

  /* ── drag and drop ───────────────────────────────────────────────────────── */
  const handleDragStart = (index) => { dragIndex.current = index; };
  const handleDragOver  = (index) => { setDragOver(index); };
  const handleDrop      = (dropIndex) => {
    const from = dragIndex.current;
    if (from === null || from === dropIndex) return;
    const reordered = [...links];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, moved);
    setLinks(reordered);
    // persist order
    apiClient.put("/goto-links/reorder", {
      ordered_ids: reordered.map((l) => l.id),
    }).catch(() => {});
    dragIndex.current = null;
    setDragOver(null);
  };
  const handleDragEnd = () => {
    dragIndex.current = null;
    setDragOver(null);
  };

  /* ── render ──────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      {/* ── hero header ─────────────────────────────────────────────────────── */}
      <div
        className="w-full py-12 px-6 flex flex-col items-center"
        style={{
          background: "linear-gradient(135deg, #0c1445 0%, #1a3a8f 50%, #1e40af 100%)",
        }}
      >
        <h1
          className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          and<span className="text-cyan-300">...</span>Go
        </h1>
        <p className="text-blue-200/70 text-sm">Your favourite shortcuts, one click away</p>
      </div>

      {/* ── content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* grid */}
            {links.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-10">
                {links.map((link, i) => (
                  <GoCard
                    key={link.id}
                    link={link}
                    index={i}
                    onEdit={openEdit}
                    onDelete={deleteLink}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    isDraggingOver={dragOver === i}
                  />
                ))}

                {/* Add card inline */}
                <button
                  onClick={openAdd}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
                    Add shortcut
                  </p>
                </button>
              </div>
            ) : (
              /* empty state */
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
                >
                  <ExternalLink className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No shortcuts yet</h2>
                <p className="text-muted-foreground mb-8 max-w-sm">
                  Add your favourite websites, tools, and apps for instant one-click access.
                </p>
                <Button onClick={openAdd} size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Add your first shortcut
                </Button>
              </div>
            )}

            {/* drag hint */}
            {links.length > 1 && (
              <p className="text-center text-xs text-muted-foreground/50 mt-2">
                Drag and drop to rearrange
              </p>
            )}
          </>
        )}
      </div>

      {/* floating add button (always visible when there are links) */}
      {links.length > 0 && (
        <button
          onClick={openAdd}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 z-30"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            boxShadow: "0 8px 30px rgba(59,130,246,0.5)",
          }}
          title="Add shortcut"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* ── add / edit dialog ────────────────────────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-manrope">
              {editingLink ? "Edit Shortcut" : "Add Shortcut"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Google Drive"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://drive.google.com"
                type="url"
              />
            </div>

            {/* colour picker (fallback icon bg) */}
            <div className="space-y-1.5">
              <Label>Icon colour <span className="text-muted-foreground text-xs">(used if no favicon found)</span></Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: form.color === c ? "#fff" : "transparent",
                      boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* preview */}
            {form.url && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                  style={{ backgroundColor: form.color }}
                >
                  <img
                    src={getFaviconUrl(form.url) || ""}
                    alt=""
                    className="w-8 h-8 object-contain"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{form.title || "Shortcut"}</p>
                  <p className="text-xs text-muted-foreground truncate">{form.url}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingLink ? "Save Changes" : "Add Shortcut"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AndGoPage;
