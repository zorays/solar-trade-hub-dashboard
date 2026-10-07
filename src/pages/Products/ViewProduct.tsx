import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

import {
  Link,
  useParams,
} from "react-router";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ImageOff,
  LoaderCircle,
  PackageOpen,
  PowerOff,
  RefreshCw,
  Store,
} from "lucide-react";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import api from "../../services/api";

import {
  formatProductRate,
  formatProductType,
  getProduct,
  getProductBrandName,
  getProductCategoryName,
  getProductDisplayImage,
  getProductErrorMessage,
  type Product,
} from "../../services/product/product.service";

/* =========================================================
   TYPES
========================================================= */

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

type ProductImageItem = {
  id: string;
  url: string;
  alt: string;
  primary: boolean;
};

type SpecificationItem = {
  group: string;
  label: string;
  value: string;
  unit: string;
};

/* =========================================================
   EXTERNAL MEDIA

   Product master belongs to the external Rate List provider.
   External catalogue images must resolve against Biz Daily.
========================================================= */

const BIZ_DAILY_API_ORIGIN =
  "https://api.biz-daily.techoptionz.com";

function resolveMediaUrl(
  imageUrl: string | null | undefined
) {
  const value = String(imageUrl || "").trim();

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
    value.startsWith("/catalog-images/")
  ) {
    return `${BIZ_DAILY_API_ORIGIN}/api/public${value}`;
  }

  if (
    value.startsWith("catalog-images/")
  ) {
    return `${BIZ_DAILY_API_ORIGIN}/api/public/${value}`;
  }

  const catalogImageIndex =
    value.indexOf("catalog-images/");

  if (catalogImageIndex >= 0) {
    const catalogPath =
      value.slice(catalogImageIndex);

    return `${BIZ_DAILY_API_ORIGIN}/api/public/${catalogPath}`;
  }

  /*
   * Fallback only.
   * Useful if backend ever returns another relative media URL.
   */

  const baseURL = api.defaults.baseURL;

  if (!baseURL) {
    return value;
  }

  try {
    const apiUrl = new URL(
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
   SAFE DISPLAY
========================================================= */

function displayValue(
  value: unknown,
  fallback = "—"
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const text = String(value).trim();

  return text || fallback;
}

function formatSize(product: Product) {
  if (
    product.size === null ||
    product.size === undefined ||
    product.size === ""
  ) {
    return "—";
  }

  if (typeof product.size === "number") {
    return product.size.toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 3,
      }
    );
  }

  return String(product.size);
}

