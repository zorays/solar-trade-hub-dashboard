import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Link } from "react-router";

import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";

import { toast, Toaster } from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";

import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";

import {
  deleteSupplier,
  formatSupplierBusinessType,
  formatSupplierStatus,
  formatSupplierVerificationStatus,
  getSupplierErrorMessage,
  getSuppliers,
  type Supplier,
  type SupplierPagination,
  type SupplierStatus,
  type SupplierVerificationStatus,
} from "../../services/supplier/supplier.service";

/* =========================================================
   TYPES
========================================================= */

type StatusFilter =
  | "all"
  | SupplierStatus;

type VerificationFilter =
  | "all"
  | SupplierVerificationStatus;

type SummaryState = {
  total: number | null;
  verified: number | null;
  active: number | null;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const EMPTY_PAGINATION: SupplierPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_SUMMARY: SummaryState = {
  total: null,
  verified: null,
  active: null,
};

const STATUS_OPTIONS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const VERIFICATION_OPTIONS: Array<{
  value: VerificationFilter;
  label: string;
}> = [
  { value: "all", label: "All Verification" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "rejected", label: "Rejected" },
];

/* =========================================================
   MAIN PAGE
========================================================= */

export default function SuppliersList() {
  const { user } = useAuth();

  const canManage =
    hasUserPermission(
      user,
      "suppliers.manage"
    );

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [pagination, setPagination] =
    useState<SupplierPagination>({
      ...EMPTY_PAGINATION,
    });

  const [summary, setSummary] =
    useState<SummaryState>({
      ...EMPTY_SUMMARY,
    });

  const [loading, setLoading] =
    useState(true);

  const [summaryLoading, setSummaryLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [deleting, setDeleting] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all"
    );

  const [
    verificationFilter,
    setVerificationFilter,
  ] =
    useState<VerificationFilter>(
      "all"
    );

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(20);

  const [
    supplierToDelete,
    setSupplierToDelete,
  ] =
    useState<Supplier | null>(
      null
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

        ...(verificationFilter !==
        "all"
          ? {
              verificationStatus:
                verificationFilter,
            }
          : {}),

        sortBy:
          "createdAt" as const,

        sortOrder:
          "desc" as const,
      }),
      [
        page,
        limit,
        debouncedSearch,
        statusFilter,
        verificationFilter,
      ]
    );

  /* =======================================================
     LOAD SUMMARY

     Real backend totals only.
  ======================================================= */

  const loadSummary =
    useCallback(
      async () => {
        try {
          setSummaryLoading(
            true
          );

          const [
            allResult,
            verifiedResult,
            activeResult,
          ] =
            await Promise.all([
              getSuppliers({
                page: 1,
                limit: 1,
                sortBy:
                  "createdAt",
                sortOrder:
                  "desc",
              }),

              getSuppliers({
                page: 1,
                limit: 1,
                verificationStatus:
                  "verified",
                sortBy:
                  "createdAt",
                sortOrder:
                  "desc",
              }),

              getSuppliers({
                page: 1,
                limit: 1,
                status:
                  "active",
                sortBy:
                  "createdAt",
                sortOrder:
                  "desc",
              }),
            ]);

          setSummary({
            total:
              allResult.pagination
                .total,

            verified:
              verifiedResult
                .pagination.total,

            active:
              activeResult
                .pagination.total,
          });
        } catch {
          /*
           * Do not fabricate zero.
           *
           * null renders as —.
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
      []
    );

  /* =======================================================
     LOAD SUPPLIERS
  ======================================================= */

  const loadSuppliers =
    useCallback(
      async (
        showToast = false
      ) => {
        try {
          setLoadError("");

          const result =
            await getSuppliers(
              query
            );

          setSuppliers(
            result.suppliers
          );

          setPagination(
            result.pagination
          );

          if (showToast) {
            toast.success(
              "Suppliers refreshed successfully."
            );
          }
        } catch (error) {
          const message =
            getSupplierErrorMessage(
              error,
              "Unable to load suppliers."
            );

          setSuppliers([]);

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
              "Unable to load suppliers",
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
        query,
        page,
        limit,
      ]
    );

  /* =======================================================
     INITIAL / FILTERED LOAD
  ======================================================= */

  useEffect(() => {
    setLoading(true);

    void loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

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
        loadSuppliers(true),
        loadSummary(),
      ]);
    };

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const resetFilters =
    () => {
      setSearch("");
      setDebouncedSearch("");
      setStatusFilter("all");
      setVerificationFilter(
        "all"
      );
      setPage(1);
    };

  const hasFilters =
    Boolean(
      search ||
        statusFilter !==
          "all" ||
        verificationFilter !==
          "all"
    );

  /* =======================================================
     DELETE
  ======================================================= */

  const confirmDelete =
    async () => {
      if (
        !supplierToDelete ||
        deleting ||
        !canManage
      ) {
        return;
      }

      const supplier =
        supplierToDelete;

      try {
        setDeleting(true);

        await deleteSupplier(
          supplier.supplierId
        );

        setSupplierToDelete(
          null
        );

        toast.success(
          "Supplier deleted successfully.",
          {
            description:
              `${supplier.supplierId} — ${supplier.companyName}`,
          }
        );

        /*
         * Backend remains authoritative.
         *
         * Supplier deletion may be blocked if subscription
         * or product-access history still references it.
         */

        if (
          suppliers.length ===
            1 &&
          page > 1
        ) {
          setPage(
            (
              current
            ) =>
              Math.max(
                current - 1,
                1
              )
          );
        } else {
          setLoading(true);

          await loadSuppliers();
        }

        await loadSummary();
      } catch (error) {
        toast.error(
          "Supplier cannot be deleted",
          {
            description:
              getSupplierErrorMessage(
                error,
                "Unable to delete supplier."
              ),
          }
        );
      } finally {
        setDeleting(false);
      }
    };

  /* =======================================================
     PAGINATION DISPLAY
  ======================================================= */

  const firstResult =
    pagination.total > 0
      ? (page - 1) *
          limit +
        1
      : 0;

  const lastResult =
    Math.min(
      page * limit,
      pagination.total
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Suppliers | Solar Trade Hub"
        description="Manage Solar Trade Hub suppliers."
      />

      <PageBreadcrumb
        pageTitle="Suppliers"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-4">
        {/* HEADER */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suppliers
            </h1>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Manage supplier profiles and administrative status. Verification and marketplace access remain separately controlled.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={
                refreshing
              }
              onClick={() => {
                void handleRefresh();
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

            {canManage && (
              <Link
                to="/suppliers/add"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-4 text-sm font-semibold text-white transition hover:bg-[#e83c12]"
              >
                <Plus
                  size={16}
                />

                Add Supplier
              </Link>
            )}
          </div>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Total Suppliers"
            value={
              summary.total
            }
            loading={
              summaryLoading
            }
          />

          <StatCard
            label="Verified"
            value={
              summary.verified
            }
            loading={
              summaryLoading
            }
          />

          <StatCard
            label="Active"
            value={
              summary.active
            }
            loading={
              summaryLoading
            }
          />
        </div>

        {/* FILTERS */}

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

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
                placeholder="Search suppliers..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff4b1f] dark:border-gray-700 dark:text-white"
              />
            </div>

            <FilterSelect
              value={
                verificationFilter
              }
              onChange={(
                value
              ) => {
                setVerificationFilter(
                  value as VerificationFilter
                );

                setPage(1);
              }}
              options={
                VERIFICATION_OPTIONS
              }
              label="Verification"
            />

            <FilterSelect
              value={
                statusFilter
              }
              onChange={(
                value
              ) => {
                setStatusFilter(
                  value as StatusFilter
                );

                setPage(1);
              }}
              options={
                STATUS_OPTIONS
              }
              label="Status"
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
        </section>

        {/* TABLE */}

        <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Supplier List
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Loading suppliers..."
                  : loadError
                    ? "Supplier data unavailable"
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
          </div>

          <div className="block w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                  <TableHeading>
                    Supplier
                  </TableHeading>

                  <TableHeading>
                    Location
                  </TableHeading>

                  <TableHeading>
                    Business Type
                  </TableHeading>

                  <TableHeading>
                    Featured
                  </TableHeading>

                  <TableHeading>
                    Verification
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <TableHeading>
                    Contact
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
                      colSpan={8}
                      className="px-6 py-14"
                    >
                      <LoadingState />
                    </td>
                  </tr>
                )}

                {!loading &&
                  loadError && (
                    <tr>
                      <td
                        colSpan={8}
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

                            void loadSuppliers();
                          }}
                        />
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
                          supplier.supplierId ||
                          supplier._id
                        }
                        className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                      >
                        {/* SUPPLIER */}

                        <td className="px-4 py-3">
                          <div className="flex min-w-[300px] items-center gap-3">
                            <SupplierLogo
                              supplier={
                                supplier
                              }
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/suppliers/${encodeURIComponent(
                                    supplier.supplierId
                                  )}`}
                                  className="max-w-[230px] truncate text-sm font-semibold text-gray-900 transition hover:text-[#ff4b1f] dark:text-white"
                                >
                                  {supplier.companyName ||
                                    "Unnamed Supplier"}
                                </Link>

                                {supplier.verificationStatus ===
                                  "verified" && (
                                  <ShieldCheck
                                    size={15}
                                    className="shrink-0 text-[#5b2eff]"
                                  />
                                )}
                              </div>

                              <p className="mt-1 font-mono text-[11px] font-semibold text-[#8f78ff]">
                                {
                                  supplier.supplierId
                                }
                              </p>

                              {supplier.ntn && (
                                <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-gray-500">
                                  NTN:{" "}
                                  {
                                    supplier.ntn
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* LOCATION */}

                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                            <MapPin
                              size={15}
                              className="shrink-0 text-[#5b2eff]"
                            />

                            {supplier.address?.city ||
                              "—"}
                          </div>

                          {supplier.address
                            ?.country && (
                            <p className="ml-[22px] mt-0.5 text-[11px] text-gray-400">
                              {
                                supplier.address
                                  .country
                              }
                            </p>
                          )}
                        </td>

                        {/* BUSINESS TYPE */}

                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="inline-flex rounded-full bg-[#5b2eff]/10 px-2.5 py-1 text-xs font-semibold text-[#8f78ff]">
                            {formatSupplierBusinessType(
                              supplier.businessType
                            )}
                          </span>
                        </td>

                        {/* FEATURED */}

                        <td className="whitespace-nowrap px-4 py-3">
                          {supplier.isFeatured ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              <Star
                                size={13}
                                fill="currentColor"
                              />

                              Featured
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No
                            </span>
                          )}
                        </td>

                        {/* VERIFICATION */}

                        <td className="whitespace-nowrap px-4 py-3">
                          <VerificationBadge
                            status={
                              supplier.verificationStatus
                            }
                          />
                        </td>

                        {/* STATUS */}

                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge
                            status={
                              supplier.status
                            }
                          />
                        </td>

                        {/* CONTACT */}

                        <td className="px-4 py-3">
                          <div className="min-w-[245px]">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {supplier.contactPerson ||
                                "—"}
                            </p>

                            {supplier.phone && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <Phone
                                  size={13}
                                  className="shrink-0 text-[#ff4b1f]"
                                />

                                <span>
                                  {
                                    supplier.phone
                                  }
                                </span>
                              </div>
                            )}

                            {supplier.email && (
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <Mail
                                  size={13}
                                  className="shrink-0 text-[#5b2eff]"
                                />

                                <span className="max-w-[200px] truncate">
                                  {
                                    supplier.email
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              to={`/suppliers/${encodeURIComponent(
                                supplier.supplierId
                              )}`}
                              title="View Supplier"
                              className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#ff4b1f]/10 hover:text-[#ff4b1f]"
                            >
                              <Eye
                                size={16}
                              />
                            </Link>

                            {canManage && (
                              <>
                                <Link
                                  to={`/suppliers/${encodeURIComponent(
                                    supplier.supplierId
                                  )}/edit`}
                                  title="Edit Supplier"
                                  className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#5b2eff]/10 hover:text-[#8f78ff]"
                                >
                                  <Pencil
                                    size={16}
                                  />
                                </Link>

                                <button
                                  type="button"
                                  title="Delete Supplier"
                                  onClick={() =>
                                    setSupplierToDelete(
                                      supplier
                                    )
                                  }
                                  className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-500/10 hover:text-red-500"
                                >
                                  <Trash2
                                    size={16}
                                  />
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
                  suppliers.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-14 text-center"
                      >
                        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                          <Search
                            size={20}
                          />
                        </div>

                        <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                          No suppliers found
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {hasFilters
                            ? "Try changing your search or filters."
                            : "No suppliers have been added yet."}
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
                    aria-label="Suppliers per page"
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
                    className="h-8 rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-600 outline-none transition focus:border-[#ff4b1f] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
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
                    <ChevronLeft
                      size={16}
                    />
                  </Button>

                  <span className="min-w-9 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
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
                    <ChevronRight
                      size={16}
                    />
                  </Button>
                </div>
              </div>
            )}
        </section>
      </div>

      {/* DELETE MODAL */}

      <Modal
        isOpen={Boolean(
          supplierToDelete
        )}
        onClose={() => {
          if (!deleting) {
            setSupplierToDelete(
              null
            );
          }
        }}
        className="m-4 max-w-[480px]"
      >
        {supplierToDelete && (
          <div className="relative w-full max-w-[480px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="px-6 pb-5 pt-7 sm:px-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <Trash2
                  size={20}
                />
              </div>

              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
                Delete Supplier?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                You are about to delete{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {
                    supplierToDelete.companyName
                  }
                </span>
                .
              </p>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {
                    supplierToDelete.companyName
                  }
                </p>

                <p className="mt-1 font-mono text-xs font-semibold text-[#8f78ff]">
                  {
                    supplierToDelete.supplierId
                  }
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                Supplier deletion is rejected when subscription history or product-access mappings still depend on this supplier. In that case, set the supplier to Inactive or Suspended instead.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
              <Button
                size="sm"
                variant="outline"
                disabled={
                  deleting
                }
                onClick={() =>
                  setSupplierToDelete(
                    null
                  )
                }
              >
                Cancel
              </Button>

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() => {
                  void confirmDelete();
                }}
                className="inline-flex h-10 min-w-[145px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={15}
                  />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete Supplier"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      {loading ? (
        <div className="mt-2 h-6 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      ) : (
        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
          {value === null
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
    <div className="relative w-full xl:w-[200px]">
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
        className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-transparent px-3 pr-9 text-sm text-gray-700 outline-none transition focus:border-[#ff4b1f] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
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

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}

/* =========================================================
   SUPPLIER LOGO
========================================================= */

function SupplierLogo({
  supplier,
}: {
  supplier: Supplier;
}) {
  const [
    failed,
    setFailed,
  ] =
    useState(false);

  useEffect(
    () => {
      setFailed(false);
    },
    [
      supplier.logo,
    ]
  );

  if (
    supplier.logo &&
    !failed
  ) {
    return (
      <div className="flex h-[58px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
        <img
          src={
            supplier.logo
          }
          alt={
            supplier.companyName
          }
          onError={() =>
            setFailed(
              true
            )
          }
          className="max-h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[58px] w-[88px] shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[#8f78ff] dark:border-gray-700 dark:bg-gray-800">
      <Building2
        size={24}
      />
    </div>
  );
}

/* =========================================================
   VERIFICATION BADGE
========================================================= */

function VerificationBadge({
  status,
}: {
  status:
    SupplierVerificationStatus;
}) {
  const styles: Record<
    SupplierVerificationStatus,
    string
  > = {
    verified:
      "bg-[#5b2eff]/10 text-[#8f78ff]",

    pending:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",

    under_review:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",

    rejected:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status ===
        "verified" && (
        <ShieldCheck
          size={13}
        />
      )}

      {formatSupplierVerificationStatus(
        status
      )}
    </span>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    SupplierStatus;
}) {
  const styles: Record<
    SupplierStatus,
    string
  > = {
    active:
      "bg-green-500/10 text-green-600 dark:text-green-400",

    inactive:
      "bg-gray-500/10 text-gray-500",

    suspended:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {formatSupplierStatus(
        status
      )}
    </span>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-[#5b2eff]/10 text-[#8f78ff]">
        <RefreshCw
          size={18}
          className="animate-spin"
        />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        Loading suppliers
      </h3>

      <p className="mt-1 text-xs text-gray-500">
        Fetching suppliers from Solar Trade Hub.
      </p>
    </div>
  );
}

/* =========================================================
   ERROR STATE
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
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-red-500/10 text-red-500">
        <CircleAlert
          size={20}
        />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        Unable to load suppliers
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-500">
        {message}
      </p>

      <button
        type="button"
        onClick={
          onRetry
        }
        className="mt-4 h-9 rounded-lg bg-[#5b2eff] px-4 text-xs font-semibold text-white transition hover:bg-[#4e26e6]"
      >
        Try Again
      </button>
    </div>
  );
}