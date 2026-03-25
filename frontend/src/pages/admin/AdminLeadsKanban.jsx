import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Users,
  GripVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Loader2,
  Search,
  Paperclip,
  ExternalLink,
  Plus,
  CheckCircle2,
  Clock3,
  CreditCard,
  Link as LinkIcon,
  UserRound,
  UserPlus,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLUMNS = [
  { id: 'opportunity', label: 'Opportunity', color: 'bg-blue-500', lightColor: 'bg-blue-50 border-blue-200' },
  { id: 'needs_order', label: 'Needs Order', color: 'bg-amber-500', lightColor: 'bg-amber-50 border-amber-200' },
  { id: 'needs_support', label: 'Needs Support', color: 'bg-purple-500', lightColor: 'bg-purple-50 border-purple-200' },
  { id: 'miscellaneous', label: 'Miscellaneous', color: 'bg-gray-500', lightColor: 'bg-gray-50 border-gray-200' },
];

const SECTION_TABS = [
  { id: 'opportunity-details', label: 'Opportunity Details', icon: UserRound },
  { id: 'appointments', label: 'Book/Update Appointment', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'associated-objects', label: 'Associated Objects', icon: LinkIcon },
];

const PIPELINE_OPTIONS = ['001. Main Leads Pipeline', '002. Enterprise Opportunities', '003. Follow-up Pipeline'];
const STAGE_OPTIONS = ['1. New Inquiry', '2. Discovery Call', '3. Contacted Lead', '4. Proposal Sent', '5. Negotiation', '6. Won', '7. Lost'];
const OPPORTUNITY_STATUS_OPTIONS = ['Open', 'In Progress', 'Won', 'Lost', 'On Hold'];
const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Failed', 'Refunded'];
const PAYMENT_METHOD_OPTIONS = ['Cash', 'Card', 'ACH', 'Wire', 'Check'];

const normalizeLeadForEdit = (lead) => ({
  ...lead,
  primary_contact_name: lead.primary_contact_name || lead.name || '',
  primary_email: lead.primary_email || lead.email || '',
  primary_phone: lead.primary_phone || lead.phone || '',
  additional_contacts: Array.isArray(lead.additional_contacts) ? lead.additional_contacts : [],
  opportunity_name: lead.opportunity_name || lead.name || '',
  pipeline: lead.pipeline || '001. Main Leads Pipeline',
  stage: lead.stage || '3. Contacted Lead',
  opportunity_status: lead.opportunity_status || 'Open',
  opportunity_value: lead.opportunity_value ?? '',
  owner_id: lead.owner_id || '',
  followers: Array.isArray(lead.followers) ? lead.followers : [],
  business_name: lead.business_name || '',
  opportunity_source: lead.opportunity_source || lead.source || '',
  tags: Array.isArray(lead.tags) ? lead.tags : [],
  appointments: Array.isArray(lead.appointments) ? lead.appointments : [],
  tasks: Array.isArray(lead.tasks) ? lead.tasks : [],
  notes_timeline: Array.isArray(lead.notes_timeline) ? lead.notes_timeline : [],
  payments: Array.isArray(lead.payments) ? lead.payments : [],
  associated_objects: Array.isArray(lead.associated_objects) ? lead.associated_objects : [],
  converted_to_client: Boolean(lead.converted_to_client),
});

const isValueFilled = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value === 0) return true;
  return `${value ?? ''}`.trim() !== '';
};

