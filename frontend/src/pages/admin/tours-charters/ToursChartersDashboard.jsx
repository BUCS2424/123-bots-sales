import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Tag, Building2, Sparkles, CalendarCheck, DollarSign, Receipt, LayoutDashboard, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { toursChartersApi } from './toursChartersApi';

const StatCard = ({ icon: Icon, label, value, iconBg, iconColor, testId }) => (
  <Card data-testid={testId}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ToursChartersDashboard = () => {
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([toursChartersApi.dashboardStats(), toursChartersApi.listInvoices()])
      .then(([statsRes, invoicesRes]) => {
        setStats(statsRes.data);
        setInvoices(invoicesRes.data || []);
      })
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid');

  const cards = [
    { icon: Sparkles, label: 'Total Activities', value: stats?.total_activities ?? 0, iconBg: 'bg-teal-100', iconColor: 'text-teal-600', testId: 'stat-total-activities' },
    { icon: CalendarCheck, label: 'Active Listings', value: stats?.active_activities ?? 0, iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', testId: 'stat-active-activities' },
    { icon: Tag, label: 'Activity Categories', value: stats?.total_categories ?? 0, iconBg: 'bg-sky-100', iconColor: 'text-sky-600', testId: 'stat-total-categories' },
    { icon: Building2, label: 'Charter Companies', value: stats?.total_sellers ?? 0, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', testId: 'stat-total-sellers' },
    { icon: Compass, label: 'Bookings (Coming Soon)', value: stats?.total_bookings ?? 0, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', testId: 'stat-total-bookings' },
    { icon: DollarSign, label: 'Commission Revenue', value: `$${(stats?.commission_revenue ?? 0).toFixed(2)}`, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', testId: 'stat-commission-revenue' },
  ];

  return (
    <div className="space-y-6" data-testid="tours-charters-dashboard">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <Compass className="h-7 w-7 text-teal-500" /> Tours / Charters
        </h1>
        <p className="mt-1 text-gray-500">Activity &amp; Charter Marketplace overview. Stat labels and metrics are placeholders and will be finalized as the module is built out.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {cards.map((c) => (
              <StatCard key={c.testId} {...c} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-10" data-testid="tours-charters-dashboard-lower-grid">
            <Card className="lg:col-span-7" data-testid="tours-charters-dashboard-main-panel">
              <CardContent className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center text-gray-400">
                <LayoutDashboard className="h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">More insights coming soon</p>
                <p className="text-xs text-gray-400">This panel is reserved for upcoming analytics.</p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3" data-testid="tours-charters-dashboard-unpaid-invoices-panel">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><Receipt className="h-4 w-4 text-amber-500" /> Unpaid Invoices</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700" data-testid="unpaid-invoices-count">{unpaidInvoices.length}</span>
                </div>
                {unpaidInvoices.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400" data-testid="unpaid-invoices-empty">No unpaid invoices. Nice!</p>
                ) : (
                  <div className="space-y-2">
                    {unpaidInvoices.slice(0, 6).map((inv) => (
                      <Link
                        key={inv.id}
                        to={`/admin/tours-charters/invoices?seller_id=${inv.seller_id}`}
                        className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs hover:bg-gray-50"
                        data-testid={`unpaid-invoice-row-${inv.id}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-800">{inv.seller_name}</p>
                          <p className="truncate text-gray-400">{inv.invoice_number}</p>
                        </div>
                        <span className="flex-shrink-0 font-bold text-amber-600">${inv.amount_due?.toFixed(2)}</span>
                      </Link>
                    ))}
                  </div>
                )}
                <Link to="/admin/tours-charters/invoices" className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700" data-testid="unpaid-invoices-view-all-link">
                  View all invoices <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500" data-testid="tours-charters-roadmap-note">
        <p className="mb-2 font-semibold text-gray-700">Building this out step by step:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Categories &amp; Activities — live now, manage them from the sidebar</li>
          <li>Charter Companies — full CRM page live now with search/filters</li>
          <li>Subcategories, Tags, Billing (commission tracking), and Analytics — coming as this module grows</li>
        </ul>
      </div>
    </div>
  );
};

export default ToursChartersDashboard;
