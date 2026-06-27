import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_BACKEND_URL;

const TicketViewPage = () => {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`${API}/api/public/events/ticket/${code}`);
        setData(r.data); setState('ok');
      } catch { setState('error'); }
    })();
  }, [code]);

  const ev = data?.event || {};
  const att = data?.attendee || {};
  const dt = ev.start_datetime ? new Date(ev.start_datetime) : null;
  const bg = ev.ticket_background_url;
  const bgStyle = bg
    ? { backgroundImage: `linear-gradient(rgba(10,5,18,0.5),rgba(10,5,18,0.85)), url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg,#4c1d95,#a21caf,#0b0712)' };

  return (
    <div className="min-h-screen bg-[#050f17]" data-testid="ticket-view-page">
      <Header />
      <section className="mx-auto max-w-2xl px-4 pb-24 pt-32">
        {state === 'loading' && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>}
        {state === 'error' && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-10 text-center" data-testid="ticket-error">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h1 className="mt-4 text-2xl font-bold text-white">Ticket not found</h1>
            <Link to="/events" className="mt-6 inline-block rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">Browse Events</Link>
          </div>
        )}
        {state === 'ok' && (
          <div data-testid="ticket-render">
            <p className="mb-4 text-center text-sm text-slate-400">Show this at the door for entry</p>
            <div className="overflow-hidden rounded-2xl shadow-2xl">
              <div className="relative p-7 text-white" style={bgStyle}>
                <div className="flex items-start justify-between">
                  <img src={data.qr} alt="QR" className="h-24 w-24 rounded-lg bg-white p-1.5" data-testid="ticket-qr" />
                  <div className="text-right">
                    <p className="text-sm tracking-[0.25em]">ADMIT ONE</p>
                    <p className="text-2xl font-bold">{att.ticket_type_name || 'Ticket'}</p>
                  </div>
                </div>
                <div className="mt-8">
                  <p className="text-[11px] tracking-[0.3em] text-white/70">{ev.ticket_tagline || 'PREPARE YOURSELF'}</p>
                  <h1 className="text-3xl font-black uppercase leading-tight">{ev.title}</h1>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-[10px] uppercase text-white/50">Date</p>{dt ? dt.toLocaleDateString() : '--'}</div>
                  <div><p className="text-[10px] uppercase text-white/50">Time</p>{dt ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</div>
                  <div><p className="text-[10px] uppercase text-white/50">Venue</p>{data.venue?.name || '--'}</div>
                </div>
              </div>
              <div className="border-t-2 border-dashed border-white/20 bg-[#150f22] p-6 text-white">
                <p className="text-sm">Attendee: <strong>{att.name}</strong></p>
                <p className="mt-1 text-sm">Ticket No. <strong className="font-mono">{att.ticket_code}</strong></p>
                <p className="mt-1 text-sm">Status: <strong className={att.status === 'checked_in' ? 'text-emerald-400' : 'text-purple-300'}>{(att.status || '').replace('_', ' ')}</strong></p>
              </div>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default TicketViewPage;
