import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Edit2, X, Loader2, ArrowLeft, ArrowUp, ArrowDown, GitBranch, ScanLine } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/workflows`;

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'photo', label: 'Photo' },
  { value: 'checkbox', label: 'Yes / No' },
];

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
];

const genId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const emptyStep = () => ({ id: genId(), label: '', field_type: 'text', options: [], required: true, condition: null });
const emptyDraft = { name: '', trigger_event: '', is_active: true, steps: [] };

const AdminWorkflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [triggerEvents, setTriggerEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const tokenHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [wfRes, evRes] = await Promise.all([
        axios.get(`${API}/`, { headers: tokenHeaders }),
        axios.get(`${API}/trigger-events`, { headers: tokenHeaders }),
      ]);
      setWorkflows(wfRes.data || []);
      setTriggerEvents(evRes.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load workflows', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const triggerLabel = (value) => triggerEvents.find((e) => e.value === value)?.label || value;

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setModalOpen(true);
  };

  const openEdit = (wf) => {
    setEditingId(wf.id);
    setDraft({
      name: wf.name,
      trigger_event: wf.trigger_event,
      is_active: wf.is_active,
      steps: (wf.steps || []).map((s) => ({ ...s, options: s.options || [] })),
    });
    setModalOpen(true);
  };

  const addStep = () => {
    setDraft((d) => ({ ...d, steps: [...d.steps, { ...emptyStep(), order: d.steps.length }] }));
  };

  const updateStep = (index, changes) => {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, i) => (i === index ? { ...s, ...changes } : s)),
    }));
  };

  const removeStep = (index) => {
    setDraft((d) => {
      const removedId = d.steps[index].id;
      const steps = d.steps
        .filter((_, i) => i !== index)
        // Clear any condition that referenced the removed step
        .map((s) => (s.condition?.step_id === removedId ? { ...s, condition: null } : s))
        .map((s, i) => ({ ...s, order: i }));
      return { ...d, steps };
    });
  };

  const moveStep = (index, direction) => {
    setDraft((d) => {
      const steps = [...d.steps];
      const target = index + direction;
      if (target < 0 || target >= steps.length) return d;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...d, steps: steps.map((s, i) => ({ ...s, order: i })) };
    });
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.trigger_event) {
      toast({ title: 'Missing fields', description: 'Name and trigger event are required', variant: 'destructive' });
      return;
    }
    if (draft.steps.some((s) => !s.label.trim())) {
      toast({ title: 'Missing step labels', description: 'Every step needs a label', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, draft, { headers: tokenHeaders });
        toast({ title: 'Saved', description: 'Workflow updated' });
      } else {
        await axios.post(`${API}/`, draft, { headers: tokenHeaders });
        toast({ title: 'Created', description: 'Workflow created' });
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to save workflow', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (wf) => {
    if (!window.confirm(`Delete the "${wf.name}" workflow?`)) return;
    try {
      await axios.delete(`${API}/${wf.id}`, { headers: tokenHeaders });
      toast({ title: 'Deleted', description: 'Workflow removed' });
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete workflow', variant: 'destructive' });
    }
  };

  const toggleActive = async (wf) => {
    try {
      await axios.put(`${API}/${wf.id}`, { is_active: !wf.is_active }, { headers: tokenHeaders });
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update workflow', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6" data-testid="workflows-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/admin/service-repair/scan" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Custom Workflows</h1>
          </div>
          <p className="text-gray-500 text-sm">Build step-by-step data collection flows that guide your team through a scan action</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/service-repair/scan">
            <Button variant="outline"><ScanLine className="w-4 h-4 mr-2" />Go to Scan</Button>
          </Link>
          <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={openCreate} data-testid="add-workflow-btn">
            <Plus className="w-4 h-4 mr-2" />New Workflow
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : workflows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No workflows yet</CardContent></Card>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Trigger</th>
                <th className="px-4 py-3 font-medium">Steps</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf) => (
                <tr key={wf.id} className="border-b last:border-0 hover:bg-gray-50" data-testid={`workflow-row-${wf.id}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{wf.name}</td>
                  <td className="px-4 py-3 text-gray-600">{triggerLabel(wf.trigger_event)}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{(wf.steps || []).length} steps</Badge></td>
                  <td className="px-4 py-3">
                    <Switch checked={wf.is_active} onCheckedChange={() => toggleActive(wf)} data-testid={`workflow-active-toggle-${wf.id}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(wf)}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => remove(wf)}><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="workflow-edit-modal">
          <DialogTitle className="flex items-center justify-between">
            <span>{editingId ? 'Edit Workflow' : 'New Workflow'}</span>
            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </DialogTitle>

          <div className="space-y-5 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Workflow Name</Label>
                <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Intake Checklist" data-testid="workflow-name-input" />
              </div>
              <div>
                <Label>Trigger Event</Label>
                <Select value={draft.trigger_event} onValueChange={(v) => setDraft((d) => ({ ...d, trigger_event: v }))}>
                  <SelectTrigger data-testid="workflow-trigger-select"><SelectValue placeholder="Choose a trigger..." /></SelectTrigger>
                  <SelectContent>
                    {triggerEvents.map((ev) => (
                      <SelectItem key={ev.value} value={ev.value}>{ev.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft((d) => ({ ...d, is_active: v }))} data-testid="workflow-active-switch" />
              <span className="text-sm text-gray-600">Active (only one active workflow per trigger will run)</span>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Steps</p>
                <Button size="sm" variant="outline" onClick={addStep} data-testid="add-step-btn">
                  <Plus className="w-4 h-4 mr-1.5" />Add Step
                </Button>
              </div>

              {draft.steps.length === 0 ? (
                <p className="text-sm text-gray-400">No steps yet - add one to start building the flow.</p>
              ) : (
                draft.steps.map((step, index) => {
                  const earlierSteps = draft.steps.slice(0, index);
                  return (
                    <div key={step.id} className="border rounded-lg p-4 bg-gray-50 space-y-3" data-testid={`step-editor-${index}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Step {index + 1}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => moveStep(index, -1)}><ArrowUp className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" disabled={index === draft.steps.length - 1} onClick={() => moveStep(index, 1)}><ArrowDown className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeStep(index)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs">Question / Label</Label>
                          <Input value={step.label} onChange={(e) => updateStep(index, { label: e.target.value })} placeholder="e.g. Photo of damage on arrival" data-testid={`step-label-${index}`} />
                        </div>
                        <div>
                          <Label className="text-xs">Field Type</Label>
                          <Select value={step.field_type} onValueChange={(v) => updateStep(index, { field_type: v })}>
                            <SelectTrigger data-testid={`step-type-${index}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map((ft) => (
                                <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end gap-2 pb-1.5">
                          <Switch checked={step.required} onCheckedChange={(v) => updateStep(index, { required: v })} data-testid={`step-required-${index}`} />
                          <span className="text-sm text-gray-600">Required</span>
                        </div>
                        {step.field_type === 'select' && (
                          <div className="col-span-2">
                            <Label className="text-xs">Options (one per line)</Label>
                            <Textarea
                              rows={3}
                              value={(step.options || []).join('\n')}
                              onChange={(e) => updateStep(index, { options: e.target.value.split('\n') })}
                              data-testid={`step-options-${index}`}
                            />
                          </div>
                        )}
                      </div>

                      {earlierSteps.length > 0 && (
                        <div className="border-t pt-3">
                          {!step.condition ? (
                            <button
                              type="button"
                              className="text-xs text-blue-600 flex items-center gap-1.5 hover:underline"
                              onClick={() => updateStep(index, { condition: { step_id: earlierSteps[0].id, operator: 'equals', value: '' } })}
                              data-testid={`add-condition-${index}`}
                            >
                              <GitBranch className="w-3.5 h-3.5" /> Only show this step conditionally
                            </button>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="text-gray-500">Show only if</span>
                              <Select value={step.condition.step_id} onValueChange={(v) => updateStep(index, { condition: { ...step.condition, step_id: v } })}>
                                <SelectTrigger className="w-40 h-8" data-testid={`condition-step-${index}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {earlierSteps.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.label || `Step ${draft.steps.findIndex((x) => x.id === s.id) + 1}`}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={step.condition.operator} onValueChange={(v) => updateStep(index, { condition: { ...step.condition, operator: v } })}>
                                <SelectTrigger className="w-36 h-8" data-testid={`condition-operator-${index}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {OPERATORS.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                className="w-32 h-8"
                                value={step.condition.value}
                                onChange={(e) => updateStep(index, { condition: { ...step.condition, value: e.target.value } })}
                                placeholder="value"
                                data-testid={`condition-value-${index}`}
                              />
                              <button type="button" className="text-gray-400 hover:text-red-500" onClick={() => updateStep(index, { condition: null })}>
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={save} disabled={saving} data-testid="workflow-save-btn">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingId ? 'Save Changes' : 'Create Workflow'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWorkflows;
