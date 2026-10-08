import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Download,
  Handshake,
  Package,
  RefreshCw,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  formatReportChange,
  formatReportCurrency,
  formatReportNumber,
  getMarketplaceReport,
  getReportErrorMessage,
  type MarketplaceReport as MarketplaceReportData,
  type ReportMetric,
  type ReportRange,
} from "../../services/reports/report.service";

const MarketplaceReport = () => {
  const [range, setRange] = useState<ReportRange>("30d");
  const [report, setReport] = useState<MarketplaceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        setReport(await getMarketplaceReport(range));
      } catch (loadError) {
        setReport(null);
        setError(getReportErrorMessage(loadError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const totalCategoryRevenue = useMemo(
    () =>
      report?.topCategories.reduce(
        (total, category) => total + category.revenue,
        0
      ) ?? 0,
    [report]
  );

  const metrics = useMemo(() => {
    if (!report) {
      return [];
    }

    return [
      {
        label: "Marketplace Revenue",
        metric: report.metrics.marketplaceRevenue,
        value: formatReportCurrency(report.metrics.marketplaceRevenue.value),
        icon: <TrendingUp size={20} />,
        iconClass: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
      },
      {
        label: "Orders",
        metric: report.metrics.orders,
        value: formatReportNumber(report.metrics.orders.value),
        icon: <ShoppingCart size={20} />,
        iconClass: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
      },
      {
        label: "New Users",
        metric: report.metrics.newUsers,
        value: formatReportNumber(report.metrics.newUsers.value),
        icon: <Users size={20} />,
        iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      },
      {
        label: "Active Suppliers",
        metric: report.metrics.activeSuppliers,
        value: formatReportNumber(report.metrics.activeSuppliers.value),
        icon: <Building2 size={20} />,
        iconClass: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
      },
    ];
  }, [report]);

  const activityItems = report
    ? [
        { label: "Products", value: report.activity.products, icon: <Package size={18} /> },
        { label: "Suppliers", value: report.activity.suppliers, icon: <Store size={18} /> },
        { label: "Installers", value: report.activity.installers, icon: <Wrench size={18} /> },
        { label: "Open Tenders", value: report.activity.openTenders, icon: <Handshake size={18} /> },
        { label: "Active Deals", value: report.activity.activeDeals, icon: <TrendingUp size={18} /> },
        { label: "Registered Users", value: report.activity.registeredUsers, icon: <Users size={18} /> },
      ]
    : [];

  const exportReport = () => {
    if (!report) {
      return;
    }

    const rows: Array<Array<string | number>> = [
      ["Solar Trade Hub Marketplace Report", range],
      [],
      ["Metric", "Value", "Previous", "Change %"],
      ["Marketplace Revenue", report.metrics.marketplaceRevenue.value, report.metrics.marketplaceRevenue.previousValue, report.metrics.marketplaceRevenue.changePct ?? ""],
      ["Orders", report.metrics.orders.value, report.metrics.orders.previousValue, report.metrics.orders.changePct ?? ""],
      ["New Users", report.metrics.newUsers.value, report.metrics.newUsers.previousValue, report.metrics.newUsers.changePct ?? ""],
      ["Active Suppliers", report.metrics.activeSuppliers.value, report.metrics.activeSuppliers.previousValue, report.metrics.activeSuppliers.changePct ?? ""],
      [],
      ["Category", "Unique Products Ordered", "Orders", "Paid Revenue"],
      ...report.topCategories.map((category) => [category.name, category.products, category.orders, category.revenue]),
    ];

    downloadCsv(`marketplace-report-${range}.csv`, rows);
  };

  return (
    <>
      <PageMeta
        title="Marketplace Report | Solar Trade Hub"
        description="Solar Trade Hub marketplace performance report."
      />
      <PageBreadcrumb pageTitle="Marketplace Report" />

      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />
            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <BarChart3 size={23} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                    Reports
                  </p>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Marketplace Performance
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Real marketplace activity across suppliers, installers, tenders, deals, users and orders.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={range}
                  onChange={(event) => setRange(event.target.value as ReportRange)}
                  className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="year">This Year</option>
                </select>

                <button
                  type="button"
                  onClick={() => void load(true)}
                  disabled={refreshing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={exportReport}
                  disabled={!report}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingBlock />
        ) : report ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((item) => (
                <MetricCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  metric={item.metric}
                  icon={item.icon}
                  iconClass={item.iconClass}
                />
              ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Marketplace Snapshot</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Current live totals across Solar Trade Hub modules.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
                {activityItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
                        {item.icon}
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.value === null ? "Unavailable" : formatReportNumber(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Marketplace Categories</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Order-snapshot performance for the selected period.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <CalendarDays size={15} /> Selected reporting period
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                    <tr>
                      <TableHeading>Category</TableHeading>
                      <TableHeading align="right">Unique Products</TableHeading>
                      <TableHeading align="right">Orders</TableHeading>
                      <TableHeading align="right">Paid Revenue</TableHeading>
                      <TableHeading>Revenue Share</TableHeading>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {report.topCategories.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">No order category data is available for this period.</td></tr>
                    ) : report.topCategories.map((category) => {
                      const share = totalCategoryRevenue > 0 ? (category.revenue / totalCategoryRevenue) * 100 : 0;
                      return (
                        <tr key={category.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                          <td className="px-5 py-4 sm:px-6">
                            <div className="flex min-w-[180px] items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"><Package size={16} /></div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{category.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right text-sm text-gray-600 dark:text-gray-400">{formatReportNumber(category.products)}</td>
                          <td className="px-5 py-4 text-right text-sm text-gray-600 dark:text-gray-400">{formatReportNumber(category.orders)}</td>
                          <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">{formatReportCurrency(category.revenue)}</td>
                          <td className="px-5 py-4">
                            <div className="min-w-[160px]">
                              <div className="mb-2 flex items-center justify-between text-xs"><span className="text-gray-500 dark:text-gray-400">Share</span><span className="font-semibold text-gray-700 dark:text-gray-300">{share.toFixed(1)}%</span></div>
                              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-purple-600" style={{ width: `${Math.min(share, 100)}%` }} /></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ReportCard title="Marketplace Supply" description="Current supplier-side marketplace coverage.">
                <ReportLine label="Active Suppliers" value={formatReportNumber(report.supply.activeSuppliers)} />
                <ReportLine label="Verified Suppliers" value={formatReportNumber(report.supply.verifiedSuppliers)} />
                <ReportLine label="Registered Installers" value={formatReportNumber(report.supply.registeredInstallers)} />
                <ReportLine label="Installer Applications" value={formatReportNumber(report.supply.installerApplications)} />
              </ReportCard>

              <ReportCard title="Marketplace Demand" description="Buyer and transaction activity in the selected period.">
                <ReportLine label="Orders" value={formatReportNumber(report.demand.orders)} />
                <ReportLine label="Open Tenders" value={formatReportNumber(report.demand.openTenders)} />
                <ReportLine label="Active Deals" value={formatReportNumber(report.demand.activeDeals)} />
                <ReportLine label="New Users" value={formatReportNumber(report.demand.newUsers)} />
              </ReportCard>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

const MetricCard = ({
  label,
  value,
  metric,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  metric: ReportMetric;
  icon: React.ReactNode;
  iconClass: string;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        <p className={`mt-2 text-xs font-semibold ${metric.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {formatReportChange(metric.changePct)} vs previous period
        </p>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>{icon}</div>
    </div>
  </div>
);

const ReportCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <div className="divide-y divide-gray-200 px-5 dark:divide-gray-800 sm:px-6">{children}</div>
  </div>
);

const ReportLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 py-4">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
  </div>
);

const LoadingBlock = () => (
  <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
    Loading marketplace report...
  </div>
);

const TableHeading = ({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) => (
  <th className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6 ${align === "right" ? "text-right" : "text-left"}`}>
    {children}
  </th>
);

const downloadCsv = (
  filename: string,
  rows: Array<Array<string | number>>
) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export default MarketplaceReport;
