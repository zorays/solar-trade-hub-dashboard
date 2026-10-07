import api from "../api";

/* =========================================================
   CATEGORY TYPES
========================================================= */

export type CategoryStatus =
  | "active"
  | "inactive";

export type Category = {
  _id: string;

  name: string;
  slug: string;

  description: string;

  sortOrder: number;

  status: CategoryStatus;

  productsCount: number;

  createdBy?: string | null;
  updatedBy?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

/* =========================================================
   PAGINATION
========================================================= */

export type CategoryPagination = {
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

export type CategoryListResult = {
  categories: Category[];
  pagination: CategoryPagination;
};

/* =========================================================
   CREATE PAYLOAD
========================================================= */

export type CreateCategoryPayload = {
  name: string;

  slug?: string;

  description?: string;

  sortOrder?: number;

  status?: CategoryStatus;
};

/* =========================================================
   UPDATE PAYLOAD
========================================================= */

export type UpdateCategoryPayload =
  Partial<CreateCategoryPayload>;

/* =========================================================
   CATEGORY QUERY
========================================================= */

export type CategoryListQuery = {
  page?: number;

  limit?: number;

  search?: string;

  status?: CategoryStatus;

  sortBy?:
    | "name"
    | "slug"
    | "sortOrder"
    | "status"
    | "createdAt"
    | "updatedAt";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   DELETE RESULT
========================================================= */

export type DeleteCategoryResult = {
  id: string;
  name: string;
  slug: string;
};

/* =========================================================
   RAW API TYPES
========================================================= */

type CategoryResponse = {
  success?: boolean;

  message?: string;

  data?: unknown;
};

type CategoryListResponse = {
  success?: boolean;

  message?: string;

  data?: unknown;

  pagination?: Partial<CategoryPagination>;
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeString = (
  value: unknown
): string => {
  return typeof value === "string"
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
   NORMALIZE CATEGORY

   Backend remains the source of truth.

   This normalizer prevents malformed/missing optional
   response fields from breaking the dashboard.
========================================================= */

const normalizeCategory = (
  rawCategory: unknown
): Category => {
  const category =
    rawCategory &&
    typeof rawCategory ===
      "object"
      ? (rawCategory as Record<
          string,
          unknown
        >)
      : {};

  const status: CategoryStatus =
    category.status ===
    "inactive"
      ? "inactive"
      : "active";

  return {
    _id:
      normalizeString(
        category._id
      ) ||
      normalizeString(
        category.id
      ),

    name:
      normalizeString(
        category.name
      ),

    slug:
      normalizeString(
        category.slug
      ),

    description:
      normalizeString(
        category.description
      ),

    sortOrder:
      normalizeNumber(
        category.sortOrder
      ),

    status,

    productsCount:
      normalizeNumber(
        category.productsCount
      ),

    createdBy:
      normalizeString(
        category.createdBy
      ) || null,

    updatedBy:
      normalizeString(
        category.updatedBy
      ) || null,

    createdAt:
      normalizeString(
        category.createdAt
      ) || undefined,

    updatedAt:
      normalizeString(
        category.updatedAt
      ) || undefined,
  };
};

/* =========================================================
   NORMALIZE CATEGORY ARRAY
========================================================= */

const normalizeCategoryArray = (
  value: unknown
): Category[] => {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .map(
      normalizeCategory
    )
    .filter(
      (category) =>
        Boolean(
          category._id
        )
    );
};

/* =========================================================
   NORMALIZE PAGINATION
========================================================= */

const normalizePagination = (
  value: Partial<CategoryPagination> | undefined,
  categoriesLength: number
): CategoryPagination => {
  return {
    page:
      Math.max(
        1,
        normalizeNumber(
          value?.page,
          1
        )
      ),

    limit:
      Math.max(
        1,
        normalizeNumber(
          value?.limit,
          20
        )
      ),

    total:
      Math.max(
        0,
        normalizeNumber(
          value?.total,
          categoriesLength
        )
      ),

    totalPages:
      Math.max(
        0,
        normalizeNumber(
          value?.totalPages,
          categoriesLength >
            0
            ? 1
            : 0
        )
      ),

    hasNextPage:
      normalizeBoolean(
        value?.hasNextPage
      ),

    hasPreviousPage:
      normalizeBoolean(
        value?.hasPreviousPage
      ),
  };
};

/* =========================================================
   CATEGORY API ERROR MESSAGE

   Supports backend validation responses:

   {
     message,
     errors: [
       {
         field,
         message
       }
     ]
   }
========================================================= */

export const getCategoryErrorMessage = (
  error: unknown,
  fallback =
    "Category request failed."
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
   GET CATEGORIES

   GET /api/v1/categories

   Dashboard endpoint.
   Authentication is automatically attached by api.ts.
========================================================= */

export const getCategories =
  async (
    query: CategoryListQuery = {}
  ): Promise<CategoryListResult> => {
    const response =
      await api.get<CategoryListResponse>(
        "/categories",
        {
          params: query,
        }
      );

    const categories =
      normalizeCategoryArray(
        response.data.data
      );

    return {
      categories,

      pagination:
        normalizePagination(
          response.data
            .pagination,
          categories.length
        ),
    };
  };

/* =========================================================
   GET ACTIVE CATEGORIES

   GET /api/v1/categories/active

   Public endpoint.

   Used later by:
   - Product forms
   - Storefront filters
   - Marketplace navigation
========================================================= */

export const getActiveCategories =
  async (): Promise<
    Category[]
  > => {
    const response =
      await api.get<CategoryResponse>(
        "/categories/active"
      );

    return normalizeCategoryArray(
      response.data.data
    );
  };

/* =========================================================
   GET CATEGORY BY ID

   GET /api/v1/categories/:categoryId
========================================================= */

export const getCategoryById =
  async (
    categoryId: string
  ): Promise<Category> => {
    const id =
      categoryId.trim();

    if (!id) {
      throw new Error(
        "Category ID is required."
      );
    }

    const response =
      await api.get<CategoryResponse>(
        `/categories/${id}`
      );

    const category =
      normalizeCategory(
        response.data.data
      );

    if (
      !category._id
    ) {
      throw new Error(
        "Invalid category response received from server."
      );
    }

    return category;
  };

/* =========================================================
   CREATE CATEGORY

   POST /api/v1/categories
========================================================= */

export const createCategory =
  async (
    payload: CreateCategoryPayload
  ): Promise<Category> => {
    const response =
      await api.post<CategoryResponse>(
        "/categories",
        payload
      );

    const category =
      normalizeCategory(
        response.data.data
      );

    if (
      !category._id
    ) {
      throw new Error(
        "Category was created but an invalid response was received."
      );
    }

    return category;
  };

/* =========================================================
   UPDATE CATEGORY

   PATCH /api/v1/categories/:categoryId
========================================================= */

export const updateCategory =
  async (
    categoryId: string,
    payload: UpdateCategoryPayload
  ): Promise<Category> => {
    const id =
      categoryId.trim();

    if (!id) {
      throw new Error(
        "Category ID is required."
      );
    }

    const response =
      await api.patch<CategoryResponse>(
        `/categories/${id}`,
        payload
      );

    const category =
      normalizeCategory(
        response.data.data
      );

    if (
      !category._id
    ) {
      throw new Error(
        "Category was updated but an invalid response was received."
      );
    }

    return category;
  };

/* =========================================================
   UPDATE CATEGORY STATUS

   PATCH /api/v1/categories/:categoryId/status
========================================================= */

export const updateCategoryStatus =
  async (
    categoryId: string,
    status: CategoryStatus
  ): Promise<Category> => {
    const id =
      categoryId.trim();

    if (!id) {
      throw new Error(
        "Category ID is required."
      );
    }

    const response =
      await api.patch<CategoryResponse>(
        `/categories/${id}/status`,
        {
          status,
        }
      );

    const category =
      normalizeCategory(
        response.data.data
      );

    if (
      !category._id
    ) {
      throw new Error(
        "Category status was updated but an invalid response was received."
      );
    }

    return category;
  };

/* =========================================================
   DELETE CATEGORY

   DELETE /api/v1/categories/:categoryId

   Backend blocks deletion if products are assigned.
========================================================= */

export const deleteCategory =
  async (
    categoryId: string
  ): Promise<DeleteCategoryResult> => {
    const id =
      categoryId.trim();

    if (!id) {
      throw new Error(
        "Category ID is required."
      );
    }

    const response =
      await api.delete<CategoryResponse>(
        `/categories/${id}`
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