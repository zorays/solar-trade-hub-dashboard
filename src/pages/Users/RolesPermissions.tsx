import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Eye,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  Modal,
} from "../../components/ui/modal";

import Button from "../../components/ui/button/Button";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  hasUserPermission,
  isSuperAdminUser,
} from "../../services/auth.service";

import {
  ALL_ROLE_PERMISSIONS,
  ROLE_PERMISSION_GROUPS,
  buildRoleDashboardSummary,
  createRole,
  deleteRole,
  ensureSystemRoles,
  getRoles,
  updateRole,
  updateRoleStatus,
  type DashboardRole,
  type RoleStatus,
} from "../../services/role/role.service";

import {
  assignUserRole,
  getUsers,
  type DashboardUser,
} from "../../services/user/user.service";

/* =========================================================
   TYPES
========================================================= */

type PermissionGroup =
  (typeof ROLE_PERMISSION_GROUPS)[number];

type RoleFormState = {
  name: string;
  slug: string;
  description: string;
  status: RoleStatus;
  permissions: string[];
};

/* =========================================================
   PERMISSION CATALOGUE

   Single source of truth lives in:
   src/services/role/role.service.ts
========================================================= */

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_ROLE_FORM: RoleFormState = {
  name: "",
  slug: "",
  description: "",
  status: "active",
  permissions: [],
};

/* =========================================================
   HELPERS
========================================================= */

const getErrorMessage = (
  error: unknown
): string => {
  if (
    error &&
    typeof error === "object"
  ) {
    const possibleError =
      error as {
        message?: unknown;

        response?: {
          data?: {
            message?: unknown;

            errors?: Array<{
              message?: unknown;
              msg?: unknown;
            }>;
          };
        };
      };

    const validationError =
      possibleError.response
        ?.data?.errors?.[0];

    const validationMessage =
      validationError?.message ??
      validationError?.msg;

    if (
      typeof validationMessage ===
        "string" &&
      validationMessage.trim()
    ) {
      return validationMessage;
    }

    const apiMessage =
      possibleError.response
        ?.data?.message;

    if (
      typeof apiMessage ===
        "string" &&
      apiMessage.trim()
    ) {
      return apiMessage;
    }

    if (
      typeof possibleError.message ===
        "string" &&
      possibleError.message.trim()
    ) {
      return possibleError.message;
    }
  }

  return "Something went wrong.";
};

const createSlug = (
  value: string
): string => {
  return value
    .trim()
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

const formatDate = (
  value: string
): string => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    date
  );
};

/* =========================================================
   PAGE
========================================================= */

