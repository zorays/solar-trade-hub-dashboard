import axios from "axios";
import api from "../../api";

/* =========================================================
   SOLAR TRADE HUB
   CUSTOMER REQUEST / CUSTOMER RANGE SERVICE

   Backend base:
   /api/v1/marketplace/customer-requests

   BUSINESS RULES

   - Customer chooses 1%, 2%, or 3% reduction.
   - Backend calculates authoritative targetPrice.
   - Backend determines token cost.
   - Backend deducts Range Tokens.
   - Frontend must not calculate authoritative target price.
   - Supplier Bid is separate from Customer Range.
   - Legacy targetType/min/max fields remain optional only
     for older-record/UI compatibility.
========================================================= */

const BASE_PATH =
  "/marketplace/customer-requests";

/* =========================================================
   STATUS TYPES
========================================================= */

export type CustomerRequestStatus =
  | "new"
  | "open"
  | "matched"
  | "fulfilled"
  | "closed"
  | "expired";

export type CustomerRequestOfferStatus =
  | "submitted"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "expired";

/**
 * Legacy compatibility only.
 * Current Customer Range uses one exact backend-generated
 * targetPrice instead of frontend min/max ranges.
 */
export type CustomerRequestTargetType =
  | "exact"
  | "range";

/* =========================================================
   CUSTOMER
========================================================= */

export type CustomerRequestCustomer = {
  _id?: string;
  id?: string;

  name?: string;
  email?: string;

  phone?: string;
  phoneE164?: string;

  accountType?: string;
  status?: string;
};

export type CustomerRequestCustomerSnapshot = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

/* =========================================================
   PRODUCT SNAPSHOT
========================================================= */

export type CustomerRequestProductSnapshot = {
  name?: string | null;
  type?: string | null;
  category?: string | null;
  brand?: string | null;

  size?: number | null;
  unit?: string | null;

  imageUrl?: string | null;

  externalRateUpdatedAt?:
    | string
    | null;
};

/* =========================================================
   SUPPLIER
========================================================= */

export type CustomerRequestSupplier = {
  _id?: string;
  id?: string;

  supplierId?: string;
  companyName?: string;

  status?: string;
  verificationStatus?: string;

  city?: string;

  address?: {
    city?: string;
    [key: string]: unknown;
  };

  logo?: string;
};

export type CustomerRequestSupplierSnapshot = {
  supplierId?:
    | string
    | null;

  companyName?:
    | string
    | null;

  city?:
    | string
    | null;
};

/* =========================================================
   USER / ACTOR
========================================================= */

export type CustomerRequestActor = {
  _id?: string;
  id?: string;

  name?: string;
  email?: string;
};

/* =========================================================
   REQUEST
========================================================= */

export type CustomerRequest = {
  _id: string;
  id?: string;

  customer:
    | string
    | CustomerRequestCustomer
    | null;

  customerSnapshot?:
    CustomerRequestCustomerSnapshot;

  externalProductId: string;

  productSnapshot?:
    CustomerRequestProductSnapshot;

  /**
   * Legacy/compatibility helper.
   * Prefer productSnapshot.name.
   */
  productName?: string;

  quantity: number;

  /**
   * Current Customer Range target.
   *
   * Calculated by backend from external catalogue base rate
   * and requested reduction percentage.
   */
  targetPrice?:
    | number
    | null;

  /**
   * Current Customer Range reduction.
   * Supported values: 1, 2, 3.
   */
  reductionPercent?:
    | number
    | null;

  /**
   * Tokens consumed by this request.
   *
   * 1% = 1 token
   * 2% = 2 tokens
   * 3% = 3 tokens
   */
  rangeTokensUsed?:
    | number
    | null;

  currency?: string;
  city?: string;

  notes?: string;
  adminNote?: string;

  status:
    CustomerRequestStatus;

  eligibleSuppliers?:
    CustomerRequestSupplier[];

  invitedSuppliers?:
    CustomerRequestSupplier[];

  eligibleSupplierCount?: number;
  invitedSupplierCount?: number;

  offersCount?: number;

  routingEvaluatedAt?:
    | string
    | null;

  selectedOffer?:
    | string
    | CustomerRequestOffer
    | null;

  fulfilledSupplier?:
    | string
    | CustomerRequestSupplier
    | null;

  expiresAt?:
    | string
    | null;

  fulfilledAt?:
    | string
    | null;

  closedAt?:
    | string
    | null;

  createdAt: string;
  updatedAt: string;

  /* =======================================================
     LEGACY COMPATIBILITY

     Do not use these fields for new Customer Range logic.
  ======================================================= */

  targetType?:
    CustomerRequestTargetType;

  targetMinPrice?:
    | number
    | null;

  targetMaxPrice?:
    | number
    | null;

  selectedSupplier?:
    unknown;
};

