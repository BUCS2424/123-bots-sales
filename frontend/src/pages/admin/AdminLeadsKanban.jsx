import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users, GripVertical, Edit, StickyNote, Trash2, X, Save,
  Mail, Phone, MessageSquare, Calendar, Loader2, Plus, Search, Paperclip, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLUMNS = [
  { id: 'opportunity', label: 'Opportunity', color: 'bg-blue-500', lightColor: 'bg-blue-50 border-blue-200' },
  { id: 'needs_order', label: 'Needs Order', color: 'bg-amber-500', lightColor: 'bg-amber-50 border-amber-200' },
  { id: 'needs_support', label: 'Needs Support', color: 'bg-purple-500', lightColor: 'bg-purple-50 border-purple-200' },
  { id: 'miscellaneous', label: 'Miscellaneous', color: 'bg-gray-500', lightColor: 'bg-gray-50 border-gray-200' },
];

const AdminLeadsKanban = () => {
  const [leads, setLeads] = useState({
    opportunity: [],
    needs_order: [],
    needs_support: [],
    miscellaneous: []
  });
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  
  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeads = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/leads/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leads',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Drag and Drop handlers
  const handleDragStart = (e, lead, fromColumn) => {
    setDraggedLead({ ...lead, fromColumn });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, toColumn) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedLead || draggedLead.fromColumn === toColumn) {
      setDraggedLead(null);
      return;
    }

    // Optimistically update UI
    const updatedLeads = { ...leads };
    updatedLeads[draggedLead.fromColumn] = updatedLeads[draggedLead.fromColumn].filter(
      l => l.id !== draggedLead.id
    );
    updatedLeads[toColumn] = [{ ...draggedLead, status: toColumn }, ...updatedLeads[toColumn]];
    setLeads(updatedLeads);

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/leads/${draggedLead.id}/status`, 
        { status: toColumn },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: 'Lead Moved',
        description: `Moved to ${COLUMNS.find(c => c.id === toColumn)?.label}`
      });
    } catch (error) {
      // Revert on error
      fetchLeads();
      toast({
        title: 'Error',
        description: 'Failed to move lead',
        variant: 'destructive'
      });
    }
    
    setDraggedLead(null);
  };

  // Edit Lead
  const openEditModal = (lead) => {
    setSelectedLead({ ...lead });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedLead) return;
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/leads/${selectedLead.id}`, selectedLead, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Lead Updated', description: 'Changes saved successfully' });
      setEditModalOpen(false);
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lead',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Notes
  const openNotesModal = (lead) => {
    setSelectedLead({ ...lead });
    setNotesModalOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/leads/${selectedLead.id}/notes`, 
        { notes: selectedLead.notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Notes Saved', description: 'Notes updated successfully' });
      setNotesModalOpen(false);
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete Lead
  const handleDelete = async (lead) => {
    if (!window.confirm(`Delete lead from ${lead.name}?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/leads/${lead.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Lead Deleted', description: 'Lead removed successfully' });
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive'
      });
    }
  };

  // Filter leads by search
  const filterLeads = (columnLeads) => {
    if (!searchQuery.trim()) return columnLeads;
    const query = searchQuery.toLowerCase();
    return columnLeads.filter(lead => 
      lead.name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.subject?.toLowerCase().includes(query) ||
      lead.message?.toLowerCase().includes(query)
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  const totalLeads = Object.values(leads).flat().length;

  return (
    <div className="space-y-6" data-testid="admin-leads-kanban">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#6e2ea8]" />
            Leads Kanban
          </h1>
          <p className="text-gray-500">{totalLeads} total leads from contact forms</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
              data-testid="leads-search"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(column => {
          const columnLeads = filterLeads(leads[column.id] || []);
          const isDropTarget = dragOverColumn === column.id;
          
          return (
            <div
              key={column.id}
              className={`rounded-xl border-2 transition-all ${
                isDropTarget 
                  ? 'border-[#6e2ea8] bg-purple-50 shadow-lg' 
                  : 'border-gray-200 bg-gray-50'
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              data-testid={`column-${column.id}`}
            >
              {/* Column Header */}
              <div className={`px-4 py-3 border-b ${column.lightColor} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-gray-800">{column.label}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white">
                    {columnLeads.length}
                  </Badge>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
                {columnLeads.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No leads</p>
                  </div>
                ) : (
                  columnLeads.map(lead => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead, column.id)}
                      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white ${
                        draggedLead?.id === lead.id ? 'opacity-50 scale-95' : ''
                      }`}
                      data-testid={`lead-card-${lead.id}`}
                    >
                      <CardContent className="p-4">
                        {/* Drag Handle & Actions */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-gray-300" />
                            <span className="font-medium text-gray-900 truncate max-w-[140px]">
                              {lead.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => openEditModal(lead)}
                              data-testid={`edit-lead-${lead.id}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-amber-50 hover:text-amber-600"
                              onClick={() => openNotesModal(lead)}
                              data-testid={`notes-lead-${lead.id}`}
                            >
                              <StickyNote className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDelete(lead)}
                              data-testid={`delete-lead-${lead.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Lead Info */}
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <a 
                              href={`mailto:${lead.email}`}
                              className="truncate hover:text-[#6e2ea8] hover:underline"
                            >
                              {lead.email}
                            </a>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              <a 
                                href={`tel:${lead.phone}`}
                                className="hover:text-[#6e2ea8] hover:underline"
                              >
                                {lead.phone}
                              </a>
                            </div>
                          )}
                          {lead.subject && (
                            <p className="text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded truncate">
                              {lead.subject}
                            </p>
                          )}
                          {lead.notes && (
                            <div className="flex items-start gap-1.5 mt-2 p-2 bg-amber-50 rounded border border-amber-100">
                              <StickyNote className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-700 line-clamp-2">{lead.notes}</p>
                            </div>
                          )}
                          {/* Attachments */}
                          {lead.attachments && lead.attachments.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <Paperclip className="w-3 h-3 text-blue-500" />
                              <div className="flex flex-wrap gap-1">
                                {lead.attachments.map((att, idx) => (
                                  <a
                                    key={idx}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                  >
                                    {att.name?.slice(0, 15)}{att.name?.length > 15 ? '...' : ''}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lead.created_at)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {lead.source || 'Contact Form'}
                          </Badge>
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

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={selectedLead.name || ''}
                  onChange={(e) => setSelectedLead({ ...selectedLead, name: e.target.value })}
                  data-testid="edit-lead-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={selectedLead.email || ''}
                  onChange={(e) => setSelectedLead({ ...selectedLead, email: e.target.value })}
                  data-testid="edit-lead-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={selectedLead.phone || ''}
                  onChange={(e) => setSelectedLead({ ...selectedLead, phone: e.target.value })}
                  data-testid="edit-lead-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={selectedLead.subject || ''}
                  onChange={(e) => setSelectedLead({ ...selectedLead, subject: e.target.value })}
                  data-testid="edit-lead-subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={selectedLead.message || ''}
                  onChange={(e) => setSelectedLead({ ...selectedLead, message: e.target.value })}
                  rows={4}
                  data-testid="edit-lead-message"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEdit} 
                  disabled={saving}
                  className="bg-[#6e2ea8] hover:bg-[#5a2589]"
                  data-testid="save-edit-btn"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-amber-500" />
              Notes for {selectedLead?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <Textarea
                value={selectedLead.notes || ''}
                onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                placeholder="Add notes about this lead..."
                rows={6}
                data-testid="lead-notes-textarea"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNotesModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-600"
                  data-testid="save-notes-btn"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeadsKanban;
