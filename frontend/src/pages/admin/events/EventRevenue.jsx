import React, { useEffect, useState } from 'react';
import { DollarSign, Loader2, Users, Ticket, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { eventApi, fmtMoneyFull } from './eventApi';
import { toast } from '../../../hooks/use-toast';

const EventRevenue = () => {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([eventApi.dashboardStats(), eventApi.listEvents()])
      .then(([s, e]) => { setStats(s.data); setEvents(e.data || []); })
      .catch(() => toast({ title: 'Error', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="-m-4 flex min-h-[80vh] items-center justify-center bg-[#0b0712] lg:-m-6"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>;

  const perEvent = events.map((ev) => {
    const sold = (ev.ticket_types || []).reduce((a, t) => a + (t.sold || 0), 0);
    const rev = (ev.ticket_types || []).reduce((a, t) => a + (t.sold || 0) * (t.price || 0), 0);
    return { title: ev.title, status: ev.status, sold, rev, capacity: ev.capacity || 0 };
  }).sort((a, b) => b.rev - a.rev);

  return (
    <div className="-m-4 min-h-screen bg-[#0b0712] p-5 text-white lg:-m-6 lg:p-8" data-testid="revenue-reports-page">
      <h1 className="mb-1 text-2xl font-black">Revenue & Reports</h1>
      <p className="mb-6 text-sm text-white/40">Financial overview across your events</p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: DollarSign, label: 'Total Revenue', value: fmtMoneyFull(stats.total_revenue), c: 'bg-emerald-600' },
          { icon: Ticket, label: 'Tickets Sold', value: (stats.tickets_sold || 0).toLocaleString(), c: 'bg-purple-600' },
          { icon: Users, label: 'Total Events', value: stats.total_events || 0, c: 'bg-fuchsia-600' },
          { icon: CheckCircle2, label: 'Checked In', value: stats.checked_in || 0, c: 'bg-amber-500' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-[#150f22] p-5" data-testid={`rev-stat-${i}`}>
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.c}`}><s.icon className="h-5 w-5 text-white" /></div>
            <p className="text-xs uppercase text-white/50">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-[#150f22] p-6" data-testid="rev-trend-card">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">Sales Volume — Last 12 Months</h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={224}>
            <AreaChart data={stats.sales_trend || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1f1730', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="value" stroke="#c084fc" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#150f22]" data-testid="rev-per-event">
        <div className="border-b border-white/10 p-4"><h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Revenue by Event</h2></div>
        {perEvent.length === 0 ? <p className="py-12 text-center text-sm text-white/40">No events yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase text-white/40">
                  <th className="p-4">Event</th><th className="p-4">Sold</th><th className="p-4">Capacity</th><th className="p-4">Fill</th><th className="p-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {perEvent.map((e, i) => (
                  <tr key={i} className="border-b border-white/5" data-testid={`rev-event-${i}`}>
                    <td className="p-4 font-medium">{e.title}</td>
                    <td className="p-4 text-white/70">{e.sold}</td>
                    <td className="p-4 text-white/70">{e.capacity || '—'}</td>
                    <td className="p-4 text-white/70">{e.capacity ? `${Math.round((e.sold / e.capacity) * 100)}%` : '—'}</td>
                    <td className="p-4 text-right font-semibold text-emerald-300">{fmtMoneyFull(e.rev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRevenue;
