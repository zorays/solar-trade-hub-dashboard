import api from "../api";

/* =========================================================
   ROLE STATUS
========================================================= */

export const ROLE_STATUSES = [
  "active",
  "inactive",
] as const;

export type RoleStatus =
  (typeof ROLE_STATUSES)[number];

/* =========================================================
   SOLAR TRADE HUB PERMISSION CATALOGUE

   IMPORTANT:

   These permission keys must remain aligned with backend
   route authorization.

   Current conventions:

   Products / Categories / Brands:
   products.view
   products.manage

   Suppliers:
   suppliers.view
   suppliers.manage

   Admin / Super Admin:
   "*"
========================================================= */

export const ROLE_PERMISSION_GROUPS = [
  /* =======================================================
     DASHBOARD
  ======================================================= */

  {
    key: "dashboard",
    label: "Dashboard",
    permissions: [
      {
        key: "dashboard.view",
        label: "View Dashboard",
        description:
          "Access the Solar Trade Hub administration dashboard.",
      },
    ],
  },

  /* =======================================================
     PRODUCTS

     Categories and Brands currently use the same
     products.view / products.manage permission family.
  ======================================================= */

  {
    key: "products",
    label: "Products",
    permissions: [
      {
        key: "products.view",
        label: "View Products",
        description:
          "View products, categories and brands.",
      },

      {
        key: "products.manage",
        label: "Manage Products",
        description:
          "Create, edit, publish, archive and manage products, categories and brands.",
      },
    ],
  },

  /* =======================================================
     SUPPLIERS
  ======================================================= */

  {
    key: "suppliers",
    label: "Suppliers",
    permissions: [
      {
        key: "suppliers.view",
        label: "View Suppliers",
        description:
          "View supplier profiles, supplier details and verification information.",
      },

      {
        key: "suppliers.manage",
        label: "Manage Suppliers",
        description:
          "Create, edit, verify, suspend and delete suppliers.",
      },
    ],
  },

  /* =======================================================
     INSTALLERS
  ======================================================= */

  {
    key: "installers",
    label: "Installers",
    permissions: [
      {
        key: "installers.view",
        label: "View Installers",
        description:
          "View installer profiles, applications and verification details.",
      },

      {
        key: "installers.manage",
        label: "Manage Installers",
        description:
          "Create, edit, verify and manage installer accounts and applications.",
      },
    ],
  },

  /* =======================================================
     TENDERS
  ======================================================= */

  {
    key: "tenders",
    label: "Tenders",
    permissions: [
      {
        key: "tenders.view",
        label: "View Tenders",
        description:
          "View tender listings and tender details.",
      },

      {
        key: "tenders.manage",
        label: "Manage Tenders",
        description:
          "Create, edit, publish, close and manage tenders.",
      },
    ],
  },

  /* =======================================================
     ORDERS
  ======================================================= */

  {
    key: "orders",
    label: "Orders",
    permissions: [
      {
        key: "orders.view",
        label: "View Orders",
        description:
          "View Solar Trade Hub marketplace orders.",
      },

      {
        key: "orders.manage",
        label: "Manage Orders",
        description:
          "Manage order processing, status and marketplace order operations.",
      },
    ],
  },

  /* =======================================================
     DEALS
  ======================================================= */

  {
    key: "deals",
    label: "Deals",
    permissions: [
      {
        key: "deals.view",
        label: "View Deals",
        description:
          "View marketplace deals and promotional offers.",
      },

      {
        key: "deals.manage",
        label: "Manage Deals",
        description:
          "Create, edit, publish and manage marketplace deals and promotions.",
      },
    ],
  },

  /* =======================================================
     USERS & ROLES
  ======================================================= */

  {
    key: "users_roles",
    label: "Users & Roles",
    permissions: [
      {
        key: "users.view",
        label: "View Users",
        description:
          "View registered Solar Trade Hub dashboard users.",
      },

      {
        key: "users.manage",
        label: "Manage Users",
        description:
          "Edit users, assign roles and manage dashboard user account status.",
      },

      {
        key: "roles.view",
        label: "View Roles",
        description:
          "View dashboard roles and their permission assignments.",
      },

      {
        key: "roles.manage",
        label: "Manage Roles",
        description:
          "Create, edit, disable and delete custom dashboard roles.",
      },
    ],
  },

  /* =======================================================
     CONTENT
  ======================================================= */

  {
    key: "content",
    label: "Content",
    permissions: [
      {
        key: "content.view",
        label: "View Content",
        description:
          "View marketplace homepage content, banners, pages and promotional content.",
      },

      {
        key: "content.manage",
        label: "Manage Content",
        description:
          "Create and edit homepage sections, banners and marketplace content.",
      },
    ],
  },

  /* =======================================================
     REPORTS
  ======================================================= */

  {
    key: "reports",
    label: "Reports",
    permissions: [
      {
        key: "reports.view",
        label: "View Reports",
        description:
          "View marketplace, suppliers, installers, products, users and order reports.",
      },
    ],
  },

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  {
    key: "notifications",
    label: "Notifications",
    permissions: [
      {
        key: "notifications.view",
        label: "View Notifications",
        description:
          "View dashboard and marketplace notification records.",
      },

      {
        key: "notifications.manage",
        label: "Manage Notifications",
        description:
          "Manage notification workflows and administrative notifications.",
      },
    ],
  },

  /* =======================================================
     SETTINGS
  ======================================================= */

  {
    key: "settings",
    label: "Settings",
    permissions: [
      {
        key: "settings.manage",
        label: "Manage Settings",
        description:
          "Manage Solar Trade Hub administration and marketplace settings.",
      },
    ],
  },
] as const;

