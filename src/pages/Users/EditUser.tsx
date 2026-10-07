import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router";

import {
  ArrowLeft,
  Ban,
  Camera,
  CheckCircle2,
  KeyRound,
  Mail,
  MailCheck,
  Phone,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  assignUserRole,
  getUserAvatarUrl,
  getUserById,
  removeUserAvatar,
  removeUserRole,
  updateUser,
  updateUserStatus,
  uploadUserAvatar,
  validateAvatarFile,
  type DashboardUser,
  type UserStatus,
} from "../../services/user/user.service";

import {
  getActiveRoles,
  type DashboardRole,
} from "../../services/role/role.service";

/* =========================================================
   TYPES
========================================================= */

type UserFormData = {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* =========================================================
   HELPERS
========================================================= */

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
            errors?: Array<{
              message?: unknown;
              msg?: unknown;
            }>;
          };
        };

        message?: unknown;
      };

    const firstValidationError =
      possibleAxiosError.response
        ?.data?.errors?.[0];

    const validationMessage =
      firstValidationError?.message ??
      firstValidationError?.msg;

    if (
      typeof validationMessage ===
        "string" &&
      validationMessage.trim()
    ) {
      return validationMessage;
    }

    const apiMessage =
      possibleAxiosError.response
        ?.data?.message;

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

  return "Something went wrong.";
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

