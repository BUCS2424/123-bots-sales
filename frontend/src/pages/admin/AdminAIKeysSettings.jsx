import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Key, Save, Loader2, Eye, EyeOff, CheckCircle, AlertCircle,
  Lock, Unlock, Pencil, Plus, Trash2, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API Key Provider Definitions
const API_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for text generation, product descriptions, and AI features',
    color: 'from-green-500 to-emerald-600',
    icon: '🤖',
    placeholder: 'sk-...',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpText: 'Get your API key from OpenAI Platform'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'AI voice generation and text-to-speech capabilities',
    color: 'from-purple-500 to-violet-600',
    icon: '🎙️',
    placeholder: 'Enter your ElevenLabs API key',
    helpUrl: 'https://elevenlabs.io/app/settings/api-keys',
    helpText: 'Get your API key from ElevenLabs Dashboard'
  },
  {
    id: 'apifree',
    name: 'APIFree.ai',
    description: 'Free AI API access for text generation and AI features',
    color: 'from-blue-500 to-cyan-600',
    icon: '🆓',
    placeholder: 'Enter your APIFree.ai key',
    helpUrl: 'https://www.apifree.ai',
    helpText: 'Get your free API key from APIFree.ai'
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Claude AI models for advanced reasoning and text generation',
    color: 'from-orange-500 to-amber-600',
    icon: '🧠',
    placeholder: 'sk-ant-...',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    helpText: 'Get your API key from Anthropic Console'
  }
];

const AdminAIKeysSettings = () => {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState({});
  const [editMode, setEditMode] = useState({});
  const [showKey, setShowKey] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin-settings/ai-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setKeys(response.data);
        // Set edit mode to false for keys that have values
        const editModes = {};
        API_PROVIDERS.forEach(p => {
          editModes[p.id] = !response.data[p.id]?.api_key;
        });
        setEditMode(editModes);
      }
    } catch (error) {
      console.error('Failed to load AI keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveKey = async (providerId) => {
    setSaving(prev => ({ ...prev, [providerId]: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin-settings/ai-keys/${providerId}`, keys[providerId] || {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditMode(prev => ({ ...prev, [providerId]: false }));
      toast({
        title: 'Key Saved',
        description: `${API_PROVIDERS.find(p => p.id === providerId)?.name} API key has been saved and locked.`
      });
    } catch (error) {
      console.error('Failed to save key:', error);
      toast({
        title: 'Error',
        description: 'Failed to save API key',
        variant: 'destructive'
      });
    } finally {
      setSaving(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const deleteKey = async (providerId) => {
    if (!window.confirm('Are you sure you want to remove this API key?')) return;
    
    setSaving(prev => ({ ...prev, [providerId]: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin-settings/ai-keys/${providerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeys(prev => ({ ...prev, [providerId]: { enabled: false, api_key: '' } }));
      setEditMode(prev => ({ ...prev, [providerId]: true }));
      toast({
        title: 'Key Removed',
        description: `${API_PROVIDERS.find(p => p.id === providerId)?.name} API key has been removed.`
      });
    } catch (error) {
      console.error('Failed to delete key:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove API key',
        variant: 'destructive'
      });
    } finally {
      setSaving(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const updateKeyValue = (providerId, field, value) => {
    setKeys(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [field]: value
      }
    }));
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••••••' + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-ai-keys-settings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Key className="w-8 h-8 text-purple-600" />
            AI Keys
          </h1>
          <p className="text-gray-500">Manage API keys for AI-powered features</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-600 rounded-xl text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">AI Feature Keys</h3>
              <p className="text-gray-600 mt-1">
                Add your API keys below to enable AI-powered features like product description generation, 
                voice synthesis, and more. Keys are encrypted and stored securely.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Cards */}
      <div className="grid gap-6">
        {API_PROVIDERS.map((provider) => {
          const keyData = keys[provider.id] || { enabled: false, api_key: '' };
          const isEditing = editMode[provider.id];
          const isSaving = saving[provider.id];
          const hasKey = !!keyData.api_key;

          return (
            <Card key={provider.id} className="overflow-hidden" data-testid={`ai-key-card-${provider.id}`}>
              <div className={`h-2 bg-gradient-to-r ${provider.color}`} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasKey && !isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <Lock className="w-4 h-4" />
                          Saved
                        </span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        Not configured
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Enable {provider.name}</Label>
                    <p className="text-xs text-gray-500">Use this provider for AI features</p>
                  </div>
                  <Switch
                    checked={keyData.enabled || false}
                    onCheckedChange={(checked) => updateKeyValue(provider.id, 'enabled', checked)}
                    disabled={!hasKey && !isEditing}
                    data-testid={`ai-key-enabled-${provider.id}`}
                  />
                </div>

                {/* API Key Input */}
                <div className="space-y-2">
                  <Label htmlFor={`api-key-${provider.id}`}>API Key</Label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={`api-key-${provider.id}`}
                          type={showKey[provider.id] ? "text" : "password"}
                          placeholder={provider.placeholder}
                          value={keyData.api_key || ''}
                          onChange={(e) => updateKeyValue(provider.id, 'api_key', e.target.value)}
                          className="pr-10 font-mono"
                          data-testid={`ai-key-input-${provider.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showKey[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        onClick={() => saveKey(provider.id)}
                        disabled={isSaving || !keyData.api_key}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`ai-key-save-${provider.id}`}
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save & Lock
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-100 border rounded-md font-mono text-sm">
                        <Lock className="w-4 h-4 text-gray-400" />
                        {showKey[provider.id] ? keyData.api_key : maskApiKey(keyData.api_key)}
                        <button
                          type="button"
                          onClick={() => setShowKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                          className="ml-auto text-gray-400 hover:text-gray-600"
                        >
                          {showKey[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(prev => ({ ...prev, [provider.id]: true }))}
                        data-testid={`ai-key-edit-${provider.id}`}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => deleteKey(provider.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`ai-key-delete-${provider.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {provider.helpUrl && (
                    <p className="text-xs text-gray-500">
                      {provider.helpText}{' '}
                      <a
                        href={provider.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline"
                      >
                        Get key →
                      </a>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage Note */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500 text-center">
            When the AI Product Generator feature is enabled, the system will use the first available enabled API key
            in order of priority: OpenAI → Anthropic → APIFree.ai
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAIKeysSettings;
