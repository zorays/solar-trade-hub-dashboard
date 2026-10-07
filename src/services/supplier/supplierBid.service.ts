import axios from "axios";

import api from "../api";

/* =========================================================
   SOLAR TRADE HUB
   DASHBOARD SUPPLIER BID SERVICE

   Backend base:

   /api/v1/suppliers/bids

   IMPORTANT:

   Supplier Bid is supplier-initiated pricing.

   It is separate from Customer Range.

   Do not apply Customer Range token rules or the 3% Customer
   Range reduction cap to Supplier Bid.
========================================================= */

const BASE_PATH =
  "/suppliers/bids";

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

export type SupplierBidStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

export type SupplierBidSupplier = {
  _id: string;

  supplierId?: string;

  companyName?: string;

  status?: string;

  verificationStatus?: string;
};

export type SupplierBidUser = {
  _id: string;

  name?: string;

  email?: string;
};

export type SupplierBidProductSnapshot = {
  name: string;

  type?:
    | string
    | null;

  category?:
    | string
    | null;

  brand?:
    | string
    | null;

  size?:
    | number
    | null;

  unit?:
    | string
    | null;

  imageUrl?:
    | string
    | null;

  externalRateUpdatedAt?:
    | string
    | null;
};

export type SupplierBidPermissionSnapshot = {
  supplierBidEnabled: boolean;

  maxReductionPercent: number;

  subscriptionId?:
    | string
    | null;

  planCode?:
    | string
    | null;
};

export type SupplierBid = {
  _id: string;

  id?: string;

  supplier:
    | string
    | SupplierBidSupplier;

  externalProductId: string;

  productSnapshot:
    SupplierBidProductSnapshot;

  baseRate: number;

  bidRate: number;

  reductionPercent: number;

  currency: string;

  permissionSnapshot:
    SupplierBidPermissionSnapshot;

  validFrom: string;

  validUntil?:
    | string
    | null;

  status:
    SupplierBidStatus;

  effectiveStatus?:
    SupplierBidStatus;

  isCurrentlyValid?: boolean;

  reviewedBy?:
    | string
    | SupplierBidUser
    | null;

  reviewedAt?:
    | string
    | null;

  adminNote?:
    | string
    | null;

  submittedBy?:
    | string
    | SupplierBidUser
    | null;

  isCurrent: boolean;

  createdAt?: string;

  updatedAt?: string;
};

/* =========================================================
   LIST QUERY

   Backend-supported filters:
   - page
   - limit
   - status
   - isCurrent
   - supplier
   - externalProductId
   - search
   - sortBy
   - sortOrder

   Backend general search covers external product ID and
   product snapshot fields. Supplier lookup is available
   separately through supplier.
========================================================= */

