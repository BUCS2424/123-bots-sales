import React, { useEffect, useState } from 'react';
import axios from 'axios';
import QuoteBuilderPage from './QuoteBuilderPage';

export default function QuoteWorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [leadId, setLeadId] = useState(null);

  useEffect(() => {
    const loadWorkspaceLead = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/quotes/workspace-lead`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setLeadId(response.data?.lead_id || null);
      } finally {
        setLoading(false);
      }
    };
    loadWorkspaceLead();
  }, []);

  if (loading) {
    return <div className="p-6" data-testid="quote-workspace-loading">Loading quote workspace...</div>;
  }

  if (!leadId) {
    return <div className="p-6" data-testid="quote-workspace-no-lead">Unable to initialize quote workspace.</div>;
  }

  return <QuoteBuilderPage leadId={leadId} quoteId="new" />;
}