/* =========================================================
   PERMISSION TYPES
========================================================= */

export type RolePermissionKey =
  (typeof ROLE_PERMISSION_GROUPS)[number]["permissions"][number]["key"];

/* =========================================================
   ALL PERMISSIONS

   Used by:

   - Select All
   - Role forms
   - Permission comparison
   - Permission display
========================================================= */

export const ALL_ROLE_PERMISSIONS: string[] =
  ROLE_PERMISSION_GROUPS.flatMap(
    (group) =>
      group.permissions.map(
        (permission) =>
          permission.key
      )
  );

/* =========================================================
   ROLE MODEL
========================================================= */

export type DashboardRole = {
  _id: string;

  id: string;

  name: string;

  slug: string;

  description: string;

  permissions: string[];

  isSystemRole: boolean;

  status: RoleStatus;

  assignedUsersCount: number;

  createdBy:
    | string
    | null;

  updatedBy:
    | string
    | null;

  createdAt: string;

  updatedAt: string;
};

/* =========================================================
   ROLE LIST QUERY
========================================================= */

export type RoleListParams = {
  search?: string;

  status?:
    | RoleStatus
    | "";

  page?: number;

  limit?: number;

  sortBy?:
    | "name"
    | "slug"
    | "status"
    | "isSystemRole"
    | "createdAt"
    | "updatedAt";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   ROLE LIST RESULT
========================================================= */

export type RoleListResult = {
  roles: DashboardRole[];

  count: number;

  total: number;

  page: number;

  limit: number;

  totalPages: number;
};

/* =========================================================
   CREATE / UPDATE PAYLOADS
========================================================= */

export type CreateRolePayload = {
  name: string;

  slug?: string;

  description?: string;

  permissions: string[];

  status?: RoleStatus;
};

export type UpdateRolePayload = {
  name?: string;

  slug?: string;

  description?: string;

  permissions?: string[];

  status?: RoleStatus;
};

export type UpdateRoleStatusPayload = {
  status: RoleStatus;
};

/* =========================================================
   ROLE SUMMARY
========================================================= */

export type RoleDashboardSummary = {
  totalRoles: number;

  activeRoles: number;

  inactiveRoles: number;

  systemRoles: number;

  customRoles: number;

  assignedUsers: number;
};

/* =========================================================
   API RESPONSE ENVELOPE
========================================================= */

type ApiEnvelope<T> = {
  success?: boolean;

  message?: string;

  data?: T;
};

/* =========================================================
   RESPONSE EXTRACTOR

   Supports:

   {
     success,
     data
   }

   And direct response data.
========================================================= */

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
      responseBody as ApiEnvelope<T>;

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

const normalizeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const numericValue =
    Number(
      value
    );

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : fallback;
};

