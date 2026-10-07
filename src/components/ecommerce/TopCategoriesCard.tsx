import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

import {
  getProducts,
  type Product,
} from "../../services/product/product.service";

/* =========================================================
   TYPES
========================================================= */

type CategoryItem = {
  name: string;
  count: number;
  percentage: number;
  color: string;
};

/* =========================================================
   COLORS
========================================================= */

const CATEGORY_COLORS = [
  "#ff4b1f",
  "#2f80ed",
  "#22c55e",
  "#f59e0b",
  "#7c4dff",
  "#94a3b8",
];

/* =========================================================
   CATEGORY NAME
========================================================= */

function getCategoryName(
  product: Product
): string {
  const category = product.category;

  if (!category) {
    return "Uncategorized";
  }

  if (typeof category === "string") {
    return category.trim() || "Uncategorized";
  }

  if (
    typeof category === "object" &&
    category !== null
  ) {
    const value =
      "name" in category
        ? category.name
        : null;

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "Uncategorized";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function TopCategoriesCard() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [totalProducts, setTotalProducts] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     LOAD ALL REAL PRODUCTS
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const firstPage =
          await getProducts({
            page: 1,
            limit: 100,
          });

        if (!active) {
          return;
        }

        const firstProducts =
          firstPage.products ?? [];

        const pagination =
          firstPage.pagination;

        const total =
          pagination?.total ??
          firstProducts.length;

        const totalPages =
          pagination?.totalPages ?? 1;

        /*
         * We need every product here because category
         * percentages must be calculated from real
         * catalogue records, not only page 1.
         */
        if (totalPages <= 1) {
          setProducts(firstProducts);
          setTotalProducts(total);
          return;
        }

        const requests =
          Array.from(
            {
              length: totalPages - 1,
            },
            (_, index) =>
              getProducts({
                page: index + 2,
                limit: 100,
              })
          );

        const remainingPages =
          await Promise.all(requests);

        if (!active) {
          return;
        }

        const allProducts = [
          ...firstProducts,
          ...remainingPages.flatMap(
            (page) =>
              page.products ?? []
          ),
        ];

        setProducts(allProducts);
        setTotalProducts(total);
      } catch (fetchError) {
        console.error(
          "Failed to load product categories:",
          fetchError
        );

        if (active) {
          setProducts([]);
          setTotalProducts(0);
          setError(
            "Unable to load product categories."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================================
     REAL CATEGORY DISTRIBUTION
  ======================================================= */

  const categories =
    useMemo<CategoryItem[]>(() => {
      if (!products.length) {
        return [];
      }

      const counts =
        new Map<string, number>();

      products.forEach((product) => {
        const categoryName =
          getCategoryName(product);

        counts.set(
          categoryName,
          (counts.get(categoryName) ?? 0) +
            1
        );
      });

      const sorted = Array.from(
        counts.entries()
      )
        .map(([name, count]) => ({
          name,
          count,
        }))
        .sort(
          (a, b) =>
            b.count - a.count
        );

      /*
       * Keep top 5 categories.
       * Everything else becomes Others.
       */
      const topCategories =
        sorted.slice(0, 5);

      const otherCount =
        sorted
          .slice(5)
          .reduce(
            (sum, category) =>
              sum + category.count,
            0
          );

      const visible = [
        ...topCategories,
      ];

      if (otherCount > 0) {
        visible.push({
          name: "Others",
          count: otherCount,
        });
      }

      const countedProducts =
        products.length;

      return visible.map(
        (category, index) => ({
          ...category,

          percentage:
            countedProducts > 0
              ? (category.count /
                  countedProducts) *
                100
              : 0,

          color:
            CATEGORY_COLORS[
              index %
                CATEGORY_COLORS.length
            ],
        })
      );
    }, [products]);

  /* =======================================================
     CHART DATA
  ======================================================= */

  const series = useMemo(
    () =>
      categories.map(
        (category) =>
          category.count
      ),
    [categories]
  );

  const options =
    useMemo<ApexOptions>(
      () => ({
        colors: categories.map(
          (category) =>
            category.color
        ),

        chart: {
          type: "donut",

          fontFamily:
            "Outfit, sans-serif",

          sparkline: {
            enabled: false,
          },
        },

        labels: categories.map(
          (category) =>
            category.name
        ),

        legend: {
          show: false,
        },

        dataLabels: {
          enabled: false,
        },

        stroke: {
          width: 2,
          colors: ["#ffffff"],
        },

        plotOptions: {
          pie: {
            expandOnClick: false,

            donut: {
              size: "64%",

              labels: {
                show: true,

                name: {
                  show: true,
                  offsetY: 18,
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#98A2B3",
                },

                value: {
                  show: true,
                  offsetY: -12,
                  fontSize: "27px",
                  fontWeight: 700,
                  color: "#ffffff",

                  /*
                   * Hovered category:
                   * show actual product count.
                   */
                  formatter: (
                    value
                  ) =>
                    Number(
                      value
                    ).toLocaleString(
                      "en-PK"
                    ),
                },

                total: {
                  show: true,
                  label: "Products",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#98A2B3",

                  formatter: () =>
                    totalProducts.toLocaleString(
                      "en-PK"
                    ),
                },
              },
            },
          },
        },

        tooltip: {
          theme: "dark",

          y: {
            formatter: (
              value,
              {
                seriesIndex,
              }
            ) => {
              const category =
                categories[
                  seriesIndex
                ];

              if (!category) {
                return `${value} products`;
              }

              return `${value.toLocaleString(
                "en-PK"
              )} products (${category.percentage.toFixed(
                1
              )}%)`;
            },
          },
        },
      }),
      [
        categories,
        totalProducts,
      ]
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="flex h-full min-h-[390px] flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* HEADER */}

      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Product Categories
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            External catalogue distribution
          </p>
        </div>
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-xs text-gray-400">
          Loading product categories...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-red-500">
          {error}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            No product categories
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Catalogue categories will
            appear here.
          </p>
        </div>
      ) : (
        /* MAIN CONTENT */

        <div className="flex flex-1 items-center">
          <div className="grid w-full grid-cols-1 items-center gap-5 xl:grid-cols-[210px_minmax(0,1fr)]">
            {/* DONUT */}

            <div className="flex items-center justify-center">
              <Chart
                options={options}
                series={series}
                type="donut"
                height={210}
                width={210}
              />
            </div>

            {/* LEGEND */}

            <div className="space-y-3.5">
              {categories.map(
                (category) => (
                  <div
                    key={
                      category.name
                    }
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            category.color,
                        }}
                      />

                      <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                        {
                          category.name
                        }
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-gray-400">
                        {category.count.toLocaleString(
                          "en-PK"
                        )}
                      </span>

                      <span className="min-w-[42px] text-right text-xs font-bold text-gray-900 dark:text-white">
                        {category.percentage.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}