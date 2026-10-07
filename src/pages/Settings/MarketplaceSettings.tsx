import {
  useEffect,
  useState,
} from "react";

import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileCheck2,
  Handshake,
  PackageCheck,
  Percent,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Store,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  getMarketplaceSettings,
  getMarketplaceSettingsErrorMessage,
  updateMarketplaceSettings,
  type MarketplaceSettings as MarketplaceSettingsData,
  type UpdateMarketplaceSettingsPayload,
} from "../../services/settings/marketplace/marketplaceSettings.service";

/* =========================================================
   TYPES
========================================================= */

type MarketplaceSettingsForm = {
  requireProductApproval: boolean;

  requireSupplierVerification: boolean;

  requireInstallerVerification: boolean;

  requireTenderApproval: boolean;

  requireDealApproval: boolean;

  autoPublishApprovedProducts: boolean;

  allowSupplierProducts: boolean;

  allowInstallerApplications: boolean;

  allowTenderSubmissions: boolean;

  allowMarketplaceDeals: boolean;

  allowOrderCancellation: boolean;

  cancellationWindowHours: string;

  marketplaceCommissionPercent: string;

  minimumOrderAmount: string;

  supplierVerificationLabel: string;

  installerVerificationLabel: string;
};

/* =========================================================
   FALLBACK SETTINGS

   Used before server settings are loaded.

   Actual persisted settings come from:

   GET
   /api/v1/settings/marketplace
========================================================= */

const initialSettings: MarketplaceSettingsForm = {
  requireProductApproval:
    true,

  requireSupplierVerification:
    true,

  requireInstallerVerification:
    true,

  requireTenderApproval:
    true,

  requireDealApproval:
    true,

  autoPublishApprovedProducts:
    true,

  allowSupplierProducts:
    true,

  allowInstallerApplications:
    true,

  allowTenderSubmissions:
    true,

  allowMarketplaceDeals:
    true,

  allowOrderCancellation:
    true,

  cancellationWindowHours:
    "24",

  marketplaceCommissionPercent:
    "0",

  minimumOrderAmount:
    "0",

  supplierVerificationLabel:
    "Verified Supplier",

  installerVerificationLabel:
    "Verified Installer",
};

/* =========================================================
   MAP API DATA TO FORM

   Backend stores numeric settings as numbers.

   HTML number inputs use strings while editing.
========================================================= */