const normalizeBoolean = (
  value: unknown
): boolean => {
  return value ===
    true;
};

const normalizeRoleStatus = (
  value: unknown
): RoleStatus => {
  return value ===
    "inactive"
    ? "inactive"
    : "active";
};

const normalizePermissions = (
  value: unknown
): string[] => {
  if (
    !Array.isArray(
      value
    )
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
        .filter(
          Boolean
        )
    ),
  ];
};

/* =========================================================
   ROLE NORMALIZER
========================================================= */

const normalizeRole = (
  rawRole: unknown
): DashboardRole => {
  const role =
    rawRole &&
    typeof rawRole ===
      "object"
      ? (
          rawRole as {
            _id?: unknown;

            id?: unknown;

            name?: unknown;

            slug?: unknown;

            description?: unknown;

            permissions?: unknown;

            isSystemRole?: unknown;

            status?: unknown;

            assignedUsersCount?: unknown;

            usersCount?: unknown;

            createdBy?: unknown;

            updatedBy?: unknown;

            createdAt?: unknown;

            updatedAt?: unknown;
          }
        )
      : {};

  const roleId =
    normalizeString(
      role._id
    ) ||
    normalizeString(
      role.id
    );

  return {
    _id:
      roleId,

    id:
      roleId,

    name:
      normalizeString(
        role.name
      ),

    slug:
      normalizeString(
        role.slug
      ),

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
      normalizeRoleStatus(
        role.status
      ),

    assignedUsersCount:
      normalizeNumber(
        role.assignedUsersCount ??
          role.usersCount
      ),

    createdBy:
      normalizeString(
        role.createdBy
      ) ||
      null,

    updatedBy:
      normalizeString(
        role.updatedBy
      ) ||
      null,

    createdAt:
      normalizeString(
        role.createdAt
      ),

    updatedAt:
      normalizeString(
        role.updatedAt
      ),
  };
};

/* =========================================================
   EXTRACT SINGLE ROLE
========================================================= */

const extractRole = (
  data: unknown
): DashboardRole => {
  if (
    data &&
    typeof data ===
      "object" &&
    "role" in data
  ) {
    return normalizeRole(
      (
        data as {
          role?: unknown;
        }
      ).role
    );
  }

  return normalizeRole(
    data
  );
};

/* =========================================================
   CLEAN CREATE PAYLOAD
========================================================= */

const cleanCreateRolePayload = (
  payload: CreateRolePayload
): CreateRolePayload => {
  return {
    name:
      payload.name.trim(),

    ...(payload.slug?.trim()
      ? {
          slug:
            payload.slug
              .trim()
              .toLowerCase(),
        }
      : {}),

    description:
      payload.description
        ?.trim() ||
      "",

    permissions:
      normalizePermissions(
        payload.permissions
      ),

    status:
      payload.status ||
      "active",
  };
};

/* =========================================================
   CLEAN UPDATE PAYLOAD
========================================================= */

const cleanUpdateRolePayload = (
  payload: UpdateRolePayload
): UpdateRolePayload => {
  const updateData:
    UpdateRolePayload =
      {};

  if (
    typeof payload.name ===
    "string"
  ) {
    updateData.name =
      payload.name.trim();
  }

  if (
    typeof payload.slug ===
    "string"
  ) {
    updateData.slug =
      payload.slug
        .trim()
        .toLowerCase();
  }

  if (
    typeof payload.description ===
    "string"
  ) {
    updateData.description =
      payload.description.trim();
  }

  if (
    Array.isArray(
      payload.permissions
    )
  ) {
    updateData.permissions =
      normalizePermissions(
        payload.permissions
      );
  }

  if (
    payload.status ===
      "active" ||
    payload.status ===
      "inactive"
  ) {
    updateData.status =
      payload.status;
  }

  return updateData;
};

