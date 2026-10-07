import api from "../api";

/* =========================================================
   BRAND TYPES
========================================================= */

export type BrandStatus =
  | "active"
  | "inactive";

export type BrandSeo = {
  metaTitle: string;
  metaDescription: string;
};

export type Brand = {
  _id: string;

  name: string;
  slug: string;

  description: string;

  manufacturerName: string;
  countryOfOrigin: string;
  website: string;

  logo: string;
  bannerImage: string;

  isFeatured: boolean;
  sortOrder: number;

  status: BrandStatus;

  seo: BrandSeo;

  productsCount: number;

  createdBy?: string | null;
  updatedBy?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

/* =========================================================
   PAGINATION
========================================================= */

export type BrandPagination = {
  page: number;
  limit: number;

  total: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/* =========================================================
   LIST RESULT
========================================================= */

export type BrandListResult = {
  brands: Brand[];

  pagination: BrandPagination;
};

/* =========================================================
   CREATE PAYLOAD
========================================================= */

export type CreateBrandPayload = {
  name: string;

  slug?: string;

  description?: string;

  manufacturerName?: string;

  countryOfOrigin?: string;

  website?: string;

  logo?: string;

  bannerImage?: string;

  isFeatured?: boolean;

  sortOrder?: number;

  status?: BrandStatus;

  seo?: Partial<BrandSeo>;
};

/* =========================================================
   UPDATE PAYLOAD
========================================================= */

export type UpdateBrandPayload =
  Partial<CreateBrandPayload>;

/* =========================================================
   LIST QUERY
========================================================= */

export type BrandListQuery = {
  page?: number;

  limit?: number;

  search?: string;

  status?: BrandStatus;

  isFeatured?: boolean;

  countryOfOrigin?: string;

  sortBy?:
    | "name"
    | "slug"
    | "countryOfOrigin"
    | "sortOrder"
    | "status"
    | "isFeatured"
    | "createdAt"
    | "updatedAt";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   DELETE RESULT
========================================================= */

export type DeleteBrandResult = {
  id: string;
  name: string;
  slug: string;
};

/* =========================================================
   RAW API TYPES
========================================================= */

type BrandResponse = {
  success?: boolean;

  message?: string;

  data?: unknown;
};

type BrandListResponse = {
  success?: boolean;

  message?: string;

  data?: unknown;

  pagination?: Partial<BrandPagination>;
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeString = (
  value: unknown
): string => {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
};

const normalizeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const normalizeBoolean = (
  value: unknown
): boolean => {
  return value === true;
};

/* =========================================================
   NORMALIZE SEO
========================================================= */

const normalizeSeo = (
  value: unknown
): BrandSeo => {
  const seo =
    value &&
    typeof value ===
      "object"
      ? (value as Record<
          string,
          unknown
        >)
      : {};

  return {
    metaTitle:
      normalizeString(
        seo.metaTitle
      ),

    metaDescription:
      normalizeString(
        seo.metaDescription
      ),
  };
};

/* =========================================================
   NORMALIZE BRAND
========================================================= */

const normalizeBrand = (
  rawBrand: unknown
): Brand => {
  const brand =
    rawBrand &&
    typeof rawBrand ===
      "object"
      ? (rawBrand as Record<
          string,
          unknown
        >)
      : {};

  const status: BrandStatus =
    brand.status ===
    "inactive"
      ? "inactive"
      : "active";

  return {
    _id:
      normalizeString(
        brand._id
      ) ||
      normalizeString(
        brand.id
      ),

    name:
      normalizeString(
        brand.name
      ),

    slug:
      normalizeString(
        brand.slug
      ),

    description:
      normalizeString(
        brand.description
      ),

    manufacturerName:
      normalizeString(
        brand.manufacturerName
      ),

    countryOfOrigin:
      normalizeString(
        brand.countryOfOrigin
      ),

    website:
      normalizeString(
        brand.website
      ),

    logo:
      normalizeString(
        brand.logo
      ),

    bannerImage:
      normalizeString(
        brand.bannerImage
      ),

    isFeatured:
      normalizeBoolean(
        brand.isFeatured
      ),

    sortOrder:
      normalizeNumber(
        brand.sortOrder
      ),

    status,

    seo:
      normalizeSeo(
        brand.seo
      ),

    productsCount:
      normalizeNumber(
        brand.productsCount
      ),

    createdBy:
      normalizeString(
        brand.createdBy
      ) || null,

    updatedBy:
      normalizeString(
        brand.updatedBy
      ) || null,

    createdAt:
      normalizeString(
        brand.createdAt
      ) || undefined,

    updatedAt:
      normalizeString(
        brand.updatedAt
      ) || undefined,
  };
};

/* =========================================================
   NORMALIZE BRAND ARRAY
========================================================= */

const normalizeBrandArray = (
  value: unknown
): Brand[] => {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .map(
      normalizeBrand
    )
    .filter(
      (brand) =>
        Boolean(
          brand._id
        )
    );
};

/* =========================================================
   NORMALIZE PAGINATION
========================================================= */

const normalizePagination = (
  value:
    | Partial<BrandPagination>
    | undefined,
  brandsLength: number
): BrandPagination => {
  const page =
    Math.max(
      1,
      normalizeNumber(
        value?.page,
        1
      )
    );

  const limit =
    Math.max(
      1,
      normalizeNumber(
        value?.limit,
        20
      )
    );

  const total =
    Math.max(
      0,
      normalizeNumber(
        value?.total,
        brandsLength
      )
    );

  const totalPages =
    Math.max(
      0,
      normalizeNumber(
        value?.totalPages,
        total > 0
          ? Math.ceil(
              total /
                limit
            )
          : 0
      )
    );

  return {
    page,

    limit,

    total,

    totalPages,

    hasNextPage:
      value?.hasNextPage ===
        true,

    hasPreviousPage:
      value?.hasPreviousPage ===
        true,
  };
};

/* =========================================================
   BRAND ERROR MESSAGE

   Supports backend responses like:

   {
     "message": "...",
     "errors": [
       {
         "field": "name",
         "message": "..."
       }
     ]
   }
========================================================= */

export const getBrandErrorMessage = (
  error: unknown,
  fallback =
    "Brand request failed."
): string => {
  if (
    typeof error ===
      "object" &&
    error !== null
  ) {
    const requestError =
      error as {
        message?: string;

        response?: {
          data?: {
            message?: string;

            error?: string;

            errors?: Array<{
              message?: string;
              msg?: string;
            }>;
          };
        };
      };

    const validationMessage =
      requestError.response
        ?.data?.errors?.[0]
        ?.message ||
      requestError.response
        ?.data?.errors?.[0]
        ?.msg;

    return (
      validationMessage ||
      requestError.response
        ?.data?.message ||
      requestError.response
        ?.data?.error ||
      requestError.message ||
      fallback
    );
  }

  return fallback;
};

/* =========================================================
   GET BRANDS

   GET /api/v1/brands

   Dashboard endpoint.
========================================================= */

export const getBrands =
  async (
    query: BrandListQuery = {}
  ): Promise<BrandListResult> => {
    const response =
      await api.get<BrandListResponse>(
        "/brands",
        {
          params:
            query,
        }
      );

    const brands =
      normalizeBrandArray(
        response.data.data
      );

    return {
      brands,

      pagination:
        normalizePagination(
          response.data
            .pagination,
          brands.length
        ),
    };
  };

/* =========================================================
   GET ACTIVE BRANDS

   GET /api/v1/brands/active

   Public endpoint.
========================================================= */

export const getActiveBrands =
  async (): Promise<
    Brand[]
  > => {
    const response =
      await api.get<BrandResponse>(
        "/brands/active"
      );

    return normalizeBrandArray(
      response.data.data
    );
  };

/* =========================================================
   GET FEATURED BRANDS

   GET /api/v1/brands/featured

   Public endpoint.
   Used later by storefront Featured Brands.
========================================================= */

export const getFeaturedBrands =
  async (): Promise<
    Brand[]
  > => {
    const response =
      await api.get<BrandResponse>(
        "/brands/featured"
      );

    return normalizeBrandArray(
      response.data.data
    );
  };

/* =========================================================
   GET BRAND BY ID

   GET /api/v1/brands/:brandId
========================================================= */

export const getBrandById =
  async (
    brandId: string
  ): Promise<Brand> => {
    const id =
      brandId.trim();

    if (!id) {
      throw new Error(
        "Brand ID is required."
      );
    }

    const response =
      await api.get<BrandResponse>(
        `/brands/${id}`
      );

    const brand =
      normalizeBrand(
        response.data.data
      );

    if (!brand._id) {
      throw new Error(
        "Invalid brand response received from server."
      );
    }

    return brand;
  };

/* =========================================================
   CREATE BRAND

   POST /api/v1/brands
========================================================= */

export const createBrand =
  async (
    payload: CreateBrandPayload
  ): Promise<Brand> => {
    const response =
      await api.post<BrandResponse>(
        "/brands",
        payload
      );

    const brand =
      normalizeBrand(
        response.data.data
      );

    if (!brand._id) {
      throw new Error(
        "Brand was created but an invalid response was received."
      );
    }

    return brand;
  };

/* =========================================================
   UPDATE BRAND

   PATCH /api/v1/brands/:brandId
========================================================= */

export const updateBrand =
  async (
    brandId: string,
    payload: UpdateBrandPayload
  ): Promise<Brand> => {
    const id =
      brandId.trim();

    if (!id) {
      throw new Error(
        "Brand ID is required."
      );
    }

    const response =
      await api.patch<BrandResponse>(
        `/brands/${id}`,
        payload
      );

    const brand =
      normalizeBrand(
        response.data.data
      );

    if (!brand._id) {
      throw new Error(
        "Brand was updated but an invalid response was received."
      );
    }

    return brand;
  };

/* =========================================================
   UPDATE BRAND STATUS

   PATCH /api/v1/brands/:brandId/status
========================================================= */

export const updateBrandStatus =
  async (
    brandId: string,
    status: BrandStatus
  ): Promise<Brand> => {
    const id =
      brandId.trim();

    if (!id) {
      throw new Error(
        "Brand ID is required."
      );
    }

    const response =
      await api.patch<BrandResponse>(
        `/brands/${id}/status`,
        {
          status,
        }
      );

    const brand =
      normalizeBrand(
        response.data.data
      );

    if (!brand._id) {
      throw new Error(
        "Brand status was updated but an invalid response was received."
      );
    }

    return brand;
  };

/* =========================================================
   DELETE BRAND

   DELETE /api/v1/brands/:brandId

   Backend prevents deletion when products are assigned.
========================================================= */

export const deleteBrand =
  async (
    brandId: string
  ): Promise<DeleteBrandResult> => {
    const id =
      brandId.trim();

    if (!id) {
      throw new Error(
        "Brand ID is required."
      );
    }

    const response =
      await api.delete<BrandResponse>(
        `/brands/${id}`
      );

    const rawData =
      response.data.data &&
      typeof response.data
        .data === "object"
        ? (response.data
            .data as Record<
            string,
            unknown
          >)
        : {};

    return {
      id:
        normalizeString(
          rawData.id
        ) ||
        normalizeString(
          rawData._id
        ) ||
        id,

      name:
        normalizeString(
          rawData.name
        ),

      slug:
        normalizeString(
          rawData.slug
        ),
    };
  };