import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import {
  toast,
  Toaster,
} from "sonner";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  formatSupplierApplicationDate,
  formatSupplierApplicationStatus,
  getSupplierApplicationErrorMessage,
  getSupplierApplicationSummary,
  getSupplierApplications,
  updateSupplierApplicationStatus,
  type SupplierApplication,
  type SupplierApplicationStatus,
  type SupplierApplicationSummary,
} from "../../services/supplier/supplierApplication.service";

/* =========================================================
   SOLAR TRADE HUB
   SUPPLIER APPLICATIONS

   Application approval creates/links a Supplier profile.
   Supplier verification remains a separate workflow.
========================================================= */

type StatusFilter =
  | "all"
  | SupplierApplicationStatus;

const EMPTY_SUMMARY: SupplierApplicationSummary = {
  total: 0,
  pending: 0,
  underReview: 0,
  approved: 0,
  rejected: 0,
};

const LIMIT = 20;

const getStatusClasses = (
  status: SupplierApplicationStatus
) => {
  switch (status) {
    case "approved":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400";

    case "under_review":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";
  }
};

const getAddressLabel = (
  application: SupplierApplication
) => {
  const address = application.address;

  return [
    address?.city,
    address?.province,
    address?.country,
  ]
    .filter(Boolean)
    .join(", ") || "—";
};

const getSupplierLabel = (
  application: SupplierApplication
) => {
  const supplier = application.supplier;

  if (!supplier) return "—";
  if (typeof supplier === "string") return supplier;

  return (
    supplier.supplierId ||
    supplier.companyName ||
    supplier._id ||
    "—"
  );
};

