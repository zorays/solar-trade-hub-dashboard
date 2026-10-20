
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

const normalizeBaseUrl = (value: string): string =>
  value.trim().replace(/\/+$/, "");

const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL?.trim() ||
    "http://localhost:5000/api/v1"
);

const API_TIMEOUT = 60_000;

/* =========================================================
   STORAGE KEYS
========================================================= */

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_USER_KEY = "authUser";

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

const isBrowser = (): boolean =>
  typeof window !== "undefined" &&
  typeof localStorage !== "undefined" &&
  typeof sessionStorage !== "undefined";

/* =========================================================
   GET STORED TOKENS
========================================================= */

export const getAccessToken = (): string | null => {
  if (!isBrowser()) return null;

  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
};

export const getRefreshToken = (): string | null => {
  if (!isBrowser()) return null;

  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  );
};

/* =========================================================
   REMEMBER ME
========================================================= */

const isRememberedLogin = (): boolean => {
  if (!isBrowser()) return false;

  return Boolean(
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
      localStorage.getItem(REFRESH_TOKEN_KEY)
  );
};

/* =========================================================
   SESSION VERSION

   Prevents an old refresh request from restoring tokens
   after logout, login or another session replacement.
========================================================= */

let sessionEpoch = 0;

/* =========================================================
   SAVE TOKENS
========================================================= */

export const setAuthTokens = (
  accessToken: string,
  refreshToken: string,
  rememberMe = false
): void => {
  if (!isBrowser()) return;

  const normalizedAccessToken = accessToken.trim();
  const normalizedRefreshToken = refreshToken.trim();

  if (!normalizedAccessToken || !normalizedRefreshToken) {
    throw new Error("Authentication tokens are invalid.");
  }

  sessionEpoch += 1;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);

  const storage = rememberMe
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
   VALIDATE REFRESHED USER SNAPSHOT

   Do not cache an unexpected customer or malformed user.

   The backend /auth/profile remains authoritative.
========================================================= */

const isDashboardUserSnapshot = (
  value: unknown
): value is Record<string, unknown> => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const user = value as Record<string, unknown>;
  const id = user._id ?? user.id;

  return (
    user.accountType === "dashboard" &&
    typeof id === "string" &&
    id.trim().length > 0 &&
    typeof user.name === "string" &&
    user.name.trim().length > 0 &&
    typeof user.email === "string" &&
    user.email.trim().length > 0 &&
    user.status === "active" &&
    user.isVerified === true &&
    typeof user.role === "string" &&
    user.role.trim().length > 0
  );
};

/* =========================================================
   UPDATE CACHED USER AFTER REFRESH
========================================================= */

const setStoredAuthUser = (
  user: unknown,
  rememberMe: boolean
): void => {
  if (
    !isBrowser() ||
    !isDashboardUserSnapshot(user)
  ) {
    return;
  }

  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);

  const storage = rememberMe
    ? localStorage
    : sessionStorage;

  storage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(user)
  );
};

/* =========================================================
   CLEAR AUTH STORAGE
========================================================= */

export const clearAuthStorage = (): void => {
  sessionEpoch += 1;

  if (!isBrowser()) return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);

  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
};

/* =========================================================
   AUTH PAGE REDIRECT
========================================================= */

const isPublicAuthPage = (
  pathname: string
): boolean =>
  pathname === "/signin" ||
  pathname === "/signup" ||
  pathname.startsWith("/forgot-password") ||
  pathname.startsWith("/reset-password") ||
  pathname.startsWith("/verify-email");

const redirectToSignIn = (): void => {
  if (!isBrowser()) return;

  if (
    isPublicAuthPage(window.location.pathname)
  ) {
    return;
  }

  window.location.replace("/signin");
};

/* =========================================================
   PUBLIC AUTH REQUESTS

   These requests must not inherit a stale bearer token.
========================================================= */

const isPublicAuthenticationRequest = (
  requestUrl = ""
): boolean =>
  requestUrl.includes("/auth/login") ||
  requestUrl.includes("/auth/register") ||
  requestUrl.includes("/auth/refresh-token") ||
  requestUrl.includes("/auth/forgot-password") ||
  requestUrl.includes("/auth/reset-password/") ||
  requestUrl.includes("/auth/verify-email/") ||
  requestUrl.includes(
    "/auth/resend-verification-email"
  ) ||
  requestUrl.includes("/auth/send-phone-otp") ||
  requestUrl.includes("/auth/verify-phone-otp");

/* =========================================================
   REQUESTS EXCLUDED FROM AUTOMATIC REFRESH
========================================================= */

const isRefreshExcludedRequest = (
  requestUrl = ""
): boolean =>
  requestUrl.includes("/auth/login") ||
  requestUrl.includes("/auth/register") ||
  requestUrl.includes("/auth/refresh-token") ||
  requestUrl.includes("/auth/forgot-password") ||
  requestUrl.includes("/auth/reset-password/") ||
  requestUrl.includes("/auth/verify-email/") ||
  requestUrl.includes(
    "/auth/resend-verification-email"
  );

