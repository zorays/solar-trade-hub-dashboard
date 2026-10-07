import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  DragEvent,
  FormEvent,
  ReactNode,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import api from "../../services/api";

import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  createProduct,
  getProductErrorMessage,
  MAX_PRODUCT_UPLOAD_IMAGES,
  MAX_PRODUCT_UPLOAD_SIZE,
  uploadAndAttachProductImages,
  type CreateProductPayload,
  type ProductStatus,
  type ProductType,
  type SellingUnit,
} from "../../services/product/product.service";

/* =========================================================
   TYPES
========================================================= */

interface ProductForm {
  name: string;

  sku: string;

  productType:
    | ProductType
    | "";

  category: string;

  brand: string;

  supplier: string;

  capacityRating: string;

  sellingPrice: string;

  oldPrice: string;

  stockQuantity: string;

  sellingUnit:
    | SellingUnit
    | "";

  status: ProductStatus;

  description: string;
}

interface UploadedImage {
  id: string;

  file: File;

  preview: string;
}

interface ReferenceRecord {
  _id?: string;

  id?: string;

  name?: string;

  companyName?: string;

  status?: string;
}

interface ReferenceOption {
  value: string;

  label: string;
}

interface ReferenceApiResponse {
  success?: boolean;

  data?:
    | ReferenceRecord[]
    | {
        categories?: ReferenceRecord[];
        brands?: ReferenceRecord[];
        suppliers?: ReferenceRecord[];
      };

  categories?: ReferenceRecord[];

  brands?: ReferenceRecord[];

  suppliers?: ReferenceRecord[];
}

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM: ProductForm = {
  name: "",

  sku: "",

  productType: "",

  category: "",

  brand: "",

  supplier: "",

  capacityRating: "",

  sellingPrice: "",

  oldPrice: "",

  stockQuantity: "",

  sellingUnit:
    "piece",

  status:
    "active",

  description: "",
};

/* =========================================================
   PRODUCT TYPE OPTIONS
========================================================= */

const PRODUCT_TYPE_OPTIONS: ReferenceOption[] = [
  {
    value:
      "solar_panel",

    label:
      "Solar Panel",
  },

  {
    value:
      "inverter",

    label:
      "Inverter",
  },

  {
    value:
      "battery",

    label:
      "Battery",
  },

  {
    value:
      "energy_storage",

    label:
      "Energy Storage",
  },

  {
    value:
      "mounting_structure",

    label:
      "Mounting Structure",
  },

  {
    value:
      "cable_accessory",

    label:
      "Cable & Accessory",
  },

  {
    value:
      "protection",

    label:
      "Protection",
  },

  {
    value:
      "other",

    label:
      "Other",
  },
];

/* =========================================================
   SELLING UNIT OPTIONS
========================================================= */

const SELLING_UNIT_OPTIONS: ReferenceOption[] = [
  {
    value: "piece",
    label: "Piece",
  },

  {
    value: "panel",
    label: "Panel",
  },

  {
    value: "unit",
    label: "Unit",
  },

  {
    value: "set",
    label: "Set",
  },

  {
    value: "system",
    label: "System",
  },

  {
    value: "meter",
    label: "Meter",
  },

  {
    value: "roll",
    label: "Roll",
  },

  {
    value: "pack",
    label: "Pack",
  },
];

/* =========================================================
   STATUS OPTIONS
========================================================= */

const STATUS_OPTIONS: ReferenceOption[] = [
  {
    value: "active",
    label: "Active",
  },

  {
    value: "draft",
    label: "Draft",
  },

  {
    value: "inactive",
    label: "Inactive",
  },

  {
    value: "archived",
    label: "Archived",
  },
];

/* =========================================================
   FILE CONSTANTS

   Must match backend multer limits.
========================================================= */

const MAX_IMAGES =
  MAX_PRODUCT_UPLOAD_IMAGES;

const MAX_IMAGE_SIZE =
  MAX_PRODUCT_UPLOAD_SIZE;

const ACCEPTED_IMAGE_TYPES =
  new Set<string>(
    ALLOWED_PRODUCT_IMAGE_TYPES
  );

/* =========================================================
   LOCAL IMAGE ID
========================================================= */

