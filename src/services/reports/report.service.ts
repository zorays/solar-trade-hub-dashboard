import api from "../api";

/* =========================================================
   REPORT RANGE
========================================================= */

export type ReportRange =
  | "7d"
  | "30d"
  | "90d"
  | "year";

/* =========================================================
   USER GROWTH RANGE
========================================================= */

export type UserGrowthRange =
  | "3m"
  | "6m"
  | "12m";

/* =========================================================
   COMMON METRIC
========================================================= */

export type ReportMetric = {
  value: number;

  previousValue: number;

  changePct:
    | number
    | null;

  positive: boolean;
};

/* =========================================================
   DASHBOARD METRIC
========================================================= */

export type DashboardMetric = {
  value: number;

  thisMonth: number;

  lastMonth: number;

  changePct:
    | number
    | null;

  trend:
    | "up"
    | "down";
};

/* =========================================================
   MARKETPLACE DASHBOARD METRICS
========================================================= */

export type MarketplaceDashboardMetrics = {
  suppliers:
    DashboardMetric;

  verifiedInstallers:
    DashboardMetric;

  activeTenders:
    DashboardMetric;
};

/* =========================================================
   USER GROWTH
========================================================= */

export type UserGrowthItem = {
  key: string;

  label: string;

  year: number;

  suppliers: number;

  installers: number;

  supplierNew: number;

  installerNew: number;
};

export type MarketplaceUserGrowth = {
  range:
    UserGrowthRange;

  months: number;

  data:
    UserGrowthItem[];
};

/* =========================================================
   USERS REPORT
========================================================= */

export type UsersReportMetrics = {
  newUsers:
    ReportMetric;

  verifiedUsers:
    ReportMetric;

  activeUsers:
    ReportMetric;

  blockedUsers:
    ReportMetric;
};

export type RegistrationTrendItem = {
  key: string;

  label: string;

  users: number;
};

export type RoleDistributionItem = {
  role: string;

  users: number;

  percentage: number;
};

export type VerificationStatItem = {
  key: string;

  label: string;

  value: number;

  percentage: number;
};

export type AccountStatusItem = {
  status:
    | "active"
    | "inactive"
    | "blocked";

  label: string;

  value: number;

  percentage: number;
};

export type ReportPeriod = {
  current: {
    from: string;

    to: string;
  };

  previous: {
    from: string;

    to: string;
  };
};

export type UsersReport = {
  range:
    ReportRange;

  period:
    ReportPeriod;

  metrics:
    UsersReportMetrics;

  registrationTrend:
    RegistrationTrendItem[];

  roleDistribution:
    RoleDistributionItem[];

  verificationStats:
    VerificationStatItem[];

  accountStatus:
    AccountStatusItem[];

  totalUsers: number;

  metricBasis:
    string;
};


/* =========================================================
   MARKETPLACE PERFORMANCE REPORT
========================================================= */

export type MarketplaceReportActivity = {
  products: number | null;
  suppliers: number;
  installers: number;
  openTenders: number;
  activeDeals: number;
  registeredUsers: number;
};

export type MarketplaceTopCategory = {
  id: string;
  name: string;
  products: number;
  orders: number;
  revenue: number;
  averageOrder: number;
};

export type MarketplaceSupply = {
  activeSuppliers: number;
  verifiedSuppliers: number;
  registeredInstallers: number;
  installerApplications: number;
};

export type MarketplaceDemand = {
  orders: number;
  openTenders: number;
  activeDeals: number;
  newUsers: number;
};

export type MarketplaceReport = {
  range: ReportRange;
  period: ReportPeriod;
  metrics: {
    marketplaceRevenue: ReportMetric;
    orders: ReportMetric;
    newUsers: ReportMetric;
    activeSuppliers: ReportMetric;
  };
  activity: MarketplaceReportActivity;
  topCategories: MarketplaceTopCategory[];
  supply: MarketplaceSupply;
  demand: MarketplaceDemand;
  metricBasis?: Record<string, string>;
};

/* =========================================================
   ORDERS PERFORMANCE REPORT
========================================================= */

export type ReportBreakdownItem = {
  label: string;
  value: number;
  percentage: number;
};

export type OrdersCategoryPerformance = {
  id: string;
  name: string;
  products: number;
  orders: number;
  revenue: number;
  averageOrder: number;
};

export type MonthlyOrderData = {
  key: string;
  label: string;
  orders: number;
};

export type OrdersReport = {
  range: ReportRange;
  period: ReportPeriod;
  metrics: {
    totalOrders: ReportMetric;
    completedOrders: ReportMetric;
    orderRevenue: ReportMetric;
    averageOrderValue: ReportMetric;
  };
  statusBreakdown: ReportBreakdownItem[];
  paymentBreakdown: ReportBreakdownItem[];
  categoryOrders: OrdersCategoryPerformance[];
  monthlyOrders: MonthlyOrderData[];
  metricBasis?: Record<string, string>;
};