const AdminLeadsKanban = () => {
  const [leads, setLeads] = useState({ opportunity: [], needs_order: [], needs_support: [], miscellaneous: [] });
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [activeSection, setActiveSection] = useState('opportunity-details');
  const [hideEmptyFields, setHideEmptyFields] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [staffOptions, setStaffOptions] = useState([]);

  const [additionalContactInput, setAdditionalContactInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [appointmentDraft, setAppointmentDraft] = useState({ date: '', title: '', location: '', notes: '' });
  const [taskDraft, setTaskDraft] = useState('');
  const [timelineNoteDraft, setTimelineNoteDraft] = useState('');
  const [paymentDraft, setPaymentDraft] = useState({ date: '', amount: '', status: 'Pending', method: 'Card', note: '' });
  const [associatedObjectDraft, setAssociatedObjectDraft] = useState({ type: '', reference: '', url: '' });

  const tokenHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/leads/`, { headers: tokenHeaders });
      setLeads(response.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load opportunities', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [tokenHeaders]);

  const fetchStaffOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/users/staff`, { headers: tokenHeaders });
      setStaffOptions(response.data || []);
    } catch (error) {
      setStaffOptions([]);
    }
  }, [tokenHeaders]);

  useEffect(() => {
    fetchLeads();
    fetchStaffOptions();
  }, [fetchLeads, fetchStaffOptions]);

  const handleDragStart = (event, lead, fromColumn) => {
    setDraggedLead({ ...lead, fromColumn });
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
    if (!draggedLead || draggedLead.fromColumn === toColumn) {
      setDraggedLead(null);
      return;
    }

    const updated = { ...leads };
    updated[draggedLead.fromColumn] = updated[draggedLead.fromColumn].filter((item) => item.id !== draggedLead.id);
    updated[toColumn] = [{ ...draggedLead, status: toColumn }, ...updated[toColumn]];
    setLeads(updated);

    try {
      await axios.patch(`${API}/leads/${draggedLead.id}/status`, { status: toColumn }, { headers: tokenHeaders });
    } catch (error) {
      fetchLeads();
      toast({ title: 'Error', description: 'Failed to move opportunity', variant: 'destructive' });
    }
    setDraggedLead(null);
  };

  const openEditModal = (lead, section = 'opportunity-details') => {
    setSelectedLead(normalizeLeadForEdit(lead));
    setActiveSection(section);
    setHideEmptyFields(false);
    setAdditionalContactInput('');
    setTagInput('');
    setAppointmentDraft({ date: '', title: '', location: '', notes: '' });
    setTaskDraft('');
    setTimelineNoteDraft('');
    setPaymentDraft({ date: '', amount: '', status: 'Pending', method: 'Card', note: '' });
    setAssociatedObjectDraft({ type: '', reference: '', url: '' });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedLead(null);
  };

  const handleDelete = async (lead) => {
    if (!window.confirm(`Delete opportunity from ${lead.name}?`)) return;
    try {
      await axios.delete(`${API}/leads/${lead.id}`, { headers: tokenHeaders });
      toast({ title: 'Opportunity Deleted', description: 'Record removed successfully' });
      if (selectedLead?.id === lead.id) closeEditModal();
      fetchLeads();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete opportunity', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedLead) return;
    if (!selectedLead.primary_contact_name || !selectedLead.opportunity_name) {
      toast({ title: 'Missing Required Fields', description: 'Primary Contact Name and Opportunity Name are required.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...selectedLead,
        opportunity_value: selectedLead.opportunity_value === '' ? null : Number(selectedLead.opportunity_value),
      };
      await axios.put(`${API}/leads/${selectedLead.id}`, payload, { headers: tokenHeaders });
      toast({ title: 'Opportunity Updated', description: 'Changes saved successfully.' });
      closeEditModal();
      fetchLeads();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update opportunity', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToClient = async () => {
    if (!selectedLead) return;
    setConverting(true);
    try {
      const response = await axios.post(`${API}/leads/${selectedLead.id}/convert-to-client`, {}, { headers: tokenHeaders });
      const tempPassword = response.data?.temporary_password;
      toast({
        title: 'Converted to Client',
        description: tempPassword
          ? `Client created. Temporary password: ${tempPassword}`
          : 'Opportunity converted and synced to customers.',
      });
      closeEditModal();
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Conversion Failed',
        description: error.response?.data?.detail || 'Could not convert opportunity to client.',
        variant: 'destructive',
      });
    } finally {
      setConverting(false);
    }
  };

  const setLeadField = (field, value) => setSelectedLead((prev) => ({ ...prev, [field]: value }));

  const addArrayItem = (field, item) => {
    if (!item) return;
    setSelectedLead((prev) => ({ ...prev, [field]: [...(prev[field] || []), item] }));
  };

  const removeArrayItem = (field, index) => {
    setSelectedLead((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const toggleFollower = (staffId) => {
    setSelectedLead((prev) => {
      const current = prev.followers || [];
      const exists = current.includes(staffId);
      return {
        ...prev,
        followers: exists ? current.filter((id) => id !== staffId) : [...current, staffId],
      };
    });
  };

  const addAppointment = () => {
    if (!appointmentDraft.date || !appointmentDraft.title) return;
    addArrayItem('appointments', { ...appointmentDraft, id: crypto.randomUUID?.() || Date.now().toString() });
    setAppointmentDraft({ date: '', title: '', location: '', notes: '' });
  };

  const addTask = () => {
    if (!taskDraft.trim()) return;
    addArrayItem('tasks', { id: crypto.randomUUID?.() || Date.now().toString(), title: taskDraft.trim(), completed: false, created_at: new Date().toISOString() });
    setTaskDraft('');
  };

  const toggleTaskComplete = (taskId) => {
    setSelectedLead((prev) => ({
      ...prev,
      tasks: (prev.tasks || []).map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const addTimelineNote = () => {
    if (!timelineNoteDraft.trim()) return;
    addArrayItem('notes_timeline', {
      id: crypto.randomUUID?.() || Date.now().toString(),
      note: timelineNoteDraft.trim(),
      created_at: new Date().toISOString(),
    });
    setTimelineNoteDraft('');
  };

  const addPayment = () => {
    if (!paymentDraft.amount) return;
    addArrayItem('payments', {
      ...paymentDraft,
      id: crypto.randomUUID?.() || Date.now().toString(),
      amount: Number(paymentDraft.amount),
      date: paymentDraft.date || new Date().toISOString().slice(0, 10),
    });
    setPaymentDraft({ date: '', amount: '', status: 'Pending', method: 'Card', note: '' });
  };

  const addAssociatedObject = () => {
    if (!associatedObjectDraft.type || !associatedObjectDraft.reference) return;
    addArrayItem('associated_objects', {
      ...associatedObjectDraft,
      id: crypto.randomUUID?.() || Date.now().toString(),
    });
    setAssociatedObjectDraft({ type: '', reference: '', url: '' });
  };

  const shouldShowField = (value, required = false) => !hideEmptyFields || required || isValueFilled(value);

  const filterLeads = (columnLeads) => {
    if (!searchQuery.trim()) return columnLeads;
    const query = searchQuery.toLowerCase();
    return columnLeads.filter((lead) =>
      lead.name?.toLowerCase().includes(query)
      || lead.email?.toLowerCase().includes(query)
      || lead.subject?.toLowerCase().includes(query)
      || lead.message?.toLowerCase().includes(query)
    );
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="opportunities-loading-state">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37,99,235)]" />
      </div>
    );
  }

  const totalLeads = Object.values(leads).flat().length;

  return (
    <div className="space-y-6" data-testid="admin-opportunities-kanban">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3" data-testid="opportunities-page-title">
            <Users className="w-8 h-8 text-[rgb(37,99,235)]" />
            Opportunities
          </h1>
          <p className="text-gray-500" data-testid="opportunities-count-label">{totalLeads} total opportunities from contact forms</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search opportunities..."
            className="pl-9 w-72"
            data-testid="opportunities-search-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="opportunities-kanban-columns">
        {COLUMNS.map((column) => {
          const columnLeads = filterLeads(leads[column.id] || []);
          const isDropTarget = dragOverColumn === column.id;
          return (
            <div
              key={column.id}
              className={`rounded-xl border-2 transition-all ${isDropTarget ? 'border-[rgb(37,99,235)] bg-blue-50 shadow-lg' : 'border-gray-200 bg-gray-50'}`}
              onDragOver={(event) => handleDragOver(event, column.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(event) => handleDrop(event, column.id)}
              data-testid={`opportunities-column-${column.id}`}
            >
              <div className={`px-4 py-3 border-b ${column.lightColor} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-gray-800">{column.label}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white">{columnLeads.length}</Badge>
                </div>
              </div>

              <div className="p-3 space-y-3 min-h-[430px] max-h-[640px] overflow-y-auto">
                {columnLeads.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No opportunities</p>
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={(event) => handleDragStart(event, lead, column.id)}
                      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white ${draggedLead?.id === lead.id ? 'opacity-50 scale-95' : ''}`}
                      data-testid={`opportunity-card-${lead.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-gray-300" />
                            <span className="font-medium text-gray-900 truncate max-w-[140px]">{lead.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => openEditModal(lead, 'opportunity-details')}
                              data-testid={`opportunity-edit-button-${lead.id}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-amber-50 hover:text-amber-600"
                              onClick={() => openEditModal(lead, 'notes')}
                              data-testid={`opportunity-notes-button-${lead.id}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDelete(lead)}
                              data-testid={`opportunity-delete-button-${lead.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <a href={`mailto:${lead.email}`} className="truncate hover:text-[rgb(37,99,235)] hover:underline">{lead.email}</a>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              <a href={`tel:${lead.phone}`} className="hover:text-[rgb(37,99,235)] hover:underline">{lead.phone}</a>
                            </div>
                          )}
                          {lead.subject && <p className="text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded truncate">{lead.subject}</p>}
                          {lead.notes && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 line-clamp-2">{lead.notes}</p>}
                          {Array.isArray(lead.attachments) && lead.attachments.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <Paperclip className="w-3 h-3 text-blue-500" />
                              <div className="flex flex-wrap gap-1">
                                {lead.attachments.map((attachment, index) => (
                                  <a
                                    key={`${lead.id}-att-${index}`}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                  >
                                    {attachment.name?.slice(0, 15)}{attachment.name?.length > 15 ? '...' : ''}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lead.created_at)}
                          </div>
                          <Badge variant="outline" className="text-xs">{lead.source || 'Contact Form'}</Badge>
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

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-[1280px] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col" data-testid="opportunity-edit-modal">
          {selectedLead && (
            <div className="h-full min-h-0 flex flex-col">
              <div className="px-7 pt-6 pb-4 border-b border-gray-200" data-testid="opportunity-modal-header">
                <h2 className="text-4xl font-semibold text-gray-800 leading-none" data-testid="opportunity-modal-title">Edit “{selectedLead.opportunity_name || selectedLead.name || 'Opportunity'}”</h2>
                <p className="text-gray-500 mt-3 text-base">Add and edit opportunity details, tasks, notes and appointments.</p>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden flex">
                <aside className="w-[280px] min-h-0 border-r border-gray-200 bg-[#f8f8f9] p-4 flex flex-col" data-testid="opportunity-modal-sidebar">
                  <nav className="space-y-1 flex-1">
                    {SECTION_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveSection(tab.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-base transition-colors ${activeSection === tab.id ? 'bg-[#e8ecfb] text-[#3454b4] font-semibold' : 'text-gray-600 hover:bg-gray-200/70'}`}
                        data-testid={`opportunity-modal-tab-${tab.id}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                  <div className="pt-3 border-t border-gray-200 text-sm text-blue-600 font-medium" data-testid="opportunity-modal-add-manage-fields">
                    + Add/Manage Fields
                  </div>
                </aside>

                <section className="flex-1 min-h-0 overflow-y-auto p-6" data-testid="opportunity-modal-main-content">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[30px] font-semibold text-gray-800">{SECTION_TABS.find((tab) => tab.id === activeSection)?.label}</h3>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-600" data-testid="opportunity-hide-empty-toggle-wrap">
                      <Checkbox checked={hideEmptyFields} onCheckedChange={(value) => setHideEmptyFields(Boolean(value))} data-testid="opportunity-hide-empty-toggle" />
                      Hide Empty Fields
                    </label>
                  </div>

                  {activeSection === 'opportunity-details' && (
                    <div className="space-y-8" data-testid="opportunity-details-section">
                      <div className="border-t border-b border-gray-200 py-5">
                        <h4 className="text-[28px] font-semibold text-gray-800 mb-4">Contact details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {shouldShowField(selectedLead.primary_contact_name, true) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Primary Contact Name *</Label>
                              <Input value={selectedLead.primary_contact_name || ''} onChange={(event) => setLeadField('primary_contact_name', event.target.value)} className="h-12 mt-2" data-testid="opportunity-primary-contact-name-input" />
                            </div>
                          )}
                          {shouldShowField(selectedLead.primary_email) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Primary Email</Label>
                              <Input value={selectedLead.primary_email || ''} onChange={(event) => setLeadField('primary_email', event.target.value)} className="h-12 mt-2" data-testid="opportunity-primary-email-input" />
                            </div>
                          )}
                          {shouldShowField(selectedLead.primary_phone) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Primary Phone</Label>
                              <Input value={selectedLead.primary_phone || ''} onChange={(event) => setLeadField('primary_phone', event.target.value)} className="h-12 mt-2" data-testid="opportunity-primary-phone-input" />
                            </div>
                          )}
                          {shouldShowField(selectedLead.additional_contacts) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Additional Contacts (Max: 10)</Label>
                              <div className="flex gap-2 mt-2">
                                <Input value={additionalContactInput} onChange={(event) => setAdditionalContactInput(event.target.value)} placeholder="Add additional contacts" className="h-12" data-testid="opportunity-additional-contact-input" />
                                <Button type="button" variant="outline" onClick={() => {
                                  if (!additionalContactInput.trim()) return;
                                  if ((selectedLead.additional_contacts || []).length >= 10) return;
                                  addArrayItem('additional_contacts', additionalContactInput.trim());
                                  setAdditionalContactInput('');
                                }} data-testid="opportunity-additional-contact-add-button">Add</Button>
                              </div>
                              {(selectedLead.additional_contacts || []).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2" data-testid="opportunity-additional-contacts-list">
                                  {selectedLead.additional_contacts.map((contact, index) => (
                                    <Badge key={`contact-${index}`} variant="outline" className="gap-2">
                                      {contact}
                                      <button type="button" onClick={() => removeArrayItem('additional_contacts', index)} data-testid={`opportunity-remove-additional-contact-${index}`}>×</button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[30px] font-semibold text-gray-800 mb-4">Opportunity Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {shouldShowField(selectedLead.opportunity_name, true) && (
                            <div className="md:col-span-2">
                              <Label className="text-sm font-semibold text-gray-700">Opportunity Name *</Label>
                              <Input value={selectedLead.opportunity_name || ''} onChange={(event) => setLeadField('opportunity_name', event.target.value)} className="h-12 mt-2" data-testid="opportunity-name-input" />
                            </div>
                          )}

                          {shouldShowField(selectedLead.pipeline) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Pipeline</Label>
                              <select value={selectedLead.pipeline || ''} onChange={(event) => setLeadField('pipeline', event.target.value)} className="w-full h-12 mt-2 rounded-md border border-gray-300 px-3" data-testid="opportunity-pipeline-select">
                                {PIPELINE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                              </select>
                            </div>
                          )}

                          {shouldShowField(selectedLead.stage) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Stage</Label>
                              <select value={selectedLead.stage || ''} onChange={(event) => setLeadField('stage', event.target.value)} className="w-full h-12 mt-2 rounded-md border border-gray-300 px-3" data-testid="opportunity-stage-select">
                                {STAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                              </select>
                            </div>
                          )}

                          {shouldShowField(selectedLead.opportunity_status) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Status</Label>
                              <select value={selectedLead.opportunity_status || 'Open'} onChange={(event) => setLeadField('opportunity_status', event.target.value)} className="w-full h-12 mt-2 rounded-md border border-gray-300 px-3" data-testid="opportunity-status-select">
                                {OPPORTUNITY_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                              </select>
                            </div>
                          )}

                          {shouldShowField(selectedLead.opportunity_value) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Opportunity Value</Label>
                              <Input type="number" value={selectedLead.opportunity_value ?? ''} onChange={(event) => setLeadField('opportunity_value', event.target.value)} placeholder="$ 200000" className="h-12 mt-2" data-testid="opportunity-value-input" />
                            </div>
                          )}

                          {shouldShowField(selectedLead.owner_id) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Owner</Label>
                              <select value={selectedLead.owner_id || ''} onChange={(event) => setLeadField('owner_id', event.target.value)} className="w-full h-12 mt-2 rounded-md border border-gray-300 px-3" data-testid="opportunity-owner-select">
                                <option value="">Unassigned</option>
                                {staffOptions.map((staff) => <option key={staff.id} value={staff.id}>{staff.name} ({staff.email})</option>)}
                              </select>
                            </div>
                          )}

                          {shouldShowField(selectedLead.followers) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Followers</Label>
                              <div className="mt-2 rounded-md border border-gray-300 p-3 max-h-36 overflow-y-auto" data-testid="opportunity-followers-select-list">
                                {staffOptions.length === 0 ? (
                                  <p className="text-sm text-gray-500">No staff available</p>
                                ) : (
                                  staffOptions.map((staff) => (
                                    <label key={staff.id} className="flex items-center gap-2 py-1 text-sm">
                                      <Checkbox checked={(selectedLead.followers || []).includes(staff.id)} onCheckedChange={() => toggleFollower(staff.id)} data-testid={`opportunity-follower-checkbox-${staff.id}`} />
                                      <span>{staff.name}</span>
                                    </label>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {shouldShowField(selectedLead.business_name) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Business Name</Label>
                              <Input value={selectedLead.business_name || ''} onChange={(event) => setLeadField('business_name', event.target.value)} className="h-12 mt-2" data-testid="opportunity-business-name-input" />
                            </div>
                          )}

                          {shouldShowField(selectedLead.opportunity_source) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Opportunity Source</Label>
                              <Input value={selectedLead.opportunity_source || ''} onChange={(event) => setLeadField('opportunity_source', event.target.value)} placeholder="Enter source" className="h-12 mt-2" data-testid="opportunity-source-input" />
                            </div>
                          )}

                          {shouldShowField(selectedLead.tags) && (
                            <div className="md:col-span-2">
                              <Label className="text-sm font-semibold text-gray-700">Tags</Label>
                              <div className="flex gap-2 mt-2">
                                <Input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="Add tags" className="h-12" data-testid="opportunity-tag-input" />
                                <Button type="button" variant="outline" onClick={() => {
                                  const cleanTag = tagInput.trim();
                                  if (!cleanTag) return;
                                  if ((selectedLead.tags || []).includes(cleanTag)) return;
                                  addArrayItem('tags', cleanTag);
                                  setTagInput('');
                                }} data-testid="opportunity-tag-add-button">Add</Button>
                              </div>
                              {(selectedLead.tags || []).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2" data-testid="opportunity-tags-list">
                                  {selectedLead.tags.map((tag, index) => (
                                    <Badge key={`${tag}-${index}`} variant="outline" className="gap-2">
                                      {tag}
                                      <button type="button" onClick={() => removeArrayItem('tags', index)} data-testid={`opportunity-remove-tag-${index}`}>×</button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'appointments' && (
                    <div className="space-y-4" data-testid="opportunity-appointments-section">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold">Appointment Date/Time</Label>
                          <Input type="datetime-local" value={appointmentDraft.date} onChange={(event) => setAppointmentDraft((prev) => ({ ...prev, date: event.target.value }))} className="h-12 mt-2" data-testid="opportunity-appointment-date-input" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Title</Label>
                          <Input value={appointmentDraft.title} onChange={(event) => setAppointmentDraft((prev) => ({ ...prev, title: event.target.value }))} className="h-12 mt-2" data-testid="opportunity-appointment-title-input" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Location</Label>
                          <Input value={appointmentDraft.location} onChange={(event) => setAppointmentDraft((prev) => ({ ...prev, location: event.target.value }))} className="h-12 mt-2" data-testid="opportunity-appointment-location-input" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Notes</Label>
                          <Input value={appointmentDraft.notes} onChange={(event) => setAppointmentDraft((prev) => ({ ...prev, notes: event.target.value }))} className="h-12 mt-2" data-testid="opportunity-appointment-notes-input" />
                        </div>
                      </div>
                      <Button type="button" onClick={addAppointment} data-testid="opportunity-appointment-add-button"><Plus className="w-4 h-4 mr-2" />Add Appointment</Button>
                      <div className="space-y-2" data-testid="opportunity-appointments-list">
                        {(selectedLead.appointments || []).map((appointment, index) => (
                          <div key={appointment.id || `${appointment.title}-${index}`} className="border border-gray-200 rounded-md p-3 flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{appointment.title}</p>
                              <p className="text-sm text-gray-500">{appointment.date} {appointment.location ? `• ${appointment.location}` : ''}</p>
                              {appointment.notes ? <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p> : null}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeArrayItem('appointments', index)} data-testid={`opportunity-appointment-remove-${index}`}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'tasks' && (
                    <div className="space-y-4" data-testid="opportunity-tasks-section">
                      <div className="flex gap-2">
                        <Input value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="Add a task" className="h-12" data-testid="opportunity-task-input" />
                        <Button type="button" onClick={addTask} data-testid="opportunity-task-add-button"><Plus className="w-4 h-4 mr-2" />Add Task</Button>
                      </div>
                      <div className="space-y-2" data-testid="opportunity-tasks-list">
                        {(selectedLead.tasks || []).map((task, index) => (
                          <div key={task.id || `${task.title}-${index}`} className="border border-gray-200 rounded-md p-3 flex items-center justify-between gap-3">
                            <label className="flex items-center gap-3 flex-1">
                              <Checkbox checked={Boolean(task.completed)} onCheckedChange={() => toggleTaskComplete(task.id)} data-testid={`opportunity-task-complete-${index}`} />
                              <span className={`${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</span>
                            </label>
                            <Button variant="ghost" size="sm" onClick={() => removeArrayItem('tasks', index)} data-testid={`opportunity-task-remove-${index}`}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'notes' && (
                    <div className="space-y-4" data-testid="opportunity-notes-section">
                      <div>
                        <Label className="text-sm font-semibold">Notes</Label>
                        <Textarea value={selectedLead.notes || ''} onChange={(event) => setLeadField('notes', event.target.value)} rows={5} className="mt-2" data-testid="opportunity-notes-textarea" />
                      </div>
                      <div className="flex gap-2">
                        <Input value={timelineNoteDraft} onChange={(event) => setTimelineNoteDraft(event.target.value)} placeholder="Add timeline note" className="h-12" data-testid="opportunity-timeline-note-input" />
                        <Button type="button" onClick={addTimelineNote} data-testid="opportunity-timeline-note-add-button"><Plus className="w-4 h-4 mr-2" />Add Note</Button>
                      </div>
                      <div className="space-y-2" data-testid="opportunity-notes-timeline-list">
                        {(selectedLead.notes_timeline || []).map((entry, index) => (
                          <div key={entry.id || `note-${index}`} className="border border-gray-200 rounded-md p-3 flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm text-gray-800">{entry.note}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(entry.created_at)}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeArrayItem('notes_timeline', index)} data-testid={`opportunity-timeline-note-remove-${index}`}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'payments' && (
                    <div className="space-y-4" data-testid="opportunity-payments-section">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold">Payment Date</Label>
                          <Input type="date" value={paymentDraft.date} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, date: event.target.value }))} className="h-12 mt-2" data-testid="opportunity-payment-date-input" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Amount</Label>
                          <Input type="number" value={paymentDraft.amount} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, amount: event.target.value }))} className="h-12 mt-2" data-testid="opportunity-payment-amount-input" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Status</Label>
                          <select value={paymentDraft.status} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, status: event.target.value }))} className="w-full h-12 mt-2 rounded-md border border-gray-300 px-3" data-testid="opportunity-payment-status-select">
                            {PAYMENT_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Method</Label>
                          <select value={paymentDraft.method} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, method: event.target.value }))} className="w-full h-12 mt-2 rounded-md border border-gray-300 px-3" data-testid="opportunity-payment-method-select">
                            {PAYMENT_METHOD_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-sm font-semibold">Note</Label>
                          <Input value={paymentDraft.note} onChange={(event) => setPaymentDraft((prev) => ({ ...prev, note: event.target.value }))} className="h-12 mt-2" data-testid="opportunity-payment-note-input" />
                        </div>
                      </div>
                      <Button type="button" onClick={addPayment} data-testid="opportunity-payment-add-button"><Plus className="w-4 h-4 mr-2" />Add Payment</Button>
                      <div className="space-y-2" data-testid="opportunity-payments-list">
                        {(selectedLead.payments || []).map((payment, index) => (
                          <div key={payment.id || `payment-${index}`} className="border border-gray-200 rounded-md p-3 flex items-start justify-between">
                            <div>
                              <p className="font-semibold">${Number(payment.amount || 0).toFixed(2)} • {payment.status}</p>
                              <p className="text-sm text-gray-500">{payment.method} • {payment.date}</p>
                              {payment.note ? <p className="text-sm text-gray-600 mt-1">{payment.note}</p> : null}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeArrayItem('payments', index)} data-testid={`opportunity-payment-remove-${index}`}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'associated-objects' && (
                    <div className="space-y-4" data-testid="opportunity-associated-objects-section">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-semibold">Type</Label>
                          <Input value={associatedObjectDraft.type} onChange={(event) => setAssociatedObjectDraft((prev) => ({ ...prev, type: event.target.value }))} className="h-12 mt-2" data-testid="opportunity-associated-type-input" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Reference</Label>
                          <Input value={associatedObjectDraft.reference} onChange={(event) => setAssociatedObjectDraft((prev) => ({ ...prev, reference: event.target.value }))} className="h-12 mt-2" data-testid="opportunity-associated-reference-input" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">URL</Label>
                          <Input value={associatedObjectDraft.url} onChange={(event) => setAssociatedObjectDraft((prev) => ({ ...prev, url: event.target.value }))} className="h-12 mt-2" data-testid="opportunity-associated-url-input" />
                        </div>
                      </div>
                      <Button type="button" onClick={addAssociatedObject} data-testid="opportunity-associated-add-button"><Plus className="w-4 h-4 mr-2" />Add Associated Object</Button>
                      <div className="space-y-2" data-testid="opportunity-associated-list">
                        {(selectedLead.associated_objects || []).map((object, index) => (
                          <div key={object.id || `assoc-${index}`} className="border border-gray-200 rounded-md p-3 flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{object.type}: {object.reference}</p>
                              {object.url ? (
                                <a href={object.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{object.url}</a>
                              ) : null}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeArrayItem('associated_objects', index)} data-testid={`opportunity-associated-remove-${index}`}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <div className="border-t border-gray-200 px-7 py-4 flex items-center justify-between gap-4" data-testid="opportunity-modal-footer">
                <div className="text-sm text-gray-500" data-testid="opportunity-modal-audit-info">
                  <p>Created on: {formatDate(selectedLead.created_at)}</p>
                  <p>Audit ID: {selectedLead.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleDelete(selectedLead)} data-testid="opportunity-modal-delete-button">
                    <Trash2 className="w-4 h-4 mr-2" />Delete
                  </Button>
                  <Button variant="outline" onClick={closeEditModal} data-testid="opportunity-modal-cancel-button">Cancel</Button>
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleConvertToClient} disabled={converting || selectedLead.converted_to_client} data-testid="opportunity-modal-convert-to-client-button">
                    {converting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    {selectedLead.converted_to_client ? 'Converted' : 'Convert to Client'}
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={saving} className="bg-[rgb(37,99,235)] hover:bg-[rgb(29,78,216)]" data-testid="opportunity-modal-update-button">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Update
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeadsKanban;
