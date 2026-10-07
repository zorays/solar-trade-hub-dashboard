import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  FormEvent,
  ReactNode,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
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
  getProduct,
  getProductBrandId,
  getProductCategoryId,
  getProductErrorMessage,
  getProductSupplierId,
  MAX_PRODUCT_UPLOAD_IMAGES,
  MAX_PRODUCT_UPLOAD_SIZE,
  updateProduct,
  uploadAndAttachProductImages,
  type Product,
  type ProductImage,
  type ProductStatus,
  type ProductType,
  type SellingUnit,
  type UpdateProductPayload,
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
   PRODUCT TYPE OPTIONS
========================================================= */

const PRODUCT_TYPE_OPTIONS: ReferenceOption[] = [
  {
    value: "solar_panel",
    label: "Solar Panel",
  },

  {
    value: "inverter",
    label: "Inverter",
  },

  {
    value: "battery",
    label: "Battery",
  },

  {
    value: "energy_storage",
    label: "Energy Storage",
  },

  {
    value: "mounting_structure",
    label: "Mounting Structure",
  },

  {
    value: "cable_accessory",
    label: "Cable & Accessory",
  },

  {
    value: "protection",
    label: "Protection",
  },

  {
    value: "other",
    label: "Other",
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
   MEDIA LIMITS
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
   EMPTY FORM
========================================================= */

const EMPTY_FORM: ProductForm = {
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

  sellingUnit: "piece",

  status: "draft",

  description: "",
};

/* =========================================================
   LOCAL IMAGE ID
========================================================= */

function createLocalImageId() {
  if (
    globalThis.crypto
      ?.randomUUID
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/* =========================================================
   RESOLVE MEDIA URL

   Database stores:

   /uploads/products/image.webp

   Dashboard may run on:
   localhost:5173

   Backend may run on:
   localhost:5000

   Therefore relative media path needs backend origin.
========================================================= */

function resolveMediaUrl(
  imageUrl?: string
) {
  if (
    !imageUrl
  ) {
    return "";
  }

  if (
    imageUrl.startsWith(
      "http://"
    ) ||
    imageUrl.startsWith(
      "https://"
    ) ||
    imageUrl.startsWith(
      "blob:"
    ) ||
    imageUrl.startsWith(
      "data:"
    )
  ) {
    return imageUrl;
  }

  const baseURL =
    api.defaults.baseURL;

  if (
    !baseURL
  ) {
    return imageUrl;
  }

  try {
    const absoluteApiUrl =
      new URL(
        baseURL,
        window.location.origin
      );

    const normalizedPath =
      imageUrl.startsWith(
        "/"
      )
        ? imageUrl
        : `/${imageUrl}`;

    return new URL(
      normalizedPath,
      absoluteApiUrl.origin
    ).toString();
  } catch {
    return imageUrl;
  }
}

/* =========================================================
   REFERENCE RESPONSE HELPER
========================================================= */

function extractReferenceRecords(
  response: ReferenceApiResponse,
  key:
    | "categories"
    | "brands"
    | "suppliers"
): ReferenceRecord[] {
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
   REFERENCE OPTIONS
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
   REFERENCE LABEL
========================================================= */

function getReferenceLabel(
  value:
    | Product["category"]
    | Product["brand"]
    | Product["supplier"]
) {
  if (
    !value ||
    typeof value ===
      "string"
  ) {
    return "";
  }

  if (
    "companyName" in
      value &&
    typeof value.companyName ===
      "string" &&
    value.companyName.trim()
  ) {
    return value.companyName;
  }

  if (
    "name" in
      value &&
    typeof value.name ===
      "string" &&
    value.name.trim()
  ) {
    return value.name;
  }

  return "";
}

/* =========================================================
   PRESERVE CURRENT OPTION
========================================================= */

function mergeCurrentOption(
  options: ReferenceOption[],
  currentValue: string,
  currentLabel: string
): ReferenceOption[] {
  if (
    !currentValue
  ) {
    return options;
  }

  const alreadyExists =
    options.some(
      (
        option
      ) =>
        option.value ===
        currentValue
    );

  if (
    alreadyExists
  ) {
    return options;
  }

  return [
    {
      value:
        currentValue,

      label:
        currentLabel ||
        "Current Selection",
    },

    ...options,
  ];
}

/* =========================================================
   PRODUCT -> FORM
========================================================= */

function productToForm(
  product: Product
): ProductForm {
  return {
    name:
      product.name ||
      "",

    sku:
      product.sku ||
      "",

    productType:
      product.productType ||
      "other",

    category:
      getProductCategoryId(
        product
      ),

    brand:
      getProductBrandId(
        product
      ),

    supplier:
      getProductSupplierId(
        product
      ),

    capacityRating:
      product.capacityRating ||
      "",

    sellingPrice:
      String(
        product.pricing
          ?.sellingPrice ??
          ""
      ),

    oldPrice:
      product.pricing
        ?.oldPrice !==
        null &&
      product.pricing
        ?.oldPrice !==
        undefined
        ? String(
            product.pricing
              .oldPrice
          )
        : "",

    stockQuantity:
      String(
        product.inventory
          ?.quantity ??
          0
      ),

    sellingUnit:
      product.sellingUnit ||
      "piece",

    status:
      product.status ||
      "draft",

    description:
      product.description ||
      "",
  };
}

/* =========================================================
   OPTIONAL NUMBER
========================================================= */

function optionalNumber(
  value: string
) {
  const trimmed =
    value.trim();

  if (
    !trimmed
  ) {
    return undefined;
  }

  const parsed =
    Number(
      trimmed
    );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return undefined;
  }

  return parsed;
}

/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabel(
  status: ProductStatus
) {
  switch (
    status
  ) {
    case "active":
      return "Active";

    case "inactive":
      return "Inactive";

    case "archived":
      return "Archived";

    case "draft":
    default:
      return "Draft";
  }
}

/* =========================================================
   CLEAN EXISTING IMAGES
========================================================= */

function prepareImagesForApi(
  images: ProductImage[]
): ProductImage[] {
  return images.map(
    (
      image,
      index
    ) => ({
      url:
        image.url,

      alt:
        image.alt ||
        "",

      isPrimary:
        image.isPrimary ??
        index === 0,

      sortOrder:
        image.sortOrder ??
        index,
    })
  );
}

/* =========================================================
   EDIT PRODUCT
========================================================= */

export default function EditProduct() {
  const params =
    useParams();

  const navigate =
    useNavigate();

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
    form,
    setForm,
  ] =
    useState<ProductForm>(
      EMPTY_FORM
    );

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
    existingImages,
    setExistingImages,
  ] =
    useState<
      ProductImage[]
    >([]);

  const [
    newImages,
    setNewImages,
  ] =
    useState<
      UploadedImage[]
    >([]);

  const newImagesRef =
    useRef<
      UploadedImage[]
    >([]);

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
    uploadingImages,
    setUploadingImages,
  ] =
    useState(false);

  const [
    loadError,
    setLoadError,
  ] =
    useState("");

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

  const busy =
    saving ||
    uploadingImages;

  /* =======================================================
     KEEP LATEST LOCAL IMAGE LIST
  ======================================================= */

  useEffect(() => {
    newImagesRef.current =
      newImages;
  }, [
    newImages,
  ]);

  /* =======================================================
     CLEAN LOCAL BLOB URLs
  ======================================================= */

  useEffect(() => {
    return () => {
      newImagesRef.current.forEach(
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
     LOAD PRODUCT
  ======================================================= */

  const loadProduct =
    useCallback(
      async () => {
        if (
          !productReference
        ) {
          setLoadError(
            "Product ID is missing."
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

          const fetchedProduct =
            await getProduct(
              productReference
            );

          setProduct(
            fetchedProduct
          );

          setForm(
            productToForm(
              fetchedProduct
            )
          );

          setExistingImages(
            Array.isArray(
              fetchedProduct.images
            )
              ? fetchedProduct.images
              : []
          );
        } catch (
          error
        ) {
          setLoadError(
            getProductErrorMessage(
              error,
              "Unable to load product."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        productReference,
      ]
    );

  /* =======================================================
     LOAD REFERENCES
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
        }

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
          setBrands(
            []
          );
        }

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
          setSuppliers(
            []
          );

          setSupplierApiAvailable(
            false
          );
        }

        setReferencesLoading(
          false
        );
      },
      []
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadProduct();

    void loadReferenceData();
  }, [
    loadProduct,
    loadReferenceData,
  ]);

  /* =======================================================
     SELECT OPTIONS
  ======================================================= */

  const categoryOptions =
    mergeCurrentOption(
      categories,
      form.category,
      getReferenceLabel(
        product?.category ??
          null
      ) ||
        "Current Category"
    );

  const brandOptions =
    mergeCurrentOption(
      brands,
      form.brand,
      getReferenceLabel(
        product?.brand ??
          null
      ) ||
        "Current Brand"
    );

  const supplierOptions =
    mergeCurrentOption(
      suppliers,
      form.supplier,
      getReferenceLabel(
        product?.supplier ??
          null
      ) ||
        "Current Supplier"
    );

  /* =======================================================
     FIELD CHANGE
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
     ADD NEW IMAGE FILES
  ======================================================= */

  const handleImageUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files =
      Array.from(
        event.target.files ??
          []
      );

    event.target.value =
      "";

    if (
      files.length ===
      0
    ) {
      return;
    }

    const validFiles:
      File[] = [];

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
              "Each image must be 10 MB or smaller.",
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
          existingImages.length -
          newImages.length,
        0
      );

    if (
      availableSlots ===
      0
    ) {
      toast.error(
        `Maximum ${MAX_IMAGES} product images are allowed.`
      );

      return;
    }

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
        `Only ${availableSlots} more image${
          availableSlots === 1
            ? ""
            : "s"
        } can be added.`
      );
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

    setNewImages(
      (
        current
      ) => [
        ...current,
        ...uploadedImages,
      ]
    );
  };

  /* =======================================================
     REMOVE NEW IMAGE
  ======================================================= */

  const removeNewImage = (
    imageId: string
  ) => {
    setNewImages(
      (
        current
      ) => {
        const target =
          current.find(
            (
              image
            ) =>
              image.id ===
              imageId
          );

        if (
          target
        ) {
          URL.revokeObjectURL(
            target.preview
          );
        }

        return current.filter(
          (
            image
          ) =>
            image.id !==
            imageId
        );
      }
    );
  };

  /* =======================================================
     REMOVE EXISTING IMAGE

     This removes the image reference from Product.images.

     Physical-file deletion endpoint can be wired
     separately so media cleanup is controlled by backend.
  ======================================================= */

  const removeExistingImage = (
    index: number
  ) => {
    setExistingImages(
      (
        current
      ) => {
        const next =
          current.filter(
            (
              _image,
              imageIndex
            ) =>
              imageIndex !==
              index
          );

        if (
          next.length >
            0 &&
          !next.some(
            (
              image
            ) =>
              image.isPrimary
          )
        ) {
          return next.map(
            (
              image,
              imageIndex
            ) => ({
              ...image,

              isPrimary:
                imageIndex ===
                0,

              sortOrder:
                imageIndex,
            })
          );
        }

        return next.map(
          (
            image,
            imageIndex
          ) => ({
            ...image,

            sortOrder:
              imageIndex,
          })
        );
      }
    );
  };

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validateForm =
    () => {
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
        form.status ===
          "draft" ||
        form.status ===
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

      const sellingPrice =
        optionalNumber(
          form.sellingPrice
        );

      if (
        sellingPrice ===
          undefined ||
        sellingPrice <
          0
      ) {
        toast.error(
          "Selling price is required."
        );

        return false;
      }

      const stockQuantity =
        optionalNumber(
          form.stockQuantity
        );

      if (
        stockQuantity ===
          undefined ||
        !Number.isInteger(
          stockQuantity
        ) ||
        stockQuantity <
          0
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

      if (
        !form.sellingUnit
      ) {
        toast.error(
          "Selling unit is required."
        );

        return false;
      }

      return true;
    };

  /* =======================================================
     BUILD UPDATE PAYLOAD
  ======================================================= */

  const buildPayload =
    (): UpdateProductPayload => {
      const payload:
        UpdateProductPayload = {
        name:
          form.name.trim(),

        sku:
          form.sku.trim(),

        status:
          form.status,

        category:
          form.category ||
          null,

        brand:
          form.brand ||
          null,

        supplier:
          form.supplier ||
          null,

        capacityRating:
          form.capacityRating.trim(),

        description:
          form.description.trim(),

        sellingUnit:
          form.sellingUnit ||
          "piece",

        images:
          prepareImagesForApi(
            existingImages
          ),
      };

      if (
        form.productType
      ) {
        payload.productType =
          form.productType;
      }

      const sellingPrice =
        optionalNumber(
          form.sellingPrice
        );

      const oldPrice =
        optionalNumber(
          form.oldPrice
        );

      if (
        sellingPrice !==
        undefined
      ) {
        payload.pricing = {
          currency:
            product?.pricing
              ?.currency ||
            "PKR",

          sellingPrice,

          oldPrice:
            oldPrice ??
            null,

          costPrice:
            product?.pricing
              ?.costPrice ??
            null,
        };
      }

      const stockQuantity =
        optionalNumber(
          form.stockQuantity
        );

      if (
        stockQuantity !==
        undefined
      ) {
        payload.inventory = {
          manageStock:
            product
              ?.inventory
              ?.manageStock ??
            true,

          quantity:
            stockQuantity,

          lowStockThreshold:
            product
              ?.inventory
              ?.lowStockThreshold ??
            5,

          stockStatus:
            product
              ?.inventory
              ?.stockStatus,

          allowBackorder:
            product
              ?.inventory
              ?.allowBackorder ??
            false,
        };
      }

      return payload;
    };

  /* =======================================================
     UPDATE PRODUCT + MEDIA
  ======================================================= */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        !product ||
        busy
      ) {
        return;
      }

      if (
        !validateForm()
      ) {
        return;
      }

      let detailsUpdated:
        Product | null =
        null;

      try {
        setSaving(
          true
        );

        /* ===============================================
           STEP 1:
           UPDATE NORMAL PRODUCT FIELDS + EXISTING IMAGES
        =============================================== */

        detailsUpdated =
          await updateProduct(
            product.productId,
            buildPayload()
          );

        let finalProduct =
          detailsUpdated;

        /* ===============================================
           STEP 2:
           UPLOAD NEW IMAGE FILES
        =============================================== */

        if (
          newImages.length >
          0
        ) {
          setUploadingImages(
            true
          );

          finalProduct =
            await uploadAndAttachProductImages(
              detailsUpdated.productId,

              newImages.map(
                (
                  image
                ) =>
                  image.file
              )
            );
        }

        /* ===============================================
           UPDATE LOCAL STATE
        =============================================== */

        setProduct(
          finalProduct
        );

        setForm(
          productToForm(
            finalProduct
          )
        );

        setExistingImages(
          finalProduct.images ||
            []
        );

        newImages.forEach(
          (
            image
          ) => {
            URL.revokeObjectURL(
              image.preview
            );
          }
        );

        setNewImages(
          []
        );

        toast.success(
          "Product updated successfully",
          {
            description:
              newImages.length >
              0
                ? `${finalProduct.productId} — ${newImages.length} new image${
                    newImages.length ===
                    1
                      ? ""
                      : "s"
                  } uploaded`
                : `${finalProduct.productId} — ${finalProduct.name}`,
          }
        );

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
        /*
         * Product details may already be saved before
         * binary media upload failed.
         */

        if (
          detailsUpdated
        ) {
          setProduct(
            detailsUpdated
          );

          setForm(
            productToForm(
              detailsUpdated
            )
          );

          setExistingImages(
            detailsUpdated.images ||
              []
          );

          toast.error(
            "Product details saved, but media upload failed",
            {
              description:
                getProductErrorMessage(
                  error,
                  "Unable to upload new product images."
                ),
            }
          );

          return;
        }

        toast.error(
          "Unable to update product",
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

        setSaving(
          false
        );
      }
    };

  /* =======================================================
     RESET UNSAVED CHANGES
  ======================================================= */

  const handleReset =
    () => {
      if (
        !product ||
        busy
      ) {
        return;
      }

      newImages.forEach(
        (
          image
        ) => {
          URL.revokeObjectURL(
            image.preview
          );
        }
      );

      setNewImages(
        []
      );

      setForm(
        productToForm(
          product
        )
      );

      setExistingImages(
        product.images ||
          []
      );

      toast.success(
        "Unsaved changes reset."
      );
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <>
        <PageMeta
          title="Edit Product | Solar Trade Hub"
          description="Edit Solar Trade Hub product"
        />

        <PageBreadcrumb
          pageTitle="Edit Product"
        />

        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#5b2eff]/10 text-[#8f78ff]">
            <SpinnerIcon />
          </div>

          <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
            Loading product...
          </p>
        </div>
      </>
    );
  }

  /* =======================================================
     PRODUCT NOT FOUND
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
          pageTitle="Edit Product"
        />

        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Product not found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {loadError ||
              "The requested product could not be found."}
          </p>

          <Link
            to="/products"
            className="mt-5 inline-flex rounded-lg bg-[#ff4b1f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e83c12]"
          >
            Back to Products
          </Link>
        </div>
      </>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title={`Edit ${product.productId} | Solar Trade Hub`}
        description="Edit Solar Trade Hub product"
      />

      <PageBreadcrumb
        pageTitle="Edit Product"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      {/* =================================================
          TOP INFORMATION
      ================================================= */}

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-white/[0.03]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Editing Product
          </p>

          <h2 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {form.name}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[#5b2eff]/10 px-3 py-1.5 font-mono text-xs font-semibold text-[#8f78ff]">
            {product.productId}
          </span>

          <StatusBadge
            status={
              form.status
            }
          />
        </div>
      </div>

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-4"
      >
        {/* =================================================
            PRODUCT IMAGES
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Product Images"
            description={`Manage Solar Trade Hub product media. Maximum ${MAX_IMAGES} images, 10 MB each.`}
          />

          {/* EXISTING IMAGES */}

          <div className="p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Existing Images
              </p>

              <span className="text-[10px] font-medium text-gray-400">
                {
                  existingImages.length
                }
                /{MAX_IMAGES}
              </span>
            </div>

            {existingImages.length >
            0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {existingImages.map(
                  (
                    image,
                    index
                  ) => (
                    <div
                      key={
                        image._id ||
                        image.url ||
                        index
                      }
                      className="group relative flex h-28 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-[#0d1423]"
                    >
                      <img
                        src={resolveMediaUrl(
                          image.url
                        )}
                        alt={
                          image.alt ||
                          product.name
                        }
                        className="max-h-full w-full object-contain"
                      />

                      {image.isPrimary && (
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-[#5b2eff] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          Primary
                        </span>
                      )}

                      <button
                        type="button"
                        disabled={
                          busy
                        }
                        onClick={() =>
                          removeExistingImage(
                            index
                          )
                        }
                        className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md bg-red-500 text-xs text-white opacity-0 transition hover:bg-red-600 disabled:cursor-not-allowed group-hover:opacity-100"
                        aria-label="Remove existing image"
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-xs text-gray-500 dark:border-gray-800">
                No existing product images.
              </div>
            )}
          </div>

          {/* NEW IMAGES */}

          <div className="border-t border-gray-200 p-5 dark:border-gray-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Add New Images
            </p>

            <label
              className={[
                "flex min-h-[150px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 text-center transition",

                busy ||
                existingImages.length +
                  newImages.length >=
                  MAX_IMAGES
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-[#0d1423]"
                  : "cursor-pointer border-[#ff4b1f]/45 bg-gray-50 hover:border-[#ff4b1f] hover:bg-[#ff4b1f]/5 dark:bg-[#0d1423]",
              ].join(
                " "
              )}
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#ff4b1f]/10 text-[#ff4b1f]">
                <UploadIcon />
              </div>

              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {existingImages.length +
                  newImages.length >=
                MAX_IMAGES
                  ? "Maximum images reached"
                  : "Select new product images"}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                JPG, PNG, WEBP,
                AVIF • 10 MB each
              </p>

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={
                  handleImageUpload
                }
                disabled={
                  busy ||
                  existingImages.length +
                    newImages.length >=
                    MAX_IMAGES
                }
                className="hidden"
              />
            </label>

            {newImages.length >
              0 && (
              <>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900/50 dark:bg-green-500/10">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {
                      newImages.length
                    }{" "}
                    new image
                    {newImages.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    ready to upload.
                  </p>

                  <span className="text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                    Ready
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                  {newImages.map(
                    (
                      image
                    ) => (
                      <div
                        key={
                          image.id
                        }
                        className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <img
                          src={
                            image.preview
                          }
                          alt={
                            image.file
                              .name
                          }
                          className="h-16 w-full bg-gray-50 object-contain p-1 dark:bg-[#0d1423]"
                        />

                        <button
                          type="button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            removeNewImage(
                              image.id
                            )
                          }
                          className="absolute right-1 top-1 flex size-5 items-center justify-center rounded bg-red-500 text-[10px] text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Remove new image"
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {uploadingImages && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-3 text-xs font-medium text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                <SpinnerIcon />

                Uploading new product
                images...
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            PRODUCT DETAILS
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Product Details"
            description="Update marketplace and inventory information."
          />

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
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
                disabled={
                  busy
                }
                className="sth-product-input"
              />
            </Field>

            <Field
              label="Product ID"
              badge="LOCKED"
            >
              <input
                value={
                  product.productId
                }
                readOnly
                tabIndex={-1}
                className="sth-product-input cursor-not-allowed bg-gray-50 font-mono text-gray-500 dark:bg-gray-900 dark:text-gray-400"
              />

              <p className="mt-1.5 text-[10px] text-gray-400">
                Public Product ID cannot be changed.
              </p>
            </Field>

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
                disabled={
                  busy
                }
                className="sth-product-input font-mono"
              />
            </Field>

            <Field
              label="Type"
              required
            >
              <SelectField
                name="productType"
                value={
                  form.productType
                }
                onChange={
                  handleFieldChange
                }
                options={
                  PRODUCT_TYPE_OPTIONS
                }
                placeholder="Select Type"
                disabled={
                  busy
                }
              />
            </Field>

            <Field
              label="Category"
              required
            >
              <SelectField
                name="category"
                value={
                  form.category
                }
                onChange={
                  handleFieldChange
                }
                options={
                  categoryOptions
                }
                placeholder={
                  referencesLoading
                    ? "Loading Categories..."
                    : "Select Category"
                }
                disabled={
                  busy ||
                  referencesLoading
                }
              />
            </Field>

            <Field
              label="Brand"
              required
            >
              <SelectField
                name="brand"
                value={
                  form.brand
                }
                onChange={
                  handleFieldChange
                }
                options={
                  brandOptions
                }
                placeholder={
                  referencesLoading
                    ? "Loading Brands..."
                    : "Select Brand"
                }
                disabled={
                  busy ||
                  referencesLoading
                }
              />
            </Field>

            <Field
              label="Supplier"
              required
            >
              <SelectField
                name="supplier"
                value={
                  form.supplier
                }
                onChange={
                  handleFieldChange
                }
                options={
                  supplierOptions
                }
                placeholder={
                  referencesLoading
                    ? "Loading Suppliers..."
                    : supplierApiAvailable
                      ? "Select Supplier"
                      : "Supplier API unavailable"
                }
                disabled={
                  busy ||
                  referencesLoading ||
                  (
                    !supplierApiAvailable &&
                    !form.supplier
                  )
                }
              />
            </Field>

            <Field label="Capacity / Rating">
              <input
                name="capacityRating"
                value={
                  form.capacityRating
                }
                onChange={
                  handleFieldChange
                }
                disabled={
                  busy
                }
                placeholder="725W / 10kW / 16.077kWh"
                className="sth-product-input"
              />
            </Field>

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
                options={
                  STATUS_OPTIONS
                }
                placeholder="Select Status"
                disabled={
                  busy
                }
              />
            </Field>
          </div>
        </section>

        {/* =================================================
            PRICING & INVENTORY
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Pricing & Inventory"
          />

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Selling Price"
              required
            >
              <PriceInput
                name="sellingPrice"
                value={
                  form.sellingPrice
                }
                onChange={
                  handleFieldChange
                }
                disabled={
                  busy
                }
              />
            </Field>

            <Field label="Old Price">
              <PriceInput
                name="oldPrice"
                value={
                  form.oldPrice
                }
                onChange={
                  handleFieldChange
                }
                disabled={
                  busy
                }
              />
            </Field>

            <Field
              label="Stock Quantity"
              required
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
                min="0"
                step="1"
                disabled={
                  busy
                }
                className="sth-product-input"
              />
            </Field>

            <Field
              label="Selling Unit"
              required
            >
              <SelectField
                name="sellingUnit"
                value={
                  form.sellingUnit
                }
                onChange={
                  handleFieldChange
                }
                options={
                  SELLING_UNIT_OPTIONS
                }
                placeholder="Select Unit"
                disabled={
                  busy
                }
              />
            </Field>
          </div>
        </section>

        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Description"
          />

          <div className="p-5">
            <textarea
              name="description"
              value={
                form.description
              }
              onChange={
                handleFieldChange
              }
              disabled={
                busy
              }
              rows={5}
              placeholder="Enter specifications, technology, warranty and marketplace details..."
              className="sth-product-input min-h-[130px] resize-y py-3"
            />
          </div>
        </section>

        {/* =================================================
            ACTION BAR
        ================================================= */}

        <div className="flex flex-col-reverse gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:justify-end dark:border-gray-800 dark:bg-white/[0.03]">
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
            onClick={
              handleReset
            }
            className="h-10 rounded-lg border border-gray-300 px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={
              busy
            }
            className="inline-flex h-10 min-w-[165px] items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-6 text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && (
              <SpinnerIcon />
            )}

            {uploadingImages
              ? "Uploading Images..."
              : saving
                ? "Updating..."
                : "Update Product"}
          </button>
        </div>
      </form>

      {/* =================================================
          PRODUCT INPUT STYLES
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
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  description,
}: {
  title: string;

  description?: string;
}) {
  return (
    <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required,
  badge,
  children,
}: {
  label: string;

  required?: boolean;

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
  options,
  placeholder = "Select",
  disabled = false,
}: {
  name: string;

  value: string;

  onChange: (
    event: ChangeEvent<HTMLSelectElement>
  ) => void;

  options: ReferenceOption[];

  placeholder?: string;

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
              {option.label}
            </option>
          )
        )}
      </select>

      <ChevronIcon />
    </div>
  );
}

/* =========================================================
   PRICE INPUT
========================================================= */

function PriceInput({
  name,
  value,
  onChange,
  disabled = false,
}: {
  name: string;

  value: string;

  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;

  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
        Rs
      </span>

      <input
        type="number"
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
        min="0"
        step="0.01"
        className="sth-product-input pl-9"
      />
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: ProductStatus;
}) {
  const style =
    status === "active"
      ? "bg-green-500/10 text-green-500"
      : status === "draft"
        ? "bg-amber-500/10 text-amber-500"
        : status === "inactive"
          ? "bg-gray-500/10 text-gray-500"
          : "bg-red-500/10 text-red-500";

  return (
    <span
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${style}`}
    >
      {getStatusLabel(
        status
      )}
    </span>
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