/* =========================================================
   OFFER PERMISSION SNAPSHOT
========================================================= */

export type CustomerRequestOfferPermissionSnapshot = {
  customerRangeEnabled?: boolean;

  subscriptionId?:
    | string
    | null;

  planCode?:
    | string
    | null;
};

/* =========================================================
   OFFER
========================================================= */

export type CustomerRequestOffer = {
  _id: string;
  id?: string;

  request?:
    | string
    | CustomerRequest
    | null;

  supplier?:
    | string
    | CustomerRequestSupplier
    | null;

  supplierSnapshot?:
    CustomerRequestSupplierSnapshot;

  externalProductId?: string;

  quantity?: number;

  offerRate: number;

  currency?: string;

  externalBaseRate?:
    | number
    | null;

  /**
   * Exact Customer Range target captured for this offer.
   */
  targetPrice?:
    | number
    | null;

  permissionSnapshot?:
    CustomerRequestOfferPermissionSnapshot;

  validFrom?:
    | string
    | null;

  validUntil?:
    | string
    | null;

  supplierNote?: string;

  adminNote?:
    | string
    | null;

  status:
    CustomerRequestOfferStatus;

  isCurrent?: boolean;

  submittedBy?:
    | string
    | CustomerRequestActor
    | null;

  acceptedBy?:
    | string
    | CustomerRequestActor
    | null;

  acceptedAt?:
    | string
    | null;

  rejectedAt?:
    | string
    | null;

  withdrawnAt?:
    | string
    | null;

  createdAt: string;
  updatedAt: string;

  /* Legacy compatibility only */

  targetType?:
    CustomerRequestTargetType;

  targetMinPrice?:
    | number
    | null;

  targetMaxPrice?:
    | number
    | null;
};

/* =========================================================
   REQUEST LIST QUERY
========================================================= */

