import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";

/* =========================================================
   SOLAR TRADE HUB DASHBOARD API CLIENT
========================================================= */

/* =========================================================
   API CONFIGURATION
========================================================= */

const normalizeBaseUrl = (
  value: string
): string => {
  return value
    .trim()
    .replace(
      /\/+$/,
      ""
    );
};

const API_BASE_URL =
  normalizeBaseUrl(
    import.meta.env.VITE_API_BASE_URL?.trim() ||
      "http://localhost:5000/api/v1"
  );

const API_TIMEOUT =
  60_000;

/* =========================================================
   STORAGE KEYS
========================================================= */

const ACCESS_TOKEN_KEY =
  "accessToken";

const REFRESH_TOKEN_KEY =
  "refreshToken";

const AUTH_USER_KEY =
  "authUser";

/* =========================================================
   TYPES
========================================================= */

type RetryRequestConfig =
  InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

type RefreshTokenData = {
  accessToken: string;
  refreshToken: string;

  /*
   * Backend refresh response also returns the current user.
   *
   * Keeping this as unknown avoids importing auth.service.ts
   * here and creating a circular dependency.
   */
  user?: unknown;
};

type RefreshTokenResponse = {
  success?: boolean;
  message?: string;

  accessToken?: string;
  refreshToken?: string;

  user?: unknown;

  data?: {
    accessToken?: string;
    refreshToken?: string;

    user?: unknown;
  };
};

/* =========================================================
   BROWSER CHECK
========================================================= */

const isBrowser = (): boolean => {
  return (
    typeof window !==
      "undefined" &&
    typeof localStorage !==
      "undefined" &&
    typeof sessionStorage !==
      "undefined"
  );
};

/* =========================================================
   TOKEN STORAGE
========================================================= */

export const getAccessToken =
  (): string | null => {
    if (
      !isBrowser()
    ) {
      return null;
    }

    return (
      localStorage.getItem(
        ACCESS_TOKEN_KEY
      ) ||
      sessionStorage.getItem(
        ACCESS_TOKEN_KEY
      )
    );
  };

export const getRefreshToken =
  (): string | null => {
    if (
      !isBrowser()
    ) {
      return null;
    }

    return (
      localStorage.getItem(
        REFRESH_TOKEN_KEY
      ) ||
      sessionStorage.getItem(
        REFRESH_TOKEN_KEY
      )
    );
  };

/* =========================================================
   REMEMBER-ME STORAGE MODE

   localStorage:
   remembered session

   sessionStorage:
   current browser-tab/session only
========================================================= */

const isRememberedLogin =
  (): boolean => {
    if (
      !isBrowser()
    ) {
      return false;
    }

    return Boolean(
      localStorage.getItem(
        ACCESS_TOKEN_KEY
      ) ||
      localStorage.getItem(
        REFRESH_TOKEN_KEY
      )
    );
  };

/* =========================================================
   SET AUTH TOKENS
========================================================= */

export const setAuthTokens = (
  accessToken: string,
  refreshToken: string,
  rememberMe = false
): void => {
  if (
    !isBrowser()
  ) {
    return;
  }

  const normalizedAccessToken =
    accessToken.trim();

  const normalizedRefreshToken =
    refreshToken.trim();

  if (
    !normalizedAccessToken ||
    !normalizedRefreshToken
  ) {
    throw new Error(
      "Authentication tokens are invalid."
    );
  }

  /*
   * A session must never be split between localStorage and
   * sessionStorage.
   */
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  sessionStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  sessionStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  const storage =
    rememberMe
      ? localStorage
      : sessionStorage;

  storage.setItem(
    ACCESS_TOKEN_KEY,
    normalizedAccessToken
  );

  storage.setItem(
    REFRESH_TOKEN_KEY,
    normalizedRefreshToken
  );
};

/* =========================================================
   UPDATE STORED USER AFTER TOKEN REFRESH

   Refresh-token response contains current database-backed:

   role
   permissions
   status
   verification state
   profile data

   Store this so dashboard UI does not continue using stale
   RBAC information after a successful token refresh.
========================================================= */

const setStoredAuthUser = (
  user: unknown,
  rememberMe: boolean
): void => {
  if (
    !isBrowser() ||
    !user ||
    typeof user !==
      "object"
  ) {
    return;
  }

  localStorage.removeItem(
    AUTH_USER_KEY
  );

  sessionStorage.removeItem(
    AUTH_USER_KEY
  );

  const storage =
    rememberMe
      ? localStorage
      : sessionStorage;

  storage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(
      user
    )
  );
};

/* =========================================================
   CLEAR AUTH STORAGE
========================================================= */

