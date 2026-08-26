import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Wrench,
  Search,
  Loader2,
  Phone,
  Mail,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Trash2,
  X,
  Package,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import { useSiteFeatureFlags } from '../../hooks/useSiteFeatureFlags';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DEFAULT_COLUMNS = [
  { id: 'new_request', label: 'New Request', color: 'bg-blue-500', barColor: 'bg-blue-500' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-indigo-500', barColor: 'bg-indigo-500' },
  { id: 'diagnosed', label: 'Diagnosed', color: 'bg-amber-400', barColor: 'bg-amber-400' },
  { id: 'awaiting_parts', label: 'Awaiting Parts', color: 'bg-orange-500', barColor: 'bg-orange-500' },
  { id: 'in_repair', label: 'In Repair', color: 'bg-purple-500', barColor: 'bg-purple-500' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-600', barColor: 'bg-emerald-600' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-gray-400', barColor: 'bg-gray-400' },
];

const URGENCY_OPTIONS = ['low', 'normal', 'high', 'urgent'];
const URGENCY_BADGE_CLASS = {
  low: 'bg-gray-100 text-gray-700 border-gray-300',
  normal: 'bg-blue-100 text-blue-700 border-blue-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  urgent: 'bg-red-100 text-red-700 border-red-300',
};
const SERVICE_METHOD_OPTIONS = [
  { value: '', label: 'Unset' },
  { value: 'ship_in', label: 'Ship It In' },
  { value: 'on_site', label: 'On-Site Visit' },
];
const WARRANTY_OPTIONS = [
  { value: '', label: 'Unset' },
  { value: 'in_warranty', label: 'In Warranty' },
  { value: 'out_of_warranty', label: 'Out of Warranty' },
  { value: 'unknown', label: 'Unknown' },
];

const emptyDraft = {
  name: '', email: '', phone: '',
  make: '', model: '', serial_number: '',
  purchase_date: '', warranty_status: '', warranty_expiration: '',
  service_contract: '', service_contract_expiration: '',
  firmware_version: '', last_service_date: '',
  issue_description: '', urgency: 'normal', service_method: '', preferred_service_date: '',
  site_address: '', city: '', state: '', zip_code: '',
  notes: '', technician_notes: '', status: 'new_request',
};

const AdminServiceCrm = () => {
  const { service_crm_product_name: productName } = useSiteFeatureFlags();

  const [allRequests, setAllRequests] = useState({});
  const [listRequests, setListRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tokenHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchKanban = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/service-crm/`, { headers: tokenHeaders });
      setAllRequests(response.data || {});
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load service requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [tokenHeaders]);

  const fetchList = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/service-crm/list`, { headers: tokenHeaders });
      setListRequests(response.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load service requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [tokenHeaders]);

  const refresh = useCallback(() => {
    setLoading(true);
    if (view === 'kanban') fetchKanban();
    else fetchList();
  }, [view, fetchKanban, fetchList]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const matchesSearch = (req) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return [req.name, req.email, req.phone, req.make, req.model, req.serial_number, req.issue_description]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q));
  };

  const handleDragStart = (event, item, fromColumn) => {
    setDraggedItem({ ...item, fromColumn });
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event, columnId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDrop = async (event, toColumn) => {
    event.preventDefault();
    setDragOverColumn(null);
    if (!draggedItem || draggedItem.fromColumn === toColumn) {
      setDraggedItem(null);
      return;
    }

    const updated = { ...allRequests };
    updated[draggedItem.fromColumn] = (updated[draggedItem.fromColumn] || []).filter((item) => item.id !== draggedItem.id);
    updated[toColumn] = [{ ...draggedItem, status: toColumn }, ...(updated[toColumn] || [])];
    setAllRequests(updated);
    setDraggedItem(null);

    try {
      await axios.patch(`${API}/service-crm/${draggedItem.id}/status`, { status: toColumn }, { headers: tokenHeaders });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to move service request', variant: 'destructive' });
      fetchKanban();
    }
  };

  const openEdit = (req) => {
    setDraft({ ...emptyDraft, ...req });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setDraft(emptyDraft);
  };

  const saveDraft = async () => {
    if (!draft.id) return;
    setSaving(true);
    try {
      await axios.put(`${API}/service-crm/${draft.id}`, draft, { headers: tokenHeaders });
      toast({ title: 'Saved', description: 'Service request updated' });
      closeEdit();
      refresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save service request', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async () => {
    if (!draft.id) return;
    if (!window.confirm('Delete this service request? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/service-crm/${draft.id}`, { headers: tokenHeaders });
      toast({ title: 'Deleted', description: 'Service request removed' });
      closeEdit();
      refresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete service request', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredList = listRequests.filter(matchesSearch);

  return (
    <div className="space-y-4" data-testid="service-crm-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#6e2ea8]" />
            {productName} Service Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage {(productName || 'product').toLowerCase()} service &amp; repair requests</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search service requests..."
              className="pl-9 w-64"
              data-testid="service-crm-search-input"
            />
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            <button
              className={`px-3 py-2 text-sm flex items-center gap-1.5 ${view === 'kanban' ? 'bg-[#6e2ea8] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setView('kanban')}
              data-testid="service-crm-view-kanban"
            >
              <LayoutGrid className="w-4 h-4" /> Kanban
            </button>
            <button
              className={`px-3 py-2 text-sm flex items-center gap-1.5 border-l ${view === 'list' ? 'bg-[#6e2ea8] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setView('list')}
              data-testid="service-crm-view-list"
            >
              <ListIcon className="w-4 h-4" /> List
            </button>
          </div>
          <Button variant="outline" onClick={refresh} data-testid="service-crm-refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4" data-testid="service-crm-kanban-columns">
          {DEFAULT_COLUMNS.map((column) => {
            const columnItems = (allRequests[column.id] || []).filter(matchesSearch);
            const isDropTarget = dragOverColumn === column.id;
            return (
              <div
                key={column.id}
                className={`rounded-xl border-2 transition-all w-[280px] min-w-[280px] flex-shrink-0 ${isDropTarget ? 'border-[#6e2ea8] bg-purple-50 shadow-lg' : 'border-gray-200 bg-gray-50'}`}
                onDragOver={(event) => handleDragOver(event, column.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(event) => handleDrop(event, column.id)}
                data-testid={`service-crm-column-${column.id}`}
              >
                <div className={`h-1.5 ${column.barColor} rounded-t-xl`} />
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-gray-800 text-sm">{column.label}</h3>
                  </div>
                  <div className="text-xs text-gray-400">
                    {columnItems.length} {columnItems.length === 1 ? 'request' : 'requests'}
                  </div>
                </div>

                <div className="p-3 space-y-3 min-h-[430px] max-h-[640px] overflow-y-auto">
                  {columnItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No requests</p>
                    </div>
                  ) : (
                    columnItems.map((req) => (
                      <Card
                        key={req.id}
                        draggable
                        onDragStart={(event) => handleDragStart(event, req, column.id)}
                        onClick={() => openEdit(req)}
                        className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white overflow-hidden ${draggedItem?.id === req.id ? 'opacity-50 scale-95' : ''}`}
                        data-testid={`service-crm-card-${req.id}`}
                      >
                        <CardContent className="p-3.5">
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <span className="font-bold text-gray-900 text-sm leading-tight truncate">{req.name}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 border ${URGENCY_BADGE_CLASS[req.urgency] || URGENCY_BADGE_CLASS.normal}`}>
                              {(req.urgency || 'normal').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-xs text-gray-500 mb-3">
                            <div className="truncate"><span className="text-gray-400">Make/Model: </span><span className="text-gray-700">{req.make} {req.model}</span></div>
                            {req.issue_description && (
                              <div className="line-clamp-2 text-gray-600">{req.issue_description}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                            {req.phone && (
                              <button onClick={(e) => { e.stopPropagation(); window.open(`tel:${req.phone}`); }} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                                <Phone className="w-3 h-3 text-gray-400" />
                              </button>
                            )}
                            {req.email && (
                              <button onClick={(e) => { e.stopPropagation(); window.open(`mailto:${req.email}`); }} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                                <Mail className="w-3 h-3 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden" data-testid="service-crm-list-table">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Make / Model</th>
                <th className="px-4 py-3 font-medium">Urgency</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">No service requests found</td>
                </tr>
              ) : (
                filteredList.map((req) => {
                  const column = DEFAULT_COLUMNS.find((c) => c.id === req.status) || DEFAULT_COLUMNS[0];
                  return (
                    <tr
                      key={req.id}
                      onClick={() => openEdit(req)}
                      className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                      data-testid={`service-crm-list-row-${req.id}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{req.name}</td>
                      <td className="px-4 py-3 text-gray-600">{req.make} {req.model}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] px-1.5 py-0 border ${URGENCY_BADGE_CLASS[req.urgency] || URGENCY_BADGE_CLASS.normal}`}>
                          {(req.urgency || 'normal').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                          <span className={`w-2 h-2 rounded-full ${column.color}`} />
                          {column.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="service-crm-edit-modal">
          <DialogTitle className="flex items-center justify-between">
            <span>Service Request</span>
            <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>

          <div className="space-y-5 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} data-testid="service-crm-field-name" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}>
                  <SelectTrigger data-testid="service-crm-field-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_COLUMNS.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} data-testid="service-crm-field-email" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} data-testid="service-crm-field-phone" />
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-sm font-semibold text-gray-700 mb-3">Product Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Make</Label>
                  <Input value={draft.make} onChange={(e) => setDraft((d) => ({ ...d, make: e.target.value }))} data-testid="service-crm-field-make" />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={draft.model} onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))} data-testid="service-crm-field-model" />
                </div>
                <div>
                  <Label>Serial Number</Label>
                  <Input value={draft.serial_number} onChange={(e) => setDraft((d) => ({ ...d, serial_number: e.target.value }))} data-testid="service-crm-field-serial" />
                </div>
                <div>
                  <Label>Firmware Version</Label>
                  <Input value={draft.firmware_version} onChange={(e) => setDraft((d) => ({ ...d, firmware_version: e.target.value }))} data-testid="service-crm-field-firmware" />
                </div>
                <div>
                  <Label>Purchase / Install Date</Label>
                  <Input type="date" value={draft.purchase_date} onChange={(e) => setDraft((d) => ({ ...d, purchase_date: e.target.value }))} data-testid="service-crm-field-purchase-date" />
                </div>
                <div>
                  <Label>Last Service Date</Label>
                  <Input type="date" value={draft.last_service_date} onChange={(e) => setDraft((d) => ({ ...d, last_service_date: e.target.value }))} data-testid="service-crm-field-last-service-date" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-sm font-semibold text-gray-700 mb-3">Warranty &amp; Service Contract</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Warranty Status</Label>
                  <Select
                    value={draft.warranty_status || 'unset'}
                    onValueChange={(v) => setDraft((d) => ({ ...d, warranty_status: v === 'unset' ? '' : v }))}
                  >
                    <SelectTrigger data-testid="service-crm-field-warranty-status"><SelectValue placeholder="Unset" /></SelectTrigger>
                    <SelectContent>
                      {WARRANTY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || 'unset'} value={opt.value || 'unset'}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Warranty Expiration</Label>
                  <Input type="date" value={draft.warranty_expiration} onChange={(e) => setDraft((d) => ({ ...d, warranty_expiration: e.target.value }))} data-testid="service-crm-field-warranty-expiration" />
                </div>
                <div>
                  <Label>Service Contract</Label>
                  <Input value={draft.service_contract} onChange={(e) => setDraft((d) => ({ ...d, service_contract: e.target.value }))} placeholder="Plan / contract number" data-testid="service-crm-field-service-contract" />
                </div>
                <div>
                  <Label>Service Contract Expiration</Label>
                  <Input type="date" value={draft.service_contract_expiration} onChange={(e) => setDraft((d) => ({ ...d, service_contract_expiration: e.target.value }))} data-testid="service-crm-field-service-contract-expiration" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-sm font-semibold text-gray-700 mb-3">Service Request</p>
              <div className="space-y-4">
                <div>
                  <Label>Issue Description</Label>
                  <Textarea rows={3} value={draft.issue_description} onChange={(e) => setDraft((d) => ({ ...d, issue_description: e.target.value }))} data-testid="service-crm-field-issue" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Urgency</Label>
                    <Select value={draft.urgency || 'normal'} onValueChange={(v) => setDraft((d) => ({ ...d, urgency: v }))}>
                      <SelectTrigger data-testid="service-crm-field-urgency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {URGENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Preferred Service Date</Label>
                    <Input type="date" value={draft.preferred_service_date} onChange={(e) => setDraft((d) => ({ ...d, preferred_service_date: e.target.value }))} data-testid="service-crm-field-preferred-date" />
                  </div>
                </div>
                <div>
                  <Label>Service Method</Label>
                  <Select
                    value={draft.service_method || 'unset'}
                    onValueChange={(v) => setDraft((d) => ({ ...d, service_method: v === 'unset' ? '' : v }))}
                  >
                    <SelectTrigger data-testid="service-crm-field-service-method"><SelectValue placeholder="Unset" /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_METHOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || 'unset'} value={opt.value || 'unset'}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>{draft.service_method === 'ship_in' ? 'Return Shipping Address' : 'Site Address (if on-site service)'}</Label>
                    <Input value={draft.site_address} onChange={(e) => setDraft((d) => ({ ...d, site_address: e.target.value }))} data-testid="service-crm-field-site-address" />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} data-testid="service-crm-field-city" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={draft.state} onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value }))} data-testid="service-crm-field-state" />
                  </div>
                  <div>
                    <Label>Zip Code</Label>
                    <Input value={draft.zip_code} onChange={(e) => setDraft((d) => ({ ...d, zip_code: e.target.value }))} data-testid="service-crm-field-zip" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-sm font-semibold text-gray-700 mb-3">Internal Notes</p>
              <div className="space-y-4">
                <div>
                  <Label>Customer Notes</Label>
                  <Textarea rows={2} value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} data-testid="service-crm-field-notes" />
                </div>
                <div>
                  <Label>Technician Notes</Label>
                  <Textarea rows={2} value={draft.technician_notes} onChange={(e) => setDraft((d) => ({ ...d, technician_notes: e.target.value }))} data-testid="service-crm-field-technician-notes" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={deleteDraft} disabled={deleting} data-testid="service-crm-delete-button">
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeEdit}>Cancel</Button>
                <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={saveDraft} disabled={saving} data-testid="service-crm-save-button">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServiceCrm;
