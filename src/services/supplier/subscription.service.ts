import axios from "axios";

import api from "../api";

/* =========================================================
   SOLAR TRADE HUB
   DASHBOARD SUPPLIER SUBSCRIPTION SERVICE

   Backend base:

   /api/v1/suppliers/subscription

   IMPORTANT:

   Effective supplier permissions returned by backend are
   authoritative for marketplace access decisions.

   Legacy couponEligibility fields remain represented here
   only because the current backend still returns/accepts
   them. New dashboard/storefront UI should not expose
   Coupons.
========================================================= */

const BASE_PATH =
  "/suppliers/subscription";

/* =========================================================
   COMMON TYPES
========================================================= */

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type SupplierSummary = {
  _id: string;
  supplierId: string;
  companyName: string;

  status?:
    | "active"
    | "inactive"
    | "suspended"
    | string;

  verificationStatus?:
    | "pending"
    | "under_review"
    | "verified"
    | "rejected"
    | string;

  logo?: string;

  address?: {
    city?: string;
    country?: string;
  };
};

/* =========================================================
   SUBSCRIPTION PLAN TYPES
========================================================= */

export type SubscriptionPlanStatus =
  | "active"
  | "inactive"
  | "archived";

export type SubscriptionPlanBillingCycle =
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export type SubscriptionPlanBooleanFeature = {
  enabled: boolean;
};

export type SubscriptionPlanSupplierBidFeature = {
  enabled: boolean;
  maxReductionPercent: number;
};

export type SubscriptionPlanFeatures = {
  marketplaceListing:
    SubscriptionPlanBooleanFeature;

  supplierBid:
    SubscriptionPlanSupplierBidFeature;

  customerRange:
    SubscriptionPlanBooleanFeature;

  /**
   * Legacy backend compatibility only.
   *
   * Coupons have been removed from the current Solar Trade Hub
   * product direction, but the backend contract still contains
   * couponEligibility.
   *
   * Do not expose this in new UI.
   */
  couponEligibility?:
    SubscriptionPlanBooleanFeature;
};

export type SubscriptionPlan = {
  _id: string;
  id?: string;

  name: string;
  code: string;
  description?: string;

  status:
    SubscriptionPlanStatus;

  billingCycle:
    SubscriptionPlanBillingCycle;

  durationMonths: number;

  price: number;
  currency: string;

  unlimitedProducts: boolean;
  productLimit: number;

  features:
    SubscriptionPlanFeatures;

  sortOrder?: number;

  archivedAt?:
    | string
    | null;

  createdAt?: string;
  updatedAt?: string;

  productCapacity?: {
    unlimited: boolean;
    limit:
      | number
      | null;
  };
};

export type SubscriptionPlanListQuery = {
  page?: number;
  limit?: number;

  search?: string;

  status?:
    SubscriptionPlanStatus;
};

export type CreateSubscriptionPlanPayload = {
  name: string;

  code?: string;

  description?: string;

  status?:
    SubscriptionPlanStatus;

  billingCycle?:
    SubscriptionPlanBillingCycle;

  durationMonths: number;

  price?: number;

  currency?: string;

  unlimitedProducts?: boolean;

  productLimit?: number;

  features?: {
    marketplaceListing?: {
      enabled?: boolean;
    };

    supplierBid?: {
      enabled?: boolean;
      maxReductionPercent?: number;
    };

    customerRange?: {
      enabled?: boolean;
    };

    /**
     * Legacy backend compatibility only.
     * New UI should not expose Coupons.
     */
    couponEligibility?: {
      enabled?: boolean;
    };
  };

  sortOrder?: number;
};

export type UpdateSubscriptionPlanPayload =
  Partial<
    CreateSubscriptionPlanPayload
  >;

/* =========================================================
   SUPPLIER SUBSCRIPTION TYPES
========================================================= */

export type SupplierSubscriptionStatus =
  | "pending"
  | "active"
  | "expired"
  | "cancelled";

export type SupplierSubscriptionPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "waived";

