
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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

import { toast, Toaster } from "sonner";

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
  getProductErrorMessage,
  getProducts,
  refreshProducts,
  type Product,
  type ProductCatalogMeta,
  type ProductPagination,
} from "../../services/product/product.service";

/* =========================================================
   SOLAR TRADE HUB
   PRODUCT LIST

   External catalogue is read-only.
   Supplier marketplace access is managed locally.
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
};

type MarketplaceSupplierAccess = {
  accessId?: string | null;
  supplierId?: string | null;
  supplierMongoId?: string | null;
  companyName?: string | null;
  supplierStatus?: string | null;
  verificationStatus?: string | null;
  enabled?: boolean;
  enabledAt?: string | null;
  disabledAt?: string | null;
  subscriptionActive?: boolean;
  visible?: boolean;
  marketplaceVisible?: boolean;
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

type FilterOption = {
  value: string;
  label: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const AVAILABILITY_OPTIONS: FilterOption[] = [
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

const MARKETPLACE_OPTIONS: FilterOption[] = [
  {
    value: "All",
    label: "All Statuses",
  },
  {
    value: "visible",
    label: "Live",
  },
  {
    value: "enabled",
    label: "Enabled",
  },
  {
    value: "enabled_not_live",
    label: "Pending Eligibility",
  },
  {
    value: "disabled",
    label: "Disabled",
  },
];

const BIZ_DAILY_ORIGIN =
  "https://api.biz-daily.techoptionz.com";

/* =========================================================
   IMAGE HELPERS

   Images come from the external company catalogue.

   Priority:
   1. imageThumbUrl
   2. imageUrl
   3. Alternative image references

   No external API key is exposed to the browser.
========================================================= */

function readImageReference(
  value: unknown
): string {
  if (typeof value === "string") {
    const text = value.trim();

    if (
      !text ||
      ["null", "undefined", "string"].includes(
        text.toLowerCase()
      )
    ) {
      return "";
    }

    return text;
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const record = value as Record<
      string,
      unknown
    >;

    return (
      readImageReference(record.url) ||
      readImageReference(record.imageUrl) ||
      readImageReference(record.src) ||
      readImageReference(record.path)
    );
  }

  return "";
}

function resolveMediaUrl(
  rawValue: unknown
): string {
  const value = readImageReference(rawValue);

  if (!value) {
    return "";
  }

  if (
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);

      if (
        parsed.protocol !== "http:" &&
        parsed.protocol !== "https:"
      ) {
        return "";
      }

      return parsed.toString();
    } catch {
      return "";
    }
  }

  const path = value.replace(/^\/+/, "");

  if (
    path.startsWith("api/public/")
  ) {
    return `${BIZ_DAILY_ORIGIN}/${path}`;
  }

  if (
    path.startsWith("catalog-images/")
  ) {
    return `${BIZ_DAILY_ORIGIN}/api/public/${path}`;
  }

  const imageDirectoryIndex =
    path.indexOf("catalog-images/");

  if (imageDirectoryIndex >= 0) {
    return (
      `${BIZ_DAILY_ORIGIN}/api/public/` +
      path.slice(imageDirectoryIndex)
    );
  }

  // Preserve the original fallback for image paths
  // hosted on the Solar Trade Hub API server.
  try {
    const baseURL = api.defaults.baseURL;

    if (!baseURL) {
      return value;
    }

    const apiOrigin = new URL(
      baseURL,
      window.location.origin
    ).origin;

    return new URL(
      value.startsWith("/")
        ? value
        : `/${value}`,
      apiOrigin
    ).toString();
  } catch {
    return value;
  }
}

