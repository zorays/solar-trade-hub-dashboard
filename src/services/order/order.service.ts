import api from "../api";

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed";

export type OrderPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "failed";

export type OrderFulfillmentStatus =
  | "unfulfilled"
  | "processing"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderScope =
  | "pending"
  | "completed";

export type OrderCustomerSnapshot = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type OrderCustomer = {
  _id?: string;
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneE164?: string | null;
  status?: string | null;
  isVerified?: boolean;
};

export type OrderProductSnapshot = {
  sku?: string | null;
  name: string;
  type?: string | null;
  productType?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  brand?: string | null;
  size?: string | number | null;
  unit?: string | null;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
};

export type OrderSupplierSnapshot = {
  supplierId: string;
  companyName: string;
  supplierLogo?: string | null;
  productAccessId: string;
};

export type OrderItem = {
  _id?: string;
  externalProductId: string;
  productSnapshot: OrderProductSnapshot;
  supplier?: string | null;
  supplierSnapshot: OrderSupplierSnapshot;
  quantity: number;
  unitRate: number;
  lineTotal: number;
  currency: string;
  rateCapturedAt?: string | null;
};

export type DeliveryAddress = {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  area?: string | null;
  city: string;
  province?: string | null;
  postalCode?: string | null;
  country: string;
  instructions?: string | null;
};

export type ManagedOrder = {
  _id: string;
  id?: string;
  orderNumber: string;
  customer: string | OrderCustomer;
  customerSnapshot?: OrderCustomerSnapshot;
  items: OrderItem[];
  subtotal: number;
  deliveryAmount: number;
  otherCharges: number;
  discountAmount: number;
  grandTotal: number;
  currency: string;
  deliveryAddress: DeliveryAddress;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  payment?: unknown;
  customerNote?: string | null;
  internalNote?: string | null;
  checkoutValidatedAt?: string | null;
  confirmedAt?: string | null;
  processingAt?: string | null;
  readyAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  scope?: OrderScope;
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  fulfillmentStatus?: OrderFulfillmentStatus;
};

export type OrderPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type OrderManagementSummary = {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  failedOrders: number;
  totalItems: number;
  completedItems: number;
  grossOrderValue: number;
  paidRevenue: number;
  statuses: Record<string, number>;
  paymentStatuses: Record<string, number>;
  fulfillmentStatuses: Record<string, number>;
};

type ListResponse = {
  success: boolean;
  message?: string;
  data?: {
    orders?: ManagedOrder[];
    pagination?: OrderPagination;
  };
};

type SummaryResponse = {
  success: boolean;
  message?: string;
  data?: {
    summary?: OrderManagementSummary;
  };
};

type DetailResponse = {
  success: boolean;
  message?: string;
  data?: {
    order?: ManagedOrder;
  };
};

const defaultPagination: OrderPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const defaultSummary: OrderManagementSummary = {
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

export const getManagementOrders = async (
  query: OrderListQuery = {}
) => {
  const response = await api.get<ListResponse>(
    "/orders/manage",
    {
      params: query,
    }
  );

  return {
    orders: Array.isArray(response.data.data?.orders)
      ? response.data.data?.orders ?? []
      : [],
    pagination:
      response.data.data?.pagination ??
      defaultPagination,
  };
};

export const getManagementOrderSummary = async () => {
  const response = await api.get<SummaryResponse>(
    "/orders/manage/summary"
  );

  return (
    response.data.data?.summary ??
    defaultSummary
  );
};

export const getManagementOrderById = async (
  orderId: string
) => {
  const response = await api.get<DetailResponse>(
    `/orders/manage/${encodeURIComponent(orderId)}`
  );

  const order = response.data.data?.order;

  if (!order) {
    throw new Error(
      "Order response did not include an order."
    );
  }

  return order;
};

export const getOrderCustomerName = (
  order: ManagedOrder
) => {
  if (
    order.customer &&
    typeof order.customer === "object"
  ) {
    return (
      order.customer.name ||
      order.customerSnapshot?.name ||
      "Customer"
    );
  }

  return (
    order.customerSnapshot?.name ||
    "Customer"
  );
};

export const getOrderCustomerEmail = (
  order: ManagedOrder
) => {
  if (
    order.customer &&
    typeof order.customer === "object"
  ) {
    return (
      order.customer.email ||
      order.customerSnapshot?.email ||
      ""
    );
  }

  return order.customerSnapshot?.email || "";
};

export const getOrderCustomerPhone = (
  order: ManagedOrder
) => {
  if (
    order.customer &&
    typeof order.customer === "object"
  ) {
    return (
      order.customer.phoneE164 ||
      order.customer.phone ||
      order.customerSnapshot?.phone ||
      ""
    );
  }

  return order.customerSnapshot?.phone || "";
};

export const getOrderItemQuantity = (
  order: ManagedOrder
) => {
  return (order.items || []).reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );
};

export const formatOrderMoney = (
  value: number | null | undefined,
  currency = "PKR"
) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: currency || "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

export const formatOrderDate = (
  value: string | null | undefined,
  fallback = "—"
) => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatOrderStatus = (
  value: string | null | undefined
) => {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
};

export const getOrderErrorMessage = (
  error: unknown
) => {
  const apiError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
    message?: string;
  };

  return (
    apiError.response?.data?.message ||
    apiError.message ||
    "Unable to load orders."
  );
};
