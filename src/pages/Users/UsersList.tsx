import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Link,
} from "react-router";

import {
  Ban,
  CalendarDays,
  CheckCircle2,
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
  UserRound,
  Users,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  Modal,
} from "../../components/ui/modal";

import Button from "../../components/ui/button/Button";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  buildUserDashboardSummary,
  deleteUser,
  getUserAvatarUrl,
  getUsers,
  type DashboardUser,
  type UserListParams,
  type UserStatus,
} from "../../services/user/user.service";

/* =========================================================
   TYPES
========================================================= */

type VerificationFilter =
  | "all"
  | "verified"
  | "unverified";

type RoleOption = {
  slug: string;
  name: string;
};

/* =========================================================
   HELPERS
========================================================= */

const formatRoleName = (
  role: string
): string => {
  if (
    !role ||
    role === "user"
  ) {
    return "Unassigned";
  }

  return role
    .replace(
      /[-_]/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        letter
      ) =>
        letter.toUpperCase()
    );
};

const formatDate = (
  value: string
): string => {
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

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    date
  );
};

const getInitials = (
  name: string,
  email: string
): string => {
  const source =
    name.trim() ||
    email.trim() ||
    "U";

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
  switch (
    status
  ) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400";

    case "inactive":
      return "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400";

    case "blocked":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";
  }
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

/* =========================================================
   PAGE
========================================================= */

