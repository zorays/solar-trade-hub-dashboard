import {
  useEffect,
  useState,
} from "react";

import {
  BellRing,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  RefreshCw,
  Save,
  Send,
  Server,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  getEmailSettings,
  getEmailSettingsErrorMessage,
  sendTestEmail,
  updateEmailSettings,
  type EmailEncryptionType,
  type EmailSettings as EmailSettingsData,
  type UpdateEmailSettingsPayload,
} from "../../services/settings/email/emailSettings.service";

/* =========================================================
   TYPES
========================================================= */

type EmailSettingsForm = {
  smtpHost: string;

  smtpPort: string;

  smtpUsername: string;

  smtpPassword: string;

  encryption: EmailEncryptionType;

  fromName: string;

  fromEmail: string;

  replyToEmail: string;

  orderNotifications: boolean;

  supplierNotifications: boolean;

  installerNotifications: boolean;

  tenderNotifications: boolean;

  userNotifications: boolean;

  dealNotifications: boolean;
};

/* =========================================================
   FALLBACK SETTINGS

   Used only before backend settings are loaded.

   Actual persisted settings come from:

   GET
   /api/v1/settings/email
========================================================= */

const initialSettings: EmailSettingsForm = {
  smtpHost:
    "smtp.example.com",

  smtpPort:
    "587",

  smtpUsername:
    "",

  smtpPassword:
    "",

  encryption:
    "TLS",

  fromName:
    "Solar Trade Hub",

  fromEmail:
    "no-reply@solartradehub.com",

  replyToEmail:
    "support@solartradehub.com",

  orderNotifications:
    true,

  supplierNotifications:
    true,

  installerNotifications:
    true,

  tenderNotifications:
    true,

  userNotifications:
    true,

  dealNotifications:
    false,
};

/* =========================================================
   MAP API SETTINGS TO FORM

   IMPORTANT:

   SMTP password never comes back from backend.

   Password field therefore always stays blank after
   loading or saving.

   smtpPasswordConfigured tells us whether a saved password
   already exists.
========================================================= */

const mapSettingsToForm =
  (
    settings:
      EmailSettingsData
  ): EmailSettingsForm => {
    return {
      smtpHost:
        settings.smtpHost ||
        "",

      smtpPort:
        String(
          settings.smtpPort ??
            587
        ),

      smtpUsername:
        settings.smtpUsername ||
        "",

      smtpPassword:
        "",

      encryption:
        settings.encryption,

      fromName:
        settings.fromName ||
        "",

      fromEmail:
        settings.fromEmail ||
        "",

      replyToEmail:
        settings.replyToEmail ||
        "",

      orderNotifications:
        settings.orderNotifications,

      supplierNotifications:
        settings.supplierNotifications,

      installerNotifications:
        settings.installerNotifications,

      tenderNotifications:
        settings.tenderNotifications,

      userNotifications:
        settings.userNotifications,

      dealNotifications:
        settings.dealNotifications,
    };
  };

/* =========================================================
   NUMBER HELPER
========================================================= */

const toNumber =
  (
    value:
      string
  ) => {
    const parsed =
      Number(
        value
      );

    return Number.isFinite(
      parsed
    )
      ? parsed
      : 0;
  };

/* =========================================================
   MAP FORM TO API PAYLOAD
========================================================= */

const mapFormToPayload =
  (
    form:
      EmailSettingsForm
  ): UpdateEmailSettingsPayload => {
    const payload:
      UpdateEmailSettingsPayload =
      {
        smtpHost:
          form.smtpHost.trim(),

        smtpPort:
          toNumber(
            form.smtpPort
          ),

        smtpUsername:
          form.smtpUsername.trim(),

        encryption:
          form.encryption,

        fromName:
          form.fromName.trim(),

        fromEmail:
          form.fromEmail.trim(),

        replyToEmail:
          form.replyToEmail.trim(),

        orderNotifications:
          form.orderNotifications,

        supplierNotifications:
          form.supplierNotifications,

        installerNotifications:
          form.installerNotifications,

        tenderNotifications:
          form.tenderNotifications,

        userNotifications:
          form.userNotifications,

        dealNotifications:
          form.dealNotifications,
      };

    /*
     * Only send smtpPassword when admin actually entered
     * a new password.
     *
     * Otherwise backend keeps existing encrypted password.
     */

    if (
      form.smtpPassword.length >
      0
    ) {
      payload.smtpPassword =
        form.smtpPassword;
    }

    return payload;
  };

