import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  HandCoins,
  LoaderCircle,
  MessageSquareMore,
  RefreshCw,
  Search,
  Send,
  Users,
  X,
  XCircle,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  hasUserPermission,
} from "../../services/auth.service";

import {
  acceptCustomerRequestOffer,
  evaluateCustomerRequestSuppliers,
  formatCustomerRequestReduction,
  formatCustomerRequestTarget,
  getCustomerRequest,
  getCustomerRequestCustomerEmail,
  getCustomerRequestCustomerName,
  getCustomerRequestCustomerPhone,
  getCustomerRequestErrorMessage,
  getCustomerRequestOffers,
  getCustomerRequestProductName,
  getCustomerRequestSummary,
  getCustomerRequestSupplierCity,
  getCustomerRequestSupplierName,
  getCustomerRequestSupplierReference,
  getCustomerRequests,
  inviteCustomerRequestSuppliers,
  reviewCustomerRequest,
  type CustomerRequest,
  type CustomerRequestOffer,
  type CustomerRequestOfferStatus,
  type CustomerRequestPagination,
  type CustomerRequestStatus,
  type CustomerRequestSummary,
} from "../../services/settings/marketplace/customerRequest.service";

/* =========================================================
   TYPES
========================================================= */

type RequestStatusFilter =
  | "all"
  | CustomerRequestStatus;

type NullableSummary = {
  total: number | null;
  new: number | null;
  open: number | null;
  matched: number | null;
  fulfilled: number | null;
  closed: number | null;
  expired: number | null;
  offersSubmitted: number | null;
};

type RequestAction =
  | "open"
  | "route"
  | "close"
  | "accept"
  | null;

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE_OPTIONS = [
  20,
  50,
  100,
];

const EMPTY_PAGINATION:
  CustomerRequestPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_SUMMARY:
  NullableSummary = {
  total: null,
  new: null,
  open: null,
  matched: null,
  fulfilled: null,
  closed: null,
  expired: null,
  offersSubmitted: null,
};

