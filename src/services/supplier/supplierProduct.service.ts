import axios from "axios";
import api from "../api";

const BASE = "/supplier-products";

export type ProductApprovalStatus = "draft" | "pending_review" | "approved" | "rejected" | "archived";
export type StockVerificationStatus = "pending" | "evidence_required" | "verified" | "rejected";
export type SupplierProduct = {
  _id: string;
  name: string;
  sku: string;
  brand?: string;
  category: string;
  modelNumber?: string;
  price: number;
  currency?: string;
  stockQuantity: number;
  minimumOrderQuantity?: number;
  stockStatus: "in_stock" | "out_of_stock" | "preorder";
  status: ProductApprovalStatus;
  enabled: boolean;
  publicationStatus?: "not_published" | "published" | "disabled";
  supplier?: { _id?: string; companyName?: string; supplierId?: string; status?: string; verificationStatus?: string } | string;
  catalogue?: { source?: "master_catalogue" | "custom_proposal"; type?: string; productClassification?: string; mappingStatus?: string; externalProductId?: string };
  proposal?: { proposedCategory?: string; proposedBrand?: string; proposedType?: string; notes?: string };
  stockVerification?: { status?: StockVerificationStatus; verifiedQuantity?: number; notes?: string; verifiedAt?: string; evidence?: Array<{ kind: string; url: string; description?: string }> };
  images?: Array<{ url: string; alt?: string }>;
  warehouse?: { city?: string; address?: string; name?: string };
  approvalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};
export type ProductQuery = {
  page?: number; limit?: number; search?: string; status?: string; stockStatus?: string;
  category?: string; brand?: string; supplierId?: string; enabled?: "true" | "false";
  type?: string; source?: string; mappingStatus?: string; verificationStatus?: string;
  publicationStatus?: string; sort?: string;
};
export type Pagination = { page: number; limit: number; total: number; totalPages: number; hasNextPage?: boolean; hasPreviousPage?: boolean };
type ApiData<T> = { success?: boolean; message?: string; data: T; pagination?: Pagination };
export async function listSupplierProducts(query: ProductQuery) {
  const r = await api.get<ApiData<SupplierProduct[]>>(`${BASE}/admin`, { params: query });
  return { products: Array.isArray(r.data.data) ? r.data.data : [], pagination: r.data.pagination ?? { page: query.page ?? 1, limit: query.limit ?? 20, total: 0, totalPages: 0 } };
}
export async function getSupplierProduct(id: string) {
  const r = await api.get<ApiData<SupplierProduct>>(`${BASE}/admin/${encodeURIComponent(id)}`);
  return r.data.data;
}
export async function approveSupplierProduct(id: string, notes: string) {
  const r = await api.post<ApiData<SupplierProduct>>(`${BASE}/admin/${encodeURIComponent(id)}/approve`, { notes });
  return r.data.data;
}
export async function rejectSupplierProduct(id: string, notes: string) {
  const r = await api.post<ApiData<SupplierProduct>>(`${BASE}/admin/${encodeURIComponent(id)}/reject`, { notes });
  return r.data.data;
}
export async function verifySupplierStock(id: string, payload: { status: StockVerificationStatus; verifiedQuantity?: number; notes?: string }) {
  const r = await api.patch<ApiData<SupplierProduct>>(`${BASE}/admin/${encodeURIComponent(id)}/stock-verification`, payload);
  return r.data.data;
}
export async function changeSupplierListing(id: string, enabled: boolean) {
  const r = await api.patch<ApiData<SupplierProduct>>(`${BASE}/admin/${encodeURIComponent(id)}/listing`, { enabled });
  return r.data.data;
}
export async function archiveSupplierProduct(id: string) {
  const r = await api.post<ApiData<SupplierProduct>>(`${BASE}/admin/${encodeURIComponent(id)}/archive`, {});
  return r.data.data;
}
export function supplierProductErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data?.message || error.message || "Request failed";
  return error instanceof Error ? error.message : "Unable to complete request";
}
