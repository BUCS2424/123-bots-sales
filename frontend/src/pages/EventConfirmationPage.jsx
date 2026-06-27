import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Loader2, Ticket, ArrowRight, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_BACKEND_URL;

const EventConfirmationPage = () => {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const paypalToken = params.get('token');
  const paypalStatus = params.get('paypal');
  const [state, setState] = useState('loading'); // loading, success, error
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      if (!orderId) { setState('error'); return; }
      try {
        // First check current order state
        let order = (await axios.get(`${API}/api/public/events/orders/${orderId}`)).data;
        if (order.order.payment_status !== 'completed' && paypalStatus === 'success') {
          // capture
          const cap = await axios.post(`${API}/api/public/events/orders/${orderId}/capture`, {}, { params: paypalToken ? { paypal_order_id: paypalToken } : {} });
          order = { order: cap.data.order, attendees: cap.data.attendees, event: order.event };
        }
        if (order.order.payment_status === 'completed') { setData(order); setState('success'); }
        else { setState('error'); }
      } catch { setState('error'); }
    })();
  }, [orderId, paypalToken, paypalStatus]);

  return (
    <div className="min-h-screen bg-[#050f17]" data-testid="event-confirmation-page">
      <Header />
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-36">
        {state === 'loading' && (
          <div className="flex flex-col items-center py-20 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
            <p className="mt-4 text-slate-400">Confirming your tickets...</p>
          </div>
        )}
        {state === 'error' && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-10 text-center" data-testid="confirmation-error">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h1 className="mt-4 text-2xl font-bold text-white">We couldn't confirm your order</h1>
            <p className="mt-2 text-slate-400">If you were charged, please contact us with your order reference.</p>
            <Link to="/events" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">Back to Events</Link>
          </div>
        )}
        {state === 'success' && data && (
          <div data-testid="confirmation-success">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"><CheckCircle2 className="h-9 w-9 text-emerald-400" /></div>
              <h1 className="mt-4 text-3xl font-black text-white">You're going! 🎉</h1>
              <p className="mt-2 text-slate-400">Order <span className="font-mono text-purple-300">{data.order.order_number}</span> confirmed. {data.attendees.length} ticket{data.attendees.length !== 1 ? 's' : ''} emailed to <span className="text-white">{data.order.buyer_email}</span>.</p>
            </div>
            <div className="mt-8 space-y-3">
              {data.attendees.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0a1929] p-5" data-testid={`confirm-ticket-${a.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600/20 text-purple-300"><Ticket className="h-5 w-5" /></div>
                    <div>
                      <p className="font-semibold text-white">{a.ticket_type_name || 'Ticket'}</p>
                      <p className="font-mono text-xs text-slate-400">{a.ticket_code}</p>
                    </div>
                  </div>
                  <Link to={`/events/ticket/${a.ticket_code}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-purple-300 hover:bg-white/10" data-testid={`view-ticket-${a.id}`}>View Ticket <ArrowRight className="h-4 w-4" /></Link>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/events" className="text-sm font-semibold text-purple-300 hover:underline">Browse more events</Link>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default EventConfirmationPage;
