import api from "../api";

/* =========================================================
   DEAL TYPES
========================================================= */

export type DealStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "expired";

export type DealDiscountType =
  | "percentage"
  | "fixed";

export type DealCurrency =
  | "PKR"
  | "USD";

/* =========================================================
   PRODUCT IMAGE
========================================================= */

export type DealProductImage = {
  _id?: string | null;

  url: string;

  alt: string;

  isPrimary: boolean;

  sortOrder: number;
};

/* =========================================================
   PRODUCT PRICING

   Matches actual Product model:

   pricing.sellingPrice
   pricing.oldPrice
========================================================= */

export type DealProductPricing = {
  currency: DealCurrency;

  sellingPrice: number;

  oldPrice: number | null;
};

/* =========================================================
   PRODUCT REFERENCE
========================================================= */

export type DealProduct = {
  _id: string;

  /*
   * External Rate List identity.
   *
   * Legacy productId is retained only for compatibility with
   * older Deal records while backend migration completes.
   */
  externalProductId?: string | null;
  externalCatalogId?: string | null;
  productId?: string | null;

  name?: string;
  sku?: string;
  type?: string | null;
  brand?: string | { id?: string | null; name?: string | null } | null;
  category?: string | { id?: string | null; name?: string | null } | null;

  model?: string;
  capacityRating?: string;

  rate?: number | null;
  pricing?: DealProductPricing | null;

  imageUrl?: string | null;
  imageThumbUrl?: string | null;

  images: DealProductImage[];
  primaryImage: DealProductImage | null;

  status?: string | null;
};

/* =========================================================
   DEAL
========================================================= */

export type Deal = {
  _id: string;

  id?: string;

  dealId: string;

  title: string;

  product: DealProduct | null;

  discountType: DealDiscountType;

  discountValue: number;

  originalPrice: number;

  dealPrice: number;

  currency: DealCurrency;

  startDate: string;

  endDate: string;

  status: DealStatus;

  createdBy?:
    | string
    | null;

  updatedBy?:
    | string
    | null;

  createdAt?: string;

  updatedAt?: string;
};

/* =========================================================
   SUMMARY
========================================================= */

export type DealSummary = {
  total: number;

  draft: number;

  scheduled: number;

  active: number;

  expired: number;
};

/* =========================================================
   PAGINATION
========================================================= */

export type DealPagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
};

/* =========================================================
   LIST PARAMS
========================================================= */

export type GetDealsParams = {
  page?: number;

  limit?: number;

  search?: string;

  status?: DealStatus;

  product?: string;

  discountType?: DealDiscountType;

  currency?: DealCurrency;

  minPrice?: number;

  maxPrice?: number;

  startDateFrom?: string;

  startDateTo?: string;

  endDateFrom?: string;

  endDateTo?: string;

  activeOnly?: boolean;

  sortBy?:
    | "dealId"
    | "title"
    | "originalPrice"
    | "dealPrice"
    | "discountValue"
    | "startDate"
    | "endDate"
    | "status"
    | "createdAt"
    | "updatedAt";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   CREATE PAYLOAD
========================================================= */

export type CreateDealPayload = {
  title: string;

  /*
   * Supports:
   *
   * STH-P-0001
   *
   * OR:
   *
   * MongoDB ObjectId
   */

  product: string;

  discountType: DealDiscountType;

  discountValue: number;

  originalPrice: number;

  currency: DealCurrency;

  startDate: string;

  endDate: string;

  status?: DealStatus;
};

/* =========================================================
   UPDATE PAYLOAD
========================================================= */

export type UpdateDealPayload =
  Partial<CreateDealPayload>;

/* =========================================================
   API RESPONSE TYPES
========================================================= */

type DealResponse = {
  success: boolean;

  message?: string;

  data: Deal;
};

type DealListResponse = {
  success: boolean;

  message?: string;

  data: {
    deals: Deal[];

    pagination: DealPagination;

    summary: DealSummary;
  };
};

type DealSummaryResponse = {
  success: boolean;

  data: {
    summary: DealSummary;
  };
};

type DeleteDealResponse = {
  success: boolean;

  message?: string;

  data: {
    _id?: string;

    id?: string;

    dealId: string;

    title: string;
  };
};

/* =========================================================
   NUMBER NORMALIZER
========================================================= */

function normalizeNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
}

