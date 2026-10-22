
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Warehouse,
  X,
} from "lucide-react";

import { toast, Toaster } from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";

import {
  listSupplierProducts,
  getSupplierProduct,
  approveSupplierProduct,
  rejectSupplierProduct,
  verifySupplierStock,
  changeSupplierListing,
  archiveSupplierProduct,
  supplierProductErrorMessage,
  type SupplierProduct,
  type StockVerificationStatus,
} from "../../services/supplier/supplierProduct.service";

/* =========================================================
   SOLAR TRADE HUB — SUPPLIER PRODUCT MANAGEMENT

   Supports:
   - Supplier Products
   - Product Approvals
   - Supplier Stock
   - Product search and filters
   - Catalogue mapping
   - Stock evidence review
   - Stock verification
   - Marketplace listing controls
   - Product archival

   TypeScript compatibility:
   ES2020-compatible string.replace() is used
   instead of String.replaceAll().
========================================================= */

type Mode =
  | "products"
  | "approvals"
  | "stock";

const pageLabel: Record<Mode, string> = {
  products: "Supplier Products",
  approvals: "Product Approvals",
  stock: "Supplier Stock",
};

const number = (value: unknown): string =>
  Number(value ?? 0).toLocaleString("en-PK");

const supplierName = (
  product: SupplierProduct
): string => {
  if (
    typeof product.supplier === "object" &&
    product.supplier !== null
  ) {
    return (
      product.supplier.companyName ||
      product.supplier.supplierId ||
      "Unknown supplier"
    );
  }

  return "Unknown supplier";
};

const date = (value?: string): string => {
  if (!value) return "—";

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-PK");
};

/* =========================================================
   FORMAT ENUM VALUES

   FIX:
   replaceAll("_", " ") caused TS2550.

   Global regex works with older TypeScript targets
   while preserving the exact same formatting.
========================================================= */

const formatEnum = (value?: string): string =>
  (value || "unknown").replace(/_/g, " ");

const pill = (text?: string) => (
  <span className="inline-block rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold capitalize text-gray-700 dark:border-gray-700 dark:text-gray-300">
    {formatEnum(text)}
  </span>
);

/* =========================================================
   STYLES
========================================================= */

const selectClass =
  "rounded-lg border border-gray-200 bg-white px-3 py-2.5 " +
  "text-sm text-gray-700 outline-none " +
  "dark:border-gray-700 dark:bg-gray-950 dark:text-white";

const actionButtonClass =
  "inline-flex items-center gap-2 rounded-lg px-4 py-2 " +
  "text-sm font-semibold disabled:cursor-not-allowed " +
  "disabled:opacity-50";

/* =========================================================
   COMPONENT
========================================================= */

