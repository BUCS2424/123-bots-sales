import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Download, CreditCard, CheckCircle2, Building2, Anchor, AlertCircle } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const ToursChartersInvoiceView = () => {
  const { invoiceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const load = () => {
    axios.get(`${API}/api/public/tours-charters/invoices/${invoiceId}`)
      .then((r) => setInvoice(r.data))
      .catch(() => setError('Invoice not found.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [invoiceId]);

  useEffect(() => {
    const sessionId = searchParams.get('stripe_session');
    if (!sessionId) return;
    setCheckingPayment(true);
    axios.get(`${API}/api/public/tours-charters/invoices/${invoiceId}/pay/status`, { params: { session_id: sessionId } })
      .then((r) => { if (r.data.invoice) setInvoice((prev) => ({ ...prev, ...r.data.invoice })); })
      .finally(() => { setCheckingPayment(false); setSearchParams({}); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const res = await axios.post(`${API}/api/public/tours-charters/invoices/${invoiceId}/pay`, { origin_url: window.location.origin });
      window.location.href = res.data.url;
    } catch (e) {
      setError(e.response?.data?.detail || 'Unable to start payment.');
      setPaying(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>;
  if (error && !invoice) return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500" data-testid="invoice-view-error">{error}</div>;

  const { seller = {}, bill_from = {}, line_items = [], transactions = [] } = invoice;
  const isPaid = invoice.status === 'paid';
  const isVoid = invoice.status === 'void';

  return (
    <div className="min-h-screen bg-gray-50 py-10 print:bg-white print:py-0" data-testid="tours-charters-invoice-view">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${isPaid ? 'bg-emerald-100 text-emerald-700' : isVoid ? 'bg-gray-200 text-gray-500' : 'bg-amber-100 text-amber-700'}`}
            data-testid="invoice-view-status-badge"
          >
            {isPaid ? 'Paid' : isVoid ? 'Void' : 'Unpaid'}
          </span>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100" data-testid="invoice-view-download-btn">
              <Download className="h-4 w-4" /> Download
            </button>
            {!isPaid && !isVoid && (
              <button onClick={handlePayNow} disabled={paying || checkingPayment} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50" data-testid="invoice-view-pay-now-btn">
                <CreditCard className="h-4 w-4" /> {paying ? 'Redirecting...' : 'Pay Now'}
              </button>
            )}
          </div>
        </div>

        {checkingPayment && <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Confirming your payment...</div>}
        {error && <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700" data-testid="invoice-view-error-banner"><AlertCircle className="h-4 w-4" /> {error}</div>}

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-gray-100 pb-6">
            <div>
              {bill_from.logo_url ? <img src={bill_from.logo_url} alt={bill_from.business_name} className="mb-2 h-10 object-contain" /> : <p className="mb-1 flex items-center gap-1.5 text-lg font-bold text-gray-900"><Anchor className="h-5 w-5 text-teal-600" /> {bill_from.business_name}</p>}
              <p className="text-sm text-gray-500">{[bill_from.address, bill_from.city, bill_from.state, bill_from.zip_code].filter(Boolean).join(', ')}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900" data-testid="invoice-view-number">{invoice.invoice_number}</p>
              <p className="text-sm text-gray-500">Invoice Date: {invoice.invoice_date}</p>
              {invoice.sale_agent && <p className="text-sm text-gray-500">Sale Agent: {invoice.sale_agent}</p>}
              {seller.payment_terms && <p className="text-sm text-gray-500">Terms: {seller.payment_terms}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 py-6">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Bill To</p>
              <p className="flex items-center gap-1.5 font-bold text-gray-900"><Building2 className="h-4 w-4 text-gray-400" /> {seller.name}</p>
              <p className="text-sm text-gray-500">{[seller.billing_address, seller.billing_city, seller.billing_state, seller.billing_zip].filter(Boolean).join(', ')}</p>
              {seller.tax_id && <p className="text-sm text-gray-500">Tax ID: {seller.tax_id}</p>}
              {seller.invoice_email && <p className="text-sm text-gray-500">{seller.invoice_email}</p>}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2">#</th>
                <th className="py-2">Item</th>
                <th className="py-2">Booking ID / Name</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Tax</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {line_items.map((li, idx) => (
                <tr key={idx} className="border-b border-gray-100" data-testid={`invoice-view-line-${idx}`}>
                  <td className="py-2 text-gray-400">{idx + 1}</td>
                  <td className="py-2 text-gray-900">{li.description}</td>
                  <td className="py-2 text-gray-500">{li.booking_ref}</td>
                  <td className="py-2 text-right text-gray-500">{li.qty}</td>
                  <td className="py-2 text-right text-gray-500">${Number(li.rate).toFixed(2)}</td>
                  <td className="py-2 text-right text-gray-500">{li.tax_percent}%</td>
                  <td className="py-2 text-right font-semibold text-gray-900">${Number(li.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end py-4">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Sub Total</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Tax</span><span>${Number(invoice.tax_amount).toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900"><span>Total</span><span data-testid="invoice-view-total">${Number(invoice.total).toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Amount Paid</span><span>${Number(invoice.amount_paid).toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 text-base font-black text-teal-700"><span>Amount Due</span><span data-testid="invoice-view-amount-due">${Number(invoice.amount_due).toFixed(2)}</span></div>
            </div>
          </div>

          {invoice.custom_note && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600" data-testid="invoice-view-custom-note">{invoice.custom_note}</div>
          )}

          {transactions.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Transactions</p>
              <div className="space-y-1">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm" data-testid={`invoice-view-transaction-${t.id}`}>
                    <span className="flex items-center gap-1.5 text-gray-600"><CheckCircle2 className={`h-3.5 w-3.5 ${t.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`} /> {t.created_at?.slice(0, 10)} - {t.payment_status}</span>
                    <span className="font-semibold text-gray-900">${Number(t.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(seller.invoice_email || invoice.bank_info || invoice.venmo_info || invoice.check_info) && !isPaid && !isVoid && (
            <div className="border-t border-gray-100 pt-5 print:hidden">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Payment Options</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-teal-800"><CreditCard className="h-4 w-4" /> Online Payment</p>
                  <p className="mb-3 text-xs text-teal-700">Pay securely by credit or debit card.</p>
                  <button onClick={handlePayNow} disabled={paying} className="w-full rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50" data-testid="invoice-view-pay-now-btn-inline">
                    {paying ? 'Redirecting...' : `Pay $${Number(invoice.amount_due).toFixed(2)}`}
                  </button>
                </div>
                <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                  <p className="text-sm font-bold text-gray-700">Offline Payment</p>
                  {invoice.bank_info && <p data-testid="invoice-view-bank-info"><span className="font-semibold">Bank/ACH:</span> {invoice.bank_info}</p>}
                  {invoice.venmo_info && <p data-testid="invoice-view-venmo-info"><span className="font-semibold">Venmo:</span> {invoice.venmo_info}</p>}
                  {invoice.check_info && <p data-testid="invoice-view-check-info"><span className="font-semibold">Check:</span> {invoice.check_info}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToursChartersInvoiceView;
