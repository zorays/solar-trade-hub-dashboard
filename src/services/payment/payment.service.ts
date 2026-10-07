/* =========================================================
   SOLAR TRADE HUB
   PAYMENT FRONTEND SERVICE CONTRACT

   Backend routes will be connected only after the actual
   payment routes/controller are confirmed.

   This file provides the shared Payment contracts/helpers
   required by:

   - PaymentsList.tsx
   - PendingPayments.tsx
   - ManualVerification.tsx
========================================================= */

/* =========================================================
   PAYMENT PURPOSE
========================================================= */

export const PAYMENT_PURPOSE = [
  "product_order",
  "range_token_purchase",
  "range_token_subscription",
  "supplier_subscription",
] as const;

export type PaymentPurpose =
  (typeof PAYMENT_PURPOSE)[number];

/* =========================================================
   PAYMENT METHOD
========================================================= */

export const PAYMENT_METHOD = [
  "jazzcash",
  "easypaisa",
  "bank",
  "manual_bank_transfer",
  "stripe",
] as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[number];

/* =========================================================
   PAYMENT PROVIDER
========================================================= */

export const PAYMENT_PROVIDER = [
  "jazzcash",
  "easypaisa",
  "bank",
  "manual",
  "stripe",
] as const;

export type PaymentProvider =
  (typeof PAYMENT_PROVIDER)[number];

/* =========================================================
   PAYMENT STATUS
========================================================= */

export const PAYMENT_STATUS = [
  "pending",
  "processing",
  "paid",
  "failed",
  "cancelled",
  "partially_refunded",
  "refunded",
] as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[number];

/* =========================================================
   PAYMENT VERIFICATION STATUS
========================================================= */

export const PAYMENT_VERIFICATION_STATUS = [
  "pending",
  "verified",
  "failed",
] as const;

export type PaymentVerificationStatus =
  (typeof PAYMENT_VERIFICATION_STATUS)[number];

/* =========================================================
   PAYMENT FULFILLMENT STATUS
========================================================= */

export const PAYMENT_FULFILLMENT_STATUS = [
  "pending",
  "processing",
  "fulfilled",
  "failed",
] as const;

export type PaymentFulfillmentStatus =
  (typeof PAYMENT_FULFILLMENT_STATUS)[number];

/* =========================================================
   CUSTOMER
========================================================= */

export type PaymentCustomerReference = {
  _id?: string;

  id?: string;

  name?: string | null;

  fullName?: string | null;

  email?: string | null;

  phone?: string | null;

  status?: string | null;

  [key: string]: unknown;
};

/* =========================================================
   SUPPLIER
========================================================= */

export type PaymentSupplierReference = {
  _id?: string;

  id?: string;

  supplierId?: string | null;

  companyName?: string | null;

  name?: string | null;

  email?: string | null;

  phone?: string | null;

  status?: string | null;

  verificationStatus?: string | null;

  [key: string]: unknown;
};

/* =========================================================
   ORDER
========================================================= */

export type PaymentOrderReference = {
  _id?: string;

  id?: string;

  orderNumber?: string | null;

  orderId?: string | null;

  status?: string | null;

  paymentStatus?: string | null;

  total?: number | null;

  grandTotal?: number | null;

  currency?: string | null;

  [key: string]: unknown;
};

/* =========================================================
   SUBSCRIPTION PLAN
========================================================= */

export type PaymentSubscriptionPlanReference = {
  _id?: string;

  id?: string;

  name?: string | null;

  code?: string | null;

  planCode?: string | null;

  amount?: number | null;

  price?: number | null;

  currency?: string | null;

  durationMonths?: number | null;

  [key: string]: unknown;
};

/* =========================================================
   SUPPLIER SUBSCRIPTION
========================================================= */

export type PaymentSupplierSubscriptionReference = {
  _id?: string;

  id?: string;

  status?: string | null;

  paymentStatus?: string | null;

  startsAt?: string | null;

  expiresAt?: string | null;

  paidAt?: string | null;

  [key: string]: unknown;
};

/* =========================================================
   PROVIDER SNAPSHOT
========================================================= */

export type PaymentProviderSnapshot = {
  transactionId?: string | null;

  reference?: string | null;

  status?: string | null;

  responseCode?: string | null;

  responseMessage?: string | null;
};

/* =========================================================
   MANUAL BANK TRANSFER
========================================================= */

