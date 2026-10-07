import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  BadgeCheck,
  Check,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useModal,
} from "../../hooks/useModal";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  updateUser,
} from "../../services/user/user.service";

import {
  Modal,
} from "../ui/modal";

import Button from "../ui/button/Button";

/* =========================================================
   TYPES
========================================================= */

type EditableProfile = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const EMAIL_PATTERN =
  /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

/* =========================================================
   HELPERS
========================================================= */

const splitName = (
  fullName?: string
) => {
  const cleanedName =
    fullName?.trim() ||
    "";

  if (!cleanedName) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const parts =
    cleanedName
      .split(/\\s+/)
      .filter(Boolean);

  return {
    firstName:
      parts[0] ||
      "",

    lastName:
      parts
        .slice(1)
        .join(" "),
  };
};

const formatRole = (
  role?: string
): string => {
  if (!role?.trim()) {
    return "Dashboard User";
  }

  return role
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .split(/\\s+/)
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

const formatPhone = (
  countryCode?: string,
  phone?: string
): string => {
  const normalizedPhone =
    phone?.trim() ||
    "";

  if (!normalizedPhone) {
    return "Not provided";
  }

  const normalizedCountryCode =
    countryCode?.trim() ||
    "";

  if (
    normalizedPhone.startsWith(
      "+"
    )
  ) {
    return normalizedPhone;
  }

  return `${normalizedCountryCode} ${normalizedPhone}`.trim();
};

/* =========================================================
   USER INFO CARD
========================================================= */

export default function UserInfoCard() {
  const {
    isOpen,
    openModal,
    closeModal,
  } =
    useModal();

  const {
    user,
  } =
    useAuth();

  const [
    formData,
    setFormData,
  ] =
    useState<EditableProfile>({
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+92",
      phone: "",
    });

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  const currentUser =
    user;

  const userId =
    currentUser?._id ||
    currentUser?.id ||
    "";

  const nameParts =
    useMemo(
      () =>
        splitName(
          currentUser?.name
        ),
      [
        currentUser?.name,
      ]
    );

  const roleLabel =
    currentUser
      ?.roleDetails
      ?.name
      ?.trim() ||
    formatRole(
      currentUser?.role
    );

  const phoneLabel =
    formatPhone(
      currentUser?.countryCode,
      currentUser?.phone
    );

  const handleOpenEdit =
    () => {
      const name =
        splitName(
          currentUser?.name
        );

      setFormData({
        firstName:
          name.firstName,

        lastName:
          name.lastName,

        email:
          currentUser?.email ||
          "",

        countryCode:
          currentUser?.countryCode ||
          "+92",

        phone:
          currentUser?.phone ||
          "",
      });

      setError(
        null
      );

      setSuccess(
        false
      );

      openModal();
    };

  const handleCloseModal =
    () => {
      if (saving) {
        return;
      }

      setError(
        null
      );

      setSuccess(
        false
      );

      closeModal();
    };

  const updateField = <
    K extends keyof EditableProfile,
  >(
    field: K,
    value: EditableProfile[K]
  ) => {
    setFormData(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );

    if (error) {
      setError(
        null
      );
    }

    if (success) {
      setSuccess(
        false
      );
    }
  };

  const handleSave =
    async () => {
      if (!userId) {
        setError(
          "Unable to identify the current user."
        );

        return;
      }

      const firstName =
        formData.firstName.trim();

      const lastName =
        formData.lastName.trim();

      const email =
        formData.email
          .trim()
          .toLowerCase();

      const countryCode =
        formData.countryCode.trim();

      const phone =
        formData.phone.trim();

      const fullName =
        `${firstName} ${lastName}`.trim();

      if (!firstName) {
        setError(
          "First name is required."
        );

        return;
      }

      if (
        firstName.length <
        2
      ) {
        setError(
          "First name must contain at least 2 characters."
        );

        return;
      }

      if (!email) {
        setError(
          "Email address is required."
        );

        return;
      }

      if (
        !EMAIL_PATTERN.test(
          email
        )
      ) {
        setError(
          "Please enter a valid email address."
        );

        return;
      }

      if (
        phone &&
        !countryCode
      ) {
        setError(
          "Country code is required when a phone number is provided."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setError(
          null
        );

        setSuccess(
          false
        );

        await updateUser(
          userId,
          {
            name:
              fullName,

            email,

            phone,

            countryCode,
          }
        );

        setSuccess(
          true
        );

        window.setTimeout(
          () => {
            closeModal();
            window.location.reload();
          },
          650
        );
      } catch (
        err
      ) {
        console.error(
          "Failed to update profile:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to save profile changes. Please try again."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
        <div className="pointer-events-none absolute -right-20 -top-24 h-44 w-44 rounded-full bg-purple-500/[0.025]" />

        <div className="relative flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <UserRound
                size={18}
              />
            </div>

            <div className="min-w-0">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                Personal Information
              </h4>

              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Your account and contact details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleOpenEdit
            }
            title="Edit information"
            aria-label="Edit personal information"
            className="group flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-300 hover:w-[86px] hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-purple-500/30 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
          >
            <Pencil
              size={15}
              className="shrink-0"
            />

            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[40px] group-hover:opacity-100">
              Edit
            </span>
          </button>
        </div>

        <div className="relative p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem
              label="First Name"
              value={
                nameParts.firstName ||
                "—"
              }
              icon={
                <UserRound
                  size={15}
                />
              }
            />

            <InfoItem
              label="Last Name"
              value={
                nameParts.lastName ||
                "—"
              }
              icon={
                <UserRound
                  size={15}
                />
              }
            />

            <InfoItem
              label="Email Address"
              value={
                currentUser?.email ||
                "—"
              }
              icon={
                <Mail
                  size={15}
                />
              }
            />

            <InfoItem
              label="Phone Number"
              value={
                phoneLabel
              }
              icon={
                <Phone
                  size={15}
                />
              }
            />

            <InfoItem
              label="Account Role"
              value={
                roleLabel
              }
              icon={
                <ShieldCheck
                  size={15}
                />
              }
            />

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
                Email Status
              </p>

              {currentUser?.isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/10 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <BadgeCheck
                    size={14}
                  />

                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-700 dark:border-orange-500/10 dark:bg-orange-500/10 dark:text-orange-400">
                  Email Unverified
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <Modal
        isOpen={
          isOpen
        }
        onClose={
          handleCloseModal
        }
        className="m-4 max-w-[680px]"
      >
        <div className="relative w-full max-w-[680px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:px-8">
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                <Pencil
                  size={18}
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600 dark:text-orange-400">
                  My Profile
                </p>

                <h4 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Personal Information
                </h4>

                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Update your Solar Trade Hub dashboard account information.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                <Check
                  size={16}
                />

                Profile updated successfully.
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label="First Name"
                required
              >
                <input
                  type="text"
                  value={
                    formData.firstName
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "firstName",
                      event.target.value
                    )
                  }
                  placeholder="First name"
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500"
                />
              </FormField>

              <FormField
                label="Last Name"
              >
                <input
                  type="text"
                  value={
                    formData.lastName
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "lastName",
                      event.target.value
                    )
                  }
                  placeholder="Last name"
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField
                  label="Email Address"
                  required
                >
                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="email"
                      value={
                        formData.email
                      }
                      disabled={
                        saving
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="Email address"
                      className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500"
                    />
                  </div>
                </FormField>
              </div>

              <FormField
                label="Country Code"
              >
                <input
                  type="text"
                  value={
                    formData.countryCode
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "countryCode",
                      event.target.value
                    )
                  }
                  placeholder="+92"
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500"
                />
              </FormField>

              <FormField
                label="Phone Number"
              >
                <div className="relative">
                  <Phone
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={
                      formData.phone
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="3001234567"
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500"
                  />
                </div>
              </FormField>

              <div className="sm:col-span-2">
                <FormField
                  label="Account Role"
                  helper="Your role and permissions are managed separately and cannot be changed from My Profile."
                >
                  <div className="flex h-11 items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                    <ShieldCheck
                      size={16}
                      className="text-purple-500"
                    />

                    {roleLabel}
                  </div>
                </FormField>
              </div>
            </div>
          </div>

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

            <button
              type="button"
              disabled={
                saving
              }
              onClick={() => {
                void handleSave();
              }}
              className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b1f] to-[#6d28d9] px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                  Saving...
                </>
              ) : (
                <>
                  <Check
                    size={16}
                  />

                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

const InfoItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) => {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
        {label}
      </p>

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
          {icon}
        </span>

        <p className="min-w-0 truncate text-sm font-semibold text-gray-800 dark:text-white/90">
          {value}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   FORM FIELD
========================================================= */

const FormField = ({
  label,
  helper,
  required = false,
  children,
}: {
  label: string;
  helper?: string;
  required?: boolean;
  children: ReactNode;
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}

        {required && (
          <span className="ml-1 text-orange-500">
            *
          </span>
        )}
      </label>

      {children}

      {helper && (
        <p className="mt-1.5 text-xs leading-5 text-gray-400 dark:text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
};