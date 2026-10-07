import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

import { Link } from "react-router";

import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  LoaderCircle,
  PackageOpen,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Settings2,
  Store,
  X,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import api from "../../services/api";

import {
  disableProductForSupplier,
  enableProductForSupplier,
  formatProductRate,
  formatProductType,
  getProductBrandName,
  getProductCategoryName,
  getProductDisplayImage,
  getProductErrorMessage,
  getProducts,
  refreshProducts,
  type Product,
  type ProductCatalogMeta,
  type ProductPagination,
} from "../../services/product/product.service";

/* =========================================================
   TYPES
========================================================= */

type AvailabilityFilter =
  | "All"
  | "available"
  | "unavailable";

type MarketplaceFilter =
  | "All"
  | "enabled"
  | "visible"
  | "enabled_not_live"
  | "disabled";

type SupplierOption = {
  _id?: string;
  id?: string;
  supplierId: string;
  companyName: string;
  status?: string;
  verificationStatus?: string;
  logo?: string;
  businessType?: string;
  address?: {
    city?: string;
    country?: string;
  };
};

type MarketplaceSupplierAccess = {
  accessId?: string | null;
  supplierId?: string | null;
  supplierMongoId?: string | null;
  companyName?: string | null;
  supplierLogo?: string | null;
  supplierStatus?: string | null;
  verificationStatus?: string | null;
  enabled?: boolean;
  enabledAt?: string | null;
  disabledAt?: string | null;
  subscriptionActive?: boolean;
  visible?: boolean;
  subscription?: {
    id?: string | null;
    planCode?: string | null;
    durationMonths?: number | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    status?: string | null;
    paymentStatus?: string | null;
  } | null;
};

type SupplierApiEnvelope = {
  success?: boolean;
  data?:
    | SupplierOption[]
    | {
        suppliers?: SupplierOption[];
      };
  suppliers?: SupplierOption[];
};

/* =========================================================
   PAGE SIZE
========================================================= */

const PAGE_SIZE_OPTIONS = [
  20,
  50,
  100,
];

/* =========================================================
   AVAILABILITY FILTER
========================================================= */

const AVAILABILITY_OPTIONS = [
  {
    value: "All",
    label: "All Availability",
  },
  {
    value: "available",
    label: "Available",
  },
  {
    value: "unavailable",
    label: "Unavailable",
  },
];

/* =========================================================
   MARKETPLACE FILTER
========================================================= */

const MARKETPLACE_OPTIONS = [
  {
    value: "All",
    label: "All Marketplace",
  },
  {
    value: "visible",
    label: "Live on Marketplace",
  },
  {
    value: "enabled",
    label: "Enabled",
  },
  {
    value: "enabled_not_live",
    label: "Enabled / Not Live",
  },
  {
    value: "disabled",
    label: "Not Enabled",
  },
];

/* =========================================================
   MEDIA URL

   Biz Daily product images may arrive as:
   1. Full URL
   2. /api/public/catalog-images/...
   3. /catalog-images/...

   External catalog images must resolve against Biz Daily,
   not the Solar Trade Hub backend.
========================================================= */

const BIZ_DAILY_API_ORIGIN =
  "https://api.biz-daily.techoptionz.com";

function resolveMediaUrl(
  imageUrl: string | null | undefined
) {
  const value = String(
    imageUrl || ""
  ).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  if (
    value.startsWith(
      "/api/public/catalog-images/"
    )
  ) {
    return `${BIZ_DAILY_API_ORIGIN}${value}`;
  }

  if (
    value.startsWith(
      "api/public/catalog-images/"
    )
  ) {
    return `${BIZ_DAILY_API_ORIGIN}/${value}`;
  }

  if (
    value.startsWith(
      "/catalog-images/"
    )
  ) {
    return `${BIZ_DAILY_API_ORIGIN}/api/public${value}`;
  }

  if (
    value.startsWith(
      "catalog-images/"
    )
  ) {
    return `${BIZ_DAILY_API_ORIGIN}/api/public/${value}`;
  }

  const catalogImageIndex =
    value.indexOf(
      "catalog-images/"
    );

  if (catalogImageIndex >= 0) {
    const catalogPath =
      value.slice(
        catalogImageIndex
      );

    return `${BIZ_DAILY_API_ORIGIN}/api/public/${catalogPath}`;
  }

  const baseURL =
    api.defaults.baseURL;

  if (!baseURL) {
    return value;
  }

  try {
    const apiUrl =
      new URL(
        baseURL,
        window.location.origin
      );

    const mediaPath =
      value.startsWith("/")
        ? value
        : `/${value}`;

    return new URL(
      mediaPath,
      apiUrl.origin
    ).toString();
  } catch {
    return value;
  }
}

/* =========================================================
   PRODUCT IMAGE CANDIDATES
========================================================= */

