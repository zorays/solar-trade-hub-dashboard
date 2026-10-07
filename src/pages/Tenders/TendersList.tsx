import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  Link,
} from "react-router";

import {
  Building2,
  CalendarDays,
  Eye,
  FileText,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Users,
  WalletCards,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  formatTenderBudget,
  formatTenderDeadline,
  formatTenderStatus,
  getTenderErrorMessage,
  getTenders,
  type Tender,
  type TenderStatus,
  type TenderSummary,
} from "../../services/tender/tender.service";

/* =========================================================
   DEFAULT SUMMARY
========================================================= */

const EMPTY_SUMMARY: TenderSummary = {
  total: 0,
  draft: 0,
  open: 0,
  closed: 0,
  awarded: 0,
  cancelled: 0,
};

/* =========================================================
   STATUS STYLES
========================================================= */

const getStatusClasses = (
  status: TenderStatus
) => {
  switch (status) {
    case "open":
      return `
        bg-green-50
        text-green-700
        border-green-200
        dark:bg-green-500/10
        dark:text-green-400
        dark:border-green-500/20
      `;

    case "draft":
      return `
        bg-gray-100
        text-gray-600
        border-gray-200
        dark:bg-white/5
        dark:text-gray-400
        dark:border-gray-700
      `;

    case "closed":
      return `
        bg-red-50
        text-red-700
        border-red-200
        dark:bg-red-500/10
        dark:text-red-400
        dark:border-red-500/20
      `;

    case "awarded":
      return `
        bg-purple-50
        text-purple-700
        border-purple-200
        dark:bg-purple-500/10
        dark:text-purple-400
        dark:border-purple-500/20
      `;

    case "cancelled":
      return `
        bg-amber-50
        text-amber-700
        border-amber-200
        dark:bg-amber-500/10
        dark:text-amber-400
        dark:border-amber-500/20
      `;

    default:
      return `
        bg-gray-100
        text-gray-600
        border-gray-200
        dark:bg-white/5
        dark:text-gray-400
        dark:border-gray-700
      `;
  }
};

/* =========================================================
   PAGE
========================================================= */