function getProductImageCandidates(
  product: Product
): string[] {
  const raw = product as Product &
    Record<string, any>;

  const media = raw.media || {};

  const firstImage =
    Array.isArray(raw.images) &&
    raw.images.length > 0
      ? raw.images[0]
      : null;

  const values: unknown[] = [
    product.imageThumbUrl,
    product.imageUrl,

    raw.image_thumb_url,
    raw.image_url,

    raw.thumbnailUrl,
    raw.thumbUrl,
    raw.thumbnail,
    raw.image,
    raw.photoUrl,
    raw.photo,

    media.imageThumbUrl,
    media.thumbnailUrl,
    media.thumbUrl,
    media.imageUrl,
    media.url,

    firstImage?.thumbnailUrl,
    firstImage?.thumbUrl,
    firstImage?.imageThumbUrl,
    firstImage?.imageUrl,
    firstImage?.url,
    firstImage,
  ];

  const candidates = values
    .map(resolveMediaUrl)
    .filter(Boolean);

  return Array.from(
    new Set(candidates)
  );
}

/* =========================================================
   DISPLAY HELPERS
========================================================= */

function formatDateTime(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
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
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
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

function formatSize(
  product: Product
): string {
  if (
    product.size === null ||
    product.size === undefined ||
    product.size === ""
  ) {
    return "—";
  }

  if (
    typeof product.size === "number"
  ) {
    return product.size.toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 3,
      }
    );
  }

  return String(product.size);
}

function getCatalogNames(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const names = value
    .map((item) => {
      if (
        typeof item === "string"
      ) {
        return item.trim();
      }

      if (
        item &&
        typeof item === "object" &&
        "name" in item
      ) {
        const name = (
          item as {
            name?: unknown;
          }
        ).name;

        return typeof name === "string"
          ? name.trim()
          : "";
      }

      return "";
    })
    .filter(Boolean);

  return Array.from(
    new Set(names)
  ).sort((a, b) =>
    a.localeCompare(b)
  );
}

function getMarketplaceAccesses(
  product: Product | null | undefined
): MarketplaceSupplierAccess[] {
  if (!product) {
    return [];
  }

  const accesses = (
    product as Product & {
      marketplaceSuppliers?:
        MarketplaceSupplierAccess[];
    }
  ).marketplaceSuppliers;

  return Array.isArray(accesses)
    ? accesses
    : [];
}

function extractSuppliers(
  payload: SupplierApiEnvelope
): SupplierOption[] {
  if (
    Array.isArray(payload.data)
  ) {
    return payload.data;
  }

  if (
    payload.data &&
    !Array.isArray(payload.data) &&
    Array.isArray(
      payload.data.suppliers
    )
  ) {
    return payload.data.suppliers;
  }

  if (
    Array.isArray(payload.suppliers)
  ) {
    return payload.suppliers;
  }

  return [];
}

/* =========================================================
   PRODUCTS PAGE
========================================================= */

