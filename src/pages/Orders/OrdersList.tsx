import { Link } from "react-router";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Package,
  Search,
  ShoppingBag,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

/* =========================================================
   TYPES
========================================================= */

type OrderStatus =
  | "Pending"
  | "Processing"
  | "Completed"
  | "Cancelled";

type PaymentStatus =
  | "Paid"
  | "Pending"
  | "Failed";

type Order = {
  id: string;
  customer: string;
  items: number;
  total: string;
  paymentStatus: PaymentStatus;
  orderDate: string;
  status: OrderStatus;
};

/* =========================================================
   TEMP DATA

   Later this will come from Orders API.
========================================================= */

const orders: Order[] = [
  {
    id: "STH-ORD-1001",
    customer: "Ahmed Raza",
    items: 4,
    total: "Rs. 485,000",
    paymentStatus: "Paid",
    orderDate: "14 Sep 2026",
    status: "Processing",
  },
  {
    id: "STH-ORD-1002",
    customer: "Usman Traders",
    items: 2,
    total: "Rs. 1,250,000",
    paymentStatus: "Pending",
    orderDate: "14 Sep 2026",
    status: "Pending",
  },
  {
    id: "STH-ORD-1003",
    customer: "Green Energy Solutions",
    items: 6,
    total: "Rs. 785,500",
    paymentStatus: "Paid",
    orderDate: "13 Sep 2026",
    status: "Completed",
  },
  {
    id: "STH-ORD-1004",
    customer: "Bilal Ahmed",
    items: 1,
    total: "Rs. 215,000",
    paymentStatus: "Failed",
    orderDate: "12 Sep 2026",
    status: "Cancelled",
  },
  {
    id: "STH-ORD-1005",
    customer: "Prime Solar Services",
    items: 3,
    total: "Rs. 965,000",
    paymentStatus: "Paid",
    orderDate: "11 Sep 2026",
    status: "Completed",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const getOrderStatusClasses = (
  status: OrderStatus
) => {
  switch (status) {
    case "Pending":
      return `
        border-orange-200
        bg-orange-50
        text-orange-700
        dark:border-orange-500/20
        dark:bg-orange-500/10
        dark:text-orange-400
      `;

    case "Processing":
      return `
        border-purple-200
        bg-purple-50
        text-purple-700
        dark:border-purple-500/20
        dark:bg-purple-500/10
        dark:text-purple-400
      `;

    case "Completed":
      return `
        border-green-200
        bg-green-50
        text-green-700
        dark:border-green-500/20
        dark:bg-green-500/10
        dark:text-green-400
      `;

    case "Cancelled":
      return `
        border-red-200
        bg-red-50
        text-red-700
        dark:border-red-500/20
        dark:bg-red-500/10
        dark:text-red-400
      `;
  }
};

const getPaymentClasses = (
  status: PaymentStatus
) => {
  switch (status) {
    case "Paid":
      return `
        bg-green-50
        text-green-700
        dark:bg-green-500/10
        dark:text-green-400
      `;

    case "Pending":
      return `
        bg-orange-50
        text-orange-700
        dark:bg-orange-500/10
        dark:text-orange-400
      `;

    case "Failed":
      return `
        bg-red-50
        text-red-700
        dark:bg-red-500/10
        dark:text-red-400
      `;
  }
};

/* =========================================================
   PAGE
========================================================= */

const OrdersList = () => {
  const pendingCount = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const processingCount = orders.filter(
    (order) => order.status === "Processing"
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "Completed"
  ).length;

  const cancelledCount = orders.filter(
    (order) => order.status === "Cancelled"
  ).length;

  return (
    <>
      <PageMeta
        title="Orders | Solar Trade Hub"
        description="Manage Solar Trade Hub marketplace orders."
      />

      <PageBreadcrumb pageTitle="Orders" />

      <div className="space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                <ShoppingBag
                  size={23}
                  strokeWidth={1.9}
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                  Marketplace
                </p>

                <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                  Order Management
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Monitor and manage customer orders
                  across the Solar Trade Hub marketplace.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            SUMMARY
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Pending"
            value={pendingCount}
            icon={<Clock3 size={20} />}
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
          />

          <StatCard
            title="Processing"
            value={processingCount}
            icon={<Package size={20} />}
            iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />

          <StatCard
            title="Completed"
            value={completedCount}
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />

          <StatCard
            title="Cancelled"
            value={cancelledCount}
            icon={<XCircle size={20} />}
            iconClass="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          />
        </div>

        {/* =====================================================
            ORDER TABLE
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                All Orders
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review marketplace order activity.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search orders..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <TableHeading>Order</TableHeading>
                  <TableHeading>Customer</TableHeading>
                  <TableHeading>Items</TableHeading>
                  <TableHeading>Total</TableHeading>
                  <TableHeading>Payment</TableHeading>
                  <TableHeading>Date</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading align="right">
                    Action
                  </TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                  >
                    {/* Order */}

                    <td className="px-5 py-5 sm:px-6">
                      <div className="flex min-w-[150px] items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
                          <ShoppingBag size={16} />
                        </div>

                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {order.id}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}

                    <td className="px-5 py-5">
                      <div className="flex min-w-[170px] items-center gap-2">
                        <UserRound
                          size={15}
                          className="text-gray-400"
                        />

                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {order.customer}
                        </span>
                      </div>
                    </td>

                    {/* Items */}

                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2">
                        <Package
                          size={15}
                          className="text-gray-400"
                        />

                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {order.items}
                        </span>
                      </div>
                    </td>

                    {/* Total */}

                    <td className="px-5 py-5">
                      <div className="flex min-w-[130px] items-center gap-2">
                        <WalletCards
                          size={15}
                          className="text-orange-500"
                        />

                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {order.total}
                        </span>
                      </div>
                    </td>

                    {/* Payment */}

                    <td className="px-5 py-5">
                      <span
                        className={`
                          inline-flex
                          rounded-full
                          px-2.5
                          py-1
                          text-xs
                          font-semibold

                          ${getPaymentClasses(
                            order.paymentStatus
                          )}
                        `}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Date */}

                    <td className="px-5 py-5">
                      <div className="flex min-w-[125px] items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <CalendarDays size={15} />
                        {order.orderDate}
                      </div>
                    </td>

                    {/* Status */}

                    <td className="px-5 py-5">
                      <span
                        className={`
                          inline-flex
                          rounded-full
                          border
                          px-2.5
                          py-1
                          text-xs
                          font-semibold

                          ${getOrderStatusClasses(
                            order.status
                          )}
                        `}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Action */}

                    <td className="px-5 py-5 text-right sm:px-6">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20"
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   COMPONENTS
========================================================= */

const StatCard = ({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const TableHeading = ({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) => {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
};

export default OrdersList;