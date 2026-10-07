import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Camera,
  Check,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

import {
  useModal,
} from "../../hooks/useModal";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  getUserAvatarUrl,
  removeUserAvatar,
  uploadUserAvatar,
  validateAvatarFile,
} from "../../services/user/user.service";

import {
  Modal,
} from "../ui/modal";

import Button from "../ui/button/Button";

/* =========================================================
   HELPERS
========================================================= */

const getInitials = (
  name?: string
): string => {
  if (!name?.trim()) {
    return "U";
  }

  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 1) {
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

const getRoleLabel = (
  role?: string
): string => {
  if (!role?.trim()) {
    return "Dashboard User";
  }

  return role
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

/* =========================================================
   USER META CARD
========================================================= */

export default function UserMetaCard() {
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

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState("");

  const [
    avatarPath,
    setAvatarPath,
  ] =
    useState(
      user?.avatar ||
        ""
    );

  const [
    imageError,
    setImageError,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    removing,
    setRemoving,
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

  /* =======================================================
     USER DATA
  ======================================================= */

  const userId =
    user?._id ||
    user?.id ||
    "";

  const displayName =
    user?.name?.trim() ||
    "Solar Trade Hub User";

  const displayEmail =
    user?.email?.trim() ||
    "Email not available";

  const roleLabel =
    user?.roleDetails
      ?.name
      ?.trim() ||
    getRoleLabel(
      user?.role
    );

  const accountLabel =
    user?.accountType ===
    "dashboard"
      ? "Dashboard Account"
      : "Solar Trade Hub Account";

  const initials =
    useMemo(
      () =>
        getInitials(
          displayName
        ),
      [
        displayName,
      ]
    );

  const avatarUrl =
    useMemo(
      () =>
        getUserAvatarUrl(
          avatarPath
        ),
      [
        avatarPath,
      ]
    );

  const currentImage =
    previewUrl ||
    avatarUrl;

  /* =======================================================
     SYNC AVATAR
  ======================================================= */

  useEffect(() => {
    setAvatarPath(
      user?.avatar ||
        ""
    );
  }, [
    user?.avatar,
  ]);

  useEffect(() => {
    setImageError(
      false
    );
  }, [
    currentImage,
  ]);

  useEffect(() => {
    return () => {
      if (
        previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [
    previewUrl,
  ]);

  /* =======================================================
     MODAL
  ======================================================= */

  const handleOpenModal =
    () => {
      setError("");
      setSuccess("");
      setSelectedFile(null);
      setPreviewUrl("");

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      openModal();
    };

  const handleCloseModal =
    () => {
      if (
        saving ||
        removing
      ) {
        return;
      }

      if (
        previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setPreviewUrl("");
      setSelectedFile(null);
      setError("");
      setSuccess("");

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      closeModal();
    };

  /* =======================================================
     FILE
  ======================================================= */

  const handleFileChange =
    (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target
          .files?.[0];

      setError("");
      setSuccess("");

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
        setError(
          validationError
        );

        event.target.value =
          "";

        return;
      }

      if (
        previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setSelectedFile(
        file
      );

      setPreviewUrl(
        URL.createObjectURL(
          file
        )
      );
    };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async () => {
      if (!userId) {
        setError(
          "User could not be identified."
        );

        return;
      }

      if (!selectedFile) {
        setError(
          "Please select a profile picture."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const updatedUser =
          await uploadUserAvatar(
            userId,
            selectedFile
          );

        setAvatarPath(
          updatedUser.avatar ||
            ""
        );

        if (
          previewUrl.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            previewUrl
          );
        }

        setPreviewUrl("");
        setSelectedFile(null);

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        setSuccess(
          "Profile picture updated successfully."
        );

        window.setTimeout(
          () => {
            closeModal();
            setSuccess("");
          },
          650
        );
      } catch (err) {
        console.error(
          "Avatar upload failed:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to update profile picture."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     REMOVE
  ======================================================= */

  const handleRemoveAvatar =
    async () => {
      if (!userId) {
        setError(
          "User could not be identified."
        );

        return;
      }

      if (!avatarPath) {
        return;
      }

      try {
        setRemoving(true);
        setError("");
        setSuccess("");

        const updatedUser =
          await removeUserAvatar(
            userId
          );

        setAvatarPath(
          updatedUser.avatar ||
            ""
        );

        setPreviewUrl("");
        setSelectedFile(null);

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        setSuccess(
          "Profile picture removed successfully."
        );
      } catch (err) {
        console.error(
          "Avatar removal failed:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to remove profile picture."
        );
      } finally {
        setRemoving(false);
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      {/* ===================================================
          PROFILE CARD
      =================================================== */}

      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60 lg:p-6">
        {/* SUBTLE DECORATION */}

        <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-purple-500/[0.025]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* LEFT */}

          <div className="flex min-w-0 flex-col items-center gap-5 sm:flex-row">
            {/* AVATAR */}

            <div className="relative shrink-0">
              <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {currentImage &&
                !imageError ? (
                  <img
                    src={
                      currentImage
                    }
                    alt={
                      displayName
                    }
                    className="h-full w-full object-cover"
                    onError={() =>
                      setImageError(
                        true
                      )
                    }
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-600 dark:text-gray-300">
                    {initials}
                  </span>
                )}
              </div>

              {user?.isVerified && (
                <div
                  title="Verified account"
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-sm dark:border-gray-900"
                >
                  <Check
                    size={12}
                    strokeWidth={3}
                  />
                </div>
              )}
            </div>

            {/* DETAILS */}

            <div className="min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h3 className="truncate text-xl font-semibold text-gray-900 dark:text-white">
                  {displayName}
                </h3>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:justify-start">
                <span className="text-sm font-semibold text-[#6d28d9] dark:text-purple-400">
                  {roleLabel}
                </span>

                <span className="hidden h-4 w-px bg-gray-300 sm:block dark:bg-gray-700" />

                <span className="max-w-[280px] truncate text-sm text-gray-500 dark:text-gray-400">
                  {displayEmail}
                </span>
              </div>

              <div className="mt-3 flex justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 dark:border-orange-500/10 dark:bg-orange-500/10 dark:text-orange-400">
                  <ShieldCheck
                    size={12}
                  />

                  {accountLabel}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT */}

          <div className="flex items-center justify-center gap-2 lg:justify-end">
            {/* EMAIL STATUS */}

            <div
              title={
                user?.isVerified
                  ? "Email verified"
                  : "Email unverified"
              }
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                user?.isVerified
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              <Mail
                size={18}
              />
            </div>

            {/* PHONE STATUS */}

            <div
              title={
                user?.isPhoneVerified
                  ? "Phone verified"
                  : user?.phone
                    ? "Phone unverified"
                    : "Phone not added"
              }
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                user?.isPhoneVerified
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              <Phone
                size={18}
              />
            </div>

            {/* EDIT - ICON ONLY, LABEL ON HOVER */}

            <button
              type="button"
              onClick={
                handleOpenModal
              }
              title="Edit profile picture"
              aria-label="Edit profile picture"
              className="group flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-300 hover:w-[88px] hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-purple-500/30 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
            >
              <Pencil
                size={17}
                className="shrink-0"
              />

              <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[45px] group-hover:opacity-100">
                Edit
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================
          EDIT PROFILE PICTURE MODAL
      =================================================== */}

      <Modal
        isOpen={
          isOpen
        }
        onClose={
          handleCloseModal
        }
        className="m-4 max-w-[620px]"
      >
        <div className="relative w-full max-w-[620px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          {/* HEADER */}

          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:px-8">
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                <Camera
                  size={19}
                />
              </div>

              <div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Profile Picture
                </h4>

                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Upload a new image for your Solar Trade Hub dashboard account.
                </p>
              </div>
            </div>
          </div>

          {/* BODY */}

          <div className="px-6 py-6 sm:px-8">
            {/* PREVIEW */}

            <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-6 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gray-100 shadow-md dark:border-gray-800 dark:bg-gray-800">
                  {currentImage &&
                  !imageError ? (
                    <img
                      src={
                        currentImage
                      }
                      alt={
                        displayName
                      }
                      className="h-full w-full object-cover"
                      onError={() =>
                        setImageError(
                          true
                        )
                      }
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                      {initials}
                    </span>
                  )}
                </div>

                <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-purple-600 text-white shadow-sm dark:border-gray-900">
                  <Camera
                    size={14}
                  />
                </div>
              </div>

              <p className="mt-5 text-base font-semibold text-gray-900 dark:text-white">
                {displayName}
              </p>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {displayEmail}
              </p>
            </div>

            {/* MESSAGES */}

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                {success}
              </div>
            )}

            {/* UPLOAD */}

            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                Upload New Picture
              </p>

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={
                  handleFileChange
                }
                disabled={
                  saving ||
                  removing
                }
                className="hidden"
              />

              <button
                type="button"
                disabled={
                  saving ||
                  removing
                }
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="group flex w-full items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-4 text-left transition hover:border-purple-300 hover:bg-purple-50/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-white/[0.02] dark:hover:border-purple-500/40 dark:hover:bg-purple-500/[0.05]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm ring-1 ring-gray-200 transition group-hover:bg-purple-600 group-hover:text-white dark:bg-gray-800 dark:ring-gray-700">
                  <Upload
                    size={18}
                  />
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {selectedFile
                      ? selectedFile.name
                      : "Choose an image"}
                  </span>

                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    JPG, JPEG, PNG or WEBP · Maximum 5 MB
                  </span>
                </span>
              </button>

              {selectedFile && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedFile.name}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-400">
                      {(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(
                        2
                      )}{" "}
                      MB
                    </p>
                  </div>

                  <span className="ml-4 rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                    Ready
                  </span>
                </div>
              )}
            </div>

            {/* REMOVE */}

            {avatarPath && (
              <button
                type="button"
                disabled={
                  saving ||
                  removing
                }
                onClick={() => {
                  void handleRemoveAvatar();
                }}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2
                  size={15}
                />

                {removing
                  ? "Removing..."
                  : "Remove current picture"}
              </button>
            )}
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
            <Button
              size="sm"
              variant="outline"
              disabled={
                saving ||
                removing
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
                saving ||
                removing ||
                !selectedFile
              }
              onClick={() => {
                void handleSave();
              }}
            >
              {saving
                ? "Saving..."
                : "Save Picture"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}