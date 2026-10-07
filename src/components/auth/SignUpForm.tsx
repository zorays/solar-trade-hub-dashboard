import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  ChevronLeftIcon,
  EyeCloseIcon,
  EyeIcon,
} from "../../icons";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  getAuthErrorMessage,
  getAuthRetryAfter,
} from "../../services/auth.service";

import Label from "../form/Label";
import Input from "../form/input/InputField";

/* =========================================================
   VALIDATION
========================================================= */

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* =========================================================
   SIGN UP FORM
========================================================= */

export default function SignUpForm() {
  const navigate =
    useNavigate();

  const {
    register,
    isAuthenticated,
    isLoading: authLoading,
  } =
    useAuth();

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
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
     REDIRECT EXISTING AUTHENTICATED USER
  ======================================================= */

  useEffect(
    () => {
      if (
        !authLoading &&
        isAuthenticated
      ) {
        navigate(
          "/",
          {
            replace: true,
          }
        );
      }
    },
    [
      authLoading,
      isAuthenticated,
      navigate,
    ]
  );

  /* =======================================================
     CLEAR ERROR
  ======================================================= */

  const clearError =
    () => {
      if (
        errorMessage
      ) {
        setErrorMessage(
          ""
        );
      }
    };

  /* =======================================================
     REGISTER
  ======================================================= */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        isSubmitting ||
        authLoading
      ) {
        return;
      }

      setErrorMessage(
        ""
      );

      const normalizedName =
        name
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      /* ===================================================
         NAME VALIDATION
      =================================================== */

      if (
        !normalizedName
      ) {
        setErrorMessage(
          "Please enter your full name."
        );

        return;
      }

      if (
        normalizedName.length <
        2
      ) {
        setErrorMessage(
          "Name must contain at least 2 characters."
        );

        return;
      }

      if (
        normalizedName.length >
        150
      ) {
        setErrorMessage(
          "Name cannot exceed 150 characters."
        );

        return;
      }

      /* ===================================================
         EMAIL VALIDATION
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
         PASSWORD VALIDATION
      =================================================== */

      if (
        !password
      ) {
        setErrorMessage(
          "Please enter a password."
        );

        return;
      }

      if (
        password.length <
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
          "Please confirm your password."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setErrorMessage(
          "Passwords do not match."
        );

        return;
      }

      /* ===================================================
         BACKEND REGISTRATION
      =================================================== */

      try {
        setIsSubmitting(
          true
        );

        const response =
          await register({
            name:
              normalizedName,

            email:
              normalizedEmail,

            password,
          });

        /* =================================================
           CURRENT DASHBOARD FLOW

           register
             ↓
           email verification
             ↓
           role assignment
             ↓
           login

           Registration does NOT create a logged-in session.
        ================================================= */

        const verificationRequired =
          response
            .emailVerification
            ?.required ===
          true;

        const verificationSent =
          response
            .emailVerification
            ?.sent ===
          true;

        let message =
          response.message ||
          "Dashboard account created successfully.";

        if (
          verificationRequired &&
          verificationSent
        ) {
          message =
            "Account created successfully. Please check your email and verify your account before signing in.";
        }

        if (
          verificationRequired &&
          !verificationSent
        ) {
          message =
            "Your account was created, but the verification email could not be sent. Please request a new verification email before signing in.";
        }

        navigate(
          "/signin",
          {
            replace:
              true,

            state: {
              message,
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
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#ff4b1f] dark:text-gray-400"
      >
        <ChevronLeftIcon className="size-5" />

        Back to dashboard
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
              Access
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
            Join Solar Trade Hub
          </span>
        </div>

        <h1 className="text-[30px] font-bold tracking-[-0.03em] text-gray-900 dark:text-white">
          Create Account
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Create your Solar Trade Hub dashboard account.
        </p>
      </div>

      {/* ===================================================
          TABS
      =================================================== */}

      <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1 dark:bg-white/[0.05]">
        <Link
          to="/signin"
          className="flex h-10 items-center justify-center rounded-lg text-sm font-medium text-gray-500 transition hover:text-[#5b2eff] dark:text-gray-400"
        >
          Sign In
        </Link>

        <div className="flex h-10 items-center justify-center rounded-lg bg-white text-sm font-semibold text-[#ff4b1f] shadow-sm dark:bg-white/[0.08]">
          Sign Up
        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
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
              NAME
          =============================================== */}

          <div>
            <Label>
              Full Name

              <span className="text-error-500">
                *
              </span>
            </Label>

            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(
                event
              ) => {
                setName(
                  event.target
                    .value
                );

                clearError();
              }}
              disabled={
                isSubmitting
              }
            />
          </div>

          {/* ===============================================
              EMAIL
          =============================================== */}

          <div>
            <Label>
              Email

              <span className="text-error-500">
                *
              </span>
            </Label>

            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(
                event
              ) => {
                setEmail(
                  event.target
                    .value
                );

                clearError();
              }}
              disabled={
                isSubmitting
              }
            />
          </div>

          {/* ===============================================
              PASSWORD
          =============================================== */}

          <div>
            <Label>
              Password

              <span className="text-error-500">
                *
              </span>
            </Label>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={
                  password
                }
                onChange={(
                  event
                ) => {
                  setPassword(
                    event.target
                      .value
                  );

                  clearError();
                }}
                disabled={
                  isSubmitting
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
                  isSubmitting
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
              Confirm Password

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
                placeholder="Confirm your password"
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

                  clearError();
                }}
                disabled={
                  isSubmitting
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
                  isSubmitting
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
              ACCOUNT INFORMATION
          =============================================== */}

          <div className="rounded-xl border border-[#5b2eff]/15 bg-[#5b2eff]/[0.04] px-4 py-3">
            <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
              Dashboard accounts require email verification.
              New staff accounts may also require an administrator
              to assign a role before dashboard access is enabled.
            </p>
          </div>

          {/* ===============================================
              SUBMIT
          =============================================== */}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              authLoading
            }
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#ff4b1f] text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                Creating Account...
              </span>
            ) : authLoading ? (
              "Checking Session..."
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </form>

      {/* ===================================================
          SIGN IN
      =================================================== */}

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}

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