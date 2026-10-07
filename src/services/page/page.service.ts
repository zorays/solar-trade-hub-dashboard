import api from "../api";

/* =========================================================
   TYPES
========================================================= */

export type PageStatus =
  | "draft"
  | "published";

export type PageType =
  | "informational"
  | "policy"
  | "guide"
  | "support";

export type ContentPage = {
  _id: string;

  id: string;

  title: string;

  slug: string;

  type: PageType;

  excerpt: string;

  content: string;

  seoTitle: string;

  seoDescription: string;

  status: PageStatus;

  publishedAt?: string | null;

  createdBy?: string | null;

  updatedBy?: string | null;

  createdAt?: string | null;

  updatedAt?: string | null;
};

/* =========================================================
   PUBLIC PAGE
========================================================= */

export type PublicContentPage = {
  title: string;

  slug: string;

  type: PageType;

  excerpt: string;

  content: string;

  seoTitle: string;

  seoDescription: string;

  publishedAt?: string | null;

  updatedAt?: string | null;
};

/* =========================================================
   SUMMARY
========================================================= */

export type PageSummary = {
  total: number;

  published: number;

  draft: number;

  policy: number;

  informational: number;

  guide: number;

  support: number;
};

/* =========================================================
   PAGINATION
========================================================= */

export type PagePagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
};

/* =========================================================
   LIST QUERY
========================================================= */

