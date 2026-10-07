import axios from "axios";

import api, {
  clearAuthStorage,
  setAuthTokens,
} from "./api";

/* =========================================================
   SOLAR TRADE HUB DASHBOARD AUTH SERVICE
========================================================= */

/* =========================================================
   AUTH CONSTANTS
========================================================= */

export const DASHBOARD_AUTH_SOURCE =
  "dashboard" as const;

export type AccountType =
  | "dashboard"
  | "customer";

export type AuthProvider =
  | "local"
  | "google";

export type UserStatus =
  | "active"
  | "inactive"
  | "blocked";

export type RoleStatus =
  | "active"
  | "inactive";

/* =========================================================
   USER ROLE

   Dashboard role slug is dynamic.

   Examples:

   user
   admin
   super_admin
   accountant
   sales
   electrical_engineer
========================================================= */

export type UserRole =
  string;

/* =========================================================
   ROLE DETAILS
========================================================= */

export interface AuthRoleDetails {
  _id?: string;

  name: string;
  slug: string;

  description: string;

  permissions: string[];

  isSystemRole: boolean;

  status: RoleStatus;
}

/* =========================================================
   MARKETING PREFERENCES
========================================================= */

export interface MarketingPreferences {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;

  updatedAt?: string | null;
}

/* =========================================================
   AUTHENTICATED USER
========================================================= */

export interface AuthUser {
  _id: string;
  id: string;

  accountType: AccountType;

  name: string;
  email: string;

  phone: string;
  countryCode: string;
  phoneE164: string;

  avatar: string;

  role: UserRole;

  roleDetails:
    | AuthRoleDetails
    | null;

  permissions: string[];

  roleAssignedBy:
    | string
    | null;

  roleAssignedAt:
    | string
    | null;

  provider: AuthProvider;

  isVerified: boolean;
  isPhoneVerified: boolean;

  marketingPreferences:
    MarketingPreferences;

  status: UserStatus;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   AUTH REQUEST PAYLOADS
========================================================= */

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/* =========================================================
   EMAIL VERIFICATION RESPONSE
========================================================= */

export interface EmailVerificationState {
  required: boolean;
  sent: boolean;
  verified: boolean;

  /*
   * Development only.
   *
   * Backend returns these only when:
   *
   * NODE_ENV=development
   * EXPOSE_AUTH_DEBUG_TOKENS=true
   */
  debugToken?: string;
  debugUrl?: string;
}

/* =========================================================
   PHONE VERIFICATION RESPONSE

   Dashboard does not require phone verification, but backend
   may include this object in registration responses.
========================================================= */

export interface PhoneVerificationState {
  required: boolean;
  sent: boolean;
  verified: boolean;

  nextAction?: string | null;

  phone?: string;

  expiresInMinutes?: number;
  resendAfterSeconds?: number;

  debugOtp?: string;
}

/* =========================================================
   DEBUG AUTH DATA
========================================================= */

export interface AuthDebugData {
  resetToken?: string;
  resetUrl?: string;

  verificationToken?: string;
  verificationUrl?: string;
}

/* =========================================================
   AUTH RESPONSE
========================================================= */

export interface AuthResponse {
  success?: boolean;
  message?: string;

  source?:
    | "dashboard"
    | "storefront";

  accountType?: AccountType;

  accessToken?: string;
  refreshToken?: string;

  user?: AuthUser;

  emailVerification?:
    EmailVerificationState;

  phoneVerification?:
    PhoneVerificationState;

  debug?: AuthDebugData;
}

/* =========================================================
   RAW BACKEND RESPONSE

   Current backend responds directly:

   {
     success,
     message,
     accessToken,
     refreshToken,
     user
   }

   data wrapper remains supported temporarily so existing
   frontend code does not break if another endpoint returns:

   {
     success,
     data: { ... }
   }
========================================================= */

type RawAuthResponse =
  AuthResponse & {
    data?: AuthResponse;
  };

/* =========================================================
   API ERROR
========================================================= */

export interface ApiErrorResponse {
  success?: boolean;

