
import axios from "axios";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getProfile,
  isAdminUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthResponse,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from "../services/auth.service";

import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
} from "../services/api";

/* =========================================================
   SOLAR TRADE HUB DASHBOARD AUTH CONTEXT

   - Dashboard accounts only
   - Server-verified sessions
   - JWT access/refresh token support
   - Remember Me compatibility
   - Protected login/logout lifecycle
   - Role and permission refresh
   - Cross-tab session synchronization
========================================================= */

/* =========================================================
   TYPES
========================================================= */

interface AuthContextValue {
  user: AuthUser | null;

  isLoading: boolean;

  isAuthenticated: boolean;

  isAdmin: boolean;

  login: (
    payload: LoginPayload,
    rememberMe?: boolean
  ) => Promise<AuthResponse>;

  register: (
    payload: RegisterPayload
  ) => Promise<AuthResponse>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<AuthUser | null>;

  setUser: (user: AuthUser | null) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

/* =========================================================
   VALIDATE DASHBOARD USER

   Browser-side validation is defensive only.

   Actual authentication and authorization must remain
   enforced by the backend.
========================================================= */

const isUsableDashboardUser = (
  user: AuthUser | null
): user is AuthUser => {
  if (!user || typeof user !== "object") {
    return false;
  }

  if (user.accountType !== "dashboard") {
    return false;
  }

  if (user.status !== "active") {
    return false;
  }

  if (user.isVerified !== true) {
    return false;
  }

  const role =
    typeof user.role === "string"
      ? user.role.trim().toLowerCase()
      : "";

  if (
    !role ||
    role === "user" ||
    role === "customer"
  ) {
    return false;
  }

  /* System administrators */

  if (
    role === "admin" ||
    role === "super_admin"
  ) {
    return true;
  }

  /* Custom roles require a valid active role document. */

  if (!user.roleDetails) {
    return false;
  }

  const roleSlug =
    typeof user.roleDetails.slug === "string"
      ? user.roleDetails.slug.trim().toLowerCase()
      : "";

  if (roleSlug !== role) {
    return false;
  }

  if (user.roleDetails.status !== "active") {
    return false;
  }

  return true;
};

/* =========================================================
   TOKEN CHECK

   A refresh token may be sufficient for Axios to recover
   an expired access token through the response interceptor.
========================================================= */

const hasAuthSession = (): boolean =>
  Boolean(getAccessToken() || getRefreshToken());

/* =========================================================
   DEFINITIVE SESSION FAILURE

   A temporary network issue must not erase stored tokens.

   401 / 403 are treated as authorization failures.
========================================================= */

const shouldClearSession = (
  error: unknown
): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;

