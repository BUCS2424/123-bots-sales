import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../App";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  ArrowLeft, Trash2, Phone, Mail, Pencil, User, Target, Heart,
  Calendar, Copy, RefreshCw, Plus, X, FileText, Activity,
  Database, Settings2, ChevronDown, ChevronUp, Save,
} from "lucide-react";

// ── Accent color: #F5A623 (amber/orange) ─────────────────────────────────────
const AMBER = "#F5A623";
const CONTACT_TYPES = ["family", "friend", "business"];
const STATUSES = ["active", "inactive", "prospect", "lead", "closed"];

// Section header styled like the mockup
const SectionHeader = ({ title }) => (
  <div className="mb-4">
    <h3 className="text-sm font-bold" style={{ color: AMBER }}>{title}</h3>
    <div className="mt-1 h-px" style={{ backgroundColor: AMBER, opacity: 0.4 }} />
  </div>
);

// Field display row (label left, value right)
const FieldRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="text-gray-800 dark:text-gray-100 font-medium text-right ml-4">{value}</span>
    </div>
  );
};

// Copy button
const CopyBtn = ({ text }) => (
  <button onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }}
    className="ml-1.5 text-gray-400 hover:text-amber-500 transition-colors">
    <Copy className="w-3.5 h-3.5" />
  </button>
);

