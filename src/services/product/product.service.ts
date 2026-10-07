import axios from "axios";

import api from "../api";

/* =========================================================
   PRODUCT SERVICE — EXTERNAL RATE LIST ARCHITECTURE

   Product master data is owned by the external Rate List API.
   Solar Trade Hub only reads products and manages per-supplier
   marketplace access.
========================================================= */

export type ProductSource = "external_api";
export type Currency = "PKR" | "USD" | string;
export type ProductSortOrder = "asc" | "desc";

export type ExternalProductCategory = {
  id?: string | null;
  name?: string | null;
};

export type ExternalProductBrand =
  | {
      id?: string | null;
      name?: string | null;
    }
  | string
  | null;

export type ProductMarketplaceSubscription = {
  id?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  planCode?: string | null;
  durationMonths?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isCurrentlyActive?: boolean;
  daysRemaining?: number | null;
};

export type ProductMarketplaceSupplier = {
  accessId?: string | null;
  supplierMongoId?: string | null;
  supplierId?: string | null;
  companyName?: string | null;
  supplierStatus?: string | null;
  verificationStatus?: string | null;
  enabled?: boolean;
  enabledAt?: string | null;
  disabledAt?: string | null;
  marketplaceVisible?: boolean;
  subscription?: ProductMarketplaceSubscription | null;
};

export type Product = {
  _id: string;
  id: string;
  externalProductId: string;
  externalCatalogId: string;
  provider: string;
  source: ProductSource;
  sku: string;
  name: string;
  type: string;
  productType?: string | null;
  category: ExternalProductCategory | string | null;
  brand: ExternalProductBrand;
  size?: number | string | null;
  unit?: string | null;
  description?: string | null;
  rate?: number | null;
  rateUpdatedAt?: string | null;
  rateConfirmedAt?: string | null;
  rateChangePct?: number | null;
  available: boolean;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  updatedAt?: string | null;
  marketplaceEnabled: boolean;
  marketplaceVisible: boolean;
  marketplaceSupplierCount: number;
  marketplaceSuppliers: ProductMarketplaceSupplier[];
};

export type ProductListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  productType?: string;
  category?: string;
  brand?: string;
  supplier?: string;
  available?: boolean;
  minRate?: number;
  maxRate?: number;
  minPrice?: number;
  maxPrice?: number;
  marketplaceEnabled?: boolean;
  marketplaceVisible?: boolean;
  enabled?: boolean;
  refresh?: boolean;
  sortBy?:
    | "name"
    | "sku"
    | "type"
    | "productType"
    | "category"
    | "brand"
    | "size"
    | "unit"
    | "rate"
    | "rateUpdatedAt"
    | "rateConfirmedAt"
    | "rateChangePct"
    | "updatedAt";
  sortOrder?: ProductSortOrder;
};

export type PublicProductListQuery = ProductListQuery;

export type ProductPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ProductCatalogMeta = {
  source?: "external_api" | string;
  sourceTotal?: number;
  filteredTotal?: number;
  filteredBeforeMarketplaceStatus?: number;
  fetchedAt?: string;
  categories?: Array<string | ExternalProductCategory>;
  brands?: Array<
    | string
    | {
        id?: string | null;
        name?: string | null;
      }
  >;
  types?: string[];
  productTypes?: string[];
  [key: string]: unknown;
};

export type ProductSupplierAccessPayload = {
  supplierId: string;
};

export type ProductSupplierAccessResult = {
  externalProductId?: string;
  provider?: string;
  enabled?: boolean;
  marketplaceVisible?: boolean;
  supplier?: {
    _id?: string;
    id?: string;
    supplierId?: string;
    companyName?: string;
    status?: string;
    verificationStatus?: string;
  } | null;
  subscription?: ProductMarketplaceSubscription | null;
  access?: {
    _id?: string;
    id?: string;
    externalProductId?: string;
    enabled?: boolean;
    enabledAt?: string | null;
    disabledAt?: string | null;
  } | null;
  [key: string]: unknown;
};

