import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Globe, Send, Download, RefreshCw, Check, X, AlertCircle, 
  FileText, ExternalLink, Clock, MapPin, ShoppingBag, BookOpen,
  Layers, Loader2, CheckCircle2, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const LIVE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : BACKEND_URL;
const SITEMAP_URL = `${LIVE_ORIGIN}/sitemap.xml`;

const DevSitemapGenerator = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [submissionResults, setSubmissionResults] = useState(null);
  const [searchEngines, setSearchEngines] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchSearchEngines();
    fetchSubmissionHistory();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/sitemap-generator/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    setLoading(false);
  };

  const fetchSearchEngines = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/sitemap-generator/search-engines`);
      setSearchEngines(response.data.engines || []);
    } catch (error) {
      console.error('Failed to fetch search engines:', error);
    }
  };

  const fetchSubmissionHistory = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/sitemap-generator/submission-history`);
      if (response.data.submission_results) {
        setSubmissionResults(response.data.submission_results);
      }
    } catch (error) {
      console.error('Failed to fetch submission history:', error);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/sitemap-generator/generate`);
      setGeneratedData(response.data);
      toast({
        title: 'Sitemap Generated',
        description: `Generated ${response.data.total_urls} URLs successfully.`,
      });
      fetchStats();
    } catch (error) {
      console.error('Failed to generate sitemap:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate sitemap. Please try again.',
        variant: 'destructive'
      });
    }
    setGenerating(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/sitemap-generator/submit`);
      setSubmissionResults(response.data.results);
      
      const successful = response.data.results.filter(r => r.success).length;
      const total = response.data.results.length;
      
      toast({
        title: response.data.success ? 'Submission Complete' : 'Partial Submission',
        description: `Submitted to ${successful}/${total} search engines.`,
        variant: response.data.success ? 'default' : 'destructive'
      });
      fetchStats();
    } catch (error) {
      console.error('Failed to submit sitemap:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit sitemap to search engines.',
        variant: 'destructive'
      });
    }
    setSubmitting(false);
  };

  const handleDownload = () => {
    window.open(`${BACKEND_URL}/api/sitemap-generator/download`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="sitemap-generator-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Globe className="w-8 h-8 text-purple-600" />
          Sitemap Generator & Search Engine Submission
        </h1>
        <p className="text-gray-500 mt-1">
          Generate comprehensive sitemaps and submit to major search engines
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.static_pages || 0}</p>
                <p className="text-xs text-gray-500">Static Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.products || 0}</p>
                <p className="text-xs text-gray-500">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.categories || 0}</p>
                <p className="text-xs text-gray-500">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.research_articles || 0}</p>
                <p className="text-xs text-gray-500">Research</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.location_pages || 0}</p>
                <p className="text-xs text-gray-500">Locations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-700">{stats?.total_urls || 0}</p>
                <p className="text-xs text-purple-600">Total URLs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              Generate Sitemap
            </CardTitle>
            <CardDescription>
              Create a comprehensive sitemap with all your pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="generate-sitemap-btn"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Generate Sitemap
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDownload}
                data-testid="download-sitemap-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Download XML
              </Button>
            </div>
            
            {stats?.last_generated && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Last generated: {new Date(stats.last_generated).toLocaleString()}
              </p>
            )}
            
            {generatedData && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="font-semibold text-green-800 mb-2">
                  ✓ Generated {generatedData.total_urls} URLs
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                  <span>Static: {generatedData.breakdown?.static || 0}</span>
                  <span>Products: {generatedData.breakdown?.products || 0}</span>
                  <span>Categories: {generatedData.breakdown?.categories || 0}</span>
                  <span>Research: {generatedData.breakdown?.research || 0}</span>
                  <span>Locations: {generatedData.breakdown?.locations || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600" />
              Submit to Search Engines
            </CardTitle>
            <CardDescription>
              One-click submission to all major US search engines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700 w-full"
              size="lg"
              data-testid="submit-sitemap-btn"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              Submit to All Search Engines
            </Button>
            
            {stats?.last_submitted && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Last submitted: {new Date(stats.last_submitted).toLocaleString()}
              </p>
            )}
            
            {/* Search Engines List */}
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium text-gray-700">Target Search Engines:</p>
              <div className="flex flex-wrap gap-2">
                {searchEngines.map(engine => (
                  <a
                    key={engine.id}
                    href={engine.webmaster_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {engine.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submission Results */}
      {submissionResults && submissionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Submission Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissionResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.engine}
                      </p>
                      <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'Submitted' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sitemap URL Info */}
      <Card className="bg-gray-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Your Sitemap URL:</p>
              <code className="text-sm text-purple-600 bg-white px-2 py-1 rounded border mt-1 inline-block">
                {SITEMAP_URL}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(SITEMAP_URL, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Live
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevSitemapGenerator;
