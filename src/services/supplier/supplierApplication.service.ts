import axios from "axios";

import api from "../api";

import type {
  Supplier,
} from "./supplier.service";

/* =========================================================
   SOLAR TRADE HUB
   SUPPLIER APPLICATION SERVICE — DASHBOARD

   Backend contract:

   GET   /supplier-applications
   GET   /supplier-applications/summary
   GET   /supplier-applications/:applicationId
   PATCH /supplier-applications/:applicationId/status

   Storefront self-service endpoints are intentionally not
   used by the dashboard service.
========================================================= */

export type SupplierApplicationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export type SupplierApplicationSortField =
  | "applicationId"
  | "companyName"
  | "status"
  | "submittedAt"
  | "createdAt"
  | "updatedAt";

export type SupplierApplicationSortOrder =
  | "asc"
  | "desc";

export type SupplierApplicationAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
};

export type SupplierApplicationDocument = {
  _id?: string;
  id?: string;
  type?: string;
  name?: string;
  url?: string;
  uploadedAt?: string | null;
};

export type SupplierApplicationUser =
  | string
  | {
      _id?: string;
      id?: string;
      name?: string;
      email?: string;
      phone?: string;
      phoneE164?: string;
      isVerified?: boolean;
      status?: string;
    }
  | null;

export type SupplierApplicationSupplier =
  | string
  | Supplier
  | null;

export type SupplierApplication = {
  _id?: string;
  id?: string;

  applicationId: string;

  user: SupplierApplicationUser;
  supplier?: SupplierApplicationSupplier;

  companyName: string;
  contactPerson: string;

  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;

  ntn?: string;
  strn?: string;
  companyRegistrationNo?: string;

  address?: SupplierApplicationAddress;

  categories?: string[];
  brands?: string[];

  isAuthorizedDistributor?: boolean;
  distributorFor?: string[];

  documents?: SupplierApplicationDocument[];
  notes?: string;

  status: SupplierApplicationStatus;

  reviewNotes?: string;
  rejectionReason?: string;

  reviewedAt?: string | null;
  reviewedBy?: string | null;

  approvedAt?: string | null;
  approvedBy?: string | null;

  rejectedAt?: string | null;
  rejectedBy?: string | null;

  submittedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type SupplierApplicationListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: SupplierApplicationStatus;
  city?: string;
  country?: string;
  category?: string;
  sortBy?: SupplierApplicationSortField;
  sortOrder?: SupplierApplicationSortOrder;
};

export type SupplierApplicationPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type SupplierApplicationSummary = {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
};

export type SupplierApplicationListResult = {
  applications: SupplierApplication[];
  pagination: SupplierApplicationPagination;
};

export type SupplierApplicationStatusPayload = {
  status: SupplierApplicationStatus;
  reviewNotes?: string;
  rejectionReason?: string;
};

export type SupplierApplicationStatusResult = {
  application: SupplierApplication;
  supplier: Supplier | null;
};

type ListResponse = {
  success?: boolean;
  message?: string;
  data?: SupplierApplication[] | {
    applications?: SupplierApplication[];
  };
  pagination?: Partial<SupplierApplicationPagination>;
};

type SummaryResponse = {
  success?: boolean;
  message?: string;
  data?: Partial<SupplierApplicationSummary>;
};

type DetailResponse = {
  success?: boolean;
  message?: string;
  data?: {
    application?: SupplierApplication | null;
  };
};

type StatusResponse = {
  success?: boolean;
  message?: string;
  data?: {
    application?: SupplierApplication | null;
    supplier?: Supplier | null;
  };
};

type ErrorResponse = {
  message?: string;
  error?: string;
  errors?: Array<{
    field?: string;
    message?: string;
  }>;
};

const BASE_PATH =
  "/supplier-applications";

const normalizeNumber = (
  value: unknown,
  fallback = 0
) => {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const cleanQuery = (
  query: SupplierApplicationListQuery = {}
) => {
  const params: Record<string, string | number> = {};

  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.search?.trim()) params.search = query.search.trim();
  if (query.status) params.status = query.status;
  if (query.city?.trim()) params.city = query.city.trim();
  if (query.country?.trim()) params.country = query.country.trim();
  if (query.category?.trim()) params.category = query.category.trim();
  if (query.sortBy) params.sortBy = query.sortBy;
  if (query.sortOrder) params.sortOrder = query.sortOrder;

  return params;
};

