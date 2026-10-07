import api from "../api";

/* =========================================================
   NOTIFICATION TYPES
========================================================= */

export type NotificationType =
  | "Order"
  | "Supplier"
  | "Installer"
  | "Tender"
  | "Product"
  | "User"
  | "System";

type ApiNotificationType =
  | "order"
  | "supplier"
  | "installer"
  | "tender"
  | "product"
  | "user"
  | "system";

/* =========================================================
   NOTIFICATION ITEM
========================================================= */

export type DashboardNotification = {
  id: string;

  _id: string;

  type: NotificationType;

  title: string;

  message: string;

  entityType:
    | string
    | null;

  entityId:
    | string
    | null;

  actionPath:
    | string
    | null;

  read: boolean;

  readAt:
    | string
    | null;

  createdAt: string;

  updatedAt: string;
};

/* =========================================================
   NOTIFICATION LIST PARAMS
========================================================= */

export type NotificationListParams = {
  page?: number;

  limit?: number;

  search?: string;

  type?:
    | NotificationType
    | "";

  unreadOnly?: boolean;
};

/* =========================================================
   NOTIFICATION LIST RESULT
========================================================= */

export type NotificationListResult = {
  notifications:
    DashboardNotification[];

  count: number;

  total: number;

  page: number;

  limit: number;

  totalPages: number;
};

/* =========================================================
   SUMMARY
========================================================= */

export type NotificationSummary = {
  total: number;

  unread: number;

  read: number;
};

/* =========================================================
   ACTION RESULTS
========================================================= */

export type MarkAllReadResult = {
  modifiedCount: number;
};

export type DeleteNotificationResult = {
  notificationId: string;
};

export type ClearReadNotificationsResult = {
  deletedCount: number;
};

/* =========================================================
   API ENVELOPE
========================================================= */

type ApiEnvelope<T> = {
  success?: boolean;

  message?: string;

  data?: T;
};

/* =========================================================
   RESPONSE EXTRACTOR
========================================================= */

const extractResponseData = <T>(
  response: unknown
): T => {
  const axiosResponse =
    response as {
      data?: unknown;
    };

  const responseBody =
    axiosResponse.data;

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

const normalizeNullableString = (
  value: unknown
): string | null => {
  const normalized =
    normalizeString(
      value
    );

  return normalized ||
    null;
};

const normalizeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const numeric =
    Number(
      value
    );

  return Number.isFinite(
    numeric
  )
    ? numeric
    : fallback;
};

const normalizeBoolean = (
  value: unknown
): boolean => {
  return value === true;
};

/* =========================================================
   TYPE MAPPING

   Backend:
   order

   Frontend:
   Order
========================================================= */

const API_TO_UI_TYPE: Record<
  ApiNotificationType,
  NotificationType
> = {
  order: "Order",

  supplier:
    "Supplier",

  installer:
    "Installer",

  tender:
    "Tender",

  product:
    "Product",

  user:
    "User",

  system:
    "System",
};

const UI_TO_API_TYPE: Record<
  NotificationType,
  ApiNotificationType
> = {
  Order: "order",

  Supplier:
    "supplier",

  Installer:
    "installer",

  Tender:
    "tender",

  Product:
    "product",

  User:
    "user",

  System:
    "system",
};

/* =========================================================
   NORMALIZE NOTIFICATION TYPE
========================================================= */

const normalizeNotificationType =
  (
    value: unknown
  ): NotificationType => {
    if (
      typeof value !==
      "string"
    ) {
      return "System";
    }

    const normalized =
      value
        .trim()
        .toLowerCase() as
        ApiNotificationType;

    return (
      API_TO_UI_TYPE[
        normalized
      ] ||
      "System"
    );
  };

/* =========================================================
   NORMALIZE NOTIFICATION
========================================================= */

const normalizeNotification =
  (
    raw: unknown
  ): DashboardNotification => {
    const item =
      raw &&
      typeof raw ===
        "object"
        ? (
            raw as {
              _id?: unknown;

              id?: unknown;

              type?: unknown;

              title?: unknown;

              message?: unknown;

              entityType?: unknown;

              entityId?: unknown;

              actionPath?: unknown;

              read?: unknown;

              readAt?: unknown;

              createdAt?: unknown;

              updatedAt?: unknown;
            }
          )
        : {};

    const id =
      normalizeString(
        item._id
      ) ||
      normalizeString(
        item.id
      );

    return {
      id,

      _id:
        id,

      type:
        normalizeNotificationType(
          item.type
        ),

      title:
        normalizeString(
          item.title
        ),

      message:
        normalizeString(
          item.message
        ),

      entityType:
        normalizeNullableString(
          item.entityType
        ),

      entityId:
        normalizeNullableString(
          item.entityId
        ),

      actionPath:
        normalizeNullableString(
          item.actionPath
        ),

      read:
        normalizeBoolean(
          item.read
        ),

      readAt:
        normalizeNullableString(
          item.readAt
        ),

      createdAt:
        normalizeString(
          item.createdAt
        ),

      updatedAt:
        normalizeString(
          item.updatedAt
        ),
    };
  };

