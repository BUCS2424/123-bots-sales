import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Building2,
  Check,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  MapPin,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from '../../hooks/use-toast';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DevLocationGenerator = () => {
  const { token } = useAuth();
  const [states, setStates] = useState([]);
  const [stats, setStats] = useState({ states: 0, counties: 0, cities: 0, generated_pages: 0 });
  const [generatedPages, setGeneratedPages] = useState([]);
  const [generating, setGenerating] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(null);
  const [stateData, setStateData] = useState(null);

  const requestHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statesRes, statsRes, pagesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/dev/us-states`, { headers: requestHeaders }),
        axios.get(`${BACKEND_URL}/api/dev/stats`, { headers: requestHeaders }),
        axios.get(`${BACKEND_URL}/api/dev/generated-pages-grouped`, { headers: requestHeaders }),
      ]);

      setStates(statesRes.data || []);
      setStats(statsRes.data || {});
      setGeneratedPages(pagesRes.data?.states || []);
    } catch (error) {
      toast({ title: 'Load failed', description: 'Unable to load location data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const getGeneratedCount = (stateSlug) => {
    const found = generatedPages.find((item) => item.slug === stateSlug);
    return found ? found.total_pages : 0;
  };

  const handleGenerateState = async (stateSlug, stateName) => {
    setGenerating((previous) => ({ ...previous, [stateSlug]: true }));
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/dev/generate-state/${stateSlug}`,
        { include_counties: true, include_cities: true },
        { headers: requestHeaders }
      );
      toast({
        title: 'Generation complete',
        description: `Generated ${response.data.generated || 0} pages for ${stateName}.`,
      });
      await fetchData();
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: `Could not generate pages for ${stateName}.`,
        variant: 'destructive',
      });
    } finally {
      setGenerating((previous) => ({ ...previous, [stateSlug]: false }));
    }
  };

  const handleGenerateAll = async () => {
    const pending = states.filter((state) => !generatedPages.find((item) => item.slug === state.slug));
    if (pending.length === 0) {
      toast({ title: 'All generated', description: 'All listed states already have generated pages.' });
      return;
    }

    for (const state of pending.slice(0, 5)) {
      // Sequential by design to avoid large simultaneous writes
      // eslint-disable-next-line no-await-in-loop
      await handleGenerateState(state.slug, state.name);
    }

    if (pending.length > 5) {
      toast({
        title: 'Batch completed',
        description: `Generated first 5 states. ${pending.length - 5} remaining.`,
      });
    }
  };

  const handleDeleteStatePages = async (stateSlug, stateName) => {
    const confirmed = window.confirm(`Delete all generated pages for ${stateName}?`);
    if (!confirmed) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/dev/generated-pages/bulk/state/${stateSlug}`, {
        headers: requestHeaders,
      });
      toast({ title: 'Deleted', description: `Removed generated pages for ${stateName}.` });
      await fetchData();
    } catch (error) {
      toast({ title: 'Delete failed', description: 'Unable to delete generated pages.', variant: 'destructive' });
    }
  };

  const handleViewState = async (stateSlug) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/dev/location-data/${stateSlug}`, {
        headers: requestHeaders,
      });
      setStateData(response.data);
      setSelectedState(stateSlug);
    } catch (error) {
      toast({ title: 'Load failed', description: 'Unable to load state details.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dev-location-generator-loading">
        <div className="w-8 h-8 border-4 border-[#6e2ea8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dev-location-generator-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="dev-location-generator-heading">
            Location Generator
          </h2>
          <p className="text-gray-500" data-testid="dev-location-generator-subheading">
            Generate location landing pages by state, county, and city.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.open(`${BACKEND_URL}/api/dev/location-preview`, '_blank')}
            variant="outline"
            className="rounded-xl"
            data-testid="dev-location-preview-button"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Sample
          </Button>
          <Button
            onClick={handleGenerateAll}
            className="bg-[#6e2ea8] hover:bg-[#5a2490] text-white rounded-xl"
            data-testid="dev-location-generate-all-button"
          >
            <Globe className="w-4 h-4 mr-2" />
            Generate All (5 at a time)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="dev-location-stats-grid">
        <Card data-testid="dev-location-stat-states">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6e2ea8]/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#6e2ea8]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.states || 0}</p>
                <p className="text-xs text-gray-500">States</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="dev-location-stat-counties">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{(stats.counties || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Counties</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="dev-location-stat-cities">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{(stats.cities || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Cities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="dev-location-stat-generated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{(stats.generated_pages || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Generated Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="dev-location-state-grid-card">
        <CardHeader>
          <CardTitle className="text-lg">US States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3" data-testid="dev-location-state-grid">
            {states.map((state) => {
              const generatedCount = getGeneratedCount(state.slug);
              const isGenerated = generatedCount > 0;
              const isGenerating = generating[state.slug];

              return (
                <div
                  key={state.slug}
                  className={`p-3 rounded-xl border ${
                    isGenerated ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                  data-testid={`dev-location-state-card-${state.slug}`}
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate" data-testid={`dev-location-state-name-${state.slug}`}>
                      {state.name}
                    </p>
                    {isGenerated ? <Check className="w-4 h-4 text-green-600" /> : null}
                  </div>
                  <p className="text-xs text-gray-500 mb-3" data-testid={`dev-location-state-meta-${state.slug}`}>
                    {state.county_count} counties • {state.city_count} cities
                  </p>

                  {isGenerated ? (
                    <div className="flex items-center gap-2" data-testid={`dev-location-state-actions-generated-${state.slug}`}>
                      <span className="text-xs font-semibold text-green-700">{generatedCount} pages</span>
                      <button
                        type="button"
                        onClick={() => handleViewState(state.slug)}
                        className="ml-auto p-1 text-gray-500 hover:text-[#6e2ea8]"
                        data-testid={`dev-location-view-state-button-${state.slug}`}
                        title="View state details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStatePages(state.slug, state.name)}
                        className="p-1 text-gray-500 hover:text-red-600"
                        data-testid={`dev-location-delete-state-button-${state.slug}`}
                        title="Delete generated pages"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleGenerateState(state.slug, state.name)}
                      disabled={isGenerating}
                      className="w-full bg-[#6e2ea8] hover:bg-[#5a2490]"
                      data-testid={`dev-location-generate-state-button-${state.slug}`}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate'
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedState && stateData ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="dev-location-state-modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden" data-testid="dev-location-state-modal">
            <div className="border-b px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900" data-testid="dev-location-state-modal-title">
                  {stateData.name}
                </h3>
                <p className="text-sm text-gray-500" data-testid="dev-location-state-modal-subtitle">
                  {stateData.counties?.length || 0} counties • {stateData.cities?.length || 0} cities
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedState(null);
                  setStateData(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                data-testid="dev-location-state-modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Counties</h4>
                <div className="flex flex-wrap gap-2" data-testid="dev-location-state-modal-counties">
                  {(stateData.counties || []).slice(0, 40).map((county) => (
                    <span key={county} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-lg">
                      {county}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cities</h4>
                <div className="flex flex-wrap gap-2" data-testid="dev-location-state-modal-cities">
                  {(stateData.cities || []).slice(0, 60).map((city) => (
                    <span key={city} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t px-6 py-4 flex items-center justify-between gap-4">
              <a
                href={`/locations/custom-sublimation-${stateData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#6e2ea8] hover:underline inline-flex items-center gap-1"
                data-testid="dev-location-state-modal-open-page-link"
              >
                <ExternalLink className="w-4 h-4" />
                Open generated page
              </a>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedState(null);
                  setStateData(null);
                }}
                data-testid="dev-location-state-modal-close-button"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DevLocationGenerator;
