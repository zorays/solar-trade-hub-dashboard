import {
  useEffect,
  useState,
} from "react";

import type {
  ChangeEvent,
  FormEvent,
  ReactNode,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import {
  createInstaller,
  getInstallerErrorMessage,
  type InstallerStatus,
} from "../../services/installer/installer.service";

/* =========================================================
   SOLAR TRADE HUB
   ADD INSTALLER
========================================================= */

/* =========================================================
   FORM TYPE
========================================================= */

interface InstallerForm {
  companyName: string;

  displayName: string;

  description: string;

  city: string;

  serviceArea: string;

  services: string[];

  contactPerson: string;

  contactPhone: string;

  contactEmail: string;

  contactWhatsapp: string;

  email: string;

  phone: string;

  whatsapp: string;

  website: string;

  ntn: string;

  strn: string;

  companyRegistrationNo: string;

  addressLine1: string;

  addressLine2: string;

  province: string;

  country: string;

  postalCode: string;

  logo: string;

  status: InstallerStatus;
}

/* =========================================================
   AVAILABLE SERVICES
========================================================= */

const availableServices = [
  "Residential Solar",
  "Commercial Solar",
  "Industrial Solar",
  "Agricultural Solar",
  "On-Grid Systems",
  "Hybrid Systems",
  "Off-Grid Systems",
  "Battery Storage",
  "Solar Maintenance",
];

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm: InstallerForm = {
  companyName: "",

  displayName: "",

  description: "",

  city: "",

  serviceArea: "",

  services: [],

  contactPerson: "",

  contactPhone: "",

  contactEmail: "",

  contactWhatsapp: "",

  email: "",

  phone: "",

  whatsapp: "",

  website: "",

  ntn: "",

  strn: "",

  companyRegistrationNo: "",

  addressLine1: "",

  addressLine2: "",

  province: "",

  country: "Pakistan",

  postalCode: "",

  logo: "",

  status: "active",
};

/* =========================================================
   HELPERS
========================================================= */

const parseCommaSeparatedValues = (
  value: string
) => {
  return [
    ...new Set(
      value
        .split(",")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    ),
  ];
};

/* =========================================================
   PAGE
========================================================= */

export default function AddInstaller() {
  const navigate =
    useNavigate();

  const [
    form,
    setForm,
  ] =
    useState<InstallerForm>(
      initialForm
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  /* =======================================================
     LOCAL IMAGE PREVIEW

     IMPORTANT:

     Current backend accepts hosted logo URL.

     Local file upload/storage has not yet been implemented,
     so selected file is preview-only.
  ======================================================= */

  const [
    installerImage,
    setInstallerImage,
  ] =
    useState<File | null>(
      null
    );

  const [
    imagePreview,
    setImagePreview,
  ] =
    useState<string | null>(
      null
    );

  /* =======================================================
     CLEANUP OBJECT URL
  ======================================================= */

  useEffect(() => {
    return () => {
      if (
        imagePreview
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  const updateField = <
    K extends keyof InstallerForm,
  >(
    key: K,
    value: InstallerForm[K]
  ) => {
    setForm(
      (current) => ({
        ...current,

        [key]:
          value,
      })
    );
  };

  /* =======================================================
     TOGGLE SERVICE
  ======================================================= */

  const toggleService = (
    service: string
  ) => {
    setForm(
      (current) => {
        const exists =
          current.services.includes(
            service
          );

        return {
          ...current,

          services:
            exists
              ? current.services.filter(
                  (
                    item
                  ) =>
                    item !==
                    service
                )
              : [
                  ...current.services,
                  service,
                ],
        };
      }
    );
  };

  /* =======================================================
     IMAGE PREVIEW
  ======================================================= */

  const handleImageChange =
    (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target
          .files?.[0];

      if (
        !file
      ) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        toast.error(
          "Please select a valid image."
        );

        return;
      }

      if (
        file.size >
        5 *
          1024 *
          1024
      ) {
        toast.error(
          "Image must be smaller than 5 MB."
        );

        return;
      }

      if (
        imagePreview
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      const preview =
        URL.createObjectURL(
          file
        );

      setInstallerImage(
        file
      );

      setImagePreview(
        preview
      );
    };

  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  const removeImage =
    () => {
      if (
        imagePreview
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setInstallerImage(
        null
      );

      setImagePreview(
        null
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

      if (
        imagePreview
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setForm(
        initialForm
      );

      setInstallerImage(
        null
      );

      setImagePreview(
        null
      );

      toast.info(
        "Installer form reset"
      );
    };

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

      /* ===================================================
         BASIC FRONTEND VALIDATION
      =================================================== */

      if (
        !form.companyName.trim()
      ) {
        toast.error(
          "Company name is required."
        );

        return;
      }

      if (
        !form.displayName.trim()
      ) {
        toast.error(
          "Display name is required."
        );

        return;
      }

      if (
        !form.contactPerson.trim()
      ) {
        toast.error(
          "Contact person is required."
        );

        return;
      }

      if (
        !form.contactPhone.trim()
      ) {
        toast.error(
          "Contact phone is required."
        );

        return;
      }

      if (
        !form.contactEmail.trim()
      ) {
        toast.error(
          "Contact email is required."
        );

        return;
      }

      if (
        !form.city.trim()
      ) {
        toast.error(
          "City is required."
        );

        return;
      }

      const serviceArea =
        parseCommaSeparatedValues(
          form.serviceArea
        );

      if (
        serviceArea.length ===
        0
      ) {
        toast.error(
          "Enter at least one service area."
        );

        return;
      }

      if (
        form.services.length ===
        0
      ) {
        toast.error(
          "Select at least one service."
        );

        return;
      }

      /* ===================================================
         CREATE
      =================================================== */

      try {
        setSubmitting(
          true
        );

        const installer =
          await createInstaller({
            companyName:
              form.companyName.trim(),

            displayName:
              form.displayName.trim(),

            description:
              form.description.trim(),

            city:
              form.city.trim(),

            serviceArea,

            services:
              form.services,

            internalContact: {
              name:
                form.contactPerson.trim(),

              email:
                form.contactEmail.trim(),

              phone:
                form.contactPhone.trim(),

              whatsapp:
                form.contactWhatsapp.trim(),
            },

            email:
              form.email.trim(),

            phone:
              form.phone.trim(),

            whatsapp:
              form.whatsapp.trim(),

            website:
              form.website.trim(),

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

            status:
              form.status,
          });

        toast.success(
          "Installer added successfully",
          {
            description:
              `${installer.installerId} — ${
                installer.displayName ||
                installer.companyName
              }`,
          }
        );

        window.setTimeout(
          () => {
            navigate(
              "/installers"
            );
          },
          600
        );
      } catch (
        error
      ) {
        toast.error(
          "Unable to add installer",
          {
            description:
              getInstallerErrorMessage(
                error,
                "Installer could not be created."
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
     RENDER
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Add Installer | Solar Trade Hub"
        description="Add a new installer to Solar Trade Hub"
      />

      <PageBreadcrumb
        pageTitle="Add Installer"
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
        {/* =================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex
            flex-col
            gap-3

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                text-lg
                font-semibold
                text-gray-900

                dark:text-white
              "
            >
              Add Installer
            </h1>

            <p
              className="
                mt-1
                text-xs
                text-gray-500

                dark:text-gray-400
              "
            >
              Create a Solar Trade
              Hub installer profile.
              Installer ID and
              verification status are
              managed automatically.
            </p>
          </div>

          <div
            className="
              flex
              flex-wrap
              gap-2
            "
          >
            <Link
              to="/installers"
              className="
                inline-flex
                h-10
                items-center
                justify-center
                rounded-lg
                border
                border-gray-200
                bg-white
                px-4
                text-sm
                font-semibold
                text-gray-600
                transition

                hover:bg-gray-50

                dark:border-gray-700
                dark:bg-transparent
                dark:text-gray-300
              "
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-[#ff4b1f]
                px-5
                text-sm
                font-semibold
                text-white
                transition

                hover:bg-[#e83c12]

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <SaveIcon />

              {submitting
                ? "Adding..."
                : "Add Installer"}
            </button>
          </div>
        </div>

        {/* =================================================
            INSTALLER IMAGE
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Installer Image"
            description="Use a hosted logo URL for saving. Local image selection is currently preview-only."
          />

          <div
            className="
              space-y-4
              p-5
            "
          >
            <Field label="Logo / Image URL">
              <input
                type="url"
                value={
                  form.logo
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "logo",
                    event.target
                      .value
                  )
                }
                placeholder="https://example.com/logo.webp"
                className="installer-input"
              />
            </Field>

            {imagePreview ? (
              <div
                className="
                  grid
                  grid-cols-1
                  gap-4

                  lg:grid-cols-[300px_1fr]
                "
              >
                <div
                  className="
                    overflow-hidden
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-100

                    dark:border-gray-700
                    dark:bg-gray-800
                  "
                >
                  <div
                    className="
                      aspect-[16/10]
                    "
                  >
                    <img
                      src={
                        imagePreview
                      }
                      alt="Installer preview"
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                    />
                  </div>
                </div>

                <div
                  className="
                    flex
                    flex-col
                    justify-center
                  "
                >
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-gray-900

                      dark:text-white
                    "
                  >
                    Local Image Preview
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-500
                    "
                  >
                    {
                      installerImage?.name
                    }
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-400
                    "
                  >
                    {installerImage
                      ? `${(
                          installerImage.size /
                          1024 /
                          1024
                        ).toFixed(
                          2
                        )} MB`
                      : ""}
                  </p>

                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-orange-600

                      dark:text-orange-400
                    "
                  >
                    Local file storage
                    is not connected yet.
                    This file will not be
                    sent to the backend.
                  </p>

                  <div
                    className="
                      mt-4
                      flex
                      flex-wrap
                      gap-2
                    "
                  >
                    <label
                      className="
                        inline-flex
                        h-9
                        cursor-pointer
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-gray-200
                        px-3
                        text-xs
                        font-semibold
                        text-gray-600
                        transition

                        hover:bg-gray-50

                        dark:border-gray-700
                        dark:text-gray-300
                      "
                    >
                      Replace Preview

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={
                          handleImageChange
                        }
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={
                        removeImage
                      }
                      className="
                        h-9
                        rounded-lg
                        bg-red-500/10
                        px-3
                        text-xs
                        font-semibold
                        text-red-500
                        transition

                        hover:bg-red-500/15
                      "
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                className="
                  flex
                  min-h-[160px]
                  cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  rounded-xl
                  border-2
                  border-dashed
                  border-[#ff4b1f]/40
                  bg-[#ff4b1f]/[0.03]
                  px-6
                  text-center
                  transition

                  hover:border-[#ff4b1f]
                "
              >
                <div
                  className="
                    flex
                    size-11
                    items-center
                    justify-center
                    rounded-full
                    bg-[#ff4b1f]/10
                    text-[#ff4b1f]
                  "
                >
                  <UploadIcon />
                </div>

                <p
                  className="
                    mt-3
                    text-sm
                    font-semibold
                    text-gray-900

                    dark:text-white
                  "
                >
                  Preview a local image
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-gray-500
                  "
                >
                  PNG, JPG or WEBP up
                  to 5 MB
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleImageChange
                  }
                  className="hidden"
                />
              </label>
            )}
          </div>
        </section>

        {/* =================================================
            INSTALLER PROFILE
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Installer Profile"
            description="Core installer information used across Solar Trade Hub."
          />

          <div
            className="
              grid
              grid-cols-1
              gap-4
              p-5

              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {/* INSTALLER ID */}

            <Field label="Installer ID">
              <input
                value="Auto-generated by system"
                disabled
                className="
                  installer-input
                  cursor-not-allowed
                  font-mono
                  opacity-60
                "
              />
            </Field>

            {/* COMPANY */}

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
                    event.target
                      .value
                  )
                }
                placeholder="Company legal name"
                className="installer-input"
                required
              />
            </Field>

            {/* DISPLAY NAME */}

            <Field
              label="Display Name"
              required
            >
              <input
                value={
                  form.displayName
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "displayName",
                    event.target
                      .value
                  )
                }
                placeholder="Public profile name"
                className="installer-input"
                required
              />
            </Field>

            {/* CITY */}

            <Field
              label="City"
              required
            >
              <input
                value={
                  form.city
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "city",
                    event.target
                      .value
                  )
                }
                placeholder="Lahore"
                className="installer-input"
                required
              />
            </Field>

            {/* SERVICE AREA */}

            <Field
              label="Service Area"
              required
            >
              <input
                value={
                  form.serviceArea
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "serviceArea",
                    event.target
                      .value
                  )
                }
                placeholder="Lahore, Kasur, Sheikhupura"
                className="installer-input"
                required
              />

              <p
                className="
                  mt-1
                  text-[10px]
                  text-gray-400
                "
              >
                Separate multiple areas
                with commas.
              </p>
            </Field>

            {/* STATUS */}

            <Field label="Account Status">
              <div
                className="
                  relative
                "
              >
                <select
                  value={
                    form.status
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "status",
                      event.target
                        .value as InstallerStatus
                    )
                  }
                  className="
                    installer-input
                    appearance-none
                    pr-9
                  "
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                  <option value="suspended">
                    Suspended
                  </option>
                </select>

                <ChevronIcon />
              </div>
            </Field>

            {/* DESCRIPTION */}

            <div
              className="
                md:col-span-2
                xl:col-span-3
              "
            >
              <Field label="Description">
                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "description",
                      event.target
                        .value
                    )
                  }
                  rows={4}
                  placeholder="Installer company profile and capabilities..."
                  className="
                    installer-input
                    min-h-[105px]
                    resize-y
                    py-3
                  "
                />
              </Field>
            </div>
          </div>
        </section>

        {/* =================================================
            SERVICES
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Solar Services"
            description="Select the services this installer provides."
          />

          <div
            className="
              grid
              grid-cols-1
              gap-3
              p-5

              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {availableServices.map(
              (
                service
              ) => {
                const selected =
                  form.services.includes(
                    service
                  );

                return (
                  <button
                    key={
                      service
                    }
                    type="button"
                    onClick={() =>
                      toggleService(
                        service
                      )
                    }
                    className={`
                      flex
                      min-h-[54px]
                      items-center
                      justify-between
                      gap-3
                      rounded-xl
                      border
                      px-4
                      py-3
                      text-left
                      transition

                      ${
                        selected
                          ? "border-[#5b2eff] bg-[#5b2eff]/5"
                          : "border-gray-200 hover:border-[#5b2eff]/40 dark:border-gray-700"
                      }
                    `}
                  >
                    <span
                      className={`
                        text-xs
                        font-semibold

                        ${
                          selected
                            ? "text-[#5b2eff] dark:text-[#9d89ff]"
                            : "text-gray-700 dark:text-gray-300"
                        }
                      `}
                    >
                      {
                        service
                      }
                    </span>

                    <span
                      className={`
                        flex
                        size-5
                        shrink-0
                        items-center
                        justify-center
                        rounded-md
                        border

                        ${
                          selected
                            ? "border-[#5b2eff] bg-[#5b2eff] text-white"
                            : "border-gray-300 text-transparent dark:border-gray-600"
                        }
                      `}
                    >
                      <CheckIcon />
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* =================================================
            INTERNAL CONTACT
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Internal Contact"
            description="Primary contact details used by Solar Trade Hub administration."
          />

          <div
            className="
              grid
              grid-cols-1
              gap-4
              p-5

              md:grid-cols-2
              xl:grid-cols-4
            "
          >
            <Field
              label="Contact Person"
              required
            >
              <input
                value={
                  form.contactPerson
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "contactPerson",
                    event.target
                      .value
                  )
                }
                placeholder="Full name"
                className="installer-input"
                required
              />
            </Field>

            <Field
              label="Contact Phone"
              required
            >
              <input
                type="tel"
                value={
                  form.contactPhone
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "contactPhone",
                    event.target
                      .value
                  )
                }
                placeholder="0300-1234567"
                className="installer-input"
                required
              />
            </Field>

            <Field
              label="Contact Email"
              required
            >
              <input
                type="email"
                value={
                  form.contactEmail
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "contactEmail",
                    event.target
                      .value
                  )
                }
                placeholder="contact@example.com"
                className="installer-input"
                required
              />
            </Field>

            <Field label="Contact WhatsApp">
              <input
                type="tel"
                value={
                  form.contactWhatsapp
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "contactWhatsapp",
                    event.target
                      .value
                  )
                }
                placeholder="+92 300 1234567"
                className="installer-input"
              />
            </Field>
          </div>
        </section>

        {/* =================================================
            BUSINESS CONTACT
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Business Contact"
            description="Public or general business contact information."
          />

          <div
            className="
              grid
              grid-cols-1
              gap-4
              p-5

              md:grid-cols-2
              xl:grid-cols-4
            "
          >
            <Field label="Business Email">
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
                    event.target
                      .value
                  )
                }
                placeholder="info@example.com"
                className="installer-input"
              />
            </Field>

            <Field label="Business Phone">
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
                    event.target
                      .value
                  )
                }
                placeholder="042-1234567"
                className="installer-input"
              />
            </Field>

            <Field label="Business WhatsApp">
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
                    event.target
                      .value
                  )
                }
                placeholder="+92 300 1234567"
                className="installer-input"
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
                    event.target
                      .value
                  )
                }
                placeholder="https://example.com"
                className="installer-input"
              />
            </Field>
          </div>
        </section>

        {/* =================================================
            REGISTRATION
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Business Registration"
            description="Optional company and tax registration details."
          />

          <div
            className="
              grid
              grid-cols-1
              gap-4
              p-5

              md:grid-cols-3
            "
          >
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
                    event.target
                      .value
                  )
                }
                placeholder="NTN"
                className="installer-input"
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
                    event.target
                      .value
                  )
                }
                placeholder="STRN"
                className="installer-input"
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
                    event.target
                      .value
                  )
                }
                placeholder="Registration number"
                className="installer-input"
              />
            </Field>
          </div>
        </section>

        {/* =================================================
            ADDRESS
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Business Address"
            description="Installer office or operational address."
          />

          <div
            className="
              grid
              grid-cols-1
              gap-4
              p-5

              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            <div
              className="
                md:col-span-2
                xl:col-span-3
              "
            >
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
                      event.target
                        .value
                    )
                  }
                  placeholder="Street, building, office"
                  className="installer-input"
                />
              </Field>
            </div>

            <div
              className="
                md:col-span-2
                xl:col-span-3
              "
            >
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
                      event.target
                        .value
                    )
                  }
                  placeholder="Area, landmark, additional address information"
                  className="installer-input"
                />
              </Field>
            </div>

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
                    event.target
                      .value
                  )
                }
                placeholder="Punjab"
                className="installer-input"
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
                    event.target
                      .value
                  )
                }
                placeholder="Pakistan"
                className="installer-input"
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
                    event.target
                      .value
                  )
                }
                placeholder="54000"
                className="installer-input"
              />
            </Field>
          </div>
        </section>

        {/* =================================================
            VERIFICATION
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Verification"
            description="Verification is controlled separately from installer creation."
          />

          <div
            className="
              p-5
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4
                rounded-xl
                border
                border-orange-200
                bg-orange-50
                p-4

                dark:border-orange-500/20
                dark:bg-orange-500/10

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <PendingIcon />

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-gray-900

                      dark:text-white
                    "
                  >
                    Pending Verification
                  </p>
                </div>

                <p
                  className="
                    mt-1.5
                    max-w-2xl
                    text-xs
                    leading-5
                    text-gray-500

                    dark:text-gray-400
                  "
                >
                  Every new installer
                  starts with pending
                  verification.
                  Verification is
                  approved or rejected
                  separately after
                  review.
                </p>
              </div>

              <Link
                to="/installers/verification"
                className="
                  inline-flex
                  h-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-purple-200
                  bg-purple-50
                  px-3
                  text-xs
                  font-semibold
                  text-purple-700
                  transition

                  hover:bg-purple-100

                  dark:border-purple-500/20
                  dark:bg-purple-500/10
                  dark:text-purple-400
                "
              >
                Verification Queue
              </Link>
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER ACTIONS
        ================================================== */}

        <div
          className="
            flex
            flex-col-reverse
            gap-2
            rounded-xl
            border
            border-gray-200
            bg-white
            p-4

            dark:border-gray-800
            dark:bg-white/[0.03]

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <button
            type="button"
            disabled={
              submitting
            }
            onClick={
              resetForm
            }
            className="
              inline-flex
              h-10
              items-center
              justify-center
              rounded-lg
              border
              border-gray-200
              px-4
              text-sm
              font-semibold
              text-gray-600
              transition

              hover:bg-gray-50

              disabled:cursor-not-allowed
              disabled:opacity-50

              dark:border-gray-700
              dark:text-gray-300
            "
          >
            Reset Form
          </button>

          <div
            className="
              flex
              flex-col-reverse
              gap-2

              sm:flex-row
            "
          >
            <Link
              to="/installers"
              className="
                inline-flex
                h-10
                items-center
                justify-center
                rounded-lg
                border
                border-gray-200
                px-4
                text-sm
                font-semibold
                text-gray-600
                transition

                hover:bg-gray-50

                dark:border-gray-700
                dark:text-gray-300
              "
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-[#ff4b1f]
                px-5
                text-sm
                font-semibold
                text-white
                transition

                hover:bg-[#e83c12]

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <SaveIcon />

              {submitting
                ? "Adding..."
                : "Add Installer"}
            </button>
          </div>
        </div>
      </form>

      {/* ===================================================
          INPUT STYLES
      ==================================================== */}

      <style>{`
        .installer-input {
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

        .installer-input::placeholder {
          color: #9ca3af;
        }

        .installer-input:focus {
          border-color: #ff4b1f;
          box-shadow: 0 0 0 3px rgba(255, 75, 31, 0.08);
        }

        textarea.installer-input {
          height: auto;
        }

        .dark .installer-input {
          border-color: #374151;
          background: #111827;
          color: #f8fafc;
        }

        .installer-input:disabled {
          background: rgba(148, 163, 184, 0.08);
        }
      `}</style>
    </>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        border-b
        border-gray-200
        px-5
        py-4

        dark:border-gray-800
      "
    >
      <h2
        className="
          text-sm
          font-semibold
          text-gray-900

          dark:text-white
        "
      >
        {title}
      </h2>

      <p
        className="
          mt-1
          text-xs
          text-gray-500

          dark:text-gray-400
        "
      >
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className="
          mb-1.5
          block
          text-xs
          font-medium
          text-gray-700

          dark:text-gray-300
        "
      >
        {label}

        {required && (
          <span
            className="
              ml-1
              text-[#ff4b1f]
            "
          >
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
    >
      <path d="M12 16V4" />

      <path d="m7 9 5-5 5 5" />

      <path d="M5 14v5h14v-5" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
    >
      <path d="M5 4h12l2 2v14H5V4Z" />

      <path d="M8 4v6h8V4" />

      <path d="M8 20v-6h8v6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="size-3.5"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="
        pointer-events-none
        absolute
        right-3
        top-1/2
        size-4
        -translate-y-1/2
        text-gray-400
      "
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="
        size-4
        text-orange-500
      "
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}