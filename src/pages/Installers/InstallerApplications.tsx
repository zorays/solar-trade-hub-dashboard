import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  Link,
} from "react-router";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import {
  formatInstallerApplicationDate,
  formatInstallerApplicationStatus,
  getInstallerApplicationErrorMessage,
  getInstallerApplications,
  updateInstallerApplicationStatus,
  type InstallerApplication,
  type InstallerApplicationStatus,
  type InstallerApplicationSummary,
} from "../../services/installer/installerApplication.service";

/* =========================================================
   SOLAR TRADE HUB
   INSTALLER APPLICATIONS
========================================================= */

type StatusFilter =
  | "all"
  | InstallerApplicationStatus;

const emptySummary: InstallerApplicationSummary = {
  total: 0,
  pending: 0,
  under_review: 0,
  approved: 0,
  rejected: 0,
};

/* =========================================================
   PAGE
========================================================= */

export default function InstallerApplications() {
  const [
    applications,
    setApplications,
  ] =
    useState<
      InstallerApplication[]
    >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<
      InstallerApplicationSummary
    >(emptySummary);

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
    totalPages,
    setTotalPages,
  ] =
    useState(0);

  const [
    total,
    setTotal,
  ] =
    useState(0);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);

  /* =======================================================
     STATUS REVIEW MODAL
  ======================================================= */

  const [
    selectedApplication,
    setSelectedApplication,
  ] =
    useState<
      InstallerApplication | null
    >(null);

  const [
    nextStatus,
    setNextStatus,
  ] =
    useState<
      InstallerApplicationStatus
    >("under_review");

  const [
    reviewNotes,
    setReviewNotes,
  ] =
    useState("");

  const [
    savingStatus,
    setSavingStatus,
  ] =
    useState(false);

  const limit = 20;

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
        350
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    search,
  ]);

  /* =======================================================
     LOAD APPLICATIONS
  ======================================================= */

  useEffect(() => {
    let ignore =
      false;

    const loadApplications =
      async () => {
        try {
          setLoading(
            true
          );

          setErrorMessage(
            ""
          );

          const result =
            await getInstallerApplications(
              {
                page,
                limit,

                search:
                  debouncedSearch ||
                  undefined,

                applicationStatus:
                  statusFilter ===
                  "all"
                    ? undefined
                    : statusFilter,

                sortBy:
                  "createdAt",

                sortOrder:
                  "desc",
              }
            );

          if (
            ignore
          ) {
            return;
          }

          setApplications(
            result.applications
          );

          setSummary(
            result.summary
          );

          setTotal(
            result.pagination
              .total
          );

          setTotalPages(
            result.pagination
              .totalPages
          );

          if (
            result.pagination
              .totalPages >
              0 &&
            page >
              result.pagination
                .totalPages
          ) {
            setPage(
              result.pagination
                .totalPages
            );
          }
        } catch (
          error
        ) {
          if (
            ignore
          ) {
            return;
          }

          setApplications(
            []
          );

          setSummary(
            emptySummary
          );

          setTotal(0);

          setTotalPages(
            0
          );

          setErrorMessage(
            getInstallerApplicationErrorMessage(
              error,
              "Unable to load installer applications."
            )
          );
        } finally {
          if (
            !ignore
          ) {
            setLoading(
              false
            );
          }
        }
      };

    void loadApplications();

    return () => {
      ignore = true;
    };
  }, [
    page,
    debouncedSearch,
    statusFilter,
    refreshKey,
  ]);

  /* =======================================================
     STATUS FILTER CHANGE
  ======================================================= */

  const changeStatusFilter =
    (
      value: StatusFilter
    ) => {
      setStatusFilter(
        value
      );

      setPage(1);
    };

  /* =======================================================
     OPEN ACTION MODAL
  ======================================================= */

  const openStatusAction =
    (
      application:
        InstallerApplication,

      status:
        InstallerApplicationStatus
    ) => {
      setSelectedApplication(
        application
      );

      setNextStatus(
        status
      );

      setReviewNotes(
        application.reviewNotes ||
          ""
      );
    };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeStatusModal =
    () => {
      if (
        savingStatus
      ) {
        return;
      }

      setSelectedApplication(
        null
      );

      setNextStatus(
        "under_review"
      );

      setReviewNotes(
        ""
      );
    };

  /* =======================================================
     SAVE STATUS
  ======================================================= */

  const saveStatus =
    async () => {
      if (
        !selectedApplication ||
        savingStatus
      ) {
        return;
      }

      try {
        setSavingStatus(
          true
        );

        const result =
          await updateInstallerApplicationStatus(
            selectedApplication.applicationId,
            nextStatus,
            reviewNotes
          );

        const label =
          formatInstallerApplicationStatus(
            result.application
              .applicationStatus
          );

        if (
          result.installer
            ?.installerId
        ) {
          toast.success(
            "Application approved",
            {
              description:
                `${result.installer.installerId} created and awaiting installer verification.`,
            }
          );
        } else {
          toast.success(
            `Application marked ${label}`,
            {
              description:
                result.application
                  .applicationId,
            }
          );
        }

        setSelectedApplication(
          null
        );

        setReviewNotes(
          ""
        );

        setRefreshKey(
          (current) =>
            current + 1
        );
      } catch (
        error
      ) {
        toast.error(
          "Unable to update application",
          {
            description:
              getInstallerApplicationErrorMessage(
                error,
                "Application status could not be updated."
              ),
          }
        );
      } finally {
        setSavingStatus(
          false
        );
      }
    };

  /* =======================================================
     SELECTED APPLICATION NAME
  ======================================================= */

  const selectedName =
    useMemo(
      () =>
        selectedApplication
          ?.displayName ||
        selectedApplication
          ?.companyName ||
        "",
      [
        selectedApplication,
      ]
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Installer Applications | Solar Trade Hub"
        description="Review installer applications in Solar Trade Hub"
      />

      <PageBreadcrumb
        pageTitle="Installer Applications"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-4">
        {/* =================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex
            flex-col
            gap-3

            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div>
            <h1
              className="
                text-lg
                font-semibold
                text-gray-900

                dark:text-white
              "
            >
              Installer Applications
            </h1>

            <p
              className="
                mt-1
                text-xs
                text-gray-500

                dark:text-gray-400
              "
            >
              Review companies applying
              to join Solar Trade Hub as
              installers.
            </p>
          </div>

          <Link
            to="/installers"
            className="
              inline-flex
              h-10
              items-center
              justify-center
              rounded-lg
              border
              border-gray-200
              bg-white
              px-4
              text-sm
              font-semibold
              text-gray-600
              transition

              hover:bg-gray-50

              dark:border-gray-700
              dark:bg-transparent
              dark:text-gray-300
            "
          >
            All Installers
          </Link>
        </div>

        {/* =================================================
            SUMMARY
        ================================================== */}

        <div
          className="
            grid
            grid-cols-2
            gap-3

            xl:grid-cols-5
          "
        >
          <SummaryCard
            label="Total Applications"
            value={
              summary.total
            }
          />

          <SummaryCard
            label="Pending"
            value={
              summary.pending
            }
          />

          <SummaryCard
            label="Under Review"
            value={
              summary.under_review
            }
          />

          <SummaryCard
            label="Approved"
            value={
              summary.approved
            }
          />

          <SummaryCard
            label="Rejected"
            value={
              summary.rejected
            }
          />
        </div>

        {/* =================================================
            FILTERS
        ================================================== */}

        <section
          className="
            rounded-xl
            border
            border-gray-200
            bg-white
            p-4

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <div
            className="
              grid
              grid-cols-1
              gap-3

              lg:grid-cols-[1fr_220px]
            "
          >
            <div
              className="
                relative
              "
            >
              <SearchIcon />

              <input
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
                placeholder="Search application ID, company, contact, city, service..."
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-gray-200
                  bg-transparent
                  pl-10
                  pr-3
                  text-sm
                  text-gray-800
                  outline-none
                  transition

                  focus:border-[#ff4b1f]

                  dark:border-gray-700
                  dark:text-white
                "
              />
            </div>

            <div
              className="
                relative
              "
            >
              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  changeStatusFilter(
                    event.target
                      .value as StatusFilter
                  )
                }
                className="
                  h-10
                  w-full
                  appearance-none
                  rounded-lg
                  border
                  border-gray-200
                  bg-transparent
                  px-3
                  pr-9
                  text-sm
                  text-gray-700
                  outline-none
                  transition

                  focus:border-[#ff4b1f]

                  dark:border-gray-700
                  dark:text-gray-300
                "
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="under_review">
                  Under Review
                </option>

                <option value="approved">
                  Approved
                </option>

                <option value="rejected">
                  Rejected
                </option>
              </select>

              <ChevronIcon />
            </div>
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================== */}

        {errorMessage && (
          <div
            className="
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700

              dark:border-red-500/20
              dark:bg-red-500/10
              dark:text-red-400
            "
          >
            {
              errorMessage
            }
          </div>
        )}

        {/* =================================================
            TABLE
        ================================================== */}

        <section
          className="
            w-full
            min-w-0
            max-w-full
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          {/* TABLE HEADER */}

          <div
            className="
              flex
              flex-col
              gap-2
              border-b
              border-gray-200
              px-5
              py-4

              dark:border-gray-800

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-sm
                  font-semibold
                  text-gray-900

                  dark:text-white
                "
              >
                Application Queue
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-gray-500
                "
              >
                {loading
                  ? "Loading applications..."
                  : `${total} matching application${
                      total === 1
                        ? ""
                        : "s"
                    }`}
              </p>
            </div>

            <p
              className="
                text-xs
                text-gray-400
              "
            >
              Approval creates an
              Installer profile with
              pending verification.
            </p>
          </div>

          <div
            className="
              block
              w-full
              max-w-full
              overflow-x-auto
            "
          >
            <table
              className="
                min-w-[1500px]
                w-full
              "
            >
              <thead>
                <tr
                  className="
                    border-b
                    border-gray-200
                    bg-gray-50/70

                    dark:border-gray-800
                    dark:bg-white/[0.02]
                  "
                >
                  <TableHead>
                    Application
                  </TableHead>

                  <TableHead>
                    Location
                  </TableHead>

                  <TableHead>
                    Service Area
                  </TableHead>

                  <TableHead>
                    Services
                  </TableHead>

                  <TableHead>
                    Contact
                  </TableHead>

                  <TableHead>
                    Applied On
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead
                    align="right"
                  >
                    Actions
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {/* =========================================
                    LOADING
                ========================================== */}

                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="
                        px-5
                        py-14
                        text-center
                      "
                    >
                      <div
                        className="
                          mx-auto
                          size-7
                          animate-spin
                          rounded-full
                          border-2
                          border-gray-200
                          border-t-[#ff4b1f]

                          dark:border-gray-700
                          dark:border-t-[#ff4b1f]
                        "
                      />

                      <p
                        className="
                          mt-3
                          text-xs
                          text-gray-500
                        "
                      >
                        Loading installer
                        applications...
                      </p>
                    </td>
                  </tr>
                )}

                {/* =========================================
                    APPLICATION ROWS
                ========================================== */}

                {!loading &&
                  applications.map(
                    (
                      application
                    ) => (
                      <ApplicationRow
                        key={
                          application.applicationId
                        }
                        application={
                          application
                        }
                        onAction={
                          openStatusAction
                        }
                      />
                    )
                  )}

                {/* =========================================
                    EMPTY
                ========================================== */}

                {!loading &&
                  applications.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="
                          px-5
                          py-12
                          text-center
                        "
                      >
                        <p
                          className="
                            text-sm
                            font-semibold
                            text-gray-700

                            dark:text-gray-300
                          "
                        >
                          No applications found
                        </p>

                        <p
                          className="
                            mt-1
                            text-xs
                            text-gray-400
                          "
                        >
                          Try changing the
                          search or status
                          filter.
                        </p>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          {/* ===============================================
              PAGINATION
          ================================================ */}

          {!loading &&
            totalPages > 1 && (
              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-t
                  border-gray-200
                  px-5
                  py-4

                  dark:border-gray-800
                "
              >
                <p
                  className="
                    text-xs
                    text-gray-500

                    dark:text-gray-400
                  "
                >
                  Page {page} of{" "}
                  {totalPages}
                </p>

                <div
                  className="
                    flex
                    gap-2
                  "
                >
                  <button
                    type="button"
                    disabled={
                      page <= 1
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
                    className="
                      h-9
                      rounded-lg
                      border
                      border-gray-200
                      px-3
                      text-xs
                      font-semibold
                      text-gray-600
                      transition

                      hover:bg-gray-50

                      disabled:cursor-not-allowed
                      disabled:opacity-40

                      dark:border-gray-700
                      dark:text-gray-300
                    "
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >=
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.min(
                            totalPages,
                            current +
                              1
                          )
                      )
                    }
                    className="
                      h-9
                      rounded-lg
                      border
                      border-gray-200
                      px-3
                      text-xs
                      font-semibold
                      text-gray-600
                      transition

                      hover:bg-gray-50

                      disabled:cursor-not-allowed
                      disabled:opacity-40

                      dark:border-gray-700
                      dark:text-gray-300
                    "
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>

      {/* ===================================================
          STATUS REVIEW MODAL
      ==================================================== */}

      {selectedApplication && (
        <div
          className="
            fixed
            inset-0
            z-[99999]
            flex
            items-center
            justify-center
            p-4
          "
        >
          <button
            type="button"
            aria-label="Close application review"
            disabled={
              savingStatus
            }
            onClick={
              closeStatusModal
            }
            className="
              absolute
              inset-0
              bg-black/55
              backdrop-blur-[2px]
            "
          />

          <div
            className="
              relative
              z-10
              w-full
              max-w-[600px]
              overflow-hidden
              rounded-2xl
              border
              border-gray-200
              bg-white
              shadow-2xl

              dark:border-gray-800
              dark:bg-[#101828]
            "
          >
            {/* =============================================
                MODAL HEADER
            ============================================== */}

            <div
              className="
                border-b
                border-gray-200
                px-6
                py-5

                dark:border-gray-800
              "
            >
              <h3
                className="
                  text-base
                  font-semibold
                  text-gray-900

                  dark:text-white
                "
              >
                Review Installer Application
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500

                  dark:text-gray-400
                "
              >
                {
                  selectedName
                }
              </p>

              <p
                className="
                  mt-1
                  font-mono
                  text-[11px]
                  text-gray-400
                "
              >
                {
                  selectedApplication.applicationId
                }
              </p>
            </div>

            {/* =============================================
                APPLICATION SUMMARY
            ============================================== */}

            <div
              className="
                grid
                grid-cols-2
                gap-3
                border-b
                border-gray-200
                bg-gray-50
                px-6
                py-4

                dark:border-gray-800
                dark:bg-white/[0.02]
              "
            >
              <ModalInfo
                label="City"
                value={
                  selectedApplication.city ||
                  "—"
                }
              />

              <ModalInfo
                label="Applied"
                value={formatInstallerApplicationDate(
                  selectedApplication.createdAt
                )}
              />

              <ModalInfo
                label="Contact"
                value={
                  selectedApplication
                    .internalContact
                    ?.name ||
                  "—"
                }
              />

              <ModalInfo
                label="Current Status"
                value={formatInstallerApplicationStatus(
                  selectedApplication.applicationStatus
                )}
              />
            </div>

            {/* =============================================
                MODAL BODY
            ============================================== */}

            <div
              className="
                space-y-5
                p-6
              "
            >
              <div>
                <label
                  className="
                    mb-1.5
                    block
                    text-xs
                    font-medium
                    text-gray-700

                    dark:text-gray-300
                  "
                >
                  Application Status
                </label>

                <select
                  value={
                    nextStatus
                  }
                  disabled={
                    savingStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setNextStatus(
                      event.target
                        .value as InstallerApplicationStatus
                    )
                  }
                  className="
                    h-11
                    w-full
                    rounded-lg
                    border
                    border-gray-200
                    bg-transparent
                    px-3
                    text-sm
                    text-gray-800
                    outline-none
                    transition

                    focus:border-[#5b2eff]

                    dark:border-gray-700
                    dark:bg-[#101828]
                    dark:text-gray-200
                  "
                >
                  <option value="pending">
                    Pending
                  </option>

                  <option value="under_review">
                    Under Review
                  </option>

                  <option value="approved">
                    Approved
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>
                </select>
              </div>

              <div>
                <label
                  className="
                    mb-1.5
                    block
                    text-xs
                    font-medium
                    text-gray-700

                    dark:text-gray-300
                  "
                >
                  Review Notes
                </label>

                <textarea
                  rows={5}
                  maxLength={3000}
                  value={
                    reviewNotes
                  }
                  disabled={
                    savingStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setReviewNotes(
                      event.target
                        .value
                    )
                  }
                  placeholder="Add application review notes..."
                  className="
                    w-full
                    resize-y
                    rounded-lg
                    border
                    border-gray-200
                    bg-transparent
                    px-3
                    py-3
                    text-sm
                    text-gray-800
                    outline-none
                    transition

                    placeholder:text-gray-400

                    focus:border-[#5b2eff]

                    dark:border-gray-700
                    dark:bg-[#101828]
                    dark:text-gray-200
                  "
                />

                <p
                  className="
                    mt-1
                    text-right
                    text-[10px]
                    text-gray-400
                  "
                >
                  {
                    reviewNotes.length
                  }
                  /3000
                </p>
              </div>

              {nextStatus ===
                "approved" && (
                <div
                  className="
                    rounded-xl
                    border
                    border-green-200
                    bg-green-50
                    p-4

                    dark:border-green-500/20
                    dark:bg-green-500/10
                  "
                >
                  <p
                    className="
                      text-xs
                      font-semibold
                      text-green-700

                      dark:text-green-400
                    "
                  >
                    Approval creates an Installer
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-green-700/80

                      dark:text-green-400/80
                    "
                  >
                    A new STH-I installer
                    profile will be created.
                    Its marketplace
                    verification will remain
                    Pending until separately
                    approved from Installer
                    Verification.
                  </p>
                </div>
              )}

              {nextStatus ===
                "rejected" && (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    p-4

                    dark:border-red-500/20
                    dark:bg-red-500/10
                  "
                >
                  <p
                    className="
                      text-xs
                      font-semibold
                      text-red-700

                      dark:text-red-400
                    "
                  >
                    Reject Application
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-red-700/80

                      dark:text-red-400/80
                    "
                  >
                    No Installer profile will
                    be created from this
                    application.
                  </p>
                </div>
              )}
            </div>

            {/* =============================================
                MODAL FOOTER
            ============================================== */}

            <div
              className="
                flex
                justify-end
                gap-2
                border-t
                border-gray-200
                bg-gray-50
                px-6
                py-4

                dark:border-gray-800
                dark:bg-white/[0.02]
              "
            >
              <button
                type="button"
                disabled={
                  savingStatus
                }
                onClick={
                  closeStatusModal
                }
                className="
                  h-10
                  rounded-lg
                  border
                  border-gray-200
                  bg-white
                  px-4
                  text-sm
                  font-semibold
                  text-gray-600
                  transition

                  hover:bg-gray-50

                  disabled:cursor-not-allowed
                  disabled:opacity-50

                  dark:border-gray-700
                  dark:bg-transparent
                  dark:text-gray-300
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  savingStatus
                }
                onClick={() =>
                  void saveStatus()
                }
                className={`
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  rounded-lg

                  disabled:cursor-not-allowed
                  disabled:opacity-60

                  ${
                    nextStatus ===
                    "approved"
                      ? "bg-green-600 hover:bg-green-700"
                      : nextStatus ===
                          "rejected"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-[#5b2eff] hover:bg-[#4b22eb]"
                  }
                `}
              >
                {savingStatus
                  ? "Saving..."
                  : nextStatus ===
                      "approved"
                    ? "Approve Application"
                    : nextStatus ===
                        "rejected"
                      ? "Reject Application"
                      : "Save Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   APPLICATION ROW
========================================================= */

function ApplicationRow({
  application,
  onAction,
}: {
  application:
    InstallerApplication;

  onAction: (
    application:
      InstallerApplication,
    status:
      InstallerApplicationStatus
  ) => void;
}) {
  const displayName =
    application.displayName ||
    application.companyName;

  const contactName =
    application.internalContact
      ?.name ||
    "—";

  const contactPhone =
    application.internalContact
      ?.phone ||
    application.phone ||
    "";

  const contactEmail =
    application.internalContact
      ?.email ||
    application.email ||
    "";

  return (
    <tr
      className="
        border-b
        border-gray-100
        transition
        last:border-b-0

        hover:bg-gray-50/50

        dark:border-gray-800
        dark:hover:bg-white/[0.02]
      "
    >
      {/* APPLICATION */}

      <td
        className="
          px-5
          py-4
          align-top
        "
      >
        <div>
          <p
            className="
              text-sm
              font-semibold
              text-gray-900

              dark:text-white
            "
          >
            {
              displayName
            }
          </p>

          {application.companyName !==
            displayName && (
            <p
              className="
                mt-1
                text-xs
                text-gray-500
              "
            >
              {
                application.companyName
              }
            </p>
          )}

          <p
            className="
              mt-1
              font-mono
              text-[11px]
              text-gray-400
            "
          >
            {
              application.applicationId
            }
          </p>
        </div>
      </td>

      {/* LOCATION */}

      <td
        className="
          px-5
          py-4
          align-top
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
            text-sm
            text-gray-700

            dark:text-gray-300
          "
        >
          <LocationIcon />

          {application.city ||
            application.address
              ?.city ||
            "—"}
        </div>
      </td>

      {/* SERVICE AREA */}

      <td
        className="
          px-5
          py-4
          align-top
        "
      >
        <div
          className="
            flex
            max-w-[240px]
            flex-wrap
            gap-1.5
          "
        >
          {application
            .serviceArea
            ?.length ? (
            application.serviceArea.map(
              (
                area
              ) => (
                <span
                  key={
                    area
                  }
                  className="
                    rounded-md
                    bg-gray-100
                    px-2
                    py-1
                    text-[11px]
                    font-medium
                    text-gray-600

                    dark:bg-white/5
                    dark:text-gray-400
                  "
                >
                  {area}
                </span>
              )
            )
          ) : (
            <span
              className="
                text-xs
                text-gray-400
              "
            >
              —
            </span>
          )}
        </div>
      </td>

      {/* SERVICES */}

      <td
        className="
          px-5
          py-4
          align-top
        "
      >
        <div
          className="
            flex
            max-w-[310px]
            flex-wrap
            gap-1.5
          "
        >
          {application.services
            ?.length ? (
            application.services.map(
              (
                service
              ) => (
                <span
                  key={
                    service
                  }
                  className="
                    rounded-md
                    bg-[#5b2eff]/10
                    px-2
                    py-1
                    text-[11px]
                    font-semibold
                    text-[#7255ff]

                    dark:text-[#9d89ff]
                  "
                >
                  {
                    service
                  }
                </span>
              )
            )
          ) : (
            <span
              className="
                text-xs
                text-gray-400
              "
            >
              —
            </span>
          )}
        </div>
      </td>

      {/* CONTACT */}

      <td
        className="
          px-5
          py-4
          align-top
        "
      >
        <p
          className="
            text-sm
            font-medium
            text-gray-800

            dark:text-gray-200
          "
        >
          {
            contactName
          }
        </p>

        {contactPhone && (
          <p
            className="
              mt-1
              text-xs
              text-gray-500
            "
          >
            {
              contactPhone
            }
          </p>
        )}

        {contactEmail && (
          <p
            className="
              mt-1
              max-w-[220px]
              truncate
              text-xs
              text-gray-500
            "
          >
            {
              contactEmail
            }
          </p>
        )}
      </td>

      {/* DATE */}

      <td
        className="
          px-5
          py-4
          align-top
        "
      >
        <span
          className="
            whitespace-nowrap
            text-sm
            text-gray-600

            dark:text-gray-300
          "
        >
          {formatInstallerApplicationDate(
            application.createdAt
          )}
        </span>
      </td>

      {/* STATUS */}

      <td
        className="
          px-5
          py-4
          align-top
        "
      >
        <StatusBadge
          status={
            application.applicationStatus
          }
        />

        {application.reviewNotes && (
          <p
            className="
              mt-2
              max-w-[210px]
              text-xs
              leading-5
              text-gray-400
            "
          >
            {
              application.reviewNotes
            }
          </p>
        )}
      </td>

      {/* ACTIONS */}

      <td
        className="
          px-5
          py-4
          align-top
        "
      >
        <div
          className="
            flex
            justify-end
            gap-2
          "
        >
          {application.applicationStatus ===
            "pending" && (
            <button
              type="button"
              onClick={() =>
                onAction(
                  application,
                  "under_review"
                )
              }
              className="
                inline-flex
                h-8
                items-center
                justify-center
                rounded-lg
                bg-[#5b2eff]/10
                px-3
                text-xs
                font-semibold
                text-[#7255ff]
                transition

                hover:bg-[#5b2eff]/15

                dark:text-[#9d89ff]
              "
            >
              Review
            </button>
          )}

          {(application.applicationStatus ===
            "pending" ||
            application.applicationStatus ===
              "under_review") && (
            <>
              <button
                type="button"
                onClick={() =>
                  onAction(
                    application,
                    "approved"
                  )
                }
                className="
                  inline-flex
                  h-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-green-500/10
                  px-3
                  text-xs
                  font-semibold
                  text-green-600
                  transition

                  hover:bg-green-500/15
                "
              >
                Approve
              </button>

              <button
                type="button"
                onClick={() =>
                  onAction(
                    application,
                    "rejected"
                  )
                }
                className="
                  inline-flex
                  h-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-red-500/10
                  px-3
                  text-xs
                  font-semibold
                  text-red-500
                  transition

                  hover:bg-red-500/15
                "
              >
                Reject
              </button>
            </>
          )}

          {application.applicationStatus ===
            "rejected" && (
            <button
              type="button"
              onClick={() =>
                onAction(
                  application,
                  "under_review"
                )
              }
              className="
                inline-flex
                h-8
                items-center
                justify-center
                rounded-lg
                border
                border-purple-200
                px-3
                text-xs
                font-semibold
                text-purple-600
                transition

                hover:bg-purple-50

                dark:border-purple-500/20
                dark:text-purple-400
                dark:hover:bg-purple-500/10
              "
            >
              Re-review
            </button>
          )}

          {application.applicationStatus ===
            "approved" && (
            <span
              className="
                inline-flex
                h-8
                items-center
                rounded-lg
                bg-green-500/10
                px-3
                text-xs
                font-semibold
                text-green-600
              "
            >
              Converted
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        bg-white
        px-4
        py-3

        dark:border-gray-800
        dark:bg-white/[0.03]
      "
    >
      <p
        className="
          text-[10px]
          font-semibold
          uppercase
          tracking-wide
          text-gray-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-xl
          font-bold
          text-gray-900

          dark:text-white
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   TABLE HEAD
========================================================= */

function TableHead({
  children,
  align = "left",
}: {
  children:
    ReactNode;

  align?:
    | "left"
    | "right";
}) {
  return (
    <th
      className={`
        px-5
        py-3
        text-[11px]
        font-semibold
        uppercase
        tracking-wide
        text-gray-400

        ${
          align ===
          "right"
            ? "text-right"
            : "text-left"
        }
      `}
    >
      {children}
    </th>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    InstallerApplicationStatus;
}) {
  const styles: Record<
    InstallerApplicationStatus,
    string
  > = {
    pending:
      "bg-amber-500/10 text-amber-500",

    under_review:
      "bg-[#5b2eff]/10 text-[#7255ff] dark:text-[#9d89ff]",

    approved:
      "bg-green-500/10 text-green-600",

    rejected:
      "bg-red-500/10 text-red-500",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-2.5
        py-1
        text-xs
        font-semibold

        ${styles[status]}
      `}
    >
      {formatInstallerApplicationStatus(
        status
      )}
    </span>
  );
}

/* =========================================================
   MODAL INFO
========================================================= */

function ModalInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p
        className="
          text-[10px]
          font-semibold
          uppercase
          tracking-wide
          text-gray-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-sm
          font-medium
          text-gray-800

          dark:text-gray-200
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="
        absolute
        left-3
        top-1/2
        size-4
        -translate-y-1/2
        text-gray-400
      "
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="
        pointer-events-none
        absolute
        right-3
        top-1/2
        size-4
        -translate-y-1/2
        text-gray-400
      "
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="
        size-4
        shrink-0
        text-[#5b2eff]
      "
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}