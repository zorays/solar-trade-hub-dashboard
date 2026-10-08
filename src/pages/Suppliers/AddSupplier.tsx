import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  Building2,
  ChevronDown,
  ImageIcon,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import Button from "../../components/ui/button/Button";

import {
  createSupplier,
  getSupplierErrorMessage,
  updateSupplierStatus,
  updateSupplierVerification,
  type CreateSupplierPayload,
  type SupplierBusinessType,
  type SupplierStatus,
  type SupplierVerificationStatus,
} from "../../services/supplier/supplier.service";

/* =========================================================
   TYPES
========================================================= */

interface SupplierForm {
  companyName: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;

  businessType:
    SupplierBusinessType;

  ntn: string;
  strn: string;
  companyRegistrationNo: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;

  status:
    SupplierStatus;

  verificationStatus:
    SupplierVerificationStatus;

  verificationNotes: string;

  description: string;

  isFeatured: boolean;

  sortOrder: string;

  logo: string;

  bannerImage: string;
}

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM: SupplierForm = {
  companyName: "",
  contactPerson: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",

  businessType:
    "distributor",

  ntn: "",
  strn: "",
  companyRegistrationNo:
    "",

  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  country:
    "Pakistan",
  postalCode: "",

  status:
    "active",

  verificationStatus:
    "pending",

  verificationNotes:
    "",

  description: "",

  isFeatured:
    false,

  sortOrder:
    "0",

  logo: "",

  bannerImage: "",
};

/* =========================================================
   BUSINESS TYPES
========================================================= */

const BUSINESS_TYPE_OPTIONS: Array<{
  value:
    SupplierBusinessType;
  label: string;
}> = [
  {
    value:
      "manufacturer",
    label:
      "Manufacturer",
  },
  {
    value:
      "distributor",
    label:
      "Distributor",
  },
  {
    value:
      "importer",
    label:
      "Importer",
  },
  {
    value:
      "wholesaler",
    label:
      "Wholesaler",
  },
  {
    value:
      "retailer",
    label:
      "Retailer",
  },
  {
    value:
      "installer",
    label:
      "Installer",
  },
  {
    value:
      "service_provider",
    label:
      "Service Provider",
  },
  {
    value:
      "other",
    label:
      "Other",
  },
];

/* =========================================================
   STATUS
========================================================= */

const STATUS_OPTIONS: Array<{
  value:
    SupplierStatus;
  label: string;
}> = [
  {
    value:
      "active",
    label:
      "Active",
  },
  {
    value:
      "inactive",
    label:
      "Inactive",
  },
  {
    value:
      "suspended",
    label:
      "Suspended",
  },
];

/* =========================================================
   VERIFICATION
========================================================= */

const VERIFICATION_OPTIONS: Array<{
  value:
    SupplierVerificationStatus;
  label: string;
}> = [
  {
    value:
      "pending",
    label:
      "Pending",
  },
  {
    value:
      "under_review",
    label:
      "Under Review",
  },
  {
    value:
      "verified",
    label:
      "Verified",
  },
  {
    value:
      "rejected",
    label:
      "Rejected",
  },
];

/* =========================================================
   URL VALIDATION
========================================================= */

