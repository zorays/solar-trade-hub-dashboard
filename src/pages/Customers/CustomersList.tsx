import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleUserRound,
  Coins,
  Eye,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  Modal,
} from "../../components/ui/modal";

import Button from "../../components/ui/button/Button";

import {
  deleteUser,
  getUserAvatarUrl,
  getUsers,
  updateUser,
  updateUserStatus,
  type DashboardUser,
  type UpdateUserPayload,
  type UserListParams,
  type UserStatus,
} from "../../services/user/user.service";

import {
  formatRangeTokenBalance,
  getCustomerRangeTokenBalance,
  type CustomerRangeTokenBalance,
} from "../../services/settings/marketplace/rangeToken.service";

type VerificationFilter =
  | "all"
  | "verified"
  | "unverified";

type PhoneVerificationFilter =
  | "all"
  | "verified"
  | "unverified";

type CustomerModalMode =
  | "view"
  | "edit";

type CustomerForm = {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
};

type CustomerTokenState = {
  loading: boolean;
  data:
    | CustomerRangeTokenBalance
    | null;
  error: boolean;
};

const formatDate = (
  value: string
): string => {
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
    }
  ).format(date);
};

const formatDateTime = (
  value:
    | string
    | null
    | undefined
): string => {
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

const getInitials = (
  name: string,
  email: string
): string => {
  const source =
    name.trim() ||
    email.trim() ||
    "C";

  const parts =
    source
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase();
};

const getStatusClasses = (
  status: UserStatus
): string => {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400";

    case "inactive":
      return "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400";

    case "blocked":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";
  }
};

const formatProvider = (
  provider: string
): string => {
  if (
    provider === "google"
  ) {
    return "Google";
  }

  if (
    provider === "local"
  ) {
    return "Email";
  }

  return provider
    ? provider
        .charAt(0)
        .toUpperCase() +
        provider.slice(1)
    : "—";
};

const getErrorMessage = (
  error: unknown
): string => {
  if (
    error &&
    typeof error ===
      "object"
  ) {
    const possibleError =
      error as {
        response?: {
          data?: {
            message?: unknown;
          };
        };

        message?: unknown;
      };

    const apiMessage =
      possibleError
        .response
        ?.data
        ?.message;

    if (
      typeof apiMessage ===
        "string" &&
      apiMessage.trim()
    ) {
      return apiMessage;
    }

    if (
      typeof possibleError
        .message ===
        "string" &&
      possibleError
        .message
        .trim()
    ) {
      return possibleError
        .message;
    }
  }

  return "Something went wrong.";
};

const getCustomerId = (
  customer:
    DashboardUser
): string =>
  customer.id ||
  customer._id;