export type ManualBankTransferDetails = {
  bankName?: string | null;

  accountTitle?: string | null;

  transactionReference?: string | null;

  proofUrl?: string | null;

  submittedAt?: string | null;

  verifiedAt?: string | null;

  verifiedBy?:
    | string
    | PaymentCustomerReference
    | null;
};

/* =========================================================
   PAYMENT
========================================================= */

export type Payment = {
  _id?: string;

  id?: string;

  paymentNumber: string;

  customer:
    | string
    | PaymentCustomerReference
    | null;

  supplier:
    | string
    | PaymentSupplierReference
    | null;

  purpose: PaymentPurpose;

  order:
    | string
    | PaymentOrderReference
    | null;

  subscriptionPlan:
    | string
    | PaymentSubscriptionPlanReference
    | null;

  supplierSubscription:
    | string
    | PaymentSupplierSubscriptionReference
    | null;

  rangeTokenAmount:
    | number
    | null;

  amount: number;

  currency: string;

  paymentMethod: PaymentMethod;

  provider: PaymentProvider;

  status: PaymentStatus;

  verificationStatus: PaymentVerificationStatus;

  fulfillmentStatus: PaymentFulfillmentStatus;

  merchantReference: string;

  idempotencyKey?: string;

  callbackEventId?:
    | string
    | null;

  providerSnapshot?:
    | PaymentProviderSnapshot
    | null;

  manualBankTransfer?:
    | ManualBankTransferDetails
    | null;

  refundedAmount?: number;

  refundReference?:
    | string
    | null;

  refundReason?:
    | string
    | null;

  failureCode?:
    | string
    | null;

  failureMessage?:
    | string
    | null;

  note?:
    | string
    | null;

  processingAt?:
    | string
    | null;

  paidAt?:
    | string
    | null;

  verifiedAt?:
    | string
    | null;

  fulfilledAt?:
    | string
    | null;

  failedAt?:
    | string
    | null;

  cancelledAt?:
    | string
    | null;

  refundedAt?:
    | string
    | null;

  createdAt?:
    | string
    | null;

  updatedAt?:
    | string
    | null;

  [key: string]: unknown;
};

/* =========================================================
   LIST FILTERS
========================================================= */

export type PaymentListFilters = {
  page?: number;

  limit?: number;

  search?: string;

  purpose?: PaymentPurpose;

  paymentMethod?: PaymentMethod;

  provider?: PaymentProvider;

  status?: PaymentStatus;

  verificationStatus?: PaymentVerificationStatus;

  fulfillmentStatus?: PaymentFulfillmentStatus;

  customer?: string;

  supplier?: string;

  order?: string;

  dateFrom?: string;

  dateTo?: string;

  sortBy?: string;

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   PAGINATION
========================================================= */

export type PaymentPagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage?: boolean;

  hasPreviousPage?: boolean;
};

/* =========================================================
   LIST RESULT
========================================================= */

export type PaymentListResult = {
  payments: Payment[];

  pagination: PaymentPagination;
};

/* =========================================================
   SUMMARY
========================================================= */

export type PaymentSummary = {
  total?: number;

  pending?: number;

  processing?: number;

  paid?: number;

  failed?: number;

  cancelled?: number;

  partiallyRefunded?: number;

  refunded?: number;

  pendingVerification?: number;

  totalAmount?: number;

  paidAmount?: number;

  refundedAmount?: number;

  currency?: string;

  [key: string]: unknown;
};

/* =========================================================
   LABELS
========================================================= */

export const PAYMENT_PURPOSE_LABELS: Record<
  PaymentPurpose,
  string
> = {
  product_order:
    "Product Order",

  range_token_purchase:
    "Range Token Purchase",

  range_token_subscription:
    "Range Token Subscription",

  supplier_subscription:
    "Supplier Subscription",
};

export const PAYMENT_METHOD_LABELS: Record<
  PaymentMethod,
  string
> = {
  jazzcash:
    "JazzCash",

  easypaisa:
    "Easypaisa",

  bank:
    "Bank",

  manual_bank_transfer:
    "Manual Bank Transfer",

  stripe:
    "Stripe",
};

export const PAYMENT_PROVIDER_LABELS: Record<
  PaymentProvider,
  string
