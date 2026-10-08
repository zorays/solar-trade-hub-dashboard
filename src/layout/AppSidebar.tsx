import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router";

import {
  ChevronDownIcon,
  GridIcon,
} from "../icons";

import {
  useSidebar,
} from "../context/SidebarContext";

import {
  useAuth,
} from "../context/AuthContext";

import {
  hasUserPermission,
} from "../services/auth.service";

type AccessRule = {
  anyOf?: string[];
  allOf?: string[];
  always?: boolean;
  adminOnly?: boolean;
};

type SubItem = {
  name: string;
  path: string;
  access?: AccessRule;
};

type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: SubItem[];
  access?: AccessRule;
};

type MenuSection = {
  title: string;
  items: NavItem[];
};

function ProductsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
      <path d="M4 7.5v9L12 21l8-4.5v-9" />
      <path d="M12 12v9" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <circle
        cx="9"
        cy="8"
        r="4"
      />

      <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
      <path d="M17 8h4" />
      <path d="M19 6v4" />
    </svg>
  );
}

function SuppliersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <path d="M4 21V8l8-4 8 4v13" />
      <path d="M2 21h20" />
      <path d="M8 11h2M14 11h2M8 15h2M14 15h2" />
    </svg>
  );
}

function InstallersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <path d="m14.7 6.3 3-3a4 4 0 0 1-5.2 5.2l-6.7 6.7a2.1 2.1 0 1 0 3 3l6.7-6.7a4 4 0 0 1 5.2-5.2l-3 3-3-3Z" />
    </svg>
  );
}

function TenderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <path d="M6 3h9l3 3v15H6V3Z" />
      <path d="M15 3v4h4" />
      <path d="M9 11h6M9 15h6" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <path d="M6 7h12l1 14H5L6 7Z" />
      <path d="M9 9V5a3 3 0 0 1 6 0v4" />
    </svg>
  );
}

function PaymentsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path d="M3 9h18" />
      <path d="M7 15h4" />
      <path d="M16 13v4" />
      <path d="M14 15h4" />
    </svg>
  );
}

function DealsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <path d="M20 13 13 20l-9-9V4h7l9 9Z" />

      <circle
        cx="8.5"
        cy="8.5"
        r="1.4"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <circle
        cx="9"
        cy="8"
        r="4"
      />

      <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.5a3.5 3.5 0 0 1 0 6.8" />
      <path d="M17.5 15.5A5.5 5.5 0 0 1 21.5 21" />
    </svg>
  );
}

function ContentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="1"
      />

      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <path d="M4 20V11M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
      />

      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l-2.8 2.8a1.7 1.7 0 0 0-1.9-.3A1.7 1.7 0 0 0 14 21h-4a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-2.8-2.8a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14v-4a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L7.1 4.3a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3h4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l2.8 2.8a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10v4a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-full w-full"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M9.7 9a2.4 2.4 0 1 1 3.6 2.1c-.8.5-1.3 1-1.3 2" />
      <path d="M12 17h.01" />
    </svg>
  );
}

