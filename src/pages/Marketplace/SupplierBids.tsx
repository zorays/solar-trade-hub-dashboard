import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  Filter,
  Gavel,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
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
  formatSupplierBidStatus,
  getSupplierBidErrorMessage,
  getSupplierBidSummary,
  getSupplierBidSupplierName,
  getSupplierBidSupplierReference,
  getSupplierBids,
  reviewSupplierBid,
  type SupplierBid,
  type SupplierBidStatus,
  type SupplierBidSummary,
} from "../../services/supplier/supplierBid.service";

/* =========================================================
   TYPES
========================================================= */

type BidStatusFilter =
  | "all"
  | SupplierBidStatus;

type BidCurrentFilter =
  | "all"
  | "current"
  | "history";

type BidPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type NullableBidSummary = {
  total: number | null;
  current: number | null;
  pending: number | null;
  approved: number | null;
  rejected: number | null;
  expired: number | null;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE_OPTIONS = [
  20,
  50,
  100,
];

const EMPTY_PAGINATION: BidPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_SUMMARY: NullableBidSummary = {
  total: null,
  current: null,
  pending: null,
  approved: null,
  rejected: null,
  expired: null,
};

const STATUS_OPTIONS: Array<{
  value: BidStatusFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All Bid Status",
  },
  {
    value: "pending",
    label: "Pending Review",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "expired",
    label: "Expired",
  },
];