export const getSupplierApplications =
  async (
    query: SupplierApplicationListQuery = {}
  ): Promise<SupplierApplicationListResult> => {
    const response =
      await api.get<ListResponse>(
        BASE_PATH,
        {
          params: cleanQuery(query),
        }
      );

    const rawData =
      response.data.data;

    const applications =
      Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.applications)
          ? rawData.applications
          : [];

    const rawPagination =
      response.data.pagination ?? {};

    return {
      applications,
      pagination: {
        page: normalizeNumber(rawPagination.page, query.page ?? 1),
        limit: normalizeNumber(rawPagination.limit, query.limit ?? 20),
        total: normalizeNumber(rawPagination.total, applications.length),
        totalPages: normalizeNumber(rawPagination.totalPages, 0),
        hasNextPage: Boolean(rawPagination.hasNextPage),
        hasPreviousPage: Boolean(rawPagination.hasPreviousPage),
      },
    };
  };

export const getSupplierApplicationSummary =
  async (): Promise<SupplierApplicationSummary> => {
    const response =
      await api.get<SummaryResponse>(
        `${BASE_PATH}/summary`
      );

    const data =
      response.data.data ?? {};

    return {
      total: normalizeNumber(data.total),
      pending: normalizeNumber(data.pending),
      underReview: normalizeNumber(data.underReview),
      approved: normalizeNumber(data.approved),
      rejected: normalizeNumber(data.rejected),
    };
  };

export const getSupplierApplication =
  async (
    applicationId: string
  ): Promise<SupplierApplication> => {
    const response =
      await api.get<DetailResponse>(
        `${BASE_PATH}/${encodeURIComponent(applicationId)}`
      );

    const application =
      response.data.data?.application;

    if (!application) {
      throw new Error("Supplier application was not found.");
    }

    return application;
  };

export const updateSupplierApplicationStatus =
  async (
    applicationId: string,
    payload: SupplierApplicationStatusPayload
  ): Promise<SupplierApplicationStatusResult> => {
    const response =
      await api.patch<StatusResponse>(
        `${BASE_PATH}/${encodeURIComponent(applicationId)}/status`,
        {
          status: payload.status,
          ...(payload.reviewNotes !== undefined
            ? { reviewNotes: payload.reviewNotes.trim() }
            : {}),
          ...(payload.rejectionReason !== undefined
            ? { rejectionReason: payload.rejectionReason.trim() }
            : {}),
        }
      );

    const application =
      response.data.data?.application;

    if (!application) {
      throw new Error(
        "Supplier application status response did not include the application."
      );
    }

    return {
      application,
      supplier:
        response.data.data?.supplier ?? null,
    };
  };

export const markSupplierApplicationPending =
  (
    applicationId: string,
    reviewNotes = ""
  ) =>
    updateSupplierApplicationStatus(
      applicationId,
      {
        status: "pending",
        reviewNotes,
      }
    );

export const markSupplierApplicationUnderReview =
  (
    applicationId: string,
    reviewNotes = ""
  ) =>
    updateSupplierApplicationStatus(
      applicationId,
      {
        status: "under_review",
        reviewNotes,
      }
    );

export const approveSupplierApplication =
  (
    applicationId: string,
    reviewNotes = ""
  ) =>
    updateSupplierApplicationStatus(
      applicationId,
      {
        status: "approved",
        reviewNotes,
      }
    );

export const rejectSupplierApplication =
  (
    applicationId: string,
    rejectionReason: string,
    reviewNotes = ""
  ) =>
    updateSupplierApplicationStatus(
      applicationId,
      {
        status: "rejected",
        rejectionReason,
        reviewNotes,
      }
    );

export const formatSupplierApplicationStatus =
  (
    status: SupplierApplicationStatus
  ) => {
    switch (status) {
      case "under_review":
        return "Under Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

export const formatSupplierApplicationDate =
  (
    value?: string | null
  ) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-PK",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

export const getSupplierApplicationUserLabel =
  (
    user: SupplierApplicationUser
  ) => {
    if (!user) return "—";
    if (typeof user === "string") return user;

    return (
      user.name ||
      user.email ||
      user.phone ||
      user.phoneE164 ||
      user._id ||
      user.id ||
      "—"
    );
  };

export const getSupplierApplicationErrorMessage =
  (
    error: unknown,
    fallback = "Supplier application request failed."
  ) => {
    if (axios.isAxiosError<ErrorResponse>(error)) {
      const firstValidationError =
        error.response?.data?.errors?.find(
          (item) => Boolean(item.message)
        )?.message;

      return (
        firstValidationError ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        fallback
      );
    }

    if (error instanceof Error) {
      return error.message || fallback;
    }

    return fallback;
  };
