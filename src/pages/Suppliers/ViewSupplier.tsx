import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleAlert,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
} from "lucide-react";

import { toast, Toaster } from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";

import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";

import {
  formatSupplierBusinessType,
  formatSupplierStatus,
  formatSupplierVerificationStatus,
  getSupplier,
  getSupplierErrorMessage,
  type Supplier,
  type SupplierStatus,
  type SupplierVerificationStatus,
} from "../../services/supplier/supplier.service";

/* =========================================================
   VIEW SUPPLIER
========================================================= */

export default function ViewSupplier() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canManage =
    hasUserPermission(
      user,
      "suppliers.manage"
    );

  const supplierReference =
    params.supplierId ||
    params.id ||
    "";

  const [supplier, setSupplier] =
    useState<Supplier | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  /* =======================================================
     LOAD SUPPLIER
  ======================================================= */

  const loadSupplier =
    useCallback(
      async (
        showToast = false
      ) => {
        if (!supplierReference) {
          setSupplier(null);
          setLoadError(
            "Supplier ID is missing."
          );
          setLoading(false);
          setRefreshing(false);
          return;
        }

        try {
          setLoadError("");

          const result =
            await getSupplier(
              supplierReference
            );

          setSupplier(result);

          if (showToast) {
            toast.success(
              "Supplier refreshed successfully."
            );
          }
        } catch (error) {
          const message =
            getSupplierErrorMessage(
              error,
              "Unable to load supplier."
            );

          setSupplier(null);
          setLoadError(message);

          if (showToast) {
            toast.error(
              "Unable to refresh supplier",
              {
                description: message,
              }
            );
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [supplierReference]
    );

  useEffect(() => {
    setLoading(true);
    void loadSupplier();
  }, [loadSupplier]);

  const handleRefresh =
    () => {
      if (refreshing) {
        return;
      }

      setRefreshing(true);
      void loadSupplier(true);
    };

  /* =======================================================
     ADDRESS
  ======================================================= */

  const fullAddress =
    useMemo(
      () => {
        if (!supplier) {
          return "—";
        }

        const parts = [
          supplier.address?.line1,
          supplier.address?.line2,
          supplier.address?.city,
          supplier.address?.province,
          supplier.address?.postalCode,
          supplier.address?.country,
        ].filter(
          (
            value
          ): value is string =>
            Boolean(
              value?.trim()
            )
        );

        return (
          parts.join(", ") ||
          "—"
        );
      },
      [supplier]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <PageMeta
          title="Supplier Details | Solar Trade Hub"
          description="View Solar Trade Hub supplier details."
        />

        <PageBreadcrumb
          pageTitle="Supplier Details"
        />

        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[#5b2eff]/10 text-[#8f78ff]">
            <RefreshCw
              size={18}
              className="animate-spin"
            />
          </div>

          <h2 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
            Loading supplier
          </h2>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Fetching supplier information from Solar Trade Hub.
          </p>
        </div>
      </>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    loadError ||
    !supplier
  ) {
    return (
      <>
        <PageMeta
          title="Supplier Not Found | Solar Trade Hub"
          description="Supplier record could not be loaded."
        />

        <PageBreadcrumb
          pageTitle="Supplier Details"
        />

        <Toaster
          position="top-right"
          richColors
          closeButton
        />

        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <CircleAlert
              size={20}
            />
          </div>

          <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
            Supplier could not be loaded
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
            {loadError ||
              "The requested supplier record does not exist."}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLoading(true);
                void loadSupplier();
              }}
            >
              <span className="flex items-center gap-2">
                <RefreshCw
                  size={15}
                />

                Try Again
              </span>
            </Button>

            <Link
              to="/suppliers"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-4 text-sm font-semibold text-white transition hover:bg-[#e83c12]"
            >
              <ArrowLeft
                size={15}
              />

              Back to Suppliers
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${supplier.companyName} | Solar Trade Hub`}
        description={`View Solar Trade Hub supplier ${supplier.companyName}.`}
      />

      <PageBreadcrumb
        pageTitle="Supplier Details"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-4">
        {/* TOP ACTIONS */}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
          >
            <ArrowLeft
              size={15}
            />

            Back
          </button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={
                refreshing
              }
              onClick={
                handleRefresh
              }
            >
              <span className="flex items-center gap-2">
                <RefreshCw
                  size={15}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </span>
            </Button>

            {canManage && (
              <Link
                to={`/suppliers/${encodeURIComponent(
                  supplier.supplierId
                )}/edit`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#5b2eff] px-4 text-sm font-semibold text-white transition hover:bg-[#4720db]"
              >
                <Pencil
                  size={15}
                />

                Edit Supplier
              </Link>
            )}
          </div>
        </div>

        {/* PROFILE HEADER */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
            <SupplierMedia
              supplier={
                supplier
              }
            />

            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="max-w-3xl text-xl font-bold text-gray-900 dark:text-white">
                      {
                        supplier.companyName
                      }
                    </h1>

                    <VerificationBadge
                      status={
                        supplier.verificationStatus
                      }
                    />

                    <StatusBadge
                      status={
                        supplier.status
                      }
                    />

                    {supplier.isFeatured && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Star
                          size={13}
                          fill="currentColor"
                        />

                        Featured
                      </span>
                    )}
                  </div>

                  <p className="mt-2 font-mono text-xs font-semibold text-[#8f78ff]">
                    {
                      supplier.supplierId
                    }
                  </p>

                  {supplier.description ? (
                    <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-gray-500 dark:text-gray-400">
                      {
                        supplier.description
                      }
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-gray-400">
                      No supplier description added.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Metric
                    label="City"
                    value={
                      supplier.address?.city ||
                      "—"
                    }
                  />

                  <Metric
                    label="Business Type"
                    value={
                      formatSupplierBusinessType(
                        supplier.businessType
                      )
                    }
                  />

                  <Metric
                    label="Verification"
                    value={
                      formatSupplierVerificationStatus(
                        supplier.verificationStatus
                      )
                    }
                  />

                  <Metric
                    label="Status"
                    value={
                      formatSupplierStatus(
                        supplier.status
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}

        <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Contact Information"
            description="Supplier business contact details."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
            <InfoItem
              icon={
                <Building2
                  size={16}
                />
              }
              label="Contact Person"
              value={
                supplier.contactPerson ||
                "—"
              }
            />

            <InfoItem
              icon={
                <Phone
                  size={16}
                />
              }
              label="Phone Number"
              value={
                supplier.phone ||
                "—"
              }
              link={
                supplier.phone
                  ? `tel:${supplier.phone}`
                  : undefined
              }
            />

            <InfoItem
              icon={
                <Phone
                  size={16}
                />
              }
              label="WhatsApp"
              value={
                supplier.whatsapp ||
                "—"
              }
            />

            <InfoItem
              icon={
                <Mail
                  size={16}
                />
              }
              label="Email Address"
              value={
                supplier.email ||
                "—"
              }
              link={
                supplier.email
                  ? `mailto:${supplier.email}`
                  : undefined
              }
            />
          </div>
        </section>

        {/* BUSINESS */}

        <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Business Information"
            description="Supplier company and registration information."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
            <InfoItem
              label="Company Name"
              value={
                supplier.companyName
              }
            />

            <InfoItem
              label="Business Type"
              value={
                formatSupplierBusinessType(
                  supplier.businessType
                )
              }
            />

            <InfoItem
              icon={
                supplier.website ? (
                  <ExternalLink
                    size={15}
                  />
                ) : undefined
              }
              label="Website"
              value={
                supplier.website ||
                "—"
              }
              link={
                supplier.website ||
                undefined
              }
            />

            <InfoItem
              label="NTN"
              value={
                supplier.ntn ||
                "—"
              }
            />

            <InfoItem
              label="STRN"
              value={
                supplier.strn ||
                "—"
              }
            />

            <InfoItem
              label="Company Registration No."
              value={
                supplier.companyRegistrationNo ||
                "—"
              }
            />
          </div>
        </section>

        {/* ADDRESS */}

        <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Business Address"
            description="Supplier registered or operating location."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2 xl:col-span-4">
              <InfoItem
                icon={
                  <MapPin
                    size={16}
                  />
                }
                label="Complete Address"
                value={
                  fullAddress
                }
              />
            </div>

            <InfoItem
              label="Address Line 1"
              value={
                supplier.address?.line1 ||
                "—"
              }
            />

            <InfoItem
              label="Address Line 2"
              value={
                supplier.address?.line2 ||
                "—"
              }
            />

            <InfoItem
              label="City"
              value={
                supplier.address?.city ||
                "—"
              }
            />

            <InfoItem
              label="Province"
              value={
                supplier.address?.province ||
                "—"
              }
            />

            <InfoItem
              label="Country"
              value={
                supplier.address?.country ||
                "—"
              }
            />

            <InfoItem
              label="Postal Code"
              value={
                supplier.address?.postalCode ||
                "—"
              }
            />
          </div>
        </section>

        {/* MARKETPLACE PROFILE */}

        <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Marketplace Profile"
            description="Supplier profile configuration stored by Solar Trade Hub."
          />

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Supplier ID"
              value={
                supplier.supplierId
              }
              mono
            />

            <InfoItem
              label="Slug"
              value={
                supplier.slug ||
                "—"
              }
              mono
            />

            <InfoItem
              label="Status"
              value={
                formatSupplierStatus(
                  supplier.status
                )
              }
            />

            <InfoItem
              label="Featured"
              value={
                supplier.isFeatured
                  ? "Yes"
                  : "No"
              }
            />

            <InfoItem
              label="Sort Order"
              value={
                String(
                  supplier.sortOrder ??
                    0
                )
              }
            />

            <InfoItem
              label="Verification"
              value={
                formatSupplierVerificationStatus(
                  supplier.verificationStatus
                )
              }
            />

            <InfoItem
              icon={
                <CalendarDays
                  size={15}
                />
              }
              label="Created"
              value={
                formatDateTime(
                  supplier.createdAt
                )
              }
            />

            <InfoItem
              icon={
                <CalendarDays
                  size={15}
                />
              }
              label="Last Updated"
              value={
                formatDateTime(
                  supplier.updatedAt
                )
              }
            />
          </div>

          <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <CircleAlert
                size={17}
                className="mt-0.5 shrink-0 text-gray-400"
              />

              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Marketplace eligibility is calculated separately
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Supplier status and verification alone do not prove storefront eligibility. Active subscription, feature entitlements and product access are resolved by the separate marketplace access backend.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* VERIFICATION */}

        <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Verification"
            description="Supplier verification and administrative review information."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <InfoItem
              icon={
                <ShieldCheck
                  size={16}
                />
              }
              label="Verification Status"
              value={
                formatSupplierVerificationStatus(
                  supplier.verificationStatus
                )
              }
            />

            <InfoItem
              label="Verified At"
              value={
                formatDateTime(
                  supplier.verifiedAt
                )
              }
            />

            <InfoItem
              label="Verified By"
              value={
                getUserReferenceLabel(
                  supplier.verifiedBy
                )
              }
            />

            <div className="md:col-span-2">
              <InfoItem
                label="Verification Notes"
                value={
                  supplier.verificationNotes ||
                  "No verification notes added."
                }
              />
            </div>
          </div>
        </section>

        {/* AUDIT */}

        <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            title="Audit Information"
            description="Supplier record creation and update information."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
            <InfoItem
              label="Created By"
              value={
                getUserReferenceLabel(
                  supplier.createdBy
                )
              }
            />

            <InfoItem
              label="Updated By"
              value={
                getUserReferenceLabel(
                  supplier.updatedBy
                )
              }
            />

            <InfoItem
              label="Created At"
              value={
                formatDateTime(
                  supplier.createdAt
                )
              }
            />

            <InfoItem
              label="Updated At"
              value={
                formatDateTime(
                  supplier.updatedAt
                )
              }
            />
          </div>
        </section>
      </div>
    </>
  );
}

/* =========================================================
   SUPPLIER MEDIA
========================================================= */

function SupplierMedia({
  supplier,
}: {
  supplier: Supplier;
}) {
  const banner =
    supplier.bannerImage?.trim() ||
    "";

  const logo =
    supplier.logo?.trim() ||
    "";

  const [
    bannerFailed,
    setBannerFailed,
  ] =
    useState(false);

  const [
    logoFailed,
    setLogoFailed,
  ] =
    useState(false);

  useEffect(() => {
    setBannerFailed(false);
  }, [banner]);

  useEffect(() => {
    setLogoFailed(false);
  }, [logo]);

  return (
    <div className="relative min-h-[250px] overflow-hidden bg-gradient-to-br from-[#5b2eff]/10 to-[#ff4b1f]/10">
      {banner &&
      !bannerFailed ? (
        <img
          src={banner}
          alt={`${supplier.companyName} banner`}
          onError={() =>
            setBannerFailed(
              true
            )
          }
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2
            size={54}
            className="text-[#5b2eff]/30"
          />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

      <div className="absolute bottom-5 left-5">
        <div className="flex h-[76px] w-[116px] items-center justify-center overflow-hidden rounded-xl border border-white/60 bg-white p-2 shadow-lg">
          {logo &&
          !logoFailed ? (
            <img
              src={logo}
              alt={`${supplier.companyName} logo`}
              onError={() =>
                setLogoFailed(
                  true
                )
              }
              className="max-h-full w-full object-contain"
            />
          ) : (
            <Building2
              size={28}
              className="text-[#5b2eff]"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   METRIC
========================================================= */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">
        {value || "—"}
      </p>
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
  link,
  mono = false,
  icon,
}: {
  label: string;
  value: string;
  link?: string;
  mono?: boolean;
  icon?: ReactNode;
}) {
  const isHttpLink =
    Boolean(
      link &&
      /^https?:\/\//i.test(
        link
      )
    );

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        {icon && (
          <span className="text-gray-400">
            {icon}
          </span>
        )}

        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
      </div>

      {link ? (
        <a
          href={link}
          target={
            isHttpLink
              ? "_blank"
              : undefined
          }
          rel={
            isHttpLink
              ? "noreferrer"
              : undefined
          }
          className={`mt-1.5 block break-words text-sm font-medium text-[#5b2eff] transition hover:underline dark:text-[#8f78ff] ${
            mono
              ? "font-mono"
              : ""
          }`}
        >
          {value || "—"}
        </a>
      ) : (
        <p
          className={`mt-1.5 break-words text-sm font-medium text-gray-800 dark:text-gray-200 ${
            mono
              ? "font-mono"
              : ""
          }`}
        >
          {value || "—"}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   VERIFICATION BADGE
========================================================= */

function VerificationBadge({
  status,
}: {
  status:
    SupplierVerificationStatus;
}) {
  const styles: Record<
    SupplierVerificationStatus,
    string
  > = {
    verified:
      "bg-[#5b2eff]/10 text-[#5b2eff] dark:text-[#8f78ff]",

    pending:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",

    under_review:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",

    rejected:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status ===
        "verified" && (
        <ShieldCheck
          size={13}
        />
      )}

      {formatSupplierVerificationStatus(
        status
      )}
    </span>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    SupplierStatus;
}) {
  const styles: Record<
    SupplierStatus,
    string
  > = {
    active:
      "bg-green-500/10 text-green-600 dark:text-green-400",

    inactive:
      "bg-gray-500/10 text-gray-500",

    suspended:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {formatSupplierStatus(
        status
      )}
    </span>
  );
}

/* =========================================================
   USER REFERENCE
========================================================= */

function getUserReferenceLabel(
  value:
    Supplier["verifiedBy"] |
    Supplier["createdBy"] |
    Supplier["updatedBy"]
) {
  if (!value) {
    return "—";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  return (
    value.name ||
    value.email ||
    value.id ||
    value._id ||
    "—"
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDateTime(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

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
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}