> = {
  jazzcash:
    "JazzCash",

  easypaisa:
    "Easypaisa",

  bank:
    "Bank API",

  manual:
    "Manual",

  stripe:
    "Stripe",
};

export const PAYMENT_STATUS_LABELS: Record<
  PaymentStatus,
  string
> = {
  pending:
    "Pending",

  processing:
    "Processing",

  paid:
    "Paid",

  failed:
    "Failed",

  cancelled:
    "Cancelled",

  partially_refunded:
    "Partially Refunded",

  refunded:
    "Refunded",
};

export const PAYMENT_VERIFICATION_STATUS_LABELS: Record<
  PaymentVerificationStatus,
  string
> = {
  pending:
    "Pending",

  verified:
    "Verified",

  failed:
    "Failed",
};

export const PAYMENT_FULFILLMENT_STATUS_LABELS: Record<
  PaymentFulfillmentStatus,
  string
> = {
  pending:
    "Pending",

  processing:
    "Processing",

  fulfilled:
    "Fulfilled",

  failed:
    "Failed",
};

/* =========================================================
   TYPE GUARDS
========================================================= */

export const isPaymentPurpose = (
  value: unknown
): value is PaymentPurpose => {
  return (
    typeof value ===
      "string" &&
    (
      PAYMENT_PURPOSE as readonly string[]
    ).includes(
      value
    )
  );
};

export const isPaymentMethod = (
  value: unknown
): value is PaymentMethod => {
  return (
    typeof value ===
      "string" &&
    (
      PAYMENT_METHOD as readonly string[]
    ).includes(
      value
    )
  );
};

export const isPaymentProvider = (
  value: unknown
): value is PaymentProvider => {
  return (
    typeof value ===
      "string" &&
    (
      PAYMENT_PROVIDER as readonly string[]
    ).includes(
      value
    )
  );
};

export const isPaymentStatus = (
  value: unknown
): value is PaymentStatus => {
  return (
    typeof value ===
      "string" &&
    (
      PAYMENT_STATUS as readonly string[]
    ).includes(
      value
    )
  );
};

export const isPaymentVerificationStatus = (
  value: unknown
): value is PaymentVerificationStatus => {
  return (
    typeof value ===
      "string" &&
    (
      PAYMENT_VERIFICATION_STATUS as readonly string[]
    ).includes(
      value
    )
  );
};

export const isPaymentFulfillmentStatus = (
  value: unknown
): value is PaymentFulfillmentStatus => {
  return (
    typeof value ===
      "string" &&
    (
      PAYMENT_FULFILLMENT_STATUS as readonly string[]
    ).includes(
      value
    )
  );
};

/* =========================================================
   LABEL HELPERS
========================================================= */

export const getPaymentPurposeLabel = (
  purpose:
    | PaymentPurpose
    | string
    | null
    | undefined
): string => {
  if (
    purpose &&
    isPaymentPurpose(
      purpose
    )
  ) {
    return PAYMENT_PURPOSE_LABELS[
      purpose
    ];
  }

  return "—";
};

export const getPaymentMethodLabel = (
  method:
    | PaymentMethod
    | string
    | null
    | undefined
): string => {
  if (
    method &&
    isPaymentMethod(
      method
    )
  ) {
    return PAYMENT_METHOD_LABELS[
      method
    ];
  }

  return "—";
};

export const getPaymentProviderLabel = (
  provider:
    | PaymentProvider
    | string
    | null
    | undefined
): string => {
  if (
    provider &&
    isPaymentProvider(
      provider
    )
  ) {
    return PAYMENT_PROVIDER_LABELS[
      provider
    ];
  }

  return "—";
};

export const getPaymentStatusLabel = (
  status:
    | PaymentStatus
    | string
    | null
    | undefined
): string => {
  if (
    status &&
    isPaymentStatus(
      status
    )
  ) {
    return PAYMENT_STATUS_LABELS[
      status
    ];
  }

  return "—";
};

export const getPaymentVerificationStatusLabel = (
  status:
    | PaymentVerificationStatus
    | string
    | null
    | undefined
): string => {
  if (
    status &&
    isPaymentVerificationStatus(
      status
    )
  ) {
    return PAYMENT_VERIFICATION_STATUS_LABELS[
      status
    ];
  }

  return "—";
};

