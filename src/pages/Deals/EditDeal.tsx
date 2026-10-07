import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ImageOff,
  Info,
  LoaderCircle,
  Package,
  Percent,
  RefreshCw,
  Save,
  Search,
  Tag,
  WalletCards,
  X,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import api from "../../services/api";

import {
  formatDealPrice,
  formatDealStatus,
  getDeal,
  getDealErrorMessage,
  getDealProductId,
  getDealProductName,
  updateDeal,
  type Deal,
  type DealCurrency,
  type DealDiscountType,
} from "../../services/deal/deal.service";

import {
  getProductErrorMessage,
  getProducts,
  type Product,
} from "../../services/product/product.service";

/* =========================================================
   FORM TYPES
========================================================= */

type PublishMode =
  | "draft"
  | "published";

type DealFormData = {
  title: string;

  product: string;

  originalPrice: string;

  currency: DealCurrency;

  discountType: DealDiscountType;

  discountValue: string;

  startDate: string;

  endDate: string;

  publishMode: PublishMode;
};

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM: DealFormData = {
  title: "",

  product: "",

  originalPrice: "",

  currency: "PKR",

  discountType:
    "percentage",

  discountValue: "",

  startDate: "",

  endDate: "",

  publishMode:
    "draft",
};

/* =========================================================
   DATE HELPERS
========================================================= */

