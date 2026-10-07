import axios from "axios";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getProfile,
  getStoredUser,
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
========================================================= */

/* =========================================================
   AUTH CONTEXT TYPE
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

  setUser: (
    user: AuthUser | null
  ) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

/* =========================================================
   DASHBOARD USER VALIDATION

   Frontend validation is not a security boundary.
   Backend authorization remains authoritative.

   This prevents stale/wrong browser state from being treated
   as a valid dashboard session.
========================================================= */

const isUsableDashboardUser = (
  user: AuthUser | null
): user is AuthUser => {
  if (!user) {
    return false;
  }

  if (
    user.accountType !==
    "dashboard"
  ) {
    return false;
  }

  if (
    user.status !==
    "active"
  ) {
    return false;
  }

  /*
   * "user" is the registered-but-unassigned Dashboard role.
   *
   * Current backend does not allow Dashboard access until an
   * admin assigns a system/custom role.
   */
  if (
    user.role ===
    "user"
  ) {
    return false;
  }

  if (
    user.role ===
    "customer"
  ) {
    return false;
  }

  return true;
};

/* =========================================================
   SESSION TOKEN CHECK

   A refresh token alone can recover an expired/missing
   access token through the Axios response interceptor.
========================================================= */

const hasAuthSession =
  (): boolean => {
    return Boolean(
      getAccessToken() ||
        getRefreshToken()
    );
  };

/* =========================================================
   INVALID SESSION ERROR CHECK

   Only definitive authentication/authorization failures
   should destroy saved authentication.

   A temporary network/server failure should not erase a
   user's remembered login credentials.
========================================================= */

