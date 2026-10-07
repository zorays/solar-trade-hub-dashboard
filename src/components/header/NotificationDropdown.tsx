import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Bell,
  CheckCheck,
  FileCheck2,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Store,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router";

import {
  Dropdown,
} from "../ui/dropdown/Dropdown";

import {
  DropdownItem,
} from "../ui/dropdown/DropdownItem";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  hasUserPermission,
} from "../../services/auth.service";

import {
  getNotificationErrorMessage,
  getNotifications,
  getNotificationSummary,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type DashboardNotification,
  type NotificationType,
} from "../../services/notification/notification.service";

/* =========================================================
   TIME FORMATTER
========================================================= */

const formatRelativeTime = (
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

  const diff =
    Date.now() -
    date.getTime();

  const seconds =
    Math.floor(
      diff /
        1000
    );

  if (
    seconds <
    60
  ) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      seconds /
        60
    );

  if (
    minutes <
    60
  ) {
    return `${minutes} min${
      minutes ===
      1
        ? ""
        : "s"
    } ago`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  if (
    hours <
    24
  ) {
    return `${hours} hr${
      hours ===
      1
        ? ""
        : "s"
    } ago`;
  }

  const days =
    Math.floor(
      hours /
        24
    );

  if (
    days ===
    1
  ) {
    return "Yesterday";
  }

  if (
    days <
    7
  ) {
    return `${days} days ago`;
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
    }
  ).format(
    date
  );
};

/* =========================================================
   NOTIFICATION ICON
========================================================= */

const getNotificationIcon = (
  type: NotificationType
) => {
  switch (type) {
    case "Order":
      return (
        <ShoppingCart
          size={17}
        />
      );

    case "Supplier":
      return (
        <Store
          size={17}
        />
      );

    case "Installer":
      return (
        <Wrench
          size={17}
        />
      );

    case "Tender":
      return (
        <FileCheck2
          size={17}
        />
      );

    case "Product":
      return (
        <Package
          size={17}
        />
      );

    case "User":
      return (
        <UserPlus
          size={17}
        />
      );

    case "System":
      return (
        <ShieldCheck
          size={17}
        />
      );
  }
};

/* =========================================================
   ICON STYLE
========================================================= */

const getIconClass = (
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
      return "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400";
  }
};

/* =========================================================
   NOTIFICATION DROPDOWN
========================================================= */