export type SupplierSubscription = {
  _id: string;
  id?: string;

  supplier:
    | string
    | SupplierSummary;

  plan?:
    | string
    | SubscriptionPlan
    | null;

  planCode: string;

  planName?: string;

  durationMonths?: number;

  productLimit?:
    | number
    | null;

  unlimitedProducts?: boolean;

  status:
    SupplierSubscriptionStatus;

  paymentStatus:
    SupplierSubscriptionPaymentStatus;

  amount?:
    | number
    | null;

  currency?: string;

  paymentReference?: string;

  paidAt?:
    | string
    | null;

  startsAt?:
    | string
    | null;

  expiresAt?:
    | string
    | null;

  activatedAt?:
    | string
    | null;

  autoRenew?: boolean;

  renewedFrom?:
    | string
    | null;

  notes?: string;

  daysRemaining?: number;

  isCurrentlyActive?: boolean;

  effectiveStatus?: string;

  createdAt?: string;
  updatedAt?: string;
};

export type SupplierSubscriptionListQuery = {
  page?: number;
  limit?: number;

  status?:
    SupplierSubscriptionStatus;

  paymentStatus?:
    SupplierSubscriptionPaymentStatus;

  plan?: string;

  supplier?: string;
};

/* =========================================================
   FEATURE OVERRIDE TYPES
========================================================= */

export type SupplierFeatureOverrideMode =
  | "inherit"
  | "allow"
  | "deny";

export type SupplierProductCapacityOverrideMode =
  | "inherit"
  | "limited"
  | "unlimited";

export type SupplierFeatureOverride = {
  _id?: string;

  supplier?:
    | string
    | SupplierSummary;

  productCapacity?: {
    mode:
      SupplierProductCapacityOverrideMode;

    limit?:
      | number
      | null;
  };

  marketplaceListing?: {
    mode:
      SupplierFeatureOverrideMode;
  };

  supplierBid?: {
    mode:
      SupplierFeatureOverrideMode;

    maxReductionPercentOverride?:
      | number
      | null;
  };

  customerRange?: {
    mode:
      SupplierFeatureOverrideMode;
  };

  /**
   * Legacy backend compatibility only.
   */
  couponEligibility?: {
    mode:
      SupplierFeatureOverrideMode;
  };

  notes?: string;

  hasCustomOverrides?: boolean;

  overrideSummary?: unknown;

  createdAt?: string;
  updatedAt?: string;
};

export type UpdateSupplierFeatureOverridePayload = {
  productCapacity?: {
    mode:
      SupplierProductCapacityOverrideMode;

    limit?:
      | number
      | null;
  };

  marketplaceListing?:
    | SupplierFeatureOverrideMode
    | {
        mode:
          SupplierFeatureOverrideMode;
      };

  supplierBid?:
    | SupplierFeatureOverrideMode
    | {
        mode:
          SupplierFeatureOverrideMode;

        maxReductionPercentOverride?:
          | number
          | null;
      };

  customerRange?:
    | SupplierFeatureOverrideMode
    | {
        mode:
          SupplierFeatureOverrideMode;
      };

  /**
   * Legacy backend compatibility only.
   */
  couponEligibility?:
    | SupplierFeatureOverrideMode
    | {
        mode:
          SupplierFeatureOverrideMode;
      };

  notes?: string;
};

/* =========================================================
   EFFECTIVE PERMISSIONS

   IMPORTANT:
   This response is authoritative.

   Do not independently calculate marketplace eligibility
   from Supplier + Plan state in the frontend/storefront.
========================================================= */

export type EffectiveSupplierPermissions = {
  supplierId: string;

  supplierMongoId: string;

  eligible: boolean;

  gates: {
    supplierActive: boolean;
    supplierVerified: boolean;
    subscriptionActive: boolean;
  };

  blockingReasons: string[];

  subscription: {
    id: string;

    plan?:
      | string
      | null;

    planCode: string;

    planName?: string;

    startsAt?:
      | string
      | null;

    expiresAt?:
      | string
      | null;

    paymentStatus:
      SupplierSubscriptionPaymentStatus;

    daysRemaining?: number;
  } | null;

  plan: {
    id: string;
    code: string;
    name: string;
    status:
      SubscriptionPlanStatus;
  } | null;

  overrides: {
    hasCustomOverrides: boolean;

    marketplaceListing:
      SupplierFeatureOverrideMode;

    supplierBid:
      SupplierFeatureOverrideMode;

    customerRange:
      SupplierFeatureOverrideMode;

    /**
     * Legacy backend compatibility only.
     */
    couponEligibility?:
      SupplierFeatureOverrideMode;

    productCapacity:
      SupplierProductCapacityOverrideMode;
  };

  permissions: {
    marketplaceListing: boolean;

    supplierBid: {
      enabled: boolean;
      maxReductionPercent: number;
    };

    customerRange: boolean;

    /**
     * Legacy backend compatibility only.
     */
    couponEligibility?: boolean;

    productCapacity: {
      unlimited: boolean;

      limit:
        | number
        | null;
    };
  };
};