const sections: MenuSection[] = [
  {
    title: "",
    items: [
      {
        name: "Dashboard",
        icon: <GridIcon />,
        path: "/",
        access: {
          anyOf: [
            "dashboard.view",
          ],
        },
      },

      {
        name: "Products",
        icon: <ProductsIcon />,
        access: {
          anyOf: [
            "products.view",
            "products.manage",
          ],
        },
        subItems: [
          {
            name: "Product Catalogue",
            path: "/products",
            access: {
              anyOf: [
                "products.view",
                "products.manage",
              ],
            },
          },
        ],
      },
    ],
  },

  {
    title: "Marketplace",
    items: [
      {
        name: "Customers",
        icon: <CustomersIcon />,
        access: {
          anyOf: [
            "users.view",
            "users.manage",
            "customer_requests.view",
            "customer_requests.manage",
            "suppliers.manage",
          ],
        },
        subItems: [
          {
            name: "All Customers",
            path: "/customers",
            access: {
              adminOnly: true,
            },
          },

          {
            name: "Range Tokens",
            path: "/marketplace/range-tokens",
            access: {
              anyOf: [
                "suppliers.manage",
              ],
            },
          },

          {
            name: "Customer Requests",
            path: "/marketplace/customer-requests",
            access: {
              anyOf: [
                "customer_requests.view",
                "customer_requests.manage",
                "suppliers.manage",
              ],
            },
          },
        ],
      },

      {
        name: "Suppliers",
        icon: <SuppliersIcon />,
        access: {
          anyOf: [
            "suppliers.view",
            "suppliers.manage",
            "subscriptions.view",
            "subscriptions.manage",
            "supplier_bids.view",
            "supplier_bids.manage",
          ],
        },
        subItems: [
          {
            name: "All Suppliers",
            path: "/suppliers",
            access: {
              anyOf: [
                "suppliers.view",
                "suppliers.manage",
              ],
            },
          },

          {
            name: "Add Supplier",
            path: "/suppliers/add",
            access: {
              anyOf: [
                "suppliers.manage",
              ],
            },
          },

          {
            name: "Applications",
            path: "/suppliers/applications",
            access: {
              anyOf: [
                "suppliers.manage",
              ],
            },
          },

          {
            name: "Verification",
            path: "/suppliers/verification",
            access: {
              anyOf: [
                "suppliers.manage",
              ],
            },
          },

          {
            name: "Subscriptions",
            path: "/marketplace/subscriptions",
            access: {
              anyOf: [
                "subscriptions.view",
                "subscriptions.manage",
                "suppliers.manage",
              ],
            },
          },

          {
            name: "Plans",
            path: "/marketplace/plans",
            access: {
              anyOf: [
                "subscriptions.manage",
                "suppliers.manage",
              ],
            },
          },

          {
            name: "Bids",
            path: "/marketplace/supplier-bids",
            access: {
              anyOf: [
                "supplier_bids.view",
                "supplier_bids.manage",
                "suppliers.manage",
              ],
            },
          },
        ],
      },

      {
        name: "Installers",
        icon: <InstallersIcon />,
        access: {
          anyOf: [
            "installers.view",
            "installers.manage",
          ],
        },
        subItems: [
          {
            name: "All Installers",
            path: "/installers",
            access: {
              anyOf: [
                "installers.view",
                "installers.manage",
              ],
            },
          },

          {
            name: "Applications",
            path: "/installers/applications",
            access: {
              anyOf: [
                "installers.manage",
              ],
            },
          },

          {
            name: "Verification",
            path: "/installers/verification",
            access: {
              anyOf: [
                "installers.manage",
              ],
            },
          },
        ],
      },
    ],
  },

  {
    title: "Commerce",
    items: [
      {
        name: "Orders",
        icon: <OrdersIcon />,
        access: {
          anyOf: [
            "orders.view",
            "orders.manage",
          ],
        },
        subItems: [
          {
            name: "All Orders",
            path: "/orders",
            access: {
              anyOf: [
                "orders.view",
                "orders.manage",
              ],
            },
          },

          {
            name: "Pending",
            path: "/orders/pending",
            access: {
              anyOf: [
                "orders.view",
                "orders.manage",
              ],
            },
          },

          {
            name: "Completed",
            path: "/orders/completed",
            access: {
              anyOf: [
                "orders.view",
                "orders.manage",
              ],
            },
          },
        ],
      },

      {
        name: "Payments",
        icon: <PaymentsIcon />,
        access: {
          anyOf: [
            "payments.view",
            "payments.manage",
            "orders.manage",
          ],
        },
        subItems: [
          {
            name: "All Payments",
            path: "/payments",
            access: {
              anyOf: [
                "payments.view",
                "payments.manage",
                "orders.manage",
              ],
            },
          },

          {
            name: "Pending",
            path: "/payments/pending",
            access: {
              anyOf: [
                "payments.view",
                "payments.manage",
                "orders.manage",
              ],
            },
          },

          {
            name: "Manual Verification",
            path: "/payments/manual-verification",
            access: {
              anyOf: [
                "payments.manage",
                "orders.manage",
              ],
            },
          },
        ],
      },

      {
        name: "Tenders",
        icon: <TenderIcon />,
        access: {
          anyOf: [
            "tenders.view",
            "tenders.manage",
          ],
        },
        subItems: [
          {
            name: "All Tenders",
            path: "/tenders",
            access: {
              anyOf: [
                "tenders.view",
                "tenders.manage",
              ],
            },
          },

          {
            name: "Add Tender",
            path: "/tenders/add",
            access: {
              anyOf: [
                "tenders.manage",
              ],
            },
          },
        ],
      },

      {
        name: "Deals",
        icon: <DealsIcon />,
        access: {
          anyOf: [
            "deals.view",
            "deals.manage",
          ],
        },
        subItems: [
          {
            name: "All Deals",
            path: "/deals",
            access: {
              anyOf: [
                "deals.view",
                "deals.manage",
              ],
            },
          },

          {
            name: "Add Deal",
            path: "/deals/add",
            access: {
              anyOf: [
                "deals.manage",
              ],
            },
          },
        ],
      },
    ],
  },

  {
    title: "Management",
    items: [
      {
        name: "Company Users",
        icon: <UsersIcon />,
        access: {
          anyOf: [
            "users.view",
            "users.manage",
            "roles.view",
            "roles.manage",
          ],
        },
        subItems: [
          {
            name: "All Company Users",
            path: "/users",
            access: {
              adminOnly: true,
            },
          },

          {
            name: "Roles & Permissions",
            path: "/users/roles",
            access: {
              anyOf: [
                "roles.view",
                "roles.manage",
              ],
            },
          },
        ],
      },

      {
        name: "Content",
        icon: <ContentIcon />,
        access: {
          anyOf: [
            "content.view",
            "content.manage",
          ],
        },
        subItems: [
          {
            name: "Homepage",
            path: "/content/homepage",
            access: {
              anyOf: [
                "content.view",
                "content.manage",
              ],
            },
          },

          {
            name: "Banners",
            path: "/content/banners",
            access: {
              anyOf: [
                "content.manage",
              ],
            },
          },

          {
            name: "Pages",
            path: "/content/pages",
            access: {
              anyOf: [
                "content.manage",
              ],
            },
          },
        ],
      },

      {
        name: "Reports",
        icon: <ReportsIcon />,
        access: {
          anyOf: [
            "reports.view",
            "reports.manage",
          ],
        },
        subItems: [
          {
            name: "Marketplace",
            path: "/reports/marketplace",
            access: {
              anyOf: [
                "reports.view",
                "reports.manage",
              ],
            },
          },

          {
            name: "Users",
            path: "/reports/users",
            access: {
              anyOf: [
                "reports.view",
                "reports.manage",
              ],
            },
          },

          {
            name: "Orders",
            path: "/reports/orders",
            access: {
              anyOf: [
                "reports.view",
                "reports.manage",
              ],
            },
          },
        ],
      },
    ],
  },

  {
    title: "System",
    items: [
      {
        name: "Settings",
        icon: <SettingsIcon />,
        access: {
          anyOf: [
            "settings.view",
            "settings.manage",
          ],
        },
        subItems: [
          {
            name: "General",
            path: "/settings",
            access: {
              anyOf: [
                "settings.view",
                "settings.manage",
              ],
            },
          },

          {
            name: "Marketplace",
            path: "/settings/marketplace",
            access: {
              anyOf: [
                "settings.view",
                "settings.manage",
              ],
            },
          },

          {
            name: "Email",
            path: "/settings/email",
            access: {
              anyOf: [
                "settings.view",
                "settings.manage",
              ],
            },
          },
        ],
      },

      {
        name: "Notifications",
        icon: <NotificationIcon />,
        path: "/notifications",
        access: {
          anyOf: [
            "notifications.view",
            "notifications.manage",
          ],
        },
      },

      {
        name: "Help & Support",
        icon: <HelpIcon />,
        path: "/help-support",
        access: {
          always: true,
        },
      },
    ],
  },
];

