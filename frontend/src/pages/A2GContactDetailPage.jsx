import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function A2GContactDetailPage({ contactId: propContactId }) {
  const navigate = useNavigate();
  const params = useParams();
  const contactId = propContactId || params.contactId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const loadContact = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/contacts/${contactId}`);
      setForm(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/contacts/${contactId}`, form);
      await loadContact();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await apiClient.delete(`/contacts/${contactId}`);
    navigate('/admin/contacts');
  };

  if (loading || !form) {
    return <div data-testid="a2g-contact-detail-loading">Loading contact...</div>;
  }

  return (
    <div className="space-y-4" data-testid="a2g-contact-detail-page">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/admin/contacts')} data-testid="a2g-contact-detail-back-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contacts
        </Button>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={remove} data-testid="a2g-contact-detail-delete-button">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button onClick={save} disabled={saving} data-testid="a2g-contact-detail-save-button">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 grid md:grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="a2g-contact-detail-name-input" />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="a2g-contact-detail-email-input" />
        </div>
        <div>
          <Label>Mobile phone</Label>
          <Input value={form.mobile_phone || ''} onChange={(e) => setForm({ ...form, mobile_phone: e.target.value })} data-testid="a2g-contact-detail-mobile-input" />
        </div>
        <div>
          <Label>Home phone</Label>
          <Input value={form.home_phone || ''} onChange={(e) => setForm({ ...form, home_phone: e.target.value })} data-testid="a2g-contact-detail-home-input" />
        </div>
        <div>
          <Label>Organization</Label>
          <Input value={form.organization || ''} onChange={(e) => setForm({ ...form, organization: e.target.value })} data-testid="a2g-contact-detail-organization-input" />
        </div>
        <div>
          <Label>Status</Label>
          <Input value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })} data-testid="a2g-contact-detail-status-input" />
        </div>
        <div className="md:col-span-2">
          <Label>Notes</Label>
          <Input value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="a2g-contact-detail-notes-input" />
        </div>
      </div>
    </div>
  );
}
