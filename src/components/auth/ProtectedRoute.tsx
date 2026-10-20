
import { useState } from "react";

import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";

import { useAuth } from "../../context/AuthContext";

/* =========================================================
   SOLAR TRADE HUB DASHBOARD
   PROTECTED ROUTE

   Responsibilities:
   - Authentication validation
   - Dashboard account restriction
   - Active account requirement
   - Email verification requirement
   - Assigned role validation
   - Active custom role validation

   Module permissions are handled by PermissionRoute.

   Backend authorization remains authoritative.
========================================================= */

/* =========================================================
   ACCESS RESTRICTION TYPES
========================================================= */

type AccessRestrictionProps = {
  title: string;
  message: string;
};

/* =========================================================
   ACCESS RESTRICTION SCREEN
========================================================= */

function AccessRestriction({
  title,
  message,
}: AccessRestrictionProps) {
  const navigate = useNavigate();

  const { logout } = useAuth();

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  /* =======================================================
     SAFE LOGOUT

     AuthContext clears the local session even if the
     backend logout request fails.

     Catch errors here so the click handler cannot create
     an unhandled Promise rejection.
  ======================================================= */

  const handleLogout = async (): Promise<void> => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await logout();
    } catch (error) {
      /*
       * The local session is already cleared by
       * AuthContext.logout() in its finally block.
       *
       * Avoid exposing internal API error details.
       */
      console.warn(
        "Dashboard sign-out request failed; local session was cleared.",
        error
      );
    } finally {
      navigate("/signin", {
        replace: true,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff4b1f] shadow-[0_8px_22px_rgba(255,75,31,0.22)]">
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

        {/* =================================================
            STATUS
        ================================================= */}

        <div className="mb-3 flex items-center gap-2">
          <span className="h-px w-5 bg-[#ff4b1f]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff4b1f]">
            Access Restricted
          </span>
        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-900 dark:text-white">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
          {message}
        </p>

        {/* =================================================
            SIGN OUT ACTION
        ================================================= */}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            disabled={isSigningOut}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#ff4b1f] px-5 text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut
              ? "Signing Out..."
              : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   AUTHENTICATION LOADING SCREEN
========================================================= */

function AuthenticationLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="flex items-center gap-3">
          <span className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#ff4b1f] dark:border-gray-700 dark:border-t-[#5b2eff]" />

          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Solar Trade Hub
            </p>

            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Loading dashboard...
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* =========================================================
   PROTECTED DASHBOARD ROUTE
========================================================= */

export default function ProtectedRoute() {
  const location = useLocation();

  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuth();

  /* =======================================================
     INITIAL AUTH CHECK

     AuthContext verifies saved sessions with the backend.

     Do not render protected content during initialization.
  ======================================================= */

  if (isLoading) {
    return <AuthenticationLoader />;
  }

  /* =======================================================
     NOT AUTHENTICATED

     Preserve the originally requested route so SignInForm
     can navigate there after successful authentication.
  ======================================================= */

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
          },
        }}
      />
    );
  }

  /* =======================================================
     ACCOUNT TYPE

     Storefront customer accounts cannot access Dashboard.
  ======================================================= */

  if (user.accountType !== "dashboard") {
    return (
      <AccessRestriction
        title="Dashboard Access Required"
        message="This account is not a Solar Trade Hub dashboard account. Please sign in with an authorized dashboard account."
      />
    );
  }

  /* =======================================================
     ACCOUNT STATUS
  ======================================================= */

  if (user.status === "blocked") {
    return (
      <AccessRestriction
        title="Account Blocked"
        message="Your account has been blocked. Please contact a Solar Trade Hub administrator if you believe this restriction should be reviewed."
      />
    );
  }

  if (user.status !== "active") {
    return (
      <AccessRestriction
        title="Account Inactive"
        message="Your account is currently inactive. Please contact a Solar Trade Hub administrator to restore dashboard access."
      />
    );
  }

  /* =======================================================
     EMAIL VERIFICATION
  ======================================================= */

  if (user.isVerified !== true) {
    return (
      <AccessRestriction
        title="Email Verification Required"
        message="Your email address must be verified before you can access the Solar Trade Hub dashboard."
      />
    );
  }

  /* =======================================================
     ROLE NORMALIZATION
  ======================================================= */

  const normalizedRole =
    typeof user.role === "string"
      ? user.role.trim().toLowerCase()
      : "";

  /* =======================================================
     INVALID OR UNASSIGNED ROLE
  ======================================================= */

  if (
    !normalizedRole ||
    normalizedRole === "user" ||
    normalizedRole === "customer"
  ) {
    return (
      <AccessRestriction
        title="Role Assignment Required"
        message="Your dashboard account does not currently have an active assigned role. A Solar Trade Hub administrator must assign a role before dashboard access is available."
      />
    );
  }

  /* =======================================================
     SYSTEM ADMINISTRATORS

     Existing backend policy recognizes admin and
     super_admin as system administrator roles.

     Permission enforcement remains on the backend.
  ======================================================= */

  const isSystemAdministrator =
    normalizedRole === "admin" ||
    normalizedRole === "super_admin";

  if (isSystemAdministrator) {
    return <Outlet />;
  }

  /* =======================================================
     CUSTOM ROLE DETAILS
  ======================================================= */

  if (!user.roleDetails) {
    return (
      <AccessRestriction
        title="Role Configuration Error"
        message="Your assigned dashboard role could not be resolved. Please contact a Solar Trade Hub administrator."
      />
    );
  }

  /* =======================================================
     ROLE SLUG VALIDATION

     Safely handle malformed role metadata.
  ======================================================= */

  const roleDetailsSlug =
    typeof user.roleDetails.slug === "string"
      ? user.roleDetails.slug.trim().toLowerCase()
      : "";

  if (
    !roleDetailsSlug ||
    roleDetailsSlug !== normalizedRole
  ) {
    return (
      <AccessRestriction
        title="Role Configuration Error"
        message="Your dashboard role configuration is inconsistent. Please contact a Solar Trade Hub administrator."
      />
    );
  }

  /* =======================================================
     CUSTOM ROLE STATUS
  ======================================================= */

  if (user.roleDetails.status !== "active") {
    return (
      <AccessRestriction
        title="Role Inactive"
        message="Your assigned role is currently inactive. Please contact a Solar Trade Hub administrator to restore dashboard access."
      />
    );
  }

  /* =======================================================
     AUTHORIZED

     PermissionRoute checks module-specific permissions.
  ======================================================= */

  return <Outlet />;
}
