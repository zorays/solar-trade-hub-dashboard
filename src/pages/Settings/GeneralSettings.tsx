import {
  type ReactNode,
  useEffect,
  useState,
} from "react";

import {
  Building2,
  CheckCircle2,
  Clock3,
  Globe2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Store,
  TriangleAlert,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  getGeneralSettings,
  getGeneralSettingsErrorMessage,
  updateGeneralSettings,
  type GeneralSettings as GeneralSettingsData,
  type UpdateGeneralSettingsPayload,
} from "../../services/settings/general/generalSettings.service";

/* =========================================================
   TYPES
========================================================= */

type GeneralSettingsForm =
  UpdateGeneralSettingsPayload;

/* =========================================================
   FALLBACK DATA

   Used only before / if server data is unavailable.

   Actual saved settings come from:

   GET /api/v1/settings/general
========================================================= */

const initialSettings: GeneralSettingsForm = {
  platformName:
    "Solar Trade Hub",

  tagline:
    "Pakistan's Solar Marketplace",

  supportEmail:
    "support@solartradehub.com",

  supportPhone:
    "+92",

  whatsappNumber:
    "+92",

  country:
    "Pakistan",

  city:
    "Lahore",

  address:
    "",

  currency:
    "PKR",

  timezone:
    "Asia/Karachi",

  language:
    "English",

  allowRegistration:
    true,

  maintenanceMode:
    false,
};

/* =========================================================
   CONVERT API SETTINGS TO FORM

   Removes backend metadata such as:

   _id
   settingsKey
   updatedBy
   createdAt
   updatedAt
========================================================= */

const mapSettingsToForm =
  (
    settings:
      GeneralSettingsData
  ): GeneralSettingsForm => {
    return {
      platformName:
        settings.platformName,

      tagline:
        settings.tagline,

      supportEmail:
        settings.supportEmail,

      supportPhone:
        settings.supportPhone,

      whatsappNumber:
        settings.whatsappNumber,

      country:
        settings.country,

      city:
        settings.city,

      address:
        settings.address,

      currency:
        settings.currency,

      timezone:
        settings.timezone,

      language:
        settings.language,

      allowRegistration:
        settings.allowRegistration,

      maintenanceMode:
        settings.maintenanceMode,
    };
  };

/* =========================================================
   SHARED INPUT STYLES
========================================================= */

const inputClass =
  "h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white dark:placeholder:text-gray-500";

const inputWithIconClass =
  "h-11 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white dark:placeholder:text-gray-500";

const selectClass =
  "h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white";

const selectWithIconClass =
  "h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white";

const textareaClass =
  "min-h-[100px] w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white dark:placeholder:text-gray-500";

/* =========================================================
   PAGE
========================================================= */

