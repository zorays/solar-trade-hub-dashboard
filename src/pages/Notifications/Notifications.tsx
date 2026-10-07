import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Bell,
  Check,
  CheckCheck,
  CircleAlert,
  FileCheck2,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  hasUserPermission,
} from "../../services/auth.service";

import {
  clearReadNotifications,
  deleteNotification,
  getNotificationErrorMessage,
  getNotifications,
  getNotificationSummary,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type DashboardNotification,
  type NotificationSummary,
  type NotificationType,
} from "../../services/notification/notification.service";

/* =========================================================
   HELPERS
========================================================= */

const formatDateTime = (
  value: string
) => {
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
  ).format(
    date
  );
};

const getNotificationIcon = (
  type: NotificationType
) => {
  switch (type) {
    case "Order":
      return (
        <ShoppingCart
          size={18}
        />
      );

    case "Supplier":
      return (
        <Store
          size={18}
        />
      );

    case "Installer":
      return (
        <Wrench
          size={18}
        />
      );

    case "Tender":
      return (
        <FileCheck2
          size={18}
        />
      );

    case "Product":
      return (
        <Package
          size={18}
        />
      );

    case "User":
      return (
        <UserPlus
          size={18}
        />
      );

    case "System":
      return (
        <ShieldCheck
          size={18}
        />
      );
  }
};

const getNotificationClasses = (
  type: NotificationType
) => {
  switch (type) {
    case "Order":
      return "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400";

    case "Supplier":
      return "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";

    case "Installer":
      return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";

    case "Tender":
      return "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400";

    case "Product":
      return "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400";

    case "User":
      return "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";

    case "System":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  }
};

/* =========================================================
   PAGE
========================================================= */