export default function ProductsList() {
  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    pagination,
    setPagination,
  ] = useState<ProductPagination>({
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
  ] = useState<ProductCatalogMeta | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [search, setSearch] =
    useState("");

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
    productType,
    setProductType,
  ] = useState("All");

  const [
    availability,
    setAvailability,
  ] = useState<AvailabilityFilter>(
    "All"
  );

  const [
    marketplace,
    setMarketplace,
  ] = useState<MarketplaceFilter>(
    "All"
  );

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(20);

  const [
    suppliers,
    setSuppliers,
  ] = useState<SupplierOption[]>([]);

  const [
    suppliersLoading,
    setSuppliersLoading,
  ] = useState(false);

  const [
    manageProduct,
    setManageProduct,
  ] = useState<Product | null>(
    null
  );

  const [
    selectedSupplierId,
    setSelectedSupplierId,
  ] = useState("");

  const [
    marketplaceAction,
    setMarketplaceAction,
  ] = useState<string | null>(
    null
  );

  const requestSequence = useRef(0);

  /* =======================================================
     DEBOUNCED SEARCH
  ======================================================= */

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        setDebouncedSearch(
          search.trim()
        );

        setPage(1);
      },
      450
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);

  /* =======================================================
     QUERY
  ======================================================= */

  const buildQuery = useCallback(
    () => ({
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
        productType === "All"
          ? undefined
          : productType,

      available:
        availability === "All"
          ? undefined
          : availability ===
            "available",

      marketplaceEnabled:
        marketplace === "enabled" ||
        marketplace ===
          "enabled_not_live"
          ? true
          : marketplace === "disabled"
            ? false
            : undefined,

      marketplaceVisible:
        marketplace === "visible"
          ? true
          : marketplace ===
              "enabled_not_live"
            ? false
            : undefined,

      sortBy: "name" as const,
      sortOrder: "asc" as const,
    }),
    [
      page,
      limit,
      debouncedSearch,
      category,
      brand,
      productType,
      availability,
      marketplace,
    ]
  );

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts = useCallback(
    async (
      forceRefresh = false
    ) => {
      const requestId =
        ++requestSequence.current;

      try {
        if (forceRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setLoadError("");

        const query = buildQuery();

        const result = forceRefresh
          ? await refreshProducts(query)
          : await getProducts(query);

        if (
          requestId !==
          requestSequence.current
        ) {
          return null;
        }

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
            "Catalogue synchronized",
            {
              description: `${
                result.catalog
                  ?.sourceTotal ??
                result.pagination.total
              } products retrieved.`,
            }
          );
        }

        return result;
      } catch (error) {
        if (
          requestId !==
          requestSequence.current
        ) {
          return null;
        }

        const message =
          getProductErrorMessage(
            error,
            "Unable to load products."
          );

        setLoadError(message);

        toast.error(
          "Unable to load products",
          {
            description: message,
          }
        );

        return null;
      } finally {
        if (
          requestId ===
          requestSequence.current
        ) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [buildQuery]
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  /* =======================================================
     LOAD VERIFIED SUPPLIERS
  ======================================================= */

  const loadSuppliers = useCallback(
    async () => {
      try {
        setSuppliersLoading(true);

        const response =
          await api.get<SupplierApiEnvelope>(
            "/suppliers/active",
            {
              params: {
                limit: 100,
              },
            }
          );

        const eligible =
          extractSuppliers(
            response.data
          )
            .filter(
              (supplier) =>
                supplier.status ===
                  "active" &&
                supplier.verificationStatus ===
                  "verified"
            )
            .sort((a, b) =>
              a.companyName.localeCompare(
                b.companyName
              )
            );

        setSuppliers(
          eligible
        );
      } catch (error) {
        console.error(
          "Supplier loading failed:",
          error
        );

        setSuppliers([]);
      } finally {
        setSuppliersLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  /* =======================================================
     FILTER OPTIONS
  ======================================================= */

  const categoryOptions = useMemo(
    () => {
      const names = Array.from(
        new Set([
          ...getCatalogNames(
            catalog?.categories
          ),

          ...products
            .map((product) =>
              getProductCategoryName(
                product
              ).trim()
            )
            .filter(Boolean),

          ...(category !== "All"
            ? [category]
            : []),
        ])
      ).sort((a, b) =>
        a.localeCompare(b)
      );

      return [
        {
          value: "All",
          label: "All Categories",
        },
        ...names.map((name) => ({
          value: name,
          label: name,
        })),
      ];
    },
    [
      catalog,
      products,
      category,
    ]
  );

  const brandOptions = useMemo(
    () => {
      const names = Array.from(
        new Set([
          ...getCatalogNames(
            catalog?.brands
          ),

          ...products
            .map((product) =>
              getProductBrandName(
                product
              ).trim()
            )
            .filter(Boolean),

          ...(brand !== "All"
            ? [brand]
            : []),
        ])
      ).sort((a, b) =>
        a.localeCompare(b)
      );

      return [
        {
          value: "All",
          label: "All Brands",
        },
        ...names.map((name) => ({
          value: name,
          label: name,
        })),
      ];
    },
    [
      catalog,
      products,
      brand,
    ]
  );

  const typeOptions = useMemo(
    () => {
      const catalogTypes =
        Array.isArray(
          catalog?.types
        )
          ? catalog.types
          : [];

      const values = Array.from(
        new Set([
          ...catalogTypes,

          ...products
            .map((product) =>
              String(
                product.type || ""
              ).trim()
            )
            .filter(Boolean),

          ...(productType !== "All"
            ? [productType]
            : []),
        ])
      ).sort((a, b) =>
        a.localeCompare(b)
      );

      return [
        {
          value: "All",
          label: "All Types",
        },
        ...values.map((value) => ({
          value,
          label:
            formatProductType(value),
        })),
      ];
    },
    [
      catalog,
      products,
      productType,
    ]
  );

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
    setProductType(value);
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
     SUPPLIER ACCESS
  ======================================================= */

  const openManageProduct = (
    product: Product
  ) => {
    setManageProduct(
      product
    );

    setSelectedSupplierId("");
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

  const handleEnableProduct = async () => {
    if (
      !manageProduct ||
      !selectedSupplierId ||
      marketplaceAction
    ) {
      return;
    }

    const productId =
      manageProduct.externalProductId ||
      manageProduct.id;

    const actionKey =
      `enable:${productId}:${selectedSupplierId}`;

    try {
      setMarketplaceAction(
        actionKey
      );

      await enableProductForSupplier(
        productId,
        selectedSupplierId
      );

      toast.success(
        "Supplier access enabled"
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
        "Unable to enable supplier",
        {
          description:
            getProductErrorMessage(
              error,
              "Request failed."
            ),
        }
      );
    } finally {
      setMarketplaceAction(null);
    }
  };

  const handleDisableProduct = async (
    supplierId: string
  ) => {
    if (
      !manageProduct ||
      !supplierId ||
      marketplaceAction
    ) {
      return;
    }

    const productId =
      manageProduct.externalProductId ||
      manageProduct.id;

    const actionKey =
      `disable:${productId}:${supplierId}`;

    try {
      setMarketplaceAction(
        actionKey
      );

      await disableProductForSupplier(
        productId,
        supplierId
      );

      toast.success(
        "Supplier access disabled"
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
        "Unable to disable supplier",
        {
          description:
            getProductErrorMessage(
              error,
              "Request failed."
            ),
        }
      );
    } finally {
      setMarketplaceAction(null);
    }
  };

  /* =======================================================
     PAGINATION
  ======================================================= */

  const pageNumbers = useMemo(
    () => {
      const totalPages =
        pagination.totalPages;

      if (totalPages <= 1) {
        return [];
      }

      const start = Math.max(
        1,
        page - 2
      );

      const end = Math.min(
        totalPages,
        start + 4
      );

      const adjustedStart = Math.max(
        1,
        end - 4
      );

      const numbers: number[] = [];

      for (
        let number = adjustedStart;
        number <= end;
        number += 1
      ) {
        numbers.push(number);
      }

      return numbers;
    },
    [
      page,
      pagination.totalPages,
    ]
  );

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Product Catalogue | Solar Trade Hub"
        description="External product catalogue"
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
        {/* HEADER */}

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Product Catalogue
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              External products and supplier access.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadProducts(true)
            }
            disabled={
              loading ||
              refreshing
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
          >
            <RefreshCw
              className={`size-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Synchronizing..."
              : "Sync Catalogue"}
          </button>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Total Products"
            value={
              catalog?.sourceTotal ??
              pagination.total
            }
          />

          <SummaryCard
            label="Results"
            value={
              pagination.total
            }
          />

          <SummaryCard
            label="Page"
            value={
              pagination.totalPages > 0
                ? `${page} / ${pagination.totalPages}`
                : "0 / 0"
            }
          />
        </div>

        {/* FILTERS */}

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
                placeholder="Search products..."
                aria-label="Search products"
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#ff4b1f] dark:border-gray-700 dark:text-white"
              />
            </div>

            <FilterSelect
              label="Category"
              value={category}
              onChange={updateCategory}
              options={categoryOptions}
            />

            <FilterSelect
              label="Brand"
              value={brand}
              onChange={updateBrand}
              options={brandOptions}
            />

            <FilterSelect
              label="Type"
              value={productType}
              onChange={updateType}
              options={typeOptions}
            />

            <FilterSelect
              label="Availability"
              value={availability}
              onChange={updateAvailability}
              options={AVAILABILITY_OPTIONS}
            />

            <FilterSelect
              label="Marketplace"
              value={marketplace}
              onChange={updateMarketplace}
              options={MARKETPLACE_OPTIONS}
            />
          </div>
        </section>

        {/* PRODUCTS TABLE */}

        <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Products
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Loading..."
                  : `${pagination.total.toLocaleString(
                      "en-PK"
                    )} results`}
              </p>
            </div>

            {catalog?.fetchedAt && (
              <p className="text-xs text-gray-400">
                Last synced:{" "}
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
                  {[
                    "Product",
                    "SKU",
                    "Type",
                    "Category",
                    "Brand",
                    "Size",
                    "Unit",
                    "Rate",
                    "Change",
                    "Availability",
                    "Marketplace",
                  ].map((heading) => (
                    <TableHeading key={heading}>
                      {heading}
                    </TableHeading>
                  ))}

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
                          message={loadError}
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

                      const accesses =
                        getMarketplaceAccesses(
                          product
                        );

                      return (
                        <tr
                          key={externalId}
                          className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex min-w-[290px] items-center gap-3">
                              <ProductThumbnail
                                product={product}
                              />

                              <div className="min-w-0">
                                <Link
                                  to={`/products/${encodeURIComponent(
                                    externalId
                                  )}`}
                                  className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-[#ff4b1f] dark:text-white"
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

                          <td className="max-w-[220px] px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                            {product.sku ||
                              "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <TypeBadge
                              value={
                                product.type
                              }
                            />
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {getProductCategoryName(
                              product
                            ) || "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {getProductBrandName(
                              product
                            ) || "—"}
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
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {formatProductRate(
                                product.rate
                              )}
                            </span>
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
                                title="Supplier Access"
                                aria-label={`Manage supplier access for ${product.name}`}
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
                  products.length === 0 && (
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
                    {Math.min(
                      (page - 1) *
                        limit +
                        1,
                      pagination.total
                    )}
                    {"–"}
                    {Math.min(
                      page * limit,
                      pagination.total
                    )}{" "}
                    of{" "}
                    {pagination.total.toLocaleString(
                      "en-PK"
                    )}
                  </p>

                  <div className="relative">
                    <select
                      value={limit}
                      onChange={(event) => {
                        setLimit(
                          Number(
                            event.target.value
                          )
                        );
                        setPage(1);
                      }}
                      aria-label="Products per page"
                      className="h-9 appearance-none rounded-lg border border-gray-200 bg-transparent pl-3 pr-8 text-xs font-medium text-gray-600 outline-none focus:border-[#ff4b1f] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
                    >
                      {PAGE_SIZE_OPTIONS.map(
                        (size) => (
                          <option
                            key={size}
                            value={size}
                          >
                            {size} / page
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <PaginationButton
                      disabled={
                        !pagination.hasPreviousPage ||
                        page <= 1
                      }
                      onClick={() =>
                        setPage((current) =>
                          Math.max(
                            1,
                            current - 1
                          )
                        )
                      }
                      title="Previous page"
                    >
                      <ChevronLeft className="size-4" />
                    </PaginationButton>

                    {pageNumbers.length > 0 &&
                      pageNumbers[0] > 1 && (
                        <>
                          <PaginationNumber
                            active={page === 1}
                            onClick={() =>
                              setPage(1)
                            }
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

                    {pageNumbers.map(
                      (pageNumber) => (
                        <PaginationNumber
                          key={pageNumber}
                          active={
                            pageNumber ===
                            page
                          }
                          onClick={() =>
                            setPage(
                              pageNumber
                            )
                          }
                        >
                          {pageNumber}
                        </PaginationNumber>
                      )
                    )}

                    {pageNumbers.length > 0 &&
                      pageNumbers[
                        pageNumbers.length - 1
                      ] <
                        pagination.totalPages && (
                        <>
                          {pageNumbers[
                            pageNumbers.length - 1
                          ] <
                            pagination.totalPages -
                              1 && (
                            <span className="px-1 text-xs text-gray-400">
                              …
                            </span>
                          )}

                          <PaginationNumber
                            active={
                              page ===
                              pagination.totalPages
                            }
                            onClick={() =>
                              setPage(
                                pagination.totalPages
                              )
                            }
                          >
                            {pagination.totalPages}
                          </PaginationNumber>
                        </>
                      )}

                    <PaginationButton
                      disabled={
                        !pagination.hasNextPage ||
                        page >=
                          pagination.totalPages
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

      {/* SUPPLIER ACCESS MODAL */}

      {manageProduct && (
        <MarketplaceModal
          product={manageProduct}
          suppliers={suppliers}
          suppliersLoading={
            suppliersLoading
          }
          selectedSupplierId={
            selectedSupplierId
          }
          setSelectedSupplierId={
            setSelectedSupplierId
          }
          marketplaceAction={
            marketplaceAction
          }
          onEnable={() =>
            void handleEnableProduct()
          }
          onDisable={(supplierId) =>
            void handleDisableProduct(
              supplierId
            )
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
   SUPPLIER ACCESS MODAL
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
  setSelectedSupplierId:
    (value: string) => void;
  marketplaceAction: string | null;
  onEnable: () => void;
  onDisable: (
    supplierId: string
  ) => void;
  onClose: () => void;
}) {
  const accesses =
    getMarketplaceAccesses(
      product
    );

  const activeAccesses =
    accesses.filter(
      (access) => access.enabled
    );

  const selectedAccess =
    accesses.find(
      (access) =>
        access.supplierId ===
        selectedSupplierId
    );

  const selectedAlreadyEnabled =
    selectedAccess?.enabled === true;

  const productId =
    product.externalProductId ||
    product.id;

  const enableActionKey =
    `enable:${productId}:${selectedSupplierId}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Supplier Access"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close supplier access"
        disabled={
          Boolean(marketplaceAction)
        }
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101828]">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div className="flex min-w-0 items-center gap-3">
            <ProductThumbnail
              product={product}
              size="large"
            />

            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Supplier Access
              </h3>

              <p className="mt-1 line-clamp-1 text-sm text-gray-600 dark:text-gray-300">
                {product.name}
              </p>

              <p className="mt-0.5 truncate font-mono text-[10px] text-gray-400">
                {productId}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close"
            disabled={
              Boolean(marketplaceAction)
            }
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 dark:hover:bg-white/[0.05]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* CONTENT */}

        <div className="overflow-y-auto">
          <div className="grid grid-cols-1 gap-3 border-b border-gray-200 p-6 sm:grid-cols-3 dark:border-gray-800">
            <MiniInfoCard
              label="Rate"
              value={formatProductRate(
                product.rate
              )}
            />

            <MiniInfoCard
              label="Availability"
              value={
                product.available
                  ? "Available"
                  : "Unavailable"
              }
            />

            <MiniInfoCard
              label="Enabled Suppliers"
              value={
                activeAccesses.length
              }
            />
          </div>

          {/* ENABLE */}

          <div className="border-b border-gray-200 p-6 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Power className="size-4 text-[#5b2eff]" />

              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Enable Supplier
              </h4>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <select
                  value={
                    selectedSupplierId
                  }
                  disabled={
                    suppliersLoading ||
                    Boolean(
                      marketplaceAction
                    )
                  }
                  onChange={(event) =>
                    setSelectedSupplierId(
                      event.target.value
                    )
                  }
                  className="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-transparent px-3 pr-9 text-sm text-gray-700 outline-none focus:border-[#5b2eff] disabled:opacity-60 dark:border-gray-700 dark:bg-[#111827] dark:text-gray-300"
                >
                  <option value="">
                    {suppliersLoading
                      ? "Loading suppliers..."
                      : "Select Supplier"}
                  </option>

                  {suppliers.map(
                    (supplier) => (
                      <option
                        key={
                          supplier.supplierId
                        }
                        value={
                          supplier.supplierId
                        }
                      >
                        {supplier.companyName} (
                        {supplier.supplierId})
                      </option>
                    )
                  )}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>

              <button
                type="button"
                disabled={
                  !selectedSupplierId ||
                  selectedAlreadyEnabled ||
                  Boolean(
                    marketplaceAction
                  )
                }
                onClick={onEnable}
                className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-lg bg-[#5b2eff] px-5 text-sm font-semibold text-white transition hover:bg-[#4e26e6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {marketplaceAction ===
                enableActionKey ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Power className="size-4" />
                )}

                {selectedAlreadyEnabled
                  ? "Enabled"
                  : marketplaceAction ===
                      enableActionKey
                    ? "Enabling..."
                    : "Enable"}
              </button>
            </div>

            {!product.available && (
              <p className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <CircleAlert className="size-4 shrink-0" />
                Product unavailable in the external catalogue.
              </p>
            )}
          </div>

          {/* SUPPLIER ASSIGNMENTS */}

          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Assigned Suppliers
              </h4>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {accesses.length}
              </span>
            </div>

            {accesses.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-5 py-8 text-center dark:border-gray-700">
                <Store className="mx-auto size-6 text-gray-400" />

                <p className="mt-2 text-sm text-gray-500">
                  No suppliers assigned.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {accesses.map(
                  (access) => {
                    const supplierId =
                      access.supplierId ||
                      "";

                    const visible =
                      access.visible ===
                        true ||
                      access.marketplaceVisible ===
                        true;

                    const disableActionKey =
                      `disable:${productId}:${supplierId}`;

                    return (
                      <div
                        key={
                          access.accessId ||
                          `${supplierId}-${access.companyName}`
                        }
                        className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {access.companyName ||
                                  "Supplier"}
                              </p>

                              <AccessStatus
                                enabled={
                                  access.enabled ===
                                  true
                                }
                                visible={
                                  visible
                                }
                              />
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                              <span>
                                {supplierId ||
                                  "—"}
                              </span>

                              <span>
                                Verification:{" "}
                                {access.verificationStatus ||
                                  "—"}
                              </span>

                              <span>
                                Subscription:{" "}
                                {access.subscriptionActive
                                  ? access.subscription
                                      ?.planCode ||
                                    "Active"
                                  : "Inactive"}
                              </span>

                              {access.subscription
                                ?.expiresAt && (
                                <span>
                                  Expires:{" "}
                                  {formatDate(
                                    access.subscription
                                      .expiresAt
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {access.enabled &&
                            supplierId && (
                              <button
                                type="button"
                                disabled={
                                  Boolean(
                                    marketplaceAction
                                  )
                                }
                                onClick={() =>
                                  onDisable(
                                    supplierId
                                  )
                                }
                                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20"
                              >
                                {marketplaceAction ===
                                disableActionKey ? (
                                  <LoaderCircle className="size-3.5 animate-spin" />
                                ) : (
                                  <PowerOff className="size-3.5" />
                                )}

                                {marketplaceAction ===
                                disableActionKey
                                  ? "Disabling..."
                                  : "Disable"}
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <button
            type="button"
            disabled={
              Boolean(marketplaceAction)
            }
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
    () => getProductImageCandidates(
      product
    ),
    [product]
  );

  const [
    candidateIndex,
    setCandidateIndex,
  ] = useState(0);

  const imageKey = [
    product.externalProductId ||
      product.id,
    product.imageThumbUrl ||
      "",
    product.imageUrl || "",
  ].join(":");

  const previousImageKey =
    useRef(imageKey);

  // Reset the candidate index when the product or its
  // image references change. Avoid a stale thumbnail
  // during a catalogue refresh.
  if (
    previousImageKey.current !==
    imageKey
  ) {
    previousImageKey.current =
      imageKey;

    if (candidateIndex !== 0) {
      setCandidateIndex(0);
    }
  }

  const imageUrl =
    candidates[candidateIndex] ||
    "";

  const dimension =
    size === "large"
      ? "size-14"
      : "size-11";

  const handleImageError = () => {
    if (import.meta.env.DEV) {
      console.warn(
        "[Product image failed]",
        {
          productId:
            product.externalProductId ||
            product.id,

          productName:
            product.name,

          attemptedUrl:
            imageUrl,

          nextCandidate:
            candidates[
              candidateIndex + 1
            ] || null,

          imageUrlField:
            product.imageUrl,

          imageThumbUrlField:
            product.imageThumbUrl,
        }
      );
    }

    setCandidateIndex(
      (current) =>
        Math.min(
          current + 1,
          candidates.length
        )
    );
  };

  return (
    <div
      className={`${dimension} flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800`}
    >
      {imageUrl ? (
        <img
          key={`${imageKey}-${candidateIndex}`}
          src={imageUrl}
          alt={
            product.name ||
            "Product"
          }
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-1"
          onError={
            handleImageError
          }
        />
      ) : (
        <PackageOpen
          className="size-5 text-gray-400"
          aria-label="Image unavailable"
        />
      )}
    </div>
  );
}

/* =========================================================
   SHARED UI
========================================================= */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        aria-label={
          label
        }
        value={
          value
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-transparent px-3 pr-9 text-sm text-gray-700 outline-none focus:border-[#ff4b1f] dark:border-gray-700 dark:bg-[#101828] dark:text-gray-300"
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

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

function TypeBadge({
  value,
}: {
  value:
    | string
    | null
    | undefined;
}) {
  return (
    <span className="inline-flex rounded-full bg-[#5b2eff]/10 px-2.5 py-1 text-xs font-semibold text-[#6c48ff] dark:text-[#9d88ff]">
      {value
        ? formatProductType(
            value
          )
        : "—"}
    </span>
  );
}

function RateChangeBadge({
  value,
}: {
  value:
    | number
    | null
    | undefined;
}) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(
      Number(value)
    )
  ) {
    return (
      <span className="text-xs text-gray-400">
        —
      </span>
    );
  }

  const number = Number(
    value
  );

  if (number === 0) {
    return (
      <span className="text-xs font-semibold text-gray-500">
        0%
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        number > 0
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-green-500/10 text-green-600 dark:text-green-400"
      }`}
    >
      {number > 0
        ? "+"
        : ""}
      {number.toFixed(2)}%
    </span>
  );
}

function AvailabilityBadge({
  available,
}: {
  available: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        available
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400"
      }`}
    >
      {available
        ? "Available"
        : "Unavailable"}
    </span>
  );
}

function AccessStatus({
  enabled,
  visible,
}: {
  enabled: boolean;
  visible: boolean;
}) {
  if (visible) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
        <CheckCircle2 className="size-3" />
        Live
      </span>
    );
  }

  if (enabled) {
    return (
      <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        Pending Eligibility
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      Disabled
    </span>
  );
}

function MarketplaceBadge({
  enabled,
  visible,
  supplierCount,
}: {
  enabled: boolean;
  visible: boolean;
  supplierCount?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <AccessStatus
        enabled={enabled}
        visible={visible}
      />

      {typeof supplierCount ===
        "number" &&
        supplierCount > 0 && (
          <span className="text-xs text-gray-400">
            {supplierCount}
          </span>
        )}
    </div>
  );
}

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
      aria-label={title}
      className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#ff4b1f]/10 hover:text-[#ff4b1f]"
    >
      {children}
    </Link>
  );
}

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

function PaginationButton({
  children,
  disabled,
  onClick,
  title,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
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
      aria-current={
        active
          ? "page"
          : undefined
      }
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

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <LoaderCircle className="size-7 animate-spin text-[#ff4b1f]" />

      <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Loading products...
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
      <CircleAlert className="mx-auto size-8 text-red-500" />

      <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        Unable to load products
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[#ff4b1f] px-4 text-xs font-semibold text-white"
      >
        <RefreshCw className="size-3.5" />
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <PackageOpen className="size-8 text-gray-400" />

      <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        No products found
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Adjust the filters and try again.
      </p>
    </div>
  );
}
