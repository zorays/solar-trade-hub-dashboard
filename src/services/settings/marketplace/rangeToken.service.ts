import axios from "axios";

import api from "../../api";

const BASE_PATH =
  "/marketplace/range-tokens";

export type RangeTokenTransactionType =
  | "signup_bonus"
  | "purchase"
  | "subscription"
  | "range_request"
  | "refund"
  | "admin_credit"
  | "admin_debit"
  | "adjustment";

export type RangeTokenTransactionDirection =
  | "credit"
  | "debit";

export type RangeTokenTransactionStatus =
  | "completed"
  | "reversed";

export type RangeTokenReductionPercent =
  | 1
  | 2
  | 3;

export type RangeTokenCustomer = {
  _id?: string;
  id?: string;

  name?: string;
  email?: string;

  phone?: string;
  phoneE164?: string;

  accountType?: string;
  status?: string;
};

export type RangeTokenTransaction = {
  _id?: string;
  id?: string;

  type: RangeTokenTransactionType;

  direction: RangeTokenTransactionDirection;

  amount: number;

  balanceBefore: number;
  balanceAfter: number;

  status: RangeTokenTransactionStatus;

  customerRequestId?: string | null;
  externalProductId?: string | null;

  reductionPercent?:
    | RangeTokenReductionPercent
    | null;

  paymentId?: string | null;
  subscriptionId?: string | null;

  reference?: string;
  note?: string;

  createdBy?:
    | string
    | RangeTokenCustomer
    | null;

  createdAt?: string;
};

