import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import axios from "axios";
import {
  RefreshCw,
  Search,
  Eye,
  CreditCard,
  X,
  CheckCircle2,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";
import {
  getPayments,
  getPayment,
  managePayment,
  formatPaymentAmount,
  formatPaymentDate,
  getPaymentCustomerName,
  getPaymentSupplierName,
  PAYMENT_STATUS,
  PAYMENT_PURPOSE,
  type Payment,
  type PaymentPagination,
  type PaymentStatus,
  type PaymentPurpose,
  type PaymentAction,
  type PaymentFulfillmentStatus,
} from "../../services/payment/payment.service";
const field =
  "rounded-xl border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-purple-500 dark:border-gray-700 dark:text-gray-200";
const button =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200";
const pretty = (s: string) => s.replace(/_/g, " ");
const errorMessage = (e: unknown) =>
  axios.isAxiosError(e)
    ? e.response?.data?.message || e.message
    : e instanceof Error
      ? e.message
      : "Unable to complete payment request.";
export default function PaymentManagement({
  mode = "all",
}: {
  mode?: "all" | "pending" | "manual";
}) {
  const { user } = useAuth();
  const canManage = hasUserPermission(user, "payments.manage");
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "">(
    mode === "pending" ? "pending" : "",
  );
  const [purpose, setPurpose] = useState<PaymentPurpose | "">("");
  const [fulfillment, setFulfillment] = useState<PaymentFulfillmentStatus | "">(
    searchParams.get("fulfillmentStatus") === "failed" ? "failed" : "",
  );
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaymentPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Payment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef(0);
  const detailRequest = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++request.current;
    setLoading(true);
    setError("");
    try {
      const r = await getPayments({
        page,
        limit: 20,
        search: query || undefined,
        status: status || undefined,
        purpose: purpose || undefined,
        fulfillmentStatus: fulfillment || undefined,
        ...(mode === "manual"
          ? {
              provider: "manual" as const,
              verificationStatus: "pending" as const,
            }
          : {}),
      });
      if (sequence === request.current) {
        setRows(r.payments);
        setPagination(r.pagination);
      }
    } catch (e) {
      if (sequence === request.current) {
        setError(errorMessage(e));
        setRows([]);
      }
    } finally {
      if (sequence === request.current) setLoading(false);
    }
  }, [page, query, status, purpose, fulfillment, mode]);
  useEffect(() => {
    void load();
    const requestState = request;
    return () => {
      requestState.current++;
    };
  }, [load]);
  const close = () => {
    detailRequest.current++;
    setSelected(null);
    setNotice("");
    setReason("");
    setReference("");
  };
  async function open(p: Payment) {
    const sequence = ++detailRequest.current;
    setSelected(null);
    setDetailLoading(true);
    setNotice("");
    setError("");
    setReason("");
    setReference("");
    try {
      const result = await getPayment(p._id || p.id || "");
      if (sequence === detailRequest.current) {
        setSelected(result);
        setReference(result.providerSnapshot?.reference || "");
      }
    } catch (e) {
      if (sequence === detailRequest.current) setError(errorMessage(e));
    } finally {
      if (sequence === detailRequest.current) setDetailLoading(false);
    }
  }
  async function act(action: PaymentAction) {
    if (!selected || !canManage) return;
    if (
      action === "verify-paid" &&
      !window.confirm(
        `Confirm receipt of ${formatPaymentAmount(selected.amount, selected.currency)} for ${selected.paymentNumber}? This can activate an order, subscription or token credit.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const id = selected._id || selected.id || "";
      await managePayment(
        id,
        action,
        action === "failed"
          ? { failureMessage: reason.trim() }
          : {
              ...(reference.trim()
                ? { providerSnapshot: { reference: reference.trim() } }
                : {}),
            },
      );
      setSelected(await getPayment(id));
      setNotice("Payment updated successfully.");
      await load();
    } catch (e) {
      setError(errorMessage(e));
      try {
        setSelected(await getPayment(selected._id || selected.id || ""));
      } catch {
        /* Preserve detail if refresh is unavailable. */
      }
    } finally {
      setBusy(false);
    }
  }
  const title =
    mode === "manual"
      ? "Manual verification"
      : mode === "pending"
        ? "Pending payments"
        : "Payments";
  const terminal =
    selected &&
    ["paid", "failed", "cancelled", "partially_refunded", "refunded"].includes(
      selected.status,
    );
  return (
    <>
      <PageMeta
        title={`${title} | Solar Trade Hub`}
        description="Payment reconciliation and fulfilment management."
      />
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
              Finance workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Review payment records, confirm receipts and resolve fulfilment
              failures.
            </p>
          </div>
          <button
            className={button}
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-gradient-to-r from-purple-950 to-purple-800 p-6 text-white">
          <CreditCard size={28} className="shrink-0" />
          <div>
            <p className="text-sm text-purple-200">Matching payment records</p>
            <p className="mt-1 text-3xl font-semibold">
              {loading ? "…" : pagination.total.toLocaleString("en-PK")}
            </p>
          </div>
          <p className="w-full text-xs leading-5 text-purple-200 sm:ml-auto sm:max-w-xs sm:text-right">
            Verify the bank or provider receipt before confirming a payment.
          </p>
        </div>
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap gap-3 border-b border-gray-100 p-5 dark:border-gray-800">
            <form
              className="flex w-full min-w-0 gap-2 lg:flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setQuery(search.trim());
              }}
            >
              <input
                aria-label="Search payment number or merchant reference"
                className={`${field} min-w-0 flex-1`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Payment number or merchant reference"
              />
              <button aria-label="Search payments" className={button}>
                <Search size={17} />
              </button>
            </form>
            <select
              aria-label="Payment status"
              className={`${field} w-full sm:w-auto`}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as PaymentStatus | "");
                setPage(1);
              }}
            >
              <option value="">All payment statuses</option>
              {PAYMENT_STATUS.map((s) => (
                <option key={s} value={s}>
                  {pretty(s)}
                </option>
              ))}
            </select>
            <select
              aria-label="Payment purpose"
              className={`${field} w-full sm:w-auto`}
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value as PaymentPurpose | "");
                setPage(1);
              }}
            >
              <option value="">All purposes</option>
              {PAYMENT_PURPOSE.map((s) => (
                <option key={s} value={s}>
                  {pretty(s)}
                </option>
              ))}
            </select>
            <select
              aria-label="Fulfilment status"
              className={`${field} w-full sm:w-auto`}
              value={fulfillment}
              onChange={(e) => {
                setFulfillment(e.target.value as PaymentFulfillmentStatus | "");
                setPage(1);
              }}
            >
              <option value="">All fulfilment statuses</option>
              {["pending", "processing", "fulfilled", "failed"].map((s) => (
                <option key={s} value={s}>
                  {pretty(s)}
                </option>
              ))}
            </select>
          </div>
          {error && !selected && (
            <p role="alert" className="bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="divide-y divide-gray-100 dark:divide-gray-800 sm:hidden">
            {loading ? (
              <p className="p-6 text-sm text-gray-500">Loading payments…</p>
            ) : !rows.length ? (
              <p className="p-6 text-sm text-gray-500">No matching payments.</p>
            ) : (
              rows.map((p) => (
                <article key={p._id || p.id} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-sm dark:text-white">
                        {p.paymentNumber}
                      </strong>
                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {pretty(p.purpose)}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold dark:text-white">
                      {formatPaymentAmount(p.amount, p.currency)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {p.supplier
                      ? getPaymentSupplierName(p.supplier)
                      : getPaymentCustomerName(p.customer)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge value={p.status} />
                    <Badge value={p.fulfillmentStatus} />
                    <button
                      disabled={detailLoading}
                      onClick={() => void open(p)}
                      className={`${button} ml-auto`}
                    >
                      <Eye size={15} />
                      Review
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800">
                <tr>
                  {[
                    "Payment / purpose",
                    "Customer / supplier",
                    "Amount",
                    "Payment",
                    "Fulfilment",
                    "Created",
                    "",
                  ].map((h, i) => (
                    <th key={i} className="px-5 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      Loading payments…
                    </td>
                  </tr>
                ) : !rows.length ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-500">
                      No matching payments.
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr
                      key={p._id || p.id}
                      className="text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-5 py-4">
                        <strong className="text-gray-900 dark:text-white">
                          {p.paymentNumber}
                        </strong>
                        <p className="mt-1 text-xs capitalize text-gray-500">
                          {pretty(p.purpose)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {p.supplier
                          ? getPaymentSupplierName(p.supplier)
                          : getPaymentCustomerName(p.customer)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold">
                        {formatPaymentAmount(p.amount, p.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge value={p.status} />
                        <p className="mt-1 text-xs text-gray-500">
                          {p.verificationStatus}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge value={p.fulfillmentStatus} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs">
                        {formatPaymentDate(p.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          disabled={detailLoading}
                          onClick={() => void open(p)}
                          className={button}
                        >
                          <Eye size={15} />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between gap-3 border-t border-gray-100 p-5 dark:border-gray-800">
            <p className="text-sm text-gray-500">
              Page {page} of {Math.max(1, pagination.totalPages)}
            </p>
            <div className="flex gap-2">
              <button
                disabled={loading || page <= 1}
                className={button}
                onClick={() => setPage((v) => v - 1)}
              >
                Previous
              </button>
              <button
                disabled={loading || page >= pagination.totalPages}
                className={button}
                onClick={() => setPage((v) => v + 1)}
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      </div>
      <Modal
        showCloseButton={false}
        isOpen={!!selected || detailLoading}
        onClose={() => {
          if (!busy) close();
        }}
        className="m-4 max-w-2xl"
      >
        <div className="max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-orange-600">
                Payment review
              </p>
              <h2 className="mt-2 text-xl font-semibold dark:text-white">
                {selected?.paymentNumber || "Loading payment…"}
              </h2>
            </div>
            <button
              aria-label="Close payment review"
              disabled={busy}
              onClick={close}
              className="rounded-lg p-2 dark:text-white"
            >
              <X size={20} />
            </button>
          </div>
          {selected && (
            <>
              <div className="my-5 grid grid-cols-2 gap-4 text-sm">
                {[
                  [
                    "Amount",
                    formatPaymentAmount(selected.amount, selected.currency),
                  ],
                  ["Purpose", pretty(selected.purpose)],
                  ["Status", selected.status],
                  ["Verification", selected.verificationStatus],
                  ["Fulfilment", selected.fulfillmentStatus],
                  ["Method", pretty(selected.paymentMethod)],
                  ["Merchant reference", selected.merchantReference],
                  [
                    "Transaction reference",
                    selected.manualBankTransfer?.transactionReference ||
                      selected.providerSnapshot?.reference ||
                      "—",
                  ],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-500">{k}</p>
                    <p className="mt-1 break-words font-medium dark:text-white">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
              {notice && (
                <p
                  role="status"
                  className="my-3 flex gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700"
                >
                  <CheckCircle2 size={17} />
                  {notice}
                </p>
              )}
              {error && (
                <p
                  role="alert"
                  className="my-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}
              {canManage ? (
                <div className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                  <label className="block text-xs text-gray-500">
                    Bank or provider reference
                    <input
                      maxLength={300}
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className={`${field} mt-1 w-full`}
                    />
                  </label>
                  <label className="block text-xs text-gray-500">
                    Failure reason
                    <textarea
                      maxLength={1000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={`${field} mt-1 w-full`}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busy || !!terminal}
                      onClick={() => void act("processing")}
                      className={button}
                    >
                      Mark processing
                    </button>
                    <button
                      disabled={
                        busy || !!terminal || reference.trim().length < 3
                      }
                      onClick={() => void act("verify-paid")}
                      className={`${button} border-green-200 bg-green-700 !text-white`}
                    >
                      Verify paid
                    </button>
                    <button
                      disabled={busy || !!terminal || reason.trim().length < 3}
                      onClick={() => void act("failed")}
                      className={`${button} text-red-600`}
                    >
                      Mark failed
                    </button>
                    <button
                      disabled={
                        busy ||
                        selected.status !== "paid" ||
                        selected.verificationStatus !== "verified" ||
                        selected.fulfillmentStatus !== "failed"
                      }
                      onClick={() => void act("retry-fulfillment")}
                      className={button}
                    >
                      Retry fulfilment
                    </button>
                  </div>
                  <p className="text-xs leading-5 text-gray-500">
                    Verify paid requires a reference and confirmation. A paid
                    record with failed fulfilment should use Retry fulfilment.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Your account has read-only payment access.
                </p>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
function Badge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${["paid", "verified", "fulfilled"].includes(value) ? "bg-green-50 text-green-700" : "failed" === value ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}
    >
      {pretty(value)}
    </span>
  );
}
