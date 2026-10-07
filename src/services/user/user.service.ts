import api from "../api";

/* =========================================================
   USER TYPES
========================================================= */

export const USER_STATUSES = [
  "active",
  "inactive",
  "blocked",
] as const;

export type UserStatus =
  (typeof USER_STATUSES)[number];

export const USER_ACCOUNT_TYPES = [
  "dashboard",
  "customer",
] as const;

export type UserAccountType =
  (typeof USER_ACCOUNT_TYPES)[number];

export const USER_PROVIDERS = [
  "local",
  "google",
] as const;

export type UserProvider =
  (typeof USER_PROVIDERS)[number];

/* =========================================================
   AVATAR
========================================================= */

export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_AVATAR_IMAGE_SIZE =
  5 * 1024 * 1024;

/* =========================================================
   ROLE
========================================================= */

export type UserRoleDetails = {
  _id?: string;

  name: string;
  slug: string;
  description: string;

  permissions: string[];

  isSystemRole: boolean;

  status:
    | "active"
    | "inactive";
};

/* =========================================================
   USER
========================================================= */

export type DashboardUser = {
  _id: string;
  id: string;

  accountType:
    UserAccountType;

  name: string;
  email: string;

  phone: string;
  countryCode: string;
  phoneE164: string;

  role: string;

  roleDetails:
    | UserRoleDetails
    | null;

  permissions: string[];

  roleAssignedBy:
    | string
    | null;

  roleAssignedAt:
    | string
    | null;

  avatar: string;

  provider:
    UserProvider;

  isVerified: boolean;
  isPhoneVerified: boolean;

  status:
    UserStatus;

  createdAt: string;
  updatedAt: string;
};

/* =========================================================
   USER LIST QUERY
========================================================= */

export type UserListParams = {
  search?: string;

  accountType?:
    | UserAccountType
    | "";

  role?: string;

  status?:
    | UserStatus
    | "";

  isVerified?:
    | boolean
    | "";

  isPhoneVerified?:
    | boolean
    | "";
};

export type UserListResult = {
  users:
    DashboardUser[];

  count: number;
};

/* =========================================================
   UPDATE PAYLOAD
========================================================= */

export type UpdateUserPayload = {
  name?: string;
  email?: string;

  phone?: string;
  countryCode?: string;
};

/* =========================================================
   ROLE PAYLOAD
========================================================= */

export type AssignUserRolePayload = {
  roleId?: string;
  roleSlug?: string;
};

/* =========================================================
   DELETE RESULT
========================================================= */

export type DeleteUserResult = {
  userId: string;
  message?: string;
};

/* =========================================================
   API RESPONSE
========================================================= */

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;

  data?: T;
};

const extractResponseData = <T>(
  response: unknown
): T => {
  const axiosResponse =
    response as {
      data?: unknown;
    };

  const responseBody =
    axiosResponse?.data;

  if (
    responseBody &&
    typeof responseBody ===
      "object" &&
    "data" in responseBody
  ) {
    const envelope =
      responseBody as
        ApiEnvelope<T>;

    if (
      envelope.data !==
      undefined
    ) {
      return envelope.data;
    }
  }

  return responseBody as T;
};

/* =========================================================
   NORMALIZERS
========================================================= */

const normalizeString = (
  value: unknown
): string => {
  return typeof value ===
    "string"
    ? value
    : "";
};

const normalizeBoolean = (
  value: unknown
): boolean => {
  return value === true;
};

const normalizeUserStatus = (
  value: unknown
): UserStatus => {
  if (
    value ===
    "blocked"
  ) {
    return "blocked";
  }

  if (
    value ===
    "inactive"
  ) {
    return "inactive";
  }

  return "active";
};

const normalizeAccountType = (
  value: unknown
): UserAccountType => {
  return value ===
    "customer"
    ? "customer"
    : "dashboard";
};

const normalizeProvider = (
  value: unknown
): UserProvider => {
  return value ===
    "google"
    ? "google"
    : "local";
};

/* =========================================================
   USER ID
========================================================= */

const requireUserId = (
  userId: string
): string => {
  const normalizedUserId =
    userId?.trim();

  if (!normalizedUserId) {
    throw new Error(
      "User ID is required."
    );
  }

  return normalizedUserId;
};

/* =========================================================
   ROLE NORMALIZER
========================================================= */