const RolesPermissions = () => {
  const {
    user,
  } =
    useAuth();

  const [
    roles,
    setRoles,
  ] =
    useState<DashboardRole[]>(
      []
    );

  const [
    dashboardUsers,
    setDashboardUsers,
  ] =
    useState<DashboardUser[]>(
      []
    );

  const [
    usersLoading,
    setUsersLoading,
  ] =
    useState(true);

  const [
    assignmentModalOpen,
    setAssignmentModalOpen,
  ] =
    useState(false);

  const [
    assignmentRole,
    setAssignmentRole,
  ] =
    useState<DashboardRole | null>(
      null
    );

  const [
    selectedAssignmentUserId,
    setSelectedAssignmentUserId,
  ] =
    useState(
      ""
    );

  const [
    assignmentSaving,
    setAssignmentSaving,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      RoleStatus | ""
    >("");

  const [
    roleModalOpen,
    setRoleModalOpen,
  ] =
    useState(false);

  const [
    permissionModalOpen,
    setPermissionModalOpen,
  ] =
    useState(false);

  const [
    deleteModalOpen,
    setDeleteModalOpen,
  ] =
    useState(false);

  const [
    editingRole,
    setEditingRole,
  ] =
    useState<DashboardRole | null>(
      null
    );

  const [
    permissionRole,
    setPermissionRole,
  ] =
    useState<DashboardRole | null>(
      null
    );

  const [
    deleteCandidate,
    setDeleteCandidate,
  ] =
    useState<DashboardRole | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<RoleFormState>(
      EMPTY_ROLE_FORM
    );

  const [
    slugManuallyChanged,
    setSlugManuallyChanged,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    actionKey,
    setActionKey,
  ] =
    useState("");

  /* =======================================================
     AUTHORIZATION
  ======================================================= */

  const canManageRoles =
    hasUserPermission(
      user,
      "roles.manage"
    );

  const isSuperAdmin =
    isSuperAdminUser(
      user
    );


  const canAssignUsers =
    hasUserPermission(
      user,
      "users.manage"
    );

  const authenticatedUserId =
    user?._id ||
    user?.id ||
    "";

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          setSearch(
            searchInput.trim()
          );
        },
        300
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    searchInput,
  ]);

  /* =======================================================
     LOAD ROLES
  ======================================================= */

  const loadRoles =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const result =
            await getRoles({
              search:
                search ||
                undefined,

              status:
                statusFilter,

              page: 1,
              limit: 100,

              sortBy:
                "name",

              sortOrder:
                "asc",
            });

          /*
           * "user" and "customer" are reserved account states,
           * not assignable dashboard Role documents. The backend
           * Role API returns Role documents only, but keep this
           * defensive filter in case old data exists.
           */
          setRoles(
            result.roles.filter(
              (role) =>
                role.slug !==
                  "user" &&
                role.slug !==
                  "customer"
            )
          );
        } catch (
          loadError
        ) {
          setRoles(
            []
          );

          setError(
            getErrorMessage(
              loadError
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        search,
        statusFilter,
      ]
    );

  useEffect(() => {
    void loadRoles();
  }, [
    loadRoles,
  ]);


  /* =======================================================
     LOAD DASHBOARD USERS

     Roles API intentionally returns only assigned-user counts.
     The user list is loaded separately so the role page can
     show exactly WHO has each role and can assign users here.
  ======================================================= */

  const loadDashboardUsers =
    useCallback(
      async () => {
        try {
          setUsersLoading(
            true
          );

          const result =
            await getUsers();

          setDashboardUsers(
            result.users
          );
        } catch (
          usersError
        ) {
          setDashboardUsers(
            []
          );

          setError(
            getErrorMessage(
              usersError
            )
          );
        } finally {
          setUsersLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadDashboardUsers();
  }, [
    loadDashboardUsers,
  ]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary =
    useMemo(
      () =>
        buildRoleDashboardSummary(
          roles
        ),
      [
        roles,
      ]
    );


  const usersByRole =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            DashboardUser[]
          >();

        dashboardUsers.forEach(
          (dashboardUser) => {
            const slug =
              dashboardUser.role ||
              "user";

            const current =
              map.get(slug) ||
              [];

            current.push(
              dashboardUser
            );

            map.set(
              slug,
              current
            );
          }
        );

        return map;
      },
      [
        dashboardUsers,
      ]
    );

  const unassignedUsers =
    useMemo(
      () =>
        dashboardUsers.filter(
          (dashboardUser) =>
            !dashboardUser.role ||
            dashboardUser.role ===
              "user"
        ),
      [
        dashboardUsers,
      ]
    );

  const assignableUsers =
    useMemo(
      () => {
        if (!assignmentRole) {
          return [];
        }

        return dashboardUsers.filter(
          (dashboardUser) => {
            const dashboardUserId =
              dashboardUser.id ||
              dashboardUser._id;

            return (
              dashboardUserId !==
                authenticatedUserId &&
              dashboardUser.role !==
                assignmentRole.slug
            );
          }
        );
      },
      [
        assignmentRole,
        authenticatedUserId,
        dashboardUsers,
      ]
    );

  /* =======================================================
     ASSIGN USERS TO ROLE

     System roles are immutable as role definitions, but they
     ARE assignable to dashboard users. That is how a Super
     Admin promotes an account to Admin.
  ======================================================= */

  const openAssignmentModal = (
    role: DashboardRole
  ) => {
    if (
      !canAssignUsers ||
      role.status !==
        "active"
    ) {
      return;
    }

    setAssignmentRole(
      role
    );

    setSelectedAssignmentUserId(
      ""
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );

    setAssignmentModalOpen(
      true
    );
  };

  const closeAssignmentModal =
    () => {
      if (
        assignmentSaving
      ) {
        return;
      }

      setAssignmentModalOpen(
        false
      );

      setAssignmentRole(
        null
      );

      setSelectedAssignmentUserId(
        ""
      );
    };

  const handleAssignUser =
    async () => {
      if (
        !assignmentRole ||
        !selectedAssignmentUserId ||
        !canAssignUsers
      ) {
        return;
      }

      try {
        setAssignmentSaving(
          true
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        const updatedUser =
          await assignUserRole(
            selectedAssignmentUserId,
            {
              roleId:
                assignmentRole._id ||
                assignmentRole.id,
            }
          );

        setDashboardUsers(
          (currentUsers) =>
            currentUsers.map(
              (currentUser) =>
                (
                  currentUser.id ||
                  currentUser._id
                ) ===
                (
                  updatedUser.id ||
                  updatedUser._id
                )
                  ? updatedUser
                  : currentUser
            )
        );

        await loadRoles();

        setAssignmentModalOpen(
          false
        );

        setAssignmentRole(
          null
        );

        setSelectedAssignmentUserId(
          ""
        );

        setSuccess(
          `${updatedUser.name || updatedUser.email} is now assigned to ${assignmentRole.name}.`
        );
      } catch (
        assignmentError
      ) {
        setError(
          getErrorMessage(
            assignmentError
          )
        );
      } finally {
        setAssignmentSaving(
          false
        );
      }
    };

  /* =======================================================
     CREATE MODAL
  ======================================================= */

  const openCreateModal =
    () => {
      if (
        !canManageRoles
      ) {
        return;
      }

      setEditingRole(
        null
      );

      setForm(
        EMPTY_ROLE_FORM
      );

      setSlugManuallyChanged(
        false
      );

      setError(
        ""
      );

      setSuccess(
        ""
      );

      setRoleModalOpen(
        true
      );
    };

  /* =======================================================
     EDIT MODAL
  ======================================================= */

  const openEditModal = (
    role: DashboardRole
  ) => {
    if (
      !canManageRoles ||
      role.isSystemRole
    ) {
      return;
    }

    setEditingRole(
      role
    );

    setForm({
      name:
        role.name,

      slug:
        role.slug,

      description:
        role.description,

      status:
        role.status,

      permissions: [
        ...role.permissions,
      ],
    });

    setSlugManuallyChanged(
      true
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );

    setRoleModalOpen(
      true
    );
  };

  const closeRoleModal =
    () => {
      if (saving) {
        return;
      }

      setRoleModalOpen(
        false
      );

      setEditingRole(
        null
      );

      setForm(
        EMPTY_ROLE_FORM
      );

      setSlugManuallyChanged(
        false
      );
    };

  /* =======================================================
     VIEW PERMISSIONS
  ======================================================= */

  const openPermissionModal = (
    role: DashboardRole
  ) => {
    setPermissionRole(
      role
    );

    setPermissionModalOpen(
      true
    );
  };

  const closePermissionModal =
    () => {
      setPermissionModalOpen(
        false
      );

      setPermissionRole(
        null
      );
    };

  /* =======================================================
     FORM
  ======================================================= */

  const handleNameChange = (
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,

        name:
          value,

        slug:
          slugManuallyChanged
            ? current.slug
            : createSlug(
                value
              ),
      })
    );
  };

  const handleSlugChange = (
    value: string
  ) => {
    setSlugManuallyChanged(
      true
    );

    setForm(
      (current) => ({
        ...current,

        slug:
          createSlug(
            value
          ),
      })
    );
  };

  const togglePermission = (
    permissionKey: string
  ) => {
    setForm(
      (current) => {
        const enabled =
          current.permissions.includes(
            permissionKey
          );

        return {
          ...current,

          permissions:
            enabled
              ? current.permissions.filter(
                  (permission) =>
                    permission !==
                    permissionKey
                )
              : [
                  ...current.permissions,
                  permissionKey,
                ],
        };
      }
    );
  };

  const selectPermissionGroup = (
    group: PermissionGroup
  ) => {
    const groupPermissions =
      group.permissions.map(
        (permission) =>
          permission.key
      );

    setForm(
      (current) => ({
        ...current,

        permissions: [
          ...new Set<string>([
            ...current.permissions,
            ...groupPermissions,
          ]),
        ],
      })
    );
  };

  const clearPermissionGroup = (
    group: PermissionGroup
  ) => {
    const permissionKeys =
      new Set<string>(
        group.permissions.map(
          (permission) =>
            permission.key
        )
      );

    setForm(
      (current) => ({
        ...current,

        permissions:
          current.permissions.filter(
            (permission) =>
              !permissionKeys.has(
                permission
              )
          ),
      })
    );
  };

  const selectAllPermissions =
    () => {
      setForm(
        (current) => ({
          ...current,

          permissions: [
            ...ALL_ROLE_PERMISSIONS,
          ],
        })
      );
    };

  const clearAllPermissions =
    () => {
      setForm(
        (current) => ({
          ...current,
          permissions: [],
        })
      );
    };

  /* =======================================================
     SAVE ROLE
  ======================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        !canManageRoles
      ) {
        return;
      }

      const name =
        form.name
          .trim()
          .replace(
            /\s+/g,
            " "
          );

      const slug =
        createSlug(
          form.slug ||
          form.name
        );

      if (
        name.length <
        2
      ) {
        setError(
          "Role name must contain at least 2 characters."
        );

        return;
      }

      if (!slug) {
        setError(
          "Role slug is required."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        if (
          editingRole
        ) {
          const updatedRole =
            await updateRole(
              editingRole._id,
              {
                name,
                slug,

                description:
                  form.description.trim(),

                permissions:
                  form.permissions,

                status:
                  form.status,
              }
            );

          setRoles(
            (current) =>
              current
                .map(
                  (role) =>
                    role._id ===
                    updatedRole._id
                      ? updatedRole
                      : role
                )
                .sort(
                  (
                    firstRole,
                    secondRole
                  ) =>
                    firstRole.name.localeCompare(
                      secondRole.name
                    )
                )
          );

          setSuccess(
            "Role updated successfully."
          );
        } else {
          const createdRole =
            await createRole({
              name,
              slug,

              description:
                form.description.trim(),

              permissions:
                form.permissions,

              status:
                form.status,
            });

          setRoles(
            (current) =>
              [
                ...current,
                createdRole,
              ].sort(
                (
                  firstRole,
                  secondRole
                ) =>
                  firstRole.name.localeCompare(
                    secondRole.name
                  )
              )
          );

          setSuccess(
            "Role created successfully."
          );
        }

        setRoleModalOpen(
          false
        );

        setEditingRole(
          null
        );

        setForm(
          EMPTY_ROLE_FORM
        );

        setSlugManuallyChanged(
          false
        );
      } catch (
        saveError
      ) {
        setError(
          getErrorMessage(
            saveError
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     ROLE STATUS
  ======================================================= */

  const handleStatusChange =
    async (
      role: DashboardRole,
      status: RoleStatus
    ) => {
      if (
        !canManageRoles ||
        role.isSystemRole ||
        role.status ===
          status
      ) {
        return;
      }

      const key =
        `status-${role._id}`;

      try {
        setActionKey(
          key
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        const updatedRole =
          await updateRoleStatus(
            role._id,
            status
          );

        setRoles(
          (current) =>
            current.map(
              (currentRole) =>
                currentRole._id ===
                updatedRole._id
                  ? updatedRole
                  : currentRole
            )
        );

        setSuccess(
          `Role status changed to ${status}.`
        );
      } catch (
        statusError
      ) {
        setError(
          getErrorMessage(
            statusError
          )
        );
      } finally {
        setActionKey(
          ""
        );
      }
    };

  /* =======================================================
     DELETE ROLE
  ======================================================= */

  const requestDeleteRole = (
    role: DashboardRole
  ) => {
    if (
      !canManageRoles ||
      role.isSystemRole
    ) {
      return;
    }

    setDeleteCandidate(
      role
    );

    setDeleteModalOpen(
      true
    );
  };

  const closeDeleteModal =
    () => {
      if (
        actionKey.startsWith(
          "delete-"
        )
      ) {
        return;
      }

      setDeleteModalOpen(
        false
      );

      setDeleteCandidate(
        null
      );
    };

  const confirmDeleteRole =
    async () => {
      if (
        !deleteCandidate ||
        !canManageRoles
      ) {
        return;
      }

      const role =
        deleteCandidate;

      const key =
        `delete-${role._id}`;

      try {
        setActionKey(
          key
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        await deleteRole(
          role._id
        );

        setRoles(
          (current) =>
            current.filter(
              (currentRole) =>
                currentRole._id !==
                role._id
            )
        );

        setDeleteModalOpen(
          false
        );

        setDeleteCandidate(
          null
        );

        setSuccess(
          "Role deleted successfully."
        );
      } catch (
        deleteError
      ) {
        setDeleteModalOpen(
          false
        );

        setDeleteCandidate(
          null
        );

        setError(
          getErrorMessage(
            deleteError
          )
        );
      } finally {
        setActionKey(
          ""
        );
      }
    };

  /* =======================================================
     SYSTEM ROLE ENSURE
  ======================================================= */

  const handleEnsureSystemRoles =
    async () => {
      if (
        !isSuperAdmin
      ) {
        return;
      }

      try {
        setActionKey(
          "ensure-system"
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        await ensureSystemRoles();

        await loadRoles();

        setSuccess(
          "System roles synchronized successfully."
        );
      } catch (
        ensureError
      ) {
        setError(
          getErrorMessage(
            ensureError
          )
        );
      } finally {
        setActionKey(
          ""
        );
      }
    };

  /* =======================================================
     EMPTY / FILTER
  ======================================================= */

  const hasFilters =
    Boolean(search) ||
    Boolean(statusFilter);

  const clearFilters =
    () => {
      setSearchInput(
        ""
      );

      setSearch(
        ""
      );

      setStatusFilter(
        ""
      );
    };

  return (
    <>
      <PageMeta
        title="Roles & Permissions | Solar Trade Hub Dashboard"
        description="Manage Solar Trade Hub dashboard roles and permissions."
      />

      <PageBreadcrumb
        pageTitle="Roles & Permissions"
      />

      <div className="space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <ShieldCheck
                    size={23}
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                    Administration
                  </p>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Roles & Permissions
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Create custom dashboard roles and control access to Solar
                    Trade Hub administration modules.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isSuperAdmin && (
                  <button
                    type="button"
                    disabled={
                      actionKey ===
                      "ensure-system"
                    }
                    onClick={() => {
                      void handleEnsureSystemRoles();
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    <RefreshCw
                      size={16}
                      className={
                        actionKey ===
                        "ensure-system"
                          ? "animate-spin"
                          : ""
                      }
                    />

                    Sync System Roles
                  </button>
                )}

                {canManageRoles && (
                  <button
                    type="button"
                    onClick={
                      openCreateModal
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b1f] to-[#6d28d9] px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Plus
                      size={17}
                    />

                    Add Role
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
          >
            <Check
              size={16}
            />

            {success}
          </div>
        )}

        {!canManageRoles && (
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-sm text-purple-700 dark:border-purple-500/10 dark:bg-purple-500/10 dark:text-purple-400">
            Your role has read-only access to Roles & Permissions.
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Total Roles"
            value={
              summary.totalRoles
            }
            icon={
              <ShieldCheck
                size={20}
              />
            }
            iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />

          <SummaryCard
            title="Active"
            value={
              summary.activeRoles
            }
            icon={
              <Check
                size={20}
              />
            }
            iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          />

          <SummaryCard
            title="System"
            value={
              summary.systemRoles
            }
            icon={
              <LockKeyhole
                size={20}
              />
            }
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
          />

          <SummaryCard
            title="Custom"
            value={
              summary.customRoles
            }
            icon={
              <Plus
                size={20}
              />
            }
            iconClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />

          <SummaryCard
            title="Assigned Users"
            value={
              summary.assignedUsers
            }
            icon={
              <Users
                size={20}
              />
            }
            iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          />
        </div>

        {unassignedUsers.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                <UserRound
                  size={17}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {unassignedUsers.length} unassigned dashboard user{unassignedUsers.length === 1 ? "" : "s"}
                </p>

                <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">
                  Assign a role below before these accounts can sign in to the protected dashboard.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {unassignedUsers.slice(0, 3).map(
                (dashboardUser) => (
                  <span
                    key={dashboardUser.id || dashboardUser._id}
                    className="rounded-full border border-amber-200 bg-white/70 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-white/5 dark:text-amber-300"
                  >
                    {dashboardUser.name || dashboardUser.email}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* =================================================
            ROLE LIST
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Dashboard Roles
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  System roles are protected. Custom roles can be managed here.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                <div className="relative w-full sm:min-w-[280px]">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={
                      searchInput
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchInput(
                        event.target.value
                      )
                    }
                    placeholder="Search roles..."
                    className="h-11 w-full rounded-xl border border-gray-300 bg-transparent pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setStatusFilter(
                      event.target.value as
                        | RoleStatus
                        | ""
                    )
                  }
                  className="h-11 rounded-xl border border-gray-300 bg-transparent px-3.5 text-sm text-gray-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="">
                    All Statuses
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>

                <button
                  type="button"
                  disabled={
                    !hasFilters
                  }
                  onClick={
                    clearFilters
                  }
                  className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:bg-white/5"
                >
                  Clear
                </button>

                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={() => {
                    void loadRoles();
                  }}
                  title="Refresh roles"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-500 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:bg-purple-500/10"
                >
                  <RefreshCw
                    size={16}
                    className={
                      loading
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <TableHeading>
                    Role
                  </TableHeading>

                  <TableHeading>
                    Users
                  </TableHeading>

                  <TableHeading>
                    Permissions
                  </TableHeading>

                  <TableHeading>
                    Type
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <TableHeading>
                    Updated
                  </TableHeading>

                  <TableHeading align="right">
                    Actions
                  </TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading &&
                  Array.from({
                    length: 4,
                  }).map(
                    (
                      _,
                      index
                    ) => (
                      <RoleSkeleton
                        key={
                          index
                        }
                      />
                    )
                  )}

                {!loading &&
                  roles.map(
                    (role) => {
                      const statusKey =
                        `status-${role._id}`;

                      const deleteKey =
                        `delete-${role._id}`;

                      return (
                        <tr
                          key={
                            role._id
                          }
                          className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                        >
                          {/* ROLE */}

                          <td className="px-5 py-5 align-top sm:px-6">
                            <div className="min-w-[250px]">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {role.name}
                                </p>

                                {role.isSystemRole && (
                                  <LockKeyhole
                                    size={14}
                                    className="text-orange-500"
                                  />
                                )}
                              </div>

                              <p className="mt-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                                {role.slug}
                              </p>

                              <p className="mt-2 max-w-[360px] text-xs leading-5 text-gray-500 dark:text-gray-400">
                                {role.description ||
                                  "No description provided."}
                              </p>
                            </div>
                          </td>

                          {/* ASSIGNED USERS */}

                          <td className="px-5 py-5 align-top">
                            {(() => {
                              const assignedUsers =
                                usersByRole.get(
                                  role.slug
                                ) ||
                                [];

                              return (
                                <div className="min-w-[180px]">
                                  <div className="flex items-center gap-2">
                                    <Users
                                      size={15}
                                      className="text-gray-400"
                                    />

                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                      {role.assignedUsersCount}
                                    </span>
                                  </div>

                                  {usersLoading ? (
                                    <p className="mt-2 text-xs text-gray-400">
                                      Loading users...
                                    </p>
                                  ) : assignedUsers.length >
                                    0 ? (
                                    <div className="mt-2 space-y-1.5">
                                      {assignedUsers
                                        .slice(0, 3)
                                        .map(
                                          (assignedUser) => (
                                            <div
                                              key={
                                                assignedUser.id ||
                                                assignedUser._id
                                              }
                                              className="flex items-center gap-2"
                                            >
                                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[10px] font-bold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                                {(assignedUser.name || assignedUser.email || "U")
                                                  .trim()
                                                  .slice(0, 1)
                                                  .toUpperCase()}
                                              </span>

                                              <span className="max-w-[145px] truncate text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {assignedUser.name ||
                                                  assignedUser.email}
                                              </span>
                                            </div>
                                          )
                                        )}

                                      {assignedUsers.length >
                                        3 && (
                                        <p className="pl-8 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                                          +{assignedUsers.length - 3} more
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-xs text-gray-400">
                                      No users assigned
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* PERMISSIONS */}

                          <td className="px-5 py-5 align-top">
                            <button
                              type="button"
                              onClick={() =>
                                openPermissionModal(
                                  role
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                            >
                              <Eye
                                size={13}
                              />

                              {role.permissions.includes(
                                "*"
                              )
                                ? "Full Access"
                                : `${role.permissions.length} Permission${
                                    role.permissions.length ===
                                    1
                                      ? ""
                                      : "s"
                                  }`}
                            </button>
                          </td>

                          {/* TYPE */}

                          <td className="px-5 py-5 align-top">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                role.isSystemRole
                                  ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
                              }`}
                            >
                              {role.isSystemRole
                                ? "System"
                                : "Custom"}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-5 align-top">
                            {role.isSystemRole ||
                            !canManageRoles ? (
                              <RoleStatusBadge
                                status={
                                  role.status
                                }
                              />
                            ) : (
                              <select
                                value={
                                  role.status
                                }
                                disabled={
                                  actionKey ===
                                  statusKey
                                }
                                onChange={(
                                  event
                                ) => {
                                  void handleStatusChange(
                                    role,
                                    event.target
                                      .value as RoleStatus
                                  );
                                }}
                                className="h-9 rounded-lg border border-gray-300 bg-transparent px-2.5 text-xs font-semibold text-gray-700 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                              >
                                <option value="active">
                                  Active
                                </option>

                                <option value="inactive">
                                  Inactive
                                </option>
                              </select>
                            )}
                          </td>

                          {/* UPDATED */}

                          <td className="px-5 py-5 align-top">
                            <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(
                                role.updatedAt
                              )}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-5 text-right align-top sm:px-6">
                            <div className="flex min-w-[190px] items-center justify-end gap-2">
                              {canAssignUsers &&
                                role.status ===
                                  "active" && (
                                  <ActionButton
                                    label="Assign"
                                    theme="green"
                                    onClick={() =>
                                      openAssignmentModal(
                                        role
                                      )
                                    }
                                  >
                                    <UserPlus
                                      size={14}
                                    />
                                  </ActionButton>
                                )}

                              <ActionButton
                                label="View"
                                theme="purple"
                                onClick={() =>
                                  openPermissionModal(
                                    role
                                  )
                                }
                              >
                                <Eye
                                  size={14}
                                />
                              </ActionButton>

                              {canManageRoles &&
                                !role.isSystemRole && (
                                  <>
                                    <ActionButton
                                      label="Edit"
                                      theme="orange"
                                      onClick={() =>
                                        openEditModal(
                                          role
                                        )
                                      }
                                    >
                                      <Pencil
                                        size={14}
                                      />
                                    </ActionButton>

                                    <ActionButton
                                      label={
                                        actionKey ===
                                        deleteKey
                                          ? "Deleting"
                                          : "Delete"
                                      }
                                      theme="red"
                                      disabled={
                                        actionKey ===
                                        deleteKey
                                      }
                                      onClick={() =>
                                        requestDeleteRole(
                                          role
                                        )
                                      }
                                    >
                                      {actionKey ===
                                      deleteKey ? (
                                        <RefreshCw
                                          size={14}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Trash2
                                          size={14}
                                        />
                                      )}
                                    </ActionButton>
                                  </>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}

                {!loading &&
                  roles.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center"
                      >
                        <ShieldCheck
                          size={36}
                          className="mx-auto text-gray-300 dark:text-gray-600"
                        />

                        <p className="mt-4 font-medium text-gray-700 dark:text-gray-300">
                          No roles found
                        </p>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {hasFilters
                            ? "Try changing the search or status filter."
                            : "Create a custom role or synchronize the protected system roles."}
                        </p>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ===================================================
          CREATE / EDIT ROLE MODAL
      =================================================== */}

      <Modal
        isOpen={
          roleModalOpen
        }
        onClose={
          closeRoleModal
        }
        className="m-4 max-w-[860px]"
      >
        <form
          onSubmit={
            handleSubmit
          }
          className="relative w-full max-w-[860px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
        >
          {/* HEADER */}

          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:px-8">
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                {editingRole ? (
                  <Pencil
                    size={18}
                  />
                ) : (
                  <Plus
                    size={18}
                  />
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600 dark:text-orange-400">
                  Roles & Permissions
                </p>

                <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {editingRole
                    ? "Edit Custom Role"
                    : "Create Custom Role"}
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Configure dashboard access for an operational role.
                </p>
              </div>
            </div>
          </div>

          {/* BODY */}

          <div className="max-h-[68vh] overflow-y-auto px-6 py-6 sm:px-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label="Role Name"
                required
              >
                <input
                  type="text"
                  value={
                    form.name
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    handleNameChange(
                      event.target.value
                    )
                  }
                  placeholder="Marketplace Manager"
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </FormField>

              <FormField
                label="Role Slug"
                required
                helper={
                  editingRole &&
                  editingRole.assignedUsersCount >
                    0
                    ? "The backend will prevent changing this slug while users are assigned."
                    : "Lowercase letters, numbers and underscores only."
                }
              >
                <input
                  type="text"
                  value={
                    form.slug
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    handleSlugChange(
                      event.target.value
                    )
                  }
                  placeholder="marketplace_manager"
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 font-mono text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField
                  label="Description"
                >
                  <textarea
                    rows={3}
                    value={
                      form.description
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          description:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Describe this role's responsibilities..."
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </FormField>
              </div>

              <FormField
                label="Status"
              >
                <select
                  value={
                    form.status
                  }
                  disabled={
                    saving
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        status:
                          event.target
                            .value as RoleStatus,
                      })
                    )
                  }
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </FormField>

              <div className="flex items-end">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={
                      selectAllPermissions
                    }
                    className="h-10 rounded-xl border border-purple-200 bg-purple-50 px-3 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-50 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={
                      clearAllPermissions
                    }
                    className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* PERMISSION CATALOGUE */}

            <div className="mt-7">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Permissions
                  </h4>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {form.permissions.length} permission
                    {form.permissions.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    selected.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {ROLE_PERMISSION_GROUPS.map(
                  (group) => {
                    const groupKeys =
                      group.permissions.map(
                        (permission) =>
                          permission.key
                      );

                    const enabledCount =
                      groupKeys.filter(
                        (permission) =>
                          form.permissions.includes(
                            permission
                          )
                      ).length;

                    const allEnabled =
                      enabledCount ===
                      groupKeys.length;

                    return (
                      <div
                        key={
                          group.key
                        }
                        className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {group.label}
                            </h5>

                            <p className="mt-1 text-[11px] text-gray-400">
                              {enabledCount}/{groupKeys.length} selected
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              allEnabled
                                ? clearPermissionGroup(
                                    group
                                  )
                                : selectPermissionGroup(
                                    group
                                  )
                            }
                            className="text-xs font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-50 dark:text-purple-400"
                          >
                            {allEnabled
                              ? "Clear"
                              : "Select All"}
                          </button>
                        </div>

                        <div className="mt-4 space-y-3">
                          {group.permissions.map(
                            (
                              permission
                            ) => {
                              const enabled =
                                form.permissions.includes(
                                  permission.key
                                );

                              return (
                                <label
                                  key={
                                    permission.key
                                  }
                                  className="flex cursor-pointer items-start gap-3 rounded-xl p-2 transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      enabled
                                    }
                                    disabled={
                                      saving
                                    }
                                    onChange={() =>
                                      togglePermission(
                                        permission.key
                                      )
                                    }
                                    className="mt-1 h-4 w-4 rounded border-gray-300 accent-purple-600"
                                  />

                                  <span className="min-w-0">
                                    <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {permission.label}
                                    </span>

                                    <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                                      {permission.description}
                                    </span>

                                    <span className="mt-1 block font-mono text-[10px] text-purple-500">
                                      {permission.key}
                                    </span>
                                  </span>
                                </label>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
            <Button
              size="sm"
              variant="outline"
              disabled={
                saving
              }
              onClick={
                closeRoleModal
              }
            >
              Cancel
            </Button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="inline-flex h-10 min-w-[130px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b1f] to-[#6d28d9] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <RefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : editingRole ? (
                <Pencil
                  size={15}
                />
              ) : (
                <Plus
                  size={15}
                />
              )}

              {saving
                ? "Saving..."
                : editingRole
                  ? "Save Role"
                  : "Create Role"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================
          PERMISSION VIEW MODAL
      =================================================== */}

      <Modal
        isOpen={
          permissionModalOpen
        }
        onClose={
          closePermissionModal
        }
        className="m-4 max-w-[820px]"
      >
        <div className="relative w-full max-w-[820px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:px-8">
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                <ShieldCheck
                  size={18}
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600 dark:text-orange-400">
                  Permission Details
                </p>

                <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {permissionRole?.name ||
                    "Role"}
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {permissionRole?.isSystemRole
                    ? "Protected system role."
                    : "Custom dashboard role."}
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[68vh] overflow-y-auto p-6 sm:p-8">
            {permissionRole?.permissions.includes(
              "*"
            ) && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                Full system access is enabled for this protected role.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {ROLE_PERMISSION_GROUPS.map(
                (group) => (
                  <div
                    key={
                      group.key
                    }
                    className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {group.label}
                    </h4>

                    <div className="mt-3 space-y-2">
                      {group.permissions.map(
                        (
                          permission
                        ) => {
                          const enabled =
                            permissionRole?.permissions.includes(
                              "*"
                            ) ||
                            permissionRole?.permissions.includes(
                              permission.key
                            );

                          return (
                            <div
                              key={
                                permission.key
                              }
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {permission.label}
                              </span>

                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                  enabled
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                    : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-600"
                                }`}
                              >
                                {enabled ? (
                                  <Check
                                    size={13}
                                  />
                                ) : (
                                  <X
                                    size={12}
                                  />
                                )}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {permissionRole &&
              !permissionRole.permissions.includes(
                "*"
              ) &&
              permissionRole.permissions.some(
                (permission) =>
                  !ALL_ROLE_PERMISSIONS.includes(
                    permission
                  )
              ) && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Additional Permissions
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {permissionRole.permissions
                      .filter(
                        (permission) =>
                          !ALL_ROLE_PERMISSIONS.includes(
                            permission
                          )
                      )
                      .map(
                        (permission) => (
                          <span
                            key={
                              permission
                            }
                            className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-mono text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400"
                          >
                            {permission}
                          </span>
                        )
                      )}
                  </div>
                </div>
              )}
          </div>

          <div className="flex justify-end border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
            <Button
              size="sm"
              onClick={
                closePermissionModal
              }
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================================================
          ASSIGN USER TO ROLE
      =================================================== */}

      <Modal
        isOpen={
          assignmentModalOpen
        }
        onClose={
          closeAssignmentModal
        }
        className="m-4 max-w-[620px]"
      >
        <div className="relative w-full max-w-[620px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:px-8">
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                <UserPlus
                  size={18}
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600 dark:text-orange-400">
                  User Role Assignment
                </p>

                <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  Assign {assignmentRole?.name || "Role"}
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Select a dashboard user. Existing roles can also be reassigned here.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {assignmentRole?.isSystemRole && (
              <div className="mb-5 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs leading-5 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
                {assignmentRole.name} is a protected system role. Its definition cannot be edited, but Super Admin/Admin can assign it to dashboard users.
              </div>
            )}

            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Dashboard User
            </label>

            <select
              value={
                selectedAssignmentUserId
              }
              disabled={
                assignmentSaving ||
                usersLoading
              }
              onChange={(
                event
              ) =>
                setSelectedAssignmentUserId(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">
                Select user to assign
              </option>

              {assignableUsers.map(
                (dashboardUser) => {
                  const dashboardUserId =
                    dashboardUser.id ||
                    dashboardUser._id;

                  const currentRoleLabel =
                    !dashboardUser.role ||
                    dashboardUser.role ===
                      "user"
                      ? "Unassigned"
                      : dashboardUser.roleDetails
                          ?.name ||
                        dashboardUser.role
                          .replace(/[-_]/g, " ")
                          .replace(/\b\w/g, (letter) =>
                            letter.toUpperCase()
                          );

                  return (
                    <option
                      key={dashboardUserId}
                      value={dashboardUserId}
                    >
                      {dashboardUser.name || dashboardUser.email} · {currentRoleLabel}
                    </option>
                  );
                }
              )}
            </select>

            {assignableUsers.length ===
              0 &&
              !usersLoading && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Every eligible dashboard user already has this role.
                </p>
              )}

            {selectedAssignmentUserId && (
              <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50/50 p-4 dark:border-purple-500/10 dark:bg-purple-500/10">
                {(() => {
                  const selectedUser =
                    dashboardUsers.find(
                      (dashboardUser) =>
                        (
                          dashboardUser.id ||
                          dashboardUser._id
                        ) ===
                        selectedAssignmentUserId
                    );

                  if (!selectedUser) {
                    return null;
                  }

                  return (
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-purple-600 shadow-sm dark:bg-white/5 dark:text-purple-400">
                        {(selectedUser.name || selectedUser.email || "U")
                          .slice(0, 1)
                          .toUpperCase()}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedUser.name || "Unnamed User"}
                        </p>

                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
            <Button
              size="sm"
              variant="outline"
              disabled={
                assignmentSaving
              }
              onClick={
                closeAssignmentModal
              }
            >
              Cancel
            </Button>

            <button
              type="button"
              disabled={
                assignmentSaving ||
                !selectedAssignmentUserId ||
                !assignmentRole
              }
              onClick={() => {
                void handleAssignUser();
              }}
              className="inline-flex h-10 min-w-[145px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b1f] to-[#6d28d9] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {assignmentSaving ? (
                <RefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <UserPlus
                  size={15}
                />
              )}

              {assignmentSaving
                ? "Assigning..."
                : "Assign Role"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===================================================
          DELETE CONFIRMATION
      =================================================== */}

      <Modal
        isOpen={
          deleteModalOpen
        }
        onClose={
          closeDeleteModal
        }
        className="m-4 max-w-[480px]"
      >
        <div className="relative w-full max-w-[480px] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          <div className="px-6 pb-5 pt-7 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Trash2
                size={20}
              />
            </div>

            <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
              Delete Role?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              You are about to permanently delete{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {deleteCandidate?.name ||
                  "this role"}
              </span>
              . Roles assigned to users cannot be deleted until those users are
              reassigned.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
            <Button
              size="sm"
              variant="outline"
              disabled={
                actionKey.startsWith(
                  "delete-"
                )
              }
              onClick={
                closeDeleteModal
              }
            >
              Cancel
            </Button>

            <button
              type="button"
              disabled={
                actionKey.startsWith(
                  "delete-"
                )
              }
              onClick={() => {
                void confirmDeleteRole();
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionKey.startsWith(
                "delete-"
              ) ? (
                <RefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Trash2
                  size={15}
                />
              )}

              {actionKey.startsWith(
                "delete-"
              )
                ? "Deleting..."
                : "Delete Role"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   TABLE HEADING
========================================================= */

const TableHeading = ({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) => {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6 ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
};

/* =========================================================
   ROLE STATUS BADGE
========================================================= */

const RoleStatusBadge = ({
  status,
}: {
  status: RoleStatus;
}) => {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
        status ===
        "active"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400"
      }`}
    >
      {status}
    </span>
  );
};

/* =========================================================
   ACTION BUTTON
========================================================= */

const ActionButton = ({
  label,
  theme,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  theme:
    | "purple"
    | "orange"
    | "green"
    | "red";
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  const themeClass =
    theme ===
    "purple"
      ? "border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
      : theme ===
          "orange"
        ? "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
        : theme ===
            "green"
          ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";

  return (
    <button
      type="button"
      title={
        label
      }
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className={`group flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border transition-all duration-300 hover:w-[78px] disabled:cursor-not-allowed disabled:opacity-45 ${themeClass}`}
    >
      <span className="shrink-0">
        {children}
      </span>

      <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold opacity-0 transition-all duration-300 group-hover:ml-1.5 group-hover:max-w-[48px] group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
};

/* =========================================================
   FORM FIELD
========================================================= */

const FormField = ({
  label,
  helper,
  required = false,
  children,
}: {
  label: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}

        {required && (
          <span className="ml-1 text-orange-500">
            *
          </span>
        )}
      </label>

      {children}

      {helper && (
        <p className="mt-1.5 text-xs leading-5 text-gray-400 dark:text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
};

/* =========================================================
   LOADING ROW
========================================================= */

const RoleSkeleton = () => {
  return (
    <tr>
      <td
        colSpan={7}
        className="px-5 py-5 sm:px-6"
      >
        <div className="flex animate-pulse items-center gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 rounded bg-gray-200 dark:bg-gray-800" />

            <div className="h-3 w-64 rounded bg-gray-100 dark:bg-gray-800/70" />
          </div>

          <div className="hidden h-7 w-24 rounded bg-gray-100 dark:bg-gray-800/70 lg:block" />

          <div className="hidden h-7 w-20 rounded bg-gray-100 dark:bg-gray-800/70 lg:block" />
        </div>
      </td>
    </tr>
  );
};

export default RolesPermissions;