const UsersList = () => {
  const {
    user:
      authenticatedUser,
  } =
    useAuth();

  const [
    usersList,
    setUsersList,
  ] =
    useState<
      DashboardUser[]
    >([]);

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
    deletingUserId,
    setDeletingUserId,
  ] =
    useState<
      string |
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

  /* =======================================================
     FILTERS
  ======================================================= */

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
    roleFilter,
    setRoleFilter,
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
    roleOptions,
    setRoleOptions,
  ] =
    useState<
      RoleOption[]
    >([]);

  const requestIdRef =
    useRef(0);

  const authenticatedUserId =
    authenticatedUser?._id ||
    authenticatedUser?.id ||
    "";

  /* =======================================================
     SEARCH
  ======================================================= */

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

  /* =======================================================
     LOAD DASHBOARD USERS ONLY
  ======================================================= */

  const loadUsers =
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

          /*
           * IMPORTANT:
           * Customers must never appear on this page.
           */
          accountType:
            "dashboard",

          role:
            roleFilter,

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

          /*
           * Defensive frontend guard as well.
           * Even if API filtering is changed later,
           * Customers must not leak into Users & Access.
           */
          const dashboardUsers =
            result.users.filter(
              (
                user
              ) =>
                user.accountType ===
                "dashboard"
            );

          setUsersList(
            dashboardUsers
          );

          setTotalCount(
            dashboardUsers.length
          );

          setRoleOptions(
            (
              currentRoles
            ) => {
              const roleMap =
                new Map<
                  string,
                  string
                >();

              currentRoles.forEach(
                (
                  role
                ) => {
                  roleMap.set(
                    role.slug,
                    role.name
                  );
                }
              );

              dashboardUsers.forEach(
                (
                  user
                ) => {
                  const slug =
                    user.role
                      .trim();

                  if (
                    !slug
                  ) {
                    return;
                  }

                  const name =
                    slug ===
                    "user"
                      ? "Unassigned"
                      : user
                            .roleDetails
                            ?.name
                            ?.trim() ||
                        formatRoleName(
                          slug
                        );

                  roleMap.set(
                    slug,
                    name
                  );
                }
              );

              return Array.from(
                roleMap.entries()
              )
                .map(
                  ([
                    slug,
                    name,
                  ]) => ({
                    slug,
                    name,
                  })
                )
                .sort(
                  (
                    a,
                    b
                  ) =>
                    a.name.localeCompare(
                      b.name
                    )
                );
            }
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

          setUsersList(
            []
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
        roleFilter,
        statusFilter,
        verificationFilter,
      ]
    );

  useEffect(
    () => {
      void loadUsers();
    },
    [
      loadUsers,
    ]
  );

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary =
    useMemo(
      () =>
        buildUserDashboardSummary(
          usersList
        ),
      [
        usersList,
      ]
    );

  /* =======================================================
     FILTER STATE
  ======================================================= */

  const hasFilters =
    Boolean(
      search
    ) ||
    Boolean(
      roleFilter
    ) ||
    Boolean(
      statusFilter
    ) ||
    verificationFilter !==
      "all";

  const resetFilters =
    () => {
      setSearchInput(
        ""
      );

      setSearch(
        ""
      );

      setRoleFilter(
        ""
      );

      setStatusFilter(
        ""
      );

      setVerificationFilter(
        "all"
      );
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const requestDelete =
    (
      user:
        DashboardUser
    ) => {
      const userId =
        user.id ||
        user._id;

      if (
        !userId
      ) {
        setActionError(
          "User ID is missing."
        );

        return;
      }

      if (
        userId ===
        authenticatedUserId
      ) {
        setActionError(
          "You cannot delete your currently signed-in account."
        );

        return;
      }

      setActionError(
        ""
      );

      setDeleteCandidate(
        user
      );
    };

  const closeDeleteModal =
    () => {
      if (
        deletingUserId
      ) {
        return;
      }

      setDeleteCandidate(
        null
      );
    };

  const confirmDeleteUser =
    async () => {
      if (
        !deleteCandidate
      ) {
        return;
      }

      const userId =
        deleteCandidate.id ||
        deleteCandidate._id;

      if (
        !userId
      ) {
        setActionError(
          "User ID is missing."
        );

        setDeleteCandidate(
          null
        );

        return;
      }

      try {
        setDeletingUserId(
          userId
        );

        setActionError(
          ""
        );

        await deleteUser(
          userId
        );

        setUsersList(
          (
            currentUsers
          ) =>
            currentUsers.filter(
              (
                currentUser
              ) =>
                (
                  currentUser.id ||
                  currentUser._id
                ) !==
                userId
            )
        );

        setTotalCount(
          (
            currentCount
          ) =>
            Math.max(
              0,
              currentCount -
                1
            )
        );

        setDeleteCandidate(
          null
        );
      } catch (
        deleteError
      ) {
        setActionError(
          getErrorMessage(
            deleteError
          )
        );
      } finally {
        setDeletingUserId(
          null
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Users & Access | Solar Trade Hub Dashboard"
        description="Manage Solar Trade Hub dashboard users, roles and account access."
      />

      <PageBreadcrumb
        pageTitle="Users & Access"
      />

      <div className="space-y-6">
        {/* HEADER */}

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
                    Administration
                  </p>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Users & Access
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Manage dashboard administrators, staff roles,
                    verification and account access.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  void loadUsers();
                }}
                disabled={
                  loading
                }
                className="group inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-300 hover:w-[100px] hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-purple-500/30 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
              >
                <RefreshCw
                  size={16}
                  className={`shrink-0 ${
                    loading
                      ? "animate-spin"
                      : ""
                  }`}
                />

                <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[55px] group-hover:opacity-100">
                  Refresh
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Dashboard Users"
            value={
              hasFilters
                ? totalCount
                : summary.totalUsers
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
              summary.activeUsers
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
              summary.verifiedUsers
            }
            icon={
              <ShieldCheck
                size={20}
              />
            }
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
          />

          <StatCard
            title="Unassigned"
            value={
              summary.unassignedUsers
            }
            icon={
              <UserRound
                size={20}
              />
            }
            iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          />

          <StatCard
            title="Blocked"
            value={
              summary.blockedUsers
            }
            icon={
              <Ban
                size={20}
              />
            }
            iconClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          />
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* FILTERS */}

          <div className="border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Registered Dashboard Users
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {loading
                      ? "Loading users..."
                      : `${totalCount} user${
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
                    placeholder="Search name or email..."
                    className="h-11 w-full rounded-xl border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <select
                  value={
                    roleFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setRoleFilter(
                      event.target.value
                    )
                  }
                  className="h-11 rounded-xl border border-gray-300 bg-transparent px-3 text-sm text-gray-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="">
                    All Roles
                  </option>

                  {roleOptions.map(
                    (
                      role
                    ) => (
                      <option
                        key={
                          role.slug
                        }
                        value={
                          role.slug
                        }
                      >
                        {
                          role.name
                        }
                      </option>
                    )
                  )}
                </select>

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
                    All Verification
                  </option>

                  <option value="verified">
                    Verified
                  </option>

                  <option value="unverified">
                    Unverified
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

          {/* LOAD ERROR */}

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <span>
                  {
                    error
                  }
                </span>

                <button
                  type="button"
                  onClick={() => {
                    void loadUsers();
                  }}
                  className="shrink-0 font-semibold underline underline-offset-2"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* ACTION ERROR */}

          {actionError && (
            <div className="border-b border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 sm:px-6">
              {
                actionError
              }
            </div>
          )}

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <TableHeading>
                    User
                  </TableHeading>

                  <TableHeading>
                    Contact
                  </TableHeading>

                  <TableHeading>
                    Role
                  </TableHeading>

                  <TableHeading>
                    Verification
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
                      <UserSkeleton
                        key={
                          index
                        }
                      />
                    )
                  )}

                {!loading &&
                  usersList.map(
                    (
                      user
                    ) => {
                      const userId =
                        user.id ||
                        user._id;

                      return (
                        <UserRow
                          key={
                            userId
                          }
                          user={
                            user
                          }
                          isCurrentUser={
                            userId ===
                            authenticatedUserId
                          }
                          deleting={
                            deletingUserId ===
                            userId
                          }
                          onDelete={
                            requestDelete
                          }
                        />
                      );
                    }
                  )}

                {!loading &&
                  !error &&
                  usersList.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center"
                      >
                        <Users
                          size={36}
                          className="mx-auto text-gray-300 dark:text-gray-600"
                        />

                        <p className="mt-4 font-medium text-gray-700 dark:text-gray-300">
                          No dashboard users found
                        </p>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {hasFilters
                            ? "Try changing your search or filters."
                            : "No dashboard accounts are currently available."}
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

      {/* DELETE CONFIRMATION */}

      <Modal
        isOpen={
          Boolean(
            deleteCandidate
          )
        }
        onClose={
          closeDeleteModal
        }
        className="m-4 max-w-[480px]"
      >
        <div className="relative w-full max-w-[480px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          <div className="px-6 pb-5 pt-7 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Trash2
                size={20}
              />
            </div>

            <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
              Delete Dashboard User?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              You are about to permanently delete{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {deleteCandidate?.name ||
                  deleteCandidate?.email ||
                  "this user"}
              </span>
              . This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
            <Button
              size="sm"
              variant="outline"
              disabled={
                Boolean(
                  deletingUserId
                )
              }
              onClick={
                closeDeleteModal
              }
            >
              Cancel
            </Button>

            <button
              type="button"
              disabled={
                Boolean(
                  deletingUserId
                )
              }
              onClick={() => {
                void confirmDeleteUser();
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingUserId ? (
                <RefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Trash2
                  size={15}
                />
              )}

              {deletingUserId
                ? "Deleting..."
                : "Delete User"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* =========================================================
   USER ROW
========================================================= */

const UserRow = ({
  user,
  isCurrentUser,
  deleting,
  onDelete,
}: {
  user:
    DashboardUser;

  isCurrentUser:
    boolean;

  deleting:
    boolean;

  onDelete: (
    user:
      DashboardUser
  ) => void;
}) => {
  const avatarUrl =
    getUserAvatarUrl(
      user.avatar
    );

  const roleName =
    user.role ===
    "user"
      ? "Unassigned"
      : user
            .roleDetails
            ?.name ||
        formatRoleName(
          user.role
        );

  const userId =
    user.id ||
    user._id;

  return (
    <tr className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
      {/* USER */}

      <td className="px-5 py-5 align-top sm:px-6">
        <div className="flex min-w-[220px] items-center gap-3">
          <UserAvatar
            name={
              user.name
            }
            email={
              user.email
            }
            avatarUrl={
              avatarUrl
            }
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {user.name ||
                  "Unnamed User"}
              </p>

              {isCurrentUser && (
                <span className="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                  You
                </span>
              )}
            </div>

            <p className="mt-1 max-w-[190px] truncate text-xs text-gray-500 dark:text-gray-400">
              {user.email ||
                "No email"}
            </p>
          </div>
        </div>
      </td>

      {/* CONTACT */}

      <td className="px-5 py-5 align-top">
        <div className="min-w-[185px] space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Mail
              size={13}
              className="shrink-0 text-gray-400"
            />

            <span className="max-w-[170px] truncate">
              {user.email ||
                "—"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Phone
              size={13}
              className="shrink-0 text-gray-400"
            />

            <span>
              {user.phoneE164 ||
                (
                  user.phone
                    ? `${user.countryCode || ""}${user.phone}`
                    : "—"
                )}
            </span>
          </div>
        </div>
      </td>

      {/* ROLE */}

      <td className="px-5 py-5 align-top">
        <div className="min-w-[125px]">
          <span
            className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${
              user.role ===
              "user"
                ? "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                : "border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
            }`}
          >
            {
              roleName
            }
          </span>

          {user
            .roleDetails
            ?.isSystemRole && (
            <p className="mt-1.5 text-[11px] text-gray-400">
              System role
            </p>
          )}
        </div>
      </td>

      {/* VERIFICATION */}

      <td className="px-5 py-5 align-top">
        <div className="min-w-[145px] space-y-2">
          <VerificationItem
            verified={
              user.isVerified
            }
            label="Email"
          />

          {user.phone ||
          user.phoneE164 ? (
            <VerificationItem
              verified={
                user.isPhoneVerified
              }
              label="Phone"
            />
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Phone
                size={13}
              />

              <span>
                No phone
              </span>
            </div>
          )}
        </div>
      </td>

      {/* STATUS */}

      <td className="px-5 py-5 align-top">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClasses(
            user.status
          )}`}
        >
          {
            user.status
          }
        </span>
      </td>

      {/* JOINED */}

      <td className="px-5 py-5 align-top">
        <div className="flex min-w-[125px] items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <CalendarDays
            size={14}
          />

          {formatDate(
            user.createdAt
          )}
        </div>
      </td>

      {/* ACTIONS */}

      <td className="px-5 py-5 text-right align-top sm:px-6">
        <div className="flex min-w-[150px] items-center justify-end gap-2">
          <ActionLink
            to={`/users/${userId}`}
            label="View"
            icon={
              <Eye
                size={15}
              />
            }
            theme="purple"
          />

          <ActionLink
            to={`/users/${userId}/edit`}
            label="Edit"
            icon={
              <Pencil
                size={15}
              />
            }
            theme="orange"
          />

          <button
            type="button"
            title={
              isCurrentUser
                ? "Current account cannot be deleted"
                : "Delete user"
            }
            aria-label="Delete user"
            disabled={
              deleting ||
              isCurrentUser
            }
            onClick={() =>
              onDelete(
                user
              )
            }
            className="group flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-red-200 bg-red-50 text-red-600 transition-all duration-300 hover:w-[82px] hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-35 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
          >
            {deleting ? (
              <RefreshCw
                size={14}
                className="shrink-0 animate-spin"
              />
            ) : (
              <Trash2
                size={14}
                className="shrink-0"
              />
            )}

            {!isCurrentUser && (
              <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold opacity-0 transition-all duration-300 group-hover:ml-1.5 group-hover:max-w-[45px] group-hover:opacity-100">
                Delete
              </span>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
};

/* =========================================================
   ACTION LINK
========================================================= */

const ActionLink = ({
  to,
  label,
  icon,
  theme,
}: {
  to: string;
  label: string;
  icon: ReactNode;

  theme:
    | "purple"
    | "orange";
}) => {
  const themeClass =
    theme ===
    "purple"
      ? "border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20"
      : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20";

  return (
    <Link
      to={
        to
      }
      title={
        label
      }
      aria-label={
        label
      }
      className={`group flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition-all duration-300 hover:w-[72px] ${themeClass}`}
    >
      <span className="shrink-0">
        {
          icon
        }
      </span>

      <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold opacity-0 transition-all duration-300 group-hover:ml-1.5 group-hover:max-w-[36px] group-hover:opacity-100">
        {
          label
        }
      </span>
    </Link>
  );
};

/* =========================================================
   AVATAR
========================================================= */

const UserAvatar = ({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string;
  avatarUrl: string;
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
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-100 to-purple-100 text-sm font-bold text-purple-700 dark:from-orange-500/20 dark:to-purple-500/20 dark:text-purple-300">
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
              "User avatar"
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

/* =========================================================
   VERIFICATION
========================================================= */

const VerificationItem = ({
  verified,
  label,
}: {
  verified: boolean;
  label: string;
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

/* =========================================================
   STAT
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
      {
        children
      }
    </th>
  );
};

/* =========================================================
   SKELETON
========================================================= */

const UserSkeleton =
  () => {
    return (
      <tr>
        <td
          colSpan={7}
          className="px-5 py-4 sm:px-6"
        >
          <div className="flex animate-pulse items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-800" />

            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-800" />

              <div className="h-3 w-64 rounded bg-gray-100 dark:bg-gray-800/70" />
            </div>

            <div className="hidden h-7 w-24 rounded bg-gray-100 dark:bg-gray-800/70 lg:block" />

            <div className="hidden h-7 w-20 rounded bg-gray-100 dark:bg-gray-800/70 lg:block" />
          </div>
        </td>
      </tr>
    );
  };

export default UsersList;