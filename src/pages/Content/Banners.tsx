import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  BANNER_PLACEMENT_OPTIONS,
  BANNER_STATUS_OPTIONS,
  EMPTY_BANNER_FORM,
  createBanner,
  deleteBanner,
  formatBannerDate,
  formatBannerImageFileSize,
  formatBannerPlacement,
  formatBannerStatus,
  getBannerErrorMessage,
  getBanners,
  getBannerSummary,
  resolveBannerImageUrl,
  updateBanner,
  updateBannerVisibility,
  uploadBannerImage,
  validateBannerImageFile,
  type Banner,
  type BannerPayload,
  type BannerPlacement,
  type BannerStatus,
  type BannerSummary,
} from "../../services/banner/banner.service";

/* =========================================================
   DEFAULT SUMMARY
========================================================= */

const EMPTY_SUMMARY: BannerSummary = {
  total: 0,
  active: 0,
  scheduled: 0,
  expired: 0,
  draft: 0,
  visible: 0,
  hidden: 0,
};

/* =========================================================
   STATUS CLASSES
========================================================= */

const statusClasses = (
  status: BannerStatus
) => {
  switch (status) {
    case "active":
      return `
        border-green-200
        bg-green-50
        text-green-700
        dark:border-green-500/20
        dark:bg-green-500/10
        dark:text-green-400
      `;

    case "scheduled":
      return `
        border-purple-200
        bg-purple-50
        text-purple-700
        dark:border-purple-500/20
        dark:bg-purple-500/10
        dark:text-purple-400
      `;

    case "expired":
      return `
        border-gray-200
        bg-gray-100
        text-gray-600
        dark:border-gray-700
        dark:bg-white/5
        dark:text-gray-400
      `;

    case "draft":
    default:
      return `
        border-orange-200
        bg-orange-50
        text-orange-700
        dark:border-orange-500/20
        dark:bg-orange-500/10
        dark:text-orange-400
      `;
  }
};

/* =========================================================
   FORM FROM BANNER
========================================================= */

const bannerToForm = (
  banner: Banner
): BannerPayload => {
  return {
    title:
      banner.title,

    description:
      banner.description,

    image:
      banner.image,

    buttonText:
      banner.buttonText,

    buttonLink:
      banner.buttonLink,

    placement:
      banner.placement,

    startDate:
      banner.startDate ||
      "",

    endDate:
      banner.endDate ||
      "",

    status:
      banner.status,

    visible:
      banner.visible,
  };
};

/* =========================================================
   PAGE
========================================================= */