function getLocalToday() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function getDateInputValue(
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

function parseManualDate(
  input: string
) {
  const value =
    input.trim();

  if (!value) {
    return "";
  }

  let year = 0;
  let month = 0;
  let day = 0;

  const isoMatch =
    value.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (isoMatch) {
    year =
      Number(
        isoMatch[1]
      );

    month =
      Number(
        isoMatch[2]
      );

    day =
      Number(
        isoMatch[3]
      );
  } else {
    const manualMatch =
      value.match(
        /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
      );

    if (
      !manualMatch
    ) {
      return null;
    }

    day =
      Number(
        manualMatch[1]
      );

    month =
      Number(
        manualMatch[2]
      );

    year =
      Number(
        manualMatch[3]
      );
  }

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  const valid =
    date.getFullYear() ===
      year &&
    date.getMonth() ===
      month - 1 &&
    date.getDate() ===
      day;

  if (!valid) {
    return null;
  }

  return `${String(
    year
  ).padStart(
    4,
    "0"
  )}-${String(
    month
  ).padStart(
    2,
    "0"
  )}-${String(
    day
  ).padStart(
    2,
    "0"
  )}`;
}

function formatManualDate(
  value: string
) {
  if (!value) {
    return "";
  }

  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return value;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

/* =========================================================
   PRODUCT HELPERS
========================================================= */

function getProductPrimaryImage(
  product:
    | Product
    | null
    | undefined
) {
  if (!product) {
    return null;
  }

  return (
    product.images?.find(
      (image) =>
        image.isPrimary
    ) ||
    product.images?.[0] ||
    product.primaryImage ||
    null
  );
}

function resolveImageUrl(
  value:
    | string
    | null
    | undefined
) {
  const url =
    String(
      value || ""
    ).trim();

  if (!url) {
    return "";
  }

  if (
    /^(https?:|data:|blob:)/i.test(
      url
    )
  ) {
    return url;
  }

  const path =
    url.startsWith("/")
      ? url
      : `/${url}`;

  const baseURL =
    String(
      api.defaults.baseURL ||
      ""
    );

  if (
    /^https?:\/\//i.test(
      baseURL
    )
  ) {
    try {
      return `${
        new URL(
          baseURL
        ).origin
      }${path}`;
    } catch {
      return path;
    }
  }

  return path;
}

function formatProductPrice(
  product: Product
) {
  const price =
    Number(
      product.pricing
        ?.sellingPrice ??
        0
    );

  const currency =
    (
      product.pricing
        ?.currency ||
      "PKR"
    ) as DealCurrency;

  return formatDealPrice(
    price,
    currency
  );
}

/* =========================================================
   PAGE
========================================================= */

const EditDeal = () => {
  const params =
    useParams();

  const navigate =
    useNavigate();

  const dealReference =
    params.dealId ||
    params.id ||
    "";

  const [
    deal,
    setDeal,
  ] =
    useState<Deal | null>(
      null
    );

  const [
    formData,
    setFormData,
  ] =
    useState<DealFormData>(
      INITIAL_FORM
    );

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
    loadError,
    setLoadError,
  ] =
    useState("");

  /* =======================================================
     PRODUCT STATE
  ======================================================= */

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);

  const [
    productsLoading,
    setProductsLoading,
  ] =
    useState(true);

  const [
    selectedProduct,
    setSelectedProduct,
  ] =
    useState<Product | null>(
      null
    );

  const [
    productSearch,
    setProductSearch,
  ] =
    useState("");

  const [
    productDropdownOpen,
    setProductDropdownOpen,
  ] =
    useState(false);

  const productSelectorRef =
    useRef<HTMLDivElement>(
      null
    );

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    const loadProducts =
      async () => {
        try {
          setProductsLoading(
            true
          );

          const result =
            await getProducts({
              page: 1,

              limit: 100,

              sortBy:
                "name",

              sortOrder:
                "asc",
            });

          setProducts(
            result.products
          );
        } catch (
          error
        ) {
          toast.error(
            "Unable to load Products",
            {
              description:
                getProductErrorMessage(
                  error,
                  "Product list could not be loaded."
                ),
            }
          );
        } finally {
          setProductsLoading(
            false
          );
        }
      };

    void loadProducts();
  }, []);

  /* =======================================================
     LOAD DEAL
  ======================================================= */

  const loadDeal =
    useCallback(
      async () => {
        if (
          !dealReference
        ) {
          setLoadError(
            "Deal ID is missing."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setLoadError(
            ""
          );

          const result =
            await getDeal(
              dealReference
            );

          setDeal(
            result
          );

          const productId =
            getDealProductId(
              result.product
            );

          setProductSearch(
            productId
          );

          setFormData({
            title:
              result.title ||
              "",

            product:
              productId,

            /*
             * Important:
             *
             * Existing Deal snapshot is preserved.
             *
             * Do NOT overwrite it with current Product price
             * until admin intentionally selects another Product.
             */

            originalPrice:
              String(
                result.originalPrice ??
                  0
              ),

            currency:
              result.currency ||
              "PKR",

            discountType:
              result.discountType ||
              "percentage",

            discountValue:
              String(
                result.discountValue ??
                  0
              ),

            startDate:
              getDateInputValue(
                result.startDate
              ),

            endDate:
              getDateInputValue(
                result.endDate
              ),

            publishMode:
              result.status ===
              "draft"
                ? "draft"
                : "published",
          });
        } catch (
          error
        ) {
          setDeal(
            null
          );

          setLoadError(
            getDealErrorMessage(
              error,
              "Unable to load Deal."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        dealReference,
      ]
    );

  useEffect(() => {
    void loadDeal();
  }, [
    loadDeal,
  ]);

  /* =======================================================
     MATCH CURRENT PRODUCT
  ======================================================= */

  useEffect(() => {
    if (
      !deal ||
      products.length ===
        0
    ) {
      return;
    }

    const productId =
      getDealProductId(
        deal.product
      );

    const match =
      products.find(
        (product) =>
          product.productId ===
          productId
      );

    if (match) {
      setSelectedProduct(
        match
      );
    }
  }, [
    deal,
    products,
  ]);

  /* =======================================================
     CLOSE PRODUCT DROPDOWN
  ======================================================= */

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        productSelectorRef
          .current &&
        !productSelectorRef
          .current.contains(
            event.target as Node
          )
      ) {
        setProductDropdownOpen(
          false
        );
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* =======================================================
     SELECT PRODUCT
  ======================================================= */

  const selectProduct =
    useCallback(
      (
        product: Product
      ) => {
        const sellingPrice =
          Number(
            product.pricing
              ?.sellingPrice ??
              0
          );

        const currency =
          (
            product.pricing
              ?.currency ||
            "PKR"
          ) as DealCurrency;

        setSelectedProduct(
          product
        );

        setProductSearch(
          product.productId
        );

        setProductDropdownOpen(
          false
        );

        setFormData(
          (
            current
          ) => ({
            ...current,

            product:
              product.productId,

            /*
             * Selecting another Product intentionally
             * adopts its current marketplace price.
             */

            originalPrice:
              String(
                sellingPrice
              ),

            currency,
          })
        );
      },
      []
    );

  /* =======================================================
     PASTED PRODUCT ID AUTO MATCH
  ======================================================= */

  useEffect(() => {
    const value =
      productSearch
        .trim()
        .toUpperCase();

    if (
      !/^STH-P-\d{4,}$/.test(
        value
      )
    ) {
      return;
    }

    const match =
      products.find(
        (product) =>
          product.productId
            .toUpperCase() ===
          value
      );

    if (
      match &&
      selectedProduct
        ?.productId !==
        match.productId
    ) {
      selectProduct(
        match
      );
    }
  }, [
    productSearch,
    products,
    selectedProduct,
    selectProduct,
  ]);

  /* =======================================================
     FILTER PRODUCTS
  ======================================================= */

  const filteredProducts =
    useMemo(
      () => {
        const search =
          productSearch
            .trim()
            .toLowerCase();

        if (!search) {
          return products.slice(
            0,
            20
          );
        }

        return products
          .filter(
            (
              product
            ) =>
              product.name
                .toLowerCase()
                .includes(
                  search
                ) ||
              product.productId
                .toLowerCase()
                .includes(
                  search
                ) ||
              product.sku
                .toLowerCase()
                .includes(
                  search
                ) ||
              (
                product.model ||
                ""
              )
                .toLowerCase()
                .includes(
                  search
                ) ||
              (
                product.capacityRating ||
                ""
              )
                .toLowerCase()
                .includes(
                  search
                )
          )
          .slice(
            0,
            20
          );
      },
      [
        products,
        productSearch,
      ]
    );

  /* =======================================================
     CLEAR PRODUCT
  ======================================================= */

  const clearProduct =
    () => {
      setSelectedProduct(
        null
      );

      setProductSearch(
        ""
      );

      setProductDropdownOpen(
        true
      );

      setFormData(
        (
          current
        ) => ({
          ...current,

          product:
            "",
        })
      );
    };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = <
    K extends keyof DealFormData,
  >(
    field: K,
    value: DealFormData[K]
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
  };

  /* =======================================================
     DEAL PRICE
  ======================================================= */

  const calculatedDealPrice =
    useMemo(
      () => {
        const originalPrice =
          Number(
            formData.originalPrice
          );

        const discountValue =
          Number(
            formData.discountValue
          );

        if (
          !Number.isFinite(
            originalPrice
          ) ||
          originalPrice <
            0 ||
          !Number.isFinite(
            discountValue
          ) ||
          discountValue <
            0
        ) {
          return null;
        }

        if (
          formData.discountType ===
          "percentage"
        ) {
          if (
            discountValue >
            100
          ) {
            return null;
          }

          return Math.max(
            0,

            Math.round(
              (
                originalPrice -
                originalPrice *
                  (
                    discountValue /
                    100
                  )
              ) *
                100
            ) /
              100
          );
        }

        if (
          discountValue >
          originalPrice
        ) {
          return null;
        }

        return Math.max(
          0,

          Math.round(
            (
              originalPrice -
              discountValue
            ) *
              100
          ) /
            100
        );
      },
      [
        formData.originalPrice,
        formData.discountType,
        formData.discountValue,
      ]
    );

  /* =======================================================
     STATUS PREVIEW
  ======================================================= */

  const statusPreview =
    useMemo(
      () => {
        if (
          formData.publishMode ===
          "draft"
        ) {
          return {
            label:
              "Draft",

            description:
              "This Deal will remain unpublished.",

            className:
              "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400",
          };
        }

        if (
          !formData.startDate ||
          !formData.endDate
        ) {
          return {
            label:
              "Published",

            description:
              "Status will be determined from the campaign dates.",

            className:
              "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400",
          };
        }

        const today =
          getLocalToday();

        if (
          today <
          formData.startDate
        ) {
          return {
            label:
              "Scheduled",

            description:
              "This Deal will activate automatically on its Start Date.",

            className:
              "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400",
          };
        }

        if (
          today >=
          formData.endDate
        ) {
          return {
            label:
              "Expired",

            description:
              "The configured campaign period has ended.",

            className:
              "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
          };
        }

        return {
          label:
            "Active",

          description:
            "This Deal is currently within its active campaign period.",

          className:
            "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400",
        };
      },
      [
        formData.publishMode,
        formData.startDate,
        formData.endDate,
      ]
    );

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        !deal ||
        saving
      ) {
        return;
      }

      const title =
        formData.title.trim();

      const product =
        formData.product.trim();

      const originalPrice =
        Number(
          formData.originalPrice
        );

      const discountValue =
        Number(
          formData.discountValue
        );

      if (!title) {
        toast.error(
          "Deal title is required."
        );

        return;
      }

      if (!product) {
        toast.error(
          "Please select a valid Product."
        );

        return;
      }

      if (
        !Number.isFinite(
          originalPrice
        ) ||
        originalPrice <
          0
      ) {
        toast.error(
          "Please enter a valid Original Price."
        );

        return;
      }

      if (
        !Number.isFinite(
          discountValue
        ) ||
        discountValue <
          0
      ) {
        toast.error(
          "Please enter a valid Discount."
        );

        return;
      }

      if (
        formData.discountType ===
          "percentage" &&
        discountValue >
          100
      ) {
        toast.error(
          "Percentage discount cannot exceed 100%."
        );

        return;
      }

      if (
        formData.discountType ===
          "fixed" &&
        discountValue >
          originalPrice
      ) {
        toast.error(
          "Fixed discount cannot exceed Original Price."
        );

        return;
      }

      if (
        !formData.startDate ||
        !formData.endDate
      ) {
        toast.error(
          "Start Date and End Date are required."
        );

        return;
      }

      if (
        formData.endDate <=
        formData.startDate
      ) {
        toast.error(
          "End Date must be after Start Date."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        const updated =
          await updateDeal(
            deal.dealId,
            {
              title,

              product,

              originalPrice,

              currency:
                formData.currency,

              discountType:
                formData.discountType,

              discountValue,

              startDate:
                formData.startDate,

              endDate:
                formData.endDate,

              status:
                formData.publishMode ===
                "draft"
                  ? "draft"
                  : "active",
            }
          );

        toast.success(
          "Deal updated successfully",
          {
            description:
              `${updated.dealId} — ${updated.title}`,
          }
        );

        window.setTimeout(
          () => {
            navigate(
              `/deals/${encodeURIComponent(
                updated.dealId
              )}`
            );
          },
          650
        );
      } catch (
        error
      ) {
        toast.error(
          "Unable to update Deal",
          {
            description:
              getDealErrorMessage(
                error,
                "Deal could not be updated."
              ),
          }
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <PageMeta
          title="Edit Deal | Solar Trade Hub"
          description="Edit Solar Trade Hub Deal."
        />

        <PageBreadcrumb
          pageTitle="Edit Deal"
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <LoaderCircle
            size={25}
            className="mx-auto animate-spin text-purple-600"
          />

          <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
            Loading Deal
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
    !deal
  ) {
    return (
      <>
        <PageMeta
          title="Deal Not Found | Solar Trade Hub"
          description="Deal could not be loaded."
        />

        <PageBreadcrumb
          pageTitle="Edit Deal"
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <Tag
            size={25}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
            Unable to load Deal
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {loadError}
          </p>

          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                void loadDeal()
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold"
            >
              <RefreshCw
                size={15}
              />

              Retry
            </button>

            <Link
              to="/deals"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white"
            >
              Back to Deals
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`Edit ${deal.title} | Solar Trade Hub`}
        description={`Edit Deal ${deal.dealId}.`}
      />

      <PageBreadcrumb
        pageTitle="Edit Deal"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-5"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="pointer-events-none absolute -right-20 -top-24 size-60 rounded-full bg-orange-500/[0.06]" />

          <div className="pointer-events-none absolute right-28 top-4 size-36 rounded-full bg-purple-500/[0.06]" />

          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                  <Tag
                    size={23}
                  />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-purple-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                      {
                        deal.dealId
                      }
                    </span>

                    <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase text-orange-600">
                      Edit Promotion
                    </span>
                  </div>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Edit Deal
                  </h1>

                  <p className="mt-2 text-sm text-gray-500">
                    Update product,
                    promotional pricing
                    and campaign period.
                  </p>
                </div>
              </div>

              <Link
                to={`/deals/${encodeURIComponent(
                  deal.dealId
                )}`}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300"
              >
                <ArrowLeft
                  size={16}
                />

                Back to Deal
              </Link>
            </div>
          </div>
        </section>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            {/* DEAL */}

            <FormSection
              title="Deal Information"
              description="Update the Product connected to this marketplace promotion."
              icon={
                <Tag
                  size={18}
                />
              }
            >
              <div className="space-y-5">
                <FormField
                  label="Deal Title"
                  required
                >
                  <InputWrapper
                    icon={
                      <Tag
                        size={17}
                      />
                    }
                  >
                    <input
                      type="text"
                      value={
                        formData.title
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "title",
                          event.target
                            .value
                        )
                      }
                      className="deal-edit-input pl-10"
                      required
                    />
                  </InputWrapper>
                </FormField>

                {/* PRODUCT SELECTOR */}

                <FormField
                  label="Product"
                  required
                  hint="Search by Product name, Product ID, SKU, model or capacity."
                >
                  <div
                    ref={
                      productSelectorRef
                    }
                    className="relative"
                  >
                    <div className="relative">
                      <Search
                        size={17}
                        className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="text"
                        value={
                          productSearch
                        }
                        onFocus={() =>
                          setProductDropdownOpen(
                            true
                          )
                        }
                        onChange={(
                          event
                        ) => {
                          const value =
                            event.target
                              .value;

                          setProductSearch(
                            value
                          );

                          setProductDropdownOpen(
                            true
                          );

                          if (
                            selectedProduct &&
                            value !==
                              selectedProduct.productId
                          ) {
                            setSelectedProduct(
                              null
                            );

                            setFormData(
                              (
                                current
                              ) => ({
                                ...current,

                                product:
                                  "",
                              })
                            );
                          }
                        }}
                        placeholder="Search or paste STH-P-0001"
                        className="deal-edit-input pl-10 pr-12"
                      />

                      {productsLoading ? (
                        <LoaderCircle
                          size={17}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-purple-500"
                        />
                      ) : productSearch ? (
                        <button
                          type="button"
                          onClick={
                            clearProduct
                          }
                          className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                          <X
                            size={16}
                          />
                        </button>
                      ) : (
                        <ChevronDown
                          size={17}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      )}
                    </div>

                    {productDropdownOpen && (
                      <div className="absolute left-0 right-0 top-[50px] z-50 max-h-[360px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                        {productsLoading ? (
                          <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-500">
                            <LoaderCircle
                              size={17}
                              className="animate-spin"
                            />

                            Loading Products...
                          </div>
                        ) : filteredProducts.length >
                          0 ? (
                          filteredProducts.map(
                            (
                              product
                            ) => (
                              <ProductOption
                                key={
                                  product.productId
                                }
                                product={
                                  product
                                }
                                selected={
                                  selectedProduct
                                    ?.productId ===
                                  product.productId
                                }
                                onSelect={() =>
                                  selectProduct(
                                    product
                                  )
                                }
                              />
                            )
                          )
                        ) : (
                          <div className="p-8 text-center text-sm text-gray-500">
                            No Product found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </FormField>

                {selectedProduct ? (
                  <SelectedProductCard
                    product={
                      selectedProduct
                    }
                    onChange={
                      clearProduct
                    }
                  />
                ) : deal.product &&
                  formData.product ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
                    <p className="text-xs text-gray-500">
                      Current Product
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {getDealProductName(
                        deal.product
                      )}
                    </p>

                    <p className="mt-1 font-mono text-xs text-purple-600">
                      {
                        formData.product
                      }
                    </p>
                  </div>
                ) : null}
              </div>
            </FormSection>

            {/* PRICING */}

            <FormSection
              title="Promotional Pricing"
              description="Changing Product automatically imports its current Selling Price."
              icon={
                <CircleDollarSign
                  size={18}
                />
              }
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <FormField
                  label="Original Price"
                  required
                  hint={
                    selectedProduct
                      ? `Current Product Selling Price: ${formatProductPrice(
                          selectedProduct
                        )}`
                      : "Existing Deal pricing is preserved until Product is changed."
                  }
                >
                  <InputWrapper
                    icon={
                      <WalletCards
                        size={17}
                      />
                    }
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        formData.originalPrice
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "originalPrice",
                          event.target
                            .value
                        )
                      }
                      required
                      className="deal-edit-input pl-10"
                    />
                  </InputWrapper>
                </FormField>

                <FormField
                  label="Currency"
                  required
                >
                  <div className="relative">
                    <select
                      value={
                        formData.currency
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "currency",
                          event.target
                            .value as DealCurrency
                        )
                      }
                      className="deal-edit-input appearance-none pr-10"
                    >
                      <option value="PKR">
                        PKR — Pakistani Rupee
                      </option>

                      <option value="USD">
                        USD — US Dollar
                      </option>
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </FormField>

                <FormField
                  label="Discount Type"
                  required
                >
                  <div className="relative">
                    <select
                      value={
                        formData.discountType
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "discountType",
                          event.target
                            .value as DealDiscountType
                        )
                      }
                      className="deal-edit-input appearance-none pr-10"
                    >
                      <option value="percentage">
                        Percentage (%)
                      </option>

                      <option value="fixed">
                        Fixed Amount
                      </option>
                    </select>

                    <ChevronDown
                      size={17}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </FormField>

                <FormField
                  label={
                    formData.discountType ===
                    "percentage"
                      ? "Discount Percentage"
                      : "Discount Amount"
                  }
                  required
                >
                  <InputWrapper
                    icon={
                      formData.discountType ===
                      "percentage" ? (
                        <Percent
                          size={17}
                        />
                      ) : (
                        <WalletCards
                          size={17}
                        />
                      )
                    }
                  >
                    <input
                      type="number"
                      min="0"
                      max={
                        formData.discountType ===
                        "percentage"
                          ? 100
                          : undefined
                      }
                      step="0.01"
                      value={
                        formData.discountValue
                      }
                      onChange={(
                        event
                      ) =>
                        handleChange(
                          "discountValue",
                          event.target
                            .value
                        )
                      }
                      required
                      className="deal-edit-input pl-10"
                    />
                  </InputWrapper>
                </FormField>

                <div className="lg:col-span-2">
                  <FormField
                    label="Calculated Deal Price"
                    hint="Backend recalculates this value before saving."
                  >
                    <InputWrapper
                      icon={
                        <WalletCards
                          size={17}
                        />
                      }
                    >
                      <input
                        type="text"
                        readOnly
                        value={
                          calculatedDealPrice !==
                          null
                            ? formatDealPrice(
                                calculatedDealPrice,
                                formData.currency
                              )
                            : ""
                        }
                        className="deal-edit-input cursor-default bg-gray-50 pl-10 font-semibold text-green-700 dark:bg-white/[0.03] dark:text-green-400"
                      />
                    </InputWrapper>
                  </FormField>
                </div>
              </div>
            </FormSection>

            {/* DATES */}

            <FormSection
              title="Campaign Period"
              description="Type dates manually or use the calendar."
              icon={
                <CalendarDays
                  size={18}
                />
              }
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <FormField
                  label="Start Date"
                  required
                  hint="DD-MM-YYYY"
                >
                  <ManualCalendarDate
                    value={
                      formData.startDate
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "startDate",
                        value
                      )
                    }
                  />
                </FormField>

                <FormField
                  label="End Date"
                  required
                  hint="DD-MM-YYYY"
                >
                  <ManualCalendarDate
                    value={
                      formData.endDate
                    }
                    onChange={(
                      value
                    ) =>
                      handleChange(
                        "endDate",
                        value
                      )
                    }
                  />
                </FormField>
              </div>
            </FormSection>
          </div>

          {/* SIDEBAR */}

          <aside className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Product Preview
                </p>
              </div>

              {selectedProduct ? (
                <ProductPreview
                  product={
                    selectedProduct
                  }
                />
              ) : (
                <div className="p-6 text-center">
                  <Package
                    size={28}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {getDealProductName(
                      deal.product
                    )}
                  </p>

                  <p className="mt-1 font-mono text-xs text-purple-600">
                    {getDealProductId(
                      deal.product
                    )}
                  </p>
                </div>
              )}
            </section>

            {/* PRICE PREVIEW */}

            <section className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-orange-50 p-5 dark:border-purple-500/10 dark:from-purple-500/[0.08] dark:via-white/[0.02] dark:to-orange-500/[0.05]">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Pricing Preview
              </p>

              <PriceRow
                label="Original"
                value={
                  formData.originalPrice
                    ? formatDealPrice(
                        Number(
                          formData.originalPrice
                        ),
                        formData.currency
                      )
                    : "—"
                }
                strike
              />

              <PriceRow
                label="Discount"
                value={
                  formData.discountValue
                    ? formData.discountType ===
                      "percentage"
                      ? `${formData.discountValue}%`
                      : formatDealPrice(
                          Number(
                            formData.discountValue
                          ),
                          formData.currency
                        )
                    : "—"
                }
              />

              <div className="my-4 border-t border-purple-100" />

              <p className="text-xs uppercase text-gray-500">
                Deal Price
              </p>

              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {calculatedDealPrice !==
                null
                  ? formatDealPrice(
                      calculatedDealPrice,
                      formData.currency
                    )
                  : "—"}
              </p>
            </section>

            {/* PUBLISH */}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Publishing
                </p>
              </div>

              <div className="space-y-3 p-5">
                <PublishOption
                  active={
                    formData.publishMode ===
                    "draft"
                  }
                  title="Save as Draft"
                  description="Keep Deal unpublished."
                  onClick={() =>
                    handleChange(
                      "publishMode",
                      "draft"
                    )
                  }
                />

                <PublishOption
                  active={
                    formData.publishMode ===
                    "published"
                  }
                  title="Publish Deal"
                  description="Dates control Scheduled, Active or Expired status."
                  green
                  onClick={() =>
                    handleChange(
                      "publishMode",
                      "published"
                    )
                  }
                />
              </div>
            </section>

            {/* STATUS */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex gap-3">
                <CheckCircle2
                  size={19}
                  className="mt-0.5 text-orange-500"
                />

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Expected Status
                  </p>

                  <span
                    className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPreview.className}`}
                  >
                    {
                      statusPreview.label
                    }
                  </span>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    {
                      statusPreview.description
                    }
                  </p>

                  <p className="mt-3 text-[11px] text-gray-400">
                    Current:{" "}
                    {formatDealStatus(
                      deal.status
                    )}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-purple-100 bg-purple-50/50 p-5 dark:border-purple-500/10 dark:bg-purple-500/[0.05]">
              <div className="flex gap-3">
                <Info
                  size={18}
                  className="text-purple-600"
                />

                <p className="text-xs leading-5 text-gray-500">
                  Public Deal ID and
                  final Deal Price remain
                  system-managed.
                </p>
              </div>
            </section>
          </aside>
        </div>

        {/* ACTIONS */}

        <section className="sticky bottom-4 z-20 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-[#101828]/95">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              to={`/deals/${encodeURIComponent(
                deal.dealId
              )}`}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving
              }
              className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={17}
                />
              )}

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </section>
      </form>

      <style>
        {`
          .deal-edit-input {
            height: 44px;
            width: 100%;
            border-radius: 0.625rem;
            border: 1px solid rgb(229 231 235);
            background: rgb(255 255 255);
            padding-left: 0.875rem;
            padding-right: 0.875rem;
            font-size: 0.875rem;
            color: rgb(17 24 39);
            outline: none;
            transition: border-color 150ms ease, box-shadow 150ms ease;
          }

          .deal-edit-input:focus {
            border-color: rgb(147 51 234);
            box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.08);
          }

          .dark .deal-edit-input {
            border-color: rgb(55 65 81);
            background: rgb(17 24 39);
            color: rgba(255, 255, 255, 0.92);
          }
        `}
      </style>
    </>
  );
};

/* =========================================================
   PRODUCT OPTION
========================================================= */

function ProductOption({
  product,
  selected,
  onSelect,
}: {
  product: Product;

  selected: boolean;

  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onSelect
      }
      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${
        selected
          ? "bg-purple-500/10"
          : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
      }`}
    >
      <ProductImage
        product={
          product
        }
        size="small"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {
            product.name
          }
        </p>

        <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
          <span className="font-mono font-semibold text-purple-600">
            {
              product.productId
            }
          </span>

          <span className="text-gray-400">
            {
              product.sku
            }
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {formatProductPrice(
            product
          )}
        </p>

        {selected && (
          <Check
            size={16}
            className="ml-auto mt-1 text-green-500"
          />
        )}
      </div>
    </button>
  );
}

