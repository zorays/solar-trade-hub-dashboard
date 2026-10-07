import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
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
  RefreshCw,
  Save,
  Tag,
  Users,
  WalletCards,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  getTender,
  getTenderErrorMessage,
  updateTender,
  type Tender,
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

  status: TenderStatus;
};

/* =========================================================
   CATEGORIES
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
   DATE FOR INPUT
========================================================= */

function getDateInputValue(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  /*
   * Backend normally returns ISO:
   *
   * 2026-09-25T00:00:00.000Z
   *
   * HTML date input needs:
   *
   * 2026-09-25
   */

  if (
    value.includes("T")
  ) {
    return (
      value.split("T")[0] ||
      ""
    );
  }

  return value.slice(
    0,
    10
  );
}

/* =========================================================
   EDIT TENDER
========================================================= */

const EditTender = () => {
  const params =
    useParams();

  const navigate =
    useNavigate();

  const tenderReference =
    params.tenderId ||
    params.id ||
    "";

  const [
    tender,
    setTender,
  ] =
    useState<Tender | null>(
      null
    );

  const [
    formData,
    setFormData,
  ] =
    useState<TenderFormData>(
      INITIAL_FORM
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
    loadError,
    setLoadError,
  ] =
    useState("");

  /* =======================================================
     LOAD TENDER
  ======================================================= */

  const loadTender =
    useCallback(
      async () => {
        if (
          !tenderReference
        ) {
          setLoadError(
            "Tender ID is missing."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setLoadError(
            ""
          );

          const result =
            await getTender(
              tenderReference
            );

          setTender(
            result
          );

          setFormData({
            title:
              result.title ||
              "",

            organization:
              result.organization ||
              "",

            location:
              result.location ||
              "",

            category:
              result.category ||
              "",

            description:
              result.description ||
              "",

            budget:
              String(
                result.budget
                  ?.amount ??
                  0
              ),

            currency:
              result.budget
                ?.currency ||
              "PKR",

            deadline:
              getDateInputValue(
                result.deadline
              ),

            status:
              result.status ||
              "draft",
          });
        } catch (
          error
        ) {
          setTender(
            null
          );

          setLoadError(
            getTenderErrorMessage(
              error,
              "Unable to load Tender."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        tenderReference,
      ]
    );

  useEffect(() => {
    void loadTender();
  }, [
    loadTender,
  ]);

  /* =======================================================
     CATEGORY OPTIONS

     Preserve a category already stored in the database
     even if it is not part of the standard list.
  ======================================================= */

  const categoryOptions =
    useMemo(
      () => {
        const current =
          formData.category.trim();

        if (
          current &&
          !CATEGORY_OPTIONS.includes(
            current
          )
        ) {
          return [
            current,
            ...CATEGORY_OPTIONS,
          ];
        }

        return CATEGORY_OPTIONS;
      },
      [
        formData.category,
      ]
    );

  /* =======================================================
     CHANGE
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
        !tender ||
        saving
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
        !category
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

      if (
        !formData.deadline
      ) {
        toast.error(
          "Tender deadline is required."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        const updatedTender =
          await updateTender(
            tender.tenderId,
            {
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
                formData.status,
            }
          );

        setTender(
          updatedTender
        );

        toast.success(
          "Tender updated successfully",
          {
            description:
              `${updatedTender.tenderId} — ${updatedTender.title}`,
          }
        );

        window.setTimeout(
          () => {
            navigate(
              `/tenders/${encodeURIComponent(
                updatedTender.tenderId
              )}`
            );
          },
          600
        );
      } catch (
        error
      ) {
        toast.error(
          "Unable to update Tender",
          {
            description:
              getTenderErrorMessage(
                error,
                "Tender could not be updated."
              ),
          }
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <PageMeta
          title="Edit Tender | Solar Trade Hub"
          description="Edit Solar Trade Hub Tender."
        />

        <PageBreadcrumb
          pageTitle="Edit Tender"
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <RefreshCw
              size={21}
              className="animate-spin"
            />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
            Loading Tender
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Fetching Tender information
            from Solar Trade Hub.
          </p>
        </div>
      </>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    loadError ||
    !tender
  ) {
    return (
      <>
        <PageMeta
          title="Tender Not Found | Solar Trade Hub"
          description="Tender could not be loaded."
        />

        <PageBreadcrumb
          pageTitle="Edit Tender"
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <FileText
              size={21}
            />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Unable to edit Tender
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            {loadError ||
              "Tender could not be found."}
          </p>

          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                void loadTender()
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600"
            >
              <RefreshCw
                size={15}
              />

              Try Again
            </button>

            <Link
              to="/tenders"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 text-sm font-semibold text-white"
            >
              <ArrowLeft
                size={15}
              />

              Back to Tenders
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title={`Edit ${tender.title} | Solar Trade Hub`}
        description={`Edit Tender ${tender.tenderId} on Solar Trade Hub.`}
      />

      <PageBreadcrumb
        pageTitle="Edit Tender"
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
          <div className="pointer-events-none absolute -right-20 -top-24 size-60 rounded-full bg-orange-500/[0.06]" />

          <div className="pointer-events-none absolute right-28 top-4 size-36 rounded-full bg-purple-500/[0.06]" />

          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <FileText
                    size={23}
                  />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-purple-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                      {
                        tender.tenderId
                      }
                    </span>

                    <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                      Edit Mode
                    </span>
                  </div>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Edit Tender
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Update procurement
                    information, commercial
                    details and Tender
                    lifecycle status.
                  </p>
                </div>
              </div>

              <Link
                to={`/tenders/${encodeURIComponent(
                  tender.tenderId
                )}`}
                className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
              >
                <ArrowLeft
                  size={16}
                />

                Back to Tender
              </Link>
            </div>
          </div>
        </section>

        {/* =================================================
            CONTENT GRID
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-5">
            {/* =============================================
                INFORMATION
            ============================================= */}

            <FormSection
              title="Tender Information"
              description="Update the core details shown across Solar Trade Hub."
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
                        maxLength={
                          240
                        }
                        required
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
                      maxLength={
                        200
                      }
                      required
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
                      maxLength={
                        160
                      }
                      required
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
                      {categoryOptions.map(
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
              description="Update the project scope, technical requirements and procurement information."
              icon={
                <FileText
                  size={18}
                />
              }
            >
              <FormField
                label="Tender Description"
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
                  rows={
                    7
                  }
                  maxLength={
                    10000
                  }
                  placeholder="Tender scope and requirements..."
                  className="field-textarea"
                />

                <p className="mt-2 text-right text-[11px] text-gray-400">
                  {
                    formData.description
                      .length
                  }
                  /10000
                </p>
              </FormField>
            </FormSection>

            {/* =============================================
                COMMERCIAL
            ============================================= */}

            <FormSection
              title="Commercial Information"
              description="Update the estimated project budget and currency."
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
              SIDEBAR
          =============================================== */}

          <aside className="space-y-5">
            {/* =============================================
                PUBLIC ID
            ============================================= */}

            <section className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/80 via-white to-orange-50/60 p-5 dark:border-purple-500/10 dark:from-purple-500/[0.07] dark:via-white/[0.02] dark:to-orange-500/[0.05]">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                  <Info
                    size={17}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Tender ID
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    Public Tender ID is
                    generated by the
                    system and cannot be
                    edited.
                  </p>

                  <div className="mt-3 break-all rounded-lg border border-purple-100 bg-white px-3 py-2.5 font-mono text-xs font-semibold text-purple-600 dark:border-purple-500/20 dark:bg-white/[0.03] dark:text-purple-400">
                    {
                      tender.tenderId
                    }
                  </div>
                </div>
              </div>
            </section>

            {/* =============================================
                STATUS
            ============================================= */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tender Status
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Manage the Tender
                  lifecycle state.
                </p>
              </div>

              <div className="space-y-2.5 p-5">
                <StatusOption
                  status="draft"
                  current={
                    formData.status
                  }
                  title="Draft"
                  description="Keep the Tender unpublished."
                  tone="gray"
                  onSelect={
                    handleChange
                  }
                />

                <StatusOption
                  status="open"
                  current={
                    formData.status
                  }
                  title="Open"
                  description="Open for marketplace activity."
                  tone="green"
                  onSelect={
                    handleChange
                  }
                />

                <StatusOption
                  status="closed"
                  current={
                    formData.status
                  }
                  title="Closed"
                  description="Stop accepting new responses."
                  tone="red"
                  onSelect={
                    handleChange
                  }
                />

                <StatusOption
                  status="awarded"
                  current={
                    formData.status
                  }
                  title="Awarded"
                  description="Mark the Tender as awarded."
                  tone="purple"
                  onSelect={
                    handleChange
                  }
                />

                <StatusOption
                  status="cancelled"
                  current={
                    formData.status
                  }
                  title="Cancelled"
                  description="Cancel the Tender opportunity."
                  tone="amber"
                  onSelect={
                    handleChange
                  }
                />
              </div>
            </section>

            {/* =============================================
                BIDS
            ============================================= */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Users
                    size={21}
                  />
                </div>

                <div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {
                      tender.bidsCount
                    }
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Marketplace bids
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
                <CheckCircle2
                  size={15}
                  className="mt-0.5 shrink-0 text-green-500"
                />

                <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Bid count is
                  system-managed and
                  cannot be edited here.
                </p>
              </div>
            </section>
          </aside>
        </div>

        {/* =================================================
            ACTION BAR
        ================================================= */}

        <section className="sticky bottom-4 z-20 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg shadow-gray-200/40 backdrop-blur dark:border-gray-800 dark:bg-[#101828]/95 dark:shadow-none sm:px-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="hidden text-xs text-gray-500 sm:block">
              Changes will update{" "}
              <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                {
                  tender.tenderId
                }
              </span>
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Link
                to={`/tenders/${encodeURIComponent(
                  tender.tenderId
                )}`}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="inline-flex h-11 min-w-[155px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <SpinnerIcon />
                ) : (
                  <Save
                    size={17}
                  />
                )}

                {saving
                  ? "Saving..."
                  : "Save Changes"}
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
  children,
}: {
  label: string;

  required?: boolean;

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
  status,
  current,
  title,
  description,
  tone,
  onSelect,
}: {
  status: TenderStatus;

  current: TenderStatus;

  title: string;

  description: string;

  tone:
    | "gray"
    | "green"
    | "red"
    | "purple"
    | "amber";

  onSelect: (
    field: "status",
    value: TenderStatus
  ) => void;
}) {
  const active =
    current ===
    status;

  const styles = {
    gray:
      "border-gray-500 bg-gray-500/[0.06]",

    green:
      "border-green-500 bg-green-500/[0.06]",

    red:
      "border-red-500 bg-red-500/[0.06]",

    purple:
      "border-purple-500 bg-purple-500/[0.06]",

    amber:
      "border-amber-500 bg-amber-500/[0.06]",
  };

  const dotStyles = {
    gray:
      "bg-gray-500",

    green:
      "bg-green-500",

    red:
      "bg-red-500",

    purple:
      "bg-purple-500",

    amber:
      "bg-amber-500",
  };

  return (
    <button
      type="button"
      onClick={() =>
        onSelect(
          "status",
          status
        )
      }
      className={[
        "w-full rounded-xl border p-3.5 text-left transition",

        active
          ? styles[
              tone
            ]
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
              ? styles[
                  tone
                ].includes(
                  "green"
                )
                ? "border-green-500"
                : tone ===
                    "red"
                  ? "border-red-500"
                  : tone ===
                      "purple"
                    ? "border-purple-500"
                    : tone ===
                        "amber"
                      ? "border-amber-500"
                      : "border-gray-500"
              : "border-gray-300 dark:border-gray-600",
          ].join(
            " "
          )}
        >
          {active && (
            <span
              className={`size-2.5 rounded-full ${
                dotStyles[
                  tone
                ]
              }`}
            />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </p>

          <p className="mt-0.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
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

export default EditTender;