type ProductApiResponse = {
  success: boolean;
  message?: string;
  data: Product;
};

type ProductListApiResponse = {
  success: boolean;
  message?: string;
  data: Product[];
  pagination: ProductPagination;
  catalog?: ProductCatalogMeta;
};

type ProductArrayApiResponse = {
  success: boolean;
  message?: string;
  data: Product[];
};

type ProductSupplierAccessApiResponse = {
  success: boolean;
  message?: string;
  data: ProductSupplierAccessResult;
};

const toNullableNumber = (
  value: number | string | null | undefined
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const normalizeCategory = (
  value: ExternalProductCategory | string | null | undefined
): ExternalProductCategory | string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return {
    id: value.id ?? null,
    name: value.name ?? null,
  };
};

const normalizeBrand = (
  value: ExternalProductBrand | undefined
): ExternalProductBrand => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return {
    id: value.id ?? null,
    name: value.name ?? null,
  };
};

export const normalizeProduct = (
  raw: Product | Record<string, any>
): Product => {
  const externalProductId = String(
    raw.externalProductId ||
      raw.externalCatalogId ||
      raw.id ||
      raw._id ||
      ""
  ).trim();

  const marketplaceSuppliers = Array.isArray(
    raw.marketplaceSuppliers
  )
    ? raw.marketplaceSuppliers
    : [];

  const marketplaceEnabled =
    raw.marketplaceEnabled === true ||
    marketplaceSuppliers.some(
      (supplier: ProductMarketplaceSupplier) =>
        supplier.enabled === true
    );

  const marketplaceVisible =
    raw.marketplaceVisible === true ||
    marketplaceSuppliers.some(
      (supplier: ProductMarketplaceSupplier) =>
        supplier.marketplaceVisible === true
    );

  return {
    ...raw,
    _id: externalProductId,
    id: externalProductId,
    externalProductId,
    externalCatalogId: externalProductId,
    provider: String(raw.provider || "biz_daily"),
    source: "external_api",
    sku: raw.sku ? String(raw.sku) : "",
    name: raw.name ? String(raw.name) : "",
    type: raw.type ? String(raw.type) : "",
    productType: raw.productType ?? null,
    category: normalizeCategory(raw.category),
    brand: normalizeBrand(raw.brand),
    size: raw.size ?? null,
    unit: raw.unit ?? null,
    description: raw.description ?? null,
    rate: toNullableNumber(raw.rate),
    rateUpdatedAt: raw.rateUpdatedAt ?? null,
    rateConfirmedAt: raw.rateConfirmedAt ?? null,
    rateChangePct: toNullableNumber(raw.rateChangePct),
    available: raw.available === true,
    imageUrl: raw.imageUrl ?? null,
    imageThumbUrl: raw.imageThumbUrl ?? null,
    updatedAt: raw.updatedAt ?? null,
    marketplaceEnabled,
    marketplaceVisible,
    marketplaceSupplierCount: Number(
      raw.marketplaceSupplierCount ??
        marketplaceSuppliers.length
    ),
    marketplaceSuppliers,
  };
};

export const getProducts = async (
  query: ProductListQuery = {}
) => {
  const response = await api.get<ProductListApiResponse>(
    "/products",
    {
      params: query,
    }
  );

  return {
    products: Array.isArray(response.data.data)
      ? response.data.data.map(normalizeProduct)
      : [],
    pagination: response.data.pagination,
    catalog: response.data.catalog ?? null,
  };
};

export const refreshProducts = async (
  query: Omit<ProductListQuery, "refresh"> = {}
) => {
  return getProducts({
    ...query,
    refresh: true,
  });
};

export const getProduct = async (
  productId: string
) => {
  const response = await api.get<ProductApiResponse>(
    `/products/${encodeURIComponent(productId)}`
  );

  return normalizeProduct(response.data.data);
};

export const enableProductForSupplier = async (
  productId: string,
  supplierId: string
) => {
  const response =
    await api.post<ProductSupplierAccessApiResponse>(
      `/products/${encodeURIComponent(productId)}/enable`,
      {
        supplierId,
      } satisfies ProductSupplierAccessPayload
    );

  return response.data.data;
};