function getProductImageCandidates(
  product: Product
) {
  const raw =
    product as Product &
      Record<string, any>;

  const possibleValues:
    unknown[] = [
      product.imageThumbUrl,
      product.imageUrl,
      raw.thumbnailUrl,
      raw.thumbnail,
      raw.thumbUrl,
      raw.image,
      raw.photoUrl,
      raw.photo,
      raw.media?.thumbnailUrl,
      raw.media?.thumbUrl,
      raw.media?.imageUrl,
      raw.media?.url,
      raw.images?.[0]
        ?.thumbnailUrl,
      raw.images?.[0]
        ?.thumbUrl,
      raw.images?.[0]
        ?.imageUrl,
      raw.images?.[0]
        ?.url,
      getProductDisplayImage(
        product
      ),
    ];

  const urls =
    possibleValues
      .map((value) => {
        if (
          typeof value !==
          "string"
        ) {
          return "";
        }

        return resolveMediaUrl(
          value
        );
      })
      .filter(Boolean);

  return Array.from(
    new Set(urls)
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDateTime(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

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
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

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
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

/* =========================================================
   SIZE
========================================================= */

function formatSize(
  product: Product
) {
  if (
    product.size === null ||
    product.size === undefined ||
    product.size === ""
  ) {
    return "—";
  }

  if (
    typeof product.size ===
    "number"
  ) {
    return product.size.toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 3,
      }
    );
  }

  return String(
    product.size
  );
}

/* =========================================================
   CATALOG OPTION NAMES
========================================================= */

function getCatalogNames(
  value: unknown
) {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  const names =
    value
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item.trim();
        }

        if (
          item &&
          typeof item ===
            "object" &&
          "name" in item
        ) {
          const name =
            (
              item as {
                name?: unknown;
              }
            ).name;

          return typeof name ===
            "string"
            ? name.trim()
            : "";
        }

        return "";
      })
      .filter(Boolean);

  return Array.from(
    new Set(names)
  ).sort(
    (first, second) =>
      first.localeCompare(
        second
      )
  );
}

/* =========================================================
   PRODUCT ACCESS
========================================================= */

function getMarketplaceAccesses(
  product:
    | Product
    | null
    | undefined
): MarketplaceSupplierAccess[] {
  if (!product) {
    return [];
  }

  const value =
    (
      product as Product & {
        marketplaceSuppliers?:
          MarketplaceSupplierAccess[];
      }
    ).marketplaceSuppliers;

  return Array.isArray(value)
    ? value
    : [];
}

/* =========================================================
   SUPPLIER RESPONSE
========================================================= */

function extractSuppliers(
  payload: SupplierApiEnvelope
) {
  if (
    Array.isArray(
      payload.data
    )
  ) {
    return payload.data;
  }

  if (
    payload.data &&
    !Array.isArray(
      payload.data
    ) &&
    Array.isArray(
      payload.data.suppliers
    )
  ) {
    return payload.data
      .suppliers;
  }

  if (
    Array.isArray(
      payload.suppliers
    )
  ) {
    return payload.suppliers;
  }

  return [];
}

/* =========================================================
   MAIN
========================================================= */

