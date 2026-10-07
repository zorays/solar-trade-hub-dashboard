import api from "../api";

/* =========================================================
   TENDER TYPES
========================================================= */

export type TenderStatus =
  | "draft"
  | "open"
  | "closed"
  | "awarded"
  | "cancelled";

export type TenderCurrency =
  | "PKR"
  | "USD";

/* =========================================================
   TENDER BUDGET
========================================================= */

export type TenderBudget = {
  amount: number;
  currency: TenderCurrency;
};

/* =========================================================
   TENDER
========================================================= */

export type Tender = {
  _id: string;

  id?: string;

  tenderId: string;

  title: string;

  organization: string;

  location: string;

  category: string;

  description?: string;

  budget: TenderBudget;

  deadline?:
    | string
    | null;

  bidsCount: number;

  status: TenderStatus;

  createdBy?:
    | string
    | null;

  updatedBy?:
    | string
    | null;

  createdAt?: string;

  updatedAt?: string;
};

/* =========================================================
   TENDER SUMMARY
========================================================= */

export type TenderSummary = {
  total: number;

  draft: number;

  open: number;

  closed: number;

  awarded: number;

  cancelled: number;
};

/* =========================================================
   PAGINATION
========================================================= */

export type TenderPagination = {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
};

/* =========================================================
   LIST PARAMS
========================================================= */

export type GetTendersParams = {
  page?: number;

  limit?: number;

  search?: string;

  status?: TenderStatus;

  category?: string;

  organization?: string;

  location?: string;

  currency?: TenderCurrency;

  minBudget?: number;

  maxBudget?: number;

  deadlineFrom?: string;

  deadlineTo?: string;

  openOnly?: boolean;

  sortBy?:
    | "tenderId"
    | "title"
    | "organization"
    | "location"
    | "category"
    | "budget.amount"
    | "deadline"
    | "bidsCount"
    | "status"
    | "createdAt"
    | "updatedAt";

  sortOrder?:
    | "asc"
    | "desc";
};

/* =========================================================
   CREATE PAYLOAD
========================================================= */

export type CreateTenderPayload = {
  title: string;

  organization: string;

  location: string;

  category: string;

  description?: string;

  budget?: {
    amount: number;

    currency: TenderCurrency;
  };

  deadline?:
    | string
    | null;

  status?: TenderStatus;
};

/* =========================================================
   UPDATE PAYLOAD
========================================================= */

export type UpdateTenderPayload =
  Partial<CreateTenderPayload>;

/* =========================================================
   API RESPONSE TYPES
========================================================= */

type TenderResponse = {
  success: boolean;

  message?: string;

  data: Tender;
};

type TenderListResponse = {
  success: boolean;

  message?: string;

  data: {
    tenders: Tender[];

    pagination: TenderPagination;

    summary: TenderSummary;
  };
};

type TenderSummaryResponse = {
  success: boolean;

  data: {
    summary: TenderSummary;
  };
};

type DeleteTenderResponse = {
  success: boolean;

  message?: string;

  data: {
    id: string;

    tenderId: string;

    title: string;

    organization: string;
  };
};

/* =========================================================
   NORMALIZE NUMBER
========================================================= */

function normalizeNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
}

/* =========================================================
   NORMALIZE TENDER
========================================================= */

export function normalizeTender(
  tender: Tender
): Tender {
  return {
    ...tender,

    _id:
      String(
        tender._id ||
        tender.id ||
        ""
      ),

    id:
      String(
        tender.id ||
        tender._id ||
        ""
      ),

    tenderId:
      String(
        tender.tenderId ||
        ""
      ),

    title:
      String(
        tender.title ||
        ""
      ),

    organization:
      String(
        tender.organization ||
        ""
      ),

    location:
      String(
        tender.location ||
        ""
      ),

    category:
      String(
        tender.category ||
        ""
      ),

    description:
      tender.description ||
      "",

    budget: {
      amount:
        normalizeNumber(
          tender.budget
            ?.amount,
          0
        ),

      currency:
        tender.budget
          ?.currency ||
        "PKR",
    },

    deadline:
      tender.deadline ||
      null,

    bidsCount:
      normalizeNumber(
        tender.bidsCount,
        0
      ),

    status:
      tender.status ||
      "draft",
  };
}

/* =========================================================
   NORMALIZE SUMMARY
========================================================= */

function normalizeSummary(
  summary:
    | Partial<TenderSummary>
    | null
    | undefined
): TenderSummary {
  return {
    total:
      normalizeNumber(
        summary?.total,
        0
      ),

    draft:
      normalizeNumber(
        summary?.draft,
        0
      ),

    open:
      normalizeNumber(
        summary?.open,
        0
      ),

    closed:
      normalizeNumber(
        summary?.closed,
        0
      ),

    awarded:
      normalizeNumber(
        summary?.awarded,
        0
      ),

    cancelled:
      normalizeNumber(
        summary?.cancelled,
        0
      ),
  };
}

