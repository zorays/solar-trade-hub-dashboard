import {
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
  RefreshCw,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import {
  Modal,
} from "../../components/ui/modal";

import Button from "../../components/ui/button/Button";

import * as paymentService from "../../services/payment/payment.service";

import type {
  Payment,
  PaymentListFilters,
  PaymentListResult,
  PaymentMethod,
  PaymentPagination,
  PaymentPurpose,
  PaymentStatus,
  PaymentVerificationStatus,
} from "../../services/payment/payment.service";

/* =========================================================
   TYPES
========================================================= */

type StatusFilter =
  | "all"
  | PaymentStatus;

type PurposeFilter =
  | "all"
  | PaymentPurpose;

type MethodFilter =
  | "all"
  | PaymentMethod;

type VerificationFilter =
  | "all"
  | PaymentVerificationStatus;

type PaymentApi =
  typeof paymentService & {
    getPayments?: (
      filters?: PaymentListFilters
    ) => Promise<
      PaymentListResult | unknown
    >;
  };

const paymentApi =
  paymentService as PaymentApi;

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE_OPTIONS = [
  20,
  50,
  100,
];

const EMPTY_PAGINATION: PaymentPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const STATUS_OPTIONS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All Status",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "processing",
    label: "Processing",
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
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "partially_refunded",
    label: "Partially Refunded",
  },
  {
    value: "refunded",
    label: "Refunded",
  },
];

const PURPOSE_OPTIONS: Array<{
  value: PurposeFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All Payment Types",
  },
  {
    value: "product_order",
    label: "Product Order",
  },
  {
    value: "range_token_purchase",
    label: "Range Token Purchase",
  },
  {
    value: "range_token_subscription",
    label: "Range Token Subscription",
  },
  {
    value: "supplier_subscription",
    label: "Supplier Subscription",
  },
];

const METHOD_OPTIONS: Array<{
  value: MethodFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All Methods",
  },
  {
    value: "jazzcash",
    label: "JazzCash",
  },
  {
    value: "easypaisa",
    label: "Easypaisa",
  },
  {
    value: "bank",
    label: "Bank",
  },
  {
    value: "manual_bank_transfer",
    label: "Manual Bank Transfer",
  },
  {
    value: "stripe",
    label: "Stripe",
  },
];

const VERIFICATION_OPTIONS: Array<{
  value: VerificationFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All Verification",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "verified",
    label: "Verified",
  },
  {
    value: "failed",
    label: "Failed",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const normalizeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
};

const normalizePagination = (
  raw: unknown,
  count: number,
  fallbackPage: number,
  fallbackLimit: number
): PaymentPagination => {
  const source =
    raw &&
    typeof raw ===
      "object"
      ? (raw as Record<
          string,
          unknown
        >)
      : {};

  const page =
    Math.max(
      normalizeNumber(
        source.page,
        fallbackPage
      ),
      1
    );

  const limit =
    Math.max(
      normalizeNumber(
        source.limit,
        fallbackLimit
      ),
      1
    );

  const total =
    Math.max(
      normalizeNumber(
        source.total,
        count
      ),
      0
    );

  const totalPages =
    Math.max(
      normalizeNumber(
        source.totalPages,
        total > 0
          ? Math.ceil(
              total /
                limit
            )
          : 0
      ),
      0
    );

  return {
    page,
    limit,
    total,
    totalPages,

    hasNextPage:
      typeof source.hasNextPage ===
      "boolean"
        ? source.hasNextPage
        : page <
          totalPages,

    hasPreviousPage:
      typeof source.hasPreviousPage ===
      "boolean"
        ? source.hasPreviousPage
        : page >
          1,
  };
};

const extractPaymentList = (
  raw: unknown,
  fallbackPage: number,
  fallbackLimit: number
): PaymentListResult => {
  if (
    Array.isArray(
      raw
    )
  ) {
    const payments =
      raw as Payment[];

    return {
      payments,

      pagination:
        normalizePagination(
          undefined,
          payments.length,
          fallbackPage,
          fallbackLimit
        ),
    };
  }

  if (
    !raw ||
    typeof raw !==
      "object"
  ) {
    return {
      payments: [],

      pagination: {
        ...EMPTY_PAGINATION,

        page:
          fallbackPage,

        limit:
          fallbackLimit,
      },
    };
  }

  const root =
    raw as Record<
      string,
      unknown
    >;

  const data =
    root.data &&
    typeof root.data ===
      "object"
      ? (root.data as Record<
          string,
          unknown
        >)
      : null;

  const paymentSource =
    Array.isArray(
      root.payments
    )
      ? root.payments
      : data &&
          Array.isArray(
            data.payments
          )
        ? data.payments
        : [];

  const payments =
    paymentSource as Payment[];

  return {
    payments,

    pagination:
      normalizePagination(
        root.pagination ??
          data?.pagination,
        payments.length,
        fallbackPage,
        fallbackLimit
      ),
  };
};