  return status === 401 || status === 403;
};

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({
  children,
}: AuthProviderProps) {
  /* =======================================================
     AUTHENTICATED USER

     Never initialize authenticated React state directly
     from localStorage or sessionStorage.

     GET /auth/profile must verify the session first.
  ======================================================= */

  const [user, setUserState] =
    useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /* =======================================================
     REQUEST GENERATION

     Prevent an older asynchronous profile response from
     overwriting a newer login/logout/session decision.
  ======================================================= */

  const authGeneration = useRef(0);

  /* =======================================================
     SAFE SET USER

     Preserves existing AuthContext API used by profile
     and dashboard components.

     This function is for trusted in-app updates only.
     It does not authenticate a new browser session.
  ======================================================= */

  const setUser = useCallback(
    (nextUser: AuthUser | null): void => {
      if (nextUser === null) {
        setUserState(null);
        return;
      }

      if (
        !hasAuthSession() ||
        !isUsableDashboardUser(nextUser)
      ) {
        setUserState(null);
        return;
      }

      setUserState(nextUser);
    },
    []
  );

  /* =======================================================
     REFRESH AUTHENTICATED PROFILE

     Backend /auth/profile is authoritative.

     Invalid/revoked sessions:
       Clear tokens and state.

     Temporary network failures:
       Preserve tokens, deny authenticated UI until
       a successful verification.
  ======================================================= */

  const refreshUser =
    useCallback(async (): Promise<AuthUser | null> => {
      const generation = ++authGeneration.current;

      if (!hasAuthSession()) {
        clearAuthStorage();
        setUserState(null);
        return null;
      }

      try {
        const profile = await getProfile();

        if (
          generation !== authGeneration.current
        ) {
          return null;
        }

        if (
          !hasAuthSession() ||
          !isUsableDashboardUser(profile)
        ) {
          clearAuthStorage();
          setUserState(null);
          return null;
        }

        setUserState(profile);
        return profile;
      } catch (error) {
        if (
          generation !== authGeneration.current
        ) {
          return null;
        }

        if (shouldClearSession(error)) {
          clearAuthStorage();
        }

        /* Never authenticate from stale cached data. */
        setUserState(null);
        return null;
      }
    }, []);

  /* =======================================================
     INITIALIZE SAVED SESSION

     Browser startup:
       Check tokens
         -> GET /auth/profile
         -> Axios may refresh expired access token
         -> Validate dashboard account and role
         -> Set authenticated state

     Temporary API failure:
       Preserve tokens but do not unlock dashboard.
  ======================================================= */

  useEffect(() => {
    let active = true;

    const generation = ++authGeneration.current;

    const initializeAuth = async (): Promise<void> => {
      try {
        if (!hasAuthSession()) {
          clearAuthStorage();

          if (
            active &&
            generation === authGeneration.current
          ) {
            setUserState(null);
          }

          return;
        }

        const profile = await getProfile();

        if (
          !active ||
          generation !== authGeneration.current
        ) {
          return;
        }

        if (
          !hasAuthSession() ||
          !isUsableDashboardUser(profile)
        ) {
          clearAuthStorage();
          setUserState(null);
          return;
        }

        setUserState(profile);
      } catch (error) {
        if (
          !active ||
          generation !== authGeneration.current
        ) {
          return;
        }

        if (shouldClearSession(error)) {
          clearAuthStorage();
        }

        /* Keep credentials on transient errors,
           but do not trust an unverified cached user. */
        setUserState(null);
      } finally {
        if (
          active &&
          generation === authGeneration.current
        ) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      active = false;

      if (authGeneration.current === generation) {
        authGeneration.current += 1;
      }
    };
  }, []);

  /* =======================================================
     PROFILE UPDATED EVENT

     Existing profile/avatar pages can dispatch:

     window.dispatchEvent(
       new CustomEvent("profile:updated")
     );

     This refreshes the authoritative backend profile.
  ======================================================= */

  useEffect(() => {
    const handleProfileUpdated = () => {
      void refreshUser();
    };

    window.addEventListener(
      "profile:updated",
      handleProfileUpdated
    );

    return () => {
      window.removeEventListener(
        "profile:updated",
        handleProfileUpdated
      );
    };
  }, [refreshUser]);

  /* =======================================================
     CROSS-TAB SESSION SYNCHRONIZATION

     localStorage is shared across tabs.
     sessionStorage remains per-tab.

     When another tab logs out, this tab removes
     authenticated state.

     When another tab establishes/changes a remembered
     session, verify it against the backend.
  ======================================================= */

  useEffect(() => {
    const handleStorageChange = (
      event: StorageEvent
    ): void => {
      if (event.storageArea !== localStorage) {
        return;
      }

      const relevantKeys = [
        "accessToken",
        "refreshToken",
        "authUser",
      ];

      if (
        event.key !== null &&
        !relevantKeys.includes(event.key)
      ) {
        return;
      }

      if (!hasAuthSession()) {
        authGeneration.current += 1;
        setUserState(null);
        return;
      }

      /*
       * A changed authUser or accessToken may represent
       * an updated remembered session.
       *
       * Verify the latest profile instead of trusting
       * browser storage directly.
       */
      if (
        event.key === "authUser" ||
        event.key === "accessToken" ||
        event.key === null
      ) {
        setUserState(null);
        void refreshUser();
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, [refreshUser]);

  /* =======================================================
     LOGIN

     auth.service.ts sends:

     POST /auth/login
     {
       source: "dashboard",
       email,
       password
     }

     Remember Me is managed by auth.service.ts/api.ts.
  ======================================================= */

  const login = useCallback(
    async (
      payload: LoginPayload,
      rememberMe = false
    ): Promise<AuthResponse> => {
      const generation = ++authGeneration.current;

      const response = await loginUser(
        payload,
        rememberMe
      );

      if (
        generation !== authGeneration.current
      ) {
        throw new Error(
          "Authentication session changed during sign in."
        );
      }

      if (
        !response.user ||
        !isUsableDashboardUser(response.user) ||
        !hasAuthSession()
      ) {
        clearAuthStorage();
        setUserState(null);

        throw new Error(
          "This account does not currently have access to the Solar Trade Hub dashboard."
        );
      }

      setUserState(response.user);

      return response;
    },
    []
  );

  /* =======================================================
     REGISTER DASHBOARD USER

     Registration remains unauthenticated.

     Backend controls:
       Email verification
       Role assignment
       First super-admin bootstrap
  ======================================================= */

  const register = useCallback(
    async (
      payload: RegisterPayload
    ): Promise<AuthResponse> => {
      authGeneration.current += 1;

      clearAuthStorage();
      setUserState(null);

      const response = await registerUser(payload);

      setUserState(null);

      return response;
    },
    []
  );

  /* =======================================================
     LOGOUT

     Always remove local session, even when the logout
     request fails.

     Preserve the logout Promise API for existing callers.
  ======================================================= */

  const logout = useCallback(
    async (): Promise<void> => {
      authGeneration.current += 1;

      try {
        await logoutUser();
      } finally {
        clearAuthStorage();
        setUserState(null);
      }
    },
    []
  );

  /* =======================================================
     AUTHENTICATION STATE

     User must have been accepted by the current
     authentication flow, not merely read from storage.
  ======================================================= */

  const isAuthenticated =
    isUsableDashboardUser(user) &&
    hasAuthSession();

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      isAdmin: isAdminUser(user),

      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
      setUser,
    ]
  );

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   AUTH HOOK
========================================================= */

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;
