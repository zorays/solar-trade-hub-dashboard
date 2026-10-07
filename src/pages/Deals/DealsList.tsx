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
  CalendarDays,
  Eye,
  ImageOff,
  Package,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  deleteDeal,
  formatDealDate,
  formatDealDiscount,
  formatDealPrice,
  formatDealStatus,
  getDealErrorMessage,
  getDealProductImageAlt,
  getDealProductImageUrl,
  getDealProductName,
  getDeals,
  type Deal,
  type DealStatus,
  type DealSummary,
} from "../../services/deal/deal.service";

/* =========================================================
   EMPTY SUMMARY
========================================================= */

const EMPTY_SUMMARY: DealSummary = {
  total: 0,

  active: 0,

  scheduled: 0,

  expired: 0,

  draft: 0,
};

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
   PAGE
========================================================= */

const DealsList = () => {
  const [
    deals,
    setDeals,
  ] =
    useState<Deal[]>([]);

  const [
    summary,
    setSummary,
  ] =
    useState<DealSummary>(
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

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<Deal | null>(
      null
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timer =
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
        timer
      );
    };
  }, [
    searchInput,
  ]);

  /* =======================================================
     LOAD DEALS
  ======================================================= */

  const loadDeals =
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
            await getDeals({
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

          setDeals(
            result.deals
          );

          setSummary(
            result.summary
          );

          if (
            showToast
          ) {
            toast.success(
              "Deals refreshed successfully"
            );
          }
        } catch (
          error
        ) {
          const message =
            getDealErrorMessage(
              error,
              "Unable to load Deals."
            );

          setDeals(
            []
          );

          setSummary(
            EMPTY_SUMMARY
          );

          setLoadError(
            message
          );

          toast.error(
            "Unable to load Deals",
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
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadDeals();
  }, [
    loadDeals,
  ]);

  /* =======================================================
     DELETE MODAL ESCAPE
  ======================================================= */

  useEffect(() => {
    if (
      !deleteTarget
    ) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
        "Escape" &&
        !deleting
      ) {
        setDeleteTarget(
          null
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    deleteTarget,
    deleting,
  ]);

  /* =======================================================
     DELETE DEAL
  ======================================================= */

  const handleDelete =
    async () => {
      if (
        !deleteTarget ||
        deleting
      ) {
        return;
      }

      try {
        setDeleting(
          true
        );

        const target =
          deleteTarget;

        await deleteDeal(
          target.dealId
        );

        setDeleteTarget(
          null
        );

        toast.success(
          "Deal deleted successfully",
          {
            description:
              `${target.dealId} — ${target.title}`,
          }
        );

        await loadDeals();
      } catch (
        error
      ) {
        toast.error(
          "Unable to delete Deal",
          {
            description:
              getDealErrorMessage(
                error,
                "Deal could not be deleted."
              ),
          }
        );
      } finally {
        setDeleting(
          false
        );
      }
    };

  return (
    <>
      <PageMeta
        title="Deals | Solar Trade Hub"
        description="Manage Solar Trade Hub marketplace deals."
      />

      <PageBreadcrumb
        pageTitle="Deals"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-orange-500/[0.06]" />

          <div className="pointer-events-none absolute right-28 top-2 h-36 w-36 rounded-full bg-purple-500/[0.06]" />

          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <Tag
                    size={23}
                    strokeWidth={
                      1.9
                    }
                  />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                      Marketplace
                    </span>

                    <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      Promotions
                    </span>
                  </div>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Deals Management
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Manage product
                    promotions, scheduled
                    offers and marketplace
                    discounts across Solar
                    Trade Hub.
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
                    void loadDeals(
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
                  to="/deals/add"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  <Plus
                    size={18}
                  />

                  Add Deal
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Deals"
            value={
              summary.active
            }
            icon={
              <Percent
                size={20}
              />
            }
            iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />

          <StatCard
            title="Scheduled"
            value={
              summary.scheduled
            }
            icon={
              <CalendarDays
                size={20}
              />
            }
            iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />

          <StatCard
            title="Expired"
            value={
              summary.expired
            }
            icon={
              <Tag
                size={20}
              />
            }
            iconClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          />

          <StatCard
            title="Draft"
            value={
              summary.draft
            }
            icon={
              <Package
                size={20}
              />
            }
            iconClass="bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
          />
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                All Deals
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {loading
                  ? "Loading marketplace deals..."
                  : `${deals.length} deal${
                      deals.length !==
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
                placeholder="Search Deal title or ID..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <TableHeading>
                    Deal
                  </TableHeading>

                  <TableHeading>
                    Product
                  </TableHeading>

                  <TableHeading>
                    Discount
                  </TableHeading>

                  <TableHeading>
                    Original Price
                  </TableHeading>

                  <TableHeading>
                    Deal Price
                  </TableHeading>

                  <TableHeading>
                    Period
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <TableHeading
                    align="right"
                  >
                    Actions
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
                            void loadDeals()
                          }
                        />
                      </td>
                    </tr>
                  )}

                {/* =========================================
                    DEALS
                ========================================= */}

                {!loading &&
                  !loadError &&
                  deals.map(
                    (
                      deal
                    ) => (
                      <tr
                        key={
                          deal.dealId ||
                          deal._id
                        }
                        className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                      >
                        {/* Deal */}

                        <td className="px-5 py-5 align-middle sm:px-6">
                          <div className="min-w-[220px]">
                            <Link
                              to={`/deals/${encodeURIComponent(
                                deal.dealId
                              )}`}
                              className="font-medium text-gray-900 transition hover:text-purple-600 dark:text-white dark:hover:text-purple-400"
                            >
                              {
                                deal.title
                              }
                            </Link>

                            <p className="mt-1 font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                              {
                                deal.dealId
                              }
                            </p>
                          </div>
                        </td>

                        {/* Product */}

                        <td className="px-5 py-5 align-middle">
                          <ProductCell
                            deal={
                              deal
                            }
                          />
                        </td>

                        {/* Discount */}

                        <td className="px-5 py-5 align-middle">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-sm font-semibold text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
                            <Percent
                              size={13}
                            />

                            {formatDealDiscount(
                              deal
                            )}
                          </span>
                        </td>

                        {/* Original */}

                        <td className="px-5 py-5 align-middle">
                          <span className="whitespace-nowrap text-sm text-gray-500 line-through dark:text-gray-400">
                            {formatDealPrice(
                              deal.originalPrice,
                              deal.currency
                            )}
                          </span>
                        </td>

                        {/* Deal price */}

                        <td className="px-5 py-5 align-middle">
                          <div className="flex min-w-[145px] items-center gap-2">
                            <WalletCards
                              size={15}
                              className="shrink-0 text-green-500"
                            />

                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDealPrice(
                                deal.dealPrice,
                                deal.currency
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Period */}

                        <td className="px-5 py-5 align-middle">
                          <div className="min-w-[165px]">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                              <CalendarDays
                                size={13}
                              />

                              {formatDealDate(
                                deal.startDate
                              )}
                            </div>

                            <div className="ml-[19px] mt-1 text-xs text-gray-400">
                              to{" "}
                              {formatDealDate(
                                deal.endDate
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}

                        <td className="px-5 py-5 align-middle">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              deal.status
                            )}`}
                          >
                            {formatDealStatus(
                              deal.status
                            )}
                          </span>
                        </td>

                        {/* Actions */}

                        <td className="px-5 py-5 text-right align-middle sm:px-6">
                          <div className="flex min-w-[230px] items-center justify-end gap-2">
                            <Link
                              to={`/deals/${encodeURIComponent(
                                deal.dealId
                              )}`}
                              title="View Deal"
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 text-xs font-semibold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20"
                            >
                              <Eye
                                size={14}
                              />

                              View
                            </Link>

                            <Link
                              to={`/deals/${encodeURIComponent(
                                deal.dealId
                              )}/edit`}
                              title="Edit Deal"
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
                            >
                              <Pencil
                                size={14}
                              />

                              Edit
                            </Link>

                            <button
                              type="button"
                              title="Delete Deal"
                              onClick={() =>
                                setDeleteTarget(
                                  deal
                                )
                              }
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                            >
                              <Trash2
                                size={14}
                              />

                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                {/* =========================================
                    EMPTY
                ========================================= */}

                {!loading &&
                  !loadError &&
                  deals.length ===
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
        </section>
      </div>

      {/* ===================================================
          DELETE CONFIRMATION
      =================================================== */}

      {deleteTarget && (
        <DeleteDealModal
          deal={
            deleteTarget
          }
          deleting={
            deleting
          }
          onCancel={() => {
            if (
              !deleting
            ) {
              setDeleteTarget(
                null
              );
            }
          }}
          onConfirm={() =>
            void handleDelete()
          }
        />
      )}
    </>
  );
};

/* =========================================================
   PRODUCT CELL
========================================================= */

function ProductCell({
  deal,
}: {
  deal: Deal;
}) {
  const product =
    deal.product;

  const imageUrl =
    getDealProductImageUrl(
      product
    );

  const [
    imageFailed,
    setImageFailed,
  ] =
    useState(false);

  useEffect(() => {
    setImageFailed(
      false
    );
  }, [
    imageUrl,
  ]);

  return (
    <div className="flex min-w-[280px] items-center gap-3">
      {/* IMAGE */}

      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.04]">
        {imageUrl &&
        !imageFailed ? (
          <img
            src={
              imageUrl
            }
            alt={getDealProductImageAlt(
              product
            )}
            loading="lazy"
            onError={() =>
              setImageFailed(
                true
              )
            }
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <ImageOff
            size={20}
            className="text-gray-400"
          />
        )}
      </div>

      {/* INFO */}

      <div className="min-w-0">
        <p className="max-w-[220px] truncate text-sm font-semibold text-gray-900 dark:text-white">
          {getDealProductName(
            product
          )}
        </p>

        {product
          ?.productId && (
          <p className="mt-1 font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
            {
              product.productId
            }
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
          {product
            ?.capacityRating && (
            <span>
              {
                product.capacityRating
              }
            </span>
          )}

          {product?.sku && (
            <>
              {product
                ?.capacityRating && (
                <span>
                  •
                </span>
              )}

              <span>
                SKU:{" "}
                {
                  product.sku
                }
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DELETE MODAL
========================================================= */

function DeleteDealModal({
  deal,
  deleting,
  onCancel,
  onConfirm,
}: {
  deal: Deal;

  deleting: boolean;

  onCancel: () => void;

  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close Delete Deal dialog"
        onClick={
          onCancel
        }
        className="absolute inset-0 cursor-default bg-gray-950/50 backdrop-blur-[2px]"
      />

      {/* MODAL */}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-deal-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Trash2
                size={20}
              />
            </div>

            <div>
              <h2
                id="delete-deal-title"
                className="text-base font-semibold text-gray-900 dark:text-white"
              >
                Delete Deal?
              </h2>

              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                This action cannot be
                undone.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={
              deleting
            }
            onClick={
              onCancel
            }
            className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-white/5"
          >
            <X
              size={18}
            />
          </button>
        </div>

        {/* DEAL */}

        <div className="p-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
              {
                deal.dealId
              }
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
              {
                deal.title
              }
            </p>

            <div className="mt-4 flex items-center gap-3">
              <DeleteProductImage
                deal={
                  deal
                }
              />

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                  {getDealProductName(
                    deal.product
                  )}
                </p>

                {deal.product
                  ?.productId && (
                  <p className="mt-1 font-mono text-[11px] text-gray-400">
                    {
                      deal.product
                        .productId
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            The Deal record will be
            permanently removed from
            Solar Trade Hub. The Product
            itself will not be deleted.
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 p-5 dark:border-gray-800 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={
              deleting
            }
            onClick={
              onCancel
            }
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              deleting
            }
            onClick={
              onConfirm
            }
            className="inline-flex h-10 min-w-[125px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
              : "Delete Deal"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DELETE PRODUCT IMAGE
========================================================= */

function DeleteProductImage({
  deal,
}: {
  deal: Deal;
}) {
  const imageUrl =
    getDealProductImageUrl(
      deal.product
    );

  const [
    failed,
    setFailed,
  ] =
    useState(false);

  if (
    !imageUrl ||
    failed
  ) {
    return (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-white/[0.03]">
        <Package
          size={17}
        />
      </div>
    );
  }

  return (
    <div className="size-11 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/[0.03]">
      <img
        src={
          imageUrl
        }
        alt={getDealProductImageAlt(
          deal.product
        )}
        onError={() =>
          setFailed(
            true
          )
        }
        className="h-full w-full object-contain p-1"
      />
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;

  value: number;

  icon: ReactNode;

  iconClass: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
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
    </section>
  );
}

/* =========================================================
   TABLE HEADING
========================================================= */

function TableHeading({
  children,
  align = "left",
}: {
  children: ReactNode;

  align?:
    | "left"
    | "right";
}) {
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
}

/* =========================================================
   LOADING
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
        Loading Deals
      </h3>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Fetching marketplace
        promotions from Solar Trade
        Hub.
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
  message: string;

  onRetry: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-500">
        <Tag
          size={20}
        />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        Unable to load Deals
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-500 dark:text-gray-400">
        {message}
      </p>

      <button
        type="button"
        onClick={
          onRetry
        }
        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 text-xs font-semibold text-white transition hover:bg-purple-700"
      >
        <RefreshCw
          size={14}
        />

        Try Again
      </button>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  searching,
}: {
  searching: boolean;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
        <Tag
          size={20}
        />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        {searching
          ? "No matching Deals"
          : "No Deals yet"}
      </h3>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {searching
          ? "Try changing your search terms."
          : "Create the first Solar Trade Hub marketplace Deal."}
      </p>

      {!searching && (
        <Link
          to="/deals/add"
          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 text-xs font-semibold text-white"
        >
          <Plus
            size={15}
          />

          Add Deal
        </Link>
      )}
    </div>
  );
}

export default DealsList;