const Notifications = () => {
  const {
    user,
  } =
    useAuth();

  /* =======================================================
     AUTHORIZATION
  ======================================================= */

  const canManageNotifications =
    hasUserPermission(
      user,
      "notifications.manage"
    );

  /* =======================================================
     DATA
  ======================================================= */

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      DashboardNotification[]
    >(
      []
    );

  const [
    summary,
    setSummary,
  ] =
    useState<NotificationSummary>({
      total:
        0,

      unread:
        0,

      read:
        0,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState(
      ""
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    success,
    setSuccess,
  ] =
    useState(
      ""
    );

  /* =======================================================
     FILTERS
  ======================================================= */

  const [
    searchInput,
    setSearchInput,
  ] =
    useState(
      ""
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<
      NotificationType | ""
    >(
      ""
    );

  const [
    unreadOnly,
    setUnreadOnly,
  ] =
    useState(
      false
    );

  /* =======================================================
     PAGINATION
  ======================================================= */

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const [
    total,
    setTotal,
  ] =
    useState(
      0
    );

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(
      0
    );

  const PAGE_LIMIT =
    20;

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(
    () => {
      const timeout =
        window.setTimeout(
          () => {
            setSearch(
              searchInput.trim()
            );

            setPage(
              1
            );
          },
          300
        );

      return () => {
        window.clearTimeout(
          timeout
        );
      };
    },
    [
      searchInput,
    ]
  );

  /* =======================================================
     LOAD SUMMARY
  ======================================================= */

  const loadSummary =
    useCallback(
      async () => {
        try {
          const result =
            await getNotificationSummary();

          setSummary(
            result
          );
        } catch (
          summaryError
        ) {
          console.error(
            "Failed to load notification summary:",
            summaryError
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD NOTIFICATIONS
  ======================================================= */

  const loadNotifications =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const result =
            await getNotifications({
              page,

              limit:
                PAGE_LIMIT,

              search:
                search ||
                undefined,

              type:
                typeFilter,

              unreadOnly,
            });

          setNotifications(
            result.notifications
          );

          setTotal(
            result.total
          );

          setTotalPages(
            result.totalPages
          );
        } catch (
          loadError
        ) {
          setNotifications(
            []
          );

          setTotal(
            0
          );

          setTotalPages(
            0
          );

          setError(
            getNotificationErrorMessage(
              loadError
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        page,
        search,
        typeFilter,
        unreadOnly,
      ]
    );

  /* =======================================================
     INITIAL / FILTER LOAD
  ======================================================= */

  useEffect(
    () => {
      void loadNotifications();
    },
    [
      loadNotifications,
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

  /* =======================================================
     TYPE FILTER CHANGE
  ======================================================= */

  const handleTypeFilterChange =
    (
      value:
        NotificationType | ""
    ) => {
      setTypeFilter(
        value
      );

      setPage(
        1
      );
    };

  /* =======================================================
     UNREAD FILTER
  ======================================================= */

  const handleUnreadToggle =
    () => {
      setUnreadOnly(
        (
          current
        ) =>
          !current
      );

      setPage(
        1
      );
    };

  /* =======================================================
     MARK SINGLE READ
  ======================================================= */

  const handleMarkAsRead =
    async (
      notificationId:
        string
    ) => {
      try {
        setActionLoading(
          `read-${notificationId}`
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        const updated =
          await markNotificationAsRead(
            notificationId
          );

        setNotifications(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                updated.id
                  ? updated
                  : item
            )
        );

        await loadSummary();

        /*
         * If unread-only is active, remove newly read item
         * from current result by reloading server list.
         */

        if (
          unreadOnly
        ) {
          await loadNotifications();
        }
      } catch (
        actionError
      ) {
        setError(
          getNotificationErrorMessage(
            actionError
          )
        );
      } finally {
        setActionLoading(
          ""
        );
      }
    };

  /* =======================================================
     MARK ALL READ
  ======================================================= */

  const handleMarkAllAsRead =
    async () => {
      try {
        setActionLoading(
          "read-all"
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        const result =
          await markAllNotificationsAsRead();

        await Promise.all([
          loadNotifications(),
          loadSummary(),
        ]);

        setSuccess(
          result.modifiedCount >
            0
            ? `${result.modifiedCount} notification${
                result.modifiedCount ===
                1
                  ? ""
                  : "s"
              } marked as read.`
            : "No unread notifications found."
        );
      } catch (
        actionError
      ) {
        setError(
          getNotificationErrorMessage(
            actionError
          )
        );
      } finally {
        setActionLoading(
          ""
        );
      }
    };

  /* =======================================================
     DELETE SINGLE
  ======================================================= */

  const handleDeleteNotification =
    async (
      notificationId:
        string
    ) => {
      if (
        !canManageNotifications
      ) {
        return;
      }

      try {
        setActionLoading(
          `delete-${notificationId}`
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        await deleteNotification(
          notificationId
        );

        await Promise.all([
          loadNotifications(),
          loadSummary(),
        ]);

        setSuccess(
          "Notification deleted successfully."
        );
      } catch (
        actionError
      ) {
        setError(
          getNotificationErrorMessage(
            actionError
          )
        );
      } finally {
        setActionLoading(
          ""
        );
      }
    };

  /* =======================================================
     CLEAR READ
  ======================================================= */

  const handleClearRead =
    async () => {
      if (
        !canManageNotifications
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete all read notifications?"
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setActionLoading(
          "clear-read"
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        const result =
          await clearReadNotifications();

        /*
         * If current page becomes invalid after deletion,
         * return to first page.
         */

        if (
          page >
          1
        ) {
          setPage(
            1
          );
        } else {
          await loadNotifications();
        }

        await loadSummary();

        setSuccess(
          result.deletedCount >
            0
            ? `${result.deletedCount} read notification${
                result.deletedCount ===
                1
                  ? ""
                  : "s"
              } deleted.`
            : "No read notifications found."
        );
      } catch (
        actionError
      ) {
        setError(
          getNotificationErrorMessage(
            actionError
          )
        );
      } finally {
        setActionLoading(
          ""
        );
      }
    };

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    async () => {
      setSuccess(
        ""
      );

      await Promise.all([
        loadNotifications(),
        loadSummary(),
      ]);
    };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters =
    () => {
      setSearchInput(
        ""
      );

      setSearch(
        ""
      );

      setTypeFilter(
        ""
      );

      setUnreadOnly(
        false
      );

      setPage(
        1
      );
    };

  const hasFilters =
    Boolean(
      search
    ) ||
    Boolean(
      typeFilter
    ) ||
    unreadOnly;

  return (
    <>
      <PageMeta
        title="Notifications | Solar Trade Hub"
        description="Manage Solar Trade Hub administrative notifications."
      />

      <PageBreadcrumb
        pageTitle="Notifications"
      />

      <div className="space-y-5">
        {/* =================================================
            HEADER
        ================================================== */}

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

          <div className="pointer-events-none absolute right-12 top-4 h-32 w-32 rounded-full bg-purple-500/5" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                <Bell
                  size={22}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                  System Activity
                </p>

                <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                  Notifications
                </h1>

                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Review important
                  marketplace activity,
                  approvals, orders and
                  system events.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  void handleRefresh();
                }}
                disabled={
                  loading
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <RefreshCw
                  size={15}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              {canManageNotifications && (
                <button
                  type="button"
                  onClick={() => {
                    void handleClearRead();
                  }}
                  disabled={
                    summary.read ===
                      0 ||
                    actionLoading ===
                      "clear-read"
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  {actionLoading ===
                  "clear-read" ? (
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2
                      size={15}
                    />
                  )}

                  Clear Read
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  void handleMarkAllAsRead();
                }}
                disabled={
                  summary.unread ===
                    0 ||
                  actionLoading ===
                    "read-all"
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ===
                "read-all" ? (
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCheck
                    size={16}
                  />
                )}

                Mark All Read
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            ALERTS
        ================================================== */}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <TriangleAlert
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span>
              {error}
            </span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
            <Check
              size={16}
            />

            {success}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Notifications"
            value={
              summary.total
            }
            icon={
              <Bell
                size={18}
              />
            }
            iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />

          <SummaryCard
            title="Unread"
            value={
              summary.unread
            }
            icon={
              <CircleAlert
                size={18}
              />
            }
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
          />

          <SummaryCard
            title="Read"
            value={
              summary.read
            }
            icon={
              <CheckCheck
                size={18}
              />
            }
            iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />
        </div>

        {/* =================================================
            FILTERS
        ================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50 sm:p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_auto_auto]">
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
                placeholder="Search notifications..."
                className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white"
              />
            </div>

            <select
              value={
                typeFilter
              }
              onChange={(
                event
              ) =>
                handleTypeFilterChange(
                  event.target
                    .value as
                    | NotificationType
                    | ""
                )
              }
              className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-300"
            >
              <option value="">
                All Types
              </option>

              <option value="Order">
                Orders
              </option>

              <option value="Supplier">
                Suppliers
              </option>

              <option value="Installer">
                Installers
              </option>

              <option value="Tender">
                Tenders
              </option>

              <option value="Product">
                Products
              </option>

              <option value="User">
                Users
              </option>

              <option value="System">
                System
              </option>
            </select>

            <button
              type="button"
              onClick={
                handleUnreadToggle
              }
              className={`h-11 rounded-xl border px-4 text-sm font-semibold transition ${
                unreadOnly
                  ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-300"
              }`}
            >
              Unread Only
            </button>

            <button
              type="button"
              disabled={
                !hasFilters
              }
              onClick={
                clearFilters
              }
              className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-400"
            >
              Clear
            </button>
          </div>
        </div>

        {/* =================================================
            NOTIFICATION LIST
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {total} notification
                  {total ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {loading ? (
            <div className="space-y-0 divide-y divide-gray-200 dark:divide-gray-800">
              {Array.from({
                length: 4,
              }).map(
                (
                  _,
                  index
                ) => (
                  <NotificationSkeleton
                    key={
                      index
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map(
                (
                  notification
                ) => {
                  const readAction =
                    `read-${notification.id}`;

                  const deleteAction =
                    `delete-${notification.id}`;

                  return (
                    <div
                      key={
                        notification.id
                      }
                      className={`p-5 transition sm:p-6 ${
                        notification.read
                          ? "bg-white dark:bg-transparent"
                          : "bg-purple-50/30 dark:bg-purple-500/[0.03]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        {/* ICON */}

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getNotificationClasses(
                            notification.type
                          )}`}
                        >
                          {getNotificationIcon(
                            notification.type
                          )}
                        </div>

                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {
                                  notification.title
                                }
                              </h3>

                              {!notification.read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                              )}
                            </div>

                            <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                              {formatDateTime(
                                notification.createdAt
                              )}
                            </span>
                          </div>

                          <p className="mt-1.5 max-w-4xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                            {
                              notification.message
                            }
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getNotificationClasses(
                                notification.type
                              )}`}
                            >
                              {
                                notification.type
                              }
                            </span>

                            {!notification.read && (
                              <button
                                type="button"
                                disabled={
                                  actionLoading ===
                                  readAction
                                }
                                onClick={() => {
                                  void handleMarkAsRead(
                                    notification.id
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-purple-600 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-purple-400 dark:hover:bg-purple-500/10"
                              >
                                {actionLoading ===
                                readAction ? (
                                  <RefreshCw
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check
                                    size={13}
                                  />
                                )}

                                Mark Read
                              </button>
                            )}

                            {canManageNotifications && (
                              <button
                                type="button"
                                disabled={
                                  actionLoading ===
                                  deleteAction
                                }
                                onClick={() => {
                                  void handleDeleteNotification(
                                    notification.id
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
                              >
                                {actionLoading ===
                                deleteAction ? (
                                  <RefreshCw
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={13}
                                  />
                                )}

                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              {notifications.length ===
                0 && (
                <div className="px-6 py-16 text-center">
                  <Bell
                    size={36}
                    className="mx-auto text-gray-300 dark:text-gray-600"
                  />

                  <p className="mt-3 font-semibold text-gray-700 dark:text-gray-300">
                    No notifications found
                  </p>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {hasFilters
                      ? "Try changing the current filters."
                      : "There are no notifications for this account yet."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              PAGINATION
          ================================================== */}

          {!loading &&
            totalPages >
              1 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Page {page} of{" "}
                  {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      page <=
                      1
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
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-400"
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
                            current +
                              1,
                            totalPages
                          )
                      )
                    }
                    className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-400"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* =================================================
            STATUS NOTE
        ================================================== */}

        <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/50 p-4 dark:border-purple-500/10 dark:bg-purple-500/5">
          <Users
            size={17}
            className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400"
          />

          <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
            Notification storage and
            read/delete state are now
            connected to the backend.
            Automatic marketplace event
            notifications will appear
            here as their respective
            workflows are connected.
          </p>
        </div>
      </div>
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
  title:
    string;

  value:
    number;

  icon:
    React.ReactNode;

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
            {value}
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
   NOTIFICATION SKELETON
========================================================= */

const NotificationSkeleton =
  () => {
    return (
      <div className="p-5 sm:p-6">
        <div className="flex animate-pulse gap-4">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-800" />

          <div className="flex-1 space-y-3">
            <div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-800" />

            <div className="h-3 w-full max-w-2xl rounded bg-gray-100 dark:bg-gray-800/70" />

            <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800/70" />
          </div>
        </div>
      </div>
    );
  };

export default Notifications;