/* =========================================================
   GET ALL ROLES

   GET /roles
========================================================= */

export const getRoles = async (
  params:
    RoleListParams = {}
): Promise<RoleListResult> => {
  const response =
    await api.get(
      "/roles",
      {
        params: {
          ...(params.search
            ?.trim()
            ? {
                search:
                  params.search.trim(),
              }
            : {}),

          ...(params.status
            ? {
                status:
                  params.status,
              }
            : {}),

          ...(params.page
            ? {
                page:
                  params.page,
              }
            : {}),

          ...(params.limit
            ? {
                limit:
                  params.limit,
              }
            : {}),

          ...(params.sortBy
            ? {
                sortBy:
                  params.sortBy,
              }
            : {}),

          ...(params.sortOrder
            ? {
                sortOrder:
                  params.sortOrder,
              }
            : {}),
        },
      }
    );

  const data =
    extractResponseData<
      | unknown[]
      | {
          roles?: unknown[];

          count?: unknown;

          total?: unknown;

          page?: unknown;

          limit?: unknown;

          totalPages?: unknown;

          pagination?: {
            page?: unknown;

            limit?: unknown;

            total?: unknown;

            totalPages?: unknown;
          };
        }
    >(
      response
    );

  if (
    Array.isArray(
      data
    )
  ) {
    const roles =
      data.map(
        normalizeRole
      );

    return {
      roles,

      count:
        roles.length,

      total:
        roles.length,

      page:
        1,

      limit:
        roles.length,

      totalPages:
        roles.length >
        0
          ? 1
          : 0,
    };
  }

  const roles =
    Array.isArray(
      data?.roles
    )
      ? data.roles.map(
          normalizeRole
        )
      : [];

  const page =
    normalizeNumber(
      data?.pagination
        ?.page ??
        data?.page,
      1
    );

  const limit =
    normalizeNumber(
      data?.pagination
        ?.limit ??
        data?.limit,
      roles.length ||
        10
    );

  const total =
    normalizeNumber(
      data?.pagination
        ?.total ??
        data?.total ??
        data?.count,
      roles.length
    );

  const totalPages =
    normalizeNumber(
      data?.pagination
        ?.totalPages ??
        data?.totalPages,
      limit > 0
        ? Math.ceil(
            total /
              limit
          )
        : 0
    );

  return {
    roles,

    count:
      normalizeNumber(
        data?.count,
        roles.length
      ),

    total,

    page,

    limit,

    totalPages,
  };
};

/* =========================================================
   GET ACTIVE ROLES

   Used by dashboard user role-assignment dropdown.

   GET /roles/active
========================================================= */

export const getActiveRoles =
  async (): Promise<
    DashboardRole[]
  > => {
    const response =
      await api.get(
        "/roles/active"
      );

    const data =
      extractResponseData<
        | unknown[]
        | {
            roles?: unknown[];
          }
      >(
        response
      );

    if (
      Array.isArray(
        data
      )
    ) {
      return data.map(
        normalizeRole
      );
    }

    return Array.isArray(
      data?.roles
    )
      ? data.roles.map(
          normalizeRole
        )
      : [];
  };

/* =========================================================
   GET ROLE BY ID

   GET /roles/:roleId
========================================================= */

