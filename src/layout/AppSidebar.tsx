
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link, useLocation } from "react-router";

import { ChevronDownIcon, GridIcon } from "../icons";

import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";

import {
  hasUserPermission,
} from "../services/auth.service";

/* =========================================================
   SOLAR TRADE HUB — ADMINISTRATION SIDEBAR

   Existing dashboard routes are preserved.

   Planned modules are visible but disabled until their
   actual pages, backend integrations and protected routes
   are completed.

   Existing Product List:
   External master catalogue — unchanged.

   Supplier Products:
   Separate supplier-owned listings with subscription
   entitlement, stock and admin approval.

   Plans:
   Existing subscription management remains the master
   source for bidding and product listing allowances.
========================================================= */

type AccessRule = {
  anyOf?: string[];
  allOf?: string[];
  adminOnly?: boolean;
  always?: boolean;
};

type SubItem = {
  name: string;
  path?: string;
  access?: AccessRule;
  disabled?: boolean;
};

type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: SubItem[];
  access?: AccessRule;
  disabled?: boolean;
};

type MenuSection = {
  title: string;
  items: NavItem[];
};

type IconName =
  | "products"
  | "customers"
  | "suppliers"
  | "installers"
  | "orders"
  | "payments"
  | "tenders"
  | "deals"
  | "users"
  | "content"
  | "reports"
  | "settings"
  | "notifications"
  | "help"
  | "careers";

/* =========================================================
   ICONS
========================================================= */

function SidebarIcon({ name }: { name: IconName }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-full w-full",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "products":
      return (
        <svg {...props}>
          <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
          <path d="M4 7.5v9L12 21l8-4.5v-9" />
          <path d="M12 12v9" />
        </svg>
      );

    case "customers":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="4" />
          <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
          <path d="M17 8h4M19 6v4" />
        </svg>
      );

    case "suppliers":
      return (
        <svg {...props}>
          <path d="M4 21V8l8-4 8 4v13" />
          <path d="M2 21h20" />
          <path d="M8 11h2M14 11h2M8 15h2M14 15h2" />
        </svg>
      );

    case "installers":
      return (
        <svg {...props}>
          <path d="m14.7 6.3 3-3a4 4 0 0 1-5.2 5.2l-6.7 6.7a2.1 2.1 0 1 0 3 3l6.7-6.7a4 4 0 0 1 5.2-5.2l-3 3-3-3Z" />
        </svg>
      );

    case "orders":
      return (
        <svg {...props}>
          <path d="M6 7h12l1 14H5L6 7Z" />
          <path d="M9 9V5a3 3 0 0 1 6 0v4" />
        </svg>
      );

    case "payments":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18M7 15h4M16 13v4M14 15h4" />
        </svg>
      );

    case "tenders":
      return (
        <svg {...props}>
          <path d="M6 3h9l3 3v15H6V3Z" />
          <path d="M15 3v4h4M9 11h6M9 15h6" />
        </svg>
      );

    case "deals":
      return (
        <svg {...props}>
          <path d="M20 13 13 20l-9-9V4h7l9 9Z" />
          <circle cx="8.5" cy="8.5" r="1.4" />
        </svg>
      );

    case "users":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="4" />
          <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
          <path d="M16 5.5a3.5 3.5 0 0 1 0 6.8" />
          <path d="M17.5 15.5A5.5 5.5 0 0 1 21.5 21" />
        </svg>
      );

    case "content":
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="1" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );

    case "reports":
      return (
        <svg {...props}>
          <path d="M4 20V11M10 20V4M16 20v-7M22 20H2" />
        </svg>
      );

    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l-2.8 2.8a1.7 1.7 0 0 0-1.9-.3A1.7 1.7 0 0 0 14 21h-4a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-2.8-2.8a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14v-4a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L7.1 4.3a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3h4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l2.8 2.8a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10v4a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      );

    case "notifications":
      return (
        <svg {...props}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
          <path d="M10 21h4" />
        </svg>
      );

    case "help":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.7 9a2.4 2.4 0 1 1 3.6 2.1c-.8.5-1.3 1-1.3 2" />
          <path d="M12 17h.01" />
        </svg>
      );

    case "careers":
      return (
        <svg {...props}>
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 13a18 18 0 0 0 18 0" />
          <path d="M11 12h2v3h-2z" />
        </svg>
      );

    default:
      return null;
  }
}

/* =========================================================
   ACCESS RULE HELPERS
========================================================= */

const viewOrManage = (module: string): AccessRule => ({
  anyOf: [
    `${module}.view`,
    `${module}.manage`,
  ],
});

