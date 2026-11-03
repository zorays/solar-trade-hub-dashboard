import { useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";
import {
  getOrderErrorMessage,
  type ManagedOrder,
} from "../../services/order/order.service";
const transitions: Record<string, string[]> = {
  pending_payment: ["cancelled"],
  confirmed: ["processing", "ready", "cancelled"],
  processing: ["ready", "shipped", "cancelled"],
  ready: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered"],
};
export default function OrderFulfilmentControls({
  order,
  onChanged,
}: {
  order: ManagedOrder;
  onChanged: (order: ManagedOrder) => void;
}) {
  const { user } = useAuth();
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  if (!hasUserPermission(user, "orders.manage")) return null;
  const allowed = (transitions[order.status] || []).filter((s) =>
    s === "cancelled"
      ? ["unpaid", "pending", "failed", "refunded"].includes(
          order.paymentStatus,
        )
      : order.paymentStatus === "paid",
  );
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="font-semibold dark:text-white">Fulfilment actions</h2>
      <p className="mt-2 text-sm text-gray-500">
        {allowed.length
          ? "Choose the next order status. Paid orders require a refund before cancellation."
          : "No further fulfilment transitions are currently allowed."}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {message}
        </p>
      )}
      {!!allowed.length && (
        <form
          className="mt-4 flex flex-wrap gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              !allowed.includes(target) ||
              !window.confirm(`Change order ${order.orderNumber} to ${target}?`)
            )
              return;
            setBusy(true);
            setError("");
            setMessage("");
            try {
              const r = await api.patch<{ data: { order: ManagedOrder } }>(
                `/orders/manage/${encodeURIComponent(order._id)}/status`,
                { status: target, note: note.trim() },
              );
              onChanged(r.data.data.order);
              setTarget("");
              setNote("");
              setMessage("Order status updated.");
            } catch (e) {
              setError(getOrderErrorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <select
            aria-label="Next order status"
            required
            disabled={busy}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm dark:border-gray-700 dark:text-white"
          >
            <option value="">Select next status</option>
            {allowed.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            aria-label="Fulfilment note"
            maxLength={2000}
            disabled={busy}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional fulfilment note"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm dark:border-gray-700 dark:text-white"
          />
          <button
            disabled={busy || !allowed.includes(target)}
            className="rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Update status"}
          </button>
        </form>
      )}
    </section>
  );
}