export const getRoleById =
  async (
    roleId: string
  ): Promise<DashboardRole> => {
    const response =
      await api.get(
        `/roles/${roleId}`
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRole(
      data
    );
  };

/* =========================================================
   CREATE ROLE

   POST /roles
========================================================= */

export const createRole =
  async (
    payload:
      CreateRolePayload
  ): Promise<DashboardRole> => {
    const response =
      await api.post(
        "/roles",
        cleanCreateRolePayload(
          payload
        )
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRole(
      data
    );
  };

/* =========================================================
   UPDATE ROLE

   PATCH /roles/:roleId
========================================================= */

export const updateRole =
  async (
    roleId: string,
    payload:
      UpdateRolePayload
  ): Promise<DashboardRole> => {
    const response =
      await api.patch(
        `/roles/${roleId}`,
        cleanUpdateRolePayload(
          payload
        )
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRole(
      data
    );
  };

/* =========================================================
   UPDATE ROLE STATUS

   PATCH /roles/:roleId/status
========================================================= */

export const updateRoleStatus =
  async (
    roleId: string,
    status:
      RoleStatus
  ): Promise<DashboardRole> => {
    const response =
      await api.patch(
        `/roles/${roleId}/status`,
        {
          status,
        } satisfies UpdateRoleStatusPayload
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRole(
      data
    );
  };

/* =========================================================
   DELETE CUSTOM ROLE

   DELETE /roles/:roleId
========================================================= */

export const deleteRole =
  async (
    roleId: string
  ): Promise<{
    roleId: string;

    message?: string;
  }> => {
    const response =
      await api.delete(
        `/roles/${roleId}`
      );

    const data =
      extractResponseData<
        | {
            roleId?: unknown;

            message?: unknown;
          }
        | undefined
      >(
        response
      );

    return {
      roleId:
        normalizeString(
          data?.roleId
        ) ||
        roleId,

      message:
        normalizeString(
          data?.message
        ) ||
        undefined,
    };
  };

/* =========================================================
   ENSURE SYSTEM ROLES

   Super Admin only.

   POST /roles/system/ensure
========================================================= */

export const ensureSystemRoles =
  async (): Promise<
    DashboardRole[]
  > => {
    const response =
      await api.post(
        "/roles/system/ensure"
      );

    const data =
      extractResponseData<
        | unknown[]
        | {
            roles?: unknown[];
          }
      >(
        response
      );

    if (
      Array.isArray(
        data
      )
    ) {
      return data.map(
        normalizeRole
      );
    }

    return Array.isArray(
      data?.roles
    )
      ? data.roles.map(
          normalizeRole
        )
      : [];
  };

/* =========================================================
   BUILD ROLE DASHBOARD SUMMARY
========================================================= */

export const buildRoleDashboardSummary =
  (
    roles:
      DashboardRole[]
  ): RoleDashboardSummary => {
    const totalRoles =
      roles.length;

    const activeRoles =
      roles.filter(
        (
          role
        ) =>
          role.status ===
          "active"
      ).length;

    const inactiveRoles =
      roles.filter(
        (
          role
        ) =>
          role.status ===
          "inactive"
      ).length;

    const systemRoles =
      roles.filter(
        (
          role
        ) =>
          role.isSystemRole
      ).length;

    const customRoles =
      roles.filter(
        (
          role
        ) =>
          !role.isSystemRole
      ).length;

    const assignedUsers =
      roles.reduce(
        (
          total,
          role
        ) =>
          total +
          role.assignedUsersCount,
        0
      );

    return {
      totalRoles,

      activeRoles,

      inactiveRoles,

      systemRoles,

      customRoles,

      assignedUsers,
    };
  };

/* =========================================================
   HAS ROLE PERMISSION

   "*" means full Solar Trade Hub system access.
========================================================= */

export const hasRolePermission = (
  role: Pick<
    DashboardRole,
    "permissions"
  >,
  permission: string
): boolean => {
  return (
    role.permissions.includes(
      "*"
    ) ||
    role.permissions.includes(
      permission
    )
  );
};

/* =========================================================
   GET PERMISSION LABEL
========================================================= */

export const getPermissionLabel = (
  permissionKey: string
): string => {
  for (
    const group of
    ROLE_PERMISSION_GROUPS
  ) {
    const permission =
      group.permissions.find(
        (
          item
        ) =>
          item.key ===
          permissionKey
      );

    if (
      permission
    ) {
      return permission.label;
    }
  }

  return permissionKey;
};