/* =========================================================
   GET NOTIFICATIONS

   GET
   /api/v1/notifications
========================================================= */

export const getNotifications =
  async (
    params:
      NotificationListParams = {}
  ): Promise<NotificationListResult> => {
    const response =
      await api.get(
        "/notifications",
        {
          params: {
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

            ...(params.search
              ?.trim()
              ? {
                  search:
                    params.search.trim(),
                }
              : {}),

            ...(params.type
              ? {
                  type:
                    UI_TO_API_TYPE[
                      params.type
                    ],
                }
              : {}),

            ...(typeof params.unreadOnly ===
            "boolean"
              ? {
                  unreadOnly:
                    params.unreadOnly,
                }
              : {}),
          },
        }
      );

    const data =
      extractResponseData<{
        notifications?: unknown[];

        count?: unknown;

        total?: unknown;

        page?: unknown;

        limit?: unknown;

        totalPages?: unknown;
      }>(
        response
      );

    const notifications =
      Array.isArray(
        data?.notifications
      )
        ? data.notifications.map(
            normalizeNotification
          )
        : [];

    return {
      notifications,

      count:
        normalizeNumber(
          data?.count,
          notifications.length
        ),

      total:
        normalizeNumber(
          data?.total,
          notifications.length
        ),

      page:
        normalizeNumber(
          data?.page,
          1
        ),

      limit:
        normalizeNumber(
          data?.limit,
          20
        ),

      totalPages:
        normalizeNumber(
          data?.totalPages,
          0
        ),
    };
  };

/* =========================================================
   GET NOTIFICATION SUMMARY

   GET
   /api/v1/notifications/summary
========================================================= */

export const getNotificationSummary =
  async (): Promise<NotificationSummary> => {
    const response =
      await api.get(
        "/notifications/summary"
      );

    const data =
      extractResponseData<{
        total?: unknown;

        unread?: unknown;

        read?: unknown;
      }>(
        response
      );

    return {
      total:
        normalizeNumber(
          data?.total
        ),

      unread:
        normalizeNumber(
          data?.unread
        ),

      read:
        normalizeNumber(
          data?.read
        ),
    };
  };

/* =========================================================
   MARK SINGLE AS READ

   PATCH
   /api/v1/notifications/:notificationId/read
========================================================= */

export const markNotificationAsRead =
  async (
    notificationId:
      string
  ): Promise<DashboardNotification> => {
    const response =
      await api.patch(
        `/notifications/${notificationId}/read`
      );

    const data =
      extractResponseData<{
        notification?: unknown;
      }>(
        response
      );

    return normalizeNotification(
      data?.notification
    );
  };

/* =========================================================
   MARK ALL AS READ

   PATCH
   /api/v1/notifications/read-all
========================================================= */

export const markAllNotificationsAsRead =
  async (): Promise<MarkAllReadResult> => {
    const response =
      await api.patch(
        "/notifications/read-all"
      );

    const data =
      extractResponseData<{
        modifiedCount?: unknown;
      }>(
        response
      );

    return {
      modifiedCount:
        normalizeNumber(
          data?.modifiedCount
        ),
    };
  };

/* =========================================================
   DELETE NOTIFICATION

   DELETE
   /api/v1/notifications/:notificationId
========================================================= */

export const deleteNotification =
  async (
    notificationId:
      string
  ): Promise<DeleteNotificationResult> => {
    const response =
      await api.delete(
        `/notifications/${notificationId}`
      );

    const data =
      extractResponseData<{
        notificationId?: unknown;
      }>(
        response
      );

    return {
      notificationId:
        normalizeString(
          data?.notificationId
        ) ||
        notificationId,
    };
  };

/* =========================================================
   CLEAR READ NOTIFICATIONS

   DELETE
   /api/v1/notifications/read
========================================================= */

export const clearReadNotifications =
  async (): Promise<ClearReadNotificationsResult> => {
    const response =
      await api.delete(
        "/notifications/read"
      );

    const data =
      extractResponseData<{
        deletedCount?: unknown;
      }>(
        response
      );

    return {
      deletedCount:
        normalizeNumber(
          data?.deletedCount
        ),
    };
  };

/* =========================================================
   ERROR MESSAGE
========================================================= */

export const getNotificationErrorMessage =
  (
    error: unknown
  ): string => {
    const apiError =
      error as {
        response?: {
          data?: {
            message?: string;

            errors?:
              | string[]
              | Array<{
                  message?: string;

                  msg?: string;
                }>;
          };
        };

        message?: string;
      };

    const errors =
      apiError.response
        ?.data
        ?.errors;

    if (
      Array.isArray(
        errors
      ) &&
      errors.length >
        0
    ) {
      const first =
        errors[0];

      if (
        typeof first ===
        "string"
      ) {
        return first;
      }

      if (
        first &&
        typeof first ===
          "object"
      ) {
        return (
          first.message ||
          first.msg ||
          "Notification request failed."
        );
      }
    }

    return (
      apiError.response
        ?.data
        ?.message ||
      apiError.message ||
      "Unable to process notification request."
    );
  };