function formatDateTime(
  value: string | null | undefined
) {
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
) {
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

/* =========================================================
   MARKETPLACE ACCESS
========================================================= */

function getMarketplaceAccesses(
  product: Product
): MarketplaceSupplierAccess[] {
  const raw =
    product as Product &
      Record<string, any>;

  const accesses =
    raw.marketplaceSuppliers;

  return Array.isArray(accesses)
    ? accesses
    : [];
}

/* =========================================================
   IMAGES

   We intentionally support both normalized service fields
   and any raw external image structures already returned
   with the product.
========================================================= */

function getProductImages(
  product: Product
): ProductImageItem[] {
  const raw =
    product as Product &
      Record<string, any>;

  const items: ProductImageItem[] = [];

  const pushImage = (
    source: unknown,
    options?: {
      id?: string;
      alt?: string;
      primary?: boolean;
    }
  ) => {
    if (!source) {
      return;
    }

    let sourceUrl = "";
    let sourceAlt =
      options?.alt || product.name || "Product";
    let sourceId =
      options?.id || "";
    let primary =
      options?.primary || false;

    if (typeof source === "string") {
      sourceUrl = source;
    } else if (
      typeof source === "object"
    ) {
      const item =
        source as Record<string, any>;

      sourceUrl =
        item.url ||
        item.imageUrl ||
        item.thumbnailUrl ||
        item.thumbUrl ||
        item.src ||
        "";

      sourceAlt =
        item.alt ||
        item.altText ||
        sourceAlt;

      sourceId =
        item._id ||
        item.id ||
        sourceId;

      primary =
        Boolean(
          item.isPrimary ??
            item.primary ??
            primary
        );
    }

    const url =
      resolveMediaUrl(sourceUrl);

    if (!url) {
      return;
    }

    if (
      items.some(
        (item) => item.url === url
      )
    ) {
      return;
    }

    items.push({
      id:
        sourceId ||
        `image-${items.length + 1}`,
      url,
      alt: sourceAlt,
      primary,
    });
  };

  if (
    Array.isArray(raw.images)
  ) {
    raw.images.forEach(
      (image: unknown) =>
        pushImage(image)
    );
  }

  pushImage(
    raw.primaryImage,
    {
      primary: true,
    }
  );

  pushImage(
    product.imageUrl,
    {
      primary: true,
    }
  );

  pushImage(
    product.imageThumbUrl
  );

  pushImage(
    raw.thumbnailUrl
  );

  pushImage(
    raw.thumbnail
  );

  pushImage(
    raw.image
  );

  pushImage(
    raw.photoUrl
  );

  pushImage(
    raw.photo
  );

  pushImage(
    raw.media?.imageUrl
  );

  pushImage(
    raw.media?.url
  );

  pushImage(
    raw.media?.thumbnailUrl
  );

  pushImage(
    getProductDisplayImage(product),
    {
      primary: true,
    }
  );

  return items.sort(
    (first, second) =>
      Number(second.primary) -
      Number(first.primary)
  );
}

/* =========================================================
   SPECIFICATIONS

   Display only specifications actually returned by API.
========================================================= */

function getSpecifications(
  product: Product
): SpecificationItem[] {
  const raw =
    product as Product &
      Record<string, any>;

  if (
    !Array.isArray(
      raw.specifications
    )
  ) {
    return [];
  }

  return raw.specifications
    .map(
      (
        specification: any
      ): SpecificationItem | null => {
        if (!specification) {
          return null;
        }

        if (
          typeof specification ===
          "string"
        ) {
          return {
            group: "General",
            label: "Specification",
            value: specification,
            unit: "",
          };
        }

        const label =
          displayValue(
            specification.label ||
              specification.name ||
              specification.key,
            ""
          );

        const value =
          displayValue(
            specification.value,
            ""
          );

        if (!label || !value) {
          return null;
        }

        return {
          group:
            displayValue(
              specification.group,
              "General"
            ),
          label,
          value,
          unit:
            displayValue(
              specification.unit,
              ""
            ),
        };
      }
    )
    .filter(
      (
        item
      ): item is SpecificationItem =>
        Boolean(item)
    );
}

/* =========================================================
   DESCRIPTION
========================================================= */

function getDescription(
  product: Product
) {
  const raw =
    product as Product &
      Record<string, any>;

  return displayValue(
    raw.description ||
      raw.details ||
      raw.shortDescription,
    ""
  );
}

/* =========================================================
   VIEW PRODUCT
========================================================= */

export default function ViewProduct() {
  const params = useParams();

  const productReference =
    params.productId ||
    params.id ||
    "";

  const [
    product,
    setProduct,
  ] =
    useState<Product | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    selectedImageIndex,
    setSelectedImageIndex,
  ] = useState(0);

  /* =======================================================
     LOAD
  ======================================================= */

  const loadProduct =
    useCallback(async () => {
      if (!productReference) {
        setLoadError(
          "Product reference is missing."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const result =
          await getProduct(
            productReference
          );

        setProduct(result);

        setSelectedImageIndex(0);
      } catch (error) {
        setProduct(null);

        setLoadError(
          getProductErrorMessage(
            error,
            "Unable to load external product."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [productReference]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const images =
    useMemo(
      () =>
        product
          ? getProductImages(product)
          : [],
      [product]
    );

  const specifications =
    useMemo(
      () =>
        product
          ? getSpecifications(product)
          : [],
      [product]
    );

  const accesses =
    useMemo(
      () =>
        product
          ? getMarketplaceAccesses(
              product
            )
          : [],
      [product]
    );

  const selectedImage =
    images[selectedImageIndex] ||
    images[0] ||
    null;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <PageMeta
          title="Product Details | Solar Trade Hub"
          description="View external Rate List product"
        />

        <PageBreadcrumb
          pageTitle="Product Details"
        />

        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <LoaderCircle className="mx-auto size-8 animate-spin text-[#5b2eff]" />

          <h2 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
            Loading product
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Fetching the external Rate List product.
          </p>
        </div>
      </>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    loadError ||
    !product
  ) {
    return (
      <>
        <PageMeta
          title="Product Not Found | Solar Trade Hub"
          description="Product not found"
        />

        <PageBreadcrumb
          pageTitle="Product Details"
        />

        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="size-5 text-red-500" />
          </div>

          <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
            Product not found
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
            {loadError ||
              "The requested external product could not be found."}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                void loadProduct()
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]"
            >
              <RefreshCw className="size-4" />
              Try Again
            </button>

            <Link
              to="/products"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-5 text-sm font-semibold text-white transition hover:bg-[#e94118]"
            >
              <ArrowLeft className="size-4" />
              Back to Products
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* =======================================================
     DISPLAY VALUES
  ======================================================= */

  const productId =
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

  const description =
    getDescription(product);

  const activeAccesses =
    accesses.filter(
      (access) =>
        access.enabled
    );

  const visibleAccesses =
    accesses.filter(
      (access) =>
        access.visible
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title={`${product.name || "Product"} | Solar Trade Hub`}
        description={`View external Rate List product ${productId}`}
      />

      <PageBreadcrumb
        pageTitle="Product Details"
      />

      <div className="space-y-4">
        {/* HEADER */}

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[#5b2eff]/10 px-3 py-1.5 font-mono text-xs font-semibold text-[#7c5cff]">
                  {productId}
                </span>

                <TypeBadge
                  type={product.type}
                />

                <AvailabilityBadge
                  available={
                    product.available
                  }
                />

                <MarketplaceBadge
                  enabled={
                    product.marketplaceEnabled
                  }
                  visible={
                    product.marketplaceVisible
                  }
                />
              </div>

              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {product.name ||
                  "Unnamed Product"}
              </h1>

              <p className="mt-1 font-mono text-xs text-gray-500">
                SKU:{" "}
                {displayValue(
                  product.sku
                )}
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]"
            >
              <ArrowLeft className="size-4" />
              Back to Products
            </Link>
          </div>
        </section>

        {/* MAIN */}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          {/* IMAGES */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Product Images
              </p>

              {images.length > 0 && (
                <span className="text-xs text-gray-400">
                  {images.length}{" "}
                  {images.length === 1
                    ? "image"
                    : "images"}
                </span>
              )}
            </div>

            <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0d1423]">
              {selectedImage ? (
                <ProductImage
                  key={
                    selectedImage.url
                  }
                  src={
                    selectedImage.url
                  }
                  alt={
                    selectedImage.alt
                  }
                  className="max-h-[290px] w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-gray-400">
                  <ImageOff className="size-8" />

                  <p className="mt-2 text-xs">
                    No product image
                  </p>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.map(
                  (
                    image,
                    index
                  ) => (
                    <button
                      type="button"
                      key={`${image.id}-${image.url}`}
                      onClick={() =>
                        setSelectedImageIndex(
                          index
                        )
                      }
                      className={[
                        "relative flex h-16 items-center justify-center overflow-hidden rounded-lg border bg-gray-50 p-1 transition dark:bg-[#0d1423]",
                        selectedImageIndex ===
                        index
                          ? "border-[#ff4b1f]"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-800",
                      ].join(" ")}
                    >
                      <ProductImage
                        src={
                          image.url
                        }
                        alt={
                          image.alt
                        }
                        className="max-h-full w-full object-contain"
                      />

                      {image.primary && (
                        <span className="absolute bottom-1 left-1 rounded bg-[#5b2eff] px-1 py-0.5 text-[8px] font-semibold text-white">
                          Primary
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </section>

          {/* PRODUCT INFORMATION */}

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <SectionHeader
              title="Product Information"
              subtitle="External Rate List master data"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              <InfoItem
                label="External Product ID"
                value={productId}
                mono
              />

              <InfoItem
                label="SKU"
                value={displayValue(
                  product.sku
                )}
                mono
              />

              <InfoItem
                label="Type"
                value={
                  product.type
                    ? formatProductType(
                        product.type
                      )
                    : "—"
                }
              />

              <InfoItem
                label="Category"
                value={
                  categoryName
                }
              />

              <InfoItem
                label="Brand"
                value={
                  brandName
                }
              />

              <InfoItem
                label="Size"
                value={
                  formatSize(
                    product
                  )
                }
              />

              <InfoItem
                label="Unit"
                value={displayValue(
                  product.unit
                )}
              />

              <InfoItem
                label="External Rate"
                value={
                  formatProductRate(
                    product.rate
                  )
                }
              />

              <InfoItem
                label="Availability"
                value={
                  product.available
                    ? "Available"
                    : "Unavailable"
                }
              />

              <InfoItem
                label="Marketplace Enabled"
                value={
                  product.marketplaceEnabled
                    ? "Yes"
                    : "No"
                }
              />

              <InfoItem
                label="Marketplace Visible"
                value={
                  product.marketplaceVisible
                    ? "Yes"
                    : "No"
                }
              />

              <InfoItem
                label="Supplier Access"
                value={`${activeAccesses.length} enabled`}
              />
            </div>
          </section>
        </div>

        {/* RATE + MARKETPLACE */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <StatCard
            label="External Rate"
            value={
              formatProductRate(
                product.rate
              )
            }
            description="Rate List value"
          />

          <StatCard
            label="Availability"
            value={
              product.available
                ? "Available"
                : "Unavailable"
            }
            description="External catalogue"
          />

          <StatCard
            label="Enabled Suppliers"
            value={String(
              activeAccesses.length
            )}
            description="Marketplace access"
          />

          <StatCard
            label="Live Suppliers"
            value={String(
              visibleAccesses.length
            )}
            description="Currently visible"
          />
        </div>

        {/* DESCRIPTION */}

        {description && (
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <SectionHeader
              title="Description"
              subtitle="Information returned by the external catalogue"
            />

            <div className="p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-300">
                {description}
              </p>
            </div>
          </section>
        )}

        {/* SPECIFICATIONS */}

        {specifications.length >
          0 && (
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <SectionHeader
              title="Specifications"
              subtitle="External product specifications"
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                    <TableHeading>
                      Group
                    </TableHeading>

                    <TableHeading>
                      Specification
                    </TableHeading>

                    <TableHeading>
                      Value
                    </TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {specifications.map(
                    (
                      specification,
                      index
                    ) => (
                      <tr
                        key={`${specification.label}-${index}`}
                        className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                      >
                        <td className="px-5 py-3 text-sm text-gray-500">
                          {
                            specification.group
                          }
                        </td>

                        <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {
                            specification.label
                          }
                        </td>

                        <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {
                            specification.value
                          }

                          {specification.unit
                            ? ` ${specification.unit}`
                            : ""}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* MARKETPLACE ACCESS */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Marketplace Supplier Access"
            subtitle="Solar Trade Hub marketplace state for this external product"
          />

          {accesses.length === 0 ? (
            <div className="p-5">
              <div className="rounded-xl border border-dashed border-gray-200 px-5 py-8 text-center dark:border-gray-700">
                <Store className="mx-auto size-6 text-gray-400" />

                <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  No supplier access
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  This external product has not been enabled for any supplier.
                </p>

                <Link
                  to="/products"
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-[#5b2eff] px-4 text-xs font-semibold text-white transition hover:bg-[#4e26e6]"
                >
                  Manage from Product List
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {accesses.map(
                (
                  access,
                  index
                ) => (
                  <SupplierAccessRow
                    key={
                      access.accessId ||
                      access.supplierId ||
                      index
                    }
                    access={
                      access
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* SOURCE INFORMATION */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Source Information"
            subtitle="External catalogue reference"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <InfoItem
              label="Source"
              value="External Rate List"
            />

            <InfoItem
              label="Provider"
              value="Biz Daily"
            />

            <InfoItem
              label="External Product ID"
              value={productId}
              mono
            />

            <InfoItem
              label="Last Updated"
              value={
                formatDateTime(
                  product.updatedAt
                )
              }
            />
          </div>

          <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
            <div className="flex items-start gap-3 rounded-xl bg-[#5b2eff]/5 p-4">
              <ExternalLink className="mt-0.5 size-4 shrink-0 text-[#7c5cff]" />

              <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">
                Product master data is controlled by the external Rate List
                provider. Solar Trade Hub does not create, edit or delete the
                external product master. Marketplace supplier access is managed
                separately by Solar Trade Hub.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/* =========================================================
   PRODUCT IMAGE
========================================================= */

function ProductImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <ImageOff className="size-5 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() =>
        setFailed(true)
      }
    />
  );
}

/* =========================================================
   TYPE
========================================================= */

function TypeBadge({
  type,
}: {
  type:
    | string
    | null
    | undefined;
}) {
  if (!type) {
    return null;
  }

  return (
    <span className="rounded-full bg-[#5b2eff]/10 px-2.5 py-1 text-xs font-semibold text-[#7c5cff]">
      {formatProductType(
        type
      )}
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
  if (available) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
        <CheckCircle2 className="size-3.5" />
        Available
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
      <PowerOff className="size-3.5" />
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
}: {
  enabled: boolean;
  visible: boolean;
}) {
  if (visible) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
        <CheckCircle2 className="size-3.5" />
        Marketplace Live
      </span>
    );
  }

  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <Clock3 className="size-3.5" />
        Enabled / Not Live
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
   SUPPLIER ACCESS
========================================================= */

function SupplierAccessRow({
  access,
}: {
  access: MarketplaceSupplierAccess;
}) {
  return (
    <div className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#5b2eff]/10">
            <Store className="size-4 text-[#7c5cff]" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-white">
                {access.companyName ||
                  "Unknown Supplier"}
              </p>

              {access.visible ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                  <CheckCircle2 className="size-3" />
                  Live
                </span>
              ) : access.enabled ? (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  Enabled / Not Live
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800">
                  Disabled
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
              <span>
                ID:{" "}
                {access.supplierId ||
                  "—"}
              </span>

              <span>
                Status:{" "}
                {access.supplierStatus ||
                  "—"}
              </span>

              <span>
                Verification:{" "}
                {access.verificationStatus ||
                  "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-1 text-xs text-gray-500 sm:grid-cols-2 sm:gap-x-6">
          <span>
            Subscription:{" "}
            <strong className="font-semibold text-gray-700 dark:text-gray-300">
              {access.subscriptionActive
                ? access.subscription
                    ?.planCode ||
                  "Active"
                : "Inactive"}
            </strong>
          </span>

          <span>
            Expires:{" "}
            <strong className="font-semibold text-gray-700 dark:text-gray-300">
              {access.subscription
                ?.expiresAt
                ? formatDate(
                    access.subscription
                      .expiresAt
                  )
                : "—"}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-1 text-xs text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 border-b border-r border-gray-100 px-5 py-4 dark:border-gray-800">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <div
        className={[
          "mt-1.5 break-words text-sm font-medium text-gray-900 dark:text-white",
          mono
            ? "font-mono text-xs"
            : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: ReactNode;
  description: string;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
        {value}
      </div>

      <p className="mt-1 text-xs text-gray-400">
        {description}
      </p>
    </section>
  );
}

/* =========================================================
   TABLE HEADING
========================================================= */

function TableHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}