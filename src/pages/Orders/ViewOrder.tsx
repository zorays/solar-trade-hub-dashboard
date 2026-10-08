import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
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
  getManagementOrderById,
  getOrderCustomerEmail,
  getOrderCustomerName,
  getOrderCustomerPhone,
  getOrderErrorMessage,
  getOrderItemQuantity,
  type ManagedOrder,
} from "../../services/order/order.service";

const ViewOrder = () => {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<ManagedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      setOrder(await getManagementOrderById(id));
    } catch (loadError) {
      setOrder(null);
      setError(getOrderErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const deliveryAddress = useMemo(() => {
    if (!order?.deliveryAddress) {
      return "—";
    }

    return [
      order.deliveryAddress.addressLine1,
      order.deliveryAddress.addressLine2,
      order.deliveryAddress.area,
      order.deliveryAddress.city,
      order.deliveryAddress.province,
      order.deliveryAddress.postalCode,
      order.deliveryAddress.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [order]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
        Loading order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error || "Order was not found."}
        </div>
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600">
          <ArrowLeft size={16} /> Back to orders
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${order.orderNumber} | Solar Trade Hub`}
        description={`Order ${order.orderNumber} details.`}
      />
      <PageBreadcrumb pageTitle="Order Details" />

      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                  <ShoppingBag size={23} />
                </div>
                <div>
                  <Link to="/orders" className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    <ArrowLeft size={13} /> All Orders
                  </Link>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    {order.orderNumber}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge value={order.status} />
                    <Badge value={order.paymentStatus} />
                    <Badge value={order.fulfillmentStatus} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
              >
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <InfoCard title="Customer" icon={<UserRound size={18} />}>
            <InfoLine label="Name" value={getOrderCustomerName(order)} />
            <InfoLine label="Email" value={getOrderCustomerEmail(order) || "—"} icon={<Mail size={14} />} />
            <InfoLine label="Phone" value={getOrderCustomerPhone(order) || "—"} icon={<Phone size={14} />} />
          </InfoCard>

          <InfoCard title="Delivery" icon={<MapPin size={18} />}>
            <InfoLine label="Recipient" value={order.deliveryAddress?.recipientName || "—"} />
            <InfoLine label="Phone" value={order.deliveryAddress?.phone || "—"} />
            <InfoLine label="Address" value={deliveryAddress} />
          </InfoCard>

          <InfoCard title="Order Summary" icon={<WalletCards size={18} />}>
            <InfoLine label="Order Date" value={formatOrderDate(order.createdAt)} icon={<CalendarDays size={14} />} />
            <InfoLine label="Items" value={String(getOrderItemQuantity(order))} />
            <InfoLine label="Subtotal" value={formatOrderMoney(order.subtotal, order.currency)} />
            <InfoLine label="Delivery" value={formatOrderMoney(order.deliveryAmount, order.currency)} />
            <InfoLine label="Discount" value={formatOrderMoney(order.discountAmount, order.currency)} />
            <InfoLine label="Grand Total" value={formatOrderMoney(order.grandTotal, order.currency)} strong />
          </InfoCard>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Order Items
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              External Rate List product snapshot captured when the order was placed.
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {order.items.map((item, index) => (
              <div key={item._id || `${item.externalProductId}-${index}`} className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                    {item.productSnapshot.imageThumbUrl || item.productSnapshot.imageUrl ? (
                      <img
                        src={item.productSnapshot.imageThumbUrl || item.productSnapshot.imageUrl || ""}
                        alt={item.productSnapshot.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package size={22} className="text-gray-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.productSnapshot.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.productSnapshot.sku || item.externalProductId}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1"><Building2 size={13} /> {item.supplierSnapshot.companyName}</span>
                      <span>Qty {item.quantity}</span>
                      <span>{formatOrderMoney(item.unitRate, item.currency)} each</span>
                    </div>
                  </div>
                </div>

                <p className="text-right text-base font-semibold text-gray-900 dark:text-white">
                  {formatOrderMoney(item.lineTotal, item.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {(order.customerNote || order.internalNote) && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {order.customerNote && (
              <InfoCard title="Customer Note" icon={<UserRound size={18} />}>
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">{order.customerNote}</p>
              </InfoCard>
            )}
            {order.internalNote && (
              <InfoCard title="Internal Note" icon={<Package size={18} />}>
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">{order.internalNote}</p>
              </InfoCard>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const Badge = ({ value }: { value: string }) => {
  const positive = value === "delivered" || value === "paid" || value === "confirmed";
  const negative = value === "cancelled" || value === "failed" || value === "refunded";
  const classes = positive
    ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300"
    : negative
      ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
      : "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {negative ? <XCircle size={13} /> : positive ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
      {formatOrderStatus(value)}
    </span>
  );
};

const InfoCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
    <div className="mb-5 flex items-center gap-2 text-gray-900 dark:text-white">
      <span className="text-purple-600 dark:text-purple-400">{icon}</span>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const InfoLine = ({
  label,
  value,
  icon,
  strong = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  strong?: boolean;
}) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`mt-1 flex items-start gap-1.5 text-sm ${strong ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>
      {icon && <span className="mt-0.5 text-gray-400">{icon}</span>}
      <span>{value}</span>
    </p>
  </div>
);

export default ViewOrder;
