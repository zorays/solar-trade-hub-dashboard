import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";
import {
  getListingEntitlement,
  mapSupplierProduct,
  grantProductFreeListing,
  revokeProductFreeListing,
  supplierProductErrorMessage,
  type SupplierProduct,
  type ListingEntitlement,
  type MappingPayload,
} from "../../services/supplier/supplierProduct.service";
const input =
  "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm dark:border-gray-700 dark:text-white";
export default function ProductPublishingControls({
  product,
  onChanged,
}: {
  product: SupplierProduct;
  onChanged: (product: SupplierProduct) => void | Promise<void>;
}) {
  const { user } = useAuth();
  const canManage = hasUserPermission(user, "products.manage");
  const canFree = hasUserPermission(user, "products.free_enable");
  const [entitlement, setEntitlement] = useState<ListingEntitlement | null>(
    null,
  );
  const [externalId, setExternalId] = useState(
    product.catalogue?.externalProductId || "",
  );
  const [mappingType, setMappingType] = useState<"material" | "service">(
    product.catalogue?.type === "service" ? "service" : "material",
  );
  const [decision, setDecision] = useState<MappingPayload["decision"]>("map");
  const [mappingNotes, setMappingNotes] = useState("");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("30");
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setEntitlement(null);
    getListingEntitlement(product._id, controller.signal)
      .then(setEntitlement)
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(supplierProductErrorMessage(e));
      });
    return () => controller.abort();
  }, [product._id, product.updatedAt, revision]);
  async function act(
    operation: () => Promise<{ product: SupplierProduct; message: string }>,
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await operation();
      setMessage(result.message);
      await onChanged(result.product);
      setRevision((n) => n + 1);
    } catch (e) {
      setError(supplierProductErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-5 space-y-5 border-t border-gray-200 pt-5 dark:border-gray-700">
      <div>
        <h3 className="flex items-center gap-2 font-semibold dark:text-white">
          <ShieldCheck size={18} className="text-purple-600" />
          Publication readiness
        </h3>
        {entitlement ? (
          <>
            <p
              className={`mt-2 text-sm ${entitlement.publiclyVisible ? "text-green-700" : "text-gray-500"}`}
            >
              {entitlement.publiclyVisible
                ? "Visible in the public marketplace"
                : "Not currently public"}{" "}
              ·{" "}
              {entitlement.entitlement.source?.replace(/_/g, " ") ||
                entitlement.entitlement.reason?.replace(/_/g, " ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(entitlement.checks).map(([key, pass]) => (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${pass ? "bg-green-50 text-green-700 dark:bg-green-500/10" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}
                >
                  {pass ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <CircleAlert size={12} />
                  )}{" "}
                  {key.replace(/([A-Z])/g, " $1")}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            Checking current listing eligibility…
          </p>
        )}
      </div>
      {message && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {canManage && product.status !== "archived" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act(async () => ({
              product: await mapSupplierProduct(product._id, {
                decision,
                ...(externalId.trim()
                  ? { externalProductId: externalId.trim() }
                  : {}),
                type: mappingType,
                notes: mappingNotes.trim(),
              }),
              message:
                "Catalogue mapping saved. Recheck readiness before publishing.",
            }));
          }}
          className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
        >
          <h4 className="text-sm font-semibold dark:text-white">
            Catalogue mapping
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-gray-500">
              Review decision
              <select
                value={decision}
                onChange={(e) =>
                  setDecision(e.target.value as MappingPayload["decision"])
                }
                className={input}
              >
                <option value="map">Approve mapping</option>
                <option value="requires_review">Requires review</option>
                <option value="reject">Reject mapping</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-gray-500">
              Product type
              <select
                value={mappingType}
                onChange={(e) =>
                  setMappingType(e.target.value as "material" | "service")
                }
                className={input}
              >
                <option value="material">Material</option>
                <option value="service">Service</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-xs text-gray-500">
            Master catalogue product ID
            <input
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              maxLength={150}
              placeholder="Required for master catalogue items"
              className={input}
            />
          </label>
          <label className="block space-y-1 text-xs text-gray-500">
            Mapping notes
            <textarea
              value={mappingNotes}
              onChange={(e) => setMappingNotes(e.target.value)}
              required={decision === "reject"}
              minLength={decision === "reject" ? 3 : undefined}
              maxLength={2000}
              className={input}
            />
          </label>
          <button
            disabled={busy}
            className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save mapping
          </button>
        </form>
      )}
      {canFree && product.status !== "archived" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act(async () => {
              const r = await grantProductFreeListing(product._id, {
                reason: reason.trim(),
                ...(days ? { durationDays: Number(days) } : {}),
                publish,
              });
              return {
                product: r.product,
                message: r.published
                  ? "FREE ENABLE granted and product published."
                  : `FREE ENABLE granted. ${r.publicationError?.message || "Use Enable Listing when all publication checks pass."}`,
              };
            });
          }}
          className="space-y-3 rounded-xl border border-orange-200 p-4 dark:border-orange-500/30"
        >
          <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400">
            Admin FREE ENABLE
          </h4>
          <p className="text-xs leading-5 text-gray-500">
            Grant listing access to this product without a paid plan. Approval,
            mapping, supplier verification and stock checks still apply.
          </p>
          <label className="block space-y-1 text-xs text-gray-500">
            Grant or revocation reason
            <textarea
              required
              minLength={5}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={input}
            />
          </label>
          <label className="block space-y-1 text-xs text-gray-500">
            Duration in days (leave blank for no end date)
            <input
              type="number"
              min={1}
              max={3650}
              step={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={input}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />
            Also attempt publication now
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy || reason.trim().length < 5}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Grant FREE ENABLE
            </button>
            <button
              type="button"
              disabled={
                busy || !product.freeListing?.active || reason.trim().length < 5
              }
              onClick={() => {
                if (
                  window.confirm(
                    "Revoke this product’s FREE ENABLE grant? It will be hidden if no paid listing entitlement applies.",
                  )
                )
                  void act(async () => {
                    const r = await revokeProductFreeListing(
                      product._id,
                      reason.trim(),
                    );
                    return {
                      product: r.product,
                      message: r.unpublished
                        ? "Grant revoked; product unpublished."
                        : "Grant revoked.",
                    };
                  });
              }}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 disabled:opacity-50"
            >
              Revoke grant
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