/* =========================================================
   OVERVIEW
========================================================= */

export type SupplierSubscriptionOverview = {
  supplier:
    SupplierSummary;

  activeSubscription:
    | SupplierSubscription
    | null;

  history:
    SupplierSubscription[];

  override:
    | SupplierFeatureOverride
    | null;
};

/* =========================================================
   ASSIGN / RENEW / PAYMENT PAYLOADS
========================================================= */

export type AssignSupplierSubscriptionPayload = {
  plan: string;

  status?:
    | "pending"
    | "active";

  paymentStatus?:
    SupplierSubscriptionPaymentStatus;

  amount?: number;

  currency?: string;

  paymentReference?: string;

  paidAt?:
    | string
    | null;

  startsAt?:
    | string
    | null;

  expiresAt?:
    | string
    | null;

  autoRenew?: boolean;

  notes?: string;
};

export type RenewSupplierSubscriptionPayload = {
  plan?: string;

  paymentStatus?:
    SupplierSubscriptionPaymentStatus;

  amount?: number;

  currency?: string;

  paymentReference?: string;

  paidAt?:
    | string
    | null;

  startsAt?:
    | string
    | null;

  expiresAt?:
    | string
    | null;

  autoRenew?: boolean;

  notes?: string;
};

export type UpdateSupplierSubscriptionPaymentPayload = {
  paymentStatus?:
    SupplierSubscriptionPaymentStatus;

  amount?: number;

  currency?: string;

  paymentReference?: string;

  paidAt?:
    | string
    | null;
};

export type CancelSupplierSubscriptionPayload = {
  notes?: string;
};

/* =========================================================
   API RESPONSE TYPES
========================================================= */

type PlanResponse = {
  success: boolean;
  message?: string;

  data: {
    plan:
      SubscriptionPlan;
  };
};

type PlanListResponse = {
  success: boolean;

  data: {
    plans:
      SubscriptionPlan[];

    pagination:
      Pagination;
  };
};

type SubscriptionResponse = {
  success: boolean;
  message?: string;

  data: {
    subscription:
      SupplierSubscription;
  };
};

type SubscriptionListResponse = {
  success: boolean;

  data: {
    subscriptions:
      SupplierSubscription[];

    pagination:
      Pagination;
  };
};

type SubscriptionOverviewResponse = {
  success: boolean;

  data:
    SupplierSubscriptionOverview;
};

type OverrideResponse = {
  success: boolean;
  message?: string;

  data: {
    override:
      SupplierFeatureOverride;

    effectivePermissions:
      EffectiveSupplierPermissions;
  };
};

type EffectivePermissionsResponse = {
  success: boolean;

  data: {
    permissions:
      EffectiveSupplierPermissions;
  };
};

type SyncSubscriptionResponse = {
  success: boolean;
  message?: string;

  data: {
    activeSubscription:
      | SupplierSubscription
      | null;
  };
};

/* =========================================================
   NORMALIZATION HELPERS
========================================================= */

const encodeReference = (
  value: string
) =>
  encodeURIComponent(
    value.trim()
  );

const normalizeNumber = (
  value: unknown,
  fallback = 0
) => {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
};

const normalizeNullableNumber = (
  value: unknown
):
  | number
  | null => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
};

