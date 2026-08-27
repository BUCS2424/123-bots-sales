import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Briefcase, Plus, Edit, Trash2, Search, Save, X,
  Loader2, Eye, EyeOff, FileText, HelpCircle, BookOpen,
  Star, Globe, ChevronDown, ChevronUp, Settings, Upload
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminHRPortal = ({ initialTab = 'jobs' }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Job Postings State
  const [jobPostings, setJobPostings] = useState([]);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '', department: 'general', location: 'Dothan, AL',
    employment_type: 'full_time', description: '',
    requirements: [], benefits: [],
    pay_range_min: '', pay_range_max: '', pay_type: 'hourly',
    is_active: true, featured: false
  });
  
  // FAQs State
  const [faqs, setFaqs] = useState([]);
  const [isFAQDialogOpen, setIsFAQDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [faqForm, setFaqForm] = useState({
    question: '', answer: '', category: 'general', order: 0, is_active: true
  });
  
  // Knowledge Base State
  const [articles, setArticles] = useState([]);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({
    title: '', content: '', category: 'general', tags: [], order: 0, is_published: true
  });
  
  // Employee Manual State
  const [manuals, setManuals] = useState([]);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [editingManual, setEditingManual] = useState(null);
  const [manualForm, setManualForm] = useState({
    title: 'Employee Manual', version: '1.0', effective_date: '',
    content: '', pdf_url: '', is_current: true
  });
  
  // Portal Settings State
  const [portalSettings, setPortalSettings] = useState({
    welcome_title: '', welcome_subtitle: '', welcome_description: '',
    hero_image_url: '', company_culture_text: '', benefits_intro: '',
    application_instructions: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Temp state for array inputs
  const [tempRequirement, setTempRequirement] = useState('');
  const [tempBenefit, setTempBenefit] = useState('');
  const [tempTag, setTempTag] = useState('');

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsRes, faqsRes, articlesRes, manualsRes, settingsRes] = await Promise.all([
        axios.get(`${API}/hr/portal/jobs?active_only=false`).catch(() => ({ data: [] })),
        axios.get(`${API}/hr/faqs`).catch(() => ({ data: [] })),
        axios.get(`${API}/hr/knowledge`).catch(() => ({ data: [] })),
        axios.get(`${API}/hr/manuals`).catch(() => ({ data: [] })),
        axios.get(`${API}/hr/portal/settings`).catch(() => ({ data: {} }))
      ]);
      
      setJobPostings(jobsRes.data || []);
      setFaqs(faqsRes.data || []);
      setArticles(articlesRes.data || []);
      setManuals(manualsRes.data || []);
      setPortalSettings(settingsRes.data || {});
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============ JOB POSTINGS HANDLERS ============
  
  const handleSaveJob = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...jobForm,
        pay_range_min: jobForm.pay_range_min ? parseFloat(jobForm.pay_range_min) : null,
        pay_range_max: jobForm.pay_range_max ? parseFloat(jobForm.pay_range_max) : null,
      };
      
      if (editingJob) {
        await axios.put(`${API}/hr/jobs/${editingJob.id}`, payload);
        toast({ title: 'Success', description: 'Job posting updated' });
      } else {
        await axios.post(`${API}/hr/jobs`, payload);
        toast({ title: 'Success', description: 'Job posting created' });
      }
      setIsJobDialogOpen(false);
      fetchData();
      resetJobForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save job posting', variant: 'destructive' });
    }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await axios.delete(`${API}/hr/jobs/${id}`);
      toast({ title: 'Success', description: 'Job posting deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete job posting', variant: 'destructive' });
    }
  };

  const resetJobForm = () => {
    setJobForm({
      title: '', department: 'general', location: 'Dothan, AL',
      employment_type: 'full_time', description: '',
      requirements: [], benefits: [],
      pay_range_min: '', pay_range_max: '', pay_type: 'hourly',
      is_active: true, featured: false
    });
    setEditingJob(null);
    setTempRequirement('');
    setTempBenefit('');
  };

  const openEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      description: job.description,
      requirements: job.requirements || [],
      benefits: job.benefits || [],
      pay_range_min: job.pay_range_min || '',
      pay_range_max: job.pay_range_max || '',
      pay_type: job.pay_type,
      is_active: job.is_active,
      featured: job.featured
    });
    setIsJobDialogOpen(true);
  };

  const addRequirement = () => {
    if (tempRequirement.trim()) {
      setJobForm({ ...jobForm, requirements: [...jobForm.requirements, tempRequirement.trim()] });
      setTempRequirement('');
    }
  };

  const removeRequirement = (index) => {
    setJobForm({ ...jobForm, requirements: jobForm.requirements.filter((_, i) => i !== index) });
  };

  const addBenefit = () => {
    if (tempBenefit.trim()) {
      setJobForm({ ...jobForm, benefits: [...jobForm.benefits, tempBenefit.trim()] });
      setTempBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setJobForm({ ...jobForm, benefits: jobForm.benefits.filter((_, i) => i !== index) });
  };

  // ============ FAQ HANDLERS ============

  const handleSaveFAQ = async (e) => {
    e.preventDefault();
    try {
      if (editingFAQ) {
        await axios.put(`${API}/hr/faqs/${editingFAQ.id}`, faqForm);
        toast({ title: 'Success', description: 'FAQ updated' });
      } else {
        await axios.post(`${API}/hr/faqs`, faqForm);
        toast({ title: 'Success', description: 'FAQ created' });
      }
      setIsFAQDialogOpen(false);
      fetchData();
      resetFAQForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save FAQ', variant: 'destructive' });
    }
  };

  const handleDeleteFAQ = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await axios.delete(`${API}/hr/faqs/${id}`);
      toast({ title: 'Success', description: 'FAQ deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete FAQ', variant: 'destructive' });
    }
  };

  const resetFAQForm = () => {
    setFaqForm({ question: '', answer: '', category: 'general', order: 0, is_active: true });
    setEditingFAQ(null);
  };

  const openEditFAQ = (faq) => {
    setEditingFAQ(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      is_active: faq.is_active
    });
    setIsFAQDialogOpen(true);
  };

  // ============ KNOWLEDGE BASE HANDLERS ============

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    try {
      if (editingArticle) {
        await axios.put(`${API}/hr/knowledge/${editingArticle.id}`, articleForm);
        toast({ title: 'Success', description: 'Article updated' });
      } else {
        await axios.post(`${API}/hr/knowledge`, articleForm);
        toast({ title: 'Success', description: 'Article created' });
      }
      setIsArticleDialogOpen(false);
      fetchData();
      resetArticleForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save article', variant: 'destructive' });
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await axios.delete(`${API}/hr/knowledge/${id}`);
      toast({ title: 'Success', description: 'Article deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete article', variant: 'destructive' });
    }
  };

  const resetArticleForm = () => {
    setArticleForm({
      title: '', content: '', category: 'general', tags: [], order: 0, is_published: true
    });
    setEditingArticle(null);
    setTempTag('');
  };

  const openEditArticle = (article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      order: article.order,
      is_published: article.is_published
    });
    setIsArticleDialogOpen(true);
  };

  const addTag = () => {
    if (tempTag.trim() && !articleForm.tags.includes(tempTag.trim())) {
      setArticleForm({ ...articleForm, tags: [...articleForm.tags, tempTag.trim()] });
      setTempTag('');
    }
  };

  const removeTag = (index) => {
    setArticleForm({ ...articleForm, tags: articleForm.tags.filter((_, i) => i !== index) });
  };

  // ============ EMPLOYEE MANUAL HANDLERS ============

  const handleSaveManual = async (e) => {
    e.preventDefault();
    try {
      if (editingManual) {
        await axios.put(`${API}/hr/manuals/${editingManual.id}`, manualForm);
        toast({ title: 'Success', description: 'Manual updated' });
      } else {
        await axios.post(`${API}/hr/manuals`, manualForm);
        toast({ title: 'Success', description: 'Manual created' });
      }
      setIsManualDialogOpen(false);
      fetchData();
      resetManualForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save manual', variant: 'destructive' });
    }
  };

  const handleDeleteManual = async (id) => {
    if (!confirm('Are you sure you want to delete this manual version?')) return;
    try {
      await axios.delete(`${API}/hr/manuals/${id}`);
      toast({ title: 'Success', description: 'Manual deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete manual', variant: 'destructive' });
    }
  };

  const resetManualForm = () => {
    setManualForm({
      title: 'Employee Manual', version: '1.0', effective_date: '',
      content: '', pdf_url: '', is_current: true
    });
    setEditingManual(null);
  };

  const openEditManual = (manual) => {
    setEditingManual(manual);
    setManualForm({
      title: manual.title,
      version: manual.version,
      effective_date: manual.effective_date,
      content: manual.content,
      pdf_url: manual.pdf_url || '',
      is_current: manual.is_current
    });
    setIsManualDialogOpen(true);
  };

  // ============ PORTAL SETTINGS HANDLERS ============

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await axios.put(`${API}/hr/portal-settings`, portalSettings);
      toast({ title: 'Success', description: 'Portal settings saved' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const departmentOptions = [
    { value: 'pawn', label: 'Products' },
    { value: 'storage', label: 'Storage' },
    { value: 'rv', label: 'RV Center' },
    { value: 'general', label: 'General' }
  ];

  const faqCategories = [
    { value: 'general', label: 'General' },
    { value: 'benefits', label: 'Benefits' },
    { value: 'policies', label: 'Policies' },
    { value: 'application', label: 'Application Process' },
    { value: 'culture', label: 'Company Culture' }
  ];

  const articleCategories = [
    { value: 'general', label: 'General Information' },
    { value: 'policies', label: 'Policies' },
    { value: 'procedures', label: 'Procedures' },
    { value: 'safety', label: 'Safety' },
    { value: 'benefits', label: 'Benefits' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Portal Management</h1>
          <p className="text-gray-600">Manage the public employment portal content</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => window.open('/employment', '_blank')}
          data-testid="preview-portal-btn"
        >
          <Globe className="w-4 h-4 mr-2" />
          Preview Portal
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full max-w-3xl h-auto">
          <TabsTrigger value="jobs" data-testid="tab-jobs">
            <Briefcase className="w-4 h-4 mr-2" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="faqs" data-testid="tab-faqs">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="knowledge" data-testid="tab-knowledge">
            <BookOpen className="w-4 h-4 mr-2" />
            Knowledge
          </TabsTrigger>
          <TabsTrigger value="manual" data-testid="tab-manual">
            <FileText className="w-4 h-4 mr-2" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ============ JOB POSTINGS TAB ============ */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Job Postings</CardTitle>
                  <CardDescription>Manage open positions on the employment portal</CardDescription>
                </div>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => { resetJobForm(); setIsJobDialogOpen(true); }}
                  data-testid="add-job-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Job Posting
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {jobPostings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Job Postings</h3>
                  <p>Create your first job posting to attract candidates.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobPostings.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {job.featured && <Star className="w-4 h-4 text-amber-500" />}
                            <span className="font-medium">{job.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{job.department}</TableCell>
                        <TableCell className="capitalize">{job.employment_type.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge className={job.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {job.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditJob(job)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteJob(job.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
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

        {/* ============ FAQS TAB ============ */}
        <TabsContent value="faqs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Employer FAQs</CardTitle>
                  <CardDescription>Frequently asked questions for job seekers</CardDescription>
                </div>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => { resetFAQForm(); setIsFAQDialogOpen(true); }}
                  data-testid="add-faq-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {faqs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <HelpCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No FAQs</h3>
                  <p>Add FAQs to help job seekers find answers.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faqs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell className="max-w-md truncate">{faq.question}</TableCell>
                        <TableCell className="capitalize">{faq.category}</TableCell>
                        <TableCell>{faq.order}</TableCell>
                        <TableCell>
                          <Badge className={faq.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {faq.is_active ? 'Active' : 'Hidden'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditFAQ(faq)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteFAQ(faq.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
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

        {/* ============ KNOWLEDGE BASE TAB ============ */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Knowledge Base</CardTitle>
                  <CardDescription>Employee resources and documentation</CardDescription>
                </div>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => { resetArticleForm(); setIsArticleDialogOpen(true); }}
                  data-testid="add-article-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Article
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {articles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Articles</h3>
                  <p>Add knowledge base articles for employees.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium">{article.title}</TableCell>
                        <TableCell className="capitalize">{article.category}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {article.tags?.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                            {article.tags?.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{article.tags.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={article.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {article.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditArticle(article)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteArticle(article.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
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

        {/* ============ EMPLOYEE MANUAL TAB ============ */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Employee Manual</CardTitle>
                  <CardDescription>Manage employee manual versions</CardDescription>
                </div>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => { resetManualForm(); setIsManualDialogOpen(true); }}
                  data-testid="add-manual-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {manuals.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Employee Manual</h3>
                  <p>Create an employee manual to share with your team.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manuals.map((manual) => (
                      <TableRow key={manual.id}>
                        <TableCell className="font-medium">{manual.title}</TableCell>
                        <TableCell>{manual.version}</TableCell>
                        <TableCell>{manual.effective_date}</TableCell>
                        <TableCell>
                          <Badge className={manual.is_current ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                            {manual.is_current ? 'Current' : 'Archived'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditManual(manual)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteManual(manual.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
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

        {/* ============ SETTINGS TAB ============ */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portal Settings</CardTitle>
              <CardDescription>Customize the public employment portal appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Welcome Title</Label>
                  <Input
                    value={portalSettings.welcome_title || ''}
                    onChange={(e) => setPortalSettings({ ...portalSettings, welcome_title: e.target.value })}
                    placeholder="Join Our Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Welcome Subtitle</Label>
                  <Input
                    value={portalSettings.welcome_subtitle || ''}
                    onChange={(e) => setPortalSettings({ ...portalSettings, welcome_subtitle: e.target.value })}
                    placeholder="Build your career with us"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Welcome Description</Label>
                  <Textarea
                    value={portalSettings.welcome_description || ''}
                    onChange={(e) => setPortalSettings({ ...portalSettings, welcome_description: e.target.value })}
                    placeholder="We're always looking for talented individuals..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Image URL</Label>
                  <Input
                    value={portalSettings.hero_image_url || ''}
                    onChange={(e) => setPortalSettings({ ...portalSettings, hero_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Culture Text</Label>
                  <Textarea
                    value={portalSettings.company_culture_text || ''}
                    onChange={(e) => setPortalSettings({ ...portalSettings, company_culture_text: e.target.value })}
                    placeholder="Describe your company culture..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Benefits Introduction</Label>
                  <Textarea
                    value={portalSettings.benefits_intro || ''}
                    onChange={(e) => setPortalSettings({ ...portalSettings, benefits_intro: e.target.value })}
                    placeholder="At our company, we believe in taking care of our team..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Application Instructions</Label>
                  <Textarea
                    value={portalSettings.application_instructions || ''}
                    onChange={(e) => setPortalSettings({ ...portalSettings, application_instructions: e.target.value })}
                    placeholder="Instructions for applicants..."
                    rows={3}
                  />
                </div>
              </div>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============ JOB POSTING DIALOG ============ */}
      <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Edit Job Posting' : 'Add Job Posting'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveJob} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="Sales Associate"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <select
                  value={jobForm.department}
                  onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  {departmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  placeholder="Dothan, AL"
                />
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <select
                  value={jobForm.employment_type}
                  onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                placeholder="Job description..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min Pay</Label>
                <Input
                  type="number"
                  value={jobForm.pay_range_min}
                  onChange={(e) => setJobForm({ ...jobForm, pay_range_min: e.target.value })}
                  placeholder="15.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Pay</Label>
                <Input
                  type="number"
                  value={jobForm.pay_range_max}
                  onChange={(e) => setJobForm({ ...jobForm, pay_range_max: e.target.value })}
                  placeholder="20.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Pay Type</Label>
                <select
                  value={jobForm.pay_type}
                  onChange={(e) => setJobForm({ ...jobForm, pay_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="hourly">Hourly</option>
                  <option value="salary">Salary</option>
                </select>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label>Requirements</Label>
              <div className="flex gap-2">
                <Input
                  value={tempRequirement}
                  onChange={(e) => setTempRequirement(e.target.value)}
                  placeholder="Add a requirement"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <Button type="button" onClick={addRequirement} variant="outline">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {jobForm.requirements.map((req, idx) => (
                  <Badge key={idx} variant="secondary" className="px-2 py-1">
                    {req}
                    <button type="button" onClick={() => removeRequirement(idx)} className="ml-2 text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <Label>Benefits</Label>
              <div className="flex gap-2">
                <Input
                  value={tempBenefit}
                  onChange={(e) => setTempBenefit(e.target.value)}
                  placeholder="Add a benefit"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" onClick={addBenefit} variant="outline">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {jobForm.benefits.map((ben, idx) => (
                  <Badge key={idx} variant="secondary" className="px-2 py-1">
                    {ben}
                    <button type="button" onClick={() => removeBenefit(idx)} className="ml-2 text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={jobForm.is_active}
                  onCheckedChange={(checked) => setJobForm({ ...jobForm, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={jobForm.featured}
                  onCheckedChange={(checked) => setJobForm({ ...jobForm, featured: checked })}
                />
                <Label>Featured</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsJobDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ FAQ DIALOG ============ */}
      <Dialog open={isFAQDialogOpen} onOpenChange={setIsFAQDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFAQ ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveFAQ} className="space-y-4">
            <div className="space-y-2">
              <Label>Question *</Label>
              <Input
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                placeholder="What are the working hours?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Answer *</Label>
              <Textarea
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                placeholder="Our standard hours are..."
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {faqCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={faqForm.order}
                  onChange={(e) => setFaqForm({ ...faqForm, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={faqForm.is_active}
                onCheckedChange={(checked) => setFaqForm({ ...faqForm, is_active: checked })}
              />
              <Label>Active (visible on portal)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFAQDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ ARTICLE DIALOG ============ */}
      <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Edit Article' : 'Add Article'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveArticle} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                placeholder="Article title"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={articleForm.category}
                  onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {articleCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={articleForm.order}
                  onChange={(e) => setArticleForm({ ...articleForm, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content (HTML supported) *</Label>
              <Textarea
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                placeholder="<p>Article content...</p>"
                rows={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tempTag}
                  onChange={(e) => setTempTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {articleForm.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="px-2 py-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(idx)} className="ml-2 text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={articleForm.is_published}
                onCheckedChange={(checked) => setArticleForm({ ...articleForm, is_published: checked })}
              />
              <Label>Published</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsArticleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ MANUAL DIALOG ============ */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingManual ? 'Edit Manual' : 'New Manual Version'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveManual} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={manualForm.title}
                  onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                  placeholder="Employee Manual"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Version *</Label>
                <Input
                  value={manualForm.version}
                  onChange={(e) => setManualForm({ ...manualForm, version: e.target.value })}
                  placeholder="1.0"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective Date *</Label>
                <Input
                  type="date"
                  value={manualForm.effective_date}
                  onChange={(e) => setManualForm({ ...manualForm, effective_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>PDF URL (optional)</Label>
                <Input
                  value={manualForm.pdf_url}
                  onChange={(e) => setManualForm({ ...manualForm, pdf_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content (HTML) *</Label>
              <Textarea
                value={manualForm.content}
                onChange={(e) => setManualForm({ ...manualForm, content: e.target.value })}
                placeholder="<h2>Welcome</h2><p>This manual outlines...</p>"
                rows={12}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={manualForm.is_current}
                onCheckedChange={(checked) => setManualForm({ ...manualForm, is_current: checked })}
              />
              <Label>Set as current version</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsManualDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHRPortal;
