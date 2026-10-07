import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck2,
  RefreshCw,
  Search,
  ShieldCheck,
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
  PaymentPagination,
} from "../../services/payment/payment.service";

/* =========================================================
   PAYMENT API CONTRACT
========================================================= */

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
      "Manual payments could not be loaded."
    );
  }

  return "Manual payments could not be loaded.";
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

export default function ManualVerification() {
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

     Manual Verification always requests:

     paymentMethod:
     manual_bank_transfer

     provider:
     manual

     verificationStatus:
     pending
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

        paymentMethod:
          "manual_bank_transfer",

        provider:
          "manual",

        verificationStatus:
          "pending",

        sortBy:
          "createdAt",

        sortOrder:
          "desc",
      }),
      [
        page,
        limit,
        appliedSearch,
      ]
    );

  /* =======================================================
     LOAD
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

          /*
           * Backend filters remain authoritative.
           *
           * This frontend guard ensures this page never
           * displays non-manual or already-reviewed records.
           */

          const manualPending =
            result.payments.filter(
              (
                payment
              ) =>
                paymentService.isManualBankTransferPayment(
                  payment
                ) &&
                payment.verificationStatus ===
                  "pending"
            );

          setPayments(
            manualPending
          );

          setPagination(
            result.pagination
          );

          if (
            showRefreshToast
          ) {
            toast.success(
              "Manual payments refreshed."
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
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Manual Verification | Solar Trade Hub"
        description="Review manual bank transfer payments awaiting verification."
      />

      <PageBreadcrumb pageTitle="Manual Verification" />

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
                <FileCheck2
                  size={22}
                />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  Manual Verification
                </h1>

                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                  Review manual bank transfer payments awaiting verification.
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
            SEARCH / CURRENT FILTER
        ================================================= */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
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
                placeholder="Search payment or transaction reference..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-theme-xs font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
                <Building2
                  size={14}
                />

                Manual Bank Transfer
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-3 py-1.5 text-theme-xs font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
                <Clock3
                  size={14}
                />

                Awaiting Verification
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Awaiting Verification
            </h2>

            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
              {loading
                ? "Loading manual transfers..."
                : error
                  ? "Payment data unavailable"
                  : `${pagination.total.toLocaleString(
                      "en-PK"
                    )} payments awaiting verification`}
            </p>
          </div>

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
                    Amount
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Bank
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Transaction Reference
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Submitted
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Proof
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Review
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {/* LOADING */}

                {loading && (
                  <TableRow>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center"
                    >
                      <div className="flex items-center justify-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
                        <RefreshCw
                          size={17}
                          className="animate-spin"
                        />

                        Loading manual transfers...
                      </div>
                    </td>
                  </TableRow>
                )}

                {/* ERROR */}

                {!loading &&
                  error && (
                    <TableRow>
                      <td
                        colSpan={8}
                        className="px-5 py-14 text-center"
                      >
                        <div className="mx-auto flex max-w-md flex-col items-center">
                          <CircleAlert
                            size={28}
                            className="text-error-500"
                          />

                          <p className="mt-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            Manual payments could not be loaded
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

                {/* ROWS */}

                {!loading &&
                  !error &&
                  payments.map(
                    (
                      payment
                    ) => {
                      const manual =
                        payment.manualBankTransfer;

                      return (
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

                            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                              {paymentService.getPaymentPurposeLabel(
                                payment.purpose
                              )}
                            </p>
                          </TableCell>

                          {/* ACTOR */}

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

                          {/* AMOUNT */}

                          <TableCell className="px-5 py-4">
                            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                              {paymentService.formatPaymentAmount(
                                payment.amount,
                                payment.currency
                              )}
                            </p>
                          </TableCell>

                          {/* BANK */}

                          <TableCell className="px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300">
                            {manual?.bankName ||
                              "—"}
                          </TableCell>

                          {/* TRANSACTION REFERENCE */}

                          <TableCell className="px-5 py-4">
                            <p className="max-w-[220px] truncate text-theme-sm text-gray-700 dark:text-gray-300">
                              {manual?.transactionReference ||
                                "—"}
                            </p>
                          </TableCell>

                          {/* SUBMITTED */}

                          <TableCell className="whitespace-nowrap px-5 py-4 text-theme-xs text-gray-500 dark:text-gray-400">
                            {paymentService.formatPaymentDate(
                              manual?.submittedAt
                            )}
                          </TableCell>

                          {/* PROOF */}

                          <TableCell className="px-5 py-4">
                            {manual?.proofUrl ? (
                              <a
                                href={
                                  manual.proofUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-theme-xs font-medium text-brand-500 transition hover:text-brand-600"
                              >
                                <ExternalLink
                                  size={14}
                                />

                                View Proof
                              </a>
                            ) : (
                              <span className="text-theme-xs text-gray-400">
                                No proof
                              </span>
                            )}
                          </TableCell>

                          {/* REVIEW */}

                          <TableCell className="px-5 py-4">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                aria-label="Review payment"
                                title="Review payment"
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
                      );
                    }
                  )}

                {/* EMPTY */}

                {!loading &&
                  !error &&
                  payments.length ===
                    0 && (
                    <TableRow>
                      <td
                        colSpan={8}
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <ShieldCheck
                            size={30}
                            className="text-gray-400"
                          />

                          <p className="mt-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            No manual payments awaiting verification
                          </p>

                          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                            New manual bank transfers requiring review will appear here.
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
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Showing{" "}
                    {(page -
                      1) *
                      limit +
                      1}
                    {" - "}
                    {Math.min(
                      page *
                        limit,
                      pagination.total
                    )}
                    {" of "}
                    {pagination.total.toLocaleString(
                      "en-PK"
                    )}
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
          REVIEW MODAL
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
                  <FileCheck2
                    size={19}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600 dark:text-orange-400">
                    Manual Verification
                  </p>

                  <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedPayment.paymentNumber}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Review submitted bank transfer information.
                  </p>
                </div>
              </div>
            </div>

            {/* PAYMENT DETAILS */}

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
                label="Purpose"
                value={
                  paymentService.getPaymentPurposeLabel(
                    selectedPayment.purpose
                  )
                }
              />

              <DetailItem
                label="Payment Status"
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
            </div>

            {/* BANK DETAILS */}

            <div className="border-t border-gray-100 px-6 py-6 dark:border-gray-800 sm:px-8">
              <div className="flex items-center gap-2">
                <Building2
                  size={17}
                  className="text-brand-500"
                />

                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  Bank Transfer Details
                </h4>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Bank Name"
                  value={
                    selectedPayment
                      .manualBankTransfer
                      ?.bankName ||
                    "—"
                  }
                />

                <DetailItem
                  label="Account Title"
                  value={
                    selectedPayment
                      .manualBankTransfer
                      ?.accountTitle ||
                    "—"
                  }
                />

                <DetailItem
                  label="Transaction Reference"
                  value={
                    selectedPayment
                      .manualBankTransfer
                      ?.transactionReference ||
                    "—"
                  }
                />

                <DetailItem
                  label="Submitted At"
                  value={
                    paymentService.formatPaymentDate(
                      selectedPayment
                        .manualBankTransfer
                        ?.submittedAt
                    )
                  }
                />
              </div>
            </div>

            {/* PROOF */}

            <div className="border-t border-gray-100 px-6 py-6 dark:border-gray-800 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                    Payment Proof
                  </h4>

                  <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    Proof submitted for this bank transfer.
                  </p>
                </div>

                {selectedPayment
                  .manualBankTransfer
                  ?.proofUrl ? (
                  <a
                    href={
                      selectedPayment
                        .manualBankTransfer
                        .proofUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-brand-500 px-4 text-theme-sm font-medium text-brand-500 transition hover:bg-brand-50 dark:hover:bg-brand-500/10"
                  >
                    <ExternalLink
                      size={15}
                    />

                    Open Proof
                  </a>
                ) : (
                  <span className="text-theme-xs text-gray-400">
                    No proof uploaded
                  </span>
                )}
              </div>
            </div>

            {/* VERIFICATION NOTICE */}

            <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-5 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
              <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/20 dark:bg-warning-500/10">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning-600 dark:text-warning-400" />

                <div>
                  <p className="text-theme-xs font-semibold text-warning-800 dark:text-warning-300">
                    Verification action not connected yet
                  </p>

                  <p className="mt-1 text-theme-xs leading-5 text-warning-700 dark:text-warning-400">
                    Approve and reject actions will be connected only after the actual backend verification routes are available.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
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
          </div>
        )}
      </Modal>
    </>
  );
}