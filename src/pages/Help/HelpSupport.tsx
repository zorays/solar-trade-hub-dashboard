import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Clock3,
  FileQuestion,
  History,
  LifeBuoy,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Store,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  createSupportRequest,
  getHelpSupportErrorMessage,
  getMySupportRequests,
  type SupportCategory,
  type SupportRequest,
  type SupportRequestStatus,
} from "../../services/helpSupport/helpSupport.service";

/* =========================================================
   TYPES
========================================================= */

type FAQItem = {
  id: string;

  question: string;

  answer: string;

  category: SupportCategory;
};

type SupportForm = {
  category: SupportCategory;

  subject: string;

  message: string;
};

/* =========================================================
   SOLAR TRADE HUB FAQ DATA
========================================================= */

const faqItems: FAQItem[] = [
  {
    id: "faq-001",

    category: "Products",

    question:
      "How do I approve a supplier product?",

    answer:
      "Open the Products section, review the submitted product details and use the available approval controls before publishing it to the Solar Trade Hub storefront.",
  },

  {
    id: "faq-002",

    category: "Suppliers",

    question:
      "How is a supplier verified?",

    answer:
      "Supplier verification should be completed after reviewing the supplier profile, submitted business information and any required verification documents.",
  },

  {
    id: "faq-003",

    category: "Installers",

    question:
      "Where can I review installer applications?",

    answer:
      "Installer applications are available under Installers → Applications. Verification status can be managed separately from the Installer Verification section.",
  },

  {
    id: "faq-004",

    category: "Orders",

    question:
      "Can administrators manually create marketplace orders?",

    answer:
      "No. Marketplace orders are intended to originate from customer or system activity. Administrators can review and manage their status from the Orders module.",
  },

  {
    id: "faq-005",

    category: "Users",

    question:
      "How do I block or reactivate a user?",

    answer:
      "Open the user's profile from the Users module and update the account status using the available Active, Inactive or Blocked controls.",
  },

  {
    id: "faq-006",

    category: "Settings",

    question:
      "Where are marketplace approval rules configured?",

    answer:
      "Marketplace approval and verification controls are available under Settings → Marketplace.",
  },

  {
    id: "faq-007",

    category: "Technical",

    question:
      "What should I do if dashboard data does not refresh?",

    answer:
      "Use the page refresh action first. If the issue continues, confirm your dashboard permissions and API connectivity, then submit a support request with the affected module and error details.",
  },

  {
    id: "faq-008",

    category: "General",

    question:
      "What does the Content module control?",

    answer:
      "The Content module manages storefront homepage sections, promotional banners and informational pages without duplicating marketplace product or supplier data.",
  },
];

/* =========================================================
   QUICK HELP
========================================================= */

const quickHelpItems = [
  {
    id: "quick-products",

    title:
      "Marketplace Management",

    description:
      "Products, suppliers, installers, tenders and deals.",

    icon:
      <Store
        size={19}
      />,
  },

  {
    id: "quick-users",

    title:
      "User Administration",

    description:
      "Accounts, roles, verification and access controls.",

    icon:
      <Users
        size={19}
      />,
  },

  {
    id: "quick-settings",

    title:
      "System Configuration",

    description:
      "General, marketplace and email settings.",

    icon:
      <Settings
        size={19}
      />,
  },

  {
    id: "quick-technical",

    title:
      "Technical Support",

    description:
      "Dashboard errors, API integration and application issues.",

    icon:
      <Wrench
        size={19}
      />,
  },
];

/* =========================================================
   INPUT CLASSES
========================================================= */

const inputClass =
  "h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white dark:placeholder:text-gray-500";

const textareaClass =
  "min-h-[140px] w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950/40 dark:text-white dark:placeholder:text-gray-500";

/* =========================================================
   HELPERS
========================================================= */

const formatDateTime = (
  value: string
) => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    date
  );
};

const getStatusLabel = (
  status: SupportRequestStatus
) => {
  switch (status) {
    case "open":
      return "Open";

    case "in_progress":
      return "In Progress";

    case "resolved":
      return "Resolved";

    case "closed":
      return "Closed";

    default:
      return status;
  }
};

const getStatusClass = (
  status: SupportRequestStatus
) => {
  switch (status) {
    case "open":
      return "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400";

    case "in_progress":
      return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";

    case "resolved":
      return "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400";

    case "closed":
      return "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400";
  }
};

/* =========================================================
   PAGE
========================================================= */

