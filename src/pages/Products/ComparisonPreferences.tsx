import { useCallback, useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  createBrand,
  getBrands,
  getBrandErrorMessage,
  updateBrand,
  type Brand,
} from "../../services/brand/brand.service";
import { getProducts } from "../../services/product/product.service";

const PAGE_SIZE = 100;

function brandName(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name?: unknown }).name ?? "").trim();
  }
  return "";
}

function makeSlug(value: string): string {
  return value.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function ComparisonPreferences() {
  const [catalogNames, setCatalogNames] = useState<string[]>([]);
  const [registered, setRegistered] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [firstProducts, firstBrands] = await Promise.all([
        getProducts({ page: 1, limit: PAGE_SIZE }),
        getBrands({ page: 1, limit: PAGE_SIZE }),
      ]);

      const productPages = Math.max(1, Math.min(
        100, firstProducts.pagination?.totalPages ?? 1
      ));
      const brandPages = Math.max(1, Math.min(
        100, firstBrands.pagination?.totalPages ?? 1
      ));

      const [moreProducts, moreBrands] = await Promise.all([
        Promise.all(
          Array.from({ length: productPages - 1 }, (_, index) =>
            getProducts({ page: index + 2, limit: PAGE_SIZE })
          )
        ),
        Promise.all(
          Array.from({ length: brandPages - 1 }, (_, index) =>
            getBrands({ page: index + 2, limit: PAGE_SIZE })
          )
        ),
      ]);

      const products = [
        ...firstProducts.products,
        ...moreProducts.flatMap((page) => page.products),
      ];
      const names = new Map<string, string>();

      for (const product of products) {
        const name = brandName(product.brand);
        if (name && !names.has(name.toLowerCase())) {
          names.set(name.toLowerCase(), name);
        }
      }

      setCatalogNames(
        [...names.values()].sort((a, b) => a.localeCompare(b))
      );
      setRegistered([
        ...firstBrands.brands,
        ...moreBrands.flatMap((page) => page.brands),
      ]);
    } catch (error) {
      toast.error("Unable to load comparison brands", {
        description: getBrandErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const knownBrands = useMemo(
    () => new Map(registered.map((brand) => [brand.name.toLowerCase(), brand])),
    [registered]
  );

  const rows = useMemo(
    () => catalogNames.filter((name) =>
      name.toLowerCase().includes(search.trim().toLowerCase())
    ),
    [catalogNames, search]
  );

  const preferredCount = catalogNames.filter(
    (name) => {
      const record = knownBrands.get(name.toLowerCase());
      return record?.status === "active" && record.isFeatured;
    }
  ).length;

  const toggle = async (name: string, checked: boolean) => {
    if (pending) return;
    setPending(name);

    try {
      const existing = knownBrands.get(name.toLowerCase());
      if (!existing && !checked) return;

      const result = existing
        ? await updateBrand(existing._id, {
            isFeatured: checked,
            status: "active",
          })
        : await createBrand({
            name,
            slug: makeSlug(name),
            status: "active",
            isFeatured: true,
          });

      setRegistered((items) => [
        ...items.filter((item) => item._id !== result._id),
        result,
      ]);

      toast.success(
        checked ? name + " is now preferred in comparisons" :
          name + " returned to standard price order"
      );
    } catch (error) {
      toast.error("Brand preference could not be updated", {
        description: getBrandErrorMessage(error),
      });
    } finally {
      setPending("");
    }
  };

  return (
    <>
      <PageMeta
        title="Comparison Preferences | Solar Trade Hub"
        description="Prioritize featured catalogue brands in product comparison results"
      />
      <PageBreadcrumb pageTitle="Comparison Preferences" />
      <Toaster position="top-right" richColors />

      <div className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Preferred brands for product comparisons
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
            Select preferred catalogue brands using the checkboxes below. Preferred
            brands appear first in a light green section when products have the
            same category, type and denomination. All remaining matches are ranked
            by recorded rate, lowest first. This feature changes presentation only:
            it does not confirm stock or change the external rate list.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Only active and featured local brands are prioritized. A paid marketing
            subscription is not automatically activated by these checkboxes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-800">
              {catalogNames.length} catalogue brands
            </span>
            <span className="rounded-full bg-green-50 px-3 py-1.5 text-green-800">
              {preferredCount} preferred
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <input
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-800"
              placeholder="Find a catalogue brand..."
              aria-label="Filter catalogue brands"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading || Boolean(pending)}
              className="rounded-lg border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-700 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {loading ? (
            <p className="p-8 text-center text-sm text-gray-500" role="status">
              Loading all catalogue brands...
            </p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-500">
              No matching catalogue brands found.
            </p>
          ) : (
            <div className="grid gap-px bg-gray-100 sm:grid-cols-2 xl:grid-cols-3 dark:bg-gray-800">
              {rows.map((name) => {
                const local = knownBrands.get(name.toLowerCase());
                const checked = Boolean(local?.status === "active" && local.isFeatured);
                return (
                  <label
                    key={name.toLowerCase()}
                    className={
                      "flex cursor-pointer items-center gap-3 p-4 text-sm transition " +
                      (checked ? "bg-green-50 dark:bg-green-950" : "bg-white dark:bg-gray-900")
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={Boolean(pending)}
                      onChange={(event) =>
                        void toggle(name, event.target.checked)
                      }
                      className="size-4 accent-green-700"
                    />
                    <span className="min-w-0 flex-1 font-semibold text-gray-900 dark:text-white">
                      {name}
                    </span>
                    {pending === name ? (
                      <span className="text-xs text-gray-500">Saving...</span>
                    ) : checked ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                        Preferred
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
