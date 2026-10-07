import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import {
  ChevronLeftIcon,
  EyeCloseIcon,
  EyeIcon,
} from "../../icons";

import Label from "../form/Label";
import Input from "../form/input/InputField";

import {
  getAuthErrorMessage,
  getAuthRetryAfter,
  resetPassword,
} from "../../services/auth.service";

/* =========================================================
   RESET PASSWORD FORM
========================================================= */

export default function ResetPasswordForm() {
  const navigate =
    useNavigate();

  const {
    token = "",
  } =
    useParams<{
      token: string;
    }>();

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
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        isSubmitting
      ) {
        return;
      }

      setErrorMessage(
        ""
      );

      const normalizedToken =
        token.trim();

      /* ===================================================
         TOKEN
      =================================================== */

      if (
        !normalizedToken
      ) {
        setErrorMessage(
          "Password reset link is invalid or incomplete."
        );

        return;
      }

      /* ===================================================
         PASSWORD
      =================================================== */

      if (
        !newPassword
      ) {
        setErrorMessage(
          "Please enter your new password."
        );

        return;
      }

      if (
        newPassword.length <
        8
      ) {
        setErrorMessage(
          "Password must contain at least 8 characters."
        );

        return;
      }

      if (
        !confirmPassword
      ) {
        setErrorMessage(
          "Please confirm your new password."
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setErrorMessage(
          "Passwords do not match."
        );

        return;
      }

      /* ===================================================
         RESET PASSWORD
      =================================================== */

      try {
        setIsSubmitting(
          true
        );

        const response =
          await resetPassword(
            normalizedToken,
            {
              newPassword,
              confirmPassword,
            }
          );

        navigate(
          "/signin",
          {
            replace:
              true,

            state: {
              message:
                response.message ||
                "Your password has been reset successfully. You can now sign in with your new password.",
            },
          }
        );
      } catch (
        error
      ) {
        const message =
          getAuthErrorMessage(
            error
          );

        const retryAfter =
          getAuthRetryAfter(
            error
          );

        if (
          retryAfter !==
            null &&
          retryAfter > 0
        ) {
          setErrorMessage(
            `${message} Please try again in ${retryAfter} second${
              retryAfter === 1
                ? ""
                : "s"
            }.`
          );
        } else {
          setErrorMessage(
            message
          );
        }
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full">
      {/* ===================================================
          BACK
      =================================================== */}

      <Link
        to="/signin"
        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#ff4b1f] dark:text-gray-400"
      >
        <ChevronLeftIcon className="size-5" />

        Back to sign in
      </Link>

      {/* ===================================================
          BRAND
      =================================================== */}

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff4b1f]">
          <svg
            viewBox="0 0 40 40"
            className="h-5 w-5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 8H24L32 16L23 25L16 18L22 12"
              stroke="white"
              strokeWidth="4"
            />

            <path
              d="M28 32H16L8 24L17 15L24 22L18 28"
              stroke="white"
              strokeWidth="4"
            />
          </svg>
        </div>

        <div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            Solar Trade Hub
          </div>

          <div className="text-[9px] font-semibold uppercase tracking-[0.22em]">
            <span className="text-[#ff4b1f]">
              Dashboard
            </span>

            <span className="ml-1 text-[#5b2eff]">
              Recovery
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-px w-5 bg-[#ff4b1f]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff4b1f]">
            Secure Password Reset
          </span>
        </div>

        <h1 className="text-[30px] font-bold tracking-[-0.03em] text-gray-900 dark:text-white">
          Reset Password
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Create a new password for your Solar Trade Hub dashboard account.
        </p>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
        >
          {errorMessage}
        </div>
      )}

      {/* ===================================================
          INVALID TOKEN
      =================================================== */}

      {!token.trim() && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
          This password reset link is incomplete. Please request a new reset
          link from the forgot password page.
        </div>
      )}

      {/* ===================================================
          FORM
      =================================================== */}

      <form
        onSubmit={
          handleSubmit
        }
        noValidate
      >
        <div className="space-y-4">
          {/* ===============================================
              NEW PASSWORD
          =============================================== */}

          <div>
            <Label>
              New Password

              <span className="text-error-500">
                *
              </span>
            </Label>

            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your new password"
                value={
                  newPassword
                }
                onChange={(
                  event
                ) => {
                  setNewPassword(
                    event.target
                      .value
                  );

                  if (
                    errorMessage
                  ) {
                    setErrorMessage(
                      ""
                    );
                  }
                }}
                disabled={
                  isSubmitting ||
                  !token.trim()
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (
                      previous
                    ) =>
                      !previous
                  )
                }
                disabled={
                  isSubmitting ||
                  !token.trim()
                }
                className="absolute right-4 top-1/2 z-30 -translate-y-1/2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                ) : (
                  <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                )}
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Minimum 8 characters.
            </p>
          </div>

          {/* ===============================================
              CONFIRM PASSWORD
          =============================================== */}

          <div>
            <Label>
              Confirm New Password

              <span className="text-error-500">
                *
              </span>
            </Label>

            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm your new password"
                value={
                  confirmPassword
                }
                onChange={(
                  event
                ) => {
                  setConfirmPassword(
                    event.target
                      .value
                  );

                  if (
                    errorMessage
                  ) {
                    setErrorMessage(
                      ""
                    );
                  }
                }}
                disabled={
                  isSubmitting ||
                  !token.trim()
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (
                      previous
                    ) =>
                      !previous
                  )
                }
                disabled={
                  isSubmitting ||
                  !token.trim()
                }
                className="absolute right-4 top-1/2 z-30 -translate-y-1/2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
              >
                {showConfirmPassword ? (
                  <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                ) : (
                  <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* ===============================================
              SECURITY INFO
          =============================================== */}

          <div className="rounded-xl border border-[#5b2eff]/15 bg-[#5b2eff]/[0.04] px-4 py-3">
            <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
              After your password is reset, existing refresh sessions will no
              longer be valid and you will need to sign in again.
            </p>
          </div>

          {/* ===============================================
              SUBMIT
          =============================================== */}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !token.trim()
            }
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#ff4b1f] text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                Resetting Password...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </div>
      </form>

      {/* ===================================================
          REQUEST NEW LINK
      =================================================== */}

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Need a new reset link?{" "}

        <Link
          to="/forgot-password"
          className="font-semibold text-[#5b2eff] hover:text-[#4720db]"
        >
          Request Again
        </Link>
      </p>
    </div>
  );
}