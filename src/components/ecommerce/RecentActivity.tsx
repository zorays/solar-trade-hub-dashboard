import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSuppliers,
  type Supplier,
} from "../../services/supplier/supplier.service";

import {
  getInstallers,
  type Installer,
} from "../../services/installer/installer.service";

import {
  getTenders,
  type Tender,
} from "../../services/tender/tender.service";

import {
  getProducts,
  type Product,
} from "../../services/product/product.service";

/* =========================================================
   TYPES
========================================================= */

type ActivityType =
  | "supplier"
  | "product"
  | "tender"
  | "installer";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  type: ActivityType;
  statusColor: "green" | "orange";
};

/* =========================================================
   TIME FORMAT
========================================================= */

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  const seconds = Math.max(
    0,
    Math.floor(difference / 1000)
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} ${
      minutes === 1
        ? "minute"
        : "minutes"
    } ago`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    } ago`;
  }

  const days =
    Math.floor(hours / 24);

  if (days < 7) {
    return `${days} ${
      days === 1
        ? "day"
        : "days"
    } ago`;
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year:
        date.getFullYear() !==
        now.getFullYear()
          ? "numeric"
          : undefined,
    }
  ).format(date);
}

/* =========================================================
   DATE VALIDATION
========================================================= */

function validDate(
  value: string | null | undefined
) {
  if (!value) {
    return false;
  }

  return !Number.isNaN(
    new Date(value).getTime()
  );
}

/* =========================================================
   ICON
========================================================= */

function ActivityIcon({
  type,
}: {
  type: ActivityType;
}) {
  if (type === "supplier") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="size-4"
        aria-hidden="true"
      >
        <circle cx="9" cy="8" r="3" />
        <circle cx="16" cy="9" r="2.5" />

        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M15 14h1a4 4 0 0 1 4 4v2" />
      </svg>
    );
  }

  if (type === "product") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="size-4"
        aria-hidden="true"
      >
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </svg>
    );
  }

  if (type === "tender") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        className="size-4"
        aria-hidden="true"
      >
        <path d="M6 3h9l3 3v15H6V3Z" />
        <path d="M15 3v4h4" />
        <path d="M9 11h6M9 15h6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="size-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3" />

      <path d="M7 21v-3a5 5 0 0 1 10 0v3" />
      <path d="M9 5 10 2h4l1 3" />
      <path d="M8 6h8" />
    </svg>
  );
}

/* =========================================================
   ICON STYLE
========================================================= */