export default function ProductsList() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<ProductPagination>({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [
    catalog,
    setCatalog,
  ] =
    useState<ProductCatalogMeta | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  /* =======================================================
     FILTERS
  ======================================================= */

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("All");

  const [
    brand,
    setBrand,
  ] = useState("All");

  const [
    type,
    setType,
  ] = useState("All");

  const [
    availability,
    setAvailability,
  ] =
    useState<AvailabilityFilter>(
      "All"
    );

  const [
    marketplace,
    setMarketplace,
  ] =
    useState<MarketplaceFilter>(
      "All"
    );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    limit,
    setLimit,
  ] = useState(20);

  /* =======================================================
     SUPPLIERS
  ======================================================= */

  const [
    suppliers,
    setSuppliers,
  ] =
    useState<SupplierOption[]>(
      []
    );

  const [
    suppliersLoading,
    setSuppliersLoading,
  ] = useState(false);

  /* =======================================================
     MARKETPLACE ACCESS
  ======================================================= */

  const [
    manageProduct,
    setManageProduct,
  ] =
    useState<Product | null>(
      null
    );

  const [
    selectedSupplierId,
    setSelectedSupplierId,
  ] = useState("");

  const [
    marketplaceAction,
    setMarketplaceAction,
  ] =
    useState<string | null>(
      null
    );

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          setDebouncedSearch(
            search.trim()
          );

          setPage(1);
        },
        450
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [search]);

  /* =======================================================
     QUERY
  ======================================================= */

  const buildQuery =
    useCallback(() => {
      return {
        page,
        limit,

        search:
          debouncedSearch ||
          undefined,

        category:
          category === "All"
            ? undefined
            : category,

        brand:
          brand === "All"
            ? undefined
            : brand,

        type:
          type === "All"
            ? undefined
            : type,

        available:
          availability === "All"
            ? undefined
            : availability ===
              "available",

        marketplaceEnabled:
          marketplace ===
            "enabled" ||
          marketplace ===
            "enabled_not_live"
            ? true
            : marketplace ===
                "disabled"
              ? false
              : undefined,

        marketplaceVisible:
          marketplace ===
          "visible"
            ? true
            : marketplace ===
                "enabled_not_live"
              ? false
              : undefined,

        sortBy:
          "name" as const,

        sortOrder:
          "asc" as const,
      };
    }, [
      page,
      limit,
      debouncedSearch,
      category,
      brand,
      type,
      availability,
      marketplace,
    ]);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts =
    useCallback(
      async (
        forceRefresh = false
      ) => {
        try {
          if (forceRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setLoadError("");

          const query =
            buildQuery();

          const result =
            forceRefresh
              ? await refreshProducts(
                  query
                )
              : await getProducts(
                  query
                );

          setProducts(
            result.products
          );

          setPagination(
            result.pagination
          );

          setCatalog(
            result.catalog
          );

          if (forceRefresh) {
            toast.success(
              "Rate List refreshed",
              {
                description:
                  `${
                    result.catalog
                      ?.sourceTotal ??
                    result.pagination
                      .total
                  } external products loaded.`,
              }
            );
          }

          return result;
        } catch (error) {
          const message =
            getProductErrorMessage(
              error,
              "Unable to load external product Rate List."
            );

          setLoadError(
            message
          );

          toast.error(
            "Unable to load products",
            {
              description:
                message,
            }
          );

          return null;
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [buildQuery]
    );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  /* =======================================================
     LOAD ACTIVE + VERIFIED SUPPLIERS
  ======================================================= */

  const loadSuppliers =
    useCallback(async () => {
      try {
        setSuppliersLoading(
          true
        );

        const response =
          await api.get<SupplierApiEnvelope>(
            "/suppliers/active",
            {
              params: {
                limit: 100,
              },
            }
          );

        const rows =
          extractSuppliers(
            response.data
          );

        const eligible =
          rows
            .filter(
              (supplier) =>
                supplier.status ===
                  "active" &&
                supplier.verificationStatus ===
                  "verified"
            )
            .sort(
              (first, second) =>
                first.companyName.localeCompare(
                  second.companyName
                )
            );

        setSuppliers(
          eligible
        );
      } catch (error) {
        console.error(error);
        setSuppliers([]);
      } finally {
        setSuppliersLoading(
          false
        );
      }
    }, []);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  /* =======================================================
     FILTER OPTIONS
  ======================================================= */

  const categoryOptions =
    useMemo(() => {
      const catalogNames =
        getCatalogNames(
          catalog?.categories
        );

      const fallbackNames =
        products
          .map((product) =>
            getProductCategoryName(
              product
            ).trim()
          )
          .filter(Boolean);

      const values =
        Array.from(
          new Set([
            ...catalogNames,
            ...fallbackNames,
            ...(category !== "All"
              ? [category]
              : []),
          ])
        ).sort(
          (first, second) =>
            first.localeCompare(
              second
            )
        );

      return [
        {
          value: "All",
          label: "All Category",
        },
        ...values.map(
          (value) => ({
            value,
            label: value,
          })
        ),
      ];
    }, [
      catalog,
      products,
      category,
    ]);

  const brandOptions =
    useMemo(() => {
      const catalogNames =
        getCatalogNames(
          catalog?.brands
        );

      const fallbackNames =
        products
          .map((product) =>
            getProductBrandName(
              product
            ).trim()
          )
          .filter(Boolean);

      const values =
        Array.from(
          new Set([
            ...catalogNames,
            ...fallbackNames,
            ...(brand !== "All"
              ? [brand]
              : []),
          ])
        ).sort(
          (first, second) =>
            first.localeCompare(
              second
            )
        );

      return [
        {
          value: "All",
          label: "All Brand",
        },
        ...values.map(
          (value) => ({
            value,
            label: value,
          })
        ),
      ];
    }, [
      catalog,
      products,
      brand,
    ]);

  const typeOptions =
    useMemo(() => {
      const catalogTypes =
        Array.isArray(
          catalog?.types
        )
          ? catalog.types
              .map((item) =>
                String(
                  item || ""
                ).trim()
              )
              .filter(Boolean)
          : [];

      const fallbackTypes =
        products
          .map((product) =>
            String(
              product.type || ""
            ).trim()
          )
          .filter(Boolean);

      const values =
        Array.from(
          new Set([
            ...catalogTypes,
            ...fallbackTypes,
            ...(type !== "All"
              ? [type]
              : []),
          ])
        ).sort(
          (first, second) =>
            first.localeCompare(
              second
            )
        );

      return [
        {
          value: "All",
          label: "All Type",
        },
        ...values.map(
          (value) => ({
            value,
            label:
              formatProductType(
                value
              ),
          })
        ),
      ];
    }, [
      catalog,
      products,
      type,
    ]);

  /* =======================================================
     FILTER UPDATE HELPERS
  ======================================================= */

  const updateCategory = (
    value: string
  ) => {
    setCategory(value);
    setPage(1);
  };

  const updateBrand = (
    value: string
  ) => {
    setBrand(value);
    setPage(1);
  };

  const updateType = (
    value: string
  ) => {
    setType(value);
    setPage(1);
  };

  const updateAvailability = (
    value: string
  ) => {
    setAvailability(
      value as AvailabilityFilter
    );

    setPage(1);
  };

  const updateMarketplace = (
    value: string
  ) => {
    setMarketplace(
      value as MarketplaceFilter
    );

    setPage(1);
  };

  /* =======================================================
     OPEN MARKETPLACE ACCESS
  ======================================================= */

  const openManageProduct = (
    product: Product
  ) => {
    setManageProduct(
      product
    );

    setSelectedSupplierId(
      ""
    );
  };

  const updateManageProductFromResult = (
    updatedProducts: Product[]
  ) => {
    if (!manageProduct) {
      return;
    }

    const productId =
      manageProduct.externalProductId ||
      manageProduct.id;

    const updated =
      updatedProducts.find(
        (item) =>
          (
            item.externalProductId ||
            item.id
          ) === productId
      );

    if (updated) {
      setManageProduct(
        updated
      );
    }
  };

  /* =======================================================
     ENABLE PRODUCT
  ======================================================= */

  const handleEnableProduct =
    async () => {
      if (
        !manageProduct ||
        !selectedSupplierId
      ) {
        toast.error(
          "Select a supplier first"
        );

        return;
      }

      const productId =
        manageProduct.externalProductId ||
        manageProduct.id;

      const actionKey =
        `enable:${productId}:${selectedSupplierId}`;

      if (marketplaceAction) {
        return;
      }

      try {
        setMarketplaceAction(
          actionKey
        );

        await enableProductForSupplier(
          productId,
          selectedSupplierId
        );

        toast.success(
          "Product enabled",
          {
            description:
              `${manageProduct.name} has been enabled for the selected supplier.`,
          }
        );

        const result =
          await loadProducts();

        if (result) {
          updateManageProductFromResult(
            result.products
          );
        }
      } catch (error) {
        toast.error(
          "Unable to enable product",
          {
            description:
              getProductErrorMessage(
                error,
                "Product could not be enabled for this supplier."
              ),
          }
        );
      } finally {
        setMarketplaceAction(
          null
        );
      }
    };

  /* =======================================================
     DISABLE PRODUCT
  ======================================================= */

  const handleDisableProduct =
    async (
      supplierId: string
    ) => {
      if (
        !manageProduct ||
        !supplierId
      ) {
        return;
      }

      const productId =
        manageProduct.externalProductId ||
        manageProduct.id;

      const actionKey =
        `disable:${productId}:${supplierId}`;

      if (marketplaceAction) {
        return;
      }

      try {
        setMarketplaceAction(
          actionKey
        );

        await disableProductForSupplier(
          productId,
          supplierId
        );

        toast.success(
          "Product disabled",
          {
            description:
              `${manageProduct.name} has been disabled for ${supplierId}.`,
          }
        );

        const result =
          await loadProducts();

        if (result) {
          updateManageProductFromResult(
            result.products
          );
        }
      } catch (error) {
        toast.error(
          "Unable to disable product",
          {
            description:
              getProductErrorMessage(
                error,
                "Product could not be disabled."
              ),
          }
        );
      } finally {
        setMarketplaceAction(
          null
        );
      }
    };

  /* =======================================================
     PAGE NUMBERS
  ======================================================= */

  const pageNumbers =
    useMemo(() => {
      const totalPages =
        pagination.totalPages;

      if (totalPages <= 1) {
        return [];
      }

      const start =
        Math.max(
          1,
          page - 2
        );

      const end =
        Math.min(
          totalPages,
          start + 4
        );

      const adjustedStart =
        Math.max(
          1,
          end - 4
        );

      const result:
        number[] = [];

      for (
        let current =
          adjustedStart;
        current <= end;
        current += 1
      ) {
        result.push(
          current
        );
      }

      return result;
    }, [
      page,
      pagination.totalPages,
    ]);

  return (
    <>
      <PageMeta
        title="Product Rate List | Solar Trade Hub"
        description="Solar Trade Hub external product Rate List"
      />

      <PageBreadcrumb
        pageTitle="Products"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Product Rate List
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                <span className="size-1.5 rounded-full bg-green-500" />
                Live Catalog
              </span>
            </div>

            <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Products are managed by the external Rate List provider.
              Solar Trade Hub controls supplier marketplace access without
              modifying the external product master.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadProducts(true)
            }
            disabled={
              refreshing ||
              loading
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.04]"
          >
            <RefreshCw
              className={`size-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Rate List"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Catalog Products"
            value={
              catalog?.sourceTotal ??
              pagination.total
            }
            description="External Rate List"
          />

          <SummaryCard
            label="Filtered Results"
            value={
              pagination.total
            }
            description="Current search & filters"
          />

          <SummaryCard
            label="Current Page"
            value={
              pagination.totalPages >
              0
                ? `${page} / ${pagination.totalPages}`
                : "0 / 0"
            }
            description={`${limit} products per page`}
          />
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <div className="relative sm:col-span-2 xl:col-span-3 2xl:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search product, SKU, brand..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff4b1f] dark:border-gray-700 dark:text-white"
              />
            </div>

            <FilterSelect
              value={category}
              onChange={
                updateCategory
              }
              options={
                categoryOptions
              }
              label="Category"
            />

            <FilterSelect
              value={brand}
              onChange={
                updateBrand
              }
              options={
                brandOptions
              }
              label="Brand"
            />

            <FilterSelect
              value={type}
              onChange={
                updateType
              }
              options={
                typeOptions
              }
              label="Type"
            />

            <FilterSelect
              value={availability}
              onChange={
                updateAvailability
              }
              options={
                AVAILABILITY_OPTIONS
              }
              label="Availability"
            />

            <FilterSelect
              value={marketplace}
              onChange={
                updateMarketplace
              }
              options={
                MARKETPLACE_OPTIONS
              }
              label="Marketplace"
            />
          </div>
        </section>

        <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Rate List Products
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Loading products..."
                  : `${pagination.total.toLocaleString(
                      "en-PK"
                    )} matching products`}
              </p>
            </div>

            {catalog?.fetchedAt && (
              <p className="text-xs text-gray-400">
                Synced{" "}
                {formatDateTime(
                  catalog.fetchedAt
                )}
              </p>
            )}
          </div>

          <div className="block w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[1500px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                  <TableHeading>
                    Product
                  </TableHeading>
                  <TableHeading>
                    SKU
                  </TableHeading>
                  <TableHeading>
                    Type
                  </TableHeading>
                  <TableHeading>
                    Category
                  </TableHeading>
                  <TableHeading>
                    Brand
                  </TableHeading>
                  <TableHeading>
                    Size
                  </TableHeading>
                  <TableHeading>
                    Unit
                  </TableHeading>
                  <TableHeading>
                    Rate
                  </TableHeading>
                  <TableHeading>
                    Change
                  </TableHeading>
                  <TableHeading>
                    Availability
                  </TableHeading>
                  <TableHeading>
                    Marketplace
                  </TableHeading>

                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-6 py-16"
                    >
                      <LoadingState />
                    </td>
                  </tr>
                )}

                {!loading &&
                  loadError && (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-6 py-14"
                      >
                        <ErrorState
                          message={
                            loadError
                          }
                          onRetry={() =>
                            void loadProducts()
                          }
                        />
                      </td>
                    </tr>
                  )}

                {!loading &&
                  !loadError &&
                  products.map(
                    (product) => {
                      const externalId =
                        product.externalProductId ||
                        product.id;

                      const categoryName =
                        getProductCategoryName(
                          product
                        ) || "—";

                      const brandName =
                        getProductBrandName(
                          product
                        ) || "—";

                      const accesses =
                        getMarketplaceAccesses(
                          product
                        );

                      return (
                        <tr
                          key={
                            externalId
                          }
                          className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex min-w-[290px] items-center gap-3">
                              <ProductThumbnail
                                product={
                                  product
                                }
                              />

                              <div className="min-w-0">
                                <Link
                                  to={`/products/${encodeURIComponent(
                                    externalId
                                  )}`}
                                  className="line-clamp-2 text-sm font-semibold text-gray-900 transition hover:text-[#ff4b1f] dark:text-white"
                                >
                                  {product.name ||
                                    "Unnamed Product"}
                                </Link>

                                <p className="mt-1 max-w-[250px] truncate font-mono text-[10px] text-gray-400">
                                  {externalId}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="max-w-[220px] px-4 py-3">
                            {product.sku ? (
                              <span className="break-all font-mono text-xs text-gray-600 dark:text-gray-300">
                                {product.sku}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">
                                —
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <ExternalTypeBadge
                              value={
                                product.type
                              }
                            />
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {categoryName}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {brandName}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {formatSize(
                              product
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {product.unit ||
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {formatProductRate(
                                product.rate
                              )}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <RateChangeBadge
                              value={
                                product.rateChangePct
                              }
                            />
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <AvailabilityBadge
                              available={
                                product.available
                              }
                            />
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <MarketplaceBadge
                              enabled={
                                product.marketplaceEnabled
                              }
                              visible={
                                product.marketplaceVisible
                              }
                              supplierCount={
                                accesses.length
                              }
                            />
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <ActionLink
                                to={`/products/${encodeURIComponent(
                                  externalId
                                )}`}
                                title="View Product"
                              >
                                <Eye className="size-4" />
                              </ActionLink>

                              <button
                                type="button"
                                title="Marketplace Access"
                                onClick={() =>
                                  openManageProduct(
                                    product
                                  )
                                }
                                className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#5b2eff]/10 hover:text-[#7c5cff]"
                              >
                                <Settings2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}

                {!loading &&
                  !loadError &&
                  products.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-6 py-14"
                      >
                        <EmptyState />
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
                    {/* PAGINATION */}
          {!loading &&
            !loadError &&
            pagination.total > 0 && (
              <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs text-gray-500">
                    Showing{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {Math.min(
                        (page - 1) * limit + 1,
                        pagination.total
                      )}
                    </span>
                    {" - "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {Math.min(
                        page * limit,
                        pagination.total
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {pagination.total.toLocaleString("en-PK")}
                    </span>
                  </p>

                  <div className="relative">
                    <select
                      value={limit}
                      onChange={(event) => {
                        setLimit(Number(event.target.value));
                        setPage(1);
                      }}
                      className="h-9 appearance-none rounded-lg border border-gray-200 bg-transparent pl-3 pr-8 text-xs font-medium text-gray-600 outline-none focus:border-[#ff4b1f] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size} / page
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <PaginationButton
                      disabled={!pagination.hasPreviousPage || page <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      title="Previous page"
                    >
                      <ChevronLeft className="size-4" />
                    </PaginationButton>

                    {pageNumbers[0] > 1 && (
                      <>
                        <PaginationNumber
                          active={page === 1}
                          onClick={() => setPage(1)}
                        >
                          1
                        </PaginationNumber>

                        {pageNumbers[0] > 2 && (
                          <span className="px-1 text-xs text-gray-400">
                            …
                          </span>
                        )}
                      </>
                    )}

                    {pageNumbers.map((pageNumber) => (
                      <PaginationNumber
                        key={pageNumber}
                        active={pageNumber === page}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </PaginationNumber>
                    ))}

                    {pageNumbers[pageNumbers.length - 1] <
                      pagination.totalPages && (
                      <>
                        {pageNumbers[pageNumbers.length - 1] <
                          pagination.totalPages - 1 && (
                          <span className="px-1 text-xs text-gray-400">
                            …
                          </span>
                        )}

                        <PaginationNumber
                          active={page === pagination.totalPages}
                          onClick={() =>
                            setPage(pagination.totalPages)
                          }
                        >
                          {pagination.totalPages}
                        </PaginationNumber>
                      </>
                    )}

                    <PaginationButton
                      disabled={
                        !pagination.hasNextPage ||
                        page >= pagination.totalPages
                      }
                      onClick={() =>
                        setPage((current) =>
                          Math.min(
                            pagination.totalPages,
                            current + 1
                          )
                        )
                      }
                      title="Next page"
                    >
                      <ChevronRight className="size-4" />
                    </PaginationButton>
                  </div>
                )}
              </div>
            )}
        </section>
      </div>

      {manageProduct && (
        <MarketplaceModal
          product={manageProduct}
          suppliers={suppliers}
          suppliersLoading={suppliersLoading}
          selectedSupplierId={selectedSupplierId}
          setSelectedSupplierId={setSelectedSupplierId}
          marketplaceAction={marketplaceAction}
          onEnable={() => void handleEnableProduct()}
          onDisable={(supplierId) =>
            void handleDisableProduct(supplierId)
          }
          onClose={() => {
            if (marketplaceAction) {
              return;
            }

            setManageProduct(null);
            setSelectedSupplierId("");
          }}
        />
      )}
    </>
  );
}

/* =========================================================
   MARKETPLACE ACCESS MODAL
========================================================= */

function MarketplaceModal({
  product,
  suppliers,
  suppliersLoading,
  selectedSupplierId,
  setSelectedSupplierId,
  marketplaceAction,
  onEnable,
  onDisable,
  onClose,
}: {
  product: Product;
  suppliers: SupplierOption[];
  suppliersLoading: boolean;
  selectedSupplierId: string;
  setSelectedSupplierId: (value: string) => void;
  marketplaceAction: string | null;
  onEnable: () => void;
  onDisable: (supplierId: string) => void;
  onClose: () => void;
}) {
  const accesses = getMarketplaceAccesses(product);

  const activeAccesses = accesses.filter(
    (access) => access.enabled
  );

  const selectedAccess = accesses.find(
    (access) => access.supplierId === selectedSupplierId
  );

  const selectedAlreadyEnabled = selectedAccess?.enabled === true;

  const productId = product.externalProductId || product.id;

  const enableActionKey =
    `enable:${productId}:${selectedSupplierId}`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close marketplace access"
        disabled={Boolean(marketplaceAction)}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101828]">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div className="flex min-w-0 items-center gap-3">
            <ProductThumbnail
              product={product}
              size="large"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                  Marketplace Access
                </h3>

                <MarketplaceBadge
                  enabled={product.marketplaceEnabled}
                  visible={product.marketplaceVisible}
                  supplierCount={accesses.length}
                />
              </div>

              <p className="mt-1 line-clamp-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {product.name || "Unnamed Product"}
              </p>

              <p className="mt-0.5 truncate font-mono text-[10px] text-gray-400">
                {productId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(marketplaceAction)}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-white/[0.05] dark:hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="grid grid-cols-1 gap-3 border-b border-gray-200 p-6 sm:grid-cols-3 dark:border-gray-800">
            <MiniInfoCard
              label="External Rate"
              value={formatProductRate(product.rate)}
            />

            <MiniInfoCard
              label="Availability"
              value={product.available ? "Available" : "Unavailable"}
            />

            <MiniInfoCard
              label="Enabled Suppliers"
              value={String(activeAccesses.length)}
            />
          </div>

          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Power className="size-4 text-[#5b2eff]" />

              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Enable for Supplier
              </h4>
            </div>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Select an eligible supplier to enable this external
              catalogue product for that supplier. Final eligibility is
              validated by the backend.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <select
                  value={selectedSupplierId}
                  disabled={
                    suppliersLoading ||
                    Boolean(marketplaceAction)
                  }
                  onChange={(event) =>
                    setSelectedSupplierId(event.target.value)
                  }
                  className="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-transparent px-3 pr-9 text-sm text-gray-700 outline-none transition focus:border-[#5b2eff] disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-[#111827] dark:text-gray-300"
                >
                  <option value="">
                    {suppliersLoading
                      ? "Loading suppliers..."
                      : "Select supplier"}
                  </option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.supplierId}
                      value={supplier.supplierId}
                    >
                      {supplier.companyName} ({supplier.supplierId})
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>

              <button
                type="button"
                disabled={
                  !selectedSupplierId ||
                  selectedAlreadyEnabled ||
                  Boolean(marketplaceAction)
                }
                onClick={onEnable}
                className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-lg bg-[#5b2eff] px-5 text-sm font-semibold text-white transition hover:bg-[#4e26e6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {marketplaceAction === enableActionKey ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Power className="size-4" />
                )}

                {selectedAlreadyEnabled
                  ? "Already Enabled"
                  : marketplaceAction === enableActionKey
                    ? "Enabling..."
                    : "Enable Product"}
              </button>
            </div>

            {!product.available && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />

                <p>
                  This product is currently unavailable in the
                  external catalogue. Customer visibility still depends
                  on external availability and backend marketplace
                  eligibility.
                </p>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Supplier Access
                </h4>

                <p className="mt-1 text-xs text-gray-500">
                  Current supplier access returned for this product.
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {accesses.length}
              </span>
            </div>

            {accesses.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-5 py-8 text-center dark:border-gray-700">
                <Store className="mx-auto size-6 text-gray-400" />

                <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Not enabled for any supplier
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Select an eligible supplier above to enable this
                  product.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {accesses.map((access) => {
                  const supplierId = access.supplierId || "";

                  const disableActionKey =
                    `disable:${productId}:${supplierId}`;

                  return (
                    <div
                      key={
                        access.accessId ||
                        `${supplierId}-${access.companyName || ""}`
                      }
                      className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {access.companyName || "Unknown Supplier"}
                            </p>

                            {access.visible ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                                <CheckCircle2 className="size-3" />
                                Live
                              </span>
                            ) : access.enabled ? (
                              <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                Enabled / Not Live
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                                Disabled
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                            <span>
                              {supplierId || "No Supplier ID"}
                            </span>

                            <span>
                              Supplier:{" "}
                              {access.supplierStatus || "—"}
                            </span>

                            <span>
                              Verification:{" "}
                              {access.verificationStatus || "—"}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                            <span>
                              Subscription:{" "}
                              {access.subscriptionActive
                                ? access.subscription?.planCode || "Active"
                                : "Inactive"}
                            </span>

                            {access.subscription?.expiresAt && (
                              <span>
                                Expires:{" "}
                                {formatDate(
                                  access.subscription.expiresAt
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {access.enabled && supplierId && (
                          <button
                            type="button"
                            disabled={Boolean(marketplaceAction)}
                            onClick={() => onDisable(supplierId)}
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                          >
                            {marketplaceAction === disableActionKey ? (
                              <LoaderCircle className="size-3.5 animate-spin" />
                            ) : (
                              <PowerOff className="size-3.5" />
                            )}

                            {marketplaceAction === disableActionKey
                              ? "Disabling..."
                              : "Disable"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <button
            type="button"
            disabled={Boolean(marketplaceAction)}
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  label: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-transparent px-3 pr-9 text-sm text-gray-700 outline-none transition focus:border-[#ff4b1f] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

/* =========================================================
   TABLE
========================================================= */

function TableHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

/* =========================================================
   PRODUCT THUMBNAIL
========================================================= */

function ProductThumbnail({
  product,
  size = "normal",
}: {
  product: Product;
  size?: "normal" | "large";
}) {
  const candidates = useMemo(
    () => getProductImageCandidates(product),
    [product]
  );

  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [product.id, product.externalProductId]);

  const imageUrl = candidates[candidateIndex] || "";

  const dimension =
    size === "large" ? "size-14" : "size-11";

  return (
    <div
      className={`${dimension} flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.name || "Product"}
          loading="lazy"
          className="h-full w-full object-contain p-1"
          onError={() => {
            setCandidateIndex((current) => current + 1);
          }}
        />
      ) : (
        <PackageOpen className="size-5 text-gray-400" />
      )}
    </div>
  );
}

