import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, RefreshCw, Layers, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";
import {
  getOperationsReport,
  type OperationsReport,
} from "../../services/operations.service";
export default function OperationsOverview() {
  const { user } = useAuth();
  const allowed =
    hasUserPermission(user, "reports.view") ||
    hasUserPermission(user, "reports.manage");
  const [report, setReport] = useState<OperationsReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [range, setRange] = useState("30d");
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getOperationsReport(range, controller.signal)
      .then(setReport)
      .catch(() => {
        if (!controller.signal.aborted) {
          setReport(null);
          setError("Operational queues could not be loaded. Please retry.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [allowed, range, revision]);
  if (!allowed) return null;
  const queues = report
    ? [
        {
          label: "Product reviews",
          value: report.supplierProducts.byStatus.pendingReview,
          path: "/products/approvals",
          permission: "products.manage",
        },
        {
          label: "Catalogue mapping",
          value: report.supplierProducts.catalogueMappingQueue,
          path: "/products/supplier-products",
          permission: "products.view",
        },
        {
          label: "Stock verification",
          value: report.supplierProducts.stockVerificationQueue,
          path: "/suppliers/stock",
          permission: "products.view",
        },
        {
          label: "Payment verification",
          value: report.payments.awaitingVerification,
          path: "/payments/pending",
          permission: "payments.view",
        },
        {
          label: "Fulfilment retries",
          value: report.payments.fulfilmentFailed,
          path: "/payments?fulfillmentStatus=failed",
          permission: "payments.view",
        },
        {
          label: "Expiring in 7 days",
          value: report.subscriptions.expiringWithin7Days,
          path: "/marketplace/subscriptions",
          permission: "suppliers.manage",
        },
      ]
    : [];
  return (
    <section className="sth-operations overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-50 p-3 text-orange-600 dark:bg-orange-500/10">
            <Layers size={21} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
              Marketplace operations
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              Your work queue
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Revenue reporting period"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:text-gray-200"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="year">This year</option>
          </select>
          <button
            aria-label="Refresh operations"
            disabled={loading}
            onClick={() => setRevision((v) => v + 1)}
            className="rounded-lg border border-gray-200 p-2 dark:border-gray-700 dark:text-white"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="p-5 text-sm text-red-600">
          {error}
        </p>
      )}
      {!report && loading && (
        <p role="status" className="p-6 text-sm text-gray-500">
          Loading marketplace operations…
        </p>
      )}
      {report && (
        <>
          <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800 lg:grid-cols-3">
            {queues.map((q) => (
              <div key={q.label} className="bg-white p-5 dark:bg-gray-900">
                <p className="text-sm text-gray-500">{q.label}</p>
                <div className="mt-2 flex items-end justify-between">
                  <strong className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    {q.value.toLocaleString("en-PK")}
                  </strong>
                  {(hasUserPermission(user, q.permission) ||
                    hasUserPermission(
                      user,
                      q.permission.replace(".view", ".manage"),
                    )) && (
                    <Link
                      to={q.path}
                      aria-label={`Open ${q.label}`}
                      className="rounded-full bg-gray-50 p-2 text-purple-600 dark:bg-gray-800"
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-5 border-t border-gray-100 p-5 dark:border-gray-800 sm:grid-cols-2 sm:p-6">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold dark:text-white">
                <ShieldCheck size={17} className="text-green-600" />
                Listing health
              </h3>
              <p className="mt-2 text-sm leading-7 text-gray-500">
                {report.supplierProducts.published} published supplier products
                · {report.catalogueOffers.enabled} enabled catalogue offers
                <br />
                {report.supplierProducts.freeEnabledActive +
                  report.catalogueOffers.freeEnabledActive}{" "}
                active FREE ENABLE grants · {report.subscriptions.active} active
                subscriptions
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold dark:text-white">
                Verified payment revenue
              </h3>
              {report.payments.verifiedRevenue.length ? (
                report.payments.verifiedRevenue.map((r) => (
                  <p
                    key={`${r.purpose}-${r.currency}`}
                    className="mt-2 flex justify-between gap-3 text-sm text-gray-500"
                  >
                    <span className="capitalize">
                      {r.purpose.replace(/_/g, " ")}
                    </span>
                    <strong className="whitespace-nowrap text-gray-900 dark:text-white">
                      {r.currency} {r.amount.toLocaleString("en-PK")}
                    </strong>
                  </p>
                ))
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  No verified payments in this period.
                </p>
              )}
            </div>
          </div>
          <p className="px-5 pb-4 text-xs text-gray-400">
            Queues show current counts. Revenue uses verified paid payments in
            the selected period. Updated{" "}
            {new Date(report.generatedAt).toLocaleString("en-PK")}.
          </p>
        </>
      )}
    </section>
  );
}