  message?: string;

  errors?: Array<{
    field?: string;
    message?: string;
  }>;

  retryAfter?: number;

  attemptsRemaining?: number;
}

/* =========================================================
   BASIC NORMALIZERS
========================================================= */

const normalizeString = (
  value: unknown
): string => {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
};

const normalizeBoolean = (
  value: unknown
): boolean => {
  return value === true;
};

const normalizePermissions = (
  value: unknown
): string[] => {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter(
          (
            permission
          ): permission is string =>
            typeof permission ===
              "string"
        )
        .map(
          (permission) =>
            permission
              .trim()
              .toLowerCase()
        )
        .filter(Boolean)
    ),
  ];
};

/* =========================================================
   ACCOUNT TYPE NORMALIZER
========================================================= */

const normalizeAccountType = (
  value: unknown
): AccountType => {
  return value ===
    "customer"
    ? "customer"
    : "dashboard";
};

/* =========================================================
   ROLE NORMALIZER
========================================================= */

const normalizeRoleSlug = (
  value: unknown
): string => {
  return normalizeString(
    value
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
};

/* =========================================================
   ROLE DETAILS NORMALIZER
========================================================= */

const normalizeRoleDetails = (
  rawRole: unknown
): AuthRoleDetails | null => {
  if (
    !rawRole ||
    typeof rawRole !==
      "object"
  ) {
    return null;
  }

  const role =
    rawRole as {
      _id?: unknown;

      name?: unknown;
      slug?: unknown;

      description?: unknown;

      permissions?: unknown;

      isSystemRole?: unknown;

      status?: unknown;
    };

  const slug =
    normalizeRoleSlug(
      role.slug
    );

  if (!slug) {
    return null;
  }

  return {
    _id:
      normalizeString(
        role._id
      ) ||
      undefined,

    name:
      normalizeString(
        role.name
      ) ||
      slug,

    slug,

    description:
      normalizeString(
        role.description
      ),

    permissions:
      normalizePermissions(
        role.permissions
      ),

    isSystemRole:
      normalizeBoolean(
        role.isSystemRole
      ),

    status:
      role.status ===
      "inactive"
        ? "inactive"
        : "active",
  };
};

/* =========================================================
   MARKETING PREFERENCES NORMALIZER
========================================================= */

const normalizeMarketingPreferences = (
  rawPreferences: unknown
): MarketingPreferences => {
  if (
    !rawPreferences ||
    typeof rawPreferences !==
      "object"
  ) {
    return {
      email: false,
      sms: false,
      whatsapp: false,
      updatedAt: null,
    };
  }

  const preferences =
    rawPreferences as {
      email?: unknown;
      sms?: unknown;
      whatsapp?: unknown;
      updatedAt?: unknown;
    };

  return {
    email:
      normalizeBoolean(
        preferences.email
      ),

    sms:
      normalizeBoolean(
        preferences.sms
      ),

    whatsapp:
      normalizeBoolean(
        preferences.whatsapp
      ),

    updatedAt:
      normalizeString(
        preferences.updatedAt
      ) ||
      null,
  };
};

/* =========================================================
   AUTH USER NORMALIZER
========================================================= */

const normalizeAuthUser = (
  rawUser: unknown
): AuthUser | null => {
  if (
    !rawUser ||
    typeof rawUser !==
      "object"
  ) {
    return null;
  }

  const user =
    rawUser as {
      _id?: unknown;
      id?: unknown;

      accountType?: unknown;

      name?: unknown;
      email?: unknown;

      phone?: unknown;
      countryCode?: unknown;
      phoneE164?: unknown;

      avatar?: unknown;

      role?: unknown;

      roleDetails?: unknown;

      permissions?: unknown;

      roleAssignedBy?: unknown;
      roleAssignedAt?: unknown;

      provider?: unknown;

      isVerified?: unknown;
      isPhoneVerified?: unknown;

      marketingPreferences?: unknown;

      status?: unknown;

      createdAt?: unknown;
      updatedAt?: unknown;
    };

  const userId =
    normalizeString(
      user._id
    ) ||
    normalizeString(
      user.id
    );

  const name =
    normalizeString(
      user.name
    );

  const email =
    normalizeString(
      user.email
    ).toLowerCase();

  if (
    !userId ||
    !name ||
    !email
  ) {
    return null;
  }

  const accountType =
    normalizeAccountType(
      user.accountType
    );

  const roleDetails =
    normalizeRoleDetails(
      user.roleDetails
    );

  const role =
    normalizeRoleSlug(
      user.role
    ) ||
    roleDetails?.slug ||
    (
      accountType ===
      "customer"
        ? "customer"
        : "user"
    );

  const permissions =
    normalizePermissions(
      user.permissions
    );

  const finalPermissions =
    permissions.length > 0
      ? permissions
      : roleDetails?.permissions ||
        [];

  const provider: AuthProvider =
    user.provider ===
    "google"
      ? "google"
      : "local";

  const status: UserStatus =
    user.status ===
    "inactive"
      ? "inactive"
      : user.status ===
          "blocked"
        ? "blocked"
        : "active";

  return {
    _id:
      userId,

    id:
      userId,

    accountType,

    name,

    email,

    phone:
      normalizeString(
        user.phone
      ),

    countryCode:
      normalizeString(
        user.countryCode
      ),

    phoneE164:
      normalizeString(
        user.phoneE164
      ),

    avatar:
      normalizeString(
        user.avatar
      ),

    role,

    roleDetails,

    permissions:
      normalizePermissions(
        finalPermissions
      ),

    roleAssignedBy:
      normalizeString(
        user.roleAssignedBy
      ) ||
      null,

    roleAssignedAt:
      normalizeString(
        user.roleAssignedAt
      ) ||
      null,

    provider,

    isVerified:
      normalizeBoolean(
        user.isVerified
      ),

    isPhoneVerified:
      normalizeBoolean(
        user.isPhoneVerified
      ),

    marketingPreferences:
      normalizeMarketingPreferences(
        user.marketingPreferences
      ),

    status,

    createdAt:
      normalizeString(
        user.createdAt
      ) ||
      undefined,

    updatedAt:
      normalizeString(
        user.updatedAt
      ) ||
      undefined,
  };
};

/* =========================================================
   EMAIL VERIFICATION NORMALIZER
========================================================= */

const normalizeEmailVerification = (
  value: unknown
):
  | EmailVerificationState
  | undefined => {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return undefined;
  }

  const verification =
    value as {
      required?: unknown;
      sent?: unknown;
      verified?: unknown;

      debugToken?: unknown;
      debugUrl?: unknown;
    };

  return {
    required:
      normalizeBoolean(
        verification.required
      ),

    sent:
      normalizeBoolean(
        verification.sent
      ),

    verified:
      normalizeBoolean(
        verification.verified
      ),

    debugToken:
      normalizeString(
        verification.debugToken
      ) ||
      undefined,

    debugUrl:
      normalizeString(
        verification.debugUrl
      ) ||
      undefined,
  };
};

