import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { CalendarDays } from "lucide-react";

import {
  getUsers,
  type DashboardUser,
} from "../../services/user/user.service";

import {
  getTenders,
  type Tender,
} from "../../services/tender/tender.service";

import {
  getProducts,
  type Product,
} from "../../services/product/product.service";

type ActivityType =
  | "Orders"
  | "Users"
  | "Products"
  | "Tenders";

type MonthBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

const tabs: ActivityType[] = [
  "Orders",
  "Users",
  "Products",
  "Tenders",
];

/* =========================================================
   MONTH HELPERS
========================================================= */

const toMonthValue = (date: Date) => {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const fromMonthValue = (value: string) => {
  const [year, month] = value.split("-").map(Number);

  return new Date(year, month - 1, 1);
};

const formatMonthYear = (value: string) => {
  const date = fromMonthValue(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
};

const getCurrentMonth = () => {
  return toMonthValue(new Date());
};

const getDefaultStartMonth = () => {
  const now = new Date();

  return toMonthValue(
    new Date(
      now.getFullYear(),
      now.getMonth() - 8,
      1
    )
  );
};

/* =========================================================
   BUILD MONTH RANGE
========================================================= */

const buildMonthBuckets = (
  startMonth: string,
  endMonth: string
): MonthBucket[] => {
  const start = fromMonthValue(startMonth);
  const end = fromMonthValue(endMonth);

  if (start > end) {
    return [];
  }

  const buckets: MonthBucket[] = [];

  const cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    1
  );

  while (
    cursor <= end &&
    buckets.length < 24
  ) {
    const bucketStart = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      1
    );

    const bucketEnd = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      1
    );

    const key = toMonthValue(bucketStart);

    const label = new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        year:
          start.getFullYear() !== end.getFullYear()
            ? "2-digit"
            : undefined,
      }
    ).format(bucketStart);

    buckets.push({
      key,
      label,
      start: bucketStart,
      end: bucketEnd,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
};

/* =========================================================
   MONTHLY AGGREGATION
========================================================= */

const countRecordsByDate = <T,>(
  records: T[],
  buckets: MonthBucket[],
  getDate: (
    record: T
  ) => string | null | undefined
) => {
  return buckets.map((bucket) => {
    let total = 0;

    for (const record of records) {
      const rawDate = getDate(record);

      if (!rawDate) {
        continue;
      }

      const date = new Date(rawDate);

      if (Number.isNaN(date.getTime())) {
        continue;
      }

      if (
        date >= bucket.start &&
        date < bucket.end
      ) {
        total += 1;
      }
    }

    return total;
  });
};

/* =========================================================
   LOAD ALL PRODUCTS
========================================================= */

const loadAllProducts =
  async (): Promise<Product[]> => {
    const first = await getProducts({
      page: 1,
      limit: 100,
      sortBy: "updatedAt",
      sortOrder: "asc",
    });

    const allProducts = [
      ...(first.products ?? []),
    ];

    const totalPages = Number(
      first.pagination?.totalPages ?? 1
    );

    for (
      let page = 2;
      page <= totalPages;
      page += 1
    ) {
      const result = await getProducts({
        page,
        limit: 100,
        sortBy: "updatedAt",
        sortOrder: "asc",
      });

      allProducts.push(
        ...(result.products ?? [])
      );
    }

    return allProducts;
  };

/* =========================================================
   LOAD ALL TENDERS
========================================================= */

const loadAllTenders =
  async (): Promise<Tender[]> => {
    const first = await getTenders({
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "asc",
    });

    const allTenders = [
      ...(first.tenders ?? []),
    ];

    const totalPages = Number(
      first.pagination?.totalPages ?? 1
    );

    for (
      let page = 2;
      page <= totalPages;
      page += 1
    ) {
      const result = await getTenders({
        page,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "asc",
      });

      allTenders.push(
        ...(result.tenders ?? [])
      );
    }

    return allTenders;
  };

/* =========================================================
   COMPONENT
========================================================= */

export default function PlatformActivityChart() {
  const [
    activeTab,
    setActiveTab,
  ] = useState<ActivityType>("Orders");

  const [
    startMonth,
    setStartMonth,
  ] = useState(getDefaultStartMonth);

  const [
    endMonth,
    setEndMonth,
  ] = useState(getCurrentMonth);

  const [
    users,
    setUsers,
  ] = useState<DashboardUser[]>([]);

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    tenders,
    setTenders,
  ] = useState<Tender[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    showDateRange,
    setShowDateRange,
  ] = useState(false);

  const dateRangeRef =
    useRef<HTMLDivElement | null>(null);

  /* =======================================================
     CLOSE CALENDAR ON OUTSIDE CLICK
  ======================================================= */

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        dateRangeRef.current &&
        !dateRangeRef.current.contains(
          event.target as Node
        )
      ) {
        setShowDateRange(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadActivity = async () => {
      setLoading(true);

      const [
        usersResult,
        productsResult,
        tendersResult,
      ] = await Promise.allSettled([
        getUsers(),
        loadAllProducts(),
        loadAllTenders(),
      ]);

      if (!mounted) {
        return;
      }

      /* USERS */

      if (
        usersResult.status === "fulfilled"
      ) {
        setUsers(
          Array.isArray(
            usersResult.value?.users
          )
            ? usersResult.value.users
            : []
        );
      } else {
        console.error(
          "Users activity error:",
          usersResult.reason
        );

        setUsers([]);
      }

      /* PRODUCTS */

      if (
        productsResult.status ===
        "fulfilled"
      ) {
        setProducts(productsResult.value);
      } else {
        console.error(
          "Products activity error:",
          productsResult.reason
        );

        setProducts([]);
      }

      /* TENDERS */

      if (
        tendersResult.status ===
        "fulfilled"
      ) {
        setTenders(tendersResult.value);
      } else {
        console.error(
          "Tenders activity error:",
          tendersResult.reason
        );

        setTenders([]);
      }

      setLoading(false);
    };

    void loadActivity();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     RANGE
  ======================================================= */

  const monthBuckets = useMemo(
    () =>
      buildMonthBuckets(
        startMonth,
        endMonth
      ),
    [startMonth, endMonth]
  );

  const chartMonths = useMemo(
    () =>
      monthBuckets.map(
        (bucket) => bucket.label
      ),
    [monthBuckets]
  );

  const rangeLabel = useMemo(
    () =>
      `${formatMonthYear(
        startMonth
      )} – ${formatMonthYear(
        endMonth
      )}`,
    [startMonth, endMonth]
  );

  /* =======================================================
     REAL ACTIVITY
  ======================================================= */

  const userData = useMemo(
    () =>
      countRecordsByDate(
        users,
        monthBuckets,
        (user) => user.createdAt
      ),
    [users, monthBuckets]
  );

  /*
   * External products do not expose a reliable
   * createdAt field, so product activity uses updatedAt.
   */
  const productData = useMemo(
    () =>
      countRecordsByDate(
        products,
        monthBuckets,
        (product) => product.updatedAt
      ),
    [products, monthBuckets]
  );

  const tenderData = useMemo(
    () =>
      countRecordsByDate(
        tenders,
        monthBuckets,
        (tender) => tender.createdAt
      ),
    [tenders, monthBuckets]
  );

  /*
   * Order dashboard service is not connected yet.
   */
  const orderData = useMemo(
    () =>
      monthBuckets.map(() => 0),
    [monthBuckets]
  );

  /* =======================================================
     ACTIVE SERIES
  ======================================================= */

  const chartData = useMemo(() => {
    switch (activeTab) {
      case "Users":
        return userData;

      case "Products":
        return productData;

      case "Tenders":
        return tenderData;

      case "Orders":
      default:
        return orderData;
    }
  }, [
    activeTab,
    userData,
    productData,
    tenderData,
    orderData,
  ]);

  /* =======================================================
     CHART OPTIONS
  ======================================================= */

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "bar",
        height: 250,
        toolbar: {
          show: false,
        },
        fontFamily: "inherit",
        foreColor: "#94a3b8",
      },

      colors: ["#ff4b1f"],

      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth:
            monthBuckets.length > 12
              ? "55%"
              : "42%",
          distributed: false,
        },
      },

      dataLabels: {
        enabled: false,
      },

      stroke: {
        show: false,
      },

      grid: {
        borderColor: "#223047",
        strokeDashArray: 4,
        padding: {
          left: 4,
          right: 4,
          top: 0,
          bottom: 0,
        },
      },

      xaxis: {
        categories: chartMonths,

        axisBorder: {
          show: false,
        },

        axisTicks: {
          show: false,
        },

        labels: {
          rotate:
            monthBuckets.length > 12
              ? -45
              : 0,

          hideOverlappingLabels: true,

          style: {
            fontSize: "11px",
            colors: "#94a3b8",
          },
        },
      },

      yaxis: {
        min: 0,
        forceNiceScale: true,

        labels: {
          formatter: (value) =>
            Math.round(value).toString(),

          style: {
            fontSize: "11px",
            colors: "#94a3b8",
          },
        },
      },

      tooltip: {
        theme: "dark",

        x: {
          formatter: (
            _value,
            context
          ) => {
            const bucket =
              monthBuckets[
                context.dataPointIndex
              ];

            if (!bucket) {
              return "";
            }

            return new Intl.DateTimeFormat(
              "en-US",
              {
                month: "long",
                year: "numeric",
              }
            ).format(bucket.start);
          },
        },

        y: {
          formatter: (value) =>
            Math.round(
              value
            ).toLocaleString("en-PK"),
        },
      },

      fill: {
        opacity: 1,
      },

      legend: {
        show: false,
      },
    }),
    [
      chartMonths,
      monthBuckets,
    ]
  );

  const series = useMemo(
    () => [
      {
        name: activeTab,
        data: chartData,
      },
    ],
    [activeTab, chartData]
  );

  /* =======================================================
     RANGE HANDLERS
  ======================================================= */

  const handleStartMonth = (
    value: string
  ) => {
    if (!value) {
      return;
    }

    if (value > endMonth) {
      setEndMonth(value);
    }

    setStartMonth(value);
  };

  const handleEndMonth = (
    value: string
  ) => {
    if (!value) {
      return;
    }

    if (value < startMonth) {
      setStartMonth(value);
    }

    setEndMonth(value);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex h-full min-h-[390px] flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* HEADER */}

      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        {/* TITLE */}

        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Platform Activity
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Marketplace performance overview
            <span className="hidden sm:inline">
              {" "}
              · {rangeLabel}
            </span>
          </p>
        </div>

        {/* CONTROLS */}

        <div className="flex flex-wrap items-center gap-2">
          {/* TABS */}

          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-white/[0.05]">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() =>
                  setActiveTab(tab)
                }
                className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition ${
                  activeTab === tab
                    ? "bg-[#ff4b1f] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* CALENDAR RANGE */}

          <div
            ref={dateRangeRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() =>
                setShowDateRange(
                  (current) => !current
                )
              }
              aria-label="Select activity date range"
              aria-expanded={showDateRange}
              title={rangeLabel}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                showDateRange
                  ? "border-[#ff4b1f] bg-[#ff4b1f]/10 text-[#ff4b1f]"
                  : "border-gray-200 bg-white text-gray-500 hover:border-[#ff4b1f] hover:text-[#ff4b1f] dark:border-gray-700 dark:bg-[#111827] dark:text-gray-400"
              }`}
            >
              <CalendarDays className="size-[17px]" />
            </button>

            {/* RANGE POPUP */}

            {showDateRange && (
              <div className="absolute right-0 top-11 z-50 w-[300px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-[#111827]">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Activity Range
                  </p>

                  <p className="mt-1 text-[11px] text-gray-400">
                    Select the months to display
                  </p>
                </div>

                <div className="space-y-3">
                  {/* FROM */}

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      From
                    </span>

                    <input
                      type="month"
                      value={startMonth}
                      max={endMonth}
                      onChange={(event) =>
                        handleStartMonth(
                          event.target.value
                        )
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-[#ff4b1f] dark:border-gray-700 dark:bg-[#0f172a] dark:text-gray-200"
                    />
                  </label>

                  {/* TO */}

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      To
                    </span>

                    <input
                      type="month"
                      value={endMonth}
                      min={startMonth}
                      max={getCurrentMonth()}
                      onChange={(event) =>
                        handleEndMonth(
                          event.target.value
                        )
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-[#ff4b1f] dark:border-gray-700 dark:bg-[#0f172a] dark:text-gray-200"
                    />
                  </label>
                </div>

                {/* POPUP FOOTER */}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <span className="min-w-0 truncate text-[11px] text-gray-400">
                    {rangeLabel}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setShowDateRange(false)
                    }
                    className="shrink-0 rounded-lg bg-[#ff4b1f] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE RANGE */}

      <p className="mb-2 text-xs text-gray-400 sm:hidden">
        {rangeLabel}
      </p>

      {/* CHART */}

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Loading platform activity...
          </div>
        ) : (
          <Chart
            key={`${activeTab}-${startMonth}-${endMonth}`}
            options={options}
            series={series}
            type="bar"
            height={250}
          />
        )}
      </div>
    </div>
  );
}