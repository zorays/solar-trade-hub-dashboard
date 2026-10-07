import axios from "axios";

import api from "../api";

import type {
  Installer,
} from "./installer.service";

/* =========================================================
   SOLAR TRADE HUB
   INSTALLER APPLICATION SERVICE
========================================================= */

/* =========================================================
   TYPES
========================================================= */

export type InstallerApplicationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export type InstallerApplicationSortField =
  | "companyName"
  | "displayName"
  | "city"
  | "applicationStatus"
  | "createdAt"
  | "updatedAt"
  | "reviewedAt"
  | "approvedAt"
  | "rejectedAt";

export type SortOrder =
  | "asc"
  | "desc";

/* =========================================================
   CONTACT
========================================================= */

export interface InstallerApplicationContact {
  name: string;

  email: string;

  phone: string;

  whatsapp: string;
}

/* =========================================================
   ADDRESS
========================================================= */

export interface InstallerApplicationAddress {
  line1: string;

  line2: string;

  city: string;

  province: string;

  country: string;

  postalCode: string;
}

/* =========================================================
   APPLICATION
========================================================= */

export interface InstallerApplication {
  applicationId: string;

  companyName: string;

  displayName: string;

  description: string;

  city: string;

  serviceArea: string[];

  services: string[];

  internalContact: InstallerApplicationContact;

  email: string;

  phone: string;

  whatsapp: string;

  website: string;

  ntn: string;

  strn: string;

  companyRegistrationNo: string;

  address: InstallerApplicationAddress;

  applicationStatus: InstallerApplicationStatus;

  reviewNotes: string;

  reviewedAt: string | null;

  reviewedBy: string | null;

  approvedAt: string | null;

  approvedBy: string | null;

  rejectedAt: string | null;

  rejectedBy: string | null;

  /*
   * MongoDB relation to created Installer.
   *
   * UI should still use public installerId from the
   * returned Installer object whenever possible.
   */

  installer: string | null;

  convertedAt: string | null;

  createdAt: string;

  updatedAt: string;
}

/* =========================================================
   CREATE PAYLOAD
========================================================= */

export interface CreateInstallerApplicationPayload {
  companyName: string;

  displayName?: string;

  description?: string;

  city: string;

  serviceArea: string[];

  services: string[];

  internalContact: {
    name: string;

    email: string;

    phone: string;

    whatsapp?: string;
  };

  email?: string;

  phone?: string;

  whatsapp?: string;

  website?: string;

  ntn?: string;

  strn?: string;

  companyRegistrationNo?: string;

  address?: {
    line1?: string;

    line2?: string;

    city?: string;

    province?: string;

    country?: string;

    postalCode?: string;
  };
}

/* =========================================================
   LIST QUERY
========================================================= */

export interface InstallerApplicationListQuery {
  page?: number;

  limit?: number;

  search?: string;

  applicationStatus?: InstallerApplicationStatus;

  city?: string;

  service?: string;

  sortBy?: InstallerApplicationSortField;

  sortOrder?: SortOrder;
}

/* =========================================================
   PAGINATION
========================================================= */

export interface InstallerApplicationPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

/* =========================================================
   SUMMARY
========================================================= */

export interface InstallerApplicationSummary {
  total: number;

  pending: number;

  under_review: number;

  approved: number;

  rejected: number;
}

/* =========================================================
   LIST RESULT
========================================================= */

export interface InstallerApplicationListResult {
  applications: InstallerApplication[];

  pagination: InstallerApplicationPagination;

  summary: InstallerApplicationSummary;
}

/* =========================================================
   STATUS UPDATE RESULT
========================================================= */

export interface InstallerApplicationStatusResult {
  application: InstallerApplication;

  /*
   * Installer is returned when application approval creates
   * or resolves an existing installer profile.
   */

  installer: Installer | null;
}

/* =========================================================
   API RESPONSE TYPES
========================================================= */

interface CreateApplicationResponse {
  success: boolean;

  message?: string;

  data: {
    application: InstallerApplication;
  };
}

interface ApplicationListResponse {
  success: boolean;

  data: {
    applications: InstallerApplication[];

    pagination: InstallerApplicationPagination;

    summary: InstallerApplicationSummary;
  };
}

interface ApplicationResponse {
  success: boolean;

  data: {
    application: InstallerApplication;
  };
}

interface ApplicationStatusResponse {
  success: boolean;

  message?: string;

  data: {
    application: InstallerApplication;

    installer: Installer | null;
  };
}

/* =========================================================
   QUERY CLEANER
========================================================= */

const cleanQuery = (
  query: InstallerApplicationListQuery = {}
) => {
  const params: Record<
    string,
    string | number
  > = {};

  if (
    query.page !== undefined
  ) {
    params.page =
      query.page;
  }

  if (
    query.limit !== undefined
  ) {
    params.limit =
      query.limit;
  }

  if (
    query.search?.trim()
  ) {
    params.search =
      query.search.trim();
  }

  if (
    query.applicationStatus
  ) {
    params.applicationStatus =
      query.applicationStatus;
  }

  if (
    query.city?.trim()
  ) {
    params.city =
      query.city.trim();
  }

  if (
    query.service?.trim()
  ) {
    params.service =
      query.service.trim();
  }

  if (
    query.sortBy
  ) {
    params.sortBy =
      query.sortBy;
  }

  if (
    query.sortOrder
  ) {
    params.sortOrder =
      query.sortOrder;
  }

  return params;
};