/* =========================================================
   PHONE VERIFICATION NORMALIZER
========================================================= */

const normalizePhoneVerification = (
  value: unknown
):
  | PhoneVerificationState
  | undefined => {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return undefined;
  }

  const verification =
    value as {
      required?: unknown;
      sent?: unknown;
      verified?: unknown;

      nextAction?: unknown;

      phone?: unknown;

      expiresInMinutes?: unknown;
      resendAfterSeconds?: unknown;

      debugOtp?: unknown;
    };

  const expiresInMinutes =
    Number(
      verification.expiresInMinutes
    );

  const resendAfterSeconds =
    Number(
      verification.resendAfterSeconds
    );

  return {
    required:
      normalizeBoolean(
        verification.required
      ),

    sent:
      normalizeBoolean(
        verification.sent
      ),

    verified:
      normalizeBoolean(
        verification.verified
      ),

    nextAction:
      normalizeString(
        verification.nextAction
      ) ||
      null,

    phone:
      normalizeString(
        verification.phone
      ) ||
      undefined,

    expiresInMinutes:
      Number.isFinite(
        expiresInMinutes
      )
        ? expiresInMinutes
        : undefined,

    resendAfterSeconds:
      Number.isFinite(
        resendAfterSeconds
      )
        ? resendAfterSeconds
        : undefined,

    debugOtp:
      normalizeString(
        verification.debugOtp
      ) ||
      undefined,
  };
};