const normalizeRoleDetails = (
  rawRole: unknown
):
  | UserRoleDetails
  | null => {
  if (
    !rawRole ||
    typeof rawRole !==
      "object"
  ) {
    return null;
  }

  const role =
    rawRole as
      Partial<UserRoleDetails>;

  const slug =
    normalizeString(
      role.slug
    );

  if (!slug) {
    return null;
  }

  return {
    _id:
      normalizeString(
        role._id
      ) || undefined,

    name:
      normalizeString(
        role.name
      ),

    slug,

    description:
      normalizeString(
        role.description
      ),

    permissions:
      Array.isArray(
        role.permissions
      )
        ? role.permissions.filter(
            (
              permission
            ): permission is string =>
              typeof permission ===
              "string"
          )
        : [],

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
   USER NORMALIZER
========================================================= */

const normalizeUser = (
  rawUser: unknown
): DashboardUser => {
  const user =
    rawUser &&
    typeof rawUser ===
      "object"
      ? (
          rawUser as {
            _id?: unknown;
            id?: unknown;

            accountType?: unknown;

            name?: unknown;
            email?: unknown;

            phone?: unknown;
            countryCode?: unknown;
            phoneE164?: unknown;

            role?: unknown;

            roleDetails?: unknown;
            permissions?: unknown;

            roleAssignedBy?: unknown;
            roleAssignedAt?: unknown;

            avatar?: unknown;
            provider?: unknown;

            isVerified?: unknown;
            isPhoneVerified?: unknown;

            status?: unknown;

            createdAt?: unknown;
            updatedAt?: unknown;
          }
        )
      : {};

  const userId =
    normalizeString(
      user._id
    ) ||
    normalizeString(
      user.id
    );

  const roleDetails =
    normalizeRoleDetails(
      user.roleDetails
    );

  const role =
    normalizeString(
      user.role
    ) ||
    roleDetails?.slug ||
    "user";

  return {
    _id:
      userId,

    id:
      userId,

    accountType:
      normalizeAccountType(
        user.accountType
      ),

    name:
      normalizeString(
        user.name
      ),

    email:
      normalizeString(
        user.email
      ),

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

    role,

    roleDetails,

    permissions:
      Array.isArray(
        user.permissions
      )
        ? user.permissions.filter(
            (
              permission
            ): permission is string =>
              typeof permission ===
              "string"
          )
        : roleDetails
            ?.permissions ||
          [],

    roleAssignedBy:
      normalizeString(
        user.roleAssignedBy
      ) || null,

    roleAssignedAt:
      normalizeString(
        user.roleAssignedAt
      ) || null,

    avatar:
      normalizeString(
        user.avatar
      ),

    provider:
      normalizeProvider(
        user.provider
      ),

    isVerified:
      normalizeBoolean(
        user.isVerified
      ),

    isPhoneVerified:
      normalizeBoolean(
        user.isPhoneVerified
      ),

    status:
      normalizeUserStatus(
        user.status
      ),

    createdAt:
      normalizeString(
        user.createdAt
      ),

    updatedAt:
      normalizeString(
        user.updatedAt
      ),
  };
};

/* =========================================================
   SINGLE USER EXTRACTOR
========================================================= */

const extractUser = (
  data: unknown
): DashboardUser => {
  if (
    data &&
    typeof data ===
      "object" &&
    "user" in data
  ) {
    return normalizeUser(
      (
        data as {
          user?: unknown;
        }
      ).user
    );
  }

  return normalizeUser(
    data
  );
};

/* =========================================================
   AVATAR VALIDATION
========================================================= */

export const validateAvatarFile = (
  file:
    | File
    | null
    | undefined
): string => {
  if (!file) {
    return "Please select a profile picture.";
  }

  if (
    !ALLOWED_AVATAR_MIME_TYPES.includes(
      file.type as
        (typeof ALLOWED_AVATAR_MIME_TYPES)[number]
    )
  ) {
    return "Only JPG, JPEG, PNG and WEBP images are allowed.";
  }

  if (
    file.size >
    MAX_AVATAR_IMAGE_SIZE
  ) {
    return "Profile picture must be 5 MB or smaller.";
  }

  return "";
};

/* =========================================================
   AVATAR URL
========================================================= */

export const getUserAvatarUrl = (
  avatarPath: string
): string => {
  const normalizedPath =
    avatarPath?.trim();

  if (!normalizedPath) {
    return "";
  }

  if (
    normalizedPath.startsWith(
      "http://"
    ) ||
    normalizedPath.startsWith(
      "https://"
    ) ||
    normalizedPath.startsWith(
      "blob:"
    ) ||
    normalizedPath.startsWith(
      "data:"
    )
  ) {
    return normalizedPath;
  }

  const cleanPath =
    normalizedPath.startsWith(
      "/"
    )
      ? normalizedPath
      : `/${normalizedPath}`;

  const baseURL =
    normalizeString(
      api.defaults.baseURL
    );

  if (
    !baseURL ||
    baseURL.startsWith(
      "/"
    )
  ) {
    return cleanPath;
  }

  try {
    const parsedBaseURL =
      new URL(
        baseURL
      );

    return `${parsedBaseURL.origin}${cleanPath}`;
  } catch {
    return cleanPath;
  }
};

/* =========================================================
   GET USERS

   Supports both:
   - dashboard users
   - customer users
========================================================= */

export const getUsers = async (
  params:
    UserListParams = {}
):
  Promise<UserListResult> => {
  const response =
    await api.get(
      "/users",
      {
        params: {
          ...(params.search?.trim()
            ? {
                search:
                  params.search.trim(),
              }
            : {}),

          ...(params.accountType
            ? {
                accountType:
                  params.accountType,
              }
            : {}),

          ...(params.role?.trim()
            ? {
                role:
                  params.role.trim(),
              }
            : {}),

          ...(params.status
            ? {
                status:
                  params.status,
              }
            : {}),

          ...(typeof params.isVerified ===
          "boolean"
            ? {
                isVerified:
                  params.isVerified,
              }
            : {}),

          ...(typeof params.isPhoneVerified ===
          "boolean"
            ? {
                isPhoneVerified:
                  params.isPhoneVerified,
              }
            : {}),
        },
      }
    );

  const data =
    extractResponseData<
      | unknown[]
      | {
          users?: unknown[];
          count?: unknown;
        }
    >(
      response
    );

  if (
    Array.isArray(
      data
    )
  ) {
    const users =
      data.map(
        normalizeUser
      );

    return {
      users,
      count:
        users.length,
    };
  }

  const users =
    Array.isArray(
      data?.users
    )
      ? data.users.map(
          normalizeUser
        )
      : [];

  const countValue =
    Number(
      data?.count
    );

  return {
    users,

    count:
      Number.isFinite(
        countValue
      )
        ? countValue
        : users.length,
  };
};

/* =========================================================
   GET USER
========================================================= */

export const getUserById = async (
  userId: string
):
  Promise<DashboardUser> => {
  const normalizedUserId =
    requireUserId(
      userId
    );

  const response =
    await api.get(
      `/users/${normalizedUserId}`
    );

  const data =
    extractResponseData<unknown>(
      response
    );

  return extractUser(
    data
  );
};

/* =========================================================
   UPDATE USER
========================================================= */

export const updateUser = async (
  userId: string,
  payload:
    UpdateUserPayload
):
  Promise<DashboardUser> => {
  const normalizedUserId =
    requireUserId(
      userId
    );

  const updateData:
    UpdateUserPayload =
    {};

  if (
    typeof payload.name ===
    "string"
  ) {
    updateData.name =
      payload.name.trim();
  }

  if (
    typeof payload.email ===
    "string"
  ) {
    updateData.email =
      payload.email
        .trim()
        .toLowerCase();
  }

  if (
    typeof payload.phone ===
    "string"
  ) {
    updateData.phone =
      payload.phone.trim();
  }

  if (
    typeof payload.countryCode ===
    "string"
  ) {
    updateData.countryCode =
      payload.countryCode.trim();
  }

  const response =
    await api.patch(
      `/users/${normalizedUserId}`,
      updateData
    );

  const data =
    extractResponseData<unknown>(
      response
    );

  return extractUser(
    data
  );
};

/* =========================================================
   UPLOAD AVATAR
========================================================= */

export const uploadUserAvatar =
  async (
    userId: string,
    avatarFile: File
  ):
    Promise<DashboardUser> => {
    const normalizedUserId =
      requireUserId(
        userId
      );

    const validationError =
      validateAvatarFile(
        avatarFile
      );

    if (
      validationError
    ) {
      throw new Error(
        validationError
      );
    }

    const formData =
      new FormData();

    formData.append(
      "avatar",
      avatarFile
    );

    const response =
      await api.patch(
        `/users/${normalizedUserId}/avatar`,
        formData
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractUser(
      data
    );
  };

/* =========================================================
   REMOVE AVATAR
========================================================= */

export const removeUserAvatar =
  async (
    userId: string
  ):
    Promise<DashboardUser> => {
    const normalizedUserId =
      requireUserId(
        userId
      );

    const response =
      await api.delete(
        `/users/${normalizedUserId}/avatar`
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractUser(
      data
    );
  };

/* =========================================================
   ASSIGN ROLE
========================================================= */

export const assignUserRole =
  async (
    userId: string,

    payload:
      AssignUserRolePayload
  ):
    Promise<DashboardUser> => {
    const normalizedUserId =
      requireUserId(
        userId
      );

    const roleId =
      payload.roleId?.trim();

    const roleSlug =
      payload.roleSlug?.trim();

    if (
      !roleId &&
      !roleSlug
    ) {
      throw new Error(
        "Role ID or Role slug is required."
      );
    }

    const response =
      await api.patch(
        `/users/${normalizedUserId}/role`,

        roleId
          ? {
              roleId,
            }
          : {
              roleSlug,
            }
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractUser(
      data
    );
  };

/* =========================================================
   REMOVE ROLE
========================================================= */

export const removeUserRole =
  async (
    userId: string
  ):
    Promise<DashboardUser> => {
    const normalizedUserId =
      requireUserId(
        userId
      );

    const response =
      await api.delete(
        `/users/${normalizedUserId}/role`
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractUser(
      data
    );
  };

/* =========================================================
   UPDATE STATUS
========================================================= */

export const updateUserStatus =
  async (
    userId: string,
    status:
      UserStatus
  ):
    Promise<DashboardUser> => {
    const normalizedUserId =
      requireUserId(
        userId
      );

    if (
      !USER_STATUSES.includes(
        status
      )
    ) {
      throw new Error(
        "Invalid user status."
      );
    }

    const response =
      await api.patch(
        `/users/${normalizedUserId}/status`,
        {
          status,
        }
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractUser(
      data
    );
  };

/* =========================================================
   DELETE USER
========================================================= */

export const deleteUser = async (
  userId: string
):
  Promise<DeleteUserResult> => {
  const normalizedUserId =
    requireUserId(
      userId
    );

  const response =
    await api.delete(
      `/users/${normalizedUserId}`
    );

  const data =
    extractResponseData<
      | {
          userId?: unknown;
          message?: unknown;
        }
      | undefined
    >(
      response
    );

  return {
    userId:
      normalizeString(
        data?.userId
      ) ||
      normalizedUserId,

    message:
      normalizeString(
        data?.message
      ) || undefined,
  };
};

/* =========================================================
   USER SUMMARY
========================================================= */

export type UserDashboardSummary = {
  totalUsers: number;

  activeUsers: number;
  inactiveUsers: number;
  blockedUsers: number;

  verifiedUsers: number;
  unverifiedUsers: number;

  assignedUsers: number;
  unassignedUsers: number;
};

export const buildUserDashboardSummary =
  (
    users:
      DashboardUser[]
  ):
    UserDashboardSummary => {
    const totalUsers =
      users.length;

    const activeUsers =
      users.filter(
        (
          user
        ) =>
          user.status ===
          "active"
      ).length;

    const inactiveUsers =
      users.filter(
        (
          user
        ) =>
          user.status ===
          "inactive"
      ).length;

    const blockedUsers =
      users.filter(
        (
          user
        ) =>
          user.status ===
          "blocked"
      ).length;

    const verifiedUsers =
      users.filter(
        (
          user
        ) =>
          user.isVerified
      ).length;

    const unverifiedUsers =
      totalUsers -
      verifiedUsers;

    const assignedUsers =
      users.filter(
        (
          user
        ) =>
          user.role !==
          "user"
      ).length;

    const unassignedUsers =
      totalUsers -
      assignedUsers;

    return {
      totalUsers,

      activeUsers,
      inactiveUsers,
      blockedUsers,

      verifiedUsers,
      unverifiedUsers,

      assignedUsers,
      unassignedUsers,
    };
  };