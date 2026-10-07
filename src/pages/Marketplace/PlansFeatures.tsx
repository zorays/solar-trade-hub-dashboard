import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";

import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";

import {
  archiveSubscriptionPlan,
  createSubscriptionPlan,
  getSubscriptionErrorMessage,
  getSubscriptionPlans,
  updateSubscriptionPlan,
  type CreateSubscriptionPlanPayload,
  type Pagination,
  type SubscriptionPlan,
  type SubscriptionPlanBillingCycle,
  type SubscriptionPlanStatus,
} from "../../services/supplier/subscription.service";

/* =========================================================
   TYPES
========================================================= */

type StatusFilter =
  | "all"
  | SubscriptionPlanStatus;

type SummaryState = {
  total: number | null;
  active: number | null;
  inactive: number | null;
  archived: number | null;
};

type PlanForm = {
  name: string;
  code: string;
  description: string;

  status:
    SubscriptionPlanStatus;

  billingCycle:
    SubscriptionPlanBillingCycle;

  durationMonths: string;

  price: string;
  currency: string;

  unlimitedProducts: boolean;
  productLimit: string;

  marketplaceListing: boolean;

  supplierBid: boolean;
  supplierBidMaxReductionPercent: string;

  customerRange: boolean;

  sortOrder: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE_OPTIONS = [
  20,
  50,
  100,
];

const EMPTY_PAGINATION:
  Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_SUMMARY:
  SummaryState = {
  total: null,
  active: null,
  inactive: null,
  archived: null,
};

const EMPTY_FORM:
  PlanForm = {
  name: "",
  code: "",
  description: "",

  status: "active",

  billingCycle:
    "monthly",

  durationMonths:
    "1",

  price: "0",
  currency: "PKR",

  unlimitedProducts:
    false,

  productLimit:
    "0",

  marketplaceListing:
    true,

  supplierBid:
    false,

  supplierBidMaxReductionPercent:
    "0",

  customerRange:
    false,

  sortOrder:
    "0",
};

/* =========================================================
   HELPERS
========================================================= */

const createCode = (
  value: string
) =>
  value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9\s_-]/g,
      ""
    )
    .replace(
      /\s+/g,
      "_"
    )
    .replace(
      /_+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );

const formatMoney = (
  value: number,
  currency: string
) => {
  try {
    return new Intl.NumberFormat(
      "en-PK",
      {
        style:
          "currency",

        currency:
          currency ||
          "PKR",

        maximumFractionDigits:
          0,
      }
    ).format(
      Number(
        value ||
          0
      )
    );
  } catch {
    return `${currency || "PKR"} ${Number(
      value ||
        0
    ).toLocaleString(
      "en-PK"
    )}`;
  }
};