// ── Main Component ────────────────────────────────────────────────────────────
const ContactDetailPage = () => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Edit form state
  const [form, setForm] = useState({});
  const [tagInput, setTagInput] = useState("");

  useEffect(() => { loadContact(); }, [contactId]);

  const loadContact = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/contacts/${contactId}`);
      const c = res.data;
      // Pre-populate first/last from the legacy name field if they're empty
      if (!c.first_name && !c.last_name && c.name) {
        const parts = c.name.trim().split(" ");
        c.first_name = parts[0] || "";
        c.last_name = parts.slice(1).join(" ") || "";
      }
      setContact(c);
      setForm(c);
      setNoteText(c.notes || "");
    } catch {
      toast.error("Contact not found");
      navigate("/contacts");
    } finally {
      setLoading(false);
    }
  };

  const saveContact = async () => {
    setSaving(true);
    try {
      const payload = { ...form, notes: noteText };
      const res = await apiClient.put(`/contacts/${contactId}`, payload);
      setContact(res.data);
      setForm(res.data);
      toast.success("Contact saved");
      setActiveTab("overview");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async () => {
    try {
      await apiClient.delete(`/contacts/${contactId}`);
      toast.success("Contact deleted");
      navigate("/contacts");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!(form.tags || []).includes(t)) {
      setForm(f => ({ ...f, tags: [...(f.tags || []), t] }));
    }
    setTagInput("");
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: (f.tags || []).filter(x => x !== tag) }));

  const callContact = () => {
    const num = contact.mobile_phone || contact.phone_number;
    if (!num) { toast.error("No phone number"); return; }
    const w = 400, h = 650;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(`/dialer-popup?number=${encodeURIComponent(num)}&name=${encodeURIComponent(contact.name)}`,
      "MY Communicator - Dialer", `width=${w},height=${h},left=${left},top=${top}`);
  };

  const f = (v) => v || "—";
  const fmt = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full py-24">
      <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
    </div>
  );
  if (!contact) return null;

  const primaryPhone = contact.mobile_phone || contact.phone_number;
  const primaryEmail = contact.email;
  const initials = contact.name ? contact.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const TABS = [
    { id: "overview", label: "Overview", icon: <User className="w-3.5 h-3.5" /> },
    { id: "alldata",  label: "All Data", icon: <Database className="w-3.5 h-3.5" /> },
    { id: "edit",     label: "Edit",     icon: <Pencil className="w-3.5 h-3.5" /> },
    { id: "notes",    label: "Notes",    icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "activity", label: "Activity", icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-full bg-gray-50 dark:bg-slate-950" data-testid="contact-detail-page">

      {/* Back + Delete bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b">
        <button onClick={() => navigate("/contacts")}
          className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Contacts
        </button>
        <button onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium transition-colors border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50">
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-6 bg-white dark:bg-slate-900 border-b">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
            data-testid={`tab-${tab.id}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex gap-5 p-5 max-w-6xl mx-auto">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-56 shrink-0 space-y-3">

          {/* Profile card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 text-center shadow-sm">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center border-2 mb-3"
              style={{ borderColor: AMBER, backgroundColor: `${AMBER}18` }}>
              <span className="text-xl font-bold" style={{ color: AMBER }}>{initials}</span>
            </div>
            <h2 className="font-bold text-base leading-tight">{contact.name}</h2>
            {primaryEmail && (
              <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Mail className="w-3 h-3 text-blue-400" />
                <span className="truncate max-w-[130px]">{primaryEmail}</span>
              </p>
            )}
            {primaryPhone && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                <Phone className="w-3 h-3 text-blue-400" /> {primaryPhone}
              </p>
            )}
            <div className="flex gap-1.5 justify-center mt-2 flex-wrap">
              {contact.status && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase">
                  {contact.status}
                </span>
              )}
              {contact.grade && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  {contact.grade}
                </span>
              )}
              {contact.contact_type && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
                  {contact.contact_type}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-3 space-y-2">
              <button onClick={callContact}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: AMBER }}>
                <Phone className="w-4 h-4" /> Call
              </button>
              {primaryEmail && (
                <a href={`mailto:${primaryEmail}`}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold border transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20"
                  style={{ borderColor: AMBER, color: AMBER }}>
                  <Mail className="w-4 h-4" /> Email
                </a>
              )}
              <button onClick={() => setActiveTab("edit")}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <Pencil className="w-4 h-4" /> Edit Contact
              </button>
            </div>
          </div>

          {/* Quick Info card */}
          {(contact.contact_type || contact.organization || contact.job_title || contact.birthdate) && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm"
              style={{ backgroundColor: "#FFFDF5" }}>
              <h3 className="text-xs font-bold flex items-center gap-1.5 mb-3" style={{ color: AMBER }}>
                <span className="w-4 h-4 rounded-full border flex items-center justify-center text-xs" style={{ borderColor: AMBER }}>i</span>
                Quick Info
              </h3>
              {contact.contact_type && <FieldRow label="Category" value={contact.contact_type.charAt(0).toUpperCase() + contact.contact_type.slice(1)} />}
              {contact.organization && <FieldRow label="Company" value={contact.organization} />}
              {contact.job_title && <FieldRow label="Title" value={contact.job_title} />}
              {contact.birthdate && (
                <FieldRow label="Birthday" value={(() => {
                  try { return new Date(contact.birthdate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
                  catch { return contact.birthdate; }
                })()} />
              )}
            </div>
          )}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0">

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">

                {/* Contact Information */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-sm">
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                    <User className="w-4 h-4" style={{ color: AMBER }} /> Contact Information
                  </h3>
                  <div className="space-y-3">
                    {contact.name && (
                      <div>
                        <p className="text-xs text-gray-400">Full Name</p>
                        <p className="font-semibold mt-0.5">{contact.name}</p>
                      </div>
                    )}
                    {(primaryEmail || contact.email2) && (
                      <div>
                        <p className="text-xs text-gray-400">Email Addresses</p>
                        {primaryEmail && (
                          <p className="mt-0.5 flex items-center gap-1 text-sm">
                            <Mail className="w-3.5 h-3.5 text-blue-400" /> {primaryEmail} <CopyBtn text={primaryEmail} />
                          </p>
                        )}
                        {contact.email2 && <p className="text-sm text-gray-600">{contact.email2}</p>}
                      </div>
                    )}
                    {primaryPhone && (
                      <div>
                        <p className="text-xs text-gray-400">Phone Numbers</p>
                        <p className="mt-0.5 flex items-center gap-1 text-sm">
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs text-gray-400">Mobile:</span> {primaryPhone} <CopyBtn text={primaryPhone} />
                        </p>
                        {contact.home_phone && <p className="text-sm text-gray-600 flex items-center gap-1"><span className="text-xs text-gray-400">Home:</span> {contact.home_phone}</p>}
                        {contact.business_phone && <p className="text-sm text-gray-600 flex items-center gap-1"><span className="text-xs text-gray-400">Work:</span> {contact.business_phone}</p>}
                      </div>
                    )}
                    {contact.organization && (
                      <div>
                        <p className="text-xs text-gray-400">Organization</p>
                        <p className="font-medium text-sm mt-0.5">{contact.organization}{contact.job_title ? ` · ${contact.job_title}` : ""}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lead Status */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-sm" style={{ borderColor: `${AMBER}60` }}>
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4" style={{ color: AMBER }} /> Contact Status
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Status", value: contact.status, badge: true, color: "bg-green-100 text-green-700" },
                      { label: "Grade", value: contact.grade, badge: true, color: "bg-purple-100 text-purple-700" },
                      { label: "Category", value: contact.contact_type, badge: true, color: "bg-blue-100 text-blue-700" },
                      { label: "Budget", value: contact.budget },
                      { label: "Lead Score", value: contact.lead_score },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                        {item.value ? (
                          item.badge
                            ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${item.color}`}>{item.value}</span>
                            : <p className="font-semibold text-sm">{item.value}</p>
                        ) : (
                          <p className="text-gray-400 text-sm font-medium">—</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {contact.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {contact.tags.map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-sm" style={{ borderColor: "#FF69B433" }}>
                <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-pink-500" /> Quick Actions
                </h3>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => navigate(`/messages/${primaryPhone}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold bg-pink-500 hover:bg-pink-600 transition-colors">
                    <Mail className="w-4 h-4" /> Send Message
                  </button>
                  <button onClick={() => setActiveTab("notes")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors">
                    <FileText className="w-4 h-4" /> Add Note
                  </button>
                  <button onClick={() => setActiveTab("edit")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Pencil className="w-4 h-4" /> Edit Details
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-sm">
                <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4" style={{ color: AMBER }} /> Timeline
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Created", value: fmt(contact.created_at) },
                    { label: "Last Updated", value: fmt(contact.updated_at) },
                    { label: "Source", value: contact.source },
                    { label: "Assigned To", value: contact.assigned_to },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="font-semibold text-sm mt-0.5">{item.value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ALL DATA TAB */}
          {activeTab === "alldata" && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-5 h-5" style={{ color: AMBER }} />
                <h2 className="font-bold text-base">All Imported Data</h2>
              </div>
              <p className="text-xs text-gray-400 mb-6">Complete contact data (empty fields hidden)</p>

              {/* Name / Email / Phone grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Name Information */}
                {(contact.first_name || contact.last_name || contact.display_name || contact.nickname) && (
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                    <SectionHeader title="Name Information" />
                    <FieldRow label="First Name" value={contact.first_name} />
                    <FieldRow label="Last Name" value={contact.last_name} />
                    <FieldRow label="Display Name" value={contact.display_name} />
                    <FieldRow label="Nickname" value={contact.nickname} />
                    <FieldRow label="Gender" value={contact.gender} />
                  </div>
                )}
                {/* Email Addresses */}
                {(contact.email || contact.email2 || contact.email3) && (
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                    <SectionHeader title="Email Addresses" />
                    <FieldRow label="Email 1" value={contact.email} />
                    <FieldRow label="Email 2" value={contact.email2} />
                    <FieldRow label="Email 3" value={contact.email3} />
                  </div>
                )}
                {/* Phone Numbers */}
                {(contact.mobile_phone || contact.phone_number || contact.home_phone || contact.business_phone) && (
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                    <SectionHeader title="Phone Numbers" />
                    <FieldRow label="Mobile Phone" value={contact.mobile_phone || contact.phone_number} />
                    <FieldRow label="Home Phone" value={contact.home_phone} />
                    <FieldRow label="Business Phone" value={contact.business_phone} />
                    <FieldRow label="Home Fax" value={contact.home_fax} />
                    <FieldRow label="Business Fax" value={contact.business_fax} />
                    <FieldRow label="Pager" value={contact.pager} />
                  </div>
                )}
              </div>

              {/* Work / Address row */}
              {(contact.organization || contact.job_title || contact.street || contact.city) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {(contact.organization || contact.job_title) && (
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                      <SectionHeader title="Work Information" />
                      <FieldRow label="Organization" value={contact.organization} />
                      <FieldRow label="Job Title" value={contact.job_title} />
                      <FieldRow label="Department" value={contact.department} />
                    </div>
                  )}
                  {(contact.street || contact.city) && (
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                      <SectionHeader title="Home Address" />
                      <FieldRow label="Street" value={contact.street} />
                      <FieldRow label="Address 2" value={contact.address2} />
                      <FieldRow label="City" value={contact.city} />
                      <FieldRow label="State" value={contact.state} />
                      <FieldRow label="Postal Code" value={contact.postal_code} />
                    </div>
                  )}
                </div>
              )}

              {/* System Information */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                <SectionHeader title="System Information" />
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div><p className="text-xs text-gray-400">ID</p><p className="font-mono text-xs mt-0.5 break-all">{contact.id}</p></div>
                  <div><p className="text-xs text-gray-400">Source</p><p className="font-medium mt-0.5">{contact.source || "—"}</p></div>
                  <div><p className="text-xs text-gray-400">Created</p><p className="font-medium mt-0.5">{fmt(contact.created_at)}</p></div>
                  <div><p className="text-xs text-gray-400">Updated</p><p className="font-medium mt-0.5">{fmt(contact.updated_at)}</p></div>
                </div>
              </div>
            </div>
          )}

          {/* EDIT TAB */}
          {activeTab === "edit" && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-sm space-y-6">
              <div>
                <h2 className="font-bold text-base flex items-center gap-2" style={{ color: AMBER }}>
                  <Pencil className="w-4 h-4" /> Edit Contact
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Update all contact information</p>
              </div>

              {/* Contact Type */}
              <div className="rounded-xl p-4 border" style={{ backgroundColor: "#FFF8EC", borderColor: `${AMBER}40` }}>
                <p className="text-xs font-bold text-gray-600 mb-3">Contact Type</p>
                <div className="flex gap-2 flex-wrap">
                  {CONTACT_TYPES.map(type => (
                    <button key={type} onClick={() => setForm(f => ({ ...f, contact_type: type }))}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold border capitalize transition-colors ${
                        form.contact_type === type
                          ? "text-white border-transparent"
                          : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"
                      }`}
                      style={form.contact_type === type ? { backgroundColor: AMBER, borderColor: AMBER } : {}}
                      data-testid={`type-${type}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status + Grade + Tags */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500">Status</Label>
                  <select value={form.status || "active"} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600">
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Grade</Label>
                  <select value={form.grade || ""} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600">
                    <option value="">— Select Grade —</option>
                    {["A", "B", "C", "D"].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Tags</Label>
                  <div className="mt-1 flex items-center gap-1">
                    <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addTag()}
                      placeholder="Type tag and press Enter" className="h-9 text-sm flex-1" />
                    <button onClick={addTag} className="w-9 h-9 flex items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-100">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {form.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.tags.map(t => (
                        <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {t} <button onClick={() => removeTag(t)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Name Information */}
              <EditSection title="Name Information">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3">
                    <Label className="text-xs text-gray-500">Full Name <span className="text-amber-500">(primary)</span></Label>
                    <Input
                      value={form.name || ""}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Full display name"
                      className="mt-1 h-9 text-sm font-medium"
                    />
                  </div>
                  <EditField label="First Name" field="first_name" form={form} setForm={(updater) => {
                    setForm(prev => {
                      const next = typeof updater === "function" ? updater(prev) : updater;
                      // Auto-sync full name from first + last
                      const full = `${next.first_name || ""} ${next.last_name || ""}`.trim();
                      return { ...next, name: full || next.name };
                    });
                  }} />
                  <EditField label="Last Name" field="last_name" form={form} setForm={(updater) => {
                    setForm(prev => {
                      const next = typeof updater === "function" ? updater(prev) : updater;
                      const full = `${next.first_name || ""} ${next.last_name || ""}`.trim();
                      return { ...next, name: full || next.name };
                    });
                  }} />
                  <EditField label="Display Name" field="display_name" form={form} setForm={setForm} />
                  <EditField label="Nickname" field="nickname" form={form} setForm={setForm} />
                  <EditField label="Gender" field="gender" form={form} setForm={setForm} />
                  <EditField label="Birthdate" field="birthdate" form={form} setForm={setForm} type="date" />
                </div>
              </EditSection>

              {/* Email Addresses */}
              <EditSection title="Email Addresses">
                <div className="grid grid-cols-3 gap-3">
                  <EditField label="Email 1" field="email" form={form} setForm={setForm} type="email" />
                  <EditField label="Email 2" field="email2" form={form} setForm={setForm} type="email" />
                  <EditField label="Email 3" field="email3" form={form} setForm={setForm} type="email" />
                </div>
              </EditSection>

              {/* Phone Numbers */}
              <EditSection title="Phone Numbers">
                <div className="grid grid-cols-3 gap-3">
                  <EditField label="Mobile Phone" field="mobile_phone" form={form} setForm={setForm} />
                  <EditField label="Home Phone" field="home_phone" form={form} setForm={setForm} />
                  <EditField label="Business Phone" field="business_phone" form={form} setForm={setForm} />
                  <EditField label="Home Fax" field="home_fax" form={form} setForm={setForm} />
                  <EditField label="Business Fax" field="business_fax" form={form} setForm={setForm} />
                  <EditField label="Pager" field="pager" form={form} setForm={setForm} />
                </div>
              </EditSection>

              {/* Work Information */}
              <EditSection title="Work Information">
                <div className="grid grid-cols-3 gap-3">
                  <EditField label="Organization" field="organization" form={form} setForm={setForm} />
                  <EditField label="Job Title" field="job_title" form={form} setForm={setForm} />
                  <EditField label="Department" field="department" form={form} setForm={setForm} />
                </div>
              </EditSection>

              {/* Home Address */}
              <EditSection title="Home Address">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2"><EditField label="Street" field="street" form={form} setForm={setForm} /></div>
                  <EditField label="Address 2" field="address2" form={form} setForm={setForm} />
                  <EditField label="City" field="city" form={form} setForm={setForm} />
                  <EditField label="State" field="state" form={form} setForm={setForm} />
                  <EditField label="Postal Code" field="postal_code" form={form} setForm={setForm} />
                </div>
              </EditSection>

              {/* CRM */}
              <EditSection title="CRM Info">
                <div className="grid grid-cols-3 gap-3">
                  <EditField label="Lead Score" field="lead_score" form={form} setForm={setForm} />
                  <EditField label="Budget" field="budget" form={form} setForm={setForm} />
                  <EditField label="Assigned To" field="assigned_to" form={form} setForm={setForm} />
                  <EditField label="Source" field="source" form={form} setForm={setForm} />
                </div>
              </EditSection>

              {/* Save button */}
              <button onClick={saveContact} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: AMBER }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === "notes" && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-base flex items-center gap-2" style={{ color: AMBER }}>
                <FileText className="w-4 h-4" /> Notes
              </h2>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={10}
                placeholder="Add notes about this contact..."
                className="w-full border rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-slate-800 dark:border-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300" />
              <button onClick={saveContact} disabled={saving}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: AMBER }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Notes
              </button>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === "activity" && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 shadow-sm">
              <h2 className="font-bold text-base flex items-center gap-2 mb-4" style={{ color: AMBER }}>
                <Activity className="w-4 h-4" /> Activity
              </h2>
              <div className="text-center py-12 text-gray-400">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Activity log coming soon</p>
                <p className="text-sm mt-1">Calls, messages, and changes will appear here.</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {contact.name}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the contact and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={deleteContact}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const EditSection = ({ title, children }) => (
  <div>
    <SectionHeader title={title} />
    {children}
  </div>
);

const EditField = ({ label, field, form, setForm, type = "text" }) => (
  <div>
    <Label className="text-xs text-gray-500">{label}</Label>
    <Input type={type} value={form[field] || ""}
      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      className="mt-1 h-9 text-sm" />
  </div>
);

export default ContactDetailPage;
