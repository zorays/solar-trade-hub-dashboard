import {
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
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wrench,
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

type MarketplaceMetric = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
};

type ActivityItem = {
  id: string;
  label: string;
  value: string;
};

type TopCategory = {
  id: string;
  name: string;
  products: number;
  orders: number;
  revenue: number;
};

/* =========================================================
   DUMMY MARKETPLACE REPORT DATA
========================================================= */

const metricsByRange: Record<
  ReportRange,
  MarketplaceMetric[]
> = {
  "7d": [
    {
      label: "Marketplace Revenue",
      value: "PKR 4.85M",
      change: "+8.2%",
      positive: true,
    },
    {
      label: "Orders",
      value: "128",
      change: "+6.4%",
      positive: true,
    },
    {
      label: "New Users",
      value: "94",
      change: "+11.1%",
      positive: true,
    },
    {
      label: "Active Suppliers",
      value: "76",
      change: "+2.7%",
      positive: true,
    },
  ],

  "30d": [
    {
      label: "Marketplace Revenue",
      value: "PKR 18.4M",
      change: "+12.6%",
      positive: true,
    },
    {
      label: "Orders",
      value: "486",
      change: "+9.3%",
      positive: true,
    },
    {
      label: "New Users",
      value: "371",
      change: "+14.8%",
      positive: true,
    },
    {
      label: "Active Suppliers",
      value: "82",
      change: "+4.2%",
      positive: true,
    },
  ],

  "90d": [
    {
      label: "Marketplace Revenue",
      value: "PKR 51.7M",
      change: "+18.1%",
      positive: true,
    },
    {
      label: "Orders",
      value: "1,382",
      change: "+13.7%",
      positive: true,
    },
    {
      label: "New Users",
      value: "1,026",
      change: "+21.4%",
      positive: true,
    },
    {
      label: "Active Suppliers",
      value: "91",
      change: "+7.6%",
      positive: true,
    },
  ],

  year: [
    {
      label: "Marketplace Revenue",
      value: "PKR 168.9M",
      change: "+26.8%",
      positive: true,
    },
    {
      label: "Orders",
      value: "4,947",
      change: "+22.3%",
      positive: true,
    },
    {
      label: "New Users",
      value: "3,864",
      change: "+31.5%",
      positive: true,
    },
    {
      label: "Active Suppliers",
      value: "106",
      change: "+12.2%",
      positive: true,
    },
  ],
};

const activityItems: ActivityItem[] = [
  {
    id: "activity-001",
    label: "Products",
    value: "1,284",
  },
  {
    id: "activity-002",
    label: "Suppliers",
    value: "106",
  },
  {
    id: "activity-003",
    label: "Installers",
    value: "73",
  },
  {
    id: "activity-004",
    label: "Open Tenders",
    value: "34",
  },
  {
    id: "activity-005",
    label: "Active Deals",
    value: "19",
  },
  {
    id: "activity-006",
    label: "Registered Users",
    value: "5,428",
  },
];