/* =========================================================
   PAGE
========================================================= */

const EmailSettings =
  () => {
    const [
      formData,
      setFormData,
    ] =
      useState<EmailSettingsForm>(
        initialSettings
      );

    /* =======================================================
       LAST SAVED SERVER STATE

       Reset restores this state.

       SMTP password itself is never stored here.
    ======================================================= */

    const [
      savedSettings,
      setSavedSettings,
    ] =
      useState<EmailSettingsForm | null>(
        null
      );

    const [
      smtpPasswordConfigured,
      setSmtpPasswordConfigured,
    ] =
      useState(
        false
      );

    const [
      showPassword,
      setShowPassword,
    ] =
      useState(
        false
      );

    const [
      loading,
      setLoading,
    ] =
      useState(
        true
      );

    const [
      saving,
      setSaving,
    ] =
      useState(
        false
      );

    const [
      saved,
      setSaved,
    ] =
      useState(
        false
      );

    const [
      error,
      setError,
    ] =
      useState<string | null>(
        null
      );

    const [
      testing,
      setTesting,
    ] =
      useState(
        false
      );

    const [
      testEmail,
      setTestEmail,
    ] =
      useState(
        ""
      );

    const [
      testSuccess,
      setTestSuccess,
    ] =
      useState(
        false
      );

    const [
      testMessage,
      setTestMessage,
    ] =
      useState(
        ""
      );

    const [
      testError,
      setTestError,
    ] =
      useState<string | null>(
        null
      );

    /* =======================================================
       LOAD EMAIL SETTINGS

       GET
       /api/v1/settings/email
    ======================================================= */

    useEffect(
      () => {
        let active =
          true;

        const loadSettings =
          async () => {
            try {
              setLoading(
                true
              );

              setError(
                null
              );

              const settings =
                await getEmailSettings();

              if (
                !active
              ) {
                return;
              }

              const mapped =
                mapSettingsToForm(
                  settings
                );

              setFormData(
                mapped
              );

              setSavedSettings(
                mapped
              );

              setSmtpPasswordConfigured(
                Boolean(
                  settings.smtpPasswordConfigured
                )
              );
            } catch (
              loadError
            ) {
              console.error(
                "Failed to load email settings:",
                loadError
              );

              if (
                active
              ) {
                setError(
                  getEmailSettingsErrorMessage(
                    loadError
                  )
                );
              }
            } finally {
              if (
                active
              ) {
                setLoading(
                  false
                );
              }
            }
          };

        loadSettings();

        return () => {
          active =
            false;
        };
      },
      []
    );

    /* =======================================================
       UPDATE FIELD
    ======================================================= */

    const updateField = <
      K extends keyof EmailSettingsForm,
    >(
      field: K,
      value:
        EmailSettingsForm[K]
    ) => {
      setFormData(
        (
          current
        ) => ({
          ...current,

          [field]:
            value,
        })
      );

      setSaved(
        false
      );

      setError(
        null
      );
    };

    /* =======================================================
       SAVE

       PUT
       /api/v1/settings/email
    ======================================================= */

    const handleSave =
      async () => {
        try {
          setSaving(
            true
          );

          setSaved(
            false
          );

          setError(
            null
          );

          setTestSuccess(
            false
          );

          setTestError(
            null
          );

          const payload =
            mapFormToPayload(
              formData
            );

          const settings =
            await updateEmailSettings(
              payload
            );

          const mapped =
            mapSettingsToForm(
              settings
            );

          /*
           * Server response becomes authoritative state.
           *
           * Password field returns to blank because backend
           * never exposes the stored credential.
           */

          setFormData(
            mapped
          );

          setSavedSettings(
            mapped
          );

          setSmtpPasswordConfigured(
            Boolean(
              settings.smtpPasswordConfigured
            )
          );

          setShowPassword(
            false
          );

          setSaved(
            true
          );
        } catch (
          saveError
        ) {
          console.error(
            "Failed to save email settings:",
            saveError
          );

          setError(
            getEmailSettingsErrorMessage(
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
       RESET

       Restore last settings loaded/saved from backend.

       Does not send anything to server.
    ======================================================= */

    const handleReset =
      () => {
        setFormData(
          savedSettings ||
            initialSettings
        );

        setShowPassword(
          false
        );

        setSaved(
          false
        );

        setError(
          null
        );

        setTestSuccess(
          false
        );

        setTestError(
          null
        );

        setTestMessage(
          ""
        );
      };

    /* =======================================================
       SEND REAL TEST EMAIL

       POST
       /api/v1/settings/email/test

       This endpoint uses SAVED SMTP settings from backend.

       Unsaved form changes are not used until Save Changes
       has been clicked.
    ======================================================= */

    const handleTestEmail =
      async () => {
        const email =
          testEmail.trim();

        if (
          !email
        ) {
          setTestError(
            "Enter an email address for the test email."
          );

          setTestSuccess(
            false
          );

          return;
        }

        try {
          setTesting(
            true
          );

          setTestSuccess(
            false
          );

          setTestError(
            null
          );

          setTestMessage(
            ""
          );

          const result =
            await sendTestEmail(
              email
            );

          setTestSuccess(
            true
          );

          setTestMessage(
            `Test email sent successfully to ${result.email}.`
          );
        } catch (
          sendError
        ) {
          console.error(
            "Failed to send test email:",
            sendError
          );

          setTestError(
            getEmailSettingsErrorMessage(
              sendError
            )
          );
        } finally {
          setTesting(
            false
          );
        }
      };

    /* =======================================================
       DISABLED STATE
    ======================================================= */

    const disabled =
      loading ||
      saving;

    return (
      <>
        <PageMeta
          title="Email Settings | Solar Trade Hub"
          description="Manage Solar Trade Hub email configuration and notifications."
        />

        <PageBreadcrumb
          pageTitle="Email Settings"
        />

        <div className="space-y-6">
          {/* =================================================
              HEADER
          ================================================== */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="relative p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

              <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                    <Mail
                      size={23}
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                      System Settings
                    </p>

                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                      Email Settings
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                      Configure outbound
                      email delivery,
                      sender identity and
                      marketplace email
                      notifications.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={
                      handleReset
                    }
                    disabled={
                      disabled
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    <RefreshCw
                      size={16}
                    />

                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleSave
                    }
                    disabled={
                      disabled
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Save
                        size={16}
                      />
                    )}

                    {saving
                      ? "Saving..."
                      : loading
                        ? "Loading..."
                        : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <TriangleAlert
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>
                {error}
              </span>
            </div>
          )}

          {/* =================================================
              SUCCESS
          ================================================== */}

          {saved && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
              <CheckCircle2
                size={17}
              />

              Email settings saved successfully.
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================== */}

          {loading && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              <RefreshCw
                size={16}
                className="animate-spin"
              />

              Loading email settings...
            </div>
          )}

          {/* =================================================
              SMTP CONFIGURATION
          ================================================== */}

          <SettingsCard
            title="SMTP Configuration"
            description="Outgoing mail server configuration used by Solar Trade Hub."
            icon={
              <Server
                size={18}
              />
            }
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <FormField
                label="SMTP Host"
              >
                <div className="relative">
                  <Server
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={
                      formData.smtpHost
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "smtpHost",
                        event.target.value
                      )
                    }
                    disabled={
                      disabled
                    }
                    placeholder="smtp.example.com"
                    className="sth-email-input pl-10"
                  />
                </div>
              </FormField>

              <FormField
                label="SMTP Port"
              >
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={
                    formData.smtpPort
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "smtpPort",
                      event.target.value
                    )
                  }
                  disabled={
                    disabled
                  }
                  placeholder="587"
                  className="sth-email-input"
                />
              </FormField>

              <FormField
                label="SMTP Username"
              >
                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={
                      formData.smtpUsername
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "smtpUsername",
                        event.target.value
                      )
                    }
                    disabled={
                      disabled
                    }
                    autoComplete="off"
                    className="sth-email-input pl-10"
                  />
                </div>
              </FormField>

              <FormField
                label="SMTP Password"
                helper={
                  smtpPasswordConfigured
                    ? "A password is already securely stored. Leave this blank to keep it, or enter a new password to replace it."
                    : "Enter the SMTP password. The stored password will never be returned to the frontend."
                }
              >
                <div className="relative">
                  <KeyRound
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      formData.smtpPassword
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "smtpPassword",
                        event.target.value
                      )
                    }
                    disabled={
                      disabled
                    }
                    autoComplete="new-password"
                    placeholder={
                      smtpPasswordConfigured
                        ? "Leave blank to keep saved password"
                        : "Enter SMTP password"
                    }
                    className="sth-email-input pl-10 pr-10"
                  />

                  <button
                    type="button"
                    disabled={
                      disabled
                    }
                    onClick={() =>
                      setShowPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff
                        size={17}
                      />
                    ) : (
                      <Eye
                        size={17}
                      />
                    )}
                  </button>
                </div>
              </FormField>

              <FormField
                label="Encryption"
              >
                <select
                  value={
                    formData.encryption
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "encryption",
                      event.target
                        .value as EmailEncryptionType
                    )
                  }
                  disabled={
                    disabled
                  }
                  className="sth-email-input"
                >
                  <option value="TLS">
                    TLS
                  </option>

                  <option value="SSL">
                    SSL
                  </option>

                  <option value="None">
                    None
                  </option>
                </select>
              </FormField>
            </div>
          </SettingsCard>

          {/* =================================================
              SENDER IDENTITY
          ================================================== */}

          <SettingsCard
            title="Sender Identity"
            description="Default sender details used for marketplace emails."
            icon={
              <ShieldCheck
                size={18}
              />
            }
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <FormField
                label="From Name"
              >
                <input
                  type="text"
                  value={
                    formData.fromName
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "fromName",
                      event.target.value
                    )
                  }
                  disabled={
                    disabled
                  }
                  className="sth-email-input"
                />
              </FormField>

              <FormField
                label="From Email"
              >
                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={
                      formData.fromEmail
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "fromEmail",
                        event.target.value
                      )
                    }
                    disabled={
                      disabled
                    }
                    className="sth-email-input pl-10"
                  />
                </div>
              </FormField>

              <FormField
                label="Reply-To Email"
              >
                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={
                      formData.replyToEmail
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "replyToEmail",
                        event.target.value
                      )
                    }
                    disabled={
                      disabled
                    }
                    className="sth-email-input pl-10"
                  />
                </div>
              </FormField>
            </div>
          </SettingsCard>

          {/* =================================================
              EMAIL NOTIFICATIONS
          ================================================== */}

          <SettingsCard
            title="Marketplace Email Notifications"
            description="Choose which Solar Trade Hub activities generate administrative emails."
            icon={
              <BellRing
                size={18}
              />
            }
          >
            <div className="space-y-4">
              <ToggleSetting
                title="Order Notifications"
                description="Send email notifications for new orders and important order updates."
                enabled={
                  formData.orderNotifications
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "orderNotifications",
                    !formData.orderNotifications
                  )
                }
              />

              <ToggleSetting
                title="Supplier Notifications"
                description="Send notifications for supplier registrations and verification activity."
                enabled={
                  formData.supplierNotifications
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "supplierNotifications",
                    !formData.supplierNotifications
                  )
                }
              />

              <ToggleSetting
                title="Installer Notifications"
                description="Send notifications for installer applications and verification updates."
                enabled={
                  formData.installerNotifications
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "installerNotifications",
                    !formData.installerNotifications
                  )
                }
              />

              <ToggleSetting
                title="Tender Notifications"
                description="Send notifications when new tenders are submitted or require moderation."
                enabled={
                  formData.tenderNotifications
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "tenderNotifications",
                    !formData.tenderNotifications
                  )
                }
              />

              <ToggleSetting
                title="User Notifications"
                description="Send administrative notifications for new users and important account events."
                enabled={
                  formData.userNotifications
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "userNotifications",
                    !formData.userNotifications
                  )
                }
              />

              <ToggleSetting
                title="Deal Notifications"
                description="Send notifications for new promotional deals and campaign activity."
                enabled={
                  formData.dealNotifications
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "dealNotifications",
                    !formData.dealNotifications
                  )
                }
              />
            </div>
          </SettingsCard>

          {/* =================================================
              TEST EMAIL
          ================================================== */}

          <SettingsCard
            title="Send Test Email"
            description="Verify the currently saved SMTP delivery settings."
            icon={
              <Send
                size={18}
              />
            }
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex-1">
                <FormField
                  label="Test Email Address"
                  helper="Test Email uses the SMTP settings currently saved on the backend. Save any SMTP changes before testing."
                >
                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="email"
                      value={
                        testEmail
                      }
                      onChange={(
                        event
                      ) => {
                        setTestEmail(
                          event.target.value
                        );

                        setTestSuccess(
                          false
                        );

                        setTestError(
                          null
                        );

                        setTestMessage(
                          ""
                        );
                      }}
                      disabled={
                        loading ||
                        testing
                      }
                      placeholder="admin@example.com"
                      className="sth-email-input pl-10"
                    />
                  </div>
                </FormField>
              </div>

              <button
                type="button"
                disabled={
                  loading ||
                  testing ||
                  saving
                }
                onClick={
                  handleTestEmail
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testing ? (
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Send
                    size={16}
                  />
                )}

                {testing
                  ? "Sending..."
                  : "Send Test"}
              </button>
            </div>

            {testError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <TriangleAlert
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {testError}
                </span>
              </div>
            )}

            {testSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
                <CheckCircle2
                  size={16}
                />

                {testMessage ||
                  "Test email sent successfully."}
              </div>
            )}
          </SettingsCard>

          {/* =================================================
              SECURITY NOTE
          ================================================== */}

          <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-orange-50/70 to-purple-50/70 p-5 dark:border-purple-500/10 dark:from-orange-500/5 dark:to-purple-500/5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm dark:bg-white/5 dark:text-purple-400">
                <Settings2
                  size={18}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  SMTP Credentials
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  SMTP passwords are
                  stored securely by the
                  backend and are never
                  returned through the
                  frontend API. Leaving
                  the password field
                  blank keeps the
                  currently saved
                  password unchanged.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            INPUT STYLES
        ==================================================== */}

        <style>
          {`
            .sth-email-input {
              height: 44px;
              width: 100%;
              border-radius: 0.5rem;
              border: 1px solid rgb(209 213 219);
              background: transparent;
              padding-left: 0.875rem;
              padding-right: 0.875rem;
              font-size: 0.875rem;
              color: rgb(31 41 55);
              outline: none;
              transition:
                border-color 150ms ease,
                box-shadow 150ms ease,
                opacity 150ms ease;
            }

            .sth-email-input:focus {
              border-color: rgb(147 51 234);
              box-shadow:
                0 0 0 1px rgb(147 51 234);
            }

            .sth-email-input:disabled {
              cursor: not-allowed;
              opacity: 0.6;
            }

            .dark .sth-email-input {
              border-color: rgb(55 65 81);
              background: rgb(17 24 39);
              color: rgba(255, 255, 255, 0.9);
            }
          `}
        </style>
      </>
    );
  };