export const clearAuthStorage =
  (): void => {
    if (
      !isBrowser()
    ) {
      return;
    }

    localStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
      REFRESH_TOKEN_KEY
    );

    localStorage.removeItem(
      AUTH_USER_KEY
    );

    sessionStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

    sessionStorage.removeItem(
      REFRESH_TOKEN_KEY
    );

    sessionStorage.removeItem(
      AUTH_USER_KEY
    );
  };

/* =========================================================
   REDIRECT TO SIGN IN
========================================================= */

const isPublicAuthPage = (
  pathname: string
): boolean => {
  return (
    pathname ===
      "/signin" ||
    pathname ===
      "/signup" ||
    pathname.startsWith(
      "/forgot-password"
    ) ||
    pathname.startsWith(
      "/reset-password"
    ) ||
    pathname.startsWith(
      "/verify-email"
    )
  );
};

const redirectToSignIn =
  (): void => {
    if (
      !isBrowser()
    ) {
      return;
    }

    const currentPath =
      window.location.pathname;

    if (
      isPublicAuthPage(
        currentPath
      )
    ) {
      return;
    }

    window.location.replace(
      "/signin"
    );
  };

/* =========================================================
   PUBLIC AUTH REQUESTS

   These requests should NOT receive an old/stale access
   token from browser storage.
========================================================= */

const isPublicAuthenticationRequest = (
  requestUrl = ""
): boolean => {
  return (
    requestUrl.includes(
      "/auth/login"
    ) ||
    requestUrl.includes(
      "/auth/register"
    ) ||
    requestUrl.includes(
      "/auth/refresh-token"
    ) ||
    requestUrl.includes(
      "/auth/forgot-password"
    ) ||
    requestUrl.includes(
      "/auth/reset-password/"
    ) ||
    requestUrl.includes(
      "/auth/verify-email/"
    ) ||
    requestUrl.includes(
      "/auth/resend-verification-email"
    ) ||
    requestUrl.includes(
      "/auth/send-phone-otp"
    ) ||
    requestUrl.includes(
      "/auth/verify-phone-otp"
    )
  );
};

/* =========================================================
   DO NOT AUTO-REFRESH THESE REQUESTS

   Authentication failures on these endpoints are part of
   their normal workflow and must not trigger refresh logic.
========================================================= */

const isRefreshExcludedRequest = (
  requestUrl = ""
): boolean => {
  return (
    requestUrl.includes(
      "/auth/login"
    ) ||
    requestUrl.includes(
      "/auth/register"
    ) ||
    requestUrl.includes(
      "/auth/refresh-token"
    ) ||
    requestUrl.includes(
      "/auth/forgot-password"
    ) ||
    requestUrl.includes(
      "/auth/reset-password/"
    ) ||
    requestUrl.includes(
      "/auth/verify-email/"
    ) ||
    requestUrl.includes(
      "/auth/resend-verification-email"
    )
  );
};

/* =========================================================
   AXIOS INSTANCE

   Content-Type is intentionally not globally forced.

   JSON:
   Axios sets application/json.

   FormData:
   browser sets multipart boundary automatically.
========================================================= */

const api =
  axios.create({
    baseURL:
      API_BASE_URL,

    timeout:
      API_TIMEOUT,

    withCredentials:
      true,

    headers: {
      Accept:
        "application/json",
    },
  });

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

api.interceptors.request.use(
  (
    config:
      InternalAxiosRequestConfig
  ) => {
    const requestUrl =
      config.url ||
      "";

    const accessToken =
      getAccessToken();

    /* =====================================================
       BEARER TOKEN

       Public authentication calls must not inherit a stale
       dashboard access token.
    ===================================================== */

    if (
      accessToken &&
      !isPublicAuthenticationRequest(
        requestUrl
      )
    ) {
      if (
        !config.headers
      ) {
        config.headers =
          new AxiosHeaders();
      }

      config.headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );
    } else if (
      config.headers
    ) {
      config.headers.delete(
        "Authorization"
      );
    }

    /* =====================================================
       FORM DATA

       Never manually supply multipart Content-Type because
       browser must generate its boundary.
    ===================================================== */

    if (
      typeof FormData !==
        "undefined" &&
      config.data instanceof
        FormData
    ) {
      config.headers.delete(
        "Content-Type"
      );
    }

    return config;
  },

  (
    error: AxiosError
  ) => {
    return Promise.reject(
      error
    );
  }
);

/* =========================================================
   REFRESH REQUEST LOCK

   Example:

   Five dashboard requests expire simultaneously.

   Wrong:
   5 refresh requests
   → refresh-token rotation conflicts

   Correct:
   1 refresh request
   → all failed requests await same Promise
========================================================= */

