import api from "../api";

/* =========================================================
   TYPES
========================================================= */

export type HomepageSectionKey =
  | "hero"
  | "stats"
  | "categories"
  | "brands"
  | "promoBanners"
  | "popularProducts"
  | "whySolarTradeHub"
  | "featuredSuppliers"
  | "solarPrices"
  | "quoteCTA"
  | "whatsappCTA";

export type HomepageHero = {
  eyebrow: string;

  heading: string;

  description: string;

  primaryButtonText: string;

  primaryButtonLink: string;

  secondaryButtonText: string;

  secondaryButtonLink: string;
};

export type HomepageStat = {
  key: string;

  label: string;

  value: string;

  enabled: boolean;

  order: number;
};

export type HomepageSection = {
  id: HomepageSectionKey;

  title: string;

  description: string;

  enabled: boolean;

  order: number;
};

export type HomepageContent = {
  _id?: string;

  id?: string;

  key?: string;

  hero: HomepageHero;

  stats: HomepageStat[];

  sections: HomepageSection[];

  updatedBy?: string | null;

  createdAt?: string | null;

  updatedAt?: string | null;
};

/* =========================================================
   UPDATE PAYLOAD
========================================================= */

export type UpdateHomepagePayload = {
  hero?: Partial<HomepageHero>;

  stats?: HomepageStat[];

  sections?: HomepageSection[];
};

/* =========================================================
   API RESPONSE TYPES
========================================================= */

type HomepageResponse = {
  success: boolean;

  message?: string;

  data?: {
    homepage?: HomepageContent;
  };
};

/* =========================================================
   DEFAULT HERO

   Used only as frontend fallback.

   Backend remains the source of truth.
========================================================= */

export const DEFAULT_HOMEPAGE_HERO: HomepageHero =
  {
    eyebrow:
      "Pakistan's Solar Marketplace",

    heading:
      "Buy, Sell & Source Solar Equipment with Confidence",

    description:
      "Discover solar panels, inverters, batteries, suppliers, installers and commercial opportunities through Solar Trade Hub.",

    primaryButtonText:
      "Explore Products",

    primaryButtonLink:
      "/products",

    secondaryButtonText:
      "Request a Quote",

    secondaryButtonLink:
      "/quote",
  };

/* =========================================================
   DEFAULT STATS
========================================================= */

export const DEFAULT_HOMEPAGE_STATS: HomepageStat[] =
  [
    {
      key:
        "products",

      label:
        "Products",

      value:
        "1,000+",

      enabled:
        true,

      order:
        1,
    },

    {
      key:
        "verified_suppliers",

      label:
        "Verified Suppliers",

      value:
        "100+",

      enabled:
        true,

      order:
        2,
    },

    {
      key:
        "solar_brands",

      label:
        "Solar Brands",

      value:
        "50+",

      enabled:
        true,

      order:
        3,
    },

    {
      key:
        "marketplace_users",

      label:
        "Marketplace Users",

      value:
        "5,000+",

      enabled:
        true,

      order:
        4,
    },
  ];

/* =========================================================
   DEFAULT SECTIONS
========================================================= */

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] =
  [
    {
      id:
        "hero",

      title:
        "Hero Section",

      description:
        "Main marketplace headline, description and primary calls to action.",

      enabled:
        true,

      order:
        1,
    },

    {
      id:
        "stats",

      title:
        "Marketplace Stats",

      description:
        "Key Solar Trade Hub marketplace statistics.",

      enabled:
        true,

      order:
        2,
    },

    {
      id:
        "categories",

      title:
        "Shop by Category",

      description:
        "Solar panels, inverters, batteries and other marketplace categories.",

      enabled:
        true,

      order:
        3,
    },

    {
      id:
        "brands",

      title:
        "Featured Brands",

      description:
        "Prominent solar brands available across the marketplace.",

      enabled:
        true,

      order:
        4,
    },

    {
      id:
        "promoBanners",

      title:
        "Promo Banners",

      description:
        "Homepage promotional campaigns and marketplace offers.",

      enabled:
        true,

      order:
        5,
    },

    {
      id:
        "popularProducts",

      title:
        "Popular Products",

      description:
        "Popular or promoted products shown on the homepage.",

      enabled:
        true,

      order:
        6,
    },

    {
      id:
        "whySolarTradeHub",

      title:
        "Why Solar Trade Hub",

      description:
        "Marketplace value proposition and buyer confidence section.",

      enabled:
        true,

      order:
        7,
    },

    {
      id:
        "featuredSuppliers",

      title:
        "Featured Suppliers",

      description:
        "Selected suppliers promoted on the storefront homepage.",

      enabled:
        true,

      order:
        8,
    },

    {
      id:
        "solarPrices",

      title:
        "Solar Prices",

      description:
        "Homepage solar market pricing section.",

      enabled:
        true,

      order:
        9,
    },

    {
      id:
        "quoteCTA",

      title:
        "Request a Quote",

      description:
        "Call to action for buyers looking for solar quotations.",

      enabled:
        true,

      order:
        10,
    },

    {
      id:
        "whatsappCTA",

      title:
        "WhatsApp CTA",

      description:
        "Quick contact call to action for marketplace visitors.",

      enabled:
        true,

      order:
        11,
    },
  ];