export const disableProductForSupplier = async (
  productId: string,
  supplierId: string
) => {
  const response =
    await api.post<ProductSupplierAccessApiResponse>(
      `/products/${encodeURIComponent(productId)}/disable`,
      {
        supplierId,
      } satisfies ProductSupplierAccessPayload
    );

  return response.data.data;
};

export const enableProduct = enableProductForSupplier;
export const disableProduct = disableProductForSupplier;

export const getActiveProducts = async (
  query: PublicProductListQuery = {}
) => {
  const response = await api.get<ProductListApiResponse>(
    "/products/active",
    {
      params: query,
    }
  );

  return {
    products: Array.isArray(response.data.data)
      ? response.data.data.map(normalizeProduct)
      : [],
    pagination: response.data.pagination,
  };
};

export const getFeaturedProducts = async (
  limit = 12
) => {
  const response = await api.get<ProductArrayApiResponse>(
    "/products/featured",
    {
      params: {
        limit,
      },
    }
  );

  return (
    Array.isArray(response.data.data)
      ? response.data.data
      : []
  ).map(normalizeProduct);
};

export const getPopularProducts = async (
  limit = 12
) => {
  const response = await api.get<ProductArrayApiResponse>(
    "/products/popular",
    {
      params: {
        limit,
      },
    }
  );

  return (
    Array.isArray(response.data.data)
      ? response.data.data
      : []
  ).map(normalizeProduct);
};

export const getProductDisplayName = (
  product: Product | null | undefined
) => {
  return (
    product?.name ||
    product?.sku ||
    product?.externalProductId ||
    ""
  );
};

export const getProductCategoryName = (
  product: Product | null | undefined
) => {
  const category = product?.category;

  if (!category) {
    return "";
  }

  if (typeof category === "string") {
    return category;
  }

  return category.name || "";
};

export const getProductBrandName = (
  product: Product | null | undefined
) => {
  const brand = product?.brand;

  if (!brand) {
    return "";
  }

  if (typeof brand === "string") {
    return brand;
  }

  return brand.name || "";
};

export const getProductDisplayRate = (
  product: Product | null | undefined
) => {
  return product
    ? toNullableNumber(product.rate)
    : null;
};

export const getProductDisplayImage = (
  product: Product | null | undefined
) => {
  return (
    product?.imageThumbUrl ||
    product?.imageUrl ||
    ""
  );
};

export const formatProductRate = (
  value: number | null | undefined
) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(Number(value));
};

export const formatProductType = (
  value: string | null | undefined
) => {
  if (!value) {
    return "";
  }

  return value
    .split("_")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};

export const getProductSupplierAccess = (
  product: Product | null | undefined,
  supplierId: string | null | undefined
) => {
  if (!product || !supplierId) {
    return null;
  }

  const normalizedSupplierId = supplierId
    .trim()
    .toUpperCase();

  return (
    product.marketplaceSuppliers.find(
      (item) =>
        String(item.supplierId || "")
          .trim()
          .toUpperCase() ===
        normalizedSupplierId
    ) || null
  );
};

export const isProductEnabledForSupplier = (
  product: Product | null | undefined,
  supplierId: string | null | undefined
) => {
  return (
    getProductSupplierAccess(
      product,
      supplierId
    )?.enabled === true
  );
};

export const isProductVisibleForSupplier = (
  product: Product | null | undefined,
  supplierId: string | null | undefined
) => {
  return (
    getProductSupplierAccess(
      product,
      supplierId
    )?.marketplaceVisible === true
  );
};

type ErrorResponseBody = {
  message?: string;
  error?: string;
  code?: string;
  errors?: Array<{
    field?: string;
    message?: string;
  }>;
};

