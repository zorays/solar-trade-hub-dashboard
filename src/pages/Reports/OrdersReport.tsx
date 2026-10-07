import {
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

/* =========================================================
   TYPES
========================================================= */

type ReportRange =
  | "7d"
  | "30d"
  | "90d"
  | "year";

type OrderMetric = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
};

type StatusBreakdown = {
  label: string;
  value: number;
  percentage: number;
};

type PaymentBreakdown = {
  label: string;
  value: number;
  percentage: number;
};

type CategoryOrder = {
  id: string;
  category: string;
  orders: number;
  revenue: number;
  averageOrder: number;
};

type MonthlyOrderData = {
  label: string;
  orders: number;
};

/* =========================================================
   DUMMY REPORT DATA
========================================================= */

const metricsByRange: Record<
  ReportRange,
  OrderMetric[]
> = {
  "7d": [
    {
      label: "Total Orders",
      value: "128",
      change: "+6.4%",
      positive: true,
    },
    {
      label: "Completed Orders",
      value: "93",
      change: "+8.7%",
      positive: true,
    },
    {
      label: "Order Revenue",
      value: "PKR 4.85M",
      change: "+8.2%",
      positive: true,
    },
    {
      label: "Average Order Value",
      value: "PKR 37,890",
      change: "+1.7%",
      positive: true,
    },
  ],

  "30d": [
    {
      label: "Total Orders",
      value: "486",
      change: "+9.3%",
      positive: true,
    },
    {
      label: "Completed Orders",
      value: "372",
      change: "+11.2%",
      positive: true,
    },
    {
      label: "Order Revenue",
      value: "PKR 18.4M",
      change: "+12.6%",
      positive: true,
    },
    {
      label: "Average Order Value",
      value: "PKR 37,860",
      change: "+3.1%",
      positive: true,
    },
  ],

  "90d": [
    {
      label: "Total Orders",
      value: "1,382",
      change: "+13.7%",
      positive: true,
    },
    {
      label: "Completed Orders",
      value: "1,094",
      change: "+15.4%",
      positive: true,
    },
    {
      label: "Order Revenue",
      value: "PKR 51.7M",
      change: "+18.1%",
      positive: true,
    },
    {
      label: "Average Order Value",
      value: "PKR 37,410",
      change: "+4.5%",
      positive: true,
    },
  ],

  year: [
    {
      label: "Total Orders",
      value: "4,947",
      change: "+22.3%",
      positive: true,
    },
    {
      label: "Completed Orders",
      value: "3,986",
      change: "+24.8%",
      positive: true,
    },
    {
      label: "Order Revenue",
      value: "PKR 168.9M",
      change: "+26.8%",
      positive: true,
    },
    {
      label: "Average Order Value",
      value: "PKR 34,140",
      change: "+6.2%",
      positive: true,
    },
  ],
};

const orderStatusData: StatusBreakdown[] = [
  {
    label: "Completed",
    value: 372,
    percentage: 76.5,
  },
  {
    label: "Processing",
    value: 61,
    percentage: 12.6,
  },
  {
    label: "Pending",
    value: 38,
    percentage: 7.8,
  },
  {
    label: "Cancelled",
    value: 15,
    percentage: 3.1,
  },
];

const paymentStatusData: PaymentBreakdown[] = [
  {
    label: "Paid",
    value: 401,
    percentage: 82.5,
  },
  {
    label: "Pending",
    value: 67,
    percentage: 13.8,
  },
  {
    label: "Failed",
    value: 18,
    percentage: 3.7,
  },
];

const categoryOrders: CategoryOrder[] = [
  {
    id: "category-order-001",
    category: "Solar Panels",
    orders: 184,
    revenue: 8_950_000,
    averageOrder: 48_641,
  },
  {
    id: "category-order-002",
    category: "Hybrid Inverters",
    orders: 132,
    revenue: 5_720_000,
    averageOrder: 43_333,
  },
  {
    id: "category-order-003",
    category: "Lithium Batteries",
    orders: 106,
    revenue: 4_860_000,
    averageOrder: 45_849,
  },
  {
    id: "category-order-004",
    category: "On-Grid Inverters",
    orders: 79,
    revenue: 3_180_000,
    averageOrder: 40_253,
  },
  {
    id: "category-order-005",
    category: "Solar Accessories",
    orders: 61,
    revenue: 1_940_000,
    averageOrder: 31_803,
  },
];

const monthlyOrders: MonthlyOrderData[] = [
  {
    label: "Apr",
    orders: 338,
  },
  {
    label: "May",
    orders: 361,
  },
  {
    label: "Jun",
    orders: 389,
  },
  {
    label: "Jul",
    orders: 417,
  },
  {
    label: "Aug",
    orders: 452,
  },
  {
    label: "Sep",
    orders: 486,
  },
];

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (
  value: number
) => {
  return new Intl.NumberFormat(
    "en-PK",
    {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }
  ).format(value);
};

/* =========================================================
   PAGE
========================================================= */

