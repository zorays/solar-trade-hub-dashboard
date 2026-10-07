import { Link } from "react-router";

import {
  CalendarDays,
  CheckCircle2,
  Eye,
  Package,
  Search,
  ShoppingBag,
  UserRound,
  WalletCards,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

/* =========================================================
   TYPES
========================================================= */

type PaymentStatus = "Paid";

type CompletedOrder = {
  id: string;
  customer: string;
  items: number;
  total: string;
  paymentStatus: PaymentStatus;
  orderDate: string;
  completedDate: string;
};

/* =========================================================
   TEMP DATA

   Later this will come from Orders API
   filtered by Completed status.
========================================================= */

const completedOrders: CompletedOrder[] = [
  {
    id: "STH-ORD-1003",
    customer: "Green Energy Solutions",
    items: 6,
    total: "Rs. 785,500",
    paymentStatus: "Paid",
    orderDate: "13 Sep 2026",
    completedDate: "14 Sep 2026",
  },
  {
    id: "STH-ORD-1005",
    customer: "Prime Solar Services",
    items: 3,
    total: "Rs. 965,000",
    paymentStatus: "Paid",
    orderDate: "11 Sep 2026",
    completedDate: "13 Sep 2026",
  },
  {
    id: "STH-ORD-1008",
    customer: "Pak Renewable Systems",
    items: 4,
    total: "Rs. 1,420,000",
    paymentStatus: "Paid",
    orderDate: "09 Sep 2026",
    completedDate: "12 Sep 2026",
  },
  {
    id: "STH-ORD-1009",
    customer: "Energy Point Traders",
    items: 2,
    total: "Rs. 540,000",
    paymentStatus: "Paid",
    orderDate: "08 Sep 2026",
    completedDate: "10 Sep 2026",
  },
];

/* =========================================================
   PAGE
========================================================= */

const CompletedOrders = () => {
  const totalOrders = completedOrders.length;

  const totalItems = completedOrders.reduce(
    (sum, order) => sum + order.items,
    0
  );

  return (
    <>
      <PageMeta
        title="Completed Orders | Solar Trade Hub"
        description="View completed Solar Trade Hub marketplace orders."
      />

      <PageBreadcrumb pageTitle="Completed Orders" />

      <div className="space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-green-500/5" />

            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                <CheckCircle2
                  size={23}
                  strokeWidth={1.9}
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                  Order Management
                </p>

                <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                  Completed Orders
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Review successfully completed
                  marketplace orders and their
                  fulfillment history.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            SUMMARY
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title="Completed Orders"
            value={totalOrders}
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />

          <StatCard
            title="Items Fulfilled"
            value={totalItems}
            icon={<Package size={20} />}
            iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />
        </div>

        {/* =====================================================
            TABLE
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Completed Order History
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Successfully fulfilled Solar Trade Hub
                marketplace orders.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search completed orders..."
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
                  <TableHeading>Order Date</TableHeading>
                  <TableHeading>Completed</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading align="right">
                    Action
                  </TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {completedOrders.map((order) => (
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
                      <div className="flex min-w-[180px] items-center gap-2">
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
                      <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Order Date */}

                    <td className="px-5 py-5">
                      <div className="flex min-w-[125px] items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <CalendarDays size={15} />
                        {order.orderDate}
                      </div>
                    </td>

                    {/* Completed Date */}

                    <td className="px-5 py-5">
                      <div className="flex min-w-[125px] items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <CheckCircle2
                          size={15}
                          className="text-green-500"
                        />

                        {order.completedDate}
                      </div>
                    </td>

                    {/* Status */}

                    <td className="px-5 py-5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
                        <CheckCircle2 size={13} />
                        Completed
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

export default CompletedOrders;