/* =========================================================
   AXIOS INSTANCE
========================================================= */

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();
    const requestUrl = config.url || "";

    if (
      accessToken &&
      !isPublicAuthenticationRequest(requestUrl)
    ) {
      config.headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );
    } else {
      config.headers.delete("Authorization");
    }

    /* Browser must generate FormData boundary. */
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      config.headers.delete("Content-Type");
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/* =========================================================
   REFRESH LOCK

   Only one refresh request runs at a time within a tab.
========================================================= */

let refreshRequest:
  | Promise<RefreshTokenData>
  | null = null;

/* =========================================================
   REQUEST NEW TOKENS

   Raw Axios avoids recursive interceptor execution.
========================================================= */

const requestNewTokens = async (
  refreshToken: string
): Promise<RefreshTokenData> => {
  const response =
    await axios.post<RefreshTokenResponse>(
      `${API_BASE_URL}/auth/refresh-token`,
      {
        refreshToken,
      },
      {
        timeout: API_TIMEOUT,
        withCredentials: true,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

  const body = response.data;

  const data =
    body?.data &&
    typeof body.data === "object"
      ? body.data
      : body;

  const accessToken =
    typeof data?.accessToken === "string"
      ? data.accessToken.trim()
      : "";

  const newRefreshToken =
    typeof data?.refreshToken === "string"
      ? data.refreshToken.trim()
      : "";

  if (!accessToken) {
    throw new Error(
      "Access token was not returned by the server."
    );
  }

  if (!newRefreshToken) {
    throw new Error(
      "Refresh token was not returned by the server."
    );
  }

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: data?.user,
  };
};

/* =========================================================
   REFRESH SESSION

   Save rotated tokens exactly once.

   A changed session cannot be overwritten by an old
   asynchronous refresh response.
========================================================= */

const SESSION_CHANGED =
  "Authentication session changed during token refresh.";

const refreshSession = (
  currentRefreshToken: string
): Promise<RefreshTokenData> => {
  if (refreshRequest) {
    return refreshRequest;
  }

  const startingEpoch = sessionEpoch;
  const rememberMe = isRememberedLogin();

  const pending = (async (): Promise<RefreshTokenData> => {
    const tokenData = await requestNewTokens(
      currentRefreshToken
    );

    if (
      sessionEpoch !== startingEpoch ||
      getRefreshToken() !== currentRefreshToken
    ) {
      throw new Error(SESSION_CHANGED);
    }

    setAuthTokens(
      tokenData.accessToken,
      tokenData.refreshToken,
      rememberMe
    );

    if (tokenData.user) {
      setStoredAuthUser(
        tokenData.user,
        rememberMe
      );
    }

    return tokenData;
  })();

  refreshRequest = pending;

  void pending
    .finally(() => {
      if (refreshRequest === pending) {
        refreshRequest = null;
      }
    })
    .catch(() => {
      /* Waiting requests handle the refresh error. */
    });

  return pending;
};

/* =========================================================
   RESPONSE INTERCEPTOR
========================================================= */

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as
        | RetryRequestConfig
        | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl =
      originalRequest.url || "";

    const shouldRefresh =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshExcludedRequest(requestUrl);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    /* =====================================================
       ANOTHER REQUEST ALREADY REFRESHED THE TOKEN

       Retry with the latest access token instead of
       rotating the refresh token again.
    ===================================================== */

    const tokenUsed =
      originalRequest.headers?.get(
        "Authorization"
      );

    const currentAccessToken =
      getAccessToken();

    if (
      typeof tokenUsed === "string" &&
      currentAccessToken &&
      tokenUsed !==
        `Bearer ${currentAccessToken}`
    ) {
      originalRequest._retry = true;

      return api(originalRequest);
    }

    /* =====================================================
       NO REFRESH TOKEN
    ===================================================== */

    const refreshToken =
      getRefreshToken();

    if (!refreshToken) {
      if (
        !currentAccessToken ||
        tokenUsed ===
          `Bearer ${currentAccessToken}`
      ) {
        clearAuthStorage();
        redirectToSignIn();
      }

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const startingEpoch =
      sessionEpoch;

    /* =====================================================
       REFRESH AND RETRY
    ===================================================== */

    try {
      const { accessToken } =
        await refreshSession(refreshToken);

      if (
        getAccessToken() !== accessToken
      ) {
        throw new Error(SESSION_CHANGED);
      }

      if (!originalRequest.headers) {
        originalRequest.headers =
          new AxiosHeaders();
      }

      originalRequest.headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );

      return api(originalRequest);
    } catch (refreshError) {
      /* Do not erase a newer login or logout. */
      if (
        getRefreshToken() ===
          refreshToken &&
        sessionEpoch ===
          startingEpoch
      ) {
        clearAuthStorage();
        redirectToSignIn();
      }

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
