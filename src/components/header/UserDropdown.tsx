import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CircleHelp,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  Dropdown,
} from "../ui/dropdown/Dropdown";

import {
  DropdownItem,
} from "../ui/dropdown/DropdownItem";

/* =========================================================
   AVATAR URL
========================================================= */

const getAvatarUrl = (
  avatar?: string
): string => {
  if (
    !avatar ||
    typeof avatar !== "string"
  ) {
    return "";
  }

  const normalizedAvatar =
    avatar.trim();

  if (!normalizedAvatar) {
    return "";
  }

  if (
    normalizedAvatar.startsWith(
      "http://"
    ) ||
    normalizedAvatar.startsWith(
      "https://"
    ) ||
    normalizedAvatar.startsWith(
      "data:"
    ) ||
    normalizedAvatar.startsWith(
      "blob:"
    )
  ) {
    return normalizedAvatar;
  }

  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL
      ?.trim() ||
    "http://localhost:5000/api/v1";

  const serverBaseUrl =
    apiBaseUrl.replace(
      /\/api\/v1\/?$/i,
      ""
    );

  const avatarPath =
    normalizedAvatar.startsWith(
      "/"
    )
      ? normalizedAvatar
      : `/${normalizedAvatar}`;

  return `${serverBaseUrl}${avatarPath}`;
};

/* =========================================================
   INITIALS
========================================================= */

const getUserInitials = (
  name?: string
): string => {
  if (
    !name ||
    typeof name !== "string"
  ) {
    return "U";
  }

  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return "U";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase();
};

/* =========================================================
   ROLE LABEL
========================================================= */

const getRoleLabel = (
  role?: string
): string => {
  if (
    !role ||
    typeof role !== "string"
  ) {
    return "User";
  }

  return role
    .trim()
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};

/* =========================================================
   USER DROPDOWN
========================================================= */

