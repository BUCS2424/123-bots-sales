import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Truck, Package, Wrench, ArrowRightLeft, Plus, Upload, Loader2, X, ExternalLink, CheckCircle2, DollarSign } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/fleet`;
const SERVICE_REPAIR_API = `${BACKEND_URL}/api/service-repair`;

const TABS = [
  { id: 'new', label: 'New', icon: Truck },
  { id: 'service', label: 'Service', icon: Wrench },
  { id: 'sold', label: 'Sold', icon: DollarSign },
  { id: 'parts', label: 'Parts', icon: Package },
  { id: 'loaner', label: 'Loaner', icon: ArrowRightLeft },
];

const emptyDraft = {
  manufacturer_name: '', model: '', serial_number: '', mac_address: '',
  destination: 'new', notes: '', warranty_remaining_days: '', usage_remaining_days: '',
  software_version: '', firmware_version: '', affiliated_store: '', affiliated_client: '',
  country: '', province: '',
};

// Matches backend/fleet_inventory.py's TARGET_FIELDS - what a CSV column
// can be mapped to during import.
const TARGET_FIELDS = [
  { value: 'serial_number', label: 'Serial Number' },
  { value: 'destination', label: 'Destination' },
  { value: 'model', label: 'Model' },
  { value: 'manufacturer_name', label: 'Manufacturer' },
  { value: 'mac_address', label: 'MAC Address' },
  { value: 'affiliated_store', label: 'Affiliated Store' },
  { value: 'affiliated_client', label: 'Affiliated Client' },
  { value: 'warranty_remaining_days', label: 'Warranty Remaining' },
  { value: 'usage_remaining_days', label: 'Usage Remaining' },
  { value: 'software_version', label: 'Software Version' },
  { value: 'firmware_version', label: 'Firmware Version' },
  { value: 'country', label: 'Country' },
  { value: 'province', label: 'Province/State' },
  { value: 'notes', label: 'Notes' },
  { value: 'ignore', label: '(Ignore this column)' },
];

const FleetConsole = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [units, setUnits] = useState([]);
  const [loaners, setLoaners] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const [moveTarget, setMoveTarget] = useState(null); // the unit being moved
  const [moveTo, setMoveTo] = useState('');
  const [moving, setMoving] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState('pick'); // 'pick' | 'map' | 'confirm' | 'summary'
  const [importFile, setImportFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [useBatchDestination, setUseBatchDestination] = useState(false);
  const [batchDestination, setBatchDestination] = useState('new');
  const [saveAsProfile, setSaveAsProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  const tokenHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/units/dashboard`, { headers: tokenHeaders });
      setDashboard(res.data);
    } catch {
      // non-fatal, summary cards just stay blank
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTabData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'loaner') {
        const res = await axios.get(`${SERVICE_REPAIR_API}/loaners`, { headers: tokenHeaders });
        setLoaners(res.data || []);
      } else if (activeTab !== 'parts') {
        const res = await axios.get(`${API}/units`, { params: { destination: activeTab }, headers: tokenHeaders });
        setUnits(res.data || []);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load fleet data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { fetchTabData(); }, [fetchTabData]);

  const refresh = () => { fetchDashboard(); fetchTabData(); };

  const openCreate = () => {
    setIsCreating(true);
    setDraft({ ...emptyDraft, destination: ['service', 'sold'].includes(activeTab) ? activeTab : 'new' });
    setEditOpen(true);
  };

  const openEdit = (unit) => {
    setIsCreating(false);
    setDraft({ ...emptyDraft, ...unit });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setDraft(emptyDraft);
  };

  const saveDraft = async () => {
    if (!draft.model || !draft.serial_number) {
      toast({ title: 'Missing Fields', description: 'Model and Serial Number are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (isCreating) {
        await axios.post(`${API}/units`, draft, { headers: tokenHeaders });
        toast({ title: 'Created', description: 'Fleet unit created' });
      } else {
        await axios.put(`${API}/units/${draft.id}`, draft, { headers: tokenHeaders });
        toast({ title: 'Saved', description: 'Fleet unit updated' });
      }
      closeEdit();
      refresh();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to save fleet unit', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async () => {
    if (!draft.id) return;
    if (!window.confirm('Delete this fleet unit? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/units/${draft.id}`, { headers: tokenHeaders });
      toast({ title: 'Deleted', description: 'Fleet unit removed' });
      closeEdit();
      refresh();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to delete fleet unit', variant: 'destructive' });
    }
  };

  const openMove = (unit) => {
    setMoveTarget(unit);
    setMoveTo('');
  };

  const confirmMove = async () => {
    if (!moveTarget || !moveTo) return;
    setMoving(true);
    try {
      await axios.post(`${API}/units/${moveTarget.id}/move`, { to: moveTo }, { headers: tokenHeaders });
      toast({ title: 'Moved', description: `Unit moved to ${moveTo}` });
      setMoveTarget(null);
      refresh();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to move unit', variant: 'destructive' });
    } finally {
      setMoving(false);
    }
  };

  const resetImportState = () => {
    setImportStep('pick');
    setImportFile(null);
    setPreviewData(null);
    setColumnMapping({});
    setSelectedProfileId('');
    setUseBatchDestination(false);
    setBatchDestination('new');
    setSaveAsProfile(false);
    setProfileName('');
    setImportSummary(null);
  };

  const closeImport = () => {
    setImportOpen(false);
    resetImportState();
  };

  const handlePickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({ title: 'Invalid File', description: 'Please select a .csv file.', variant: 'destructive' });
      return;
    }
    setImportFile(file);
    setPreviewLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const [previewRes, profilesRes] = await Promise.all([
        axios.post(`${API}/import/csv/preview`, formData, { headers: tokenHeaders }),
        axios.get(`${API}/import/profiles`, { headers: tokenHeaders }).catch(() => ({ data: [] })),
      ]);
      setPreviewData(previewRes.data);
      setColumnMapping(previewRes.data.suggested_mapping || {});
      setSelectedProfileId(previewRes.data.matched_profile_id || '');
      setProfiles(profilesRes.data || []);
      const matched = (profilesRes.data || []).find((p) => p.id === previewRes.data.matched_profile_id);
      setProfileName(matched ? matched.name : '');
      setImportStep('map');
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to read CSV', variant: 'destructive' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const applyProfile = (profileId) => {
    setSelectedProfileId(profileId);
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    setColumnMapping((prev) => {
      const next = { ...prev };
      (previewData?.headers || []).forEach((h) => {
        if (profile.mapping[h.normalized]) next[h.normalized] = profile.mapping[h.normalized];
      });
      return next;
    });
    setProfileName(profile.name);
  };

  const setMappingFor = (normalized, target) => {
    setColumnMapping((prev) => ({ ...prev, [normalized]: target }));
  };

  const mappingHasTarget = (target) => Object.values(columnMapping).includes(target);

  const canContinueFromMap = () => {
    if (!mappingHasTarget('serial_number')) return false;
    if (!useBatchDestination && !mappingHasTarget('destination')) return false;
    return true;
  };

  const goToConfirm = () => {
    if (!canContinueFromMap()) {
      toast({
        title: 'Mapping Incomplete',
        description: 'Map a column to Serial Number, and either map Destination or choose a default destination below.',
        variant: 'destructive',
      });
      return;
    }
    setImportStep('confirm');
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      if (saveAsProfile && profileName.trim()) {
        const sourceHeaders = (previewData?.headers || []).map((h) => h.normalized);
        const payload = { name: profileName.trim(), mapping: columnMapping, source_headers: sourceHeaders };
        if (selectedProfileId) {
          await axios.put(`${API}/import/profiles/${selectedProfileId}`, payload, { headers: tokenHeaders }).catch(() => {});
        } else {
          await axios.post(`${API}/import/profiles`, payload, { headers: tokenHeaders }).catch(() => {});
        }
      }
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('mapping', JSON.stringify(columnMapping));
      if (useBatchDestination) formData.append('default_destination', batchDestination);
      const res = await axios.post(`${API}/import/csv`, formData, { headers: tokenHeaders });
      setImportSummary(res.data);
      toast({ title: 'Import Complete', description: `Created ${res.data.created_count}, skipped ${res.data.skipped_count}.` });
      setImportStep('summary');
      refresh();
    } catch (error) {
      toast({ title: 'Import Failed', description: error.response?.data?.detail || 'Failed to import CSV', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const moveOptions = (unit) => {
    if (!unit) return [];
    const current = unit.status ? 'loaner' : unit.destination;
    return ['new', 'service', 'loaner'].filter((d) => d !== current);
  };

  const statusLabel = (unit) => {
    if (unit.destination === 'sold') return <Badge className="bg-emerald-100 text-emerald-700">Sold</Badge>;
    if (unit.reserved_by_quote_id) return <Badge className="bg-amber-100 text-amber-700">Reserved</Badge>;
    return <Badge variant="outline">Available</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="fleet-console-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#6e2ea8]" />
            Fleet Console
          </h1>
          <p className="text-gray-500 text-sm mt-1">Every physical unit, in one place - New, Service, Parts, and Loaner</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handlePickFile} data-testid="fleet-import-input" />
          <Button variant="outline" onClick={() => setImportOpen(true)} data-testid="fleet-import-btn">
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          {activeTab !== 'parts' && activeTab !== 'loaner' && (
            <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={openCreate} data-testid="fleet-add-unit-btn">
              <Plus className="w-4 h-4 mr-2" /> Add Unit
            </Button>
          )}
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            ['New Available', dashboard.new_available],
            ['New Reserved', dashboard.new_reserved],
            ['Service', dashboard.service_count],
            ['Sold', dashboard.sold_count],
            ['Loaner Available', dashboard.loaner_available],
            ['Loaner Out', dashboard.loaner_checked_out],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b" data-testid="fleet-console-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-[#6e2ea8] text-[#6e2ea8]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            data-testid={`fleet-tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'parts' ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Parts are managed in Stock Levels, not here - they're ordinary catalog items, not serialized units.</p>
            <Link to="/admin/inventory/items">
              <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" />Go to Stock Levels</Button>
            </Link>
          </CardContent>
        </Card>
      ) : activeTab === 'loaner' ? (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : loaners.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No loaner units yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Model</th>
                      <th className="px-4 py-3 font-medium">Serial</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loaners.map((l) => (
                      <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{l.model}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{l.serial_number}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">{(l.status || '').replace('_', ' ')}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openMove(l)} data-testid={`fleet-move-btn-${l.id}`}>
                            <ArrowRightLeft className="w-4 h-4 mr-1.5" /> Move
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-3 border-t">
              <Link to="/admin/service-repair/loaners">
                <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 mr-2" />Full Loaner Management</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : units.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No {activeTab} units yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Model</th>
                      <th className="px-4 py-3 font-medium">Manufacturer</th>
                      <th className="px-4 py-3 font-medium">Serial</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u) => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(u)} data-testid={`fleet-unit-row-${u.id}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{u.model}</td>
                        <td className="px-4 py-3 text-gray-600">{u.manufacturer_name || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{u.serial_number}</td>
                        <td className="px-4 py-3">{statusLabel(u)}</td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {!u.reserved_by_quote_id && u.destination !== 'sold' && (
                            <Button variant="ghost" size="sm" onClick={() => openMove(u)} data-testid={`fleet-move-btn-${u.id}`}>
                              <ArrowRightLeft className="w-4 h-4 mr-1.5" /> Move
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit modal */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="fleet-unit-modal">
          <DialogTitle className="flex items-center justify-between">
            <span>{isCreating ? 'Add Fleet Unit' : 'Edit Fleet Unit'}</span>
            <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </DialogTitle>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Model *</Label>
                <Input value={draft.model} onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))} data-testid="fleet-field-model" />
              </div>
              <div>
                <Label>Serial Number *</Label>
                <Input value={draft.serial_number} onChange={(e) => setDraft((d) => ({ ...d, serial_number: e.target.value }))} data-testid="fleet-field-serial" />
              </div>
              <div>
                <Label>Manufacturer</Label>
                <Input value={draft.manufacturer_name} onChange={(e) => setDraft((d) => ({ ...d, manufacturer_name: e.target.value }))} data-testid="fleet-field-manufacturer" />
              </div>
              <div>
                <Label>MAC Address</Label>
                <Input value={draft.mac_address} onChange={(e) => setDraft((d) => ({ ...d, mac_address: e.target.value }))} data-testid="fleet-field-mac" />
              </div>
              {isCreating && (
                <div>
                  <Label>Destination</Label>
                  <Select value={draft.destination} onValueChange={(v) => setDraft((d) => ({ ...d, destination: v }))}>
                    <SelectTrigger data-testid="fleet-field-destination"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Software Version</Label>
                <Input value={draft.software_version} onChange={(e) => setDraft((d) => ({ ...d, software_version: e.target.value }))} data-testid="fleet-field-software-version" />
              </div>
              <div>
                <Label>Firmware Version</Label>
                <Input value={draft.firmware_version} onChange={(e) => setDraft((d) => ({ ...d, firmware_version: e.target.value }))} data-testid="fleet-field-firmware-version" />
              </div>
              <div>
                <Label>Warranty Remaining</Label>
                <Input value={draft.warranty_remaining_days} onChange={(e) => setDraft((d) => ({ ...d, warranty_remaining_days: e.target.value }))} placeholder="e.g. 1450 or permanent use" data-testid="fleet-field-warranty" />
              </div>
              <div>
                <Label>Usage Remaining</Label>
                <Input value={draft.usage_remaining_days} onChange={(e) => setDraft((d) => ({ ...d, usage_remaining_days: e.target.value }))} placeholder="e.g. 0 or permanent use" data-testid="fleet-field-usage" />
              </div>
              <div>
                <Label>Affiliated Store</Label>
                <Input value={draft.affiliated_store} onChange={(e) => setDraft((d) => ({ ...d, affiliated_store: e.target.value }))} data-testid="fleet-field-store" />
              </div>
              <div>
                <Label>Affiliated Client</Label>
                <Input value={draft.affiliated_client} onChange={(e) => setDraft((d) => ({ ...d, affiliated_client: e.target.value }))} data-testid="fleet-field-client" />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={draft.country} onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))} data-testid="fleet-field-country" />
              </div>
              <div>
                <Label>Province/State</Label>
                <Input value={draft.province} onChange={(e) => setDraft((d) => ({ ...d, province: e.target.value }))} data-testid="fleet-field-province" />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Input value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} data-testid="fleet-field-notes" />
              </div>
            </div>

            {!isCreating && draft.destination === 'sold' && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                <p className="font-medium text-emerald-800 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Sold</p>
                <p className="text-emerald-700">{draft.sold_owner_name} ({draft.sold_owner_email})</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              {!isCreating ? (
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={deleteDraft} data-testid="fleet-delete-btn">
                  Delete
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeEdit}>Cancel</Button>
                <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={saveDraft} disabled={saving} data-testid="fleet-save-btn">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isCreating ? 'Create' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move modal */}
      <Dialog open={!!moveTarget} onOpenChange={(open) => !open && setMoveTarget(null)}>
        <DialogContent className="max-w-sm" data-testid="fleet-move-modal">
          <DialogTitle>Move Unit</DialogTitle>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-600">
              {moveTarget?.model} (SN: {moveTarget?.serial_number})
            </p>
            <div>
              <Label>Move to</Label>
              <Select value={moveTo} onValueChange={setMoveTo}>
                <SelectTrigger data-testid="fleet-move-target-select"><SelectValue placeholder="Choose destination..." /></SelectTrigger>
                <SelectContent>
                  {moveOptions(moveTarget).map((opt) => (
                    <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMoveTarget(null)}>Cancel</Button>
              <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={confirmMove} disabled={!moveTo || moving} data-testid="fleet-move-confirm-btn">
                {moving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Move
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import modal */}
      <Dialog open={importOpen} onOpenChange={(open) => !open && closeImport()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="fleet-import-modal">
          <DialogTitle>Import Fleet CSV</DialogTitle>

          {importStep === 'pick' && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-gray-600">
                Upload any fleet spreadsheet - you'll map its columns to the right fields next, or reuse a saved mapping. Parts are managed separately via the Products CSV importer.
              </p>
              <Button onClick={() => fileInputRef.current?.click()} disabled={previewLoading} data-testid="fleet-import-choose-file-btn">
                {previewLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {previewLoading ? 'Reading...' : 'Choose CSV File'}
              </Button>
            </div>
          )}

          {importStep === 'map' && previewData && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">{importFile?.name} &middot; {previewData.total_rows} row(s)</p>
                {profiles.length > 0 && (
                  <Select value={selectedProfileId} onValueChange={applyProfile}>
                    <SelectTrigger className="w-56" data-testid="fleet-import-profile-select"><SelectValue placeholder="Use a saved profile..." /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useBatchDestination}
                    onChange={(e) => setUseBatchDestination(e.target.checked)}
                    data-testid="fleet-import-use-batch-destination"
                  />
                  All rows in this file are the same destination
                </label>
                {useBatchDestination && (
                  <Select value={batchDestination} onValueChange={setBatchDestination}>
                    <SelectTrigger className="w-48" data-testid="fleet-import-batch-destination-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="loaner">Loaner</SelectItem>
                      <SelectItem value="parts">Parts</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-left text-gray-500">
                      <th className="px-3 py-2 font-medium">CSV Column</th>
                      <th className="px-3 py-2 font-medium">Sample Value</th>
                      <th className="px-3 py-2 font-medium">Maps To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.headers.map((h) => {
                      const sample = previewData.sample_rows?.[0]?.[h.original] || '';
                      const mappedToDestination = useBatchDestination && columnMapping[h.normalized] === 'destination';
                      return (
                        <tr key={h.normalized} className={`border-b last:border-0 ${mappedToDestination ? 'opacity-40' : ''}`}>
                          <td className="px-3 py-2 font-medium text-gray-900">{h.original}</td>
                          <td className="px-3 py-2 text-gray-500 truncate max-w-[160px]">{sample}</td>
                          <td className="px-3 py-2">
                            <Select
                              value={columnMapping[h.normalized] || 'ignore'}
                              onValueChange={(v) => setMappingFor(h.normalized, v)}
                              disabled={mappedToDestination}
                            >
                              <SelectTrigger className="h-8 w-48" data-testid={`fleet-import-map-${h.normalized}`}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {TARGET_FIELDS.map((f) => (
                                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsProfile}
                    onChange={(e) => setSaveAsProfile(e.target.checked)}
                    data-testid="fleet-import-save-profile-toggle"
                  />
                  Save this mapping as a reusable profile
                </label>
                {saveAsProfile && (
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Profile name (e.g. PUDU Export)"
                    data-testid="fleet-import-profile-name-input"
                  />
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setImportStep('pick')}>Back</Button>
                <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={goToConfirm} data-testid="fleet-import-continue-btn">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {importStep === 'confirm' && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-gray-700">
                Importing <strong>{previewData?.total_rows}</strong> row(s) from <strong>{importFile?.name}</strong>
                {useBatchDestination ? <> — all rows set to <strong className="capitalize">{batchDestination}</strong></> : null}
                {saveAsProfile && profileName.trim() ? <> — saving mapping as "<strong>{profileName}</strong>"</> : null}.
              </p>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setImportStep('map')} disabled={importing}>Back</Button>
                <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={confirmImport} disabled={importing} data-testid="fleet-import-confirm-btn">
                  {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Confirm Import
                </Button>
              </div>
            </div>
          )}

          {importStep === 'summary' && importSummary && (
            <div className="space-y-4 mt-2">
              <div className="rounded-md border p-3 space-y-2 text-sm" data-testid="fleet-import-summary">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border p-2">Total: {importSummary.total_rows || 0}</div>
                  <div className="rounded-md border p-2 text-emerald-700">Created: {importSummary.created_count || 0}</div>
                  <div className="rounded-md border p-2 text-amber-700">Skipped: {importSummary.skipped_count || 0}</div>
                </div>
                {importSummary.errors?.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importSummary.errors.map((err, i) => (
                      <p key={i} className="text-xs text-gray-500">Row {err.row} ({err.serial_number || 'n/a'}): {err.error}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={closeImport}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FleetConsole;