const Banners = () => {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    banners,
    setBanners,
  ] =
    useState<Banner[]>(
      []
    );

  const [
    summary,
    setSummary,
  ] =
    useState<BannerSummary>(
      EMPTY_SUMMARY
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deletingBannerId,
    setDeletingBannerId,
  ] =
    useState<string | null>(
      null
    );

  const [
    visibilityBannerId,
    setVisibilityBannerId,
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    showModal,
    setShowModal,
  ] =
    useState(false);

  const [
    editingBannerId,
    setEditingBannerId,
  ] =
    useState<string | null>(
      null
    );

  const [
    formData,
    setFormData,
  ] =
    useState<BannerPayload>({
      ...EMPTY_BANNER_FORM,
    });

  const [
    selectedImageFile,
    setSelectedImageFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    selectedImagePreview,
    setSelectedImagePreview,
  ] =
    useState("");

  const [
    draggingImage,
    setDraggingImage,
  ] =
    useState(false);

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(
    () => {
      const timeout =
        window.setTimeout(
          () => {
            setDebouncedSearch(
              search.trim()
            );
          },
          350
        );

      return () => {
        window.clearTimeout(
          timeout
        );
      };
    },
    [
      search,
    ]
  );

  /* =======================================================
     IMAGE OBJECT URL
  ======================================================= */

  useEffect(
    () => {
      if (
        !selectedImageFile
      ) {
        setSelectedImagePreview(
          ""
        );

        return;
      }

      const objectUrl =
        URL.createObjectURL(
          selectedImageFile
        );

      setSelectedImagePreview(
        objectUrl
      );

      return () => {
        URL.revokeObjectURL(
          objectUrl
        );
      };
    },
    [
      selectedImageFile,
    ]
  );

  /* =======================================================
     LOAD SUMMARY
  ======================================================= */

  const loadSummary =
    useCallback(
      async () => {
        try {
          const data =
            await getBannerSummary();

          setSummary(
            data
          );
        } catch (
          summaryError
        ) {
          setError(
            getBannerErrorMessage(
              summaryError,
              "Unable to load banner summary."
            )
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD BANNERS
  ======================================================= */

  const loadBanners =
    useCallback(
      async (
        searchValue =
          debouncedSearch,
        showLoader =
          true
      ) => {
        try {
          if (
            showLoader
          ) {
            setLoading(
              true
            );
          }

          setError(
            ""
          );

          const result =
            await getBanners({
              page: 1,

              limit: 100,

              search:
                searchValue ||
                undefined,

              sortBy:
                "createdAt",

              sortOrder:
                "desc",
            });

          setBanners(
            result.banners
          );
        } catch (
          loadError
        ) {
          setError(
            getBannerErrorMessage(
              loadError,
              "Unable to load banners."
            )
          );
        } finally {
          if (
            showLoader
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        debouncedSearch,
      ]
    );

  /* =======================================================
     INITIAL / SEARCH LOAD
  ======================================================= */

  useEffect(
    () => {
      void loadBanners(
        debouncedSearch
      );
    },
    [
      debouncedSearch,
      loadBanners,
    ]
  );

  useEffect(
    () => {
      void loadSummary();
    },
    [
      loadSummary,
    ]
  );

  /* =======================================================
     DISPLAYED BANNERS
  ======================================================= */

  const displayedBanners =
    useMemo(
      () => banners,
      [
        banners,
      ]
    );

  /* =======================================================
     EXISTING / SELECTED IMAGE PREVIEW
  ======================================================= */

  const imagePreview =
    useMemo(
      () => {
        if (
          selectedImagePreview
        ) {
          return selectedImagePreview;
        }

        return resolveBannerImageUrl(
          formData.image
        );
      },
      [
        formData.image,
        selectedImagePreview,
      ]
    );

  /* =======================================================
     RESET IMAGE STATE
  ======================================================= */

  const resetSelectedImage =
    () => {
      setSelectedImageFile(
        null
      );

      setDraggingImage(
        false
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  /* =======================================================
     OPEN ADD
  ======================================================= */

  const openAddBanner = () => {
    setEditingBannerId(
      null
    );

    setFormData({
      ...EMPTY_BANNER_FORM,
    });

    resetSelectedImage();

    setError(
      ""
    );

    setSuccess(
      ""
    );

    setShowModal(
      true
    );
  };

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  const openEditBanner = (
    banner: Banner
  ) => {
    setEditingBannerId(
      banner.bannerId
    );

    setFormData(
      bannerToForm(
        banner
      )
    );

    resetSelectedImage();

    setError(
      ""
    );

    setSuccess(
      ""
    );

    setShowModal(
      true
    );
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (
      saving
    ) {
      return;
    }

    setShowModal(
      false
    );

    setEditingBannerId(
      null
    );

    setFormData({
      ...EMPTY_BANNER_FORM,
    });

    resetSelectedImage();

    setError(
      ""
    );
  };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const updateForm = <
    K extends keyof BannerPayload,
  >(
    field: K,
    value: BannerPayload[K]
  ) => {
    setFormData(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );
  };

  /* =======================================================
     IMAGE FILE SELECTION
  ======================================================= */

  const handleImageFile =
    (
      file:
        | File
        | null
    ) => {
      if (!file) {
        return;
      }

      const validationError =
        validateBannerImageFile(
          file
        );

      if (
        validationError
      ) {
        setSelectedImageFile(
          null
        );

        setError(
          validationError
        );

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        return;
      }

      setSelectedImageFile(
        file
      );

      setError(
        ""
      );

      setSuccess(
        ""
      );
    };

  /* =======================================================
     FILE INPUT CHANGE
  ======================================================= */

  const handleImageInputChange =
    (
      event:
        React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target
          .files?.[0] ||
        null;

      handleImageFile(
        file
      );
    };

  /* =======================================================
     DRAG / DROP
  ======================================================= */

  const handleImageDrop =
    (
      event:
        React.DragEvent<HTMLDivElement>
    ) => {
      event.preventDefault();

      setDraggingImage(
        false
      );

      if (
        saving
      ) {
        return;
      }

      const file =
        event.dataTransfer
          .files?.[0] ||
        null;

      handleImageFile(
        file
      );
    };

  /* =======================================================
     BUILD METADATA PAYLOAD

     Image path is intentionally NOT submitted here.

     Image is managed only by multipart upload endpoint.
  ======================================================= */

  const getMetadataPayload =
    (): BannerPayload => {
      return {
        title:
          formData.title.trim(),

        description:
          formData.description?.trim() ||
          "",

        buttonText:
          formData.buttonText?.trim() ||
          "",

        buttonLink:
          formData.buttonLink?.trim() ||
          "",

        placement:
          formData.placement,

        startDate:
          formData.startDate ||
          null,

        endDate:
          formData.endDate ||
          null,

        status:
          formData.status,

        visible:
          formData.visible,
      };
    };

  /* =======================================================
     SAVE BANNER
  ======================================================= */

  const handleSaveBanner =
    async () => {
      if (
        !formData.title.trim()
      ) {
        setError(
          "Banner title is required."
        );

        return;
      }

      /*
       * New banners require an uploaded image.
       *
       * Existing banners may retain their current image.
       */
      if (
        !editingBannerId &&
        !selectedImageFile
      ) {
        setError(
          "Please select a banner image."
        );

        return;
      }

      if (
        formData.buttonText?.trim() &&
        !formData.buttonLink?.trim()
      ) {
        setError(
          "CTA link is required when CTA button text is provided."
        );

        return;
      }

      if (
        formData.buttonLink?.trim() &&
        !formData.buttonText?.trim()
      ) {
        setError(
          "CTA button text is required when CTA link is provided."
        );

        return;
      }

      if (
        formData.startDate &&
        formData.endDate &&
        formData.endDate <
          formData.startDate
      ) {
        setError(
          "Banner end date cannot be before the start date."
        );

        return;
      }

      let createdBannerId:
        | string
        | null =
        null;

      try {
        setSaving(
          true
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        const metadata =
          getMetadataPayload();

        /* =================================================
           EDIT
        ================================================= */

        if (
          editingBannerId
        ) {
          await updateBanner(
            editingBannerId,
            metadata
          );

          /*
           * Replace image only when a new file was selected.
           */
          if (
            selectedImageFile
          ) {
            await uploadBannerImage(
              editingBannerId,
              selectedImageFile
            );
          }

          setSuccess(
            selectedImageFile
              ? "Banner and image updated successfully."
              : "Banner updated successfully."
          );
        } else {
          /* ===============================================
             CREATE RECORD FIRST

             This generates:
             STH-BNR-0001
          =============================================== */

          const created =
            await createBanner(
              metadata
            );

          createdBannerId =
            created.bannerId;

          /* ===============================================
             THEN UPLOAD IMAGE USING REAL BANNER ID
          =============================================== */

          if (
            !selectedImageFile
          ) {
            throw new Error(
              "Banner image is required."
            );
          }

          await uploadBannerImage(
            created.bannerId,
            selectedImageFile
          );

          setSuccess(
            "Banner created successfully."
          );
        }

        setShowModal(
          false
        );

        setEditingBannerId(
          null
        );

        setFormData({
          ...EMPTY_BANNER_FORM,
        });

        resetSelectedImage();

        await Promise.all([
          loadBanners(
            debouncedSearch,
            false
          ),

          loadSummary(),
        ]);
      } catch (
        saveError
      ) {
        /*
         * If a NEW banner record was created but image
         * upload failed, remove the incomplete record.
         *
         * This avoids empty/orphan banner records.
         */

        if (
          createdBannerId
        ) {
          try {
            await deleteBanner(
              createdBannerId
            );
          } catch (
            cleanupError
          ) {
            console.error(
              "Unable to rollback incomplete banner:",
              cleanupError
            );
          }
        }

        setError(
          getBannerErrorMessage(
            saveError,
            editingBannerId
              ? "Unable to update banner."
              : "Unable to create banner."
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete =
    async (
      banner: Banner
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${banner.title}" banner (${banner.bannerId})?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setDeletingBannerId(
          banner.bannerId
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        await deleteBanner(
          banner.bannerId
        );

        setSuccess(
          `${banner.bannerId} deleted successfully.`
        );

        await Promise.all([
          loadBanners(
            debouncedSearch,
            false
          ),

          loadSummary(),
        ]);
      } catch (
        deleteError
      ) {
        setError(
          getBannerErrorMessage(
            deleteError,
            "Unable to delete banner."
          )
        );
      } finally {
        setDeletingBannerId(
          null
        );
      }
    };

  /* =======================================================
     VISIBILITY
  ======================================================= */

  const toggleVisibility =
    async (
      banner: Banner
    ) => {
      try {
        setVisibilityBannerId(
          banner.bannerId
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        const updated =
          await updateBannerVisibility(
            banner.bannerId,
            !banner.visible
          );

        setBanners(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.bannerId ===
                updated.bannerId
                  ? updated
                  : item
            )
        );

        await loadSummary();
      } catch (
        visibilityError
      ) {
        setError(
          getBannerErrorMessage(
            visibilityError,
            "Unable to update banner visibility."
          )
        );
      } finally {
        setVisibilityBannerId(
          null
        );
      }
    };

  /* =======================================================
     RETRY
  ======================================================= */

  const handleRetry =
    async () => {
      await Promise.all([
        loadBanners(
          debouncedSearch
        ),

        loadSummary(),
      ]);
    };

  return (
    <>
      <PageMeta
        title="Banners | Solar Trade Hub"
        description="Manage Solar Trade Hub promotional banners."
      />

      <PageBreadcrumb
        pageTitle="Banners"
      />

      <div className="space-y-6">
        {/* =================================================
            HEADER
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                  <Megaphone
                    size={23}
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                    Content Management
                  </p>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Promotional Banners
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Manage promotional campaigns and banners displayed across the Solar Trade Hub storefront.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  openAddBanner
                }
                className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Plus
                  size={18}
                />

                Add Banner
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error &&
          !showModal && (
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {error}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleRetry()
                }
                className="inline-flex items-center gap-2 self-start font-semibold transition hover:opacity-80 sm:self-auto"
              >
                <RefreshCw
                  size={14}
                />

                Retry
              </button>
            </div>
          )}

        {/* =================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
            <CheckCircle2
              size={17}
            />

            {success}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Banners"
            value={
              summary.total
            }
            icon={
              <ImageIcon
                size={20}
              />
            }
            iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />

          <SummaryCard
            title="Active"
            value={
              summary.active
            }
            icon={
              <CheckCircle2
                size={20}
              />
            }
            iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />

          <SummaryCard
            title="Scheduled"
            value={
              summary.scheduled
            }
            icon={
              <CalendarDays
                size={20}
              />
            }
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
          />

          <SummaryCard
            title="Visible"
            value={
              summary.visible
            }
            icon={
              <Eye
                size={20}
              />
            }
            iconClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />
        </div>

        {/* =================================================
            TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 dark:border-gray-800 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Storefront Banners
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {
                  displayedBanners.length
                }{" "}
                banner
                {displayedBanners.length ===
                1
                  ? ""
                  : "s"}{" "}
                loaded
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event
                ) => {
                  setSearch(
                    event.target.value
                  );

                  setSuccess(
                    ""
                  );
                }}
                placeholder="Search title, ID or description..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw
                  size={24}
                  className="animate-spin text-purple-600"
                />

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading banners...
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                  <tr>
                    <TableHeading>
                      Banner
                    </TableHeading>

                    <TableHeading>
                      Placement
                    </TableHeading>

                    <TableHeading>
                      Campaign
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Visibility
                    </TableHeading>

                    <TableHeading align="right">
                      Action
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {displayedBanners.map(
                    (
                      banner
                    ) => {
                      const imageUrl =
                        resolveBannerImageUrl(
                          banner.image
                        );

                      const visibilityLoading =
                        visibilityBannerId ===
                        banner.bannerId;

                      const deleteLoading =
                        deletingBannerId ===
                        banner.bannerId;

                      return (
                        <tr
                          key={
                            banner.bannerId ||
                            banner._id
                          }
                          className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-5 align-top sm:px-6">
                            <div className="flex min-w-[320px] gap-3">
                              <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 to-purple-50 text-purple-500 dark:border-gray-800 dark:from-orange-500/10 dark:to-purple-500/10">
                                {imageUrl ? (
                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={
                                      banner.title
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon
                                    size={21}
                                  />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {
                                    banner.title
                                  }
                                </p>

                                <p className="mt-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                  {
                                    banner.bannerId
                                  }
                                </p>

                                <p className="mt-1 max-w-[320px] text-xs leading-5 text-gray-500 dark:text-gray-400">
                                  {
                                    banner.description ||
                                    "No description"
                                  }
                                </p>

                                {banner.buttonText && (
                                  <p className="mt-2 text-xs font-medium text-purple-600 dark:text-purple-400">
                                    CTA:{" "}
                                    {
                                      banner.buttonText
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span className="inline-flex min-w-[120px] rounded-lg border border-purple-100 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400">
                              {formatBannerPlacement(
                                banner.placement
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <div className="min-w-[160px] space-y-1 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <CalendarDays
                                  size={13}
                                />

                                {formatBannerDate(
                                  banner.startDate
                                )}
                              </div>

                              <p className="pl-5">
                                to{" "}
                                {formatBannerDate(
                                  banner.endDate
                                )}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span
                              className={`
                                inline-flex
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-xs
                                font-semibold
                                ${statusClasses(
                                  banner.status
                                )}
                              `}
                            >
                              {formatBannerStatus(
                                banner.status
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <button
                              type="button"
                              disabled={
                                visibilityLoading
                              }
                              onClick={() =>
                                void toggleVisibility(
                                  banner
                                )
                              }
                              className={`
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-lg
                                px-2.5
                                py-1.5
                                text-xs
                                font-semibold
                                transition
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                                ${
                                  banner.visible
                                    ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                    : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                                }
                              `}
                            >
                              {visibilityLoading ? (
                                <RefreshCw
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : banner.visible ? (
                                <Eye
                                  size={13}
                                />
                              ) : (
                                <EyeOff
                                  size={13}
                                />
                              )}

                              {banner.visible
                                ? "Visible"
                                : "Hidden"}
                            </button>
                          </td>

                          <td className="px-5 py-5 text-right align-top sm:px-6">
                            <div className="flex min-w-[195px] items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditBanner(
                                    banner
                                  )
                                }
                                disabled={
                                  deleteLoading
                                }
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400"
                              >
                                <Pencil
                                  size={14}
                                />

                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deleteLoading
                                }
                                onClick={() =>
                                  void handleDelete(
                                    banner
                                  )
                                }
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                              >
                                {deleteLoading ? (
                                  <RefreshCw
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={14}
                                  />
                                )}

                                {deleteLoading
                                  ? "Deleting"
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}

                  {displayedBanners.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center"
                      >
                        <Megaphone
                          size={34}
                          className="mx-auto text-gray-300 dark:text-gray-600"
                        />

                        <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
                          No banners found
                        </p>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {debouncedSearch
                            ? "Try a different search."
                            : "Create your first promotional banner."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                  Content Management
                </p>

                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {editingBannerId
                    ? "Edit Banner"
                    : "Add Banner"}
                </h3>

                {editingBannerId && (
                  <p className="mt-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {
                      editingBannerId
                    }
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 sm:mx-6">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {error}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <FormField
                  label="Banner Title"
                  required
                >
                  <input
                    type="text"
                    value={
                      formData.title
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "title",
                        event.target.value
                      )
                    }
                    disabled={
                      saving
                    }
                    className="sth-banner-input"
                  />
                </FormField>
              </div>

              <div className="lg:col-span-2">
                <FormField
                  label="Description"
                >
                  <textarea
                    rows={4}
                    value={
                      formData.description ||
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    disabled={
                      saving
                    }
                    className="sth-banner-textarea"
                  />
                </FormField>
              </div>

              {/* =============================================
                  IMAGE UPLOAD
              ============================================== */}

              <div className="lg:col-span-2">
                <FormField
                  label="Banner Image"
                  required={
                    !editingBannerId
                  }
                >
                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={
                      handleImageInputChange
                    }
                    disabled={
                      saving
                    }
                    className="hidden"
                  />

                  <div
                    onDragEnter={(
                      event
                    ) => {
                      event.preventDefault();

                      if (
                        !saving
                      ) {
                        setDraggingImage(
                          true
                        );
                      }
                    }}
                    onDragOver={(
                      event
                    ) => {
                      event.preventDefault();

                      if (
                        !saving
                      ) {
                        setDraggingImage(
                          true
                        );
                      }
                    }}
                    onDragLeave={(
                      event
                    ) => {
                      event.preventDefault();

                      setDraggingImage(
                        false
                      );
                    }}
                    onDrop={
                      handleImageDrop
                    }
                    className={`
                      overflow-hidden
                      rounded-xl
                      border-2
                      border-dashed
                      transition

                      ${
                        draggingImage
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10"
                          : "border-gray-300 bg-gray-50/60 dark:border-gray-700 dark:bg-white/[0.02]"
                      }
                    `}
                  >
                    {imagePreview ? (
                      <div>
                        <div className="relative bg-gray-100 dark:bg-gray-950">
                          <img
                            src={
                              imagePreview
                            }
                            alt="Banner preview"
                            className="max-h-[320px] min-h-[190px] w-full object-contain"
                          />

                          {selectedImageFile && (
                            <div className="absolute left-3 top-3 rounded-full bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
                              New Image
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-gray-200 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            {selectedImageFile ? (
                              <>
                                <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                                  {
                                    selectedImageFile.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {formatBannerImageFileSize(
                                    selectedImageFile.size
                                  )}
                                  {" • "}
                                  Ready to upload
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                  Current Banner Image
                                </p>

                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  Choose another image to replace it.
                                </p>
                              </>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {selectedImageFile && (
                              <button
                                type="button"
                                disabled={
                                  saving
                                }
                                onClick={
                                  resetSelectedImage
                                }
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                              >
                                <X
                                  size={14}
                                />

                                Cancel Change
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={
                                saving
                              }
                              onClick={() =>
                                fileInputRef.current?.click()
                              }
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                            >
                              <UploadCloud
                                size={14}
                              />

                              {imagePreview
                                ? "Change Image"
                                : "Choose Image"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        className="flex min-h-[220px] w-full flex-col items-center justify-center px-6 py-8 text-center disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                          <UploadCloud
                            size={26}
                          />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-white">
                          Choose an image or drag it here
                        </p>

                        <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                          JPG, JPEG, PNG, WEBP or AVIF
                          <br />
                          Maximum file size 10 MB
                        </p>
                      </button>
                    )}
                  </div>
                </FormField>
              </div>

              {/* CTA */}

              <FormField
                label="CTA Button Text"
              >
                <input
                  type="text"
                  value={
                    formData.buttonText ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "buttonText",
                      event.target.value
                    )
                  }
                  disabled={
                    saving
                  }
                  placeholder="Explore Products"
                  className="sth-banner-input"
                />
              </FormField>

              <FormField
                label="CTA Link"
              >
                <input
                  type="text"
                  value={
                    formData.buttonLink ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "buttonLink",
                      event.target.value
                    )
                  }
                  disabled={
                    saving
                  }
                  placeholder="/products"
                  className="sth-banner-input"
                />
              </FormField>

              {/* PLACEMENT */}

              <FormField
                label="Placement"
              >
                <select
                  value={
                    formData.placement
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "placement",
                      event.target.value as BannerPlacement
                    )
                  }
                  disabled={
                    saving
                  }
                  className="sth-banner-input"
                >
                  {BANNER_PLACEMENT_OPTIONS.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </FormField>

              {/* STATUS */}

              <FormField
                label="Status"
              >
                <select
                  value={
                    formData.status
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "status",
                      event.target.value as BannerStatus
                    )
                  }
                  disabled={
                    saving
                  }
                  className="sth-banner-input"
                >
                  {BANNER_STATUS_OPTIONS.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </FormField>

              {/* DATES */}

              <FormField
                label="Start Date"
              >
                <input
                  type="date"
                  value={
                    formData.startDate ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "startDate",
                      event.target.value
                    )
                  }
                  disabled={
                    saving
                  }
                  className="sth-banner-input"
                />
              </FormField>

              <FormField
                label="End Date"
              >
                <input
                  type="date"
                  value={
                    formData.endDate ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateForm(
                      "endDate",
                      event.target.value
                    )
                  }
                  disabled={
                    saving
                  }
                  className="sth-banner-input"
                />
              </FormField>

              {/* VISIBILITY */}

              <div className="lg:col-span-2">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Banner Visibility
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Hidden banners will not appear on the storefront.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      updateForm(
                        "visible",
                        !formData.visible
                      )
                    }
                    className={`
                      relative
                      h-6
                      w-11
                      rounded-full
                      transition
                      disabled:cursor-not-allowed
                      disabled:opacity-50

                      ${
                        formData.visible
                          ? "bg-gradient-to-r from-orange-500 to-purple-600"
                          : "bg-gray-300 dark:bg-gray-700"
                      }
                    `}
                  >
                    <span
                      className={`
                        absolute
                        top-0.5
                        h-5
                        w-5
                        rounded-full
                        bg-white
                        shadow
                        transition-all

                        ${
                          formData.visible
                            ? "left-[22px]"
                            : "left-0.5"
                        }
                      `}
                    />
                  </button>
                </div>
              </div>

              {/* LIFECYCLE */}

              <div className="lg:col-span-2">
                <div className="rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-xs leading-5 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                  Draft banners remain unpublished. Published banners are automatically resolved as Scheduled, Active or Expired from their campaign dates.
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleSaveBanner()
                }
                disabled={
                  saving
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2
                    size={16}
                  />
                )}

                {saving
                  ? selectedImageFile
                    ? "Saving & Uploading..."
                    : "Saving..."
                  : editingBannerId
                    ? "Save Changes"
                    : "Add Banner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          INPUT STYLES
      ====================================================== */}

      <style>
        {`
          .sth-banner-input,
          .sth-banner-textarea {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid rgb(209 213 219);
            background: transparent;
            padding-left: 0.875rem;
            padding-right: 0.875rem;
            font-size: 0.875rem;
            color: rgb(31 41 55);
            outline: none;
            transition:
              border-color 150ms ease,
              box-shadow 150ms ease;
          }

          .sth-banner-input {
            height: 44px;
          }

          .sth-banner-textarea {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
            resize: vertical;
          }

          .sth-banner-input:focus,
          .sth-banner-textarea:focus {
            border-color: rgb(147 51 234);
            box-shadow:
              0 0 0 1px rgb(147 51 234);
          }

          .sth-banner-input:disabled,
          .sth-banner-textarea:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          .dark .sth-banner-input,
          .dark .sth-banner-textarea {
            border-color: rgb(55 65 81);
            background: rgb(17 24 39);
            color: rgba(255, 255, 255, 0.9);
          }
        `}
      </style>
    </>
  );
};

/* =========================================================
   FORM FIELD
========================================================= */

const FormField = ({
  label,
  required = false,
  children,
}: {
  label: string;

  required?: boolean;

  children: React.ReactNode;
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}

        {required && (
          <span className="ml-1 text-orange-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const SummaryCard = ({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;

  value: number;

  icon: React.ReactNode;

  iconClass: string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   TABLE HEADING
========================================================= */

const TableHeading = ({
  children,
  align = "left",
}: {
  children: React.ReactNode;

  align?:
    | "left"
    | "right";
}) => {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6 ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
};

export default Banners;