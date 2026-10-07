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
  useParams,
} from "react-router";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Edit3,
  FileText,
  MapPin,
  RefreshCw,
  Tag,
  Users,
  WalletCards,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  formatTenderBudget,
  formatTenderDeadline,
  formatTenderStatus,
  getTender,
  getTenderErrorMessage,
  type Tender,
  type TenderStatus,
} from "../../services/tender/tender.service";

/* =========================================================
   STATUS STYLE
========================================================= */

function getStatusClasses(
  status: TenderStatus
) {
  switch (status) {
    case "open":
      return `
        border-green-200
        bg-green-50
        text-green-700
        dark:border-green-500/20
        dark:bg-green-500/10
        dark:text-green-400
      `;

    case "draft":
      return `
        border-gray-200
        bg-gray-100
        text-gray-600
        dark:border-gray-700
        dark:bg-white/5
        dark:text-gray-400
      `;

    case "closed":
      return `
        border-red-200
        bg-red-50
        text-red-700
        dark:border-red-500/20
        dark:bg-red-500/10
        dark:text-red-400
      `;

    case "awarded":
      return `
        border-purple-200
        bg-purple-50
        text-purple-700
        dark:border-purple-500/20
        dark:bg-purple-500/10
        dark:text-purple-400
      `;

    case "cancelled":
      return `
        border-amber-200
        bg-amber-50
        text-amber-700
        dark:border-amber-500/20
        dark:bg-amber-500/10
        dark:text-amber-400
      `;

    default:
      return `
        border-gray-200
        bg-gray-100
        text-gray-600
        dark:border-gray-700
        dark:bg-white/5
        dark:text-gray-400
      `;
  }
}

/* =========================================================
   DATE / TIME
========================================================= */

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
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-GB",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
}

/* =========================================================
   VIEW TENDER
========================================================= */

