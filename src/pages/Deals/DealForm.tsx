import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import {
  toast,
  Toaster,
} from "sonner";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  createDeal,
  getDeal,
  getDealDateInputValue,
  getDealErrorMessage,
  getDealProductId,
  updateDeal,
  type DealCurrency,
  type DealDiscountType,
  type DealStatus,
} from "../../services/deal/deal.service";

import {
  getProducts,
  type Product,
} from "../../services/product/product.service";

type Mode =
  | "add"
  | "edit";

type FormState = {
  title: string;
  product: string;
  discountType: DealDiscountType;
  discountValue: string;
  originalPrice: string;
  currency: DealCurrency;
  startDate: string;
  endDate: string;
  status: DealStatus;
};

const EMPTY_FORM: FormState = {
  title: "",
  product: "",
  discountType: "percentage",
  discountValue: "",
  originalPrice: "",
  currency: "PKR",
  startDate: "",
  endDate: "",
  status: "draft",
};

const getBrandLabel = (
  product: Product
) => {
  if (!product.brand) return "";

  return typeof product.brand === "string"
    ? product.brand
    : product.brand.name || "";
};

const formatRate = (
  value?: number | null
) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "Rate unavailable";
  }

  return `Rs ${Number(value).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
};

export default function DealForm({
  mode,
}: {
  mode: Mode;
}) {
  const navigate = useNavigate();
  const params = useParams();

  const dealReference =
    params.id ||
    params.dealId ||
    "";

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [loading, setLoading] =
    useState(mode === "edit");

  const [saving, setSaving] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [productSearch, setProductSearch] =
    useState("");

  const [debouncedProductSearch, setDebouncedProductSearch] =
    useState("");

  const [products, setProducts] =
    useState<Product[]>([]);

  const [productsLoading, setProductsLoading] =
    useState(false);

  const [productsError, setProductsError] =
    useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedProductSearch(
        productSearch.trim()
      );
    }, 300);

    return () => window.clearTimeout(timer);
  }, [productSearch]);

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError("");

      const result = await getProducts({
        page: 1,
        limit: 20,
        search:
          debouncedProductSearch ||
          undefined,
        sortBy: "name",
        sortOrder: "asc",
      });

      setProducts(result.products);
    } catch (error) {
      setProducts([]);
      setProductsError(
        error instanceof Error
          ? error.message
          : "Unable to load external catalogue."
      );
    } finally {
      setProductsLoading(false);
    }
  }, [debouncedProductSearch]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (mode !== "edit") {
      return;
    }

    if (!dealReference) {
      setLoadError("Deal ID is missing.");
      setLoading(false);
      return;
    }

    let ignore = false;

    const loadDeal = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const deal = await getDeal(dealReference);

        if (ignore) return;

        const productReference =
          getDealProductId(deal.product);

        setForm({
          title: deal.title,
          product: productReference,
          discountType: deal.discountType,
          discountValue: String(deal.discountValue),
          originalPrice: String(deal.originalPrice),
          currency: deal.currency,
          startDate: getDealDateInputValue(deal.startDate),
          endDate: getDealDateInputValue(deal.endDate),
          status: deal.status,
        });

        if (productReference) {
          const match = products.find(
            (product) =>
              product.externalProductId === productReference ||
              product.id === productReference ||
              product._id === productReference
          );

          if (match) {
            setSelectedProduct(match);
          }
        }
      } catch (error) {
        if (ignore) return;

        setLoadError(
          getDealErrorMessage(
            error,
            "Unable to load deal."
          )
        );
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadDeal();

    return () => {
      ignore = true;
    };
  }, [
    dealReference,
    mode,
  ]);

  useEffect(() => {
    if (
      mode !== "edit" ||
      selectedProduct ||
      !form.product ||
      products.length === 0
    ) {
      return;
    }

    const match = products.find(
      (product) =>
        product.externalProductId === form.product ||
        product.id === form.product ||
        product._id === form.product
    );

    if (match) {
      setSelectedProduct(match);
    }
  }, [
    form.product,
    mode,
    products,
    selectedProduct,
  ]);

  const calculatedDealPrice = useMemo(() => {
    const originalPrice = Number(form.originalPrice);
    const discountValue = Number(form.discountValue);

    if (!Number.isFinite(originalPrice)) {
      return null;
    }

    if (!Number.isFinite(discountValue)) {
      return originalPrice;
    }

    if (form.discountType === "percentage") {
      return Math.max(
        0,
        originalPrice -
          originalPrice *
            (discountValue / 100)
      );
    }

    return Math.max(
      0,
      originalPrice - discountValue
    );
  }, [
    form.discountType,
    form.discountValue,
    form.originalPrice,
  ]);

  const selectProduct = (
    product: Product
  ) => {
    const reference =
      product.externalProductId ||
      product.id ||
      product._id;

    setSelectedProduct(product);

    setForm((current) => ({
      ...current,
      product: reference,
      originalPrice:
        product.rate !== null &&
        product.rate !== undefined
          ? String(product.rate)
          : current.originalPrice,
      currency: "PKR",
    }));
  };

  const submit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    const title = form.title.trim();
    const product = form.product.trim();
    const originalPrice = Number(form.originalPrice);
    const discountValue = Number(form.discountValue);

    if (!title) {
      toast.error("Deal title is required.");
      return;
    }

    if (!product) {
      toast.error("Select an external catalogue product.");
      return;
    }

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      toast.error("A valid original price is required.");
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue < 0) {
      toast.error("A valid discount value is required.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      toast.error("Start and end dates are required.");
      return;
    }

    if (
      new Date(form.endDate).getTime() <=
      new Date(form.startDate).getTime()
    ) {
      toast.error("End date must be after start date.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title,
        product,
        discountType: form.discountType,
        discountValue,
        originalPrice,
        currency: form.currency,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      };

      const saved =
        mode === "edit"
          ? await updateDeal(
              dealReference,
              payload
            )
          : await createDeal(payload);

      toast.success(
        mode === "edit"
          ? "Deal updated successfully."
          : "Deal created successfully."
      );

      navigate(
        `/deals/${encodeURIComponent(
          saved.dealId || saved.id || saved._id
        )}`,
        {
          replace: mode === "edit",
        }
      );
    } catch (error) {
      toast.error(
        getDealErrorMessage(
          error,
          mode === "edit"
            ? "Unable to update deal."
            : "Unable to create deal."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <RefreshCw className="h-5 w-5 animate-spin" />
        Loading deal...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
        <p className="font-medium">{loadError}</p>
        <Link
          to="/deals"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${
          mode === "edit"
            ? "Edit Deal"
            : "Add Deal"
        } | Solar Trade Hub`}
        description="Manage Solar Trade Hub marketplace deals using the external Rate List catalogue."
      />

      <PageBreadcrumb
        pageTitle={
          mode === "edit"
            ? "Edit Deal"
            : "Add Deal"
        }
      />

      <Toaster
        position="top-right"
        richColors
      />

      <form
        onSubmit={submit}
        className="space-y-6"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {mode === "edit"
                  ? "Edit Deal"
                  : "Create Deal"}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Products and live rates come from the external Rate List catalogue.
              </p>
            </div>

            <Link
              to="/deals"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Deal Details
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Title" className="sm:col-span-2">
                  <input
                    value={form.title}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }));
                    }}
                    placeholder="e.g. October Solar Special"
                    className="input"
                  />
                </Field>

                <Field label="Discount Type">
                  <select
                    value={form.discountType}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        discountType:
                          event.target.value as DealDiscountType,
                      }));
                    }}
                    className="input"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </Field>

                <Field
                  label={
                    form.discountType === "percentage"
                      ? "Discount %"
                      : "Discount Amount"
                  }
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discountValue}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        discountValue: event.target.value,
                      }));
                    }}
                    className="input"
                  />
                </Field>

                <Field label="Original Price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        originalPrice: event.target.value,
                      }));
                    }}
                    className="input"
                  />
                </Field>

                <Field label="Currency">
                  <select
                    value={form.currency}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        currency:
                          event.target.value as DealCurrency,
                      }));
                    }}
                    className="input"
                  >
                    <option value="PKR">PKR</option>
                    <option value="USD">USD</option>
                  </select>
                </Field>

                <Field label="Start Date">
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }));
                    }}
                    className="input"
                  />
                </Field>

                <Field label="End Date">
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }));
                    }}
                    className="input"
                  />
                </Field>

                <Field label="Status" className="sm:col-span-2">
                  <select
                    value={form.status}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        status:
                          event.target.value as DealStatus,
                      }));
                    }}
                    className="input"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                  </select>
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                External Catalogue Product
              </h2>

              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={productSearch}
                  onChange={(event) => {
                    setProductSearch(event.target.value);
                  }}
                  placeholder="Search product, SKU, brand or external ID..."
                  className="input pl-10"
                />
              </div>

              {productsError ? (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {productsError}
                </p>
              ) : productsLoading ? (
                <div className="mt-5 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading catalogue...
                </div>
              ) : (
                <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {products.map((product) => {
                    const reference =
                      product.externalProductId ||
                      product.id ||
                      product._id;

                    const active =
                      form.product === reference;

                    return (
                      <button
                        key={reference}
                        type="button"
                        onClick={() => selectProduct(product)}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl border p-3 text-left transition ${
                          active
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10"
                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {product.name || reference}
                          </p>
                          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                            {[
                              product.sku,
                              getBrandLabel(product),
                              reference,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {formatRate(product.rate)}
                          </span>
                          {active && (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-white">
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {products.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No external catalogue products found.
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Deal Preview
              </h2>

              <dl className="mt-5 space-y-4 text-sm">
                <PreviewRow
                  label="Product"
                  value={
                    selectedProduct?.name ||
                    form.product ||
                    "Not selected"
                  }
                />
                <PreviewRow
                  label="External ID"
                  value={form.product || "—"}
                />
                <PreviewRow
                  label="Original Price"
                  value={
                    form.originalPrice
                      ? `${form.currency} ${Number(
                          form.originalPrice
                        ).toLocaleString("en-PK", {
                          maximumFractionDigits: 2,
                        })}`
                      : "—"
                  }
                />
                <PreviewRow
                  label="Calculated Deal Price"
                  value={
                    calculatedDealPrice !== null
                      ? `${form.currency} ${calculatedDealPrice.toLocaleString(
                          "en-PK",
                          {
                            maximumFractionDigits: 2,
                          }
                        )}`
                      : "—"
                  }
                />
              </dl>

              <p className="mt-5 rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
                Product master data is not duplicated in Solar Trade Hub. The external catalogue remains authoritative; the backend validates and stores the Deal relation/snapshot.
              </p>
            </section>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}
              {mode === "edit"
                ? "Save Deal"
                : "Create Deal"}
            </button>
          </aside>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          border: 1px solid rgb(229 231 235);
          background: transparent;
          padding: 0 12px;
          font-size: 14px;
          color: rgb(31 41 55);
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .input:focus {
          border-color: rgb(147 51 234);
          box-shadow: 0 0 0 3px rgb(147 51 234 / .08);
        }
        .dark .input {
          border-color: rgb(55 65 81);
          color: rgb(229 231 235);
          background: rgb(3 7 18 / .2);
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 dark:border-gray-800">
      <dt className="text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="max-w-[65%] break-words text-right font-medium text-gray-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
