import api from "../../api";

/* =========================================================
   EMAIL SETTINGS TYPES
========================================================= */

export type EmailEncryptionType =
  | "TLS"
  | "SSL"
  | "None";

export type EmailSettings = {
  /* =======================================================
     SMTP CONFIGURATION
  ======================================================= */

  smtpHost: string;

  smtpPort: number;

  smtpUsername: string;

  encryption:
    EmailEncryptionType;

  /*
   * Stored password is never returned by backend.
   *
   * This only tells frontend whether SMTP credentials
   * already contain a saved password.
   */

  smtpPasswordConfigured:
    boolean;

  /* =======================================================
     SENDER IDENTITY
  ======================================================= */

  fromName: string;

  fromEmail: string;

  replyToEmail: string;

  /* =======================================================
     NOTIFICATION SETTINGS
  ======================================================= */

  orderNotifications:
    boolean;

  supplierNotifications:
    boolean;

  installerNotifications:
    boolean;

  tenderNotifications:
    boolean;

  userNotifications:
    boolean;

  dealNotifications:
    boolean;

  /* =======================================================
     BACKEND METADATA
  ======================================================= */

  _id?: string;

  settingsKey?:
    "email";

  updatedBy?:
    | string
    | null;

  createdAt?: string;

  updatedAt?: string;
};

/* =========================================================
   UPDATE PAYLOAD
========================================================= */

export type UpdateEmailSettingsPayload = {
  smtpHost: string;

  smtpPort: number;

  smtpUsername: string;

  /*
   * Optional.
   *
   * Missing or blank password means:
   *
   * preserve currently stored SMTP password.
   */

  smtpPassword?:
    string;

  encryption:
    EmailEncryptionType;

  fromName: string;

  fromEmail: string;

  replyToEmail: string;

  orderNotifications:
    boolean;

  supplierNotifications:
    boolean;

  installerNotifications:
    boolean;

  tenderNotifications:
    boolean;

  userNotifications:
    boolean;

  dealNotifications:
    boolean;
};

/* =========================================================
   TEST EMAIL RESPONSE
========================================================= */

export type TestEmailResult = {
  email: string;

  messageId:
    | string
    | null;
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
   GET EMAIL SETTINGS

   GET
   /api/v1/settings/email
========================================================= */

export const getEmailSettings =
  async (): Promise<EmailSettings> => {
    const response =
      await api.get<
        ApiResponse<EmailSettings>
      >(
        "/settings/email"
      );

    return response.data.data;
  };

/* =========================================================
   UPDATE EMAIL SETTINGS

   PUT
   /api/v1/settings/email
========================================================= */

export const updateEmailSettings =
  async (
    payload:
      UpdateEmailSettingsPayload
  ): Promise<EmailSettings> => {
    const response =
      await api.put<
        ApiResponse<EmailSettings>
      >(
        "/settings/email",
        payload
      );

    return response.data.data;
  };

/* =========================================================
   SEND TEST EMAIL

   POST
   /api/v1/settings/email/test

   Body:

   {
     email: "admin@example.com"
   }
========================================================= */

export const sendTestEmail =
  async (
    email:
      string
  ): Promise<TestEmailResult> => {
    const response =
      await api.post<
        ApiResponse<TestEmailResult>
      >(
        "/settings/email/test",
        {
          email,
        }
      );

    return response.data.data;
  };

/* =========================================================
   EMAIL SETTINGS ERROR MESSAGE
========================================================= */

export const getEmailSettingsErrorMessage =
  (
    error:
      unknown
  ) => {
    const apiError =
      error as {
        response?: {
          data?: {
            message?:
              string;

            errors?:
              string[];

            code?:
              string;
          };
        };

        message?:
          string;
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
      "Unable to load or save email settings."
    );
  };