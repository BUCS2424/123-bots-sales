import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  FileSignature,
  UserRound,
  UserPlus,
  Upload,
  Download,
  Tag,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { TaxExemptCard } from '../../components/TaxExemptCard';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import QuoteBuilderPage from '../quotes/QuoteBuilderPage';
import { useSiteFeatureFlags } from '../../hooks/useSiteFeatureFlags';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DEFAULT_COLUMNS = [
  { id: 'cold_call', label: 'Cold Call', color: 'bg-red-500', barColor: 'bg-red-500', lightColor: 'bg-white border-gray-200' },
  { id: 'build_interest', label: 'Build Interest', color: 'bg-orange-500', barColor: 'bg-orange-500', lightColor: 'bg-white border-gray-200' },
  { id: 'interested_waiting', label: 'Interested/Waiting', color: 'bg-amber-400', barColor: 'bg-amber-400', lightColor: 'bg-white border-gray-200' },
  { id: 'demo', label: 'Demo', color: 'bg-slate-400', barColor: 'bg-slate-400', lightColor: 'bg-white border-gray-200' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'bg-green-500', barColor: 'bg-green-500', lightColor: 'bg-white border-gray-200' },
  { id: 'waiting_leadership', label: 'Waiting on Leadership', color: 'bg-blue-500', barColor: 'bg-blue-500', lightColor: 'bg-white border-gray-200' },
  { id: 'closed', label: 'Closed', color: 'bg-emerald-600', barColor: 'bg-emerald-600', lightColor: 'bg-white border-gray-200' },
];

const SECTION_TABS = [
  { id: 'opportunity-details', label: 'Opportunity Details', icon: UserRound },
  { id: 'tax-exempt', label: 'Tax Exempt', icon: ShieldCheck },
  { id: 'appointments', label: 'Book/Update Appointment', icon: Calendar },
  { id: 'quotes-contracts-esign', label: 'Quotes', icon: FileSignature },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'associated-objects', label: 'Associated Objects', icon: LinkIcon },
];

const PIPELINE_OPTIONS = ['001. Main Leads Pipeline', '002. Enterprise Opportunities', '003. Follow-up Pipeline'];
const STAGE_OPTIONS = ['Cold Call', 'Build Interest', 'Interested/Waiting', 'Demo', 'Proposal Sent', 'Waiting on Leadership', 'Closed'];
const OPPORTUNITY_STATUS_OPTIONS = ['Open', 'In Progress', 'Won', 'Lost', 'On Hold'];
const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Failed', 'Refunded'];
const PAYMENT_METHOD_OPTIONS = ['Cash', 'Card', 'ACH', 'Wire', 'Check'];