const getErrorMessage = (
  error: unknown
): string => {
  if (
    error &&
    typeof error ===
      "object"
  ) {
    const requestError =
      error as {
        message?: string;

        response?: {
          data?: {
            message?: string;
          };
        };
      };

    return (
      requestError.response
        ?.data
        ?.message ||
      requestError.message ||
      "Payments could not be loaded."
    );
  }

  return "Payments could not be loaded.";
};

const getPaymentKey = (
  payment: Payment
): string => {
  return (
    payment._id ||
    payment.id ||
    payment.paymentNumber
  );
};

const getActorName = (
  payment: Payment
): string => {
  if (
    payment.purpose ===
    "supplier_subscription"
  ) {
    return paymentService.getPaymentSupplierName(
      payment.supplier
    );
  }

  return paymentService.getPaymentCustomerName(
    payment.customer
  );
};

const getActorType = (
  payment: Payment
): string => {
  return payment.purpose ===
    "supplier_subscription"
    ? "Supplier"
    : "Customer";
};

/* =========================================================
   STATUS BADGE
========================================================= */

function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  const classes: Record<
    PaymentStatus,
    string
  > = {
    pending:
      "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",

    processing:
      "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400",

    paid:
      "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",

    failed:
      "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",

    cancelled:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",

    partially_refunded:
      "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",

    refunded:
      "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-theme-xs font-medium ${classes[status]}`}
    >
      {paymentService.getPaymentStatusLabel(
        status
      )}
    </span>
  );
}

/* =========================================================
   VERIFICATION STATUS
========================================================= */

