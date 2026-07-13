import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, Save, X, GripVertical, Layers } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLOR_OPTIONS = [
  { value: 'bg-red-500', label: 'Red' },
  { value: 'bg-orange-500', label: 'Orange' },
  { value: 'bg-amber-400', label: 'Amber' },
  { value: 'bg-yellow-500', label: 'Yellow' },
  { value: 'bg-green-500', label: 'Green' },
  { value: 'bg-emerald-600', label: 'Emerald' },
  { value: 'bg-teal-500', label: 'Teal' },
  { value: 'bg-cyan-500', label: 'Cyan' },
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-indigo-500', label: 'Indigo' },
  { value: 'bg-purple-500', label: 'Purple' },
  { value: 'bg-pink-500', label: 'Pink' },
  { value: 'bg-slate-400', label: 'Slate' },
  { value: 'bg-gray-500', label: 'Gray' },
];

const PipelinesPage = () => {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState(null);
  const [draft, setDraft] = useState({ name: '', stages: [] });
  const [isCreating, setIsCreating] = useState(false);

  const tokenHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const fetchPipelines = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/pipelines/`, { headers: tokenHeaders });
      setPipelines(res.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load pipelines', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPipelines(); }, [fetchPipelines]);

  const openCreate = () => {
    setIsCreating(true);
    setEditingPipeline(null);
    setDraft({ name: '', stages: [{ id: '', label: '', color: 'bg-blue-500', bar_color: 'bg-blue-500' }] });
    setEditOpen(true);
  };

  const openEdit = (pipeline) => {
    setIsCreating(false);
    setEditingPipeline(pipeline);
    setDraft({ name: pipeline.name, stages: pipeline.stages.map(s => ({ ...s })) });
    setEditOpen(true);
  };

  const addStage = () => {
    setDraft(d => ({ ...d, stages: [...d.stages, { id: '', label: '', color: 'bg-slate-400', bar_color: 'bg-slate-400' }] }));
  };

  const removeStage = (idx) => {
    setDraft(d => ({ ...d, stages: d.stages.filter((_, i) => i !== idx) }));
  };

  const updateStage = (idx, field, value) => {
    setDraft(d => {
      const stages = [...d.stages];
      stages[idx] = { ...stages[idx], [field]: value };
      if (field === 'color') stages[idx].bar_color = value;
      return { ...d, stages };
    });
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast({ title: 'Pipeline name required', variant: 'destructive' });
      return;
    }
    if (draft.stages.length === 0 || draft.stages.some(s => !s.label.trim())) {
      toast({ title: 'All stages must have a label', variant: 'destructive' });
      return;
    }
    try {
      if (isCreating) {
        await axios.post(`${API}/pipelines/`, draft, { headers: tokenHeaders });
        toast({ title: 'Pipeline Created' });
      } else {
        await axios.put(`${API}/pipelines/${editingPipeline.id}`, draft, { headers: tokenHeaders });
        toast({ title: 'Pipeline Updated' });
      }
      setEditOpen(false);
      fetchPipelines();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.detail || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async (pipeline) => {
    if (pipeline.is_default) {
      toast({ title: 'Cannot delete', description: 'The default pipeline cannot be deleted', variant: 'destructive' });
      return;
    }
    if (!window.confirm(`Delete pipeline "${pipeline.name}"?`)) return;
    try {
      await axios.delete(`${API}/pipelines/${pipeline.id}`, { headers: tokenHeaders });
      toast({ title: 'Pipeline Deleted' });
      fetchPipelines();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.detail || 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="pipelines-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Layers className="w-7 h-7 text-blue-600" />
            Pipelines & Stages
          </h1>
          <p className="text-gray-500 mt-1">Create and manage your lead pipelines and their stages</p>
        </div>
        <Button onClick={openCreate} data-testid="create-pipeline-btn">
          <Plus className="w-4 h-4 mr-2" /> New Pipeline
        </Button>
      </div>

      {pipelines.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-400">No pipelines found.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id} data-testid={`pipeline-card-${pipeline.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg text-gray-900">{pipeline.name}</h3>
                    {pipeline.is_default && <Badge>Default</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(pipeline)} data-testid={`edit-pipeline-${pipeline.id}`}>
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    {!pipeline.is_default && (
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(pipeline)} data-testid={`delete-pipeline-${pipeline.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pipeline.stages.map((stage, idx) => (
                    <div key={stage.id || idx} className="flex items-center gap-1.5 bg-gray-50 border rounded-full px-3 py-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span className="text-sm text-gray-700">{stage.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogTitle className="text-xl font-bold">{isCreating ? 'Create Pipeline' : 'Edit Pipeline'}</DialogTitle>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Pipeline Name *</Label>
              <Input value={draft.name} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g., Vital Reach Media" className="mt-1" data-testid="pipeline-name-input" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Stages</Label>
                <Button variant="outline" size="sm" onClick={addStage} data-testid="add-stage-btn">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Stage
                </Button>
              </div>
              <div className="space-y-2">
                {draft.stages.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg" data-testid={`stage-row-${idx}`}>
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${stage.color}`} />
                    <Input
                      value={stage.label}
                      onChange={(e) => updateStage(idx, 'label', e.target.value)}
                      placeholder="Stage name"
                      className="h-8 text-sm flex-1"
                    />
                    <select
                      value={stage.color}
                      onChange={(e) => updateStage(idx, 'color', e.target.value)}
                      className="h-8 rounded border border-gray-300 px-2 text-xs"
                    >
                      {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {draft.stages.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600" onClick={() => removeStage(idx)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} data-testid="save-pipeline-btn">
                <Save className="w-4 h-4 mr-1" /> {isCreating ? 'Create' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PipelinesPage;
