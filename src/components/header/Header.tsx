import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  ThemeToggleButton,
} from "../common/ThemeToggleButton";

import NotificationDropdown from "./NotificationDropdown";

import UserDropdown from "./UserDropdown";

import {
  Link,
} from "react-router";

/* =========================================================
   TYPES
========================================================= */

interface HeaderProps {
  onClick?: () => void;
  onToggle: () => void;
}

/* =========================================================
   DASHBOARD SEARCH ROUTES
========================================================= */

const dashboardRoutes = [
  {
    keywords: [
      "dashboard",
      "home",
    ],
    path: "/",
  },
  {
    keywords: [
      "product",
      "products",
    ],
    path: "/products",
  },
  {
    keywords: [
      "category",
      "categories",
    ],
    path: "/products/categories",
  },
  {
    keywords: [
      "brand",
      "brands",
    ],
    path: "/products/brands",
  },
  {
    keywords: [
      "supplier",
      "suppliers",
    ],
    path: "/suppliers",
  },
  {
    keywords: [
      "supplier verification",
      "verification supplier",
    ],
    path: "/suppliers/verification",
  },
  {
    keywords: [
      "installer",
      "installers",
    ],
    path: "/installers",
  },
  {
    keywords: [
      "installer application",
      "applications",
    ],
    path: "/installers/applications",
  },
  {
    keywords: [
      "installer verification",
    ],
    path: "/installers/verification",
  },
  {
    keywords: [
      "tender",
      "tenders",
    ],
    path: "/tenders",
  },
  {
    keywords: [
      "order",
      "orders",
    ],
    path: "/orders",
  },
  {
    keywords: [
      "pending orders",
      "pending",
    ],
    path: "/orders/pending",
  },
  {
    keywords: [
      "completed orders",
      "completed",
    ],
    path: "/orders/completed",
  },
  {
    keywords: [
      "deal",
      "deals",
    ],
    path: "/deals",
  },
  {
    keywords: [
      "user",
      "users",
    ],
    path: "/users",
  },
  {
    keywords: [
      "role",
      "roles",
      "permissions",
    ],
    path: "/users/roles",
  },
  {
    keywords: [
      "homepage",
      "content homepage",
    ],
    path: "/content/homepage",
  },
  {
    keywords: [
      "banner",
      "banners",
    ],
    path: "/content/banners",
  },
  {
    keywords: [
      "page",
      "pages",
      "content pages",
    ],
    path: "/content/pages",
  },
  {
    keywords: [
      "marketplace report",
      "reports",
    ],
    path: "/reports/marketplace",
  },
  {
    keywords: [
      "user report",
      "users report",
    ],
    path: "/reports/users",
  },
  {
    keywords: [
      "order report",
      "orders report",
    ],
    path: "/reports/orders",
  },
  {
    keywords: [
      "settings",
      "general settings",
    ],
    path: "/settings",
  },
  {
    keywords: [
      "marketplace settings",
    ],
    path: "/settings/marketplace",
  },
  {
    keywords: [
      "email settings",
      "smtp",
    ],
    path: "/settings/email",
  },
  {
    keywords: [
      "notification",
      "notifications",
    ],
    path: "/notifications",
  },
  {
    keywords: [
      "help",
      "support",
    ],
    path: "/help",
  },
  {
    keywords: [
      "profile",
      "my profile",
      "account",
    ],
    path: "/profile",
  },
];

/* =========================================================
   HEADER
========================================================= */

const Header = ({
  onClick,
  onToggle,
}: HeaderProps) => {
  const navigate =
    useNavigate();

  const searchInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    isApplicationMenuOpen,
    setApplicationMenuOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  /* =======================================================
     MOBILE APPLICATION MENU
  ======================================================= */

  const toggleApplicationMenu =
    () => {
      setApplicationMenuOpen(
        (current) =>
          !current
      );
    };

  /* =======================================================
     SEARCH
  ======================================================= */

  const handleSearch = (
    event:
      React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const query =
      search
        .trim()
        .toLowerCase();

    if (!query) {
      return;
    }

    const route =
      dashboardRoutes.find(
        (item) =>
          item.keywords.some(
            (keyword) =>
              keyword.includes(
                query
              ) ||
              query.includes(
                keyword
              )
          )
      );

    if (route) {
      navigate(
        route.path
      );

      setSearch("");
    }
  };

  /* =======================================================
     CMD / CTRL + K
  ======================================================= */

  useEffect(() => {
    const handleShortcut = (
      event:
        KeyboardEvent
    ) => {
      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() ===
          "k"
      ) {
        event.preventDefault();

        searchInputRef.current?.focus();
      }
    };

    window.addEventListener(
      "keydown",
      handleShortcut
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleShortcut
      );
    };
  }, []);

  return (
    <header className="sticky top-0 z-99999 flex w-full border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        {/* =====================================================
            LEFT HEADER
        ====================================================== */}

        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* =================================================
              MOBILE SIDEBAR TOGGLE
          ================================================= */}

          <button
            type="button"
            aria-label="Toggle sidebar"
            className="block h-10 w-10 text-gray-500 dark:text-gray-400 lg:hidden"
            onClick={
              onToggle
            }
          >
            <svg
              className="block"
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* =================================================
              DESKTOP SIDEBAR COLLAPSE
          ================================================= */}

          <button
            type="button"
            aria-label="Collapse sidebar"
            onClick={
              onClick
            }
            className="z-99999 hidden h-10 w-10 items-center justify-center rounded-lg border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400 lg:flex lg:h-11 lg:w-11 lg:border"
          >
            <svg
              className="hidden fill-current lg:block"
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                fill=""
              />
            </svg>
          </button>

          {/* =================================================
              MOBILE LOGO
          ================================================= */}

          <Link
            to="/"
            className="lg:hidden"
          >
            <img
              className="h-8 w-auto dark:hidden"
              src="/images/logo/logo.svg"
              alt="Solar Trade Hub"
            />

            <img
              className="hidden h-8 w-auto dark:block"
              src="/images/logo/logo-dark.svg"
              alt="Solar Trade Hub"
            />
          </Link>

          {/* =================================================
              MOBILE APPLICATION MENU BUTTON
          ================================================= */}

          <button
            type="button"
            aria-label="Toggle header menu"
            onClick={
              toggleApplicationMenu
            }
            className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* =================================================
              DESKTOP SEARCH
          ================================================= */}

          <div className="hidden lg:block">
            <form
              onSubmit={
                handleSearch
              }
            >
              <div className="relative">
                <button
                  type="submit"
                  aria-label="Search dashboard"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                >
                  <svg
                    className="fill-gray-500 dark:fill-gray-400"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                      fill=""
                    />
                  </svg>
                </button>

                <input
                  ref={
                    searchInputRef
                  }
                  type="text"
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search Solar Trade Hub..."
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                />

                <button
                  type="button"
                  onClick={() =>
                    searchInputRef.current?.focus()
                  }
                  className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
                >
                  <span>⌘</span>
                  <span>K</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* =====================================================
            RIGHT HEADER
        ====================================================== */}

        <div
          className={`${
            isApplicationMenuOpen
              ? "flex"
              : "hidden"
          } w-full items-center justify-between gap-4 px-5 py-4 shadow-theme-md lg:flex lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            {/* DARK MODE */}

            <ThemeToggleButton />

            {/* NOTIFICATIONS */}

            <NotificationDropdown />
          </div>

          {/* USER */}

          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;