/* =========================================================
   CREATE APPLICATION

   POST /installer-applications

   Public endpoint.

   New application status is always controlled by backend:
   pending
========================================================= */

export const createInstallerApplication =
  async (
    payload: CreateInstallerApplicationPayload
  ): Promise<InstallerApplication> => {
    const response =
      await api.post<CreateApplicationResponse>(
        "/installer-applications",
        payload
      );

    return response.data.data.application;
  };

/* =========================================================
   LIST APPLICATIONS

   GET /installer-applications

   Dashboard protected endpoint.
========================================================= */

export const getInstallerApplications =
  async (
    query: InstallerApplicationListQuery = {}
  ): Promise<InstallerApplicationListResult> => {
    const response =
      await api.get<ApplicationListResponse>(
        "/installer-applications",
        {
          params:
            cleanQuery(
              query
            ),
        }
      );

    return {
      applications:
        response.data.data.applications,

      pagination:
        response.data.data.pagination,

      summary:
        response.data.data.summary,
    };
  };

/* =========================================================
   GET SINGLE APPLICATION

   GET /installer-applications/:applicationId

   Recommended reference:
   STH-IA-0001
========================================================= */

export const getInstallerApplication =
  async (
    applicationId: string
  ): Promise<InstallerApplication> => {
    const response =
      await api.get<ApplicationResponse>(
        `/installer-applications/${encodeURIComponent(
          applicationId
        )}`
      );

    return response.data.data.application;
  };

/* =========================================================
   UPDATE APPLICATION STATUS

   PATCH
   /installer-applications/:applicationId/status

   Status:
   pending
   under_review
   approved
   rejected
========================================================= */

export const updateInstallerApplicationStatus =
  async (
    applicationId: string,
    applicationStatus: InstallerApplicationStatus,
    reviewNotes = ""
  ): Promise<InstallerApplicationStatusResult> => {
    const response =
      await api.patch<ApplicationStatusResponse>(
        `/installer-applications/${encodeURIComponent(
          applicationId
        )}/status`,
        {
          applicationStatus,

          reviewNotes:
            reviewNotes.trim(),
        }
      );

    return {
      application:
        response.data.data.application,

      installer:
        response.data.data.installer ??
        null,
    };
  };

/* =========================================================
   CONVENIENCE ACTIONS
========================================================= */

export const markInstallerApplicationPending =
  (
    applicationId: string,
    reviewNotes = ""
  ) => {
    return updateInstallerApplicationStatus(
      applicationId,
      "pending",
      reviewNotes
    );
  };

export const markInstallerApplicationUnderReview =
  (
    applicationId: string,
    reviewNotes = ""
  ) => {
    return updateInstallerApplicationStatus(
      applicationId,
      "under_review",
      reviewNotes
    );
  };

export const approveInstallerApplication =
  (
    applicationId: string,
    reviewNotes = ""
  ) => {
    return updateInstallerApplicationStatus(
      applicationId,
      "approved",
      reviewNotes
    );
  };

export const rejectInstallerApplication =
  (
    applicationId: string,
    reviewNotes = ""
  ) => {
    return updateInstallerApplicationStatus(
      applicationId,
      "rejected",
      reviewNotes
    );
  };

/* =========================================================
   STATUS FORMATTER
========================================================= */

export const formatInstallerApplicationStatus =
  (
    status: InstallerApplicationStatus
  ) => {
    switch (
      status
    ) {
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

/* =========================================================
   DATE FORMATTER
========================================================= */

export const formatInstallerApplicationDate =
  (
    value?: string | null
  ) => {
    if (
      !value
    ) {
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

    return date.toLocaleDateString(
      "en-PK",
      {
        day: "2-digit",

        month: "short",

        year: "numeric",
      }
    );
  };

/* =========================================================
   ERROR MESSAGE
========================================================= */

export const getInstallerApplicationErrorMessage =
  (
    error: unknown,
    fallback =
      "Installer application request failed."
  ) => {
    if (
      axios.isAxiosError(
        error
      )
    ) {
      const data =
        error.response?.data as
          | {
              message?: string;

              errors?: Array<{
                field?: string;

                message?: string;
              }>;
            }
          | undefined;

      if (
        data?.message
      ) {
        if (
          Array.isArray(
            data.errors
          ) &&
          data.errors.length >
            0
        ) {
          const firstError =
            data.errors.find(
              (item) =>
                item?.message
            );

          if (
            firstError?.message
          ) {
            return firstError.message;
          }
        }

        return data.message;
      }

      if (
        error.message
      ) {
        return error.message;
      }
    }

    if (
      error instanceof
      Error &&
      error.message
    ) {
      return error.message;
    }

    return fallback;
  };