const shouldClearSession = (
  error: unknown
): boolean => {
  if (
    !axios.isAxiosError(
      error
    )
  ) {
    return false;
  }

  const status =
    error.response?.status;

  return (
    status === 401 ||
    status === 403
  );
};

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({
  children,
}: AuthProviderProps) {
  /* =======================================================
     INITIAL STORED USER

     This state is temporary until initialization verifies
     the session against /auth/profile.
  ======================================================= */

  const [
    user,
    setUserState,
  ] =
    useState<AuthUser | null>(
      () => {
        const storedUser =
          getStoredUser();

        return isUsableDashboardUser(
          storedUser
        )
          ? storedUser
          : null;
      }
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  /* =======================================================
     SAFE USER SETTER
  ======================================================= */

  const setUser =
    useCallback(
      (
        nextUser:
          AuthUser | null
      ) => {
        if (
          nextUser ===
          null
        ) {
          setUserState(
            null
          );

          return;
        }

        if (
          !isUsableDashboardUser(
            nextUser
          )
        ) {
          setUserState(
            null
          );

          return;
        }

        setUserState(
          nextUser
        );
      },
      []
    );

  /* =======================================================
     REFRESH AUTHENTICATED USER

     Works when either:

     - valid access token exists
     - refresh token exists and Axios can recover session
  ======================================================= */

  const refreshUser =
    useCallback(
      async (): Promise<AuthUser | null> => {
        if (
          !hasAuthSession()
        ) {
          clearAuthStorage();

          setUserState(
            null
          );

          return null;
        }

        try {
          const profile =
            await getProfile();

          if (
            !isUsableDashboardUser(
              profile
            )
          ) {
            clearAuthStorage();

            setUserState(
              null
            );

            return null;
          }

          setUserState(
            profile
          );

          return profile;
        } catch (
          error
        ) {
          /*
           * 401 / 403 means the session is definitively no
           * longer authorized.
           *
           * Network errors and temporary 5xx failures do not
           * erase remembered authentication tokens.
           */
          if (
            shouldClearSession(
              error
            )
          ) {
            clearAuthStorage();

            setUserState(
              null
            );
          }

          return null;
        }
      },
      []
    );

  /* =======================================================
     INITIALIZE SAVED SESSION

     Application startup:

     Browser storage
          ↓
     token exists?
          ↓
     GET /auth/profile
          ↓
     Axios automatically refreshes expired access token
          ↓
     backend returns latest dashboard user
          ↓
     context authenticated
  ======================================================= */

  useEffect(
    () => {
      let active =
        true;

      const initializeAuth =
        async () => {
          try {
            /* =============================================
               NO SESSION
            ============================================= */

            if (
              !hasAuthSession()
            ) {
              clearAuthStorage();

              if (
                active
              ) {
                setUserState(
                  null
                );
              }

              return;
            }

            /* =============================================
               VALIDATE SESSION AGAINST BACKEND
            ============================================= */

            const profile =
              await getProfile();

            if (
              !active
            ) {
              return;
            }

            if (
              !isUsableDashboardUser(
                profile
              )
            ) {
              clearAuthStorage();

              setUserState(
                null
              );

              return;
            }

            setUserState(
              profile
            );
          } catch (
            error
          ) {
            if (
              !active
            ) {
              return;
            }

            /*
             * Invalid/unauthorized sessions are removed.
             *
             * Temporary API/network failures retain saved
             * session credentials so the user is not logged
             * out just because the backend briefly failed.
             */
            if (
              shouldClearSession(
                error
              )
            ) {
              clearAuthStorage();

              setUserState(
                null
              );

              return;
            }

            /*
             * During a temporary connectivity problem we may
             * retain an already stored dashboard user for UI
             * continuity.
             *
             * Backend authorization still protects all API
             * operations.
             */
            const storedUser =
              getStoredUser();

            if (
              isUsableDashboardUser(
                storedUser
              )
            ) {
              setUserState(
                storedUser
              );
            } else {
              setUserState(
                null
              );
            }
          } finally {
            if (
              active
            ) {
              setIsLoading(
                false
              );
            }
          }
        };

      void initializeAuth();

      return () => {
        active =
          false;
      };
    },
    []
  );

  /* =======================================================
     PROFILE UPDATE EVENT

     Profile/avatar components may dispatch:

     window.dispatchEvent(
       new CustomEvent("profile:updated")
     );

     Context then reloads the authoritative backend profile.
  ======================================================= */

  useEffect(
    () => {
      const handleProfileUpdated =
        () => {
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
    },
    [
      refreshUser,
    ]
  );

  /* =======================================================
     CROSS-TAB SESSION SYNC

     Relevant mainly when Remember Me uses localStorage.

     Example:

     Tab A logs out
          ↓
     localStorage cleared
          ↓
     Tab B receives storage event
          ↓
     AuthContext updates
  ======================================================= */

  useEffect(
    () => {
      const handleStorageChange =
        (
          event: StorageEvent
        ) => {
          const relevantKeys = [
            "accessToken",
            "refreshToken",
            "authUser",
          ];

          if (
            event.key !==
              null &&
            !relevantKeys.includes(
              event.key
            )
          ) {
            return;
          }

          if (
            !hasAuthSession()
          ) {
            setUserState(
              null
            );

            return;
          }

          const storedUser =
            getStoredUser();

          if (
            isUsableDashboardUser(
              storedUser
            )
          ) {
            setUserState(
              storedUser
            );
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
    },
    []
  );

  /* =======================================================
     LOGIN

     auth.service.ts performs:

     POST /auth/login

     {
       source: "dashboard",
       email,
       password
     }

     Successful login requires:

     - dashboard account
     - active account
     - verified email when required
     - assigned dashboard role
  ======================================================= */

  const login =
    useCallback(
      async (
        payload:
          LoginPayload,

        rememberMe =
          false
      ): Promise<AuthResponse> => {
        const response =
          await loginUser(
            payload,
            rememberMe
          );

        /*
         * loginUser() already requires the backend to return
         * user + access token + refresh token.
         */
        if (
          !response.user
        ) {
          clearAuthStorage();

          setUserState(
            null
          );

          throw new Error(
            "Authenticated user information was not returned by the server."
          );
        }

        if (
          !isUsableDashboardUser(
            response.user
          )
        ) {
          clearAuthStorage();

          setUserState(
            null
          );

          throw new Error(
            "This account does not currently have access to the Solar Trade Hub dashboard."
          );
        }

        setUserState(
          response.user
        );

        return response;
      },
      []
    );

  /* =======================================================
     REGISTER DASHBOARD USER

     Current Dashboard registration flow:

     register
        ↓
     no authenticated session
        ↓
     email verification
        ↓
     admin assigns role
        ↓
     sign in

     The only special bootstrap case is controlled entirely
     by the backend via FIRST_SUPER_ADMIN_EMAIL.
  ======================================================= */

  const register =
    useCallback(
      async (
        payload:
          RegisterPayload
      ): Promise<AuthResponse> => {
        /*
         * Remove any stale previous session before creating
         * another Dashboard account.
         */
        clearAuthStorage();

        setUserState(
          null
        );

        const response =
          await registerUser(
            payload
          );

        /*
         * Registration deliberately remains unauthenticated.
         *
         * Do not set response.user into AuthContext here.
         */
        setUserState(
          null
        );

        return response;
      },
      []
    );

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout =
    useCallback(
      async (): Promise<void> => {
        try {
          /*
           * Backend clears/revokes the stored refresh token.
           */
          await logoutUser();
        } finally {
          /*
           * Local session must disappear regardless of API
           * availability.
           */
          clearAuthStorage();

          setUserState(
            null
          );
        }
      },
      []
    );

  /* =======================================================
     AUTHENTICATION STATE

     Both conditions required:

     1. valid Dashboard user in context
     2. access or refresh token available
  ======================================================= */

  const isAuthenticated =
    Boolean(
      isUsableDashboardUser(
        user
      )
    ) &&
    hasAuthSession();

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,

        isLoading,

        isAuthenticated,

        isAdmin:
          isAdminUser(
            user
          ),

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
    <AuthContext.Provider
      value={
        value
      }
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   AUTH HOOK
========================================================= */

export function useAuth(): AuthContextValue {
  const context =
    useContext(
      AuthContext
    );

  if (
    !context
  ) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;