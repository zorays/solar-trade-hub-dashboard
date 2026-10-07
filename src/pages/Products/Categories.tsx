import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import {
  Category,
  CategoryStatus,
  createCategory,
  deleteCategory as deleteCategoryApi,
  getCategories,
  getCategoryErrorMessage,
  updateCategory,
  updateCategoryStatus,
} from "../../services/category/category.service";

/* =========================================================
   FORM TYPE
========================================================= */

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  status: CategoryStatus;
  sortOrder: number;
};

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  status: "active",
  sortOrder: 0,
};

/* =========================================================
   CATEGORIES PAGE
========================================================= */

export default function Categories() {
  /* =======================================================
     DATA
  ======================================================= */

  const [
    categories,
    setCategories,
  ] =
    useState<Category[]>([]);

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

  /* =======================================================
     MODALS
  ======================================================= */

  const [
    showModal,
    setShowModal,
  ] =
    useState(false);

  const [
    editingCategory,
    setEditingCategory,
  ] =
    useState<Category | null>(
      null
    );

  const [
    deleteCategory,
    setDeleteCategory,
  ] =
    useState<Category | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<CategoryForm>(
      emptyForm
    );

  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  const loadCategories =
    useCallback(
      async (
        showErrorToast = true
      ) => {
        try {
          setLoading(true);

          const result =
            await getCategories({
              page: 1,
              limit: 100,
              sortBy:
                "sortOrder",
              sortOrder:
                "asc",
            });

          setCategories(
            result.categories
          );
        } catch (error) {
          if (
            showErrorToast
          ) {
            toast.error(
              "Unable to load categories",
              {
                description:
                  getCategoryErrorMessage(
                    error,
                    "Could not fetch categories from the server."
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
    void loadCategories();
  }, [loadCategories]);

  /* =======================================================
     FILTERED CATEGORIES
  ======================================================= */

  const filteredCategories =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return categories;
      }

      return categories.filter(
        (category) =>
          category.name
            .toLowerCase()
            .includes(query) ||
          category.slug
            .toLowerCase()
            .includes(query) ||
          category.description
            .toLowerCase()
            .includes(query)
      );
    }, [
      categories,
      search,
    ]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const activeCategories =
    useMemo(
      () =>
        categories.filter(
          (category) =>
            category.status ===
            "active"
        ).length,
      [categories]
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
    setEditingCategory(
      null
    );

    setForm({
      ...emptyForm,

      sortOrder:
        categories.length,
    });

    setShowModal(true);
  };

  /* =======================================================
     OPEN EDIT MODAL
  ======================================================= */

  const openEditModal = (
    category: Category
  ) => {
    setEditingCategory(
      category
    );

    setForm({
      name:
        category.name,

      slug:
        category.slug,

      description:
        category.description,

      status:
        category.status,

      sortOrder:
        category.sortOrder,
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

    setEditingCategory(
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

        /*
         * Add mode:
         * automatically create slug.
         *
         * Edit mode:
         * preserve existing URL unless user edits slug.
         */
        slug:
          editingCategory
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

      if (!name) {
        toast.error(
          "Category name is required."
        );

        return;
      }

      if (!slug) {
        toast.error(
          "Category slug is required."
        );

        return;
      }

      /*
       * Fast frontend duplicate check.
       *
       * Backend remains final authority.
       */
      const duplicate =
        categories.some(
          (category) =>
            category.slug
              .toLowerCase() ===
              slug.toLowerCase() &&
            category._id !==
              editingCategory?._id
        );

      if (duplicate) {
        toast.error(
          "Category slug already exists."
        );

        return;
      }

      try {
        setSubmitting(true);

        /* =================================================
           UPDATE
        ================================================= */

        if (
          editingCategory
        ) {
          const updated =
            await updateCategory(
              editingCategory._id,
              {
                name,

                slug,

                description:
                  form.description.trim(),

                sortOrder:
                  form.sortOrder,

                status:
                  form.status,
              }
            );

          setCategories(
            (current) =>
              current.map(
                (category) =>
                  category._id ===
                  updated._id
                    ? updated
                    : category
              )
          );

          toast.success(
            "Category updated successfully",
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
            await createCategory(
              {
                name,

                slug,

                description:
                  form.description.trim(),

                sortOrder:
                  form.sortOrder,

                status:
                  form.status,
              }
            );

          setCategories(
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
            "Category added successfully",
            {
              description:
                created.name,
            }
          );
        }

        setShowModal(false);

        setEditingCategory(
          null
        );

        setForm(
          emptyForm
        );
      } catch (error) {
        toast.error(
          editingCategory
            ? "Unable to update category"
            : "Unable to add category",
          {
            description:
              getCategoryErrorMessage(
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

     Uses dedicated backend endpoint:

     PATCH
     /api/v1/categories/:categoryId/status
  ======================================================= */

  const handleStatusToggle =
    async (
      category: Category
    ) => {
      if (
        statusUpdatingId
      ) {
        return;
      }

      const nextStatus: CategoryStatus =
        category.status ===
        "active"
          ? "inactive"
          : "active";

      try {
        setStatusUpdatingId(
          category._id
        );

        const updated =
          await updateCategoryStatus(
            category._id,
            nextStatus
          );

        setCategories(
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
          `Category ${
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
          "Unable to change category status",
          {
            description:
              getCategoryErrorMessage(
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
     DELETE
  ======================================================= */

  const confirmDelete =
    async () => {
      if (
        !deleteCategory ||
        deleting
      ) {
        return;
      }

      /*
       * Fast UI protection.
       *
       * Backend also performs the same check.
       */
      if (
        deleteCategory.productsCount >
        0
      ) {
        toast.error(
          "Category cannot be deleted",
          {
            description:
              `${deleteCategory.productsCount} product${
                deleteCategory.productsCount ===
                1
                  ? " is"
                  : "s are"
              } currently assigned to this category.`,
          }
        );

        setDeleteCategory(
          null
        );

        return;
      }

      try {
        setDeleting(true);

        await deleteCategoryApi(
          deleteCategory._id
        );

        setCategories(
          (current) =>
            current.filter(
              (category) =>
                category._id !==
                deleteCategory._id
            )
        );

        toast.success(
          "Category deleted successfully",
          {
            description:
              deleteCategory.name,
          }
        );

        setDeleteCategory(
          null
        );
      } catch (error) {
        toast.error(
          "Unable to delete category",
          {
            description:
              getCategoryErrorMessage(
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
        title="Categories | Solar Trade Hub"
        description="Manage Solar Trade Hub product categories"
      />

      <PageBreadcrumb
        pageTitle="Categories"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-4">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Product Categories
            </h1>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Organize Solar Trade Hub marketplace products.
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

            Add Category
          </button>
        </div>

        {/* =================================================
            SEARCH / SUMMARY
        ================================================= */}

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <SearchIcon />

              <input
                type="text"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search categories..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff4b1f] dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <SummaryBadge
                label="Categories"
                value={
                  categories.length
                }
              />

              <SummaryBadge
                label="Active"
                value={
                  activeCategories
                }
              />
            </div>
          </div>
        </section>

        {/* =================================================
            TABLE
        ================================================= */}

        <section className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Category List
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {loading
                  ? "Loading categories..."
                  : `${filteredCategories.length} categor${
                      filteredCategories.length ===
                      1
                        ? "y"
                        : "ies"
                    }`}
              </p>
            </div>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={() =>
                void loadCategories()
              }
              className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
              title="Refresh Categories"
            >
              <RefreshIcon
                spinning={
                  loading
                }
              />
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="min-w-[950px] w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                  <TableHeading>
                    Category
                  </TableHeading>

                  <TableHeading>
                    Slug
                  </TableHeading>

                  <TableHeading>
                    Products
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
                {/* =========================================
                    LOADING
                ========================================= */}

                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto size-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#ff4b1f]" />

                      <p className="mt-3 text-xs text-gray-500">
                        Loading categories...
                      </p>
                    </td>
                  </tr>
                )}

                {/* =========================================
                    DATA
                ========================================= */}

                {!loading &&
                  filteredCategories.map(
                    (
                      category
                    ) => (
                      <tr
                        key={
                          category._id
                        }
                        className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-4">
                          <div className="min-w-[300px]">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {
                                category.name
                              }
                            </p>

                            <p className="mt-1 max-w-[420px] text-xs leading-5 text-gray-500">
                              {category.description ||
                                "No description added."}
                            </p>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="rounded-lg bg-[#5b2eff]/10 px-2.5 py-1.5 font-mono text-xs text-[#8f78ff]">
                            {
                              category.slug
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {
                              category.productsCount
                            }
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <button
                            type="button"
                            title="Change Status"
                            disabled={
                              statusUpdatingId !==
                              null
                            }
                            onClick={() =>
                              void handleStatusToggle(
                                category
                              )
                            }
                            className="disabled:cursor-wait disabled:opacity-60"
                          >
                            <StatusBadge
                              status={
                                category.status
                              }
                              loading={
                                statusUpdatingId ===
                                category._id
                              }
                            />
                          </button>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              title="Edit Category"
                              onClick={() =>
                                openEditModal(
                                  category
                                )
                              }
                              className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#5b2eff]/10 hover:text-[#8f78ff]"
                            >
                              <PencilIcon />
                            </button>

                            <button
                              type="button"
                              title="Delete Category"
                              onClick={() =>
                                setDeleteCategory(
                                  category
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

                {/* =========================================
                    EMPTY
                ========================================= */}

                {!loading &&
                  filteredCategories.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={
                          5
                        }
                        className="px-6 py-14 text-center"
                      >
                        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                          <SearchEmptyIcon />
                        </div>

                        <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                          No categories found
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {search
                            ? "Try another search."
                            : "Add your first Solar Trade Hub category."}
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

          <div className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101828]">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingCategory
                  ? "Edit Category"
                  : "Add Category"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {editingCategory
                  ? "Update marketplace category information."
                  : "Create a new marketplace product category."}
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="space-y-4 p-5">
                {/* =========================================
                    NAME
                ========================================= */}

                <Field
                  label="Category Name"
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
                    placeholder="e.g. Solar Panels"
                    className="category-input"
                    disabled={
                      submitting
                    }
                    required
                  />
                </Field>

                {/* =========================================
                    SLUG
                ========================================= */}

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
                    placeholder="solar-panels"
                    className="category-input font-mono"
                    disabled={
                      submitting
                    }
                    required
                  />
                </Field>

                {/* =========================================
                    STATUS
                ========================================= */}

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
                                .value as CategoryStatus,
                          })
                        )
                      }
                      className="category-input appearance-none pr-9"
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

                {/* =========================================
                    SORT ORDER
                ========================================= */}

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
                    className="category-input"
                    disabled={
                      submitting
                    }
                  />
                </Field>

                {/* =========================================
                    DESCRIPTION
                ========================================= */}

                <Field label="Description">
                  <textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          description:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    rows={4}
                    placeholder="Short category description..."
                    className="category-input min-h-[105px] resize-y py-3"
                    disabled={
                      submitting
                    }
                  />
                </Field>
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
                  className="inline-flex h-10 min-w-[130px] items-center justify-center rounded-lg bg-[#ff4b1f] px-5 text-sm font-semibold text-white transition hover:bg-[#e83c12] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      {deleteCategory && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close delete modal"
            disabled={
              deleting
            }
            onClick={() =>
              setDeleteCategory(
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
                Delete Category?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Are you sure
                you want to
                delete{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {
                    deleteCategory.name
                  }
                </span>
                ?
              </p>

              {deleteCategory.productsCount >
                0 && (
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-amber-600 dark:text-amber-400">
                  This category
                  currently
                  contains{" "}
                  <strong>
                    {
                      deleteCategory.productsCount
                    }
                  </strong>{" "}
                  product
                  {deleteCategory.productsCount ===
                  1
                    ? ""
                    : "s"}{" "}
                  and cannot
                  be deleted
                  until those
                  products are
                  moved.
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
                  setDeleteCategory(
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
                  deleteCategory.productsCount >
                    0
                }
                onClick={() =>
                  void confirmDelete()
                }
                className="h-10 min-w-[130px] rounded-lg bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          LOCAL INPUT STYLES
      =================================================== */}

      <style>{`
        .category-input {
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

        .dark .category-input {
          background: #111827;
          border-color: #374151;
          color: #f8fafc;
        }

        .category-input::placeholder {
          color: #9ca3af;
        }

        .category-input:focus {
          border-color: #ff4b1f;
          box-shadow: 0 0 0 3px rgba(255, 75, 31, 0.08);
        }

        .category-input:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        textarea.category-input {
          height: auto;
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
  children: React.ReactNode;
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
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
  loading = false,
}: {
  status: CategoryStatus;
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
   SUMMARY BADGE
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