export type SupplierBidListQuery = {
  page?: number;

  limit?: number;

  status?:
    SupplierBidStatus;

  isCurrent?:
    boolean;

  supplier?:
    string;

  externalProductId?:
    string;

  search?:
    string;

  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "baseRate"
    | "bidRate"
    | "reductionPercent"
    | "validFrom"
    | "validUntil"
    | "status";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   CREATE BID
========================================================= */

export type CreateSupplierBidPayload = {
  externalProductId:
    string;

  bidRate:
    number;

  currency?:
    string;

  validFrom?:
    string;

  validUntil?:
    string;
};

/* =========================================================
   REVIEW BID
========================================================= */

export type ReviewSupplierBidPayload = {
  status:
    | "approved"
    | "rejected";

  adminNote?:
    string;
};

/* =========================================================
   SUMMARY
========================================================= */

export type SupplierBidSummary = {
  total: number;

  current: number;

  pending: number;

  approved: number;

  rejected: number;

  expired: number;
};

export type ExpireSupplierBidResult = {
  matchedCount: number;

  modifiedCount: number;
};

/* =========================================================
   API RESPONSE TYPES
========================================================= */

type BidResponse = {
  success: boolean;

  message?: string;

  data: {
    bid:
      | SupplierBid
      | null;
  };
};

type BidListResponse = {
  success: boolean;

  data: {
    bids:
      SupplierBid[];

    pagination:
      Pagination;
  };
};

type BidSummaryResponse = {
  success: boolean;

  data: {
    summary:
      SupplierBidSummary;
  };
};

type ExpireStaleResponse = {
  success: boolean;

  message?: string;

  data: {
    matchedCount:
      number;

    modifiedCount:
      number;
  };
};

/* =========================================================
   HELPERS
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

const normalizePagination = (
  pagination:
    Partial<Pagination> |
    null |
    undefined,

  fallbackPage = 1,

  fallbackLimit = 25
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
        : page >
          1,
  };
};

const normalizeSupplier = (
  supplier:
    SupplierBid["supplier"]
):
  SupplierBid["supplier"] => {
  if (
    typeof supplier ===
    "string"
  ) {
    return supplier;
  }

  return {
    ...supplier,

    _id:
      supplier?._id ||
      "",

    supplierId:
      supplier?.supplierId ||
      "",

    companyName:
      supplier?.companyName ||
      "",

    status:
      supplier?.status ||
      "",

    verificationStatus:
      supplier
        ?.verificationStatus ||
      "",
  };
};

const normalizeProductSnapshot = (
  snapshot:
    SupplierBidProductSnapshot |
    null |
    undefined
):
  SupplierBidProductSnapshot => ({
  name:
    String(
      snapshot?.name ||
        "External Product"
    ),

  type:
    snapshot?.type ??
    null,

  category:
    snapshot?.category ??
    null,

  brand:
    snapshot?.brand ??
    null,

  size:
    snapshot?.size ===
      null ||
    snapshot?.size ===
      undefined
      ? null
      : normalizeNumber(
          snapshot.size,
          0
        ),

  unit:
    snapshot?.unit ??
    null,

  imageUrl:
    snapshot?.imageUrl ??
    null,

  externalRateUpdatedAt:
    snapshot
      ?.externalRateUpdatedAt ??
    null,
});

const normalizePermissionSnapshot = (
  snapshot:
    SupplierBidPermissionSnapshot |
    null |
    undefined
):
  SupplierBidPermissionSnapshot => ({
  supplierBidEnabled:
    Boolean(
      snapshot
        ?.supplierBidEnabled
    ),

  maxReductionPercent:
    normalizeNumber(
      snapshot
        ?.maxReductionPercent,
      0
    ),

  subscriptionId:
    snapshot
      ?.subscriptionId ??
    null,

  planCode:
    snapshot
      ?.planCode ??
    null,
});

const normalizeBid = (
  bid:
    SupplierBid
):
  SupplierBid => ({
  ...bid,

  id:
    bid.id ||
    bid._id,

  supplier:
    normalizeSupplier(
      bid.supplier
    ),

  externalProductId:
    String(
      bid.externalProductId ||
        ""
    ),

  productSnapshot:
    normalizeProductSnapshot(
      bid.productSnapshot
    ),

  baseRate:
    normalizeNumber(
      bid.baseRate,
      0
    ),

  bidRate:
    normalizeNumber(
      bid.bidRate,
      0
    ),

  reductionPercent:
    normalizeNumber(
      bid.reductionPercent,
      0
    ),

  currency:
    String(
      bid.currency ||
        "PKR"
    )
      .trim()
      .toUpperCase(),

  permissionSnapshot:
    normalizePermissionSnapshot(
      bid.permissionSnapshot
    ),

  isCurrent:
    Boolean(
      bid.isCurrent
    ),

  isCurrentlyValid:
    bid.isCurrentlyValid ===
      undefined
      ? undefined
      : Boolean(
          bid.isCurrentlyValid
        ),
});

/* =========================================================
   LIST
========================================================= */

export const getSupplierBids =
  async (
    query:
      SupplierBidListQuery = {}
  ) => {
    const response =
      await api.get<BidListResponse>(
        BASE_PATH,
        {
          params:
            query,
        }
      );

    const bids =
      response.data.data
        ?.bids ||
      [];

    return {
      bids:
        bids.map(
          normalizeBid
        ),

      pagination:
        normalizePagination(
          response.data.data
            ?.pagination,
          query.page ||
            1,
          query.limit ||
            25
        ),
    };
  };

/* =========================================================
   SUMMARY
========================================================= */

export const getSupplierBidSummary =
  async () => {
    const response =
      await api.get<BidSummaryResponse>(
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

      current:
        normalizeNumber(
          summary?.current,
          0
        ),

      pending:
        normalizeNumber(
          summary?.pending,
          0
        ),

      approved:
        normalizeNumber(
          summary?.approved,
          0
        ),

      rejected:
        normalizeNumber(
          summary?.rejected,
          0
        ),

      expired:
        normalizeNumber(
          summary?.expired,
          0
        ),
    } satisfies SupplierBidSummary;
  };

/* =========================================================
   CREATE / REPLACE BID

   Backend determines:
   - external catalogue base rate
   - reduction percentage
   - Supplier Bid eligibility
   - effective maximum Supplier Bid reduction

   Frontend must not calculate authoritative permission.
========================================================= */

export const createSupplierBid =
  async (
    supplierReference:
      string,

    payload:
      CreateSupplierBidPayload
  ) => {
    const response =
      await api.post<BidResponse>(
        `${BASE_PATH}/suppliers/${encodeReference(
          supplierReference
        )}`,
        payload
      );

    const bid =
      response.data.data
        ?.bid;

    if (
      !bid
    ) {
      throw new Error(
        "Supplier bid response did not include a bid."
      );
    }

    return normalizeBid(
      bid
    );
  };

/* =========================================================
   CURRENT BID FOR SUPPLIER + PRODUCT
========================================================= */

export const getCurrentSupplierBid =
  async (
    supplierReference:
      string,

    externalProductId:
      string
  ) => {
    const response =
      await api.get<BidResponse>(
        `${BASE_PATH}/suppliers/${encodeReference(
          supplierReference
        )}/products/${encodeReference(
          externalProductId
        )}/current`
      );

    const bid =
      response.data.data
        ?.bid;

    return bid
      ? normalizeBid(
          bid
        )
      : null;
  };

/* =========================================================
   DETAIL
========================================================= */

export const getSupplierBidById =
  async (
    bidId:
      string
  ) => {
    const response =
      await api.get<BidResponse>(
        `${BASE_PATH}/${encodeReference(
          bidId
        )}`
      );

    const bid =
      response.data.data
        ?.bid;

    if (
      !bid
    ) {
      throw new Error(
        "Supplier bid was not found."
      );
    }

    return normalizeBid(
      bid
    );
  };

/* =========================================================
   REVIEW

   Approval remains backend-authoritative.

   Backend revalidates:
   - current external catalogue product
   - current product availability
   - live external base rate
   - supplier marketplace eligibility
   - effective Supplier Bid permission
   - current maximum reduction entitlement
========================================================= */

export const reviewSupplierBid =
  async (
    bidId:
      string,

    payload:
      ReviewSupplierBidPayload
  ) => {
    const response =
      await api.patch<BidResponse>(
        `${BASE_PATH}/${encodeReference(
          bidId
        )}/review`,
        payload
      );

    const bid =
      response.data.data
        ?.bid;

    if (
      !bid
    ) {
      throw new Error(
        "Supplier bid review response did not include a bid."
      );
    }

    return normalizeBid(
      bid
    );
  };

/* =========================================================
   EXPIRE STALE

   Normally list/detail backend flows already synchronize stale
   records. This endpoint remains available for explicit admin
   maintenance when needed.
========================================================= */

export const expireStaleSupplierBids =
  async () => {
    const response =
      await api.post<ExpireStaleResponse>(
        `${BASE_PATH}/expire-stale`
      );

    return {
      matchedCount:
        normalizeNumber(
          response.data.data
            ?.matchedCount,
          0
        ),

      modifiedCount:
        normalizeNumber(
          response.data.data
            ?.modifiedCount,
          0
        ),
    } satisfies ExpireSupplierBidResult;
  };

/* =========================================================
   DISPLAY HELPERS
========================================================= */

export const formatSupplierBidStatus =
  (
    value:
      | string
      | null
      | undefined
  ) => {
    if (
      !value
    ) {
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

export const getSupplierBidSupplierName =
  (
    bid:
      SupplierBid
  ) => {
    if (
      typeof bid.supplier ===
      "string"
    ) {
      return (
        bid.supplier ||
        "—"
      );
    }

    return (
      bid.supplier
        ?.companyName ||
      bid.supplier
        ?.supplierId ||
      bid.supplier
        ?._id ||
      "—"
    );
  };

export const getSupplierBidSupplierReference =
  (
    bid:
      SupplierBid
  ) => {
    if (
      typeof bid.supplier ===
      "string"
    ) {
      return bid.supplier;
    }

    return (
      bid.supplier
        ?.supplierId ||
      bid.supplier
        ?._id ||
      ""
    );
  };

/* =========================================================
   ERROR MESSAGE
========================================================= */

type SupplierBidErrorBody = {
  message?: string;

  error?: string;

  code?: string;

  errors?: Array<{
    field?: string;

    message?: string;
  }>;
};

export const getSupplierBidErrorMessage =
  (
    error:
      unknown,

    fallback =
      "Something went wrong while processing the supplier bid."
  ) => {
    if (
      axios.isAxiosError<SupplierBidErrorBody>(
        error
      )
    ) {
      const body =
        error.response
          ?.data;

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

const supplierBidService = {
  getSupplierBids,

  getSupplierBidSummary,

  createSupplierBid,

  getCurrentSupplierBid,

  getSupplierBidById,

  reviewSupplierBid,

  expireStaleSupplierBids,

  formatSupplierBidStatus,

  getSupplierBidSupplierName,

  getSupplierBidSupplierReference,

  getSupplierBidErrorMessage,
};

export default supplierBidService;