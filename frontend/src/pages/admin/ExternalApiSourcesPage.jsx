import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, RefreshCw, Copy, CheckCircle2, Mail, Globe, Key, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExternalApiSourcesPage = () => {
  const [sources, setSources] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [draft, setDraft] = useState({
    name: '', auth_header_name: 'X-API-Key', default_pipeline_id: '', default_stage_id: '',
    email_forward_enabled: false, forward_email: '',
  });

  const tokenHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const fetchData = useCallback(async () => {
    try {
      const [srcRes, pipRes] = await Promise.all([
        axios.get(`${API}/external-api/sources`, { headers: tokenHeaders }),
        axios.get(`${API}/pipelines/`, { headers: tokenHeaders }),
      ]);
      setSources(srcRes.data || []);
      setPipelines(pipRes.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!draft.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    try {
      await axios.post(`${API}/external-api/sources`, draft, { headers: tokenHeaders });
      toast({ title: 'Source Created' });
      setCreateOpen(false);
      setDraft({ name: '', auth_header_name: 'X-API-Key', default_pipeline_id: '', default_stage_id: '', email_forward_enabled: false, forward_email: '' });
      fetchData();
    } catch {
      toast({ title: 'Error', description: 'Failed to create source', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this API source?')) return;
    try {
      await axios.delete(`${API}/external-api/sources/${id}`, { headers: tokenHeaders });
      toast({ title: 'Source Deleted' });
      fetchData();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (source) => {
    try {
      await axios.put(`${API}/external-api/sources/${source.id}`, { is_active: !source.is_active }, { headers: tokenHeaders });
      fetchData();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleRegenToken = async (id) => {
    if (!window.confirm('Regenerate token? The old token will stop working immediately.')) return;
    try {
      const res = await axios.post(`${API}/external-api/sources/${id}/regenerate-token`, {}, { headers: tokenHeaders });
      toast({ title: 'Token Regenerated', description: 'New token is active. Copy it now.' });
      fetchData();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const endpointUrl = `${BACKEND_URL}/api/external-api/leads`;
  const selectedPipeline = pipelines.find(p => p.id === draft.default_pipeline_id);

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="external-api-sources-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Globe className="w-7 h-7 text-blue-600" />
            External Stack API Delivery
          </h1>
          <p className="text-gray-500 mt-1">Manage API sources that feed leads into your pipeline</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="create-source-btn">
          <Plus className="w-4 h-4 mr-2" /> Add API Source
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm text-gray-700">Endpoint URL</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800 truncate" data-testid="endpoint-url">{endpointUrl}</code>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(endpointUrl, 'url')} data-testid="copy-endpoint-btn">
              {copiedId === 'url' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1">POST requests to this URL with the source's auth header and token</p>
        </CardContent>
      </Card>

      {sources.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-400">No API sources configured. Click "Add API Source" to get started.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => (
            <Card key={source.id} className={!source.is_active ? 'opacity-60' : ''} data-testid={`source-card-${source.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-gray-900">{source.name}</h3>
                      <Badge variant={source.is_active ? 'default' : 'secondary'}>{source.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Created {new Date(source.created_at).toLocaleDateString()} | {source.leads_received} leads received</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(source)} data-testid={`toggle-source-${source.id}`}>
                      {source.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(source.id)} data-testid={`delete-source-${source.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-400">Auth Header</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1 truncate">{source.auth_header_name}</code>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(source.auth_header_name, `header-${source.id}`)}>
                        {copiedId === `header-${source.id}` ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Auth Token</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1 truncate">{source.auth_token}</code>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(source.auth_token, `token-${source.id}`)}>
                        {copiedId === `token-${source.id}` ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRegenToken(source.id)} data-testid={`regen-token-${source.id}`}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {source.email_forward_enabled && source.forward_email && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    Forwarding to: {source.forward_email}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="text-xl font-bold">Add API Source</DialogTitle>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Source Name *</Label>
              <Input value={draft.name} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g., Vital Reach Media" className="mt-1" data-testid="source-name-input" />
            </div>
            <div>
              <Label>Auth Header Name</Label>
              <Input value={draft.auth_header_name} onChange={(e) => setDraft(d => ({ ...d, auth_header_name: e.target.value }))} placeholder="X-API-Key" className="mt-1" />
            </div>
            <div>
              <Label>Default Pipeline</Label>
              <select value={draft.default_pipeline_id} onChange={(e) => setDraft(d => ({ ...d, default_pipeline_id: e.target.value, default_stage_id: '' }))} className="w-full h-10 mt-1 rounded-md border border-gray-300 px-3 text-sm">
                <option value="">-- Select Pipeline --</option>
                {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {selectedPipeline && (
              <div>
                <Label>Default Stage</Label>
                <select value={draft.default_stage_id} onChange={(e) => setDraft(d => ({ ...d, default_stage_id: e.target.value }))} className="w-full h-10 mt-1 rounded-md border border-gray-300 px-3 text-sm">
                  <option value="">-- First Stage --</option>
                  {selectedPipeline.stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Checkbox checked={draft.email_forward_enabled} onCheckedChange={(v) => setDraft(d => ({ ...d, email_forward_enabled: Boolean(v) }))} />
              <Label className="cursor-pointer">Email notification when lead arrives</Label>
            </div>
            {draft.email_forward_enabled && (
              <div>
                <Label>Forward to Email</Label>
                <Input value={draft.forward_email} onChange={(e) => setDraft(d => ({ ...d, forward_email: e.target.value }))} placeholder="admin@company.com" className="mt-1" />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} data-testid="save-source-btn">Create Source</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExternalApiSourcesPage;