export const getProductErrorMessage = (
  error: unknown,
  fallback =
    "Something went wrong while processing the product."
) => {
  if (axios.isAxiosError<ErrorResponseBody>(error)) {
    const responseData = error.response?.data;

    const validationMessage =
      responseData?.errors?.find((item) =>
        Boolean(item.message)
      )?.message;

    return (
      validationMessage ||
      responseData?.message ||
      responseData?.error ||
      error.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

/* =========================================================
   TEMPORARY LEGACY EXPORTS

   These remain only so old Add/Edit Product files continue
   compiling while dashboard screens are migrated one by one.
========================================================= */

export type ProductStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived";

export type ProductType = string;

export type StockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "on_order";

export type SellingUnit = string;

export type ProductImage = {
  _id?: string;
  id?: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export type ProductSpecification = {
  _id?: string;
  id?: string;
  group?: string;
  label: string;
  value: string;
  unit?: string;
  sortOrder?: number;
};

export type ProductWarranty = {
  available?: boolean;
  duration?: number;
  unit?: "months" | "years";
  type?: string;
  details?: string;
};

export type ProductPricing = {
  currency?: Currency;
  sellingPrice: number;
  oldPrice?: number | null;
  costPrice?: number | null;
  externalRate?: number | null;
  overrideExternalRate?: boolean;
  effectivePrice?: number | null;
};

export type ProductInventory = {
  manageStock?: boolean;
  quantity: number;
  lowStockThreshold?: number;
  stockStatus?: StockStatus;
  allowBackorder?: boolean;
};

export type ProductSeo = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
};

export type CreateProductPayload = Record<string, unknown>;
export type UpdateProductPayload = Record<string, unknown>;

const unsupportedProductMutation = (
  action: string
): never => {
  throw new Error(
    `${action} is no longer available. Product master data is managed by the external Rate List provider.`
  );
};

export const createProduct = async (
  _payload: CreateProductPayload
) => {
  return unsupportedProductMutation("Create product");
};

export const linkExternalProduct = async (
  _externalCatalogId: string,
  _payload: CreateProductPayload = {}
) => {
  return unsupportedProductMutation(
    "Link external product"
  );
};

export const updateProduct = async (
  _productId: string,
  _payload: UpdateProductPayload
) => {
  return unsupportedProductMutation("Update product");
};

export const updateProductStatus = async (
  _productId: string,
  _status: ProductStatus
) => {
  return unsupportedProductMutation(
    "Update product status"
  );
};

export const deleteProduct = async (
  _productId: string
) => {
  return unsupportedProductMutation("Delete product");
};

export const uploadProductImages = async (
  _productId: string,
  _files: File[] | FileList
) => {
  return unsupportedProductMutation(
    "Upload product images"
  );
};

export const attachUploadedProductImages = async (
  _productId: string,
  _uploadedPaths: string[]
) => {
  return unsupportedProductMutation(
    "Attach product images"
  );
};

export const uploadAndAttachProductImages = async (
  _productId: string,
  _files: File[] | FileList
) => {
  return unsupportedProductMutation(
    "Upload product images"
  );
};

export const validateProductImageFiles = (
  files: File[] | FileList
) => Array.from(files);

export const MAX_PRODUCT_UPLOAD_IMAGES = 10;
export const MAX_PRODUCT_UPLOAD_SIZE = 10 * 1024 * 1024;
export const ALLOWED_PRODUCT_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const productToUpdatePayload = (
  _product: Product
): UpdateProductPayload => ({});

export const getProductCategoryId = (
  product: Product | null | undefined
) => {
  const category = product?.category;

  if (!category) {
    return "";
  }

  if (typeof category === "string") {
    return category;
  }

  return category.id || "";
};

export const getProductBrandId = (
  product: Product | null | undefined
) => {
  const brand = product?.brand;

  if (!brand) {
    return "";
  }

  if (typeof brand === "string") {
    return brand;
  }

  return brand.id || "";
};

export const getProductSupplierId = (
  product: Product | null | undefined
) => {
  return (
    product?.marketplaceSuppliers?.[0]?.supplierId ||
    ""
  );
};

export const formatSellingUnit = (
  value: string | null | undefined
) => {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};
