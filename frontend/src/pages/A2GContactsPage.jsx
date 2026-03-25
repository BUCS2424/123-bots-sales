import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ScrollArea } from "../components/ui/scroll-area";
import { Switch } from "../components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Plus,
  Search,
  Phone,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  User,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  FileText,
  Check,
  AlertCircle,
  ChevronRight,
  Menu,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

const ContactsPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLetter, setFilterLetter] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("first"); // "first" | "last"
  const [showDialog, setShowDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deleteContact, setDeleteContact] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    email: "",
    company: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/contacts");
      setContacts(response.data);
    } catch (error) {
      console.error("Failed to load contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone_number) {
      toast.error("Name and phone number are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        phone_number: formData.phone_number,
        email: formData.email,
        notes: formData.company ? `Company: ${formData.company}\n${formData.notes}` : formData.notes,
      };
      
      if (editingContact) {
        await apiClient.put(`/contacts/${editingContact.id}`, payload);
        toast.success("Contact updated");
      } else {
        await apiClient.post("/contacts", payload);
        toast.success("Contact created");
      }
      resetForm();
      loadContacts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteContact) return;

    try {
      await apiClient.delete(`/contacts/${deleteContact.id}`);
      toast.success("Contact deleted");
      setDeleteContact(null);
      setSelectedContact(null);
      loadContacts();
    } catch (error) {
      toast.error("Failed to delete contact");
    }
  };

  const openEdit = (contact) => {
    setEditingContact(contact);
    const company = extractCompany(contact.notes);
    const notes = contact.notes?.replace(/^Company:.*\n?/m, "").trim() || "";
    setFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      email: contact.email || "",
      company: company,
      notes: notes,
    });
    setShowDialog(true);
  };

  const extractCompany = (notes) => {
    if (!notes) return "";
    const match = notes.match(/^Company:\s*(.+)$/m);
    return match ? match[1].trim() : "";
  };

  const resetForm = () => {
    setShowDialog(false);
    setEditingContact(null);
    setFormData({ name: "", phone_number: "", email: "", company: "", notes: "" });
  };

  // Export functions
  const handleExportJSON = async () => {
    try {
      const response = await apiClient.get("/contacts/export");
      const data = response.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.count} contacts`);
    } catch (error) {
      toast.error("Failed to export contacts");
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiClient.get("/contacts/export");
      const { contacts: exportData } = response.data;
      const headers = ["Name", "Phone Number", "Email", "Notes"];
      const csvRows = [
        headers.join(","),
        ...exportData.map((c) =>
          [
            `"${(c.name || "").replace(/"/g, '""')}"`,
            `"${(c.phone_number || "").replace(/"/g, '""')}"`,
            `"${(c.email || "").replace(/"/g, '""')}"`,
            `"${(c.notes || "").replace(/"/g, '""')}"`,
          ].join(",")
        ),
      ];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${exportData.length} contacts as CSV`);
    } catch (error) {
      toast.error("Failed to export contacts");
    }
  };

  const handleExportVCF = async () => {
    try {
      const response = await apiClient.get("/contacts/export/vcf", { responseType: "blob" });
      const blob = new Blob([response.data], { type: "text/vcard" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts_export_${new Date().toISOString().split("T")[0]}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Exported contacts as VCF");
    } catch (error) {
      toast.error("Failed to export contacts");
    }
  };

  // Parse VCF content
  const parseVCF = (content) => {
    const contacts = [];
    let currentContact = {};
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      if (trimmedLine.toUpperCase() === 'BEGIN:VCARD') {
        currentContact = {};
      } else if (trimmedLine.toUpperCase() === 'END:VCARD') {
        if (currentContact.name || currentContact.phone_number) {
          contacts.push(currentContact);
        }
        currentContact = {};
      } else if (trimmedLine.includes(':')) {
        const colonIndex = trimmedLine.indexOf(':');
        const keyPart = trimmedLine.substring(0, colonIndex);
        const value = trimmedLine.substring(colonIndex + 1);
        const key = keyPart.split(';')[0].toUpperCase();
        
        if (key === 'FN') {
          currentContact.name = value;
        } else if (key === 'N' && !currentContact.name) {
          const parts = value.split(';');
          const lastName = parts[0] || '';
          const firstName = parts[1] || '';
          const fullName = `${firstName} ${lastName}`.trim();
          if (fullName) currentContact.name = fullName;
        } else if (key === 'TEL' && !currentContact.phone_number) {
          currentContact.phone_number = value.replace(/[\s-]/g, '');
        } else if (key === 'EMAIL' && !currentContact.email) {
          currentContact.email = value;
        } else if (key === 'ORG') {
          currentContact.company = value;
        } else if (key === 'NOTE') {
          currentContact.notes = value.replace(/\\n/g, '\n');
        }
      }
    }
    return contacts;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        let parsedContacts = [];

        if (file.name.endsWith(".json")) {
          const json = JSON.parse(content);
          parsedContacts = json.contacts || json;
        } else if (file.name.endsWith(".csv")) {
          parsedContacts = parseCSV(content);
        } else if (file.name.endsWith(".vcf") || file.name.endsWith(".vcard")) {
          parsedContacts = parseVCF(content);
        } else {
          toast.error("Please upload a JSON, CSV, or VCF file");
          return;
        }

        const validContacts = parsedContacts.filter((c) => c.name || c.phone_number);
        setImportPreview({
          total: parsedContacts.length,
          valid: validContacts.length,
          invalid: parsedContacts.length - validContacts.length,
          contacts: validContacts,
        });
        setShowImportDialog(true);
      } catch (error) {
        toast.error("Failed to parse file. Please check the format.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseCSV = (content) => {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const contacts = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const contact = {};
      headers.forEach((header, index) => {
        const value = values[index]?.replace(/^"|"$/g, "").trim() || "";
        if (header.includes("name")) contact.name = value;
        else if (header.includes("phone")) contact.phone_number = value;
        else if (header.includes("email")) contact.email = value;
        else if (header.includes("company") || header.includes("org")) contact.company = value;
        else if (header.includes("note")) contact.notes = value;
      });
      if (contact.name || contact.phone_number) contacts.push(contact);
    }
    return contacts;
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const handleImport = async () => {
    if (!importPreview?.contacts?.length) return;
    setImporting(true);
    try {
      const response = await apiClient.post("/contacts/import", {
        contacts: importPreview.contacts.map(c => ({
          name: c.name || "Unknown",
          phone_number: c.phone_number || "",
          email: c.email || "",
          notes: c.company ? `Company: ${c.company}\n${c.notes || ""}` : (c.notes || ""),
        })),
        skip_duplicates: skipDuplicates,
      });
      const { imported, skipped, errors } = response.data;
      if (imported > 0) toast.success(`Successfully imported ${imported} contacts`);
      if (skipped > 0) toast.info(`Skipped ${skipped} duplicate contacts`);
      if (errors?.length > 0) toast.error(`Failed to import ${errors.length} contacts`);
      setShowImportDialog(false);
      setImportPreview(null);
      loadContacts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to import contacts");
    } finally {
      setImporting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500",
      "bg-orange-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const DIGITS = "0123456789".split("");
  const AMBER = "#F5A623";

  // Get the letter to index by based on sort field
  const getSortLetter = (contact) => {
    let firstChar;
    if (sortField === "last") {
      const parts = contact.name?.trim().split(" ");
      firstChar = (parts?.length > 1 ? parts[parts.length - 1] : parts?.[0] || "")[0]?.toUpperCase() || "#";
    } else {
      firstChar = contact.name?.[0]?.toUpperCase() || "#";
    }
    if (/[A-Z]/.test(firstChar)) return firstChar;   // A-Z
    if (/[0-9]/.test(firstChar)) return firstChar;   // 0-9 kept as-is
    return "#";                                        // symbols → #
  };

  // Filter and sort contacts
  const filteredContacts = contacts
    .filter((contact) => {
      const query = searchQuery.toLowerCase();
      if (query) {
        const matchesSearch =
          contact.name?.toLowerCase().includes(query) ||
          contact.phone_number?.includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.organization?.toLowerCase().includes(query) ||
          extractCompany(contact.notes)?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (filterLetter !== "all") {
        if (getSortLetter(contact) !== filterLetter) return false;
      }
      if (filterCategory !== "all") {
        if ((contact.contact_type || "").toLowerCase() !== filterCategory) return false;
      }
      if (filterStatus !== "all") {
        if ((contact.status || "active").toLowerCase() !== filterStatus) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const la = getSortLetter(a) + a.name;
      const lb = getSortLetter(b) + b.name;
      return la.localeCompare(lb);
    });

  // Group by sort letter
  const groupedContacts = filteredContacts.reduce((groups, contact) => {
    const letter = getSortLetter(contact);
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(contact);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900" data-testid="contacts-page">
      {/* ── Search & Filter Bar ── */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        {/* Top row: search + filters + refresh */}
        <div className="flex items-center gap-2 px-4 py-3">
          {/* Search input — full width */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setFilterLetter("all"); }}
              className="pl-9 h-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
              data-testid="search-contacts"
            />
          </div>

          {/* All Categories */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 h-10 px-3 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 whitespace-nowrap">
                {filterCategory === "all" ? "All Categories" : filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)}
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["all", "family", "friend", "business"].map(c => (
                <DropdownMenuItem key={c} onClick={() => setFilterCategory(c)}
                  className={filterCategory === c ? "font-semibold" : ""}>
                  {c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* All Statuses */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 h-10 px-3 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 whitespace-nowrap">
                {filterStatus === "all" ? "All Statuses" : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["all", "active", "inactive", "prospect", "lead", "closed"].map(s => (
                <DropdownMenuItem key={s} onClick={() => setFilterStatus(s)}
                  className={filterStatus === s ? "font-semibold" : ""}>
                  {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh */}
          <button onClick={loadContacts}
            className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            data-testid="refresh-contacts">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Import/Export menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Import Contacts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportJSON}><FileJson className="w-4 h-4 mr-2" /> Export as JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}><FileSpreadsheet className="w-4 h-4 mr-2" /> Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportVCF}><FileText className="w-4 h-4 mr-2" /> Export as VCF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Alphabet bar */}
        <div className="flex items-center gap-0 px-4 pb-2 overflow-x-auto">
          {/* Sort field toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-md px-2 py-1 mr-2 shrink-0 hover:bg-gray-50 whitespace-nowrap">
                {sortField === "last" ? "Last Name" : "First Name"}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortField("first")}>First Name</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField("last")}>Last Name</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* All badge */}
          <button
            onClick={() => setFilterLetter("all")}
            className="flex items-center justify-center shrink-0 h-7 px-3 rounded-md text-xs font-bold mr-1 transition-colors"
            style={filterLetter === "all"
              ? { backgroundColor: AMBER, color: "white" }
              : { backgroundColor: "transparent", color: "#6b7280" }}
            data-testid="alpha-all">
            All ({contacts.length})
          </button>

          {/* # for symbols only */}
          {contacts.some(c => getSortLetter(c) === "#") && (
            <button onClick={() => setFilterLetter(filterLetter === "#" ? "all" : "#")}
              className="w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors shrink-0"
              style={filterLetter === "#"
                ? { backgroundColor: AMBER, color: "white" }
                : { color: "#374151", cursor: "pointer" }}
              data-testid="alpha-hash">#</button>
          )}

          {/* 0–9 before A–Z */}
          {DIGITS.map(digit => {
            const has = contacts.some(c => getSortLetter(c) === digit);
            if (!has) return null;
            const isActive = filterLetter === digit;
            return (
              <button key={digit} onClick={() => setFilterLetter(isActive ? "all" : digit)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors shrink-0"
                style={isActive ? { backgroundColor: AMBER, color: "white" } : { color: "#374151" }}
                data-testid={`alpha-${digit}`}>
                {digit}
              </button>
            );
          })}

          {/* A–Z */}
          {ALPHA.map(letter => {
            const hasContacts = contacts.some(c => getSortLetter(c) === letter);
            const isActive = filterLetter === letter;
            return (
              <button key={letter} onClick={() => setFilterLetter(isActive ? "all" : letter)}
                disabled={!hasContacts}
                className="w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors shrink-0"
                style={isActive
                  ? { backgroundColor: AMBER, color: "white" }
                  : hasContacts
                    ? { color: "#374151", cursor: "pointer" }
                    : { color: "#d1d5db", cursor: "default" }}
                data-testid={`alpha-${letter}`}>
                {letter}
              </button>
            );
          })}
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept=".json,.csv,.vcf,.vcard"
          onChange={handleFileSelect} className="hidden" data-testid="import-file-input" />
      </div>

      {/* Contact count */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredContacts.length} of {contacts.length} contacts
        </span>
      </div>

      {/* Contact List */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <User className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No contacts found</p>
            <p className="text-sm">
              {searchQuery
                ? "Try adjusting your search"
                : "Add your first contact"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-180px)]">
            {Object.entries(groupedContacts)
              .sort(([a], [b]) => {
                if (a === "#" && b === "#") return 0;
                if (a === "#") return -1;
                if (b === "#") return 1;
                // digits before letters
                const aIsDigit = /[0-9]/.test(a);
                const bIsDigit = /[0-9]/.test(b);
                if (aIsDigit && bIsDigit) return a.localeCompare(b);
                if (aIsDigit) return -1;
                if (bIsDigit) return 1;
                return a.localeCompare(b);
              })
              .map(([letter, letterContacts]) => (
              <div key={letter}>
                {/* Letter Header */}
                <div className="sticky top-0 px-4 py-1 bg-gray-100 dark:bg-slate-800">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {letter}
                  </span>
                </div>

                {/* Contacts in this letter group */}
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {letterContacts.map((contact) => {
                    const company = extractCompany(contact.notes);
                    const isSelected = selectedContact?.id === contact.id;
                    
                    return (
                      <div key={contact.id}>
                        <div
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                            isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                          onClick={() => navigate(`/admin/contacts/${contact.id}`)}
                          data-testid={`contact-${contact.id}`}
                        >
                          {/* Avatar */}
                          <div className={`w-12 h-12 rounded-full ${getAvatarColor(contact.name)} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                            {getInitials(contact.name)}
                          </div>

                          {/* Contact Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {contact.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {company || contact.phone_number}
                            </p>
                          </div>

                          {/* Desktop Actions */}
                          <div className="hidden sm:flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dialer?number=${contact.phone_number}`);
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                              data-testid={`call-${contact.id}`}
                            >
                              <Phone className="w-5 h-5 text-green-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/messages/${encodeURIComponent(contact.phone_number)}`);
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                              data-testid={`message-${contact.id}`}
                            >
                              <MessageSquare className="w-5 h-5 text-blue-600" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button 
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                  <MoreVertical className="w-5 h-5 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(contact)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteContact(contact)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Mobile: Chevron */}
                          <ChevronRight className="w-5 h-5 text-gray-400 sm:hidden flex-shrink-0" />
                        </div>

                        {/* Mobile: Expanded actions */}
                        {isSelected && (
                          <div className="sm:hidden px-4 pb-4 bg-blue-50 dark:bg-blue-900/20">
                            <div className="flex gap-3 pt-2">
                              <Button
                                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dialer?number=${contact.phone_number}`);
                                }}
                                data-testid={`mobile-call-${contact.id}`}
                              >
                                <Phone className="w-5 h-5 mr-2" />
                                Call
                              </Button>
                              <Button
                                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/messages/${encodeURIComponent(contact.phone_number)}`);
                                }}
                                data-testid={`mobile-message-${contact.id}`}
                              >
                                <MessageSquare className="w-5 h-5 mr-2" />
                                Text
                              </Button>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => openEdit(contact)}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => setDeleteContact(contact)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => {
          setEditingContact(null);
          setFormData({ name: "", phone_number: "", email: "", company: "", notes: "" });
          setShowDialog(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all hover:scale-105 z-20"
        data-testid="add-contact-btn"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Contact" : "New Contact"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                data-testid="contact-name-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1 (555) 123-4567"
                data-testid="contact-phone-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                data-testid="contact-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Corp"
                data-testid="contact-company-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes..."
                rows={3}
                data-testid="contact-notes-input"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} data-testid="save-contact-btn">
                {saving ? "Saving..." : editingContact ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteContact} onOpenChange={() => setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteContact?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Preview Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Contacts
            </DialogTitle>
          </DialogHeader>
          
          {importPreview && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-slate-800 text-center">
                  <p className="text-2xl font-semibold">{importPreview.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-center">
                  <p className="text-2xl font-semibold text-green-600">{importPreview.valid}</p>
                  <p className="text-xs text-gray-500">Valid</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-center">
                  <p className="text-2xl font-semibold text-amber-600">{importPreview.invalid}</p>
                  <p className="text-xs text-gray-500">Invalid</p>
                </div>
              </div>

              {importPreview.invalid > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importPreview.invalid} contacts are missing required fields</span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-slate-800">
                <div>
                  <p className="font-medium text-sm">Skip duplicates</p>
                  <p className="text-xs text-gray-500">Skip contacts with existing phone numbers</p>
                </div>
                <Switch
                  checked={skipDuplicates}
                  onCheckedChange={setSkipDuplicates}
                  data-testid="skip-duplicates-switch"
                />
              </div>

              <div className="border rounded-lg dark:border-slate-700">
                <div className="px-3 py-2 bg-gray-100 dark:bg-slate-800 border-b dark:border-slate-700">
                  <p className="text-sm font-medium">Preview (first 5)</p>
                </div>
                <ScrollArea className="h-40">
                  <div className="p-2 space-y-2">
                    {importPreview.contacts.slice(0, 5).map((contact, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-slate-800/50">
                        <Check className="w-4 h-4 text-green-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{contact.name}</p>
                          <p className="text-xs text-gray-500 truncate">{contact.phone_number}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportPreview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || importPreview.valid === 0}
                  data-testid="confirm-import-btn"
                >
                  {importing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Importing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Import {importPreview.valid} Contacts
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactsPage;
