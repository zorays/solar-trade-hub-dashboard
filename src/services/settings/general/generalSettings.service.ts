import api from "../../api";

/* =========================================================
   GENERAL SETTINGS TYPES
========================================================= */

export type GeneralSettings = {
  platformName: string;

  tagline: string;

  supportEmail: string;

  supportPhone: string;

  whatsappNumber: string;

  country: string;

  city: string;

  address: string;

  currency:
    | "PKR"
    | "USD";

  timezone: string;

  language:
    | "English"
    | "Urdu";

  allowRegistration: boolean;

  maintenanceMode: boolean;

  /* =======================================================
     BACKEND METADATA

     Optional because the form itself does not need these
     values in order to save.
  ======================================================= */

  _id?: string;

  settingsKey?: "general";

  updatedBy?:
    | string
    | null;

  createdAt?: string;

  updatedAt?: string;
};

/* =========================================================
   GENERAL SETTINGS UPDATE PAYLOAD
========================================================= */

export type UpdateGeneralSettingsPayload = {
  platformName: string;

  tagline: string;

  supportEmail: string;

  supportPhone: string;

  whatsappNumber: string;

  country: string;

  city: string;

  address: string;

  currency:
    | "PKR"
    | "USD";

  timezone: string;

  language:
    | "English"
    | "Urdu";

  allowRegistration: boolean;

  maintenanceMode: boolean;
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
   GET GENERAL SETTINGS

   GET
   /api/v1/settings/general
========================================================= */

export const getGeneralSettings =
  async (): Promise<GeneralSettings> => {
    const response =
      await api.get<
        ApiResponse<GeneralSettings>
      >(
        "/settings/general"
      );

    return response.data.data;
  };

/* =========================================================
   UPDATE GENERAL SETTINGS

   PUT
   /api/v1/settings/general
========================================================= */

export const updateGeneralSettings =
  async (
    payload:
      UpdateGeneralSettingsPayload
  ): Promise<GeneralSettings> => {
    const response =
      await api.put<
        ApiResponse<GeneralSettings>
      >(
        "/settings/general",
        payload
      );

    return response.data.data;
  };

/* =========================================================
   GENERAL SETTINGS ERROR MESSAGE
========================================================= */

export const getGeneralSettingsErrorMessage =
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
      "Unable to load or save general settings."
    );
  };