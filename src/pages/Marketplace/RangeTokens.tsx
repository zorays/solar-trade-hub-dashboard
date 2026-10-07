import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Coins,
  Eye,
  Gift,
  History,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
  X,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";

import {
  creditCustomerRangeTokens,
  debitCustomerRangeTokens,
  formatRangeTokenBalance,
  formatRangeTokenTransactionType,
  getCustomerRangeTokenWallet,
  getRangeTokenCustomer,
  getRangeTokenCustomerName,
  getRangeTokenCustomerReference,
  getRangeTokenErrorMessage,
  getRangeTokenSummary,
  getRangeTokenWallets,
  grantCustomerSignupRangeTokens,
  refundCustomerRangeTokens,
  type RangeTokenAdminCreditType,
  type RangeTokenAdminDebitType,
  type RangeTokenPagination,
  type RangeTokenSummary,
  type RangeTokenTransaction,
  type RangeTokenWallet,
} from "../../services/settings/marketplace/rangeToken.service";

/* =========================================================
   TYPES
========================================================= */

type BalanceFilter =
  | "all"
  | "with_balance"
  | "zero_balance";

type WalletSortField =
  | "updatedAt"
  | "createdAt"
  | "balance"
  | "totalCredited"
  | "totalDebited"
  | "lastTransactionAt";

type WalletSortOrder =
  | "asc"
  | "desc";

type WalletAction =
  | "credit"
  | "debit"
  | "refund"
  | "signup_bonus"
  | null;