/* =========================================================
   DEBUG DATA NORMALIZER
========================================================= */

const normalizeDebugData = (
  value: unknown
):
  | AuthDebugData
  | undefined => {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return undefined;
  }

  const debug =
    value as {
      resetToken?: unknown;
      resetUrl?: unknown;

      verificationToken?: unknown;
      verificationUrl?: unknown;
    };

  const normalizedDebug: AuthDebugData = {
    resetToken:
      normalizeString(
        debug.resetToken
      ) ||
      undefined,

    resetUrl:
      normalizeString(
        debug.resetUrl
      ) ||
      undefined,

    verificationToken:
      normalizeString(
        debug.verificationToken
      ) ||
      undefined,

    verificationUrl:
      normalizeString(
        debug.verificationUrl
      ) ||
      undefined,
  };

  if (
    !normalizedDebug.resetToken &&
    !normalizedDebug.resetUrl &&
    !normalizedDebug.verificationToken &&
    !normalizedDebug.verificationUrl
  ) {
    return undefined;
  }

  return normalizedDebug;
};

/* =========================================================
   AUTH RESPONSE NORMALIZER
========================================================= */

const normalizeAuthResponse = (
  rawResponse: RawAuthResponse
): AuthResponse => {
  const responseData =
    rawResponse.data &&
    typeof rawResponse.data ===
      "object"
      ? rawResponse.data
      : rawResponse;

  const normalizedUser =
    normalizeAuthUser(
      responseData.user
    );

  const source =
    responseData.source ===
    "storefront"
      ? "storefront"
      : responseData.source ===
          "dashboard"
        ? "dashboard"
        : undefined;

  return {
    success:
      responseData.success ??
      rawResponse.success,

    message:
      normalizeString(
        responseData.message ||
          rawResponse.message
      ) ||
      undefined,

    source,

    accountType:
      responseData.accountType ===
        "customer" ||
      responseData.accountType ===
        "dashboard"
        ? responseData.accountType
        : normalizedUser
          ?.accountType,

    accessToken:
      normalizeString(
        responseData.accessToken
      ) ||
      undefined,

    refreshToken:
      normalizeString(
        responseData.refreshToken
      ) ||
      undefined,

    user:
      normalizedUser ||
      undefined,

    emailVerification:
      normalizeEmailVerification(
        responseData.emailVerification
      ),

    phoneVerification:
      normalizePhoneVerification(
        responseData.phoneVerification
      ),

    debug:
      normalizeDebugData(
        responseData.debug
      ),
  };
};

/* =========================================================
   STORAGE MODE

   Tokens and user should always be stored in the same
   browser storage.
========================================================= */

const isRememberedLogin =
  (): boolean => {
    return Boolean(
      localStorage.getItem(
        "accessToken"
      ) ||
      localStorage.getItem(
        "refreshToken"
      )
    );
  };

/* =========================================================
   SAVE AUTH USER
========================================================= */

const saveAuthUser = (
  user: AuthUser,
  rememberMe: boolean
): void => {
  localStorage.removeItem(
    "authUser"
  );

  sessionStorage.removeItem(
    "authUser"
  );

  const storage =
    rememberMe
      ? localStorage
      : sessionStorage;

  storage.setItem(
    "authUser",
    JSON.stringify(
      user
    )
  );
};