export type RangeTokenWallet = {
  _id: string;
  id?: string;

  customerId:
    | string
    | RangeTokenCustomer;

  balance: number;

  totalCredited: number;
  totalDebited: number;

  signupBonusGranted: boolean;
  signupBonusAmount: number;

  signupBonusGrantedAt?: string | null;

  transactions?: RangeTokenTransaction[];

  lastTransactionAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type RangeTokenPagination = {
  page: number;
  limit: number;

  total: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type RangeTokenWalletListQuery = {
  page?: number;
  limit?: number;

  customerId?: string;

  hasBalance?:
    | boolean
    | "true"
    | "false";

  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "balance"
    | "totalCredited"
    | "totalDebited"
    | "lastTransactionAt";

  sortOrder?:
    | "asc"
    | "desc";
};

export type RangeTokenTransactionListQuery = {
  page?: number;
  limit?: number;
};

export type RangeTokenSummary = {
  wallets: number;

  totalBalance: number;
  totalCredited: number;
  totalDebited: number;

  customersWithBalance: number;
  customersWithoutBalance: number;

  freeSignupTokens: number;
  maxReductionPercent: number;
};

export type RangeTokenSignupBonusResult = {
  granted: boolean;

  amount: number;
  balance: number;

  wallet: RangeTokenWallet;
};

export type RangeTokenAdminCreditType =
  | "purchase"
  | "subscription"
  | "refund"
  | "admin_credit"
  | "adjustment";

export type RangeTokenAdminDebitType =
  | "range_request"
  | "admin_debit"
  | "adjustment";

export type CreditRangeTokensPayload = {
  amount: number;

  type: RangeTokenAdminCreditType;

  paymentId?: string | null;
  subscriptionId?: string | null;
  customerRequestId?: string | null;
  externalProductId?: string | null;

  reductionPercent?:
    | RangeTokenReductionPercent
    | null;

  reference?: string;
  note?: string;
};

export type DebitRangeTokensPayload = {
  amount: number;

  type: RangeTokenAdminDebitType;

  customerRequestId?: string | null;
  externalProductId?: string | null;

  reductionPercent?:
    | RangeTokenReductionPercent
    | null;

  reference?: string;
  note?: string;
};

export type RefundRangeTokensPayload = {
  customerRequestId: string;
  note?: string;
};

export type RangeTokenQuotePayload = {
  productId: string;

  reductionPercent:
    RangeTokenReductionPercent;
};

export type RangeTokenQuote = {
  productId?: string;
  productName?: string;

  baseRate?: number;
  currency?: string;

  reductionPercent:
    RangeTokenReductionPercent;

  tokenCost: number;

  targetPrice: number;

  currentBalance?: number;
  hasEnoughTokens?: boolean;

  [key: string]: unknown;
};

export type CustomerRangeTokenBalance = {
  balance: number;

  hasWallet: boolean;

  wallet:
    | RangeTokenWallet
    | null;

  signupBonusGranted: boolean;
  signupBonusAmount: number;
};

type WalletListResponse = {
  success: boolean;
  message?: string;

  data?: {
    wallets?: RangeTokenWallet[];

    pagination?:
      RangeTokenPagination;
  };
};

type WalletResponse = {
  success: boolean;
  message?: string;

  data?: {
    wallet?:
      RangeTokenWallet;
  };
};

type SummaryResponse = {
  success: boolean;
  message?: string;

  data?: {
    summary?:
      RangeTokenSummary;
  };
};

type MyBalanceResponse = {
  success: boolean;
  message?: string;

  data?: {
    rangeTokens?: number;
  };
};

type SignupBonusResponse = {
  success: boolean;
  message?: string;

  data?: {
    granted?: boolean;

    amount?: number;
    balance?: number;

    wallet?: RangeTokenWallet;
  };
};

type WalletMutationResponse = {
  success: boolean;
  message?: string;

  data?: {
    balance?: number;

    wallet?: RangeTokenWallet;
  };
};

type RefundResponse = {
  success: boolean;
  message?: string;

  data?: {
    tokensRefunded?: number;

    balance?: number;

    wallet?: RangeTokenWallet;
  };
};

type TransactionListResponse = {
  success: boolean;
  message?: string;

  data?: {
    balance?: number;

    transactions?:
      RangeTokenTransaction[];

    pagination?:
      RangeTokenPagination;
  };
};

type QuoteResponse = {
  success: boolean;
  message?: string;

  data?: {
    quote?:
      RangeTokenQuote;
  };
};

type RangeTokenErrorBody = {
  message?: string;
  error?: string;
  code?: string;

  data?: {
    message?: string;
    error?: string;
    code?: string;
  };

  errors?: Array<{
    field?: string;
    message?: string;
  }>;
};

const encodeReference = (
  value: string
) =>
  encodeURIComponent(
    value.trim()
  );

const normalizeNumber = (
  value: unknown,
  fallback = 0
): number => {
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
    Partial<RangeTokenPagination> |
    null |
    undefined,

  fallbackPage = 1,
  fallbackLimit = 20
): RangeTokenPagination => {
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

const normalizeCustomer = (
  customer:
    RangeTokenCustomer
): RangeTokenCustomer => {
  const id =
    customer?._id ||
    customer?.id ||
    "";

  return {
    ...customer,

    _id: id,
    id,

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
      customer?.phoneE164 ||
      "",

    accountType:
      customer?.accountType ||
      "",

    status:
      customer?.status ||
      "",
  };
};

export const normalizeRangeTokenTransaction =
  (
    transaction:
      RangeTokenTransaction
  ): RangeTokenTransaction => ({
    ...transaction,

    id:
      transaction.id ||
      transaction._id,

    amount:
      normalizeNumber(
        transaction.amount
      ),

    balanceBefore:
      normalizeNumber(
        transaction.balanceBefore
      ),

    balanceAfter:
      normalizeNumber(
        transaction.balanceAfter
      ),

    reductionPercent:
      transaction
        .reductionPercent ===
        null ||
      transaction
        .reductionPercent ===
        undefined
        ? null
        : normalizeNumber(
            transaction
              .reductionPercent
          ) as
            RangeTokenReductionPercent,

    paymentId:
      transaction.paymentId ??
      null,

    subscriptionId:
      transaction.subscriptionId ??
      null,

    customerRequestId:
      transaction.customerRequestId ??
      null,

    externalProductId:
      transaction.externalProductId ??
      null,

    reference:
      transaction.reference ||
      "",

    note:
      transaction.note ||
      "",
  });

export const normalizeRangeTokenWallet =
  (
    wallet:
      RangeTokenWallet
  ): RangeTokenWallet => {
    const id =
      wallet?._id ||
      wallet?.id ||
      "";

    let customerId =
      wallet.customerId;

    if (
      customerId &&
      typeof customerId !==
        "string"
    ) {
      customerId =
        normalizeCustomer(
          customerId
        );
    }

    return {
      ...wallet,

      _id: id,
      id,

      customerId,

      balance:
        normalizeNumber(
          wallet.balance
        ),

      totalCredited:
        normalizeNumber(
          wallet.totalCredited
        ),

      totalDebited:
        normalizeNumber(
          wallet.totalDebited
        ),

      signupBonusGranted:
        Boolean(
          wallet.signupBonusGranted
        ),

      signupBonusAmount:
        normalizeNumber(
          wallet.signupBonusAmount
        ),

      signupBonusGrantedAt:
        wallet
          .signupBonusGrantedAt ??
        null,

      lastTransactionAt:
        wallet
          .lastTransactionAt ??
        null,

      transactions:
        Array.isArray(
          wallet.transactions
        )
          ? wallet.transactions.map(
              normalizeRangeTokenTransaction
            )
          : [],
    };
  };

const getRangeTokenErrorCode = (
  error: unknown
): string => {
  if (
    !axios.isAxiosError<RangeTokenErrorBody>(
      error
    )
  ) {
    return "";
  }

  return (
    error.response
      ?.data
      ?.code ||
    error.response
      ?.data
      ?.data
      ?.code ||
    ""
  );
};

const getRangeTokenApiMessage = (
  error: unknown
): string => {
  if (
    !axios.isAxiosError<RangeTokenErrorBody>(
      error
    )
  ) {
    return "";
  }

  const body =
    error.response
      ?.data;

  return (
    body?.message ||
    body?.error ||
    body?.data
      ?.message ||
    body?.data
      ?.error ||
    ""
  );
};

const isRangeTokenWalletNotFoundError =
  (
    error: unknown
  ): boolean => {
    if (
      !axios.isAxiosError<RangeTokenErrorBody>(
        error
      )
    ) {
      return false;
    }

    if (
      error.response
        ?.status !==
      404
    ) {
      return false;
    }

    const code =
      getRangeTokenErrorCode(
        error
      );

    if (
      code ===
      "CUSTOMER_NOT_FOUND"
    ) {
      return false;
    }

    if (
      code ===
      "RANGE_TOKEN_WALLET_NOT_FOUND"
    ) {
      return true;
    }

    const message =
      getRangeTokenApiMessage(
        error
      )
        .toLowerCase()
        .trim();

    if (
      message.includes(
        "customer"
      ) &&
      message.includes(
        "not found"
      )
    ) {
      return false;
    }

    if (
      message.includes(
        "range token wallet"
      ) &&
      (
        message.includes(
          "not found"
        ) ||
        message.includes(
          "does not exist"
        )
      )
    ) {
      return true;
    }

    return true;
  };

export const getRangeTokenWallets =
  async (
    query:
      RangeTokenWalletListQuery = {}
  ) => {
    const params = {
      ...query,

      ...(typeof query
        .hasBalance ===
      "boolean"
        ? {
            hasBalance:
              String(
                query.hasBalance
              ),
          }
        : {}),
    };

    const response =
      await api.get<WalletListResponse>(
        BASE_PATH,
        {
          params,
        }
      );

    const wallets =
      response.data.data
        ?.wallets ||
      [];

    return {
      wallets:
        wallets.map(
          normalizeRangeTokenWallet
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

export const getRangeTokenSummary =
  async (): Promise<RangeTokenSummary> => {
    const response =
      await api.get<SummaryResponse>(
        `${BASE_PATH}/summary`
      );

    const summary =
      response.data.data
        ?.summary;

    return {
      wallets:
        normalizeNumber(
          summary?.wallets
        ),

      totalBalance:
        normalizeNumber(
          summary
            ?.totalBalance
        ),

      totalCredited:
        normalizeNumber(
          summary
            ?.totalCredited
        ),

      totalDebited:
        normalizeNumber(
          summary
            ?.totalDebited
        ),

      customersWithBalance:
        normalizeNumber(
          summary
            ?.customersWithBalance
        ),

      customersWithoutBalance:
        normalizeNumber(
          summary
            ?.customersWithoutBalance
        ),

      freeSignupTokens:
        normalizeNumber(
          summary
            ?.freeSignupTokens,
          10
        ),

      maxReductionPercent:
        normalizeNumber(
          summary
            ?.maxReductionPercent,
          3
        ),
    };
  };

export const getCustomerRangeTokenWallet =
  async (
    customerId:
      string
  ): Promise<RangeTokenWallet> => {
    const normalizedCustomerId =
      customerId.trim();

    if (
      !normalizedCustomerId
    ) {
      throw new Error(
        "Customer ID is required."
      );
    }

    const response =
      await api.get<WalletResponse>(
        `${BASE_PATH}/customer/${encodeReference(
          normalizedCustomerId
        )}`
      );

    const wallet =
      response.data.data
        ?.wallet;

    if (
      !wallet
    ) {
      throw new Error(
        "Range Token wallet response did not include a wallet."
      );
    }

    return normalizeRangeTokenWallet(
      wallet
    );
  };

export const getCustomerRangeTokenBalance =
  async (
    customerId:
      string
  ): Promise<CustomerRangeTokenBalance> => {
    const normalizedCustomerId =
      customerId.trim();

    if (
      !normalizedCustomerId
    ) {
      throw new Error(
        "Customer ID is required."
      );
    }

    try {
      const wallet =
        await getCustomerRangeTokenWallet(
          normalizedCustomerId
        );

      return {
        balance:
          normalizeNumber(
            wallet.balance
          ),

        hasWallet:
          true,

        wallet,

        signupBonusGranted:
          Boolean(
            wallet.signupBonusGranted
          ),

        signupBonusAmount:
          normalizeNumber(
            wallet.signupBonusAmount
          ),
      };
    } catch (
      error
    ) {
      if (
        isRangeTokenWalletNotFoundError(
          error
        )
      ) {
        return {
          balance: 0,

          hasWallet:
            false,

          wallet:
            null,

          signupBonusGranted:
            false,

          signupBonusAmount:
            0,
        };
      }

      throw error;
    }
  };

export const grantCustomerSignupRangeTokens =
  async (
    customerId:
      string
  ): Promise<RangeTokenSignupBonusResult> => {
    const normalizedCustomerId =
      customerId.trim();

    if (
      !normalizedCustomerId
    ) {
      throw new Error(
        "Customer ID is required."
      );
    }

    const response =
      await api.post<SignupBonusResponse>(
        `${BASE_PATH}/customer/${encodeReference(
          normalizedCustomerId
        )}/signup-bonus`
      );

    const data =
      response.data.data;

    if (
      !data?.wallet
    ) {
      throw new Error(
        "Signup token response did not include a wallet."
      );
    }

    return {
      granted:
        Boolean(
          data.granted
        ),

      amount:
        normalizeNumber(
          data.amount
        ),

      balance:
        normalizeNumber(
          data.balance
        ),

      wallet:
        normalizeRangeTokenWallet(
          data.wallet
        ),
    };
  };

export const creditCustomerRangeTokens =
  async (
    customerId:
      string,

    payload:
      CreditRangeTokensPayload
  ) => {
    const normalizedCustomerId =
      customerId.trim();

    if (
      !normalizedCustomerId
    ) {
      throw new Error(
        "Customer ID is required."
      );
    }

    const response =
      await api.post<WalletMutationResponse>(
        `${BASE_PATH}/customer/${encodeReference(
          normalizedCustomerId
        )}/credit`,
        payload
      );

    const wallet =
      response.data.data
        ?.wallet;

    if (
      !wallet
    ) {
      throw new Error(
        "Range Token credit response did not include a wallet."
      );
    }

    const normalizedWallet =
      normalizeRangeTokenWallet(
        wallet
      );

    return {
      balance:
        normalizeNumber(
          response.data.data
            ?.balance,
          normalizedWallet
            .balance
        ),

      wallet:
        normalizedWallet,
    };
  };

export const debitCustomerRangeTokens =
  async (
    customerId:
      string,

    payload:
      DebitRangeTokensPayload
  ) => {
    const normalizedCustomerId =
      customerId.trim();

    if (
      !normalizedCustomerId
    ) {
      throw new Error(
        "Customer ID is required."
      );
    }

    const response =
      await api.post<WalletMutationResponse>(
        `${BASE_PATH}/customer/${encodeReference(
          normalizedCustomerId
        )}/debit`,
        payload
      );

    const wallet =
      response.data.data
        ?.wallet;

    if (
      !wallet
    ) {
      throw new Error(
        "Range Token debit response did not include a wallet."
      );
    }

    const normalizedWallet =
      normalizeRangeTokenWallet(
        wallet
      );

    return {
      balance:
        normalizeNumber(
          response.data.data
            ?.balance,
          normalizedWallet
            .balance
        ),

      wallet:
        normalizedWallet,
    };
  };

export const refundCustomerRangeTokens =
  async (
    customerId:
      string,

    payload:
      RefundRangeTokensPayload
  ) => {
    const normalizedCustomerId =
      customerId.trim();

    if (
      !normalizedCustomerId
    ) {
      throw new Error(
        "Customer ID is required."
      );
    }

    const response =
      await api.post<RefundResponse>(
        `${BASE_PATH}/customer/${encodeReference(
          normalizedCustomerId
        )}/refund`,
        payload
      );

    const wallet =
      response.data.data
        ?.wallet;

    if (
      !wallet
    ) {
      throw new Error(
        "Range Token refund response did not include a wallet."
      );
    }

    const normalizedWallet =
      normalizeRangeTokenWallet(
        wallet
      );

    return {
      tokensRefunded:
        normalizeNumber(
          response.data.data
            ?.tokensRefunded
        ),

      balance:
        normalizeNumber(
          response.data.data
            ?.balance,
          normalizedWallet
            .balance
        ),

      wallet:
        normalizedWallet,
    };
  };

export const getMyRangeTokenBalance =
  async (): Promise<number> => {
    const response =
      await api.get<MyBalanceResponse>(
        `${BASE_PATH}/me`
      );

    return normalizeNumber(
      response.data.data
        ?.rangeTokens
    );
  };

export const getMyRangeTokenWallet =
  getMyRangeTokenBalance;

export const getMyRangeTokenTransactions =
  async (
    query:
      RangeTokenTransactionListQuery = {}
  ) => {
    const response =
      await api.get<TransactionListResponse>(
        `${BASE_PATH}/me/transactions`,
        {
          params:
            query,
        }
      );

    return {
      balance:
        normalizeNumber(
          response.data.data
            ?.balance
        ),

      transactions:
        (
          response.data.data
            ?.transactions ||
          []
        ).map(
          normalizeRangeTokenTransaction
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

export const getRangeTokenQuote =
  async (
    payload:
      RangeTokenQuotePayload
  ): Promise<RangeTokenQuote> => {
    const response =
      await api.post<QuoteResponse>(
        `${BASE_PATH}/quote`,
        payload
      );

    const quote =
      response.data.data
        ?.quote;

    if (
      !quote
    ) {
      throw new Error(
        "Range Token quote response did not include quote data."
      );
    }

    return {
      ...quote,

      reductionPercent:
        normalizeNumber(
          quote.reductionPercent,
          payload
            .reductionPercent
        ) as
          RangeTokenReductionPercent,

      tokenCost:
        normalizeNumber(
          quote.tokenCost,
          payload
            .reductionPercent
        ),

      targetPrice:
        normalizeNumber(
          quote.targetPrice
        ),

      baseRate:
        quote.baseRate ===
          undefined
          ? undefined
          : normalizeNumber(
              quote.baseRate
            ),

      currentBalance:
        quote
          .currentBalance ===
          undefined
          ? undefined
          : normalizeNumber(
              quote
                .currentBalance
            ),

      hasEnoughTokens:
        quote
          .hasEnoughTokens ===
          undefined
          ? undefined
          : Boolean(
              quote
                .hasEnoughTokens
            ),
    };
  };

export const getRangeTokenCustomer =
  (
    wallet:
      RangeTokenWallet
  ): RangeTokenCustomer | null => {
    if (
      typeof wallet
        .customerId ===
      "string"
    ) {
      return null;
    }

    return wallet.customerId;
  };

export const getRangeTokenCustomerName =
  (
    wallet:
      RangeTokenWallet
  ): string => {
    const customer =
      getRangeTokenCustomer(
        wallet
      );

    return (
      customer?.name ||
      customer?.email ||
      (
        typeof wallet
          .customerId ===
          "string"
          ? wallet
              .customerId
          : customer?._id
      ) ||
      "—"
    );
  };

export const getRangeTokenCustomerReference =
  (
    wallet:
      RangeTokenWallet
  ): string => {
    if (
      typeof wallet
        .customerId ===
      "string"
    ) {
      return wallet.customerId;
    }

    return (
      wallet.customerId
        ?._id ||
      wallet.customerId
        ?.id ||
      ""
    );
  };

export const formatRangeTokenTransactionType =
  (
    value:
      | string
      | null
      | undefined
  ): string => {
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

export const formatRangeTokenBalance =
  (
    value:
      | number
      | null
      | undefined
  ): string => {
    const amount =
      normalizeNumber(
        value
      );

    return `${amount.toLocaleString(
      "en-PK"
    )} token${
      amount ===
      1
        ? ""
        : "s"
    }`;
  };

export const getRangeTokenErrorMessage =
  (
    error:
      unknown,

    fallback =
      "Something went wrong while processing Range Tokens."
  ): string => {
    if (
      axios.isAxiosError<RangeTokenErrorBody>(
        error
      )
    ) {
      const body =
        error.response
          ?.data;

      const validationMessage =
        body?.errors?.find(
          (
            item
          ) =>
            Boolean(
              item?.message
            )
        )?.message;

      return (
        validationMessage ||
        body?.message ||
        body?.error ||
        body?.data
          ?.message ||
        body?.data
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

const rangeTokenService = {
  getRangeTokenWallets,
  getRangeTokenSummary,

  getCustomerRangeTokenWallet,
  getCustomerRangeTokenBalance,

  grantCustomerSignupRangeTokens,

  creditCustomerRangeTokens,
  debitCustomerRangeTokens,

  refundCustomerRangeTokens,

  getMyRangeTokenBalance,
  getMyRangeTokenWallet,

  getMyRangeTokenTransactions,

  getRangeTokenQuote,

  normalizeRangeTokenWallet,
  normalizeRangeTokenTransaction,

  getRangeTokenCustomer,
  getRangeTokenCustomerName,
  getRangeTokenCustomerReference,

  formatRangeTokenTransactionType,
  formatRangeTokenBalance,

  getRangeTokenErrorMessage,
};

export default rangeTokenService;