/* =========================================================
   GET TENDERS
========================================================= */

export async function getTenders(
  params: GetTendersParams = {}
) {
  const response =
    await api.get<TenderListResponse>(
      "/tenders",
      {
        params,
      }
    );

  const data =
    response.data.data;

  return {
    tenders:
      Array.isArray(
        data?.tenders
      )
        ? data.tenders.map(
            normalizeTender
          )
        : [],

    pagination: {
      page:
        normalizeNumber(
          data?.pagination
            ?.page,
          1
        ),

      limit:
        normalizeNumber(
          data?.pagination
            ?.limit,
          20
        ),

      total:
        normalizeNumber(
          data?.pagination
            ?.total,
          0
        ),

      totalPages:
        normalizeNumber(
          data?.pagination
            ?.totalPages,
          0
        ),

      hasNextPage:
        Boolean(
          data?.pagination
            ?.hasNextPage
        ),

      hasPreviousPage:
        Boolean(
          data?.pagination
            ?.hasPreviousPage
        ),
    } satisfies TenderPagination,

    summary:
      normalizeSummary(
        data?.summary
      ),
  };
}

/* =========================================================
   GET SUMMARY
========================================================= */

export async function getTenderSummary(
  params: Omit<
    GetTendersParams,
    | "page"
    | "limit"
    | "sortBy"
    | "sortOrder"
  > = {}
) {
  const response =
    await api.get<TenderSummaryResponse>(
      "/tenders/summary",
      {
        params,
      }
    );

  return normalizeSummary(
    response.data.data
      ?.summary
  );
}

/* =========================================================
   GET SINGLE TENDER
========================================================= */

export async function getTender(
  tenderId: string
) {
  const response =
    await api.get<TenderResponse>(
      `/tenders/${encodeURIComponent(
        tenderId
      )}`
    );

  return normalizeTender(
    response.data.data
  );
}

/* =========================================================
   CREATE TENDER
========================================================= */

export async function createTender(
  payload: CreateTenderPayload
) {
  const response =
    await api.post<TenderResponse>(
      "/tenders",
      payload
    );

  return normalizeTender(
    response.data.data
  );
}

/* =========================================================
   UPDATE TENDER
========================================================= */

export async function updateTender(
  tenderId: string,
  payload: UpdateTenderPayload
) {
  const response =
    await api.patch<TenderResponse>(
      `/tenders/${encodeURIComponent(
        tenderId
      )}`,
      payload
    );

  return normalizeTender(
    response.data.data
  );
}

/* =========================================================
   UPDATE STATUS
========================================================= */

export async function updateTenderStatus(
  tenderId: string,
  status: TenderStatus
) {
  const response =
    await api.patch<TenderResponse>(
      `/tenders/${encodeURIComponent(
        tenderId
      )}/status`,
      {
        status,
      }
    );

  return normalizeTender(
    response.data.data
  );
}

/* =========================================================
   DELETE TENDER
========================================================= */

export async function deleteTender(
  tenderId: string
) {
  const response =
    await api.delete<DeleteTenderResponse>(
      `/tenders/${encodeURIComponent(
        tenderId
      )}`
    );

  return response.data.data;
}

/* =========================================================
   FORMAT STATUS
========================================================= */

export function formatTenderStatus(
  status: TenderStatus
) {
  switch (status) {
    case "draft":
      return "Draft";

    case "open":
      return "Open";

    case "closed":
      return "Closed";

    case "awarded":
      return "Awarded";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

/* =========================================================
   FORMAT BUDGET
========================================================= */

export function formatTenderBudget(
  budget:
    | TenderBudget
    | null
    | undefined
) {
  const amount =
    normalizeNumber(
      budget?.amount,
      0
    );

  const currency =
    budget?.currency ||
    "PKR";

  if (
    currency ===
    "USD"
  ) {
    return `$ ${amount.toLocaleString(
      "en-US"
    )}`;
  }

  return `Rs ${amount.toLocaleString(
    "en-PK"
  )}`;
}

/* =========================================================
   FORMAT DEADLINE
========================================================= */

export function formatTenderDeadline(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  );
}

/* =========================================================
   API ERROR MESSAGE
========================================================= */

export function getTenderErrorMessage(
  error: unknown,
  fallback =
    "Something went wrong."
) {
  if (
    typeof error ===
      "object" &&
    error !== null
  ) {
    const candidate =
      error as {
        response?: {
          data?: {
            message?:
              | string;
          };
        };

        message?:
          | string;
      };

    const apiMessage =
      candidate.response
        ?.data
        ?.message;

    if (
      typeof apiMessage ===
        "string" &&
      apiMessage.trim()
    ) {
      return apiMessage;
    }

    if (
      typeof candidate.message ===
        "string" &&
      candidate.message.trim()
    ) {
      return candidate.message;
    }
  }

  return fallback;
}