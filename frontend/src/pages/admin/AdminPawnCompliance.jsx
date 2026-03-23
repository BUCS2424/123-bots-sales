import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  FileText, Plus, Edit, Trash2, Search, Loader2, Save, X,
  Printer, Barcode, CreditCard, Shield, BookOpen, FileSignature,
  Users, AlertTriangle, CheckCircle, Download, Eye, Upload,
  RefreshCw, Settings, Clock, Calendar, Filter
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import { toast } from '../../hooks/use-toast';
import SignatureCanvas from 'react-signature-canvas';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPeptidesCompliance = ({ initialTab = 'gun-log' }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Gun Log State
  const [gunLogEntries, setGunLogEntries] = useState([]);
  const [isGunLogDialogOpen, setIsGunLogDialogOpen] = useState(false);
  const [gunLogForm, setGunLogForm] = useState({
    transaction_type: 'acquisition',
    transaction_date: new Date().toISOString().split('T')[0],
    manufacturer: '', importer: '', model: '', serial_number: '',
    firearm_type: 'handgun', caliber_gauge: '',
    acquired_from_name: '', acquired_from_address: '', acquired_from_license: '',
    disposed_to_name: '', disposed_to_address: '', disposed_to_license: '',
    disposed_to_dob: '', nics_transaction_number: '', form_4473_number: '',
    contract_id: '', pawn_ticket: '', notes: ''
  });
  
  // LEADS State
  const [leadsReports, setLeadsReports] = useState([]);
  const [leadsConfig, setLeadsConfig] = useState({
    enabled: false, report_frequency: 'daily', report_time: '23:00',
    include_pawns: true, include_buys: true, include_sales: false,
    email_report: false, email_recipients: [], auto_submit: false
  });
  const [isLeadsGenerating, setIsLeadsGenerating] = useState(false);
  
  // Internal Knowledge Base State
  const [knowledgeArticles, setKnowledgeArticles] = useState([]);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({
    title: '', content: '', category: 'policies', tags: [],
    access_level: 'all', requires_acknowledgment: false,
    version: '1.0', effective_date: '', review_date: '',
    is_published: true, order: 0
  });
  
  // Acknowledgment Forms State
  const [ackForms, setAckForms] = useState([]);
  const [isAckFormDialogOpen, setIsAckFormDialogOpen] = useState(false);
  const [editingAckForm, setEditingAckForm] = useState(null);
  const [ackFormData, setAckFormData] = useState({
    title: '', description: '', content: '', form_type: 'policy',
    is_required: true, requires_signature: true,
    expires_after_days: null, reminder_days_before: 7, is_active: true
  });
  const [ackReport, setAckReport] = useState(null);
  
  // DL Scan State
  const [dlScanData, setDlScanData] = useState('');
  const [parsedDL, setParsedDL] = useState(null);
  const [dlSettings, setDlSettings] = useState({
    auto_create_customer: true, require_valid_license: true,
    check_expiration: true, scanner_type: 'barcode'
  });
  
  // Label/Barcode State
  const [labelTemplates, setLabelTemplates] = useState([]);
  const [barcodePreview, setBarcodePreview] = useState(null);
  const [labelForm, setLabelForm] = useState({
    sku: '', description: '', price: '', quantity: 1
  });

  // Signature Canvas Ref
  const signatureRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gunLogRes, leadsRes, leadsConfigRes, knowledgeRes, ackFormsRes, ackReportRes, dlSettingsRes, labelsRes] = await Promise.all([
        axios.get(`${API}/pawn-compliance/gun-log?limit=50`).catch(() => ({ data: [] })),
        axios.get(`${API}/pawn-extended/leads-reports`).catch(() => ({ data: [] })),
        axios.get(`${API}/pawn-compliance/leads/config`).catch(() => ({ data: {} })),
        axios.get(`${API}/pawn-compliance/knowledge`).catch(() => ({ data: [] })),
        axios.get(`${API}/pawn-compliance/acknowledgments/forms`).catch(() => ({ data: [] })),
        axios.get(`${API}/pawn-compliance/acknowledgments/report`).catch(() => ({ data: null })),
        axios.get(`${API}/pawn-compliance/dl-scan/settings`).catch(() => ({ data: {} })),
        axios.get(`${API}/pawn-compliance/labels/templates`).catch(() => ({ data: [] }))
      ]);
      
      setGunLogEntries(gunLogRes.data || []);
      setLeadsReports(leadsRes.data || []);
      setLeadsConfig(prev => ({ ...prev, ...leadsConfigRes.data }));
      setKnowledgeArticles(knowledgeRes.data || []);
      setAckForms(ackFormsRes.data || []);
      setAckReport(ackReportRes.data);
      setDlSettings(prev => ({ ...prev, ...dlSettingsRes.data }));
      setLabelTemplates(labelsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============ GUN LOG HANDLERS ============
  
  const handleSaveGunLog = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/pawn-compliance/gun-log`, gunLogForm);
      toast({ title: 'Success', description: 'Gun log entry created' });
      setIsGunLogDialogOpen(false);
      fetchData();
      resetGunLogForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save entry', variant: 'destructive' });
    }
  };

  const resetGunLogForm = () => {
    setGunLogForm({
      transaction_type: 'acquisition',
      transaction_date: new Date().toISOString().split('T')[0],
      manufacturer: '', importer: '', model: '', serial_number: '',
      firearm_type: 'handgun', caliber_gauge: '',
      acquired_from_name: '', acquired_from_address: '', acquired_from_license: '',
      disposed_to_name: '', disposed_to_address: '', disposed_to_license: '',
      disposed_to_dob: '', nics_transaction_number: '', form_4473_number: '',
      contract_id: '', pawn_ticket: '', notes: ''
    });
  };

  // ============ LEADS HANDLERS ============
  
  const handleAutoGenerateLEADS = async () => {
    setIsLeadsGenerating(true);
    try {
      const res = await axios.post(`${API}/pawn-compliance/leads/auto-generate`);
      toast({ 
        title: 'Success', 
        description: `LEADS report generated with ${res.data.transaction_count} transactions` 
      });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setIsLeadsGenerating(false);
    }
  };

  const handleSaveLeadsConfig = async () => {
    try {
      await axios.post(`${API}/pawn-compliance/leads/config`, leadsConfig);
      toast({ title: 'Success', description: 'LEADS automation settings saved' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  // ============ KNOWLEDGE BASE HANDLERS ============
  
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    try {
      if (editingArticle) {
        await axios.put(`${API}/pawn-compliance/knowledge/${editingArticle.id}`, articleForm);
        toast({ title: 'Success', description: 'Article updated' });
      } else {
        await axios.post(`${API}/pawn-compliance/knowledge`, articleForm);
        toast({ title: 'Success', description: 'Article created' });
      }
      setIsArticleDialogOpen(false);
      fetchData();
      resetArticleForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save article', variant: 'destructive' });
    }
  };

  const resetArticleForm = () => {
    setArticleForm({
      title: '', content: '', category: 'policies', tags: [],
      access_level: 'all', requires_acknowledgment: false,
      version: '1.0', effective_date: '', review_date: '',
      is_published: true, order: 0
    });
    setEditingArticle(null);
  };

  const openEditArticle = (article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      access_level: article.access_level,
      requires_acknowledgment: article.requires_acknowledgment,
      version: article.version || '1.0',
      effective_date: article.effective_date || '',
      review_date: article.review_date || '',
      is_published: article.is_published,
      order: article.order || 0
    });
    setIsArticleDialogOpen(true);
  };

  // ============ ACKNOWLEDGMENT HANDLERS ============
  
  const handleSaveAckForm = async (e) => {
    e.preventDefault();
    try {
      if (editingAckForm) {
        await axios.put(`${API}/pawn-compliance/acknowledgments/forms/${editingAckForm.id}`, ackFormData);
        toast({ title: 'Success', description: 'Form updated' });
      } else {
        await axios.post(`${API}/pawn-compliance/acknowledgments/forms`, ackFormData);
        toast({ title: 'Success', description: 'Acknowledgment form created' });
      }
      setIsAckFormDialogOpen(false);
      fetchData();
      resetAckForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save form', variant: 'destructive' });
    }
  };

  const resetAckForm = () => {
    setAckFormData({
      title: '', description: '', content: '', form_type: 'policy',
      is_required: true, requires_signature: true,
      expires_after_days: null, reminder_days_before: 7, is_active: true
    });
    setEditingAckForm(null);
  };

  // ============ DL SCAN HANDLERS ============
  
  const handleParseDL = async () => {
    if (!dlScanData.trim()) return;
    try {
      const formData = new FormData();
      formData.append('raw_data', dlScanData);
      const res = await axios.post(`${API}/pawn-compliance/dl-scan/parse`, formData);
      setParsedDL(res.data);
      toast({ title: 'Success', description: 'Driver license data parsed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to parse DL data', variant: 'destructive' });
    }
  };

  const handleCreateCustomerFromDL = async () => {
    if (!parsedDL) return;
    try {
      const res = await axios.post(`${API}/pawn-compliance/dl-scan/create-customer`, parsedDL);
      toast({ 
        title: 'Success', 
        description: res.data.existing ? 'Customer already exists' : 'Customer created from DL' 
      });
      setParsedDL(null);
      setDlScanData('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create customer', variant: 'destructive' });
    }
  };

  // ============ BARCODE HANDLERS ============
  
  const handleGenerateBarcode = async () => {
    if (!labelForm.sku) return;
    try {
      const res = await axios.post(`${API}/pawn-compliance/labels/generate-barcode`, {
        data: labelForm.sku,
        barcode_type: 'code128'
      });
      setBarcodePreview(res.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate barcode', variant: 'destructive' });
    }
  };

  const knowledgeCategories = [
    { value: 'policies', label: 'Company Policies' },
    { value: 'procedures', label: 'Standard Procedures' },
    { value: 'compliance', label: 'Compliance & Legal' },
    { value: 'training', label: 'Training Materials' },
    { value: 'operations', label: 'Operations' },
    { value: 'safety', label: 'Safety & Security' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'it', label: 'IT & Technology' }
  ];

  const formTypes = [
    { value: 'policy', label: 'Policy Acknowledgment' },
    { value: 'handbook', label: 'Employee Handbook' },
    { value: 'training', label: 'Training Completion' },
    { value: 'safety', label: 'Safety Training' },
    { value: 'compliance', label: 'Compliance Agreement' },
    { value: 'nda', label: 'Non-Disclosure Agreement' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance & Operations</h1>
          <p className="text-gray-600">Gun log, LEADS reporting, knowledge base, and acknowledgments</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full gap-1">
          <TabsTrigger value="gun-log" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Gun Log
          </TabsTrigger>
          <TabsTrigger value="leads" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            LEADS
          </TabsTrigger>
          <TabsTrigger value="dl-scan" className="text-xs">
            <CreditCard className="w-3 h-3 mr-1" />
            DL Scan
          </TabsTrigger>
          <TabsTrigger value="labels" className="text-xs">
            <Barcode className="w-3 h-3 mr-1" />
            Labels
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="text-xs">
            <BookOpen className="w-3 h-3 mr-1" />
            Knowledge
          </TabsTrigger>
          <TabsTrigger value="acknowledgments" className="text-xs">
            <FileSignature className="w-3 h-3 mr-1" />
            Forms
          </TabsTrigger>
        </TabsList>

        {/* ============ ELECTRONIC GUN LOG TAB ============ */}
        <TabsContent value="gun-log" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Electronic Gun Log (A&D Book)</CardTitle>
                  <CardDescription>ATF Acquisition & Disposition Record</CardDescription>
                </div>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => { resetGunLogForm(); setIsGunLogDialogOpen(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gunLogEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No gun log entries. ATF requires records of all firearm transactions.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Firearm</TableHead>
                      <TableHead>Serial #</TableHead>
                      <TableHead>From/To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gunLogEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.entry_number}</TableCell>
                        <TableCell>{entry.transaction_date}</TableCell>
                        <TableCell>
                          <Badge className={entry.transaction_type === 'acquisition' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {entry.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entry.manufacturer} {entry.model}
                          <span className="text-xs text-gray-500 block">{entry.caliber_gauge}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{entry.serial_number}</TableCell>
                        <TableCell>
                          {entry.transaction_type === 'acquisition' 
                            ? entry.acquired_from_name 
                            : entry.disposed_to_name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ LEADS AUTOMATION TAB ============ */}
        <TabsContent value="leads" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>LEADS Automation Settings</CardTitle>
                <CardDescription>Configure automatic LEADS report generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={leadsConfig.enabled}
                    onCheckedChange={(checked) => setLeadsConfig({ ...leadsConfig, enabled: checked })}
                  />
                  <Label className="font-semibold">Enable Automated Reporting</Label>
                </div>
                
                {leadsConfig.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Report Frequency</Label>
                        <select
                          value={leadsConfig.report_frequency}
                          onChange={(e) => setLeadsConfig({ ...leadsConfig, report_frequency: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Report Time</Label>
                        <Input
                          type="time"
                          value={leadsConfig.report_time}
                          onChange={(e) => setLeadsConfig({ ...leadsConfig, report_time: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Include Transactions</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={leadsConfig.include_pawns}
                            onCheckedChange={(checked) => setLeadsConfig({ ...leadsConfig, include_pawns: checked })}
                          />
                          <Label>Products</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={leadsConfig.include_buys}
                            onCheckedChange={(checked) => setLeadsConfig({ ...leadsConfig, include_buys: checked })}
                          />
                          <Label>Buys</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={leadsConfig.include_sales}
                            onCheckedChange={(checked) => setLeadsConfig({ ...leadsConfig, include_sales: checked })}
                          />
                          <Label>Sales</Label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <Button onClick={handleSaveLeadsConfig} className="bg-amber-600 hover:bg-amber-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>Manually generate LEADS report</CardDescription>
                  </div>
                  <Button 
                    onClick={handleAutoGenerateLEADS}
                    disabled={isLeadsGenerating}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isLeadsGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Generate Today
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Recent Reports</Label>
                  {leadsReports.length === 0 ? (
                    <p className="text-gray-500 text-sm">No reports generated yet</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {leadsReports.slice(0, 5).map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-mono text-sm">{report.report_number}</p>
                            <p className="text-xs text-gray-500">{report.transaction_count} transactions</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={report.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {report.status}
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => window.open(`${API}/pawn-compliance/leads/export/${report.id}?format=csv`, '_blank')}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ DL SCAN TAB ============ */}
        <TabsContent value="dl-scan" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Driver License Scanner</CardTitle>
                <CardDescription>Scan DL barcode to auto-populate customer info</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Scan or Paste DL Barcode Data</Label>
                  <Textarea
                    value={dlScanData}
                    onChange={(e) => setDlScanData(e.target.value)}
                    placeholder="Scan driver license barcode here..."
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
                <Button onClick={handleParseDL} disabled={!dlScanData.trim()}>
                  <Search className="w-4 h-4 mr-2" />
                  Parse DL Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parsed Information</CardTitle>
                <CardDescription>Review before creating customer</CardDescription>
              </CardHeader>
              <CardContent>
                {parsedDL ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Name:</span> {parsedDL.first_name} {parsedDL.last_name}</div>
                      <div><span className="text-gray-500">DL#:</span> {parsedDL.license_number}</div>
                      <div><span className="text-gray-500">DOB:</span> {parsedDL.date_of_birth}</div>
                      <div><span className="text-gray-500">State:</span> {parsedDL.state}</div>
                      <div className="col-span-2"><span className="text-gray-500">Address:</span> {parsedDL.address}, {parsedDL.city}, {parsedDL.state} {parsedDL.zip_code}</div>
                      <div><span className="text-gray-500">Expires:</span> {parsedDL.expiration_date}</div>
                      <div><span className="text-gray-500">Gender:</span> {parsedDL.gender}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateCustomerFromDL} className="bg-amber-600 hover:bg-amber-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Customer
                      </Button>
                      <Button variant="outline" onClick={() => { setParsedDL(null); setDlScanData(''); }}>
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Scan a driver license to see parsed data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ LABELS/BARCODES TAB ============ */}
        <TabsContent value="labels" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Price Label Generator</CardTitle>
                <CardDescription>Create thermal labels with barcodes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SKU / Item Code *</Label>
                    <Input
                      value={labelForm.sku}
                      onChange={(e) => setLabelForm({ ...labelForm, sku: e.target.value })}
                      placeholder="SKU-12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price *</Label>
                    <Input
                      type="number"
                      value={labelForm.price}
                      onChange={(e) => setLabelForm({ ...labelForm, price: e.target.value })}
                      placeholder="99.99"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={labelForm.description}
                      onChange={(e) => setLabelForm({ ...labelForm, description: e.target.value })}
                      placeholder="Product description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={labelForm.quantity}
                      onChange={(e) => setLabelForm({ ...labelForm, quantity: e.target.value })}
                      min="1"
                    />
                  </div>
                </div>
                <Button onClick={handleGenerateBarcode} disabled={!labelForm.sku} className="bg-amber-600 hover:bg-amber-700">
                  <Barcode className="w-4 h-4 mr-2" />
                  Generate Barcode
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Barcode Preview</CardTitle>
                <CardDescription>Ready to print</CardDescription>
              </CardHeader>
              <CardContent>
                {barcodePreview ? (
                  <div className="text-center space-y-4">
                    <div className="bg-white p-4 border rounded inline-block">
                      <img 
                        src={`data:image/png;base64,${barcodePreview.image_base64}`} 
                        alt="Barcode"
                        className="max-w-full"
                      />
                      <p className="text-lg font-bold mt-2">${parseFloat(labelForm.price || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{labelForm.description}</p>
                    </div>
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Label
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Barcode className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Generate a barcode to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ INTERNAL KNOWLEDGE BASE TAB ============ */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Internal Knowledge Base</CardTitle>
                  <CardDescription>Policies, procedures, and training materials for staff</CardDescription>
                </div>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => { resetArticleForm(); setIsArticleDialogOpen(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Article
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {knowledgeArticles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No articles yet. Add company policies, procedures, and training materials.</p>
                  <p className="text-sm mt-2">Tip: Consult a local business attorney to validate legal compliance.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Ack Required</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {knowledgeArticles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium">{article.title}</TableCell>
                        <TableCell className="capitalize">{article.category}</TableCell>
                        <TableCell>{article.version}</TableCell>
                        <TableCell className="capitalize">{article.access_level}</TableCell>
                        <TableCell>
                          {article.requires_acknowledgment ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditArticle(article)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ ACKNOWLEDGMENT FORMS TAB ============ */}
        <TabsContent value="acknowledgments" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Employee Acknowledgment Forms</CardTitle>
                    <CardDescription>Forms requiring employee signature upon receipt</CardDescription>
                  </div>
                  <Button 
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => { resetAckForm(); setIsAckFormDialogOpen(true); }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Form
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ackForms.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileSignature className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No acknowledgment forms. Create forms for policies, handbooks, etc.</p>
                    <p className="text-sm mt-2">Have every employee sign upon receipt.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Form Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Signed</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ackForms.map((form) => (
                        <TableRow key={form.id}>
                          <TableCell className="font-medium">{form.title}</TableCell>
                          <TableCell className="capitalize">{form.form_type}</TableCell>
                          <TableCell>
                            {form.is_required ? (
                              <Badge className="bg-red-100 text-red-800">Required</Badge>
                            ) : (
                              <Badge variant="outline">Optional</Badge>
                            )}
                          </TableCell>
                          <TableCell>{form.total_signed || 0}</TableCell>
                          <TableCell>
                            <Badge className={form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>
                              {form.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Report</CardTitle>
                <CardDescription>Acknowledgment status overview</CardDescription>
              </CardHeader>
              <CardContent>
                {ackReport ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <p className="text-3xl font-bold">{ackReport.total_employees}</p>
                      <p className="text-sm text-gray-500">Total Active Employees</p>
                    </div>
                    {ackReport.forms?.map((form) => (
                      <div key={form.form_id} className="p-3 border rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{form.form_title}</span>
                          <span className={`text-sm font-bold ${form.compliance_rate === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                            {form.compliance_rate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full ${form.compliance_rate === 100 ? 'bg-green-600' : 'bg-amber-600'}`}
                            style={{ width: `${form.compliance_rate}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {form.total_signed}/{form.total_employees} signed
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No compliance data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============ GUN LOG DIALOG ============ */}
      <Dialog open={isGunLogDialogOpen} onOpenChange={setIsGunLogDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Gun Log Entry (A&D Book)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveGunLog} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction Type *</Label>
                <select
                  value={gunLogForm.transaction_type}
                  onChange={(e) => setGunLogForm({ ...gunLogForm, transaction_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="acquisition">Acquisition (Received)</option>
                  <option value="disposition">Disposition (Sold/Transferred)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Transaction Date *</Label>
                <Input
                  type="date"
                  value={gunLogForm.transaction_date}
                  onChange={(e) => setGunLogForm({ ...gunLogForm, transaction_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Firearm Information</Label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Manufacturer *</Label>
                <Input
                  value={gunLogForm.manufacturer}
                  onChange={(e) => setGunLogForm({ ...gunLogForm, manufacturer: e.target.value })}
                  placeholder="Smith & Wesson"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input
                  value={gunLogForm.model}
                  onChange={(e) => setGunLogForm({ ...gunLogForm, model: e.target.value })}
                  placeholder="M&P Shield"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Serial Number *</Label>
                <Input
                  value={gunLogForm.serial_number}
                  onChange={(e) => setGunLogForm({ ...gunLogForm, serial_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Firearm Type *</Label>
                <select
                  value={gunLogForm.firearm_type}
                  onChange={(e) => setGunLogForm({ ...gunLogForm, firearm_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="handgun">Handgun</option>
                  <option value="rifle">Rifle</option>
                  <option value="shotgun">Shotgun</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Caliber/Gauge *</Label>
                <Input
                  value={gunLogForm.caliber_gauge}
                  onChange={(e) => setGunLogForm({ ...gunLogForm, caliber_gauge: e.target.value })}
                  placeholder="9mm, .45 ACP, 12ga"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Importer</Label>
                <Input
                  value={gunLogForm.importer}
                  onChange={(e) => setGunLogForm({ ...gunLogForm, importer: e.target.value })}
                />
              </div>
            </div>

            {gunLogForm.transaction_type === 'acquisition' ? (
              <>
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Acquired From</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={gunLogForm.acquired_from_name}
                      onChange={(e) => setGunLogForm({ ...gunLogForm, acquired_from_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>FFL# (if dealer)</Label>
                    <Input
                      value={gunLogForm.acquired_from_license}
                      onChange={(e) => setGunLogForm({ ...gunLogForm, acquired_from_license: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Address *</Label>
                    <Input
                      value={gunLogForm.acquired_from_address}
                      onChange={(e) => setGunLogForm({ ...gunLogForm, acquired_from_address: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold">Disposed To</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={gunLogForm.disposed_to_name}
                      onChange={(e) => setGunLogForm({ ...gunLogForm, disposed_to_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>DOB</Label>
                    <Input
                      type="date"
                      value={gunLogForm.disposed_to_dob}
                      onChange={(e) => setGunLogForm({ ...gunLogForm, disposed_to_dob: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Address *</Label>
                    <Input
                      value={gunLogForm.disposed_to_address}
                      onChange={(e) => setGunLogForm({ ...gunLogForm, disposed_to_address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NICS Transaction #</Label>
                    <Input
                      value={gunLogForm.nics_transaction_number}
                      onChange={(e) => setGunLogForm({ ...gunLogForm, nics_transaction_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Form 4473 #</Label>
                    <Input
                      value={gunLogForm.form_4473_number}
                      onChange={(e) => setGunLogForm({ ...gunLogForm, form_4473_number: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGunLogDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Save Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ KNOWLEDGE ARTICLE DIALOG ============ */}
      <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Edit Article' : 'Add Knowledge Base Article'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveArticle} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                placeholder="e.g., Employee Handbook, Safety Procedures"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <select
                  value={articleForm.category}
                  onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  {knowledgeCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Access Level</Label>
                <select
                  value={articleForm.access_level}
                  onChange={(e) => setArticleForm({ ...articleForm, access_level: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">All Employees</option>
                  <option value="admin">Admin Only</option>
                  <option value="super_admin">Super Admin Only</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Version</Label>
                <Input
                  value={articleForm.version}
                  onChange={(e) => setArticleForm({ ...articleForm, version: e.target.value })}
                  placeholder="1.0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content (HTML supported) *</Label>
              <Textarea
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                placeholder="<h2>Introduction</h2><p>This document outlines...</p>"
                rows={10}
                required
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={articleForm.requires_acknowledgment}
                  onCheckedChange={(checked) => setArticleForm({ ...articleForm, requires_acknowledgment: checked })}
                />
                <Label>Requires Employee Acknowledgment</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={articleForm.is_published}
                  onCheckedChange={(checked) => setArticleForm({ ...articleForm, is_published: checked })}
                />
                <Label>Published</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsArticleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Save Article</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ ACKNOWLEDGMENT FORM DIALOG ============ */}
      <Dialog open={isAckFormDialogOpen} onOpenChange={setIsAckFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAckForm ? 'Edit Acknowledgment Form' : 'Create Acknowledgment Form'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAckForm} className="space-y-4">
            <div className="space-y-2">
              <Label>Form Title *</Label>
              <Input
                value={ackFormData.title}
                onChange={(e) => setAckFormData({ ...ackFormData, title: e.target.value })}
                placeholder="e.g., Employee Handbook Acknowledgment"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Form Type *</Label>
                <select
                  value={ackFormData.form_type}
                  onChange={(e) => setAckFormData({ ...ackFormData, form_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  {formTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Expires After (Days)</Label>
                <Input
                  type="number"
                  value={ackFormData.expires_after_days || ''}
                  onChange={(e) => setAckFormData({ ...ackFormData, expires_after_days: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Leave empty for no expiration"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={ackFormData.description}
                onChange={(e) => setAckFormData({ ...ackFormData, description: e.target.value })}
                placeholder="Brief description of what this form covers"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Content to Acknowledge *</Label>
              <Textarea
                value={ackFormData.content}
                onChange={(e) => setAckFormData({ ...ackFormData, content: e.target.value })}
                placeholder="I acknowledge that I have received, read, and understand the Employee Handbook..."
                rows={6}
                required
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={ackFormData.is_required}
                  onCheckedChange={(checked) => setAckFormData({ ...ackFormData, is_required: checked })}
                />
                <Label>Required for All Employees</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={ackFormData.requires_signature}
                  onCheckedChange={(checked) => setAckFormData({ ...ackFormData, requires_signature: checked })}
                />
                <Label>Requires Signature</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={ackFormData.is_active}
                  onCheckedChange={(checked) => setAckFormData({ ...ackFormData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAckFormDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Save Form</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPeptidesCompliance;