const isValidHttpUrl = (
  value: string
) => {
  if (
    !value.trim()
  ) {
    return true;
  }

  try {
    const url =
      new URL(
        value.trim()
      );

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
};

/* =========================================================
   ADD SUPPLIER
========================================================= */

export default function AddSupplier() {
  const navigate =
    useNavigate();

  const [
    form,
    setForm,
  ] =
    useState<SupplierForm>(
      INITIAL_FORM
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  /* =======================================================
     CAN SUBMIT
  ======================================================= */

  const canSubmit =
    useMemo(
      () =>
        Boolean(
          form.companyName.trim()
        ),
      [
        form.companyName,
      ]
    );

  /* =======================================================
     FIELD UPDATE
  ======================================================= */

  const updateField = <
    K extends keyof SupplierForm,
  >(
    key: K,
    value:
      SupplierForm[K]
  ) => {
    setForm(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetForm =
    () => {
      if (
        submitting
      ) {
        return;
      }

      setForm({
        ...INITIAL_FORM,
      });

      toast.info(
        "Supplier form reset."
      );
    };

  /* =======================================================
     VALIDATE
  ======================================================= */

  const validateForm =
    () => {
      const companyName =
        form.companyName.trim();

      if (
        !companyName
      ) {
        toast.error(
          "Company name is required."
        );

        return false;
      }

      if (
        companyName.length <
          2 ||
        companyName.length >
          220
      ) {
        toast.error(
          "Company name must contain between 2 and 220 characters."
        );

        return false;
      }

      if (
        form.contactPerson
          .trim()
          .length >
        160
      ) {
        toast.error(
          "Contact person cannot exceed 160 characters."
        );

        return false;
      }

      if (
        form.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email.trim()
        )
      ) {
        toast.error(
          "Please enter a valid email address."
        );

        return false;
      }

      if (
        form.email
          .trim()
          .length >
        254
      ) {
        toast.error(
          "Email cannot exceed 254 characters."
        );

        return false;
      }

      if (
        form.phone
          .trim()
          .length >
        50
      ) {
        toast.error(
          "Phone number cannot exceed 50 characters."
        );

        return false;
      }

      if (
        form.whatsapp
          .trim()
          .length >
        50
      ) {
        toast.error(
          "WhatsApp number cannot exceed 50 characters."
        );

        return false;
      }

      if (
        !isValidHttpUrl(
          form.website
        )
      ) {
        toast.error(
          "Website must be a valid http or https URL."
        );

        return false;
      }

      if (
        !isValidHttpUrl(
          form.logo
        )
      ) {
        toast.error(
          "Logo must be a valid http or https URL."
        );

        return false;
      }

      if (
        !isValidHttpUrl(
          form.bannerImage
        )
      ) {
        toast.error(
          "Banner image must be a valid http or https URL."
        );

        return false;
      }

      if (
        form.ntn
          .trim()
          .length >
        50
      ) {
        toast.error(
          "NTN cannot exceed 50 characters."
        );

        return false;
      }

      if (
        form.strn
          .trim()
          .length >
        50
      ) {
        toast.error(
          "STRN cannot exceed 50 characters."
        );

        return false;
      }

      if (
        form.companyRegistrationNo
          .trim()
          .length >
        100
      ) {
        toast.error(
          "Company registration number cannot exceed 100 characters."
        );

        return false;
      }

      if (
        form.verificationNotes
          .trim()
          .length >
        2000
      ) {
        toast.error(
          "Verification notes cannot exceed 2000 characters."
        );

        return false;
      }

      if (
        form.description
          .trim()
          .length >
        5000
      ) {
        toast.error(
          "Supplier description cannot exceed 5000 characters."
        );

        return false;
      }

      const sortOrder =
        Number(
          form.sortOrder ||
            0
        );

      if (
        !Number.isInteger(
          sortOrder
        ) ||
        sortOrder <
          0
      ) {
        toast.error(
          "Sort order must be a non-negative whole number."
        );

        return false;
      }

      return true;
    };

  /* =======================================================
     BUILD PAYLOAD
  ======================================================= */

  const buildPayload =
    (): CreateSupplierPayload => ({
      companyName:
        form.companyName.trim(),

      contactPerson:
        form.contactPerson.trim(),

      phone:
        form.phone.trim(),

      whatsapp:
        form.whatsapp.trim(),

      email:
        form.email
          .trim()
          .toLowerCase(),

      website:
        form.website.trim(),

      businessType:
        form.businessType,

      ntn:
        form.ntn.trim(),

      strn:
        form.strn.trim(),

      companyRegistrationNo:
        form.companyRegistrationNo.trim(),

      address: {
        line1:
          form.addressLine1.trim(),

        line2:
          form.addressLine2.trim(),

        city:
          form.city.trim(),

        province:
          form.province.trim(),

        country:
          form.country.trim() ||
          "Pakistan",

        postalCode:
          form.postalCode.trim(),
      },

      logo:
        form.logo.trim(),

      bannerImage:
        form.bannerImage.trim(),

      description:
        form.description.trim(),

      isFeatured:
        form.isFeatured,

      sortOrder:
        Number(
          form.sortOrder ||
            0
        ),
    });

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        submitting
      ) {
        return;
      }

      if (
        !validateForm()
      ) {
        return;
      }

      try {
        setSubmitting(
          true
        );

        let supplier =
          await createSupplier(
            buildPayload()
          );

        /*
         * Supplier profile creation is intentionally separate
         * from workflow state. The backend rejects status and
         * verification fields on generic create/update routes.
         */
        try {
          if (
            form.status !==
            supplier.status
          ) {
            supplier =
              await updateSupplierStatus(
                supplier.supplierId,
                form.status
              );
          }

          if (
            form.verificationStatus !==
              supplier.verificationStatus ||
            form.verificationNotes.trim() !==
              (supplier.verificationNotes || "").trim()
          ) {
            supplier =
              await updateSupplierVerification(
                supplier.supplierId,
                {
                  verificationStatus:
                    form.verificationStatus,
                  verificationNotes:
                    form.verificationNotes.trim(),
                }
              );
          }
        } catch (workflowError) {
          toast.warning(
            "Supplier created, but workflow state needs review.",
            {
              description:
                getSupplierErrorMessage(
                  workflowError,
                  "Open the supplier and update status / verification manually."
                ),
            }
          );

          window.setTimeout(
            () => {
              navigate(
                `/suppliers/${encodeURIComponent(
                  supplier.supplierId
                )}`
              );
            },
            800
          );

          return;
        }

        toast.success(
          "Supplier added successfully.",
          {
            description:
              `${supplier.supplierId} — ${supplier.companyName}`,
          }
        );

        window.setTimeout(
          () => {
            navigate(
              `/suppliers/${encodeURIComponent(
                supplier.supplierId
              )}`
            );
          },
          500
        );
      } catch (
        error
      ) {
        toast.error(
          "Unable to add supplier",
          {
            description:
              getSupplierErrorMessage(
                error,
                "Unable to create supplier."
              ),
          }
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Add Supplier | Solar Trade Hub"
        description="Add a supplier to Solar Trade Hub."
      />

      <PageBreadcrumb
        pageTitle="Add Supplier"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-4"
      >
        {/* HEADER */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Supplier
            </h1>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Create a supplier business profile for Solar Trade Hub.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/suppliers"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                !canSubmit ||
                submitting
              }
              className="inline-flex h-10 min-w-[145px] items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-5 text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={16}
                />
              )}

              {submitting
                ? "Saving..."
                : "Save Supplier"}
            </button>
          </div>
        </div>

        {/* PROFILE */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Supplier Profile"
            description="Supplier identity and administrative configuration."
          />

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Supplier ID"
              badge="AUTO"
            >
              <input
                value="Generated automatically after save"
                readOnly
                tabIndex={-1}
                className="supplier-input cursor-not-allowed bg-gray-50 font-mono text-gray-500 dark:bg-gray-900 dark:text-gray-400"
              />

              <p className="mt-1.5 text-[10px] text-gray-400">
                Backend generates IDs such as STH-S-0001.
              </p>
            </Field>

            <Field
              label="Company Name"
              required
            >
              <input
                value={
                  form.companyName
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "companyName",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  220
                }
                placeholder="Legal / business name"
                className="supplier-input"
              />
            </Field>

            <Field label="Business Type">
              <SelectField
                value={
                  form.businessType
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "businessType",
                    value as SupplierBusinessType
                  )
                }
                options={
                  BUSINESS_TYPE_OPTIONS
                }
                disabled={
                  submitting
                }
              />
            </Field>

            <Field label="Website">
              <input
                type="url"
                value={
                  form.website
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "website",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  500
                }
                placeholder="https://example.com"
                className="supplier-input"
              />
            </Field>

            <Field label="Administrative Status">
              <SelectField
                value={
                  form.status
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "status",
                    value as SupplierStatus
                  )
                }
                options={
                  STATUS_OPTIONS
                }
                disabled={
                  submitting
                }
              />

              <p className="mt-1.5 text-[10px] leading-4 text-gray-400">
                Active means administratively enabled. Marketplace eligibility is resolved separately.
              </p>
            </Field>

            <Field label="Marketplace Display">
              <ToggleRow
                label="Featured Supplier"
                description="Marks the supplier as featured where marketplace eligibility allows."
                checked={
                  form.isFeatured
                }
                onChange={() =>
                  updateField(
                    "isFeatured",
                    !form.isFeatured
                  )
                }
                disabled={
                  submitting
                }
              />
            </Field>

            <Field label="Sort Order">
              <input
                type="number"
                min="0"
                step="1"
                value={
                  form.sortOrder
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "sortOrder",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                className="supplier-input"
              />
            </Field>
          </div>
        </section>

        {/* MEDIA */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Supplier Media"
            description="Hosted logo and banner image URLs."
          />

          <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
            <MediaUrlField
              label="Logo URL"
              value={
                form.logo
              }
              onChange={(
                value
              ) =>
                updateField(
                  "logo",
                  value
                )
              }
              placeholder="https://example.com/logo.png"
              disabled={
                submitting
              }
              previewAlt="Supplier logo"
            />

            <MediaUrlField
              label="Banner Image URL"
              value={
                form.bannerImage
              }
              onChange={(
                value
              ) =>
                updateField(
                  "bannerImage",
                  value
                )
              }
              placeholder="https://example.com/banner.jpg"
              disabled={
                submitting
              }
              previewAlt="Supplier banner"
              banner
            />
          </div>

          <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <ImageIcon
                size={17}
                className="mt-0.5 shrink-0 text-gray-400"
              />

              <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                Supplier backend currently stores logo and banner as URL fields.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Contact Information"
            description="Supplier business contact details."
          />

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Contact Person">
              <input
                value={
                  form.contactPerson
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "contactPerson",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  160
                }
                placeholder="e.g. Ali Raza"
                className="supplier-input"
              />
            </Field>

            <Field label="Phone Number">
              <input
                type="tel"
                value={
                  form.phone
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  50
                }
                placeholder="03XX-XXXXXXX"
                className="supplier-input"
              />
            </Field>

            <Field label="WhatsApp">
              <input
                type="tel"
                value={
                  form.whatsapp
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "whatsapp",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  50
                }
                placeholder="03XX-XXXXXXX"
                className="supplier-input"
              />
            </Field>

            <Field label="Email Address">
              <input
                type="email"
                value={
                  form.email
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  254
                }
                placeholder="supplier@example.com"
                className="supplier-input"
              />
            </Field>
          </div>
        </section>

        {/* REGISTRATION */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Business Registration"
            description="Tax and company registration information."
          />

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
            <Field label="NTN">
              <input
                value={
                  form.ntn
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "ntn",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  50
                }
                placeholder="National Tax Number"
                className="supplier-input"
              />
            </Field>

            <Field label="STRN">
              <input
                value={
                  form.strn
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "strn",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  50
                }
                placeholder="Sales Tax Registration Number"
                className="supplier-input"
              />
            </Field>

            <Field label="Company Registration No.">
              <input
                value={
                  form.companyRegistrationNo
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "companyRegistrationNo",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  100
                }
                placeholder="Registration number"
                className="supplier-input"
              />
            </Field>
          </div>
        </section>

        {/* ADDRESS */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Business Address"
            description="Supplier registered or operating address."
          />

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-3">
              <Field label="Address Line 1">
                <input
                  value={
                    form.addressLine1
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "addressLine1",
                      event.target.value
                    )
                  }
                  disabled={
                    submitting
                  }
                  maxLength={
                    250
                  }
                  placeholder="Office / warehouse address"
                  className="supplier-input"
                />
              </Field>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <Field label="Address Line 2">
                <input
                  value={
                    form.addressLine2
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "addressLine2",
                      event.target.value
                    )
                  }
                  disabled={
                    submitting
                  }
                  maxLength={
                    250
                  }
                  placeholder="Additional address information"
                  className="supplier-input"
                />
              </Field>
            </div>

            <Field label="City">
              <input
                value={
                  form.city
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "city",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                placeholder="e.g. Lahore"
                className="supplier-input"
              />
            </Field>

            <Field label="Province">
              <input
                value={
                  form.province
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "province",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                placeholder="e.g. Punjab"
                className="supplier-input"
              />
            </Field>

            <Field label="Country">
              <input
                value={
                  form.country
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "country",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                className="supplier-input"
              />
            </Field>

            <Field label="Postal Code">
              <input
                value={
                  form.postalCode
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "postalCode",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  30
                }
                placeholder="e.g. 54000"
                className="supplier-input"
              />
            </Field>
          </div>
        </section>

        {/* VERIFICATION */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Verification"
            description="Initial supplier verification state and administrative notes."
          />

          <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Field label="Verification Status">
              <SelectField
                value={
                  form.verificationStatus
                }
                onChange={(
                  value
                ) =>
                  updateField(
                    "verificationStatus",
                    value as SupplierVerificationStatus
                  )
                }
                options={
                  VERIFICATION_OPTIONS
                }
                disabled={
                  submitting
                }
              />

              <p className="mt-1.5 text-[10px] leading-4 text-gray-400">
                New suppliers normally start as Pending unless an administrator is intentionally creating them at another review state.
              </p>
            </Field>

            <Field label="Verification Notes">
              <textarea
                value={
                  form.verificationNotes
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "verificationNotes",
                    event.target.value
                  )
                }
                disabled={
                  submitting
                }
                maxLength={
                  2000
                }
                rows={4}
                placeholder="Verification notes..."
                className="supplier-input min-h-[100px] resize-y py-3"
              />

              <div className="mt-1.5 flex justify-end text-[10px] text-gray-400">
                {form.verificationNotes.length.toLocaleString(
                  "en-PK"
                )}
                /2,000
              </div>
            </Field>
          </div>

          <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
            <div className="flex items-start gap-3 rounded-xl border border-[#5b2eff]/20 bg-[#5b2eff]/[0.04] p-4">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-[#7257ff]"
              />

              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Verification and marketplace access are separate
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  A verified supplier still requires the appropriate subscription, feature entitlement and product access before participating in eligible marketplace workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DESCRIPTION */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Supplier Description"
            description="General supplier profile information."
          />

          <div className="p-5">
            <textarea
              value={
                form.description
              }
              onChange={(
                event
              ) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              disabled={
                submitting
              }
              maxLength={
                5000
              }
              rows={5}
              placeholder="Enter supplier description..."
              className="supplier-input min-h-[120px] resize-y py-3"
            />

            <div className="mt-1.5 flex justify-end text-[10px] text-gray-400">
              {form.description.length.toLocaleString(
                "en-PK"
              )}
              /5,000
            </div>
          </div>
        </section>

        {/* ACTION BAR */}

        <div className="flex flex-col-reverse gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-white/[0.03]">
          <Button
            size="sm"
            variant="outline"
            disabled={
              submitting
            }
            onClick={
              resetForm
            }
          >
            <span className="flex items-center gap-2">
              <RotateCcw
                size={15}
              />

              Reset Form
            </span>
          </Button>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Link
              to="/suppliers"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                !canSubmit ||
                submitting
              }
              className="inline-flex h-10 min-w-[145px] items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-5 text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={16}
                />
              )}

              {submitting
                ? "Saving..."
                : "Save Supplier"}
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .supplier-input {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: transparent;
          padding-left: 12px;
          padding-right: 12px;
          color: #111827;
          font-size: 13px;
          outline: none;
          transition: 0.2s ease;
        }

        .supplier-input::placeholder {
          color: #9ca3af;
        }

        .supplier-input:hover:not(:disabled) {
          border-color: #9ca3af;
        }

        .supplier-input:focus {
          border-color: #ff4b1f;
          box-shadow: 0 0 0 3px rgba(255, 75, 31, 0.08);
        }

        .supplier-input:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        textarea.supplier-input {
          height: auto;
        }

        select.supplier-input {
          appearance: none;
          cursor: pointer;
        }

        .dark .supplier-input {
          border-color: #374151;
          background: #111827;
          color: #f8fafc;
        }

        .dark .supplier-input:hover:not(:disabled) {
          border-color: #4b5563;
        }
      `}</style>
    </>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required,
  badge,
  children,
}: {
  label: string;
  required?: boolean;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 flex min-h-[18px] items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
        <span>
          {label}
        </span>

        {required && (
          <span className="text-[#ff4b1f]">
            *
          </span>
        )}

        {badge && (
          <span className="ml-1 rounded bg-[#5b2eff]/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#7257ff]">
            {badge}
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   SELECT
========================================================= */

function SelectField({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;

  onChange: (
    value: string
  ) => void;

  options: Array<{
    value: string;
    label: string;
  }>;

  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        disabled={
          disabled
        }
        className="supplier-input pr-9"
      >
        {options.map(
          (
            option
          ) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
          {label}
        </p>

        <p className="mt-0.5 text-[10px] leading-4 text-gray-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        disabled={
          disabled
        }
        onClick={
          onChange
        }
        aria-pressed={
          checked
        }
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#5b2eff]"
            : "bg-gray-300 dark:bg-gray-700"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-all ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

/* =========================================================
   MEDIA URL
========================================================= */

function MediaUrlField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  previewAlt,
  banner = false,
}: {
  label: string;
  value: string;

  onChange: (
    value: string
  ) => void;

  placeholder: string;

  disabled: boolean;

  previewAlt: string;

  banner?: boolean;
}) {
  const [
    imageFailed,
    setImageFailed,
  ] =
    useState(false);

  const hasUrl =
    Boolean(
      value.trim()
    );

  const validUrl =
    isValidHttpUrl(
      value
    );

  return (
    <Field
      label={
        label
      }
    >
      <input
        type="url"
        value={
          value
        }
        onChange={(
          event
        ) => {
          setImageFailed(
            false
          );

          onChange(
            event.target.value
          );
        }}
        disabled={
          disabled
        }
        maxLength={
          2000
        }
        placeholder={
          placeholder
        }
        className="supplier-input"
      />

      <div
        className={`mt-3 flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 ${
          banner
            ? "aspect-[16/5]"
            : "h-28"
        }`}
      >
        {hasUrl &&
        validUrl &&
        !imageFailed ? (
          <img
            src={
              value.trim()
            }
            alt={
              previewAlt
            }
            className="h-full w-full object-contain p-2"
            onError={() =>
              setImageFailed(
                true
              )
            }
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-center">
            <Building2
              size={24}
              className="text-gray-300 dark:text-gray-600"
            />

            <p className="mt-2 text-[10px] text-gray-400">
              {hasUrl &&
              !validUrl
                ? "Enter a valid http or https URL"
                : imageFailed
                  ? "Image could not be loaded"
                  : "No image URL provided"}
            </p>
          </div>
        )}
      </div>
    </Field>
  );
}