export type PageListParams = {
  page?: number;

  limit?: number;

  search?: string;

  status?:
    | PageStatus
    | "";

  type?:
    | PageType
    | "";

  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "publishedAt"
    | "title"
    | "slug"
    | "type"
    | "status";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   CREATE / UPDATE PAYLOAD
========================================================= */

export type PagePayload = {
  title: string;

  slug: string;

  type:
    PageType;

  excerpt?: string;

  content?: string;

  seoTitle?: string;

  seoDescription?: string;

  status:
    PageStatus;
};

export type UpdatePagePayload =
  Partial<PagePayload>;

/* =========================================================
   DELETE RESPONSE
========================================================= */

export type DeletedPage = {
  _id: string;

  id: string;

  title: string;

  slug: string;
};

/* =========================================================
   API RESPONSES
========================================================= */

type PageResponse = {
  success: boolean;

  message?: string;

  data?: {
    page?: ContentPage;
  };
};

type DeletedPageResponse = {
  success: boolean;

  message?: string;

  data?: {
    page?: DeletedPage;
  };
};

type PageListResponse = {
  success: boolean;

  message?: string;

  data?: {
    pages?: ContentPage[];

    pagination?: PagePagination;
  };
};

type PageSummaryResponse = {
  success: boolean;

  message?: string;

  data?: {
    summary?: PageSummary;
  };
};

type PublicPageResponse = {
  success: boolean;

  message?: string;

  data?: {
    page?: PublicContentPage;
  };
};

type PublicPageListResponse = {
  success: boolean;

  message?: string;

  data?: {
    pages?: PublicContentPage[];
  };
};

/* =========================================================
   OPTIONS
========================================================= */

export const PAGE_TYPE_OPTIONS: Array<{
  value: PageType;

  label: string;
}> = [
  {
    value:
      "informational",

    label:
      "Informational",
  },

  {
    value:
      "policy",

    label:
      "Policy",
  },

  {
    value:
      "guide",

    label:
      "Guide",
  },

  {
    value:
      "support",

    label:
      "Support",
  },
];

export const PAGE_STATUS_OPTIONS: Array<{
  value: PageStatus;

  label: string;
}> = [
  {
    value:
      "draft",

    label:
      "Draft",
  },

  {
    value:
      "published",

    label:
      "Published",
  },
];

/* =========================================================
   EMPTY FORM
========================================================= */

export const EMPTY_PAGE_FORM: PagePayload =
  {
    title: "",

    slug: "",

    type:
      "informational",

    excerpt: "",

    content: "",

    seoTitle: "",

    seoDescription: "",

    status:
      "draft",
  };

/* =========================================================
   NORMALIZE PAGE
========================================================= */

const normalizePage = (
  value?:
    | Partial<ContentPage>
    | null
): ContentPage => {
  return {
    _id:
      String(
        value?._id ||
          ""
      ),

    id:
      String(
        value?.id ||
          value?._id ||
          ""
      ),

    title:
      String(
        value?.title ||
          ""
      ),

    slug:
      String(
        value?.slug ||
          ""
      ),

    type:
      (value?.type ||
        "informational") as PageType,

    excerpt:
      String(
        value?.excerpt ||
          ""
      ),

    content:
      String(
        value?.content ||
          ""
      ),

    seoTitle:
      String(
        value?.seoTitle ||
          ""
      ),

    seoDescription:
      String(
        value?.seoDescription ||
          ""
      ),

    status:
      (value?.status ||
        "draft") as PageStatus,

    publishedAt:
      value?.publishedAt ??
      null,

    createdBy:
      value?.createdBy ??
      null,

    updatedBy:
      value?.updatedBy ??
      null,

    createdAt:
      value?.createdAt ??
      null,

    updatedAt:
      value?.updatedAt ??
      null,
  };
};

/* =========================================================
   NORMALIZE PUBLIC PAGE
========================================================= */

const normalizePublicPage = (
  value?:
    | Partial<PublicContentPage>
    | null
): PublicContentPage => {
  return {
    title:
      String(
        value?.title ||
          ""
      ),

    slug:
      String(
        value?.slug ||
          ""
      ),

    type:
      (value?.type ||
        "informational") as PageType,

    excerpt:
      String(
        value?.excerpt ||
          ""
      ),

    content:
      String(
        value?.content ||
          ""
      ),

    seoTitle:
      String(
        value?.seoTitle ||
          ""
      ),

    seoDescription:
      String(
        value?.seoDescription ||
          ""
      ),

    publishedAt:
      value?.publishedAt ??
      null,

    updatedAt:
      value?.updatedAt ??
      null,
  };
};

/* =========================================================
   NORMALIZE SUMMARY
========================================================= */

const normalizeSummary = (
  value?:
    | Partial<PageSummary>
    | null
): PageSummary => {
  return {
    total:
      Number(
        value?.total ||
          0
      ),

    published:
      Number(
        value?.published ||
          0
      ),

    draft:
      Number(
        value?.draft ||
          0
      ),

    policy:
      Number(
        value?.policy ||
          0
      ),

    informational:
      Number(
        value?.informational ||
          0
      ),

    guide:
      Number(
        value?.guide ||
          0
      ),

    support:
      Number(
        value?.support ||
          0
      ),
  };
};

/* =========================================================
   NORMALIZE PAGINATION
========================================================= */

const normalizePagination = (
  value?:
    | Partial<PagePagination>
    | null
): PagePagination => {
  return {
    page:
      Number(
        value?.page ||
          1
      ),

    limit:
      Number(
        value?.limit ||
          20
      ),

    total:
      Number(
        value?.total ||
          0
      ),

    totalPages:
      Number(
        value?.totalPages ||
          1
      ),

    hasNextPage:
      Boolean(
        value?.hasNextPage
      ),

    hasPreviousPage:
      Boolean(
        value?.hasPreviousPage
      ),
  };
};

/* =========================================================
   GET PAGES

   GET
   /api/v1/content/pages
========================================================= */

export const getPages =
  async (
    params: PageListParams = {}
  ): Promise<{
    pages: ContentPage[];

    pagination: PagePagination;
  }> => {
    const response =
      await api.get<PageListResponse>(
        "/content/pages",
        {
          params,
        }
      );

    const pages =
      response.data
        ?.data
        ?.pages;

    const pagination =
      response.data
        ?.data
        ?.pagination;

    return {
      pages:
        Array.isArray(
          pages
        )
          ? pages.map(
              normalizePage
            )
          : [],

      pagination:
        normalizePagination(
          pagination
        ),
    };
  };

/* =========================================================
   GET SUMMARY

   GET
   /api/v1/content/pages/summary
========================================================= */

export const getPageSummary =
  async (): Promise<PageSummary> => {
    const response =
      await api.get<PageSummaryResponse>(
        "/content/pages/summary"
      );

    return normalizeSummary(
      response.data
        ?.data
        ?.summary
    );
  };

/* =========================================================
   GET SINGLE PAGE

   GET
   /api/v1/content/pages/:pageId
========================================================= */

export const getPage =
  async (
    pageId: string
  ): Promise<ContentPage> => {
    const response =
      await api.get<PageResponse>(
        `/content/pages/${encodeURIComponent(
          pageId
        )}`
      );

    const page =
      response.data
        ?.data
        ?.page;

    if (!page) {
      throw new Error(
        "Page was not returned by the server."
      );
    }

    return normalizePage(
      page
    );
  };

/* =========================================================
   CREATE PAGE

   POST
   /api/v1/content/pages
========================================================= */

export const createPage =
  async (
    payload: PagePayload
  ): Promise<ContentPage> => {
    const response =
      await api.post<PageResponse>(
        "/content/pages",
        payload
      );

    const page =
      response.data
        ?.data
        ?.page;

    if (!page) {
      throw new Error(
        "Created page was not returned by the server."
      );
    }

    return normalizePage(
      page
    );
  };

/* =========================================================
   UPDATE PAGE

   PATCH
   /api/v1/content/pages/:pageId
========================================================= */

export const updatePage =
  async (
    pageId: string,
    payload: UpdatePagePayload
  ): Promise<ContentPage> => {
    const response =
      await api.patch<PageResponse>(
        `/content/pages/${encodeURIComponent(
          pageId
        )}`,
        payload
      );

    const page =
      response.data
        ?.data
        ?.page;

    if (!page) {
      throw new Error(
        "Updated page was not returned by the server."
      );
    }

    return normalizePage(
      page
    );
  };

/* =========================================================
   DELETE PAGE

   DELETE
   /api/v1/content/pages/:pageId
========================================================= */

export const deletePage =
  async (
    pageId: string
  ): Promise<DeletedPage> => {
    const response =
      await api.delete<DeletedPageResponse>(
        `/content/pages/${encodeURIComponent(
          pageId
        )}`
      );

    const page =
      response.data
        ?.data
        ?.page;

    if (!page) {
      throw new Error(
        "Deleted page information was not returned by the server."
      );
    }

    return {
      _id:
        String(
          page._id ||
            ""
        ),

      id:
        String(
          page.id ||
            page._id ||
            ""
        ),

      title:
        String(
          page.title ||
            ""
        ),

      slug:
        String(
          page.slug ||
            ""
        ),
    };
  };

/* =========================================================
   GET PUBLIC PAGES

   GET
   /api/v1/content/pages/public

   Optional:
   ?type=policy
========================================================= */

export const getPublicPages =
  async (
    type?: PageType
  ): Promise<
    PublicContentPage[]
  > => {
    const response =
      await api.get<PublicPageListResponse>(
        "/content/pages/public",
        {
          params:
            type
              ? {
                  type,
                }
              : undefined,
        }
      );

    const pages =
      response.data
        ?.data
        ?.pages;

    return Array.isArray(
      pages
    )
      ? pages.map(
          normalizePublicPage
        )
      : [];
  };

/* =========================================================
   GET PUBLIC PAGE BY SLUG

   GET
   /api/v1/content/pages/public/:slug
========================================================= */

export const getPublicPageBySlug =
  async (
    slug: string
  ): Promise<PublicContentPage> => {
    const normalizedSlug =
      generatePageSlug(
        slug
      );

    if (
      !normalizedSlug
    ) {
      throw new Error(
        "Page slug is required."
      );
    }

    const response =
      await api.get<PublicPageResponse>(
        `/content/pages/public/${encodeURIComponent(
          normalizedSlug
        )}`
      );

    const page =
      response.data
        ?.data
        ?.page;

    if (!page) {
      throw new Error(
        "Public page was not returned by the server."
      );
    }

    return normalizePublicPage(
      page
    );
  };

/* =========================================================
   GENERATE SLUG

   Same general behavior as backend normalization.
========================================================= */

export const generatePageSlug =
  (
    value: string
  ) => {
    return String(
      value ||
        ""
    )
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9\s-]/g,
        ""
      )
      .replace(
        /\s+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  };

