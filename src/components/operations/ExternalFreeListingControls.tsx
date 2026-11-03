import { useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";
import { getProductErrorMessage } from "../../services/product/product.service";
export default function ExternalFreeListingControls({
  productId,
  onChanged,
}: {
  productId: string;
  onChanged: () => Promise<void>;
}) {
  const { user } = useAuth();
  const [supplier, setSupplier] = useState("");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  if (!hasUserPermission(user, "products.free_enable")) return null;
  async function act(revoke = false) {
    if (
      revoke &&
      !window.confirm(
        "Revoke FREE ENABLE for this supplier and catalogue product?",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        supplierId: supplier.trim(),
        reason: reason.trim(),
        ...(!revoke && days ? { durationDays: Number(days) } : {}),
      };
      const r = revoke
        ? await api.post<{ message: string }>(
            `/products/${encodeURIComponent(productId)}/free-enable/revoke`,
            payload,
          )
        : await api.post<{ message: string }>(
            `/products/${encodeURIComponent(productId)}/free-enable`,
            payload,
          );
      setNotice(r.data.message);
      await onChanged();
    } catch (e) {
      setError(getProductErrorMessage(e, "Unable to change FREE ENABLE."));
    } finally {
      setBusy(false);
    }
  }
  const field =
    "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm dark:border-gray-700 dark:text-white";
  return (
    <section className="space-y-4 rounded-2xl border border-orange-200 bg-white p-5 dark:border-orange-500/30 dark:bg-gray-900">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Catalogue offer FREE ENABLE
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Grant listing access for one supplier on this catalogue item. Supplier
          approval and verification remain required.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-green-700">
          {notice}
        </p>
      )}
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void act();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-gray-500">
            Supplier ID
            <input
              required
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="STH-S-0001 or supplier MongoDB ID"
              className={field}
            />
          </label>
          <label className="space-y-1 text-xs text-gray-500">
            Duration in days (blank = no end date)
            <input
              type="number"
              min={1}
              max={3660}
              step={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={field}
            />
          </label>
        </div>
        <label className="block space-y-1 text-xs text-gray-500">
          Reason
          <textarea
            required
            minLength={5}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={field}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy || !supplier.trim() || reason.trim().length < 5}
            className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Grant FREE ENABLE
          </button>
          <button
            type="button"
            disabled={busy || !supplier.trim() || reason.trim().length < 5}
            onClick={() => void act(true)}
            className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
          >
            Revoke grant
          </button>
        </div>
      </form>
    </section>
  );
}
