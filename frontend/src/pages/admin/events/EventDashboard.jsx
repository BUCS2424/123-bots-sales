import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays, Ticket, DollarSign, Users, TrendingUp, Plus, Download,
  Radio, ArrowUpRight, Loader2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { eventApi, STATUS_META, fmtMoney } from './eventApi';
import { toast } from '../../../hooks/use-toast';

const StatCard = ({ icon: Icon, label, value, accent, glow, testid }) => (
  <div
    data-testid={testid}
    className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#150f22] p-5"
  >
    <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-40 ${glow}`} />
    <div className="relative">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const formatEventDate = (iso) => {
  if (!iso) return { day: '--', mon: '' };
  const d = new Date(iso);
  return { day: d.getDate().toString().padStart(2, '0'), mon: d.toLocaleString('en-US', { month: 'short' }).toUpperCase() };
};

const EventDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    eventApi.dashboardStats()
      .then((r) => setStats(r.data))
      .catch(() => toast({ title: 'Error', description: 'Failed to load dashboard', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="-m-4 flex min-h-[80vh] items-center justify-center bg-[#0b0712] lg:-m-6" data-testid="event-dashboard-loading">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const trend = stats?.sales_trend || [];
  const maxVal = Math.max(...trend.map((t) => t.value), 1);

  return (
    <div className="-m-4 min-h-screen bg-[#0b0712] p-5 text-white lg:-m-6 lg:p-8" data-testid="event-dashboard">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300/70">Event Organizer</p>
            <h1 className="text-3xl font-black tracking-tight">DASHBOARD</h1>
          </div>
          {stats?.live_events > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300" data-testid="live-events-badge">
              <Radio className="h-3.5 w-3.5 animate-pulse" /> {stats.live_events} LIVE {stats.live_events === 1 ? 'EVENT' : 'EVENTS'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/events/list"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
            data-testid="dashboard-view-all-btn"
          >
            <Download className="h-4 w-4" /> All Events
          </Link>
          <button
            onClick={() => navigate('/admin/events/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:opacity-90"
            data-testid="dashboard-new-event-btn"
          >
            <Plus className="h-4 w-4" /> New Event
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard testid="stat-upcoming" icon={CalendarDays} label="Upcoming Events" value={stats?.upcoming_events ?? 0} accent="bg-purple-600" glow="bg-purple-600" />
        <StatCard testid="stat-tickets" icon={Ticket} label="Tickets Sold" value={(stats?.tickets_sold ?? 0).toLocaleString()} accent="bg-emerald-600" glow="bg-emerald-600" />
        <StatCard testid="stat-revenue" icon={DollarSign} label="Total Revenue" value={fmtMoney(stats?.total_revenue)} accent="bg-rose-600" glow="bg-rose-600" />
        <StatCard testid="stat-attendance" icon={Users} label="Avg Attendance Rate" value={`${stats?.attendance_rate ?? 0}%`} accent="bg-amber-500" glow="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ticket sales trend */}
        <div className="rounded-2xl border border-white/10 bg-[#150f22] p-6 lg:col-span-2" data-testid="sales-trend-card">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Ticket Sales Trend</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" /> Last 12 months
            </span>
          </div>
          <p className="text-4xl font-black text-white">{(stats?.tickets_sold ?? 0).toLocaleString()}</p>
          <p className="mb-4 text-xs text-white/40">Tickets sold across all events</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(168,85,247,0.08)' }}
                  contentStyle={{ background: '#1f1730', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {trend.map((entry, i) => (
                    <Cell key={i} fill={i === trend.length - 1 ? '#c084fc' : '#7c3aed'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="rounded-2xl border border-white/10 bg-[#150f22] p-6" data-testid="upcoming-events-card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Upcoming Events</h2>
            <span className="rounded-full bg-purple-500/15 px-2.5 py-1 text-xs font-medium text-purple-300">{stats?.upcoming_events ?? 0} Total</span>
          </div>
          <div className="space-y-3">
            {(stats?.upcoming_list || []).length === 0 && (
              <p className="py-8 text-center text-sm text-white/40" data-testid="upcoming-empty">No upcoming events yet.</p>
            )}
            {(stats?.upcoming_list || []).map((ev) => {
              const { day, mon } = formatEventDate(ev.start_datetime);
              const meta = STATUS_META[ev.status] || STATUS_META.draft;
              return (
                <Link
                  to={`/admin/events/${ev.id}`}
                  key={ev.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-purple-500/40 hover:bg-white/[0.06]"
                  data-testid={`upcoming-event-${ev.id}`}
                >
                  <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-purple-600/20 text-purple-200">
                    <span className="text-base font-bold leading-none">{day}</span>
                    <span className="text-[10px] font-medium">{mon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{ev.title}</p>
                    <p className="truncate text-xs text-white/40">{ev.venue_name || 'No venue'}{ev.venue_city ? `, ${ev.venue_city}` : ''}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${meta.color}`}>{meta.label}</span>
                    <span className="text-xs font-semibold text-white/60">{ev.fill_pct}%</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-white/20 transition group-hover:text-purple-300" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDashboard;
