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
  CalendarDays,
  CircleDollarSign,
  Edit3,
  Package,
  Percent,
  RefreshCw,
  Tag,
  WalletCards,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  formatDealDate,
  formatDealDiscount,
  formatDealPrice,
  formatDealStatus,
  getDeal,
  getDealErrorMessage,
  getDealProductName,
  type Deal,
  type DealStatus,
} from "../../services/deal/deal.service";

/* =========================================================
   STATUS STYLES
========================================================= */

const getStatusClasses = (
  status: DealStatus
) => {
  switch (status) {
    case "active":
      return `
        border-green-200
        bg-green-50
        text-green-700
        dark:border-green-500/20
        dark:bg-green-500/10
        dark:text-green-400
      `;

    case "scheduled":
      return `
        border-purple-200
        bg-purple-50
        text-purple-700
        dark:border-purple-500/20
        dark:bg-purple-500/10
        dark:text-purple-400
      `;

    case "expired":
      return `
        border-red-200
        bg-red-50
        text-red-700
        dark:border-red-500/20
        dark:bg-red-500/10
        dark:text-red-400
      `;

    case "draft":
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
};

/* =========================================================
   VIEW DEAL
========================================================= */

const ViewDeal = () => {
  const params =
    useParams();

  const dealReference =
    params.dealId ||
    params.id ||
    "";

  const [
    deal,
    setDeal,
  ] =
    useState<Deal | null>(
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
     LOAD
  ======================================================= */

  const loadDeal =
    useCallback(
      async () => {
        if (
          !dealReference
        ) {
          setLoadError(
            "Deal ID is missing."
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
            await getDeal(
              dealReference
            );

          setDeal(
            result
          );
        } catch (
          error
        ) {
          setDeal(
            null
          );

          setLoadError(
            getDealErrorMessage(
              error,
              "Unable to load Deal."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        dealReference,
      ]
    );

  useEffect(() => {
    void loadDeal();
  }, [
    loadDeal,
  ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <PageMeta
          title="Deal Details | Solar Trade Hub"
          description="View Solar Trade Hub Deal."
        />

        <PageBreadcrumb
          pageTitle="Deal Details"
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <RefreshCw
              size={21}
              className="animate-spin"
            />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
            Loading Deal
          </h2>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Fetching marketplace
            promotion details.
          </p>
        </div>
      </>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    loadError ||
    !deal
  ) {
    return (
      <>
        <PageMeta
          title="Deal Not Found | Solar Trade Hub"
          description="Deal could not be loaded."
        />

        <PageBreadcrumb
          pageTitle="Deal Details"
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <Tag
              size={21}
            />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Unable to load Deal
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
            {loadError ||
              "The requested Deal could not be found."}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                void loadDeal()
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
            >
              <RefreshCw
                size={15}
              />

              Try Again
            </button>

            <Link
              to="/deals"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 text-sm font-semibold text-white"
            >
              <ArrowLeft
                size={15}
              />

              Back to Deals
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* =======================================================
     CALCULATED VALUES
  ======================================================= */

  const savings =
    Math.max(
      0,
      Number(
        deal.originalPrice
      ) -
        Number(
          deal.dealPrice
        )
    );

  return (
    <>
      <PageMeta
        title={`${deal.title} | Solar Trade Hub`}
        description={`View Deal ${deal.dealId} on Solar Trade Hub.`}
      />

      <PageBreadcrumb
        pageTitle="Deal Details"
      />

      <div className="space-y-5">
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="pointer-events-none absolute -right-20 -top-24 size-60 rounded-full bg-orange-500/[0.06]" />

          <div className="pointer-events-none absolute right-28 top-4 size-36 rounded-full bg-purple-500/[0.06]" />

          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <Tag
                    size={23}
                    strokeWidth={
                      1.9
                    }
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-purple-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                      {
                        deal.dealId
                      }
                    </span>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                        deal.status
                      )}`}
                    >
                      {formatDealStatus(
                        deal.status
                      )}
                    </span>
                  </div>

                  <h1 className="mt-3 max-w-3xl text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    {deal.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-2">
                      <Package
                        size={15}
                      />

                      {getDealProductName(
                        deal.product
                      )}
                    </span>

                    {deal.product
                      ?.productId && (
                      <span className="font-mono text-xs text-purple-600 dark:text-purple-400">
                        {
                          deal.product
                            .productId
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to="/deals"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
                >
                  <ArrowLeft
                    size={16}
                  />

                  Back
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    void loadDeal()
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
                >
                  <RefreshCw
                    size={15}
                  />

                  Refresh
                </button>

                <Link
                  to={`/deals/${encodeURIComponent(
                    deal.dealId
                  )}/edit`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  <Edit3
                    size={16}
                  />

                  Edit Deal
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Discount"
            value={formatDealDiscount(
              deal
            )}
            icon={
              <Percent
                size={20}
              />
            }
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
          />

          <SummaryCard
            label="Original Price"
            value={formatDealPrice(
              deal.originalPrice,
              deal.currency
            )}
            icon={
              <WalletCards
                size={20}
              />
            }
            iconClass="bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
          />

          <SummaryCard
            label="Deal Price"
            value={formatDealPrice(
              deal.dealPrice,
              deal.currency
            )}
            icon={
              <CircleDollarSign
                size={20}
              />
            }
            iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />

          <SummaryCard
            label="Status"
            value={formatDealStatus(
              deal.status
            )}
            icon={
              <Tag
                size={20}
              />
            }
            iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />
        </div>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* ===============================================
              LEFT
          =============================================== */}

          <div className="space-y-5">
            {/* =============================================
                DEAL INFORMATION
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <SectionHeader
                icon={
                  <Tag
                    size={18}
                  />
                }
                title="Deal Information"
                description="Marketplace promotion and pricing configuration."
              />

              <div className="grid grid-cols-1 gap-x-8 gap-y-7 p-5 sm:grid-cols-2 sm:p-6">
                <DetailItem
                  label="Deal Title"
                  value={
                    deal.title
                  }
                />

                <DetailItem
                  label="Deal ID"
                  value={
                    deal.dealId
                  }
                  mono
                />

                <DetailItem
                  label="Product"
                  value={getDealProductName(
                    deal.product
                  )}
                />

                <DetailItem
                  label="Product ID"
                  value={
                    deal.product
                      ?.productId ||
                    deal.product
                      ?._id ||
                    "—"
                  }
                  mono
                />

                <DetailItem
                  label="Discount Type"
                  value={
                    deal.discountType ===
                    "percentage"
                      ? "Percentage"
                      : "Fixed Amount"
                  }
                />

                <DetailItem
                  label="Discount"
                  value={formatDealDiscount(
                    deal
                  )}
                />

                <DetailItem
                  label="Currency"
                  value={
                    deal.currency
                  }
                />

                <DetailItem
                  label="Status"
                  value={formatDealStatus(
                    deal.status
                  )}
                />
              </div>
            </section>

            {/* =============================================
                CAMPAIGN PERIOD
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <SectionHeader
                icon={
                  <CalendarDays
                    size={18}
                  />
                }
                title="Campaign Period"
                description="Marketplace activation and expiry schedule."
              />

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <CampaignCard
                  label="Start Date"
                  value={formatDealDate(
                    deal.startDate
                  )}
                  tone="purple"
                />

                <CampaignCard
                  label="End Date"
                  value={formatDealDate(
                    deal.endDate
                  )}
                  tone="orange"
                />
              </div>
            </section>

            {/* =============================================
                SYSTEM RECORD
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <SectionHeader
                icon={
                  <RefreshCw
                    size={18}
                  />
                }
                title="System Record"
                description="Backend-managed Deal record information."
              />

              <div className="grid grid-cols-1 gap-x-8 gap-y-7 p-5 sm:grid-cols-2 sm:p-6">
                <DetailItem
                  label="Created"
                  value={
                    deal.createdAt
                      ? formatDateTime(
                          deal.createdAt
                        )
                      : "—"
                  }
                />

                <DetailItem
                  label="Last Updated"
                  value={
                    deal.updatedAt
                      ? formatDateTime(
                          deal.updatedAt
                        )
                      : "—"
                  }
                />

                <DetailItem
                  label="MongoDB ID"
                  value={
                    deal._id ||
                    "—"
                  }
                  mono
                />

                <DetailItem
                  label="Public ID"
                  value={
                    deal.dealId
                  }
                  mono
                />
              </div>
            </section>
          </div>

          {/* ===============================================
              RIGHT
          =============================================== */}

          <aside className="space-y-5">
            {/* =============================================
                PRICING PANEL
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/90 via-white to-orange-50/70 dark:border-purple-500/10 dark:from-purple-500/[0.08] dark:via-white/[0.02] dark:to-orange-500/[0.05]">
              <div className="border-b border-purple-100 px-5 py-4 dark:border-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-purple-600 text-white">
                    <WalletCards
                      size={17}
                    />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Marketplace Pricing
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      Customer-facing price
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <PricingRow
                  label="Original Price"
                  value={formatDealPrice(
                    deal.originalPrice,
                    deal.currency
                  )}
                  strike
                />

                <PricingRow
                  label="Discount"
                  value={formatDealDiscount(
                    deal
                  )}
                />

                <PricingRow
                  label="Savings"
                  value={formatDealPrice(
                    savings,
                    deal.currency
                  )}
                  highlight
                />

                <div className="my-4 border-t border-purple-100 dark:border-purple-500/10" />

                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Deal Price
                </p>

                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatDealPrice(
                    deal.dealPrice,
                    deal.currency
                  )}
                </p>
              </div>
            </section>

            {/* =============================================
                STATUS
            ============================================= */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Tag
                    size={18}
                  />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Deal Status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getStatusClasses(
                      deal.status
                    )}`}
                  >
                    {formatDealStatus(
                      deal.status
                    )}
                  </span>

                  <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    {
                      getStatusDescription(
                        deal.status
                      )
                    }
                  </p>
                </div>
              </div>
            </section>

            {/* =============================================
                PRODUCT CARD
            ============================================= */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Package
                    size={18}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Product
                  </p>

                  <p className="mt-1 text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                    {getDealProductName(
                      deal.product
                    )}
                  </p>

                  {deal.product
                    ?.productId && (
                    <p className="mt-1 font-mono text-xs text-purple-600 dark:text-purple-400">
                      {
                        deal.product
                          .productId
                      }
                    </p>
                  )}

                  {deal.product
                    ?.sku && (
                    <p className="mt-1 text-xs text-gray-400">
                      SKU:{" "}
                      {
                        deal.product
                          .sku
                      }
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* =============================================
                CAMPAIGN SUMMARY
            ============================================= */}

            <section className="rounded-2xl border border-purple-100 bg-purple-50/50 p-5 dark:border-purple-500/10 dark:bg-purple-500/[0.05]">
              <div className="flex items-start gap-3">
                <CalendarDays
                  size={18}
                  className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400"
                />

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Campaign Window
                  </p>

                  <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    From{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {formatDealDate(
                        deal.startDate
                      )}
                    </span>{" "}
                    until{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {formatDealDate(
                        deal.endDate
                      )}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   STATUS DESCRIPTION
========================================================= */

function getStatusDescription(
  status: DealStatus
) {
  switch (status) {
    case "active":
      return "This promotion is currently within its active marketplace period.";

    case "scheduled":
      return "This promotion will become active automatically when its start date arrives.";

    case "expired":
      return "This promotion has passed its configured end date.";

    case "draft":
    default:
      return "This promotion is saved as Draft and is not currently published.";
  }
}

/* =========================================================
   DATE TIME
========================================================= */

function formatDateTime(
  value: string
) {
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
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;

  title: string;

  description: string;
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-1 break-words text-lg font-semibold text-gray-900 dark:text-white">
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
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-sm font-medium text-gray-900 dark:text-white ${
          mono
            ? "font-mono"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   PRICING ROW
========================================================= */

function PricingRow({
  label,
  value,
  strike = false,
  highlight = false,
}: {
  label: string;

  value: string;

  strike?: boolean;

  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <span
        className={[
          "text-sm font-semibold",

          strike
            ? "text-gray-400 line-through dark:text-gray-500"
            : "",

          highlight
            ? "text-green-600 dark:text-green-400"
            : "",

          !strike &&
          !highlight
            ? "text-gray-800 dark:text-gray-200"
            : "",
        ].join(
          " "
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   CAMPAIGN CARD
========================================================= */

function CampaignCard({
  label,
  value,
  tone,
}: {
  label: string;

  value: string;

  tone:
    | "purple"
    | "orange";
}) {
  const toneClass =
    tone ===
    "purple"
      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
      : "bg-orange-500/10 text-orange-600 dark:text-orange-400";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
      >
        <CalendarDays
          size={17}
        />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

export default ViewDeal;