/* =========================================================
   SELECTED PRODUCT
========================================================= */

function SelectedProductCard({
  product,
  onChange,
}: {
  product: Product;

  onChange: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-purple-200 bg-purple-50/40 p-4 dark:border-purple-500/20 dark:bg-purple-500/[0.05] sm:flex-row sm:items-center">
      <ProductImage
        product={
          product
        }
        size="large"
      />

      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs font-semibold text-purple-600">
          {
            product.productId
          }
        </p>

        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
          {
            product.name
          }
        </p>

        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
          <span>
            SKU:{" "}
            {
              product.sku
            }
          </span>

          {product.capacityRating && (
            <span>
              {
                product.capacityRating
              }
            </span>
          )}

          <span className="font-semibold text-green-600">
            {formatProductPrice(
              product
            )}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={
          onChange
        }
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
      >
        <X
          size={14}
        />

        Change
      </button>
    </div>
  );
}

/* =========================================================
   PRODUCT PREVIEW
========================================================= */

function ProductPreview({
  product,
}: {
  product: Product;
}) {
  return (
    <div className="p-5 text-center">
      <ProductImage
        product={
          product
        }
        size="preview"
      />

      <p className="mt-4 font-mono text-xs font-semibold text-purple-600">
        {
          product.productId
        }
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
        {
          product.name
        }
      </p>

      {product.capacityRating && (
        <p className="mt-1 text-xs text-gray-400">
          {
            product.capacityRating
          }
        </p>
      )}

      <p className="mt-3 text-sm font-semibold text-green-600">
        {formatProductPrice(
          product
        )}
      </p>
    </div>
  );
}