const manageOnly = (module: string): AccessRule => ({
  anyOf: [`${module}.manage`],
});

const supplierManage: AccessRule = {
  anyOf: ["suppliers.manage"],
};

const customerRequestsAccess: AccessRule = {
  anyOf: [
    "customer_requests.view",
    "customer_requests.manage",
    "suppliers.manage",
  ],
};

const subscriptionsAccess: AccessRule = {
  anyOf: [
    "subscriptions.view",
    "subscriptions.manage",
    "suppliers.manage",
  ],
};

const plansAccess: AccessRule = {
  anyOf: [
    "subscriptions.manage",
    "suppliers.manage",
  ],
};

const bidsAccess: AccessRule = {
  anyOf: [
    "supplier_bids.view",
    "supplier_bids.manage",
    "suppliers.manage",
  ],
};

const paymentsAccess: AccessRule = {
  anyOf: [
    "payments.view",
    "payments.manage",
    "orders.manage",
  ],
};

const paymentsManageAccess: AccessRule = {
  anyOf: [
    "payments.manage",
    "orders.manage",
  ],
};

/* =========================================================
   NAVIGATION CONFIGURATION

   Existing routes verified against previous App.tsx.

   Disabled items are planned functionality, not fake
   navigable pages.
========================================================= */

const sections: MenuSection[] = [
  {
    title: "",
    items: [
      {
        name: "Dashboard",
        icon: <GridIcon />,
        path: "/",
        access: {
          anyOf: ["dashboard.view"],
        },
      },
    ],
  },

  /* =======================================================
     PRODUCT MANAGEMENT
  ======================================================= */

  {
    title: "Product Management",
    items: [
      {
        name: "Products",
        icon: <SidebarIcon name="products" />,
        access: viewOrManage("products"),
        subItems: [
          {
            name: "Product List",
            path: "/products",
            access: viewOrManage("products"),
          },
          {
            name: "Supplier Products",
            disabled: true,
            access: viewOrManage("products"),
          },
          {
            name: "Product Approvals",
            disabled: true,
            access: manageOnly("products"),
          },
        ],
      },
    ],
  },

  /* =======================================================
     MARKETPLACE
  ======================================================= */

  {
    title: "Marketplace",
    items: [
      {
        name: "Customers",
        icon: <SidebarIcon name="customers" />,
        subItems: [
          {
            name: "All Customers",
            path: "/customers",
            access: { adminOnly: true },
          },
          {
            name: "Range Tokens",
            path: "/marketplace/range-tokens",
            access: supplierManage,
          },
          {
            name: "Customer Requests",
            path: "/marketplace/customer-requests",
            access: customerRequestsAccess,
          },
        ],
      },

      {
        name: "Suppliers",
        icon: <SidebarIcon name="suppliers" />,
        subItems: [
          {
            name: "All Suppliers",
            path: "/suppliers",
            access: viewOrManage("suppliers"),
          },
          {
            name: "Add Supplier",
            path: "/suppliers/add",
            access: supplierManage,
          },
          {
            name: "Applications",
            path: "/suppliers/applications",
            access: supplierManage,
          },
          {
            name: "Verification",
            path: "/suppliers/verification",
            access: supplierManage,
          },
          {
            name: "Supplier Stock",
            disabled: true,
            access: viewOrManage("products"),
          },
          {
            name: "Subscriptions",
            path: "/marketplace/subscriptions",
            access: subscriptionsAccess,
          },
          {
            name: "Plans & Features",
            path: "/marketplace/plans",
            access: plansAccess,
          },
          {
            name: "Supplier Bids",
            path: "/marketplace/supplier-bids",
            access: bidsAccess,
          },
        ],
      },

      {
        name: "Installers",
        icon: <SidebarIcon name="installers" />,
        subItems: [
          {
            name: "All Installers",
            path: "/installers",
            access: viewOrManage("installers"),
          },
          {
            name: "Applications",
            path: "/installers/applications",
            access: manageOnly("installers"),
          },
          {
            name: "Verification",
            path: "/installers/verification",
            access: manageOnly("installers"),
          },
        ],
      },
    ],
  },

  /* =======================================================
     COMMERCE
  ======================================================= */

  {
    title: "Commerce",
    items: [
      {
        name: "Orders",
        icon: <SidebarIcon name="orders" />,
        subItems: [
          {
            name: "All Orders",
            path: "/orders",
            access: viewOrManage("orders"),
          },
          {
            name: "Pending",
            path: "/orders/pending",
            access: viewOrManage("orders"),
          },
          {
            name: "Completed",
            path: "/orders/completed",
            access: viewOrManage("orders"),
          },
        ],
      },
      {
        name: "Payments",
        icon: <SidebarIcon name="payments" />,
        subItems: [
          {
            name: "All Payments",
            path: "/payments",
            access: paymentsAccess,
          },
          {
            name: "Pending",
            path: "/payments/pending",
            access: paymentsAccess,
          },
          {
            name: "Manual Verification",
            path: "/payments/manual-verification",
            access: paymentsManageAccess,
          },
        ],
      },
      {
        name: "Tenders",
        icon: <SidebarIcon name="tenders" />,
        subItems: [
          {
            name: "All Tenders",
            path: "/tenders",
            access: viewOrManage("tenders"),
          },
          {
            name: "Add Tender",
            path: "/tenders/add",
            access: manageOnly("tenders"),
          },
        ],
      },
      {
        name: "Deals",
        icon: <SidebarIcon name="deals" />,
        subItems: [
          {
            name: "All Deals",
            path: "/deals",
            access: viewOrManage("deals"),
          },
          {
            name: "Add Deal",
            path: "/deals/add",
            access: manageOnly("deals"),
          },
        ],
      },
    ],
  },

  /* =======================================================
     MANAGEMENT
  ======================================================= */

  {
    title: "Management",
    items: [
      {
        name: "Careers",
        icon: <SidebarIcon name="careers" />,
        disabled: true,
        access: { adminOnly: true },
      },
      {
        name: "Company Users",
        icon: <SidebarIcon name="users" />,
        subItems: [
          {
            name: "All Company Users",
            path: "/users",
            access: { adminOnly: true },
          },
          {
            name: "Roles & Permissions",
            path: "/users/roles",
            access: viewOrManage("roles"),
          },
        ],
      },
      {
        name: "Content",
        icon: <SidebarIcon name="content" />,
        subItems: [
          {
            name: "Homepage",
            path: "/content/homepage",
            access: viewOrManage("content"),
          },
          {
            name: "Banners",
            path: "/content/banners",
            access: manageOnly("content"),
          },
          {
            name: "Pages",
            path: "/content/pages",
            access: manageOnly("content"),
          },
        ],
      },
      {
        name: "Reports",
        icon: <SidebarIcon name="reports" />,
        subItems: [
          {
            name: "Marketplace",
            path: "/reports/marketplace",
            access: viewOrManage("reports"),
          },
          {
            name: "Users",
            path: "/reports/users",
            access: viewOrManage("reports"),
          },
          {
            name: "Orders",
            path: "/reports/orders",
            access: viewOrManage("reports"),
          },
        ],
      },
    ],
  },

  /* =======================================================
     SYSTEM
  ======================================================= */

  {
    title: "System",
    items: [
      {
        name: "Settings",
        icon: <SidebarIcon name="settings" />,
        subItems: [
          {
            name: "General",
            path: "/settings",
            access: viewOrManage("settings"),
          },
          {
            name: "Marketplace",
            path: "/settings/marketplace",
            access: viewOrManage("settings"),
          },
          {
            name: "Email",
            path: "/settings/email",
            access: viewOrManage("settings"),
          },
        ],
      },
      {
        name: "Notifications",
        icon: <SidebarIcon name="notifications" />,
        path: "/notifications",
        access: viewOrManage("notifications"),
      },
      {
        name: "Help & Support",
        icon: <SidebarIcon name="help" />,
        path: "/help-support",
        access: { always: true },
      },
    ],
  },
];