type NullableSummary = {
  wallets: number | null;
  totalBalance: number | null;
  totalCredited: number | null;
  totalDebited: number | null;
  customersWithBalance: number | null;
  customersWithoutBalance: number | null;
  freeSignupTokens: number | null;
  maxReductionPercent: number | null;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE_OPTIONS = [
  20,
  50,
  100,
];

const TRANSACTION_PAGE_SIZE =
  10;

const EMPTY_PAGINATION:
  RangeTokenPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_SUMMARY:
  NullableSummary = {
  wallets: null,
  totalBalance: null,
  totalCredited: null,
  totalDebited: null,
  customersWithBalance: null,
  customersWithoutBalance: null,
  freeSignupTokens: null,
  maxReductionPercent: null,
};

const BALANCE_OPTIONS = [
  {
    value: "all",
    label: "All Wallets",
  },
  {
    value: "with_balance",
    label: "With Balance",
  },
  {
    value: "zero_balance",
    label: "Zero Balance",
  },
];

const SORT_OPTIONS = [
  {
    value: "updatedAt",
    label: "Recently Updated",
  },
  {
    value: "lastTransactionAt",
    label: "Last Transaction",
  },
  {
    value: "balance",
    label: "Token Balance",
  },
  {
    value: "totalCredited",
    label: "Total Credited",
  },
  {
    value: "totalDebited",
    label: "Total Debited",
  },
  {
    value: "createdAt",
    label: "Created",
  },
];

/* =========================================================
   HELPERS
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

function formatNumber(
  value:
    | number
    | null
    | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return Number(
    value
  ).toLocaleString(
    "en-PK"
  );
}

function getCustomerEmail(
  wallet:
    RangeTokenWallet
) {
  const customer =
    getRangeTokenCustomer(
      wallet
    );

  return (
    customer?.email ||
    ""
  );
}

function getCustomerPhone(
  wallet:
    RangeTokenWallet
) {
  const customer =
    getRangeTokenCustomer(
      wallet
    );

  return (
    customer?.phoneE164 ||
    customer?.phone ||
    ""
  );
}

function getTransactionReference(
  transaction:
    RangeTokenTransaction
) {
  return (
    transaction.reference ||
    transaction.customerRequestId ||
    transaction.paymentId ||
    transaction.subscriptionId ||
    "—"
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function RangeTokens() {
  const [
    wallets,
    setWallets,
  ] =
    useState<
      RangeTokenWallet[]
    >([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<RangeTokenPagination>({
      ...EMPTY_PAGINATION,
    });

  const [
    summary,
    setSummary,
  ] =
    useState<NullableSummary>({
      ...EMPTY_SUMMARY,
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
    customerIdFilter,
    setCustomerIdFilter,
  ] =
    useState("");

  const [
    appliedCustomerId,
    setAppliedCustomerId,
  ] =
    useState("");

  const [
    balanceFilter,
    setBalanceFilter,
  ] =
    useState<BalanceFilter>(
      "all"
    );

  const [
    sortBy,
    setSortBy,
  ] =
    useState<WalletSortField>(
      "updatedAt"
    );

  const [
    sortOrder,
    setSortOrder,
  ] =
    useState<WalletSortOrder>(
      "desc"
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
    selectedCustomerId,
    setSelectedCustomerId,
  ] =
    useState<
      string |
      null
    >(null);

  /* =======================================================
     QUERY
  ======================================================= */

  const query =
    useMemo(
      () => ({
        page,
        limit,
        sortBy,
        sortOrder,

        ...(appliedCustomerId
          ? {
              customerId:
                appliedCustomerId,
            }
          : {}),

        ...(balanceFilter ===
        "with_balance"
          ? {
              hasBalance:
                true,
            }
          : {}),

        ...(balanceFilter ===
        "zero_balance"
          ? {
              hasBalance:
                false,
            }
          : {}),
      }),
      [
        page,
        limit,
        sortBy,
        sortOrder,
        appliedCustomerId,
        balanceFilter,
      ]
    );

  /* =======================================================
     LOAD WALLETS
  ======================================================= */

  const loadWallets =
    useCallback(
      async (
        showToast =
          false
      ) => {
        try {
          setLoadError("");

          const result =
            await getRangeTokenWallets(
              query
            );

          setWallets(
            result.wallets
          );

          setPagination(
            result.pagination
          );

          if (
            showToast
          ) {
            toast.success(
              "Range Token wallets refreshed."
            );
          }
        } catch (
          error
        ) {
          const message =
            getRangeTokenErrorMessage(
              error,
              "Unable to load Range Token wallets."
            );

          setWallets([]);

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
              "Unable to refresh wallets",
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
     SUMMARY
  ======================================================= */

  const loadSummary =
    useCallback(
      async () => {
        try {
          setSummaryLoading(
            true
          );

          const result:
            RangeTokenSummary =
            await getRangeTokenSummary();

          setSummary({
            wallets:
              result.wallets,

            totalBalance:
              result.totalBalance,

            totalCredited:
              result.totalCredited,

            totalDebited:
              result.totalDebited,

            customersWithBalance:
              result.customersWithBalance,

            customersWithoutBalance:
              result.customersWithoutBalance,

            freeSignupTokens:
              result.freeSignupTokens,

            maxReductionPercent:
              result.maxReductionPercent,
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
      []
    );

  /* =======================================================
     EFFECTS
  ======================================================= */

  useEffect(() => {
    setLoading(true);

    void loadWallets();
  }, [loadWallets]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

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

      setRefreshing(true);

      await Promise.all([
        loadWallets(true),
        loadSummary(),
      ]);
    };

  /* =======================================================
     FILTERS
  ======================================================= */

  const applyCustomerFilter =
    () => {
      setAppliedCustomerId(
        customerIdFilter.trim()
      );

      setPage(1);
    };

  const clearFilters =
    () => {
      setCustomerIdFilter("");
      setAppliedCustomerId("");
      setBalanceFilter("all");
      setSortBy("updatedAt");
      setSortOrder("desc");
      setPage(1);
    };

  const hasFilters =
    Boolean(
      appliedCustomerId ||
      balanceFilter !==
        "all" ||
      sortBy !==
        "updatedAt" ||
      sortOrder !==
        "desc"
    );

  /* =======================================================
     WALLET UPDATED
  ======================================================= */

  const handleWalletUpdated =
    async () => {
      await Promise.all([
        loadWallets(),
        loadSummary(),
      ]);
    };

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
        title="Range Tokens | Solar Trade Hub"
        description="Manage customer Range Token wallets and transactions."
      />

      <PageBreadcrumb
        pageTitle="Range Tokens"
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
                Range Tokens
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5b2eff]/10 px-2.5 py-1 text-xs font-semibold text-[#5b2eff] dark:text-[#8f78ff]">
                <Coins className="size-3.5" />
                Customer Wallets
              </span>
            </div>

            <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Customer Range Token balances, ledger activity,
              administrative corrections and request refunds.
            </p>
          </div>

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

        {/* PRIMARY SUMMARY */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard
            label="Customer Wallets"
            value={
              summary.wallets
            }
            loading={
              summaryLoading
            }
            icon={
              <WalletCards className="size-4" />
            }
            description="Token wallets created"
          />

          <SummaryCard
            label="Tokens in Wallets"
            value={
              summary.totalBalance
            }
            loading={
              summaryLoading
            }
            icon={
              <Coins className="size-4" />
            }
            description="Current circulating balance"
          />

          <SummaryCard
            label="Lifetime Credited"
            value={
              summary.totalCredited
            }
            loading={
              summaryLoading
            }
            icon={
              <ArrowUpCircle className="size-4" />
            }
            description="All token credits"
          />

          <SummaryCard
            label="Lifetime Debited"
            value={
              summary.totalDebited
            }
            loading={
              summaryLoading
            }
            icon={
              <ArrowDownCircle className="size-4" />
            }
            description="All token consumption"
          />
        </div>

        {/* BUSINESS RULE */}

        <section className="rounded-xl border border-[#5b2eff]/15 bg-[#5b2eff]/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#5b2eff] dark:text-[#8f78ff]" />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#5b2eff] dark:text-[#8f78ff]">
                Customer Range
              </p>

              <p className="mt-1 text-[11px] leading-5 text-gray-500">
                Range Tokens belong to customer accounts. One
                token gives 1% Customer Range, two tokens 2%,
                and three tokens 3%. Supplier Bid is independent
                and never consumes customer Range Tokens.
              </p>
            </div>

            <div className="hidden shrink-0 gap-2 lg:flex">
              <RuleChip
                label="Signup"
                value={
                  summary.freeSignupTokens ===
                  null
                    ? "—"
                    : `${summary.freeSignupTokens} free`
                }
              />

              <RuleChip
                label="Maximum Range"
                value={
                  summary.maxReductionPercent ===
                  null
                    ? "—"
                    : `${summary.maxReductionPercent}%`
                }
              />
            </div>
          </div>
        </section>

        {/* SECONDARY SUMMARY */}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CompactMetric
            label="Customers With Balance"
            value={
              summary.customersWithBalance
            }
            loading={
              summaryLoading
            }
            description="Wallet balance greater than zero"
          />

          <CompactMetric
            label="Zero Balance Wallets"
            value={
              summary.customersWithoutBalance
            }
            loading={
              summaryLoading
            }
            description="Customers without usable Range Tokens"
          />
        </div>

        {/* FILTERS */}

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_190px_210px_150px_auto]">
            <div className="flex gap-2">
              <input
                type="text"
                value={
                  customerIdFilter
                }
                onChange={(
                  event
                ) =>
                  setCustomerIdFilter(
                    event.target.value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    applyCustomerFilter();
                  }
                }}
                placeholder="Exact customer ID..."
                className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#5b2eff] dark:border-gray-700 dark:text-white"
              />

              <button
                type="button"
                onClick={
                  applyCustomerFilter
                }
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#5b2eff] px-4 text-sm font-semibold text-white transition hover:bg-[#4720db]"
              >
                Find
              </button>
            </div>

            <FilterSelect
              value={
                balanceFilter
              }
              options={
                BALANCE_OPTIONS
              }
              onChange={(
                value
              ) => {
                setBalanceFilter(
                  value as
                    BalanceFilter
                );

                setPage(1);
              }}
            />

            <FilterSelect
              value={
                sortBy
              }
              options={
                SORT_OPTIONS
              }
              onChange={(
                value
              ) => {
                setSortBy(
                  value as
                    WalletSortField
                );

                setPage(1);
              }}
            />

            <FilterSelect
              value={
                sortOrder
              }
              options={[
                {
                  value: "desc",
                  label: "Descending",
                },
                {
                  value: "asc",
                  label: "Ascending",
                },
              ]}
              onChange={(
                value
              ) => {
                setSortOrder(
                  value as
                    WalletSortOrder
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

          <div className="mt-3 flex items-start gap-2 text-[10px] leading-5 text-gray-400">
            <SlidersHorizontal className="mt-0.5 size-3.5 shrink-0" />

            Wallet API currently supports exact customer ID,
            balance state, sorting and pagination.
          </div>
        </section>

        {/* WALLET TABLE */}

        <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Customer Wallets
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Loading wallets..."
                  : loadError
                    ? "Wallet data unavailable"
                    : `${pagination.total.toLocaleString(
                        "en-PK"
                      )} wallet${
                        pagination.total ===
                        1
                          ? ""
                          : "s"
                      }`}
              </p>
            </div>

            {!loading &&
              !loadError && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold text-green-600 dark:text-green-400">
                  <CheckCircle2 className="size-3" />
                  Live
                </span>
              )}
          </div>

          <div className="block w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[1380px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                  <TableHeading>
                    Customer
                  </TableHeading>

                  <TableHeading>
                    Balance
                  </TableHeading>

                  <TableHeading>
                    Credited
                  </TableHeading>

                  <TableHeading>
                    Debited
                  </TableHeading>

                  <TableHeading>
                    Signup Bonus
                  </TableHeading>

                  <TableHeading>
                    Last Transaction
                  </TableHeading>

                  <TableHeading>
                    Wallet Created
                  </TableHeading>

                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Manage
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
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
                        colSpan={8}
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

                            void loadWallets();
                          }}
                        />
                      </td>
                    </tr>
                  )}

                {!loading &&
                  !loadError &&
                  wallets.map(
                    (
                      wallet
                    ) => {
                      const customerReference =
                        getRangeTokenCustomerReference(
                          wallet
                        );

                      const email =
                        getCustomerEmail(
                          wallet
                        );

                      const phone =
                        getCustomerPhone(
                          wallet
                        );

                      return (
                        <tr
                          key={
                            wallet._id
                          }
                          className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3">
                            <div className="min-w-[240px]">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {getRangeTokenCustomerName(
                                  wallet
                                )}
                              </p>

                              {email && (
                                <p className="mt-1 max-w-[230px] truncate text-[10px] text-gray-500">
                                  {
                                    email
                                  }
                                </p>
                              )}

                              {phone && (
                                <p className="mt-0.5 text-[10px] text-gray-400">
                                  {
                                    phone
                                  }
                                </p>
                              )}

                              <p className="mt-1 max-w-[230px] truncate font-mono text-[9px] text-gray-400">
                                {customerReference ||
                                  "—"}
                              </p>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold ${
                                wallet.balance >
                                0
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : "bg-gray-500/10 text-gray-500"
                              }`}
                            >
                              <Coins className="size-3.5" />

                              {wallet.balance.toLocaleString(
                                "en-PK"
                              )}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {wallet.totalCredited.toLocaleString(
                              "en-PK"
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {wallet.totalDebited.toLocaleString(
                              "en-PK"
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            {wallet.signupBonusGranted ? (
                              <div>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="size-3.5" />
                                  Granted
                                </span>

                                <p className="mt-1 text-[10px] text-gray-400">
                                  {wallet.signupBonusAmount} tokens
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                Not Granted
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                            {formatDateTime(
                              wallet.lastTransactionAt
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                            {formatDateTime(
                              wallet.createdAt
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                title="Manage wallet"
                                disabled={
                                  !customerReference
                                }
                                onClick={() =>
                                  setSelectedCustomerId(
                                    customerReference
                                  )
                                }
                                className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#5b2eff]/10 hover:text-[#5b2eff] disabled:cursor-not-allowed disabled:opacity-30 dark:hover:text-[#8f78ff]"
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
                  wallets.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={8}
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
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
                    aria-label="Wallets per page"
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
                    className="h-8 rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-600 outline-none focus:border-[#5b2eff] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
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

      {selectedCustomerId && (
        <WalletModal
          customerId={
            selectedCustomerId
          }
          onClose={() =>
            setSelectedCustomerId(
              null
            )
          }
          onUpdated={
            handleWalletUpdated
          }
        />
      )}
    </>
  );
}

/* =========================================================
   WALLET MODAL
========================================================= */

function WalletModal({
  customerId,
  onClose,
  onUpdated,
}: {
  customerId: string;

  onClose:
    () => void;

  onUpdated:
    () => Promise<void>;
}) {
  const [
    wallet,
    setWallet,
  ] =
    useState<
      RangeTokenWallet |
      null
    >(null);

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
    action,
    setAction,
  ] =
    useState<WalletAction>(
      null
    );

  /* ADMIN ADJUSTMENT */

  const [
    adjustmentType,
    setAdjustmentType,
  ] =
    useState<
      "credit" |
      "debit"
    >("credit");

  const [
    amount,
    setAmount,
  ] =
    useState(1);

  const [
    creditType,
    setCreditType,
  ] =
    useState<RangeTokenAdminCreditType>(
      "admin_credit"
    );

  const [
    debitType,
    setDebitType,
  ] =
    useState<RangeTokenAdminDebitType>(
      "admin_debit"
    );

  const [
    adjustmentNote,
    setAdjustmentNote,
  ] =
    useState("");

  /* REFUND */

  const [
    requestId,
    setRequestId,
  ] =
    useState("");

  const [
    refundNote,
    setRefundNote,
  ] =
    useState("");

  /* LEDGER */

  const [
    transactionPage,
    setTransactionPage,
  ] =
    useState(1);

  /* =======================================================
     LOAD WALLET
  ======================================================= */

  const loadWallet =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setLoadError("");

          const result =
            await getCustomerRangeTokenWallet(
              customerId
            );

          setWallet(
            result
          );
        } catch (
          error
        ) {
          setLoadError(
            getRangeTokenErrorMessage(
              error,
              "Unable to load Range Token wallet."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        customerId,
      ]
    );

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  /* =======================================================
     TRANSACTIONS
  ======================================================= */

  const transactions =
    useMemo(
      () =>
        [
          ...(wallet
            ?.transactions ||
            []),
        ].sort(
          (
            first,
            second
          ) =>
            new Date(
              second.createdAt ||
                0
            ).getTime() -
            new Date(
              first.createdAt ||
                0
            ).getTime()
        ),
      [
        wallet,
      ]
    );

  const transactionTotalPages =
    Math.max(
      1,
      Math.ceil(
        transactions.length /
          TRANSACTION_PAGE_SIZE
      )
    );

  const visibleTransactions =
    useMemo(
      () => {
        const start =
          (
            transactionPage -
            1
          ) *
          TRANSACTION_PAGE_SIZE;

        return transactions.slice(
          start,
          start +
            TRANSACTION_PAGE_SIZE
        );
      },
      [
        transactionPage,
        transactions,
      ]
    );

  useEffect(() => {
    if (
      transactionPage >
      transactionTotalPages
    ) {
      setTransactionPage(
        transactionTotalPages
      );
    }
  }, [
    transactionPage,
    transactionTotalPages,
  ]);

  /* =======================================================
     SIGNUP BONUS
  ======================================================= */

  const handleSignupBonus =
    async () => {
      if (
        !wallet ||
        wallet.signupBonusGranted
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Grant the signup Range Token bonus to this customer?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setAction(
          "signup_bonus"
        );

        const result =
          await grantCustomerSignupRangeTokens(
            customerId
          );

        setWallet(
          result.wallet
        );

        toast.success(
          result.granted
            ? `${result.amount} signup Range Tokens granted.`
            : "Signup bonus was already granted."
        );

        await onUpdated();
      } catch (
        error
      ) {
        toast.error(
          "Unable to grant signup tokens",
          {
            description:
              getRangeTokenErrorMessage(
                error
              ),
          }
        );
      } finally {
        setAction(null);
      }
    };

  /* =======================================================
     ADMIN ADJUSTMENT
  ======================================================= */

  const handleAdjustment =
    async () => {
      if (!wallet) {
        return;
      }

      if (
        !Number.isInteger(
          amount
        ) ||
        amount <
          1
      ) {
        toast.error(
          "Token amount must be a positive whole number."
        );

        return;
      }

      const isCredit =
        adjustmentType ===
        "credit";

      const confirmed =
        window.confirm(
          `${
            isCredit
              ? "Credit"
              : "Debit"
          } ${amount} Range Token${
            amount ===
            1
              ? ""
              : "s"
          }?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setAction(
          adjustmentType
        );

        const result =
          isCredit
            ? await creditCustomerRangeTokens(
                customerId,
                {
                  amount,

                  type:
                    creditType,

                  note:
                    adjustmentNote.trim() ||
                    undefined,

                  reference:
                    "DASHBOARD_ADMIN_CREDIT",
                }
              )
            : await debitCustomerRangeTokens(
                customerId,
                {
                  amount,

                  type:
                    debitType,

                  note:
                    adjustmentNote.trim() ||
                    undefined,

                  reference:
                    "DASHBOARD_ADMIN_DEBIT",
                }
              );

        setWallet(
          result.wallet
        );

        setAmount(1);

        setAdjustmentNote(
          ""
        );

        toast.success(
          `${amount} Range Token${
            amount ===
            1
              ? ""
              : "s"
          } ${
            isCredit
              ? "credited"
              : "debited"
          }.`
        );

        await onUpdated();
      } catch (
        error
      ) {
        toast.error(
          isCredit
            ? "Unable to credit tokens"
            : "Unable to debit tokens",
          {
            description:
              getRangeTokenErrorMessage(
                error
              ),
          }
        );
      } finally {
        setAction(null);
      }
    };

  /* =======================================================
     REFUND
  ======================================================= */

  const handleRefund =
    async () => {
      if (!wallet) {
        return;
      }

      const normalizedRequestId =
        requestId.trim();

      if (
        !normalizedRequestId
      ) {
        toast.error(
          "Customer Request ID is required."
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Refund the Range Tokens consumed by this Customer Range request?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setAction(
          "refund"
        );

        const result =
          await refundCustomerRangeTokens(
            customerId,
            {
              customerRequestId:
                normalizedRequestId,

              note:
                refundNote.trim() ||
                undefined,
            }
          );

        setWallet(
          result.wallet
        );

        setRequestId("");

        setRefundNote("");

        toast.success(
          `${result.tokensRefunded} Range Token${
            result.tokensRefunded ===
            1
              ? ""
              : "s"
          } refunded.`
        );

        await onUpdated();
      } catch (
        error
      ) {
        toast.error(
          "Unable to refund Range Tokens",
          {
            description:
              getRangeTokenErrorMessage(
                error
              ),
          }
        );
      } finally {
        setAction(null);
      }
    };

  /* =======================================================
     LOAD STATE
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
            Loading Range Token wallet
          </p>
        </div>
      </ModalShell>
    );
  }

  if (
    loadError ||
    !wallet
  ) {
    return (
      <ModalShell
        onClose={
          onClose
        }
      >
        <div className="px-6 py-16 text-center">
          <CircleAlert className="mx-auto size-7 text-red-500" />

          <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
            Unable to load wallet
          </p>

          <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-gray-500">
            {loadError ||
              "Range Token wallet is unavailable."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadWallet()
            }
            className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </button>
        </div>
      </ModalShell>
    );
  }

  const customer =
    getRangeTokenCustomer(
      wallet
    );

  const busy =
    action !==
    null;

  /* =======================================================
     WALLET MODAL
  ======================================================= */

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close Range Token wallet"
        disabled={
          busy
        }
        onClick={
          onClose
        }
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] disabled:cursor-not-allowed"
      />

      <div className="relative z-10 flex max-h-[94vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101828]">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Range Token Wallet
              </h3>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  wallet.balance >
                  0
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-gray-500/10 text-gray-500"
                }`}
              >
                <Coins className="size-3.5" />

                {formatRangeTokenBalance(
                  wallet.balance
                )}
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
              {getRangeTokenCustomerName(
                wallet
              )}
            </p>

            <p className="mt-1 font-mono text-[10px] text-gray-400">
              {
                customerId
              }
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
            className="flex size-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:hover:bg-white/[0.05] dark:hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* BODY */}

        <div className="flex-1 overflow-y-auto p-6">
          {/* CUSTOMER */}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <MiniInfo
              label="Customer"
              value={
                customer?.name ||
                "—"
              }
            />

            <MiniInfo
              label="Email"
              value={
                customer?.email ||
                "—"
              }
            />

            <MiniInfo
              label="Phone"
              value={
                customer?.phoneE164 ||
                customer?.phone ||
                "—"
              }
            />

            <MiniInfo
              label="Last Activity"
              value={formatDateTime(
                wallet.lastTransactionAt
              )}
            />
          </div>

          {/* METRICS */}

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricBox
              label="Balance"
              value={
                wallet.balance
              }
              icon={
                <Coins className="size-4" />
              }
            />

            <MetricBox
              label="Total Credited"
              value={
                wallet.totalCredited
              }
              icon={
                <ArrowUpCircle className="size-4" />
              }
            />

            <MetricBox
              label="Total Debited"
              value={
                wallet.totalDebited
              }
              icon={
                <ArrowDownCircle className="size-4" />
              }
            />

            <MetricBox
              label="Ledger Entries"
              value={
                transactions.length
              }
              icon={
                <History className="size-4" />
              }
            />
          </div>

          {/* SIGNUP */}

          <section className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    wallet.signupBonusGranted
                      ? "bg-green-500/10 text-green-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  <Gift className="size-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Signup Bonus
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {wallet.signupBonusGranted
                      ? `${wallet.signupBonusAmount} tokens granted on ${formatDateTime(
                          wallet.signupBonusGrantedAt
                        )}.`
                      : "Signup token bonus is not recorded on this wallet."}
                  </p>
                </div>
              </div>

              {!wallet.signupBonusGranted && (
                <button
                  type="button"
                  disabled={
                    busy
                  }
                  onClick={() =>
                    void handleSignupBonus()
                  }
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#5b2eff] px-4 text-xs font-semibold text-white transition hover:bg-[#4720db] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {action ===
                  "signup_bonus" ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Gift className="size-3.5" />
                  )}

                  Grant Bonus
                </button>
              )}
            </div>
          </section>

          {/* MANUAL ADJUSTMENT */}

          <section className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Administrative Adjustment
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Use only for manual corrections. Token purchases and
              subscriptions must be credited through their normal
              payment fulfillment workflow.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[170px_130px_170px_1fr_auto]">
              <FilterSelect
                value={
                  adjustmentType
                }
                options={[
                  {
                    value: "credit",
                    label: "Credit",
                  },
                  {
                    value: "debit",
                    label: "Debit",
                  },
                ]}
                onChange={(
                  value
                ) =>
                  setAdjustmentType(
                    value as
                      | "credit"
                      | "debit"
                  )
                }
              />

              <input
                type="number"
                min="1"
                step="1"
                value={
                  amount
                }
                onChange={(
                  event
                ) =>
                  setAmount(
                    Math.max(
                      1,
                      Math.floor(
                        Number(
                          event.target.value
                        ) ||
                          1
                      )
                    )
                  )
                }
                className="h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#5b2eff] dark:border-gray-700 dark:text-white"
              />

              {adjustmentType ===
              "credit" ? (
                <FilterSelect
                  value={
                    creditType
                  }
                  options={[
                    {
                      value:
                        "admin_credit",
                      label:
                        "Admin Credit",
                    },
                    {
                      value:
                        "adjustment",
                      label:
                        "Adjustment",
                    },
                  ]}
                  onChange={(
                    value
                  ) =>
                    setCreditType(
                      value as
                        RangeTokenAdminCreditType
                    )
                  }
                />
              ) : (
                <FilterSelect
                  value={
                    debitType
                  }
                  options={[
                    {
                      value:
                        "admin_debit",
                      label:
                        "Admin Debit",
                    },
                    {
                      value:
                        "adjustment",
                      label:
                        "Adjustment",
                    },
                  ]}
                  onChange={(
                    value
                  ) =>
                    setDebitType(
                      value as
                        RangeTokenAdminDebitType
                    )
                  }
                />
              )}

              <input
                type="text"
                value={
                  adjustmentNote
                }
                onChange={(
                  event
                ) =>
                  setAdjustmentNote(
                    event.target.value
                  )
                }
                placeholder="Reason for adjustment..."
                className="h-10 min-w-0 rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#5b2eff] dark:border-gray-700 dark:text-white"
              />

              <button
                type="button"
                disabled={
                  busy
                }
                onClick={() =>
                  void handleAdjustment()
                }
                className={`inline-flex h-10 min-w-[115px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  adjustmentType ===
                  "credit"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {action ===
                adjustmentType ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : adjustmentType ===
                  "credit" ? (
                  <ArrowUpCircle className="size-4" />
                ) : (
                  <ArrowDownCircle className="size-4" />
                )}

                {adjustmentType ===
                "credit"
                  ? "Credit"
                  : "Debit"}
              </button>
            </div>
          </section>

          {/* REFUND */}

          <section className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <RotateCcw className="size-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Customer Range Refund
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Refund against the original Customer Range request.
                  Backend validates the completed debit and prevents
                  the same request from being refunded twice.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                value={
                  requestId
                }
                onChange={(
                  event
                ) =>
                  setRequestId(
                    event.target.value
                  )
                }
                placeholder="Customer Request ID"
                className="h-10 rounded-lg border border-gray-200 bg-transparent px-3 font-mono text-xs text-gray-800 outline-none placeholder:font-sans placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:text-white"
              />

              <input
                type="text"
                value={
                  refundNote
                }
                onChange={(
                  event
                ) =>
                  setRefundNote(
                    event.target.value
                  )
                }
                placeholder="Refund reason..."
                className="h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:text-white"
              />

              <button
                type="button"
                disabled={
                  busy
                }
                onClick={() =>
                  void handleRefund()
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {action ===
                "refund" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}

                Refund
              </button>
            </div>
          </section>

          {/* LEDGER */}

          <section className="mt-5 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2">
                  <History className="size-4 text-[#5b2eff]" />

                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Token Ledger
                  </p>
                </div>

                <p className="mt-1 text-[10px] text-gray-500">
                  {transactions.length.toLocaleString(
                    "en-PK"
                  )} recorded transaction
                  {transactions.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadWallet()
                }
                disabled={
                  busy
                }
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-white disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </button>
            </div>

            {transactions.length ===
            0 ? (
              <div className="px-5 py-12 text-center">
                <History className="mx-auto size-6 text-gray-300" />

                <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  No token transactions
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Wallet activity will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.01]">
                        <TableHeading>
                          Type
                        </TableHeading>

                        <TableHeading>
                          Direction
                        </TableHeading>

                        <TableHeading>
                          Amount
                        </TableHeading>

                        <TableHeading>
                          Balance
                        </TableHeading>

                        <TableHeading>
                          Range
                        </TableHeading>

                        <TableHeading>
                          Reference
                        </TableHeading>

                        <TableHeading>
                          Date
                        </TableHeading>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleTransactions.map(
                        (
                          transaction,
                          index
                        ) => (
                          <tr
                            key={
                              transaction._id ||
                              transaction.id ||
                              `${transaction.createdAt}-${index}`
                            }
                            className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                          >
                            <td className="px-4 py-3">
                              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                {formatRangeTokenTransactionType(
                                  transaction.type
                                )}
                              </p>

                              {transaction.note && (
                                <p className="mt-1 max-w-[260px] truncate text-[10px] text-gray-400">
                                  {
                                    transaction.note
                                  }
                                </p>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              <DirectionBadge
                                direction={
                                  transaction.direction
                                }
                                status={
                                  transaction.status
                                }
                              />
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                              {transaction.direction ===
                              "credit"
                                ? "+"
                                : "-"}
                              {transaction.amount}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                              {transaction.balanceBefore}
                              {" → "}
                              {transaction.balanceAfter}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                              {transaction.reductionPercent
                                ? `${transaction.reductionPercent}%`
                                : "—"}
                            </td>

                            <td className="max-w-[250px] px-4 py-3">
                              <p className="truncate font-mono text-[10px] text-gray-500">
                                {getTransactionReference(
                                  transaction
                                )}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                              {formatDateTime(
                                transaction.createdAt
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {transactionTotalPages >
                  1 && (
                  <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                    <button
                      type="button"
                      disabled={
                        transactionPage <=
                        1
                      }
                      onClick={() =>
                        setTransactionPage(
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
                      className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 dark:border-gray-700"
                    >
                      <ChevronLeft className="size-4" />
                    </button>

                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {transactionPage} /{" "}
                      {
                        transactionTotalPages
                      }
                    </span>

                    <button
                      type="button"
                      disabled={
                        transactionPage >=
                        transactionTotalPages
                      }
                      onClick={() =>
                        setTransactionPage(
                          (
                            current
                          ) =>
                            Math.min(
                              transactionTotalPages,
                              current +
                                1
                            )
                        )
                      }
                      className="flex size-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 dark:border-gray-700"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              onClose
            }
            className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL SHELL
========================================================= */

function ModalShell({
  children,
  onClose,
  disabled = false,
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

      <div className="relative z-10 w-full max-w-[760px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101828]">
        {
          children
        }
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY COMPONENTS
========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon,
  loading,
}: {
  label:
    string;

  value:
    | number
    | null;

  description:
    string;

  icon:
    ReactNode;

  loading:
    boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <span className="text-[#5b2eff] dark:text-[#8f78ff]">
          {
            icon
          }
        </span>
      </div>

      {loading ? (
        <div className="mt-2 h-7 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
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

      <p className="mt-1 text-[10px] text-gray-400">
        {description}
      </p>
    </div>
  );
}

function CompactMetric({
  label,
  value,
  description,
  loading,
}: {
  label:
    string;

  value:
    | number
    | null;

  description:
    string;

  loading:
    boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <div>
        <p className="text-xs font-semibold text-gray-900 dark:text-white">
          {label}
        </p>

        <p className="mt-1 text-[10px] text-gray-400">
          {description}
        </p>
      </div>

      {loading ? (
        <div className="h-7 w-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      ) : (
        <p className="text-xl font-bold text-gray-900 dark:text-white">
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

function RuleChip({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-lg bg-white/70 px-3 py-2 text-right dark:bg-white/[0.04]">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-0.5 text-xs font-bold text-gray-900 dark:text-white">
        {value}
      </p>
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
        className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-transparent px-3 pr-9 text-sm text-gray-700 outline-none transition focus:border-[#5b2eff] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
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
   DETAILS
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
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function MetricBox({
  label,
  value,
  icon,
}: {
  label:
    string;

  value:
    number;

  icon:
    ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <span className="text-[#5b2eff] dark:text-[#8f78ff]">
          {
            icon
          }
        </span>
      </div>

      <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
        {formatNumber(
          value
        )}
      </p>
    </div>
  );
}

function DirectionBadge({
  direction,
  status,
}: {
  direction:
    "credit" |
    "debit";

  status:
    "completed" |
    "reversed";
}) {
  if (
    status ===
    "reversed"
  ) {
    return (
      <span className="inline-flex rounded-full bg-gray-500/10 px-2 py-1 text-[10px] font-semibold text-gray-500">
        Reversed
      </span>
    );
  }

  if (
    direction ===
    "credit"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-[10px] font-semibold text-green-600 dark:text-green-400">
        <ArrowUpCircle className="size-3" />
        Credit
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-500">
      <ArrowDownCircle className="size-3" />
      Debit
    </span>
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
        Loading Range Token wallets
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Fetching customer balances from the backend.
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

      <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
        Unable to load Range Tokens
      </p>

      <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-gray-500">
        {
          message
        }
      </p>

      <button
        type="button"
        onClick={
          onRetry
        }
        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
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
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#5b2eff]/10 text-[#5b2eff] dark:text-[#8f78ff]">
        <WalletCards className="size-5" />
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        No Range Token wallets found
      </h3>

      <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-gray-500">
        {filtered
          ? "No customer wallet matches the selected filters."
          : "Customer Range Token wallets will appear here through the backend customer workflow."}
      </p>
    </div>
  );
}