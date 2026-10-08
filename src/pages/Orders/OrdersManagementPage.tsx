import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  formatOrderDate,
  formatOrderMoney,
  formatOrderStatus,
  getManagementOrders,
  getManagementOrderSummary,
  getOrderCustomerName,
  getOrderErrorMessage,
  getOrderItemQuantity,
  type ManagedOrder,
  type OrderManagementSummary,
  type OrderPaymentStatus,
  type OrderScope,
  type OrderStatus,
} from "../../services/order/order.service";

type Props = {
  scope?: OrderScope;
  title: string;
  description: string;
};

const emptySummary: OrderManagementSummary = {
  totalOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  failedOrders: 0,
  totalItems: 0,
  completedItems: 0,
  grossOrderValue: 0,
  paidRevenue: 0,
  statuses: {},
  paymentStatuses: {},
  fulfillmentStatuses: {},
};

const orderStatuses: OrderStatus[] = [
  "pending_payment",
  "confirmed",
  "processing",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
];

const paymentStatuses: OrderPaymentStatus[] = [
  "unpaid",
  "pending",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
];

const OrdersManagementPage = ({
  scope,
  title,
  description,
}: Props) => {
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [summary, setSummary] =
    useState<OrderManagementSummary>(emptySummary);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [paymentStatus, setPaymentStatus] =
    useState<"" | OrderPaymentStatus>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [listResult, summaryResult] =
          await Promise.all([
            getManagementOrders({
              page,
              limit: 20,
              scope,
              search: search || undefined,
              status:
                !scope && status
                  ? status
                  : undefined,
              paymentStatus:
                paymentStatus || undefined,
            }),
            getManagementOrderSummary(),
          ]);

        setOrders(listResult.orders);
        setTotalPages(listResult.pagination.totalPages);
        setTotal(listResult.pagination.total);
        setSummary(summaryResult);
      } catch (loadError) {
        setError(getOrderErrorMessage(loadError));
        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, paymentStatus, scope, search, status]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const pageMetric = useMemo(() => {
    if (scope === "pending") {
      return {
        label: "Pending Orders",
        value: summary.pendingOrders,
      };
    }

    if (scope === "completed") {
      return {
        label: "Completed Orders",
        value: summary.completedOrders,
      };
    }

    return {
      label: "All Orders",
      value: summary.totalOrders,
    };
  }, [scope, summary]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <>
      <PageMeta
        title={`${title} | Solar Trade Hub`}
        description={description}
      />

      <PageBreadcrumb pageTitle={title} />

      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />
            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <ShoppingBag size={23} />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                    Order Management
                  </p>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={pageMetric.label}
            value={pageMetric.value.toLocaleString("en-PK")}
            icon={<ShoppingBag size={20} />}
            iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />
          <StatCard
            title="Pending"
            value={summary.pendingOrders.toLocaleString("en-PK")}
            icon={<Clock3 size={20} />}
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
          />
          <StatCard
            title="Completed"
            value={summary.completedOrders.toLocaleString("en-PK")}
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />
          <StatCard
            title="Paid Revenue"
            value={formatOrderMoney(summary.paidRevenue)}
            icon={<WalletCards size={20} />}
            iconClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {total.toLocaleString("en-PK")} matching order{total === 1 ? "" : "s"}.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <form
                onSubmit={submitSearch}
                className="relative min-w-0 flex-1 sm:min-w-[280px]"
              >
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  type="search"
                  placeholder="Order no., customer, email..."
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </form>

              {!scope && (
                <select
                  value={status}
                  onChange={(event) => {
                    setPage(1);
                    setStatus(event.target.value as "" | OrderStatus);
                  }}
                  className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="">All statuses</option>
                  {orderStatuses.map((item) => (
                    <option key={item} value={item}>
                      {formatOrderStatus(item)}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={paymentStatus}
                onChange={(event) => {
                  setPage(1);
                  setPaymentStatus(
                    event.target.value as "" | OrderPaymentStatus
                  );
                }}
                className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="">All payments</option>
                {paymentStatuses.map((item) => (
                  <option key={item} value={item}>
                    {formatOrderStatus(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 sm:px-6">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <TableHeading>Order</TableHeading>
                  <TableHeading>Customer</TableHeading>
                  <TableHeading align="right">Items</TableHeading>
                  <TableHeading align="right">Total</TableHeading>
                  <TableHeading>Payment</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading>Order Date</TableHeading>
                  <TableHeading align="right">Action</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center text-sm text-gray-500 dark:text-gray-400">
                      No orders found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order._id}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-5 sm:px-6">
                        <div className="flex min-w-[150px] items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
                            <ShoppingBag size={16} />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {order.orderNumber}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex min-w-[180px] items-center gap-2">
                          <UserRound size={15} className="text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {getOrderCustomerName(order)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-5 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getOrderItemQuantity(order)}
                      </td>

                      <td className="px-5 py-5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {formatOrderMoney(order.grandTotal, order.currency)}
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge value={order.paymentStatus} kind="payment" />
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge value={order.status} kind="order" />
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-600 dark:text-gray-400">
                        {formatOrderDate(order.createdAt)}
                      </td>

                      <td className="px-5 py-5 text-right sm:px-6">
                        <Link
                          to={`/orders/${order._id}`}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-purple-500/40 dark:hover:bg-purple-500/10 dark:hover:text-purple-300"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {Math.max(totalPages, 1)}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || loading}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => value + 1)}
                disabled={page >= totalPages || loading || totalPages === 0}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
        {icon}
      </div>
    </div>
  </div>
);

const StatusBadge = ({
  value,
  kind,
}: {
  value: string;
  kind: "order" | "payment";
}) => {
  const positive =
    value === "delivered" ||
    value === "paid" ||
    value === "confirmed";
  const negative =
    value === "cancelled" ||
    value === "failed" ||
    value === "refunded";

  const classes = positive
    ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300"
    : negative
      ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
      : "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300";

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {negative ? (
        <XCircle size={13} />
      ) : positive ? (
        <CheckCircle2 size={13} />
      ) : kind === "payment" ? (
        <WalletCards size={13} />
      ) : (
        <Package size={13} />
      )}
      {formatOrderStatus(value)}
    </span>
  );
};

const TableHeading = ({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) => (
  <th
    className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6 ${
      align === "right" ? "text-right" : "text-left"
    }`}
  >
    {children}
  </th>
);

export default OrdersManagementPage;
