import {
  useEffect,
  useRef,
} from "react";

import Chart from "react-apexcharts";

import type {
  ApexOptions,
} from "apexcharts";

import flatpickr from "flatpickr";

import ChartTab from "../common/ChartTab";

import {
  CalenderIcon,
} from "../../icons";

export default function MarketplaceStatistics() {
  const datePickerRef =
    useRef<HTMLInputElement>(
      null
    );

  useEffect(() => {
    if (!datePickerRef.current) {
      return;
    }

    const today =
      new Date();

    const sevenDaysAgo =
      new Date();

    sevenDaysAgo.setDate(
      today.getDate() - 6
    );

    const fp =
      flatpickr(
        datePickerRef.current,
        {
          mode: "range",

          static: true,

          monthSelectorType:
            "static",

          dateFormat:
            "M d",

          defaultDate: [
            sevenDaysAgo,
            today,
          ],

          clickOpens: true,

          prevArrow:
            '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',

          nextArrow:
            '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        }
      );

    return () => {
      if (!Array.isArray(fp)) {
        fp.destroy();
      }
    };
  }, []);

  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign:
        "left",
    },

    colors: [
      "#ff4b1f",
      "#5b2eff",
    ],

    chart: {
      fontFamily:
        "Outfit, sans-serif",

      height: 310,

      type: "area",

      toolbar: {
        show: false,
      },
    },

    stroke: {
      curve: "smooth",
      width: [2.5, 2.5],
    },

    fill: {
      type: "gradient",

      gradient: {
        opacityFrom: 0.34,
        opacityTo: 0.02,
      },
    },

    markers: {
      size: 0,

      strokeColors:
        "#ffffff",

      strokeWidth: 2,

      hover: {
        size: 6,
      },
    },

    grid: {
      borderColor:
        "#EAECF0",

      strokeDashArray:
        4,

      xaxis: {
        lines: {
          show: false,
        },
      },

      yaxis: {
        lines: {
          show: true,
        },
      },
    },

    dataLabels: {
      enabled: false,
    },

    tooltip: {
      enabled: true,

      shared: true,

      intersect: false,
    },

    xaxis: {
      type: "category",

      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],

      axisBorder: {
        show: false,
      },

      axisTicks: {
        show: false,
      },

      labels: {
        style: {
          fontSize:
            "12px",

          colors:
            "#98A2B3",
        },
      },

      tooltip: {
        enabled: false,
      },
    },

    yaxis: {
      labels: {
        style: {
          fontSize:
            "12px",

          colors: [
            "#6B7280",
          ],
        },
      },

      title: {
        text: "",
      },
    },
  };

  const series = [
    {
      name:
        "Marketplace Listings",

      data: [
        180,
        205,
        226,
        248,
        271,
        295,
        328,
        351,
        389,
        421,
        458,
        496,
      ],
    },

    {
      name:
        "Verified Businesses",

      data: [
        42,
        48,
        55,
        62,
        71,
        79,
        91,
        104,
        119,
        131,
        146,
        162,
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="w-full">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px w-5 bg-[#5b2eff]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b2eff]">
              Analytics
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Marketplace Statistics
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Marketplace listings and verified business growth over time.
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex items-center gap-3 sm:justify-end">
          <ChartTab />

          <div className="relative inline-flex items-center">
            <CalenderIcon className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-5 -translate-x-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 lg:left-3 lg:translate-x-0" />

            <input
              ref={
                datePickerRef
              }
              className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200 bg-white text-transparent outline-none dark:border-gray-700 dark:bg-gray-800 lg:h-auto lg:w-40 lg:py-2 lg:pl-10 lg:pr-3 lg:text-sm lg:font-medium lg:text-gray-700 dark:lg:text-gray-300"
              placeholder="Select date range"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* LEGEND */}
      <div className="mb-5 flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#ff4b1f]" />

          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Marketplace Listings
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#5b2eff]" />

          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Verified Businesses
          </span>
        </div>
      </div>

      {/* CHART */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart
            options={options}
            series={series}
            type="area"
            height={310}
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Solar Trade Hub marketplace analytics
        </p>

        <span className="rounded-full bg-[#5b2eff]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5b2eff] dark:bg-[#5b2eff]/20">
          Live Metrics
        </span>
      </div>
    </div>
  );
}