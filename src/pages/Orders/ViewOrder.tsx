import { Link, useParams } from "react-router";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Package,
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

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string;
  total: string;
};

type Order = {
  id: string;
  customer: string;
  items: OrderItem[];
  subtotal: string;
  total: string;
  paymentStatus: PaymentStatus;
  orderDate: string;
  status: OrderStatus;
};

/* =========================================================
   TEMP DATA

   Later this will come from:
   GET /orders/:id
========================================================= */

const orders: Order[] = [
  {
    id: "STH-ORD-1001",
    customer: "Ahmed Raza",
    items: [
      {
        id: "item-001",
        name: "Solar Panels",
        quantity: 2,
        unitPrice: "Rs. 150,000",
        total: "Rs. 300,000",
      },
      {
        id: "item-002",
        name: "Solar Inverter",
        quantity: 1,
        unitPrice: "Rs. 185,000",
        total: "Rs. 185,000",
      },
    ],
    subtotal: "Rs. 485,000",
    total: "Rs. 485,000",
    paymentStatus: "Paid",
    orderDate: "14 Sep 2026",
    status: "Processing",
  },
  {
    id: "STH-ORD-1002",
    customer: "Usman Traders",
    items: [
      {
        id: "item-003",
        name: "Lithium Battery",
        quantity: 2,
        unitPrice: "Rs. 625,000",
        total: "Rs. 1,250,000",
      },
    ],
    subtotal: "Rs. 1,250,000",
    total: "Rs. 1,250,000",
    paymentStatus: "Pending",
    orderDate: "14 Sep 2026",
    status: "Pending",
  },
  {
    id: "STH-ORD-1003",
    customer: "Green Energy Solutions",
    items: [
      {
        id: "item-004",
        name: "Solar Module",
        quantity: 4,
        unitPrice: "Rs. 125,000",
        total: "Rs. 500,000",
      },
      {
        id: "item-005",
        name: "Hybrid Inverter",
        quantity: 1,
        unitPrice: "Rs. 285,500",
        total: "Rs. 285,500",
      },
    ],
    subtotal: "Rs. 785,500",
    total: "Rs. 785,500",
    paymentStatus: "Paid",
    orderDate: "13 Sep 2026",
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

const getStatusIcon = (
  status: OrderStatus
) => {
  switch (status) {
    case "Completed":
      return <CheckCircle2 size={15} />;

    case "Cancelled":
      return <XCircle size={15} />;

    case "Processing":
      return <Package size={15} />;

    default:
      return <Clock3 size={15} />;
  }
};

/* =========================================================
   PAGE
========================================================= */

const ViewOrder = () => {
  const { id } = useParams();

  const order =
    orders.find(
      (item) => item.id === id
    ) ?? orders[0];

  const itemCount = order.items.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  return (
    <>
      <PageMeta
        title={`${order.id} | Solar Trade Hub`}
        description={`View Solar Trade Hub order ${order.id}.`}
      />

      <PageBreadcrumb pageTitle="Order Details" />

      <div className="space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <ShoppingBag
                    size={23}
                    strokeWidth={1.9}
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                      Order
                    </p>

                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1.5
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
                      {getStatusIcon(
                        order.status
                      )}

                      {order.status}
                    </span>
                  </div>

                  <h1 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    {order.id}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound size={15} />
                      {order.customer}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={15} />
                      {order.orderDate}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/orders"
                className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
              >
                <ArrowLeft size={16} />
                Back to Orders
              </Link>
            </div>
          </div>
        </div>

        {/* =====================================================
            SUMMARY
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Customer"
            value={order.customer}
            icon={
              <UserRound
                size={20}
                className="text-purple-600 dark:text-purple-400"
              />
            }
            iconClass="bg-purple-50 dark:bg-purple-500/10"
          />

          <SummaryCard
            label="Items"
            value={String(itemCount)}
            icon={
              <Package
                size={20}
                className="text-orange-600 dark:text-orange-400"
              />
            }
            iconClass="bg-orange-50 dark:bg-orange-500/10"
          />

          <SummaryCard
            label="Order Total"
            value={order.total}
            icon={
              <WalletCards
                size={20}
                className="text-green-600 dark:text-green-400"
              />
            }
            iconClass="bg-green-50 dark:bg-green-500/10"
          />

          <SummaryCard
            label="Order Date"
            value={order.orderDate}
            icon={
              <CalendarDays
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            }
            iconClass="bg-gray-100 dark:bg-white/5"
          />
        </div>

        {/* =====================================================
            ORDER ITEMS
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Order Items
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Products included in this marketplace
              order.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <TableHeading>
                    Product
                  </TableHeading>

                  <TableHeading>
                    Quantity
                  </TableHeading>

                  <TableHeading>
                    Unit Price
                  </TableHeading>

                  <TableHeading align="right">
                    Total
                  </TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {order.items.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-5 sm:px-6">
                        <div className="flex min-w-[220px] items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
                            <Package size={17} />
                          </div>

                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.quantity}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {item.unitPrice}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-right sm:px-6">
                        <span className="whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {item.total}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================
            ORDER / PAYMENT DETAILS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Order Information */}

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-2">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Order Information
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
              <DetailItem
                label="Order ID"
                value={order.id}
              />

              <DetailItem
                label="Customer"
                value={order.customer}
              />

              <DetailItem
                label="Order Date"
                value={order.orderDate}
              />

              <DetailItem
                label="Items"
                value={String(itemCount)}
              />

              <DetailItem
                label="Subtotal"
                value={order.subtotal}
              />

              <DetailItem
                label="Order Total"
                value={order.total}
              />
            </div>
          </div>

          {/* Status */}

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Order Status
              </h2>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Fulfillment
                </p>

                <span
                  className={`
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    border
                    px-3
                    py-1.5
                    text-sm
                    font-semibold

                    ${getOrderStatusClasses(
                      order.status
                    )}
                  `}
                >
                  {getStatusIcon(
                    order.status
                  )}

                  {order.status}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Payment
                </p>

                <span
                  className={`
                    inline-flex
                    rounded-full
                    px-3
                    py-1.5
                    text-sm
                    font-semibold

                    ${getPaymentClasses(
                      order.paymentStatus
                    )}
                  `}
                >
                  {order.paymentStatus}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total
                  </span>

                  <strong className="text-lg text-gray-900 dark:text-white">
                    {order.total}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* =========================================================
   COMPONENTS
========================================================= */

const SummaryCard = ({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-1 break-words text-lg font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        {value}
      </p>
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

export default ViewOrder;