const ViewTender = () => {
  const params =
    useParams();

  /*
   * Supports either:
   *
   * /tenders/:id
   *
   * OR:
   *
   * /tenders/:tenderId
  */

  const tenderReference =
    params.tenderId ||
    params.id ||
    "";

  const [
    tender,
    setTender,
  ] =
    useState<Tender | null>(
      null
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

  /* =======================================================
     LOAD TENDER
  ======================================================= */

  const loadTender =
    useCallback(
      async () => {
        if (
          !tenderReference
        ) {
          setLoadError(
            "Tender ID is missing."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setLoadError(
            ""
          );

          const result =
            await getTender(
              tenderReference
            );

          setTender(
            result
          );
        } catch (
          error
        ) {
          setTender(
            null
          );

          setLoadError(
            getTenderErrorMessage(
              error,
              "Unable to load Tender."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        tenderReference,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadTender();
  }, [
    loadTender,
  ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <PageMeta
          title="Tender Details | Solar Trade Hub"
          description="View Solar Trade Hub Tender."
        />

        <PageBreadcrumb
          pageTitle="Tender Details"
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <RefreshCw
              size={21}
              className="animate-spin"
            />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
            Loading Tender
          </h2>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Fetching Tender details
            from Solar Trade Hub.
          </p>
        </div>
      </>
    );
  }

  /* =======================================================
     ERROR / NOT FOUND
  ======================================================= */

  if (
    loadError ||
    !tender
  ) {
    return (
      <>
        <PageMeta
          title="Tender Not Found | Solar Trade Hub"
          description="Tender could not be found."
        />

        <PageBreadcrumb
          pageTitle="Tender Details"
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <FileText
              size={21}
            />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Tender not found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
            {loadError ||
              "The requested Tender could not be found."}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                void loadTender()
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
            >
              <RefreshCw
                size={15}
              />

              Try Again
            </button>

            <Link
              to="/tenders"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 text-sm font-semibold text-white"
            >
              <ArrowLeft
                size={15}
              />

              Back to Tenders
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title={`${tender.title} | Solar Trade Hub`}
        description={`View Tender ${tender.tenderId} on Solar Trade Hub.`}
      />

      <PageBreadcrumb
        pageTitle="Tender Details"
      />

      <div className="space-y-5">
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="pointer-events-none absolute -right-20 -top-24 size-60 rounded-full bg-orange-500/[0.06]" />

          <div className="pointer-events-none absolute right-28 top-5 size-36 rounded-full bg-purple-500/[0.06]" />

          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <FileText
                    size={23}
                    strokeWidth={
                      1.9
                    }
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-purple-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                      {
                        tender.tenderId
                      }
                    </span>

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
                  </div>

                  <h1 className="mt-3 max-w-4xl text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    {
                      tender.title
                    }
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2
                        size={15}
                      />

                      {
                        tender.organization
                      }
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <MapPin
                        size={15}
                      />

                      {
                        tender.location
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  to="/tenders"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.04]"
                >
                  <ArrowLeft
                    size={16}
                  />

                  Back
                </Link>

                <Link
                  to={`/tenders/${encodeURIComponent(
                    tender.tenderId
                  )}/edit`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  <Edit3
                    size={16}
                  />

                  Edit Tender
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Estimated Budget"
            value={formatTenderBudget(
              tender.budget
            )}
            icon={
              <WalletCards
                size={20}
                className="text-orange-600 dark:text-orange-400"
              />
            }
            iconClass="bg-orange-50 dark:bg-orange-500/10"
          />

          <SummaryCard
            label="Deadline"
            value={formatTenderDeadline(
              tender.deadline
            )}
            icon={
              <CalendarDays
                size={20}
                className="text-purple-600 dark:text-purple-400"
              />
            }
            iconClass="bg-purple-50 dark:bg-purple-500/10"
          />

          <SummaryCard
            label="Bids Received"
            value={String(
              tender.bidsCount
            )}
            icon={
              <Users
                size={20}
                className="text-green-600 dark:text-green-400"
              />
            }
            iconClass="bg-green-50 dark:bg-green-500/10"
          />

          <SummaryCard
            label="Category"
            value={
              tender.category
            }
            icon={
              <Tag
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            }
            iconClass="bg-gray-100 dark:bg-white/5"
          />
        </div>

        {/* =================================================
            DETAILS + STATUS
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          {/* ===============================================
              TENDER DETAILS
          =============================================== */}

          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <SectionHeader
                title="Tender Information"
                description="Core procurement and marketplace information."
                icon={
                  <FileText
                    size={18}
                  />
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                <DetailItem
                  label="Tender ID"
                  value={
                    tender.tenderId
                  }
                  mono
                />

                <DetailItem
                  label="Organization / Buyer"
                  value={
                    tender.organization
                  }
                />

                <DetailItem
                  label="Project Location"
                  value={
                    tender.location
                  }
                />

                <DetailItem
                  label="Category"
                  value={
                    tender.category
                  }
                />

                <DetailItem
                  label="Budget"
                  value={formatTenderBudget(
                    tender.budget
                  )}
                />

                <DetailItem
                  label="Deadline"
                  value={formatTenderDeadline(
                    tender.deadline
                  )}
                />
              </div>
            </section>

            {/* =============================================
                DESCRIPTION
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <SectionHeader
                title="Tender Requirements"
                description="Scope and requirement details provided for this opportunity."
                icon={
                  <FileText
                    size={18}
                  />
                }
              />

              <div className="p-5 sm:p-6">
                {tender.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-300">
                    {
                      tender.description
                    }
                  </p>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center dark:border-gray-700 dark:bg-white/[0.02]">
                    <FileText
                      size={22}
                      className="mx-auto text-gray-400"
                    />

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      No Tender description
                      has been added.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* =============================================
                SYSTEM INFORMATION
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <SectionHeader
                title="System Information"
                description="Internal Tender record and audit information."
                icon={
                  <Clock3
                    size={18}
                  />
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2">
                <DetailItem
                  label="MongoDB ID"
                  value={
                    tender._id ||
                    "—"
                  }
                  mono
                />

                <DetailItem
                  label="Public Tender ID"
                  value={
                    tender.tenderId
                  }
                  mono
                />

                <DetailItem
                  label="Created"
                  value={formatDateTime(
                    tender.createdAt
                  )}
                />

                <DetailItem
                  label="Last Updated"
                  value={formatDateTime(
                    tender.updatedAt
                  )}
                />
              </div>
            </section>
          </div>

          {/* ===============================================
              SIDEBAR
          =============================================== */}

          <aside className="space-y-5">
            {/* =============================================
                STATUS
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tender Status
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Current lifecycle state
                  of this Tender.
                </p>
              </div>

              <div className="p-5">
                <span
                  className={`
                    inline-flex
                    rounded-full
                    border
                    px-3
                    py-1.5
                    text-sm
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

                <StatusDescription
                  status={
                    tender.status
                  }
                />
              </div>
            </section>

            {/* =============================================
                BID ACTIVITY
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Marketplace Activity
                </h2>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Users
                      size={21}
                    />
                  </div>

                  <div>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {
                        tender.bidsCount
                      }
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Bids received
                    </p>
                  </div>
                </div>

                <p className="mt-4 border-t border-gray-200 pt-4 text-xs leading-5 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  Bid count is maintained
                  by the marketplace and
                  cannot be changed
                  manually from the
                  Tender record.
                </p>
              </div>
            </section>

            {/* =============================================
                BUYER
            ============================================= */}

            <InfoPanel
              title="Organization / Buyer"
              icon={
                <Building2
                  size={18}
                />
              }
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {
                  tender.organization
                }
              </p>

              <p className="mt-1.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
                Listed as the buyer
                or Tender issuer for
                this opportunity.
              </p>
            </InfoPanel>

            {/* =============================================
                LOCATION
            ============================================= */}

            <InfoPanel
              title="Project Location"
              icon={
                <MapPin
                  size={18}
                />
              }
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {
                  tender.location
                }
              </p>

              <p className="mt-1.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
                Marketplace participants
                can assess the opportunity
                against this project
                location.
              </p>
            </InfoPanel>

            {/* =============================================
                COMMERCIAL
            ============================================= */}

            <InfoPanel
              title="Commercial Value"
              icon={
                <CircleDollarSign
                  size={18}
                />
              }
            >
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatTenderBudget(
                  tender.budget
                )}
              </p>

              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Estimated Tender budget.
              </p>
            </InfoPanel>
          </aside>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   STATUS DESCRIPTION
========================================================= */

function StatusDescription({
  status,
}: {
  status: TenderStatus;
}) {
  let text =
    "";

  switch (status) {
    case "draft":
      text =
        "This Tender is currently saved as a draft.";
      break;

    case "open":
      text =
        "This Tender is open for marketplace activity.";
      break;

    case "closed":
      text =
        "This Tender has been closed for new responses.";
      break;

    case "awarded":
      text =
        "This Tender has been marked as awarded.";
      break;

    case "cancelled":
      text =
        "This Tender has been cancelled.";
      break;
  }

  return (
    <p className="mt-4 text-xs leading-5 text-gray-500 dark:text-gray-400">
      {text}
    </p>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  description,
  icon,
}: {
  title: string;

  description: string;

  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
        {icon}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
          {description}
        </p>
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
  icon,
  iconClass,
}: {
  label: string;

  value: string;

  icon: ReactNode;

  iconClass: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-1.5 break-words text-lg font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;

  value: string;

  mono?: boolean;
}) {
  return (
    <div className="min-w-0 border-b border-gray-100 px-5 py-4 sm:border-r dark:border-gray-800">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p
        className={[
          "mt-1.5 break-words text-sm font-medium text-gray-900 dark:text-white",

          mono
            ? "font-mono text-purple-600 dark:text-purple-400"
            : "",
        ].join(
          " "
        )}
      >
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
  title: string;

  icon: ReactNode;

  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
          {icon}
        </div>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

export default ViewTender;