/* =========================================================
   PRODUCT IMAGE
========================================================= */

function ProductImage({
  product,
  size,
}: {
  product: Product;

  size:
    | "small"
    | "large"
    | "preview";
}) {
  const image =
    getProductPrimaryImage(
      product
    );

  const url =
    resolveImageUrl(
      image?.url
    );

  const [
    failed,
    setFailed,
  ] =
    useState(false);

  useEffect(() => {
    setFailed(
      false
    );
  }, [
    url,
  ]);

  const dimensions =
    size ===
    "preview"
      ? "h-40 w-full"
      : size ===
          "large"
        ? "size-20"
        : "size-12";

  return (
    <div
      className={`flex ${dimensions} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/[0.03]`}
    >
      {url &&
      !failed ? (
        <img
          src={
            url
          }
          alt={
            image?.alt ||
            product.name
          }
          onError={() =>
            setFailed(
              true
            )
          }
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <ImageOff
          size={
            size ===
            "preview"
              ? 30
              : 19
          }
          className="text-gray-300"
        />
      )}
    </div>
  );
}

/* =========================================================
   DATE
========================================================= */

function ManualCalendarDate({
  value,
  onChange,
}: {
  value: string;

  onChange: (
    value: string
  ) => void;
}) {
  const calendarRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    text,
    setText,
  ] =
    useState(
      formatManualDate(
        value
      )
    );

  const [
    invalid,
    setInvalid,
  ] =
    useState(false);

  useEffect(() => {
    setText(
      formatManualDate(
        value
      )
    );
  }, [
    value,
  ]);

  const openCalendar =
    () => {
      const input =
        calendarRef.current as
          | (
              HTMLInputElement & {
                showPicker?: () => void;
              }
            )
          | null;

      if (
        input?.showPicker
      ) {
        input.showPicker();

        return;
      }

      input?.click();
    };

  return (
    <div>
      <div className="relative">
        <input
          value={
            text
          }
          inputMode="numeric"
          onChange={(
            event
          ) => {
            const next =
              event.target
                .value;

            setText(
              next
            );

            setInvalid(
              false
            );

            if (!next) {
              onChange(
                ""
              );

              return;
            }

            const parsed =
              parseManualDate(
                next
              );

            onChange(
              parsed ||
              ""
            );
          }}
          onBlur={() => {
            if (!text) {
              return;
            }

            const parsed =
              parseManualDate(
                text
              );

            if (!parsed) {
              setInvalid(
                true
              );

              return;
            }

            setText(
              formatManualDate(
                parsed
              )
            );

            onChange(
              parsed
            );
          }}
          placeholder="DD-MM-YYYY"
          className={`deal-edit-input pr-12 ${
            invalid
              ? "!border-red-400"
              : ""
          }`}
        />

        <button
          type="button"
          onClick={
            openCalendar
          }
          className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-purple-600 hover:bg-purple-50"
        >
          <CalendarDays
            size={18}
          />
        </button>

        <input
          ref={
            calendarRef
          }
          type="date"
          value={
            value
          }
          onChange={(
            event
          ) => {
            onChange(
              event.target
                .value
            );

            setText(
              formatManualDate(
                event.target
                  .value
              )
            );

            setInvalid(
              false
            );
          }}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      </div>

      {invalid && (
        <p className="mt-1 text-xs text-red-500">
          Enter valid DD-MM-YYYY
          date.
        </p>
      )}
    </div>
  );
}

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;

  description: string;

  icon: ReactNode;

  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;

  required?: boolean;

  hint?: string;

  children: ReactNode;
}) {
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

      {hint && (
        <p className="mt-1.5 text-[11px] text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   INPUT WRAPPER
========================================================= */

function InputWrapper({
  icon,
  children,
}: {
  icon: ReactNode;

  children: ReactNode;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-400">
        {icon}
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   PRICE ROW
========================================================= */

function PriceRow({
  label,
  value,
  strike = false,
}: {
  label: string;

  value: string;

  strike?: boolean;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-4">
      <span className="text-xs text-gray-500">
        {label}
      </span>

      <span
        className={`text-sm font-semibold ${
          strike
            ? "text-gray-400 line-through"
            : "text-gray-800 dark:text-gray-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   PUBLISH OPTION
========================================================= */

function PublishOption({
  active,
  title,
  description,
  green = false,
  onClick,
}: {
  active: boolean;

  title: string;

  description: string;

  green?: boolean;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`w-full rounded-xl border p-4 text-left transition ${
        active
          ? green
            ? "border-green-500 bg-green-500/[0.06]"
            : "border-purple-500 bg-purple-500/[0.05]"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>
    </button>
  );
}

export default EditDeal;