
import type { ReactNode } from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router";

import { useAuth } from "../../context/AuthContext";

import {
  hasAllUserPermissions,
  hasAnyUserPermission,
  hasUserPermission,
} from "../../services/auth.service";

/* =========================================================
   SOLAR TRADE HUB DASHBOARD
   PERMISSION ROUTE

   Responsibilities:
   - Authentication fallback
   - Dashboard account validation
   - Admin-only page restriction
   - Single required permission
   - Any-of permission check
   - All-of permission check
   - Access Denied handling

   ProtectedRoute handles session, account and role checks.

   Backend RBAC remains authoritative.
========================================================= */

/* =========================================================
   PROPS

   redirectTo remains supported for compatibility with
   existing App.tsx routes.

   Unauthorized users see Access Denied rather than being
   redirected to another potentially restricted page.
========================================================= */

type PermissionRouteProps = {
  permission?: string;

  anyOf?: string[];

  allOf?: string[];

  adminOnly?: boolean;

  redirectTo?: string;

  children?: ReactNode;
};

/* =========================================================
   NORMALIZE PERMISSION
========================================================= */

const normalizePermission = (
  value: string
): string => value.trim().toLowerCase();

/* =========================================================
   NORMALIZE PERMISSION LIST

   Remove duplicate and empty permission values.
========================================================= */

const normalizePermissionList = (
  permissions: string[]
): string[] => {
  return [
    ...new Set(
      permissions
        .map(normalizePermission)
        .filter(Boolean)
    ),
  ];
};

/* =========================================================
   ACCESS DENIED SCREEN
========================================================= */

function PermissionDenied() {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">

        {/* BRAND */}

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

        {/* STATUS */}

        <div className="mb-3 flex items-center gap-2">
          <span className="h-px w-5 bg-[#ff4b1f]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff4b1f]">
            Permission Required
          </span>
        </div>

        {/* MESSAGE */}

        <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-900 dark:text-white">
          Access Denied
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
          Your dashboard account does not have permission to
          access this Solar Trade Hub page. Contact an
          administrator if you need additional access.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PERMISSION LOADING SCREEN
========================================================= */

function PermissionLoader() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff4b1f] dark:border-gray-700 dark:border-t-[#5b2eff]" />

        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Solar Trade Hub
          </p>

          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Checking permissions...
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PERMISSION ROUTE
========================================================= */

export default function PermissionRoute({
  permission,
  anyOf = [],
  allOf = [],
  adminOnly = false,
  redirectTo: _redirectTo = "/",
  children,
}: PermissionRouteProps) {
  const location = useLocation();

  const {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
  } = useAuth();

  /* =======================================================
     INITIAL AUTH LOADING

     Do not evaluate permissions while the authentication
     provider is still verifying the backend session.
  ======================================================= */

  if (isLoading) {
    return <PermissionLoader />;
  }

  /* =======================================================
     AUTHENTICATION FALLBACK

     ProtectedRoute normally handles this.

     Keep a defensive check so PermissionRoute can also
     work independently.
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
     DASHBOARD ACCOUNT VALIDATION
  ======================================================= */

  if (user.accountType !== "dashboard") {
    return <PermissionDenied />;
  }

  /* =======================================================
     ADMIN-ONLY ROUTES

     Preserve existing admin/super_admin policy from
     AuthContext and auth.service.ts.
  ======================================================= */

  if (adminOnly && !isAdmin) {
    return <PermissionDenied />;
  }

  /* =======================================================
     NORMALIZE REQUIRED PERMISSIONS
  ======================================================= */

  const requiredPermission = permission
    ? normalizePermission(permission)
    : "";

  const anyPermissions =
    normalizePermissionList(anyOf);

  const allPermissions =
    normalizePermissionList(allOf);

  /* =======================================================
     PERMISSION EVALUATION

     When more than one requirement is supplied,
     all requirement groups must pass.

     permission: one required permission

     anyOf: at least one permission

     allOf: every listed permission
  ======================================================= */

  let hasAccess = true;

  if (requiredPermission) {
    hasAccess =
      hasAccess &&
      hasUserPermission(
        user,
        requiredPermission
      );
  }

  if (anyPermissions.length > 0) {
    hasAccess =
      hasAccess &&
      hasAnyUserPermission(
        user,
        anyPermissions
      );
  }

  if (allPermissions.length > 0) {
    hasAccess =
      hasAccess &&
      hasAllUserPermissions(
        user,
        allPermissions
      );
  }

  /* =======================================================
     ACCESS DENIED

     Do not redirect to "/".

     A staff user might not have dashboard.view permission,
     causing confusing redirects or repeated access denial.

     Show the restriction on the current page instead.
  ======================================================= */

  if (!hasAccess) {
    return <PermissionDenied />;
  }

  /* =======================================================
     AUTHORIZED CONTENT

     Supports:
     - <PermissionRoute><Page /></PermissionRoute>
     - Nested React Router routes using <Outlet />
  ======================================================= */

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}
