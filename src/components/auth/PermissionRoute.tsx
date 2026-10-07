import type {
  ReactNode,
} from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  hasAllUserPermissions,
  hasAnyUserPermission,
  hasUserPermission,
} from "../../services/auth.service";

/* =========================================================
   PERMISSION ROUTE PROPS
========================================================= */

type PermissionRouteProps = {
  /*
   * Single required permission.
   *
   * Example:
   * products.view
   */
  permission?: string;

  /*
   * User must have at least ONE of these permissions.
   */
  anyOf?: string[];

  /*
   * User must have ALL of these permissions.
   */
  allOf?: string[];

  /*
   * Restrict route to:
   *
   * admin
   * super_admin
   */
  adminOnly?: boolean;

  /*
   * Destination when access is denied.
   *
   * Default:
   * /
   */
  redirectTo?: string;

  /*
   * Supports both:
   *
   * <PermissionRoute>
   *   <Page />
   * </PermissionRoute>
   *
   * and nested React Router usage with <Outlet />.
   */
  children?: ReactNode;
};

/* =========================================================
   NORMALIZE PERMISSION
========================================================= */

const normalizePermission = (
  value: string
): string => {
  return value
    .trim()
    .toLowerCase();
};

/* =========================================================
   NORMALIZE PERMISSION LIST
========================================================= */

const normalizePermissionList = (
  permissions: string[]
): string[] => {
  return [
    ...new Set(
      permissions
        .map(
          normalizePermission
        )
        .filter(
          Boolean
        )
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

        {/* CONTENT */}

        <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-900 dark:text-white">
          Access Denied
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
          Your dashboard account does not have permission to access this
          Solar Trade Hub page. Contact an administrator if you need
          additional access.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PERMISSION LOADER
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

   ProtectedRoute handles:
   - authentication
   - dashboard account
   - account status
   - email verification
   - assigned role
   - active role

   PermissionRoute handles:
   - admin-only pages
   - single permission
   - any-of permissions
   - all-of permissions
========================================================= */

export default function PermissionRoute({
  permission,
  anyOf = [],
  allOf = [],
  adminOnly = false,
  redirectTo = "/",
  children,
}: PermissionRouteProps) {
  const location =
    useLocation();

  const {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
  } =
    useAuth();

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    isLoading
  ) {
    return (
      <PermissionLoader />
    );
  }

  /* =======================================================
     AUTHENTICATION

     This normally gets handled by ProtectedRoute, but keep
     this defensive check so PermissionRoute also works when
     used independently.
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
     DASHBOARD ACCOUNT DEFENSE
  ======================================================= */

  if (
    user.accountType !==
    "dashboard"
  ) {
    return (
      <PermissionDenied />
    );
  }

  /* =======================================================
     ADMIN-ONLY ROUTE
  ======================================================= */

  if (
    adminOnly &&
    !isAdmin
  ) {
    /*
     * Avoid:
     *
     * / → denied → redirect /
     *              ↓
     *         infinite loop
     */
    if (
      redirectTo ===
      location.pathname
    ) {
      return (
        <PermissionDenied />
      );
    }

    return (
      <Navigate
        to={
          redirectTo
        }
        replace
        state={{
          message:
            "You are not authorized to access this Solar Trade Hub page.",
        }}
      />
    );
  }

  /* =======================================================
     NORMALIZE REQUIREMENTS
  ======================================================= */

  const requiredPermission =
    permission
      ? normalizePermission(
          permission
        )
      : "";

  const anyPermissions =
    normalizePermissionList(
      anyOf
    );

  const allPermissions =
    normalizePermissionList(
      allOf
    );

  /* =======================================================
     PERMISSION CHECK
  ======================================================= */

  let hasAccess =
    true;

  /* =======================================================
     SINGLE PERMISSION
  ======================================================= */

  if (
    requiredPermission
  ) {
    hasAccess =
      hasAccess &&
      hasUserPermission(
        user,
        requiredPermission
      );
  }

  /* =======================================================
     ANY PERMISSION

     At least one permission must match.
  ======================================================= */

  if (
    anyPermissions.length >
    0
  ) {
    hasAccess =
      hasAccess &&
      hasAnyUserPermission(
        user,
        anyPermissions
      );
  }

  /* =======================================================
     ALL PERMISSIONS

     Every permission must match.
  ======================================================= */

  if (
    allPermissions.length >
    0
  ) {
    hasAccess =
      hasAccess &&
      hasAllUserPermissions(
        user,
        allPermissions
      );
  }

  /* =======================================================
     DENIED
  ======================================================= */

  if (
    !hasAccess
  ) {
    /*
     * Prevent a route from redirecting to itself forever.
     */
    if (
      redirectTo ===
      location.pathname
    ) {
      return (
        <PermissionDenied />
      );
    }

    return (
      <Navigate
        to={
          redirectTo
        }
        replace
        state={{
          message:
            "You do not have permission to access this Solar Trade Hub page.",
        }}
      />
    );
  }

  /* =======================================================
     AUTHORIZED CONTENT
  ======================================================= */

  if (
    children
  ) {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <Outlet />
  );
}