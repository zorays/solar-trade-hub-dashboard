import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
} from "react-router";

import {
  ChevronLeftIcon,
} from "../../icons";

import Label from "../form/Label";
import Input from "../form/input/InputField";

import {
  forgotPassword,
  getAuthErrorMessage,
  getAuthRetryAfter,
} from "../../services/auth.service";

/* =========================================================
   EMAIL VALIDATION
========================================================= */

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* =========================================================
   FORGOT PASSWORD FORM
========================================================= */

export default function ForgotPasswordForm() {
  const [
    email,
    setEmail,
  ] =
    useState("");

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

  const [
    successMessage,
    setSuccessMessage,
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

      setSuccessMessage(
        ""
      );

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      /* ===================================================
         VALIDATION
      =================================================== */

      if (
        !normalizedEmail
      ) {
        setErrorMessage(
          "Please enter your email address."
        );

        return;
      }

      if (
        !EMAIL_PATTERN.test(
          normalizedEmail
        )
      ) {
        setErrorMessage(
          "Please enter a valid email address."
        );

        return;
      }

      /* ===================================================
         REQUEST PASSWORD RESET
      =================================================== */

      try {
        setIsSubmitting(
          true
        );

        const response =
          await forgotPassword({
            email:
              normalizedEmail,
          });

        /*
         * Backend intentionally returns a generic response
         * so account existence is not exposed.
         */
        setSuccessMessage(
          response.message ||
            "If an account exists for this email address, password reset instructions have been sent."
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
            Account Recovery
          </span>
        </div>

        <h1 className="text-[30px] font-bold tracking-[-0.03em] text-gray-900 dark:text-white">
          Forgot Password?
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Enter your dashboard email address and we&apos;ll send you a secure
          password reset link.
        </p>
      </div>

      {/* ===================================================
          SUCCESS
      =================================================== */}

      {successMessage && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400"
        >
          {successMessage}
        </div>
      )}

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
              EMAIL
          =============================================== */}

          <div>
            <Label>
              Email Address

              <span className="text-error-500">
                *
              </span>
            </Label>

            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your dashboard email"
              value={
                email
              }
              onChange={(
                event
              ) => {
                setEmail(
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

                if (
                  successMessage
                ) {
                  setSuccessMessage(
                    ""
                  );
                }
              }}
              disabled={
                isSubmitting
              }
            />
          </div>

          {/* ===============================================
              INFO
          =============================================== */}

          <div className="rounded-xl border border-[#5b2eff]/15 bg-[#5b2eff]/[0.04] px-4 py-3">
            <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
              For security, Solar Trade Hub will not confirm whether an email
              address is registered. If a matching dashboard account exists,
              reset instructions will be sent to it.
            </p>
          </div>

          {/* ===============================================
              SUBMIT
          =============================================== */}

          <button
            type="submit"
            disabled={
              isSubmitting
            }
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#ff4b1f] text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                Sending Reset Link...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </div>
      </form>

      {/* ===================================================
          SIGN IN
      =================================================== */}

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Remembered your password?{" "}

        <Link
          to="/signin"
          className="font-semibold text-[#5b2eff] hover:text-[#4720db]"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}