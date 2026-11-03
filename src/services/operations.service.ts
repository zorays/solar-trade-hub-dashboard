import api from "./api";
export type OperationsReport = {
  generatedAt: string;
  supplierProducts: {
    byStatus: Record<string, number>;
    catalogueMappingQueue: number;
    stockVerificationQueue: number;
    published: number;
    freeEnabledActive: number;
  };
  catalogueOffers: { enabled: number; freeEnabledActive: number };
  subscriptions: {
    active: number;
    expiringWithin7Days: number;
    awaitingPayment: number;
  };
  payments: {
    awaitingVerification: number;
    fulfilmentFailed: number;
    verifiedRevenue: Array<{
      purpose: string;
      currency: string;
      amount: number;
      payments: number;
    }>;
  };
  orders: { awaitingFulfilment: Record<string, number> };
};
export async function getOperationsReport(range = "30d", signal?: AbortSignal) {
  return (
    await api.get<{ data: OperationsReport }>("/reports/dashboard/operations", {
      params: { range },
      signal,
    })
  ).data.data;
}
