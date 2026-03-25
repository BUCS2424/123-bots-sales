import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase, Users, Building2, MapPin, Clock, DollarSign, 
  ChevronRight, Search, FileText, HelpCircle, BookOpen,
  Download, Printer, ChevronDown, ChevronUp, Star, Mail,
  Phone, ArrowRight, CheckCircle, Award, Heart, Shield,
  Calendar, Coffee, Laptop, Home as HomeIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { useSiteSettings } from '../context/SiteSettingsContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmploymentPage = () => {
  const navigate = useNavigate();
  const { logoUrl, siteName } = useSiteSettings();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'jobs';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  
  // Data states
  const [portalSettings, setPortalSettings] = useState(null);
  const [jobPostings, setJobPostings] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [knowledgeArticles, setKnowledgeArticles] = useState([]);
  const [employeeManual, setEmployeeManual] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Refs for printing
  const manualRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, jobsRes, faqsRes, knowledgeRes, manualRes] = await Promise.all([
        axios.get(`${API}/hr/portal/settings`).catch(() => ({ data: null })),
        axios.get(`${API}/hr/portal/jobs`).catch(() => ({ data: [] })),
        axios.get(`${API}/hr/portal/faqs`).catch(() => ({ data: [] })),
        axios.get(`${API}/hr/portal/knowledge`).catch(() => ({ data: [] })),
        axios.get(`${API}/hr/portal/manual`).catch(() => ({ data: null }))
      ]);
      
      setPortalSettings(settingsRes.data);
      setJobPostings(jobsRes.data || []);
      setFaqs(faqsRes.data || []);
      setKnowledgeArticles(knowledgeRes.data || []);
      setEmployeeManual(manualRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobPostings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === 'all' || job.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  const groupedArticles = knowledgeArticles.reduce((acc, article) => {
    if (!acc[article.category]) acc[article.category] = [];
    acc[article.category].push(article);
    return acc;
  }, {});

  const handlePrintManual = () => {
    if (employeeManual?.pdf_url) {
      window.open(employeeManual.pdf_url, '_blank');
    } else if (manualRef.current) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Employee Manual - 123Bots</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #1e3a5f; border-bottom: 2px solid #c41e3a; padding-bottom: 10px; }
              h2 { color: #1e3a5f; margin-top: 30px; }
              p { line-height: 1.6; }
              .header { text-align: center; margin-bottom: 40px; }
              .version { color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>123Bots</h1>
              <h2>Employee Manual</h2>
              <p class="version">Version ${employeeManual?.version || '1.0'} - Effective ${employeeManual?.effective_date || 'N/A'}</p>
            </div>
            ${employeeManual?.content || '<p>No manual content available.</p>'}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const departmentColors = {
    pawn: 'bg-amber-100 text-amber-800',
    storage: 'bg-red-100 text-red-800',
    rv: 'bg-blue-100 text-blue-800',
    general: 'bg-gray-100 text-gray-800'
  };

  const departmentNames = {
    pawn: 'Products',
    storage: 'Storage',
    rv: 'RV Center',
    general: 'General'
  };

  const benefits = [
    { icon: Heart, title: 'Health Benefits', description: 'Medical, dental, and vision coverage options' },
    { icon: Calendar, title: 'Paid Time Off', description: 'Vacation, sick leave, and personal days' },
    { icon: DollarSign, title: 'Competitive Pay', description: 'Competitive wages with regular reviews' },
    { icon: Award, title: 'Growth Opportunities', description: 'Career advancement and training programs' },
    { icon: Shield, title: 'Job Security', description: 'Stable employment with a growing company' },
    { icon: Coffee, title: 'Great Culture', description: 'Supportive team environment' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e3a5f] to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div 
        className="relative bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8f] to-[#1e3a5f] text-white"
        style={{
          backgroundImage: portalSettings?.hero_image_url ? `url(${portalSettings.hero_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f]/90 via-[#2d5a8f]/85 to-[#1e3a5f]/90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          {/* Back to Home */}
          <Link 
            to="/" 
            className="inline-flex items-center text-white/70 hover:text-white mb-8 transition-colors"
            data-testid="back-to-home"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logoUrl || '/images/gingerkare-logo.png'}
                alt={siteName || '123Bots'}
                className="h-12"
                data-testid="employment-hero-logo"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="employment-hero-title">
              {portalSettings?.welcome_title || 'Join Our Team'}
            </h1>
            <p className="text-xl text-white/90 mb-6">
              {portalSettings?.welcome_subtitle || 'Build your career with 123Bots'}
            </p>
            <p className="text-white/70 mb-8 max-w-2xl">
              {portalSettings?.welcome_description || 
                "We're always looking for talented individuals to join our growing team. Explore opportunities across our product catalog, storage facility, and RV repair center."}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-[#c41e3a] hover:bg-[#a01830] text-white"
                onClick={() => setActiveTab('jobs')}
                data-testid="view-jobs-btn"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                View Open Positions
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate('/careers')}
                data-testid="apply-now-btn"
              >
                Apply Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-[#1e3a5f]">{jobPostings.length}</div>
              <div className="text-sm text-gray-600">Open Positions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1e3a5f]">3</div>
              <div className="text-sm text-gray-600">Business Areas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1e3a5f]">20+</div>
              <div className="text-sm text-gray-600">Years in Business</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1e3a5f]">Dothan</div>
              <div className="text-sm text-gray-600">Alabama Location</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="jobs" 
              className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white bg-white border shadow-sm"
              data-testid="tab-jobs"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Job Board
            </TabsTrigger>
            <TabsTrigger 
              value="benefits" 
              className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white bg-white border shadow-sm"
              data-testid="tab-benefits"
            >
              <Heart className="w-4 h-4 mr-2" />
              Benefits
            </TabsTrigger>
            <TabsTrigger 
              value="faqs" 
              className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white bg-white border shadow-sm"
              data-testid="tab-faqs"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQs
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge" 
              className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white bg-white border shadow-sm"
              data-testid="tab-knowledge"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger 
              value="manual" 
              className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white bg-white border shadow-sm"
              data-testid="tab-manual"
            >
              <FileText className="w-4 h-4 mr-2" />
              Employee Manual
            </TabsTrigger>
          </TabsList>

          {/* Job Board Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search positions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="job-search-input"
                    />
                  </div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-4 py-2 border rounded-md bg-white"
                    data-testid="department-filter"
                  >
                    <option value="all">All Departments</option>
                    <option value="pawn">Products</option>
                    <option value="storage">Storage</option>
                    <option value="rv">RV Center</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Job Listings */}
            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No positions found</h3>
                  <p className="text-gray-600 mb-4">
                    {jobPostings.length === 0 
                      ? "Check back soon for new opportunities!"
                      : "Try adjusting your search or filters"}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/careers')}>
                    Submit General Application
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map((job) => (
                  <Card 
                    key={job.id} 
                    className={`hover:shadow-lg transition-shadow cursor-pointer ${
                      selectedJob?.id === job.id ? 'ring-2 ring-[#1e3a5f]' : ''
                    }`}
                    onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                    data-testid={`job-card-${job.id}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {job.featured && (
                              <Badge className="bg-amber-100 text-amber-800">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            <Badge className={departmentColors[job.department]}>
                              {departmentNames[job.department]}
                            </Badge>
                            <Badge variant="outline">
                              {job.employment_type === 'full_time' ? 'Full-time' : 
                               job.employment_type === 'part_time' ? 'Part-time' :
                               job.employment_type === 'seasonal' ? 'Seasonal' : 'Contract'}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location}
                            </span>
                            {(job.pay_range_min || job.pay_range_max) && (
                              <span className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                {job.pay_range_min && job.pay_range_max 
                                  ? `$${job.pay_range_min} - $${job.pay_range_max}/${job.pay_type === 'hourly' ? 'hr' : 'yr'}`
                                  : job.pay_range_min 
                                    ? `From $${job.pay_range_min}/${job.pay_type === 'hourly' ? 'hr' : 'yr'}`
                                    : `Up to $${job.pay_range_max}/${job.pay_type === 'hourly' ? 'hr' : 'yr'}`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          className="bg-[#c41e3a] hover:bg-[#a01830]"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/careers', { state: { jobId: job.id, position: job.title } });
                          }}
                        >
                          Apply Now
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                      
                      {/* Expanded Details */}
                      {selectedJob?.id === job.id && (
                        <div className="mt-6 pt-6 border-t space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-600 whitespace-pre-line">{job.description}</p>
                          </div>
                          
                          {job.requirements?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                              <ul className="space-y-1">
                                {job.requirements.map((req, idx) => (
                                  <li key={idx} className="flex items-start text-gray-600">
                                    <CheckCircle className="w-4 h-4 mr-2 mt-1 text-green-600 flex-shrink-0" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {job.benefits?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                              <ul className="space-y-1">
                                {job.benefits.map((benefit, idx) => (
                                  <li key={idx} className="flex items-start text-gray-600">
                                    <Star className="w-4 h-4 mr-2 mt-1 text-amber-500 flex-shrink-0" />
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Benefits Tab */}
          <TabsContent value="benefits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Why Work With Us?</CardTitle>
                <CardDescription>
                  {portalSettings?.benefits_intro || 
                    "At 123Bots, we believe in taking care of our team members. Here's what you can expect when you join us."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50">
                      <div className="w-12 h-12 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Company Culture */}
            {portalSettings?.company_culture_text && (
              <Card>
                <CardHeader>
                  <CardTitle>Our Culture</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 whitespace-pre-line">{portalSettings.company_culture_text}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to common questions about employment at 123Bots
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(groupedFaqs).length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No FAQs available yet. Check back soon!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
                      <div key={category}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                          {category.replace('_', ' ')}
                        </h3>
                        <Accordion type="single" collapsible className="space-y-2">
                          {categoryFaqs.map((faq) => (
                            <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                              <AccordionTrigger className="text-left hover:no-underline">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-gray-600">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Employee Resources & Knowledge Base</CardTitle>
                <CardDescription>
                  Helpful information and resources for current and prospective employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(groupedArticles).length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No articles available yet. Check back soon!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(groupedArticles).map(([category, articles]) => (
                      <div key={category}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize flex items-center">
                          <BookOpen className="w-5 h-5 mr-2 text-[#1e3a5f]" />
                          {category.replace('_', ' ')}
                        </h3>
                        <div className="space-y-2">
                          {articles.map((article) => (
                            <Card 
                              key={article.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedArticle(selectedArticle?.id === article.id ? null : article)}
                            >
                              <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900">{article.title}</h4>
                                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                                    selectedArticle?.id === article.id ? 'rotate-90' : ''
                                  }`} />
                                </div>
                                {selectedArticle?.id === article.id && (
                                  <div className="mt-4 pt-4 border-t">
                                    <div 
                                      className="text-gray-600 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: article.content }}
                                    />
                                    {article.tags?.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-4">
                                        {article.tags.map((tag, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employee Manual Tab */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">Employee Manual</CardTitle>
                    <CardDescription>
                      {employeeManual 
                        ? `Version ${employeeManual.version} • Effective ${employeeManual.effective_date}`
                        : 'Company policies, procedures, and guidelines'}
                    </CardDescription>
                  </div>
                  {employeeManual && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handlePrintManual}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                      {employeeManual.pdf_url && (
                        <Button 
                          variant="outline"
                          onClick={() => window.open(employeeManual.pdf_url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!employeeManual ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Manual Available</h3>
                    <p className="text-gray-600">
                      The employee manual is currently being updated. Please check back soon.
                    </p>
                  </div>
                ) : (
                  <div ref={manualRef} className="prose prose-slate max-w-none">
                    <div 
                      className="bg-slate-50 rounded-lg p-6 md:p-8"
                      dangerouslySetInnerHTML={{ __html: employeeManual.content }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact CTA */}
      <div className="bg-[#1e3a5f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Our Team?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            {portalSettings?.application_instructions || 
              "We'd love to hear from you! Submit your application today and take the first step towards a rewarding career."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[#c41e3a] hover:bg-[#a01830]"
              onClick={() => navigate('/careers')}
            >
              <FileText className="w-5 h-5 mr-2" />
              Apply Online
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => navigate('/contact')}
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact HR
            </Button>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-white/70">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              7860 Eddins Road, Dothan, AL 36301
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              (334) 555-0123
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl || '/images/gingerkare-logo.png'}
                alt={siteName || '123Bots'}
                className="h-8"
                data-testid="employment-footer-logo"
              />
              <span className="text-sm text-gray-400">© {new Date().getFullYear()} All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/" className="text-gray-400 hover:text-white">Home</Link>
              <Link to="/careers" className="text-gray-400 hover:text-white">Apply</Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
              <Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmploymentPage;
