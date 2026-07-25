import React, { useEffect, useState } from 'react';
import { Compass, Tag, Building2, Sparkles, CalendarCheck, DollarSign, Loader2 } from 'lucide-react';
import { toursChartersApi } from './toursChartersApi';

const StatCard = ({ icon: Icon, label, value, accent, testId }) => (
  <div
    className="rounded-2xl border border-white/10 bg-[#0b1f24] p-5"
    data-testid={testId}
  >
    <div className="mb-3 flex items-center justify-between">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5 text-white" />
      </span>
    </div>
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/40">{label}</p>
  </div>
);

const ToursChartersDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    toursChartersApi.dashboardStats()
      .then((r) => setStats(r.data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { icon: Sparkles, label: 'Total Activities', value: stats?.total_activities ?? 0, accent: 'bg-teal-500', testId: 'stat-total-activities' },
    { icon: CalendarCheck, label: 'Active Listings', value: stats?.active_activities ?? 0, accent: 'bg-cyan-500', testId: 'stat-active-activities' },
    { icon: Tag, label: 'Activity Categories', value: stats?.total_categories ?? 0, accent: 'bg-sky-500', testId: 'stat-total-categories' },
    { icon: Building2, label: 'Charter Companies', value: stats?.total_sellers ?? 0, accent: 'bg-blue-500', testId: 'stat-total-sellers' },
    { icon: Compass, label: 'Bookings (Coming Soon)', value: stats?.total_bookings ?? 0, accent: 'bg-indigo-500', testId: 'stat-total-bookings' },
    { icon: DollarSign, label: 'Commission Revenue', value: `$${(stats?.commission_revenue ?? 0).toFixed(2)}`, accent: 'bg-emerald-500', testId: 'stat-commission-revenue' },
  ];

  return (
    <div className="-m-4 min-h-screen bg-[#061a1f] p-5 text-white lg:-m-6 lg:p-8" data-testid="tours-charters-dashboard">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Compass className="h-6 w-6 text-teal-400" /> Tours / Charters
        </h1>
        <p className="mt-1 text-sm text-white/40">Activity &amp; Charter Marketplace overview. Stat labels and metrics are placeholders and will be finalized as the module is built out.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-teal-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <StatCard key={c.testId} {...c} />
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-[#0b1f24] p-6 text-sm text-white/40" data-testid="tours-charters-roadmap-note">
        <p className="font-semibold text-white/70 mb-2">Building this out step by step:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Categories &amp; Activities — live now, manage them from the sidebar</li>
          <li>Seller Tenants (charter companies) — quick-add from the Activities screen for now, dedicated CRM page next</li>
          <li>Subcategories, Tags, Billing (commission tracking), and Analytics — coming as this module grows</li>
        </ul>
      </div>
    </div>
  );
};

export default ToursChartersDashboard;