export default function UserDropdown() {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
    isAdmin,
  } = useAuth();

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    avatarFailed,
    setAvatarFailed,
  ] = useState(false);

  const [
    signingOut,
    setSigningOut,
  ] = useState(false);

  /* =======================================================
     USER VALUES
  ======================================================= */

  const displayName =
    user?.name?.trim() ||
    "Solar Trade Hub User";

  const displayEmail =
    user?.email?.trim() ||
    "";

  const shortName =
    displayName
      .split(/\s+/)
      .filter(Boolean)[0] ||
    "User";

  const initials =
    useMemo(
      () =>
        getUserInitials(
          displayName
        ),
      [displayName]
    );

  const avatarUrl =
    useMemo(
      () =>
        getAvatarUrl(
          user?.avatar
        ),
      [user?.avatar]
    );

  const roleLabel =
    user?.roleDetails
      ?.name
      ?.trim() ||
    getRoleLabel(
      user?.role
    );

  const showAvatar =
    Boolean(
      avatarUrl
    ) &&
    !avatarFailed;

  /* =======================================================
     RESET AVATAR ERROR
  ======================================================= */

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  /* =======================================================
     DROPDOWN
  ======================================================= */

  const toggleDropdown =
    () => {
      setIsOpen(
        (current) =>
          !current
      );
    };

  const closeDropdown =
    () => {
      setIsOpen(false);
    };

  /* =======================================================
     SIGN OUT
  ======================================================= */

  const handleSignOut =
    async () => {
      if (signingOut) {
        return;
      }

      try {
        setSigningOut(true);

        closeDropdown();

        await logout();
      } catch (error) {
        console.error(
          "Logout failed:",
          error
        );
      } finally {
        navigate(
          "/signin",
          {
            replace: true,
          }
        );

        setSigningOut(false);
      }
    };

  return (
    <div className="relative">
      {/* ===================================================
          HEADER BUTTON
      =================================================== */}

      <button
        type="button"
        onClick={
          toggleDropdown
        }
        aria-expanded={
          isOpen
        }
        aria-label="Open account menu"
        className="dropdown-toggle flex items-center gap-2 rounded-xl px-1.5 py-1.5 text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.04]"
      >
        {/* AVATAR */}

        <div className="relative">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gradient-to-br from-orange-50 to-purple-50 dark:border-gray-700 dark:from-orange-500/10 dark:to-purple-500/10">
            {showAvatar ? (
              <img
                src={
                  avatarUrl
                }
                alt={
                  displayName
                }
                className="h-full w-full object-cover"
                onError={() =>
                  setAvatarFailed(
                    true
                  )
                }
              />
            ) : (
              <span className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">
                {initials}
              </span>
            )}
          </div>

          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-[#101828]" />
        </div>

        {/* USER NAME */}

        <div className="hidden min-w-0 text-left sm:block">
          <p className="max-w-[120px] truncate text-sm font-semibold text-gray-800 dark:text-white">
            {shortName}
          </p>

          <p className="max-w-[120px] truncate text-[10px] font-medium text-gray-400">
            {roleLabel}
          </p>
        </div>

        {/* ARROW */}

        <svg
          className={`hidden shrink-0 stroke-gray-500 transition-transform duration-200 sm:block dark:stroke-gray-400 ${
            isOpen
              ? "rotate-180"
              : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ===================================================
          DROPDOWN
      =================================================== */}

      <Dropdown
        isOpen={isOpen}
        onClose={
          closeDropdown
        }
        className="absolute right-0 mt-3 flex w-[300px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-800 dark:bg-[#182234]"
      >
        {/* BRAND TOP LINE */}

        <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-purple-600" />

        {/* =================================================
            USER INFO
        ================================================= */}

        <div className="p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-orange-50 to-purple-50 dark:border-gray-700 dark:from-orange-500/10 dark:to-purple-500/10">
              {showAvatar ? (
                <img
                  src={
                    avatarUrl
                  }
                  alt={
                    displayName
                  }
                  className="h-full w-full object-cover"
                  onError={() =>
                    setAvatarFailed(
                      true
                    )
                  }
                />
              ) : (
                <span className="text-sm font-bold uppercase text-purple-600 dark:text-purple-400">
                  {initials}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {displayName}
              </p>

              {displayEmail && (
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                  {displayEmail}
                </p>
              )}

              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                <ShieldCheck
                  size={11}
                />

                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            MENU ITEMS
        ================================================= */}

        <div className="border-t border-gray-100 p-2 dark:border-gray-800">
          <ul className="space-y-1">
            {/* PROFILE */}

            <li>
              <DropdownItem
                onItemClick={
                  closeDropdown
                }
                tag="a"
                to="/profile"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-gray-700 transition hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-orange-100 group-hover:text-orange-600 dark:bg-white/5 dark:text-gray-400 dark:group-hover:bg-orange-500/10 dark:group-hover:text-orange-400">
                  <UserRound
                    size={16}
                  />
                </span>

                <div className="min-w-0">
                  <p className="text-sm">
                    Edit Profile
                  </p>

                  <p className="mt-0.5 text-[10px] font-normal text-gray-400">
                    Personal account details
                  </p>
                </div>
              </DropdownItem>
            </li>

            {/* SETTINGS */}

            {isAdmin && (
              <li>
                <DropdownItem
                  onItemClick={
                    closeDropdown
                  }
                  tag="a"
                  to="/settings"
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-gray-700 transition hover:bg-purple-50 hover:text-purple-600 dark:text-gray-400 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-purple-100 group-hover:text-purple-600 dark:bg-white/5 dark:text-gray-400 dark:group-hover:bg-purple-500/10 dark:group-hover:text-purple-400">
                    <Settings
                      size={16}
                    />
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm">
                      Account Settings
                    </p>

                    <p className="mt-0.5 text-[10px] font-normal text-gray-400">
                      Platform configuration
                    </p>
                  </div>
                </DropdownItem>
              </li>
            )}

            {/* SUPPORT */}

            <li>
              <DropdownItem
                onItemClick={
                  closeDropdown
                }
                tag="a"
                to="/help"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-gray-700 transition hover:bg-purple-50 hover:text-purple-600 dark:text-gray-400 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-purple-100 group-hover:text-purple-600 dark:bg-white/5 dark:text-gray-400 dark:group-hover:bg-purple-500/10 dark:group-hover:text-purple-400">
                  <CircleHelp
                    size={16}
                  />
                </span>

                <div className="min-w-0">
                  <p className="text-sm">
                    Help & Support
                  </p>

                  <p className="mt-0.5 text-[10px] font-normal text-gray-400">
                    Dashboard assistance
                  </p>
                </div>
              </DropdownItem>
            </li>
          </ul>
        </div>

        {/* =================================================
            SIGN OUT
        ================================================= */}

        <div className="border-t border-gray-100 p-2 dark:border-gray-800">
          <button
            type="button"
            disabled={
              signingOut
            }
            onClick={() => {
              void handleSignOut();
            }}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-red-100 group-hover:text-red-600 dark:bg-white/5 dark:text-gray-400 dark:group-hover:bg-red-500/10 dark:group-hover:text-red-400">
              <LogOut
                size={16}
              />
            </span>

            <div>
              <p className="text-sm">
                {signingOut
                  ? "Signing Out..."
                  : "Sign Out"}
              </p>

              <p className="mt-0.5 text-[10px] font-normal text-gray-400">
                End current session
              </p>
            </div>
          </button>
        </div>
      </Dropdown>
    </div>
  );
}