const formatStatus = (
  value: string
) =>
  value
    .split("_")
    .filter(Boolean)
    .map(
      (
        word
      ) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");

const planToForm = (
  plan:
    SubscriptionPlan
): PlanForm => ({
  name:
    plan.name ||
    "",

  code:
    plan.code ||
    "",

  description:
    plan.description ||
    "",

  status:
    plan.status,

  billingCycle:
    plan.billingCycle,

  durationMonths:
    String(
      plan.durationMonths ??
        1
    ),

  price:
    String(
      plan.price ??
        0
    ),

  currency:
    plan.currency ||
    "PKR",

  unlimitedProducts:
    Boolean(
      plan.unlimitedProducts
    ),

  productLimit:
    String(
      plan.productLimit ??
        0
    ),

  marketplaceListing:
    Boolean(
      plan.features
        ?.marketplaceListing
        ?.enabled
    ),

  supplierBid:
    Boolean(
      plan.features
        ?.supplierBid
        ?.enabled
    ),

  supplierBidMaxReductionPercent:
    String(
      plan.features
        ?.supplierBid
        ?.maxReductionPercent ??
        0
    ),

  customerRange:
    Boolean(
      plan.features
        ?.customerRange
        ?.enabled
    ),

  sortOrder:
    String(
      plan.sortOrder ??
        0
    ),
});

const formToPayload = (
  form:
    PlanForm
):
  CreateSubscriptionPlanPayload => {
  const durationMonths =
    Number(
      form.durationMonths
    );

  const price =
    Number(
      form.price
    );

  const productLimit =
    Number(
      form.productLimit
    );

  const bidReduction =
    Number(
      form.supplierBidMaxReductionPercent
    );

  const sortOrder =
    Number(
      form.sortOrder
    );

  /*
   * IMPORTANT:
   *
   * couponEligibility is intentionally not sent.
   *
   * It still exists in the legacy backend contract,
   * but Coupons are not part of the current Solar Trade Hub
   * product direction.
   *
   * On update, omitting it means the backend does not mutate
   * the existing legacy field.
   */
  return {
    name:
      form.name.trim(),

    code:
      form.code.trim(),

    description:
      form.description.trim(),

    status:
      form.status,

    billingCycle:
      form.billingCycle,

    durationMonths,

    price,

    currency:
      form.currency
        .trim()
        .toUpperCase() ||
      "PKR",

    unlimitedProducts:
      form.unlimitedProducts,

    productLimit:
      form.unlimitedProducts
        ? 0
        : productLimit,

    features: {
      marketplaceListing: {
        enabled:
          form.marketplaceListing,
      },

      supplierBid: {
        enabled:
          form.supplierBid,

        maxReductionPercent:
          form.supplierBid
            ? bidReduction
            : 0,
      },

      customerRange: {
        enabled:
          form.customerRange,
      },
    },

    sortOrder,
  };
};

/* =========================================================
   PAGE
========================================================= */

export default function PlansFeatures() {
  const { user } =
    useAuth();

  /*
   * Current backend subscription routes are protected by
   * suppliers.manage.
   */
  const canManage =
    hasUserPermission(
      user,
      "suppliers.manage"
    );

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
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    archivingId,
    setArchivingId,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all"
    );

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

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    editingPlan,
    setEditingPlan,
  ] =
    useState<
      SubscriptionPlan |
      null
    >(null);

  const [
    form,
    setForm,
  ] =
    useState<PlanForm>(
      EMPTY_FORM
    );

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setDebouncedSearch(
            search.trim()
          );

          setPage(1);
        },
        400
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [search]);

  /* =======================================================
     QUERY
  ======================================================= */

  const query =
    useMemo(
      () => ({
        page,
        limit,

        ...(debouncedSearch
          ? {
              search:
                debouncedSearch,
            }
          : {}),

        ...(statusFilter !==
        "all"
          ? {
              status:
                statusFilter,
            }
          : {}),
      }),
      [
        page,
        limit,
        debouncedSearch,
        statusFilter,
      ]
    );

  /* =======================================================
     LOAD PLANS
  ======================================================= */

  const loadPlans =
    useCallback(
      async (
        showToast =
          false
      ) => {
        if (!canManage) {
          setPlans([]);

          setPagination({
            ...EMPTY_PAGINATION,
            page,
            limit,
          });

          setLoadError(
            "Current backend plan routes require suppliers.manage permission."
          );

          setLoading(false);
          setRefreshing(false);

          return;
        }

        try {
          setLoadError("");

          const result =
            await getSubscriptionPlans(
              query
            );

          setPlans(
            result.plans
          );

          setPagination(
            result.pagination
          );

          if (
            showToast
          ) {
            toast.success(
              "Subscription plans refreshed successfully."
            );
          }
        } catch (
          error
        ) {
          const message =
            getSubscriptionErrorMessage(
              error,
              "Unable to load subscription plans."
            );

          setPlans([]);

          setPagination({
            ...EMPTY_PAGINATION,
            page,
            limit,
          });

          setLoadError(
            message
          );

          if (
            showToast
          ) {
            toast.error(
              "Unable to refresh plans",
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
        canManage,
        query,
        page,
        limit,
      ]
    );

  /* =======================================================
     SUMMARY

     Real backend totals.
  ======================================================= */

  const loadSummary =
    useCallback(
      async () => {
        if (!canManage) {
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
            totalResult,
            activeResult,
            inactiveResult,
            archivedResult,
          ] =
            await Promise.all([
              getSubscriptionPlans(
                {
                  page: 1,
                  limit: 1,
                }
              ),

              getSubscriptionPlans(
                {
                  page: 1,
                  limit: 1,
                  status:
                    "active",
                }
              ),

              getSubscriptionPlans(
                {
                  page: 1,
                  limit: 1,
                  status:
                    "inactive",
                }
              ),

              getSubscriptionPlans(
                {
                  page: 1,
                  limit: 1,
                  status:
                    "archived",
                }
              ),
            ]);

          setSummary({
            total:
              totalResult
                .pagination
                .total,

            active:
              activeResult
                .pagination
                .total,

            inactive:
              inactiveResult
                .pagination
                .total,

            archived:
              archivedResult
                .pagination
                .total,
          });
        } catch {
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
        canManage,
      ]
    );

  /* =======================================================
     INITIAL / QUERY LOAD
  ======================================================= */

  useEffect(() => {
    setLoading(true);

    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    async () => {
      if (
        refreshing
      ) {
        return;
      }

      setRefreshing(
        true
      );

      await Promise.all([
        loadPlans(true),
        loadSummary(),
      ]);
    };

  /* =======================================================
     MODAL
  ======================================================= */

  const openCreate =
    () => {
      if (!canManage) {
        return;
      }

      setEditingPlan(
        null
      );

      setForm({
        ...EMPTY_FORM,
      });

      setModalOpen(
        true
      );
    };

  const openEdit =
    (
      plan:
        SubscriptionPlan
    ) => {
      if (!canManage) {
        return;
      }

      setEditingPlan(
        plan
      );

      setForm(
        planToForm(
          plan
        )
      );

      setModalOpen(
        true
      );
    };

  const closeModal =
    () => {
      if (
        saving
      ) {
        return;
      }

      setModalOpen(
        false
      );

      setEditingPlan(
        null
      );

      setForm({
        ...EMPTY_FORM,
      });
    };

  /* =======================================================
     FORM
  ======================================================= */

  const updateField =
    <
      K extends keyof PlanForm
    >(
      key: K,
      value:
        PlanForm[K]
    ) => {
      setForm(
        (
          current
        ) => ({
          ...current,

          [key]:
            value,
        })
      );
    };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async () => {
      if (
        !canManage ||
        saving
      ) {
        return;
      }

      const name =
        form.name.trim();

      const code =
        form.code.trim();

      const duration =
        Number(
          form.durationMonths
        );

      const price =
        Number(
          form.price
        );

      const productLimit =
        Number(
          form.productLimit
        );

      const bidReduction =
        Number(
          form.supplierBidMaxReductionPercent
        );

      const sortOrder =
        Number(
          form.sortOrder
        );

      if (
        !name
      ) {
        toast.error(
          "Plan name is required."
        );

        return;
      }

      if (
        !code
      ) {
        toast.error(
          "Plan code is required."
        );

        return;
      }

      if (
        !Number.isInteger(
          duration
        ) ||
        duration <
          1
      ) {
        toast.error(
          "Duration must be at least 1 month."
        );

        return;
      }

      if (
        !Number.isFinite(
          price
        ) ||
        price <
          0
      ) {
        toast.error(
          "Plan price cannot be negative."
        );

        return;
      }

      if (
        !form.currency
          .trim()
      ) {
        toast.error(
          "Currency is required."
        );

        return;
      }

      if (
        !form.unlimitedProducts &&
        (
          !Number.isInteger(
            productLimit
          ) ||
          productLimit <
            0
        )
      ) {
        toast.error(
          "Product limit must be a non-negative whole number."
        );

        return;
      }

      if (
        form.supplierBid &&
        (
          !Number.isFinite(
            bidReduction
          ) ||
          bidReduction <
            0 ||
          bidReduction >
            100
        )
      ) {
        toast.error(
          "Supplier Bid maximum reduction must be between 0% and 100%."
        );

        return;
      }

      if (
        !Number.isFinite(
          sortOrder
        ) ||
        sortOrder <
          0
      ) {
        toast.error(
          "Sort order cannot be negative."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        const payload =
          formToPayload(
            form
          );

        if (
          editingPlan
        ) {
          await updateSubscriptionPlan(
            editingPlan._id ||
              editingPlan.code,
            payload
          );

          toast.success(
            "Subscription plan updated successfully."
          );
        } else {
          await createSubscriptionPlan(
            payload
          );

          toast.success(
            "Subscription plan created successfully."
          );
        }

        setModalOpen(
          false
        );

        setEditingPlan(
          null
        );

        setForm({
          ...EMPTY_FORM,
        });

        /*
         * Reload from backend so sorting, normalization and
         * pagination remain authoritative.
         */
        setLoading(
          true
        );

        await Promise.all([
          loadPlans(),
          loadSummary(),
        ]);
      } catch (
        error
      ) {
        toast.error(
          editingPlan
            ? "Unable to update plan"
            : "Unable to create plan",
          {
            description:
              getSubscriptionErrorMessage(
                error
              ),
          }
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     ARCHIVE
  ======================================================= */

  const handleArchive =
    async (
      plan:
        SubscriptionPlan
    ) => {
      if (
        !canManage ||
        plan.status ===
          "archived" ||
        archivingId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Archive "${plan.name}"? Existing supplier subscription history will remain intact.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setArchivingId(
          plan._id ||
            plan.code
        );

        await archiveSubscriptionPlan(
          plan._id ||
            plan.code
        );

        toast.success(
          "Subscription plan archived successfully."
        );

        /*
         * Current filtered page may no longer contain the plan,
         * therefore reload from backend instead of mutating the
         * local page only.
         */
        setLoading(
          true
        );

        await Promise.all([
          loadPlans(),
          loadSummary(),
        ]);
      } catch (
        error
      ) {
        toast.error(
          "Unable to archive plan",
          {
            description:
              getSubscriptionErrorMessage(
                error
              ),
          }
        );
      } finally {
        setArchivingId(
          ""
        );
      }
    };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters =
    () => {
      setSearch("");
      setDebouncedSearch("");
      setStatusFilter(
        "all"
      );
      setPage(1);
    };

  const hasFilters =
    Boolean(
      search ||
      statusFilter !==
        "all"
    );

  /* =======================================================
     PAGINATION
  ======================================================= */

  const firstResult =
    pagination.total > 0
      ? (
          pagination.page -
          1
        ) *
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
        title="Plans & Features | Solar Trade Hub"
        description="Manage supplier subscription plans and default marketplace entitlements."
      />

      <PageBreadcrumb
        pageTitle="Plans & Features"
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
                Subscription Plans
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5b2eff]/10 px-2.5 py-1 text-xs font-semibold text-[#5b2eff] dark:text-[#8f78ff]">
                <ShieldCheck className="size-3.5" />

                Backend Connected
              </span>
            </div>

            <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Configure plan defaults for marketplace listing,
              Supplier Bid, Customer Range and product capacity.
              Supplier-specific overrides remain separate from plan
              defaults.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={
                refreshing ||
                !canManage
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

            {canManage && (
              <button
                type="button"
                onClick={
                  openCreate
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-4 text-sm font-semibold text-white transition hover:bg-[#e7431b]"
              >
                <Plus className="size-4" />

                Add Plan
              </button>
            )}
          </div>
        </div>

        {/* PERMISSION NOTICE */}

        {!canManage && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Subscription plan access unavailable
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-400">
                Current backend subscription plan routes require
                suppliers.manage permission.
              </p>
            </div>
          </div>
        )}

        {/* SUMMARY */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard
            label="Total Plans"
            value={
              summary.total
            }
            loading={
              summaryLoading
            }
            description="All stored plans"
          />

          <SummaryCard
            label="Active"
            value={
              summary.active
            }
            loading={
              summaryLoading
            }
            description="Assignable plans"
          />

          <SummaryCard
            label="Inactive"
            value={
              summary.inactive
            }
            loading={
              summaryLoading
            }
            description="Currently inactive"
          />

          <SummaryCard
            label="Archived"
            value={
              summary.archived
            }
            loading={
              summaryLoading
            }
            description="Archived plans"
          />
        </div>

        {/* FILTERS */}

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search plan name or code..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff4b1f] dark:border-gray-700 dark:text-white"
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) => {
                setStatusFilter(
                  event.target
                    .value as
                    StatusFilter
                );

                setPage(1);
              }}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#5b2eff] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="all">
                All Statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="archived">
                Archived
              </option>
            </select>

            {hasFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={
                  clearFilters
                }
              >
                Clear Filters
              </Button>
            )}
          </div>

          <p className="mt-3 text-[11px] text-gray-400">
            Search and status filtering are processed by the backend.
          </p>
        </section>

        {/* TABLE */}

        <section className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Plan Directory
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Loading plans..."
                  : loadError
                    ? "Plan data unavailable"
                    : `${pagination.total.toLocaleString(
                        "en-PK"
                      )} plan${
                        pagination.total ===
                        1
                          ? ""
                          : "s"
                      }`}
              </p>
            </div>

            <SlidersHorizontal className="size-4 text-gray-400" />
          </div>

          <div className="block w-full overflow-x-auto">
            <table className="w-full min-w-[1250px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                  <TableHeading>
                    Plan
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <TableHeading>
                    Billing
                  </TableHeading>

                  <TableHeading>
                    Price
                  </TableHeading>

                  <TableHeading>
                    Product Capacity
                  </TableHeading>

                  <TableHeading>
                    Marketplace
                  </TableHeading>

                  <TableHeading>
                    Supplier Bid
                  </TableHeading>

                  <TableHeading>
                    Customer Range
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
                      className="px-6 py-16 text-center"
                    >
                      <LoaderCircle className="mx-auto size-7 animate-spin text-[#5b2eff]" />

                      <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Loading subscription plans
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Fetching plan records from the backend.
                      </p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  loadError && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-14 text-center"
                      >
                        <CircleAlert className="mx-auto size-7 text-red-500" />

                        <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
                          Unable to load plans
                        </p>

                        <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-gray-500">
                          {
                            loadError
                          }
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setLoading(
                              true
                            );

                            void loadPlans();
                          }}
                          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                        >
                          <RefreshCw className="size-3.5" />

                          Retry
                        </button>
                      </td>
                    </tr>
                  )}

                {!loading &&
                  !loadError &&
                  plans.map(
                    (
                      plan
                    ) => (
                      <tr
                        key={
                          plan._id ||
                          plan.code
                        }
                        className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                      >
                        {/* PLAN */}

                        <td className="px-4 py-3">
                          <div className="min-w-[230px]">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {
                                plan.name
                              }
                            </p>

                            <p className="mt-1 font-mono text-[10px] font-semibold text-[#8f78ff]">
                              {
                                plan.code
                              }
                            </p>

                            {plan.description && (
                              <p className="mt-1 line-clamp-2 max-w-[260px] text-[11px] leading-5 text-gray-500">
                                {
                                  plan.description
                                }
                              </p>
                            )}
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-3">
                          <StatusBadge
                            status={
                              plan.status
                            }
                          />
                        </td>

                        {/* BILLING */}

                        <td className="px-4 py-3">
                          <div className="min-w-[130px]">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {formatStatus(
                                plan.billingCycle
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-gray-500">
                              {
                                plan.durationMonths
                              }{" "}
                              month
                              {plan.durationMonths ===
                              1
                                ? ""
                                : "s"}
                            </p>
                          </div>
                        </td>

                        {/* PRICE */}

                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {formatMoney(
                              plan.price,
                              plan.currency
                            )}
                          </p>
                        </td>

                        {/* PRODUCT CAPACITY */}

                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {plan.unlimitedProducts
                              ? "Unlimited"
                              : Number(
                                  plan.productLimit ??
                                    0
                                ).toLocaleString(
                                  "en-PK"
                                )}
                          </p>
                        </td>

                        {/* MARKETPLACE */}

                        <td className="px-4 py-3">
                          <FeatureBadge
                            enabled={
                              Boolean(
                                plan.features
                                  ?.marketplaceListing
                                  ?.enabled
                              )
                            }
                          />
                        </td>

                        {/* SUPPLIER BID */}

                        <td className="px-4 py-3">
                          <div className="min-w-[145px]">
                            <FeatureBadge
                              enabled={
                                Boolean(
                                  plan.features
                                    ?.supplierBid
                                    ?.enabled
                                )
                              }
                            />

                            {plan.features
                              ?.supplierBid
                              ?.enabled && (
                              <p className="mt-1.5 text-[10px] font-medium text-gray-500">
                                Max reduction:{" "}
                                {Number(
                                  plan.features
                                    .supplierBid
                                    .maxReductionPercent ??
                                    0
                                )}
                                %
                              </p>
                            )}
                          </div>
                        </td>

                        {/* CUSTOMER RANGE */}

                        <td className="px-4 py-3">
                          <FeatureBadge
                            enabled={
                              Boolean(
                                plan.features
                                  ?.customerRange
                                  ?.enabled
                              )
                            }
                          />
                        </td>

                        {/* ACTIONS */}

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit(
                                      plan
                                    )
                                  }
                                  className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#5b2eff]/10 hover:text-[#8f78ff]"
                                  title="Edit Plan"
                                >
                                  <Pencil className="size-4" />
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    plan.status ===
                                      "archived" ||
                                    Boolean(
                                      archivingId
                                    )
                                  }
                                  onClick={() =>
                                    void handleArchive(
                                      plan
                                    )
                                  }
                                  className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-500/10"
                                  title="Archive Plan"
                                >
                                  {archivingId ===
                                  (
                                    plan._id ||
                                    plan.code
                                  ) ? (
                                    <LoaderCircle className="size-4 animate-spin" />
                                  ) : (
                                    <Archive className="size-4" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                {!loading &&
                  !loadError &&
                  plans.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-16 text-center"
                      >
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          No subscription plans found.
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {hasFilters
                            ? "Adjust the search or status filter."
                            : "Create the first subscription plan."}
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
            pagination.total >
              0 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Showing{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {
                        firstResult
                      }
                    </span>
                    {" - "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {
                        lastResult
                      }
                    </span>
                    {" of "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {pagination.total.toLocaleString(
                        "en-PK"
                      )}
                    </span>
                  </p>

                  <select
                    aria-label="Plans per page"
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

                      setPage(
                        1
                      );
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
                          {
                            size
                          }{" "}
                          / page
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

        {/* ARCHITECTURE NOTE */}

        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-gray-400" />

          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              Plan features are defaults, not final supplier permissions
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
              Effective supplier access may differ because supplier
              status, verification, subscription state and
              supplier-specific overrides are resolved separately by
              the backend.
            </p>
          </div>
        </div>
      </div>

      {/* PLAN MODAL */}

      {modalOpen && (
        <PlanModal
          form={
            form
          }
          editing={
            Boolean(
              editingPlan
            )
          }
          saving={
            saving
          }
          onClose={
            closeModal
          }
          onSave={() =>
            void handleSave()
          }
          updateField={
            updateField
          }
        />
      )}
    </>
  );
}

/* =========================================================
   PLAN MODAL
========================================================= */

function PlanModal({
  form,
  editing,
  saving,
  onClose,
  onSave,
  updateField,
}: {
  form:
    PlanForm;

  editing:
    boolean;

  saving:
    boolean;

  onClose:
    () => void;

  onSave:
    () => void;

  updateField:
    <
      K extends keyof PlanForm
    >(
      key: K,
      value:
        PlanForm[K]
    ) => void;
}) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editing
                ? "Edit Subscription Plan"
                : "Create Subscription Plan"}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Configure plan defaults. Supplier-specific overrides are managed separately.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="flex size-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* FORM */}

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Plan Name"
            >
              <input
                value={
                  form.name
                }
                onChange={(
                  event
                ) => {
                  const value =
                    event.target
                      .value;

                  updateField(
                    "name",
                    value
                  );

                  if (
                    !editing
                  ) {
                    updateField(
                      "code",
                      createCode(
                        value
                      )
                    );
                  }
                }}
                className="sth-plan-input"
                placeholder="Growth"
              />
            </Field>

            <Field
              label="Plan Code"
            >
              <input
                value={
                  form.code
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "code",
                    createCode(
                      event.target
                        .value
                    )
                  )
                }
                className="sth-plan-input font-mono"
                placeholder="growth"
              />
            </Field>

            <Field
              label="Status"
            >
              <select
                value={
                  form.status
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "status",
                    event.target
                      .value as
                      SubscriptionPlanStatus
                  )
                }
                className="sth-plan-input"
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

                {editing && (
                  <option value="archived">
                    Archived
                  </option>
                )}
              </select>
            </Field>

            <Field
              label="Billing Cycle"
            >
              <select
                value={
                  form.billingCycle
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "billingCycle",
                    event.target
                      .value as
                      SubscriptionPlanBillingCycle
                  )
                }
                className="sth-plan-input"
              >
                <option value="monthly">
                  Monthly
                </option>

                <option value="quarterly">
                  Quarterly
                </option>

                <option value="yearly">
                  Yearly
                </option>

                <option value="custom">
                  Custom
                </option>
              </select>
            </Field>

            <Field
              label="Duration (Months)"
            >
              <input
                type="number"
                min="1"
                step="1"
                value={
                  form.durationMonths
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "durationMonths",
                    event.target
                      .value
                  )
                }
                className="sth-plan-input"
              />
            </Field>

            <Field
              label="Price"
            >
              <div className="grid grid-cols-[1fr_100px] gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.price
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "price",
                      event.target
                        .value
                    )
                  }
                  className="sth-plan-input"
                />

                <input
                  value={
                    form.currency
                  }
                  maxLength={3}
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "currency",
                      event.target
                        .value
                        .toUpperCase()
                    )
                  }
                  className="sth-plan-input text-center font-semibold uppercase"
                />
              </div>
            </Field>

            <Field
              label="Sort Order"
            >
              <input
                type="number"
                min="0"
                step="1"
                value={
                  form.sortOrder
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "sortOrder",
                    event.target
                      .value
                  )
                }
                className="sth-plan-input"
              />
            </Field>
          </div>

          <Field
            label="Description"
          >
            <textarea
              rows={3}
              value={
                form.description
              }
              onChange={(
                event
              ) =>
                updateField(
                  "description",
                  event.target
                    .value
                )
              }
              className="sth-plan-input min-h-[92px] py-3"
              placeholder="Describe the supplier subscription plan..."
            />
          </Field>

          {/* PRODUCT CAPACITY */}

          <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Product Capacity
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Defines the default number of external catalogue products a supplier may enable through Solar Trade Hub.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ToggleCard
                label="Unlimited Products"
                description="No numeric product capacity limit for this plan."
                checked={
                  form.unlimitedProducts
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "unlimitedProducts",
                    value
                  )
                }
              />

              <Field
                label="Product Limit"
              >
                <input
                  type="number"
                  min="0"
                  step="1"
                  disabled={
                    form.unlimitedProducts
                  }
                  value={
                    form.productLimit
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "productLimit",
                      event.target
                        .value
                    )
                  }
                  className="sth-plan-input disabled:cursor-not-allowed disabled:opacity-50"
                />
              </Field>
            </div>
          </section>

          {/* ENTITLEMENTS */}

          <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Default Marketplace Entitlements
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              These are plan defaults. Supplier-specific overrides may later allow, deny or inherit each entitlement.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <ToggleCard
                label="Marketplace Listing"
                description="Allows marketplace listing when supplier eligibility gates and product access also pass."
                checked={
                  form.marketplaceListing
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "marketplaceListing",
                    value
                  )
                }
              />

              <ToggleCard
                label="Customer Range"
                description="Allows this supplier plan to participate in customer-initiated Customer Range requests."
                checked={
                  form.customerRange
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "customerRange",
                    value
                  )
                }
              />

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:col-span-2">
                <ToggleCard
                  borderless
                  label="Supplier Bid"
                  description="Allows supplier-initiated bidding under this plan. Supplier Bid reduction is separate from the Customer Range token rules."
                  checked={
                    form.supplierBid
                  }
                  onChange={(
                    value
                  ) =>
                    updateField(
                      "supplierBid",
                      value
                    )
                  }
                />

                <div className="mt-4 max-w-sm">
                  <Field
                    label="Maximum Supplier Bid Reduction %"
                  >
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      disabled={
                        !form.supplierBid
                      }
                      value={
                        form.supplierBidMaxReductionPercent
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "supplierBidMaxReductionPercent",
                          event.target
                            .value
                        )
                      }
                      className="sth-plan-input disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </Field>

                  <p className="mt-2 text-[11px] leading-5 text-gray-400">
                    Do not apply the Customer Range 3% maximum here. Supplier Bid uses this plan-specific backend entitlement.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* FOOTER */}

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              onSave
            }
            disabled={
              saving
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-4 text-sm font-semibold text-white transition hover:bg-[#e7431b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            {editing
              ? "Save Changes"
              : "Create Plan"}
          </button>
        </div>

        <style>
          {`
            .sth-plan-input {
              width: 100%;
              min-height: 42px;
              border-radius: 0.5rem;
              border: 1px solid rgb(229 231 235);
              background: transparent;
              padding-left: 0.75rem;
              padding-right: 0.75rem;
              font-size: 0.875rem;
              color: rgb(17 24 39);
              outline: none;
              transition:
                border-color 150ms ease,
                box-shadow 150ms ease;
            }

            .sth-plan-input:focus {
              border-color: #5b2eff;
              box-shadow: 0 0 0 1px #5b2eff;
            }

            .dark .sth-plan-input {
              border-color: rgb(55 65 81);
              color: rgb(243 244 246);
              background: rgb(17 24 39);
            }
          `}
        </style>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  children,
}: {
  label: string;
  children:
    ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </span>

      {children}
    </label>
  );
}

