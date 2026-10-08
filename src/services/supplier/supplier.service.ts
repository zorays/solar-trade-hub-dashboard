import axios from "axios";

import api from "../api";

/* =========================================================
   SUPPLIER TYPES
========================================================= */

export type SupplierStatus =
  | "active"
  | "inactive"
  | "suspended";

export type SupplierVerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

export type SupplierBusinessType =
  | "manufacturer"
  | "distributor"
  | "importer"
  | "wholesaler"
  | "retailer"
  | "installer"
  | "service_provider"
  | "other";

/* =========================================================
   ADDRESS
========================================================= */

export type SupplierAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
};

/* =========================================================
   USER REFERENCE
========================================================= */

export type SupplierUserReference =
  | string
  | {
      _id?: string;
      id?: string;
      name?: string;
      email?: string;
    }
  | null;

/* =========================================================
   SUPPLIER
========================================================= */

export type Supplier = {
  _id: string;
  id?: string;

  /*
   * Public supplier ID.
   *
   * Example:
   * STH-S-0001
   */
  supplierId: string;

  companyName: string;

  slug: string;

  contactPerson?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;

  businessType:
    SupplierBusinessType;

  ntn?: string;
  strn?: string;
  companyRegistrationNo?: string;

  address?:
    SupplierAddress;

  logo?: string;
  bannerImage?: string;

  description?: string;

  verificationStatus:
    SupplierVerificationStatus;

  verificationNotes?: string;

  verifiedAt?:
    | string
    | null;

  verifiedBy?:
    SupplierUserReference;

  isFeatured: boolean;

  sortOrder: number;

  status:
    SupplierStatus;

  createdBy?:
    SupplierUserReference;

  updatedBy?:
    SupplierUserReference;

  createdAt: string;
  updatedAt: string;
};

/* =========================================================
   CREATE PAYLOAD

   supplierId is intentionally NOT sent.

   Backend generates:
   STH-S-0001
========================================================= */

export type CreateSupplierPayload = {
  companyName: string;

  slug?: string;

  contactPerson?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;

  businessType?:
    SupplierBusinessType;

  ntn?: string;
  strn?: string;
  companyRegistrationNo?: string;

  address?:
    SupplierAddress;

  logo?: string;
  bannerImage?: string;

  description?: string;

  isFeatured?: boolean;

  sortOrder?: number;
};

/* =========================================================
   UPDATE PAYLOAD

   Profile-only fields. Workflow state is updated through
   dedicated status / verification endpoints.
========================================================= */

export type UpdateSupplierPayload =
  Partial<CreateSupplierPayload>;

/* =========================================================
   VERIFICATION PAYLOAD

   Dedicated verification endpoint:
   PATCH /suppliers/:supplierId/verification
========================================================= */

export type UpdateSupplierVerificationPayload = {
  verificationStatus:
    SupplierVerificationStatus;

  verificationNotes?: string;
};

/* =========================================================
   LIST QUERY
========================================================= */

export type SupplierListQuery = {
  page?: number;

  limit?: number;

  search?: string;

  status?:
    SupplierStatus;

  verificationStatus?:
    SupplierVerificationStatus;

  businessType?:
    SupplierBusinessType;

  isFeatured?: boolean;

  city?: string;

  country?: string;

  sortBy?:
    | "supplierId"
    | "companyName"
    | "businessType"
    | "verificationStatus"
    | "status"
    | "sortOrder"
    | "createdAt"
    | "updatedAt";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   PAGINATION
========================================================= */

export type SupplierPagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
};

/* =========================================================
   API RESPONSES
========================================================= */

type SupplierApiResponse = {
  success: boolean;

  message?: string;

  data:
    Supplier;
};

type SupplierListApiResponse = {
  success: boolean;

  message?: string;

  data:
    Supplier[];

  pagination:
    SupplierPagination;
};

type SupplierArrayApiResponse = {
  success: boolean;

  message?: string;

  data:
    Supplier[];
};

type DeleteSupplierApiResponse = {
  success: boolean;

  message?: string;

  data: {
    id: string;

    supplierId: string;

    companyName: string;
  };
};

/* =========================================================
   NORMALIZE USER REFERENCE
========================================================= */