const mapSettingsToForm =
  (
    settings:
      MarketplaceSettingsData
  ): MarketplaceSettingsForm => {
    return {
      requireProductApproval:
        settings.requireProductApproval,

      requireSupplierVerification:
        settings.requireSupplierVerification,

      requireInstallerVerification:
        settings.requireInstallerVerification,

      requireTenderApproval:
        settings.requireTenderApproval,

      requireDealApproval:
        settings.requireDealApproval,

      autoPublishApprovedProducts:
        settings.autoPublishApprovedProducts,

      allowSupplierProducts:
        settings.allowSupplierProducts,

      allowInstallerApplications:
        settings.allowInstallerApplications,

      allowTenderSubmissions:
        settings.allowTenderSubmissions,

      allowMarketplaceDeals:
        settings.allowMarketplaceDeals,

      allowOrderCancellation:
        settings.allowOrderCancellation,

      cancellationWindowHours:
        String(
          settings.cancellationWindowHours ??
            0
        ),

      marketplaceCommissionPercent:
        String(
          settings.marketplaceCommissionPercent ??
            0
        ),

      minimumOrderAmount:
        String(
          settings.minimumOrderAmount ??
            0
        ),

      supplierVerificationLabel:
        settings.supplierVerificationLabel,

      installerVerificationLabel:
        settings.installerVerificationLabel,
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
    if (
      value.trim() ===
      ""
    ) {
      return 0;
    }

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
      MarketplaceSettingsForm
  ): UpdateMarketplaceSettingsPayload => {
    return {
      requireProductApproval:
        form.requireProductApproval,

      requireSupplierVerification:
        form.requireSupplierVerification,

      requireInstallerVerification:
        form.requireInstallerVerification,

      requireTenderApproval:
        form.requireTenderApproval,

      requireDealApproval:
        form.requireDealApproval,

      autoPublishApprovedProducts:
        form.autoPublishApprovedProducts,

      allowSupplierProducts:
        form.allowSupplierProducts,

      allowInstallerApplications:
        form.allowInstallerApplications,

      allowTenderSubmissions:
        form.allowTenderSubmissions,

      allowMarketplaceDeals:
        form.allowMarketplaceDeals,

      allowOrderCancellation:
        form.allowOrderCancellation,

      cancellationWindowHours:
        toNumber(
          form.cancellationWindowHours
        ),

      marketplaceCommissionPercent:
        toNumber(
          form.marketplaceCommissionPercent
        ),

      minimumOrderAmount:
        toNumber(
          form.minimumOrderAmount
        ),

      supplierVerificationLabel:
        form.supplierVerificationLabel.trim(),

      installerVerificationLabel:
        form.installerVerificationLabel.trim(),
    };
  };

/* =========================================================
   PAGE
========================================================= */

const MarketplaceSettings =
  () => {
    const [
      formData,
      setFormData,
    ] =
      useState<MarketplaceSettingsForm>(
        initialSettings
      );

    /* =======================================================
       LAST SAVED SERVER STATE

       Reset restores this state.

       It does not write anything to the backend.
    ======================================================= */

    const [
      savedSettings,
      setSavedSettings,
    ] =
      useState<MarketplaceSettingsForm | null>(
        null
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

    /* =======================================================
       LOAD MARKETPLACE SETTINGS
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
                await getMarketplaceSettings();

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
                "Failed to load marketplace settings:",
                loadError
              );

              if (
                active
              ) {
                setError(
                  getMarketplaceSettingsErrorMessage(
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
      K extends keyof MarketplaceSettingsForm,
    >(
      field: K,
      value:
        MarketplaceSettingsForm[K]
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
       SAVE SETTINGS

       PUT
       /api/v1/settings/marketplace
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

          const payload =
            mapFormToPayload(
              formData
            );

          const settings =
            await updateMarketplaceSettings(
              payload
            );

          const mapped =
            mapSettingsToForm(
              settings
            );

          /*
           * Server response becomes authoritative state.
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
            "Failed to save marketplace settings:",
            saveError
          );

          setError(
            getMarketplaceSettingsErrorMessage(
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

       Discard unsaved frontend changes.

       Restore latest settings loaded/saved from backend.
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
       DISABLED STATE
    ======================================================= */

    const disabled =
      loading ||
      saving;

    return (
      <>
        <PageMeta
          title="Marketplace Settings | Solar Trade Hub"
          description="Manage Solar Trade Hub marketplace settings."
        />

        <PageBreadcrumb
          pageTitle="Marketplace Settings"
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
                    <Settings2
                      size={23}
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                      System Settings
                    </p>

                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                      Marketplace Settings
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                      Configure approval,
                      verification,
                      marketplace
                      participation,
                      order and commercial
                      rules for Solar Trade
                      Hub.
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

              Marketplace settings saved successfully.
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

              Loading marketplace settings...
            </div>
          )}

          {/* =================================================
              PRODUCT CONTROLS
          ================================================== */}

          <SettingsCard
            title="Product Controls"
            description="Control supplier product publishing and marketplace product approvals."
            icon={
              <PackageCheck
                size={18}
              />
            }
          >
            <div className="space-y-4">
              <ToggleSetting
                title="Allow Supplier Products"
                description="Allow approved suppliers to submit products to the Solar Trade Hub marketplace."
                enabled={
                  formData.allowSupplierProducts
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "allowSupplierProducts",
                    !formData.allowSupplierProducts
                  )
                }
              />

              <ToggleSetting
                title="Require Product Approval"
                description="Products submitted by suppliers must be reviewed before appearing on the storefront."
                enabled={
                  formData.requireProductApproval
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "requireProductApproval",
                    !formData.requireProductApproval
                  )
                }
              />

              <ToggleSetting
                title="Auto Publish Approved Products"
                description="Automatically publish a product once an administrator approves it."
                enabled={
                  formData.autoPublishApprovedProducts
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "autoPublishApprovedProducts",
                    !formData.autoPublishApprovedProducts
                  )
                }
              />
            </div>
          </SettingsCard>

          {/* =================================================
              SUPPLIERS
          ================================================== */}

          <SettingsCard
            title="Supplier Controls"
            description="Control supplier verification and marketplace trust indicators."
            icon={
              <Building2
                size={18}
              />
            }
          >
            <div className="space-y-5">
              <ToggleSetting
                title="Require Supplier Verification"
                description="Supplier accounts must be verified before receiving verified marketplace status."
                enabled={
                  formData.requireSupplierVerification
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "requireSupplierVerification",
                    !formData.requireSupplierVerification
                  )
                }
              />

              <FormField
                label="Supplier Verification Label"
              >
                <div className="relative">
                  <BadgeCheck
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={
                      formData.supplierVerificationLabel
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "supplierVerificationLabel",
                        event.target.value
                      )
                    }
                    disabled={
                      disabled
                    }
                    className="sth-marketplace-input pl-10"
                  />
                </div>
              </FormField>
            </div>
          </SettingsCard>

          {/* =================================================
              INSTALLERS
          ================================================== */}

          <SettingsCard
            title="Installer Controls"
            description="Configure installer applications and verification."
            icon={
              <Wrench
                size={18}
              />
            }
          >
            <div className="space-y-5">
              <ToggleSetting
                title="Allow Installer Applications"
                description="Allow installation companies and solar professionals to apply to Solar Trade Hub."
                enabled={
                  formData.allowInstallerApplications
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "allowInstallerApplications",
                    !formData.allowInstallerApplications
                  )
                }
              />

              <ToggleSetting
                title="Require Installer Verification"
                description="Installer profiles require administrative verification before receiving verified status."
                enabled={
                  formData.requireInstallerVerification
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "requireInstallerVerification",
                    !formData.requireInstallerVerification
                  )
                }
              />

              <FormField
                label="Installer Verification Label"
              >
                <div className="relative">
                  <ShieldCheck
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={
                      formData.installerVerificationLabel
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "installerVerificationLabel",
                        event.target.value
                      )
                    }
                    disabled={
                      disabled
                    }
                    className="sth-marketplace-input pl-10"
                  />
                </div>
              </FormField>
            </div>
          </SettingsCard>

          {/* =================================================
              TENDERS
          ================================================== */}

          <SettingsCard
            title="Tender Controls"
            description="Configure procurement and tender submissions on Solar Trade Hub."
            icon={
              <FileCheck2
                size={18}
              />
            }
          >
            <div className="space-y-4">
              <ToggleSetting
                title="Allow Tender Submissions"
                description="Allow marketplace participants to submit solar procurement and tender opportunities."
                enabled={
                  formData.allowTenderSubmissions
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "allowTenderSubmissions",
                    !formData.allowTenderSubmissions
                  )
                }
              />

              <ToggleSetting
                title="Require Tender Approval"
                description="New tenders require administrative review before being published."
                enabled={
                  formData.requireTenderApproval
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "requireTenderApproval",
                    !formData.requireTenderApproval
                  )
                }
              />
            </div>
          </SettingsCard>

          {/* =================================================
              DEALS
          ================================================== */}

          <SettingsCard
            title="Deals & Promotions"
            description="Control marketplace deals and promotional campaigns."
            icon={
              <Handshake
                size={18}
              />
            }
          >
            <div className="space-y-4">
              <ToggleSetting
                title="Allow Marketplace Deals"
                description="Allow promotional marketplace deals to be created and displayed."
                enabled={
                  formData.allowMarketplaceDeals
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "allowMarketplaceDeals",
                    !formData.allowMarketplaceDeals
                  )
                }
              />

              <ToggleSetting
                title="Require Deal Approval"
                description="Promotional deals require administrative review before becoming active."
                enabled={
                  formData.requireDealApproval
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "requireDealApproval",
                    !formData.requireDealApproval
                  )
                }
              />
            </div>
          </SettingsCard>

          {/* =================================================
              ORDER CONTROLS
          ================================================== */}

          <SettingsCard
            title="Order Controls"
            description="Configure marketplace order and cancellation rules."
            icon={
              <ShoppingCart
                size={18}
              />
            }
          >
            <div className="space-y-5">
              <ToggleSetting
                title="Allow Order Cancellation"
                description="Allow marketplace orders to be cancelled within the configured cancellation window."
                enabled={
                  formData.allowOrderCancellation
                }
                disabled={
                  disabled
                }
                onToggle={() =>
                  updateField(
                    "allowOrderCancellation",
                    !formData.allowOrderCancellation
                  )
                }
              />

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <FormField
                  label="Cancellation Window"
                  helper="Hours after order placement"
                >
                  <input
                    type="number"
                    min="0"
                    value={
                      formData.cancellationWindowHours
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "cancellationWindowHours",
                        event.target.value
                      )
                    }
                    disabled={
                      disabled
                    }
                    className="sth-marketplace-input"
                  />
                </FormField>

                <FormField
                  label="Minimum Order Amount"
                  helper="PKR — use 0 for no minimum"
                >
                  <input
                    type="number"
                    min="0"
                    value={
                      formData.minimumOrderAmount
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "minimumOrderAmount",
                        event.target.value
                      )
                    }
                    disabled={
                      disabled
                    }
                    className="sth-marketplace-input"
                  />
                </FormField>
              </div>
            </div>
          </SettingsCard>

          {/* =================================================
              COMMERCIAL SETTINGS
          ================================================== */}

          <SettingsCard
            title="Marketplace Commercial Settings"
            description="Configure platform-level marketplace commercial rules."
            icon={
              <Percent
                size={18}
              />
            }
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <FormField
                label="Marketplace Commission"
                helper="Percentage charged on marketplace transactions. Keep 0 if commission is not currently enabled."
              >
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={
                      formData.marketplaceCommissionPercent
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "marketplaceCommissionPercent",
                        event.target.value
                      )
                    }
                    disabled={
                      disabled
                    }
                    className="sth-marketplace-input pr-10"
                  />

                  <Percent
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </FormField>

              <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-orange-50/60 to-purple-50/70 p-4 dark:border-purple-500/10 dark:from-orange-500/5 dark:to-purple-500/5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-purple-600 shadow-sm dark:bg-white/5 dark:text-purple-400">
                    <Store
                      size={16}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Marketplace Revenue Model
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                      This setting is kept
                      configurable because
                      Solar Trade Hub can
                      later support
                      commission, listing
                      fees, subscriptions
                      or other marketplace
                      revenue models.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SettingsCard>
        </div>

        {/* ===================================================
            INPUT STYLES
        ==================================================== */}

        <style>
          {`
            .sth-marketplace-input {
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

            .sth-marketplace-input:focus {
              border-color: rgb(147 51 234);
              box-shadow:
                0 0 0 1px rgb(147 51 234);
            }

            .sth-marketplace-input:disabled {
              cursor: not-allowed;
              opacity: 0.6;
            }

            .dark .sth-marketplace-input {
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
   TOGGLE SETTING
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

export default MarketplaceSettings;