/* =========================================================
   TYPE BADGE
========================================================= */

function ExternalTypeBadge({
  value,
}: {
  value: string | null | undefined;
}) {
  const label = value
    ? formatProductType(value)
    : "—";

  return (
    <span className="inline-flex rounded-full bg-[#5b2eff]/10 px-2.5 py-1 text-xs font-semibold text-[#6c48ff] dark:text-[#9d88ff]">
      {label}
    </span>
  );
}

/* =========================================================
   RATE CHANGE
========================================================= */

function RateChangeBadge({
  value,
}: {
  value: number | null | undefined;
}) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return (
      <span className="text-xs text-gray-400">
        —
      </span>
    );
  }

  const numericValue = Number(value);

  if (numericValue === 0) {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        0%
      </span>
    );
  }

  const positive = numericValue > 0;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        positive
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-green-500/10 text-green-600 dark:text-green-400"
      }`}
    >
      {positive ? "+" : ""}
      {numericValue.toFixed(2)}%
    </span>
  );
}

/* =========================================================
   AVAILABILITY
========================================================= */

function AvailabilityBadge({
  available,
}: {
  available: boolean;
}) {
  return available ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
      <span className="size-1.5 rounded-full bg-green-500" />
      Available
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
      <span className="size-1.5 rounded-full bg-red-500" />
      Unavailable
    </span>
  );
}

/* =========================================================
   MARKETPLACE BADGE
========================================================= */

function MarketplaceBadge({
  enabled,
  visible,
  supplierCount,
}: {
  enabled: boolean;
  visible: boolean;
  supplierCount?: number;
}) {
  if (visible) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
        <CheckCircle2 className="size-3.5" />
        Live
        {typeof supplierCount === "number" && supplierCount > 0
          ? ` · ${supplierCount}`
          : ""}
      </span>
    );
  }

  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <CircleAlert className="size-3.5" />
        Enabled / Not Live
        {typeof supplierCount === "number" && supplierCount > 0
          ? ` · ${supplierCount}`
          : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      <PowerOff className="size-3.5" />
      Not Enabled
    </span>
  );
}

/* =========================================================
   ACTION LINK
========================================================= */

function ActionLink({
  to,
  title,
  children,
}: {
  to: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      title={title}
      className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#ff4b1f]/10 hover:text-[#ff4b1f]"
    >
      {children}
    </Link>
  );
}

/* =========================================================
   MINI INFO
========================================================= */

function MiniInfoCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   PAGINATION
========================================================= */

function PaginationButton({
  children,
  disabled,
  onClick,
  title,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-[#ff4b1f]/40 hover:text-[#ff4b1f] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-400"
    >
      {children}
    </button>
  );
}

function PaginationNumber({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-lg border text-xs font-semibold transition ${
        active
          ? "border-[#ff4b1f] bg-[#ff4b1f] text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-[#ff4b1f]/40 hover:text-[#ff4b1f] dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

/* =========================================================
   LOADING / ERROR / EMPTY
========================================================= */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <LoaderCircle className="size-7 animate-spin text-[#ff4b1f]" />

      <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Loading external Rate List
      </p>

      <p className="mt-1 text-xs text-gray-400">
        Fetching the latest product catalogue.
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-red-500/10">
        <CircleAlert className="size-5 text-red-500" />
      </div>

      <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        Rate List could not be loaded
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[#ff4b1f] px-4 text-xs font-semibold text-white transition hover:bg-[#e94118]"
      >
        <RefreshCw className="size-3.5" />
        Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <PackageOpen className="size-5 text-gray-400" />
      </div>

      <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        No products found
      </p>

      <p className="mt-1 text-xs text-gray-500">
        No external Rate List products match the current filters.
      </p>
    </div>
  );
}