const normalizePagination = (
  pagination:
    Partial<Pagination> |
    null |
    undefined,
  fallbackPage = 1,
  fallbackLimit = 20
): Pagination => {
  const page =
    Math.max(
      1,
      normalizeNumber(
        pagination?.page,
        fallbackPage
      )
    );

  const limit =
    Math.max(
      1,
      normalizeNumber(
        pagination?.limit,
        fallbackLimit
      )
    );

  const total =
    Math.max(
      0,
      normalizeNumber(
        pagination?.total,
        0
      )
    );

  const totalPages =
    Math.max(
      0,
      normalizeNumber(
        pagination?.totalPages,
        total === 0
          ? 0
          : Math.ceil(
              total /
                limit
            )
      )
    );

  return {
    page,
    limit,
    total,
    totalPages,

    hasNextPage:
      typeof pagination
        ?.hasNextPage ===
      "boolean"
        ? pagination.hasNextPage
        : page <
          totalPages,

    hasPreviousPage:
      typeof pagination
        ?.hasPreviousPage ===
      "boolean"
        ? pagination.hasPreviousPage
        : page > 1,
  };
};

const normalizePlan = (
  plan:
    SubscriptionPlan
):
  SubscriptionPlan => {
  const marketplaceListing =
    Boolean(
      plan.features
        ?.marketplaceListing
        ?.enabled
    );

  const supplierBid =
    Boolean(
      plan.features
        ?.supplierBid
        ?.enabled
    );

  const customerRange =
    Boolean(
      plan.features
        ?.customerRange
        ?.enabled
    );

  const normalizedPlan:
    SubscriptionPlan = {
    ...plan,

    id:
      plan.id ||
      plan._id,

    price:
      normalizeNumber(
        plan.price,
        0
      ),

    durationMonths:
      normalizeNumber(
        plan.durationMonths,
        0
      ),

    productLimit:
      normalizeNumber(
        plan.productLimit,
        0
      ),

    unlimitedProducts:
      Boolean(
        plan.unlimitedProducts
      ),

    features: {
      marketplaceListing: {
        enabled:
          marketplaceListing,
      },

      supplierBid: {
        enabled:
          supplierBid,

        maxReductionPercent:
          normalizeNumber(
            plan.features
              ?.supplierBid
              ?.maxReductionPercent,
            0
          ),
      },

      customerRange: {
        enabled:
          customerRange,
      },
    },
  };

  /*
   * Preserve the current backend legacy field only when it
   * exists in the response.
   *
   * New UI must not depend on it.
   */
  if (
    plan.features
      ?.couponEligibility
  ) {
    normalizedPlan.features
      .couponEligibility = {
      enabled:
        Boolean(
          plan.features
            .couponEligibility
            .enabled
        ),
    };
  }

  return normalizedPlan;
};

const normalizeSubscription = (
  subscription:
    SupplierSubscription
):
  SupplierSubscription => {
  return {
    ...subscription,

    id:
      subscription.id ||
      subscription._id,

    amount:
      normalizeNullableNumber(
        subscription.amount
      ),

    durationMonths:
      subscription
        .durationMonths ===
        undefined
        ? undefined
        : normalizeNumber(
            subscription
              .durationMonths,
            0
          ),

    productLimit:
      subscription.productLimit ===
        undefined
        ? undefined
        : normalizeNullableNumber(
            subscription
              .productLimit
          ),

    unlimitedProducts:
      Boolean(
        subscription
          .unlimitedProducts
      ),

    autoRenew:
      Boolean(
        subscription
          .autoRenew
      ),

    daysRemaining:
      subscription.daysRemaining ===
        undefined
        ? undefined
        : normalizeNumber(
            subscription
              .daysRemaining,
            0
          ),

    isCurrentlyActive:
      subscription
        .isCurrentlyActive ===
        undefined
        ? undefined
        : Boolean(
            subscription
              .isCurrentlyActive
          ),
  };
};

const normalizeOverview = (
  overview:
    SupplierSubscriptionOverview
):
  SupplierSubscriptionOverview => {
  return {
    ...overview,

    activeSubscription:
      overview.activeSubscription
        ? normalizeSubscription(
            overview.activeSubscription
          )
        : null,

    history:
      (
        overview.history ||
        []
      ).map(
        normalizeSubscription
      ),
  };
};

/* =========================================================
   PLAN API
========================================================= */