const normalizeUserReference = (
  value:
    SupplierUserReference |
    undefined
): SupplierUserReference => {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return null;
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return {
    ...value,

    _id:
      value._id ||
      value.id ||
      "",

    id:
      value.id ||
      value._id ||
      "",

    name:
      value.name ||
      "",

    email:
      value.email ||
      "",
  };
};

/* =========================================================
   NORMALIZE SUPPLIER
========================================================= */

export const normalizeSupplier = (
  supplier: Supplier
): Supplier => {
  const internalId =
    supplier._id ||
    supplier.id ||
    "";

  return {
    ...supplier,

    _id:
      internalId,

    id:
      internalId,

    supplierId:
      supplier.supplierId ||
      "",

    companyName:
      supplier.companyName ||
      "",

    slug:
      supplier.slug ||
      "",

    contactPerson:
      supplier.contactPerson ||
      "",

    email:
      supplier.email ||
      "",

    phone:
      supplier.phone ||
      "",

    whatsapp:
      supplier.whatsapp ||
      "",

    website:
      supplier.website ||
      "",

    businessType:
      supplier.businessType ||
      "other",

    ntn:
      supplier.ntn ||
      "",

    strn:
      supplier.strn ||
      "",

    companyRegistrationNo:
      supplier.companyRegistrationNo ||
      "",

    address: {
      line1:
        supplier.address
          ?.line1 ||
        "",

      line2:
        supplier.address
          ?.line2 ||
        "",

      city:
        supplier.address
          ?.city ||
        "",

      province:
        supplier.address
          ?.province ||
        "",

      country:
        supplier.address
          ?.country ||
        "Pakistan",

      postalCode:
        supplier.address
          ?.postalCode ||
        "",
    },

    logo:
      supplier.logo ||
      "",

    bannerImage:
      supplier.bannerImage ||
      "",

    description:
      supplier.description ||
      "",

    verificationStatus:
      supplier.verificationStatus ||
      "pending",

    verificationNotes:
      supplier.verificationNotes ||
      "",

    verifiedAt:
      supplier.verifiedAt ??
      null,

    verifiedBy:
      normalizeUserReference(
        supplier.verifiedBy
      ),

    isFeatured:
      Boolean(
        supplier.isFeatured
      ),

    sortOrder:
      Number(
        supplier.sortOrder ??
          0
      ),

    status:
      supplier.status ||
      "active",

    createdBy:
      normalizeUserReference(
        supplier.createdBy
      ),

    updatedBy:
      normalizeUserReference(
        supplier.updatedBy
      ),

    createdAt:
      supplier.createdAt ||
      "",

    updatedAt:
      supplier.updatedAt ||
      "",
  };
};

/* =========================================================
   GET SUPPLIERS

   Dashboard:
   GET /api/v1/suppliers
========================================================= */

export const getSuppliers = async (
  query:
    SupplierListQuery = {}
) => {
  const response =
    await api.get<SupplierListApiResponse>(
      "/suppliers",
      {
        params:
          query,
      }
    );

  return {
    suppliers:
      response.data.data.map(
        normalizeSupplier
      ),

    pagination:
      response.data
        .pagination,
  };
};

/* =========================================================
   GET ACTIVE SUPPLIERS

   Public supplier directory helper.

   IMPORTANT:
   "active" only means supplier administrative status.

   It does NOT prove:
   - verification
   - active subscription
   - marketplace listing entitlement
   - external product access
========================================================= */

export const getActiveSuppliers =
  async (
    search?: string
  ) => {
    const response =
      await api.get<SupplierArrayApiResponse>(
        "/suppliers/active",
        {
          params: {
            ...(search
              ? {
                  search,
                }
              : {}),

            limit: 100,
          },
        }
      );

    return response.data.data.map(
      normalizeSupplier
    );
  };

/* =========================================================
   GET FEATURED SUPPLIERS

   Public supplier directory helper.

   Featured state does not override marketplace eligibility.
========================================================= */

export const getFeaturedSuppliers =
  async (
    limit = 12
  ) => {
    const response =
      await api.get<SupplierArrayApiResponse>(
        "/suppliers/featured",
        {
          params: {
            limit,
          },
        }
      );

    return response.data.data.map(
      normalizeSupplier
    );
  };

/* =========================================================
   GET SUPPLIER

   Supports:
   - STH-S-0001
   - MongoDB ObjectId
========================================================= */

