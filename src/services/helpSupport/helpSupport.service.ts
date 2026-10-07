import api from "../api";

/* =========================================================
   SUPPORT TYPES
========================================================= */

export type SupportCategory =
  | "General"
  | "Products"
  | "Suppliers"
  | "Installers"
  | "Orders"
  | "Users"
  | "Settings"
  | "Technical";

export type SupportRequestStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

/* =========================================================
   SUPPORT REQUEST
========================================================= */

export type SupportRequest = {
  id: string;

  _id: string;

  category: SupportCategory;

  subject: string;

  message: string;

  status: SupportRequestStatus;

  resolutionNote:
    | string
    | null;

  resolvedAt:
    | string
    | null;

  resolvedBy:
    | string
    | null;

  createdAt: string;

  updatedAt: string;
};

/* =========================================================
   CREATE PAYLOAD
========================================================= */

export type CreateSupportRequestPayload = {
  category: SupportCategory;

  subject: string;

  message: string;
};

/* =========================================================
   LIST PARAMS
========================================================= */

export type SupportRequestListParams = {
  page?: number;

  limit?: number;
};

/* =========================================================
   LIST RESULT
========================================================= */

export type SupportRequestListResult = {
  requests:
    SupportRequest[];

  count: number;

  total: number;

  page: number;

  limit: number;

  totalPages: number;
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
  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
};

/* =========================================================
   NORMALIZE SUPPORT REQUEST
========================================================= */

const normalizeSupportRequest =
  (
    raw: unknown
  ): SupportRequest => {
    const item =
      raw &&
      typeof raw ===
        "object"
        ? (
            raw as {
              _id?: unknown;

              id?: unknown;

              category?: unknown;

              subject?: unknown;

              message?: unknown;

              status?: unknown;

              resolutionNote?: unknown;

              resolvedAt?: unknown;

              resolvedBy?: unknown;

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

      category:
        normalizeString(
          item.category
        ) as SupportCategory,

      subject:
        normalizeString(
          item.subject
        ),

      message:
        normalizeString(
          item.message
        ),

      status:
        normalizeString(
          item.status
        ) as SupportRequestStatus,

      resolutionNote:
        normalizeNullableString(
          item.resolutionNote
        ),

      resolvedAt:
        normalizeNullableString(
          item.resolvedAt
        ),

      resolvedBy:
        normalizeNullableString(
          item.resolvedBy
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
   CREATE SUPPORT REQUEST

   POST
   /api/v1/help-support/requests
========================================================= */

export const createSupportRequest =
  async (
    payload:
      CreateSupportRequestPayload
  ): Promise<SupportRequest> => {
    const response =
      await api.post(
        "/help-support/requests",
        {
          category:
            payload.category,

          subject:
            payload.subject.trim(),

          message:
            payload.message.trim(),
        }
      );

    const data =
      extractResponseData<{
        supportRequest?: unknown;
      }>(
        response
      );

    return normalizeSupportRequest(
      data?.supportRequest
    );
  };

/* =========================================================
   GET MY SUPPORT REQUESTS

   GET
   /api/v1/help-support/requests
========================================================= */

export const getMySupportRequests =
  async (
    params:
      SupportRequestListParams = {}
  ): Promise<SupportRequestListResult> => {
    const response =
      await api.get(
        "/help-support/requests",
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
          },
        }
      );

    const data =
      extractResponseData<{
        requests?: unknown[];

        count?: unknown;

        total?: unknown;

        page?: unknown;

        limit?: unknown;

        totalPages?: unknown;
      }>(
        response
      );

    const requests =
      Array.isArray(
        data?.requests
      )
        ? data.requests.map(
            normalizeSupportRequest
          )
        : [];

    return {
      requests,

      count:
        normalizeNumber(
          data?.count,
          requests.length
        ),

      total:
        normalizeNumber(
          data?.total,
          requests.length
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
   GET MY SINGLE SUPPORT REQUEST

   GET
   /api/v1/help-support/requests/:supportRequestId
========================================================= */

export const getMySupportRequestById =
  async (
    supportRequestId:
      string
  ): Promise<SupportRequest> => {
    const response =
      await api.get(
        `/help-support/requests/${supportRequestId}`
      );

    const data =
      extractResponseData<{
        supportRequest?: unknown;
      }>(
        response
      );

    return normalizeSupportRequest(
      data?.supportRequest
    );
  };

/* =========================================================
   ERROR MESSAGE
========================================================= */

export const getHelpSupportErrorMessage =
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
          "Support request failed."
        );
      }
    }

    return (
      apiError.response
        ?.data
        ?.message ||
      apiError.message ||
      "Unable to process support request."
    );
  };