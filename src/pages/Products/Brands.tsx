import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import {
  type Brand,
  type BrandStatus,
  createBrand,
  deleteBrand as deleteBrandApi,
  getBrands,
  getBrandErrorMessage,
  updateBrand,
  updateBrandStatus,
} from "../../services/brand/brand.service";

/* =========================================================
   FORM TYPE
========================================================= */

type BrandForm = {
  name: string;
  slug: string;

  countryOfOrigin: string;
  website: string;

  status: BrandStatus;

  isFeatured: boolean;

  sortOrder: number;
};

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm: BrandForm = {
  name: "",
  slug: "",

  countryOfOrigin: "",
  website: "",

  status: "active",

  isFeatured: false,

  sortOrder: 0,
};

/* =========================================================
   BRANDS PAGE
========================================================= */

export default function Brands() {
  /* =======================================================
     DATA
  ======================================================= */

  const [
    brands,
    setBrands,
  ] =
    useState<Brand[]>([]);

  const [
    search,
    setSearch,
  ] =
    useState("");

  /* =======================================================
     PAGE STATE
  ======================================================= */

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    statusUpdatingId,
    setStatusUpdatingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    featuredUpdatingId,
    setFeaturedUpdatingId,
  ] =
    useState<string | null>(
      null
    );

  /* =======================================================
     MODALS
  ======================================================= */

  const [
    showModal,
    setShowModal,
  ] =
    useState(false);

  const [
    editingBrand,
    setEditingBrand,
  ] =
    useState<Brand | null>(
      null
    );

  const [
    brandToDelete,
    setBrandToDelete,
  ] =
    useState<Brand | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<BrandForm>(
      emptyForm
    );

  /* =======================================================
     LOAD BRANDS
  ======================================================= */

  const loadBrands =
    useCallback(
      async (
        showErrorToast = true
      ) => {
        try {
          setLoading(true);

          const result =
            await getBrands({
              page: 1,

              limit: 100,

              sortBy:
                "sortOrder",

              sortOrder:
                "asc",
            });

          setBrands(
            result.brands
          );
        } catch (error) {
          if (
            showErrorToast
          ) {
            toast.error(
              "Unable to load brands",
              {
                description:
                  getBrandErrorMessage(
                    error,
                    "Could not fetch brands from the server."
                  ),
              }
            );
          }
        } finally {
          setLoading(false);
        }
      },
      []
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  /* =======================================================
     FILTERED BRANDS
  ======================================================= */

  const filteredBrands =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return brands;
      }

      return brands.filter(
        (brand) =>
          brand.name
            .toLowerCase()
            .includes(query) ||

          brand.slug
            .toLowerCase()
            .includes(query) ||

          brand.countryOfOrigin
            .toLowerCase()
            .includes(query) ||

          brand.manufacturerName
            .toLowerCase()
            .includes(query)
      );
    }, [
      brands,
      search,
    ]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const activeBrands =
    useMemo(
      () =>
        brands.filter(
          (brand) =>
            brand.status ===
            "active"
        ).length,
      [brands]
    );

  const featuredBrands =
    useMemo(
      () =>
        brands.filter(
          (brand) =>
            brand.isFeatured
        ).length,
      [brands]
    );

  /* =======================================================
     SLUG
  ======================================================= */

  const createSlug = (
    value: string
  ) =>
    value
      .toLowerCase()
      .trim()
      .replace(
        /&/g,
        " "
      )
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  /* =======================================================
     OPEN ADD MODAL
  ======================================================= */

  const openAddModal = () => {
    setEditingBrand(
      null
    );

    setForm({
      ...emptyForm,

      sortOrder:
        brands.length,
    });

    setShowModal(true);
  };

  /* =======================================================
     OPEN EDIT MODAL
  ======================================================= */

  const openEditModal = (
    brand: Brand
  ) => {
    setEditingBrand(
      brand
    );

    setForm({
      name:
        brand.name,

      slug:
        brand.slug,

      countryOfOrigin:
        brand.countryOfOrigin,

      website:
        brand.website,

      status:
        brand.status,

      isFeatured:
        brand.isFeatured,

      sortOrder:
        brand.sortOrder,
    });

    setShowModal(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setShowModal(false);

    setEditingBrand(
      null
    );

    setForm(
      emptyForm
    );
  };

  /* =======================================================
     NAME CHANGE
  ======================================================= */

  const handleNameChange = (
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,

        name:
          value,

        slug:
          editingBrand
            ? current.slug
            : createSlug(
                value
              ),
      })
    );
  };

  /* =======================================================
     SUBMIT CREATE / UPDATE
  ======================================================= */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (submitting) {
        return;
      }

      const name =
        form.name.trim();

      const slug =
        createSlug(
          form.slug
        );

      const countryOfOrigin =
        form.countryOfOrigin.trim();

      const website =
        form.website.trim();

      if (!name) {
        toast.error(
          "Brand name is required."
        );

        return;
      }

      if (!slug) {
        toast.error(
          "Brand slug is required."
        );

        return;
      }

      /* =================================================
         FAST FRONTEND DUPLICATE CHECK

         Backend remains final authority.
      ================================================= */

      const duplicateSlug =
        brands.some(
          (brand) =>
            brand.slug
              .toLowerCase() ===
              slug.toLowerCase() &&
            brand._id !==
              editingBrand?._id
        );

      if (
        duplicateSlug
      ) {
        toast.error(
          "Brand slug already exists."
        );

        return;
      }

      try {
        setSubmitting(true);

        /* =================================================
           UPDATE
        ================================================= */

        if (
          editingBrand
        ) {
          const updated =
            await updateBrand(
              editingBrand._id,
              {
                name,

                slug,

                countryOfOrigin,

                website,

                status:
                  form.status,

                isFeatured:
                  form.isFeatured,

                sortOrder:
                  form.sortOrder,
              }
            );

          setBrands(
            (current) =>
              current.map(
                (brand) =>
                  brand._id ===
                  updated._id
                    ? updated
                    : brand
              )
          );

          toast.success(
            "Brand updated successfully",
            {
              description:
                updated.name,
            }
          );
        } else {
          /* =================================================
             CREATE
          ================================================= */

          const created =
            await createBrand(
              {
                name,

                slug,

                countryOfOrigin,

                website,

                status:
                  form.status,

                isFeatured:
                  form.isFeatured,

                sortOrder:
                  form.sortOrder,
              }
            );

          setBrands(
            (current) =>
              [
                ...current,
                created,
              ].sort(
                (
                  first,
                  second
                ) => {
                  if (
                    first.sortOrder !==
                    second.sortOrder
                  ) {
                    return (
                      first.sortOrder -
                      second.sortOrder
                    );
                  }

                  return first.name.localeCompare(
                    second.name
                  );
                }
              )
          );

          toast.success(
            "Brand added successfully",
            {
              description:
                created.name,
            }
          );
        }

        setShowModal(false);

        setEditingBrand(
          null
        );

        setForm(
          emptyForm
        );
      } catch (error) {
        toast.error(
          editingBrand
            ? "Unable to update brand"
            : "Unable to add brand",
          {
            description:
              getBrandErrorMessage(
                error
              ),
          }
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* =======================================================
     STATUS TOGGLE
  ======================================================= */

  const handleStatusToggle =
    async (
      brand: Brand
    ) => {
      if (
        statusUpdatingId
      ) {
        return;
      }

      const nextStatus: BrandStatus =
        brand.status ===
        "active"
          ? "inactive"
          : "active";

      try {
        setStatusUpdatingId(
          brand._id
        );

        const updated =
          await updateBrandStatus(
            brand._id,
            nextStatus
          );

        setBrands(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                updated._id
                  ? updated
                  : item
            )
        );

        toast.success(
          `Brand ${
            updated.status ===
            "active"
              ? "activated"
              : "deactivated"
          } successfully`,
          {
            description:
              updated.name,
          }
        );
      } catch (error) {
        toast.error(
          "Unable to change brand status",
          {
            description:
              getBrandErrorMessage(
                error
              ),
          }
        );
      } finally {
        setStatusUpdatingId(
          null
        );
      }
    };

  /* =======================================================
     FEATURED TOGGLE
  ======================================================= */

  const handleFeaturedToggle =
    async (
      brand: Brand
    ) => {
      if (
        featuredUpdatingId
      ) {
        return;
      }

      try {
        setFeaturedUpdatingId(
          brand._id
        );

        const updated =
          await updateBrand(
            brand._id,
            {
              isFeatured:
                !brand.isFeatured,
            }
          );

        setBrands(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                updated._id
                  ? updated
                  : item
            )
        );

        toast.success(
          updated.isFeatured
            ? "Brand added to Featured Brands"
            : "Brand removed from Featured Brands",
          {
            description:
              updated.name,
          }
        );
      } catch (error) {
        toast.error(
          "Unable to update featured brand",
          {
            description:
              getBrandErrorMessage(
                error
              ),
          }
        );
      } finally {
        setFeaturedUpdatingId(
          null
        );
      }
    };

  /* =======================================================
     DELETE BRAND
  ======================================================= */

  const confirmDelete =
    async () => {
      if (
        !brandToDelete ||
        deleting
      ) {
        return;
      }

      if (
        brandToDelete.productsCount >
        0
      ) {
        toast.error(
          "Brand cannot be deleted",
          {
            description:
              `${brandToDelete.productsCount} product${
                brandToDelete.productsCount ===
                1
                  ? " is"
                  : "s are"
              } currently assigned to this brand.`,
          }
        );

        setBrandToDelete(
          null
        );

        return;
      }

      try {
        setDeleting(true);

        await deleteBrandApi(
          brandToDelete._id
        );

        setBrands(
          (current) =>
            current.filter(
              (brand) =>
                brand._id !==
                brandToDelete._id
            )
        );

        toast.success(
          "Brand deleted successfully",
          {
            description:
              brandToDelete.name,
          }
        );

        setBrandToDelete(
          null
        );
      } catch (error) {
        toast.error(
          "Unable to delete brand",
          {
            description:
              getBrandErrorMessage(
                error
              ),
          }
        );
      } finally {
        setDeleting(false);
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Brands | Solar Trade Hub"
        description="Manage Solar Trade Hub product brands"
      />

      <PageBreadcrumb
        pageTitle="Brands"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-4">
        {/* HEADER */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Product Brands
            </h1>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Manage brands available across the Solar Trade Hub marketplace.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openAddModal
            }
            disabled={
              loading
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ff4b1f] px-4 text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon />

            Add Brand
          </button>
        </div>

        {/* SEARCH / SUMMARY */}

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <SearchIcon />

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search brand, slug or country..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff4b1f] dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <SummaryBadge
                label="Brands"
                value={
                  brands.length
                }
              />

              <SummaryBadge
                label="Active"
                value={
                  activeBrands
                }
              />

              <SummaryBadge
                label="Featured"
                value={
                  featuredBrands
                }
              />
            </div>
          </div>
        </section>

        {/* TABLE */}

        <section className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Brand List
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Loading brands..."
                  : `${filteredBrands.length} brand${
                      filteredBrands.length ===
                      1
                        ? ""
                        : "s"
                    }`}
              </p>
            </div>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={() =>
                void loadBrands()
              }
              title="Refresh Brands"
              className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
            >
              <RefreshIcon
                spinning={
                  loading
                }
              />
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                  <TableHeading>
                    Brand
                  </TableHeading>

                  <TableHeading>
                    Slug
                  </TableHeading>

                  <TableHeading>
                    Country
                  </TableHeading>

                  <TableHeading>
                    Website
                  </TableHeading>

                  <TableHeading>
                    Products
                  </TableHeading>

                  <TableHeading>
                    Featured
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* LOADING */}

                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto size-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#ff4b1f]" />

                      <p className="mt-3 text-xs text-gray-500">
                        Loading brands...
                      </p>
                    </td>
                  </tr>
                )}

                {/* DATA */}

                {!loading &&
                  filteredBrands.map(
                    (brand) => (
                      <tr
                        key={
                          brand._id
                        }
                        className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex min-w-[190px] items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#5b2eff]/10 text-sm font-bold text-[#8f78ff]">
                              {brand.logo ? (
                                <img
                                  src={
                                    brand.logo
                                  }
                                  alt={
                                    brand.name
                                  }
                                  className="size-full object-contain p-1"
                                />
                              ) : (
                                getInitials(
                                  brand.name
                                )
                              )}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {
                                  brand.name
                                }
                              </p>

                              {brand.manufacturerName && (
                                <p className="mt-0.5 text-xs text-gray-400">
                                  {
                                    brand.manufacturerName
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="rounded-lg bg-[#5b2eff]/10 px-2.5 py-1.5 font-mono text-xs text-[#8f78ff]">
                            {
                              brand.slug
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {brand.countryOfOrigin ||
                            "—"}
                        </td>

                        <td className="max-w-[230px] px-4 py-4">
                          {brand.website ? (
                            <a
                              href={
                                brand.website
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-sm font-medium text-[#5b2eff] hover:underline dark:text-[#8f78ff]"
                            >
                              {
                                brand.website
                              }
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">
                              —
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {
                              brand.productsCount
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <button
                            type="button"
                            disabled={
                              featuredUpdatingId !==
                              null
                            }
                            onClick={() =>
                              void handleFeaturedToggle(
                                brand
                              )
                            }
                            title={
                              brand.isFeatured
                                ? "Remove from Featured Brands"
                                : "Add to Featured Brands"
                            }
                            className="disabled:cursor-wait disabled:opacity-60"
                          >
                            <FeaturedBadge
                              featured={
                                brand.isFeatured
                              }
                              loading={
                                featuredUpdatingId ===
                                brand._id
                              }
                            />
                          </button>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <button
                            type="button"
                            disabled={
                              statusUpdatingId !==
                              null
                            }
                            onClick={() =>
                              void handleStatusToggle(
                                brand
                              )
                            }
                            title="Change Status"
                            className="disabled:cursor-wait disabled:opacity-60"
                          >
                            <StatusBadge
                              status={
                                brand.status
                              }
                              loading={
                                statusUpdatingId ===
                                brand._id
                              }
                            />
                          </button>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              title="Edit Brand"
                              onClick={() =>
                                openEditModal(
                                  brand
                                )
                              }
                              className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#5b2eff]/10 hover:text-[#8f78ff]"
                            >
                              <PencilIcon />
                            </button>

                            <button
                              type="button"
                              title="Delete Brand"
                              onClick={() =>
                                setBrandToDelete(
                                  brand
                                )
                              }
                              className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-500/10 hover:text-red-500"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                {/* EMPTY */}

                {!loading &&
                  filteredBrands.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={
                          8
                        }
                        className="px-6 py-14 text-center"
                      >
                        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                          <SearchEmptyIcon />
                        </div>

                        <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                          No brands found
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {search
                            ? "Try changing your search."
                            : "Add your first Solar Trade Hub brand."}
                        </p>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close modal"
            onClick={
              closeModal
            }
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          <div className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101828]">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingBrand
                  ? "Edit Brand"
                  : "Add Brand"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {editingBrand
                  ? "Update marketplace brand information."
                  : "Add a new product brand to Solar Trade Hub."}
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="space-y-4 p-5">
                <Field
                  label="Brand Name"
                  required
                >
                  <input
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      handleNameChange(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="e.g. Jinko Solar"
                    className="brand-input"
                    disabled={
                      submitting
                    }
                    required
                  />
                </Field>

                <Field
                  label="Slug"
                  required
                >
                  <input
                    value={
                      form.slug
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          slug:
                            createSlug(
                              event
                                .target
                                .value
                            ),
                        })
                      )
                    }
                    placeholder="jinko-solar"
                    className="brand-input font-mono"
                    disabled={
                      submitting
                    }
                    required
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Country">
                    <input
                      value={
                        form.countryOfOrigin
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            countryOfOrigin:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="e.g. China"
                      className="brand-input"
                      disabled={
                        submitting
                      }
                    />
                  </Field>

                  <Field label="Status">
                    <div className="relative">
                      <select
                        value={
                          form.status
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,

                              status:
                                event
                                  .target
                                  .value as BrandStatus,
                            })
                          )
                        }
                        className="brand-input appearance-none pr-9"
                        disabled={
                          submitting
                        }
                      >
                        <option value="active">
                          Active
                        </option>

                        <option value="inactive">
                          Inactive
                        </option>
                      </select>

                      <ChevronIcon />
                    </div>
                  </Field>
                </div>

                <Field label="Website">
                  <input
                    type="url"
                    value={
                      form.website
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          website:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="https://example.com"
                    className="brand-input"
                    disabled={
                      submitting
                    }
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Sort Order">
                    <input
                      type="number"
                      min={0}
                      value={
                        form.sortOrder
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            sortOrder:
                              Math.max(
                                0,
                                Number(
                                  event
                                    .target
                                    .value
                                ) ||
                                  0
                              ),
                          })
                        )
                      }
                      className="brand-input"
                      disabled={
                        submitting
                      }
                    />
                  </Field>

                  <Field label="Featured Brand">
                    <label className="flex h-[42px] cursor-pointer items-center gap-3 rounded-[10px] border border-gray-300 px-3 dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={
                          form.isFeatured
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,

                              isFeatured:
                                event
                                  .target
                                  .checked,
                            })
                          )
                        }
                        disabled={
                          submitting
                        }
                        className="size-4 accent-[#ff4b1f]"
                      />

                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Show in Featured Brands
                      </span>
                    </label>
                  </Field>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    submitting
                  }
                  className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="inline-flex h-10 min-w-[120px] items-center justify-center rounded-lg bg-[#ff4b1f] px-5 text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Saving..."
                    : editingBrand
                      ? "Update Brand"
                      : "Add Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      {brandToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close delete modal"
            disabled={
              deleting
            }
            onClick={() =>
              setBrandToDelete(
                null
              )
            }
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101828]">
            <div className="p-6">
              <div className="flex size-11 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <TrashIcon />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Delete Brand?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {
                    brandToDelete.name
                  }
                </span>
                ?
              </p>

              {brandToDelete.productsCount >
                0 && (
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-amber-600 dark:text-amber-400">
                  This brand currently has{" "}
                  <strong>
                    {
                      brandToDelete.productsCount
                    }
                  </strong>{" "}
                  product
                  {brandToDelete.productsCount ===
                  1
                    ? ""
                    : "s"}{" "}
                  assigned and cannot be deleted until they are reassigned.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() =>
                  setBrandToDelete(
                    null
                  )
                }
                className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deleting ||
                  brandToDelete.productsCount >
                    0
                }
                onClick={() =>
                  void confirmDelete()
                }
                className="h-10 min-w-[115px] rounded-lg bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Brand"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .brand-input {
          width: 100%;
          height: 42px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: transparent;
          padding-left: 12px;
          padding-right: 12px;
          color: #111827;
          font-size: 13px;
          outline: none;
          transition: 0.2s ease;
        }

        .dark .brand-input {
          background: #111827;
          border-color: #374151;
          color: #f8fafc;
        }

        .brand-input::placeholder {
          color: #9ca3af;
        }

        .brand-input:focus {
          border-color: #ff4b1f;
          box-shadow: 0 0 0 3px rgba(255, 75, 31, 0.08);
        }

        .brand-input:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }
      `}</style>
    </>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
        {label}

        {required && (
          <span className="ml-1 text-[#ff4b1f]">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   TABLE HEADING
========================================================= */

function TableHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
  loading = false,
}: {
  status: BrandStatus;
  loading?: boolean;
}) {
  const active =
    status ===
    "active";

  return (
    <span
      className={`inline-flex min-w-[72px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold transition ${
        active
          ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
          : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
      }`}
    >
      {loading
        ? "..."
        : active
          ? "Active"
          : "Inactive"}
    </span>
  );
}

/* =========================================================
   FEATURED
========================================================= */

function FeaturedBadge({
  featured,
  loading = false,
}: {
  featured: boolean;
  loading?: boolean;
}) {
  return (
    <span
      className={`inline-flex min-w-[66px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold transition ${
        featured
          ? "bg-[#5b2eff]/10 text-[#8f78ff]"
          : "bg-gray-500/10 text-gray-500"
      }`}
    >
      {loading
        ? "..."
        : featured
          ? "Yes"
          : "No"}
    </span>
  );
}

/* =========================================================
   SUMMARY
========================================================= */

function SummaryBadge({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="text-sm font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getInitials(
  name: string
) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]
          ?.toUpperCase()
    )
    .join("");
}

/* =========================================================
   ICONS
========================================================= */

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-4"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
    >
      <path d="M13.5 6.5 17.5 10.5" />
      <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m6 7 1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function SearchEmptyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function RefreshIcon({
  spinning,
}: {
  spinning: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`size-4 ${
        spinning
          ? "animate-spin"
          : ""
      }`}
    >
      <path d="M20 11a8 8 0 1 0-2.34 5.66" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}