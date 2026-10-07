import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import {
  ChevronLeftIcon,
  EyeCloseIcon,
  EyeIcon,
} from "../../icons";

import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  getAuthErrorMessage,
  getAuthRetryAfter,
} from "../../services/auth.service";

/* =========================================================
   LOCATION STATE
========================================================= */

type LocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };

  message?: string;
};

/* =========================================================
   EMAIL
========================================================= */

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* =========================================================
   EMAIL VERIFICATION MESSAGE
========================================================= */

const getVerificationMessage = (
  search: string
): {
  type:
    | "success"
    | "error"
    | null;

  message: string;
} => {
  const params =
    new URLSearchParams(
      search
    );

  const verified =
    params.get(
      "emailVerified"
    );

  const reason =
    params.get(
      "reason"
    );

  if (
    verified ===
    "true"
  ) {
    return {
      type:
        "success",

      message:
        "Your email has been verified successfully. You can now sign in to your Solar Trade Hub dashboard.",
    };
  }

  if (
    verified !==
    "false"
  ) {
    return {
      type:
        null,

      message:
        "",
    };
  }

  if (
    reason ===
      "expired" ||
    reason ===
      "token_expired"
  ) {
    return {
      type:
        "error",

      message:
        "Your email verification link has expired. Please request a new verification email.",
    };
  }

  if (
    reason ===
      "invalid" ||
    reason ===
      "invalid_token"
  ) {
    return {
      type:
        "error",

      message:
        "The email verification link is invalid or has already been used.",
    };
  }

  return {
    type:
      "error",

    message:
      "Email verification could not be completed. Please request a new verification email and try again.",
  };
};

/* =========================================================
   SAFE REDIRECT
========================================================= */

const getSafeRedirect = (
  state:
    | LocationState
    | null
): string => {
  const pathname =
    state?.from
      ?.pathname;

  const search =
    state?.from
      ?.search ||
    "";

  if (
    !pathname ||
    !pathname.startsWith(
      "/"
    ) ||
    pathname.startsWith(
      "//"
    )
  ) {
    return "/";
  }

  const authPaths = [
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ];

  if (
    authPaths.some(
      (path) =>
        pathname.startsWith(
          path
        )
    )
  ) {
    return "/";
  }

  return `${pathname}${search}`;
};

/* =========================================================
   SIGN IN FORM
========================================================= */

export default function SignInForm() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    login,
  } =
    useAuth();

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(
      false
    );

  const [
    isChecked,
    setIsChecked,
  ] =
    useState(
      false
    );

  const [
    email,
    setEmail,
  ] =
    useState(
      ""
    );

  const [
    password,
    setPassword,
  ] =
    useState(
      ""
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(
      false
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState(
      ""
    );

  /* =======================================================
     LOCATION STATE
  ======================================================= */

  const locationState =
    location.state as
      | LocationState
      | null;

  /* =======================================================
     EMAIL VERIFICATION STATUS
  ======================================================= */

  const verificationNotice =
    useMemo(
      () =>
        getVerificationMessage(
          location.search
        ),
      [
        location.search,
      ]
    );

  /* =======================================================
     SUCCESS MESSAGE
  ======================================================= */

  const successMessage =
    verificationNotice.type ===
    "success"
      ? verificationNotice.message
      : locationState
          ?.message ||
        "";

  const verificationError =
    verificationNotice.type ===
    "error"
      ? verificationNotice.message
      : "";

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

      if (
        !password
      ) {
        setErrorMessage(
          "Please enter your password."
        );

        return;
      }

      /* ===================================================
         LOGIN
      =================================================== */

      try {
        setIsSubmitting(
          true
        );

        await login(
          {
            email:
              normalizedEmail,

            password,
          },
          isChecked
        );

        const destination =
          getSafeRedirect(
            locationState
          );

        navigate(
          destination,
          {
            replace:
              true,
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
     UI
  ======================================================= */

  return (
    <div className="w-full">
      {/* BACK */}

      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#ff4b1f] dark:text-gray-400"
      >
        <ChevronLeftIcon className="size-5" />

        Back to dashboard
      </Link>

      {/* BRAND */}

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

      {/* HEADER */}

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-px w-5 bg-[#ff4b1f]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff4b1f]">
            Welcome Back
          </span>
        </div>

        <h1 className="text-[30px] font-bold tracking-[-0.03em] text-gray-900 dark:text-white">
          Sign In
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Access your Solar Trade Hub dashboard.
        </p>
      </div>

      {/* TABS */}

      <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1 dark:bg-white/[0.05]">
        <div className="flex h-10 items-center justify-center rounded-lg bg-white text-sm font-semibold text-[#ff4b1f] shadow-sm dark:bg-white/[0.08]">
          Sign In
        </div>

        <Link
          to="/signup"
          className="flex h-10 items-center justify-center rounded-lg text-sm font-medium text-gray-500 transition hover:text-[#5b2eff] dark:text-gray-400"
        >
          Sign Up
        </Link>
      </div>

      {/* SUCCESS */}

      {successMessage && (
        <div
          role="status"
          className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400"
        >
          {successMessage}
        </div>
      )}

      {/* VERIFICATION ERROR */}

      {!errorMessage &&
        verificationError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
          >
            {verificationError}
          </div>
        )}

      {/* LOGIN ERROR */}

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
        >
          {errorMessage}
        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={
          handleSubmit
        }
        noValidate
      >
        <div className="space-y-4">
          {/* EMAIL */}

          <div>
            <Label>
              Email
              <span className="text-error-500">
                *
              </span>
            </Label>

            <Input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={email}
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
              }}
              disabled={
                isSubmitting
              }
            />
          </div>

          {/* PASSWORD */}

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

                  if (
                    errorMessage
                  ) {
                    setErrorMessage(
                      ""
                    );
                  }
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
          </div>

          {/* OPTIONS */}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  isChecked
                }
                onChange={
                  setIsChecked
                }
              />

              <span className="text-sm text-gray-500 dark:text-gray-400">
                Keep me logged in
              </span>
            </div>

            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-[#5b2eff] hover:text-[#4720db]"
            >
              Forgot password?
            </Link>
          </div>

          {/* SUBMIT */}

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

                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </div>
      </form>

      {/* SIGN UP */}

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{" "}

        <Link
          to="/signup"
          className="font-semibold text-[#5b2eff] hover:text-[#4720db]"
        >
          Create Account
        </Link>
      </p>
    </div>
  );
}