/* =========================================================
   NULLABLE NUMBER
========================================================= */

function normalizeNullableNumber(
  value: unknown
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

/* =========================================================
   NORMALIZE PRODUCT IMAGE
========================================================= */

function normalizeProductImage(
  image:
    | Partial<DealProductImage>
    | null
    | undefined
): DealProductImage | null {
  if (
    !image ||
    !image.url
  ) {
    return null;
  }

  return {
    _id:
      image._id
        ? String(
            image._id
          )
        : null,

    url:
      String(
        image.url
      ),

    alt:
      String(
        image.alt ||
        ""
      ),

    isPrimary:
      Boolean(
        image.isPrimary
      ),

    sortOrder:
      normalizeNumber(
        image.sortOrder,
        0
      ),
  };
}

/* =========================================================
   NORMALIZE PRODUCT IMAGES
========================================================= */

function normalizeProductImages(
  images:
    | DealProductImage[]
    | null
    | undefined
) {
  if (
    !Array.isArray(
      images
    )
  ) {
    return [];
  }

  return images
    .map(
      normalizeProductImage
    )
    .filter(
      (
        image
      ): image is DealProductImage =>
        Boolean(
          image
        )
    )
    .sort(
      (
        first,
        second
      ) =>
        first.sortOrder -
        second.sortOrder
    );
}

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeDealProduct(
  product:
    | DealProduct
    | string
    | null
    | undefined
): DealProduct | null {
  if (!product) {
    return null;
  }

  if (
    typeof product ===
    "string"
  ) {
    return {
      _id: product,
      externalProductId: product,
      externalCatalogId: product,
      productId: null,
      name: "",
      sku: "",
      type: null,
      brand: null,
      category: null,
      model: "",
      capacityRating: "",
      rate: null,
      pricing: null,
      imageUrl: null,
      imageThumbUrl: null,
      images: [],
      primaryImage: null,
      status: null,
    };
  }

  const images =
    normalizeProductImages(
      product.images
    );

  const normalizedPrimaryImage =
    normalizeProductImage(
      product.primaryImage
    );

  const externalImageUrl =
    product.imageUrl ||
    product.imageThumbUrl ||
    null;

  const externalImage =
    externalImageUrl
      ? {
          _id: null,
          url: String(externalImageUrl),
          alt: product.name || "",
          isPrimary: true,
          sortOrder: 0,
        } satisfies DealProductImage
      : null;

  const primaryImage =
    normalizedPrimaryImage ||
    images.find(
      (
        image
      ) =>
        image.isPrimary
    ) ||
    images[0] ||
    externalImage ||
    null;

  const pricing =
    product.pricing
      ? {
          currency:
            product.pricing
              .currency ||
            "PKR",

          sellingPrice:
            normalizeNumber(
              product.pricing
                .sellingPrice,
              0
            ),

          oldPrice:
            normalizeNullableNumber(
              product.pricing
                .oldPrice
            ),
        }
      : product.rate !== null &&
        product.rate !== undefined
        ? {
            currency: "PKR" as DealCurrency,
            sellingPrice: normalizeNumber(product.rate, 0),
            oldPrice: null,
          }
        : null;

  const externalProductId =
    product.externalProductId ||
    product.externalCatalogId ||
    product.productId ||
    product._id ||
    "";

  return {
    ...product,

    _id: String(externalProductId),

    externalProductId:
      product.externalProductId ||
      product.externalCatalogId ||
      null,

    externalCatalogId:
      product.externalCatalogId ||
      product.externalProductId ||
      null,

    productId:
      product.productId ||
      null,

    name:
      product.name ||
      "",

    sku:
      product.sku ||
      "",

    model:
      product.model ||
      "",

    capacityRating:
      product.capacityRating ||
      "",

    rate:
      normalizeNullableNumber(product.rate),

    pricing,

    imageUrl:
      product.imageUrl ||
      externalImageUrl,

    imageThumbUrl:
      product.imageThumbUrl ||
      null,

    images,

    primaryImage,

    status:
      product.status ||
      null,
  };
}

/* =========================================================
   NORMALIZE DEAL
========================================================= */

export function normalizeDeal(
  deal: Deal
): Deal {
  return {
    ...deal,

    _id:
      String(
        deal._id ||
        deal.id ||
        ""
      ),

    id:
      String(
        deal.id ||
        deal._id ||
        ""
      ),

    dealId:
      String(
        deal.dealId ||
        ""
      ),

    title:
      String(
        deal.title ||
        ""
      ),

    product:
      normalizeDealProduct(
        deal.product
      ),

    discountType:
      deal.discountType ||
      "percentage",

    discountValue:
      normalizeNumber(
        deal.discountValue,
        0
      ),

    originalPrice:
      normalizeNumber(
        deal.originalPrice,
        0
      ),

    dealPrice:
      normalizeNumber(
        deal.dealPrice,
        0
      ),

    currency:
      deal.currency ||
      "PKR",

    startDate:
      deal.startDate ||
      "",

    endDate:
      deal.endDate ||
      "",

    status:
      deal.status ||
      "draft",
  };
}

/* =========================================================
   NORMALIZE SUMMARY
========================================================= */

function normalizeSummary(
  summary:
    | Partial<DealSummary>
    | null
    | undefined
): DealSummary {
  return {
    total:
      normalizeNumber(
        summary?.total,
        0
      ),

    draft:
      normalizeNumber(
        summary?.draft,
        0
      ),

    scheduled:
      normalizeNumber(
        summary?.scheduled,
        0
      ),

    active:
      normalizeNumber(
        summary?.active,
        0
      ),

    expired:
      normalizeNumber(
        summary?.expired,
        0
      ),
  };
}

/* =========================================================
   GET DEALS
========================================================= */

export async function getDeals(
  params: GetDealsParams = {}
) {
  const response =
    await api.get<DealListResponse>(
      "/deals",
      {
        params,
      }
    );

  const data =
    response.data.data;

  return {
    deals:
      Array.isArray(
        data?.deals
      )
        ? data.deals.map(
            normalizeDeal
          )
        : [],

    pagination: {
      page:
        normalizeNumber(
          data?.pagination
            ?.page,
          1
        ),

      limit:
        normalizeNumber(
          data?.pagination
            ?.limit,
          20
        ),

      total:
        normalizeNumber(
          data?.pagination
            ?.total,
          0
        ),

      totalPages:
        normalizeNumber(
          data?.pagination
            ?.totalPages,
          0
        ),

      hasNextPage:
        Boolean(
          data?.pagination
            ?.hasNextPage
        ),

      hasPreviousPage:
        Boolean(
          data?.pagination
            ?.hasPreviousPage
        ),
    } satisfies DealPagination,

    summary:
      normalizeSummary(
        data?.summary
      ),
  };
}

/* =========================================================
   GET DEAL SUMMARY
========================================================= */

export async function getDealSummary(
  params: Omit<
    GetDealsParams,
    | "page"
    | "limit"
    | "sortBy"
    | "sortOrder"
  > = {}
) {
  const response =
    await api.get<DealSummaryResponse>(
      "/deals/summary",
      {
        params,
      }
    );

  return normalizeSummary(
    response.data.data
      ?.summary
  );
}

/* =========================================================
   GET SINGLE DEAL
========================================================= */

export async function getDeal(
  dealId: string
) {
  const response =
    await api.get<DealResponse>(
      `/deals/${encodeURIComponent(
        dealId
      )}`
    );

  return normalizeDeal(
    response.data.data
  );
}

/* =========================================================
   CREATE DEAL
========================================================= */

export async function createDeal(
  payload: CreateDealPayload
) {
  const response =
    await api.post<DealResponse>(
      "/deals",
      payload
    );

  return normalizeDeal(
    response.data.data
  );
}

/* =========================================================
   UPDATE DEAL
========================================================= */

export async function updateDeal(
  dealId: string,
  payload: UpdateDealPayload
) {
  const response =
    await api.patch<DealResponse>(
      `/deals/${encodeURIComponent(
        dealId
      )}`,
      payload
    );

  return normalizeDeal(
    response.data.data
  );
}

/* =========================================================
   UPDATE DEAL STATUS
========================================================= */

export async function updateDealStatus(
  dealId: string,
  status: DealStatus
) {
  const response =
    await api.patch<DealResponse>(
      `/deals/${encodeURIComponent(
        dealId
      )}/status`,
      {
        status,
      }
    );

  return normalizeDeal(
    response.data.data
  );
}

/* =========================================================
   DELETE DEAL
========================================================= */

export async function deleteDeal(
  dealId: string
) {
  const response =
    await api.delete<DeleteDealResponse>(
      `/deals/${encodeURIComponent(
        dealId
      )}`
    );

  return response.data.data;
}

/* =========================================================
   FORMAT STATUS
========================================================= */

export function formatDealStatus(
  status: DealStatus
) {
  switch (status) {
    case "draft":
      return "Draft";

    case "scheduled":
      return "Scheduled";

    case "active":
      return "Active";

    case "expired":
      return "Expired";

    default:
      return status;
  }
}

/* =========================================================
   FORMAT DISCOUNT
========================================================= */

export function formatDealDiscount(
  deal: Pick<
    Deal,
    | "discountType"
    | "discountValue"
    | "currency"
  >
) {
  const discount =
    normalizeNumber(
      deal.discountValue,
      0
    );

  if (
    deal.discountType ===
    "percentage"
  ) {
    return `${discount}%`;
  }

  if (
    deal.currency ===
    "USD"
  ) {
    return `$ ${discount.toLocaleString(
      "en-US",
      {
        maximumFractionDigits:
          2,
      }
    )} OFF`;
  }

  return `Rs ${discount.toLocaleString(
    "en-PK",
    {
      maximumFractionDigits:
        2,
    }
  )} OFF`;
}

/* =========================================================
   FORMAT PRICE
========================================================= */

export function formatDealPrice(
  amount:
    | number
    | null
    | undefined,
  currency: DealCurrency =
    "PKR"
) {
  const value =
    normalizeNumber(
      amount,
      0
    );

  if (
    currency ===
    "USD"
  ) {
    return `$ ${value.toLocaleString(
      "en-US",
      {
        maximumFractionDigits:
          2,
      }
    )}`;
  }

  return `Rs ${value.toLocaleString(
    "en-PK",
    {
      maximumFractionDigits:
        2,
    }
  )}`;
}

/* =========================================================
   FORMAT DATE
========================================================= */

export function formatDealDate(
  value:
    | string
    | null
    | undefined
) {
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

  return date.toLocaleDateString(
    "en-GB",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  );
}

/* =========================================================
   DATE INPUT VALUE
========================================================= */

export function getDealDateInputValue(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

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
   PRODUCT DISPLAY NAME
========================================================= */

export function getDealProductName(
  product:
    | DealProduct
    | null
    | undefined
) {
  if (!product) {
    return "Product unavailable";
  }

  return (
    product.name ||
    product.productId ||
    product._id ||
    "Product unavailable"
  );
}

/* =========================================================
   PRODUCT PUBLIC ID
========================================================= */

export function getDealProductId(
  product:
    | DealProduct
    | null
    | undefined
) {
  return (
    product?.externalProductId ||
    product?.externalCatalogId ||
    product?.productId ||
    product?._id ||
    ""
  );
}

/* =========================================================
   PRODUCT CURRENT PRICE

   Uses Product.pricing.sellingPrice.
========================================================= */

export function getDealProductSellingPrice(
  product:
    | DealProduct
    | null
    | undefined
) {
  return normalizeNumber(
    product?.rate ??
      product?.pricing?.sellingPrice,
    0
  );
}

/* =========================================================
   PRODUCT PRIMARY IMAGE
========================================================= */

export function getDealProductPrimaryImage(
  product:
    | DealProduct
    | null
    | undefined
) {
  if (!product) {
    return null;
  }

  if (
    product.primaryImage
      ?.url
  ) {
    return product.primaryImage;
  }

  const primary =
    product.images?.find(
      (
        image
      ) =>
        image.isPrimary
    );

  if (primary) {
    return primary;
  }

  return (
    product.images?.[0] ||
    null
  );
}

/* =========================================================
   RESOLVE PRODUCT IMAGE URL

   Product images may be stored as:

   /uploads/products/example.jpg

   Backend API base may be:

   http://localhost:5000/api/v1

   We therefore use only the API origin:

   http://localhost:5000/uploads/products/example.jpg
========================================================= */

export function resolveDealProductImageUrl(
  value:
    | string
    | null
    | undefined
) {
  const url =
    String(
      value ||
      ""
    ).trim();

  if (!url) {
    return "";
  }

  /*
   * Already absolute or browser-safe.
   */

  if (
    /^(https?:|data:|blob:)/i.test(
      url
    )
  ) {
    return url;
  }

  const normalizedPath =
    url.startsWith(
      "/"
    )
      ? url
      : `/${url}`;

  const baseURL =
    String(
      api.defaults
        .baseURL ||
      ""
    ).trim();

  /*
   * If API base URL is absolute, extract its origin.
   *
   * Example:
   *
   * http://localhost:5000/api/v1
   *
   * becomes:
   *
   * http://localhost:5000
   */

  if (
    /^https?:\/\//i.test(
      baseURL
    )
  ) {
    try {
      const origin =
        new URL(
          baseURL
        ).origin;

      return `${origin}${normalizedPath}`;
    } catch {
      return normalizedPath;
    }
  }

  /*
   * Relative baseURL:
   *
   * Browser can resolve /uploads/... directly.
   */

  return normalizedPath;
}

/* =========================================================
   PRODUCT IMAGE URL
========================================================= */

export function getDealProductImageUrl(
  product:
    | DealProduct
    | null
    | undefined
) {
  const image =
    getDealProductPrimaryImage(
      product
    );

  return resolveDealProductImageUrl(
    image?.url
  );
}

/* =========================================================
   PRODUCT IMAGE ALT
========================================================= */

export function getDealProductImageAlt(
  product:
    | DealProduct
    | null
    | undefined
) {
  const image =
    getDealProductPrimaryImage(
      product
    );

  return (
    image?.alt ||
    product?.name ||
    product?.externalProductId ||
    product?.externalCatalogId ||
    product?.productId ||
    "Solar Trade Hub product"
  );
}

/* =========================================================
   API ERROR MESSAGE
========================================================= */

export function getDealErrorMessage(
  error: unknown,
  fallback =
    "Something went wrong."
) {
  if (
    typeof error ===
      "object" &&
    error !== null
  ) {
    const candidate =
      error as {
        response?: {
          data?: {
            message?:
              | string;

            errors?:
              | string[];
          };
        };

        message?:
          | string;
      };

    const apiMessage =
      candidate.response
        ?.data
        ?.message;

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
      return errors.join(
        " "
      );
    }

    if (
      typeof apiMessage ===
        "string" &&
      apiMessage.trim()
    ) {
      return apiMessage;
    }

    if (
      typeof candidate.message ===
        "string" &&
      candidate.message.trim()
    ) {
      return candidate.message;
    }
  }

  return fallback;
}