export const getSubscriptionPlans =
  async (
    query:
      SubscriptionPlanListQuery = {}
  ) => {
    const response =
      await api.get<PlanListResponse>(
        `${BASE_PATH}/plans`,
        {
          params:
            query,
        }
      );

    return {
      plans:
        (
          response.data.data
            .plans ||
          []
        ).map(
          normalizePlan
        ),

      pagination:
        normalizePagination(
          response.data.data
            .pagination,
          query.page ||
            1,
          query.limit ||
            20
        ),
    };
  };

export const getSubscriptionPlan =
  async (
    planReference: string
  ) => {
    const response =
      await api.get<PlanResponse>(
        `${BASE_PATH}/plans/${encodeReference(
          planReference
        )}`
      );

    return normalizePlan(
      response.data.data
        .plan
    );
  };

export const createSubscriptionPlan =
  async (
    payload:
      CreateSubscriptionPlanPayload
  ) => {
    const response =
      await api.post<PlanResponse>(
        `${BASE_PATH}/plans`,
        payload
      );

    return normalizePlan(
      response.data.data
        .plan
    );
  };

export const updateSubscriptionPlan =
  async (
    planReference: string,
    payload:
      UpdateSubscriptionPlanPayload
  ) => {
    const response =
      await api.patch<PlanResponse>(
        `${BASE_PATH}/plans/${encodeReference(
          planReference
        )}`,
        payload
      );

    return normalizePlan(
      response.data.data
        .plan
    );
  };

export const archiveSubscriptionPlan =
  async (
    planReference: string
  ) => {
    const response =
      await api.patch<PlanResponse>(
        `${BASE_PATH}/plans/${encodeReference(
          planReference
        )}/archive`
      );

    return normalizePlan(
      response.data.data
        .plan
    );
  };

/* =========================================================
   SUBSCRIPTION LIST / DETAIL
========================================================= */

export const getSupplierSubscriptions =
  async (
    query:
      SupplierSubscriptionListQuery = {}
  ) => {
    const response =
      await api.get<SubscriptionListResponse>(
        `${BASE_PATH}/subscriptions`,
        {
          params:
            query,
        }
      );

    return {
      subscriptions:
        (
          response.data.data
            .subscriptions ||
          []
        ).map(
          normalizeSubscription
        ),

      pagination:
        normalizePagination(
          response.data.data
            .pagination,
          query.page ||
            1,
          query.limit ||
            25
        ),
    };
  };

export const getSupplierSubscription =
  async (
    subscriptionId: string
  ) => {
    const response =
      await api.get<SubscriptionResponse>(
        `${BASE_PATH}/subscriptions/${encodeReference(
          subscriptionId
        )}`
      );

    return normalizeSubscription(
      response.data.data
        .subscription
    );
  };

/* =========================================================
   SUPPLIER SUBSCRIPTION CONTROL CENTER
========================================================= */

export const getSupplierSubscriptionOverview =
  async (
    supplierReference: string
  ) => {
    const response =
      await api.get<SubscriptionOverviewResponse>(
        `${BASE_PATH}/suppliers/${encodeReference(
          supplierReference
        )}`
      );

    return normalizeOverview(
      response.data.data
    );
  };

export const assignSupplierSubscription =
  async (
    supplierReference: string,
    payload:
      AssignSupplierSubscriptionPayload
  ) => {
    const response =
      await api.post<SubscriptionResponse>(
        `${BASE_PATH}/suppliers/${encodeReference(
          supplierReference
        )}/assign`,
        payload
      );

    return normalizeSubscription(
      response.data.data
        .subscription
    );
  };

export const renewSupplierSubscription =
  async (
    supplierReference: string,
    payload:
      RenewSupplierSubscriptionPayload = {}
  ) => {
    const response =
      await api.post<SubscriptionResponse>(
        `${BASE_PATH}/suppliers/${encodeReference(
          supplierReference
        )}/renew`,
        payload
      );

    return normalizeSubscription(
      response.data.data
        .subscription
    );
  };

/* =========================================================
   PAYMENT / CANCELLATION
========================================================= */

export const updateSupplierSubscriptionPayment =
  async (
    subscriptionId: string,
    payload:
      UpdateSupplierSubscriptionPaymentPayload
  ) => {
    const response =
      await api.patch<SubscriptionResponse>(
        `${BASE_PATH}/subscriptions/${encodeReference(
          subscriptionId
        )}/payment`,
        payload
      );

    return normalizeSubscription(
      response.data.data
        .subscription
    );
  };

