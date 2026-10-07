import axios from "axios";

import api from "../api";

/* =========================================================
   SOLAR TRADE HUB
   INSTALLER SERVICE
========================================================= */

/* =========================================================
   TYPES
========================================================= */

export type InstallerStatus =
  | "active"
  | "inactive"
  | "suspended";

export type InstallerVerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

/* =========================================================
   INTERNAL CONTACT
========================================================= */

export type InstallerInternalContact = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
};

/* =========================================================
   ADDRESS
========================================================= */

export type InstallerAddress = {
  line1: string;
  line2: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
};

/* =========================================================
   SYSTEM RATING

   IMPORTANT:
   Rating is system-generated.

   Dashboard create/edit forms should NOT manually modify it.
========================================================= */

export type InstallerRating = {
  average: number;
  reviewCount: number;
};

/* =========================================================
   INSTALLER
========================================================= */

export type Installer = {
  _id: string;

  id?: string;

  installerId: string;

  companyName: string;

  displayName: string;

  slug: string;

  description: string;

  city: string;

  serviceArea: string[];

  services: string[];

  internalContact: InstallerInternalContact;

  email: string;

  phone: string;

  whatsapp: string;

  website: string;

  ntn: string;

  strn: string;

  companyRegistrationNo: string;

  address: InstallerAddress;

  logo: string;

  bannerImage: string;

  verificationStatus:
    InstallerVerificationStatus;

  verificationNotes: string;

  verifiedAt:
    | string
    | null;

  verifiedBy:
    | string
    | null;

  rating: InstallerRating;

  status: InstallerStatus;

  sortOrder: number;

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
   CREATE PAYLOAD

   Backend automatically controls:

   - installerId
   - nameKey
   - slug generation
   - rating
   - verificationStatus
   - verificationNotes
   - verifiedAt
   - verifiedBy
   - createdBy
   - updatedBy
========================================================= */

export type CreateInstallerPayload = {
  companyName: string;

  displayName?: string;

  description?: string;

  city?: string;

  serviceArea?: string[];

  services?: string[];

  internalContact?: Partial<InstallerInternalContact>;

  email?: string;

  phone?: string;

  whatsapp?: string;

  website?: string;

  ntn?: string;

  strn?: string;

  companyRegistrationNo?: string;

  address?: Partial<InstallerAddress>;

  logo?: string;

  bannerImage?: string;

  sortOrder?: number;

  status?: InstallerStatus;
};

/* =========================================================
   UPDATE PAYLOAD
========================================================= */

export type UpdateInstallerPayload =
  Partial<
    CreateInstallerPayload
  >;

/* =========================================================
   VERIFICATION PAYLOAD
========================================================= */

export type UpdateInstallerVerificationPayload = {
  verificationStatus:
    InstallerVerificationStatus;

  verificationNotes?: string;
};

/* =========================================================
   LIST QUERY
========================================================= */

export type InstallerListQuery = {
  page?: number;

  limit?: number;

  search?: string;

  status?: InstallerStatus;

  verificationStatus?: InstallerVerificationStatus;

  city?: string;

  service?: string;

  sortBy?:
    | "companyName"
    | "displayName"
    | "city"
    | "status"
    | "verificationStatus"
    | "sortOrder"
    | "createdAt"
    | "updatedAt";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   PUBLIC LIST QUERY
========================================================= */

export type PublicInstallerListQuery = {
  page?: number;

  limit?: number;

  search?: string;

  city?: string;

  service?: string;
};

/* =========================================================
   PAGINATION
========================================================= */

export type InstallerPagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
};

/* =========================================================
   LIST RESULT
========================================================= */

export type InstallerListResult = {
  installers: Installer[];

  pagination: InstallerPagination;
};

/* =========================================================
   API RESPONSE TYPES
========================================================= */

type InstallerResponse = {
  success: boolean;

  message?: string;

  data: {
    installer: Installer;
  };
};

type InstallerListResponse = {
  success: boolean;

  message?: string;

  data: {
    installers: Installer[];

    pagination: InstallerPagination;
  };
};

type ActiveInstallersResponse = {
  success: boolean;

  message?: string;

  data: {
    installers: Installer[];
  };
};

type DeleteInstallerResponse = {
  success: boolean;

  message?: string;

  data: {
    installer: {
      installerId: string;

      companyName: string;

      displayName: string;
    };
  };
};

/* =========================================================
   QUERY HELPER

   Remove empty / undefined values before sending query params.
========================================================= */

const cleanQuery = <
  T extends Record<
    string,
    unknown
  >,
>(
  query: T
) => {
  return Object.fromEntries(
    Object.entries(
      query
    ).filter(
      ([, value]) =>
        value !==
          undefined &&
        value !==
          null &&
        value !==
          ""
    )
  );
};

/* =========================================================
   GET INSTALLERS

   GET /api/v1/installers
========================================================= */

export const getInstallers =
  async (
    query: InstallerListQuery = {}
  ): Promise<InstallerListResult> => {
    const response =
      await api.get<InstallerListResponse>(
        "/installers",
        {
          params:
            cleanQuery(
              query
            ),
        }
      );

    return {
      installers:
        response.data.data
          .installers,

      pagination:
        response.data.data
          .pagination,
    };
  };

/* =========================================================
   GET ACTIVE INSTALLERS

   GET /api/v1/installers/active

   Used for internal selectors.
========================================================= */

export const getActiveInstallers =
  async (
    search = ""
  ): Promise<Installer[]> => {
    const response =
      await api.get<ActiveInstallersResponse>(
        "/installers/active",
        {
          params:
            cleanQuery({
              search,
            }),
        }
      );

    return response.data.data
      .installers;
  };

/* =========================================================
   GET SINGLE INSTALLER

   GET /api/v1/installers/:installerId

   installerId may be:

   STH-I-0001

   OR

   MongoDB ObjectId
========================================================= */

export const getInstaller =
  async (
    installerId: string
  ): Promise<Installer> => {
    const response =
      await api.get<InstallerResponse>(
        `/installers/${encodeURIComponent(
          installerId
        )}`
      );

    return response.data.data
      .installer;
  };

/* =========================================================
   CREATE INSTALLER

   POST /api/v1/installers
========================================================= */

export const createInstaller =
  async (
    payload: CreateInstallerPayload
  ): Promise<Installer> => {
    const response =
      await api.post<InstallerResponse>(
        "/installers",
        payload
      );

    return response.data.data
      .installer;
  };

/* =========================================================
   UPDATE INSTALLER

   PATCH /api/v1/installers/:installerId
========================================================= */

export const updateInstaller =
  async (
    installerId: string,
    payload: UpdateInstallerPayload
  ): Promise<Installer> => {
    const response =
      await api.patch<InstallerResponse>(
        `/installers/${encodeURIComponent(
          installerId
        )}`,
        payload
      );

    return response.data.data
      .installer;
  };

/* =========================================================
   UPDATE STATUS

   PATCH /api/v1/installers/:installerId/status
========================================================= */

export const updateInstallerStatus =
  async (
    installerId: string,
    status: InstallerStatus
  ): Promise<Installer> => {
    const response =
      await api.patch<InstallerResponse>(
        `/installers/${encodeURIComponent(
          installerId
        )}/status`,
        {
          status,
        }
      );

    return response.data.data
      .installer;
  };

/* =========================================================
   UPDATE VERIFICATION

   PATCH /api/v1/installers/:installerId/verification
========================================================= */

export const updateInstallerVerification =
  async (
    installerId: string,
    verificationStatus:
      InstallerVerificationStatus,
    verificationNotes = ""
  ): Promise<Installer> => {
    const response =
      await api.patch<InstallerResponse>(
        `/installers/${encodeURIComponent(
          installerId
        )}/verification`,
        {
          verificationStatus,
          verificationNotes,
        }
      );

    return response.data.data
      .installer;
  };

/* =========================================================
   DELETE INSTALLER

   DELETE /api/v1/installers/:installerId
========================================================= */

export const deleteInstaller =
  async (
    installerId: string
  ): Promise<{
    installerId: string;
    companyName: string;
    displayName: string;
  }> => {
    const response =
      await api.delete<DeleteInstallerResponse>(
        `/installers/${encodeURIComponent(
          installerId
        )}`
      );

    return response.data.data
      .installer;
  };

/* =========================================================
   PUBLIC INSTALLER LIST

   GET /api/v1/installers/public

   Only backend-approved:

   active + verified

   installers are returned.
========================================================= */

export const getPublicInstallers =
  async (
    query: PublicInstallerListQuery = {}
  ): Promise<InstallerListResult> => {
    const response =
      await api.get<InstallerListResponse>(
        "/installers/public",
        {
          params:
            cleanQuery(
              query
            ),
        }
      );

    return {
      installers:
        response.data.data
          .installers,

      pagination:
        response.data.data
          .pagination,
    };
  };

/* =========================================================
   PUBLIC INSTALLER PROFILE

   GET /api/v1/installers/public/:installerId
========================================================= */

export const getPublicInstaller =
  async (
    installerId: string
  ): Promise<Installer> => {
    const response =
      await api.get<InstallerResponse>(
        `/installers/public/${encodeURIComponent(
          installerId
        )}`
      );

    return response.data.data
      .installer;
  };

/* =========================================================
   FORMAT STATUS
========================================================= */

export const formatInstallerStatus =
  (
    status: InstallerStatus
  ) => {
    switch (
      status
    ) {
      case "active":
        return "Active";

      case "inactive":
        return "Inactive";

      case "suspended":
        return "Suspended";

      default:
        return status;
    }
  };

/* =========================================================
   FORMAT VERIFICATION STATUS
========================================================= */

export const formatInstallerVerificationStatus =
  (
    status:
      InstallerVerificationStatus
  ) => {
    switch (
      status
    ) {
      case "pending":
        return "Pending";

      case "under_review":
        return "Under Review";

      case "verified":
        return "Verified";

      case "rejected":
        return "Rejected";

      default:
        return status;
    }
  };

/* =========================================================
   DISPLAY NAME
========================================================= */

export const getInstallerDisplayName =
  (
    installer:
      Pick<
        Installer,
        | "companyName"
        | "displayName"
      >
  ) => {
    return (
      installer.displayName?.trim() ||
      installer.companyName?.trim() ||
      "Installer"
    );
  };

/* =========================================================
   LOCATION LABEL
========================================================= */

export const getInstallerLocation =
  (
    installer:
      Pick<
        Installer,
        | "city"
        | "address"
      >
  ) => {
    const city =
      installer.city?.trim() ||
      installer.address?.city?.trim();

    const province =
      installer.address?.province?.trim();

    if (
      city &&
      province
    ) {
      return `${city}, ${province}`;
    }

    return (
      city ||
      province ||
      "Not specified"
    );
  };

/* =========================================================
   API ERROR MESSAGE
========================================================= */

export const getInstallerErrorMessage =
  (
    error: unknown,
    fallback =
      "Something went wrong."
  ) => {
    if (
      axios.isAxiosError(
        error
      )
    ) {
      const responseMessage =
        error.response?.data
          ?.message;

      if (
        typeof responseMessage ===
          "string" &&
        responseMessage.trim()
      ) {
        return responseMessage;
      }

      const validationErrors =
        error.response?.data
          ?.errors;

      if (
        Array.isArray(
          validationErrors
        ) &&
        validationErrors.length >
          0
      ) {
        const firstError =
          validationErrors[0];

        if (
          typeof firstError
            ?.message ===
          "string"
        ) {
          return firstError.message;
        }
      }

      if (
        typeof error.message ===
          "string" &&
        error.message.trim()
      ) {
        return error.message;
      }
    }

    if (
      error instanceof Error &&
      error.message.trim()
    ) {
      return error.message;
    }

    return fallback;
  };