const formatRoleName = (
  user: DashboardUser
): string => {
  if (
    user.roleDetails
      ?.name
      ?.trim()
  ) {
    return user.roleDetails.name;
  }

  if (
    !user.role ||
    user.role === "user"
  ) {
    return "Unassigned";
  }

  return user.role
    .replace(/[-_]/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const getStatusClasses = (
  status: UserStatus
): string => {
  if (
    status === "active"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400";
  }

  if (
    status === "blocked"
  ) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";
  }

  return "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400";
};

/* =========================================================
   PAGE
========================================================= */

const EditUser = () => {
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
    roles,
    setRoles,
  ] =
    useState<DashboardRole[]>(
      []
    );

  const [
    selectedRoleId,
    setSelectedRoleId,
  ] =
    useState("");

  const [
    formData,
    setFormData,
  ] =
    useState<UserFormData>({
      name: "",
      email: "",
      phone: "",
      countryCode: "",
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    profileSaving,
    setProfileSaving,
  ] =
    useState(false);

  const [
    statusSaving,
    setStatusSaving,
  ] =
    useState(false);

  const [
    roleSaving,
    setRoleSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  /* =======================================================
     AVATAR
  ======================================================= */

  const [
    avatarFile,
    setAvatarFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    avatarPreview,
    setAvatarPreview,
  ] =
    useState("");

  const [
    avatarError,
    setAvatarError,
  ] =
    useState("");

  const [
    avatarUploading,
    setAvatarUploading,
  ] =
    useState(false);

  const [
    avatarRemoving,
    setAvatarRemoving,
  ] =
    useState(false);

  const [
    imageFailed,
    setImageFailed,
  ] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  /* =======================================================
     CURRENT SESSION
  ======================================================= */

  const authenticatedUserId =
    authenticatedUser?._id ||
    authenticatedUser?.id ||
    "";

  const currentUserId =
    user?._id ||
    user?.id ||
    "";

  const isCurrentUser =
    Boolean(
      currentUserId &&
      authenticatedUserId &&
      currentUserId ===
        authenticatedUserId
    );

  /* =======================================================
     LOAD USER + ACTIVE ROLES
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

        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          setSuccessMessage(
            ""
          );

          const [
            userResult,
            activeRoles,
          ] =
            await Promise.all([
              getUserById(
                id
              ),
              getActiveRoles(),
            ]);

          setUser(
            userResult
          );

          setRoles(
            activeRoles
          );

          setFormData({
            name:
              userResult.name,

            email:
              userResult.email,

            phone:
              userResult.phone,

            countryCode:
              userResult.countryCode,
          });

          setAvatarPreview(
            getUserAvatarUrl(
              userResult.avatar
            )
          );

          const currentRole =
            activeRoles.find(
              (role) =>
                role.slug ===
                userResult.role
            );

          setSelectedRoleId(
            currentRole?._id ||
            currentRole?.id ||
            ""
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
     AVATAR PREVIEW CLEANUP
  ======================================================= */

  useEffect(() => {
    setImageFailed(
      false
    );
  }, [
    avatarPreview,
  ]);

  useEffect(() => {
    return () => {
      if (
        avatarPreview.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }
    };
  }, [
    avatarPreview,
  ]);

  /* =======================================================
     SELECTED ROLE
  ======================================================= */

  const selectedRole =
    useMemo(
      () =>
        roles.find(
          (role) =>
            (
              role._id ||
              role.id
            ) ===
            selectedRoleId
        ) ||
        null,
      [
        roles,
        selectedRoleId,
      ]
    );

  const currentRoleId =
    useMemo(
      () => {
        if (!user) {
          return "";
        }

        const currentRole =
          roles.find(
            (role) =>
              role.slug ===
              user.role
          );

        return (
          currentRole?._id ||
          currentRole?.id ||
          ""
        );
      },
      [
        roles,
        user,
      ]
    );

  const roleChanged =
    selectedRoleId !==
    currentRoleId;

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (
    field: keyof UserFormData,
    value: string
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
        ""
      );
    }

    if (successMessage) {
      setSuccessMessage(
        ""
      );
    }
  };

  /* =======================================================
     AVATAR FILE
  ======================================================= */

  const handleAvatarChange = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target
        .files?.[0] ||
      null;

    setAvatarError(
      ""
    );

    setSuccessMessage(
      ""
    );

    if (!file) {
      return;
    }

    const validationError =
      validateAvatarFile(
        file
      );

    if (
      validationError
    ) {
      setAvatarError(
        validationError
      );

      setAvatarFile(
        null
      );

      event.target.value =
        "";

      return;
    }

    if (
      avatarPreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    setAvatarFile(
      file
    );

    setAvatarPreview(
      URL.createObjectURL(
        file
      )
    );
  };

  /* =======================================================
     UPLOAD AVATAR
  ======================================================= */

  const handleAvatarUpload =
    async () => {
      if (
        !user ||
        !avatarFile
      ) {
        return;
      }

      const userId =
        user.id ||
        user._id;

      try {
        setAvatarUploading(
          true
        );

        setAvatarError(
          ""
        );

        setSuccessMessage(
          ""
        );

        const updatedUser =
          await uploadUserAvatar(
            userId,
            avatarFile
          );

        setUser(
          updatedUser
        );

        if (
          avatarPreview.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            avatarPreview
          );
        }

        setAvatarPreview(
          getUserAvatarUrl(
            updatedUser.avatar
          )
        );

        setAvatarFile(
          null
        );

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        setSuccessMessage(
          "Profile picture updated successfully."
        );
      } catch (
        uploadError
      ) {
        setAvatarError(
          getErrorMessage(
            uploadError
          )
        );
      } finally {
        setAvatarUploading(
          false
        );
      }
    };

  /* =======================================================
     REMOVE AVATAR
  ======================================================= */

  const handleRemoveAvatar =
    async () => {
      if (
        !user ||
        !user.avatar
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Remove ${
            user.name ||
            "this user"
          }'s profile picture?`
        );

      if (!confirmed) {
        return;
      }

      const userId =
        user.id ||
        user._id;

      try {
        setAvatarRemoving(
          true
        );

        setAvatarError(
          ""
        );

        setSuccessMessage(
          ""
        );

        const updatedUser =
          await removeUserAvatar(
            userId
          );

        setUser(
          updatedUser
        );

        if (
          avatarPreview.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            avatarPreview
          );
        }

        setAvatarPreview(
          ""
        );

        setAvatarFile(
          null
        );

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        setSuccessMessage(
          "Profile picture removed successfully."
        );
      } catch (
        removeError
      ) {
        setAvatarError(
          getErrorMessage(
            removeError
          )
        );
      } finally {
        setAvatarRemoving(
          false
        );
      }
    };

  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!user) {
        return;
      }

      const userId =
        user.id ||
        user._id;

      const name =
        formData.name
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      const email =
        formData.email
          .trim()
          .toLowerCase();

      const phone =
        formData.phone
          .trim();

      const countryCode =
        formData.countryCode
          .trim();

      if (
        name.length <
        2
      ) {
        setError(
          "Name must contain at least 2 characters."
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
        setProfileSaving(
          true
        );

        setError(
          ""
        );

        setSuccessMessage(
          ""
        );

        const updatedUser =
          await updateUser(
            userId,
            {
              name,
              email,
              phone,
              countryCode,
            }
          );

        setUser(
          updatedUser
        );

        setFormData({
          name:
            updatedUser.name,

          email:
            updatedUser.email,

          phone:
            updatedUser.phone,

          countryCode:
            updatedUser.countryCode,
        });

        setSuccessMessage(
          "User profile updated successfully."
        );
      } catch (
        saveError
      ) {
        setError(
          getErrorMessage(
            saveError
          )
        );
      } finally {
        setProfileSaving(
          false
        );
      }
    };

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  const handleStatusChange =
    async (
      status: UserStatus
    ) => {
      if (
        !user ||
        statusSaving ||
        user.status ===
          status
      ) {
        return;
      }

      if (
        isCurrentUser
      ) {
        setError(
          "You cannot change the status of your currently signed-in account."
        );

        return;
      }

      const userId =
        user.id ||
        user._id;

      try {
        setStatusSaving(
          true
        );

        setError(
          ""
        );

        setSuccessMessage(
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

        setSuccessMessage(
          `Account status changed to ${status}.`
        );
      } catch (
        statusError
      ) {
        setError(
          getErrorMessage(
            statusError
          )
        );
      } finally {
        setStatusSaving(
          false
        );
      }
    };

  /* =======================================================
     ASSIGN ROLE
  ======================================================= */

  const handleAssignRole =
    async () => {
      if (
        !user ||
        !selectedRoleId ||
        !roleChanged
      ) {
        return;
      }

      if (
        isCurrentUser
      ) {
        setError(
          "You cannot change the role of your currently signed-in account."
        );

        return;
      }

      const userId =
        user.id ||
        user._id;

      try {
        setRoleSaving(
          true
        );

        setError(
          ""
        );

        setSuccessMessage(
          ""
        );

        const updatedUser =
          await assignUserRole(
            userId,
            {
              roleId:
                selectedRoleId,
            }
          );

        setUser(
          updatedUser
        );

        const updatedRole =
          roles.find(
            (role) =>
              role.slug ===
              updatedUser.role
          );

        setSelectedRoleId(
          updatedRole?._id ||
          updatedRole?.id ||
          selectedRoleId
        );

        setSuccessMessage(
          "Role assigned successfully."
        );
      } catch (
        roleError
      ) {
        setError(
          getErrorMessage(
            roleError
          )
        );
      } finally {
        setRoleSaving(
          false
        );
      }
    };

  /* =======================================================
     REMOVE ROLE
  ======================================================= */

  const handleRemoveRole =
    async () => {
      if (
        !user ||
        user.role === "user"
      ) {
        return;
      }

      if (
        isCurrentUser
      ) {
        setError(
          "You cannot remove the role from your currently signed-in account."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Remove the assigned role from ${
            user.name ||
            "this user"
          }?`
        );

      if (!confirmed) {
        return;
      }

      const userId =
        user.id ||
        user._id;

      try {
        setRoleSaving(
          true
        );

        setError(
          ""
        );

        setSuccessMessage(
          ""
        );

        const updatedUser =
          await removeUserRole(
            userId
          );

        setUser(
          updatedUser
        );

        setSelectedRoleId(
          ""
        );

        setSuccessMessage(
          "Role removed successfully. This dashboard account is now unassigned."
        );
      } catch (
        roleError
      ) {
        setError(
          getErrorMessage(
            roleError
          )
        );
      } finally {
        setRoleSaving(
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
          title="Edit User | Solar Trade Hub Dashboard"
          description="Edit Solar Trade Hub dashboard user."
        />

        <PageBreadcrumb
          pageTitle="Edit User"
        />

        <div className="space-y-6">
          <div className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" />

          <div className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" />
        </div>
      </>
    );
  }

  /* =======================================================
     LOAD ERROR
  ======================================================= */

  if (!user) {
    return (
      <>
        <PageMeta
          title="Edit User | Solar Trade Hub Dashboard"
          description="Edit Solar Trade Hub dashboard user."
        />

        <PageBreadcrumb
          pageTitle="Edit User"
        />

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="font-semibold text-red-700 dark:text-red-400">
            {error ||
              "User could not be loaded."}
          </p>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                void loadUser();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white"
            >
              <RefreshCw
                size={15}
              />

              Retry
            </button>

            <Link
              to="/users"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 dark:bg-transparent dark:text-red-300"
            >
              <ArrowLeft
                size={15}
              />

              Back
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const userId =
    user.id ||
    user._id;

  const roleName =
    formatRoleName(
      user
    );

  const busy =
    profileSaving ||
    avatarUploading ||
    avatarRemoving ||
    roleSaving ||
    statusSaving;

  return (
    <>
      <PageMeta
        title={`Edit ${
          user.name ||
          "User"
        } | Solar Trade Hub Dashboard`}
        description="Edit Solar Trade Hub dashboard user account."
      />

      <PageBreadcrumb
        pageTitle="Edit User"
      />

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-6"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                  <UserRound
                    size={22}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                      User Management
                    </p>

                    {isCurrentUser && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                        You
                      </span>
                    )}
                  </div>

                  <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Edit User
                  </h1>

                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>

              <Link
                to={`/users/${userId}`}
                className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
              >
                <ArrowLeft
                  size={16}
                />

                Back to User
              </Link>
            </div>
          </div>
        </div>

        {/* =================================================
            MESSAGES
        ================================================= */}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2
              size={17}
            />

            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* =================================================
            IDENTITY OVERVIEW
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Role"
            value={
              roleName
            }
            icon={
              <Shield
                size={18}
              />
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
              <ShieldCheck
                size={18}
              />
            }
          />

          <SummaryCard
            title="Provider"
            value={
              user.provider ===
              "google"
                ? "Google"
                : "Local"
            }
            icon={
              <KeyRound
                size={18}
              />
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
              <MailCheck
                size={18}
              />
            }
          />
        </div>

        {/* =================================================
            AVATAR
        ================================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Profile Picture
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update the picture associated with this dashboard account.
            </p>
          </div>

          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-purple-100 text-xl font-bold text-purple-700 shadow-sm dark:from-orange-500/20 dark:to-purple-500/20 dark:text-purple-300">
              <span>
                {getInitials(
                  formData.name,
                  formData.email
                )}
              </span>

              {avatarPreview &&
                !imageFailed && (
                  <img
                    src={
                      avatarPreview
                    }
                    alt={
                      user.name ||
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

              <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-600 text-white dark:border-gray-900">
                <Camera
                  size={14}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={
                  handleAvatarChange
                }
                disabled={
                  busy
                }
                className="hidden"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={
                    busy
                  }
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 text-sm font-medium text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                >
                  <Camera
                    size={16}
                  />

                  Choose Image
                </button>

                {avatarFile && (
                  <button
                    type="button"
                    disabled={
                      busy
                    }
                    onClick={() => {
                      void handleAvatarUpload();
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b1f] to-[#6d28d9] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {avatarUploading ? (
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Upload
                        size={16}
                      />
                    )}

                    Upload
                  </button>
                )}

                {user.avatar && (
                  <button
                    type="button"
                    disabled={
                      busy
                    }
                    onClick={() => {
                      void handleRemoveAvatar();
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                  >
                    {avatarRemoving ? (
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2
                        size={16}
                      />
                    )}

                    Remove
                  </button>
                )}
              </div>

              {avatarFile && (
                <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
                  <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                    {avatarFile.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {(
                      avatarFile.size /
                      1024 /
                      1024
                    ).toFixed(
                      2
                    )}{" "}
                    MB
                  </p>
                </div>
              )}

              {avatarError && (
                <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
                  {avatarError}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            PROFILE INFORMATION
        ================================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Account Information
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update the user's registered profile and contact details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-2">
            <FormField
              label="Name"
              required
            >
              <div className="relative">
                <UserRound
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={
                    formData.name
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "name",
                      event.target.value
                    )
                  }
                  disabled={
                    profileSaving
                  }
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </FormField>

            <FormField
              label="Email"
              required
            >
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  value={
                    formData.email
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "email",
                      event.target.value
                    )
                  }
                  disabled={
                    profileSaving
                  }
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </FormField>

            <FormField
              label="Country Code"
            >
              <input
                type="text"
                value={
                  formData.countryCode
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    "countryCode",
                    event.target.value
                  )
                }
                disabled={
                  profileSaving
                }
                placeholder="+92"
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </FormField>

            <FormField
              label="Phone"
            >
              <div className="relative">
                <Phone
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={
                    formData.phone
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "phone",
                      event.target.value
                    )
                  }
                  disabled={
                    profileSaving
                  }
                  placeholder="3001234567"
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </FormField>
          </div>

          <div className="flex justify-end border-t border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-6">
            <button
              type="submit"
              disabled={
                busy
              }
              className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b1f] to-[#6d28d9] px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {profileSaving ? (
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={17}
                />
              )}

              {profileSaving
                ? "Saving..."
                : "Save Profile"}
            </button>
          </div>
        </section>

        {/* =================================================
            ROLE ASSIGNMENT
        ================================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Role Assignment
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Assign an active dashboard role and its permissions.
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {isCurrentUser && (
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-xs leading-5 text-purple-700 dark:border-purple-500/10 dark:bg-purple-500/10 dark:text-purple-400">
                Your own dashboard role cannot be changed from this screen.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Dashboard Role
                </label>

                <select
                  value={
                    selectedRoleId
                  }
                  disabled={
                    roleSaving ||
                    isCurrentUser
                  }
                  onChange={(
                    event
                  ) => {
                    setSelectedRoleId(
                      event.target.value
                    );

                    setError(
                      ""
                    );

                    setSuccessMessage(
                      ""
                    );
                  }}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    Select a role
                  </option>

                  {roles.map(
                    (role) => (
                      <option
                        key={
                          role._id ||
                          role.id
                        }
                        value={
                          role._id ||
                          role.id
                        }
                      >
                        {role.name}
                        {role.isSystemRole
                          ? " · System"
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  disabled={
                    roleSaving ||
                    isCurrentUser ||
                    !selectedRoleId ||
                    !roleChanged
                  }
                  onClick={() => {
                    void handleAssignRole();
                  }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {roleSaving ? (
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <ShieldCheck
                      size={15}
                    />
                  )}

                  Assign Role
                </button>

                {user.role !==
                  "user" && (
                  <button
                    type="button"
                    disabled={
                      roleSaving ||
                      isCurrentUser
                    }
                    onClick={() => {
                      void handleRemoveRole();
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {selectedRole && (
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedRole.name}
                  </p>

                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                    {selectedRole.isSystemRole
                      ? "System Role"
                      : "Custom Role"}
                  </span>
                </div>

                {selectedRole.description && (
                  <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    {selectedRole.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedRole.permissions.length >
                  0 ? (
                    selectedRole.permissions.map(
                      (permission) => (
                        <span
                          key={
                            permission
                          }
                          className="rounded-lg border border-purple-100 bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                        >
                          {permission ===
                          "*"
                            ? "Full Access"
                            : permission}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-xs text-gray-400">
                      No explicit permissions.
                    </span>
                  )}
                </div>
              </div>
            )}

            {user.role ===
              "user" && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                This user is currently unassigned and cannot sign in to the
                protected dashboard until a role is assigned.
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            STATUS
        ================================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Account Status
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Control whether this dashboard account can authenticate.
            </p>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            {isCurrentUser && (
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-xs leading-5 text-purple-700 dark:border-purple-500/10 dark:bg-purple-500/10 dark:text-purple-400">
                You cannot deactivate or block the account currently used to
                manage this dashboard.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(
                [
                  "active",
                  "inactive",
                  "blocked",
                ] as UserStatus[]
              ).map(
                (status) => (
                  <button
                    key={
                      status
                    }
                    type="button"
                    disabled={
                      statusSaving ||
                      isCurrentUser ||
                      user.status ===
                        status
                    }
                    onClick={() => {
                      void handleStatusChange(
                        status
                      );
                    }}
                    className={`rounded-xl border px-4 py-4 text-left transition disabled:cursor-not-allowed ${
                      user.status ===
                      status
                        ? getStatusClasses(
                            status
                          )
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-transparent dark:text-gray-400 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {status ===
                        "active" ? (
                          <CheckCircle2
                            size={16}
                          />
                        ) : status ===
                          "blocked" ? (
                          <Ban
                            size={16}
                          />
                        ) : (
                          <UserRound
                            size={16}
                          />
                        )}

                        <span className="text-sm font-semibold capitalize">
                          {status}
                        </span>
                      </div>

                      {statusSaving ? null : user.status ===
                        status ? (
                        <CheckCircle2
                          size={16}
                        />
                      ) : null}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            SECURITY NOTE
        ================================================= */}

        <section className="rounded-2xl border border-purple-100 bg-gradient-to-r from-orange-50/60 to-purple-50/70 p-5 dark:border-purple-500/10 dark:from-orange-500/5 dark:to-purple-500/5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm dark:bg-white/5 dark:text-purple-400">
              <ShieldCheck
                size={18}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Protected Authentication State
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Email verification, phone verification, password and
                authentication tokens are not manually edited here. Role and
                account status use their dedicated protected endpoints.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="flex flex-col-reverse gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <Link
            to={`/users/${userId}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cancel
          </Link>

          <p className="text-xs text-gray-400">
            User ID: {userId}
          </p>
        </div>
      </form>
    </>
  );
};

/* =========================================================
   FORM FIELD
========================================================= */

const FormField = ({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
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
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
            {title}
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default EditUser;