export type CustomerRequestListQuery = {
  page?: number;
  limit?: number;

  status?:
    CustomerRequestStatus;

  customer?: string;

  externalProductId?: string;

  city?: string;
  search?: string;

  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "quantity"
    | "status"
    | "expiresAt";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   OFFER LIST QUERY
========================================================= */

export type CustomerRequestOfferListQuery = {
  page?: number;
  limit?: number;

  status?:
    CustomerRequestOfferStatus;

  isCurrent?: boolean;

  supplier?: string;

  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "offerRate"
    | "status"
    | "validUntil";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   PAGINATION
========================================================= */

export type CustomerRequestPagination = {
  page: number;
  limit: number;

  total: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/* =========================================================
   SUMMARY
========================================================= */

export type CustomerRequestSummary = {
  total: number;

  new: number;
  open: number;
  matched: number;

  fulfilled: number;
  closed: number;
  expired: number;

  offersSubmitted: number;
};

/* =========================================================
   CREATE CUSTOMER RANGE REQUEST

   Backend determines targetPrice and token debit.
========================================================= */

export type CreateCustomerRequestPayload = {
  externalProductId: string;

  quantity: number;

  reductionPercent:
    | 1
    | 2
    | 3;

  currency?: string;
  city?: string;

  notes?: string;

  expiresAt?: string;
};

export type CustomerRangeTokenResult = {
  reductionPercent: number;

  tokensUsed: number;

  targetPrice: number;

  basePrice: number;
};

/* =========================================================
   ACTION PAYLOADS
========================================================= */

export type ReviewCustomerRequestPayload = {
  status:
    | "open"
    | "closed";

  adminNote?: string;
};

export type InviteCustomerRequestSuppliersPayload = {
  supplierIds: string[];
};

export type SubmitCustomerRequestOfferPayload = {
  quantity?: number;

  offerRate: number;

  currency?: string;

  validFrom?: string;
  validUntil?: string;

  supplierNote?: string;
};

export type AcceptCustomerRequestOfferPayload = {
  adminNote?: string;
};

/* =========================================================
   EVALUATION RESULT
========================================================= */

export type CustomerRequestExcludedSupplier = {
  supplier?:
    | string
    | CustomerRequestSupplier
    | null;

  supplierId?: string;

  companyName?: string;

  eligible?: boolean;

  reasons?: string[];

  blockingReasons?: string[];

  [key: string]:
    unknown;
};

export type CustomerRequestSupplierEvaluation = {
  request:
    CustomerRequest;

  eligibleSuppliers:
    CustomerRequestSupplier[];

  excludedSuppliers:
    CustomerRequestExcludedSupplier[];
};

/* =========================================================
   DETAIL RESULT
========================================================= */

export type CustomerRequestDetail = {
  request:
    CustomerRequest;

  offers:
    CustomerRequestOffer[];
};

/* =========================================================
   EXPIRE RESULT
========================================================= */

export type ExpireCustomerRequestsResult = {
  requests?: unknown;
  offers?: unknown;

  [key: string]:
    unknown;
};

/* =========================================================
   API RESPONSE TYPES
========================================================= */

type CustomerRequestListApiResponse = {
  success: boolean;
  message?: string;

  data: {
    requests?:
      CustomerRequest[];

    pagination?:
      CustomerRequestPagination;
  };
};

type CustomerRequestSummaryApiResponse = {
  success: boolean;
  message?: string;

  data: {
    summary:
      CustomerRequestSummary;
  };
};

type CustomerRequestDetailApiResponse = {
  success: boolean;
  message?: string;

  data: {
    request:
      CustomerRequest;

    offers?:
      CustomerRequestOffer[];
  };
};

type CreateCustomerRequestApiResponse = {
  success: boolean;
  message?: string;

  data: {
    request:
      CustomerRequest;

    offers?:
      CustomerRequestOffer[];

    rangeToken?:
      | CustomerRangeTokenResult
      | null;
  };
};

type CustomerRequestEvaluationApiResponse = {
  success: boolean;
  message?: string;

  data: {
    request:
      CustomerRequest;

    eligibleSuppliers?:
      CustomerRequestSupplier[];

    excludedSuppliers?:
      CustomerRequestExcludedSupplier[];
  };
};

type CustomerRequestOfferApiResponse = {
  success: boolean;
  message?: string;

  data: {
    offer:
      CustomerRequestOffer;
  };
};

type CustomerRequestOfferListApiResponse = {
  success: boolean;
  message?: string;

  data: {
    offers?:
      CustomerRequestOffer[];

    pagination?:
      CustomerRequestPagination;
  };
};

type ExpireCustomerRequestsResponse = {
  success: boolean;
  message?: string;

  data?:
    ExpireCustomerRequestsResult;
};

/* =========================================================
   GENERIC HELPERS
========================================================= */

const encodeReference = (
  value:
    string
) =>
  encodeURIComponent(
    value.trim()
  );

const normalizeNumber = (
  value:
    unknown,

  fallback =
    0
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
  value:
    unknown
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

/* =========================================================
   PAGINATION NORMALIZER
========================================================= */

const normalizePagination = (
  pagination:
    | Partial<CustomerRequestPagination>
    | null
    | undefined,

  fallbackPage =
    1,

  fallbackLimit =
    20
):
  CustomerRequestPagination => {
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

        total ===
          0
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
        ? pagination
            .hasNextPage
        : page <
          totalPages,

    hasPreviousPage:
      typeof pagination
        ?.hasPreviousPage ===
      "boolean"
        ? pagination
            .hasPreviousPage
        : page >
          1,
  };
};

/* =========================================================
   SUPPLIER NORMALIZER
========================================================= */

const normalizeSupplier = (
  supplier:
    CustomerRequestSupplier
):
  CustomerRequestSupplier => {
  const internalId =
    supplier?._id ||
    supplier?.id ||
    "";

  return {
    ...supplier,

    _id:
      internalId,

    id:
      internalId,

    supplierId:
      supplier
        ?.supplierId ||
      "",

    companyName:
      supplier
        ?.companyName ||
      "",

    status:
      supplier?.status ||
      "",

    verificationStatus:
      supplier
        ?.verificationStatus ||
      "",

    /*
     * Backend supplier population can expose address.city.
     * Keep city flattened for dashboard compatibility.
     */
    city:
      supplier?.city ||
      supplier
        ?.address
        ?.city ||
      "",

    address:
      supplier?.address,

    logo:
      supplier?.logo ||
      "",
  };
};

/* =========================================================
   CUSTOMER NORMALIZER
========================================================= */

const normalizeCustomer = (
  customer:
    CustomerRequestCustomer
):
  CustomerRequestCustomer => {
  const internalId =
    customer?._id ||
    customer?.id ||
    "";

  return {
    ...customer,

    _id:
      internalId,

    id:
      internalId,

    name:
      customer?.name ||
      "",

    email:
      customer?.email ||
      "",

    phone:
      customer?.phone ||
      "",

    phoneE164:
      customer
        ?.phoneE164 ||
      "",

    accountType:
      customer
        ?.accountType ||
      "",

    status:
      customer?.status ||
      "",
  };
};

/* =========================================================
   CUSTOMER REQUEST NORMALIZER
========================================================= */

export const normalizeCustomerRequest = (
  request:
    CustomerRequest
):
  CustomerRequest => {
  const internalId =
    request?._id ||
    request?.id ||
    "";

  const eligibleSuppliers =
    Array.isArray(
      request
        ?.eligibleSuppliers
    )
      ? request
          .eligibleSuppliers
          .map(
            normalizeSupplier
          )
      : [];

  const invitedSuppliers =
    Array.isArray(
      request
        ?.invitedSuppliers
    )
      ? request
          .invitedSuppliers
          .map(
            normalizeSupplier
          )
      : [];

  const normalizedCustomer =
    request?.customer &&
    typeof request.customer !==
      "string"
      ? normalizeCustomer(
          request.customer
        )
      : request
          ?.customer ??
        null;

  let fulfilledSupplier =
    request
      ?.fulfilledSupplier ??
    null;

  if (
    fulfilledSupplier &&
    typeof fulfilledSupplier !==
      "string"
  ) {
    fulfilledSupplier =
      normalizeSupplier(
        fulfilledSupplier
      );
  }

  return {
    ...request,

    _id:
      internalId,

    id:
      internalId,

    customer:
      normalizedCustomer,

    externalProductId:
      String(
        request
          ?.externalProductId ||
          ""
      ),

    productSnapshot: {
      ...request
        ?.productSnapshot,

      name:
        request
          ?.productSnapshot
          ?.name ??
        request
          ?.productName ??
        null,

      type:
        request
          ?.productSnapshot
          ?.type ??
        null,

      category:
        request
          ?.productSnapshot
          ?.category ??
        null,

      brand:
        request
          ?.productSnapshot
          ?.brand ??
        null,

      size:
        normalizeNullableNumber(
          request
            ?.productSnapshot
            ?.size
        ),

      unit:
        request
          ?.productSnapshot
          ?.unit ??
        null,

      imageUrl:
        request
          ?.productSnapshot
          ?.imageUrl ??
        null,

      externalRateUpdatedAt:
        request
          ?.productSnapshot
          ?.externalRateUpdatedAt ??
        null,
    },

    productName:
      request
        ?.productName ||
      request
        ?.productSnapshot
        ?.name ||
      "",

    quantity:
      normalizeNumber(
        request?.quantity,
        0
      ),

    targetPrice:
      normalizeNullableNumber(
        request
          ?.targetPrice
      ),

    reductionPercent:
      normalizeNullableNumber(
        request
          ?.reductionPercent
      ),

    rangeTokensUsed:
      normalizeNullableNumber(
        request
          ?.rangeTokensUsed
      ),

    currency:
      String(
        request?.currency ||
          "PKR"
      ).toUpperCase(),

    city:
      request?.city ||
      "",

    notes:
      request?.notes ||
      "",

    adminNote:
      request
        ?.adminNote ||
      "",

    status:
      request?.status ||
      "new",

    eligibleSuppliers,

    invitedSuppliers,

    eligibleSupplierCount:
      normalizeNumber(
        request
          ?.eligibleSupplierCount,
        eligibleSuppliers.length
      ),

    invitedSupplierCount:
      normalizeNumber(
        request
          ?.invitedSupplierCount,
        invitedSuppliers.length
      ),

    offersCount:
      normalizeNumber(
        request?.offersCount,
        0
      ),

    routingEvaluatedAt:
      request
        ?.routingEvaluatedAt ??
      null,

    selectedOffer:
      request
        ?.selectedOffer ??
      null,

    fulfilledSupplier,

    expiresAt:
      request?.expiresAt ??
      null,

    fulfilledAt:
      request?.fulfilledAt ??
      null,

    closedAt:
      request?.closedAt ??
      null,

    createdAt:
      request
        ?.createdAt ||
      "",

    updatedAt:
      request
        ?.updatedAt ||
      "",

    /* Legacy compatibility */

    targetType:
      request
        ?.targetType,

    targetMinPrice:
      normalizeNullableNumber(
        request
          ?.targetMinPrice
      ),

    targetMaxPrice:
      normalizeNullableNumber(
        request
          ?.targetMaxPrice
      ),
  };
};

/* =========================================================
   OFFER NORMALIZER
========================================================= */

export const normalizeCustomerRequestOffer = (
  offer:
    CustomerRequestOffer
):
  CustomerRequestOffer => {
  const internalId =
    offer?._id ||
    offer?.id ||
    "";

  let supplier =
    offer?.supplier ??
    null;

  if (
    supplier &&
    typeof supplier !==
      "string"
  ) {
    supplier =
      normalizeSupplier(
        supplier
      );
  }

  let request =
    offer?.request ??
    null;

  if (
    request &&
    typeof request !==
      "string"
  ) {
    request =
      normalizeCustomerRequest(
        request
      );
  }

  return {
    ...offer,

    _id:
      internalId,

    id:
      internalId,

    request,

    supplier,

    externalProductId:
      offer
        ?.externalProductId ||
      (
        typeof request !==
          "string"
          ? request
              ?.externalProductId
          : ""
      ) ||
      "",

    quantity:
      offer?.quantity ===
        undefined
        ? undefined
        : normalizeNumber(
            offer.quantity,
            0
          ),

    offerRate:
      normalizeNumber(
        offer?.offerRate,
        0
      ),

    currency:
      String(
        offer?.currency ||
          "PKR"
      ).toUpperCase(),

    externalBaseRate:
      normalizeNullableNumber(
        offer
          ?.externalBaseRate
      ),

    targetPrice:
      normalizeNullableNumber(
        offer
          ?.targetPrice
      ),

    permissionSnapshot: {
      ...offer
        ?.permissionSnapshot,

      customerRangeEnabled:
        Boolean(
          offer
            ?.permissionSnapshot
            ?.customerRangeEnabled
        ),

      subscriptionId:
        offer
          ?.permissionSnapshot
          ?.subscriptionId ??
        null,

      planCode:
        offer
          ?.permissionSnapshot
          ?.planCode ??
        null,
    },

    validFrom:
      offer?.validFrom ??
      null,

    validUntil:
      offer?.validUntil ??
      null,

    supplierNote:
      offer
        ?.supplierNote ||
      "",

    adminNote:
      offer?.adminNote ??
      null,

    status:
      offer?.status ||
      "submitted",

    isCurrent:
      Boolean(
        offer?.isCurrent
      ),

    acceptedAt:
      offer?.acceptedAt ??
      null,

    rejectedAt:
      offer?.rejectedAt ??
      null,

    withdrawnAt:
      offer?.withdrawnAt ??
      null,

    createdAt:
      offer?.createdAt ||
      "",

    updatedAt:
      offer?.updatedAt ||
      "",

    targetMinPrice:
      normalizeNullableNumber(
        offer
          ?.targetMinPrice
      ),

    targetMaxPrice:
      normalizeNullableNumber(
        offer
          ?.targetMaxPrice
      ),
  };
};

/* =========================================================
   DETAIL NORMALIZER
========================================================= */

const normalizeDetail = (
  request:
    CustomerRequest,

  offers:
    CustomerRequestOffer[] =
      []
):
  CustomerRequestDetail => ({
  request:
    normalizeCustomerRequest(
      request
    ),

  offers:
    Array.isArray(
      offers
    )
      ? offers.map(
          normalizeCustomerRequestOffer
        )
      : [],
});

/* =========================================================
   CREATE CUSTOMER RANGE REQUEST

   POST
   /marketplace/customer-requests/customers/:customerReference

   Dashboard/admin route.

   IMPORTANT:
   Storefront customer flow should ultimately use a
   customer-authenticated self-service route rather than
   weakening dashboard middleware.
========================================================= */

export const createCustomerRequest =
  async (
    customerReference:
      string,

    payload:
      CreateCustomerRequestPayload
  ) => {
    const response =
      await api.post<CreateCustomerRequestApiResponse>(
        `${BASE_PATH}/customers/${encodeReference(
          customerReference
        )}`,
        payload
      );

    const request =
      response.data.data
        ?.request;

    if (!request) {
      throw new Error(
        "Customer request response did not include a request."
      );
    }

    return {
      ...normalizeDetail(
        request,
        response.data.data
          ?.offers ||
          []
      ),

      rangeToken:
        response.data.data
          ?.rangeToken ??
        null,
    };
  };

/* =========================================================
   GET CUSTOMER REQUESTS

   GET /marketplace/customer-requests
========================================================= */

export const getCustomerRequests =
  async (
    query:
      CustomerRequestListQuery = {}
  ) => {
    const response =
      await api.get<CustomerRequestListApiResponse>(
        BASE_PATH,
        {
          params:
            query,
        }
      );

    const requests =
      response.data.data
        ?.requests ||
      [];

    return {
      requests:
        requests.map(
          normalizeCustomerRequest
        ),

      pagination:
        normalizePagination(
          response.data.data
            ?.pagination,

          query.page ||
            1,

          query.limit ||
            20
        ),
    };
  };

/* =========================================================
   GET CUSTOMER REQUEST SUMMARY

   GET /marketplace/customer-requests/summary
========================================================= */

export const getCustomerRequestSummary =
  async () => {
    const response =
      await api.get<CustomerRequestSummaryApiResponse>(
        `${BASE_PATH}/summary`
      );

    const summary =
      response.data.data
        ?.summary;

    return {
      total:
        normalizeNumber(
          summary?.total,
          0
        ),

      new:
        normalizeNumber(
          summary?.new,
          0
        ),

      open:
        normalizeNumber(
          summary?.open,
          0
        ),

      matched:
        normalizeNumber(
          summary?.matched,
          0
        ),

      fulfilled:
        normalizeNumber(
          summary
            ?.fulfilled,
          0
        ),

      closed:
        normalizeNumber(
          summary?.closed,
          0
        ),

      expired:
        normalizeNumber(
          summary?.expired,
          0
        ),

      offersSubmitted:
        normalizeNumber(
          summary
            ?.offersSubmitted,
          0
        ),
    } satisfies
      CustomerRequestSummary;
  };

/* =========================================================
   GET CUSTOMER REQUEST DETAIL + OFFERS

   GET /marketplace/customer-requests/:requestId
========================================================= */

export const getCustomerRequest =
  async (
    requestId:
      string
  ) => {
    const response =
      await api.get<CustomerRequestDetailApiResponse>(
        `${BASE_PATH}/${encodeReference(
          requestId
        )}`
      );

    const request =
      response.data.data
        ?.request;

    if (!request) {
      throw new Error(
        "Customer request response did not include a request."
      );
    }

    return normalizeDetail(
      request,
      response.data.data
        ?.offers ||
        []
    );
  };

/* =========================================================
   REVIEW / OPEN / CLOSE REQUEST

   PATCH
   /marketplace/customer-requests/:requestId/review
========================================================= */

export const reviewCustomerRequest =
  async (
    requestId:
      string,

    payload:
      ReviewCustomerRequestPayload
  ) => {
    const response =
      await api.patch<CustomerRequestDetailApiResponse>(
        `${BASE_PATH}/${encodeReference(
          requestId
        )}/review`,
        payload
      );

    const request =
      response.data.data
        ?.request;

    if (!request) {
      throw new Error(
        "Customer request review response did not include a request."
      );
    }

    return normalizeDetail(
      request,
      response.data.data
        ?.offers ||
        []
    );
  };

/* =========================================================
   EVALUATE ELIGIBLE SUPPLIERS

   POST
   /marketplace/customer-requests/:requestId/evaluate-suppliers

   Backend re-runs live gates:
   - supplier active
   - supplier verified
   - active supplier subscription
   - Customer Range entitlement
   - external product access
========================================================= */

export const evaluateCustomerRequestSuppliers =
  async (
    requestId:
      string
  ) => {
    const response =
      await api.post<CustomerRequestEvaluationApiResponse>(
        `${BASE_PATH}/${encodeReference(
          requestId
        )}/evaluate-suppliers`
      );

    const request =
      response.data.data
        ?.request;

    if (!request) {
      throw new Error(
        "Supplier evaluation response did not include the customer request."
      );
    }

    return {
      request:
        normalizeCustomerRequest(
          request
        ),

      eligibleSuppliers:
        (
          response.data.data
            ?.eligibleSuppliers ||
          []
        ).map(
          normalizeSupplier
        ),

      excludedSuppliers:
        response.data.data
          ?.excludedSuppliers ||
        [],
    } satisfies
      CustomerRequestSupplierEvaluation;
  };

/* =========================================================
   INVITE SUPPLIERS

   POST
   /marketplace/customer-requests/:requestId/invite-suppliers

   Empty supplierIds means invite all suppliers currently
   eligible according to backend evaluation.
========================================================= */

export const inviteCustomerRequestSuppliers =
  async (
    requestId:
      string,

    supplierIds:
      string[] =
      []
  ) => {
    const response =
      await api.post<CustomerRequestDetailApiResponse>(
        `${BASE_PATH}/${encodeReference(
          requestId
        )}/invite-suppliers`,
        {
          supplierIds,
        } satisfies
          InviteCustomerRequestSuppliersPayload
      );

    const request =
      response.data.data
        ?.request;

    if (!request) {
      throw new Error(
        "Supplier invitation response did not include the customer request."
      );
    }

    return normalizeDetail(
      request,
      response.data.data
        ?.offers ||
        []
    );
  };

/* =========================================================
   GET REQUEST OFFERS

   GET
   /marketplace/customer-requests/:requestId/offers
========================================================= */

export const getCustomerRequestOffers =
  async (
    requestId:
      string,

    query:
      CustomerRequestOfferListQuery = {}
  ) => {
    const response =
      await api.get<CustomerRequestOfferListApiResponse>(
        `${BASE_PATH}/${encodeReference(
          requestId
        )}/offers`,
        {
          params:
            query,
        }
      );

    const offers =
      response.data.data
        ?.offers ||
      [];

    return {
      offers:
        offers.map(
          normalizeCustomerRequestOffer
        ),

      pagination:
        normalizePagination(
          response.data.data
            ?.pagination,

          query.page ||
            1,

          query.limit ||
            20
        ),
    };
  };

/* =========================================================
   GET OFFER

   GET
   /marketplace/customer-requests/offers/:offerId
========================================================= */

export const getCustomerRequestOffer =
  async (
    offerId:
      string
  ) => {
    const response =
      await api.get<CustomerRequestOfferApiResponse>(
        `${BASE_PATH}/offers/${encodeReference(
          offerId
        )}`
      );

    const offer =
      response.data.data
        ?.offer;

    if (!offer) {
      throw new Error(
        "Customer request offer response did not include an offer."
      );
    }

    return normalizeCustomerRequestOffer(
      offer
    );
  };

/* =========================================================
   SUBMIT / REPLACE SUPPLIER OFFER

   POST
   /marketplace/customer-requests/:requestId/
   suppliers/:supplierReference/offers

   Backend re-checks:
   - supplier eligibility
   - Customer Range entitlement
   - product access
========================================================= */

export const submitCustomerRequestOffer =
  async (
    requestId:
      string,

    supplierReference:
      string,

    payload:
      SubmitCustomerRequestOfferPayload
  ) => {
    const response =
      await api.post<CustomerRequestOfferApiResponse>(
        `${BASE_PATH}/${encodeReference(
          requestId
        )}/suppliers/${encodeReference(
          supplierReference
        )}/offers`,
        payload
      );

    const offer =
      response.data.data
        ?.offer;

    if (!offer) {
      throw new Error(
        "Supplier offer response did not include an offer."
      );
    }

    return normalizeCustomerRequestOffer(
      offer
    );
  };

/* =========================================================
   WITHDRAW OFFER

   POST
   /marketplace/customer-requests/offers/:offerId/withdraw
========================================================= */

export const withdrawCustomerRequestOffer =
  async (
    offerId:
      string
  ) => {
    const response =
      await api.post<CustomerRequestOfferApiResponse>(
        `${BASE_PATH}/offers/${encodeReference(
          offerId
        )}/withdraw`
      );

    const offer =
      response.data.data
        ?.offer;

    if (!offer) {
      throw new Error(
        "Offer withdrawal response did not include an offer."
      );
    }

    return normalizeCustomerRequestOffer(
      offer
    );
  };

/* =========================================================
   ACCEPT OFFER

   POST
   /marketplace/customer-requests/:requestId/
   offers/:offerId/accept

   Backend:
   - re-checks supplier eligibility
   - accepts selected offer
   - rejects other current submitted offers
   - marks request fulfilled

   IMPORTANT:
   This action does NOT create an Order yet.
========================================================= */

export const acceptCustomerRequestOffer =
  async (
    requestId:
      string,

    offerId:
      string,

    payload:
      AcceptCustomerRequestOfferPayload = {}
  ) => {
    const response =
      await api.post<CustomerRequestDetailApiResponse>(
        `${BASE_PATH}/${encodeReference(
          requestId
        )}/offers/${encodeReference(
          offerId
        )}/accept`,
        payload
      );

    const request =
      response.data.data
        ?.request;

    if (!request) {
      throw new Error(
        "Offer acceptance response did not include the customer request."
      );
    }

    return normalizeDetail(
      request,
      response.data.data
        ?.offers ||
        []
    );
  };

/* =========================================================
   EXPIRE STALE REQUESTS / OFFERS

   POST
   /marketplace/customer-requests/expire-stale
========================================================= */

export const expireStaleCustomerRequests =
  async () => {
    const response =
      await api.post<ExpireCustomerRequestsResponse>(
        `${BASE_PATH}/expire-stale`
      );

    return (
      response.data.data ||
      {}
    );
  };

/* =========================================================
   DISPLAY HELPERS
========================================================= */

export const formatCustomerRequestStatus = (
  value:
    | CustomerRequestStatus
    | CustomerRequestOfferStatus
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

/* =========================================================
   CUSTOMER RANGE TARGET DISPLAY
========================================================= */

export const formatCustomerRequestTarget = (
  request:
    Pick<
      CustomerRequest,
      | "targetPrice"
      | "currency"
    >
) => {
  const currency =
    request.currency ||
    "PKR";

  const price =
    normalizeNullableNumber(
      request.targetPrice
    );

  if (
    price ===
    null
  ) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(
      "en-PK",
      {
        style:
          "currency",

        currency,

        maximumFractionDigits:
          2,
      }
    ).format(
      price
    );
  } catch {
    return `${currency} ${price.toLocaleString(
      "en-PK"
    )}`;
  }
};

/* =========================================================
   REDUCTION DISPLAY
========================================================= */

export const formatCustomerRequestReduction = (
  reductionPercent:
    | number
    | null
    | undefined
) => {
  const value =
    normalizeNullableNumber(
      reductionPercent
    );

  if (
    value ===
    null
  ) {
    return "—";
  }

  return `${value}%`;
};

/* =========================================================
   CUSTOMER DISPLAY
========================================================= */

export const getCustomerRequestCustomerName = (
  request:
    CustomerRequest
) => {
  if (
    request
      .customerSnapshot
      ?.name
  ) {
    return request
      .customerSnapshot
      .name;
  }

  if (
    request.customer &&
    typeof request.customer !==
      "string"
  ) {
    return (
      request.customer
        .name ||
      request.customer
        .email ||
      request.customer
        ._id ||
      "—"
    );
  }

  return (
    request.customer ||
    "—"
  );
};

export const getCustomerRequestCustomerEmail = (
  request:
    CustomerRequest
) => {
  if (
    request
      .customerSnapshot
      ?.email
  ) {
    return request
      .customerSnapshot
      .email;
  }

  if (
    request.customer &&
    typeof request.customer !==
      "string"
  ) {
    return (
      request.customer
        .email ||
      ""
    );
  }

  return "";
};

export const getCustomerRequestCustomerPhone = (
  request:
    CustomerRequest
) => {
  if (
    request
      .customerSnapshot
      ?.phone
  ) {
    return request
      .customerSnapshot
      .phone;
  }

  if (
    request.customer &&
    typeof request.customer !==
      "string"
  ) {
    return (
      request.customer
        .phoneE164 ||
      request.customer
        .phone ||
      ""
    );
  }

  return "";
};

export const getCustomerRequestCustomerReference = (
  request:
    CustomerRequest
) => {
  if (
    !request.customer
  ) {
    return "";
  }

  if (
    typeof request.customer ===
    "string"
  ) {
    return request.customer;
  }

  return (
    request.customer
      ._id ||
    request.customer
      .id ||
    ""
  );
};

/* =========================================================
   PRODUCT DISPLAY
========================================================= */

export const getCustomerRequestProductName = (
  request:
    CustomerRequest
) =>
  request
    .productSnapshot
    ?.name ||
  request.productName ||
  request.externalProductId ||
  "External Product";

/* =========================================================
   SUPPLIER DISPLAY
========================================================= */

export const getCustomerRequestSupplierName = (
  supplier:
    | string
    | CustomerRequestSupplier
    | null
    | undefined
) => {
  if (!supplier) {
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
    supplier.supplierId ||
    supplier._id ||
    "—"
  );
};

export const getCustomerRequestSupplierReference = (
  supplier:
    | string
    | CustomerRequestSupplier
    | null
    | undefined
) => {
  if (!supplier) {
    return "";
  }

  if (
    typeof supplier ===
    "string"
  ) {
    return supplier;
  }

  return (
    supplier.supplierId ||
    supplier._id ||
    ""
  );
};

export const getCustomerRequestSupplierCity = (
  supplier:
    | string
    | CustomerRequestSupplier
    | null
    | undefined
) => {
  if (
    !supplier ||
    typeof supplier ===
      "string"
  ) {
    return "";
  }

  return (
    supplier.city ||
    supplier.address
      ?.city ||
    ""
  );
};

/* =========================================================
   ERROR HANDLING
========================================================= */

type ErrorResponseBody = {
  message?: string;

  error?: string;

  code?: string;

  errors?: Array<{
    field?: string;
    message?: string;
  }>;
};

export const getCustomerRequestErrorMessage = (
  error:
    unknown,

  fallback =
    "Something went wrong while processing the customer request."
) => {
  if (
    axios.isAxiosError<ErrorResponseBody>(
      error
    )
  ) {
    const responseData =
      error.response
        ?.data;

    const validationMessage =
      responseData
        ?.errors?.find(
          (
            item
          ) =>
            Boolean(
              item?.message
            )
        )
        ?.message;

    return (
      validationMessage ||
      responseData
        ?.message ||
      responseData
        ?.error ||
      error.message ||
      fallback
    );
  }

  if (
    error instanceof
    Error
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

const customerRequestService = {
  /* CUSTOMER RANGE */

  createCustomerRequest,

  /* REQUESTS */

  getCustomerRequests,
  getCustomerRequestSummary,
  getCustomerRequest,

  reviewCustomerRequest,

  /* SUPPLIER ROUTING */

  evaluateCustomerRequestSuppliers,
  inviteCustomerRequestSuppliers,

  /* OFFERS */

  getCustomerRequestOffers,
  getCustomerRequestOffer,

  submitCustomerRequestOffer,
  withdrawCustomerRequestOffer,
  acceptCustomerRequestOffer,

  /* MAINTENANCE */

  expireStaleCustomerRequests,

  /* FORMATTERS */

  formatCustomerRequestStatus,
  formatCustomerRequestTarget,
  formatCustomerRequestReduction,

  /* CUSTOMER HELPERS */

  getCustomerRequestCustomerName,
  getCustomerRequestCustomerEmail,
  getCustomerRequestCustomerPhone,
  getCustomerRequestCustomerReference,

  /* PRODUCT HELPERS */

  getCustomerRequestProductName,

  /* SUPPLIER HELPERS */

  getCustomerRequestSupplierName,
  getCustomerRequestSupplierReference,
  getCustomerRequestSupplierCity,

  /* ERRORS */

  getCustomerRequestErrorMessage,

  /* NORMALIZERS */

  normalizeCustomerRequest,
  normalizeCustomerRequestOffer,
};

export default customerRequestService;