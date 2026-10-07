import {
  useState,
} from "react";

import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Info,
  MapPin,
  Save,
  Tag,
  WalletCards,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  createTender,
  getTenderErrorMessage,
  type TenderCurrency,
  type TenderStatus,
} from "../../services/tender/tender.service";

/* =========================================================
   FORM DATA
========================================================= */

type TenderFormData = {
  title: string;

  organization: string;

  location: string;

  category: string;

  description: string;

  budget: string;

  currency: TenderCurrency;

  deadline: string;

  status:
    | "draft"
    | "open";
};

/* =========================================================
   CATEGORY OPTIONS
========================================================= */

const CATEGORY_OPTIONS = [
  "Solar EPC",
  "Solar Installation",
  "Solar Equipment Supply",
  "Solar Panel Supply",
  "Inverter Supply",
  "Battery Supply",
  "Energy Storage",
  "Hybrid Solar",
  "Mounting Structure",
  "Electrical & Protection",
  "O&M Services",
  "Consultancy",
  "Other",
];

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM: TenderFormData = {
  title: "",

  organization: "",

  location: "",

  category: "",

  description: "",

  budget: "",

  currency: "PKR",

  deadline: "",

  status: "draft",
};

/* =========================================================
   PAGE
========================================================= */

const AddTender = () => {
  const navigate =
    useNavigate();

  const [
    formData,
    setFormData,
  ] =
    useState<TenderFormData>(
      INITIAL_FORM
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  /* =======================================================
     HANDLE CHANGE
  ======================================================= */

  const handleChange = <
    K extends keyof TenderFormData,
  >(
    field: K,
    value: TenderFormData[K]
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
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        submitting
      ) {
        return;
      }

      const title =
        formData.title.trim();

      const organization =
        formData.organization.trim();

      const location =
        formData.location.trim();

      const category =
        formData.category.trim();

      const description =
        formData.description.trim();

      const budget =
        Number(
          formData.budget
        );

      if (
        !title ||
        !organization ||
        !location ||
        !category ||
        !formData.deadline
      ) {
        toast.error(
          "Please complete all required fields."
        );

        return;
      }

      if (
        !Number.isFinite(
          budget
        ) ||
        budget <
          0
      ) {
        toast.error(
          "Please enter a valid Tender budget."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        const tender =
          await createTender({
            title,

            organization,

            location,

            category,

            description,

            budget: {
              amount:
                budget,

              currency:
                formData.currency,
            },

            deadline:
              formData.deadline,

            status:
              formData.status as TenderStatus,
          });

        toast.success(
          "Tender created successfully",
          {
            description:
              `${tender.tenderId} — ${tender.title}`,
          }
        );

        window.setTimeout(
          () => {
            navigate(
              "/tenders"
            );
          },
          700
        );
      } catch (
        error
      ) {
        toast.error(
          "Unable to create Tender",
          {
            description:
              getTenderErrorMessage(
                error,
                "Tender could not be created."
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
        title="Add Tender | Solar Trade Hub"
        description="Create a new Solar Trade Hub Tender."
      />

      <PageBreadcrumb
        pageTitle="Add Tender"
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
        className="space-y-5"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-orange-500/[0.06]" />

          <div className="pointer-events-none absolute right-28 top-4 h-36 w-36 rounded-full bg-purple-500/[0.06]" />

          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <FileText
                    size={23}
                    strokeWidth={
                      1.9
                    }
                  />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                      Tender Management
                    </span>

                    <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      New Opportunity
                    </span>
                  </div>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Create Tender
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Publish a procurement,
                    supply or solar project
                    requirement for the
                    Solar Trade Hub
                    marketplace.
                  </p>
                </div>
              </div>

              <Link
                to="/tenders"
                className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.04]"
              >
                <ArrowLeft
                  size={16}
                />

                Back to Tenders
              </Link>
            </div>
          </div>
        </section>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          {/* ===============================================
              LEFT SIDE
          =============================================== */}

          <div className="space-y-5">
            {/* =============================================
                BASIC INFORMATION
            ============================================= */}

            <FormSection
              title="Tender Information"
              description="Enter the core details of the procurement or project opportunity."
              icon={
                <FileText
                  size={18}
                />
              }
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <FormField
                    label="Tender Title"
                    required
                    hint="Use a clear title that describes the requirement."
                  >
                    <InputWrapper
                      icon={
                        <FileText
                          size={17}
                        />
                      }
                    >
                      <input
                        type="text"
                        value={
                          formData.title
                        }
                        onChange={(
                          event
                        ) =>
                          handleChange(
                            "title",
                            event.target
                              .value
                          )
                        }
                        placeholder="e.g. 100 kW Commercial Solar System"
                        required
                        maxLength={
                          240
                        }
                        className="field-input pl-10"
                      />
                    </InputWrapper>
                  </FormField>
                </div>

                <FormField
                  label="Organization / Buyer"
                  required
                >
                  <InputWrapper
                    icon={
                      <Building2
                        size={17}
                      />
                    }
                  >
                    <input
                      type="text"
                      value={
                        formData.organization
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "organization",
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. ABC Industries"
                      required
                      maxLength={
                        200
                      }
                      className="field-input pl-10"
                    />
                  </InputWrapper>
                </FormField>

                <FormField
                  label="Project Location"
                  required
                >
                  <InputWrapper
                    icon={
                      <MapPin
                        size={17}
                      />
                    }
                  >
                    <input
                      type="text"
                      value={
                        formData.location
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "location",
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. Lahore"
                      required
                      maxLength={
                        160
                      }
                      className="field-input pl-10"
                    />
                  </InputWrapper>
                </FormField>

                <FormField
                  label="Tender Category"
                  required
                >
                  <InputWrapper
                    icon={
                      <Tag
                        size={17}
                      />
                    }
                  >
                    <select
                      value={
                        formData.category
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "category",
                          event.target
                            .value
                        )
                      }
                      required
                      className="field-input appearance-none pl-10 pr-10"
                    >
                      <option value="">
                        Select tender
                        category
                      </option>

                      {CATEGORY_OPTIONS.map(
                        (
                          category
                        ) => (
                          <option
                            key={
                              category
                            }
                            value={
                              category
                            }
                          >
                            {
                              category
                            }
                          </option>
                        )
                      )}
                    </select>

                    <SelectArrow />
                  </InputWrapper>
                </FormField>

                <FormField
                  label="Submission Deadline"
                  required
                >
                  <InputWrapper
                    icon={
                      <CalendarDays
                        size={17}
                      />
                    }
                  >
                    <input
                      type="date"
                      value={
                        formData.deadline
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "deadline",
                          event.target
                            .value
                        )
                      }
                      required
                      className="field-input pl-10"
                    />
                  </InputWrapper>
                </FormField>
              </div>
            </FormSection>

            {/* =============================================
                DESCRIPTION
            ============================================= */}

            <FormSection
              title="Requirement Details"
              description="Explain the scope, equipment or services required from marketplace participants."
              icon={
                <FileText
                  size={18}
                />
              }
            >
              <FormField
                label="Tender Description"
                hint="Include capacity, quantity, technical expectations, delivery requirements or project scope."
              >
                <textarea
                  value={
                    formData.description
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "description",
                      event.target
                        .value
                    )
                  }
                  placeholder="Describe the Tender scope and requirements..."
                  maxLength={
                    10000
                  }
                  rows={
                    7
                  }
                  className="field-textarea"
                />

                <div className="mt-2 flex justify-end">
                  <span className="text-[11px] text-gray-400">
                    {
                      formData.description
                        .length
                    }
                    /10000
                  </span>
                </div>
              </FormField>
            </FormSection>

            {/* =============================================
                COMMERCIAL INFORMATION
            ============================================= */}

            <FormSection
              title="Commercial Information"
              description="Set the expected project budget and Tender lifecycle status."
              icon={
                <CircleDollarSign
                  size={18}
                />
              }
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_160px]">
                <FormField
                  label="Estimated Budget"
                  required
                >
                  <InputWrapper
                    icon={
                      <WalletCards
                        size={17}
                      />
                    }
                  >
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        formData.budget
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "budget",
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. 14500000"
                      required
                      className="field-input pl-10"
                    />
                  </InputWrapper>
                </FormField>

                <FormField
                  label="Currency"
                  required
                >
                  <div className="relative">
                    <select
                      value={
                        formData.currency
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "currency",
                          event.target
                            .value as TenderCurrency
                        )
                      }
                      className="field-input appearance-none pr-10"
                    >
                      <option value="PKR">
                        PKR
                      </option>

                      <option value="USD">
                        USD
                      </option>
                    </select>

                    <SelectArrow />
                  </div>
                </FormField>
              </div>
            </FormSection>
          </div>

          {/* ===============================================
              RIGHT SIDE
          =============================================== */}

          <aside className="space-y-5">
            {/* =============================================
                STATUS
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tender Status
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Choose whether this
                  Tender should remain a
                  draft or become active.
                </p>
              </div>

              <div className="space-y-3 p-5">
                <StatusOption
                  active={
                    formData.status ===
                    "draft"
                  }
                  title="Save as Draft"
                  description="Keep this Tender in the dashboard without opening it for marketplace activity."
                  tone="gray"
                  onClick={() =>
                    handleChange(
                      "status",
                      "draft"
                    )
                  }
                />

                <StatusOption
                  active={
                    formData.status ===
                    "open"
                  }
                  title="Open Tender"
                  description="Mark the Tender as open and ready for marketplace bidding."
                  tone="green"
                  onClick={() =>
                    handleChange(
                      "status",
                      "open"
                    )
                  }
                />
              </div>
            </section>

            {/* =============================================
                REFERENCE
            ============================================= */}

            <section className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/80 via-white to-orange-50/60 p-5 dark:border-purple-500/10 dark:from-purple-500/[0.07] dark:via-white/[0.02] dark:to-orange-500/[0.05]">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <Info
                    size={17}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Tender Reference
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    The Tender ID is
                    generated automatically
                    after creation.
                  </p>

                  <div className="mt-3 rounded-lg border border-purple-100 bg-white px-3 py-2.5 font-mono text-xs font-semibold text-purple-600 dark:border-purple-500/20 dark:bg-white/[0.03] dark:text-purple-400">
                    STH-TND-XXXX
                  </div>
                </div>
              </div>
            </section>

            {/* =============================================
                MARKETPLACE INFO
            ============================================= */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <CheckCircle2
                    size={18}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Marketplace Managed
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Bid count is
                    controlled by Solar
                    Trade Hub. It cannot
                    be entered manually
                    while creating a
                    Tender.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* =================================================
            ACTION BAR
        ================================================= */}

        <section className="sticky bottom-4 z-20 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg shadow-gray-200/40 backdrop-blur dark:border-gray-800 dark:bg-[#101828]/95 dark:shadow-none sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Required fields are marked
                with{" "}
                <span className="text-orange-500">
                  *
                </span>
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Link
                to="/tenders"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.04]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="inline-flex h-11 min-w-[155px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <SpinnerIcon />
                ) : (
                  <Save
                    size={17}
                  />
                )}

                {submitting
                  ? "Saving..."
                  : formData.status ===
                      "open"
                    ? "Create & Open"
                    : "Save Draft"}
              </button>
            </div>
          </div>
        </section>
      </form>

      {/* ===================================================
          LOCAL FIELD STYLES
      =================================================== */}

      <style>
        {`
          .field-input {
            height: 44px;
            width: 100%;
            border-radius: 0.625rem;
            border: 1px solid rgb(229 231 235);
            background: rgb(255 255 255);
            padding-left: 0.875rem;
            padding-right: 0.875rem;
            font-size: 0.875rem;
            color: rgb(17 24 39);
            outline: none;
            transition:
              border-color 150ms ease,
              box-shadow 150ms ease,
              background-color 150ms ease;
          }

          .field-input::placeholder {
            color: rgb(156 163 175);
          }

          .field-input:hover {
            border-color: rgb(209 213 219);
          }

          .field-input:focus {
            border-color: rgb(147 51 234);
            box-shadow:
              0 0 0 3px rgba(147, 51, 234, 0.08);
          }

          .field-textarea {
            width: 100%;
            resize: vertical;
            border-radius: 0.625rem;
            border: 1px solid rgb(229 231 235);
            background: rgb(255 255 255);
            padding: 0.875rem;
            font-size: 0.875rem;
            line-height: 1.6;
            color: rgb(17 24 39);
            outline: none;
            transition:
              border-color 150ms ease,
              box-shadow 150ms ease;
          }

          .field-textarea::placeholder {
            color: rgb(156 163 175);
          }

          .field-textarea:hover {
            border-color: rgb(209 213 219);
          }

          .field-textarea:focus {
            border-color: rgb(147 51 234);
            box-shadow:
              0 0 0 3px rgba(147, 51, 234, 0.08);
          }

          .dark .field-input,
          .dark .field-textarea {
            border-color: rgb(55 65 81);
            background: rgb(17 24 39);
            color: rgba(255, 255, 255, 0.92);
          }

          .dark .field-input:hover,
          .dark .field-textarea:hover {
            border-color: rgb(75 85 99);
          }

          .dark .field-input:focus,
          .dark .field-textarea:focus {
            border-color: rgb(168 85 247);
            box-shadow:
              0 0 0 3px rgba(168, 85, 247, 0.1);
          }
        `}
      </style>
    </>
  );
};

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;

  description: string;

  icon: ReactNode;

  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;

  required?: boolean;

  hint?: string;

  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}

        {required && (
          <span className="ml-1 text-orange-500">
            *
          </span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-[11px] leading-5 text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   INPUT WRAPPER
========================================================= */

function InputWrapper({
  icon,
  children,
}: {
  icon: ReactNode;

  children: ReactNode;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-400">
        {icon}
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   STATUS OPTION
========================================================= */

function StatusOption({
  active,
  title,
  description,
  tone,
  onClick,
}: {
  active: boolean;

  title: string;

  description: string;

  tone:
    | "gray"
    | "green";

  onClick: () => void;
}) {
  const activeStyles =
    tone ===
    "green"
      ? "border-green-500 bg-green-500/[0.06]"
      : "border-purple-500 bg-purple-500/[0.05]";

  const dotStyles =
    tone ===
    "green"
      ? "bg-green-500"
      : "bg-purple-500";

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "w-full rounded-xl border p-4 text-left transition",

        active
          ? activeStyles
          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
      ].join(
        " "
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",

            active
              ? tone ===
                  "green"
                ? "border-green-500"
                : "border-purple-500"
              : "border-gray-300 dark:border-gray-600",
          ].join(
            " "
          )}
        >
          {active && (
            <span
              className={`size-2.5 rounded-full ${dotStyles}`}
            />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   SELECT ARROW
========================================================= */

function SelectArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* =========================================================
   SPINNER
========================================================= */

function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-4 animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default AddTender;