function iconStyle(
  type: ActivityType
) {
  switch (type) {
    case "supplier":
      return "bg-[#5b2eff] text-white";

    case "product":
      return "bg-green-500 text-white";

    case "tender":
      return "bg-blue-500 text-white";

    case "installer":
      return "bg-amber-500 text-white";
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RecentActivity() {
  const [
    suppliers,
    setSuppliers,
  ] = useState<Supplier[]>([]);

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    tenders,
    setTenders,
  ] = useState<Tender[]>([]);

  const [
    installers,
    setInstallers,
  ] = useState<Installer[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  /* =======================================================
     LOAD REAL ACTIVITY SOURCES
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadActivity =
      async () => {
        setLoading(true);

        const results =
          await Promise.allSettled([
            getSuppliers({
              page: 1,
              limit: 5,
              sortBy: "createdAt",
              sortOrder: "desc",
            }),

            getProducts({
              page: 1,
              limit: 5,
              sortBy: "updatedAt",
              sortOrder: "desc",
            }),

            getTenders({
              page: 1,
              limit: 5,
              sortBy: "createdAt",
              sortOrder: "desc",
            }),

            getInstallers({
              page: 1,
              limit: 5,
              sortBy: "createdAt",
              sortOrder: "desc",
            }),
          ]);

        if (!active) {
          return;
        }

        const [
          supplierResult,
          productResult,
          tenderResult,
          installerResult,
        ] = results;

        if (
          supplierResult.status ===
          "fulfilled"
        ) {
          setSuppliers(
            supplierResult.value
              .suppliers ?? []
          );
        } else {
          console.error(
            "Recent suppliers error:",
            supplierResult.reason
          );

          setSuppliers([]);
        }

        if (
          productResult.status ===
          "fulfilled"
        ) {
          setProducts(
            productResult.value
              .products ?? []
          );
        } else {
          console.error(
            "Recent products error:",
            productResult.reason
          );

          setProducts([]);
        }

        if (
          tenderResult.status ===
          "fulfilled"
        ) {
          setTenders(
            tenderResult.value
              .tenders ?? []
          );
        } else {
          console.error(
            "Recent tenders error:",
            tenderResult.reason
          );

          setTenders([]);
        }

        if (
          installerResult.status ===
          "fulfilled"
        ) {
          setInstallers(
            installerResult.value
              .installers ?? []
          );
        } else {
          console.error(
            "Recent installers error:",
            installerResult.reason
          );

          setInstallers([]);
        }

        setLoading(false);
      };

    void loadActivity();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================================
     BUILD REAL ACTIVITY
  ======================================================= */

  const activities =
    useMemo<ActivityItem[]>(
      () => {
        const items: ActivityItem[] =
          [];

        /* SUPPLIERS */

        suppliers.forEach(
          (supplier) => {
            if (
              !validDate(
                supplier.createdAt
              )
            ) {
              return;
            }

            const id =
              supplier.supplierId ||
              supplier.id ||
              supplier._id;

            items.push({
              id: `supplier-${id}`,
              title:
                "New supplier registered",

              description:
                supplier.companyName ||
                supplier.supplierId ||
                "Supplier",

              date:
                supplier.createdAt,

              type: "supplier",

              statusColor:
                supplier.verificationStatus ===
                "verified"
                  ? "green"
                  : "orange",
            });
          }
        );

        /* PRODUCTS */

        products.forEach(
          (product) => {
            if (
              !validDate(
                product.updatedAt
              )
            ) {
              return;
            }

            const id =
              product.externalProductId ||
              product.id ||
              product._id;

            items.push({
              id: `product-${id}`,
              title:
                "Product updated",

              description:
                product.name ||
                product.sku ||
                "Catalogue product",

              date:
                product.updatedAt!,

              type: "product",

              statusColor:
                "green",
            });
          }
        );

        /* TENDERS */

        tenders.forEach(
          (tender) => {
            if (
              !validDate(
                tender.createdAt
              )
            ) {
              return;
            }

            const id =
              tender.tenderId ||
              tender.id ||
              tender._id;

            items.push({
              id: `tender-${id}`,
              title:
                "Tender created",

              description:
                tender.title ||
                tender.tenderId ||
                "Tender",

              date:
                tender.createdAt!,

              type: "tender",

              statusColor:
                tender.status ===
                "open"
                  ? "green"
                  : "orange",
            });
          }
        );

        /* INSTALLERS */

        installers.forEach(
          (installer) => {
            if (
              !validDate(
                installer.createdAt
              )
            ) {
              return;
            }

            const id =
              installer.installerId ||
              installer.id ||
              installer._id;

            items.push({
              id: `installer-${id}`,

              title:
                installer.verificationStatus ===
                "verified"
                  ? "Installer registered"
                  : "Installer verification request",

              description:
                installer.displayName ||
                installer.companyName ||
                installer.installerId ||
                "Installer",

              date:
                installer.createdAt!,

              type: "installer",

              statusColor:
                installer.verificationStatus ===
                "verified"
                  ? "green"
                  : "orange",
            });
          }
        );

        /*
         * Merge every real source, sort newest first,
         * and keep only the latest five events.
         */
        return items
          .sort(
            (a, b) =>
              new Date(
                b.date
              ).getTime() -
              new Date(
                a.date
              ).getTime()
          )
          .slice(0, 5);
      },
      [
        suppliers,
        products,
        tenders,
        installers,
      ]
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="flex h-full min-h-[390px] flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* HEADER */}

      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Latest marketplace activity
          </p>
        </div>
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-xs text-gray-400">
          Loading recent activity...
        </div>
      ) : activities.length === 0 ? (
        /* EMPTY */

        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.05]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="size-5"
              aria-hidden="true"
            >
              <path d="M12 8v4l3 2" />
              <circle
                cx="12"
                cy="12"
                r="9"
              />
            </svg>
          </div>

          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            No recent activity
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Marketplace activity will
            appear here.
          </p>
        </div>
      ) : (
        /* REAL LIST */

        <div className="flex flex-1 flex-col justify-between gap-4">
          {activities.map(
            (activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3"
              >
                {/* ICON */}

                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${iconStyle(
                    activity.type
                  )}`}
                >
                  <ActivityIcon
                    type={
                      activity.type
                    }
                  />
                </div>

                {/* CONTENT */}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                    {activity.title}
                  </p>

                  <p className="mt-0.5 truncate text-xs leading-5 text-gray-500 dark:text-gray-400">
                    {
                      activity.description
                    }
                  </p>
                </div>

                {/* TIME */}

                <div className="flex shrink-0 items-center gap-2">
                  <span className="whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(
                      activity.date
                    )}
                  </span>

                  <span
                    className={`size-2 rounded-full ${
                      activity.statusColor ===
                      "green"
                        ? "bg-green-500"
                        : "bg-amber-400"
                    }`}
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}