export const cancelSupplierSubscription =
  async (
    subscriptionId: string,
    payload:
      CancelSupplierSubscriptionPayload = {}
  ) => {
    const response =
      await api.patch<SubscriptionResponse>(
        `${BASE_PATH}/subscriptions/${encodeReference(
          subscriptionId
        )}/cancel`,
        payload
      );

    return normalizeSubscription(
      response.data.data
        .subscription
    );
  };

/* =========================================================
   SUPPLIER OVERRIDES
========================================================= */

export const updateSupplierFeatureOverrides =
  async (
    supplierReference: string,
    payload:
      UpdateSupplierFeatureOverridePayload
  ) => {
    const response =
      await api.patch<OverrideResponse>(
        `${BASE_PATH}/suppliers/${encodeReference(
          supplierReference
        )}/overrides`,
        payload
      );

    return response.data.data;
  };

/* =========================================================
   EFFECTIVE SUPPLIER PERMISSIONS

   Authoritative backend response.
========================================================= */

export const getEffectiveSupplierPermissions =
  async (
    supplierReference: string
  ) => {
    const response =
      await api.get<EffectivePermissionsResponse>(
        `${BASE_PATH}/suppliers/${encodeReference(
          supplierReference
        )}/permissions`
      );

    return response.data.data
      .permissions;
  };

/* =========================================================
   SYNC SUBSCRIPTION STATE

   Backend handles:
   - expired subscriptions
   - paid / waived due renewals
========================================================= */

export const syncSupplierSubscriptionState =
  async (
    supplierReference: string
  ) => {
    const response =
      await api.post<SyncSubscriptionResponse>(
        `${BASE_PATH}/suppliers/${encodeReference(
          supplierReference
        )}/sync`
      );

    const subscription =
      response.data.data
        .activeSubscription;

    return subscription
      ? normalizeSubscription(
          subscription
        )
      : null;
  };

/* =========================================================
   DISPLAY HELPERS
========================================================= */

export const formatSubscriptionStatus =
  (
    value:
      | string
      | null
      | undefined
  ) => {
    if (!value) {
      return "";
    }

    return value
      .split("_")
      .filter(Boolean)
      .map(
        (
          word
        ) =>
          word
            .charAt(0)
            .toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  };

export const formatSubscriptionPlanName =
  (
    value:
      | string
      | null
      | undefined
  ) => {
    if (!value) {
      return "";
    }

    return value
      .split(
        /[_-]/
      )
      .filter(Boolean)
      .map(
        (
          word
        ) =>
          word
            .charAt(0)
            .toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  };

/* =========================================================
   ERROR MESSAGE
========================================================= */

type SubscriptionErrorBody = {
  message?: string;

  error?: string;

  code?: string;

  errors?: Array<{
    field?: string;
    message?: string;
  }>;
};

export const getSubscriptionErrorMessage =
  (
    error: unknown,

    fallback =
      "Something went wrong while processing the subscription."
  ) => {
    if (
      axios.isAxiosError<SubscriptionErrorBody>(
        error
      )
    ) {
      const body =
        error.response?.data;

      const firstValidationError =
        body?.errors?.find(
          (
            item
          ) =>
            Boolean(
              item?.message
            )
        )?.message;

      return (
        firstValidationError ||
        body?.message ||
        body?.error ||
        error.message ||
        fallback
      );
    }

    if (
      error instanceof Error
    ) {
      return (
        error.message ||
        fallback
      );
    }

    return fallback;
  };

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const subscriptionService = {
  getSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  archiveSubscriptionPlan,

  getSupplierSubscriptions,
  getSupplierSubscription,

  getSupplierSubscriptionOverview,
  assignSupplierSubscription,
  renewSupplierSubscription,

  updateSupplierSubscriptionPayment,
  cancelSupplierSubscription,

  updateSupplierFeatureOverrides,

  getEffectiveSupplierPermissions,

  syncSupplierSubscriptionState,

  formatSubscriptionStatus,
  formatSubscriptionPlanName,

  getSubscriptionErrorMessage,
};

export default subscriptionService;