export default function SupplierApplications() {
  const [
    applications,
    setApplications,
  ] = useState<SupplierApplication[]>([]);

  const [
    summary,
    setSummary,
  ] = useState<SupplierApplicationSummary>(
    EMPTY_SUMMARY
  );

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>("all");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(0);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const [
    selected,
    setSelected,
  ] = useState<SupplierApplication | null>(null);

  const [
    nextStatus,
    setNextStatus,
  ] = useState<SupplierApplicationStatus>(
    "under_review"
  );

  const [
    reviewNotes,
    setReviewNotes,
  ] = useState("");

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      const [
        listResult,
        summaryResult,
      ] = await Promise.all([
        getSupplierApplications({
          page,
          limit: LIMIT,
          search: search || undefined,
          status:
            statusFilter === "all"
              ? undefined
              : statusFilter,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
        getSupplierApplicationSummary(),
      ]);

      setApplications(listResult.applications);
      setTotal(listResult.pagination.total);
      setTotalPages(listResult.pagination.totalPages);
      setSummary(summaryResult);
    } catch (error) {
      setApplications([]);
      setSummary(EMPTY_SUMMARY);
      setTotal(0);
      setTotalPages(0);

      setLoadError(
        getSupplierApplicationErrorMessage(
          error,
          "Unable to load supplier applications."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    statusFilter,
    refreshKey,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo(
    () => [
      {
        label: "Total",
        value: summary.total,
        icon: FileCheck2,
        classes:
          "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
      },
      {
        label: "Pending",
        value: summary.pending,
        icon: Clock3,
        classes:
          "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
      },
      {
        label: "Under Review",
        value: summary.underReview,
        icon: ShieldCheck,
        classes:
          "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
      },
      {
        label: "Approved",
        value: summary.approved,
        icon: CheckCircle2,
        classes:
          "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
      },
      {
        label: "Rejected",
        value: summary.rejected,
        icon: XCircle,
        classes:
          "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
      },
    ],
    [summary]
  );

  const openReview = (
    application: SupplierApplication,
    status: SupplierApplicationStatus
  ) => {
    setSelected(application);
    setNextStatus(status);
    setReviewNotes(application.reviewNotes || "");
    setRejectionReason(
      status === "rejected"
        ? application.rejectionReason || ""
        : ""
    );
  };

  const closeReview = () => {
    if (saving) return;

    setSelected(null);
    setReviewNotes("");
    setRejectionReason("");
  };

  const saveStatus = async () => {
    if (!selected) return;

    if (
      nextStatus === "rejected" &&
      !rejectionReason.trim()
    ) {
      toast.error(
        "Rejection reason is required."
      );
      return;
    }

    try {
      setSaving(true);

      const result =
        await updateSupplierApplicationStatus(
          selected.applicationId,
          {
            status: nextStatus,
            reviewNotes,
            ...(nextStatus === "rejected"
              ? {
                  rejectionReason,
                }
              : {}),
          }
        );

      toast.success(
        nextStatus === "approved"
          ? "Application approved. Supplier profile is now ready for verification."
          : `Application moved to ${formatSupplierApplicationStatus(
              nextStatus
            )}.`
      );

      setSelected(result.application);
      setRefreshKey((value) => value + 1);

      window.setTimeout(() => {
        setSelected(null);
      }, 250);
    } catch (error) {
      toast.error(
        getSupplierApplicationErrorMessage(
          error,
          "Unable to update supplier application."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Supplier Applications | Solar Trade Hub"
        description="Review and approve Solar Trade Hub supplier applications."
      />

      <PageBreadcrumb pageTitle="Supplier Applications" />

      <Toaster
        position="top-right"
        richColors
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Supplier Applications
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Company application approval creates the Supplier profile. Supplier verification and subscription remain separate controls.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setRefreshKey((value) => value + 1);
              }}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                      {card.value.toLocaleString("en-PK")}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.classes}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-5 dark:border-gray-800">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                  }}
                  placeholder="Search company, application ID, contact or tax number..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-500 dark:border-gray-700 dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as StatusFilter
                  );
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loadError ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {loadError}
              </p>

              <button
                type="button"
                onClick={() => {
                  setRefreshKey((value) => value + 1);
                }}
                className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading supplier applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-10 text-center">
              <FileCheck2 className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
              <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                No supplier applications found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                New supplier applications will appear here for review.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr>
                    {[
                      "Application",
                      "Company",
                      "Contact",
                      "Location",
                      "Submitted",
                      "Status",
                      "Supplier",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {applications.map((application) => (
                    <tr
                      key={
                        application._id ||
                        application.applicationId
                      }
                      className="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {application.applicationId}
                      </td>

                      <td className="px-5 py-4">
                        <div className="min-w-48">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.companyName}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {application.categories?.length
                              ? application.categories.join(", ")
                              : "No category supplied"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="min-w-44 text-sm">
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {application.contactPerson || "—"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {application.email || application.phone || "—"}
                          </p>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {getAddressLabel(application)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatSupplierApplicationDate(
                          application.submittedAt ||
                            application.createdAt
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            application.status
                          )}`}
                        >
                          {formatSupplierApplicationStatus(
                            application.status
                          )}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {getSupplierLabel(application)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              openReview(
                                application,
                                application.status === "pending"
                                  ? "under_review"
                                  : application.status
                              );
                            }}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
                          >
                            <Eye className="h-4 w-4" />
                            Review
                          </button>

                          {application.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => {
                                openReview(
                                  application,
                                  "approved"
                                );
                              }}
                              className="inline-flex h-9 items-center rounded-lg bg-green-600 px-3 text-xs font-semibold text-white transition hover:bg-green-700"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total.toLocaleString("en-PK")} application{total === 1 ? "" : "s"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => {
                  setPage((value) => Math.max(1, value - 1));
                }}
                className="h-9 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {Math.max(totalPages, 1)}
              </span>

              <button
                type="button"
                disabled={
                  loading ||
                  totalPages === 0 ||
                  page >= totalPages
                }
                onClick={() => {
                  setPage((value) => value + 1);
                }}
                className="h-9 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                  {selected.applicationId}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {selected.companyName}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Review company application before creating the Supplier profile.
                </p>
              </div>

              <button
                type="button"
                onClick={closeReview}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Contact Person" value={selected.contactPerson} />
                <Detail label="Email" value={selected.email} />
                <Detail label="Phone" value={selected.phone} />
                <Detail label="WhatsApp" value={selected.whatsapp} />
                <Detail label="Website" value={selected.website} />
                <Detail label="Location" value={getAddressLabel(selected)} />
                <Detail label="NTN" value={selected.ntn} />
                <Detail label="STRN" value={selected.strn} />
                <Detail label="Company Registration" value={selected.companyRegistrationNo} />
                <Detail label="Supplier Profile" value={getSupplierLabel(selected)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ListDetail
                  label="Categories"
                  values={selected.categories}
                />
                <ListDetail
                  label="Brands"
                  values={selected.brands}
                />
                <ListDetail
                  label="Authorized Distributor For"
                  values={selected.distributorFor}
                />
                <ListDetail
                  label="Documents"
                  values={selected.documents?.map(
                    (document) =>
                      document.name ||
                      document.type ||
                      document.url ||
                      "Document"
                  )}
                />
              </div>

              {selected.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Applicant Notes
                  </p>
                  <p className="mt-2 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
                    {selected.notes}
                  </p>
                </div>
              )}

              {selected.rejectionReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                    Previous Rejection Reason
                  </p>
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {selected.rejectionReason}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Review Decision
                </label>

                <select
                  value={nextStatus}
                  onChange={(event) => {
                    setNextStatus(
                      event.target.value as SupplierApplicationStatus
                    );
                  }}
                  disabled={selected.status === "approved"}
                  className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                {nextStatus === "rejected" && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Rejection Reason
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(event) => {
                        setRejectionReason(event.target.value);
                      }}
                      rows={3}
                      placeholder="Explain what must be corrected before resubmission..."
                      className="mt-2 w-full resize-y rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-red-500 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                )}

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Internal Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(event) => {
                      setReviewNotes(event.target.value);
                    }}
                    rows={4}
                    placeholder="Optional review notes..."
                    className="mt-2 w-full resize-y rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-purple-500 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white p-5 sm:flex-row sm:justify-end dark:border-gray-800 dark:bg-gray-900">
              <button
                type="button"
                onClick={closeReview}
                disabled={saving}
                className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
              >
                Close
              </button>

              {selected.status !== "approved" && (
                <button
                  type="button"
                  onClick={() => {
                    void saveStatus();
                  }}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}
                  Save Decision
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-gray-200">
        {value || "—"}
      </p>
    </div>
  );
}

function ListDetail({
  label,
  values,
}: {
  label: string;
  values?: string[];
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
        {values?.length
          ? values.join(", ")
          : "—"}
      </p>
    </div>
  );
}