/* =========================================================
   SETTINGS CARD
========================================================= */

const SettingsCard = ({
  title,
  description,
  icon,
  children,
}: {
  title:
    string;

  description:
    string;

  icon:
    React.ReactNode;

  children:
    React.ReactNode;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};

/* =========================================================
   FORM FIELD
========================================================= */

const FormField = ({
  label,
  helper,
  children,
}: {
  label:
    string;

  helper?:
    string;

  children:
    React.ReactNode;
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
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
   TOGGLE
========================================================= */

const ToggleSetting = ({
  title,
  description,
  enabled,
  onToggle,
  disabled = false,
}: {
  title:
    string;

  description:
    string;

  enabled:
    boolean;

  onToggle:
    () => void;

  disabled?:
    boolean;
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </p>

        <p className="mt-1 max-w-3xl text-xs leading-5 text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={
          onToggle
        }
        disabled={
          disabled
        }
        aria-pressed={
          enabled
        }
        className={`
          relative
          h-6
          w-11
          shrink-0
          rounded-full
          transition
          disabled:cursor-not-allowed
          disabled:opacity-60

          ${
            enabled
              ? "bg-gradient-to-r from-orange-500 to-purple-600"
              : "bg-gray-300 dark:bg-gray-700"
          }
        `}
      >
        <span
          className={`
            absolute
            top-0.5
            h-5
            w-5
            rounded-full
            bg-white
            shadow
            transition-all

            ${
              enabled
                ? "left-[22px]"
                : "left-0.5"
            }
          `}
        />
      </button>
    </div>
  );
};

export default EmailSettings;