function VerificationStatus({
  status,
}: {
  status: PaymentVerificationStatus;
}) {
  if (
    status ===
    "verified"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-theme-xs font-medium text-success-600 dark:text-success-400">
        <CheckCircle2
          size={14}
        />

        Verified
      </span>
    );
  }

  if (
    status ===
    "failed"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-theme-xs font-medium text-error-600 dark:text-error-400">
        <XCircle
          size={14}
        />

        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-theme-xs font-medium text-warning-600 dark:text-warning-400">
      <Clock3
        size={14}
      />

      Pending
    </span>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;

  onChange: (
    value: string
  ) => void;

  options: Array<{
    value: string;
    label: string;
  }>;

  label: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={
          label
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
        className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
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
              {option.label}
            </option>
          )
        )}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-theme-sm font-semibold text-gray-800 dark:text-white/90">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function PaymentsList() {
  const [
    payments,
    setPayments,
  ] =
    useState<Payment[]>(
      []
    );

  const [
    pagination,
    setPagination,
  ] =
    useState<PaymentPagination>({
      ...EMPTY_PAGINATION,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    appliedSearch,
    setAppliedSearch,
  ] =
    useState(
      ""
    );

  const [
    status,
    setStatus,
  ] =
    useState<StatusFilter>(
      "all"
    );

  const [
    purpose,
    setPurpose,
  ] =
    useState<PurposeFilter>(
      "all"
    );

  const [
    method,
    setMethod,
  ] =
    useState<MethodFilter>(
      "all"
    );

  const [
    verification,
    setVerification,
  ] =
    useState<VerificationFilter>(
      "all"
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const [
    limit,
    setLimit,
  ] =
    useState(
      20
    );

  const [
    selectedPayment,
    setSelectedPayment,
  ] =
    useState<Payment | null>(
      null
    );

  /* =======================================================
     SEARCH
  ======================================================= */

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            setAppliedSearch(
              search.trim()
            );

            setPage(
              1
            );
          },
          400
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      search,
    ]
  );

  /* =======================================================
     QUERY
  ======================================================= */

  const query =
    useMemo<PaymentListFilters>(
      () => ({
        page,

        limit,

        ...(appliedSearch
          ? {
              search:
                appliedSearch,
            }
          : {}),

        ...(status !==
        "all"
          ? {
              status,
            }
          : {}),

        ...(purpose !==
        "all"
          ? {
              purpose,
            }
          : {}),

        ...(method !==
        "all"
          ? {
              paymentMethod:
                method,
            }
          : {}),

        ...(verification !==
        "all"
          ? {
              verificationStatus:
                verification,
            }
          : {}),

        sortBy:
          "createdAt",

        sortOrder:
          "desc",
      }),
      [
        page,
        limit,
        appliedSearch,
        status,
        purpose,
        method,
        verification,
      ]
    );

  /* =======================================================
     LOAD PAYMENTS
  ======================================================= */

  const loadPayments =
    useCallback(
      async (
        showRefreshToast =
          false
      ) => {
        const getPayments =
          paymentApi.getPayments;

        if (
          typeof getPayments !==
          "function"
        ) {
          setPayments(
            []
          );

          setPagination({
            ...EMPTY_PAGINATION,

            page,

            limit,
          });

          setError(
            "Payment API service is not connected yet."
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
          setError(
            ""
          );

          const response =
            await getPayments(
              query
            );

          const result =
            extractPaymentList(
              response,
              page,
              limit
            );

          setPayments(
            result.payments
          );

          setPagination(
            result.pagination
          );

          if (
            showRefreshToast
          ) {
            toast.success(
              "Payments refreshed."
            );
          }
        } catch (
          requestError
        ) {
          const message =
            getErrorMessage(
              requestError
            );

          setPayments(
            []
          );

          setError(
            message
          );

          if (
            showRefreshToast
          ) {
            toast.error(
              message
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
        query,
        page,
        limit,
      ]
    );

  useEffect(
    () => {
      setLoading(
        true
      );

      void loadPayments();
    },
    [
      loadPayments,
    ]
  );

  /* =======================================================
     FILTER RESET
  ======================================================= */

  const resetFilters =
    () => {
      setSearch(
        ""
      );

      setAppliedSearch(
        ""
      );

      setStatus(
        "all"
      );

      setPurpose(
        "all"
      );

      setMethod(
        "all"
      );

      setVerification(
        "all"
      );

      setPage(
        1
      );
    };

  const hasFilters =
    Boolean(
      search ||
        status !==
          "all" ||
        purpose !==
          "all" ||
        method !==
          "all" ||
        verification !==
          "all"
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Payments | Solar Trade Hub"
        description="Manage Solar Trade Hub marketplace payments."
      />

      <PageBreadcrumb pageTitle="Payments" />

      <Toaster
        richColors
        position="top-right"
      />

      <div className="space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                <WalletCards
                  size={22}
                />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  Payment Transactions
                </h1>

                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                  Product orders, Range Tokens and supplier subscription payments.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              disabled={
                refreshing
              }
              onClick={() => {
                setRefreshing(
                  true
                );

                void loadPayments(
                  true
                );
              }}
            >
              <span className="flex items-center gap-2">
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </span>
            </Button>
          </div>
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {/* SEARCH */}

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search payment..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            {/* STATUS */}

            <FilterSelect
              value={
                status
              }
              onChange={(
                value
              ) => {
                setStatus(
                  value as StatusFilter
                );

                setPage(
                  1
                );
              }}
              options={
                STATUS_OPTIONS
              }
              label="Payment Status"
            />

            {/* PURPOSE */}

            <FilterSelect
              value={
                purpose
              }
              onChange={(
                value
              ) => {
                setPurpose(
                  value as PurposeFilter
                );

                setPage(
                  1
                );
              }}
              options={
                PURPOSE_OPTIONS
              }
              label="Purpose"
            />

            {/* METHOD */}

            <FilterSelect
              value={
                method
              }
              onChange={(
                value
              ) => {
                setMethod(
                  value as MethodFilter
                );

                setPage(
                  1
                );
              }}
              options={
                METHOD_OPTIONS
              }
              label="Method"
            />

            {/* VERIFICATION */}

            <FilterSelect
              value={
                verification
              }
              onChange={(
                value
              ) => {
                setVerification(
                  value as VerificationFilter
                );

                setPage(
                  1
                );
              }}
              options={
                VERIFICATION_OPTIONS
              }
              label="Verification"
            />
          </div>

          {hasFilters && (
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={
                  resetFilters
                }
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* TABLE HEADER */}

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
                All Payments
              </h2>

              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                {loading
                  ? "Loading payments..."
                  : error
                    ? "Payment data unavailable"
                    : `${pagination.total.toLocaleString(
                        "en-PK"
                      )} payments`}
              </p>
            </div>
          </div>

          {/* TABLE CONTENT */}

          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Payment
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Customer / Supplier
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Purpose
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Amount
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Method
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Status
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Verification
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Created
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {/* =================================================
                    LOADING

                    Native td is used because TailAdmin TableCell
                    does not expose colSpan.
                ================================================= */}

                {loading && (
                  <TableRow>
                    <td
                      colSpan={9}
                      className="px-5 py-14 text-center"
                    >
                      <div className="flex items-center justify-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
                        <RefreshCw
                          size={17}
                          className="animate-spin"
                        />

                        Loading payments...
                      </div>
                    </td>
                  </TableRow>
                )}

                {/* =================================================
                    ERROR
                ================================================= */}

                {!loading &&
                  error && (
                    <TableRow>
                      <td
                        colSpan={9}
                        className="px-5 py-14 text-center"
                      >
                        <div className="mx-auto flex max-w-md flex-col items-center">
                          <CircleAlert
                            size={28}
                            className="text-error-500"
                          />

                          <p className="mt-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            Payments could not be loaded
                          </p>

                          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                            {error}
                          </p>

                          <div className="mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setLoading(
                                  true
                                );

                                void loadPayments();
                              }}
                            >
                              Retry
                            </Button>
                          </div>
                        </div>
                      </td>
                    </TableRow>
                  )}

                {/* =================================================
                    PAYMENT ROWS
                ================================================= */}

                {!loading &&
                  !error &&
                  payments.map(
                    (
                      payment
                    ) => (
                      <TableRow
                        key={
                          getPaymentKey(
                            payment
                          )
                        }
                        className="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                      >
                        {/* PAYMENT */}

                        <TableCell className="px-5 py-4">
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {payment.paymentNumber}
                          </p>

                          <p className="mt-1 max-w-[200px] truncate text-theme-xs text-gray-500 dark:text-gray-400">
                            {payment.merchantReference ||
                              "—"}
                          </p>
                        </TableCell>

                        {/* CUSTOMER / SUPPLIER */}

                        <TableCell className="px-5 py-4">
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {getActorName(
                              payment
                            )}
                          </p>

                          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                            {getActorType(
                              payment
                            )}
                          </p>
                        </TableCell>

                        {/* PURPOSE */}

                        <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                          {paymentService.getPaymentPurposeLabel(
                            payment.purpose
                          )}
                        </TableCell>

                        {/* AMOUNT */}

                        <TableCell className="px-5 py-4">
                          <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                            {paymentService.formatPaymentAmount(
                              payment.amount,
                              payment.currency
                            )}
                          </p>

                          {Number(
                            payment.refundedAmount ||
                              0
                          ) >
                            0 && (
                            <p className="mt-1 text-theme-xs font-medium text-purple-500">
                              Refunded{" "}
                              {paymentService.formatPaymentAmount(
                                payment.refundedAmount,
                                payment.currency
                              )}
                            </p>
                          )}
                        </TableCell>

                        {/* METHOD */}

                        <TableCell className="px-5 py-4">
                          <p className="text-theme-sm text-gray-700 dark:text-gray-300">
                            {paymentService.getPaymentMethodLabel(
                              payment.paymentMethod
                            )}
                          </p>

                          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                            {paymentService.getPaymentProviderLabel(
                              payment.provider
                            )}
                          </p>
                        </TableCell>

                        {/* STATUS */}

                        <TableCell className="px-5 py-4">
                          <PaymentStatusBadge
                            status={
                              payment.status
                            }
                          />
                        </TableCell>

                        {/* VERIFICATION */}

                        <TableCell className="px-5 py-4">
                          <VerificationStatus
                            status={
                              payment.verificationStatus
                            }
                          />
                        </TableCell>

                        {/* DATE */}

                        <TableCell className="whitespace-nowrap px-5 py-4 text-theme-xs text-gray-500 dark:text-gray-400">
                          {paymentService.formatPaymentDate(
                            payment.createdAt
                          )}
                        </TableCell>

                        {/* ACTION */}

                        <TableCell className="px-5 py-4">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              aria-label="View payment"
                              title="View payment"
                              onClick={() =>
                                setSelectedPayment(
                                  payment
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-white/[0.05]"
                            >
                              <Eye
                                size={17}
                              />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )}

                {/* =================================================
                    EMPTY
                ================================================= */}

                {!loading &&
                  !error &&
                  payments.length ===
                    0 && (
                    <TableRow>
                      <td
                        colSpan={9}
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <WalletCards
                            size={30}
                            className="text-gray-400"
                          />

                          <p className="mt-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            No payments found
                          </p>

                          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                            No payment records match the current filters.
                          </p>
                        </div>
                      </td>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!loading &&
            !error &&
            pagination.total >
              0 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 sm:px-6">
                {/* LEFT */}

                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Showing{" "}
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {(page -
                        1) *
                        limit +
                        1}
                    </span>

                    {" - "}

                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {Math.min(
                        page *
                          limit,
                        pagination.total
                      )}
                    </span>

                    {" of "}

                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {pagination.total.toLocaleString(
                        "en-PK"
                      )}
                    </span>
                  </p>

                  <select
                    aria-label="Payments per page"
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
                    className="h-8 rounded-lg border border-gray-300 bg-transparent px-2 text-theme-xs text-gray-700 outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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

                {/* RIGHT */}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      page <=
                        1 ||
                      pagination.hasPreviousPage ===
                        false
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
                    <ChevronLeft
                      size={16}
                    />
                  </Button>

                  <span className="min-w-9 text-center text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {page}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      pagination.hasNextPage ===
                      false
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
                    <ChevronRight
                      size={16}
                    />
                  </Button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* ===================================================
          PAYMENT DETAILS MODAL
      =================================================== */}

      <Modal
        isOpen={
          Boolean(
            selectedPayment
          )
        }
        onClose={() =>
          setSelectedPayment(
            null
          )
        }
        className="m-4 max-w-[850px]"
      >
        {selectedPayment && (
          <div className="relative w-full max-w-[850px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
            {/* HEADER */}

            <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:px-8">
              <div className="flex items-start gap-4 pr-10">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                  <WalletCards
                    size={19}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600 dark:text-orange-400">
                    Payment Details
                  </p>

                  <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedPayment.paymentNumber}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {paymentService.getPaymentPurposeLabel(
                      selectedPayment.purpose
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* DETAILS */}

            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 sm:p-8">
              <DetailItem
                label="Amount"
                value={
                  paymentService.formatPaymentAmount(
                    selectedPayment.amount,
                    selectedPayment.currency
                  )
                }
              />

              <DetailItem
                label={
                  getActorType(
                    selectedPayment
                  )
                }
                value={
                  getActorName(
                    selectedPayment
                  )
                }
              />

              <DetailItem
                label="Payment Method"
                value={
                  paymentService.getPaymentMethodLabel(
                    selectedPayment.paymentMethod
                  )
                }
              />

              <DetailItem
                label="Provider"
                value={
                  paymentService.getPaymentProviderLabel(
                    selectedPayment.provider
                  )
                }
              />

              <DetailItem
                label="Status"
                value={
                  paymentService.getPaymentStatusLabel(
                    selectedPayment.status
                  )
                }
              />

              <DetailItem
                label="Verification"
                value={
                  paymentService.getPaymentVerificationStatusLabel(
                    selectedPayment.verificationStatus
                  )
                }
              />

              <DetailItem
                label="Fulfillment"
                value={
                  paymentService.getPaymentFulfillmentStatusLabel(
                    selectedPayment.fulfillmentStatus
                  )
                }
              />

              <DetailItem
                label="Order"
                value={
                  paymentService.getPaymentOrderNumber(
                    selectedPayment.order
                  )
                }
              />

              <DetailItem
                label="Merchant Reference"
                value={
                  selectedPayment.merchantReference ||
                  "—"
                }
              />

              <DetailItem
                label="Created"
                value={
                  paymentService.formatPaymentDate(
                    selectedPayment.createdAt
                  )
                }
              />

              {paymentService.isRangeTokenPayment(
                selectedPayment
              ) &&
                selectedPayment.rangeTokenAmount !==
                  null &&
                selectedPayment.rangeTokenAmount !==
                  undefined && (
                  <DetailItem
                    label="Range Tokens"
                    value={
                      selectedPayment.rangeTokenAmount.toLocaleString(
                        "en-PK"
                      )
                    }
                  />
                )}

              {selectedPayment.manualBankTransfer && (
                <>
                  <DetailItem
                    label="Bank Name"
                    value={
                      selectedPayment
                        .manualBankTransfer
                        .bankName ||
                      "—"
                    }
                  />

                  <DetailItem
                    label="Bank Transaction Reference"
                    value={
                      selectedPayment
                        .manualBankTransfer
                        .transactionReference ||
                      "—"
                    }
                  />
                </>
              )}

              {Number(
                selectedPayment.refundedAmount ||
                  0
              ) >
                0 && (
                <DetailItem
                  label="Refunded Amount"
                  value={
                    paymentService.formatPaymentAmount(
                      selectedPayment.refundedAmount,
                      selectedPayment.currency
                    )
                  }
                />
              )}
            </div>

            {/* FOOTER */}

            <div className="flex justify-end border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setSelectedPayment(
                    null
                  )
                }
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}