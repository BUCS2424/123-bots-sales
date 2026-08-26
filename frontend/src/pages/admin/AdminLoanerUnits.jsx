import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Edit2, X, Loader2, ScanLine, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/service-repair`;

const STATUS_OPTIONS = ['available', 'checked_out', 'needs_inspection', 'retired'];
const STATUS_BADGE = {
  available: 'bg-green-100 text-green-700 border-green-300',
  checked_out: 'bg-amber-100 text-amber-700 border-amber-300',
  needs_inspection: 'bg-orange-100 text-orange-700 border-orange-300',
  retired: 'bg-gray-100 text-gray-500 border-gray-300',
};

const emptyDraft = { manufacturer_name: '', model: '', serial_number: '', notes: '' };

const AdminLoanerUnits = () => {
  const [loaners, setLoaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const tokenHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const fetchLoaners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/loaners`, { headers: tokenHeaders });
      setLoaners(res.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load loaner units', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchLoaners(); }, [fetchLoaners]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setModalOpen(true);
  };

  const openEdit = (loaner) => {
    setEditingId(loaner.id);
    setDraft({
      manufacturer_name: loaner.manufacturer_name || '',
      model: loaner.model || '',
      serial_number: loaner.serial_number || '',
      notes: loaner.notes || '',
      status: loaner.status,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!draft.model.trim() || !draft.serial_number.trim()) {
      toast({ title: 'Missing fields', description: 'Model and serial number are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/loaners/${editingId}`, draft, { headers: tokenHeaders });
        toast({ title: 'Saved', description: 'Loaner unit updated' });
      } else {
        await axios.post(`${API}/loaners`, draft, { headers: tokenHeaders });
        toast({ title: 'Created', description: 'Loaner unit added to the pool' });
      }
      setModalOpen(false);
      fetchLoaners();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to save loaner unit', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (loaner) => {
    if (!window.confirm(`Remove ${loaner.model} (SN: ${loaner.serial_number}) from the loaner pool?`)) return;
    try {
      await axios.delete(`${API}/loaners/${loaner.id}`, { headers: tokenHeaders });
      toast({ title: 'Removed', description: 'Loaner unit deleted' });
      fetchLoaners();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to delete loaner unit', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6" data-testid="loaner-units-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/admin/service-repair/scan" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Loaner Units</h1>
          </div>
          <p className="text-gray-500 text-sm">Manage the pool of replacement units given to customers during service</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/service-repair/scan">
            <Button variant="outline"><ScanLine className="w-4 h-4 mr-2" />Go to Scan</Button>
          </Link>
          <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={openCreate} data-testid="add-loaner-btn">
            <Plus className="w-4 h-4 mr-2" />Add Loaner Unit
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : loaners.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No loaner units yet</CardContent></Card>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Manufacturer</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Serial Number</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loaners.map((loaner) => (
                <tr key={loaner.id} className="border-b last:border-0 hover:bg-gray-50" data-testid={`loaner-row-${loaner.id}`}>
                  <td className="px-4 py-3 text-gray-600">{loaner.manufacturer_name || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{loaner.model}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{loaner.serial_number}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[10px] border ${STATUS_BADGE[loaner.status] || ''}`}>{loaner.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(loaner)}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500" disabled={loaner.status === 'checked_out'} onClick={() => remove(loaner)}><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" data-testid="loaner-edit-modal">
          <DialogTitle className="flex items-center justify-between">
            <span>{editingId ? 'Edit Loaner Unit' : 'Add Loaner Unit'}</span>
            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </DialogTitle>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Manufacturer</Label>
              <Input value={draft.manufacturer_name} onChange={(e) => setDraft((d) => ({ ...d, manufacturer_name: e.target.value }))} placeholder="e.g. PUDU" data-testid="loaner-field-manufacturer" />
            </div>
            <div>
              <Label>Model</Label>
              <Input value={draft.model} onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))} placeholder="e.g. CC1 Pro" data-testid="loaner-field-model" />
            </div>
            <div>
              <Label>Serial Number</Label>
              <Input value={draft.serial_number} onChange={(e) => setDraft((d) => ({ ...d, serial_number: e.target.value }))} data-testid="loaner-field-serial" />
            </div>
            {editingId && (
              <div>
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}>
                  <SelectTrigger data-testid="loaner-field-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((s) => s !== 'checked_out' || draft.status === 'checked_out').map((s) => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {draft.status === 'checked_out' && (
                  <p className="text-xs text-gray-400 mt-1">Checked-out loaners are returned via the Scan tool, not this dropdown.</p>
                )}
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Input value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} data-testid="loaner-field-notes" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={save} disabled={saving} data-testid="loaner-save-btn">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingId ? 'Save Changes' : 'Add Loaner Unit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLoanerUnits;
