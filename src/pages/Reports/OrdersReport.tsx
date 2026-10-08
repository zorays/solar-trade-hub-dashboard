import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  WalletCards,
  XCircle,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  formatReportChange,
  formatReportCurrency,
  formatReportNumber,
  getOrdersReport,
  getReportErrorMessage,
  type OrdersReport as OrdersReportData,
  type ReportMetric,
  type ReportRange,
} from "../../services/reports/report.service";

const OrdersReport = () => {
  const [range, setRange] = useState<ReportRange>("30d");
  const [report, setReport] = useState<OrdersReportData | null>(null);
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
        setReport(await getOrdersReport(range));
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

  const maxOrders = useMemo(
    () => Math.max(1, ...(report?.monthlyOrders.map((item) => item.orders) ?? [1])),
    [report]
  );

  const metrics = useMemo(() => {
    if (!report) {
      return [];
    }

    return [
      {
        label: "Total Orders",
        value: formatReportNumber(report.metrics.totalOrders.value),
        metric: report.metrics.totalOrders,
        icon: <ShoppingCart size={20} />,
        iconClass: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
      },
      {
        label: "Completed Orders",
        value: formatReportNumber(report.metrics.completedOrders.value),
        metric: report.metrics.completedOrders,
        icon: <CheckCircle2 size={20} />,
        iconClass: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
      },
      {
        label: "Order Revenue",
        value: formatReportCurrency(report.metrics.orderRevenue.value),
        metric: report.metrics.orderRevenue,
        icon: <WalletCards size={20} />,
        iconClass: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
      },
      {
        label: "Average Order Value",
        value: formatReportCurrency(report.metrics.averageOrderValue.value),
        metric: report.metrics.averageOrderValue,
        icon: <TrendingUp size={20} />,
        iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      },
    ];
  }, [report]);

  const exportReport = () => {
    if (!report) {
      return;
    }

    const rows: Array<Array<string | number>> = [
      ["Solar Trade Hub Orders Report", range],
      [],
      ["Metric", "Value", "Previous", "Change %"],
      ["Total Orders", report.metrics.totalOrders.value, report.metrics.totalOrders.previousValue, report.metrics.totalOrders.changePct ?? ""],
      ["Completed Orders", report.metrics.completedOrders.value, report.metrics.completedOrders.previousValue, report.metrics.completedOrders.changePct ?? ""],
      ["Paid Revenue", report.metrics.orderRevenue.value, report.metrics.orderRevenue.previousValue, report.metrics.orderRevenue.changePct ?? ""],
      ["Average Order Value", report.metrics.averageOrderValue.value, report.metrics.averageOrderValue.previousValue, report.metrics.averageOrderValue.changePct ?? ""],
      [],
      ["Category", "Orders", "Paid Revenue", "Average Order"],
      ...report.categoryOrders.map((category) => [category.name, category.orders, category.revenue, category.averageOrder]),
    ];

    downloadCsv(`orders-report-${range}.csv`, rows);
  };

  return (
    <>
      <PageMeta
        title="Orders Report | Solar Trade Hub"
        description="Solar Trade Hub order performance report."
      />
      <PageBreadcrumb pageTitle="Orders Report" />

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
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">Reports</p>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Order Performance</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Real order volume, completion, payment and revenue performance from marketplace orders.
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
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
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
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">Loading orders report...</div>
        ) : report ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((item) => (
                <MetricCard key={item.label} {...item} />
              ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Monthly Orders</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Latest six calendar months from real Order records.</p>
              </div>
              <div className="flex h-[260px] items-end gap-3 p-5 sm:gap-6 sm:p-6">
                {report.monthlyOrders.map((item) => {
                  const height = (item.orders / maxOrders) * 100;
                  return (
                    <div key={item.key} className="flex flex-1 flex-col items-center justify-end">
                      <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">{formatReportNumber(item.orders)}</p>
                      <div className="flex h-44 w-full max-w-[70px] items-end overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
                        <div className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-purple-600" style={{ height: `${height}%` }} />
                      </div>
                      <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <StatusCard title="Order Status" description="Order-state distribution for the selected reporting period.">
                {report.statusBreakdown.map((item) => (
                  <ProgressRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    percentage={item.percentage}
                    icon={item.label === "Completed" ? <CheckCircle2 size={15} /> : item.label === "Cancelled" || item.label === "Failed" ? <XCircle size={15} /> : <Clock3 size={15} />}
                  />
                ))}
              </StatusCard>

              <StatusCard title="Payment Status" description="Payment-state distribution for the selected reporting period.">
                {report.paymentBreakdown.map((item) => (
                  <ProgressRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    percentage={item.percentage}
                    icon={item.label === "Paid" ? <CheckCircle2 size={15} /> : item.label === "Failed" ? <XCircle size={15} /> : <CreditCard size={15} />}
                  />
                ))}
              </StatusCard>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Order Performance by Category</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Paid revenue and order activity from captured product snapshots.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                    <tr>
                      <TableHeading>Category</TableHeading>
                      <TableHeading align="right">Orders</TableHeading>
                      <TableHeading align="right">Paid Revenue</TableHeading>
                      <TableHeading align="right">Average Order</TableHeading>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {report.categoryOrders.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">No category order data is available for this period.</td></tr>
                    ) : report.categoryOrders.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex min-w-[180px] items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"><ShoppingCart size={16} /></div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{category.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">{formatReportNumber(category.orders)}</td>
                        <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">{formatReportCurrency(category.revenue)}</td>
                        <td className="px-5 py-4 text-right text-sm text-gray-600 dark:text-gray-400">{formatReportCurrency(category.averageOrder)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

const MetricCard = ({ label, value, metric, icon, iconClass }: { label: string; value: string; metric: ReportMetric; icon: React.ReactNode; iconClass: string }) => (
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

const StatusCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <div className="space-y-5 p-5 sm:p-6">{children}</div>
  </div>
);

const ProgressRow = ({ label, value, percentage, icon }: { label: string; value: number; percentage: number; icon: React.ReactNode }) => (
  <div>
    <div className="mb-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">{icon}{label}</div>
      <div className="text-right"><span className="text-sm font-semibold text-gray-900 dark:text-white">{formatReportNumber(value)}</span><span className="ml-2 text-xs text-gray-500">{percentage.toFixed(1)}%</span></div>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-purple-600" style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }} /></div>
  </div>
);

const TableHeading = ({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) => (
  <th className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6 ${align === "right" ? "text-right" : "text-left"}`}>{children}</th>
);

const downloadCsv = (
  filename: string,
  rows: Array<Array<string | number>>
) => {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
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

export default OrdersReport;