const AppSidebar = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
  } = useSidebar();

  const {
    user,
    isAdmin,
  } = useAuth();

  const location =
    useLocation();

  const [
    openSubmenu,
    setOpenSubmenu,
  ] = useState<
    string | null
  >(null);

  const showText =
    isExpanded ||
    isHovered ||
    isMobileOpen;

  const canAccess =
    useCallback(
      (
        access?:
          AccessRule
      ): boolean => {
        if (!access) {
          return true;
        }

        if (
          access.always
        ) {
          return true;
        }

        if (
          access.adminOnly
        ) {
          return Boolean(
            isAdmin
          );
        }

        if (
          access.allOf &&
          access.allOf.length >
            0
        ) {
          const hasAll =
            access.allOf.every(
              (
                permission
              ) =>
                hasUserPermission(
                  user,
                  permission
                )
            );

          if (!hasAll) {
            return false;
          }
        }

        if (
          access.anyOf &&
          access.anyOf.length >
            0
        ) {
          return access.anyOf.some(
            (
              permission
            ) =>
              hasUserPermission(
                user,
                permission
              )
          );
        }

        return true;
      },
      [
        user,
        isAdmin,
      ]
    );

  const visibleSections =
    useMemo(
      () =>
        sections
          .map(
            (
              section
            ): MenuSection => {
              const visibleItems =
                section.items
                  .map(
                    (
                      item
                    ):
                      | NavItem
                      | null => {
                      if (
                        item.subItems &&
                        item.subItems.length >
                          0
                      ) {
                        const visibleSubItems =
                          item.subItems.filter(
                            (
                              subItem
                            ) =>
                              canAccess(
                                subItem.access
                              )
                          );

                        if (
                          visibleSubItems.length ===
                          0
                        ) {
                          return null;
                        }

                        return {
                          ...item,
                          subItems:
                            visibleSubItems,
                        };
                      }

                      return canAccess(
                        item.access
                      )
                        ? item
                        : null;
                    }
                  )
                  .filter(
                    (
                      item
                    ): item is NavItem =>
                      item !==
                      null
                  );

              return {
                ...section,
                items:
                  visibleItems,
              };
            }
          )
          .filter(
            (
              section
            ) =>
              section.items.length >
              0
          ),
      [
        canAccess,
      ]
    );

  const pathMatches =
    useCallback(
      (
        path:
          string
      ): boolean => {
        const currentPath =
          location.pathname;

        if (
          path ===
          "/"
        ) {
          return (
            currentPath ===
            "/"
          );
        }

        return (
          currentPath ===
            path ||
          currentPath.startsWith(
            `${path}/`
          )
        );
      },
      [
        location.pathname,
      ]
    );

  const getActiveSubItemPath =
    useCallback(
      (
        subItems?:
          SubItem[]
      ):
        string |
        null => {
        if (
          !subItems ||
          subItems.length ===
            0
        ) {
          return null;
        }

        const matches =
          subItems
            .filter(
              (
                subItem
              ) =>
                pathMatches(
                  subItem.path
                )
            )
            .sort(
              (
                first,
                second
              ) =>
                second.path.length -
                first.path.length
            );

        return (
          matches[0]
            ?.path ||
          null
        );
      },
      [
        pathMatches,
      ]
    );

  const activeSubmenuName =
    useMemo(
      () => {
        for (
          const section of
          visibleSections
        ) {
          for (
            const item of
            section.items
          ) {
            if (
              !item.subItems ||
              item.subItems.length ===
                0
            ) {
              continue;
            }

            const activePath =
              getActiveSubItemPath(
                item.subItems
              );

            if (
              activePath
            ) {
              return item.name;
            }
          }
        }

        return null;
      },
      [
        visibleSections,
        getActiveSubItemPath,
      ]
    );

  useEffect(
    () => {
      if (
        activeSubmenuName
      ) {
        setOpenSubmenu(
          activeSubmenuName
        );
      }
    },
    [
      activeSubmenuName,
    ]
  );

  useEffect(
    () => {
      setOpenSubmenu(
        (
          current
        ) => {
          if (
            !current
          ) {
            return null;
          }

          const stillVisible =
            visibleSections.some(
              (
                section
              ) =>
                section.items.some(
                  (
                    item
                  ) =>
                    item.name ===
                      current &&
                    Boolean(
                      item.subItems
                        ?.length
                    )
                )
            );

          return stillVisible
            ? current
            : null;
        }
      );
    },
    [
      visibleSections,
    ]
  );

  const toggleSubmenu =
    useCallback(
      (
        name:
          string
      ) => {
        setOpenSubmenu(
          (
            current
          ) =>
            current ===
            name
              ? null
              : name
        );
      },
      []
    );

  const renderItem = (
    item:
      NavItem
  ) => {
    const hasSubItems =
      Boolean(
        item.subItems
          ?.length
      );

    const activeSubItemPath =
      getActiveSubItemPath(
        item.subItems
      );

    const childActive =
      Boolean(
        activeSubItemPath
      );

    const itemActive =
      item.path
        ? pathMatches(
            item.path
          )
        : childActive;

    const isOpen =
      openSubmenu ===
      item.name;

    return (
      <li
        key={
          item.name
        }
      >
        {hasSubItems ? (
          <button
            type="button"
            aria-expanded={
              isOpen
            }
            aria-label={`${item.name} menu`}
            onClick={() =>
              toggleSubmenu(
                item.name
              )
            }
            className={[
              "group flex min-h-11 w-full items-center rounded-xl px-3",
              "transition-colors duration-150",
              !showText
                ? "lg:justify-center"
                : "",
              itemActive
                ? "bg-[#fff1ec] text-[#ff4b1f] dark:bg-[#ff4b1f]/10 dark:text-[#ff6a45]"
                : "text-[#61708b] hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white",
            ].join(
              " "
            )}
          >
            <span className="flex size-6 shrink-0 items-center justify-center">
              {
                item.icon
              }
            </span>

            {showText && (
              <>
                <span className="ml-3 min-w-0 flex-1 truncate text-left text-[15px] font-medium">
                  {
                    item.name
                  }
                </span>

                <ChevronDownIcon
                  className={[
                    "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
                    isOpen
                      ? "rotate-180 text-[#ff4b1f]"
                      : "",
                  ].join(
                    " "
                  )}
                />
              </>
            )}
          </button>
        ) : (
          item.path && (
            <Link
              to={
                item.path
              }
              aria-current={
                itemActive
                  ? "page"
                  : undefined
              }
              className={[
                "group flex min-h-11 items-center rounded-xl px-3",
                "transition-colors duration-150",
                !showText
                  ? "lg:justify-center"
                  : "",
                itemActive
                  ? "bg-[#fff1ec] text-[#ff4b1f] dark:bg-[#ff4b1f]/10 dark:text-[#ff6a45]"
                  : "text-[#61708b] hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white",
              ].join(
                " "
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center">
                {
                  item.icon
                }
              </span>

              {showText && (
                <span className="ml-3 min-w-0 truncate text-[15px] font-medium">
                  {
                    item.name
                  }
                </span>
              )}
            </Link>
          )
        )}

        {hasSubItems &&
          showText && (
            <div
              className={[
                "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              ].join(
                " "
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <ul className="ml-10 mt-1 space-y-1 pb-1">
                  {item.subItems?.map(
                    (
                      subItem
                    ) => {
                      const active =
                        activeSubItemPath ===
                        subItem.path;

                      return (
                        <li
                          key={
                            subItem.path
                          }
                        >
                          <Link
                            to={
                              subItem.path
                            }
                            aria-current={
                              active
                                ? "page"
                                : undefined
                            }
                            className={[
                              "flex min-h-9 items-center rounded-lg px-3 text-[13px]",
                              "transition-colors duration-150",
                              active
                                ? "bg-[#5b2eff]/10 font-semibold text-[#5b2eff] dark:bg-[#5b2eff]/15 dark:text-[#8d74ff]"
                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-500 dark:hover:bg-white/[0.05] dark:hover:text-gray-200",
                            ].join(
                              " "
                            )}
                          >
                            {
                              subItem.name
                            }
                          </Link>
                        </li>
                      );
                    }
                  )}
                </ul>
              </div>
            </div>
          )}
      </li>
    );
  };

  return (
    <aside
      className={[
        "fixed left-0 top-0 z-50 mt-16 flex h-[calc(100vh-4rem)] flex-col",
        "border-r border-gray-200 bg-white px-4 text-gray-900",
        "transition-[width,transform] duration-300 ease-in-out",
        "dark:border-gray-800 dark:bg-gray-950",
        "lg:mt-0 lg:h-screen",

        isExpanded ||
        isMobileOpen ||
        isHovered
          ? "w-[290px]"
          : "w-[90px]",

        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full",

        "lg:translate-x-0",
      ].join(
        " "
      )}
      onMouseEnter={() => {
        if (
          !isExpanded
        ) {
          setIsHovered(
            true
          );
        }
      }}
      onMouseLeave={() => {
        if (
          !isExpanded
        ) {
          setIsHovered(
            false
          );
        }
      }}
    >
      <div
        className={[
          "flex h-[92px] shrink-0 items-center",
          !showText
            ? "lg:justify-center"
            : "justify-start",
        ].join(
          " "
        )}
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

      <div className="flex flex-1 flex-col overflow-y-auto pb-6 no-scrollbar">
        <nav
          aria-label="Solar Trade Hub administration"
        >
          {visibleSections.map(
            (
              section
            ) => (
              <div
                key={
                  section.title ||
                  "main"
                }
                className={
                  section.title
                    ? "mt-6"
                    : ""
                }
              >
                {section.title &&
                  showText && (
                    <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8793aa]">
                      {
                        section.title
                      }
                    </p>
                  )}

                <ul className="flex flex-col gap-1.5">
                  {section.items.map(
                    renderItem
                  )}
                </ul>
              </div>
            )
          )}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;