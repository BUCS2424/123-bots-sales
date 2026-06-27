import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import Header from '../components/Header';
import EventsPublicPage from './EventsPublicPage';
import EventsLandingPage from './EventsLandingPage';

const API = process.env.REACT_APP_BACKEND_URL;

const EventsIndexPage = () => {
  const [flags, setFlags] = useState(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const forceList = params.get('view') === 'list';

  useEffect(() => {
    axios.get(`${API}/api/settings/feature-flags`)
      .then((r) => setFlags(r.data || {}))
      .catch(() => setFlags({}));
  }, []);

  useEffect(() => {
    if (flags && !flags.events_enabled) navigate('/');
  }, [flags, navigate]);

  if (!flags) return <div className="min-h-screen bg-[#070708]"><Header /><div className="flex items-center justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div></div>;
  if (!flags.events_enabled) return null;

  if (flags.events_landing_enabled && !forceList) return <EventsLandingPage centerName={flags.events_center_name || 'Event Center'} />;
  return <EventsPublicPage />;
};

export default EventsIndexPage;