/* =========================================================
   SIDEBAR COMPONENT
========================================================= */

const AppSidebar = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
  } = useSidebar();

  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] =
    useState<string | null>(null);

  const showText =
    isExpanded || isHovered || isMobileOpen;

  /* =======================================================
     ACCESS CONTROL
  ======================================================= */

  const canAccess = useCallback(
    (access?: AccessRule): boolean => {
      if (!access) return true;
      if (access.always) return true;

      if (access.adminOnly && !isAdmin) {
        return false;
      }

      if (access.allOf?.length) {
        const hasAll = access.allOf.every(
          (permission) =>
            hasUserPermission(user, permission)
        );

        if (!hasAll) return false;
      }

      if (access.anyOf?.length) {
        return access.anyOf.some(
          (permission) =>
            hasUserPermission(user, permission)
        );
      }

      return true;
    },
    [user, isAdmin]
  );

  /* =======================================================
     FILTER NAV ITEMS
  ======================================================= */

  const visibleSections = useMemo(
    (): MenuSection[] =>
      sections
        .map((section): MenuSection => {
          const items = section.items
            .map((item): NavItem | null => {
              if (!canAccess(item.access)) {
                return null;
              }

              if (item.subItems?.length) {
                const subItems =
                  item.subItems.filter(
                    (subItem) =>
                      canAccess(subItem.access)
                  );

                if (!subItems.length) {
                  return null;
                }

                return { ...item, subItems };
              }

              return item;
            })
            .filter(
              (item): item is NavItem =>
                item !== null
            );

          return { ...section, items };
        })
        .filter(
          (section) => section.items.length > 0
        ),
    [canAccess]
  );

  /* =======================================================
     ROUTE MATCHING
  ======================================================= */

  const pathMatches = useCallback(
    (path: string): boolean => {
      if (path === "/") {
        return location.pathname === "/";
      }

      return (
        location.pathname === path ||
        location.pathname.startsWith(
          `${path}/`
        )
      );
    },
    [location.pathname]
  );

  const getActiveSubItemPath = useCallback(
    (subItems?: SubItem[]): string | null => {
      if (!subItems?.length) return null;

      const matches = subItems
        .filter(
          (subItem) =>
            !subItem.disabled &&
            Boolean(subItem.path) &&
            pathMatches(subItem.path!)
        )
        .sort(
          (a, b) =>
            (b.path?.length ?? 0) -
            (a.path?.length ?? 0)
        );

      return matches[0]?.path ?? null;
    },
    [pathMatches]
  );

  const activeSubmenuName = useMemo(
    (): string | null => {
      for (const section of visibleSections) {
        for (const item of section.items) {
          if (
            item.subItems?.length &&
            getActiveSubItemPath(item.subItems)
          ) {
            return item.name;
          }
        }
      }

      return null;
    },
    [visibleSections, getActiveSubItemPath]
  );

  /* =======================================================
     AUTO-OPEN ACTIVE MENU
  ======================================================= */

  useEffect(() => {
    if (activeSubmenuName) {
      setOpenSubmenu(activeSubmenuName);
    }
  }, [activeSubmenuName]);

  useEffect(() => {
    setOpenSubmenu((current) => {
      if (!current) return null;

      const stillVisible =
        visibleSections.some((section) =>
          section.items.some(
            (item) =>
              item.name === current &&
              Boolean(item.subItems?.length)
          )
        );

      return stillVisible ? current : null;
    });
  }, [visibleSections]);

  const toggleSubmenu = useCallback(
    (name: string): void => {
      if (!showText && !isExpanded) {
        setIsHovered(true);
      }

      setOpenSubmenu((current) =>
        current === name ? null : name
      );
    },
    [showText, isExpanded, setIsHovered]
  );

  /* =======================================================
     RENDER NAVIGATION ITEM
  ======================================================= */

  const renderItem = (item: NavItem) => {
    const hasSubItems =
      Boolean(item.subItems?.length);

    const activeSubItemPath =
      getActiveSubItemPath(item.subItems);

    const isActive = item.path
      ? pathMatches(item.path)
      : Boolean(activeSubItemPath);

    const isOpen = openSubmenu === item.name;

    const mainClass = [
      "group flex min-h-11 w-full items-center rounded-xl px-3",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-[#5b2eff]",
      !showText ? "lg:justify-center" : "",
      isActive
        ? "bg-[#fff1ec] text-[#ff4b1f] dark:bg-[#ff4b1f]/10 dark:text-[#ff6a45]"
        : "text-[#61708b] hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white",
    ].join(" ");

    return (
      <li key={item.name}>
        {hasSubItems ? (
          <button
            type="button"
            aria-expanded={isOpen}
            aria-label={`${item.name} menu`}
            title={!showText ? item.name : undefined}
            onClick={() => toggleSubmenu(item.name)}
            className={mainClass}
          >
            <span className="flex size-6 shrink-0 items-center justify-center">
              {item.icon}
            </span>

            {showText && (
              <>
                <span className="ml-3 min-w-0 flex-1 truncate text-left text-[15px] font-medium">
                  {item.name}
                </span>

                <ChevronDownIcon
                  className={[
                    "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
                    isOpen
                      ? "rotate-180 text-[#ff4b1f]"
                      : "",
                  ].join(" ")}
                />
              </>
            )}
          </button>
        ) : item.disabled ? (
          <div
            aria-disabled="true"
            title={`${item.name} module pending`}
            className="flex min-h-11 cursor-not-allowed items-center rounded-xl px-3 text-gray-400 opacity-70 dark:text-gray-500"
          >
            <span className="flex size-6 shrink-0 items-center justify-center">
              {item.icon}
            </span>

            {showText && (
              <>
                <span className="ml-3 min-w-0 flex-1 truncate text-left text-[15px] font-medium">
                  {item.name}
                </span>

                <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[9px] dark:bg-gray-800">
                  Soon
                </span>
              </>
            )}
          </div>
        ) : (
          item.path && (
            <Link
              to={item.path}
              title={!showText ? item.name : undefined}
              aria-current={
                isActive ? "page" : undefined
              }
              className={mainClass}
            >
              <span className="flex size-6 shrink-0 items-center justify-center">
                {item.icon}
              </span>

              {showText && (
                <span className="ml-3 truncate text-[15px] font-medium">
                  {item.name}
                </span>
              )}
            </Link>
          )
        )}

        {/* SUBMENU */}

        {hasSubItems && showText && (
          <div
            className={[
              "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
              isOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            ].join(" ")}
          >
            <div className="min-h-0 overflow-hidden">
              <ul className="ml-10 mt-1 space-y-1 pb-1">
                {item.subItems?.map((subItem) => {
                  const active =
                    Boolean(subItem.path) &&
                    activeSubItemPath ===
                      subItem.path;

                  if (
                    subItem.disabled ||
                    !subItem.path
                  ) {
                    return (
                      <li key={subItem.name}>
                        <div
                          aria-disabled="true"
                          title="Feature pending"
                          className="flex min-h-9 cursor-not-allowed items-center justify-between gap-2 rounded-lg px-3 text-[13px] text-gray-400 opacity-70 dark:text-gray-500"
                        >
                          <span className="truncate">
                            {subItem.name}
                          </span>

                          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[9px] dark:bg-gray-800">
                            Soon
                          </span>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li key={subItem.path}>
                      <Link
                        to={subItem.path}
                        aria-current={
                          active ? "page" : undefined
                        }
                        className={[
                          "flex min-h-9 items-center rounded-lg px-3 text-[13px]",
                          "transition-colors duration-150",
                          "focus-visible:outline-none focus-visible:ring-2",
                          "focus-visible:ring-[#5b2eff]",
                          active
                            ? "bg-[#5b2eff]/10 font-semibold text-[#5b2eff] dark:bg-[#5b2eff]/15 dark:text-[#8d74ff]"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-500 dark:hover:bg-white/[0.05] dark:hover:text-gray-200",
                        ].join(" ")}
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </li>
    );
  };

  /* =======================================================
     SIDEBAR UI
  ======================================================= */

  return (
    <aside
      className={[
        "fixed left-0 top-0 z-50 mt-16 flex h-[calc(100vh-4rem)] flex-col",
        "border-r border-gray-200 bg-white px-4 text-gray-900",
        "transition-[width,transform] duration-300 ease-in-out",
        "dark:border-gray-800 dark:bg-gray-950",
        "lg:mt-0 lg:h-screen",
        isExpanded || isMobileOpen || isHovered
          ? "w-[290px]"
          : "w-[90px]",
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full",
        "lg:translate-x-0",
      ].join(" ")}
      onMouseEnter={() => {
        if (!isExpanded) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (!isExpanded) {
          setIsHovered(false);
        }
      }}
    >
      {/* BRAND */}

      <div
        className={[
          "flex h-[92px] shrink-0 items-center",
          !showText
            ? "lg:justify-center"
            : "justify-start",
        ].join(" ")}
      >
        <Link
          to="/"
          aria-label="Solar Trade Hub Dashboard"
          className="flex min-w-0 items-center gap-3"
        >
          <img
            src="/images/logo/logo.svg"
            alt="Solar Trade Hub"
            className="h-12 w-12 shrink-0 object-contain"
          />

          {showText && (
            <div className="min-w-0">
              <div className="whitespace-nowrap text-[17px] font-bold tracking-[-0.03em]">
                <span className="text-[#ff4b1f]">
                  SOLAR
                </span>{" "}
                <span className="text-[#5b2eff]">
                  TRADE HUB
                </span>
              </div>

              <div className="mt-1 whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.28em] text-gray-400">
                Administration
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* SCROLLABLE NAVIGATION */}

      <div className="flex flex-1 flex-col overflow-y-auto pb-6 no-scrollbar">
        <nav aria-label="Solar Trade Hub administration">
          {visibleSections.map((section) => (
            <div
              key={section.title || "overview"}
              className={
                section.title ? "mt-6" : ""
              }
            >
              {section.title && showText && (
                <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8793aa]">
                  {section.title}
                </p>
              )}

              {!showText && section.title && (
                <div
                  className="mx-3 my-3 h-px bg-gray-200 dark:bg-gray-800"
                  aria-hidden="true"
                />
              )}

              <ul className="flex flex-col gap-1.5">
                {section.items.map(renderItem)}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
