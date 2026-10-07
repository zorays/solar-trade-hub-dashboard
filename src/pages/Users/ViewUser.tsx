import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Link,
  useParams,
} from "react-router";

import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  getUserAvatarUrl,
  getUserById,
  updateUserStatus,
  type DashboardUser,
  type UserStatus,
} from "../../services/user/user.service";

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
      (letter) =>
        letter.toUpperCase()
    );
};

const formatDateTime = (
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
      hour: "2-digit",
      minute: "2-digit",
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
  switch (status) {
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
    typeof error === "object"
  ) {
    const possibleAxiosError =
      error as {
        response?: {
          data?: {
            message?: unknown;
          };
        };

        message?: unknown;
      };

    const apiMessage =
      possibleAxiosError
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
      typeof possibleAxiosError.message ===
        "string" &&
      possibleAxiosError.message.trim()
    ) {
      return possibleAxiosError.message;
    }
  }

  return "Unable to load user.";
};

/* =========================================================
   PAGE
========================================================= */

const ViewUser = () => {
  const {
    id,
  } =
    useParams();

  const {
    user: authenticatedUser,
  } =
    useAuth();

  const [
    user,
    setUser,
  ] =
    useState<DashboardUser | null>(
      null
    );

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
    statusUpdating,
    setStatusUpdating,
  ] =
    useState(false);

  const [
    statusError,
    setStatusError,
  ] =
    useState("");

  /* =======================================================
     CURRENT SESSION
  ======================================================= */

  const authenticatedUserId =
    authenticatedUser?._id ||
    authenticatedUser?.id ||
    "";

  /* =======================================================
     LOAD USER
  ======================================================= */

  const loadUser =
    useCallback(
      async () => {
        if (!id) {
          setError(
            "User ID is missing."
          );

          setLoading(
            false
          );

          return;
        }

        setLoading(
          true
        );

        setError(
          ""
        );

        try {
          const result =
            await getUserById(
              id
            );

          setUser(
            result
          );
        } catch (
          loadError
        ) {
          setUser(
            null
          );

          setError(
            getErrorMessage(
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
        id,
      ]
    );

  useEffect(() => {
    void loadUser();
  }, [
    loadUser,
  ]);

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const handleStatusChange =
    async (
      status: UserStatus
    ) => {
      if (
        !user ||
        statusUpdating ||
        user.status ===
          status
      ) {
        return;
      }

      const userId =
        user.id ||
        user._id;

      if (
        userId ===
        authenticatedUserId
      ) {
        setStatusError(
          "You cannot change the status of your currently signed-in account."
        );

        return;
      }

      try {
        setStatusUpdating(
          true
        );

        setStatusError(
          ""
        );

        const updatedUser =
          await updateUserStatus(
            userId,
            status
          );

        setUser(
          updatedUser
        );
      } catch (
        updateError
      ) {
        setStatusError(
          getErrorMessage(
            updateError
          )
        );
      } finally {
        setStatusUpdating(
          false
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <PageMeta
          title="User Details | Solar Trade Hub Dashboard"
          description="View Solar Trade Hub dashboard user details."
        />

        <PageBreadcrumb
          pageTitle="User Details"
        />

        <div className="space-y-6">
          <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gray-200 dark:bg-gray-800" />

              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-800" />

                <div className="h-4 w-64 rounded bg-gray-100 dark:bg-gray-800/70" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-2" />

            <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]" />
          </div>
        </div>
      </>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !user
  ) {
    return (
      <>
        <PageMeta
          title="User Details | Solar Trade Hub Dashboard"
          description="View Solar Trade Hub dashboard user details."
        />

        <PageBreadcrumb
          pageTitle="User Details"
        />

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <ShieldX
            size={32}
            className="text-red-500"
          />

          <h2 className="mt-4 text-lg font-semibold text-red-800 dark:text-red-300">
            Unable to load user
          </h2>

          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            {error ||
              "User was not found."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void loadUser();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw
                size={15}
              />

              Retry
            </button>

            <Link
              to="/users"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-transparent dark:text-red-300"
            >
              <ArrowLeft
                size={15}
              />

              Back to Users
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* =======================================================
     DERIVED USER DATA
  ======================================================= */

  const avatarUrl =
    getUserAvatarUrl(
      user.avatar
    );

  const roleName =
    user.role === "user"
      ? "Unassigned"
      : user.roleDetails
            ?.name ||
        formatRoleName(
          user.role
        );

  const userId =
    user.id ||
    user._id;

  const isCurrentUser =
    userId ===
    authenticatedUserId;

  const phoneValue =
    user.phone
      ? `${user.countryCode || ""}${user.phone}`
      : "Not provided";

  return (
    <>
      <PageMeta
        title={`${user.name || "User"} | Solar Trade Hub Dashboard`}
        description={`View ${user.name || "user"} dashboard account details.`}
      />

      <PageBreadcrumb
        pageTitle="User Details"
      />

      <div className="space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                {/* AVATAR */}

                <UserAvatar
                  avatarUrl={
                    avatarUrl
                  }
                  name={
                    user.name
                  }
                  email={
                    user.email
                  }
                />

                {/* IDENTITY */}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                      Dashboard User
                    </p>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>

                    {isCurrentUser && (
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                        You
                      </span>
                    )}
                  </div>

                  <h1 className="mt-2 truncate text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    {user.name ||
                      "Unnamed User"}
                  </h1>

                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                    {user.email ||
                      "No email available"}
                  </p>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/users/${userId}/edit`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b1f] to-[#6d28d9] px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Pencil
                    size={15}
                  />

                  Edit User
                </Link>

                <Link
                  to="/users"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <ArrowLeft
                    size={16}
                  />

                  Back to Users
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Role"
            value={
              roleName
            }
            icon={
              <Shield
                size={20}
              />
            }
            iconClass={
              user.role ===
              "user"
                ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                : "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
            }
          />

          <SummaryCard
            title="Email"
            value={
              user.isVerified
                ? "Verified"
                : "Unverified"
            }
            icon={
              user.isVerified ? (
                <CheckCircle2
                  size={20}
                />
              ) : (
                <ShieldX
                  size={20}
                />
              )
            }
            iconClass={
              user.isVerified
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
            }
          />

          <SummaryCard
            title="Phone"
            value={
              !user.phone
                ? "Not Added"
                : user.isPhoneVerified
                  ? "Verified"
                  : "Unverified"
            }
            icon={
              <Phone
                size={20}
              />
            }
            iconClass={
              user.isPhoneVerified
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
            }
          />

          <SummaryCard
            title="Account"
            value={
              user.accountType ===
              "dashboard"
                ? "Dashboard"
                : "Customer"
            }
            icon={
              <UserRound
                size={20}
              />
            }
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
          />
        </div>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* ===============================================
              ACCOUNT INFORMATION
          =============================================== */}

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-2">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Registered account and contact information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-7 p-5 sm:grid-cols-2 sm:p-6">
              <DetailItem
                label="Name"
                value={
                  user.name ||
                  "—"
                }
                icon={
                  <UserRound
                    size={15}
                  />
                }
              />

              <DetailItem
                label="Email"
                value={
                  user.email ||
                  "—"
                }
                icon={
                  <Mail
                    size={15}
                  />
                }
              />

              <DetailItem
                label="Phone"
                value={
                  phoneValue
                }
                icon={
                  <Phone
                    size={15}
                  />
                }
              />

              <DetailItem
                label="Provider"
                value={
                  user.provider ===
                  "google"
                    ? "Google"
                    : "Local"
                }
                icon={
                  <KeyRound
                    size={15}
                  />
                }
              />

              <DetailItem
                label="Account Type"
                value={
                  user.accountType ===
                  "dashboard"
                    ? "Dashboard"
                    : "Customer"
                }
                icon={
                  <ShieldCheck
                    size={15}
                  />
                }
              />

              <DetailItem
                label="Role"
                value={
                  roleName
                }
                icon={
                  <Shield
                    size={15}
                  />
                }
              />

              <DetailItem
                label="User ID"
                value={
                  userId
                }
              />

              <DetailItem
                label="Created"
                value={
                  formatDateTime(
                    user.createdAt
                  )
                }
                icon={
                  <CalendarDays
                    size={15}
                  />
                }
              />

              <DetailItem
                label="Last Updated"
                value={
                  formatDateTime(
                    user.updatedAt
                  )
                }
              />
            </div>
          </div>

          {/* ===============================================
              STATUS MANAGEMENT
          =============================================== */}

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Account Status
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Control dashboard account availability.
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Current Status
                </p>

                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold capitalize ${getStatusClasses(
                    user.status
                  )}`}
                >
                  {user.status}
                </span>
              </div>

              {isCurrentUser && (
                <div className="rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-xs leading-5 text-purple-700 dark:border-purple-500/10 dark:bg-purple-500/10 dark:text-purple-400">
                  You cannot change the status of the account currently used to
                  manage this dashboard.
                </div>
              )}

              <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Change Status
                </p>

                <div className="space-y-2">
                  <StatusButton
                    active={
                      user.status ===
                      "active"
                    }
                    disabled={
                      statusUpdating ||
                      isCurrentUser
                    }
                    onClick={() =>
                      void handleStatusChange(
                        "active"
                      )
                    }
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                  >
                    <CheckCircle2
                      size={15}
                    />

                    Active
                  </StatusButton>

                  <StatusButton
                    active={
                      user.status ===
                      "inactive"
                    }
                    disabled={
                      statusUpdating ||
                      isCurrentUser
                    }
                    onClick={() =>
                      void handleStatusChange(
                        "inactive"
                      )
                    }
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                  >
                    <UserRound
                      size={15}
                    />

                    Inactive
                  </StatusButton>

                  <StatusButton
                    active={
                      user.status ===
                      "blocked"
                    }
                    disabled={
                      statusUpdating ||
                      isCurrentUser
                    }
                    onClick={() =>
                      void handleStatusChange(
                        "blocked"
                      )
                    }
                    className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Ban
                      size={15}
                    />

                    Blocked
                  </StatusButton>
                </div>

                {statusUpdating && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <RefreshCw
                      size={13}
                      className="animate-spin"
                    />

                    Updating status...
                  </div>
                )}

                {statusError && (
                  <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                    {statusError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            VERIFICATION / ACCESS
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <InfoPanel
            title="Verification"
            icon={
              <ShieldCheck
                size={19}
              />
            }
          >
            <VerificationRow
              label="Email Verification"
              value={
                user.isVerified
              }
              enabledLabel="Verified"
              disabledLabel="Unverified"
            />

            <VerificationRow
              label="Phone Verification"
              value={
                user.isPhoneVerified
              }
              enabledLabel="Verified"
              disabledLabel={
                user.phone
                  ? "Unverified"
                  : "Not Added"
              }
            />
          </InfoPanel>

          <InfoPanel
            title="Account Access"
            icon={
              <KeyRound
                size={19}
              />
            }
          >
            <DetailLine
              label="Account Type"
              value={
                user.accountType ===
                "dashboard"
                  ? "Dashboard"
                  : "Customer"
              }
            />

            <DetailLine
              label="Sign-in Provider"
              value={
                user.provider ===
                "google"
                  ? "Google"
                  : "Local"
              }
            />

            <DetailLine
              label="Account Status"
              value={
                user.status
              }
            />
          </InfoPanel>
        </div>

        {/* =================================================
            ROLE & PERMISSIONS
        ================================================= */}

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Role & Permissions
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Dashboard access role and effective permissions.
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <DetailItem
                label="Role Name"
                value={
                  roleName
                }
              />

              <DetailItem
                label="Role Slug"
                value={
                  user.role ||
                  "user"
                }
              />

              <DetailItem
                label="Role Assigned At"
                value={
                  user.roleAssignedAt
                    ? formatDateTime(
                        user.roleAssignedAt
                      )
                    : "—"
                }
              />

              <DetailItem
                label="Role Type"
                value={
                  user.role ===
                  "user"
                    ? "Unassigned"
                    : user.roleDetails
                          ?.isSystemRole
                      ? "System Role"
                      : "Custom Role"
                }
              />
            </div>

            {user.role ===
            "user" ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                This dashboard account has not been assigned a role yet and
                cannot access protected dashboard functionality.
              </div>
            ) : (
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Effective Permissions
                </p>

                {user.permissions.length >
                0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.map(
                      (
                        permission
                      ) => (
                        <span
                          key={
                            permission
                          }
                          className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                        >
                          {permission ===
                          "*"
                            ? "Full Access"
                            : permission}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No explicit permissions assigned.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   USER AVATAR
========================================================= */

const UserAvatar = ({
  avatarUrl,
  name,
  email,
}: {
  avatarUrl: string;
  name: string;
  email: string;
}) => {
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
    avatarUrl,
  ]);

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-purple-100 text-lg font-bold text-purple-700 shadow-sm dark:from-orange-500/20 dark:to-purple-500/20 dark:text-purple-300">
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
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClass: string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-1 break-words text-lg font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   DETAIL ITEM
========================================================= */

const DetailItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) => {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <div className="mt-2 flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            {icon}
          </span>
        )}

        <p className="min-w-0 break-words text-sm font-medium text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   STATUS BUTTON
========================================================= */

const StatusButton = ({
  children,
  active,
  disabled,
  onClick,
  className,
}: {
  children: ReactNode;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  className: string;
}) => {
  return (
    <button
      type="button"
      disabled={
        disabled ||
        active
      }
      onClick={
        onClick
      }
      className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition disabled:cursor-not-allowed ${
        active
          ? "opacity-50"
          : ""
      } ${className}`}
    >
      {children}

      {active && (
        <span className="text-xs">
          (Current)
        </span>
      )}
    </button>
  );
};

/* =========================================================
   INFO PANEL
========================================================= */

const InfoPanel = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
          {icon}
        </div>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

/* =========================================================
   VERIFICATION ROW
========================================================= */

const VerificationRow = ({
  label,
  value,
  enabledLabel,
  disabledLabel,
}: {
  label: string;
  value: boolean;
  enabledLabel: string;
  disabledLabel: string;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-800">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {label}
      </p>

      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          value
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
        }`}
      >
        {value ? (
          <CheckCircle2
            size={13}
          />
        ) : (
          <ShieldX
            size={13}
          />
        )}

        {value
          ? enabledLabel
          : disabledLabel}
      </span>
    </div>
  );
};

/* =========================================================
   DETAIL LINE
========================================================= */

const DetailLine = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0 dark:border-gray-800">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {label}
      </p>

      <p className="text-sm font-medium capitalize text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};

export default ViewUser;