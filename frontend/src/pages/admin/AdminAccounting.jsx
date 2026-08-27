import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  DollarSign, TrendingUp, TrendingDown, Package, BarChart3,
  FileText, ChevronLeft, ChevronRight, Loader2, Calendar,
  ArrowUpRight, ArrowDownRight, Percent, Clock, AlertTriangle,
  Printer
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminAccounting = ({ initialTab = 'daily' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [tax, setTax] = useState(null);
  const [journal, setJournal] = useState(null);
  const [monthly, setMonthly] = useState(null);

  const today = new Date();
  const [reportDate, setReportDate] = useState(today.toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [d, inv, k, t, j, m] = await Promise.all([
        axios.get(`${API}/accounting/daily-snapshot`, { params: { report_date: reportDate } }),
        axios.get(`${API}/accounting/inventory-valuation`),
        axios.get(`${API}/accounting/kpis`),
        axios.get(`${API}/accounting/sales-tax`, { params: { report_month: reportMonth } }),
        axios.get(`${API}/accounting/journal-entries`, { params: { report_date: reportDate } }),
        axios.get(`${API}/accounting/monthly-summary`, { params: { report_month: reportMonth } }),
      ]);
      setDaily(d.data);
      setInventory(inv.data);
      setKpis(k.data);
      setTax(t.data);
      setJournal(j.data);
      setMonthly(m.data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load accounting data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [reportDate, reportMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const navDate = (delta) => {
    const d = new Date(reportDate);
    d.setDate(d.getDate() + delta);
    setReportDate(d.toISOString().split('T')[0]);
  };

  const navMonth = (delta) => {
    const [y, m] = reportMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setReportMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const fmt = (v) => v?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) ?? '$0.00';
  const fmtPct = (v) => `${v?.toFixed(1) ?? 0}%`;

  if (loading && !daily) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="accounting-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-[rgb(37, 99, 235)]" />
            Accounting
          </h1>
          <p className="text-gray-500 text-sm">Alabama Retail &amp; Storage Financial Reports</p>
        </div>
        <Button variant="outline" onClick={() => window.print()} data-testid="print-report-btn">
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full max-w-3xl h-auto">
          <TabsTrigger value="daily" data-testid="tab-daily">Daily Snapshot</TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">Inventory</TabsTrigger>
          <TabsTrigger value="kpis" data-testid="tab-kpis">KPIs</TabsTrigger>
          <TabsTrigger value="tax" data-testid="tab-tax">Sales Tax</TabsTrigger>
          <TabsTrigger value="journal" data-testid="tab-journal">Journal</TabsTrigger>
        </TabsList>

        {/* ===== DAILY SNAPSHOT ===== */}
        <TabsContent value="daily">
          <div className="space-y-6">
            <DateNav label={new Date(reportDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} onPrev={() => navDate(-1)} onNext={() => navDate(1)} testId="daily" />

            {daily && (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Beginning Cash" value={fmt(daily.beginning_cash)} icon={<DollarSign className="w-5 h-5" />} color="blue" />
                  <StatCard label="Ending Cash" value={fmt(daily.ending_cash)} icon={<DollarSign className="w-5 h-5" />} color="green" />
                  <StatCard label="Net Cash Flow" value={fmt(daily.net_cash_flow)} icon={daily.net_cash_flow >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />} color={daily.net_cash_flow >= 0 ? 'green' : 'red'} />
                  <StatCard label="Service Charges" value={fmt(daily.service_charges)} icon={<Percent className="w-5 h-5" />} color="purple" sub="Interest Income (25% max)" />
                </div>

                {/* Detailed table */}
                <Card data-testid="daily-snapshot-table">
                  <CardHeader>
                    <CardTitle className="text-lg">Cash Drawer Detail</CardTitle>
                    <CardDescription>Line-by-line cash flow for {reportDate}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right font-semibold">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SnapshotRow label="Beginning Cash" desc="Cash in drawer at open" amount={daily.beginning_cash} />
                        <SnapshotRow label="New Loans Written" desc={`${daily.new_loans_count} loan(s) — Principal Out`} amount={-daily.new_loans_written} negative />
                        <SnapshotRow label="Buys (Cash Out)" desc={`${daily.buys_count} buy contract(s)`} amount={-daily.buys_cash_out} negative />
                        <SnapshotRow label="Loan Redemptions" desc={`${daily.redemptions_count} redemption(s) — Principal Returned`} amount={daily.loan_redemptions} />
                        <SnapshotRow label="Service Charges" desc="Interest/Fees collected (25% max per AL § 5-19A-7)" amount={daily.service_charges} highlight />
                        <SnapshotRow label="Retail Sales" desc="Revenue from items sold" amount={daily.retail_sales} />
                        <SnapshotRow label="Sales Tax Collected" desc="AL 4%+ — Must be set aside" amount={daily.sales_tax_collected} />
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell className="font-bold text-blue-900">Ending Cash</TableCell>
                          <TableCell className="text-blue-700">Expected cash in drawer at close</TableCell>
                          <TableCell className="text-right font-bold text-blue-900 text-lg">{fmt(daily.ending_cash)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* ===== INVENTORY VALUATION ===== */}
        <TabsContent value="inventory">
          {inventory && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Receivables" value={fmt(inventory.pawn_receivables)} icon={<FileText className="w-5 h-5" />} color="blue" sub={`${inventory.pawn_receivables_count} active loan(s) — Money on the street`} />
                <StatCard label="Buy Inventory" value={fmt(inventory.buy_inventory_value)} icon={<Package className="w-5 h-5" />} color="green" sub={`${inventory.buy_inventory_count} item(s) — Cost: ${fmt(inventory.buy_inventory_cost)}`} />
                <StatCard label="Forfeited Inventory" value={fmt(inventory.forfeited_value)} icon={<AlertTriangle className="w-5 h-5" />} color="amber" sub={`${inventory.forfeited_count} defaulted — Loan value: ${fmt(inventory.forfeited_loan_value)}`} />
              </div>

              <Card data-testid="inventory-valuation-card">
                <CardHeader>
                  <CardTitle className="text-lg">Inventory Valuation Summary</CardTitle>
                  <CardDescription>Distinguishes owned assets from collateral held</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right font-semibold">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Receivables</TableCell>
                        <TableCell><Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">Collateral</Badge></TableCell>
                        <TableCell className="text-right">{inventory.pawn_receivables_count}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(inventory.pawn_receivables)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Inventory (Buys)</TableCell>
                        <TableCell><Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">Owned</Badge></TableCell>
                        <TableCell className="text-right">{inventory.buy_inventory_count}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(inventory.buy_inventory_value)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Forfeited (Defaulted)</TableCell>
                        <TableCell><Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">Forfeited</Badge></TableCell>
                        <TableCell className="text-right">{inventory.forfeited_count}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(inventory.forfeited_value)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-gray-50 font-bold">
                        <TableCell className="font-bold" colSpan={2}>Total Inventory Value</TableCell>
                        <TableCell className="text-right" />
                        <TableCell className="text-right font-bold text-lg">{fmt(inventory.total_inventory_value)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ===== KPIs ===== */}
        <TabsContent value="kpis">
          {kpis && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Yield on Loans" value={fmtPct(kpis.yield_on_loans)} icon={<TrendingUp className="w-5 h-5" />} color="green" sub="Interest vs. Principal" />
                <StatCard label="Redemption Rate" value={fmtPct(kpis.redemption_rate)} icon={<ArrowUpRight className="w-5 h-5" />} color={kpis.redemption_rate >= 70 ? 'green' : 'amber'} sub="Target: 70-80%" />
                <StatCard label="Avg Loan Amount" value={fmt(kpis.avg_loan_amount)} icon={<DollarSign className="w-5 h-5" />} color="blue" />
                <StatCard label="Active Contracts" value={kpis.active_contracts} icon={<FileText className="w-5 h-5" />} color="purple" sub={`${kpis.total_contracts} total`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contract Breakdown */}
                <Card data-testid="contract-breakdown-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Contract Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <ProgressBar label="Active" count={kpis.active_contracts} total={kpis.total_contracts} color="bg-[rgb(37, 99, 235)]" />
                      <ProgressBar label="Paid / Redeemed" count={kpis.paid_contracts} total={kpis.total_contracts} color="bg-green-500" />
                      <ProgressBar label="Defaulted" count={kpis.defaulted_contracts} total={kpis.total_contracts} color="bg-red-500" />
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Principal Outstanding</span>
                        <span className="font-bold">{fmt(kpis.total_principal_outstanding)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory Aging */}
                <Card data-testid="inventory-aging-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Inventory Aging</CardTitle>
                    <CardDescription>Move retail items within 90 days for best cash flow</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(kpis.inventory_aging).map(([bucket, count]) => (
                        <div key={bucket} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{bucket} days</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${bucket === '90+' ? 'bg-red-500' : bucket === '61-90' ? 'bg-amber-500' : 'bg-green-500'}`}
                                style={{ width: `${kpis.total_retail_items ? (count / kpis.total_retail_items) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                      Total Retail Items: <span className="font-bold text-gray-900">{kpis.total_retail_items}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== SALES TAX ===== */}
        <TabsContent value="tax">
          {tax && (
            <div className="space-y-6">
              <DateNav label={new Date(tax.report_period + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} onPrev={() => navMonth(-1)} onNext={() => navMonth(1)} testId="tax" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Taxable Sales" value={fmt(tax.taxable_retail_sales)} icon={<DollarSign className="w-5 h-5" />} color="blue" sub="Retail merchandise only" />
                <StatCard label="Tax Collected" value={fmt(tax.tax_collected)} icon={<DollarSign className="w-5 h-5" />} color="green" />
                <StatCard label="Non-Taxable" value={fmt(tax.non_taxable_service_charges)} icon={<Percent className="w-5 h-5" />} color="gray" sub="Service charges" />
                <StatCard label="Total Tax Due" value={fmt(tax.total_tax_due)} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
              </div>

              <Card data-testid="sales-tax-card">
                <CardHeader>
                  <CardTitle className="text-lg">Alabama Sales Tax Breakdown</CardTitle>
                  <CardDescription>No sales tax on interest/service charges — only retail merchandise</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Line Item</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Taxable Retail Sales</TableCell>
                        <TableCell className="text-right">{fmt(tax.taxable_retail_sales)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Non-Taxable Service Charges (Interest)</TableCell>
                        <TableCell className="text-right text-gray-500">{fmt(tax.non_taxable_service_charges)}</TableCell>
                      </TableRow>
                      <TableRow className="border-t-2">
                        <TableCell>State Tax ({tax.state_tax_rate}%)</TableCell>
                        <TableCell className="text-right">{fmt(tax.state_tax_due)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Local Tax ({tax.local_tax_rate}%)</TableCell>
                        <TableCell className="text-right">{fmt(tax.local_tax_due)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-red-50 font-bold">
                        <TableCell className="font-bold">Total Tax Due ({tax.combined_rate}%)</TableCell>
                        <TableCell className="text-right font-bold text-red-700 text-lg">{fmt(tax.total_tax_due)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ===== JOURNAL ENTRIES ===== */}
        <TabsContent value="journal">
          {journal && (
            <div className="space-y-6">
              <DateNav label={new Date(reportDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} onPrev={() => navDate(-1)} onNext={() => navDate(1)} testId="journal" />

              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Total Debits (Cash In)" value={fmt(journal.total_debits)} icon={<ArrowUpRight className="w-5 h-5" />} color="green" />
                <StatCard label="Total Credits (Cash Out)" value={fmt(journal.total_credits)} icon={<ArrowDownRight className="w-5 h-5" />} color="red" />
              </div>

              <Card data-testid="journal-entries-card">
                <CardHeader>
                  <CardTitle className="text-lg">General Ledger Journal Entries</CardTitle>
                  <CardDescription>Double-entry bookkeeping for {reportDate}</CardDescription>
                </CardHeader>
                <CardContent>
                  {journal.entries.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Debit Account</TableHead>
                          <TableHead>Credit Account</TableHead>
                          <TableHead className="text-right font-semibold">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {journal.entries.map((e, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{e.date}</TableCell>
                            <TableCell className="text-sm font-medium max-w-xs truncate">{e.description}</TableCell>
                            <TableCell>
                              <JournalTypeBadge type={e.type} />
                            </TableCell>
                            <TableCell className="text-sm">{e.debit_account}</TableCell>
                            <TableCell className="text-sm">{e.credit_account}</TableCell>
                            <TableCell className="text-right font-medium">{fmt(e.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No journal entries for this date</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Monthly Summary Card (always visible at bottom) */}
      {monthly && (
        <Card data-testid="monthly-summary-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Monthly Summary — {new Date(reportMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</CardTitle>
                <CardDescription>Ala. Code § 5-19A-7 compliant revenue separation</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navMonth(-1)}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => navMonth(1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <MonthlyStat label="Loans Written" value={monthly.loans_written} sub={fmt(monthly.total_loaned)} />
              <MonthlyStat label="Buys Made" value={monthly.buys_made} sub={fmt(monthly.total_bought)} />
              <MonthlyStat label="Redemptions" value={monthly.redemptions} sub={`Principal: ${fmt(monthly.principal_collected)}`} />
              <MonthlyStat label="Interest Income" value={fmt(monthly.interest_collected)} sub="Service Charges" highlight />
              <MonthlyStat label="Retail Revenue" value={fmt(monthly.retail_revenue)} sub={`Tax: ${fmt(monthly.sales_tax_collected)}`} />
              <MonthlyStat label="Net Income" value={fmt(monthly.net_income)} sub={`Revenue: ${fmt(monthly.total_revenue)}`} highlight={monthly.net_income >= 0} negative={monthly.net_income < 0} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ===== Helper Components ===== */

const DateNav = ({ label, onPrev, onNext, testId }) => (
  <div className="flex items-center justify-center gap-4">
    <Button variant="outline" size="sm" onClick={onPrev} data-testid={`${testId}-prev`}>
      <ChevronLeft className="w-4 h-4" />
    </Button>
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-500" />
      <span className="font-medium text-sm">{label}</span>
    </div>
    <Button variant="outline" size="sm" onClick={onNext} data-testid={`${testId}-next`}>
      <ChevronRight className="w-4 h-4" />
    </Button>
  </div>
);

const colorMap = {
  blue: { bg: 'bg-blue-100', text: 'text-[rgb(37, 99, 235)]' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const StatCard = ({ label, value, icon, color = 'blue', sub }) => {
  const c = colorMap[color] || colorMap.blue;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 ${c.bg} rounded-xl`}>
            <div className={c.text}>{icon}</div>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">{label}</p>
            <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SnapshotRow = ({ label, desc, amount, negative, highlight }) => (
  <TableRow className={highlight ? 'bg-purple-50' : ''}>
    <TableCell className={`font-medium ${highlight ? 'text-purple-900' : ''}`}>{label}</TableCell>
    <TableCell className={`text-sm ${highlight ? 'text-purple-700' : 'text-gray-500'}`}>{desc}</TableCell>
    <TableCell className={`text-right font-medium ${negative ? 'text-red-600' : highlight ? 'text-purple-700 font-bold' : ''}`}>
      {negative && amount !== 0 ? `(${Math.abs(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })})` : amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
    </TableCell>
  </TableRow>
);

const ProgressBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium w-32">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold w-12 text-right">{count}</span>
    </div>
  );
};

const JournalTypeBadge = ({ type }) => {
  const styles = {
    pawn_loan: 'bg-blue-100 text-blue-700',
    buy: 'bg-amber-100 text-amber-700',
    redemption: 'bg-green-100 text-green-700',
    interest: 'bg-purple-100 text-purple-700',
  };
  const labels = {
    pawn_loan: 'Loan',
    buy: 'Buy',
    redemption: 'Redemption',
    interest: 'Interest',
  };
  return (
    <Badge className={`${styles[type] || 'bg-gray-100 text-gray-700'} text-xs`}>
      {labels[type] || type}
    </Badge>
  );
};

const MonthlyStat = ({ label, value, sub, highlight, negative }) => (
  <div className={`p-3 rounded-lg ${negative ? 'bg-red-50' : highlight ? 'bg-green-50' : 'bg-gray-50'}`}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className={`text-lg font-bold ${negative ? 'text-red-700' : highlight ? 'text-green-700' : 'text-gray-900'}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export default AdminAccounting;
