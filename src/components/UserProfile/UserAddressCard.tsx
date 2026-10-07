import {
  CalendarDays,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  MailCheck,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  changePassword,
  getAuthErrorMessage,
} from "../../services/auth.service";

import {
  useModal,
} from "../../hooks/useModal";

import {
  Modal,
} from "../ui/modal";

import Button from "../ui/button/Button";

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (
  value?: string
): string => {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
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
  value?: string
): string => {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
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

const formatStatus = (
  status?: string
): string => {
  if (!status) {
    return "Active";
  }

  return status
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};

const formatProvider = (
  provider?: string
): string => {
  return provider ===
    "google"
    ? "Google"
    : "Local";
};

const formatAccountType = (
  accountType?: string
): string => {
  return accountType ===
    "customer"
    ? "Customer"
    : "Dashboard";
};

/* =========================================================
   USER ACCOUNT / SECURITY CARD
========================================================= */

export default function UserAddressCard() {
  const {
    user,
  } =
    useAuth();

  const {
    isOpen,
    openModal,
    closeModal,
  } =
    useModal();

  const [
    oldPassword,
    setOldPassword,
  ] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    showOldPassword,
    setShowOldPassword,
  ] =
    useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const statusLabel =
    formatStatus(
      user?.status
    );

  const providerLabel =
    formatProvider(
      user?.provider
    );

  const accountTypeLabel =
    formatAccountType(
      user?.accountType
    );

  const statusClass =
    user?.status ===
    "blocked"
      ? "bg-red-500"
      : user?.status ===
          "inactive"
        ? "bg-amber-500"
        : "bg-emerald-500";

  /* =======================================================
     OPEN PASSWORD MODAL
  ======================================================= */

  const handleOpenModal =
    () => {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setError("");
      setSuccess("");

      openModal();
    };

  /* =======================================================
     CLOSE PASSWORD MODAL
  ======================================================= */

  const handleCloseModal =
    () => {
      if (saving) {
        return;
      }

      setError("");
      setSuccess("");

      closeModal();
    };

  /* =======================================================
     CHANGE PASSWORD
  ======================================================= */

  const handleChangePassword =
    async () => {
      if (!oldPassword) {
        setError(
          "Current password is required."
        );

        return;
      }

      if (!newPassword) {
        setError(
          "New password is required."
        );

        return;
      }

      if (
        newPassword.length <
        8
      ) {
        setError(
          "New password must contain at least 8 characters."
        );

        return;
      }

      if (
        oldPassword ===
        newPassword
      ) {
        setError(
          "New password must be different from your current password."
        );

        return;
      }

      if (!confirmPassword) {
        setError(
          "Please confirm your new password."
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setError(
          "New passwords do not match."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await changePassword({
            oldPassword,
            newPassword,
            confirmPassword,
          });

        setSuccess(
          response.message ||
            "Password changed successfully. Please sign in again."
        );

        /*
         * changePassword() clears stored authentication.
         * Reloading the sign-in route guarantees AuthContext
         * is also rebuilt with an empty session.
         */
        window.setTimeout(
          () => {
            window.location.replace(
              "/signin"
            );
          },
          1200
        );
      } catch (
        requestError
      ) {
        setError(
          getAuthErrorMessage(
            requestError
          )
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <>
      {/* ===================================================
          ACCOUNT & SECURITY
      =================================================== */}

      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
        {/* DECORATION */}

        <div className="pointer-events-none absolute -right-20 -top-24 h-44 w-44 rounded-full bg-orange-500/[0.025]" />

        <div className="pointer-events-none absolute right-10 top-6 h-24 w-24 rounded-full bg-purple-500/[0.025]" />

        {/* HEADER */}

        <div className="relative flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              <ShieldCheck
                size={18}
              />
            </div>

            <div className="min-w-0">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                Account & Security
              </h4>

              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Authentication, verification and account activity.
              </p>
            </div>
          </div>

          {/* CHANGE PASSWORD */}

          {user?.provider !==
            "google" && (
            <button
              type="button"
              onClick={
                handleOpenModal
              }
              title="Change password"
              aria-label="Change password"
              className="group flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-300 hover:w-[150px] hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
            >
              <LockKeyhole
                size={16}
                className="shrink-0"
              />

              <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[105px] group-hover:opacity-100">
                Change Password
              </span>
            </button>
          )}
        </div>

        {/* ACCOUNT DATA */}

        <div className="relative p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
            {/* STATUS */}

            <AccountItem
              label="Account Status"
              icon={
                <ShieldCheck
                  size={15}
                />
              }
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusClass}`}
                />

                <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {statusLabel}
                </span>
              </div>
            </AccountItem>

            {/* ACCOUNT TYPE */}

            <AccountItem
              label="Account Type"
              icon={
                <UserRound
                  size={15}
                />
              }
            >
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {accountTypeLabel}
              </span>
            </AccountItem>

            {/* PROVIDER */}

            <AccountItem
              label="Sign-in Provider"
              icon={
                <KeyRound
                  size={15}
                />
              }
            >
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {providerLabel}
              </span>
            </AccountItem>

            {/* EMAIL */}

            <AccountItem
              label="Email Verification"
              icon={
                <MailCheck
                  size={15}
                />
              }
            >
              {user?.isVerified ? (
                <StatusBadge
                  type="success"
                  text="Verified"
                />
              ) : (
                <StatusBadge
                  type="warning"
                  text="Not Verified"
                />
              )}
            </AccountItem>

            {/* PHONE */}

            <AccountItem
              label="Phone Verification"
              icon={
                <Phone
                  size={15}
                />
              }
            >
              {!user?.phone ? (
                <StatusBadge
                  type="neutral"
                  text="Not Added"
                />
              ) : user?.isPhoneVerified ? (
                <StatusBadge
                  type="success"
                  text="Verified"
                />
              ) : (
                <StatusBadge
                  type="warning"
                  text="Not Verified"
                />
              )}
            </AccountItem>

            {/* MEMBER SINCE */}

            <AccountItem
              label="Member Since"
              icon={
                <CalendarDays
                  size={15}
                />
              }
            >
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {formatDate(
                  user?.createdAt
                )}
              </span>
            </AccountItem>

            {/* LAST UPDATED */}

            <AccountItem
              label="Last Updated"
              icon={
                <Clock3
                  size={15}
                />
              }
            >
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {formatDateTime(
                  user?.updatedAt
                )}
              </span>
            </AccountItem>
          </div>

          {/* SECURITY NOTE */}

          <div className="mt-7 flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4 dark:border-purple-500/10 dark:bg-purple-500/[0.05]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 shadow-sm ring-1 ring-purple-100 dark:bg-gray-800 dark:text-purple-400 dark:ring-purple-500/10">
              <ShieldCheck
                size={16}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Protected Account
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                Passwords, authentication tokens and permissions are protected
                by Solar Trade Hub. Changing your password will end the current
                authenticated session and require you to sign in again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          CHANGE PASSWORD MODAL
      =================================================== */}

      <Modal
        isOpen={
          isOpen
        }
        onClose={
          handleCloseModal
        }
        className="m-4 max-w-[560px]"
      >
        <div className="relative w-full max-w-[560px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          {/* HEADER */}

          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:px-8">
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                <LockKeyhole
                  size={18}
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600 dark:text-orange-400">
                  Account Security
                </p>

                <h4 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h4>

                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Enter your current password and choose a new secure password.
                </p>
              </div>
            </div>
          </div>

          {/* BODY */}

          <div className="space-y-5 px-6 py-6 sm:px-8">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                {success}
              </div>
            )}

            {/* CURRENT PASSWORD */}

            <PasswordField
              label="Current Password"
              value={
                oldPassword
              }
              show={
                showOldPassword
              }
              disabled={
                saving
              }
              onChange={(
                value
              ) => {
                setOldPassword(
                  value
                );

                setError("");
              }}
              onToggle={() =>
                setShowOldPassword(
                  (current) =>
                    !current
                )
              }
            />

            {/* NEW PASSWORD */}

            <PasswordField
              label="New Password"
              value={
                newPassword
              }
              show={
                showNewPassword
              }
              disabled={
                saving
              }
              onChange={(
                value
              ) => {
                setNewPassword(
                  value
                );

                setError("");
              }}
              onToggle={() =>
                setShowNewPassword(
                  (current) =>
                    !current
                )
              }
            />

            {/* CONFIRM PASSWORD */}

            <PasswordField
              label="Confirm New Password"
              value={
                confirmPassword
              }
              show={
                showConfirmPassword
              }
              disabled={
                saving
              }
              onChange={(
                value
              ) => {
                setConfirmPassword(
                  value
                );

                setError("");
              }}
              onToggle={() =>
                setShowConfirmPassword(
                  (current) =>
                    !current
                )
              }
            />

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                Use at least 8 characters. Your new password must be different
                from your current password.
              </p>
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
            <Button
              size="sm"
              variant="outline"
              disabled={
                saving
              }
              onClick={
                handleCloseModal
              }
            >
              Cancel
            </Button>

            <Button
              size="sm"
              disabled={
                saving
              }
              onClick={() => {
                void handleChangePassword();
              }}
            >
              {saving
                ? "Updating..."
                : "Change Password"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* =========================================================
   ACCOUNT ITEM
========================================================= */

const AccountItem = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
        {label}
      </p>

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
          {icon}
        </span>

        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({
  type,
  text,
}: {
  type:
    | "success"
    | "warning"
    | "neutral";
  text: string;
}) => {
  const styles = {
    success:
      "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/10 dark:bg-emerald-500/10 dark:text-emerald-400",

    warning:
      "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-500/10 dark:bg-orange-500/10 dark:text-orange-400",

    neutral:
      "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[type]}`}
    >
      {text}
    </span>
  );
};

/* =========================================================
   PASSWORD FIELD
========================================================= */

const PasswordField = ({
  label,
  value,
  show,
  disabled,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  show: boolean;
  disabled: boolean;
  onChange: (
    value: string
  ) => void;
  onToggle: () => void;
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}

        <span className="ml-1 text-orange-500">
          *
        </span>
      </label>

      <div className="relative">
        <input
          type={
            show
              ? "text"
              : "password"
          }
          value={
            value
          }
          disabled={
            disabled
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 pr-11 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500"
        />

        <button
          type="button"
          disabled={
            disabled
          }
          onClick={
            onToggle
          }
          aria-label={
            show
              ? "Hide password"
              : "Show password"
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-purple-400"
        >
          {show ? (
            <EyeOff
              size={17}
            />
          ) : (
            <Eye
              size={17}
            />
          )}
        </button>
      </div>
    </div>
  );
};