import {
  ShieldCheck,
  UserRound,
} from "lucide-react";

import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";

import {
  useAuth,
} from "../context/AuthContext";

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
    return "Dashboard User";
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
   USER PROFILE PAGE
========================================================= */

export default function UserProfiles() {
  const {
    user,
  } =
    useAuth();

  const displayName =
    user?.name?.trim() ||
    "Solar Trade Hub User";

  const roleLabel =
    user?.roleDetails
      ?.name
      ?.trim() ||
    getRoleLabel(
      user?.role
    );

  return (
    <>
      <PageMeta
        title="My Profile | Solar Trade Hub Dashboard"
        description="Manage your Solar Trade Hub administrator profile and account information."
      />

      <PageBreadcrumb
        pageTitle="My Profile"
      />

      <div className="space-y-5">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60 sm:p-6">
          {/* DECORATION */}

          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-500/5" />

          <div className="pointer-events-none absolute right-14 top-2 h-32 w-32 rounded-full bg-purple-500/5" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT */}

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 text-white shadow-sm">
                <UserRound
                  size={22}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 dark:text-orange-400">
                  Account
                </p>

                <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                  My Profile
                </h1>

                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Manage your personal information, profile picture and account
                  security across the Solar Trade Hub administration dashboard.
                </p>
              </div>
            </div>

            {/* ACCOUNT IDENTITY */}

            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <div className="flex w-fit items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/60 px-3.5 py-2 text-xs font-semibold text-orange-700 dark:border-orange-500/10 dark:bg-orange-500/10 dark:text-orange-400">
                <UserRound
                  size={15}
                />

                {displayName}
              </div>

              <div className="flex w-fit items-center gap-2 rounded-xl border border-purple-100 bg-purple-50/60 px-3.5 py-2 text-xs font-semibold text-purple-700 dark:border-purple-500/10 dark:bg-purple-500/10 dark:text-purple-400">
                <ShieldCheck
                  size={15}
                />

                {roleLabel}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            PROFILE CONTENT
        ================================================= */}

        <div className="space-y-5">
          {/* PROFILE SUMMARY */}

          <UserMetaCard />

          {/* PERSONAL INFORMATION */}

          <UserInfoCard />

          {/* ACCOUNT & SECURITY */}

          <UserAddressCard />
        </div>
      </div>
    </>
  );
}