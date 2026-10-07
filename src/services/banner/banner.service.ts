import api from "../api";

/* =========================================================
   TYPES
========================================================= */

export type BannerStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "expired";

export type BannerPlacement =
  | "homepage_hero"
  | "homepage_promo"
  | "products_page"
  | "tenders_page"
  | "suppliers_page";

export type Banner = {
  _id: string;

  id: string;

  bannerId: string;

  title: string;

  description: string;

  image: string;

  buttonText: string;

  buttonLink: string;

  placement: BannerPlacement;

  startDate: string | null;

  endDate: string | null;

  status: BannerStatus;

  visible: boolean;

  createdBy?: string | null;

  updatedBy?: string | null;

  createdAt?: string | null;

  updatedAt?: string | null;
};

/* =========================================================
   SUMMARY
========================================================= */

export type BannerSummary = {
  total: number;

  active: number;

  scheduled: number;

  expired: number;

  draft: number;

  visible: number;

  hidden: number;
};

/* =========================================================
   PAGINATION
========================================================= */

export type BannerPagination = {
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

export type BannerListParams = {
  page?: number;

  limit?: number;

  search?: string;

  status?: BannerStatus | "";

  placement?: BannerPlacement | "";

  visible?: boolean;

  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "title"
    | "startDate"
    | "endDate"
    | "status"
    | "placement";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   CREATE / UPDATE PAYLOAD

   image remains optional because actual image upload is now
   handled by multipart/form-data through uploadBannerImage().
========================================================= */

export type BannerPayload = {
  title: string;

  description?: string;

  image?: string;

  buttonText?: string;

  buttonLink?: string;

  placement:
    BannerPlacement;

  startDate?:
    | string
    | null;

  endDate?:
    | string
    | null;

  status:
    BannerStatus;

  visible: boolean;
};

export type UpdateBannerPayload =
  Partial<BannerPayload>;

/* =========================================================
   PUBLIC BANNER
========================================================= */

export type PublicBanner = {
  bannerId: string;

  title: string;

  description: string;

  image: string;

  buttonText: string;

  buttonLink: string;

  placement: BannerPlacement;

  startDate: string | null;

  endDate: string | null;
};

/* =========================================================
   API RESPONSES
========================================================= */

type BannerResponse = {
  success: boolean;

  message?: string;

  data?: {
    banner?: Banner;
  };
};

type BannerListResponse = {
  success: boolean;

  message?: string;

  data?: {
    banners?: Banner[];

    pagination?: BannerPagination;
  };
};

type BannerSummaryResponse = {
  success: boolean;

  message?: string;

  data?: {
    summary?: BannerSummary;
  };
};

type PublicBannerListResponse = {
  success: boolean;

  message?: string;

  data?: {
    banners?: PublicBanner[];
  };
};

/* =========================================================
   OPTIONS
========================================================= */

export const BANNER_PLACEMENT_OPTIONS: Array<{
  value: BannerPlacement;

  label: string;
}> = [
  {
    value:
      "homepage_hero",

    label:
      "Homepage Hero",
  },

  {
    value:
      "homepage_promo",

    label:
      "Homepage Promo",
  },

  {
    value:
      "products_page",

    label:
      "Products Page",
  },

  {
    value:
      "tenders_page",

    label:
      "Tenders Page",
  },

  {
    value:
      "suppliers_page",

    label:
      "Suppliers Page",
  },
];

export const BANNER_STATUS_OPTIONS: Array<{
  value: BannerStatus;

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
      "scheduled",

    label:
      "Scheduled",
  },

  {
    value:
      "active",

    label:
      "Active",
  },

  {
    value:
      "expired",

    label:
      "Expired",
  },
];

/* =========================================================
   DEFAULT EMPTY FORM
========================================================= */

export const EMPTY_BANNER_FORM: BannerPayload =
  {
    title: "",

    description: "",

    image: "",

    buttonText: "",

    buttonLink: "",

    placement:
      "homepage_promo",

    startDate: "",

    endDate: "",

    status:
      "draft",

    visible:
      true,
  };

/* =========================================================
   IMAGE CONFIGURATION

   Must stay aligned with backend Multer configuration.

   Allowed:
   JPG
   JPEG
   PNG
   WEBP
   AVIF

   Maximum:
   10 MB
========================================================= */

const ALLOWED_BANNER_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
  ]);

