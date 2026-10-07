import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  Globe2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  EMPTY_PAGE_FORM,
  PAGE_STATUS_OPTIONS,
  PAGE_TYPE_OPTIONS,
  createPage,
  deletePage,
  formatPageDate,
  formatPageStatus,
  formatPageType,
  generatePageSlug,
  getPageErrorMessage,
  getPages,
  getPageSummary,
  updatePage,
  type ContentPage,
  type PagePayload,
  type PageStatus,
  type PageSummary,
  type PageType,
} from "../../services/page/page.service";

/* =========================================================
   DEFAULT SUMMARY
========================================================= */

const EMPTY_SUMMARY: PageSummary = {
  total: 0,

  published: 0,

  draft: 0,

  policy: 0,

  informational: 0,

  guide: 0,

  support: 0,
};

/* =========================================================
   PAGE -> FORM
========================================================= */

const pageToForm = (
  page: ContentPage
): PagePayload => {
  return {
    title:
      page.title,

    slug:
      page.slug,

    type:
      page.type,

    excerpt:
      page.excerpt,

    content:
      page.content,

    seoTitle:
      page.seoTitle,

    seoDescription:
      page.seoDescription,

    status:
      page.status,
  };
};

/* =========================================================
   PAGE TYPE CLASSES
========================================================= */

const getTypeClasses = (
  type: PageType
) => {
  switch (type) {
    case "policy":
      return `
        bg-red-50
        text-red-700

        dark:bg-red-500/10
        dark:text-red-400
      `;

    case "guide":
      return `
        bg-purple-50
        text-purple-700

        dark:bg-purple-500/10
        dark:text-purple-400
      `;

    case "support":
      return `
        bg-orange-50
        text-orange-700

        dark:bg-orange-500/10
        dark:text-orange-400
      `;

    case "informational":
    default:
      return `
        bg-blue-50
        text-blue-700

        dark:bg-blue-500/10
        dark:text-blue-400
      `;
  }
};

/* =========================================================
   PUBLIC STOREFRONT URL

   Optional production env:

   VITE_STOREFRONT_URL=https://solartradehub.com

   Without it, dashboard falls back to /slug.
========================================================= */

const getPublicPageUrl = (
  slug: string
) => {
  const storefrontBaseUrl =
    String(
      import.meta.env
        .VITE_STOREFRONT_URL ||
        ""
    )
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  const cleanSlug =
    String(
      slug ||
        ""
    )
      .trim()
      .replace(
        /^\/+/,
        ""
      );

  if (
    storefrontBaseUrl
  ) {
    return `${storefrontBaseUrl}/${cleanSlug}`;
  }

  return `/${cleanSlug}`;
};

/* =========================================================
   PAGE
========================================================= */