/* =========================================================
   CLEAR STORED USER ONLY
========================================================= */

const clearStoredUser =
  (): void => {
    localStorage.removeItem(
      "authUser"
    );

    sessionStorage.removeItem(
      "authUser"
    );
  };

/* =========================================================
   GET STORED USER
========================================================= */

export const getStoredUser =
  (): AuthUser | null => {
    const storedUser =
      localStorage.getItem(
        "authUser"
      ) ||
      sessionStorage.getItem(
        "authUser"
      );

    if (!storedUser) {
      return null;
    }

    try {
      const parsedUser =
        JSON.parse(
          storedUser
        );

      const normalizedUser =
        normalizeAuthUser(
          parsedUser
        );

      if (
        !normalizedUser
      ) {
        throw new Error(
          "Stored user is invalid."
        );
      }

      /*
       * Dashboard project must never accept a storefront
       * customer session as a valid dashboard user.
       */
      if (
        normalizedUser.accountType !==
        "dashboard"
      ) {
        throw new Error(
          "Stored account is not a dashboard account."
        );
      }

      return normalizedUser;
    } catch {
      clearStoredUser();

      return null;
    }
  };

/* =========================================================
   ADMIN CHECK
========================================================= */

export const isAdminUser = (
  user: AuthUser | null
): boolean => {
  if (
    !user ||
    user.accountType !==
      "dashboard"
  ) {
    return false;
  }

  return (
    user.role ===
      "admin" ||
    user.role ===
      "super_admin"
  );
};

/* =========================================================
   SUPER ADMIN CHECK
========================================================= */

export const isSuperAdminUser = (
  user: AuthUser | null
): boolean => {
  return Boolean(
    user &&
    user.accountType ===
      "dashboard" &&
    user.role ===
      "super_admin"
  );
};

/* =========================================================
   PERMISSION CHECK
========================================================= */

export const hasUserPermission = (
  user: AuthUser | null,
  permission: string
): boolean => {
  if (
    !user ||
    user.accountType !==
      "dashboard"
  ) {
    return false;
  }

  const normalizedPermission =
    permission
      .trim()
      .toLowerCase();

  if (
    !normalizedPermission
  ) {
    return false;
  }

  if (
    isAdminUser(
      user
    )
  ) {
    return true;
  }

  const permissions =
    user.permissions ||
    [];

  return (
    permissions.includes(
      "*"
    ) ||
    permissions.includes(
      normalizedPermission
    )
  );
};

/* =========================================================
   ANY PERMISSION CHECK
========================================================= */

export const hasAnyUserPermission = (
  user: AuthUser | null,
  permissions: string[]
): boolean => {
  return permissions.some(
    (permission) =>
      hasUserPermission(
        user,
        permission
      )
  );
};

/* =========================================================
   ALL PERMISSIONS CHECK
========================================================= */

export const hasAllUserPermissions = (
  user: AuthUser | null,
  permissions: string[]
): boolean => {
  return permissions.every(
    (permission) =>
      hasUserPermission(
        user,
        permission
      )
  );
};

/* =========================================================
   LOGIN DASHBOARD USER

   POST /auth/login

   Backend contract:

   {
     source: "dashboard",
     email,
     password
   }
========================================================= */

export const loginUser = async (
  payload: LoginPayload,
  rememberMe = false
): Promise<AuthResponse> => {
  const response =
    await api.post<RawAuthResponse>(
      "/auth/login",
      {
        source:
          DASHBOARD_AUTH_SOURCE,

        email:
          payload.email
            .trim()
            .toLowerCase(),

        password:
          payload.password,
      }
    );

  const data =
    normalizeAuthResponse(
      response.data
    );

  if (
    !data.accessToken
  ) {
    throw new Error(
      data.message ||
        "Access token was not returned by the server."
    );
  }

  if (
    !data.refreshToken
  ) {
    throw new Error(
      data.message ||
        "Refresh token was not returned by the server."
    );
  }

  if (
    !data.user
  ) {
    throw new Error(
      data.message ||
        "User information was not returned by the server."
    );
  }

  if (
    data.user.accountType !==
    "dashboard"
  ) {
    clearAuthStorage();

    throw new Error(
      "This account is not authorized for Solar Trade Hub dashboard access."
    );
  }

  setAuthTokens(
    data.accessToken,
    data.refreshToken,
    rememberMe
  );

  saveAuthUser(
    data.user,
    rememberMe
  );

  return data;
};

