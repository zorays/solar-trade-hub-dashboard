import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BarChart3,
  BatteryCharging,
  Building2,
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Layers3,
  Megaphone,
  PackageSearch,
  RefreshCw,
  Save,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  Tags,
  Users,
  Zap,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  DEFAULT_HOMEPAGE_HERO,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_HOMEPAGE_STATS,
  getHomepage,
  getHomepageErrorMessage,
  updateHomepage,
  type HomepageContent,
  type HomepageHero,
  type HomepageSection,
  type HomepageSectionKey,
  type HomepageStat,
} from "../../services/home/homepage.service";

/* =========================================================
   HELPERS
========================================================= */

const cloneHero = (
  hero: HomepageHero
): HomepageHero => ({
  ...hero,
});

const cloneStats = (
  stats: HomepageStat[]
): HomepageStat[] =>
  stats.map(
    (stat) => ({
      ...stat,
    })
  );

const cloneSections = (
  sections: HomepageSection[]
): HomepageSection[] =>
  sections.map(
    (section) => ({
      ...section,
    })
  );

/* =========================================================
   SECTION ICON
========================================================= */

const getSectionIcon = (
  section: HomepageSectionKey
) => {
  switch (section) {
    case "hero":
      return <Sparkles size={18} />;

    case "stats":
      return <BarChart3 size={18} />;

    case "categories":
      return <Layers3 size={18} />;

    case "brands":
      return <Tags size={18} />;

    case "promoBanners":
      return <Megaphone size={18} />;

    case "popularProducts":
      return <ShoppingBag size={18} />;

    case "whySolarTradeHub":
      return <Sun size={18} />;

    case "featuredSuppliers":
      return <Building2 size={18} />;

    case "solarPrices":
      return <Zap size={18} />;

    case "quoteCTA":
      return <PackageSearch size={18} />;

    case "whatsappCTA":
      return <Store size={18} />;

    default:
      return <Layers3 size={18} />;
  }
};

/* =========================================================
   STAT ICON
========================================================= */

const getStatIcon = (
  key: string
) => {
  switch (key) {
    case "products":
      return (
        <ShoppingBag
          size={18}
        />
      );

    case "verified_suppliers":
      return (
        <Building2
          size={18}
        />
      );

    case "solar_brands":
      return (
        <BatteryCharging
          size={18}
        />
      );

    case "marketplace_users":
      return (
        <Users
          size={18}
        />
      );

    default:
      return (
        <BarChart3
          size={18}
        />
      );
  }
};

/* =========================================================
   PAGE
========================================================= */