export const getPaymentFulfillmentStatusLabel = (
  status:
    | PaymentFulfillmentStatus
    | string
    | null
    | undefined
): string => {
  if (
    status &&
    isPaymentFulfillmentStatus(
      status
    )
  ) {
    return PAYMENT_FULFILLMENT_STATUS_LABELS[
      status
    ];
  }

  return "—";
};

/* =========================================================
   FORMAT AMOUNT
========================================================= */

export const formatPaymentAmount = (
  amount:
    | number
    | null
    | undefined,
  currency = "PKR"
): string => {
  if (
    amount === null ||
    amount === undefined ||
    !Number.isFinite(
      Number(
        amount
      )
    )
  ) {
    return "—";
  }

  const normalizedCurrency =
    String(
      currency ||
        "PKR"
    )
      .trim()
      .toUpperCase();

  try {
    return new Intl.NumberFormat(
      "en-PK",
      {
        style:
          "currency",

        currency:
          normalizedCurrency,

        maximumFractionDigits:
          2,
      }
    ).format(
      Number(
        amount
      )
    );
  } catch {
    return `${normalizedCurrency} ${Number(
      amount
    ).toLocaleString(
      "en-PK"
    )}`;
  }
};

/* =========================================================
   FORMAT DATE
========================================================= */

export const formatPaymentDate = (
  value:
    | string
    | Date
    | null
    | undefined
): string => {
  if (
    !value
  ) {
    return "—";
  }

  const date =
    value instanceof
    Date
      ? value
      : new Date(
          value
        );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    date
  );
};

/* =========================================================
   CUSTOMER NAME
========================================================= */

export const getPaymentCustomerName = (
  customer: Payment["customer"]
): string => {
  if (
    !customer
  ) {
    return "—";
  }

  if (
    typeof customer ===
    "string"
  ) {
    return customer;
  }

  return (
    customer.fullName ||
    customer.name ||
    customer.email ||
    "—"
  );
};

/* =========================================================
   SUPPLIER NAME
========================================================= */

export const getPaymentSupplierName = (
  supplier: Payment["supplier"]
): string => {
  if (
    !supplier
  ) {
    return "—";
  }

  if (
    typeof supplier ===
    "string"
  ) {
    return supplier;
  }

  return (
    supplier.companyName ||
    supplier.name ||
    supplier.supplierId ||
    "—"
  );
};

/* =========================================================
   ORDER NUMBER
========================================================= */

export const getPaymentOrderNumber = (
  order: Payment["order"]
): string => {
  if (
    !order
  ) {
    return "—";
  }

  if (
    typeof order ===
    "string"
  ) {
    return order;
  }

  return (
    order.orderNumber ||
    order.orderId ||
    order.id ||
    order._id ||
    "—"
  );
};

/* =========================================================
   PAYMENT HELPERS
========================================================= */

export const isManualBankTransferPayment = (
  payment: Payment
): boolean => {
  return (
    payment.paymentMethod ===
      "manual_bank_transfer" ||
    payment.provider ===
      "manual"
  );
};

export const isManualPaymentAwaitingVerification = (
  payment: Payment
): boolean => {
  return (
    isManualBankTransferPayment(
      payment
    ) &&
    payment.verificationStatus ===
      "pending"
  );
};

export const isPendingPayment = (
  payment: Payment
): boolean => {
  return (
    payment.status ===
    "pending"
  );
};

export const isPaidPayment = (
  payment: Payment
): boolean => {
  return (
    payment.status ===
    "paid"
  );
};

export const isRefundedPayment = (
  payment: Payment
): boolean => {
  return (
    payment.status ===
      "refunded" ||
    payment.status ===
      "partially_refunded"
  );
};

export const isRangeTokenPayment = (
  payment: Payment
): boolean => {
  return (
    payment.purpose ===
      "range_token_purchase" ||
    payment.purpose ===
      "range_token_subscription"
  );
};

export const isSupplierSubscriptionPayment = (
  payment: Payment
): boolean => {
  return (
    payment.purpose ===
    "supplier_subscription"
  );
};

export const isProductOrderPayment = (
  payment: Payment
): boolean => {
  return (
    payment.purpose ===
    "product_order"
  );
};

export const getPaymentOutstandingAmount = (
  payment: Payment
): number => {
  const amount =
    Number(
      payment.amount ||
        0
    );

  const refunded =
    Number(
      payment.refundedAmount ||
        0
    );

  return Math.max(
    amount -
      refunded,
    0
  );
};