let refreshRequest:
  | Promise<RefreshTokenData>
  | null = null;

/* =========================================================
   REQUEST NEW TOKENS
========================================================= */

const requestNewTokens =
  async (): Promise<RefreshTokenData> => {
    const refreshToken =
      getRefreshToken();

    if (
      !refreshToken
    ) {
      throw new Error(
        "Refresh token is missing."
      );
    }

    /*
     * Raw axios is intentional.
     *
     * Using the `api` instance here would allow the refresh
     * request to enter its own response interceptor.
     */
    const response =
      await axios.post<RefreshTokenResponse>(
        `${API_BASE_URL}/auth/refresh-token`,

        {
          refreshToken,
        },

        {
          timeout:
            API_TIMEOUT,

          withCredentials:
            true,

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",
          },
        }
      );

    const responseBody =
      response.data;

    const tokenData =
      responseBody?.data &&
      typeof responseBody.data ===
        "object"
        ? responseBody.data
        : responseBody;

    const newAccessToken =
      typeof tokenData
        ?.accessToken ===
      "string"
        ? tokenData.accessToken.trim()
        : "";

    const newRefreshToken =
      typeof tokenData
        ?.refreshToken ===
      "string"
        ? tokenData.refreshToken.trim()
        : "";

    if (
      !newAccessToken
    ) {
      throw new Error(
        "Access token was not returned by the server."
      );
    }

    /*
     * Solar Trade Hub backend rotates refresh tokens.
     *
     * Do not silently reuse the old refresh token if the
     * backend failed to return the newly rotated token.
     */
    if (
      !newRefreshToken
    ) {
      throw new Error(
        "Refresh token was not returned by the server."
      );
    }

    return {
      accessToken:
        newAccessToken,

      refreshToken:
        newRefreshToken,

      user:
        tokenData?.user,
    };
  };

/* =========================================================
   RESPONSE INTERCEPTOR
========================================================= */

api.interceptors.response.use(
  (
    response
  ) => {
    return response;
  },

  async (
    error: AxiosError
  ) => {
    const originalRequest =
      error.config as
        | RetryRequestConfig
        | undefined;

    if (
      !originalRequest
    ) {
      return Promise.reject(
        error
      );
    }

    const requestUrl =
      originalRequest.url ||
      "";

    /* =====================================================
       TOKEN REFRESH CONDITIONS

       Refresh only when:

       - backend returned 401
       - request has not already been retried
       - endpoint is not public auth/refresh
    ===================================================== */

    const shouldRefreshToken =
      error.response?.status ===
        401 &&
      !originalRequest._retry &&
      !isRefreshExcludedRequest(
        requestUrl
      );

    if (
      !shouldRefreshToken
    ) {
      return Promise.reject(
        error
      );
    }

    /* =====================================================
       NO REFRESH TOKEN

       Session cannot be recovered.
    ===================================================== */

    if (
      !getRefreshToken()
    ) {
      clearAuthStorage();

      redirectToSignIn();

      return Promise.reject(
        error
      );
    }

    originalRequest._retry =
      true;

    /* =====================================================
       REFRESH SESSION
    ===================================================== */

    try {
      if (
        !refreshRequest
      ) {
        refreshRequest =
          requestNewTokens()
            .finally(
              () => {
                refreshRequest =
                  null;
              }
            );
      }

      const {
        accessToken,
        refreshToken,
        user,
      } =
        await refreshRequest;

      const rememberMe =
        isRememberedLogin();

      /* ===================================================
         SAVE ROTATED TOKENS
      =================================================== */

      setAuthTokens(
        accessToken,
        refreshToken,
        rememberMe
      );

      /* ===================================================
         SAVE FRESH USER / RBAC STATE
      =================================================== */

      if (
        user
      ) {
        setStoredAuthUser(
          user,
          rememberMe
        );
      }

      /* ===================================================
         RETRY ORIGINAL REQUEST
      =================================================== */

      if (
        !originalRequest.headers
      ) {
        originalRequest.headers =
          new AxiosHeaders();
      }

      originalRequest.headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );

      /*
       * Retry exactly once.
       *
       * _retry prevents an infinite 401 → refresh loop.
       */
      return api(
        originalRequest
      );
    } catch (
      refreshError
    ) {
      /*
       * Refresh failure means the dashboard session is no
       * longer recoverable.
       */
      clearAuthStorage();

      redirectToSignIn();

      return Promise.reject(
        refreshError
      );
    }
  }
);

/* =========================================================
   EXPORTS
========================================================= */

export {
  API_BASE_URL,
};

export default api;