import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  mobile_phone: '',
  organization: '',
  status: 'active',
  notes: '',
};

export default function A2GContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/contacts');
      setContacts(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.email, c.mobile_phone, c.organization].some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [contacts, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (contact) => {
    setEditing(contact);
    setForm({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      mobile_phone: contact.mobile_phone || '',
      organization: contact.organization || '',
      status: contact.status || 'active',
      notes: contact.notes || '',
    });
    setShowDialog(true);
  };

  const saveContact = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing?.id) {
        await apiClient.put(`/contacts/${editing.id}`, payload);
      } else {
        await apiClient.post('/contacts', payload);
      }
      setShowDialog(false);
      setForm(emptyForm);
      setEditing(null);
      await loadContacts();
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (id) => {
    await apiClient.delete(`/contacts/${id}`);
    await loadContacts();
  };

  return (
    <div className="space-y-4" data-testid="a2g-contacts-page">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="a2g-contacts-heading">Contacts</h1>
          <p className="text-sm text-gray-500" data-testid="a2g-contacts-count">{contacts.length} total contacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadContacts} data-testid="a2g-contacts-refresh-button">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openCreate} data-testid="a2g-contacts-new-button">
            <Plus className="w-4 h-4 mr-2" />
            New Contact
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts"
          className="pl-9"
          data-testid="a2g-contacts-search-input"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white" data-testid="a2g-contacts-table-wrapper">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={6} data-testid="a2g-contacts-loading-state">Loading contacts...</td>
              </tr>
            ) : filteredContacts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={6} data-testid="a2g-contacts-empty-state">No contacts found.</td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-t hover:bg-gray-50" data-testid={`a2g-contact-row-${contact.id}`}>
                  <td
                    className="px-4 py-3 font-medium cursor-pointer"
                    onClick={() => navigate(`/admin/contacts/${contact.id}`)}
                    data-testid={`a2g-contact-open-${contact.id}`}
                  >
                    {contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Untitled Contact'}
                  </td>
                  <td className="px-4 py-3" data-testid={`a2g-contact-email-${contact.id}`}>{contact.email || '—'}</td>
                  <td className="px-4 py-3" data-testid={`a2g-contact-phone-${contact.id}`}>{contact.mobile_phone || '—'}</td>
                  <td className="px-4 py-3">{contact.organization || '—'}</td>
                  <td className="px-4 py-3">{contact.status || 'active'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(contact)} data-testid={`a2g-contact-edit-${contact.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteContact(contact.id)} data-testid={`a2g-contact-delete-${contact.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent data-testid="a2g-contact-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Contact' : 'New Contact'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} data-testid="a2g-contact-first-name-input" />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} data-testid="a2g-contact-last-name-input" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="a2g-contact-email-input" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.mobile_phone} onChange={(e) => setForm({ ...form, mobile_phone: e.target.value })} data-testid="a2g-contact-phone-input" />
            </div>
            <div>
              <Label>Organization</Label>
              <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} data-testid="a2g-contact-organization-input" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="a2g-contact-notes-input" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} data-testid="a2g-contact-cancel-button">Cancel</Button>
              <Button onClick={saveContact} disabled={saving} data-testid="a2g-contact-save-button">
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