const Pages = () => {
  const [
    pages,
    setPages,
  ] =
    useState<ContentPage[]>(
      []
    );

  const [
    summary,
    setSummary,
  ] =
    useState<PageSummary>(
      EMPTY_SUMMARY
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      PageStatus | ""
    >("");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<
      PageType | ""
    >("");

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
    deletingPageId,
    setDeletingPageId,
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    showModal,
    setShowModal,
  ] =
    useState(false);

  const [
    editingPageId,
    setEditingPageId,
  ] =
    useState<string | null>(
      null
    );

  const [
    formData,
    setFormData,
  ] =
    useState<PagePayload>({
      ...EMPTY_PAGE_FORM,
    });

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(
    () => {
      const timeout =
        window.setTimeout(
          () => {
            setDebouncedSearch(
              search.trim()
            );
          },
          350
        );

      return () => {
        window.clearTimeout(
          timeout
        );
      };
    },
    [
      search,
    ]
  );

  /* =======================================================
     LOAD SUMMARY
  ======================================================= */

  const loadSummary =
    useCallback(
      async () => {
        try {
          const data =
            await getPageSummary();

          setSummary(
            data
          );
        } catch (
          summaryError
        ) {
          setError(
            getPageErrorMessage(
              summaryError,
              "Unable to load page summary."
            )
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD PAGES
  ======================================================= */

  const loadPages =
    useCallback(
      async (
        showLoader =
          true
      ) => {
        try {
          if (
            showLoader
          ) {
            setLoading(
              true
            );
          }

          setError(
            ""
          );

          const result =
            await getPages({
              page: 1,

              limit: 100,

              search:
                debouncedSearch ||
                undefined,

              status:
                statusFilter ||
                undefined,

              type:
                typeFilter ||
                undefined,

              sortBy:
                "updatedAt",

              sortOrder:
                "desc",
            });

          setPages(
            result.pages
          );
        } catch (
          loadError
        ) {
          setError(
            getPageErrorMessage(
              loadError,
              "Unable to load pages."
            )
          );
        } finally {
          if (
            showLoader
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        debouncedSearch,
        statusFilter,
        typeFilter,
      ]
    );

  /* =======================================================
     INITIAL / FILTER LOAD
  ======================================================= */

  useEffect(
    () => {
      void loadPages();
    },
    [
      loadPages,
    ]
  );

  useEffect(
    () => {
      void loadSummary();
    },
    [
      loadSummary,
    ]
  );

  /* =======================================================
     DISPLAY LIST
  ======================================================= */

  const displayedPages =
    useMemo(
      () => pages,
      [
        pages,
      ]
    );

  /* =======================================================
     ADD PAGE
  ======================================================= */

  const openAddPage = () => {
    setEditingPageId(
      null
    );

    setFormData({
      ...EMPTY_PAGE_FORM,
    });

    setError(
      ""
    );

    setSuccess(
      ""
    );

    setShowModal(
      true
    );
  };

  /* =======================================================
     EDIT PAGE
  ======================================================= */

  const openEditPage = (
    page: ContentPage
  ) => {
    setEditingPageId(
      page.id ||
      page._id
    );

    setFormData(
      pageToForm(
        page
      )
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );

    setShowModal(
      true
    );
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (
      saving
    ) {
      return;
    }

    setShowModal(
      false
    );

    setEditingPageId(
      null
    );

    setFormData({
      ...EMPTY_PAGE_FORM,
    });

    setError(
      ""
    );
  };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const updateForm = <
    K extends keyof PagePayload,
  >(
    field: K,
    value: PagePayload[K]
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

    setError(
      ""
    );

    setSuccess(
      ""
    );
  };

  /* =======================================================
     TITLE CHANGE + AUTO SLUG / SEO TITLE
  ======================================================= */

  const handleTitleChange = (
    value: string
  ) => {
    setFormData(
      (
        current
      ) => {
        const previousTitle =
          current.title;

        const shouldUpdateSeoTitle =
          !current.seoTitle ||
          current.seoTitle ===
            previousTitle;

        return {
          ...current,

          title:
            value,

          slug:
            editingPageId
              ? current.slug
              : generatePageSlug(
                  value
                ),

          seoTitle:
            shouldUpdateSeoTitle
              ? value
              : current.seoTitle,
        };
      }
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );
  };

  /* =======================================================
     SLUG CHANGE
  ======================================================= */

  const handleSlugChange = (
    value: string
  ) => {
    updateForm(
      "slug",
      generatePageSlug(
        value
      )
    );
  };

  /* =======================================================
     SAVE PAGE
  ======================================================= */

  const handleSavePage =
    async () => {
      const title =
        formData.title.trim();

      const slug =
        generatePageSlug(
          formData.slug
        );

      if (
        !title
      ) {
        setError(
          "Page title is required."
        );

        return;
      }

      if (
        !slug
      ) {
        setError(
          "Page slug is required."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        const payload: PagePayload = {
          title,

          slug,

          type:
            formData.type,

          excerpt:
            formData.excerpt?.trim() ||
            "",

          /*
           * Do not trim page content aggressively.
           * Line breaks / formatting may be intentional.
           */
          content:
            formData.content ||
            "",

          seoTitle:
            formData.seoTitle?.trim() ||
            "",

          seoDescription:
            formData.seoDescription?.trim() ||
            "",

          status:
            formData.status,
        };

        if (
          editingPageId
        ) {
          await updatePage(
            editingPageId,
            payload
          );

          setSuccess(
            "Page updated successfully."
          );
        } else {
          await createPage(
            payload
          );

          setSuccess(
            "Page created successfully."
          );
        }

        setShowModal(
          false
        );

        setEditingPageId(
          null
        );

        setFormData({
          ...EMPTY_PAGE_FORM,
        });

        await Promise.all([
          loadPages(
            false
          ),

          loadSummary(),
        ]);
      } catch (
        saveError
      ) {
        setError(
          getPageErrorMessage(
            saveError,
            editingPageId
              ? "Unable to update page."
              : "Unable to create page."
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete =
    async (
      page: ContentPage
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${page.title}" page?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      const pageId =
        page.id ||
        page._id;

      try {
        setDeletingPageId(
          pageId
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        await deletePage(
          pageId
        );

        setSuccess(
          `"${page.title}" deleted successfully.`
        );

        await Promise.all([
          loadPages(
            false
          ),

          loadSummary(),
        ]);
      } catch (
        deleteError
      ) {
        setError(
          getPageErrorMessage(
            deleteError,
            "Unable to delete page."
          )
        );
      } finally {
        setDeletingPageId(
          null
        );
      }
    };

  /* =======================================================
     RETRY
  ======================================================= */

  const handleRetry =
    async () => {
      await Promise.all([
        loadPages(),
        loadSummary(),
      ]);
    };

  return (
    <>
      <PageMeta
        title="Pages | Solar Trade Hub"
        description="Manage Solar Trade Hub website pages."
      />

      <PageBreadcrumb
        pageTitle="Pages"
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
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                  <FileText
                    size={23}
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                    Content Management
                  </p>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Website Pages
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Manage informational, policy, guide and support pages for the Solar Trade Hub storefront.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  openAddPage
                }
                className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Plus
                  size={18}
                />

                Add Page
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error &&
          !showModal && (
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {error}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleRetry()
                }
                className="inline-flex items-center gap-2 self-start font-semibold transition hover:opacity-80 sm:self-auto"
              >
                <RefreshCw
                  size={14}
                />

                Retry
              </button>
            </div>
          )}

        {/* =================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
            <CheckCircle2
              size={17}
            />

            {success}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Pages"
            value={
              summary.total
            }
            icon={
              <FileText
                size={20}
              />
            }
            iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />

          <SummaryCard
            title="Published"
            value={
              summary.published
            }
            icon={
              <Globe2
                size={20}
              />
            }
            iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />

          <SummaryCard
            title="Drafts"
            value={
              summary.draft
            }
            icon={
              <Pencil
                size={20}
              />
            }
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
          />

          <SummaryCard
            title="Policy Pages"
            value={
              summary.policy
            }
            icon={
              <ShieldCheck
                size={20}
              />
            }
            iconClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          />
        </div>

        {/* =================================================
            LIST
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Storefront Pages
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {
                      displayedPages.length
                    }{" "}
                    page
                    {displayedPages.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    loaded
                  </p>
                </div>

                <div className="relative w-full lg:max-w-sm">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) => {
                      setSearch(
                        event.target
                          .value
                      );

                      setSuccess(
                        ""
                      );
                    }}
                    placeholder="Search title, slug or content..."
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={
                    typeFilter
                  }
                  onChange={(
                    event
                  ) => {
                    setTypeFilter(
                      event.target
                        .value as
                        | PageType
                        | ""
                    );

                    setSuccess(
                      ""
                    );
                  }}
                  className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-700 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="">
                    All Page Types
                  </option>

                  {PAGE_TYPE_OPTIONS.map(
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

                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) => {
                    setStatusFilter(
                      event.target
                        .value as
                        | PageStatus
                        | ""
                    );

                    setSuccess(
                      ""
                    );
                  }}
                  className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-700 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="">
                    All Statuses
                  </option>

                  {PAGE_STATUS_OPTIONS.map(
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
              </div>
            </div>
          </div>

          {/* ===============================================
              TABLE
          ================================================ */}

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw
                  size={24}
                  className="animate-spin text-purple-600"
                />

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading pages...
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                  <tr>
                    <TableHeading>
                      Page
                    </TableHeading>

                    <TableHeading>
                      Type
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Updated
                    </TableHeading>

                    <TableHeading align="right">
                      Action
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {displayedPages.map(
                    (
                      page
                    ) => {
                      const pageId =
                        page.id ||
                        page._id;

                      const deleteLoading =
                        deletingPageId ===
                        pageId;

                      return (
                        <tr
                          key={
                            pageId
                          }
                          className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                        >
                          {/* PAGE */}

                          <td className="px-5 py-5 align-top sm:px-6">
                            <div className="min-w-[320px]">
                              <div className="flex items-center gap-2">
                                <FileText
                                  size={16}
                                  className="shrink-0 text-purple-500"
                                />

                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {
                                    page.title
                                  }
                                </p>
                              </div>

                              <p className="mt-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                                /
                                {
                                  page.slug
                                }
                              </p>

                              <p className="mt-2 max-w-[430px] text-xs leading-5 text-gray-500 dark:text-gray-400">
                                {
                                  page.excerpt ||
                                  "No excerpt"
                                }
                              </p>
                            </div>
                          </td>

                          {/* TYPE */}

                          <td className="px-5 py-5 align-top">
                            <span
                              className={`
                                inline-flex
                                rounded-lg
                                px-2.5
                                py-1
                                text-xs
                                font-semibold

                                ${getTypeClasses(
                                  page.type
                                )}
                              `}
                            >
                              {formatPageType(
                                page.type
                              )}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-5 align-top">
                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-xs
                                font-semibold

                                ${
                                  page.status ===
                                  "published"
                                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
                                    : "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
                                }
                              `}
                            >
                              {page.status ===
                              "published" ? (
                                <CheckCircle2
                                  size={13}
                                />
                              ) : (
                                <Pencil
                                  size={12}
                                />
                              )}

                              {formatPageStatus(
                                page.status
                              )}
                            </span>
                          </td>

                          {/* UPDATED */}

                          <td className="px-5 py-5 align-top">
                            <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                              {formatPageDate(
                                page.updatedAt
                              )}
                            </span>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-5 text-right align-top sm:px-6">
                            <div className="flex min-w-[265px] items-center justify-end gap-2">
                              {page.status ===
                              "published" ? (
                                <a
                                  href={
                                    getPublicPageUrl(
                                      page.slug
                                    )
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                                >
                                  <Eye
                                    size={14}
                                  />

                                  View
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  title="Publish this page before viewing it publicly."
                                  className="inline-flex h-9 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-400 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-600"
                                >
                                  <Eye
                                    size={14}
                                  />

                                  View
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  openEditPage(
                                    page
                                  )
                                }
                                disabled={
                                  deleteLoading
                                }
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
                              >
                                <Pencil
                                  size={14}
                                />

                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deleteLoading
                                }
                                onClick={() =>
                                  void handleDelete(
                                    page
                                  )
                                }
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                              >
                                {deleteLoading ? (
                                  <RefreshCw
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={14}
                                  />
                                )}

                                {deleteLoading
                                  ? "Deleting"
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}

                  {displayedPages.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center"
                      >
                        <BookOpen
                          size={34}
                          className="mx-auto text-gray-300 dark:text-gray-600"
                        />

                        <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
                          No pages found
                        </p>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {debouncedSearch ||
                          statusFilter ||
                          typeFilter
                            ? "Try changing your search or filters."
                            : "Create your first storefront page."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT PAGE MODAL
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                  Content Management
                </p>

                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {editingPageId
                    ? "Edit Page"
                    : "Add Page"}
                </h3>

                {editingPageId && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Mongo ID:{" "}
                    {
                      editingPageId
                    }
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            {/* MODAL ERROR */}

            {error && (
              <div className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 sm:mx-6">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {error}
                </span>
              </div>
            )}

            {/* BODY */}

            <div className="space-y-7 p-5 sm:p-6">
              {/* =============================================
                  BASIC
              ============================================== */}

              <div>
                <SectionTitle
                  title="Page Information"
                  description="Basic storefront page information."
                />

                <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <FormField
                    label="Page Title"
                    required
                  >
                    <input
                      type="text"
                      value={
                        formData.title
                      }
                      onChange={(
                        event
                      ) =>
                        handleTitleChange(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        saving
                      }
                      className="sth-page-input"
                    />
                  </FormField>

                  <FormField
                    label="URL Slug"
                    required
                  >
                    <div className="flex">
                      <span className="flex h-11 items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400">
                        /
                      </span>

                      <input
                        type="text"
                        value={
                          formData.slug
                        }
                        onChange={(
                          event
                        ) =>
                          handleSlugChange(
                            event.target
                              .value
                          )
                        }
                        disabled={
                          saving
                        }
                        className="sth-page-input rounded-l-none"
                      />
                    </div>

                    <p className="mt-1.5 text-xs text-gray-400">
                      Public URL: /
                      {
                        formData.slug ||
                        "page-slug"
                      }
                    </p>
                  </FormField>

                  <FormField
                    label="Page Type"
                  >
                    <select
                      value={
                        formData.type
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "type",
                          event.target
                            .value as PageType
                        )
                      }
                      disabled={
                        saving
                      }
                      className="sth-page-input"
                    >
                      {PAGE_TYPE_OPTIONS.map(
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
                  </FormField>

                  <FormField
                    label="Status"
                  >
                    <select
                      value={
                        formData.status
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "status",
                          event.target
                            .value as PageStatus
                        )
                      }
                      disabled={
                        saving
                      }
                      className="sth-page-input"
                    >
                      {PAGE_STATUS_OPTIONS.map(
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
                  </FormField>

                  <div className="lg:col-span-2">
                    <FormField
                      label="Short Description / Excerpt"
                    >
                      <textarea
                        rows={3}
                        value={
                          formData.excerpt ||
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "excerpt",
                            event.target
                              .value
                          )
                        }
                        disabled={
                          saving
                        }
                        maxLength={
                          1500
                        }
                        className="sth-page-textarea"
                      />

                      <p className="mt-1.5 text-xs text-gray-400">
                        {
                          (
                            formData.excerpt ||
                            ""
                          ).length
                        }
                        /1500 characters
                      </p>
                    </FormField>
                  </div>
                </div>
              </div>

              {/* =============================================
                  CONTENT
              ============================================== */}

              <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
                <SectionTitle
                  title="Page Content"
                  description="Main public content displayed on the page."
                />

                <div className="mt-4">
                  <FormField
                    label="Content"
                  >
                    <textarea
                      rows={12}
                      value={
                        formData.content ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "content",
                          event.target
                            .value
                        )
                      }
                      disabled={
                        saving
                      }
                      placeholder="Page content..."
                      className="sth-page-textarea"
                    />

                    <p className="mt-1.5 text-xs text-gray-400">
                      {
                        (
                          formData.content ||
                          ""
                        ).length
                      }{" "}
                      characters
                    </p>
                  </FormField>
                </div>
              </div>

              {/* =============================================
                  SEO
              ============================================== */}

              <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
                <SectionTitle
                  title="SEO"
                  description="Search engine title and description for this page."
                />

                <div className="mt-4 grid grid-cols-1 gap-5">
                  <FormField
                    label="SEO Title"
                  >
                    <input
                      type="text"
                      value={
                        formData.seoTitle ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "seoTitle",
                          event.target
                            .value
                        )
                      }
                      disabled={
                        saving
                      }
                      maxLength={
                        180
                      }
                      className="sth-page-input"
                    />

                    <p className="mt-1.5 text-xs text-gray-400">
                      {
                        (
                          formData.seoTitle ||
                          ""
                        ).length
                      }
                      /180 characters
                    </p>
                  </FormField>

                  <FormField
                    label="SEO Description"
                  >
                    <textarea
                      rows={3}
                      value={
                        formData.seoDescription ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "seoDescription",
                          event.target
                            .value
                        )
                      }
                      disabled={
                        saving
                      }
                      maxLength={
                        500
                      }
                      className="sth-page-textarea"
                    />

                    <p className="mt-1.5 text-xs text-gray-400">
                      {
                        (
                          formData.seoDescription ||
                          ""
                        ).length
                      }
                      /500 characters
                    </p>
                  </FormField>
                </div>
              </div>

              {/* =============================================
                  PUBLISH NOTE
              ============================================== */}

              <div className="rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-xs leading-5 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                Draft pages remain private. Only pages with Published status are available through the public storefront Pages API.
              </div>
            </div>

            {/* FOOTER */}

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleSavePage()
                }
                disabled={
                  saving
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2
                    size={16}
                  />
                )}

                {saving
                  ? "Saving..."
                  : editingPageId
                    ? "Save Changes"
                    : "Create Page"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          INPUT STYLES
      ====================================================== */}

      <style>
        {`
          .sth-page-input,
          .sth-page-textarea {
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
              box-shadow 150ms ease;
          }

          .sth-page-input {
            height: 44px;
          }

          .sth-page-textarea {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
            resize: vertical;
          }

          .sth-page-input:focus,
          .sth-page-textarea:focus {
            border-color: rgb(147 51 234);
            box-shadow:
              0 0 0 1px rgb(147 51 234);
          }

          .sth-page-input:disabled,
          .sth-page-textarea:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          .dark .sth-page-input,
          .dark .sth-page-textarea {
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
   FORM FIELD
========================================================= */

const FormField = ({
  label,
  required = false,
  children,
}: {
  label: string;

  required?: boolean;

  children: ReactNode;
}) => {
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
};

/* =========================================================
   SECTION TITLE
========================================================= */

const SectionTitle = ({
  title,
  description,
}: {
  title: string;

  description: string;
}) => {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h4>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;

  value: number;

  icon: ReactNode;

  iconClass: string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   TABLE HEADING
========================================================= */

const TableHeading = ({
  children,
  align = "left",
}: {
  children: ReactNode;

  align?:
    | "left"
    | "right";
}) => {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6 ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
};

export default Pages;