export const MAX_BANNER_IMAGE_SIZE =
  10 * 1024 * 1024;

/* =========================================================
   NORMALIZE BANNER
========================================================= */

const normalizeBanner = (
  value?: Partial<Banner> | null
): Banner => {
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

    bannerId:
      String(
        value?.bannerId ||
          ""
      ),

    title:
      String(
        value?.title ||
          ""
      ),

    description:
      String(
        value?.description ||
          ""
      ),

    image:
      String(
        value?.image ||
          ""
      ),

    buttonText:
      String(
        value?.buttonText ||
          ""
      ),

    buttonLink:
      String(
        value?.buttonLink ||
          ""
      ),

    placement:
      (value?.placement ||
        "homepage_promo") as BannerPlacement,

    startDate:
      value?.startDate ||
      null,

    endDate:
      value?.endDate ||
      null,

    status:
      (value?.status ||
        "draft") as BannerStatus,

    visible:
      value?.visible !==
      false,

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
   NORMALIZE SUMMARY
========================================================= */

const normalizeSummary = (
  value?: Partial<BannerSummary> | null
): BannerSummary => {
  return {
    total:
      Number(
        value?.total ||
          0
      ),

    active:
      Number(
        value?.active ||
          0
      ),

    scheduled:
      Number(
        value?.scheduled ||
          0
      ),

    expired:
      Number(
        value?.expired ||
          0
      ),

    draft:
      Number(
        value?.draft ||
          0
      ),

    visible:
      Number(
        value?.visible ||
          0
      ),

    hidden:
      Number(
        value?.hidden ||
          0
      ),
  };
};

/* =========================================================
   NORMALIZE PAGINATION
========================================================= */

const normalizePagination = (
  value?: Partial<BannerPagination> | null
): BannerPagination => {
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
   GET BANNERS

   GET
   /api/v1/content/banners
========================================================= */

export const getBanners =
  async (
    params: BannerListParams = {}
  ): Promise<{
    banners: Banner[];

    pagination: BannerPagination;
  }> => {
    const response =
      await api.get<BannerListResponse>(
        "/content/banners",
        {
          params,
        }
      );

    const banners =
      response.data
        ?.data
        ?.banners;

    const pagination =
      response.data
        ?.data
        ?.pagination;

    return {
      banners:
        Array.isArray(
          banners
        )
          ? banners.map(
              normalizeBanner
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
   /api/v1/content/banners/summary
========================================================= */

export const getBannerSummary =
  async (): Promise<BannerSummary> => {
    const response =
      await api.get<BannerSummaryResponse>(
        "/content/banners/summary"
      );

    return normalizeSummary(
      response.data
        ?.data
        ?.summary
    );
  };

/* =========================================================
   GET SINGLE

   GET
   /api/v1/content/banners/:bannerId
========================================================= */

export const getBanner =
  async (
    bannerId: string
  ): Promise<Banner> => {
    const response =
      await api.get<BannerResponse>(
        `/content/banners/${encodeURIComponent(
          bannerId
        )}`
      );

    const banner =
      response.data
        ?.data
        ?.banner;

    if (!banner) {
      throw new Error(
        "Banner was not returned by the server."
      );
    }

    return normalizeBanner(
      banner
    );
  };

/* =========================================================
   CREATE

   POST
   /api/v1/content/banners
========================================================= */

export const createBanner =
  async (
    payload: BannerPayload
  ): Promise<Banner> => {
    const response =
      await api.post<BannerResponse>(
        "/content/banners",
        payload
      );

    const banner =
      response.data
        ?.data
        ?.banner;

    if (!banner) {
      throw new Error(
        "Created banner was not returned by the server."
      );
    }

    return normalizeBanner(
      banner
    );
  };

/* =========================================================
   UPDATE

   PATCH
   /api/v1/content/banners/:bannerId
========================================================= */

export const updateBanner =
  async (
    bannerId: string,
    payload: UpdateBannerPayload
  ): Promise<Banner> => {
    const response =
      await api.patch<BannerResponse>(
        `/content/banners/${encodeURIComponent(
          bannerId
        )}`,
        payload
      );

    const banner =
      response.data
        ?.data
        ?.banner;

    if (!banner) {
      throw new Error(
        "Updated banner was not returned by the server."
      );
    }

    return normalizeBanner(
      banner
    );
  };

/* =========================================================
   UPLOAD / REPLACE BANNER IMAGE

   POST
   /api/v1/content/banners/:bannerId/image

   Content-Type:
   multipart/form-data

   Field:
   image

   IMPORTANT:

   Do not manually set the multipart Content-Type.
   Browser/Axios generates the boundary automatically.
========================================================= */

export const uploadBannerImage =
  async (
    bannerId: string,
    file: File
  ): Promise<Banner> => {
    if (
      !bannerId?.trim()
    ) {
      throw new Error(
        "Banner ID is required."
      );
    }

    if (!file) {
      throw new Error(
        "Please select a banner image."
      );
    }

    const validationError =
      validateBannerImageFile(
        file
      );

    if (
      validationError
    ) {
      throw new Error(
        validationError
      );
    }

    const formData =
      new FormData();

    formData.append(
      "image",
      file
    );

    const response =
      await api.post<BannerResponse>(
        `/content/banners/${encodeURIComponent(
          bannerId
        )}/image`,
        formData
      );

    const banner =
      response.data
        ?.data
        ?.banner;

    if (!banner) {
      throw new Error(
        "Uploaded banner image was not returned by the server."
      );
    }

    return normalizeBanner(
      banner
    );
  };

/* =========================================================
   UPDATE STATUS

   PATCH
   /api/v1/content/banners/:bannerId/status
========================================================= */

export const updateBannerStatus =
  async (
    bannerId: string,
    status: BannerStatus
  ): Promise<Banner> => {
    const response =
      await api.patch<BannerResponse>(
        `/content/banners/${encodeURIComponent(
          bannerId
        )}/status`,
        {
          status,
        }
      );

    const banner =
      response.data
        ?.data
        ?.banner;

    if (!banner) {
      throw new Error(
        "Updated banner was not returned by the server."
      );
    }

    return normalizeBanner(
      banner
    );
  };

/* =========================================================
   UPDATE VISIBILITY

   PATCH
   /api/v1/content/banners/:bannerId/visibility
========================================================= */

export const updateBannerVisibility =
  async (
    bannerId: string,
    visible: boolean
  ): Promise<Banner> => {
    const response =
      await api.patch<BannerResponse>(
        `/content/banners/${encodeURIComponent(
          bannerId
        )}/visibility`,
        {
          visible,
        }
      );

    const banner =
      response.data
        ?.data
        ?.banner;

    if (!banner) {
      throw new Error(
        "Updated banner was not returned by the server."
      );
    }

    return normalizeBanner(
      banner
    );
  };

/* =========================================================
   DELETE

   DELETE
   /api/v1/content/banners/:bannerId
========================================================= */

export const deleteBanner =
  async (
    bannerId: string
  ): Promise<Banner> => {
    const response =
      await api.delete<BannerResponse>(
        `/content/banners/${encodeURIComponent(
          bannerId
        )}`
      );

    const banner =
      response.data
        ?.data
        ?.banner;

    if (!banner) {
      throw new Error(
        "Deleted banner information was not returned by the server."
      );
    }

    return normalizeBanner(
      banner
    );
  };

/* =========================================================
   PUBLIC BANNERS

   GET
   /api/v1/content/banners/public
========================================================= */

export const getPublicBanners =
  async (
    placement?: BannerPlacement
  ): Promise<PublicBanner[]> => {
    const response =
      await api.get<PublicBannerListResponse>(
        "/content/banners/public",
        {
          params:
            placement
              ? {
                  placement,
                }
              : undefined,
        }
      );

    const banners =
      response.data
        ?.data
        ?.banners;

    return Array.isArray(
      banners
    )
      ? banners
      : [];
  };

/* =========================================================
   FORMAT STATUS
========================================================= */

export const formatBannerStatus =
  (
    status:
      | BannerStatus
      | string
  ) => {
    switch (
      String(
        status
      ).toLowerCase()
    ) {
      case "active":
        return "Active";

      case "scheduled":
        return "Scheduled";

      case "expired":
        return "Expired";

      case "draft":
        return "Draft";

      default:
        return status;
    }
  };

/* =========================================================
   FORMAT PLACEMENT
========================================================= */

export const formatBannerPlacement =
  (
    placement:
      | BannerPlacement
      | string
  ) => {
    const match =
      BANNER_PLACEMENT_OPTIONS.find(
        (
          option
        ) =>
          option.value ===
          placement
      );

    return (
      match?.label ||
      placement
    );
  };

/* =========================================================
   DATE INPUT VALUE
========================================================= */

export const getBannerDateInputValue =
  (
    value?:
      | string
      | null
  ) => {
    if (!value) {
      return "";
    }

    return String(
      value
    ).slice(
      0,
      10
    );
  };

/* =========================================================
   FORMAT DATE
========================================================= */

export const formatBannerDate =
  (
    value?:
      | string
      | null
  ) => {
    if (!value) {
      return "—";
    }

    /*
     * Backend returns date-only values.
     *
     * Midday prevents local timezone conversion from
     * displaying the previous calendar day.
     */

    const date =
      /^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
        ? new Date(
            `${value}T12:00:00`
          )
        : new Date(
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
   IMAGE URL

   Backend stores:

   /uploads/banners/filename.webp

   Dashboard displays:

   http://localhost:xxxx/uploads/banners/filename.webp

   Production resolves against backend origin automatically.
========================================================= */

export const resolveBannerImageUrl =
  (
    image?:
      | string
      | null
  ) => {
    const value =
      String(
        image ||
          ""
      ).trim();

    if (!value) {
      return "";
    }

    /*
     * Already usable URL.
     */

    if (
      /^https?:\/\//i.test(
        value
      ) ||
      value.startsWith(
        "data:"
      ) ||
      value.startsWith(
        "blob:"
      )
    ) {
      return value;
    }

    try {
      const baseURL =
        api.defaults
          .baseURL ||
        "";

      if (!baseURL) {
        return value;
      }

      const backendOrigin =
        new URL(
          baseURL,
          window.location.origin
        ).origin;

      return new URL(
        value.startsWith(
          "/"
        )
          ? value
          : `/${value}`,
        backendOrigin
      ).toString();
    } catch {
      return value;
    }
  };

/* =========================================================
   VALIDATE IMAGE FILE

   Mirrors backend Multer rules.
========================================================= */

export const validateBannerImageFile =
  (
    file: File
  ): string | null => {
    if (!file) {
      return "Please select a banner image.";
    }

    if (
      !ALLOWED_BANNER_IMAGE_TYPES.has(
        file.type
      )
    ) {
      return "Only JPG, JPEG, PNG, WEBP and AVIF images are allowed.";
    }

    if (
      file.size >
      MAX_BANNER_IMAGE_SIZE
    ) {
      return "Banner image must be 10 MB or smaller.";
    }

    if (
      file.size <=
      0
    ) {
      return "Selected banner image is empty.";
    }

    return null;
  };

/* =========================================================
   FORMAT IMAGE FILE SIZE
========================================================= */

export const formatBannerImageFileSize =
  (
    bytes: number
  ) => {
    if (
      !Number.isFinite(
        bytes
      ) ||
      bytes <=
        0
    ) {
      return "0 B";
    }

    if (
      bytes <
      1024
    ) {
      return `${bytes} B`;
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${(
        bytes /
        1024
      ).toFixed(
        1
      )} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(
      1
    )} MB`;
  };

/* =========================================================
   ERROR MESSAGE
========================================================= */

export const getBannerErrorMessage =
  (
    error: unknown,
    fallback =
      "Something went wrong while processing banner data."
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

      const responseErrors =
        candidate.response
          ?.data
          ?.errors;

      if (
        Array.isArray(
          responseErrors
        ) &&
        responseErrors.length >
          0
      ) {
        const messages =
          responseErrors
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