export const getSupplier = async (
  supplierId: string
) => {
  const response =
    await api.get<SupplierApiResponse>(
      `/suppliers/${encodeURIComponent(
        supplierId
      )}`
    );

  return normalizeSupplier(
    response.data.data
  );
};

/* =========================================================
   CREATE SUPPLIER

   Backend generates supplierId automatically.
========================================================= */

export const createSupplier = async (
  payload:
    CreateSupplierPayload
) => {
  const response =
    await api.post<SupplierApiResponse>(
      "/suppliers",
      payload
    );

  return normalizeSupplier(
    response.data.data
  );
};

/* =========================================================
   UPDATE SUPPLIER
========================================================= */

export const updateSupplier = async (
  supplierId: string,
  payload:
    UpdateSupplierPayload
) => {
  const response =
    await api.patch<SupplierApiResponse>(
      `/suppliers/${encodeURIComponent(
        supplierId
      )}`,
      payload
    );

  return normalizeSupplier(
    response.data.data
  );
};

/* =========================================================
   UPDATE STATUS

   Dedicated status endpoint.
========================================================= */

export const updateSupplierStatus =
  async (
    supplierId: string,
    status:
      SupplierStatus
  ) => {
    const response =
      await api.patch<SupplierApiResponse>(
        `/suppliers/${encodeURIComponent(
          supplierId
        )}/status`,
        {
          status,
        }
      );

    return normalizeSupplier(
      response.data.data
    );
  };

/* =========================================================
   UPDATE VERIFICATION

   Dedicated verification endpoint.

   Backend controls:
   - verifiedAt
   - verifiedBy
========================================================= */

export const updateSupplierVerification =
  async (
    supplierId: string,
    payload:
      UpdateSupplierVerificationPayload
  ) => {
    const response =
      await api.patch<SupplierApiResponse>(
        `/suppliers/${encodeURIComponent(
          supplierId
        )}/verification`,
        {
          verificationStatus:
            payload.verificationStatus,

          ...(payload.verificationNotes !==
          undefined
            ? {
                verificationNotes:
                  payload.verificationNotes,
              }
            : {}),
        }
      );

    return normalizeSupplier(
      response.data.data
    );
  };

/* =========================================================
   DELETE SUPPLIER

   Backend may reject deletion if linked marketplace records
   still depend on this supplier.
========================================================= */

export const deleteSupplier = async (
  supplierId: string
) => {
  const response =
    await api.delete<DeleteSupplierApiResponse>(
      `/suppliers/${encodeURIComponent(
        supplierId
      )}`
    );

  return response.data.data;
};

/* =========================================================
   DISPLAY HELPERS
========================================================= */

export const formatSupplierBusinessType = (
  value:
    | SupplierBusinessType
    | string
    | null
    | undefined
) => {
  if (
    !value
  ) {
    return "";
  }

  return value
    .split("_")
    .filter(
      Boolean
    )
    .map(
      (
        word
      ) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};

export const formatSupplierStatus = (
  value:
    | SupplierStatus
    | string
    | null
    | undefined
) => {
  if (
    !value
  ) {
    return "";
  }

  return (
    value
      .charAt(0)
      .toUpperCase() +
    value.slice(1)
  );
};

export const formatSupplierVerificationStatus =
  (
    value:
      | SupplierVerificationStatus
      | string
      | null
      | undefined
  ) => {
    if (
      !value
    ) {
      return "";
    }

    return value
      .split("_")
      .filter(
        Boolean
      )
      .map(
        (
          word
        ) =>
          word
            .charAt(0)
            .toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  };

/* =========================================================
   ERROR MESSAGE
========================================================= */

type ErrorResponseBody = {
  message?: string;

  error?: string;

  code?: string;

  errors?: Array<{
    field?: string;

    message?: string;
  }>;
};

export const getSupplierErrorMessage = (
  error: unknown,
  fallback =
    "Something went wrong while processing the supplier."
) => {
  if (
    axios.isAxiosError<ErrorResponseBody>(
      error
    )
  ) {
    const responseData =
      error.response
        ?.data;

    const validationMessage =
      responseData
        ?.errors?.find(
          (
            item
          ) =>
            Boolean(
              item.message
            )
        )
        ?.message;

    return (
      validationMessage ||
      responseData
        ?.message ||
      responseData
        ?.error ||
      error.message ||
      fallback
    );
  }

  if (
    error instanceof Error
  ) {
    return (
      error.message ||
      fallback
    );
  }

  return fallback;
};