const createLocalImageId =
  () => {
    if (
      globalThis.crypto
        ?.randomUUID
    ) {
      return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
  };

/* =========================================================
   EXTRACT REFERENCE RECORDS
========================================================= */

function extractReferenceRecords(
  response: ReferenceApiResponse,
  key:
    | "categories"
    | "brands"
    | "suppliers"
) {
  if (
    Array.isArray(
      response.data
    )
  ) {
    return response.data;
  }

  if (
    response.data &&
    typeof response.data ===
      "object"
  ) {
    const nested =
      response.data[
        key
      ];

    if (
      Array.isArray(
        nested
      )
    ) {
      return nested;
    }
  }

  const root =
    response[key];

  if (
    Array.isArray(
      root
    )
  ) {
    return root;
  }

  return [];
}

/* =========================================================
   MAP REFERENCE OPTIONS
========================================================= */

function mapReferenceOptions(
  records: ReferenceRecord[]
): ReferenceOption[] {
  return records
    .map(
      (
        record
      ) => {
        const value =
          record._id ||
          record.id ||
          "";

        const label =
          record.companyName ||
          record.name ||
          "";

        return {
          value,
          label,
        };
      }
    )
    .filter(
      (
        option
      ) =>
        Boolean(
          option.value &&
            option.label
        )
    )
    .sort(
      (
        first,
        second
      ) =>
        first.label.localeCompare(
          second.label
        )
    );
}

/* =========================================================
   NUMBER HELPER
========================================================= */

function optionalNumber(
  value: string
) {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return undefined;
  }

  const number =
    Number(trimmed);

  return Number.isFinite(
    number
  )
    ? number
    : undefined;
}

/* =========================================================
   ADD PRODUCT
========================================================= */