/* =========================================================
   FORMAT TYPE
========================================================= */

export const formatPageType =
  (
    type:
      | PageType
      | string
  ) => {
    const match =
      PAGE_TYPE_OPTIONS.find(
        (
          option
        ) =>
          option.value ===
          type
      );

    return (
      match?.label ||
      type
    );
  };

/* =========================================================
   FORMAT STATUS
========================================================= */

export const formatPageStatus =
  (
    status:
      | PageStatus
      | string
  ) => {
    const match =
      PAGE_STATUS_OPTIONS.find(
        (
          option
        ) =>
          option.value ===
          status
      );

    return (
      match?.label ||
      status
    );
  };

/* =========================================================
   FORMAT DATE
========================================================= */

export const formatPageDate =
  (
    value?:
      | string
      | null
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
      return value;
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
      }
    ).format(
      date
    );
  };

/* =========================================================
   ERROR MESSAGE
========================================================= */

export const getPageErrorMessage =
  (
    error: unknown,
    fallback =
      "Something went wrong while processing page data."
  ) => {
    if (
      typeof error ===
        "object" &&
      error !==
        null
    ) {
      const candidate =
        error as {
          response?: {
            data?: {
              message?: string;

              errors?:
                | string[]
                | Array<{
                    message?: string;
                  }>;
            };
          };

          message?: string;
        };

      const errors =
        candidate.response
          ?.data
          ?.errors;

      if (
        Array.isArray(
          errors
        ) &&
        errors.length >
          0
      ) {
        const messages =
          errors
            .map(
              (
                item
              ) => {
                if (
                  typeof item ===
                  "string"
                ) {
                  return item;
                }

                return (
                  item?.message ||
                  ""
                );
              }
            )
            .filter(
              Boolean
            );

        if (
          messages.length >
          0
        ) {
          return messages.join(
            " "
          );
        }
      }

      const message =
        candidate.response
          ?.data
          ?.message;

      if (message) {
        return message;
      }

      if (
        candidate.message
      ) {
        return candidate.message;
      }
    }

    return fallback;
  };