export default function NotificationDropdown() {
  const {
    user,
  } =
    useAuth();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(
      false
    );

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
    unreadCount,
    setUnreadCount,
  ] =
    useState(
      0
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    markingAll,
    setMarkingAll,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  /* =======================================================
     AUTHORIZATION
  ======================================================= */

  const canViewNotifications =
    hasUserPermission(
      user,
      "notifications.view"
    ) ||
    hasUserPermission(
      user,
      "notifications.manage"
    );

  /* =======================================================
     LOAD DROPDOWN DATA

     Top 6 newest notifications + real unread count.
  ======================================================= */

  const loadNotifications =
    useCallback(
      async () => {
        if (
          !canViewNotifications
        ) {
          return;
        }

        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const [
            listResult,
            summaryResult,
          ] =
            await Promise.all([
              getNotifications({
                page:
                  1,

                limit:
                  6,
              }),

              getNotificationSummary(),
            ]);

          setNotifications(
            listResult.notifications
          );

          setUnreadCount(
            summaryResult.unread
          );
        } catch (
          loadError
        ) {
          console.error(
            "Failed to load notification dropdown:",
            loadError
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
        canViewNotifications,
      ]
    );

  /* =======================================================
     INITIAL LOAD

     Needed so bell badge is available even before dropdown
     is opened.
  ======================================================= */

  useEffect(
    () => {
      if (
        canViewNotifications
      ) {
        void loadNotifications();
      }
    },
    [
      canViewNotifications,
      loadNotifications,
    ]
  );

  /* =======================================================
     DROPDOWN
  ======================================================= */

  const toggleDropdown =
    () => {
      setIsOpen(
        (
          current
        ) => {
          const next =
            !current;

          /*
           * Refresh when dropdown is opened so the list
           * reflects newest backend state.
           */

          if (
            next
          ) {
            void loadNotifications();
          }

          return next;
        }
      );
    };

  const closeDropdown =
    () => {
      setIsOpen(
        false
      );
    };

  /* =======================================================
     MARK SINGLE READ
  ======================================================= */

  const handleMarkAsRead =
    async (
      notification:
        DashboardNotification
    ) => {
      if (
        notification.read
      ) {
        return;
      }

      try {
        const updated =
          await markNotificationAsRead(
            notification.id
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

        setUnreadCount(
          (
            current
          ) =>
            Math.max(
              current -
                1,
              0
            )
        );
      } catch (
        actionError
      ) {
        console.error(
          "Failed to mark notification as read:",
          actionError
        );
      }
    };

  /* =======================================================
     MARK ALL READ
  ======================================================= */

  const handleMarkAllAsRead =
    async () => {
      if (
        unreadCount ===
        0 ||
        markingAll
      ) {
        return;
      }

      try {
        setMarkingAll(
          true
        );

        setError(
          ""
        );

        await markAllNotificationsAsRead();

        setNotifications(
          (
            current
          ) =>
            current.map(
              (
                item
              ) => ({
                ...item,

                read:
                  true,

                readAt:
                  item.readAt ||
                  new Date().toISOString(),
              })
            )
        );

        setUnreadCount(
          0
        );
      } catch (
        actionError
      ) {
        console.error(
          "Failed to mark all notifications as read:",
          actionError
        );

        setError(
          getNotificationErrorMessage(
            actionError
          )
        );
      } finally {
        setMarkingAll(
          false
        );
      }
    };

  /* =======================================================
     OPEN NOTIFICATION

     Read state is persisted to backend.

     Navigation uses actionPath supplied by the backend.

     If no related destination exists, fallback to the full
     Notifications page.
  ======================================================= */

  const handleNotificationClick =
    (
      notification:
        DashboardNotification
    ) => {
      if (
        !notification.read
      ) {
        void handleMarkAsRead(
          notification
        );
      }

      closeDropdown();
    };

  /* =======================================================
     USER WITHOUT NOTIFICATION ACCESS

     Do not make protected notification API calls or expose
     a dead notification control.
  ======================================================= */

  if (
    !canViewNotifications
  ) {
    return null;
  }

  return (
    <div className="relative">
      {/* ===================================================
          BELL BUTTON
      =================================================== */}

      <button
        type="button"
        aria-label="Open notifications"
        aria-expanded={
          isOpen
        }
        onClick={
          toggleDropdown
        }
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        <Bell
          size={19}
        />

        {/* UNREAD BADGE */}

        {unreadCount >
          0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-orange-500 px-1 text-[9px] font-bold leading-none text-white dark:border-gray-900">
            {unreadCount >
            9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* ===================================================
          DROPDOWN
      =================================================== */}

      <Dropdown
        isOpen={
          isOpen
        }
        onClose={
          closeDropdown
        }
        className="absolute -right-[230px] mt-3 flex max-h-[520px] w-[340px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-800 dark:bg-[#182234] sm:w-[380px] lg:right-0"
      >
        {/* BRAND BAR */}

        <div className="h-1 shrink-0 bg-gradient-to-r from-orange-500 to-purple-600" />

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3.5 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                Notifications
              </h5>

              {unreadCount >
                0 && (
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                  {
                    unreadCount
                  }{" "}
                  new
                </span>
              )}
            </div>

            <p className="mt-0.5 text-[11px] text-gray-400">
              Solar Trade Hub activity
            </p>
          </div>

          <button
            type="button"
            onClick={
              closeDropdown
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            <X
              size={17}
            />
          </button>
        </div>

        {/* =================================================
            MARK ALL READ
        ================================================= */}

        {unreadCount >
          0 && (
          <div className="flex shrink-0 justify-end border-b border-gray-100 px-4 py-2 dark:border-gray-800">
            <button
              type="button"
              disabled={
                markingAll
              }
              onClick={() => {
                void handleMarkAllAsRead();
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 transition hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-purple-400"
            >
              {markingAll ? (
                <RefreshCw
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <CheckCheck
                  size={14}
                />
              )}

              {markingAll
                ? "Updating..."
                : "Mark all as read"}
            </button>
          </div>
        )}

        {/* =================================================
            NOTIFICATION LIST
        ================================================= */}

        <ul className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
          {loading ? (
            <>
              {Array.from({
                length:
                  4,
              }).map(
                (
                  _,
                  index
                ) => (
                  <li
                    key={
                      index
                    }
                    className="border-b border-gray-100 px-4 py-3.5 dark:border-gray-800"
                  >
                    <div className="flex animate-pulse gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-800" />

                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-36 rounded bg-gray-200 dark:bg-gray-800" />

                        <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800/70" />

                        <div className="h-2.5 w-16 rounded bg-gray-100 dark:bg-gray-800/70" />
                      </div>
                    </div>
                  </li>
                )
              )}
            </>
          ) : error ? (
            <li className="px-5 py-8 text-center">
              <Bell
                size={28}
                className="mx-auto text-gray-300 dark:text-gray-600"
              />

              <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Unable to load notifications
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  void loadNotifications();
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400"
              >
                <RefreshCw
                  size={13}
                />

                Try Again
              </button>
            </li>
          ) : notifications.length >
            0 ? (
            notifications.map(
              (
                notification
              ) => (
                <li
                  key={
                    notification.id
                  }
                >
                  <DropdownItem
                    tag="a"
                    to={
                      notification.actionPath ||
                      "/notifications"
                    }
                    onItemClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                    className={`group flex gap-3 border-b border-gray-100 px-4 py-3.5 transition dark:border-gray-800 ${
                      notification.read
                        ? "bg-white hover:bg-gray-50 dark:bg-transparent dark:hover:bg-white/[0.03]"
                        : "bg-purple-50/40 hover:bg-purple-50 dark:bg-purple-500/[0.04] dark:hover:bg-purple-500/[0.07]"
                    }`}
                  >
                    {/* ICON */}

                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getIconClass(
                        notification.type
                      )}`}
                    >
                      {getNotificationIcon(
                        notification.type
                      )}
                    </span>

                    {/* CONTENT */}

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                          {
                            notification.title
                          }
                        </span>

                        {!notification.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                        )}
                      </span>

                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                        {
                          notification.message
                        }
                      </span>

                      <span className="mt-1.5 block text-[10px] font-medium text-gray-400 dark:text-gray-500">
                        {formatRelativeTime(
                          notification.createdAt
                        )}
                      </span>
                    </span>
                  </DropdownItem>
                </li>
              )
            )
          ) : (
            <li className="px-5 py-10 text-center">
              <Bell
                size={30}
                className="mx-auto text-gray-300 dark:text-gray-600"
              />

              <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                No notifications yet
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                New marketplace activity will appear here.
              </p>
            </li>
          )}
        </ul>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="shrink-0 border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-[#182234]">
          <Link
            to="/notifications"
            onClick={
              closeDropdown
            }
            className="flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-purple-500/20 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
          >
            View All Notifications
          </Link>
        </div>
      </Dropdown>
    </div>
  );
}