const CustomersList =
  () => {
    const [
      customers,
      setCustomers,
    ] =
      useState<
        DashboardUser[]
      >([]);

    const [
      tokenStates,
      setTokenStates,
    ] =
      useState<
        Record<
          string,
          CustomerTokenState
        >
      >({});

    const [
      totalCount,
      setTotalCount,
    ] =
      useState(0);

    const [
      loading,
      setLoading,
    ] =
      useState(true);

    const [
      error,
      setError,
    ] =
      useState("");

    const [
      actionError,
      setActionError,
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
      useState<
        UserStatus |
        ""
      >("");

    const [
      verificationFilter,
      setVerificationFilter,
    ] =
      useState<VerificationFilter>(
        "all"
      );

    const [
      phoneVerificationFilter,
      setPhoneVerificationFilter,
    ] =
      useState<PhoneVerificationFilter>(
        "all"
      );

    const [
      selectedCustomer,
      setSelectedCustomer,
    ] =
      useState<
        DashboardUser |
        null
      >(null);

    const [
      modalMode,
      setModalMode,
    ] =
      useState<CustomerModalMode>(
        "view"
      );

    const [
      statusCustomer,
      setStatusCustomer,
    ] =
      useState<
        DashboardUser |
        null
      >(null);

    const [
      deleteCandidate,
      setDeleteCandidate,
    ] =
      useState<
        DashboardUser |
        null
      >(null);

    const [
      actionLoadingId,
      setActionLoadingId,
    ] =
      useState<
        string |
        null
      >(null);

    const requestIdRef =
      useRef(0);

    useEffect(
      () => {
        const timer =
          window.setTimeout(
            () => {
              setSearch(
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
      },
      [
        searchInput,
      ]
    );

    const loadCustomerTokens =
      useCallback(
        async (
          customerList:
            DashboardUser[]
        ) => {
          const initialState:
            Record<
              string,
              CustomerTokenState
            > = {};

          customerList.forEach(
            (
              customer
            ) => {
              const customerId =
                getCustomerId(
                  customer
                );

              if (
                !customerId
              ) {
                return;
              }

              initialState[
                customerId
              ] = {
                loading:
                  true,

                data:
                  null,

                error:
                  false,
              };
            }
          );

          setTokenStates(
            initialState
          );

          await Promise.all(
            customerList.map(
              async (
                customer
              ) => {
                const customerId =
                  getCustomerId(
                    customer
                  );

                if (
                  !customerId
                ) {
                  return;
                }

                try {
                  const result =
                    await getCustomerRangeTokenBalance(
                      customerId
                    );

                  setTokenStates(
                    (
                      current
                    ) => ({
                      ...current,

                      [customerId]:
                        {
                          loading:
                            false,

                          data:
                            result,

                          error:
                            false,
                        },
                    })
                  );
                } catch {
                  setTokenStates(
                    (
                      current
                    ) => ({
                      ...current,

                      [customerId]:
                        {
                          loading:
                            false,

                          data:
                            null,

                          error:
                            true,
                        },
                    })
                  );
                }
              }
            )
          );
        },
        []
      );

    const refreshCustomerToken =
      useCallback(
        async (
          customerId:
            string
        ) => {
          if (
            !customerId
          ) {
            return;
          }

          setTokenStates(
            (
              current
            ) => ({
              ...current,

              [customerId]:
                {
                  loading:
                    true,

                  data:
                    current[
                      customerId
                    ]?.data ||
                    null,

                  error:
                    false,
                },
            })
          );

          try {
            const result =
              await getCustomerRangeTokenBalance(
                customerId
              );

            setTokenStates(
              (
                current
              ) => ({
                ...current,

                [customerId]:
                  {
                    loading:
                      false,

                    data:
                      result,

                    error:
                      false,
                  },
              })
            );
          } catch {
            setTokenStates(
              (
                current
              ) => ({
                ...current,

                [customerId]:
                  {
                    loading:
                      false,

                    data:
                      null,

                    error:
                      true,
                  },
              })
            );
          }
        },
        []
      );

    const loadCustomers =
      useCallback(
        async () => {
          const requestId =
            ++requestIdRef.current;

          setLoading(
            true
          );

          setError(
            ""
          );

          const params:
            UserListParams = {
            search,

            accountType:
              "customer",

            status:
              statusFilter,

            isVerified:
              verificationFilter ===
              "verified"
                ? true
                : verificationFilter ===
                    "unverified"
                  ? false
                  : "",

            isPhoneVerified:
              phoneVerificationFilter ===
              "verified"
                ? true
                : phoneVerificationFilter ===
                    "unverified"
                  ? false
                  : "",
          };

          try {
            const result =
              await getUsers(
                params
              );

            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            const customerUsers =
              result.users.filter(
                (
                  user
                ) =>
                  user.accountType ===
                  "customer"
              );

            setCustomers(
              customerUsers
            );

            setTotalCount(
              customerUsers.length
            );

            void loadCustomerTokens(
              customerUsers
            );
          } catch (
            loadError
          ) {
            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            setCustomers(
              []
            );

            setTokenStates(
              {}
            );

            setTotalCount(
              0
            );

            setError(
              getErrorMessage(
                loadError
              )
            );
          } finally {
            if (
              requestId ===
              requestIdRef.current
            ) {
              setLoading(
                false
              );
            }
          }
        },
        [
          search,
          statusFilter,
          verificationFilter,
          phoneVerificationFilter,
          loadCustomerTokens,
        ]
      );

    useEffect(
      () => {
        void loadCustomers();
      },
      [
        loadCustomers,
      ]
    );

    const summary =
      useMemo(
        () => ({
          active:
            customers.filter(
              (
                customer
              ) =>
                customer.status ===
                "active"
            ).length,

          verified:
            customers.filter(
              (
                customer
              ) =>
                customer.isVerified
            ).length,

          blocked:
            customers.filter(
              (
                customer
              ) =>
                customer.status ===
                "blocked"
            ).length,
        }),
        [
          customers,
        ]
      );

    const hasFilters =
      Boolean(
        search
      ) ||
      Boolean(
        statusFilter
      ) ||
      verificationFilter !==
        "all" ||
      phoneVerificationFilter !==
        "all";

    const resetFilters =
      () => {
        setSearchInput(
          ""
        );

        setSearch(
          ""
        );

        setStatusFilter(
          ""
        );

        setVerificationFilter(
          "all"
        );

        setPhoneVerificationFilter(
          "all"
        );
      };

    const replaceCustomer =
      (
        updated:
          DashboardUser
      ) => {
        setCustomers(
          (
            current
          ) =>
            current.map(
              (
                customer
              ) =>
                getCustomerId(
                  customer
                ) ===
                getCustomerId(
                  updated
                )
                  ? updated
                  : customer
            )
        );

        setSelectedCustomer(
          (
            current
          ) =>
            current &&
            getCustomerId(
              current
            ) ===
              getCustomerId(
                updated
              )
              ? updated
              : current
        );

        setStatusCustomer(
          (
            current
          ) =>
            current &&
            getCustomerId(
              current
            ) ===
              getCustomerId(
                updated
              )
              ? updated
              : current
        );
      };

    const openCustomer =
      (
        customer:
          DashboardUser,
        mode:
          CustomerModalMode
      ) => {
        setActionError(
          ""
        );

        setSelectedCustomer(
          customer
        );

        setModalMode(
          mode
        );
      };

    const handleStatusUpdate =
      async (
        customer:
          DashboardUser,
        status:
          UserStatus
      ) => {
        const customerId =
          getCustomerId(
            customer
          );

        if (
          !customerId
        ) {
          return;
        }

        try {
          setActionError(
            ""
          );

          setActionLoadingId(
            customerId
          );

          const updated =
            await updateUserStatus(
              customerId,
              status
            );

          replaceCustomer(
            updated
          );

          setStatusCustomer(
            null
          );
        } catch (
          statusError
        ) {
          setActionError(
            getErrorMessage(
              statusError
            )
          );
        } finally {
          setActionLoadingId(
            null
          );
        }
      };

    const handleDelete =
      async () => {
        if (
          !deleteCandidate
        ) {
          return;
        }

        const customerId =
          getCustomerId(
            deleteCandidate
          );

        if (
          !customerId
        ) {
          return;
        }

        try {
          setActionError(
            ""
          );

          setActionLoadingId(
            customerId
          );

          await deleteUser(
            customerId
          );

          setCustomers(
            (
              current
            ) =>
              current.filter(
                (
                  customer
                ) =>
                  getCustomerId(
                    customer
                  ) !==
                  customerId
              )
          );

          setTokenStates(
            (
              current
            ) => {
              const next = {
                ...current,
              };

              delete next[
                customerId
              ];

              return next;
            }
          );

          setTotalCount(
            (
              current
            ) =>
              Math.max(
                current -
                  1,
                0
              )
          );

          setDeleteCandidate(
            null
          );

          if (
            selectedCustomer &&
            getCustomerId(
              selectedCustomer
            ) ===
              customerId
          ) {
            setSelectedCustomer(
              null
            );
          }
        } catch (
          deleteError
        ) {
          setActionError(
            getErrorMessage(
              deleteError
            )
          );
        } finally {
          setActionLoadingId(
            null
          );
        }
      };

    return (
      <>
        <PageMeta
          title="Customers | Solar Trade Hub Dashboard"
          description="Manage Solar Trade Hub marketplace customers."
        />

        <PageBreadcrumb
          pageTitle="Customers"
        />

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="relative p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

              <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                    <Users
                      size={23}
                      strokeWidth={1.9}
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                      Marketplace
                    </p>

                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                      Customers
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                      Manage registered marketplace customers,
                      verification and account access.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void loadCustomers();
                  }}
                  disabled={
                    loading
                  }
                  className="group inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-300 hover:w-[100px] hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-purple-500/30 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
                >
                  <RefreshCw
                    size={16}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[55px] group-hover:opacity-100">
                    Refresh
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Customers"
              value={
                totalCount
              }
              icon={
                <Users
                  size={20}
                />
              }
              iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
            />

            <StatCard
              title="Active"
              value={
                summary.active
              }
              icon={
                <UserCheck
                  size={20}
                />
              }
              iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            />

            <StatCard
              title="Verified"
              value={
                summary.verified
              }
              icon={
                <ShieldCheck
                  size={20}
                />
              }
              iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
            />

            <StatCard
              title="Blocked"
              value={
                summary.blocked
              }
              icon={
                <Ban
                  size={20}
                />
              }
              iconClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      All Customers
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {loading
                        ? "Loading customers..."
                        : `${totalCount} customer${
                            totalCount ===
                            1
                              ? ""
                              : "s"
                          } found`}
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
                          event.target.value
                        )
                      }
                      placeholder="Search name, email or phone..."
                      className="h-11 w-full rounded-xl border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <select
                    value={
                      statusFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setStatusFilter(
                        event.target
                          .value as
                          | UserStatus
                          | ""
                      )
                    }
                    className="h-11 rounded-xl border border-gray-300 bg-transparent px-3 text-sm text-gray-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <option value="">
                      All Statuses
                    </option>

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="blocked">
                      Blocked
                    </option>
                  </select>

                  <select
                    value={
                      verificationFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setVerificationFilter(
                        event.target
                          .value as
                          VerificationFilter
                      )
                    }
                    className="h-11 rounded-xl border border-gray-300 bg-transparent px-3 text-sm text-gray-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <option value="all">
                      Email Verification
                    </option>

                    <option value="verified">
                      Email Verified
                    </option>

                    <option value="unverified">
                      Email Unverified
                    </option>
                  </select>

                  <select
                    value={
                      phoneVerificationFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setPhoneVerificationFilter(
                        event.target
                          .value as
                          PhoneVerificationFilter
                      )
                    }
                    className="h-11 rounded-xl border border-gray-300 bg-transparent px-3 text-sm text-gray-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <option value="all">
                      Phone Verification
                    </option>

                    <option value="verified">
                      Phone Verified
                    </option>

                    <option value="unverified">
                      Phone Unverified
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={
                      resetFilters
                    }
                    disabled={
                      !hasFilters
                    }
                    className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {(error ||
              actionError) && (
              <div className="border-b border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <span>
                    {actionError ||
                      error}
                  </span>

                  {error && (
                    <button
                      type="button"
                      onClick={() => {
                        void loadCustomers();
                      }}
                      className="font-semibold underline underline-offset-2"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                  <tr>
                    <TableHeading>
                      Customer
                    </TableHeading>

                    <TableHeading>
                      Contact
                    </TableHeading>

                    <TableHeading>
                      Verification
                    </TableHeading>

                    <TableHeading>
                      Range Tokens
                    </TableHeading>

                    <TableHeading>
                      Sign In
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Joined
                    </TableHeading>

                    <TableHeading align="right">
                      Actions
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {loading &&
                    Array.from({
                      length: 4,
                    }).map(
                      (
                        _,
                        index
                      ) => (
                        <CustomerSkeleton
                          key={
                            index
                          }
                        />
                      )
                    )}

                  {!loading &&
                    customers.map(
                      (
                        customer
                      ) => {
                        const customerId =
                          getCustomerId(
                            customer
                          );

                        return (
                          <CustomerRow
                            key={
                              customerId
                            }
                            customer={
                              customer
                            }
                            tokenState={
                              tokenStates[
                                customerId
                              ]
                            }
                            actionLoading={
                              actionLoadingId ===
                              customerId
                            }
                            onRefreshTokens={() => {
                              void refreshCustomerToken(
                                customerId
                              );
                            }}
                            onView={() =>
                              openCustomer(
                                customer,
                                "view"
                              )
                            }
                            onEdit={() =>
                              openCustomer(
                                customer,
                                "edit"
                              )
                            }
                            onStatus={() =>
                              setStatusCustomer(
                                customer
                              )
                            }
                            onDelete={() =>
                              setDeleteCandidate(
                                customer
                              )
                            }
                          />
                        );
                      }
                    )}

                  {!loading &&
                    !error &&
                    customers.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-16 text-center"
                        >
                          <CircleUserRound
                            size={38}
                            className="mx-auto text-gray-300 dark:text-gray-600"
                          />

                          <p className="mt-4 font-medium text-gray-700 dark:text-gray-300">
                            No customers found
                          </p>

                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {hasFilters
                              ? "Try changing your search or filters."
                              : "Registered marketplace customers will appear here."}
                          </p>

                          {hasFilters && (
                            <button
                              type="button"
                              onClick={
                                resetFilters
                              }
                              className="mt-4 text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
                            >
                              Clear filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedCustomer && (
          <CustomerModal
            customer={
              selectedCustomer
            }
            tokenState={
              tokenStates[
                getCustomerId(
                  selectedCustomer
                )
              ]
            }
            mode={
              modalMode
            }
            onModeChange={
              setModalMode
            }
            onClose={() =>
              setSelectedCustomer(
                null
              )
            }
            onUpdated={
              replaceCustomer
            }
            onStatus={() =>
              setStatusCustomer(
                selectedCustomer
              )
            }
            onDelete={() =>
              setDeleteCandidate(
                selectedCustomer
              )
            }
          />
        )}

        <StatusModal
          customer={
            statusCustomer
          }
          loading={
            Boolean(
              statusCustomer &&
              actionLoadingId ===
                getCustomerId(
                  statusCustomer
                )
            )
          }
          onClose={() =>
            setStatusCustomer(
              null
            )
          }
          onUpdate={
            handleStatusUpdate
          }
        />

        <DeleteModal
          customer={
            deleteCandidate
          }
          loading={
            Boolean(
              deleteCandidate &&
              actionLoadingId ===
                getCustomerId(
                  deleteCandidate
                )
            )
          }
          onClose={() =>
            setDeleteCandidate(
              null
            )
          }
          onConfirm={() => {
            void handleDelete();
          }}
        />
      </>
    );
  };

const CustomerRow = ({
  customer,
  tokenState,
  actionLoading,
  onRefreshTokens,
  onView,
  onEdit,
  onStatus,
  onDelete,
}: {
  customer:
    DashboardUser;

  tokenState?:
    CustomerTokenState;

  actionLoading:
    boolean;

  onRefreshTokens:
    () => void;

  onView:
    () => void;

  onEdit:
    () => void;

  onStatus:
    () => void;

  onDelete:
    () => void;
}) => {
  const avatarUrl =
    getUserAvatarUrl(
      customer.avatar
    );

  return (
    <tr className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
      <td className="px-5 py-5 align-top sm:px-6">
        <div className="flex min-w-[220px] items-center gap-3">
          <CustomerAvatar
            name={
              customer.name
            }
            email={
              customer.email
            }
            avatarUrl={
              avatarUrl
            }
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {customer.name ||
                "Unnamed Customer"}
            </p>

            <p className="mt-1 max-w-[200px] truncate text-xs text-gray-500 dark:text-gray-400">
              {customer.email ||
                "No email"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-5 align-top">
        <div className="min-w-[195px] space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Mail
              size={13}
              className="shrink-0 text-gray-400"
            />

            <span className="max-w-[170px] truncate">
              {customer.email ||
                "—"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Phone
              size={13}
              className="shrink-0 text-gray-400"
            />

            <span>
              {customer.phoneE164 ||
                (
                  customer.phone
                    ? `${customer.countryCode || ""}${customer.phone}`
                    : "—"
                )}
            </span>
          </div>
        </div>
      </td>

      <td className="px-5 py-5 align-top">
        <div className="min-w-[145px] space-y-2">
          <VerificationItem
            verified={
              customer.isVerified
            }
            label="Email"
          />

          {customer.phone ||
          customer.phoneE164 ? (
            <VerificationItem
              verified={
                customer.isPhoneVerified
              }
              label="Phone"
            />
          ) : (
            <span className="text-xs text-gray-400">
              No phone
            </span>
          )}
        </div>
      </td>

      <td className="px-5 py-5 align-top">
        <TokenBalanceCell
          tokenState={
            tokenState
          }
          onRefresh={
            onRefreshTokens
          }
        />
      </td>

      <td className="px-5 py-5 align-top">
        <span className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
          {formatProvider(
            customer.provider
          )}
        </span>
      </td>

      <td className="px-5 py-5 align-top">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClasses(
            customer.status
          )}`}
        >
          {
            customer.status
          }
        </span>
      </td>

      <td className="px-5 py-5 align-top">
        <div className="flex min-w-[125px] items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <CalendarDays
            size={14}
          />

          {formatDate(
            customer.createdAt
          )}
        </div>
      </td>

      <td className="px-5 py-5 text-right align-top sm:px-6">
        <div className="flex min-w-[170px] items-center justify-end gap-2">
          <ActionButton
            label="View"
            onClick={
              onView
            }
            disabled={
              actionLoading
            }
            theme="purple"
          >
            <Eye
              size={14}
            />
          </ActionButton>

          <ActionButton
            label="Edit"
            onClick={
              onEdit
            }
            disabled={
              actionLoading
            }
            theme="orange"
          >
            <Pencil
              size={14}
            />
          </ActionButton>

          <ActionButton
            label="Status"
            onClick={
              onStatus
            }
            disabled={
              actionLoading
            }
            theme="gray"
          >
            {actionLoading ? (
              <RefreshCw
                size={14}
                className="animate-spin"
              />
            ) : (
              <ShieldCheck
                size={14}
              />
            )}
          </ActionButton>

          <ActionButton
            label="Delete"
            onClick={
              onDelete
            }
            disabled={
              actionLoading
            }
            theme="red"
          >
            <Trash2
              size={14}
            />
          </ActionButton>
        </div>
      </td>
    </tr>
  );
};

const TokenBalanceCell = ({
  tokenState,
  onRefresh,
}: {
  tokenState?:
    CustomerTokenState;

  onRefresh:
    () => void;
}) => {
  if (
    !tokenState ||
    tokenState.loading
  ) {
    return (
      <div className="flex min-w-[110px] items-center gap-2 text-xs text-gray-400">
        <RefreshCw
          size={14}
          className="animate-spin"
        />

        Loading
      </div>
    );
  }

  if (
    tokenState.error ||
    !tokenState.data
  ) {
    return (
      <button
        type="button"
        onClick={
          onRefresh
        }
        className="inline-flex min-w-[90px] items-center gap-2 text-xs font-semibold text-red-500 hover:text-red-600"
      >
        <RefreshCw
          size={13}
        />

        Retry
      </button>
    );
  }

  const balance =
    tokenState.data
      .balance;

  return (
    <div className="min-w-[110px]">
      <div className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-2.5 py-1.5 text-xs font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
        <Coins
          size={14}
        />

        {formatRangeTokenBalance(
          balance
        )}
      </div>
    </div>
  );
};

const CustomerModal = ({
  customer,
  tokenState,
  mode,
  onModeChange,
  onClose,
  onUpdated,
  onStatus,
  onDelete,
}: {
  customer:
    DashboardUser;

  tokenState?:
    CustomerTokenState;

  mode:
    CustomerModalMode;

  onModeChange: (
    mode:
      CustomerModalMode
  ) => void;

  onClose:
    () => void;

  onUpdated: (
    customer:
      DashboardUser
  ) => void;

  onStatus:
    () => void;

  onDelete:
    () => void;
}) => {
  const [
    form,
    setForm,
  ] =
    useState<CustomerForm>({
      name:
        customer.name || "",

      email:
        customer.email || "",

      countryCode:
        customer.countryCode || "",

      phone:
        customer.phone || "",
    });

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    saveError,
    setSaveError,
  ] =
    useState("");

  const customerId =
    getCustomerId(
      customer
    );

  useEffect(
    () => {
      setForm({
        name:
          customer.name || "",

        email:
          customer.email || "",

        countryCode:
          customer.countryCode || "",

        phone:
          customer.phone || "",
      });
    },
    [
      customer,
    ]
  );

  const handleSave =
    async () => {
      if (
        !customerId
      ) {
        return;
      }

      const payload:
        UpdateUserPayload = {
        name:
          form.name.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        countryCode:
          form.countryCode.trim(),

        phone:
          form.phone.trim(),
      };

      if (
        !payload.name
      ) {
        setSaveError(
          "Customer name is required."
        );

        return;
      }

      if (
        !payload.email
      ) {
        setSaveError(
          "Customer email is required."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setSaveError(
          ""
        );

        const updated =
          await updateUser(
            customerId,
            payload
          );

        onUpdated(
          updated
        );

        onModeChange(
          "view"
        );
      } catch (
        updateError
      ) {
        setSaveError(
          getErrorMessage(
            updateError
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const avatarUrl =
    getUserAvatarUrl(
      customer.avatar
    );

  return (
    <Modal
      isOpen
      onClose={
        onClose
      }
      className="m-4 max-w-[720px]"
    >
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <CustomerAvatar
              name={
                customer.name
              }
              email={
                customer.email
              }
              avatarUrl={
                avatarUrl
              }
              large
            />

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                Customer
              </p>

              <h2 className="mt-1 truncate text-xl font-semibold text-gray-900 dark:text-white">
                {customer.name ||
                  "Unnamed Customer"}
              </h2>

              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                {
                  customer.email
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-white"
          >
            <X
              size={18}
            />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {mode ===
          "view" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Email"
                  value={
                    customer.email ||
                    "—"
                  }
                />

                <DetailItem
                  label="Phone"
                  value={
                    customer.phoneE164 ||
                    (
                      customer.phone
                        ? `${customer.countryCode || ""}${customer.phone}`
                        : "—"
                    )
                  }
                />

                <DetailItem
                  label="Email Verification"
                  value={
                    customer.isVerified
                      ? "Verified"
                      : "Unverified"
                  }
                />

                <DetailItem
                  label="Phone Verification"
                  value={
                    customer.isPhoneVerified
                      ? "Verified"
                      : "Unverified"
                  }
                />

                <DetailItem
                  label="Sign In"
                  value={
                    formatProvider(
                      customer.provider
                    )
                  }
                />

                <DetailItem
                  label="Account Status"
                  value={
                    customer.status
                      .charAt(0)
                      .toUpperCase() +
                    customer.status.slice(
                      1
                    )
                  }
                />

                <DetailItem
                  label="Joined"
                  value={
                    formatDateTime(
                      customer.createdAt
                    )
                  }
                />

                <DetailItem
                  label="Last Updated"
                  value={
                    formatDateTime(
                      customer.updatedAt
                    )
                  }
                />
              </div>

              <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                      <Coins
                        size={18}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Range Tokens
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Current customer balance
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {!tokenState ||
                    tokenState.loading ? (
                      <RefreshCw
                        size={18}
                        className="animate-spin text-gray-400"
                      />
                    ) : tokenState.error ||
                      !tokenState.data ? (
                      <span className="text-sm text-gray-400">
                        —
                      </span>
                    ) : (
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatRangeTokenBalance(
                          tokenState
                            .data
                            .balance
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {tokenState?.data && (
                  <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3 dark:border-gray-800">
                    <DetailItem
                      label="Wallet"
                      value={
                        tokenState
                          .data
                          .hasWallet
                          ? "Active"
                          : "Not created"
                      }
                    />

                    <DetailItem
                      label="Signup Bonus"
                      value={
                        tokenState
                          .data
                          .signupBonusGranted
                          ? `${tokenState.data.signupBonusAmount} Tokens`
                          : "Not granted"
                      }
                    />

                    <DetailItem
                      label="Balance"
                      value={
                        formatRangeTokenBalance(
                          tokenState
                            .data
                            .balance
                        )
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {saveError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  {
                    saveError
                  }
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Name"
                  value={
                    form.name
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        name:
                          value,
                      })
                    )
                  }
                />

                <FormField
                  label="Email"
                  type="email"
                  value={
                    form.email
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        email:
                          value,
                      })
                    )
                  }
                />

                <FormField
                  label="Country Code"
                  placeholder="+92"
                  value={
                    form.countryCode
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        countryCode:
                          value,
                      })
                    )
                  }
                />

                <FormField
                  label="Phone"
                  value={
                    form.phone
                  }
                  onChange={(
                    value
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        phone:
                          value,
                      })
                    )
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={
                onStatus
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <ShieldCheck
                size={15}
              />

              Status
            </button>

            <button
              type="button"
              onClick={
                onDelete
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
            >
              <Trash2
                size={15}
              />

              Delete
            </button>
          </div>

          <div className="flex justify-end gap-2">
            {mode ===
            "view" ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={
                    onClose
                  }
                >
                  Close
                </Button>

                <button
                  type="button"
                  onClick={() =>
                    onModeChange(
                      "edit"
                    )
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5b2eff] px-4 text-sm font-semibold text-white transition hover:bg-[#4820df]"
                >
                  <Pencil
                    size={15}
                  />

                  Edit Customer
                </button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    onModeChange(
                      "view"
                    )
                  }
                >
                  Cancel
                </Button>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() => {
                    void handleSave();
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5b2eff] px-4 text-sm font-semibold text-white transition hover:bg-[#4820df] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Check
                      size={15}
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const StatusModal = ({
  customer,
  loading,
  onClose,
  onUpdate,
}: {
  customer:
    DashboardUser |
    null;

  loading:
    boolean;

  onClose:
    () => void;

  onUpdate: (
    customer:
      DashboardUser,
    status:
      UserStatus
  ) => Promise<void>;
}) => {
  return (
    <Modal
      isOpen={
        Boolean(
          customer
        )
      }
      onClose={
        onClose
      }
      className="m-4 max-w-[480px]"
    >
      {customer && (
        <div className="w-full rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          <div className="px-6 pb-5 pt-7 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <ShieldCheck
                size={20}
              />
            </div>

            <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
              Customer Status
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Update access for{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {customer.name ||
                  customer.email}
              </span>
              .
            </p>

            <div className="mt-5 space-y-2">
              <StatusOption
                label="Active"
                active={
                  customer.status ===
                  "active"
                }
                disabled={
                  loading
                }
                icon={
                  <UserCheck
                    size={17}
                  />
                }
                onClick={() => {
                  void onUpdate(
                    customer,
                    "active"
                  );
                }}
              />

              <StatusOption
                label="Inactive"
                active={
                  customer.status ===
                  "inactive"
                }
                disabled={
                  loading
                }
                icon={
                  <ShieldX
                    size={17}
                  />
                }
                onClick={() => {
                  void onUpdate(
                    customer,
                    "inactive"
                  );
                }}
              />

              <StatusOption
                label="Blocked"
                active={
                  customer.status ===
                  "blocked"
                }
                disabled={
                  loading
                }
                icon={
                  <Ban
                    size={17}
                  />
                }
                onClick={() => {
                  void onUpdate(
                    customer,
                    "blocked"
                  );
                }}
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
            <Button
              size="sm"
              variant="outline"
              disabled={
                loading
              }
              onClick={
                onClose
              }
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

const DeleteModal = ({
  customer,
  loading,
  onClose,
  onConfirm,
}: {
  customer:
    DashboardUser |
    null;

  loading:
    boolean;

  onClose:
    () => void;

  onConfirm:
    () => void;
}) => {
  return (
    <Modal
      isOpen={
        Boolean(
          customer
        )
      }
      onClose={
        onClose
      }
      className="m-4 max-w-[480px]"
    >
      {customer && (
        <div className="w-full rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          <div className="px-6 pb-5 pt-7 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Trash2
                size={20}
              />
            </div>

            <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
              Delete Customer?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              You are about to permanently delete{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {customer.name ||
                  customer.email}
              </span>
              . This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
            <Button
              size="sm"
              variant="outline"
              disabled={
                loading
              }
              onClick={
                onClose
              }
            >
              Cancel
            </Button>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={
                onConfirm
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <RefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Trash2
                  size={15}
                />
              )}

              {loading
                ? "Deleting..."
                : "Delete Customer"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

const StatusOption = ({
  label,
  active,
  disabled,
  icon,
  onClick,
}: {
  label:
    string;

  active:
    boolean;

  disabled:
    boolean;

  icon:
    ReactNode;

  onClick:
    () => void;
}) => {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        disabled ||
        active
      }
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
        active
          ? "border-purple-200 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10"
          : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 dark:border-gray-700 dark:hover:border-purple-500/30 dark:hover:bg-purple-500/5"
      } disabled:cursor-not-allowed`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          active
            ? "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
            : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-400"
        }`}
      >
        {
          icon
        }
      </div>

      <p className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
        {
          label
        }
      </p>

      {active && (
        <CheckCircle2
          size={18}
          className="text-purple-600 dark:text-purple-400"
        />
      )}
    </button>
  );
};

const ActionButton = ({
  label,
  children,
  onClick,
  disabled,
  theme,
}: {
  label:
    string;

  children:
    ReactNode;

  onClick:
    () => void;

  disabled:
    boolean;

  theme:
    | "purple"
    | "orange"
    | "gray"
    | "red";
}) => {
  const styles = {
    purple:
      "border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400",

    orange:
      "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400",

    gray:
      "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400",

    red:
      "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
  };

  return (
    <button
      type="button"
      title={
        label
      }
      aria-label={
        label
      }
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className={`group flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition-all duration-300 hover:w-[76px] disabled:cursor-not-allowed disabled:opacity-40 ${styles[theme]}`}
    >
      <span className="shrink-0">
        {
          children
        }
      </span>

      <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold opacity-0 transition-all duration-300 group-hover:ml-1.5 group-hover:max-w-[42px] group-hover:opacity-100">
        {
          label
        }
      </span>
    </button>
  );
};

const FormField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label:
    string;

  value:
    string;

  onChange: (
    value:
      string
  ) => void;

  type?:
    string;

  placeholder?:
    string;
}) => {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">
        {
          label
        }
      </span>

      <input
        type={
          type
        }
        value={
          value
        }
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      />
    </label>
  );
};

const DetailItem = ({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) => {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">
        {
          label
        }
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-800 dark:text-gray-200">
        {
          value
        }
      </p>
    </div>
  );
};

const CustomerAvatar = ({
  name,
  email,
  avatarUrl,
  large = false,
}: {
  name:
    string;

  email:
    string;

  avatarUrl:
    string;

  large?:
    boolean;
}) => {
  const [
    imageFailed,
    setImageFailed,
  ] =
    useState(false);

  useEffect(
    () => {
      setImageFailed(
        false
      );
    },
    [
      avatarUrl,
    ]
  );

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-orange-100 to-purple-100 font-bold text-purple-700 dark:from-orange-500/20 dark:to-purple-500/20 dark:text-purple-300 ${
        large
          ? "h-14 w-14 rounded-2xl text-base"
          : "h-11 w-11 rounded-xl text-sm"
      }`}
    >
      <span>
        {getInitials(
          name,
          email
        )}
      </span>

      {avatarUrl &&
        !imageFailed && (
          <img
            src={
              avatarUrl
            }
            alt={
              name ||
              "Customer avatar"
            }
            className="absolute inset-0 h-full w-full object-cover"
            onError={() =>
              setImageFailed(
                true
              )
            }
          />
        )}
    </div>
  );
};

const VerificationItem = ({
  verified,
  label,
}: {
  verified:
    boolean;

  label:
    string;
}) => {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs ${
        verified
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-gray-400 dark:text-gray-500"
      }`}
    >
      {verified ? (
        <CheckCircle2
          size={13}
        />
      ) : (
        <ShieldX
          size={13}
        />
      )}

      <span>
        {label}{" "}
        {verified
          ? "Verified"
          : "Unverified"}
      </span>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  iconClass,
}: {
  title:
    string;

  value:
    number;

  icon:
    ReactNode;

  iconClass:
    string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {
              title
            }
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {
              value
            }
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {
            icon
          }
        </div>
      </div>
    </div>
  );
};

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
      {
        children
      }
    </th>
  );
};

const CustomerSkeleton =
  () => {
    return (
      <tr>
        <td
          colSpan={8}
          className="px-5 py-4 sm:px-6"
        >
          <div className="flex animate-pulse items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-800" />

            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-800" />

              <div className="h-3 w-64 rounded bg-gray-100 dark:bg-gray-800/70" />
            </div>
          </div>
        </td>
      </tr>
    );
  };

export default CustomersList;