/* =========================================================
   API RESPONSE
========================================================= */

type ApiResponse<T> = {
  success: boolean;

  message?: string;

  data: T;
};

/* =========================================================
   GET MARKETPLACE DASHBOARD METRICS

   GET
   /api/v1/reports/dashboard/marketplace
========================================================= */

export const getMarketplaceDashboardMetrics =
  async (): Promise<MarketplaceDashboardMetrics> => {
    const response =
      await api.get<
        ApiResponse<MarketplaceDashboardMetrics>
      >(
        "/reports/dashboard/marketplace"
      );

    return response.data.data;
  };

/* =========================================================
   GET MARKETPLACE USER GROWTH

   GET
   /api/v1/reports/dashboard/user-growth

   Optional:

   ?range=3m
   ?range=6m
   ?range=12m
========================================================= */

export const getMarketplaceUserGrowth =
  async (
    range:
      UserGrowthRange =
      "6m"
  ): Promise<MarketplaceUserGrowth> => {
    const response =
      await api.get<
        ApiResponse<MarketplaceUserGrowth>
      >(
        "/reports/dashboard/user-growth",
        {
          params: {
            range,
          },
        }
      );

    return response.data.data;
  };

/* =========================================================
   GET USERS REPORT

   GET
   /api/v1/reports/users?range=30d
========================================================= */

export const getUsersReport =
  async (
    range:
      ReportRange =
      "30d"
  ): Promise<UsersReport> => {
    const response =
      await api.get<
        ApiResponse<UsersReport>
      >(
        "/reports/users",
        {
          params: {
            range,
          },
        }
      );

    return response.data.data;
  };


/* =========================================================
   GET MARKETPLACE PERFORMANCE REPORT
========================================================= */

export const getMarketplaceReport =
  async (
    range: ReportRange = "30d"
  ): Promise<MarketplaceReport> => {
    const response =
      await api.get<
        ApiResponse<MarketplaceReport>
      >(
        "/reports/marketplace",
        {
          params: {
            range,
          },
        }
      );

    return response.data.data;
  };

/* =========================================================
   GET ORDERS PERFORMANCE REPORT
========================================================= */

export const getOrdersReport =
  async (
    range: ReportRange = "30d"
  ): Promise<OrdersReport> => {
    const response =
      await api.get<
        ApiResponse<OrdersReport>
      >(
        "/reports/orders",
        {
          params: {
            range,
          },
        }
      );

    return response.data.data;
  };

/* =========================================================
   FORMAT NUMBER
========================================================= */

export const formatReportNumber =
  (
    value:
      | number
      | null
      | undefined
  ) => {
    return new Intl.NumberFormat(
      "en-PK"
    ).format(
      Number(
        value || 0
      )
    );
  };

/* =========================================================
   FORMAT PERCENTAGE CHANGE
========================================================= */

export const formatReportChange =
  (
    value:
      | number
      | null
      | undefined
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "N/A";
    }

    const prefix =
      value > 0
        ? "+"
        : "";

    return `${prefix}${value.toFixed(
      1
    )}%`;
  };

/* =========================================================
   FORMAT DASHBOARD CHANGE
========================================================= */

export const formatDashboardChange =
  (
    metric:
      DashboardMetric
  ) => {
    if (
      metric.changePct ===
      null
    ) {
      if (
        metric.thisMonth >
        0
      ) {
        return "New";
      }

      return "0.0%";
    }

    return `${Math.abs(
      metric.changePct
    ).toFixed(
      1
    )}%`;
  };

/* =========================================================
   FORMAT DASHBOARD MONTH NOTE
========================================================= */

export const formatDashboardMonthNote =
  (
    value:
      | number
      | null
      | undefined
  ) => {
    const count =
      Number(
        value || 0
      );

    if (
      count <= 0
    ) {
      return "No new this month";
    }

    return `+${count.toLocaleString(
      "en-PK"
    )} new this month`;
  };

/* =========================================================
   FORMAT PERCENTAGE
========================================================= */

export const formatReportPercentage =
  (
    value:
      | number
      | null
      | undefined
  ) => {
    return `${Number(
      value || 0
    ).toFixed(
      1
    )}%`;
  };


/* =========================================================
   FORMAT REPORT CURRENCY
========================================================= */

export const formatReportCurrency =
  (
    value:
      | number
      | null
      | undefined,
    currency = "PKR"
  ) => {
    return new Intl.NumberFormat(
      "en-PK",
      {
        style:
          "currency",
        currency,
        maximumFractionDigits:
          0,
      }
    ).format(
      Number(
        value || 0
      )
    );
  };

/* =========================================================
   REPORT ERROR MESSAGE
========================================================= */

export const getReportErrorMessage =
  (
    error:
      unknown
  ) => {
    const apiError =
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };

        message?: string;
      };

    return (
      apiError.response
        ?.data
        ?.message ||
      apiError.message ||
      "Unable to load report."
    );
  };