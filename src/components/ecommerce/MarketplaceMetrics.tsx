import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";

import {
  formatDashboardChange,
  formatDashboardMonthNote,
  getMarketplaceDashboardMetrics,
  type DashboardMetric,
  type MarketplaceDashboardMetrics,
} from "../../services/reports/report.service";

import {
  getProducts,
} from "../../services/product/product.service";

/* =========================================================
   TYPES
========================================================= */

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  note: string;
  trend?: "up" | "down" | "neutral";
  accent:
    | "orange"
    | "purple"
    | "blue"
    | "green";
  icon: ReactNode;
  bars: number[];
  loading?: boolean;
}

/* =========================================================
   INSTALLER ICON
========================================================= */

function InstallerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-[18px]"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3" />
      <path d="M7 21v-3a5 5 0 0 1 10 0v3" />
      <path d="M9 5 10 2h4l1 3" />
      <path d="M8 6h8" />
    </svg>
  );
}

/* =========================================================
   TENDER ICON
========================================================= */

function TenderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-[18px]"
      aria-hidden="true"
    >
      <path d="M6 3h9l3 3v15H6V3Z" />
      <path d="M15 3v4h4" />
      <path d="M9 11h6M9 15h6" />
    </svg>
  );
}

/* =========================================================
   MINI BARS
========================================================= */