const OrdersReport = () => {
  const [
    range,
    setRange,
  ] =
    useState<ReportRange>(
      "30d"
    );

  const metrics =
    useMemo(
      () =>
        metricsByRange[
          range
        ],
      [range]
    );

  const maxOrders =
    useMemo(
      () =>
        Math.max(
          ...monthlyOrders.map(
            (item) =>
              item.orders
          )
        ),
      []
    );

  return (
    <>
      <PageMeta
        title="Orders Report | Solar Trade Hub"
        description="Solar Trade Hub order performance report."
      />

      <PageBreadcrumb
        pageTitle="Orders Report"
      />

      <div className="space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <ShoppingCart
                    size={23}
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                    Reports
                  </p>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Order Performance
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Track Solar Trade Hub
                    orders, payments,
                    completion rates and
                    marketplace revenue.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={range}
                  onChange={(
                    event
                  ) =>
                    setRange(
                      event.target
                        .value as ReportRange
                    )
                  }
                  className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="7d">
                    Last 7 Days
                  </option>

                  <option value="30d">
                    Last 30 Days
                  </option>

                  <option value="90d">
                    Last 90 Days
                  </option>

                  <option value="year">
                    This Year
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() =>
                    window.alert(
                      "Orders report export will be connected with the backend later."
                    )
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <Download
                    size={16}
                  />

                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            METRICS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(
            (
              metric,
              index
            ) => (
              <MetricCard
                key={
                  metric.label
                }
                metric={
                  metric
                }
                icon={
                  index === 0 ? (
                    <ShoppingCart
                      size={20}
                    />
                  ) : index ===
                    1 ? (
                    <PackageCheck
                      size={20}
                    />
                  ) : index ===
                    2 ? (
                    <TrendingUp
                      size={20}
                    />
                  ) : (
                    <CreditCard
                      size={20}
                    />
                  )
                }
                iconClass={
                  index === 0
                    ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                    : index === 1
                      ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                      : index === 2
                        ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                        : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                }
              />
            )
          )}
        </div>

        {/* =====================================================
            ORDER TREND
        ====================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Order Trend
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Monthly marketplace order
                activity.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <CalendarDays
                size={14}
              />

              Last 6 Months
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex h-64 items-end gap-3 sm:gap-6">
              {monthlyOrders.map(
                (item) => {
                  const height =
                    maxOrders >
                    0
                      ? (
                          item.orders /
                          maxOrders
                        ) *
                        100
                      : 0;

                  return (
                    <div
                      key={
                        item.label
                      }
                      className="flex flex-1 flex-col items-center justify-end"
                    >
                      <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {
                          item.orders
                        }
                      </p>

                      <div className="flex h-44 w-full max-w-[70px] items-end overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-purple-600"
                          style={{
                            height: `${height}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {
                          item.label
                        }
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            STATUS + PAYMENT
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <StatusCard
            title="Order Status"
            description="Current marketplace order status distribution."
          >
            {orderStatusData.map(
              (item) => (
                <ProgressRow
                  key={
                    item.label
                  }
                  label={
                    item.label
                  }
                  value={
                    item.value
                  }
                  percentage={
                    item.percentage
                  }
                  icon={
                    item.label ===
                    "Completed" ? (
                      <CheckCircle2
                        size={15}
                      />
                    ) : item.label ===
                      "Cancelled" ? (
                      <XCircle
                        size={15}
                      />
                    ) : (
                      <Clock3
                        size={15}
                      />
                    )
                  }
                />
              )
            )}
          </StatusCard>

          <StatusCard
            title="Payment Status"
            description="Payment completion across marketplace orders."
          >
            {paymentStatusData.map(
              (item) => (
                <ProgressRow
                  key={
                    item.label
                  }
                  label={
                    item.label
                  }
                  value={
                    item.value
                  }
                  percentage={
                    item.percentage
                  }
                  icon={
                    item.label ===
                    "Paid" ? (
                      <CheckCircle2
                        size={15}
                      />
                    ) : item.label ===
                      "Failed" ? (
                      <XCircle
                        size={15}
                      />
                    ) : (
                      <CreditCard
                        size={15}
                      />
                    )
                  }
                />
              )
            )}
          </StatusCard>
        </div>

        {/* =====================================================
            CATEGORY PERFORMANCE
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Order Performance by
              Category
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Revenue and order activity
              across major Solar Trade Hub
              product categories.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <TableHeading>
                    Category
                  </TableHeading>

                  <TableHeading align="right">
                    Orders
                  </TableHeading>

                  <TableHeading align="right">
                    Revenue
                  </TableHeading>

                  <TableHeading align="right">
                    Average Order
                  </TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {categoryOrders.map(
                  (
                    category
                  ) => (
                    <tr
                      key={
                        category.id
                      }
                      className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex min-w-[180px] items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                            <ShoppingCart
                              size={
                                16
                              }
                            />
                          </div>

                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {
                              category.category
                            }
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {
                          category.orders
                        }
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(
                          category.revenue
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(
                          category.averageOrder
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   METRIC CARD
========================================================= */

const MetricCard = ({
  metric,
  icon,
  iconClass,
}: {
  metric: OrderMetric;
  icon: React.ReactNode;
  iconClass: string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {metric.label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {metric.value}
          </p>

          <p
            className={`mt-2 text-xs font-semibold ${
              metric.positive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {metric.change} vs
            previous period
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   STATUS CARD
========================================================= */

const StatusCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};

/* =========================================================
   PROGRESS ROW
========================================================= */

const ProgressRow = ({
  label,
  value,
  percentage,
  icon,
}: {
  label: string;
  value: number;
  percentage: number;
  icon: React.ReactNode;
}) => {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-purple-600 dark:text-purple-400">
            {icon}
          </span>

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>

        <div className="text-right">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {value.toLocaleString(
              "en-PK"
            )}
          </span>

          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            {percentage}%
          </span>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-purple-600"
          style={{
            width: `${Math.min(
              percentage,
              100
            )}%`,
          }}
        />
      </div>
    </div>
  );
};

/* =========================================================
   TABLE HEADING
========================================================= */

const TableHeading = ({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) => {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
};

export default OrdersReport;