const TendersList = () => {
  const [
    tenders,
    setTenders,
  ] =
    useState<Tender[]>([]);

  const [
    summary,
    setSummary,
  ] =
    useState<TenderSummary>(
      EMPTY_SUMMARY
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

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
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          setSearchQuery(
            searchInput.trim()
          );
        },
        350
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    searchInput,
  ]);

  /* =======================================================
     LOAD TENDERS
  ======================================================= */

  const loadTenders =
    useCallback(
      async (
        showToast = false
      ) => {
        try {
          setLoading(
            true
          );

          setLoadError(
            ""
          );

          const result =
            await getTenders({
              page: 1,
              limit: 100,

              ...(searchQuery
                ? {
                    search:
                      searchQuery,
                  }
                : {}),

              sortBy:
                "createdAt",

              sortOrder:
                "desc",
            });

          setTenders(
            result.tenders
          );

          setSummary(
            result.summary
          );

          if (
            showToast
          ) {
            toast.success(
              "Tenders refreshed successfully"
            );
          }
        } catch (
          error
        ) {
          const message =
            getTenderErrorMessage(
              error,
              "Unable to load tenders."
            );

          setLoadError(
            message
          );

          setTenders(
            []
          );

          setSummary(
            EMPTY_SUMMARY
          );

          toast.error(
            "Unable to load tenders",
            {
              description:
                message,
            }
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        searchQuery,
      ]
    );

  /* =======================================================
     INITIAL / SEARCH LOAD
  ======================================================= */

  useEffect(() => {
    void loadTenders();
  }, [
    loadTenders,
  ]);

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Tenders | Solar Trade Hub"
        description="Manage Solar Trade Hub tenders."
      />

      <PageBreadcrumb
        pageTitle="Tenders"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-6">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                <FileText
                  size={23}
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                  Solar Trade Hub
                </p>

                <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                  Tender Management
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Manage procurement
                  requirements, solar
                  projects and marketplace
                  tender opportunities.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={
                  loading
                }
                onClick={() =>
                  void loadTenders(
                    true
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.04]"
              >
                <RefreshCw
                  size={17}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <Link
                to="/tenders/add"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Plus
                  size={18}
                />

                Add Tender
              </Link>
            </div>
          </div>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Open Tenders"
            value={
              summary.open
            }
            icon={
              <FileText
                size={20}
                className="text-orange-600 dark:text-orange-400"
              />
            }
            iconClass="bg-orange-50 dark:bg-orange-500/10"
          />

          <StatCard
            title="Draft"
            value={
              summary.draft
            }
            icon={
              <FileText
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            }
            iconClass="bg-gray-100 dark:bg-white/5"
          />

          <StatCard
            title="Closed"
            value={
              summary.closed
            }
            icon={
              <CalendarDays
                size={20}
                className="text-red-600 dark:text-red-400"
              />
            }
            iconClass="bg-red-50 dark:bg-red-500/10"
          />

          <StatCard
            title="Awarded"
            value={
              summary.awarded
            }
            icon={
              <Users
                size={20}
                className="text-purple-600 dark:text-purple-400"
              />
            }
            iconClass="bg-purple-50 dark:bg-purple-500/10"
          />
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                All Tenders
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {loading
                  ? "Loading tenders..."
                  : `${tenders.length} tender${
                      tenders.length !==
                      1
                        ? "s"
                        : ""
                    } shown`}
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
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
                    event.target
                      .value
                  )
                }
                placeholder="Search title, ID, organization..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <TableHeading>
                    Tender
                  </TableHeading>

                  <TableHeading>
                    Organization
                  </TableHeading>

                  <TableHeading>
                    Category
                  </TableHeading>

                  <TableHeading>
                    Budget
                  </TableHeading>

                  <TableHeading>
                    Deadline
                  </TableHeading>

                  <TableHeading>
                    Bids
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <TableHeading
                    align="right"
                  >
                    Action
                  </TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {/* =========================================
                    LOADING
                ========================================= */}

                {loading && (
                  <tr>
                    <td
                      colSpan={
                        8
                      }
                      className="px-6 py-16"
                    >
                      <LoadingState />
                    </td>
                  </tr>
                )}

                {/* =========================================
                    ERROR
                ========================================= */}

                {!loading &&
                  loadError && (
                    <tr>
                      <td
                        colSpan={
                          8
                        }
                        className="px-6 py-14"
                      >
                        <ErrorState
                          message={
                            loadError
                          }
                          onRetry={() =>
                            void loadTenders()
                          }
                        />
                      </td>
                    </tr>
                  )}

                {/* =========================================
                    DATA
                ========================================= */}

                {!loading &&
                  !loadError &&
                  tenders.map(
                    (
                      tender
                    ) => (
                      <tr
                        key={
                          tender.tenderId ||
                          tender._id
                        }
                        className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                      >
                        {/* Tender */}

                        <td className="px-5 py-5 align-top sm:px-6">
                          <div className="min-w-[230px]">
                            <Link
                              to={`/tenders/${encodeURIComponent(
                                tender.tenderId
                              )}`}
                              className="font-medium text-gray-900 transition hover:text-purple-600 dark:text-white dark:hover:text-purple-400"
                            >
                              {
                                tender.title
                              }
                            </Link>

                            <p className="mt-1 font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                              {
                                tender.tenderId
                              }
                            </p>

                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <MapPin
                                size={13}
                              />

                              {
                                tender.location
                              }
                            </div>
                          </div>
                        </td>

                        {/* Organization */}

                        <td className="px-5 py-5 align-top">
                          <div className="flex min-w-[180px] items-center gap-2">
                            <Building2
                              size={16}
                              className="shrink-0 text-gray-400"
                            />

                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {
                                tender.organization
                              }
                            </span>
                          </div>
                        </td>

                        {/* Category */}

                        <td className="px-5 py-5 align-top">
                          <span className="inline-flex whitespace-nowrap rounded-md border border-purple-100 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400">
                            {
                              tender.category
                            }
                          </span>
                        </td>

                        {/* Budget */}

                        <td className="px-5 py-5 align-top">
                          <div className="flex min-w-[135px] items-center gap-2">
                            <WalletCards
                              size={15}
                              className="shrink-0 text-orange-500"
                            />

                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {formatTenderBudget(
                                tender.budget
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Deadline */}

                        <td className="px-5 py-5 align-top">
                          <div className="flex min-w-[130px] items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CalendarDays
                              size={15}
                            />

                            {formatTenderDeadline(
                              tender.deadline
                            )}
                          </div>
                        </td>

                        {/* Bids */}

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-2">
                            <Users
                              size={15}
                              className="text-gray-400"
                            />

                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {
                                tender.bidsCount
                              }
                            </span>
                          </div>
                        </td>

                        {/* Status */}

                        <td className="px-5 py-5 align-top">
                          <span
                            className={`
                              inline-flex
                              rounded-full
                              border
                              px-2.5
                              py-1
                              text-xs
                              font-semibold
                              ${getStatusClasses(
                                tender.status
                              )}
                            `}
                          >
                            {formatTenderStatus(
                              tender.status
                            )}
                          </span>
                        </td>

                        {/* Action */}

                        <td className="px-5 py-5 text-right align-top sm:px-6">
                          <Link
                            to={`/tenders/${encodeURIComponent(
                              tender.tenderId
                            )}`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20"
                          >
                            <Eye
                              size={14}
                            />

                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  )}

                {/* =========================================
                    EMPTY
                ========================================= */}

                {!loading &&
                  !loadError &&
                  tenders.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={
                          8
                        }
                        className="px-6 py-14"
                      >
                        <EmptyState
                          searching={
                            Boolean(
                              searchQuery
                            )
                          }
                        />
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;

  value: number;

  icon: ReactNode;

  iconClass: string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
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
  children: ReactNode;

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
   LOADING STATE
========================================================= */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
        <RefreshCw
          size={20}
          className="animate-spin"
        />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        Loading tenders
      </h3>

      <p className="mt-1 text-xs text-gray-500">
        Fetching Tender data from
        Solar Trade Hub.
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
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-500">
        <FileText
          size={20}
        />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        Unable to load tenders
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-500">
        {message}
      </p>

      <button
        type="button"
        onClick={
          onRetry
        }
        className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-purple-600 px-4 text-xs font-semibold text-white transition hover:bg-purple-700"
      >
        Try Again
      </button>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  searching,
}: {
  searching: boolean;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
        <FileText
          size={20}
        />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        {searching
          ? "No matching tenders"
          : "No tenders yet"}
      </h3>

      <p className="mt-1 text-xs text-gray-500">
        {searching
          ? "Try changing your search terms."
          : "Create the first Solar Trade Hub tender to get started."}
      </p>

      {!searching && (
        <Link
          to="/tenders/add"
          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 text-xs font-semibold text-white"
        >
          <Plus
            size={15}
          />

          Add Tender
        </Link>
      )}
    </div>
  );
}

export default TendersList;