const STATUS_OPTIONS: Array<{
  value:
    RequestStatusFilter;

  label:
    string;
}> = [
  {
    value: "all",
    label: "All Statuses",
  },
  {
    value: "new",
    label: "New",
  },
  {
    value: "open",
    label: "Open",
  },
  {
    value: "matched",
    label: "Matched",
  },
  {
    value: "fulfilled",
    label: "Fulfilled",
  },
  {
    value: "closed",
    label: "Closed",
  },
  {
    value: "expired",
    label: "Expired",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  value:
    | number
    | null
    | undefined,

  currency =
    "PKR"
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

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
          2,
      }
    ).format(
      Number(value)
    );
  } catch {
    return `${currency || "PKR"} ${Number(
      value
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

function canRouteRequest(
  status:
    CustomerRequestStatus
) {
  return (
    status ===
      "new" ||
    status ===
      "open" ||
    status ===
      "matched"
  );
}

function canOpenRequest(
  status:
    CustomerRequestStatus
) {
  return (
    status ===
    "new"
  );
}

function canCloseRequest(
  status:
    CustomerRequestStatus
) {
  return (
    status ===
      "new" ||
    status ===
      "open" ||
    status ===
      "matched"
  );
}

function isRequestLocked(
  status:
    CustomerRequestStatus
) {
  return (
    status ===
      "fulfilled" ||
    status ===
      "closed" ||
    status ===
      "expired"
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CustomerRequests() {
  const {
    user,
  } =
    useAuth();

  const canView =
    hasUserPermission(
      user,
      "customer_requests.view"
    ) ||
    hasUserPermission(
      user,
      "customer_requests.manage"
    ) ||
    hasUserPermission(
      user,
      "suppliers.manage"
    );

  const canManage =
    hasUserPermission(
      user,
      "customer_requests.manage"
    ) ||
    hasUserPermission(
      user,
      "suppliers.manage"
    );

  const [
    requests,
    setRequests,
  ] =
    useState<
      CustomerRequest[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<NullableSummary>({
      ...EMPTY_SUMMARY,
    });

  const [
    pagination,
    setPagination,
  ] =
    useState<CustomerRequestPagination>({
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
    useState<RequestStatusFilter>(
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
    selectedRequestId,
    setSelectedRequestId,
  ] =
    useState<
      string |
      null
    >(null);

  /* =======================================================
     SEARCH
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
        350
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    search,
  ]);

  /* =======================================================
     QUERY
  ======================================================= */

  const query =
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
      }),
      [
        page,
        limit,
        debouncedSearch,
        statusFilter,
      ]
    );

  /* =======================================================
     LOAD REQUESTS
  ======================================================= */

  const loadRequests =
    useCallback(
      async (
        showToast =
          false
      ) => {
        if (
          !canView
        ) {
          setRequests([]);

          setPagination({
            ...EMPTY_PAGINATION,
            page,
            limit,
          });

          setLoadError(
            "You do not have permission to view customer requests."
          );

          setLoading(false);
          setRefreshing(false);

          return;
        }

        try {
          setLoadError("");

          const result =
            await getCustomerRequests(
              query
            );

          setRequests(
            result.requests
          );

          setPagination(
            result.pagination
          );

          if (
            showToast
          ) {
            toast.success(
              "Customer requests refreshed."
            );
          }
        } catch (
          error
        ) {
          const message =
            getCustomerRequestErrorMessage(
              error,
              "Unable to load customer requests."
            );

          setRequests([]);

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
              "Unable to refresh customer requests",
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
        canView,
        query,
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
        if (
          !canView
        ) {
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
            CustomerRequestSummary =
            await getCustomerRequestSummary();

          setSummary({
            total:
              result.total,

            new:
              result.new,

            open:
              result.open,

            matched:
              result.matched,

            fulfilled:
              result.fulfilled,

            closed:
              result.closed,

            expired:
              result.expired,

            offersSubmitted:
              result.offersSubmitted,
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
        canView,
      ]
    );

  /* =======================================================
     EFFECTS
  ======================================================= */

  useEffect(() => {
    setLoading(
      true
    );

    void loadRequests();
  }, [
    loadRequests,
  ]);

  useEffect(() => {
    void loadSummary();
  }, [
    loadSummary,
  ]);

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
        loadRequests(true),
        loadSummary(),
      ]);
    };

  const handleUpdated =
    async () => {
      await Promise.all([
        loadRequests(),
        loadSummary(),
      ]);
    };

  /* =======================================================
     FILTER
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
        title="Customer Requests | Solar Trade Hub"
        description="Manage Customer Range requests and supplier offers."
      />

      <PageBreadcrumb
        pageTitle="Customer Requests"
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
                Customer Requests
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5b2eff]/10 px-2.5 py-1 text-xs font-semibold text-[#5b2eff] dark:text-[#8f78ff]">
                <MessageSquareMore className="size-3.5" />
                Customer Range
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review requests, route them to eligible suppliers
              and manage supplier offers.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={
              refreshing ||
              !canView
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

        {/* SUMMARY */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <SummaryCard
            label="Total"
            value={
              summary.total
            }
            loading={
              summaryLoading
            }
          />

          <SummaryCard
            label="New"
            value={
              summary.new
            }
            loading={
              summaryLoading
            }
          />

          <SummaryCard
            label="Active"
            value={
              summary.open ===
                null ||
              summary.matched ===
                null
                ? null
                : summary.open +
                  summary.matched
            }
            loading={
              summaryLoading
            }
          />

          <SummaryCard
            label="Fulfilled"
            value={
              summary.fulfilled
            }
            loading={
              summaryLoading
            }
          />

          <SummaryCard
            label="Offers"
            value={
              summary.offersSubmitted
            }
            loading={
              summaryLoading
            }
          />
        </div>

        {/* FILTER */}

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
                placeholder="Search customer, product, city..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff4b1f] dark:border-gray-700 dark:text-white"
              />
            </div>

            <FilterSelect
              value={
                statusFilter
              }
              options={
                STATUS_OPTIONS
              }
              onChange={(
                value
              ) => {
                setStatusFilter(
                  value as
                    RequestStatusFilter
                );

                setPage(1);
              }}
            />

            {hasFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={
                  clearFilters
                }
              >
                Clear
              </Button>
            )}
          </div>
        </section>

        {/* TABLE */}

        <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Request Queue
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Loading..."
                  : loadError
                    ? "Unable to load requests"
                    : `${pagination.total.toLocaleString(
                        "en-PK"
                      )} request${
                        pagination.total ===
                        1
                          ? ""
                          : "s"
                      }`}
              </p>
            </div>
          </div>

          <div className="block w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[1480px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                  <TableHeading>
                    Customer
                  </TableHeading>

                  <TableHeading>
                    Product
                  </TableHeading>

                  <TableHeading>
                    Qty
                  </TableHeading>

                  <TableHeading>
                    Target
                  </TableHeading>

                  <TableHeading>
                    Range
                  </TableHeading>

                  <TableHeading>
                    City
                  </TableHeading>

                  <TableHeading>
                    Suppliers
                  </TableHeading>

                  <TableHeading>
                    Offers
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <TableHeading>
                    Created
                  </TableHeading>

                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    View
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={11}
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
                        colSpan={11}
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

                            void loadRequests();
                          }}
                        />
                      </td>
                    </tr>
                  )}

                {!loading &&
                  !loadError &&
                  requests.map(
                    (
                      request
                    ) => {
                      const customerName =
                        getCustomerRequestCustomerName(
                          request
                        );

                      const customerEmail =
                        getCustomerRequestCustomerEmail(
                          request
                        );

                      const customerPhone =
                        getCustomerRequestCustomerPhone(
                          request
                        );

                      return (
                        <tr
                          key={
                            request._id
                          }
                          className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3">
                            <div className="min-w-[220px]">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {
                                  customerName
                                }
                              </p>

                              {customerEmail && (
                                <p className="mt-1 max-w-[210px] truncate text-[10px] text-gray-500">
                                  {
                                    customerEmail
                                  }
                                </p>
                              )}

                              {customerPhone && (
                                <p className="mt-0.5 text-[10px] text-gray-400">
                                  {
                                    customerPhone
                                  }
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="min-w-[250px]">
                              <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                                {getCustomerRequestProductName(
                                  request
                                )}
                              </p>

                              {request
                                .productSnapshot
                                ?.brand && (
                                <p className="mt-1 text-[10px] text-gray-500">
                                  {
                                    request
                                      .productSnapshot
                                      .brand
                                  }
                                </p>
                              )}

                              <p className="mt-1 max-w-[240px] truncate font-mono text-[9px] text-gray-400">
                                {
                                  request.externalProductId
                                }
                              </p>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {Number(
                              request.quantity ||
                                0
                            ).toLocaleString(
                              "en-PK"
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                            {formatCustomerRequestTarget(
                              request
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            {request.reductionPercent !==
                              null &&
                            request.reductionPercent !==
                              undefined ? (
                              <div>
                                <span className="inline-flex rounded-full bg-[#5b2eff]/10 px-2.5 py-1 text-xs font-semibold text-[#5b2eff] dark:text-[#8f78ff]">
                                  {formatCustomerRequestReduction(
                                    request.reductionPercent
                                  )}
                                </span>

                                {request.rangeTokensUsed !==
                                  null &&
                                  request.rangeTokensUsed !==
                                    undefined && (
                                  <p className="mt-1 text-[10px] text-gray-400">
                                    {
                                      request.rangeTokensUsed
                                    }{" "}
                                    token
                                    {request.rangeTokensUsed ===
                                    1
                                      ? ""
                                      : "s"}
                                  </p>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {request.city ||
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                              {Number(
                                request.invitedSupplierCount ||
                                  0
                              )}{" "}
                              invited
                            </p>

                            <p className="mt-1 text-[10px] text-gray-500">
                              {Number(
                                request.eligibleSupplierCount ||
                                  0
                              )}{" "}
                              eligible
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="inline-flex min-w-8 justify-center rounded-full bg-[#ff4b1f]/10 px-2.5 py-1 text-xs font-semibold text-[#ff4b1f]">
                              {Number(
                                request.offersCount ||
                                  0
                              )}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <RequestStatusBadge
                              status={
                                request.status
                              }
                            />
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                            {formatDateTime(
                              request.createdAt
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                title="View request"
                                onClick={() =>
                                  setSelectedRequestId(
                                    request._id
                                  )
                                }
                                className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#5b2eff]/10 hover:text-[#5b2eff]"
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
                  requests.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={11}
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

          {!loading &&
            !loadError &&
            pagination.total >
              0 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs text-gray-500">
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
                    value={
                      limit
                    }
                    onChange={(
                      event
                    ) => {
                      setLimit(
                        Number(
                          event.target.value
                        )
                      );

                      setPage(1);
                    }}
                    className="h-8 rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-600 outline-none dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
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
                            1,
                            current -
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

      {selectedRequestId && (
        <RequestReviewModal
          requestId={
            selectedRequestId
          }
          canManage={
            canManage
          }
          onClose={() =>
            setSelectedRequestId(
              null
            )
          }
          onUpdated={
            handleUpdated
          }
        />
      )}
    </>
  );
}

/* =========================================================
   REQUEST DETAIL
========================================================= */

function RequestReviewModal({
  requestId,
  canManage,
  onClose,
  onUpdated,
}: {
  requestId:
    string;

  canManage:
    boolean;

  onClose:
    () => void;

  onUpdated:
    () => Promise<void>;
}) {
  const [
    request,
    setRequest,
  ] =
    useState<
      CustomerRequest |
      null
    >(null);

  const [
    offers,
    setOffers,
  ] =
    useState<
      CustomerRequestOffer[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadingError,
    setLoadingError,
  ] =
    useState("");

  const [
    offersLoading,
    setOffersLoading,
  ] =
    useState(false);

  const [
    offersError,
    setOffersError,
  ] =
    useState("");

  const [
    action,
    setAction,
  ] =
    useState<RequestAction>(
      null
    );

  const [
    acceptingOfferId,
    setAcceptingOfferId,
  ] =
    useState("");

  const [
    adminNote,
    setAdminNote,
  ] =
    useState("");

  /* =======================================================
     LOAD
  ======================================================= */

  const loadDetail =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setLoadingError(
            ""
          );

          const detail =
            await getCustomerRequest(
              requestId
            );

          setRequest(
            detail.request
          );

          setOffers(
            detail.offers
          );

          setAdminNote(
            detail.request
              .adminNote ||
              ""
          );
        } catch (
          error
        ) {
          setLoadingError(
            getCustomerRequestErrorMessage(
              error,
              "Unable to load customer request."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        requestId,
      ]
    );

  useEffect(() => {
    void loadDetail();
  }, [
    loadDetail,
  ]);

  const loadOffers =
    useCallback(
      async (
        showToast =
          false
      ) => {
        try {
          setOffersLoading(
            true
          );

          setOffersError(
            ""
          );

          const result =
            await getCustomerRequestOffers(
              requestId,
              {
                page: 1,
                limit: 100,
                sortBy:
                  "offerRate",
                sortOrder:
                  "asc",
              }
            );

          setOffers(
            result.offers
          );

          if (
            showToast
          ) {
            toast.success(
              "Offers refreshed."
            );
          }
        } catch (
          error
        ) {
          const message =
            getCustomerRequestErrorMessage(
              error,
              "Unable to load supplier offers."
            );

          setOffersError(
            message
          );

          if (
            showToast
          ) {
            toast.error(
              message
            );
          }
        } finally {
          setOffersLoading(
            false
          );
        }
      },
      [
        requestId,
      ]
    );

  /* =======================================================
     OPEN
  ======================================================= */

  const handleOpen =
    async () => {
      if (
        !request ||
        !canManage ||
        !canOpenRequest(
          request.status
        )
      ) {
        return;
      }

      try {
        setAction(
          "open"
        );

        const result =
          await reviewCustomerRequest(
            request._id,
            {
              status:
                "open",

              adminNote:
                adminNote.trim() ||
                undefined,
            }
          );

        setRequest(
          result.request
        );

        setOffers(
          result.offers
        );

        toast.success(
          "Request opened."
        );

        await onUpdated();
      } catch (
        error
      ) {
        toast.error(
          "Unable to open request",
          {
            description:
              getCustomerRequestErrorMessage(
                error
              ),
          }
        );
      } finally {
        setAction(
          null
        );
      }
    };

  /* =======================================================
     ROUTE
  ======================================================= */

  const handleRoute =
    async () => {
      if (
        !request ||
        !canManage ||
        !canRouteRequest(
          request.status
        )
      ) {
        return;
      }

      try {
        setAction(
          "route"
        );

        const evaluation =
          await evaluateCustomerRequestSuppliers(
            request._id
          );

        setRequest(
          evaluation.request
        );

        const eligibleCount =
          evaluation
            .eligibleSuppliers
            .length;

        if (
          eligibleCount ===
          0
        ) {
          toast.warning(
            "No eligible suppliers found."
          );

          await onUpdated();

          return;
        }

        const invited =
          await inviteCustomerRequestSuppliers(
            request._id,
            []
          );

        setRequest(
          invited.request
        );

        setOffers(
          invited.offers
        );

        toast.success(
          `${eligibleCount} eligible supplier${
            eligibleCount ===
            1
              ? ""
              : "s"
          } invited.`
        );

        await onUpdated();
      } catch (
        error
      ) {
        toast.error(
          "Unable to route request",
          {
            description:
              getCustomerRequestErrorMessage(
                error
              ),
          }
        );
      } finally {
        setAction(
          null
        );
      }
    };

  /* =======================================================
     CLOSE
  ======================================================= */

  const handleClose =
    async () => {
      if (
        !request ||
        !canManage ||
        !canCloseRequest(
          request.status
        )
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Close this customer request?"
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setAction(
          "close"
        );

        const result =
          await reviewCustomerRequest(
            request._id,
            {
              status:
                "closed",

              adminNote:
                adminNote.trim() ||
                undefined,
            }
          );

        setRequest(
          result.request
        );

        setOffers(
          result.offers
        );

        toast.success(
          "Request closed."
        );

        await onUpdated();
      } catch (
        error
      ) {
        toast.error(
          "Unable to close request",
          {
            description:
              getCustomerRequestErrorMessage(
                error
              ),
          }
        );
      } finally {
        setAction(
          null
        );
      }
    };

  /* =======================================================
     ACCEPT
  ======================================================= */

  const handleAcceptOffer =
    async (
      offer:
        CustomerRequestOffer
    ) => {
      if (
        !request ||
        !canManage ||
        isRequestLocked(
          request.status
        ) ||
        offer.status !==
          "submitted" ||
        !offer.isCurrent
      ) {
        return;
      }

      const supplierName =
        getCustomerRequestSupplierName(
          offer.supplier
        );

      const confirmed =
        window.confirm(
          `Accept ${supplierName}'s offer?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setAction(
          "accept"
        );

        setAcceptingOfferId(
          offer._id
        );

        const result =
          await acceptCustomerRequestOffer(
            request._id,
            offer._id,
            {
              adminNote:
                adminNote.trim() ||
                undefined,
            }
          );

        setRequest(
          result.request
        );

        setOffers(
          result.offers
        );

        toast.success(
          `${supplierName}'s offer accepted.`
        );

        await onUpdated();
      } catch (
        error
      ) {
        toast.error(
          "Unable to accept offer",
          {
            description:
              getCustomerRequestErrorMessage(
                error
              ),
          }
        );
      } finally {
        setAction(
          null
        );

        setAcceptingOfferId(
          ""
        );
      }
    };

  /* =======================================================
     STATES
  ======================================================= */

  if (
    loading
  ) {
    return (
      <ModalShell
        onClose={
          onClose
        }
        disabled
      >
        <div className="px-6 py-20 text-center">
          <LoaderCircle className="mx-auto size-7 animate-spin text-[#5b2eff]" />

          <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Loading request
          </p>
        </div>
      </ModalShell>
    );
  }

  if (
    loadingError ||
    !request
  ) {
    return (
      <ModalShell
        onClose={
          onClose
        }
      >
        <div className="px-6 py-16 text-center">
          <CircleAlert className="mx-auto size-7 text-red-500" />

          <p className="mt-3 text-sm font-semibold text-red-600">
            Unable to load request
          </p>

          <p className="mx-auto mt-1 max-w-xl text-xs text-gray-500">
            {
              loadingError
            }
          </p>

          <button
            type="button"
            onClick={() =>
              void loadDetail()
            }
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </button>
        </div>
      </ModalShell>
    );
  }

  const customerName =
    getCustomerRequestCustomerName(
      request
    );

  const customerEmail =
    getCustomerRequestCustomerEmail(
      request
    );

  const customerPhone =
    getCustomerRequestCustomerPhone(
      request
    );

  const currentOffers =
    offers.filter(
      (
        offer
      ) =>
        offer.isCurrent
    );

  const locked =
    isRequestLocked(
      request.status
    );

  const showOpen =
    canManage &&
    canOpenRequest(
      request.status
    );

  const showRoute =
    canManage &&
    canRouteRequest(
      request.status
    );

  const showClose =
    canManage &&
    canCloseRequest(
      request.status
    );

  const busy =
    action !==
    null;

  /* =======================================================
     MODAL
  ======================================================= */

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close request"
        disabled={
          busy
        }
        onClick={
          onClose
        }
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101828]">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Customer Request
              </h3>

              <RequestStatusBadge
                status={
                  request.status
                }
              />
            </div>

            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              {
                customerName
              }
            </p>

            <p className="mt-0.5 text-[10px] text-gray-400">
              {formatDateTime(
                request.createdAt
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              onClose
            }
            className="flex size-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-white/[0.05]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* BODY */}

        <div className="flex-1 overflow-y-auto p-6">
          {/* REQUEST INFO */}

          <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getCustomerRequestProductName(
                    request
                  )}
                </p>

                {request
                  .productSnapshot
                  ?.brand && (
                  <p className="mt-1 text-xs text-gray-500">
                    {
                      request
                        .productSnapshot
                        .brand
                    }
                  </p>
                )}

                <p className="mt-1 font-mono text-[10px] text-gray-400">
                  {
                    request.externalProductId
                  }
                </p>
              </div>

              <div className="rounded-lg bg-[#5b2eff]/5 px-4 py-3 md:text-right">
                <p className="text-[9px] font-semibold uppercase text-[#5b2eff]">
                  Target
                </p>

                <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">
                  {formatCustomerRequestTarget(
                    request
                  )}
                </p>

                {request.reductionPercent !==
                  null &&
                  request.reductionPercent !==
                    undefined && (
                  <p className="mt-1 text-xs font-semibold text-[#5b2eff]">
                    {formatCustomerRequestReduction(
                      request.reductionPercent
                    )}{" "}
                    Range
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              <MiniInfo
                label="Quantity"
                value={Number(
                  request.quantity ||
                    0
                ).toLocaleString(
                  "en-PK"
                )}
              />

              <MiniInfo
                label="Tokens Used"
                value={
                  request.rangeTokensUsed !==
                    null &&
                  request.rangeTokensUsed !==
                    undefined
                    ? String(
                        request.rangeTokensUsed
                      )
                    : "—"
                }
              />

              <MiniInfo
                label="Eligible"
                value={String(
                  request.eligibleSupplierCount ||
                    0
                )}
              />

              <MiniInfo
                label="Invited"
                value={String(
                  request.invitedSupplierCount ||
                    0
                )}
              />

              <MiniInfo
                label="Offers"
                value={String(
                  request.offersCount ||
                    0
                )}
              />
            </div>
          </section>

          {/* CUSTOMER */}

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <MiniInfo
              label="Email"
              value={
                customerEmail ||
                "—"
              }
            />

            <MiniInfo
              label="Phone"
              value={
                customerPhone ||
                "—"
              }
            />

            <MiniInfo
              label="City"
              value={
                request.city ||
                "—"
              }
            />

            <MiniInfo
              label="Expires"
              value={formatDateTime(
                request.expiresAt
              )}
            />
          </div>

          {/* NOTES */}

          {request.notes && (
            <section className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Customer Note
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                {
                  request.notes
                }
              </p>
            </section>
          )}

          {/* OFFERS */}

          <section className="mt-5 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Supplier Offers
                </h4>

                <p className="mt-1 text-[10px] text-gray-500">
                  {currentOffers.length} current offer
                  {currentOffers.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  offersLoading ||
                  busy
                }
                onClick={() =>
                  void loadOffers(
                    true
                  )
                }
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
              >
                <RefreshCw
                  className={`size-3.5 ${
                    offersLoading
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </button>
            </div>

            {offersLoading ? (
              <div className="px-5 py-12 text-center">
                <LoaderCircle className="mx-auto size-5 animate-spin text-[#5b2eff]" />
              </div>
            ) : offersError ? (
              <div className="px-5 py-10 text-center">
                <p className="text-xs text-red-500">
                  {
                    offersError
                  }
                </p>
              </div>
            ) : currentOffers.length ===
              0 ? (
              <div className="px-5 py-12 text-center">
                <HandCoins className="mx-auto size-5 text-gray-300" />

                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  No supplier offers yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentOffers.map(
                  (
                    offer
                  ) => {
                    const supplierName =
                      getCustomerRequestSupplierName(
                        offer.supplier
                      );

                    const supplierReference =
                      getCustomerRequestSupplierReference(
                        offer.supplier
                      );

                    const supplierCity =
                      offer.supplierSnapshot
                        ?.city ||
                      getCustomerRequestSupplierCity(
                        offer.supplier
                      );

                    const meetsTarget =
                      request.targetPrice !==
                        null &&
                      request.targetPrice !==
                        undefined &&
                      Number(
                        offer.offerRate
                      ) <=
                        Number(
                          request.targetPrice
                        );

                    const canAccept =
                      canManage &&
                      !locked &&
                      offer.status ===
                        "submitted" &&
                      Boolean(
                        offer.isCurrent
                      );

                    const isAccepting =
                      acceptingOfferId ===
                      offer._id;

                    return (
                      <div
                        key={
                          offer._id
                        }
                        className="p-4"
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex size-9 items-center justify-center rounded-lg bg-[#5b2eff]/10 text-[#5b2eff]">
                                <Users className="size-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                  {
                                    supplierName
                                  }
                                </p>

                                <p className="mt-0.5 text-[10px] text-gray-500">
                                  {[
                                    supplierReference,
                                    supplierCity,
                                  ]
                                    .filter(
                                      Boolean
                                    )
                                    .join(
                                      " • "
                                    ) ||
                                    "Supplier"}
                                </p>
                              </div>

                              <OfferStatusBadge
                                status={
                                  offer.status
                                }
                              />

                              {meetsTarget && (
                                <span className="inline-flex rounded-full bg-green-500/10 px-2 py-1 text-[10px] font-semibold text-green-600">
                                  Meets target
                                </span>
                              )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <OfferMetric
                                label="Offer"
                                value={formatMoney(
                                  offer.offerRate,
                                  offer.currency
                                )}
                                emphasis
                              />

                              <OfferMetric
                                label="Target"
                                value={formatCustomerRequestTarget(
                                  request
                                )}
                              />

                              <OfferMetric
                                label="Quantity"
                                value={Number(
                                  offer.quantity ??
                                    request.quantity ??
                                    0
                                ).toLocaleString(
                                  "en-PK"
                                )}
                              />

                              <OfferMetric
                                label="Valid Until"
                                value={formatDateTime(
                                  offer.validUntil
                                )}
                              />
                            </div>

                            {offer.supplierNote && (
                              <p className="mt-3 text-xs leading-5 text-gray-500">
                                {
                                  offer.supplierNote
                                }
                              </p>
                            )}
                          </div>

                          {canManage && (
                            <button
                              type="button"
                              disabled={
                                !canAccept ||
                                busy
                              }
                              onClick={() =>
                                void handleAcceptOffer(
                                  offer
                                )
                              }
                              className="inline-flex h-10 min-w-[125px] items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-4 text-sm font-semibold text-white transition hover:bg-[#e8431b] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {isAccepting ? (
                                <LoaderCircle className="size-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-4" />
                              )}

                              Accept
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* ADMIN NOTE */}

          {canManage &&
            !locked && (
            <section className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Admin Note
              </label>

              <textarea
                rows={3}
                value={
                  adminNote
                }
                onChange={(
                  event
                ) =>
                  setAdminNote(
                    event.target.value
                  )
                }
                placeholder="Optional note..."
                className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#5b2eff] dark:border-gray-700 dark:text-white"
              />
            </section>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              onClose
            }
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
          >
            Close
          </button>

          {showOpen && (
            <button
              type="button"
              disabled={
                busy
              }
              onClick={() =>
                void handleOpen()
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#5b2eff]/20 px-4 text-sm font-semibold text-[#5b2eff] disabled:opacity-50"
            >
              {action ===
              "open" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Clock3 className="size-4" />
              )}

              Open
            </button>
          )}

          {showClose && (
            <button
              type="button"
              disabled={
                busy
              }
              onClick={() =>
                void handleClose()
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-600 disabled:opacity-50 dark:border-red-500/20"
            >
              {action ===
              "close" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}

              Close
            </button>
          )}

          {showRoute && (
            <button
              type="button"
              disabled={
                busy
              }
              onClick={() =>
                void handleRoute()
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#5b2eff] px-4 text-sm font-semibold text-white transition hover:bg-[#4c25e6] disabled:opacity-50"
            >
              {action ===
              "route" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}

              Route to Suppliers
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL
========================================================= */

function ModalShell({
  children,
  onClose,
  disabled =
    false,
}: {
  children:
    ReactNode;

  onClose:
    () => void;

  disabled?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        disabled={
          disabled
        }
        onClick={
          onClose
        }
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <div className="relative z-10 w-full max-w-[720px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101828]">
        {
          children
        }
      </div>
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function RequestStatusBadge({
  status,
}: {
  status:
    CustomerRequestStatus;
}) {
  const styles:
    Record<
      CustomerRequestStatus,
      string
    > = {
    new:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",

    open:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",

    matched:
      "bg-[#5b2eff]/10 text-[#5b2eff] dark:text-[#8f78ff]",

    fulfilled:
      "bg-green-500/10 text-green-600 dark:text-green-400",

    closed:
      "bg-gray-500/10 text-gray-500",

    expired:
      "bg-red-500/10 text-red-500",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status
        .charAt(0)
        .toUpperCase() +
        status.slice(1)}
    </span>
  );
}

function OfferStatusBadge({
  status,
}: {
  status:
    CustomerRequestOfferStatus;
}) {
  const styles:
    Record<
      CustomerRequestOfferStatus,
      string
    > = {
    submitted:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",

    accepted:
      "bg-green-500/10 text-green-600 dark:text-green-400",

    rejected:
      "bg-red-500/10 text-red-500",

    withdrawn:
      "bg-gray-500/10 text-gray-500",

    expired:
      "bg-gray-500/10 text-gray-500",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${styles[status]}`}
    >
      {status
        .charAt(0)
        .toUpperCase() +
        status.slice(1)}
    </span>
  );
}

