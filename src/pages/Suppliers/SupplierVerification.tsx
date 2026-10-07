import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  X,
  XCircle,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";

import {
  formatSupplierBusinessType,
  formatSupplierVerificationStatus,
  getSupplierErrorMessage,
  getSuppliers,
  updateSupplierVerification,
  type Supplier,
  type SupplierPagination,
  type SupplierVerificationStatus,
} from "../../services/supplier/supplier.service";

/* =========================================================
   TYPES
========================================================= */

type VerificationFilter =
  | ""
  | SupplierVerificationStatus;

type SummaryState = {
  total: number | null;
  pending: number | null;
  underReview: number | null;
  verified: number | null;
  rejected: number | null;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE_OPTIONS = [
  20,
  50,
  100,
];

const EMPTY_PAGINATION: SupplierPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_SUMMARY: SummaryState = {
  total: null,
  pending: null,
  underReview: null,
  verified: null,
  rejected: null,
};

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDateTime = (
  value:
    | string
    | null
    | undefined
) => {
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
};

/* =========================================================
   VERIFICATION STATUS STYLE
========================================================= */

const getStatusClass = (
  status:
    SupplierVerificationStatus
) => {
  switch (status) {
    case "pending":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400";

    case "under_review":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400";

    case "verified":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";
  }
};

/* =========================================================
   PAGE
========================================================= */

const SupplierVerification =
  () => {
    const {
      user,
    } =
      useAuth();

    const canManage =
      hasUserPermission(
        user,
        "suppliers.manage"
      );

    const [
      suppliers,
      setSuppliers,
    ] =
      useState<Supplier[]>(
        []
      );

    const [
      pagination,
      setPagination,
    ] =
      useState<SupplierPagination>(
        EMPTY_PAGINATION
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
      loadError,
      setLoadError,
    ] =
      useState("");

    const [
      searchInput,
      setSearchInput,
    ] =
      useState("");

    const [
      search,
      setSearch,
    ] =
      useState("");

    const [
      statusFilter,
      setStatusFilter,
    ] =
      useState<VerificationFilter>(
        ""
      );

    const [
      summary,
      setSummary,
    ] =
      useState<SummaryState>(
        EMPTY_SUMMARY
      );

    const [
      selectedSupplier,
      setSelectedSupplier,
    ] =
      useState<Supplier | null>(
        null
      );

    const [
      verificationNotes,
      setVerificationNotes,
    ] =
      useState("");

    const [
      updating,
      setUpdating,
    ] =
      useState(false);

    /* =====================================================
       SEARCH DEBOUNCE
    ===================================================== */

    useEffect(
      () => {
        const timer =
          window.setTimeout(
            () => {
              setPage(1);

              setSearch(
                searchInput.trim()
              );
            },
            400
          );

        return () =>
          window.clearTimeout(
            timer
          );
      },
      [
        searchInput,
      ]
    );

    /* =====================================================
       LOAD SUMMARY
    ===================================================== */

    const loadSummary =
      useCallback(
        async () => {
          try {
            const [
              totalResult,
              pendingResult,
              underReviewResult,
              verifiedResult,
              rejectedResult,
            ] =
              await Promise.all([
                getSuppliers({
                  page: 1,
                  limit: 1,
                }),

                getSuppliers({
                  page: 1,
                  limit: 1,
                  verificationStatus:
                    "pending",
                }),

                getSuppliers({
                  page: 1,
                  limit: 1,
                  verificationStatus:
                    "under_review",
                }),

                getSuppliers({
                  page: 1,
                  limit: 1,
                  verificationStatus:
                    "verified",
                }),

                getSuppliers({
                  page: 1,
                  limit: 1,
                  verificationStatus:
                    "rejected",
                }),
              ]);

            setSummary({
              total:
                totalResult.pagination.total,

              pending:
                pendingResult.pagination.total,

              underReview:
                underReviewResult.pagination.total,

              verified:
                verifiedResult.pagination.total,

              rejected:
                rejectedResult.pagination.total,
            });
          } catch {
            setSummary(
              EMPTY_SUMMARY
            );
          }
        },
        []
      );

    /* =====================================================
       LOAD SUPPLIERS
    ===================================================== */

    const loadSuppliers =
      useCallback(
        async (
          showToast = false
        ) => {
          try {
            if (showToast) {
              setRefreshing(
                true
              );
            } else {
              setLoading(
                true
              );
            }

            setLoadError(
              ""
            );

            const result =
              await getSuppliers({
                page,
                limit,

                ...(search
                  ? {
                      search,
                    }
                  : {}),

                ...(statusFilter
                  ? {
                      verificationStatus:
                        statusFilter,
                    }
                  : {}),

                sortBy:
                  "createdAt",

                sortOrder:
                  "desc",
              });

            setSuppliers(
              result.suppliers
            );

            setPagination(
              result.pagination
            );

            if (
              selectedSupplier
            ) {
              const refreshedSelected =
                result.suppliers.find(
                  (
                    item
                  ) =>
                    item.supplierId ===
                    selectedSupplier.supplierId
                );

              if (
                refreshedSelected
              ) {
                setSelectedSupplier(
                  refreshedSelected
                );

                setVerificationNotes(
                  refreshedSelected.verificationNotes ||
                    ""
                );
              }
            }

            if (
              showToast
            ) {
              toast.success(
                "Verification list refreshed."
              );
            }
          } catch (
            error
          ) {
            const message =
              getSupplierErrorMessage(
                error,
                "Unable to load supplier verification records."
              );

            setLoadError(
              message
            );

            toast.error(
              "Unable to load verification records",
              {
                description:
                  message,
              }
            );
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
          page,
          limit,
          search,
          statusFilter,
          selectedSupplier,
        ]
      );

    /* =====================================================
       INITIAL / QUERY LOAD
    ===================================================== */

    useEffect(
      () => {
        void loadSuppliers();
      },
      [
        page,
        limit,
        search,
        statusFilter,
      ]
    );

    useEffect(
      () => {
        void loadSummary();
      },
      [
        loadSummary,
      ]
    );

    /* =====================================================
       OPEN REVIEW
    ===================================================== */

    const openReview = (
      supplier:
        Supplier
    ) => {
      setSelectedSupplier(
        supplier
      );

      setVerificationNotes(
        supplier.verificationNotes ||
          ""
      );
    };

    /* =====================================================
       CLOSE REVIEW
    ===================================================== */

    const closeReview =
      () => {
        if (
          updating
        ) {
          return;
        }

        setSelectedSupplier(
          null
        );

        setVerificationNotes(
          ""
        );
      };

    /* =====================================================
       UPDATE VERIFICATION
    ===================================================== */

    const handleVerificationUpdate =
      async (
        status:
          SupplierVerificationStatus
      ) => {
        if (
          !selectedSupplier ||
          updating ||
          !canManage
        ) {
          return;
        }

        try {
          setUpdating(
            true
          );

          const updated =
            await updateSupplierVerification(
              selectedSupplier.supplierId,
              {
                verificationStatus:
                  status,

                verificationNotes:
                  verificationNotes.trim(),
              }
            );

          setSuppliers(
            (
              current
            ) =>
              current.map(
                (
                  item
                ) =>
                  item.supplierId ===
                  updated.supplierId
                    ? updated
                    : item
              )
          );

          setSelectedSupplier(
            updated
          );

          setVerificationNotes(
            updated.verificationNotes ||
              ""
          );

          await loadSummary();

          toast.success(
            "Supplier verification updated",
            {
              description:
                `${updated.supplierId} — ${formatSupplierVerificationStatus(
                  updated.verificationStatus
                )}`,
            }
          );
        } catch (
          error
        ) {
          toast.error(
            "Unable to update verification",
            {
              description:
                getSupplierErrorMessage(
                  error,
                  "Unable to update supplier verification."
                ),
            }
          );
        } finally {
          setUpdating(
            false
          );
        }
      };

    /* =====================================================
       PAGE NUMBERS
    ===================================================== */

    const pageNumbers =
      useMemo(
        () => {
          const totalPages =
            Math.max(
              pagination.totalPages,
              1
            );

          const start =
            Math.max(
              1,
              Math.min(
                page - 2,
                totalPages - 4
              )
            );

          const end =
            Math.min(
              totalPages,
              start + 4
            );

          const pages:
            number[] = [];

          for (
            let current =
              start;
            current <=
            end;
            current += 1
          ) {
            pages.push(
              current
            );
          }

          return pages;
        },
        [
          page,
          pagination.totalPages,
        ]
      );

    return (
      <>
        <PageMeta
          title="Supplier Verification | Solar Trade Hub"
          description="Review and verify Solar Trade Hub suppliers."
        />

        <PageBreadcrumb
          pageTitle="Supplier Verification"
        />

        <Toaster
          position="top-right"
          richColors
          closeButton
        />

        <div className="space-y-5">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

            <div className="pointer-events-none absolute right-12 top-4 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <ShieldCheck
                    size={22}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                    Supplier Management
                  </p>

                  <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Supplier Verification
                  </h1>

                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Review supplier business information and control verification status.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  refreshing ||
                  loading
                }
                onClick={() => {
                  void Promise.all([
                    loadSuppliers(
                      true
                    ),
                    loadSummary(),
                  ]);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
              >
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>
            </div>
          </div>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            <SummaryCard
              title="Total Suppliers"
              value={
                summary.total
              }
              icon={
                <Store
                  size={18}
                />
              }
              iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
            />

            <SummaryCard
              title="Pending"
              value={
                summary.pending
              }
              icon={
                <Clock3
                  size={18}
                />
              }
              iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
            />

            <SummaryCard
              title="Under Review"
              value={
                summary.underReview
              }
              icon={
                <Eye
                  size={18}
                />
              }
              iconClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
            />

            <SummaryCard
              title="Verified"
              value={
                summary.verified
              }
              icon={
                <BadgeCheck
                  size={18}
                />
              }
              iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
            />

            <SummaryCard
              title="Rejected"
              value={
                summary.rejected
              }
              icon={
                <XCircle
                  size={18}
                />
              }
              iconClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            />
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50 sm:p-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_140px]">
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={
                    searchInput
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchInput(
                      event.target.value
                    )
                  }
                  placeholder="Search supplier, ID, contact, phone or email..."
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white"
                />
              </div>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) => {
                  setPage(
                    1
                  );

                  setStatusFilter(
                    event.target.value as VerificationFilter
                  );
                }}
                className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-300"
              >
                <option value="">
                  All Statuses
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="under_review">
                  Under Review
                </option>

                <option value="verified">
                  Verified
                </option>

                <option value="rejected">
                  Rejected
                </option>
              </select>

              <select
                value={
                  limit
                }
                onChange={(
                  event
                ) => {
                  setPage(
                    1
                  );

                  setLimit(
                    Number(
                      event.target.value
                    )
                  );
                }}
                className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-300"
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
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
            <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Verification Records
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {loading
                    ? "Loading suppliers..."
                    : `${pagination.total.toLocaleString(
                        "en-PK"
                      )} supplier${
                        pagination.total ===
                        1
                          ? ""
                          : "s"
                      }`}
                </p>
              </div>

              {!canManage && (
                <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  View only
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1250px] w-full">
                <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                  <tr>
                    <TableHeading>
                      Supplier
                    </TableHeading>

                    <TableHeading>
                      Contact
                    </TableHeading>

                    <TableHeading>
                      Location
                    </TableHeading>

                    <TableHeading>
                      Registration
                    </TableHeading>

                    <TableHeading>
                      Verification
                    </TableHeading>

                    <TableHeading>
                      Created
                    </TableHeading>

                    <TableHeading align="right">
                      Action
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center"
                      >
                        <RefreshCw
                          size={28}
                          className="mx-auto animate-spin text-purple-500"
                        />

                        <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Loading supplier verification records...
                        </p>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    loadError && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-16 text-center"
                        >
                          <XCircle
                            size={34}
                            className="mx-auto text-red-400"
                          />

                          <p className="mt-3 font-semibold text-gray-700 dark:text-gray-300">
                            Unable to load suppliers
                          </p>

                          <p className="mx-auto mt-1 max-w-lg text-sm text-gray-500">
                            {
                              loadError
                            }
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              void loadSuppliers()
                            }
                            className="mt-4 h-9 rounded-lg bg-purple-600 px-4 text-xs font-semibold text-white"
                          >
                            Try Again
                          </button>
                        </td>
                      </tr>
                    )}

                  {!loading &&
                    !loadError &&
                    suppliers.map(
                      (
                        supplier
                      ) => (
                        <tr
                          key={
                            supplier.supplierId
                          }
                          className="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <div className="min-w-[230px]">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                  {supplier.logo ? (
                                    <img
                                      src={
                                        supplier.logo
                                      }
                                      alt=""
                                      className="h-full w-full object-contain p-1"
                                    />
                                  ) : (
                                    <Building2
                                      size={17}
                                    />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[230px] truncate text-sm font-semibold text-gray-900 dark:text-white">
                                    {
                                      supplier.companyName
                                    }
                                  </p>

                                  <p className="mt-0.5 font-mono text-[11px] font-semibold text-purple-500">
                                    {
                                      supplier.supplierId
                                    }
                                  </p>

                                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    {formatSupplierBusinessType(
                                      supplier.businessType
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="min-w-[220px] space-y-1.5">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {supplier.contactPerson ||
                                  "—"}
                              </p>

                              {supplier.email && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                  <Mail
                                    size={13}
                                  />

                                  <span className="max-w-[180px] truncate">
                                    {
                                      supplier.email
                                    }
                                  </span>
                                </div>
                              )}

                              {supplier.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                  <Phone
                                    size={13}
                                  />

                                  {
                                    supplier.phone
                                  }
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex min-w-[130px] items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin
                                size={15}
                              />

                              {supplier.address?.city ||
                                "—"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <RegistrationSummary
                              supplier={
                                supplier
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <VerificationBadge
                              status={
                                supplier.verificationStatus
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(
                                supplier.createdAt
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right sm:px-6">
                            <button
                              type="button"
                              onClick={() =>
                                openReview(
                                  supplier
                                )
                              }
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                            >
                              <Eye
                                size={14}
                              />

                              {canManage
                                ? "Review"
                                : "View"}
                            </button>
                          </td>
                        </tr>
                      )
                    )}

                  {!loading &&
                    !loadError &&
                    suppliers.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-16 text-center"
                        >
                          <ShieldCheck
                            size={36}
                            className="mx-auto text-gray-300 dark:text-gray-600"
                          />

                          <p className="mt-3 font-semibold text-gray-700 dark:text-gray-300">
                            No supplier verification records found
                          </p>
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
                <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Page{" "}
                    <strong>
                      {pagination.page}
                    </strong>{" "}
                    of{" "}
                    <strong>
                      {Math.max(
                        pagination.totalPages,
                        1
                      )}
                    </strong>{" "}
                    ·{" "}
                    {pagination.total.toLocaleString(
                      "en-PK"
                    )}{" "}
                    total
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <PaginationButton
                      disabled={
                        !pagination.hasPreviousPage ||
                        loading
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
                      Previous
                    </PaginationButton>

                    {pageNumbers.map(
                      (
                        pageNumber
                      ) => (
                        <button
                          key={
                            pageNumber
                          }
                          type="button"
                          onClick={() =>
                            setPage(
                              pageNumber
                            )
                          }
                          className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                            pageNumber ===
                            page
                              ? "bg-[#5b2eff] text-white"
                              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
                          }`}
                        >
                          {
                            pageNumber
                          }
                        </button>
                      )
                    )}

                    <PaginationButton
                      disabled={
                        !pagination.hasNextPage ||
                        loading
                      }
                      onClick={() =>
                        setPage(
                          (
                            current
                          ) =>
                            Math.min(
                              pagination.totalPages,
                              current +
                                1
                            )
                        )
                      }
                    >
                      Next
                    </PaginationButton>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* =================================================
            REVIEW MODAL
        ================================================= */}

        {selectedSupplier && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
            <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                    <Store
                      size={18}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                      Supplier Review
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {
                        selectedSupplier.companyName
                      }
                    </h3>

                    <p className="mt-1 font-mono text-[11px] font-semibold text-purple-500">
                      {
                        selectedSupplier.supplierId
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    updating
                  }
                  onClick={
                    closeReview
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <ModalSection
                  title="Business Information"
                  icon={
                    <Building2
                      size={17}
                    />
                  }
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InfoItem
                      label="Company Name"
                      value={
                        selectedSupplier.companyName
                      }
                    />

                    <InfoItem
                      label="Business Type"
                      value={
                        formatSupplierBusinessType(
                          selectedSupplier.businessType
                        )
                      }
                    />

                    <InfoItem
                      label="Contact Person"
                      value={
                        selectedSupplier.contactPerson ||
                        "—"
                      }
                    />

                    <InfoItem
                      label="City"
                      value={
                        selectedSupplier.address?.city ||
                        "—"
                      }
                    />

                    <InfoItem
                      label="Email"
                      value={
                        selectedSupplier.email ||
                        "—"
                      }
                    />

                    <InfoItem
                      label="Phone"
                      value={
                        selectedSupplier.phone ||
                        "—"
                      }
                    />
                  </div>
                </ModalSection>

                <ModalSection
                  title="Business Registration"
                  icon={
                    <FileText
                      size={17}
                    />
                  }
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <InfoItem
                      label="NTN"
                      value={
                        selectedSupplier.ntn ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      label="STRN"
                      value={
                        selectedSupplier.strn ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      label="Company Registration"
                      value={
                        selectedSupplier.companyRegistrationNo ||
                        "Not provided"
                      }
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                    Supplier document uploads are not part of the current Supplier backend. This screen therefore uses the actual supplier registration information stored in the backend.
                  </div>
                </ModalSection>

                <ModalSection
                  title="Verification Status"
                  icon={
                    <ShieldCheck
                      size={17}
                    />
                  }
                >
                  <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Current Status
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatSupplierVerificationStatus(
                          selectedSupplier.verificationStatus
                        )}
                      </p>
                    </div>

                    <VerificationBadge
                      status={
                        selectedSupplier.verificationStatus
                      }
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoItem
                      label="Verified At"
                      value={
                        formatDateTime(
                          selectedSupplier.verifiedAt
                        )
                      }
                    />

                    <InfoItem
                      label="Last Updated"
                      value={
                        formatDateTime(
                          selectedSupplier.updatedAt
                        )
                      }
                    />
                  </div>
                </ModalSection>

                <ModalSection
                  title="Verification Notes"
                  icon={
                    <FileText
                      size={17}
                    />
                  }
                >
                  <textarea
                    value={
                      verificationNotes
                    }
                    onChange={(
                      event
                    ) =>
                      setVerificationNotes(
                        event.target.value
                      )
                    }
                    disabled={
                      updating ||
                      !canManage
                    }
                    rows={4}
                    maxLength={
                      2000
                    }
                    placeholder="Add verification notes..."
                    className="min-h-[110px] w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white"
                  />

                  <p className="mt-1.5 text-right text-[10px] text-gray-400">
                    {
                      verificationNotes.length
                    }
                    /2000
                  </p>
                </ModalSection>
              </div>

              <div className="sticky bottom-0 border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
                {canManage ? (
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                    <button
                      type="button"
                      disabled={
                        updating
                      }
                      onClick={() =>
                        void handleVerificationUpdate(
                          "rejected"
                        )
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                    >
                      <XCircle
                        size={16}
                      />

                      Reject
                    </button>

                    <button
                      type="button"
                      disabled={
                        updating
                      }
                      onClick={() =>
                        void handleVerificationUpdate(
                          "pending"
                        )
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
                    >
                      <Clock3
                        size={16}
                      />

                      Pending
                    </button>

                    <button
                      type="button"
                      disabled={
                        updating
                      }
                      onClick={() =>
                        void handleVerificationUpdate(
                          "under_review"
                        )
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                    >
                      <Eye
                        size={16}
                      />

                      Under Review
                    </button>

                    <button
                      type="button"
                      disabled={
                        updating
                      }
                      onClick={() =>
                        void handleVerificationUpdate(
                          "verified"
                        )
                      }
                      className="inline-flex h-10 min-w-[145px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updating ? (
                        <RefreshCw
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Check
                          size={16}
                        />
                      )}

                      {updating
                        ? "Updating..."
                        : "Verify Supplier"}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={
                        closeReview
                      }
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;

  value:
    | number
    | null;

  icon:
    ReactNode;

  iconClass:
    string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {value === null
              ? "—"
              : value.toLocaleString(
                  "en-PK"
                )}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
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
  children:
    ReactNode;

  align?:
    | "left"
    | "right";
}) => {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6 ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
};

/* =========================================================
   MODAL SECTION
========================================================= */

const ModalSection = ({
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
}) => {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-purple-600 dark:text-purple-400">
          {icon}
        </span>

        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h4>
      </div>

      {children}
    </section>
  );
};

/* =========================================================
   INFO ITEM
========================================================= */

const InfoItem = ({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-950/20">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};

/* =========================================================
   REGISTRATION SUMMARY
========================================================= */

const RegistrationSummary = ({
  supplier,
}: {
  supplier:
    Supplier;
}) => {
  const count =
    [
      supplier.ntn,
      supplier.strn,
      supplier.companyRegistrationNo,
    ].filter(
      Boolean
    ).length;

  if (
    count ===
    0
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <FileText
          size={13}
        />

        Not Provided
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
      <CheckCircle2
        size={13}
      />

      {count}/3 Provided
    </span>
  );
};

/* =========================================================
   VERIFICATION BADGE
========================================================= */

const VerificationBadge = ({
  status,
}: {
  status:
    SupplierVerificationStatus;
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
        status
      )}`}
    >
      {status ===
      "verified" ? (
        <CheckCircle2
          size={13}
        />
      ) : status ===
        "rejected" ? (
        <XCircle
          size={13}
        />
      ) : status ===
        "under_review" ? (
        <Eye
          size={13}
        />
      ) : (
        <Clock3
          size={13}
        />
      )}

      {formatSupplierVerificationStatus(
        status
      )}
    </span>
  );
};

/* =========================================================
   PAGINATION BUTTON
========================================================= */

const PaginationButton = ({
  children,
  disabled,
  onClick,
}: {
  children:
    ReactNode;

  disabled:
    boolean;

  onClick:
    () => void;
}) => {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
    >
      {children}
    </button>
  );
};

export default SupplierVerification;