const HelpSupport = () => {
  /* =======================================================
     FAQ
  ======================================================= */

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState<
      SupportCategory | ""
    >(
      ""
    );

  const [
    openedFaq,
    setOpenedFaq,
  ] =
    useState<
      string | null
    >(
      null
    );

  /* =======================================================
     SUPPORT REQUEST FORM
  ======================================================= */

  const [
    formData,
    setFormData,
  ] =
    useState<SupportForm>({
      category:
        "General",

      subject:
        "",

      message:
        "",
    });

  const [
    sending,
    setSending,
  ] =
    useState(
      false
    );

  const [
    success,
    setSuccess,
  ] =
    useState(
      ""
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  /* =======================================================
     SUPPORT HISTORY
  ======================================================= */

  const [
    requests,
    setRequests,
  ] =
    useState<
      SupportRequest[]
    >(
      []
    );

  const [
    requestsLoading,
    setRequestsLoading,
  ] =
    useState(
      true
    );

  const [
    requestsError,
    setRequestsError,
  ] =
    useState(
      ""
    );

  const [
    openedRequest,
    setOpenedRequest,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    requestsTotal,
    setRequestsTotal,
  ] =
    useState(
      0
    );

  /* =======================================================
     FILTER FAQS
  ======================================================= */

  const filteredFaqs =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        return faqItems.filter(
          (
            faq
          ) => {
            const matchesSearch =
              !term ||
              faq.question
                .toLowerCase()
                .includes(
                  term
                ) ||
              faq.answer
                .toLowerCase()
                .includes(
                  term
                );

            const matchesCategory =
              !categoryFilter ||
              faq.category ===
                categoryFilter;

            return (
              matchesSearch &&
              matchesCategory
            );
          }
        );
      },
      [
        search,
        categoryFilter,
      ]
    );

  /* =======================================================
     LOAD MY SUPPORT REQUESTS
  ======================================================= */

  const loadSupportRequests =
    useCallback(
      async () => {
        try {
          setRequestsLoading(
            true
          );

          setRequestsError(
            ""
          );

          const result =
            await getMySupportRequests({
              page:
                1,

              limit:
                20,
            });

          setRequests(
            result.requests
          );

          setRequestsTotal(
            result.total
          );
        } catch (
          loadError
        ) {
          setRequests(
            []
          );

          setRequestsTotal(
            0
          );

          setRequestsError(
            getHelpSupportErrorMessage(
              loadError
            )
          );
        } finally {
          setRequestsLoading(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      void loadSupportRequests();
    },
    [
      loadSupportRequests,
    ]
  );

  /* =======================================================
     UPDATE SUPPORT FORM
  ======================================================= */

  const updateForm = <
    K extends keyof SupportForm,
  >(
    field: K,
    value: SupportForm[K]
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

    setSuccess(
      ""
    );

    setError(
      ""
    );
  };

  /* =======================================================
     SUBMIT SUPPORT REQUEST
  ======================================================= */

  const handleSubmit =
    async () => {
      const subject =
        formData.subject.trim();

      const message =
        formData.message.trim();

      if (
        !subject
      ) {
        setError(
          "Please enter a subject."
        );

        setSuccess(
          ""
        );

        return;
      }

      if (
        !message
      ) {
        setError(
          "Please describe the issue."
        );

        setSuccess(
          ""
        );

        return;
      }

      try {
        setSending(
          true
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        await createSupportRequest({
          category:
            formData.category,

          subject,

          message,
        });

        setFormData({
          category:
            "General",

          subject:
            "",

          message:
            "",
        });

        setSuccess(
          "Support request submitted successfully."
        );

        /*
         * Reload history immediately so the new request
         * appears on the same page.
         */

        await loadSupportRequests();
      } catch (
        submitError
      ) {
        setError(
          getHelpSupportErrorMessage(
            submitError
          )
        );
      } finally {
        setSending(
          false
        );
      }
    };

  return (
    <>
      <PageMeta
        title="Help & Support | Solar Trade Hub"
        description="Solar Trade Hub dashboard help and support."
      />

      <PageBreadcrumb
        pageTitle="Help & Support"
      />

      <div className="space-y-5">
        {/* =================================================
            HEADER
        ================================================== */}

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

          <div className="pointer-events-none absolute right-12 top-4 h-32 w-32 rounded-full bg-purple-500/5" />

          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
              <LifeBuoy
                size={22}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                Support Center
              </p>

              <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Help & Support
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Find help for Solar
                Trade Hub marketplace
                operations, users,
                settings and dashboard
                administration.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            QUICK HELP
        ================================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickHelpItems.map(
            (
              item
            ) => (
              <div
                key={
                  item.id
                }
                className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-purple-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-purple-500/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
                  {
                    item.icon
                  }
                </div>

                <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                  {
                    item.title
                  }
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  {
                    item.description
                  }
                </p>
              </div>
            )
          )}
        </div>

        {/* =================================================
            FAQ SECTION
        ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                <CircleHelp
                  size={18}
                />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Frequently Asked
                  Questions
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Common Solar Trade Hub
                  dashboard questions and
                  administrative guidance.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search help topics..."
                  className={`${inputClass} pl-11`}
                />
              </div>

              <select
                value={
                  categoryFilter
                }
                onChange={(
                  event
                ) =>
                  setCategoryFilter(
                    event.target
                      .value as
                      | SupportCategory
                      | ""
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  All Categories
                </option>

                <option value="General">
                  General
                </option>

                <option value="Products">
                  Products
                </option>

                <option value="Suppliers">
                  Suppliers
                </option>

                <option value="Installers">
                  Installers
                </option>

                <option value="Orders">
                  Orders
                </option>

                <option value="Users">
                  Users
                </option>

                <option value="Settings">
                  Settings
                </option>

                <option value="Technical">
                  Technical
                </option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredFaqs.map(
              (
                faq
              ) => {
                const opened =
                  openedFaq ===
                  faq.id;

                return (
                  <div
                    key={
                      faq.id
                    }
                    className="px-5 py-4 sm:px-6"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenedFaq(
                          opened
                            ? null
                            : faq.id
                        )
                      }
                      className="flex w-full items-start justify-between gap-4 text-left"
                    >
                      <div>
                        <div className="mb-1.5">
                          <span className="rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                            {
                              faq.category
                            }
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {
                            faq.question
                          }
                        </p>
                      </div>

                      <div className="mt-1 shrink-0 text-gray-400">
                        {opened ? (
                          <ChevronUp
                            size={18}
                          />
                        ) : (
                          <ChevronDown
                            size={18}
                          />
                        )}
                      </div>
                    </button>

                    {opened && (
                      <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                        {
                          faq.answer
                        }
                      </p>
                    )}
                  </div>
                );
              }
            )}

            {filteredFaqs.length ===
              0 && (
              <div className="px-6 py-14 text-center">
                <FileQuestion
                  size={34}
                  className="mx-auto text-gray-300 dark:text-gray-600"
                />

                <p className="mt-3 font-semibold text-gray-700 dark:text-gray-300">
                  No help topics found
                </p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try another keyword
                  or category.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            SUPPORT REQUEST
        ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                <MessageSquareText
                  size={18}
                />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Request Support
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Submit an internal
                  support request for
                  dashboard or
                  marketplace issues.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {success && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
                <CheckCircle2
                  size={17}
                  className="shrink-0"
                />

                <span>
                  {
                    success
                  }
                </span>
              </div>
            )}

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <TriangleAlert
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {
                    error
                  }
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <FormField
                label="Category"
              >
                <select
                  value={
                    formData.category
                  }
                  disabled={
                    sending
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "category",
                      event.target
                        .value as SupportCategory
                    )
                  }
                  className={
                    inputClass
                  }
                >
                  <option value="General">
                    General
                  </option>

                  <option value="Products">
                    Products
                  </option>

                  <option value="Suppliers">
                    Suppliers
                  </option>

                  <option value="Installers">
                    Installers
                  </option>

                  <option value="Orders">
                    Orders
                  </option>

                  <option value="Users">
                    Users
                  </option>

                  <option value="Settings">
                    Settings
                  </option>

                  <option value="Technical">
                    Technical
                  </option>
                </select>
              </FormField>

              <FormField
                label="Subject"
              >
                <input
                  type="text"
                  value={
                    formData.subject
                  }
                  disabled={
                    sending
                  }
                  maxLength={
                    200
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "subject",
                      event.target.value
                    )
                  }
                  placeholder="Briefly describe the issue"
                  className={
                    inputClass
                  }
                />

                <p className="mt-1.5 text-right text-[11px] text-gray-400">
                  {
                    formData.subject.length
                  }
                  /200
                </p>
              </FormField>

              <div className="lg:col-span-2">
                <FormField
                  label="Issue Details"
                >
                  <textarea
                    value={
                      formData.message
                    }
                    disabled={
                      sending
                    }
                    maxLength={
                      5000
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "message",
                        event.target.value
                      )
                    }
                    placeholder="Describe the problem, affected module and any relevant details..."
                    className={
                      textareaClass
                    }
                  />

                  <p className="mt-1.5 text-right text-[11px] text-gray-400">
                    {
                      formData.message.length
                    }
                    /5000
                  </p>
                </FormField>
              </div>

              <div className="lg:col-span-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      void handleSubmit();
                    }}
                    disabled={
                      sending
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? (
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Send
                        size={16}
                      />
                    )}

                    {sending
                      ? "Submitting..."
                      : "Submit Request"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            MY SUPPORT REQUESTS
        ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                <History
                  size={18}
                />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  My Support Requests
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {requestsTotal} request
                  {requestsTotal ===
                  1
                    ? ""
                    : "s"}{" "}
                  submitted from your
                  account.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                void loadSupportRequests();
              }}
              disabled={
                requestsLoading
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-400"
            >
              <RefreshCw
                size={14}
                className={
                  requestsLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          {requestsError && (
            <div className="m-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 sm:m-6">
              <TriangleAlert
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>
                {
                  requestsError
                }
              </span>
            </div>
          )}

          {requestsLoading ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {Array.from({
                length:
                  3,
              }).map(
                (
                  _,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="animate-pulse px-5 py-5 sm:px-6"
                  >
                    <div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-800" />

                    <div className="mt-3 h-3 w-full max-w-xl rounded bg-gray-100 dark:bg-gray-800/70" />

                    <div className="mt-3 h-3 w-28 rounded bg-gray-100 dark:bg-gray-800/70" />
                  </div>
                )
              )}
            </div>
          ) : requests.length >
            0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {requests.map(
                (
                  request
                ) => {
                  const opened =
                    openedRequest ===
                    request.id;

                  return (
                    <div
                      key={
                        request.id
                      }
                      className="px-5 py-4 sm:px-6"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenedRequest(
                            opened
                              ? null
                              : request.id
                          )
                        }
                        className="flex w-full items-start justify-between gap-4 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                              {
                                request.category
                              }
                            </span>

                            <span
                              className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${getStatusClass(
                                request.status
                              )}`}
                            >
                              {getStatusLabel(
                                request.status
                              )}
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                            {
                              request.subject
                            }
                          </p>

                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Clock3
                              size={13}
                            />

                            {formatDateTime(
                              request.createdAt
                            )}
                          </div>
                        </div>

                        <div className="mt-1 shrink-0 text-gray-400">
                          {opened ? (
                            <ChevronUp
                              size={18}
                            />
                          ) : (
                            <ChevronDown
                              size={18}
                            />
                          )}
                        </div>
                      </button>

                      {opened && (
                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Issue Details
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-400">
                            {
                              request.message
                            }
                          </p>

                          {request.resolutionNote && (
                            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                              <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                                Resolution
                              </p>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-400">
                                {
                                  request.resolutionNote
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <MessageSquareText
                size={34}
                className="mx-auto text-gray-300 dark:text-gray-600"
              />

              <p className="mt-3 font-semibold text-gray-700 dark:text-gray-300">
                No support requests yet
              </p>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your submitted support
                requests will appear here.
              </p>
            </div>
          )}
        </section>

        {/* =================================================
            SUPPORT INFO
        ================================================== */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InfoCard
            icon={
              <Mail
                size={18}
              />
            }
            title="Email Support"
            description="Email support configuration can be connected to the platform's saved support contact and SMTP settings when escalation workflows are introduced."
          />

          <InfoCard
            icon={
              <ShieldCheck
                size={18}
              />
            }
            title="Administrative Support"
            description="Support requests are associated with the authenticated dashboard user and can only be retrieved by that account through the current API."
          />
        </div>
      </div>
    </>
  );
};

/* =========================================================
   FORM FIELD
========================================================= */

const FormField = ({
  label,
  children,
}: {
  label:
    string;

  children:
    ReactNode;
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {
          label
        }
      </label>

      {
        children
      }
    </div>
  );
};

/* =========================================================
   INFO CARD
========================================================= */

const InfoCard = ({
  icon,
  title,
  description,
}: {
  icon:
    ReactNode;

  title:
    string;

  description:
    string;
}) => {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
        {
          icon
        }
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {
            title
          }
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
          {
            description
          }
        </p>
      </div>
    </div>
  );
};

export default HelpSupport;