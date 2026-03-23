import React, { useState, useEffect } from 'react';
import { 
  Mail, Save, Loader2, RefreshCw, Eye, Code, RotateCcw, 
  CheckCircle, AlertCircle, FileText, Send, Package, UserPlus, Key, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const templateIcons = {
  order_confirmation: Package,
  shipping_confirmation: Send,
  welcome_email: UserPlus,
  password_reset: Key,
  order_status_update: Bell,
};

const AdminEmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setEditedSubject(selectedTemplate.subject);
      setEditedContent(selectedTemplate.html_content);
    }
  }, [selectedTemplate]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/email-templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        if (data.length > 0 && !selectedTemplate) {
          setSelectedTemplate(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/email-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: editedSubject,
          html_content: editedContent,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Template Saved',
          description: `${selectedTemplate.name} has been updated successfully.`,
        });
        fetchTemplates();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedTemplate) return;
    if (!window.confirm(`Are you sure you want to reset "${selectedTemplate.name}" to the default template?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/email-templates/${selectedTemplate.id}/reset`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Template Reset',
          description: `${selectedTemplate.name} has been reset to default.`,
        });
        fetchTemplates();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset template',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    try {
      // First save current edits for preview
      const response = await fetch(`${API_URL}/api/email-templates/${selectedTemplate.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html_content: editedContent,
          subject: editedSubject,
        }),
      });

      if (response.ok) {
        const preview = await response.json();
        setPreviewHtml(preview.html_content);
        setPreviewSubject(preview.subject);
        setShowPreview(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate preview',
        variant: 'destructive',
      });
    }
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedContent(template.html_content);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
        <span className="ml-2 text-gray-500">Loading email templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="email-templates-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="w-7 h-7 text-[rgb(37, 99, 235)]" />
            System Email Templates
          </h1>
          <p className="text-gray-500 mt-1">Customize the emails sent to your customers</p>
        </div>
        <Button variant="outline" onClick={fetchTemplates} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Templates</CardTitle>
            <CardDescription>Select a template to edit</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {templates.map((template) => {
                const IconComponent = templateIcons[template.id] || FileText;
                return (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template)}
                    className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedTemplate?.id === template.id ? 'bg-purple-50 border-l-4 border-[rgb(37, 99, 235)]' : ''
                    }`}
                    data-testid={`template-btn-${template.id}`}
                  >
                    <div className={`p-2 rounded-lg ${selectedTemplate?.id === template.id ? 'bg-[rgb(37, 99, 235)] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{template.name}</p>
                      <p className="text-xs text-gray-500 truncate">{template.description}</p>
                    </div>
                    {template.is_customized && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">Custom</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Template Editor */}
        <Card className="lg:col-span-3">
          {selectedTemplate ? (
            <>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedTemplate.name}
                    {selectedTemplate.is_customized && (
                      <Badge className="bg-amber-100 text-amber-700">Customized</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{selectedTemplate.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handlePreview}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  {selectedTemplate.is_customized && (
                    <Button variant="outline" onClick={handleReset} className="text-amber-600 hover:text-amber-700">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  )}
                  <Button onClick={handleSave} disabled={saving} className="bg-[rgb(37, 99, 235)] hover:bg-[#5a2590]">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="visual" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="visual">
                      <Eye className="w-4 h-4 mr-2" />
                      Visual Editor
                    </TabsTrigger>
                    <TabsTrigger value="code">
                      <Code className="w-4 h-4 mr-2" />
                      HTML Code
                    </TabsTrigger>
                    <TabsTrigger value="variables">
                      <FileText className="w-4 h-4 mr-2" />
                      Variables
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="visual" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Subject</Label>
                      <Input
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        placeholder="Enter email subject..."
                        className="font-mono"
                      />
                      <p className="text-xs text-gray-500">Use {"{{variable_name}}"} for dynamic content</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Email Preview</Label>
                      <div className="border rounded-lg overflow-hidden bg-gray-100">
                        <div className="bg-gray-200 px-4 py-2 flex items-center gap-2 border-b">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                          </div>
                          <span className="text-sm text-gray-600 ml-2">Email Preview</span>
                        </div>
                        <div className="p-4 bg-white">
                          <iframe
                            srcDoc={editedContent}
                            title="Email Preview"
                            className="w-full h-[500px] border-0"
                            sandbox="allow-same-origin"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Subject</Label>
                      <Input
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        placeholder="Enter email subject..."
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>HTML Content</Label>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-[500px] p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg border focus:ring-2 focus:ring-[rgb(37, 99, 235)] focus:border-transparent"
                        placeholder="Enter HTML content..."
                        spellCheck={false}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="variables" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Available Variables</CardTitle>
                        <CardDescription>
                          Use these variables in your template with double curly braces: {"{{variable_name}}"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {selectedTemplate.variables.map((variable) => (
                            <div
                              key={variable}
                              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border hover:border-[rgb(37, 99, 235)] transition-colors cursor-pointer group"
                              onClick={() => {
                                navigator.clipboard.writeText(`{{${variable}}}`);
                                toast({ title: 'Copied!', description: `{{${variable}}} copied to clipboard` });
                              }}
                            >
                              <code className="text-sm text-[rgb(37, 99, 235)] font-mono">{`{{${variable}}}`}</code>
                              <CheckCircle className="w-4 h-4 text-gray-400 group-hover:text-green-500 ml-auto" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          Tips for Email Templates
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li>• Use inline CSS styles for maximum email client compatibility</li>
                          <li>• Keep email width under 600px for mobile responsiveness</li>
                          <li>• Always include a plain text fallback (coming soon)</li>
                          <li>• Test your emails in multiple clients before going live</li>
                          <li>• Avoid using JavaScript - it's blocked by most email clients</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a template to start editing</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Subject:</strong> {previewSubject}
              </p>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="w-full h-[600px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailTemplates;