/* =========================================================
   REGISTER DASHBOARD USER

   POST /auth/register

   Important:

   Registration does NOT automatically create a logged-in
   dashboard session.

   Normal dashboard account flow:

   register
      ↓
   email verification
      ↓
   role assignment
      ↓
   login
========================================================= */

export const registerUser = async (
  payload: RegisterPayload
): Promise<AuthResponse> => {
  const response =
    await api.post<RawAuthResponse>(
      "/auth/register",
      {
        source:
          DASHBOARD_AUTH_SOURCE,

        name:
          payload.name
            .trim()
            .replace(
              /\s+/g,
              " "
            ),

        email:
          payload.email
            .trim()
            .toLowerCase(),

        password:
          payload.password,
      }
    );

  /*
   * Registration must never reuse a stale previous account
   * session in the browser.
   */
  clearAuthStorage();

  return normalizeAuthResponse(
    response.data
  );
};

/* =========================================================
   GET AUTHENTICATED DASHBOARD PROFILE
========================================================= */

export const getProfile =
  async (): Promise<AuthUser> => {
    const response =
      await api.get<RawAuthResponse>(
        "/auth/profile"
      );

    const data =
      normalizeAuthResponse(
        response.data
      );

    if (
      !data.user
    ) {
      throw new Error(
        data.message ||
          "User profile was not returned by the server."
      );
    }

    if (
      data.user.accountType !==
      "dashboard"
    ) {
      clearAuthStorage();

      throw new Error(
        "This session does not belong to a dashboard account."
      );
    }

    saveAuthUser(
      data.user,
      isRememberedLogin()
    );

    return data.user;
  };

/* =========================================================
   LOGOUT
========================================================= */

export const logoutUser =
  async (): Promise<void> => {
    try {
      await api.post(
        "/auth/logout"
      );
    } finally {
      /*
       * Local session must always be removed, even if the
       * backend is unreachable.
       */
      clearAuthStorage();
    }
  };

/* =========================================================
   FORGOT DASHBOARD PASSWORD
========================================================= */

export const forgotPassword =
  async (
    payload: ForgotPasswordPayload
  ): Promise<AuthResponse> => {
    const response =
      await api.post<RawAuthResponse>(
        "/auth/forgot-password",
        {
          source:
            DASHBOARD_AUTH_SOURCE,

          email:
            payload.email
              .trim()
              .toLowerCase(),
        }
      );

    return normalizeAuthResponse(
      response.data
    );
  };

/* =========================================================
   RESET PASSWORD
========================================================= */

export const resetPassword =
  async (
    resetToken: string,
    payload: ResetPasswordPayload
  ): Promise<AuthResponse> => {
    const normalizedToken =
      resetToken.trim();

    if (
      !normalizedToken
    ) {
      throw new Error(
        "Password reset token is missing."
      );
    }

    const response =
      await api.patch<RawAuthResponse>(
        `/auth/reset-password/${encodeURIComponent(
          normalizedToken
        )}`,
        {
          newPassword:
            payload.newPassword,

          confirmPassword:
            payload.confirmPassword,
        }
      );

    /*
     * Password reset revokes refresh sessions on backend.
     */
    clearAuthStorage();

    return normalizeAuthResponse(
      response.data
    );
  };

/* =========================================================
   CHANGE PASSWORD
========================================================= */