const buildSecureSaysmeRoomName = (leadName = '') => {
  const cleaned = (leadName || 'meeting')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 22);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${cleaned || 'meeting'}-${suffix}`;
};

const normalizeLeadForEdit = (lead) => ({
  ...lead,
  primary_contact_name: lead.primary_contact_name || lead.name || '',
  primary_email: lead.primary_email || lead.email || '',
  primary_phone: lead.primary_phone || lead.phone || '',
  additional_contacts: Array.isArray(lead.additional_contacts) ? lead.additional_contacts : [],
  opportunity_name: lead.opportunity_name || lead.name || '',
  pipeline: lead.pipeline || '001. Main Leads Pipeline',
  stage: lead.stage || 'Cold Call',
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

const buildNewOpportunityDraft = () =>
  normalizeLeadForEdit({
    id: '',
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: 'Opportunity created from Opportunities board',
    source: 'admin_opportunities',
    status: 'cold_call',
    notes: '',
    primary_contact_name: '',
    primary_email: '',
    primary_phone: '',
    opportunity_name: '',
    pipeline: '001. Main Leads Pipeline',
    stage: 'Cold Call',
    opportunity_status: 'Open',
    opportunity_value: '',
    owner_id: '',
    followers: [],
    business_name: '',
    opportunity_source: 'Manual Opportunity',
    tags: [],
    appointments: [],
    tasks: [],
    notes_timeline: [],
    payments: [],
    associated_objects: [],
    created_at: new Date().toISOString(),
    converted_to_client: false,
    // New fields from CSV
    assigned: '',
    lost_reason_id: '',
    lost_reason_name: '',
    engagement_score: '',
    external_opportunity_id: '',
    external_contact_id: '',
    pipeline_stage_id: '',
    pipeline_id: '',
    days_since_stage_change: '',
    days_since_status_change: '',
    days_since_updated: '',
  });

const isValueFilled = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value === 0) return true;
  return `${value ?? ''}`.trim() !== '';
};

const AdminLeadsKanban = () => {
  const { quotes_enabled: quotesEnabled } = useSiteFeatureFlags();
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [allLeads, setAllLeads] = useState({});
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isCreatingOpportunity, setIsCreatingOpportunity] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [resendingAppointmentKey, setResendingAppointmentKey] = useState('');
  const [activeSection, setActiveSection] = useState('opportunity-details');
  const [hideEmptyFields, setHideEmptyFields] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [staffOptions, setStaffOptions] = useState([]);

  // Import functionality
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const [additionalContactInput, setAdditionalContactInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [appointmentDraft, setAppointmentDraft] = useState({
    date: '',
    title: '',
    location_type: 'physical',
    physical_address: '',
    use_saysme: false,
    saysme_room_name: '',
    use_other_meeting: false,
    other_meeting_url: '',
    notes: '',
  });
  const [taskDraft, setTaskDraft] = useState('');
  const [timelineNoteDraft, setTimelineNoteDraft] = useState('');
  const [paymentDraft, setPaymentDraft] = useState({ date: '', amount: '', status: 'Pending', method: 'Card', note: '' });
  const [associatedObjectDraft, setAssociatedObjectDraft] = useState({ type: '', reference: '', url: '' });

  const tokenHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Fetch pipelines from API
  const fetchPipelines = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/pipelines/`, { headers: tokenHeaders });
      const data = response.data || [];
      setPipelines(data);
      setSelectedPipelineId((prev) => {
        if (prev) return prev;
        const defaultPipeline = data.find(p => p.is_default) || data[0];
        return defaultPipeline?.id || '';
      });
    } catch {
      setPipelines([]);
    }
  }, [tokenHeaders]);

  // Derive columns from selected pipeline
  const columns = useMemo(() => {
    const pipeline = pipelines.find(p => p.id === selectedPipelineId);
    if (!pipeline || !pipeline.stages?.length) return DEFAULT_COLUMNS;
    return pipeline.stages.map(s => ({
      id: s.id,
      label: s.label,
      color: s.color || 'bg-slate-500',
      barColor: s.bar_color || s.color || 'bg-slate-500',
      lightColor: 'bg-white border-gray-200',
    }));
  }, [pipelines, selectedPipelineId]);

  const fetchLeads = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/leads/`, { headers: tokenHeaders });
      setAllLeads(response.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load opportunities', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [tokenHeaders]);

  // Client-side filter: default pipeline shows all leads, other pipelines show only their leads
  const leads = useMemo(() => {
    if (!selectedPipelineId || !pipelines.length) return allLeads;
    const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
    if (!selectedPipeline || selectedPipeline.is_default) return allLeads;
    const filtered = {};
    for (const [col, colLeads] of Object.entries(allLeads)) {
      const matched = colLeads.filter(l => l.pipeline_id === selectedPipelineId);
      if (matched.length > 0) filtered[col] = matched;
    }
    return filtered;
  }, [allLeads, selectedPipelineId, pipelines]);

  const visibleSectionTabs = useMemo(() => {
    return SECTION_TABS.filter((tab) => (tab.id === 'quotes-contracts-esign' ? quotesEnabled : true));
  }, [quotesEnabled]);

  useEffect(() => {
    if (!quotesEnabled && activeSection === 'quotes-contracts-esign') {
      setActiveSection('opportunity-details');
    }
  }, [quotesEnabled, activeSection]);

  const fetchStaffOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/users/staff`, { headers: tokenHeaders });
      setStaffOptions(response.data || []);
    } catch (error) {
      setStaffOptions([]);
    }
  }, [tokenHeaders]);

  useEffect(() => {
    fetchPipelines();
    fetchLeads();
    fetchStaffOptions();
  }, [fetchPipelines, fetchLeads, fetchStaffOptions]);

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

    const updated = { ...allLeads };
    updated[draggedLead.fromColumn] = (updated[draggedLead.fromColumn] || []).filter((item) => item.id !== draggedLead.id);
    updated[toColumn] = [{ ...draggedLead, status: toColumn }, ...(updated[toColumn] || [])];
    setAllLeads(updated);

    try {
      await axios.patch(`${API}/leads/${draggedLead.id}/status`, { status: toColumn }, { headers: tokenHeaders });
    } catch (error) {
      fetchLeads();
      toast({ title: 'Error', description: 'Failed to move opportunity', variant: 'destructive' });
    }
    setDraggedLead(null);
  };

  const openEditModal = (lead, section = 'opportunity-details') => {
    setIsCreatingOpportunity(false);
    setSelectedLead(normalizeLeadForEdit(lead));
    setActiveSection(section);
    setHideEmptyFields(false);
    setAdditionalContactInput('');
    setTagInput('');
    setAppointmentDraft({
      date: '',
      title: '',
      location_type: 'physical',
      physical_address: '',
      use_saysme: false,
      saysme_room_name: '',
      use_other_meeting: false,
      other_meeting_url: '',
      notes: '',
    });
    setTaskDraft('');
    setTimelineNoteDraft('');
    setPaymentDraft({ date: '', amount: '', status: 'Pending', method: 'Card', note: '' });
    setAssociatedObjectDraft({ type: '', reference: '', url: '' });
    setEditModalOpen(true);
  };

  const openCreateOpportunityModal = () => {
    setIsCreatingOpportunity(true);
    setSelectedLead(buildNewOpportunityDraft());
    setActiveSection('opportunity-details');
    setHideEmptyFields(false);
    setAdditionalContactInput('');
    setTagInput('');
    setAppointmentDraft({
      date: '',
      title: '',
      location_type: 'physical',
      physical_address: '',
      use_saysme: false,
      saysme_room_name: '',
      use_other_meeting: false,
      other_meeting_url: '',
      notes: '',
    });
    setTaskDraft('');
    setTimelineNoteDraft('');
    setPaymentDraft({ date: '', amount: '', status: 'Pending', method: 'Card', note: '' });
    setAssociatedObjectDraft({ type: '', reference: '', url: '' });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedLead(null);
    setIsCreatingOpportunity(false);
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
    if (!selectedLead.primary_contact_name || !selectedLead.primary_email || !selectedLead.opportunity_name) {
      toast({ title: 'Missing Required Fields', description: 'Primary Contact Name, Primary Email, and Opportunity Name are required.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...selectedLead,
        opportunity_value: selectedLead.opportunity_value === '' ? null : Number(selectedLead.opportunity_value),
      };

      let response;
      if (isCreatingOpportunity) {
        const createPayload = {
          name: selectedLead.primary_contact_name,
          email: selectedLead.primary_email,
          phone: selectedLead.primary_phone || '',
          subject: selectedLead.opportunity_name,
          message: selectedLead.message || selectedLead.notes || 'Opportunity created from Opportunities board',
          source: selectedLead.opportunity_source || 'admin_opportunities',
          primary_contact_name: selectedLead.primary_contact_name,
          primary_email: selectedLead.primary_email,
          primary_phone: selectedLead.primary_phone || '',
          additional_contacts: selectedLead.additional_contacts || [],
          opportunity_name: selectedLead.opportunity_name,
          pipeline: selectedLead.pipeline || '001. Main Leads Pipeline',
          stage: selectedLead.stage || 'Cold Call',
          opportunity_status: selectedLead.opportunity_status || 'Open',
          opportunity_value: payload.opportunity_value,
          owner_id: selectedLead.owner_id || '',
          followers: selectedLead.followers || [],
          business_name: selectedLead.business_name || '',
          opportunity_source: selectedLead.opportunity_source || 'Manual Opportunity',
          tags: selectedLead.tags || [],
          appointments: selectedLead.appointments || [],
          tasks: selectedLead.tasks || [],
          notes_timeline: selectedLead.notes_timeline || [],
          payments: selectedLead.payments || [],
          associated_objects: selectedLead.associated_objects || [],
          // New fields
          assigned: selectedLead.assigned || '',
          lost_reason_id: selectedLead.lost_reason_id || '',
          lost_reason_name: selectedLead.lost_reason_name || '',
          engagement_score: selectedLead.engagement_score || 0,
          notes: selectedLead.notes || '',
          pipeline_id: selectedPipelineId || '',
        };
        response = await axios.post(`${API}/leads/`, createPayload, { headers: tokenHeaders });
      } else {
        response = await axios.put(`${API}/leads/${selectedLead.id}`, payload, { headers: tokenHeaders });
      }

      const sentCount = response.data?.appointment_notifications_sent ?? 0;
      toast({
        title: isCreatingOpportunity ? 'Opportunity Created' : 'Opportunity Updated',
        description: sentCount > 0
          ? `Changes saved. Appointment email sent to ${sentCount} recipient(s).`
          : isCreatingOpportunity ? 'Created and placed in Opportunity column.' : 'Changes saved successfully.',
      });
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

  const handleResendAppointmentInfo = async (appointment, index) => {
    if (!selectedLead) return;
    const appointmentKey = appointment?.id || `idx-${index}`;
    setResendingAppointmentKey(appointmentKey);
    try {
      const response = await axios.post(
        `${API}/leads/${selectedLead.id}/appointments/resend`,
        {
          appointment_id: appointment?.id || null,
          appointment_index: Number.isInteger(index) ? index : null,
        },
        { headers: tokenHeaders }
      );
      const sentCount = response.data?.appointment_notifications_sent ?? 0;
      toast({
        title: 'Meeting Info Resent',
        description: sentCount > 0
          ? `Meeting details sent to ${sentCount} recipient(s).`
          : 'Meeting details were queued, but no SMTP delivery occurred.',
      });
    } catch (error) {
      toast({
        title: 'Resend Failed',
        description: error.response?.data?.detail || 'Could not resend meeting details.',
        variant: 'destructive',
      });
    } finally {
      setResendingAppointmentKey('');
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

    if (appointmentDraft.location_type === 'physical' && !appointmentDraft.physical_address.trim()) {
      toast({ title: 'Address Required', description: 'Please add a physical address for this appointment.', variant: 'destructive' });
      return;
    }

    if (appointmentDraft.location_type === 'online' && !appointmentDraft.use_saysme && !appointmentDraft.use_other_meeting) {
      toast({ title: 'Meeting Link Required', description: 'Select SaySMe or Other meeting option.', variant: 'destructive' });
      return;
    }

    if (appointmentDraft.location_type === 'online' && appointmentDraft.use_other_meeting && !appointmentDraft.other_meeting_url.trim()) {
      toast({ title: 'Other Meeting URL Required', description: 'Please provide the custom online meeting URL.', variant: 'destructive' });
      return;
    }

    const saysmeRoomName = appointmentDraft.use_saysme
      ? (appointmentDraft.saysme_room_name || buildSecureSaysmeRoomName(selectedLead?.primary_contact_name || selectedLead?.name || 'meeting'))
      : '';

    const saysmeMeetingUrl = appointmentDraft.use_saysme
      ? `https://meet.saysme.org/${saysmeRoomName}`
      : '';

    const locationSummary = appointmentDraft.location_type === 'physical'
      ? appointmentDraft.physical_address
      : [saysmeMeetingUrl, appointmentDraft.use_other_meeting ? appointmentDraft.other_meeting_url : '']
        .filter(Boolean)
        .join(' | ');

    addArrayItem('appointments', {
      id: crypto.randomUUID?.() || Date.now().toString(),
      date: appointmentDraft.date,
      title: appointmentDraft.title,
      location: locationSummary,
      notes: appointmentDraft.notes,
      location_type: appointmentDraft.location_type,
      physical_address: appointmentDraft.location_type === 'physical' ? appointmentDraft.physical_address : '',
      use_saysme: appointmentDraft.use_saysme,
      saysme_room_name: saysmeRoomName,
      saysme_meeting_url: saysmeMeetingUrl,
      use_other_meeting: appointmentDraft.use_other_meeting,
      other_meeting_url: appointmentDraft.use_other_meeting ? appointmentDraft.other_meeting_url : '',
    });

    setAppointmentDraft({
      date: '',
      title: '',
      location_type: 'physical',
      physical_address: '',
      use_saysme: false,
      saysme_room_name: '',
      use_other_meeting: false,
      other_meeting_url: '',
      notes: '',
    });
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

  // Import CSV handler
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/leads/import`, formData, {
        headers: {
          ...tokenHeaders,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const { imported, skipped, total_errors } = response.data;
      toast({
        title: 'Import Complete',
        description: `Imported ${imported} opportunities. ${skipped} duplicates skipped.${total_errors > 0 ? ` ${total_errors} errors.` : ''}`,
      });
      
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error.response?.data?.detail || 'Failed to import opportunities',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Export CSV handler
  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API}/leads/export/csv`, {
        headers: tokenHeaders,
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `opportunities_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({ title: 'Export Complete', description: 'Opportunities exported to CSV' });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error.response?.data?.detail || 'Failed to export opportunities',
        variant: 'destructive',
      });
    }
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
    <div className="space-y-6 min-w-0" data-testid="admin-opportunities-kanban">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3" data-testid="opportunities-page-title">
              <Users className="w-8 h-8 text-[rgb(37,99,235)]" />
              Opportunities
            </h1>
            <p className="text-gray-500" data-testid="opportunities-count-label">{totalLeads} total opportunities from contact forms</p>
          </div>
          {pipelines.length > 1 && (
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="pipeline-selector"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-3">
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} data-testid="import-opportunities-button">
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button variant="outline" onClick={handleExportCSV} data-testid="export-opportunities-button">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={openCreateOpportunityModal} data-testid="create-opportunity-button">
              <Plus className="w-4 h-4 mr-2" />
              Create an Opportunity
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="opportunities-kanban-columns">
        {columns.map((column) => {
          const columnLeads = filterLeads(leads[column.id] || []);
          const isDropTarget = dragOverColumn === column.id;
          return (
            <div
              key={column.id}
              className={`rounded-xl border-2 transition-all w-[280px] min-w-[280px] flex-shrink-0 ${isDropTarget ? 'border-[rgb(37,99,235)] bg-blue-50 shadow-lg' : 'border-gray-200 bg-gray-50'}`}
              onDragOver={(event) => handleDragOver(event, column.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(event) => handleDrop(event, column.id)}
              data-testid={`opportunities-column-${column.id}`}
            >
              <div className={`h-1.5 ${column.barColor} rounded-t-xl`} />
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-gray-800 text-sm">{column.label}</h3>
                </div>
                <div className="text-xs text-gray-400">
                  {columnLeads.length} {columnLeads.length === 1 ? 'Opportunity' : 'Opportunities'}
                </div>
                <div className="text-sm font-semibold text-gray-700 mt-0.5">
                  ${columnLeads.reduce((sum, l) => sum + (Number(l.opportunity_value) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3 space-y-3 min-h-[430px] max-h-[640px] overflow-y-auto">
                {columnLeads.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No opportunities</p>
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const notesCount = Array.isArray(lead.notes_timeline) ? lead.notes_timeline.length : 0;
                    const tasksCount = Array.isArray(lead.tasks) ? lead.tasks.length : 0;
                    const appointmentsCount = Array.isArray(lead.appointments) ? lead.appointments.length : 0;
                    const tagsCount = Array.isArray(lead.tags) ? lead.tags.length : 0;
                    const formattedValue = lead.opportunity_value ? `$${Number(lead.opportunity_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';

                    return (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={(event) => handleDragStart(event, lead, column.id)}
                      onClick={() => openEditModal(lead, 'opportunity-details')}
                      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white overflow-hidden ${draggedLead?.id === lead.id ? 'opacity-50 scale-95' : ''}`}
                      data-testid={`opportunity-card-${lead.id}`}
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-bold text-gray-900 text-sm leading-tight truncate pr-2">{lead.opportunity_name || lead.name}</span>
                          <div className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0">
                            <UserRound className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                          {lead.business_name && (
                            <div className="flex gap-1.5 min-w-0">
                              <span className="text-gray-400 whitespace-nowrap">Business Name:</span>
                              <span className="text-gray-700 truncate">{lead.business_name}</span>
                            </div>
                          )}
                          {lead.opportunity_source && (
                            <div className="flex gap-1.5 min-w-0">
                              <span className="text-gray-400 whitespace-nowrap">Opportunity Sour...</span>
                              <span className="text-gray-700 truncate">{lead.opportunity_source}</span>
                            </div>
                          )}
                          {formattedValue && (
                            <div className="flex gap-1.5 min-w-0">
                              <span className="text-gray-400 whitespace-nowrap">Opportunity Value:</span>
                              <span className="text-gray-700">{formattedValue}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                          {lead.phone && (
                            <button onClick={(e) => { e.stopPropagation(); window.open(`tel:${lead.phone}`); }} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100" data-testid={`opp-icon-phone-${lead.id}`}>
                              <Phone className="w-3 h-3 text-gray-400" />
                            </button>
                          )}
                          {lead.email && (
                            <button onClick={(e) => { e.stopPropagation(); window.open(`mailto:${lead.email}`); }} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100" data-testid={`opp-icon-email-${lead.id}`}>
                              <Mail className="w-3 h-3 text-gray-400" />
                            </button>
                          )}
                          {tagsCount > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(lead, 'opportunity-details'); }} className="relative w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100" data-testid={`opp-icon-tags-${lead.id}`}>
                              <Tag className="w-3 h-3 text-gray-400" />
                              <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{tagsCount}</span>
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(lead, 'notes'); }} className="relative w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100" data-testid={`opp-icon-notes-${lead.id}`}>
                            <FileText className="w-3 h-3 text-gray-400" />
                            {notesCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{notesCount}</span>}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(lead, 'tasks'); }} className="relative w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100" data-testid={`opp-icon-tasks-${lead.id}`}>
                            <CheckCircle2 className="w-3 h-3 text-gray-400" />
                            {tasksCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{tasksCount}</span>}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(lead, 'appointments'); }} className="relative w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100" data-testid={`opp-icon-appts-${lead.id}`}>
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {appointmentsCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{appointmentsCount}</span>}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={editModalOpen} onOpenChange={(open) => (open ? setEditModalOpen(true) : closeEditModal())}>
        <DialogContent className="max-w-[1280px] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col" data-testid="opportunity-edit-modal">
          {selectedLead && (
            <div className="h-full min-h-0 flex flex-col">
              <DialogTitle className="sr-only">
                {isCreatingOpportunity ? 'Create Opportunity' : `Edit ${selectedLead.opportunity_name || selectedLead.name || 'Opportunity'}`}
              </DialogTitle>
              <div className="px-4 md:px-7 pt-6 pb-4 border-b border-gray-200" data-testid="opportunity-modal-header">
                <h2 className="text-2xl md:text-4xl font-semibold text-gray-800 leading-tight md:leading-none" data-testid="opportunity-modal-title">
                  {isCreatingOpportunity ? 'Create Opportunity' : `Edit “${selectedLead.opportunity_name || selectedLead.name || 'Opportunity'}”`}
                </h2>
                <p className="text-gray-500 mt-3 text-base">Add and edit opportunity details, tasks, notes and appointments.</p>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row">
                <aside className="w-full md:w-[280px] min-h-0 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-[#f8f8f9] p-4 flex flex-col" data-testid="opportunity-modal-sidebar">
                  <nav className="flex md:block gap-1 md:gap-0 md:space-y-1 flex-1 overflow-x-auto md:overflow-visible">
                    {visibleSectionTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveSection(tab.id)}
                        className={`shrink-0 whitespace-nowrap md:w-full text-left px-3 py-2.5 rounded-md text-base transition-colors ${activeSection === tab.id ? 'bg-[#e8ecfb] text-[#3454b4] font-semibold' : 'text-gray-600 hover:bg-gray-200/70'}`}
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

                <section className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 md:p-6" data-testid="opportunity-modal-main-content">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl md:text-[30px] font-semibold text-gray-800">{visibleSectionTabs.find((tab) => tab.id === activeSection)?.label}</h3>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-600" data-testid="opportunity-hide-empty-toggle-wrap">
                      <Checkbox checked={hideEmptyFields} onCheckedChange={(value) => setHideEmptyFields(Boolean(value))} data-testid="opportunity-hide-empty-toggle" />
                      Hide Empty Fields
                    </label>
                  </div>

                  {activeSection === 'opportunity-details' && (
                    <div className="space-y-8" data-testid="opportunity-details-section">
                      <div className="border-t border-b border-gray-200 py-5">
                        <h4 className="text-lg md:text-[28px] font-semibold text-gray-800 mb-4">Contact details</h4>
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

                      <div className="border-b border-gray-200 pb-5">
                        <h4 className="text-lg md:text-[28px] font-semibold text-gray-800 mb-4">Customer Inquiry</h4>
                        <div className="grid grid-cols-1 gap-4">
                          {shouldShowField(selectedLead.subject, true) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Subject</Label>
                              <Input value={selectedLead.subject || ''} onChange={(event) => setLeadField('subject', event.target.value)} className="h-12 mt-2" data-testid="opportunity-subject-input" />
                            </div>
                          )}
                          {shouldShowField(selectedLead.message, true) && (
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Message</Label>
                              <Textarea rows={5} value={selectedLead.message || ''} onChange={(event) => setLeadField('message', event.target.value)} className="mt-2 bg-gray-50" data-testid="opportunity-message-input" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xl md:text-[30px] font-semibold text-gray-800 mb-4">Opportunity Details</h4>
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

                          {/* Additional Fields Section */}
                          <div className="md:col-span-2 border-t pt-4 mt-4">
                            <h4 className="font-semibold text-gray-700 mb-4">Additional Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Assigned To</Label>
                                <Input value={selectedLead.assigned || ''} onChange={(event) => setLeadField('assigned', event.target.value)} placeholder="Assigned staff member" className="h-12 mt-2" data-testid="opportunity-assigned-input" />
                              </div>
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Engagement Score</Label>
                                <Input type="number" value={selectedLead.engagement_score || ''} onChange={(event) => setLeadField('engagement_score', event.target.value)} placeholder="0" className="h-12 mt-2" data-testid="opportunity-engagement-score-input" />
                              </div>
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Lost Reason</Label>
                                <Input value={selectedLead.lost_reason_name || ''} onChange={(event) => setLeadField('lost_reason_name', event.target.value)} placeholder="Reason if lost" className="h-12 mt-2" data-testid="opportunity-lost-reason-input" />
                              </div>
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Followers</Label>
                                <Input 
                                  value={(selectedLead.followers || []).join(', ')} 
                                  onChange={(event) => setLeadField('followers', event.target.value.split(',').map(f => f.trim()).filter(f => f))} 
                                  placeholder="Comma-separated names" 
                                  className="h-12 mt-2" 
                                  data-testid="opportunity-followers-input" 
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-sm font-semibold text-gray-700">Notes</Label>
                                <textarea 
                                  value={selectedLead.notes || ''} 
                                  onChange={(event) => setLeadField('notes', event.target.value)} 
                                  placeholder="Additional notes about this opportunity..." 
                                  className="w-full mt-2 p-3 rounded-md border border-gray-300 min-h-[100px]" 
                                  data-testid="opportunity-notes-input"
                                />
                              </div>
                            </div>
                          </div>

                          {/* External IDs Section (read-only for imported data) */}
                          {(selectedLead.external_opportunity_id || selectedLead.external_contact_id || selectedLead.pipeline_id) && (
                            <div className="md:col-span-2 border-t pt-4 mt-4">
                              <h4 className="font-semibold text-gray-500 mb-4">External References (Imported)</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                                {selectedLead.external_opportunity_id && (
                                  <div>
                                    <span className="font-medium">Opportunity ID:</span> {selectedLead.external_opportunity_id}
                                  </div>
                                )}
                                {selectedLead.external_contact_id && (
                                  <div>
                                    <span className="font-medium">Contact ID:</span> {selectedLead.external_contact_id}
                                  </div>
                                )}
                                {selectedLead.pipeline_id && (
                                  <div>
                                    <span className="font-medium">Pipeline ID:</span> {selectedLead.pipeline_id}
                                  </div>
                                )}
                                {selectedLead.days_since_stage_change && (
                                  <div>
                                    <span className="font-medium">Days Since Stage Change:</span> {selectedLead.days_since_stage_change}
                                  </div>
                                )}
                                {selectedLead.days_since_status_change && (
                                  <div>
                                    <span className="font-medium">Days Since Status Change:</span> {selectedLead.days_since_status_change}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'tax-exempt' && (
                    <div className="space-y-4" data-testid="opportunity-tax-exempt-section">
                      <TaxExemptCard
                        entityType="lead"
                        entityId={selectedLead.id}
                        initialExempt={selectedLead.tax_exempt}
                        initialInfo={selectedLead.tax_exempt_info}
                        onSaved={(updated) => updated && setSelectedLead((prev) => ({ ...prev, tax_exempt: updated.tax_exempt, tax_exempt_info: updated.tax_exempt_info }))}
                      />
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
                          <Label className="text-sm font-semibold">Location Type</Label>
                          <select
                            value={appointmentDraft.location_type}
                            onChange={(event) => setAppointmentDraft((prev) => ({
                              ...prev,
                              location_type: event.target.value,
                              physical_address: event.target.value === 'physical' ? prev.physical_address : '',
                              use_saysme: event.target.value === 'online' ? prev.use_saysme : false,
                              use_other_meeting: event.target.value === 'online' ? prev.use_other_meeting : false,
                              saysme_room_name: event.target.value === 'online' ? prev.saysme_room_name : '',
                              other_meeting_url: event.target.value === 'online' ? prev.other_meeting_url : '',
                            }))}
                            className="w-full h-12 mt-2 rounded-md border border-gray-300 px-3"
                            data-testid="opportunity-appointment-location-type-select"
                          >
                            <option value="physical">Physical Location</option>
                            <option value="online">Online Meeting</option>
                          </select>
                        </div>

                        {appointmentDraft.location_type === 'physical' && (
                          <div className="md:col-span-2">
                            <Label className="text-sm font-semibold">Physical Address</Label>
                            <Input
                              value={appointmentDraft.physical_address}
                              onChange={(event) => setAppointmentDraft((prev) => ({ ...prev, physical_address: event.target.value }))}
                              className="h-12 mt-2"
                              placeholder="Enter full address"
                              data-testid="opportunity-appointment-physical-address-input"
                            />
                          </div>
                        )}

                        {appointmentDraft.location_type === 'online' && (
                          <div className="md:col-span-2 space-y-3 rounded-md border border-gray-200 p-3" data-testid="opportunity-appointment-online-options-wrap">
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={appointmentDraft.use_saysme}
                                onCheckedChange={(checked) => setAppointmentDraft((prev) => {
                                  const enabled = Boolean(checked);
                                  const generatedRoom = enabled
                                    ? (prev.saysme_room_name || buildSecureSaysmeRoomName(selectedLead?.primary_contact_name || selectedLead?.name || 'meeting'))
                                    : '';
                                  return {
                                    ...prev,
                                    use_saysme: enabled,
                                    saysme_room_name: generatedRoom,
                                  };
                                })}
                                data-testid="opportunity-appointment-saysme-checkbox"
                              />
                              <span>Use https://meet.saysme.org/</span>
                            </label>

                            {appointmentDraft.use_saysme && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs font-semibold">Secure Room Name</Label>
                                  <Input
                                    value={appointmentDraft.saysme_room_name}
                                    onChange={(event) => setAppointmentDraft((prev) => ({ ...prev, saysme_room_name: event.target.value.trim() }))}
                                    className="h-10 mt-1"
                                    data-testid="opportunity-appointment-saysme-room-input"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-semibold">Meeting URL</Label>
                                  <Input
                                    value={appointmentDraft.saysme_room_name ? `https://meet.saysme.org/${appointmentDraft.saysme_room_name}` : ''}
                                    readOnly
                                    className="h-10 mt-1 bg-gray-50"
                                    data-testid="opportunity-appointment-saysme-url-preview"
                                  />
                                </div>
                              </div>
                            )}

                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={appointmentDraft.use_other_meeting}
                                onCheckedChange={(checked) => setAppointmentDraft((prev) => ({ ...prev, use_other_meeting: Boolean(checked) }))}
                                data-testid="opportunity-appointment-other-meeting-checkbox"
                              />
                              <span>Other Meeting URL</span>
                            </label>

                            {appointmentDraft.use_other_meeting && (
                              <Input
                                value={appointmentDraft.other_meeting_url}
                                onChange={(event) => setAppointmentDraft((prev) => ({ ...prev, other_meeting_url: event.target.value }))}
                                className="h-10"
                                placeholder="https://..."
                                data-testid="opportunity-appointment-other-meeting-url-input"
                              />
                            )}
                          </div>
                        )}

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
                              <p className="text-sm text-gray-500">{appointment.date}</p>
                              {appointment.location_type === 'physical' && appointment.physical_address && (
                                <p className="text-sm text-gray-600 mt-1" data-testid={`opportunity-appointment-physical-display-${index}`}>Address: {appointment.physical_address}</p>
                              )}
                              {appointment.saysme_meeting_url && (
                                <a
                                  href={appointment.saysme_meeting_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline mt-1 block"
                                  data-testid={`opportunity-appointment-saysme-url-display-${index}`}
                                >
                                  {appointment.saysme_meeting_url}
                                </a>
                              )}
                              {appointment.other_meeting_url && (
                                <a
                                  href={appointment.other_meeting_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline mt-1 block"
                                  data-testid={`opportunity-appointment-other-url-display-${index}`}
                                >
                                  {appointment.other_meeting_url}
                                </a>
                              )}
                              {!appointment.physical_address && !appointment.saysme_meeting_url && !appointment.other_meeting_url && appointment.location ? (
                                <p className="text-sm text-gray-600 mt-1">{appointment.location}</p>
                              ) : null}
                              {appointment.notes ? <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p> : null}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleResendAppointmentInfo(appointment, index)}
                                disabled={resendingAppointmentKey === (appointment.id || `idx-${index}`)}
                                data-testid={`opportunity-appointment-resend-${index}`}
                              >
                                {resendingAppointmentKey === (appointment.id || `idx-${index}`)
                                  ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  : <Mail className="w-3.5 h-3.5 mr-1" />}
                                Resend Meeting Info
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('appointments', index)} data-testid={`opportunity-appointment-remove-${index}`}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'quotes-contracts-esign' && (
                    <div className="space-y-4" data-testid="opportunity-quotes-contracts-esign-section">
                      <QuoteBuilderPage leadId={selectedLead.id} quoteId="new" />
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

              <div className="border-t border-gray-200 px-4 md:px-7 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4" data-testid="opportunity-modal-footer">
                <div className="text-sm text-gray-500 break-all md:break-normal" data-testid="opportunity-modal-audit-info">
                  <p>Created on: {formatDate(selectedLead.created_at)}</p>
                  <p>Audit ID: {isCreatingOpportunity ? 'Pending on save' : selectedLead.id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!isCreatingOpportunity && (
                    <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleDelete(selectedLead)} data-testid="opportunity-modal-delete-button">
                      <Trash2 className="w-4 h-4 mr-2" />Delete
                    </Button>
                  )}
                  <Button variant="outline" onClick={closeEditModal} data-testid="opportunity-modal-cancel-button">Cancel</Button>
                  {!isCreatingOpportunity && (
                    <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleConvertToClient} disabled={converting || selectedLead.converted_to_client} data-testid="opportunity-modal-convert-to-client-button">
                      {converting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                      {selectedLead.converted_to_client ? 'Converted' : 'Convert to Client'}
                    </Button>
                  )}
                  <Button onClick={handleSaveEdit} disabled={saving} className="bg-[rgb(37,99,235)] hover:bg-[rgb(29,78,216)]" data-testid="opportunity-modal-update-button">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {isCreatingOpportunity ? 'Create' : 'Update'}
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