const Homepage = () => {
  const [
    hero,
    setHero,
  ] =
    useState<HomepageHero>(
      cloneHero(
        DEFAULT_HOMEPAGE_HERO
      )
    );

  const [
    stats,
    setStats,
  ] =
    useState<HomepageStat[]>(
      cloneStats(
        DEFAULT_HOMEPAGE_STATS
      )
    );

  const [
    sections,
    setSections,
  ] =
    useState<HomepageSection[]>(
      cloneSections(
        DEFAULT_HOMEPAGE_SECTIONS
      )
    );

  const [
    serverSnapshot,
    setServerSnapshot,
  ] =
    useState<HomepageContent | null>(
      null
    );

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
    saved,
    setSaved,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     APPLY HOMEPAGE
  ======================================================= */

  const applyHomepage =
    useCallback(
      (
        homepage: HomepageContent
      ) => {
        setHero(
          cloneHero(
            homepage.hero
          )
        );

        setStats(
          cloneStats(
            homepage.stats
          )
        );

        setSections(
          cloneSections(
            homepage.sections
          )
        );
      },
      []
    );

  /* =======================================================
     LOAD HOMEPAGE
  ======================================================= */

  const loadHomepage =
    useCallback(
      async () => {
        try {
          setLoading(true);

          setError("");

          setSaved(false);

          const homepage =
            await getHomepage();

          applyHomepage(
            homepage
          );

          setServerSnapshot(
            homepage
          );
        } catch (
          loadError
        ) {
          setError(
            getHomepageErrorMessage(
              loadError,
              "Unable to load homepage content."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        applyHomepage,
      ]
    );

  useEffect(
    () => {
      void loadHomepage();
    },
    [
      loadHomepage,
    ]
  );

  /* =======================================================
     SORTED SECTIONS

     Important:
     Never call sections.sort() directly because that
     mutates React state.
  ======================================================= */

  const sortedSections =
    useMemo(
      () =>
        [
          ...sections,
        ].sort(
          (
            first,
            second
          ) =>
            first.order -
            second.order
        ),
      [
        sections,
      ]
    );

  /* =======================================================
     COUNTS
  ======================================================= */

  const enabledSections =
    useMemo(
      () =>
        sections.filter(
          (
            section
          ) =>
            section.enabled
        ).length,
      [
        sections,
      ]
    );

  const disabledSections =
    sections.length -
    enabledSections;

  /* =======================================================
     HERO CHANGE
  ======================================================= */

  const updateHeroField = (
    field: keyof HomepageHero,
    value: string
  ) => {
    setHero(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );

    setSaved(
      false
    );

    setError(
      ""
    );
  };

  /* =======================================================
     STAT CHANGE
  ======================================================= */

  const updateStat = (
    key: string,
    field:
      | "label"
      | "value",
    value: string
  ) => {
    setStats(
      (
        current
      ) =>
        current.map(
          (
            stat
          ) =>
            stat.key ===
            key
              ? {
                  ...stat,

                  [field]:
                    value,
                }
              : stat
        )
    );

    setSaved(
      false
    );

    setError(
      ""
    );
  };

  /* =======================================================
     SECTION VISIBILITY
  ======================================================= */

  const toggleSection = (
    id: HomepageSectionKey
  ) => {
    setSections(
      (
        current
      ) =>
        current.map(
          (
            section
          ) =>
            section.id ===
            id
              ? {
                  ...section,

                  enabled:
                    !section.enabled,
                }
              : section
        )
    );

    setSaved(
      false
    );

    setError(
      ""
    );
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async () => {
      try {
        setSaving(
          true
        );

        setSaved(
          false
        );

        setError(
          ""
        );

        const updatedHomepage =
          await updateHomepage({
            hero: {
              ...hero,
            },

            stats:
              stats.map(
                (
                  stat
                ) => ({
                  ...stat,
                })
              ),

            sections:
              sections.map(
                (
                  section
                ) => ({
                  ...section,
                })
              ),
          });

        applyHomepage(
          updatedHomepage
        );

        setServerSnapshot(
          updatedHomepage
        );

        setSaved(
          true
        );
      } catch (
        saveError
      ) {
        setError(
          getHomepageErrorMessage(
            saveError,
            "Unable to save homepage content."
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     RESET

     Reset means:
     restore the latest version loaded/saved from backend.

     It does NOT overwrite MongoDB until Save Changes
     is clicked.
  ======================================================= */

  const handleReset = () => {
    if (
      serverSnapshot
    ) {
      applyHomepage(
        serverSnapshot
      );
    } else {
      setHero(
        cloneHero(
          DEFAULT_HOMEPAGE_HERO
        )
      );

      setStats(
        cloneStats(
          DEFAULT_HOMEPAGE_STATS
        )
      );

      setSections(
        cloneSections(
          DEFAULT_HOMEPAGE_SECTIONS
        )
      );
    }

    setSaved(
      false
    );

    setError(
      ""
    );
  };

  return (
    <>
      <PageMeta
        title="Homepage Content | Solar Trade Hub"
        description="Manage Solar Trade Hub storefront homepage content."
      />

      <PageBreadcrumb
        pageTitle="Homepage"
      />

      <div className="space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

            <div className="pointer-events-none absolute right-16 top-0 h-32 w-32 rounded-full bg-purple-500/5" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                  <Layers3
                    size={23}
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                    Content Management
                  </p>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    Storefront Homepage
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Manage the
                    content and
                    visibility of
                    the Solar Trade
                    Hub public
                    homepage.
                  </p>

                  {serverSnapshot
                    ?.updatedAt && (
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      Last updated:{" "}
                      {new Date(
                        serverSnapshot.updatedAt
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    handleReset
                  }
                  disabled={
                    loading ||
                    saving
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <RefreshCw
                    size={16}
                  />

                  Reset
                </button>

                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    loading ||
                    saving
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={16}
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
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
                void loadHomepage()
              }
              disabled={
                loading
              }
              className="inline-flex items-center gap-2 self-start font-semibold transition hover:opacity-80 disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                size={14}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Retry
            </button>
          </div>
        )}

        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
            <Check
              size={17}
            />

            Homepage
            changes saved
            successfully.
          </div>
        )}

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                <RefreshCw
                  size={21}
                  className="animate-spin"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Loading
                  homepage
                </p>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Fetching
                  storefront
                  content from
                  the server.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* =================================================
                SUMMARY
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryCard
                title="Homepage Sections"
                value={
                  sections.length
                }
                icon={
                  <Layers3
                    size={20}
                  />
                }
                iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
              />

              <SummaryCard
                title="Visible Sections"
                value={
                  enabledSections
                }
                icon={
                  <Eye
                    size={20}
                  />
                }
                iconClass="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
              />

              <SummaryCard
                title="Hidden Sections"
                value={
                  disabledSections
                }
                icon={
                  <EyeOff
                    size={20}
                  />
                }
                iconClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
              />
            </div>

            {/* =================================================
                HERO
            ================================================== */}

            <ContentCard
              title="Hero Section"
              description="Main content displayed at the top of the Solar Trade Hub homepage."
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <FormField
                  label="Eyebrow Text"
                >
                  <input
                    type="text"
                    value={
                      hero.eyebrow
                    }
                    onChange={(
                      event
                    ) =>
                      updateHeroField(
                        "eyebrow",
                        event
                          .target
                          .value
                      )
                    }
                    className="sth-content-input"
                  />
                </FormField>

                <FormField
                  label="Main Heading"
                >
                  <input
                    type="text"
                    value={
                      hero.heading
                    }
                    onChange={(
                      event
                    ) =>
                      updateHeroField(
                        "heading",
                        event
                          .target
                          .value
                      )
                    }
                    className="sth-content-input"
                  />
                </FormField>

                <div className="lg:col-span-2">
                  <FormField
                    label="Description"
                  >
                    <textarea
                      rows={4}
                      value={
                        hero.description
                      }
                      onChange={(
                        event
                      ) =>
                        updateHeroField(
                          "description",
                          event
                            .target
                            .value
                        )
                      }
                      className="sth-content-textarea"
                    />
                  </FormField>
                </div>

                <FormField
                  label="Primary Button Text"
                >
                  <input
                    type="text"
                    value={
                      hero.primaryButtonText
                    }
                    onChange={(
                      event
                    ) =>
                      updateHeroField(
                        "primaryButtonText",
                        event
                          .target
                          .value
                      )
                    }
                    className="sth-content-input"
                  />
                </FormField>

                <FormField
                  label="Primary Button Link"
                >
                  <input
                    type="text"
                    value={
                      hero.primaryButtonLink
                    }
                    onChange={(
                      event
                    ) =>
                      updateHeroField(
                        "primaryButtonLink",
                        event
                          .target
                          .value
                      )
                    }
                    className="sth-content-input"
                  />
                </FormField>

                <FormField
                  label="Secondary Button Text"
                >
                  <input
                    type="text"
                    value={
                      hero.secondaryButtonText
                    }
                    onChange={(
                      event
                    ) =>
                      updateHeroField(
                        "secondaryButtonText",
                        event
                          .target
                          .value
                      )
                    }
                    className="sth-content-input"
                  />
                </FormField>

                <FormField
                  label="Secondary Button Link"
                >
                  <input
                    type="text"
                    value={
                      hero.secondaryButtonLink
                    }
                    onChange={(
                      event
                    ) =>
                      updateHeroField(
                        "secondaryButtonLink",
                        event
                          .target
                          .value
                      )
                    }
                    className="sth-content-input"
                  />
                </FormField>
              </div>
            </ContentCard>

            {/* =================================================
                MARKETPLACE STATS
            ================================================== */}

            <ContentCard
              title="Marketplace Stats"
              description="Key marketplace numbers displayed on the homepage."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ...stats,
                ]
                  .sort(
                    (
                      first,
                      second
                    ) =>
                      first.order -
                      second.order
                  )
                  .map(
                    (
                      stat
                    ) => (
                      <div
                        key={
                          stat.key
                        }
                        className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
                            {getStatIcon(
                              stat.key
                            )}
                          </div>

                          <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                            Order{" "}
                            {
                              stat.order
                            }
                          </span>
                        </div>

                        <FormField
                          label="Value"
                        >
                          <input
                            type="text"
                            value={
                              stat.value
                            }
                            onChange={(
                              event
                            ) =>
                              updateStat(
                                stat.key,
                                "value",
                                event
                                  .target
                                  .value
                              )
                            }
                            className="sth-content-input"
                          />
                        </FormField>

                        <div className="mt-3">
                          <FormField
                            label="Label"
                          >
                            <input
                              type="text"
                              value={
                                stat.label
                              }
                              onChange={(
                                event
                              ) =>
                                updateStat(
                                  stat.key,
                                  "label",
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="sth-content-input"
                            />
                          </FormField>
                        </div>
                      </div>
                    )
                  )}
              </div>
            </ContentCard>

            {/* =================================================
                SECTION MANAGEMENT
            ================================================== */}

            <ContentCard
              title="Homepage Sections"
              description="Control which storefront sections are visible on the homepage."
            >
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {sortedSections.map(
                    (
                      section
                    ) => (
                      <div
                        key={
                          section.id
                        }
                        className="flex flex-col gap-4 p-4 transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02] sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-400">
                            <GripVertical
                              size={18}
                            />
                          </div>

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-purple-50 text-purple-600 dark:from-orange-500/10 dark:to-purple-500/10 dark:text-purple-400">
                            {getSectionIcon(
                              section.id
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {
                                section.title
                              }
                            </p>

                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                              Order{" "}
                              {
                                section.order
                              }
                            </span>
                          </div>

                          <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
                            {
                              section.description
                            }
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              px-2.5
                              py-1
                              text-xs
                              font-semibold

                              ${
                                section.enabled
                                  ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                  : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                              }
                            `}
                          >
                            {section.enabled ? (
                              <Eye
                                size={13}
                              />
                            ) : (
                              <EyeOff
                                size={13}
                              />
                            )}

                            {section.enabled
                              ? "Visible"
                              : "Hidden"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              toggleSection(
                                section.id
                              )
                            }
                            aria-label={`${
                              section.enabled
                                ? "Hide"
                                : "Show"
                            } ${section.title}`}
                            className={`
                              relative
                              h-6
                              w-11
                              rounded-full
                              transition

                              ${
                                section.enabled
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
                                  section.enabled
                                    ? "left-[22px]"
                                    : "left-0.5"
                                }
                              `}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </ContentCard>

            {/* =================================================
                STOREFRONT NOTE
            ================================================== */}

            <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-orange-50/70 to-purple-50/70 p-5 dark:border-purple-500/10 dark:from-orange-500/5 dark:to-purple-500/5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm dark:bg-white/5 dark:text-purple-400">
                  <Store
                    size={18}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Storefront
                    Integration
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Homepage
                    configuration
                    is now stored
                    in the Solar
                    Trade Hub
                    backend.
                    Categories,
                    brands,
                    products and
                    suppliers
                    continue to
                    come from
                    their own
                    marketplace
                    modules.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          INPUT STYLES
      ====================================================== */}

      <style>
        {`
          .sth-content-input,
          .sth-content-textarea {
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

          .sth-content-input {
            height: 44px;
          }

          .sth-content-textarea {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
            resize: vertical;
          }

          .sth-content-input:focus,
          .sth-content-textarea:focus {
            border-color: rgb(147 51 234);
            box-shadow: 0 0 0 1px rgb(147 51 234);
          }

          .dark .sth-content-input,
          .dark .sth-content-textarea {
            border-color: rgb(55 65 81);
            background: rgb(17 24 39);
            color: rgba(255, 255, 255, 0.9);
          }

          .sth-content-input:disabled,
          .sth-content-textarea:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }
        `}
      </style>
    </>
  );
};

/* =========================================================
   CONTENT CARD
========================================================= */

const ContentCard = ({
  title,
  description,
  children,
}: {
  title: string;

  description: string;

  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};

/* =========================================================
   FORM FIELD
========================================================= */

const FormField = ({
  label,
  children,
}: {
  label: string;

  children: React.ReactNode;
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
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

export default Homepage;