/* =========================================================
   HELPERS
========================================================= */

const cloneHero = (
  hero: HomepageHero
): HomepageHero => {
  return {
    ...hero,
  };
};

const cloneStats = (
  stats: HomepageStat[]
): HomepageStat[] => {
  return stats.map(
    (stat) => ({
      ...stat,
    })
  );
};

const cloneSections = (
  sections: HomepageSection[]
): HomepageSection[] => {
  return sections.map(
    (section) => ({
      ...section,
    })
  );
};

/* =========================================================
   NORMALIZE HERO
========================================================= */

const normalizeHero = (
  value?: Partial<HomepageHero> | null
): HomepageHero => {
  return {
    ...cloneHero(
      DEFAULT_HOMEPAGE_HERO
    ),

    ...(value || {}),
  };
};

/* =========================================================
   NORMALIZE STATS
========================================================= */

const normalizeStats = (
  value?: HomepageStat[] | null
): HomepageStat[] => {
  if (
    !Array.isArray(
      value
    ) ||
    value.length === 0
  ) {
    return cloneStats(
      DEFAULT_HOMEPAGE_STATS
    );
  }

  return value
    .map(
      (
        stat,
        index
      ) => ({
        key:
          String(
            stat.key ||
              `stat_${index + 1}`
          ),

        label:
          String(
            stat.label ||
              ""
          ),

        value:
          String(
            stat.value ||
              ""
          ),

        enabled:
          stat.enabled !==
          false,

        order:
          Number(
            stat.order ||
              index + 1
          ),
      })
    )
    .sort(
      (
        first,
        second
      ) =>
        first.order -
        second.order
    );
};

/* =========================================================
   NORMALIZE SECTIONS
========================================================= */

const normalizeSections = (
  value?: HomepageSection[] | null
): HomepageSection[] => {
  if (
    !Array.isArray(
      value
    ) ||
    value.length === 0
  ) {
    return cloneSections(
      DEFAULT_HOMEPAGE_SECTIONS
    );
  }

  return value
    .map(
      (
        section,
        index
      ) => ({
        id:
          section.id,

        title:
          String(
            section.title ||
              ""
          ),

        description:
          String(
            section.description ||
              ""
          ),

        enabled:
          section.enabled !==
          false,

        order:
          Number(
            section.order ||
              index + 1
          ),
      })
    )
    .sort(
      (
        first,
        second
      ) =>
        first.order -
        second.order
    );
};

/* =========================================================
   NORMALIZE HOMEPAGE
========================================================= */

const normalizeHomepage = (
  value?: HomepageContent | null
): HomepageContent => {
  return {
    _id:
      value?._id,

    id:
      value?.id,

    key:
      value?.key ||
      "homepage",

    hero:
      normalizeHero(
        value?.hero
      ),

    stats:
      normalizeStats(
        value?.stats
      ),

    sections:
      normalizeSections(
        value?.sections
      ),

    updatedBy:
      value?.updatedBy ??
      null,

    createdAt:
      value?.createdAt ??
      null,

    updatedAt:
      value?.updatedAt ??
      null,
  };
};

/* =========================================================
   GET HOMEPAGE

   GET
   /api/v1/content/homepage
========================================================= */

export const getHomepage =
  async (): Promise<HomepageContent> => {
    const response =
      await api.get<HomepageResponse>(
        "/content/homepage"
      );

    const homepage =
      response.data
        ?.data
        ?.homepage;

    if (!homepage) {
      throw new Error(
        "Homepage content was not returned by the server."
      );
    }

    return normalizeHomepage(
      homepage
    );
  };

/* =========================================================
   UPDATE HOMEPAGE

   PATCH
   /api/v1/content/homepage
========================================================= */

export const updateHomepage =
  async (
    payload: UpdateHomepagePayload
  ): Promise<HomepageContent> => {
    const response =
      await api.patch<HomepageResponse>(
        "/content/homepage",
        payload
      );

    const homepage =
      response.data
        ?.data
        ?.homepage;

    if (!homepage) {
      throw new Error(
        "Updated homepage content was not returned by the server."
      );
    }

    return normalizeHomepage(
      homepage
    );
  };

/* =========================================================
   ERROR MESSAGE
========================================================= */

export const getHomepageErrorMessage =
  (
    error: unknown,
    fallback =
      "Something went wrong while processing homepage content."
  ) => {
    if (
      typeof error ===
        "object" &&
      error !==
        null
    ) {
      const candidate =
        error as {
          response?: {
            data?: {
              message?: string;

              errors?: string[];
            };
          };

          message?: string;
        };

      const responseMessage =
        candidate.response
          ?.data
          ?.message;

      const validationErrors =
        candidate.response
          ?.data
          ?.errors;

      if (
        Array.isArray(
          validationErrors
        ) &&
        validationErrors.length >
          0
      ) {
        return validationErrors.join(
          " "
        );
      }

      if (
        responseMessage
      ) {
        return responseMessage;
      }

      if (
        candidate.message
      ) {
        return candidate.message;
      }
    }

    return fallback;
  };