/* =========================================================
   TOGGLE CARD
========================================================= */

function ToggleCard({
  label,
  description,
  checked,
  onChange,
  borderless = false,
}: {
  label: string;
  description: string;
  checked: boolean;

  onChange:
    (
      value:
        boolean
    ) => void;

  borderless?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(
          !checked
        )
      }
      className={`w-full text-left ${
        borderless
          ? ""
          : "rounded-xl border border-gray-200 p-4 dark:border-gray-800"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {label}
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>

        <span
          className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
            checked
              ? "bg-[#5b2eff]"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          <span
            className={`flex size-5 items-center justify-center rounded-full bg-white shadow transition ${
              checked
                ? "translate-x-5"
                : ""
            }`}
          >
            {checked && (
              <Check className="size-3 text-[#5b2eff]" />
            )}
          </span>
        </span>
      </div>
    </button>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    SubscriptionPlanStatus;
}) {
  const classes:
    Record<
      SubscriptionPlanStatus,
      string
    > = {
    active:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",

    inactive:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",

    archived:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        classes[
          status
        ]
      }`}
    >
      {formatStatus(
        status
      )}
    </span>
  );
}

/* =========================================================
   FEATURE BADGE
========================================================= */

function FeatureBadge({
  enabled,
}: {
  enabled:
    boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        enabled
          ? "bg-[#5b2eff]/10 text-[#5b2eff] dark:text-[#8f78ff]"
          : "bg-gray-100 text-gray-400 dark:bg-gray-800"
      }`}
    >
      {enabled
        ? "Enabled"
        : "Disabled"}
    </span>
  );
}

/* =========================================================
   TABLE HEADING
========================================================= */

function TableHeading({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
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

  value:
    number |
    null;

  description:
    string;

  loading:
    boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium text-gray-500">
        {label}
      </p>

      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      ) : (
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
          {value ===
          null
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