export default function SupplierProductManagement({
  mode = "products",
}: {
  mode?: Mode;
}) {
  const { user } = useAuth();

  const canManage = hasUserPermission(
    user,
    "products.manage"
  );

  /* =======================================================
     STATE
  ======================================================= */

  const [items, setItems] = useState<
    SupplierProduct[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState("");
  const [mapping, setMapping] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const [selected, setSelected] = useState<
    SupplierProduct | null
  >(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [busy, setBusy] = useState(false);

  const [notes, setNotes] = useState("");

  const [verifiedQuantity, setVerifiedQuantity] =
    useState("");

  const [stockDecision, setStockDecision] =
    useState<StockVerificationStatus>(
      "verified"
    );

  /* =======================================================
     SERVER FILTERS
  ======================================================= */

  const filters = useMemo(
    () => ({
      page,
      limit: 20,

      search: search.trim() || undefined,
      brand: brand.trim() || undefined,

      type: type || undefined,
      source: source || undefined,

      mappingStatus:
        mapping || undefined,

      ...(mode === "approvals" && !status
        ? { status: "pending_review" }
        : {}),

      ...(status
        ? mode === "stock"
          ? { verificationStatus: status }
          : { status }
        : {}),
    }),
    [
      page,
      search,
      status,
      mode,
      source,
      brand,
      type,
      mapping,
    ]
  );

  /* =======================================================
     FETCH SUPPLIER PRODUCTS
  ======================================================= */

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data =
        await listSupplierProducts(filters);

      setItems(data.products);
      setTotal(data.pagination.total);
      setPages(data.pagination.totalPages);
    } catch (requestError) {
      setError(
        supplierProductErrorMessage(
          requestError
        )
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /* =======================================================
     RESET FILTERS WHEN PAGE MODE CHANGES
  ======================================================= */

  useEffect(() => {
    setPage(1);
    setStatus("");
    setSearch("");
    setSource("");
    setBrand("");
    setType("");
    setMapping("");
    setSelected(null);
  }, [mode]);

  /* =======================================================
     OPEN PRODUCT DETAILS
  ======================================================= */

  const open = async (
    product: SupplierProduct
  ) => {
    setSelected(product);

    setNotes("");
    setStockDecision("verified");

    setVerifiedQuantity(
      String(
        product.stockVerification
          ?.verifiedQuantity ||
          product.stockQuantity ||
          ""
      )
    );

    setDetailLoading(true);

    try {
      const details =
        await getSupplierProduct(product._id);

      setSelected(details);
    } catch (requestError) {
      toast.error(
        supplierProductErrorMessage(
          requestError
        )
      );
    } finally {
      setDetailLoading(false);
    }
  };

  /* =======================================================
     EXECUTE ADMIN OPERATION
  ======================================================= */

  const run = async (
    operation: () => Promise<SupplierProduct>,
    successMessage: string
  ) => {
    setBusy(true);

    try {
      const updated = await operation();

      setSelected(updated);

      toast.success(successMessage);

      await refresh();
    } catch (requestError) {
      toast.error(
        supplierProductErrorMessage(
          requestError
        )
      );
    } finally {
      setBusy(false);
    }
  };

  /* =======================================================
     STATUS FILTER VALUES
  ======================================================= */

  const statusValues =
    mode === "stock"
      ? [
          "",
          "pending",
          "evidence_required",
          "verified",
          "rejected",
        ]
      : [
          "",
          "draft",
          "pending_review",
          "approved",
          "rejected",
          "archived",
        ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <PageMeta
        title={`${pageLabel[mode]} | Solar Trade Hub`}
        description={`Manage ${pageLabel[
          mode
        ].toLowerCase()} with real backend data`}
      />

      <PageBreadcrumb
        pageTitle={pageLabel[mode]}
      />

      <Toaster
        richColors
        position="top-right"
      />

      <div className="space-y-5 pb-10">
        {/* HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {pageLabel[mode]}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Real supplier-owned inventory · independent
              of the external master catalogue
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:text-white"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* NAVIGATION */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              [
                "Supplier Products",
                "/products/supplier-products",
                Package,
              ],
              [
                "Product Approvals",
                "/products/approvals",
                ShieldCheck,
              ],
              [
                "Supplier Stock",
                "/suppliers/stock",
                Warehouse,
              ],
            ] as const
          ).map(([label, to, Icon]) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold ${
                pageLabel[mode] === label
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              }`}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </div>

        {/* FILTERS */}

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-3">
            {/* SEARCH */}

            <div className="relative min-w-[220px] flex-1">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                aria-label="Search products"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name, SKU, brand, model"
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>

            {/* STATUS */}

            <select
              aria-label="Filter status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              {statusValues.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value
                    ? formatEnum(value)
                    : mode === "approvals"
                      ? "Pending review (default)"
                      : "All statuses"}
                </option>
              ))}
            </select>

            {/* SOURCE */}

            <select
              aria-label="Product source"
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">
                All sources
              </option>
              <option value="master_catalogue">
                Master catalogue
              </option>
              <option value="custom_proposal">
                Other category proposals
              </option>
            </select>

            {/* PRODUCT TYPE */}

            <select
              aria-label="Material or service"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">
                All types
              </option>
              <option value="material">
                Material
              </option>
              <option value="service">
                Service
              </option>
            </select>

            {/* MAPPING */}

            <select
              aria-label="Catalogue mapping status"
              value={mapping}
              onChange={(event) => {
                setMapping(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">
                All mappings
              </option>
              <option value="pending">
                Pending mapping
              </option>
              <option value="requires_review">
                Requires mapping review
              </option>
              <option value="mapped">
                Mapped
              </option>
              <option value="rejected">
                Mapping rejected
              </option>
            </select>

            {/* BRAND */}

            <input
              aria-label="Filter by brand"
              value={brand}
              onChange={(event) => {
                setBrand(event.target.value);
                setPage(1);
              }}
              placeholder="Brand"
              className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />

            <span className="text-xs text-gray-500">
              {number(total)} records
            </span>
          </div>

          {/* API ERROR */}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* TABLE */}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800">
                  {[
                    "Product / SKU",
                    "Supplier",
                    "Category / Type",
                    "Brand",
                    "Declared",
                    "Verified",
                    "Status",
                    "Marketplace",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-3 py-3"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      Loading supplier products...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No products match the selected
                      filters.
                    </td>
                  </tr>
                ) : (
                  items.map((product) => (
                    <tr
                      key={product._id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-3 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {product.name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {product.sku}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        {supplierName(product)}
                      </td>

                      <td className="px-3 py-3">
                        {product.category}

                        <div className="text-xs text-gray-500">
                          {product.catalogue?.type ||
                            product.proposal
                              ?.proposedType ||
                            "—"}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        {product.brand ||
                          product.proposal
                            ?.proposedBrand ||
                          "—"}
                      </td>

                      <td className="px-3 py-3">
                        {number(
                          product.stockQuantity
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {number(
                          product.stockVerification
                            ?.verifiedQuantity
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {pill(
                          mode === "stock"
                            ? product
                                .stockVerification
                                ?.status
                            : product.status
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {product.enabled
                          ? pill("Enabled")
                          : pill("Private")}
                      </td>

                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            void open(product)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-purple-200 px-3 py-2 font-semibold text-purple-700 hover:bg-purple-50"
                        >
                          <Eye size={14} />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>
              Page {page} of {Math.max(pages, 1)}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  page <= 1 || loading
                }
                onClick={() =>
                  setPage(
                    (previous) => previous - 1
                  )
                }
                className="rounded-lg border px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  page >= pages || loading
                }
                onClick={() =>
                  setPage(
                    (previous) => previous + 1
                  )
                }
                className="rounded-lg border px-3 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT DETAILS MODAL */}

      {selected && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-950/60 p-3"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !busy
            ) {
              setSelected(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Supplier product details"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:p-7"
          >
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selected.name}
                </h2>

                <p className="text-sm text-gray-500">
                  {selected.sku} ·{" "}
                  {supplierName(selected)}
                </p>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setSelected(null)
                }
                aria-label="Close details"
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <p className="py-8 text-gray-500">
                Loading details...
              </p>
            ) : (
              <>
                {/* PRODUCT METADATA */}

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  {(
                    [
                      [
                        "Status",
                        selected.status,
                      ],
                      [
                        "Category",
                        selected.category,
                      ],
                      [
                        "Brand",
                        selected.brand ||
                          selected.proposal
                            ?.proposedBrand ||
                          "—",
                      ],
                      [
                        "Type",
                        selected.catalogue?.type ||
                          selected.proposal
                            ?.proposedType ||
                          "—",
                      ],
                      [
                        "Mapping",
                        selected.catalogue
                          ?.mappingStatus ||
                          "Unmapped",
                      ],
                      [
                        "Stock verification",
                        selected.stockVerification
                          ?.status || "pending",
                      ],
                      [
                        "Declared stock",
                        number(
                          selected.stockQuantity
                        ),
                      ],
                      [
                        "Verified stock",
                        number(
                          selected.stockVerification
                            ?.verifiedQuantity
                        ),
                      ],
                      [
                        "Price",
                        `${selected.currency || "PKR"} ${number(
                          selected.price
                        )}`,
                      ],
                      [
                        "Warehouse",
                        selected.warehouse?.city ||
                          "—",
                      ],
                      [
                        "Created",
                        date(
                          selected.createdAt
                        ),
                      ],
                      [
                        "Marketplace",
                        selected.enabled
                          ? "Enabled"
                          : "Private",
                      ],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                    >
                      <div className="mb-1 text-xs text-gray-500">
                        {label}
                      </div>

                      <div className="font-semibold capitalize text-gray-900 dark:text-white">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CUSTOM CATEGORY PROPOSAL */}

                {selected.catalogue?.source ===
                  "custom_proposal" && (
                  <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
                    <strong>
                      Other Category proposal
                    </strong>

                    <p className="mt-1">
                      Category:{" "}
                      {selected.proposal
                        ?.proposedCategory ||
                        "—"}{" "}
                      · Brand:{" "}
                      {selected.proposal
                        ?.proposedBrand ||
                        "—"}{" "}
                      · Type:{" "}
                      {selected.proposal
                        ?.proposedType ||
                        "—"}
                    </p>

                    <p className="mt-1">
                      This proposal cannot modify
                      master catalogue taxonomy
                      automatically.
                    </p>
                  </div>
                )}

                {/* WAREHOUSE + NOTES */}

                <div className="mt-4 grid gap-3 rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-700 sm:grid-cols-2">
                  <div>
                    <strong className="dark:text-white">
                      Supplier warehouse
                    </strong>

                    <p className="mt-1 text-gray-500">
                      {[
                        selected.warehouse?.name,
                        selected.warehouse?.address,
                        selected.warehouse?.city,
                      ]
                        .filter(Boolean)
                        .join(", ") ||
                        "Not supplied"}
                    </p>
                  </div>

                  <div>
                    <strong className="dark:text-white">
                      Verification notes
                    </strong>

                    <p className="mt-1 text-gray-500">
                      {selected.stockVerification
                        ?.notes ||
                        "No stock review notes yet"}
                    </p>
                  </div>
                </div>

                {/* PREVIOUS APPROVAL NOTES */}

                {selected.approvalNotes && (
                  <div className="mt-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
                    Previous review:{" "}
                    {selected.approvalNotes}
                  </div>
                )}

                {/* REVIEW NOTES */}

                <div className="mt-4">
                  <label className="mb-1 block text-sm font-semibold dark:text-white">
                    Review notes
                  </label>

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    maxLength={2000}
                    rows={3}
                    placeholder="Add verification details or rejection reason"
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  />
                </div>

                {/* STOCK EVIDENCE */}

                {Array.isArray(
                  selected.stockVerification
                    ?.evidence
                ) &&
                  selected.stockVerification!
                    .evidence!.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold dark:text-white">
                        Submitted stock evidence
                      </h3>

                      <div className="mt-2 space-y-1">
                        {selected.stockVerification!
                          .evidence!.map(
                            (file, index) => (
                              <div
                                key={index}
                                className="rounded-lg bg-gray-50 p-2 text-xs dark:bg-gray-800"
                              >
                                {file.kind}: Evidence file
                                recorded — inspect
                                through authorized
                                storage before
                                approving.
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  )}

                {/* ADMIN OPERATIONS */}

                {canManage && (
                  <div className="mt-5 space-y-4 border-t pt-5 dark:border-gray-700">
                    {/* APPROVAL */}

                    {selected.status ===
                      "pending_review" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void run(
                              () =>
                                approveSupplierProduct(
                                  selected._id,
                                  notes
                                ),
                              "Product approved; still private"
                            )
                          }
                          className={`${actionButtonClass} bg-green-700 text-white`}
                        >
                          <CheckCircle2
                            size={16}
                          />
                          Approve Product
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy ||
                            !notes.trim()
                          }
                          onClick={() =>
                            void run(
                              () =>
                                rejectSupplierProduct(
                                  selected._id,
                                  notes
                                ),
                              "Product rejected"
                            )
                          }
                          className={`${actionButtonClass} bg-red-700 text-white`}
                        >
                          Reject Product
                        </button>
                      </div>
                    )}

                    {/* STOCK VERIFICATION */}

                    {selected.status !==
                      "archived" && (
                      <div>
                        <div className="mb-2 text-sm font-semibold dark:text-white">
                          Stock verification
                          (admin only)
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={stockDecision}
                            onChange={(event) =>
                              setStockDecision(
                                event.target
                                  .value as StockVerificationStatus
                              )
                            }
                            className={selectClass}
                          >
                            {[
                              "verified",
                              "pending",
                              "evidence_required",
                              "rejected",
                            ].map(
                              (value) => (
                                <option
                                  key={value}
                                  value={value}
                                >
                                  {formatEnum(
                                    value
                                  )}
                                </option>
                              )
                            )}
                          </select>

                          <input
                            type="number"
                            min={0}
                            max={
                              selected.stockQuantity
                            }
                            value={
                              verifiedQuantity
                            }
                            onChange={(event) =>
                              setVerifiedQuantity(
                                event.target.value
                              )
                            }
                            aria-label="Verified stock quantity"
                            className="w-28 rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                          />

                          <button
                            type="button"
                            disabled={
                              busy ||
                              (stockDecision ===
                                "verified" &&
                                (!Number.isSafeInteger(
                                  Number(
                                    verifiedQuantity
                                  )
                                ) ||
                                  Number(
                                    verifiedQuantity
                                  ) < 1 ||
                                  Number(
                                    verifiedQuantity
                                  ) >
                                    selected.stockQuantity ||
                                  selected.stockStatus !==
                                    "in_stock"))
                            }
                            onClick={() =>
                              void run(
                                () =>
                                  verifySupplierStock(
                                    selected._id,
                                    {
                                      status:
                                        stockDecision,

                                      ...(stockDecision ===
                                      "verified"
                                        ? {
                                            verifiedQuantity:
                                              Number(
                                                verifiedQuantity
                                              ),
                                          }
                                        : {}),

                                      notes,
                                    }
                                  ),
                                "Stock review saved"
                              )
                            }
                            className={`${actionButtonClass} bg-purple-700 text-white`}
                          >
                            Save Stock Review
                          </button>
                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          Stock evidence must be
                          checked independently
                          before marking verified.
                        </p>
                      </div>
                    )}

                    {/* MARKETPLACE LISTING */}

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={
                          busy ||
                          selected.enabled ||
                          selected.status !==
                            "approved" ||
                          selected.catalogue
                            ?.mappingStatus !==
                            "mapped" ||
                          selected.stockVerification
                            ?.status !==
                            "verified" ||
                          selected.stockStatus !==
                            "in_stock"
                        }
                        onClick={() => {
                          if (
                            window.confirm(
                              "Publish this verified supplier product to the marketplace?"
                            )
                          ) {
                            void run(
                              () =>
                                changeSupplierListing(
                                  selected._id,
                                  true
                                ),
                              "Marketplace listing enabled"
                            );
                          }
                        }}
                        className={`${actionButtonClass} border border-green-300 text-green-700`}
                      >
                        Enable Listing
                      </button>

                      <button
                        type="button"
                        disabled={
                          busy ||
                          !selected.enabled
                        }
                        onClick={() =>
                          void run(
                            () =>
                              changeSupplierListing(
                                selected._id,
                                false
                              ),
                            "Listing disabled"
                          )
                        }
                        className={`${actionButtonClass} border border-orange-300 text-orange-700`}
                      >
                        Disable Listing
                      </button>

                      <button
                        type="button"
                        disabled={
                          busy ||
                          selected.status ===
                            "archived"
                        }
                        onClick={() => {
                          if (
                            window.confirm(
                              "Archive this supplier product?"
                            )
                          ) {
                            void run(
                              () =>
                                archiveSupplierProduct(
                                  selected._id
                                ),
                              "Product archived"
                            );
                          }
                        }}
                        className={`${actionButtonClass} border border-red-200 text-red-700`}
                      >
                        Archive
                      </button>
                    </div>

                    <p className="flex items-start gap-2 text-xs text-gray-500">
                      <AlertTriangle
                        size={16}
                        className="shrink-0"
                      />

                      Public Enable is controlled
                      by backend supplier
                      verification, catalogue
                      mapping, verified stock
                      and subscription entitlement.
                      Until integration is
                      complete, backend correctly
                      rejects enablement.
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