const GeneralSettings =
  () => {
    const [
      formData,
      setFormData,
    ] =
      useState<GeneralSettingsForm>(
        initialSettings
      );

    /* =======================================================
       LAST SAVED SERVER STATE

       Reset returns to this state rather than hard-coded
       defaults.
    ======================================================= */

    const [
      savedSettings,
      setSavedSettings,
    ] =
      useState<GeneralSettingsForm | null>(
        null
      );

    const [
      loading,
      setLoading,
    ] =
      useState(true);

    const [
      saving,
      setSaving,
    ] =
      useState(false);

    const [
      saved,
      setSaved,
    ] =
      useState(false);

    const [
      error,
      setError,
    ] =
      useState<string | null>(
        null
      );

    /* =======================================================
       LOAD GENERAL SETTINGS
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
                await getGeneralSettings();

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
            } catch (
              loadError
            ) {
              console.error(
                "Failed to load general settings:",
                loadError
              );

              if (
                active
              ) {
                setError(
                  getGeneralSettingsErrorMessage(
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
      K extends keyof GeneralSettingsForm,
    >(
      field: K,
      value:
        GeneralSettingsForm[K]
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
       /api/v1/settings/general
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

          const settings =
            await updateGeneralSettings(
              formData
            );

          const mapped =
            mapSettingsToForm(
              settings
            );

          /*
           * Use backend response as the authoritative state.
           */

          setFormData(
            mapped
          );

          setSavedSettings(
            mapped
          );

          setSaved(
            true
          );
        } catch (
          saveError
        ) {
          console.error(
            "Failed to save general settings:",
            saveError
          );

          setError(
            getGeneralSettingsErrorMessage(
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

       Reset means discard unsaved frontend changes and return
       to the last settings received from the backend.

       It does NOT overwrite database settings.
    ======================================================= */

    const handleReset =
      () => {
        setFormData(
          savedSettings ||
            initialSettings
        );

        setSaved(
          false
        );

        setError(
          null
        );
      };

    /* =======================================================
       PAGE
    ======================================================= */

    return (
      <>
        <PageMeta
          title="General Settings | Solar Trade Hub"
          description="Manage Solar Trade Hub general platform settings."
        />

        <PageBreadcrumb
          pageTitle="General Settings"
        />

        <div className="space-y-5">
          {/* =================================================
              HEADER
          ================================================== */}

          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-orange-500/5" />

            <div className="pointer-events-none absolute right-12 top-4 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <Settings
                    size={22}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                    System Settings
                  </p>

                  <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    General Settings
                  </h1>

                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Manage your platform
                    identity,
                    communication
                    details, location and
                    regional
                    configuration.
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
                    loading ||
                    saving
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <RefreshCw
                    size={15}
                  />

                  Reset
                </button>

                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    loading ||
                    saving
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={15}
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

          {/* =================================================
              ERROR MESSAGE
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
              SAVE MESSAGE
          ================================================== */}

          {saved && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
              <CheckCircle2
                size={17}
              />

              General settings saved
              successfully.
            </div>
          )}

          {/* =================================================
              LOADING MESSAGE
          ================================================== */}

          {loading && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
              <RefreshCw
                size={16}
                className="animate-spin"
              />

              Loading general
              settings...
            </div>
          )}

          {/* =================================================
              PLATFORM IDENTITY
          ================================================== */}

          <SettingsCard
            title="Platform Identity"
            description="Basic Solar Trade Hub branding and platform information."
            icon={
              <Store
                size={18}
              />
            }
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <FormField
                label="Platform Name"
              >
                <InputWithIcon
                  icon={
                    <Store
                      size={17}
                    />
                  }
                >
                  <input
                    type="text"
                    value={
                      formData.platformName
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "platformName",
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      loading ||
                      saving
                    }
                    className={
                      inputWithIconClass
                    }
                  />
                </InputWithIcon>
              </FormField>

              <FormField
                label="Tagline"
              >
                <input
                  type="text"
                  value={
                    formData.tagline
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "tagline",
                      event
                        .target
                        .value
                    )
                  }
                  disabled={
                    loading ||
                    saving
                  }
                  className={
                    inputClass
                  }
                />
              </FormField>
            </div>
          </SettingsCard>

          {/* =================================================
              CONTACT INFORMATION
          ================================================== */}

          <SettingsCard
            title="Contact Information"
            description="Public support and customer communication details."
            icon={
              <Phone
                size={18}
              />
            }
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                label="Support Email"
              >
                <InputWithIcon
                  icon={
                    <Mail
                      size={17}
                    />
                  }
                >
                  <input
                    type="email"
                    value={
                      formData.supportEmail
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "supportEmail",
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      loading ||
                      saving
                    }
                    className={
                      inputWithIconClass
                    }
                  />
                </InputWithIcon>
              </FormField>

              <FormField
                label="Support Phone"
              >
                <InputWithIcon
                  icon={
                    <Phone
                      size={17}
                    />
                  }
                >
                  <input
                    type="text"
                    value={
                      formData.supportPhone
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "supportPhone",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="+92 300 0000000"
                    disabled={
                      loading ||
                      saving
                    }
                    className={
                      inputWithIconClass
                    }
                  />
                </InputWithIcon>
              </FormField>

              <FormField
                label="WhatsApp Number"
              >
                <InputWithIcon
                  icon={
                    <Smartphone
                      size={17}
                    />
                  }
                >
                  <input
                    type="text"
                    value={
                      formData.whatsappNumber
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "whatsappNumber",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="+92 300 0000000"
                    disabled={
                      loading ||
                      saving
                    }
                    className={
                      inputWithIconClass
                    }
                  />
                </InputWithIcon>
              </FormField>
            </div>
          </SettingsCard>

          {/* =================================================
              BUSINESS LOCATION
          ================================================== */}

          <SettingsCard
            title="Business Location"
            description="Primary Solar Trade Hub operating location."
            icon={
              <MapPin
                size={18}
              />
            }
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <FormField
                label="Country"
              >
                <InputWithIcon
                  icon={
                    <Globe2
                      size={17}
                    />
                  }
                >
                  <input
                    type="text"
                    value={
                      formData.country
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "country",
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      loading ||
                      saving
                    }
                    className={
                      inputWithIconClass
                    }
                  />
                </InputWithIcon>
              </FormField>

              <FormField
                label="City"
              >
                <InputWithIcon
                  icon={
                    <Building2
                      size={17}
                    />
                  }
                >
                  <input
                    type="text"
                    value={
                      formData.city
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "city",
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      loading ||
                      saving
                    }
                    className={
                      inputWithIconClass
                    }
                  />
                </InputWithIcon>
              </FormField>

              <div className="lg:col-span-2">
                <FormField
                  label="Business Address"
                  helper="Optional public business or office address."
                >
                  <textarea
                    rows={3}
                    value={
                      formData.address
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "address",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Enter Solar Trade Hub business address..."
                    disabled={
                      loading ||
                      saving
                    }
                    className={
                      textareaClass
                    }
                  />
                </FormField>
              </div>
            </div>
          </SettingsCard>

          {/* =================================================
              REGIONAL SETTINGS
          ================================================== */}

          <SettingsCard
            title="Regional Settings"
            description="Default currency, timezone and language used across the platform."
            icon={
              <Globe2
                size={18}
              />
            }
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                label="Currency"
              >
                <select
                  value={
                    formData.currency
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "currency",
                      event
                        .target
                        .value as GeneralSettingsForm["currency"]
                    )
                  }
                  disabled={
                    loading ||
                    saving
                  }
                  className={
                    selectClass
                  }
                >
                  <option value="PKR">
                    PKR — Pakistani
                    Rupee
                  </option>

                  <option value="USD">
                    USD — US Dollar
                  </option>
                </select>
              </FormField>

              <FormField
                label="Timezone"
              >
                <InputWithIcon
                  icon={
                    <Clock3
                      size={17}
                    />
                  }
                >
                  <select
                    value={
                      formData.timezone
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "timezone",
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      loading ||
                      saving
                    }
                    className={
                      selectWithIconClass
                    }
                  >
                    <option value="Asia/Karachi">
                      Asia/Karachi
                    </option>
                  </select>
                </InputWithIcon>
              </FormField>

              <FormField
                label="Default Language"
              >
                <select
                  value={
                    formData.language
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "language",
                      event
                        .target
                        .value as GeneralSettingsForm["language"]
                    )
                  }
                  disabled={
                    loading ||
                    saving
                  }
                  className={
                    selectClass
                  }
                >
                  <option value="English">
                    English
                  </option>

                  <option value="Urdu">
                    Urdu
                  </option>
                </select>
              </FormField>
            </div>
          </SettingsCard>

          {/* =================================================
              SYSTEM CONTROLS
          ================================================== */}

          <SettingsCard
            title="System Controls"
            description="Control platform registration and operational availability."
            icon={
              <ShieldCheck
                size={18}
              />
            }
          >
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <ToggleSetting
                title="User Registration"
                description="Allow new customers and marketplace users to create accounts."
                enabled={
                  formData.allowRegistration
                }
                disabled={
                  loading ||
                  saving
                }
                onToggle={() =>
                  updateField(
                    "allowRegistration",
                    !formData.allowRegistration
                  )
                }
              />

              <ToggleSetting
                title="Maintenance Mode"
                description="Temporarily disable the public storefront during maintenance."
                enabled={
                  formData.maintenanceMode
                }
                disabled={
                  loading ||
                  saving
                }
                onToggle={() =>
                  updateField(
                    "maintenanceMode",
                    !formData.maintenanceMode
                  )
                }
                warning
              />
            </div>
          </SettingsCard>
        </div>
      </>
    );
  };

/* =========================================================
   INPUT WITH ICON
========================================================= */

const InputWithIcon = ({
  icon,
  children,
}: {
  icon:
    ReactNode;

  children:
    ReactNode;
}) => {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        {icon}
      </div>

      {children}
    </div>
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
    ReactNode;

  children:
    ReactNode;
}) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
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
    ReactNode;
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {children}

      {helper && (
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
};

/* =========================================================
   TOGGLE SETTING
========================================================= */

const ToggleSetting = ({
  title,
  description,
  enabled,
  onToggle,
  disabled = false,
  warning = false,
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

  warning?:
    boolean;
}) => {
  return (
    <div className="flex min-h-[90px] items-center justify-between gap-5 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-950/20">
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${
            warning &&
            enabled
              ? "text-orange-600 dark:text-orange-400"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
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
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
          enabled
            ? warning
              ? "bg-orange-500"
              : "bg-gradient-to-r from-orange-500 to-purple-600"
            : "bg-gray-300 dark:bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            enabled
              ? "left-[22px]"
              : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
};

export default GeneralSettings;