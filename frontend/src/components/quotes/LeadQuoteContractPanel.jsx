import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const LeadQuoteContractPanel = ({ leadId, title = 'Quotes' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState([]);

  const fetchQuotes = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/leads/${leadId}/quotes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuotes(response.data?.quotes || []);
    } catch (_error) {
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [leadId]);

  if (!leadId) {
    return <div className="text-sm text-gray-500" data-testid="lead-quote-panel-no-lead">No linked lead found.</div>;
  }

  return (
    <div className="space-y-4" data-testid="lead-quote-contract-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xl font-semibold text-gray-800" data-testid="lead-quote-panel-title">{title}</h4>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/admin/leads/${leadId}/quote/new`)} data-testid="lead-quote-create-button">
            Create Quote
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/quotes-contracts-esign')} data-testid="lead-contracts-admin-button">
            Contracts Admin
          </Button>
          <Button variant="outline" onClick={fetchQuotes} disabled={loading} data-testid="lead-quote-refresh-button">
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden" data-testid="lead-quotes-table-wrap">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Quote</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-gray-500" data-testid="lead-quotes-empty-state">
                  {loading ? 'Loading quotes...' : 'No quotes yet.'}
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="border-t" data-testid={`lead-quote-row-${quote.id}`}>
                  <td className="px-4 py-3 font-medium">{quote.name}</td>
                  <td className="px-4 py-3">${Number(quote.total || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">{quote.status || 'draft'}</td>
                  <td className="px-4 py-3">{quote.updated_at ? new Date(quote.updated_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/leads/${leadId}/quote/${quote.id}`)}
                        data-testid={`lead-quote-edit-${quote.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/sign/${quote.id}`, '_blank')}
                        data-testid={`lead-quote-sign-link-${quote.id}`}
                      >
                        eSign Link
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
