import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Link } from "react-router";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { toast, Toaster } from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";

import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";

import {
  formatSubscriptionStatus,
  getSubscriptionErrorMessage,
  getSubscriptionPlans,
  getSupplierSubscriptions,
  type Pagination,
  type SupplierSummary,
  type SupplierSubscription,
  type SupplierSubscriptionPaymentStatus,
  type SupplierSubscriptionStatus,
  type SubscriptionPlan,
} from "../../services/supplier/subscription.service";

/* =========================================================
   TYPES
========================================================= */

type SubscriptionFilter =
  | "all"
  | SupplierSubscriptionStatus;

type BillingFilter =
  | "all"
  | SupplierSubscriptionPaymentStatus;

type SummaryState = {
  total: number | null;
  active: number | null;
  pending: number | null;
  expired: number | null;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_SUMMARY: SummaryState = {
  total: null,
  active: null,
  pending: null,
  expired: null,
};

const SUBSCRIPTION_OPTIONS: Array<{
  value: SubscriptionFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All Subscriptions",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "expired",
    label: "Expired",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const BILLING_OPTIONS: Array<{
  value: BillingFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All Billing",
  },
  {
    value: "unpaid",
    label: "Unpaid",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "refunded",
    label: "Refunded",
  },
  {
    value: "waived",
    label: "Waived",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getSupplierFromSubscription(
  subscription: SupplierSubscription
): SupplierSummary | null {
  if (
    !subscription.supplier ||
    typeof subscription.supplier === "string"
  ) {
    return null;
  }

  return subscription.supplier;
}

function getSupplierReference(
  subscription: SupplierSubscription
) {
  if (
    typeof subscription.supplier === "string"
  ) {
    return subscription.supplier;
  }

  return (
    subscription.supplier?.supplierId ||
    subscription.supplier?._id ||
    ""
  );
}

function getPlanFromSubscription(
  subscription: SupplierSubscription,
  plansByCode: Map<string, SubscriptionPlan>
): SubscriptionPlan | null {
  if (
    subscription.plan &&
    typeof subscription.plan !== "string"
  ) {
    return subscription.plan;
  }

  return (
    plansByCode.get(
      String(subscription.planCode || "")
        .trim()
        .toLowerCase()
    ) || null
  );
}

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatMoney(
  value: number | null | undefined,
  currency = "PKR"
) {
  if (
    value === undefined ||
    value === null
  ) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(
      "en-PK",
      {
        style: "currency",
        currency: currency || "PKR",
        maximumFractionDigits: 0,
      }
    ).format(value);
  } catch {
    return `${currency || "PKR"} ${Number(
      value
    ).toLocaleString("en-PK")}`;
  }
}

function formatSimpleValue(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  return value
    .split("_")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

/* =========================================================
   PAGE
========================================================= */

export default function Subscriptions() {
  const { user } = useAuth();

  /*
   * Current backend supplier subscription router is protected
   * by suppliers.manage.
   *
   * Dedicated subscriptions.* permissions can be used here
   * once backend routes support them.
   */
  const canAccessSubscriptions =
    hasUserPermission(
      user,
      "suppliers.manage"
    );

  const [
    subscriptions,
    setSubscriptions,
  ] =
    useState<
      SupplierSubscription[]
    >([]);

  const [
    plans,
    setPlans,
  ] =
    useState<
      SubscriptionPlan[]
    >([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>({
      ...EMPTY_PAGINATION,
    });

  const [
    summary,
    setSummary,
  ] =
    useState<SummaryState>({
      ...EMPTY_SUMMARY,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    plansLoading,
    setPlansLoading,
  ] =
    useState(true);

  const [
    summaryLoading,
    setSummaryLoading,
  ] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] =
    useState("");

  const [
    subscriptionFilter,
    setSubscriptionFilter,
  ] =
    useState<SubscriptionFilter>(
      "all"
    );

  const [
    billingFilter,
    setBillingFilter,
  ] =
    useState<BillingFilter>(
      "all"
    );

  const [
    planFilter,
    setPlanFilter,
  ] =
    useState("all");

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    limit,
    setLimit,
  ] =
    useState(20);

  /* =======================================================
     QUERY
  ======================================================= */

  const subscriptionQuery =
    useMemo(
      () => ({
        page,
        limit,

        ...(subscriptionFilter !==
        "all"
          ? {
              status:
                subscriptionFilter,
            }
          : {}),

        ...(billingFilter !==
        "all"
          ? {
              paymentStatus:
                billingFilter,
            }
          : {}),

        ...(planFilter !==
        "all"
          ? {
              plan:
                planFilter,
            }
          : {}),
      }),
      [
        page,
        limit,
        subscriptionFilter,
        billingFilter,
        planFilter,
      ]
    );

  /* =======================================================
     LOAD SUBSCRIPTIONS
  ======================================================= */

  const loadSubscriptions =
    useCallback(
      async (
        showToast = false
      ) => {
        if (!canAccessSubscriptions) {
          setSubscriptions([]);
          setPagination({
            ...EMPTY_PAGINATION,
            page,
            limit,
          });
          setLoadError(
            "Current backend subscription routes require suppliers.manage permission."
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }

        try {
          setLoadError("");

          const result =
            await getSupplierSubscriptions(
              subscriptionQuery
            );

          setSubscriptions(
            result.subscriptions
          );

          setPagination(
            result.pagination
          );

          if (showToast) {
            toast.success(
              "Subscriptions refreshed successfully."
            );
          }
        } catch (error) {
          const message =
            getSubscriptionErrorMessage(
              error,
              "Unable to load subscriptions."
            );

          setSubscriptions([]);

          setPagination({
            ...EMPTY_PAGINATION,
            page,
            limit,
          });

          setLoadError(
            message
          );

          if (showToast) {
            toast.error(
              "Unable to refresh subscriptions",
              {
                description:
                  message,
              }
            );
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        canAccessSubscriptions,
        subscriptionQuery,
        page,
        limit,
      ]
    );

  /* =======================================================
     LOAD PLANS
  ======================================================= */

  const loadPlans =
    useCallback(
      async () => {
        if (!canAccessSubscriptions) {
          setPlans([]);
          setPlansLoading(false);
          return;
        }

        try {
          setPlansLoading(
            true
          );

          const result =
            await getSubscriptionPlans(
              {
                page: 1,
                limit: 100,
              }
            );

          setPlans(
            result.plans
          );
        } catch (error) {
          setPlans([]);

          toast.error(
            "Unable to load subscription plans",
            {
              description:
                getSubscriptionErrorMessage(
                  error
                ),
            }
          );
        } finally {
          setPlansLoading(
            false
          );
        }
      },
      [
        canAccessSubscriptions,
      ]
    );

  /* =======================================================
     LOAD SUMMARY

     Exact backend totals, not counts from currently loaded
     table page.
  ======================================================= */

  const loadSummary =
    useCallback(
      async () => {
        if (!canAccessSubscriptions) {
          setSummary({
            ...EMPTY_SUMMARY,
          });

          setSummaryLoading(
            false
          );

          return;
        }

        try {
          setSummaryLoading(
            true
          );

          const [
            allResult,
            activeResult,
            pendingResult,
            expiredResult,
          ] =
            await Promise.all([
              getSupplierSubscriptions(
                {
                  page: 1,
                  limit: 1,
                }
              ),

              getSupplierSubscriptions(
                {
                  page: 1,
                  limit: 1,
                  status:
                    "active",
                }
              ),

              getSupplierSubscriptions(
                {
                  page: 1,
                  limit: 1,
                  status:
                    "pending",
                }
              ),

              getSupplierSubscriptions(
                {
                  page: 1,
                  limit: 1,
                  status:
                    "expired",
                }
              ),
            ]);

          setSummary({
            total:
              allResult
                .pagination
                .total,

            active:
              activeResult
                .pagination
                .total,

            pending:
              pendingResult
                .pagination
                .total,

            expired:
              expiredResult
                .pagination
                .total,
          });
        } catch {
          /*
           * Do not display fabricated zeroes when summary
           * endpoint calls fail.
           */
          setSummary({
            ...EMPTY_SUMMARY,
          });
        } finally {
          setSummaryLoading(
            false
          );
        }
      },
      [
        canAccessSubscriptions,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    setLoading(true);

    void loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  /* =======================================================
     LOOKUPS
  ======================================================= */

  const plansByCode =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            SubscriptionPlan
          >();

        plans.forEach(
          (plan) => {
            map.set(
              plan.code
                .trim()
                .toLowerCase(),
              plan
            );
          }
        );

        return map;
      },
      [plans]
    );

  const planOptions =
    useMemo(
      () => [
        {
          value: "all",
          label: "All Plans",
        },

        ...plans.map(
          (plan) => ({
            value:
              plan.code,
            label:
              `${plan.name}${
                plan.status !==
                "active"
                  ? ` (${formatSimpleValue(
                      plan.status
                    )})`
                  : ""
              }`,
          })
        ),
      ],
      [plans]
    );

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    async () => {
      if (refreshing) {
        return;
      }

      setRefreshing(true);

      await Promise.all([
        loadSubscriptions(
          true
        ),
        loadPlans(),
        loadSummary(),
      ]);
    };

  /* =======================================================
     FILTER RESET
  ======================================================= */

  const resetFilters =
    () => {
      setSubscriptionFilter(
        "all"
      );

      setBillingFilter(
        "all"
      );

      setPlanFilter(
        "all"
      );

      setPage(1);
    };

  const hasFilters =
    subscriptionFilter !==
      "all" ||
    billingFilter !==
      "all" ||
    planFilter !==
      "all";

  /* =======================================================
     PAGINATION DISPLAY
  ======================================================= */

  const firstResult =
    pagination.total > 0
      ? (pagination.page -
          1) *
          pagination.limit +
        1
      : 0;

  const lastResult =
    Math.min(
      pagination.page *
        pagination.limit,
      pagination.total
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Subscriptions | Solar Trade Hub"
        description="Manage supplier subscriptions and marketplace access."
      />

      <PageBreadcrumb
        pageTitle="Subscriptions"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-4">
        {/* HEADER */}

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Supplier Subscriptions
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5b2eff]/10 px-2.5 py-1 text-xs font-semibold text-[#5b2eff] dark:text-[#8f78ff]">
                <ShieldCheck className="size-3.5" />

                Backend Connected
              </span>
            </div>

            <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Review supplier subscription records, billing state,
              validity period and plan defaults. Supplier status,
              verification and effective marketplace eligibility remain
              separate backend controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/marketplace/plans"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#5b2eff]/20 bg-[#5b2eff]/5 px-4 text-sm font-semibold text-[#5b2eff] transition hover:bg-[#5b2eff]/10 dark:text-[#8f78ff]"
            >
              <SlidersHorizontal className="size-4" />

              Plans & Features
            </Link>

            <Button
              size="sm"
              variant="outline"
              disabled={
                refreshing ||
                !canAccessSubscriptions
              }
              onClick={() => {
                void handleRefresh();
              }}
            >
              <span className="flex items-center gap-2">
                <RefreshCw
                  className={`size-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </span>
            </Button>
          </div>
        </div>

        {/* BACKEND PERMISSION NOTICE */}

        {!canAccessSubscriptions && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Subscription backend access unavailable
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-400">
                The current backend mounts supplier subscription routes
                behind the suppliers.manage permission. Dedicated
                subscriptions.view / subscriptions.manage permissions
                should only be enabled here after the backend route
                protection is updated.
              </p>
            </div>
          </div>
        )}

        {/* SUMMARY */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard
            label="Total Subscriptions"
            value={
              summary.total
            }
            loading={
              summaryLoading
            }
            description="All subscription records"
          />

          <SummaryCard
            label="Active"
            value={
              summary.active
            }
            loading={
              summaryLoading
            }
            description="Currently active"
          />

          <SummaryCard
            label="Pending"
            value={
              summary.pending
            }
            loading={
              summaryLoading
            }
            description="Awaiting activation"
          />

          <SummaryCard
            label="Expired"
            value={
              summary.expired
            }
            loading={
              summaryLoading
            }
            description="Expired records"
          />
        </div>

        {/* FILTERS */}

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[220px_220px_1fr_auto]">
            <FilterSelect
              label="Subscription status"
              value={
                subscriptionFilter
              }
              options={
                SUBSCRIPTION_OPTIONS
              }
              onChange={(
                value
              ) => {
                setSubscriptionFilter(
                  value as SubscriptionFilter
                );

                setPage(1);
              }}
            />

            <FilterSelect
              label="Billing status"
              value={
                billingFilter
              }
              options={
                BILLING_OPTIONS
              }
              onChange={(
                value
              ) => {
                setBillingFilter(
                  value as BillingFilter
                );

                setPage(1);
              }}
            />

            <FilterSelect
              label="Subscription plan"
              value={
                planFilter
              }
              options={
                planOptions
              }
              disabled={
                plansLoading
              }
              onChange={(
                value
              ) => {
                setPlanFilter(
                  value
                );

                setPage(1);
              }}
            />

            {hasFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={
                  resetFilters
                }
              >
                Clear Filters
              </Button>
            )}
          </div>

          <p className="mt-3 text-[11px] leading-5 text-gray-400">
            Filters above are applied by the backend. Supplier name
            free-text search is intentionally not shown because the
            current subscription list API does not provide a general
            search parameter.
          </p>
        </section>

        {/* TABLE */}

        <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Subscription Directory
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Loading subscriptions..."
                  : loadError
                    ? "Subscription data unavailable"
                    : `${pagination.total.toLocaleString(
                        "en-PK"
                      )} subscription${
                        pagination.total ===
                        1
                          ? ""
                          : "s"
                      }`}
              </p>
            </div>
          </div>

          <div className="block w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[1390px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                  <TableHeading>
                    Supplier
                  </TableHeading>

                  <TableHeading>
                    Supplier State
                  </TableHeading>

                  <TableHeading>
                    Subscription
                  </TableHeading>

                  <TableHeading>
                    Plan
                  </TableHeading>

                  <TableHeading>
                    Billing
                  </TableHeading>

                  <TableHeading>
                    Period
                  </TableHeading>

                  <TableHeading>
                    Product Limit
                  </TableHeading>

                  <TableHeading>
                    Plan Features
                  </TableHeading>

                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-16"
                    >
                      <LoadingState />
                    </td>
                  </tr>
                )}

                {!loading &&
                  loadError && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-14"
                      >
                        <ErrorState
                          message={
                            loadError
                          }
                          onRetry={() => {
                            setLoading(
                              true
                            );

                            void loadSubscriptions();
                          }}
                        />
                      </td>
                    </tr>
                  )}

                {!loading &&
                  !loadError &&
                  subscriptions.map(
                    (
                      subscription
                    ) => {
                      const supplier =
                        getSupplierFromSubscription(
                          subscription
                        );

                      const supplierReference =
                        getSupplierReference(
                          subscription
                        );

                      const plan =
                        getPlanFromSubscription(
                          subscription,
                          plansByCode
                        );

                      return (
                        <tr
                          key={
                            subscription._id ||
                            subscription.id
                          }
                          className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                        >
                          {/* SUPPLIER */}

                          <td className="px-4 py-3">
                            <div className="min-w-[230px]">
                              {supplier?.supplierId ? (
                                <Link
                                  to={`/suppliers/${encodeURIComponent(
                                    supplier.supplierId
                                  )}`}
                                  className="text-sm font-semibold text-gray-900 transition hover:text-[#ff4b1f] dark:text-white"
                                >
                                  {supplier.companyName ||
                                    supplier.supplierId}
                                </Link>
                              ) : (
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                  {supplier?.companyName ||
                                    "Supplier"}
                                </p>
                              )}

                              <p className="mt-1 font-mono text-[10px] font-semibold text-[#8f78ff]">
                                {supplier?.supplierId ||
                                  supplierReference ||
                                  "—"}
                              </p>

                              {supplier?.address?.city && (
                                <p className="mt-1 text-[11px] text-gray-500">
                                  {supplier.address.city}

                                  {supplier.address
                                    .country
                                    ? `, ${supplier.address.country}`
                                    : ""}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* SUPPLIER STATE */}

                          <td className="px-4 py-3">
                            {supplier ? (
                              <div className="min-w-[150px] space-y-1.5">
                                <StatusPill
                                  active={
                                    supplier.status ===
                                    "active"
                                  }
                                  label={
                                    formatSimpleValue(
                                      supplier.status
                                    )
                                  }
                                />

                                <p className="text-[10px] text-gray-500">
                                  {formatSimpleValue(
                                    supplier.verificationStatus
                                  )}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                —
                              </span>
                            )}
                          </td>

                          {/* SUBSCRIPTION */}

                          <td className="px-4 py-3">
                            <SubscriptionState
                              subscription={
                                subscription
                              }
                            />
                          </td>

                          {/* PLAN */}

                          <td className="px-4 py-3">
                            <div className="min-w-[150px]">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {subscription.planName ||
                                  plan?.name ||
                                  "—"}
                              </p>

                              {subscription.planCode && (
                                <p className="mt-1 font-mono text-[10px] text-gray-500">
                                  {
                                    subscription.planCode
                                  }
                                </p>
                              )}
                            </div>
                          </td>

                          {/* BILLING */}

                          <td className="px-4 py-3">
                            <div className="min-w-[145px]">
                              <BillingPill
                                status={
                                  subscription.paymentStatus
                                }
                              />

                              <p className="mt-1.5 text-[10px] text-gray-500">
                                {formatMoney(
                                  subscription.amount,
                                  subscription.currency
                                )}
                              </p>

                              {subscription.paymentReference && (
                                <p className="mt-1 max-w-[140px] truncate font-mono text-[9px] text-gray-400">
                                  {
                                    subscription.paymentReference
                                  }
                                </p>
                              )}
                            </div>
                          </td>

                          {/* PERIOD */}

                          <td className="px-4 py-3">
                            <div className="min-w-[180px]">
                              <p className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                                <CalendarDays className="size-3.5 text-gray-400" />

                                {formatDate(
                                  subscription.startsAt
                                )}
                              </p>

                              <p className="mt-1 text-[10px] text-gray-500">
                                to{" "}
                                {formatDate(
                                  subscription.expiresAt
                                )}
                              </p>

                              {subscription.daysRemaining !==
                                undefined &&
                                subscription.status ===
                                  "active" && (
                                  <p className="mt-1 text-[10px] font-medium text-[#5b2eff] dark:text-[#8f78ff]">
                                    {
                                      subscription.daysRemaining
                                    }{" "}
                                    day
                                    {subscription.daysRemaining ===
                                    1
                                      ? ""
                                      : "s"}{" "}
                                    remaining
                                  </p>
                                )}
                            </div>
                          </td>

                          {/* CAPACITY */}

                          <td className="px-4 py-3">
                            <ProductCapacity
                              subscription={
                                subscription
                              }
                              plan={
                                plan
                              }
                            />
                          </td>

                          {/* FEATURES */}

                          <td className="px-4 py-3">
                            <PlanFeatureSummary
                              plan={
                                plan
                              }
                            />
                          </td>

                          {/* ACTION */}

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              {supplier?.supplierId ? (
                                <Link
                                  to={`/suppliers/${encodeURIComponent(
                                    supplier.supplierId
                                  )}`}
                                  title="View Supplier"
                                  className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#ff4b1f]/10 hover:text-[#ff4b1f]"
                                >
                                  <Eye className="size-4" />
                                </Link>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  —
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}

                {!loading &&
                  !loadError &&
                  subscriptions.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-16 text-center"
                      >
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          No subscription records found.
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {hasFilters
                            ? "Adjust the selected filters."
                            : "No supplier subscriptions have been configured yet."}
                        </p>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          {!loading &&
            !loadError &&
            pagination.total > 0 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Showing{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {firstResult}
                    </span>
                    {" - "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {lastResult}
                    </span>
                    {" of "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {pagination.total.toLocaleString(
                        "en-PK"
                      )}
                    </span>
                  </p>

                  <select
                    aria-label="Subscriptions per page"
                    value={
                      limit
                    }
                    onChange={(
                      event
                    ) => {
                      setLimit(
                        Number(
                          event.target
                            .value
                        )
                      );

                      setPage(1);
                    }}
                    className="h-8 rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-600 outline-none transition focus:border-[#5b2eff] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
                  >
                    {PAGE_SIZE_OPTIONS.map(
                      (
                        size
                      ) => (
                        <option
                          key={
                            size
                          }
                          value={
                            size
                          }
                        >
                          {size} / page
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      !pagination.hasPreviousPage
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.max(
                            current -
                              1,
                            1
                          )
                      )
                    }
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  <span className="min-w-10 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {
                      pagination.page
                    }
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      !pagination.hasNextPage
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          current +
                          1
                      )
                    }
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
        </section>

        {/* IMPORTANT ARCHITECTURE NOTE */}

        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-gray-400" />

          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              Subscription does not equal marketplace eligibility
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
              Effective marketplace access also depends on supplier
              active status, supplier verification, subscription state,
              plan features, supplier-specific overrides and product
              access. Use the backend effective-permissions resolver as
              the authoritative source when making storefront access
              decisions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  description,
  loading,
}: {
  label: string;
  value: number | null;
  description: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium text-gray-500">
        {label}
      </p>

      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      ) : (
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
          {value === null
            ? "—"
            : value.toLocaleString(
                "en-PK"
              )}
        </p>
      )}

      <p className="mt-1 text-[11px] text-gray-400">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   TABLE HEADING
========================================================= */

function TableHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  value,
  options,
  onChange,
  label,
  disabled = false,
}: {
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (
    value: string
  ) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        aria-label={
          label
        }
        disabled={
          disabled
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm text-gray-700 outline-none transition focus:border-[#5b2eff] disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      >
        {options.map(
          (
            option
          ) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
        ▾
      </span>
    </div>
  );
}

/* =========================================================
   STATUS PILL
========================================================= */

function StatusPill({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {label || "Unknown"}
    </span>
  );
}

/* =========================================================
   SUBSCRIPTION STATE
========================================================= */

function SubscriptionState({
  subscription,
}: {
  subscription:
    SupplierSubscription;
}) {
  const styles: Record<
    SupplierSubscriptionStatus,
    string
  > = {
    active:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",

    pending:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",

    expired:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",

    cancelled:
      "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  };

  return (
    <div className="min-w-[145px]">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          styles[
            subscription.status
          ]
        }`}
      >
        {formatSubscriptionStatus(
          subscription.status
        )}
      </span>

      {subscription.effectiveStatus &&
        subscription.effectiveStatus !==
          subscription.status && (
          <p className="mt-1.5 text-[10px] text-gray-500">
            Effective:{" "}
            {formatSubscriptionStatus(
              subscription.effectiveStatus
            )}
          </p>
        )}
    </div>
  );
}

/* =========================================================
   BILLING PILL
========================================================= */

function BillingPill({
  status,
}: {
  status:
    SupplierSubscriptionPaymentStatus;
}) {
  const styles: Record<
    SupplierSubscriptionPaymentStatus,
    string
  > = {
    paid:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",

    waived:
      "bg-[#5b2eff]/10 text-[#5b2eff] dark:text-[#8f78ff]",

    pending:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",

    unpaid:
      "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",

    failed:
      "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",

    refunded:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[
          status
        ]
      }`}
    >
      {formatSubscriptionStatus(
        status
      )}
    </span>
  );
}

/* =========================================================
   PRODUCT CAPACITY
========================================================= */

function ProductCapacity({
  subscription,
  plan,
}: {
  subscription:
    SupplierSubscription;
  plan:
    SubscriptionPlan | null;
}) {
  if (
    subscription.unlimitedProducts ||
    plan?.unlimitedProducts
  ) {
    return (
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
        Unlimited
      </span>
    );
  }

  const productLimit =
    subscription.productLimit ??
    plan?.productLimit;

  if (
    productLimit ===
      undefined ||
    productLimit ===
      null
  ) {
    return (
      <span className="text-sm text-gray-400">
        —
      </span>
    );
  }

  return (
    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
      {Number(
        productLimit
      ).toLocaleString(
        "en-PK"
      )}
    </span>
  );
}

/* =========================================================
   PLAN FEATURE SUMMARY

   Display plan defaults only.
   Effective supplier permissions may differ because of
   supplier-specific overrides.
========================================================= */

function PlanFeatureSummary({
  plan,
}: {
  plan:
    SubscriptionPlan | null;
}) {
  if (!plan) {
    return (
      <div className="min-w-[220px]">
        <span className="text-xs text-gray-400">
          —
        </span>
      </div>
    );
  }

  const marketplaceListing =
    Boolean(
      plan.features
        ?.marketplaceListing
        ?.enabled
    );

  const supplierBid =
    Boolean(
      plan.features
        ?.supplierBid
        ?.enabled
    );

  const customerRange =
    Boolean(
      plan.features
        ?.customerRange
        ?.enabled
    );

  const bidMaximum =
    Number(
      plan.features
        ?.supplierBid
        ?.maxReductionPercent ??
        0
    );

  const chips = [
    {
      label:
        "Marketplace",
      active:
        marketplaceListing,
    },

    {
      label:
        supplierBid
          ? `Bid ≤ ${bidMaximum}%`
          : "Bid",
      active:
        supplierBid,
    },

    {
      label:
        "Customer Range",
      active:
        customerRange,
    },
  ];

  return (
    <div className="min-w-[220px]">
      <div className="flex flex-wrap gap-1.5">
        {chips.map(
          (
            chip
          ) => (
            <span
              key={
                chip.label
              }
              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                chip.active
                  ? "bg-[#5b2eff]/10 text-[#5b2eff] dark:text-[#8f78ff]"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800"
              }`}
            >
              {
                chip.label
              }
            </span>
          )
        )}
      </div>

      <p className="mt-1.5 text-[10px] text-gray-400">
        Plan defaults — effective supplier access may be modified by overrides.
      </p>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <LoaderCircle className="size-7 animate-spin text-[#5b2eff]" />

      <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Loading subscriptions
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Fetching subscription records from the backend.
      </p>
    </div>
  );
}

/* =========================================================
   ERROR
========================================================= */

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center">
      <CircleAlert className="mx-auto size-7 text-red-500" />

      <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
        Unable to load subscriptions
      </p>

      <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-gray-500">
        {message}
      </p>

      <button
        type="button"
        onClick={
          onRetry
        }
        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
      >
        <RefreshCw className="size-3.5" />

        Retry
      </button>
    </div>
  );
}