const topCategories: TopCategory[] = [
  {
    id: "category-001",
    name: "Solar Panels",
    products: 326,
    orders: 184,
    revenue: 8_950_000,
  },
  {
    id: "category-002",
    name: "Hybrid Inverters",
    products: 214,
    orders: 132,
    revenue: 5_720_000,
  },
  {
    id: "category-003",
    name: "Lithium Batteries",
    products: 176,
    orders: 106,
    revenue: 4_860_000,
  },
  {
    id: "category-004",
    name: "On-Grid Inverters",
    products: 143,
    orders: 79,
    revenue: 3_180_000,
  },
  {
    id: "category-005",
    name: "Solar Accessories",
    products: 227,
    orders: 61,
    revenue: 1_940_000,
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

const MarketplaceReport = () => {
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

  const totalCategoryRevenue =
    useMemo(
      () =>
        topCategories.reduce(
          (
            total,
            category
          ) =>
            total +
            category.revenue,
          0
        ),
      []
    );

  return (
    <>
      <PageMeta
        title="Marketplace Report | Solar Trade Hub"
        description="Solar Trade Hub marketplace performance report."
      />

      <PageBreadcrumb
        pageTitle="Marketplace Report"
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
                  <BarChart3
                    size={23}
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                    Reports
                  </p>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Marketplace
                    Performance
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Overall Solar Trade
                    Hub marketplace
                    activity across
                    products, suppliers,
                    installers, tenders,
                    deals and orders.
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
                      "Report export will be connected with the backend later."
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
            TOP METRICS
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
                    <TrendingUp
                      size={20}
                    />
                  ) : index ===
                    1 ? (
                    <ShoppingCart
                      size={20}
                    />
                  ) : index ===
                    2 ? (
                    <Users
                      size={20}
                    />
                  ) : (
                    <Building2
                      size={20}
                    />
                  )
                }
                iconClass={
                  index === 0
                    ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                    : index === 1
                      ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                      : index === 2
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        : "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                }
              />
            )
          )}
        </div>

        {/* =====================================================
            MARKETPLACE SNAPSHOT
        ====================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Marketplace Snapshot
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Current activity across
              Solar Trade Hub modules.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {activityItems.map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    item.id
                  }
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
                      {index ===
                      0 ? (
                        <Package
                          size={
                            18
                          }
                        />
                      ) : index ===
                        1 ? (
                        <Store
                          size={
                            18
                          }
                        />
                      ) : index ===
                        2 ? (
                        <Wrench
                          size={
                            18
                          }
                        />
                      ) : index ===
                        3 ? (
                        <Handshake
                          size={
                            18
                          }
                        />
                      ) : index ===
                        4 ? (
                        <TrendingUp
                          size={
                            18
                          }
                        />
                      ) : (
                        <Users
                          size={
                            18
                          }
                        />
                      )}
                    </div>

                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {
                        item.label
                      }
                    </p>
                  </div>

                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {
                      item.value
                    }
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* =====================================================
            CATEGORY PERFORMANCE
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Top Marketplace
                Categories
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Product and order
                performance by solar
                category.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <CalendarDays
                size={15}
              />

              Selected reporting
              period
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <TableHeading>
                    Category
                  </TableHeading>

                  <TableHeading align="right">
                    Products
                  </TableHeading>

                  <TableHeading align="right">
                    Orders
                  </TableHeading>

                  <TableHeading align="right">
                    Revenue
                  </TableHeading>

                  <TableHeading>
                    Revenue Share
                  </TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {topCategories.map(
                  (
                    category
                  ) => {
                    const share =
                      totalCategoryRevenue >
                      0
                        ? (
                            category.revenue /
                            totalCategoryRevenue
                          ) *
                          100
                        : 0;

                    return (
                      <tr
                        key={
                          category.id
                        }
                        className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex min-w-[180px] items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                              <Package
                                size={
                                  16
                                }
                              />
                            </div>

                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {
                                category.name
                              }
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
                          {
                            category.products
                          }
                        </td>

                        <td className="px-5 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
                          {
                            category.orders
                          }
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(
                            category.revenue
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[180px]">
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span className="text-gray-500 dark:text-gray-400">
                                Share
                              </span>

                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {share.toFixed(
                                  1
                                )}
                                %
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-purple-600"
                                style={{
                                  width: `${Math.min(
                                    share,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================
            BUSINESS FLOW
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ReportCard
            title="Marketplace Supply"
            description="Current supplier-side marketplace coverage."
          >
            <ReportLine
              label="Active Suppliers"
              value="106"
            />

            <ReportLine
              label="Verified Suppliers"
              value="82"
            />

            <ReportLine
              label="Registered Installers"
              value="73"
            />

            <ReportLine
              label="Installer Applications"
              value="18"
            />
          </ReportCard>

          <ReportCard
            title="Marketplace Demand"
            description="Buyer and transaction activity."
          >
            <ReportLine
              label="Orders"
              value={
                metrics[1]
                  .value
              }
            />

            <ReportLine
              label="Open Tenders"
              value="34"
            />

            <ReportLine
              label="Active Deals"
              value="19"
            />

            <ReportLine
              label="New Users"
              value={
                metrics[2]
                  .value
              }
            />
          </ReportCard>
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
  metric: MarketplaceMetric;
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
   REPORT CARD
========================================================= */

const ReportCard = ({
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

      <div className="p-5 sm:p-6">
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   REPORT LINE
========================================================= */

const ReportLine = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-800">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {label}
      </p>

      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
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

export default MarketplaceReport;