/* =========================================================
   SUMMARY
========================================================= */

function SummaryCard({
  label,
  value,
  loading,
}: {
  label:
    string;

  value:
    | number
    | null;

  loading:
    boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {
          label
        }
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
    </div>
  );
}

/* =========================================================
   FILTER
========================================================= */

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value:
    string;

  options:
    Array<{
      value:
        string;

      label:
        string;
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
        className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-transparent px-3 pr-9 text-sm text-gray-700 outline-none focus:border-[#ff4b1f] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
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

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

/* =========================================================
   TABLE
========================================================= */

function TableHeading({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {
        children
      }
    </th>
  );
}

/* =========================================================
   INFO
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
    <div className="rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-white/[0.03]">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
        {
          label
        }
      </p>

      <p className="mt-1 break-words text-xs font-semibold text-gray-900 dark:text-white">
        {
          value
        }
      </p>
    </div>
  );
}

function OfferMetric({
  label,
  value,
  emphasis =
    false,
}: {
  label:
    string;

  value:
    string;

  emphasis?:
    boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-100 px-3 py-2.5 dark:border-gray-800">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
        {
          label
        }
      </p>

      <p
        className={`mt-1 break-words text-xs font-semibold ${
          emphasis
            ? "text-[#ff4b1f]"
            : "text-gray-900 dark:text-white"
        }`}
      >
        {
          value
        }
      </p>
    </div>
  );
}

/* =========================================================
   STATES
========================================================= */

function LoadingState() {
  return (
    <div className="text-center">
      <LoaderCircle className="mx-auto size-7 animate-spin text-[#5b2eff]" />

      <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Loading customer requests
      </p>
    </div>
  );
}

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

      <p className="mt-3 text-sm font-semibold text-red-600">
        Unable to load customer requests
      </p>

      <p className="mx-auto mt-1 max-w-xl text-xs text-gray-500">
        {
          message
        }
      </p>

      <button
        type="button"
        onClick={
          onRetry
        }
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
      >
        <RefreshCw className="size-3.5" />
        Retry
      </button>
    </div>
  );
}

function EmptyState({
  filtered,
}: {
  filtered:
    boolean;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#5b2eff]/10 text-[#5b2eff]">
        <MessageSquareMore className="size-5" />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        No customer requests
      </h3>

      <p className="mt-1 text-xs text-gray-500">
        {filtered
          ? "No request matches the selected filters."
          : "Customer Range requests will appear here."}
      </p>
    </div>
  );
}