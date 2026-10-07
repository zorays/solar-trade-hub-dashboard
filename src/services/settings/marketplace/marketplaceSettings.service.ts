import api from "../../api";

/* =========================================================
   MARKETPLACE SETTINGS TYPES
========================================================= */

export type MarketplaceSettings = {
  /* =======================================================
     PRODUCT CONTROLS
  ======================================================= */

  allowSupplierProducts: boolean;

  requireProductApproval: boolean;

  autoPublishApprovedProducts: boolean;

  /* =======================================================
     SUPPLIER CONTROLS
  ======================================================= */

  requireSupplierVerification: boolean;

  supplierVerificationLabel: string;

  /* =======================================================
     INSTALLER CONTROLS
  ======================================================= */

  allowInstallerApplications: boolean;

  requireInstallerVerification: boolean;

  installerVerificationLabel: string;

  /* =======================================================
     TENDER CONTROLS
  ======================================================= */

  allowTenderSubmissions: boolean;

  requireTenderApproval: boolean;

  /* =======================================================
     DEAL CONTROLS
  ======================================================= */

  allowMarketplaceDeals: boolean;

  requireDealApproval: boolean;

  /* =======================================================
     ORDER CONTROLS
  ======================================================= */

  allowOrderCancellation: boolean;

  cancellationWindowHours: number;

  minimumOrderAmount: number;

  /* =======================================================
     COMMERCIAL SETTINGS
  ======================================================= */

  marketplaceCommissionPercent: number;

  /* =======================================================
     BACKEND METADATA
  ======================================================= */

  _id?: string;

  settingsKey?: "marketplace";

  updatedBy?:
    | string
    | null;

  createdAt?: string;

  updatedAt?: string;
};

/* =========================================================
   UPDATE PAYLOAD
========================================================= */

export type UpdateMarketplaceSettingsPayload = {
  allowSupplierProducts: boolean;

  requireProductApproval: boolean;

  autoPublishApprovedProducts: boolean;

  requireSupplierVerification: boolean;

  supplierVerificationLabel: string;

  allowInstallerApplications: boolean;

  requireInstallerVerification: boolean;

  installerVerificationLabel: string;

  allowTenderSubmissions: boolean;

  requireTenderApproval: boolean;

  allowMarketplaceDeals: boolean;

  requireDealApproval: boolean;

  allowOrderCancellation: boolean;

  cancellationWindowHours: number;

  minimumOrderAmount: number;

  marketplaceCommissionPercent: number;
};

/* =========================================================
   API RESPONSE
========================================================= */

type ApiResponse<T> = {
  success: boolean;

  message?: string;

  data: T;
};

/* =========================================================
   GET MARKETPLACE SETTINGS

   GET
   /api/v1/settings/marketplace
========================================================= */

export const getMarketplaceSettings =
  async (): Promise<MarketplaceSettings> => {
    const response =
      await api.get<
        ApiResponse<MarketplaceSettings>
      >(
        "/settings/marketplace"
      );

    return response.data.data;
  };

/* =========================================================
   UPDATE MARKETPLACE SETTINGS

   PUT
   /api/v1/settings/marketplace
========================================================= */

export const updateMarketplaceSettings =
  async (
    payload:
      UpdateMarketplaceSettingsPayload
  ): Promise<MarketplaceSettings> => {
    const response =
      await api.put<
        ApiResponse<MarketplaceSettings>
      >(
        "/settings/marketplace",
        payload
      );

    return response.data.data;
  };

/* =========================================================
   MARKETPLACE SETTINGS ERROR MESSAGE
========================================================= */

export const getMarketplaceSettingsErrorMessage =
  (
    error:
      unknown
  ) => {
    const apiError =
      error as {
        response?: {
          data?: {
            message?: string;

            errors?: string[];
          };
        };

        message?: string;
      };

    const validationErrors =
      apiError.response
        ?.data
        ?.errors;

    if (
      Array.isArray(
        validationErrors
      ) &&
      validationErrors.length >
        0
    ) {
      return validationErrors.join(
        " "
      );
    }

    return (
      apiError.response
        ?.data
        ?.message ||
      apiError.message ||
      "Unable to load or save marketplace settings."
    );
  };