export default function AddProduct() {
  const navigate =
    useNavigate();

  const [
    form,
    setForm,
  ] =
    useState<ProductForm>(
      INITIAL_FORM
    );

  const [
    images,
    setImages,
  ] =
    useState<
      UploadedImage[]
    >([]);

  /*
   * Keeps latest images available for unmount cleanup
   * without revoking previews every time state changes.
   */

  const imagesRef =
    useRef<
      UploadedImage[]
    >([]);

  const [
    selectedImageId,
    setSelectedImageId,
  ] =
    useState<
      string | null
    >(null);

  const [
    categories,
    setCategories,
  ] =
    useState<
      ReferenceOption[]
    >([]);

  const [
    brands,
    setBrands,
  ] =
    useState<
      ReferenceOption[]
    >([]);

  const [
    suppliers,
    setSuppliers,
  ] =
    useState<
      ReferenceOption[]
    >([]);

  const [
    referencesLoading,
    setReferencesLoading,
  ] =
    useState(true);

  const [
    supplierApiAvailable,
    setSupplierApiAvailable,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    savingDraft,
    setSavingDraft,
  ] =
    useState(false);

  const [
    uploadingImages,
    setUploadingImages,
  ] =
    useState(false);

  const [
    dragActive,
    setDragActive,
  ] =
    useState(false);

  /* =======================================================
     SELECTED IMAGE
  ======================================================= */

  const selectedImage =
    useMemo(
      () => {
        return (
          images.find(
            (
              image
            ) =>
              image.id ===
              selectedImageId
          ) ??
          images[0] ??
          null
        );
      },
      [
        images,
        selectedImageId,
      ]
    );

  /* =======================================================
     KEEP IMAGE REF CURRENT
  ======================================================= */

  useEffect(() => {
    imagesRef.current =
      images;
  }, [
    images,
  ]);

  /* =======================================================
     CLEAN OBJECT URLS ON PAGE UNMOUNT
  ======================================================= */

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(
        (
          image
        ) => {
          URL.revokeObjectURL(
            image.preview
          );
        }
      );
    };
  }, []);

  /* =======================================================
     LOAD CATEGORY / BRAND / SUPPLIER OPTIONS
  ======================================================= */

  const loadReferenceData =
    useCallback(
      async () => {
        setReferencesLoading(
          true
        );

        const [
          categoryResult,
          brandResult,
          supplierResult,
        ] =
          await Promise.allSettled([
            api.get<ReferenceApiResponse>(
              "/categories/active"
            ),

            api.get<ReferenceApiResponse>(
              "/brands/active"
            ),

            api.get<ReferenceApiResponse>(
              "/suppliers/active"
            ),
          ]);

        /* ===============================================
           CATEGORIES
        =============================================== */

        if (
          categoryResult.status ===
          "fulfilled"
        ) {
          const records =
            extractReferenceRecords(
              categoryResult.value
                .data,
              "categories"
            );

          setCategories(
            mapReferenceOptions(
              records
            )
          );
        } else {
          setCategories(
            []
          );

          toast.error(
            "Unable to load categories"
          );
        }

        /* ===============================================
           BRANDS
        =============================================== */

        if (
          brandResult.status ===
          "fulfilled"
        ) {
          const records =
            extractReferenceRecords(
              brandResult.value
                .data,
              "brands"
            );

          setBrands(
            mapReferenceOptions(
              records
            )
          );
        } else {
          setBrands([]);

          toast.error(
            "Unable to load brands"
          );
        }

        /* ===============================================
           SUPPLIERS
        =============================================== */

        if (
          supplierResult.status ===
          "fulfilled"
        ) {
          const records =
            extractReferenceRecords(
              supplierResult.value
                .data,
              "suppliers"
            );

          setSuppliers(
            mapReferenceOptions(
              records
            )
          );

          setSupplierApiAvailable(
            true
          );
        } else {
          setSuppliers([]);

          setSupplierApiAvailable(
            false
          );

          toast.error(
            "Unable to load suppliers"
          );
        }

        setReferencesLoading(
          false
        );
      },
      []
    );

  /* =======================================================
     INITIAL REFERENCE LOAD
  ======================================================= */

  useEffect(() => {
    void loadReferenceData();
  }, [
    loadReferenceData,
  ]);

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleFieldChange = (
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | ChangeEvent<HTMLSelectElement>
  ) => {
    const {
      name,
      value,
    } =
      event.target;

    setForm(
      (
        current
      ) => ({
        ...current,

        [name]:
          value,
      })
    );
  };

  /* =======================================================
     ADD IMAGE FILES
  ======================================================= */

  const addImageFiles = (
    files: File[]
  ) => {
    if (
      files.length ===
      0
    ) {
      return;
    }

    const validFiles: File[] =
      [];

    for (
      const file
      of files
    ) {
      if (
        !ACCEPTED_IMAGE_TYPES.has(
          file.type
        )
      ) {
        toast.error(
          `${file.name} is not supported.`,
          {
            description:
              "Use JPG, PNG, WEBP or AVIF.",
          }
        );

        continue;
      }

      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        toast.error(
          `${file.name} is too large.`,
          {
            description:
              "Each product image must be 10 MB or smaller.",
          }
        );

        continue;
      }

      validFiles.push(
        file
      );
    }

    const availableSlots =
      Math.max(
        MAX_IMAGES -
          images.length,
        0
      );

    const acceptedFiles =
      validFiles.slice(
        0,
        availableSlots
      );

    if (
      validFiles.length >
      availableSlots
    ) {
      toast.error(
        `Maximum ${MAX_IMAGES} product images are allowed.`
      );
    }

    if (
      acceptedFiles.length ===
      0
    ) {
      return;
    }

    const uploadedImages =
      acceptedFiles.map(
        (
          file
        ): UploadedImage => ({
          id:
            createLocalImageId(),

          file,

          preview:
            URL.createObjectURL(
              file
            ),
        })
      );

    setImages(
      (
        current
      ) => [
        ...current,
        ...uploadedImages,
      ]
    );

    setSelectedImageId(
      (
        current
      ) =>
        current ||
        uploadedImages[0]
          ?.id ||
        null
    );
  };

  /* =======================================================
     FILE INPUT
  ======================================================= */

  const handleImageUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    addImageFiles(
      Array.from(
        event.target.files ??
          []
      )
    );

    event.target.value =
      "";
  };

  /* =======================================================
     DRAG / DROP
  ======================================================= */

  const handleDragOver = (
    event: DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault();

    setDragActive(
      true
    );
  };

  const handleDragLeave = (
    event: DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault();

    setDragActive(
      false
    );
  };

  const handleDrop = (
    event: DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault();

    setDragActive(
      false
    );

    addImageFiles(
      Array.from(
        event.dataTransfer
          .files ||
          []
      )
    );
  };

  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  const removeImage = (
    id: string
  ) => {
    setImages(
      (
        current
      ) => {
        const imageToRemove =
          current.find(
            (
              image
            ) =>
              image.id ===
              id
          );

        if (
          imageToRemove
        ) {
          URL.revokeObjectURL(
            imageToRemove.preview
          );
        }

        const remaining =
          current.filter(
            (
              image
            ) =>
              image.id !==
              id
          );

        if (
          selectedImageId ===
          id
        ) {
          setSelectedImageId(
            remaining[0]
              ?.id ??
              null
          );
        }

        return remaining;
      }
    );
  };

  /* =======================================================
     VALIDATE FORM

     Draft:
     name + SKU

     Publishable:
     complete marketplace fields.
  ======================================================= */

  const validateForm = (
    targetStatus: ProductStatus
  ) => {
    if (
      !form.name.trim()
    ) {
      toast.error(
        "Product name is required."
      );

      return false;
    }

    if (
      !form.sku.trim()
    ) {
      toast.error(
        "SKU is required."
      );

      return false;
    }

    if (
      targetStatus ===
        "draft" ||
      targetStatus ===
        "archived"
    ) {
      return true;
    }

    if (
      !form.productType
    ) {
      toast.error(
        "Product type is required."
      );

      return false;
    }

    if (
      !form.category
    ) {
      toast.error(
        "Category is required."
      );

      return false;
    }

    if (
      !form.brand
    ) {
      toast.error(
        "Brand is required."
      );

      return false;
    }

    if (
      !form.supplier
    ) {
      if (
        !supplierApiAvailable
      ) {
        toast.error(
          "Supplier API is unavailable."
        );
      } else {
        toast.error(
          "Supplier is required."
        );
      }

      return false;
    }

    if (
      form.sellingPrice.trim() ===
      ""
    ) {
      toast.error(
        "Selling price is required."
      );

      return false;
    }

    if (
      form.stockQuantity.trim() ===
      ""
    ) {
      toast.error(
        "Stock quantity is required."
      );

      return false;
    }

    if (
      !form.sellingUnit
    ) {
      toast.error(
        "Selling unit is required."
      );

      return false;
    }

    const sellingPrice =
      Number(
        form.sellingPrice
      );

    if (
      !Number.isFinite(
        sellingPrice
      ) ||
      sellingPrice < 0
    ) {
      toast.error(
        "Selling price is invalid."
      );

      return false;
    }

    const stock =
      Number(
        form.stockQuantity
      );

    if (
      !Number.isInteger(
        stock
      ) ||
      stock < 0
    ) {
      toast.error(
        "Stock quantity must be a non-negative whole number."
      );

      return false;
    }

    const oldPrice =
      optionalNumber(
        form.oldPrice
      );

    if (
      oldPrice !==
        undefined &&
      oldPrice <
        sellingPrice
    ) {
      toast.error(
        "Old price cannot be lower than selling price."
      );

      return false;
    }

    return true;
  };

  /* =======================================================
     BUILD PRODUCT PAYLOAD
  ======================================================= */

  const buildPayload = (
    targetStatus: ProductStatus
  ): CreateProductPayload => {
    const sellingPrice =
      optionalNumber(
        form.sellingPrice
      );

    const oldPrice =
      optionalNumber(
        form.oldPrice
      );

    const stockQuantity =
      optionalNumber(
        form.stockQuantity
      );

    const payload: CreateProductPayload = {
      name:
        form.name.trim(),

      sku:
        form.sku.trim(),

      status:
        targetStatus,

      capacityRating:
        form.capacityRating.trim(),

      description:
        form.description.trim(),

      category:
        form.category ||
        null,

      brand:
        form.brand ||
        null,

      supplier:
        form.supplier ||
        null,

      sellingUnit:
        form.sellingUnit ||
        "piece",
    };

    if (
      form.productType
    ) {
      payload.productType =
        form.productType;
    }

    if (
      sellingPrice !==
      undefined
    ) {
      payload.pricing = {
        currency:
          "PKR",

        sellingPrice,

        oldPrice:
          oldPrice ??
          null,
      };
    }

    if (
      stockQuantity !==
      undefined
    ) {
      payload.inventory = {
        manageStock:
          true,

        quantity:
          stockQuantity,

        lowStockThreshold:
          5,

        allowBackorder:
          false,
      };
    }

    /*
     * Images are intentionally not included here.
     *
     * First create Product so backend can generate:
     *
     * STH-P-xxxx
     *
     * Then binary files are uploaded through:
     *
     * POST /products/:productId/images
     */

    return payload;
  };

  /* =======================================================
     CREATE PRODUCT + UPLOAD MEDIA
  ======================================================= */

  const submitProduct =
    async (
      targetStatus: ProductStatus
    ) => {
      if (
        submitting ||
        savingDraft ||
        uploadingImages
      ) {
        return;
      }

      if (
        !validateForm(
          targetStatus
        )
      ) {
        return;
      }

      const isDraft =
        targetStatus ===
        "draft";

      let createdProduct:
        | Awaited<
            ReturnType<
              typeof createProduct
            >
          >
        | null =
        null;

      try {
        if (
          isDraft
        ) {
          setSavingDraft(
            true
          );
        } else {
          setSubmitting(
            true
          );
        }

        const payload =
          buildPayload(
            targetStatus
          );

        /* ===============================================
           STEP 1
           CREATE PRODUCT
        =============================================== */

        createdProduct =
          await createProduct(
            payload
          );

        /* ===============================================
           STEP 2
           UPLOAD + ATTACH PRODUCT IMAGES
        =============================================== */

        if (
          images.length >
          0
        ) {
          setUploadingImages(
            true
          );

          await uploadAndAttachProductImages(
            createdProduct.productId,

            images.map(
              (
                image
              ) =>
                image.file
            )
          );
        }

        /* ===============================================
           SUCCESS
        =============================================== */

        if (
          isDraft
        ) {
          toast.success(
            "Product draft saved successfully",
            {
              description:
                images.length >
                0
                  ? `${createdProduct.productId} — ${createdProduct.name} • ${images.length} image${images.length === 1 ? "" : "s"} uploaded`
                  : `${createdProduct.productId} — ${createdProduct.name}`,
            }
          );
        } else {
          toast.success(
            "Product added successfully",
            {
              description:
                images.length >
                0
                  ? `${createdProduct.productId} — ${createdProduct.name} • ${images.length} image${images.length === 1 ? "" : "s"} uploaded`
                  : `${createdProduct.productId} — ${createdProduct.name}`,
            }
          );
        }

        window.setTimeout(
          () => {
            navigate(
              "/products"
            );
          },
          650
        );
      } catch (
        error
      ) {
        /* ===============================================
           PRODUCT EXISTS BUT MEDIA FAILED

           Do NOT tell user entire product creation failed,
           because retrying Add Product could create a
           duplicate product / duplicate SKU attempt.
        =============================================== */

        if (
          createdProduct
        ) {
          toast.error(
            "Product saved, but image upload failed",
            {
              description:
                `${createdProduct.productId} was created. ${getProductErrorMessage(
                  error,
                  "Unable to upload product images."
                )}`,
            }
          );

          window.setTimeout(
            () => {
              navigate(
                "/products"
              );
            },
            1400
          );

          return;
        }

        toast.error(
          isDraft
            ? "Unable to save product draft"
            : "Unable to add product",
          {
            description:
              getProductErrorMessage(
                error
              ),
          }
        );
      } finally {
        setUploadingImages(
          false
        );

        setSubmitting(
          false
        );

        setSavingDraft(
          false
        );
      }
    };

  /* =======================================================
     FORM SUBMIT
  ======================================================= */

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    void submitProduct(
      form.status
    );
  };

  const busy =
    submitting ||
    savingDraft ||
    uploadingImages;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Add Product | Solar Trade Hub"
        description="Add a new Solar Trade Hub product"
      />

      <PageBreadcrumb
        pageTitle="Add Product"
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
        className="space-y-4"
      >
        {/* ===============================================
            PRODUCT IMAGES
        =============================================== */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Product Images
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Upload marketplace
              product images. Files
              are stored in Solar
              Trade Hub media storage.
            </p>
          </div>

          <div className="p-5">
            <label
              onDragOver={
                handleDragOver
              }
              onDragLeave={
                handleDragLeave
              }
              onDrop={
                handleDrop
              }
              className={[
                "flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 text-center transition",

                dragActive
                  ? "border-[#ff4b1f] bg-[#ff4b1f]/10"
                  : "border-[#ff4b1f]/45 bg-gray-50 hover:border-[#ff4b1f] hover:bg-[#ff4b1f]/5 dark:bg-[#0d1423]",
              ].join(
                " "
              )}
            >
              <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#ff4b1f]/10 text-[#ff4b1f]">
                <UploadIcon />
              </div>

              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Drop images here
                or{" "}
                <span className="text-[#ff4b1f]">
                  browse
                </span>
              </p>

              <p className="mt-2 text-xs text-gray-400">
                JPG, PNG, WEBP,
                AVIF • Max{" "}
                {MAX_IMAGES} images
                • 10 MB each
              </p>

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={
                  handleImageUpload
                }
                disabled={
                  busy
                }
                className="hidden"
              />
            </label>

            {images.length >
              0 && (
              <>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900/50 dark:bg-green-500/10">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {
                      images.length
                    }{" "}
                    image
                    {images.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    ready to upload.
                    The first image
                    will be the
                    primary product
                    image.
                  </p>

                  <span className="ml-3 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                    Ready
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                  {/* MAIN PREVIEW */}

                  <div className="flex min-h-[250px] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#0d1423]">
                    {selectedImage && (
                      <img
                        src={
                          selectedImage.preview
                        }
                        alt={
                          selectedImage.file
                            .name
                        }
                        className="max-h-[220px] w-full object-contain"
                      />
                    )}
                  </div>

                  {/* THUMBNAILS */}

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Selected Images
                    </p>

                    <div className="grid grid-cols-3 gap-2 xl:grid-cols-2">
                      {images.map(
                        (
                          image,
                          index
                        ) => (
                          <div
                            key={
                              image.id
                            }
                            className={[
                              "group relative overflow-hidden rounded-lg border",

                              selectedImage
                                ?.id ===
                              image.id
                                ? "border-[#ff4b1f]"
                                : "border-gray-200 dark:border-gray-800",
                            ].join(
                              " "
                            )}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedImageId(
                                  image.id
                                )
                              }
                              className="block w-full bg-gray-50 p-1.5 dark:bg-[#0d1423]"
                            >
                              <img
                                src={
                                  image.preview
                                }
                                alt={
                                  image.file
                                    .name
                                }
                                className="h-16 w-full rounded-md object-contain"
                              />

                              {index ===
                                0 && (
                                <span className="absolute bottom-1.5 left-1.5 rounded bg-[#5b2eff] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                                  Primary
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                removeImage(
                                  image.id
                                )
                              }
                              className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md bg-red-500 text-xs text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {uploadingImages && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-3 text-xs font-medium text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                <SpinnerIcon />

                Uploading product
                images to Solar
                Trade Hub media
                storage...
              </div>
            )}
          </div>
        </section>

        {/* ===============================================
            PRODUCT DETAILS
        =============================================== */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Product Details
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Marketplace and
              inventory
              information.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {/* PRODUCT NAME */}

            <Field
              label="Product Name"
              required
            >
              <input
                name="name"
                value={
                  form.name
                }
                onChange={
                  handleFieldChange
                }
                placeholder="e.g. Jinko Tiger Neo 725W N-Type"
                className="sth-product-input"
                disabled={
                  busy
                }
              />
            </Field>

            {/* PRODUCT ID */}

            <Field
              label="Product ID"
              badge="AUTO"
            >
              <input
                value="Generated automatically after save"
                readOnly
                tabIndex={-1}
                className="sth-product-input cursor-not-allowed bg-gray-50 font-mono text-gray-500 dark:bg-gray-900 dark:text-gray-400"
              />

              <p className="mt-1.5 text-[10px] text-gray-400">
                Example:
                STH-P-0001.
                Product IDs cannot
                be edited or reused.
              </p>
            </Field>

            {/* SKU */}

            <Field
              label="SKU"
              required
            >
              <input
                name="sku"
                value={
                  form.sku
                }
                onChange={
                  handleFieldChange
                }
                placeholder="e.g. M-JIN-725W-NTB"
                className="sth-product-input font-mono"
                disabled={
                  busy
                }
              />
            </Field>

            {/* TYPE */}

            <Field
              label="Type"
              publishRequired
            >
              <SelectField
                name="productType"
                value={
                  form.productType
                }
                onChange={
                  handleFieldChange
                }
                placeholder="Select Type"
                options={
                  PRODUCT_TYPE_OPTIONS
                }
                disabled={
                  busy
                }
              />
            </Field>

            {/* CATEGORY */}

            <Field
              label="Category"
              publishRequired
            >
              <SelectField
                name="category"
                value={
                  form.category
                }
                onChange={
                  handleFieldChange
                }
                placeholder={
                  referencesLoading
                    ? "Loading Categories..."
                    : categories.length >
                        0
                      ? "Select Category"
                      : "No Active Categories"
                }
                options={
                  categories
                }
                disabled={
                  busy ||
                  referencesLoading ||
                  categories.length ===
                    0
                }
              />
            </Field>

            {/* BRAND */}

            <Field
              label="Brand"
              publishRequired
            >
              <SelectField
                name="brand"
                value={
                  form.brand
                }
                onChange={
                  handleFieldChange
                }
                placeholder={
                  referencesLoading
                    ? "Loading Brands..."
                    : brands.length >
                        0
                      ? "Select Brand"
                      : "No Active Brands"
                }
                options={
                  brands
                }
                disabled={
                  busy ||
                  referencesLoading ||
                  brands.length ===
                    0
                }
              />
            </Field>

            {/* SUPPLIER */}

            <Field
              label="Supplier"
              publishRequired
            >
              <SelectField
                name="supplier"
                value={
                  form.supplier
                }
                onChange={
                  handleFieldChange
                }
                placeholder={
                  referencesLoading
                    ? "Loading Suppliers..."
                    : !supplierApiAvailable
                      ? "Supplier API unavailable"
                      : suppliers.length >
                          0
                        ? "Select Supplier"
                        : "No Active Suppliers"
                }
                options={
                  suppliers
                }
                disabled={
                  busy ||
                  referencesLoading ||
                  !supplierApiAvailable ||
                  suppliers.length ===
                    0
                }
              />
            </Field>

            {/* CAPACITY */}

            <Field label="Capacity / Rating">
              <input
                name="capacityRating"
                value={
                  form.capacityRating
                }
                onChange={
                  handleFieldChange
                }
                placeholder="725W / 10kW / 16.077kWh"
                className="sth-product-input"
                disabled={
                  busy
                }
              />
            </Field>

            {/* STATUS */}

            <Field
              label="Status"
              required
            >
              <SelectField
                name="status"
                value={
                  form.status
                }
                onChange={
                  handleFieldChange
                }
                placeholder="Select Status"
                options={
                  STATUS_OPTIONS
                }
                disabled={
                  busy
                }
              />
            </Field>
          </div>
        </section>

        {/* ===============================================
            PRICING & INVENTORY
        =============================================== */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Pricing &
              Inventory
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Required before
              publishing. Drafts
              may be saved without
              completing these
              fields.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            {/* SELLING PRICE */}

            <Field
              label="Selling Price"
              publishRequired
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  Rs
                </span>

                <input
                  type="number"
                  name="sellingPrice"
                  value={
                    form.sellingPrice
                  }
                  onChange={
                    handleFieldChange
                  }
                  placeholder="26500"
                  className="sth-product-input pl-9"
                  min="0"
                  step="0.01"
                  disabled={
                    busy
                  }
                />
              </div>
            </Field>

            {/* OLD PRICE */}

            <Field label="Old Price">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  Rs
                </span>

                <input
                  type="number"
                  name="oldPrice"
                  value={
                    form.oldPrice
                  }
                  onChange={
                    handleFieldChange
                  }
                  placeholder="28000"
                  className="sth-product-input pl-9"
                  min="0"
                  step="0.01"
                  disabled={
                    busy
                  }
                />
              </div>
            </Field>

            {/* STOCK */}

            <Field
              label="Stock Quantity"
              publishRequired
            >
              <input
                type="number"
                name="stockQuantity"
                value={
                  form.stockQuantity
                }
                onChange={
                  handleFieldChange
                }
                placeholder="184"
                className="sth-product-input"
                min="0"
                step="1"
                disabled={
                  busy
                }
              />
            </Field>

            {/* UNIT */}

            <Field
              label="Selling Unit"
              publishRequired
            >
              <SelectField
                name="sellingUnit"
                value={
                  form.sellingUnit
                }
                onChange={
                  handleFieldChange
                }
                placeholder="Select Unit"
                options={
                  SELLING_UNIT_OPTIONS
                }
                disabled={
                  busy
                }
              />
            </Field>
          </div>
        </section>

        {/* ===============================================
            DESCRIPTION
        =============================================== */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Description
            </h2>
          </div>

          <div className="p-5">
            <textarea
              name="description"
              value={
                form.description
              }
              onChange={
                handleFieldChange
              }
              rows={5}
              disabled={
                busy
              }
              placeholder="Enter specifications, technology, warranty and other marketplace details..."
              className="sth-product-input min-h-[130px] resize-y py-3"
            />
          </div>
        </section>

        {/* ===============================================
            ACTION BAR
        =============================================== */}

        <div className="flex flex-col-reverse gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-end dark:border-gray-800 dark:bg-white/[0.03]">
          <button
            type="button"
            disabled={
              busy
            }
            onClick={() =>
              navigate(
                "/products"
              )
            }
            className="h-10 rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              busy
            }
            onClick={() =>
              void submitProduct(
                "draft"
              )
            }
            className="inline-flex h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg border border-[#5b2eff] px-5 text-sm font-semibold text-[#8f78ff] transition hover:bg-[#5b2eff]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(savingDraft ||
              (uploadingImages &&
                savingDraft)) && (
              <SpinnerIcon />
            )}

            {uploadingImages &&
            savingDraft
              ? "Uploading..."
              : savingDraft
                ? "Saving..."
                : "Save Draft"}
          </button>

          <button
            type="submit"
            disabled={
              busy
            }
            className="inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-6 text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(submitting ||
              uploadingImages) && (
              <SpinnerIcon />
            )}

            {uploadingImages &&
            submitting
              ? "Uploading Images..."
              : submitting
                ? "Adding..."
                : "Add Product"}
          </button>
        </div>
      </form>

      {/* =================================================
          INPUT STYLES
      ================================================= */}

      <style>{`
        .sth-product-input {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: transparent;
          padding-left: 12px;
          padding-right: 12px;
          color: #111827;
          font-size: 13px;
          outline: none;
          transition: 0.2s ease;
        }

        .dark .sth-product-input {
          background: #111827;
          border-color: #374151;
          color: #f8fafc;
        }

        .sth-product-input::placeholder {
          color: #9ca3af;
        }

        .sth-product-input:hover:not(:disabled) {
          border-color: #9ca3af;
        }

        .dark .sth-product-input:hover:not(:disabled) {
          border-color: #4b5563;
        }

        .sth-product-input:focus {
          border-color: #ff4b1f;
          box-shadow: 0 0 0 3px rgba(255, 75, 31, 0.08);
        }

        .sth-product-input:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        select.sth-product-input {
          appearance: none;
          cursor: pointer;
        }

        select.sth-product-input:disabled {
          cursor: not-allowed;
        }

        textarea.sth-product-input {
          height: auto;
        }
      `}</style>
    </>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required,
  publishRequired,
  badge,
  children,
}: {
  label: string;

  required?: boolean;

  publishRequired?: boolean;

  badge?: string;

  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 flex min-h-[18px] items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
        <span>
          {label}
        </span>

        {required && (
          <span className="text-[#ff4b1f]">
            *
          </span>
        )}

        {publishRequired && (
          <span
            title="Required before publishing"
            className="text-[#ff4b1f]"
          >
            *
          </span>
        )}

        {badge && (
          <span className="ml-1 rounded bg-[#5b2eff]/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#7257ff]">
            {badge}
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  name,
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: {
  name: string;

  value: string;

  onChange: (
    event: ChangeEvent<HTMLSelectElement>
  ) => void;

  placeholder: string;

  options: ReferenceOption[];

  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        name={
          name
        }
        value={
          value
        }
        onChange={
          onChange
        }
        disabled={
          disabled
        }
        className="sth-product-input pr-9"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(
          (
            option
          ) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>

      <ChevronIcon />
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-4 animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}