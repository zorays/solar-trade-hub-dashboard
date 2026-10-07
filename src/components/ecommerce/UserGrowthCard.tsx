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
  getMarketplaceUserGrowth,
  type MarketplaceUserGrowth,
} from "../../services/reports/report.service";

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
      now.getMonth() - 5,
      1
    )
  );
};

const getEarliestAvailableMonth = () => {
  const now = new Date();

  return toMonthValue(
    new Date(
      now.getFullYear(),
      now.getMonth() - 11,
      1
    )
  );
};

/* =========================================================
   USER GROWTH CARD
========================================================= */

export default function UserGrowthCard() {
  const [
    growth,
    setGrowth,
  ] = useState<MarketplaceUserGrowth | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    startMonth,
    setStartMonth,
  ] = useState(getDefaultStartMonth);

  const [
    endMonth,
    setEndMonth,
  ] = useState(getCurrentMonth);

  const [
    showDateRange,
    setShowDateRange,
  ] = useState(false);

  const dateRangeRef =
    useRef<HTMLDivElement | null>(null);

  const earliestMonth =
    getEarliestAvailableMonth();

  const currentMonth =
    getCurrentMonth();

  /* =======================================================
     LOAD REAL 12-MONTH GROWTH DATA
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadGrowth = async () => {
      try {
        setLoading(true);
        setError(null);

        /*
         * Backend currently supports 3m / 6m / 12m.
         * Fetch the full real 12-month dataset so the
         * calendar can filter any period within it.
         */
        const data =
          await getMarketplaceUserGrowth("12m");

        if (!active) {
          return;
        }

        setGrowth(data);
      } catch (fetchError) {
        console.error(
          "Failed to load user growth:",
          fetchError
        );

        if (active) {
          setGrowth(null);
          setError(
            "Unable to load user growth."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadGrowth();

    return () => {
      active = false;
    };
  }, []);

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
     SELECTED RANGE
  ======================================================= */

  const rangeLabel = useMemo(() => {
    return `${formatMonthYear(
      startMonth
    )} – ${formatMonthYear(endMonth)}`;
  }, [startMonth, endMonth]);

  /*
   * API returns chronological monthly data.
   *
   * Because the endpoint is 12m-based, map each returned
   * item to its actual calendar month based on its position.
   */
  const filteredData = useMemo(() => {
    if (!growth?.data?.length) {
      return [];
    }

    const end = new Date();

    const datedData = growth.data.map(
      (item, index) => {
        const offset =
          growth.data.length - 1 - index;

        const monthDate = new Date(
          end.getFullYear(),
          end.getMonth() - offset,
          1
        );

        return {
          ...item,
          monthKey:
            toMonthValue(monthDate),
        };
      }
    );

    return datedData.filter(
      (item) =>
        item.monthKey >= startMonth &&
        item.monthKey <= endMonth
    );
  }, [
    growth,
    startMonth,
    endMonth,
  ]);

  /* =======================================================
     REAL CHART DATA
  ======================================================= */

  const chartMonths = useMemo(() => {
    return filteredData.map(
      (item) => item.label
    );
  }, [filteredData]);

  const supplierData = useMemo(() => {
    return filteredData.map(
      (item) => item.suppliers
    );
  }, [filteredData]);

  const installerData = useMemo(() => {
    return filteredData.map(
      (item) => item.installers
    );
  }, [filteredData]);

  /* =======================================================
     CHART OPTIONS
  ======================================================= */

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "area",
        height: 250,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
        fontFamily: "inherit",
        foreColor: "#94a3b8",
      },

      colors: [
        "#ff4b1f",
        "#3b82f6",
      ],

      dataLabels: {
        enabled: false,
      },

      stroke: {
        curve: "smooth",
        width: 2.5,
      },

      fill: {
        type: "gradient",

        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.22,
          opacityTo: 0.02,
          stops: [
            0,
            90,
            100,
          ],
        },
      },

      markers: {
        size: 0,

        hover: {
          size: 5,
        },
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

      legend: {
        show: true,
        position: "top",
        horizontalAlign: "left",
        fontSize: "11px",

        labels: {
          colors: "#94a3b8",
        },

        markers: {
          size: 5,
        },

        itemMargin: {
          horizontal: 10,
          vertical: 0,
        },
      },

      tooltip: {
        theme: "dark",
        shared: true,
        intersect: false,

        y: {
          formatter: (value) =>
            Math.round(
              value
            ).toLocaleString("en-PK"),
        },
      },

      noData: {
        text: "No growth data available",
        align: "center",
        verticalAlign: "middle",

        style: {
          color: "#94a3b8",
          fontSize: "12px",
        },
      },
    }),
    [chartMonths]
  );

  /* =======================================================
     SERIES
  ======================================================= */

  const series = useMemo(
    () => [
      {
        name: "Suppliers",
        data: supplierData,
      },
      {
        name: "Installers",
        data: installerData,
      },
    ],
    [
      supplierData,
      installerData,
    ]
  );

  /* =======================================================
     DATE HANDLERS
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
     UI
  ======================================================= */

  return (
    <div className="flex h-full min-h-[390px] flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* HEADER */}

      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Growth
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Suppliers and installers growth
            <span className="hidden sm:inline">
              {" "}
              · {rangeLabel}
            </span>
          </p>
        </div>

        {/* CALENDAR */}

        <div
          ref={dateRangeRef}
          className="relative shrink-0"
        >
          <button
            type="button"
            onClick={() =>
              setShowDateRange(
                (current) => !current
              )
            }
            aria-label="Select user growth date range"
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

          {/* DATE POPUP */}

          {showDateRange && (
            <div className="absolute right-0 top-11 z-50 w-[300px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-[#111827]">
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Growth Range
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
                    min={earliestMonth}
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
                    max={currentMonth}
                    onChange={(event) =>
                      handleEndMonth(
                        event.target.value
                      )
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-[#ff4b1f] dark:border-gray-700 dark:bg-[#0f172a] dark:text-gray-200"
                  />
                </label>
              </div>

              {/* FOOTER */}

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

      {/* MOBILE RANGE */}

      <p className="mb-2 text-xs text-gray-400 sm:hidden">
        {rangeLabel}
      </p>

      {/* CHART */}

      <div className="relative min-h-0 flex-1">
        {loading && !growth ? (
          <div className="flex h-[250px] items-center justify-center text-xs text-gray-400">
            Loading growth data...
          </div>
        ) : error ? (
          <div className="flex h-[250px] items-center justify-center text-xs text-red-500">
            {error}
          </div>
        ) : (
          <Chart
            key={`${startMonth}-${endMonth}`}
            options={options}
            series={series}
            type="area"
            height={250}
          />
        )}
      </div>
    </div>
  );
}