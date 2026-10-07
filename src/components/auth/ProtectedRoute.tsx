import {
  useState,
} from "react";

import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../../context/AuthContext";

/* =========================================================
   ACCESS RESTRICTION
========================================================= */

type AccessRestrictionProps = {
  title: string;
  message: string;
};

function AccessRestriction({
  title,
  message,
}: AccessRestrictionProps) {
  const navigate =
    useNavigate();

  const {
    logout,
  } =
    useAuth();

  const [
    isSigningOut,
    setIsSigningOut,
  ] =
    useState(false);

  /* =======================================================
     SIGN OUT
  ======================================================= */

  const handleLogout =
    async () => {
      if (
        isSigningOut
      ) {
        return;
      }

      try {
        setIsSigningOut(
          true
        );

        await logout();
      } finally {
        navigate(
          "/signin",
          {
            replace:
              true,
          }
        );
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
            ACTION
        ================================================= */}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            disabled={
              isSigningOut
            }
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
   AUTH LOADING SCREEN
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

   Access requires:

   - authenticated session
   - dashboard account
   - active account
   - verified email
   - assigned dashboard role
   - active custom role when applicable

   Module/page permissions are handled separately by
   PermissionRoute.
========================================================= */

export default function ProtectedRoute() {
  const location =
    useLocation();

  const {
    user,
    isLoading,
    isAuthenticated,
  } =
    useAuth();

  /* =======================================================
     INITIAL AUTH CHECK
  ======================================================= */

  if (
    isLoading
  ) {
    return (
      <AuthenticationLoader />
    );
  }

  /* =======================================================
     NOT AUTHENTICATED

     Preserve requested route so Sign In can redirect the
     user back to it after successful authentication.
  ======================================================= */

  if (
    !isAuthenticated ||
    !user
  ) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{
          from: {
            pathname:
              location.pathname,

            search:
              location.search,
          },
        }}
      />
    );
  }

  /* =======================================================
     ACCOUNT TYPE

     Storefront customer sessions must never be accepted by
     the Dashboard application.
  ======================================================= */

  if (
    user.accountType !==
    "dashboard"
  ) {
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

  if (
    user.status ===
    "blocked"
  ) {
    return (
      <AccessRestriction
        title="Account Blocked"
        message="Your account has been blocked. Please contact a Solar Trade Hub administrator if you believe this restriction should be reviewed."
      />
    );
  }

  if (
    user.status ===
    "inactive"
  ) {
    return (
      <AccessRestriction
        title="Account Inactive"
        message="Your account is currently inactive. Please contact a Solar Trade Hub administrator to restore dashboard access."
      />
    );
  }

  /* =======================================================
     EMAIL VERIFICATION

     Normally the backend prevents an unverified Dashboard
     user from logging in.

     This remains as a defensive frontend check in case old
     browser state exists.
  ======================================================= */

  if (
    user.isVerified !==
    true
  ) {
    return (
      <AccessRestriction
        title="Email Verification Required"
        message="Your email address must be verified before you can access the Solar Trade Hub dashboard."
      />
    );
  }

  /* =======================================================
     ROLE
  ======================================================= */

  const normalizedRole =
    typeof user.role ===
      "string"
      ? user.role
          .trim()
          .toLowerCase()
      : "";

  /* =======================================================
     INVALID / UNASSIGNED ROLE

     Current backend blocks login for role "user", therefore
     this is primarily a defensive stale-session check.
  ======================================================= */

  if (
    !normalizedRole ||
    normalizedRole ===
      "user" ||
    normalizedRole ===
      "customer"
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
  ======================================================= */

  const isSystemAdministrator =
    normalizedRole ===
      "admin" ||
    normalizedRole ===
      "super_admin";

  if (
    isSystemAdministrator
  ) {
    return (
      <Outlet />
    );
  }

  /* =======================================================
     CUSTOM ROLE DETAILS

     Every non-system dashboard role should resolve to an
     active Role document.
  ======================================================= */

  if (
    !user.roleDetails
  ) {
    return (
      <AccessRestriction
        title="Role Configuration Error"
        message="Your assigned dashboard role could not be resolved. Please contact a Solar Trade Hub administrator."
      />
    );
  }

  /* =======================================================
     ROLE SLUG CONSISTENCY
  ======================================================= */

  const roleDetailsSlug =
    user.roleDetails.slug
      .trim()
      .toLowerCase();

  if (
    roleDetailsSlug !==
    normalizedRole
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

  if (
    user.roleDetails.status !==
    "active"
  ) {
    return (
      <AccessRestriction
        title="Role Inactive"
        message="Your assigned role is currently inactive. Please contact a Solar Trade Hub administrator to restore dashboard access."
      />
    );
  }

  /* =======================================================
     AUTHORIZED

     PermissionRoute will decide which individual pages and
     modules this user can access.
  ======================================================= */

  return (
    <Outlet />
  );
}