function MiniBars({
  bars,
  accent,
}: {
  bars: number[];
  accent: MetricCardProps["accent"];
}) {
  const color = {
    orange: "bg-[#ff4b1f]",
    purple: "bg-[#7c4dff]",
    blue: "bg-[#3b82f6]",
    green: "bg-[#22c55e]",
  }[accent];

  return (
    <div className="flex h-9 items-end gap-[3px]">
      {bars.map((height, index) => (
        <span
          key={index}
          className={`w-1 rounded-[2px] ${color}`}
          style={{
            height: `${height}%`,
            opacity: Math.min(
              0.35 + index * 0.1,
              1
            ),
          }}
        />
      ))}
    </div>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  title,
  value,
  change,
  note,
  trend,
  accent,
  icon,
  bars,
  loading = false,
}: MetricCardProps) {
  const iconStyle = {
    orange:
      "bg-[#ff4b1f]/10 text-[#ff4b1f]",
    purple:
      "bg-[#5b2eff]/10 text-[#7c4dff]",
    blue:
      "bg-blue-500/10 text-blue-500",
    green:
      "bg-green-500/10 text-green-500",
  }[accent];

  const changeStyle =
    trend === "up"
      ? "text-green-500"
      : trend === "down"
        ? "text-[#ff4b1f]"
        : "text-gray-400 dark:text-gray-500";

  return (
    <div className="relative min-h-[128px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex h-full items-start gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <h3 className="mt-1 text-[26px] font-bold leading-none tracking-tight text-gray-900 dark:text-white">
            {loading ? "..." : value}
          </h3>

          <div className="mt-3 flex items-center gap-1.5">
            {change && trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${changeStyle}`}
              >
                {trend !== "neutral" && (
                  <span className="[&>svg]:size-3">
                    {trend === "up" ? (
                      <ArrowUpIcon />
                    ) : (
                      <ArrowDownIcon />
                    )}
                  </span>
                )}

                {loading ? "..." : change}
              </span>
            )}

            <span className="truncate text-[11px] text-gray-400">
              {loading ? "Loading..." : note}
            </span>
          </div>
        </div>

        <div className="absolute bottom-4 right-4">
          <MiniBars
            bars={bars}
            accent={accent}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY METRIC
========================================================= */

const EMPTY_METRIC: DashboardMetric = {
  value: 0,
  thisMonth: 0,
  lastMonth: 0,
  changePct: 0,
  trend: "up",
};

/* =========================================================
   MARKETPLACE METRICS
========================================================= */

export default function MarketplaceMetrics() {
  const [
    metrics,
    setMetrics,
  ] =
    useState<MarketplaceDashboardMetrics | null>(
      null
    );

  const [
    productTotal,
    setProductTotal,
  ] =
    useState<number | null>(
      null
    );

  const [
    metricsLoading,
    setMetricsLoading,
  ] =
    useState(true);

  const [
    productsLoading,
    setProductsLoading,
  ] =
    useState(true);

  const [
    metricsFailed,
    setMetricsFailed,
  ] =
    useState(false);

  const [
    productsFailed,
    setProductsFailed,
  ] =
    useState(false);

  /* =======================================================
     LOAD DASHBOARD DATA
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadDashboardData =
      async () => {
        setMetricsLoading(true);
        setProductsLoading(true);
        setMetricsFailed(false);
        setProductsFailed(false);

        const [
          metricsResult,
          productsResult,
        ] =
          await Promise.allSettled([
            getMarketplaceDashboardMetrics(),

            getProducts({
              page: 1,
              limit: 1,
            }),
          ]);

        if (!active) {
          return;
        }

        if (
          metricsResult.status ===
          "fulfilled"
        ) {
          setMetrics(
            metricsResult.value
          );
        } else {
          console.error(
            "Failed to load marketplace dashboard metrics:",
            metricsResult.reason
          );

          setMetrics(null);
          setMetricsFailed(true);
        }

        setMetricsLoading(false);

        if (
          productsResult.status ===
          "fulfilled"
        ) {
          const total = Number(
            productsResult.value
              ?.pagination?.total
          );

          if (
            Number.isFinite(total)
          ) {
            setProductTotal(total);
          } else {
            setProductTotal(null);
            setProductsFailed(true);
          }
        } else {
          console.error(
            "Failed to load marketplace product total:",
            productsResult.reason
          );

          setProductTotal(null);
          setProductsFailed(true);
        }

        setProductsLoading(false);
      };

    loadDashboardData();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================================
     REPORT METRICS
  ======================================================= */

  const supplierMetric =
    metrics?.suppliers ||
    EMPTY_METRIC;

  const installerMetric =
    metrics?.verifiedInstallers ||
    EMPTY_METRIC;

  const tenderMetric =
    metrics?.activeTenders ||
    EMPTY_METRIC;

  /* =======================================================
     PRODUCT METRIC

     Current external catalogue API provides current total,
     but no reliable monthly creation history.

     Keep the same metric-card layout without inventing
     percentage growth or monthly additions.
  ======================================================= */

  const productValue =
    productsFailed
      ? "—"
      : (
          productTotal ?? 0
        ).toLocaleString(
          "en-PK"
        );

  const productChange =
    productsFailed
      ? undefined
      : "—";

  const productNote =
    productsFailed
      ? "Unable to load products"
      : "Monthly growth unavailable";

  /* =======================================================
     HELPERS
  ======================================================= */

  const getMetricValue = (
    metric: DashboardMetric
  ) => {
    if (metricsFailed) {
      return "—";
    }

    return metric.value.toLocaleString(
      "en-PK"
    );
  };

  const getMetricChange = (
    metric: DashboardMetric
  ) => {
    if (metricsFailed) {
      return undefined;
    }

    return formatDashboardChange(
      metric
    );
  };

  const getMetricNote = (
    metric: DashboardMetric
  ) => {
    if (metricsFailed) {
      return "Unable to load metric";
    }

    return formatDashboardMonthNote(
      metric.thisMonth
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Total Products"
        value={productValue}
        change={productChange}
        note={productNote}
        trend="neutral"
        accent="orange"
        bars={[
          28,
          40,
          55,
          49,
          72,
          94,
        ]}
        icon={
          <BoxIconLine className="size-[18px]" />
        }
        loading={productsLoading}
      />

      <MetricCard
        title="Registered Suppliers"
        value={getMetricValue(
          supplierMetric
        )}
        change={getMetricChange(
          supplierMetric
        )}
        note={getMetricNote(
          supplierMetric
        )}
        trend={
          supplierMetric.trend
        }
        accent="purple"
        bars={[
          22,
          32,
          43,
          57,
          73,
          91,
        ]}
        icon={
          <GroupIcon className="size-[18px]" />
        }
        loading={metricsLoading}
      />

      <MetricCard
        title="Verified Installers"
        value={getMetricValue(
          installerMetric
        )}
        change={getMetricChange(
          installerMetric
        )}
        note={getMetricNote(
          installerMetric
        )}
        trend={
          installerMetric.trend
        }
        accent="blue"
        bars={[
          20,
          29,
          44,
          60,
          76,
          95,
        ]}
        icon={
          <InstallerIcon />
        }
        loading={metricsLoading}
      />

      <MetricCard
        title="Active Tenders"
        value={getMetricValue(
          tenderMetric
        )}
        change={getMetricChange(
          tenderMetric
        )}
        note={getMetricNote(
          tenderMetric
        )}
        trend={
          tenderMetric.trend
        }
        accent="green"
        bars={[
          30,
          38,
          50,
          63,
          77,
          94,
        ]}
        icon={
          <TenderIcon />
        }
        loading={metricsLoading}
      />
    </div>
  );
}