const CURRENT_OPTIONS: Array<{
  value: BidCurrentFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "Current + History",
  },
  {
    value: "current",
    label: "Current Bids",
  },
  {
    value: "history",
    label: "Historical Bids",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  value: number,
  currency = "PKR"
) {
  try {
    return new Intl.NumberFormat(
      "en-PK",
      {
        style: "currency",
        currency:
          currency ||
          "PKR",
        maximumFractionDigits: 2,
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
}

function formatDateTime(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

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
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function getSupplierId(
  bid:
    SupplierBid
) {
  if (
    typeof bid.supplier ===
    "string"
  ) {
    return bid.supplier;
  }

  return (
    bid.supplier
      ?.supplierId ||
    bid.supplier
      ?._id ||
    ""
  );
}

function normalizePagination(
  pagination:
    Partial<BidPagination> |
    null |
    undefined,
  page: number,
  limit: number
): BidPagination {
  const total =
    Math.max(
      0,
      Number(
        pagination?.total ??
          0
      ) ||
        0
    );

  const totalPages =
    Math.max(
      0,
      Number(
        pagination
          ?.totalPages ??
          (
            total === 0
              ? 0
              : Math.ceil(
                  total /
                    limit
                )
          )
      ) ||
        0
    );

  return {
    page:
      Number(
        pagination?.page ??
          page
      ) ||
      page,

    limit:
      Number(
        pagination?.limit ??
          limit
      ) ||
      limit,

    total,

    totalPages,

    hasNextPage:
      typeof pagination
        ?.hasNextPage ===
      "boolean"
        ? pagination.hasNextPage
        : page <
          totalPages,

    hasPreviousPage:
      typeof pagination
        ?.hasPreviousPage ===
      "boolean"
        ? pagination.hasPreviousPage
        : page >
          1,
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function SupplierBids() {
  const { user } =
    useAuth();

  /*
   * Current backend mount:
   *
   * /api/v1/suppliers/bids
   *
   * is protected by suppliers.manage.
   *
   * supplier_bids.view/manage can replace this once backend
   * route permissions are migrated.
   */
  const canManage =
    hasUserPermission(
      user,
      "suppliers.manage"
    );

  const [
    bids,
    setBids,
  ] =
    useState<
      SupplierBid[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<NullableBidSummary>({
      ...EMPTY_SUMMARY,
    });

  const [
    pagination,
    setPagination,
  ] =
    useState<BidPagination>({
      ...EMPTY_PAGINATION,
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
    useState<BidStatusFilter>(
      "all"
    );

  const [
    currentFilter,
    setCurrentFilter,
  ] =
    useState<BidCurrentFilter>(
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
    selectedBid,
    setSelectedBid,
  ] =
    useState<
      SupplierBid |
      null
    >(null);

  const [
    reviewSaving,
    setReviewSaving,
  ] =
    useState(false);

  /* =======================================================
     DEBOUNCE SEARCH
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
     BACKEND QUERY
  ======================================================= */

  const bidQuery =
    useMemo(
      () => ({
        page,
        limit,

        sortBy:
          "createdAt" as const,

        sortOrder:
          "desc" as const,

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

        ...(currentFilter ===
        "current"
          ? {
              isCurrent:
                true,
            }
          : {}),

        ...(currentFilter ===
        "history"
          ? {
              isCurrent:
                false,
            }
          : {}),
      }),
      [
        page,
        limit,
        debouncedSearch,
        statusFilter,
        currentFilter,
      ]
    );

  /* =======================================================
     LOAD BIDS
  ======================================================= */

  const loadBids =
    useCallback(
      async (
        showToast =
          false
      ) => {
        if (!canManage) {
          setBids([]);

          setPagination({
            ...EMPTY_PAGINATION,
            page,
            limit,
          });

          setLoadError(
            "Current supplier bid backend routes require suppliers.manage permission."
          );

          setLoading(
            false
          );

          setRefreshing(
            false
          );

          return;
        }

        try {
          setLoadError("");

          const result =
            await getSupplierBids(
              bidQuery
            );

          setBids(
            result.bids
          );

          setPagination(
            normalizePagination(
              result.pagination,
              page,
              limit
            )
          );

          if (
            showToast
          ) {
            toast.success(
              "Supplier bids refreshed successfully."
            );
          }
        } catch (
          error
        ) {
          const message =
            getSupplierBidErrorMessage(
              error,
              "Unable to load supplier bids."
            );

          setBids([]);

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
              "Unable to refresh supplier bids",
              {
                description:
                  message,
              }
            );
          }
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        canManage,
        bidQuery,
        page,
        limit,
      ]
    );

  /* =======================================================
     SUMMARY
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

          const result:
            SupplierBidSummary =
            await getSupplierBidSummary();

          setSummary({
            total:
              Number(
                result.total
              ),

            current:
              Number(
                result.current
              ),

            pending:
              Number(
                result.pending
              ),

            approved:
              Number(
                result.approved
              ),

            rejected:
              Number(
                result.rejected
              ),

            expired:
              Number(
                result.expired
              ),
          });
        } catch {
          /*
           * Do not show fake zeroes if summary fails.
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
        canManage,
      ]
    );

  /* =======================================================
     QUERY LOAD
  ======================================================= */

  useEffect(() => {
    setLoading(
      true
    );

    void loadBids();
  }, [loadBids]);

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
        loadBids(true),
        loadSummary(),
      ]);
    };

  /* =======================================================
     REVIEW
  ======================================================= */

  const handleReview =
    async (
      bid:
        SupplierBid,

      status:
        | "approved"
        | "rejected",

      adminNote:
        string
    ) => {
      if (
        !canManage
      ) {
        toast.error(
          "You do not have permission to review supplier bids."
        );

        return;
      }

      if (
        bid.status !==
        "pending"
      ) {
        toast.error(
          "Only pending bids can be reviewed."
        );

        return;
      }

      if (
        !bid.isCurrent
      ) {
        toast.error(
          "Only the current pending bid can be reviewed."
        );

        return;
      }

      try {
        setReviewSaving(
          true
        );

        const updated =
          await reviewSupplierBid(
            bid._id,
            {
              status,

              adminNote:
                adminNote
                  .trim() ||
                undefined,
            }
          );

        /*
         * Keep modal immediately synchronized with backend
         * response.
         */
        setSelectedBid(
          updated
        );

        toast.success(
          status ===
            "approved"
            ? "Supplier bid approved successfully."
            : "Supplier bid rejected successfully."
        );

        /*
         * Reload current server-side page because changing
         * status/current state can remove the record from
         * active filters.
         */
        setLoading(
          true
        );

        await Promise.all([
          loadBids(),
          loadSummary(),
        ]);
      } catch (
        error
      ) {
        toast.error(
          status ===
            "approved"
            ? "Unable to approve supplier bid"
            : "Unable to reject supplier bid",
          {
            description:
              getSupplierBidErrorMessage(
                error
              ),
          }
        );
      } finally {
        setReviewSaving(
          false
        );
      }
    };

  /* =======================================================
     FILTER RESET
  ======================================================= */

  const clearFilters =
    () => {
      setSearch("");

      setDebouncedSearch(
        ""
      );

      setStatusFilter(
        "all"
      );

      setCurrentFilter(
        "all"
      );

      setPage(
        1
      );
    };

  const hasFilters =
    Boolean(
      search ||
      statusFilter !==
        "all" ||
      currentFilter !==
        "all"
    );

  /* =======================================================
     PAGINATION DISPLAY
  ======================================================= */

  const firstResult =
    pagination.total >
    0
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
        title="Supplier Bids | Solar Trade Hub"
        description="Review and manage supplier pricing bids."
      />

      <PageBreadcrumb
        pageTitle="Supplier Bids"
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
                Supplier Bids
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4b1f]/10 px-2.5 py-1 text-xs font-semibold text-[#ff4b1f]">
                <Gavel className="size-3.5" />

                Backend Connected
              </span>
            </div>

            <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Review supplier-initiated price bids against external
              catalogue products. Approval re-checks the live product
              rate and the supplier's current effective Supplier Bid
              entitlement on the backend.
            </p>
          </div>

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
        </div>

        {/* PERMISSION NOTICE */}

        {!canManage && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Supplier Bid backend access unavailable
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-400">
                Current backend Supplier Bid routes are protected by
                suppliers.manage. Dedicated supplier_bids permissions
                can replace this after the backend authorization layer
                is migrated.
              </p>
            </div>
          </div>
        )}

        {/* SUMMARY */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          <SummaryCard
            label="Total Bids"
            value={
              summary.total
            }
            loading={
              summaryLoading
            }
            description="All historical bids"
          />

          <SummaryCard
            label="Current"
            value={
              summary.current
            }
            loading={
              summaryLoading
            }
            description="Current supplier/product bids"
          />

          <SummaryCard
            label="Pending"
            value={
              summary.pending
            }
            loading={
              summaryLoading
            }
            description="Waiting for review"
          />

          <SummaryCard
            label="Approved"
            value={
              summary.approved
            }
            loading={
              summaryLoading
            }
            description="Approved bids"
          />

          <SummaryCard
            label="Rejected"
            value={
              summary.rejected
            }
            loading={
              summaryLoading
            }
            description="Rejected bids"
          />

          <SummaryCard
            label="Expired"
            value={
              summary.expired
            }
            loading={
              summaryLoading
            }
            description="Past validity"
          />
        </div>

        {/* SERVER VALIDATION INFO */}

        <section className="rounded-xl border border-[#5b2eff]/15 bg-[#5b2eff]/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#5b2eff] dark:text-[#8f78ff]" />

            <div>
              <p className="text-xs font-semibold text-[#5b2eff] dark:text-[#8f78ff]">
                Approval is server validated
              </p>

              <p className="mt-1 text-[11px] leading-5 text-gray-500">
                Saved base rate and permission snapshots are historical
                references only. During approval, the backend re-reads
                the external product, checks its live rate and
                availability, then resolves the supplier's current
                marketplace eligibility and effective maximum Supplier
                Bid reduction again.
              </p>
            </div>
          </div>
        </section>

        {/* FILTERS */}

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_210px_210px_auto]">
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
                placeholder="Search product, brand, category or external product ID..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff4b1f] dark:border-gray-700 dark:text-white"
              />
            </div>

            <FilterSelect
              value={
                statusFilter
              }
              onChange={(
                value
              ) => {
                setStatusFilter(
                  value as
                    BidStatusFilter
                );

                setPage(
                  1
                );
              }}
              options={
                STATUS_OPTIONS
              }
            />

            <FilterSelect
              value={
                currentFilter
              }
              onChange={(
                value
              ) => {
                setCurrentFilter(
                  value as
                    BidCurrentFilter
                );

                setPage(
                  1
                );
              }}
              options={
                CURRENT_OPTIONS
              }
            />

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

          <p className="mt-3 text-[11px] leading-5 text-gray-400">
            Search and status/current filters are processed by the
            backend. General search covers the external product ID and
            stored product name, brand and category snapshot.
          </p>
        </section>

        {/* TABLE */}

        <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Bid Queue
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Loading supplier bids..."
                  : loadError
                    ? "Bid data unavailable"
                    : `${pagination.total.toLocaleString(
                        "en-PK"
                      )} bid${
                        pagination.total ===
                        1
                          ? ""
                          : "s"
                      }`}
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-500 dark:bg-gray-800">
              <Filter className="size-3" />

              Real data only
            </span>
          </div>

          <div className="block w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[1700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                  <TableHeading>
                    Supplier
                  </TableHeading>

                  <TableHeading>
                    Product
                  </TableHeading>

                  <TableHeading>
                    Base Rate
                  </TableHeading>

                  <TableHeading>
                    Bid Rate
                  </TableHeading>

                  <TableHeading>
                    Reduction
                  </TableHeading>

                  <TableHeading>
                    Allowed Max
                  </TableHeading>

                  <TableHeading>
                    Valid Until
                  </TableHeading>

                  <TableHeading>
                    Submitted
                  </TableHeading>

                  <TableHeading>
                    Status
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
                      colSpan={10}
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
                        colSpan={10}
                        className="px-6 py-16"
                      >
                        <ErrorState
                          message={
                            loadError
                          }
                          onRetry={() => {
                            setLoading(
                              true
                            );

                            void loadBids();
                          }}
                        />
                      </td>
                    </tr>
                  )}

                {!loading &&
                  !loadError &&
                  bids.map(
                    (
                      bid
                    ) => {
                      const supplierReference =
                        getSupplierId(
                          bid
                        );

                      return (
                        <tr
                          key={
                            bid._id
                          }
                          className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                        >
                          {/* SUPPLIER */}

                          <td className="px-4 py-3">
                            <div className="min-w-[220px]">
                              {supplierReference ? (
                                <Link
                                  to={`/suppliers/${encodeURIComponent(
                                    supplierReference
                                  )}`}
                                  className="text-sm font-semibold text-gray-900 transition hover:text-[#ff4b1f] dark:text-white"
                                >
                                  {getSupplierBidSupplierName(
                                    bid
                                  )}
                                </Link>
                              ) : (
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {getSupplierBidSupplierName(
                                    bid
                                  )}
                                </p>
                              )}

                              <p className="mt-1 font-mono text-[10px] font-semibold text-[#8f78ff]">
                                {getSupplierBidSupplierReference(
                                  bid
                                ) ||
                                  "—"}
                              </p>

                              {!bid.isCurrent && (
                                <span className="mt-1.5 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500 dark:bg-gray-800">
                                  History
                                </span>
                              )}
                            </div>
                          </td>

                          {/* PRODUCT */}

                          <td className="px-4 py-3">
                            <div className="min-w-[290px]">
                              <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                                {bid.productSnapshot
                                  ?.name ||
                                  "External Product"}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-gray-500">
                                {bid.productSnapshot
                                  ?.brand && (
                                  <span>
                                    {
                                      bid.productSnapshot
                                        .brand
                                    }
                                  </span>
                                )}

                                {bid.productSnapshot
                                  ?.category && (
                                  <span>
                                    {
                                      bid.productSnapshot
                                        .category
                                    }
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 max-w-[280px] truncate font-mono text-[10px] text-gray-400">
                                {
                                  bid.externalProductId
                                }
                              </p>
                            </div>
                          </td>

                          {/* BASE RATE */}

                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {formatMoney(
                              bid.baseRate,
                              bid.currency
                            )}
                          </td>

                          {/* BID RATE */}

                          <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                            {formatMoney(
                              bid.bidRate,
                              bid.currency
                            )}
                          </td>

                          {/* REDUCTION */}

                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="inline-flex rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-600">
                              -
                              {Number(
                                bid.reductionPercent ||
                                  0
                              ).toFixed(
                                2
                              )}
                              %
                            </span>
                          </td>

                          {/* ALLOWED MAX */}

                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {Number(
                                bid.permissionSnapshot
                                  ?.maxReductionPercent ||
                                  0
                              ).toFixed(
                                2
                              )}
                              %
                            </span>

                            <p className="mt-1 text-[9px] text-gray-400">
                              submission snapshot
                            </p>
                          </td>

                          {/* VALID UNTIL */}

                          <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                            {formatDateTime(
                              bid.validUntil
                            )}
                          </td>

                          {/* CREATED */}

                          <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                            {formatDateTime(
                              bid.createdAt
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="whitespace-nowrap px-4 py-3">
                            <BidStatusBadge
                              status={
                                bid.status
                              }
                            />
                          </td>

                          {/* ACTION */}

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                title={
                                  bid.status ===
                                    "pending" &&
                                  bid.isCurrent &&
                                  canManage
                                    ? "Review Bid"
                                    : "View Bid"
                                }
                                onClick={() =>
                                  setSelectedBid(
                                    bid
                                  )
                                }
                                className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#5b2eff]/10 hover:text-[#8f78ff]"
                              >
                                <Eye className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}

                {!loading &&
                  !loadError &&
                  bids.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-16"
                      >
                        <EmptyState
                          filtered={
                            hasFilters
                          }
                        />
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
                    aria-label="Supplier bids per page"
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
      </div>

      {/* REVIEW MODAL */}

      {selectedBid && (
        <BidReviewModal
          bid={
            selectedBid
          }
          saving={
            reviewSaving
          }
          canManage={
            canManage
          }
          onReview={
            handleReview
          }
          onClose={() => {
            if (
              reviewSaving
            ) {
              return;
            }

            setSelectedBid(
              null
            );
          }}
        />
      )}
    </>
  );
}

/* =========================================================
   REVIEW MODAL
========================================================= */

function BidReviewModal({
  bid,
  saving,
  canManage,
  onReview,
  onClose,
}: {
  bid:
    SupplierBid;

  saving:
    boolean;

  canManage:
    boolean;

  onReview:
    (
      bid:
        SupplierBid,

      status:
        | "approved"
        | "rejected",

      adminNote:
        string
    ) => Promise<void>;

  onClose:
    () => void;
}) {
  const [
    adminNote,
    setAdminNote,
  ] =
    useState(
      bid.adminNote ||
        ""
    );

  useEffect(() => {
    setAdminNote(
      bid.adminNote ||
        ""
    );
  }, [
    bid._id,
    bid.adminNote,
  ]);

  const supplierReference =
    getSupplierId(
      bid
    );

  const canReview =
    canManage &&
    bid.status ===
      "pending" &&
    bid.isCurrent;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close bid review"
        disabled={
          saving
        }
        onClick={
          onClose
        }
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] disabled:cursor-not-allowed"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-[780px] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101828]">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {canReview
                  ? "Review Supplier Bid"
                  : "Supplier Bid Details"}
              </h3>

              <BidStatusBadge
                status={
                  bid.status
                }
              />

              {!bid.isCurrent && (
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-800">
                  Historical
                </span>
              )}
            </div>

            {supplierReference ? (
              <Link
                to={`/suppliers/${encodeURIComponent(
                  supplierReference
                )}`}
                className="mt-1 inline-block text-sm font-semibold text-gray-700 transition hover:text-[#ff4b1f] dark:text-gray-300"
              >
                {getSupplierBidSupplierName(
                  bid
                )}
              </Link>
            ) : (
              <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                {getSupplierBidSupplierName(
                  bid
                )}
              </p>
            )}

            <p className="mt-0.5 font-mono text-[10px] text-gray-400">
              {getSupplierBidSupplierReference(
                bid
              ) ||
                "—"}
            </p>
          </div>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="flex size-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-white/[0.05] dark:hover:text-white"
          >
            <XCircle className="size-5" />
          </button>
        </div>

        {/* BODY */}

        <div className="space-y-4 p-6">
          {/* PRODUCT */}

          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {bid.productSnapshot
                ?.name ||
                "External Product"}
            </p>

            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
              {bid.productSnapshot
                ?.brand && (
                <span>
                  Brand:{" "}
                  {
                    bid.productSnapshot
                      .brand
                  }
                </span>
              )}

              {bid.productSnapshot
                ?.category && (
                <span>
                  Category:{" "}
                  {
                    bid.productSnapshot
                      .category
                  }
                </span>
              )}

              {bid.productSnapshot
                ?.size !==
                null &&
                bid.productSnapshot
                  ?.size !==
                  undefined && (
                  <span>
                    Size:{" "}
                    {
                      bid.productSnapshot
                        .size
                    }{" "}
                    {bid.productSnapshot
                      .unit ||
                      ""}
                  </span>
                )}
            </div>

            <p className="mt-2 break-all font-mono text-[10px] text-gray-400">
              {
                bid.externalProductId
              }
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniInfo
                label="Base Rate"
                value={
                  formatMoney(
                    bid.baseRate,
                    bid.currency
                  )
                }
              />

              <MiniInfo
                label="Bid Rate"
                value={
                  formatMoney(
                    bid.bidRate,
                    bid.currency
                  )
                }
              />

              <MiniInfo
                label="Reduction"
                value={`-${Number(
                  bid.reductionPercent ||
                    0
                ).toFixed(
                  2
                )}%`}
              />

              <MiniInfo
                label="Allowed Max at Submission"
                value={`${Number(
                  bid.permissionSnapshot
                    ?.maxReductionPercent ||
                    0
                ).toFixed(
                  2
                )}%`}
              />
            </div>
          </div>

          {/* VALIDITY + PERMISSION SNAPSHOT */}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoPanel
              title="Bid Validity"
              icon={
                <Clock3 className="size-4" />
              }
            >
              <MiniInfo
                label="Valid From"
                value={
                  formatDateTime(
                    bid.validFrom
                  )
                }
              />

              <MiniInfo
                label="Valid Until"
                value={
                  formatDateTime(
                    bid.validUntil
                  )
                }
              />

              <MiniInfo
                label="Submitted"
                value={
                  formatDateTime(
                    bid.createdAt
                  )
                }
              />

              <MiniInfo
                label="Current"
                value={
                  bid.isCurrent
                    ? "Yes"
                    : "No"
                }
              />
            </InfoPanel>

            <InfoPanel
              title="Permission Snapshot"
              icon={
                <ShieldCheck className="size-4" />
              }
            >
              <MiniInfo
                label="Plan"
                value={
                  bid.permissionSnapshot
                    ?.planCode ||
                  "—"
                }
              />

              <MiniInfo
                label="Bid Enabled"
                value={
                  bid.permissionSnapshot
                    ?.supplierBidEnabled
                    ? "Yes"
                    : "No"
                }
              />

              <MiniInfo
                label="Maximum Reduction"
                value={`${Number(
                  bid.permissionSnapshot
                    ?.maxReductionPercent ||
                    0
                ).toFixed(
                  2
                )}%`}
              />

              <MiniInfo
                label="Record Status"
                value={
                  formatSupplierBidStatus(
                    bid.status
                  )
                }
              />
            </InfoPanel>
          </div>

          {/* REVIEW RESULT */}

          {bid.status !==
            "pending" && (
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Review Result
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MiniInfo
                  label="Reviewed At"
                  value={
                    formatDateTime(
                      bid.reviewedAt
                    )
                  }
                />

                <MiniInfo
                  label="Status"
                  value={
                    formatSupplierBidStatus(
                      bid.status
                    )
                  }
                />
              </div>

              {bid.adminNote && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                  {
                    bid.adminNote
                  }
                </div>
              )}
            </div>
          )}

          {/* HISTORICAL NOTICE */}

          {bid.status ===
            "pending" &&
            !bid.isCurrent && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-gray-400" />

                  <p className="text-xs leading-5 text-gray-500">
                    This is not the current supplier/product bid, so it
                    cannot be reviewed from the dashboard.
                  </p>
                </div>
              </div>
            )}

          {/* REVIEW */}

          {canReview && (
            <>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />

                  <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
                    Approval does not trust the saved rate or permission
                    snapshot. The backend re-reads the external product
                    and resolves the supplier's current effective
                    Supplier Bid permission before accepting the bid.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Admin Note
                </label>

                <textarea
                  rows={4}
                  maxLength={2000}
                  value={
                    adminNote
                  }
                  onChange={(
                    event
                  ) =>
                    setAdminNote(
                      event.target
                        .value
                    )
                  }
                  placeholder="Optional review note..."
                  className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#5b2eff] dark:border-gray-700 dark:bg-[#111827] dark:text-white"
                />

                <p className="mt-1 text-right text-[10px] text-gray-400">
                  {
                    adminNote.length
                  }
                  /2000
                </p>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]"
          >
            Close
          </button>

          {canReview && (
            <>
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  void onReview(
                    bid,
                    "rejected",
                    adminNote
                  )
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
              >
                {saving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <XCircle className="size-4" />
                )}

                Reject
              </button>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  void onReview(
                    bid,
                    "approved",
                    adminNote
                  )
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}

                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
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
    | number
    | null;

  description:
    string;

  loading:
    boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      {loading ? (
        <div className="mt-2 h-7 w-14 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      ) : (
        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
          {value ===
          null
            ? "—"
            : value.toLocaleString(
                "en-PK"
              )}
        </p>
      )}

      <p className="mt-1 text-[10px] text-gray-400">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string;

  options: Array<{
    value: string;
    label: string;
  }>;

  onChange:
    (
      value:
        string
    ) => void;
}) {
  return (
    <div className="relative">
      <select
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
        className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm font-medium text-gray-700 outline-none transition focus:border-[#5b2eff] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-200"
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

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
        ▼
      </span>
    </div>
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
   STATUS BADGE
========================================================= */

function BidStatusBadge({
  status,
}: {
  status:
    SupplierBidStatus;
}) {
  const config = {
    pending: {
      label:
        "Pending",

      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400",

      icon:
        <Clock3 className="size-3" />,
    },

    approved: {
      label:
        "Approved",

      className:
        "bg-green-500/10 text-green-600 dark:text-green-400",

      icon:
        <CheckCircle2 className="size-3" />,
    },

    rejected: {
      label:
        "Rejected",

      className:
        "bg-red-500/10 text-red-600 dark:text-red-400",

      icon:
        <XCircle className="size-3" />,
    },

    expired: {
      label:
        "Expired",

      className:
        "bg-gray-500/10 text-gray-500 dark:text-gray-400",

      icon:
        <Clock3 className="size-3" />,
    },
  }[
    status
  ];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {
        config.icon
      }

      {
        config.label
      }
    </span>
  );
}

/* =========================================================
   MINI INFO
========================================================= */

function MiniInfo({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-semibold text-gray-800 dark:text-gray-200">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   INFO PANEL
========================================================= */

function InfoPanel({
  title,
  icon,
  children,
}: {
  title:
    string;

  icon:
    ReactNode;

  children:
    ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        {icon}

        <p className="text-xs font-semibold">
          {title}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="text-center">
      <LoaderCircle className="mx-auto size-7 animate-spin text-[#5b2eff]" />

      <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Loading supplier bids
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Fetching bid records and dashboard summary from the backend.
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
  message:
    string;

  onRetry:
    () => void;
}) {
  return (
    <div className="text-center">
      <CircleAlert className="mx-auto size-7 text-red-500" />

      <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
        Unable to load supplier bids
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

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  filtered,
}: {
  filtered:
    boolean;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
        <Gavel className="size-5" />
      </div>

      <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        No supplier bids found
      </p>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-500">
        {filtered
          ? "No real supplier bid records match the selected backend filters."
          : "No supplier bid records have been created yet."}
      </p>
    </div>
  );
}