export const changePassword =
  async (
    payload: ChangePasswordPayload
  ): Promise<AuthResponse> => {
    const response =
      await api.patch<RawAuthResponse>(
        "/auth/change-password",
        {
          oldPassword:
            payload.oldPassword,

          newPassword:
            payload.newPassword,

          confirmPassword:
            payload.confirmPassword,
        }
      );

    /*
     * Successful password change requires fresh login.
     */
    clearAuthStorage();

    return normalizeAuthResponse(
      response.data
    );
  };

/* =========================================================
   VERIFY EMAIL

   Normally verification happens through the email link sent
   by backend:

   Backend verify endpoint
      ↓
   verifies token
      ↓
   redirects browser back to Dashboard Sign-In

   This function is retained for compatibility with any
   existing direct verification page/API flow.
========================================================= */

export const verifyEmail =
  async (
    verificationToken: string
  ): Promise<AuthResponse> => {
    const normalizedToken =
      verificationToken.trim();

    if (
      !normalizedToken
    ) {
      throw new Error(
        "Email verification token is missing."
      );
    }

    const response =
      await api.get<RawAuthResponse>(
        `/auth/verify-email/${encodeURIComponent(
          normalizedToken
        )}`
      );

    return normalizeAuthResponse(
      response.data
    );
  };

/* =========================================================
   RESEND DASHBOARD EMAIL VERIFICATION
========================================================= */

export const resendVerificationEmail =
  async (
    email: string
  ): Promise<AuthResponse> => {
    const response =
      await api.post<RawAuthResponse>(
        "/auth/resend-verification-email",
        {
          source:
            DASHBOARD_AUTH_SOURCE,

          email:
            email
              .trim()
              .toLowerCase(),
        }
      );

    return normalizeAuthResponse(
      response.data
    );
  };

/* =========================================================
   RETRY-AFTER HELPER
========================================================= */

export const getAuthRetryAfter = (
  error: unknown
): number | null => {
  if (
    !axios.isAxiosError<ApiErrorResponse>(
      error
    )
  ) {
    return null;
  }

  const bodyRetryAfter =
    Number(
      error.response?.data
        ?.retryAfter
    );

  if (
    Number.isFinite(
      bodyRetryAfter
    ) &&
    bodyRetryAfter > 0
  ) {
    return Math.ceil(
      bodyRetryAfter
    );
  }

  const headerRetryAfter =
    Number(
      error.response?.headers?.[
        "retry-after"
      ]
    );

  if (
    Number.isFinite(
      headerRetryAfter
    ) &&
    headerRetryAfter > 0
  ) {
    return Math.ceil(
      headerRetryAfter
    );
  }

  return null;
};

/* =========================================================
   OTP ATTEMPTS HELPER

   Not currently required by Dashboard, but kept as common
   auth-error metadata support.
========================================================= */

export const getAuthAttemptsRemaining = (
  error: unknown
): number | null => {
  if (
    !axios.isAxiosError<ApiErrorResponse>(
      error
    )
  ) {
    return null;
  }

  const value =
    Number(
      error.response?.data
        ?.attemptsRemaining
    );

  if (
    !Number.isInteger(
      value
    ) ||
    value < 0
  ) {
    return null;
  }

  return value;
};

/* =========================================================
   AUTH ERROR MESSAGE
========================================================= */

export const getAuthErrorMessage = (
  error: unknown
): string => {
  if (
    axios.isAxiosError<ApiErrorResponse>(
      error
    )
  ) {
    const responseData =
      error.response?.data;

    if (
      responseData?.message
    ) {
      return responseData.message;
    }

    const firstValidationError =
      responseData
        ?.errors?.[0]
        ?.message;

    if (
      firstValidationError
    ) {
      return firstValidationError;
    }

    if (
      error.code ===
      "ERR_NETWORK"
    ) {
      return "Unable to connect to the Solar Trade Hub backend. Please confirm the API server is running.";
    }

    if (
      error.message
    ) {
      return error.message;
    }
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "An unexpected authentication error occurred.";
};