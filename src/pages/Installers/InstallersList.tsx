import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ReactNode,
} from "react";

import {
  Link,
} from "react-router";

import {
  toast,
  Toaster,
} from "sonner";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import {
  deleteInstaller,
  getInstallerErrorMessage,
  getInstallers,
  type Installer,
  type InstallerStatus,
  type InstallerVerificationStatus,
} from "../../services/installer/installer.service";

/* =========================================================
   SOLAR TRADE HUB
   INSTALLERS LIST
========================================================= */

type StatusFilter =
  | "all"
  | InstallerStatus;

type VerificationFilter =
  | "all"
  | InstallerVerificationStatus;

/* =========================================================
   PAGE
========================================================= */

export default function InstallersList() {
  /* =======================================================
     DATA
  ======================================================= */

  const [
    installers,
    setInstallers,
  ] = useState<
    Installer[]
  >([]);

  const [
    totalInstallers,
    setTotalInstallers,
  ] = useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(0);

  /* =======================================================
     FILTERS
  ======================================================= */

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all"
    );

  const [
    verificationFilter,
    setVerificationFilter,
  ] =
    useState<VerificationFilter>(
      "all"
    );

  /* =======================================================
     PAGINATION
  ======================================================= */

  const [
    page,
    setPage,
  ] = useState(1);

  const limit = 20;

  /* =======================================================
     UI STATE
  ======================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const [
    installerToDelete,
    setInstallerToDelete,
  ] =
    useState<Installer | null>(
      null
    );

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setDebouncedSearch(
            search.trim()
          );

          setPage(1);
        },
        350
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [search]);

  /* =======================================================
     LOAD INSTALLERS
  ======================================================= */

  useEffect(() => {
    let ignore = false;

    const loadInstallers =
      async () => {
        try {
          setLoading(true);

          setErrorMessage("");

          const result =
            await getInstallers({
              page,
              limit,

              search:
                debouncedSearch ||
                undefined,

              status:
                statusFilter ===
                "all"
                  ? undefined
                  : statusFilter,

              verificationStatus:
                verificationFilter ===
                "all"
                  ? undefined
                  : verificationFilter,

              sortBy:
                "createdAt",

              sortOrder:
                "desc",
            });

          if (
            ignore
          ) {
            return;
          }

          setInstallers(
            result.installers
          );

          setTotalInstallers(
            result.pagination
              .total
          );

          setTotalPages(
            result.pagination
              .totalPages
          );

          /*
           * If deletion/filtering makes the current page
           * invalid, move back to the last available page.
           */

          if (
            result.pagination
              .totalPages >
              0 &&
            page >
              result.pagination
                .totalPages
          ) {
            setPage(
              result.pagination
                .totalPages
            );
          }
        } catch (
          error
        ) {
          if (
            ignore
          ) {
            return;
          }

          const message =
            getInstallerErrorMessage(
              error,
              "Unable to load installers."
            );

          setErrorMessage(
            message
          );

          setInstallers([]);

          setTotalInstallers(
            0
          );

          setTotalPages(
            0
          );
        } finally {
          if (
            !ignore
          ) {
            setLoading(false);
          }
        }
      };

    void loadInstallers();

    return () => {
      ignore = true;
    };
  }, [
    page,
    limit,
    debouncedSearch,
    statusFilter,
    verificationFilter,
    refreshKey,
  ]);

  /* =======================================================
     CURRENT PAGE SUMMARY

     Total Installers uses backend pagination total.

     Verified / Active represent the currently loaded page.
  ======================================================= */

  const verifiedCount =
    useMemo(
      () =>
        installers.filter(
          (installer) =>
            installer.verificationStatus ===
            "verified"
        ).length,
      [installers]
    );

  const activeCount =
    useMemo(
      () =>
        installers.filter(
          (installer) =>
            installer.status ===
            "active"
        ).length,
      [installers]
    );

  /* =======================================================
     DELETE
  ======================================================= */

  const confirmDelete =
    async () => {
      if (
        !installerToDelete ||
        deleting
      ) {
        return;
      }

      try {
        setDeleting(true);

        await deleteInstaller(
          installerToDelete
            .installerId
        );

        toast.success(
          "Installer deleted successfully",
          {
            description:
              installerToDelete
                .displayName ||
              installerToDelete
                .companyName,
          }
        );

        setInstallerToDelete(
          null
        );

        setRefreshKey(
          (current) =>
            current + 1
        );
      } catch (
        error
      ) {
        toast.error(
          "Unable to delete installer",
          {
            description:
              getInstallerErrorMessage(
                error,
                "Installer could not be deleted."
              ),
          }
        );
      } finally {
        setDeleting(false);
      }
    };

  /* =======================================================
     FILTER HANDLERS
  ======================================================= */

  const handleStatusFilter =
    (
      value:
        StatusFilter
    ) => {
      setStatusFilter(
        value
      );

      setPage(1);
    };

  const handleVerificationFilter =
    (
      value:
        VerificationFilter
    ) => {
      setVerificationFilter(
        value
      );

      setPage(1);
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Installers | Solar Trade Hub"
        description="Manage Solar Trade Hub installer profiles"
      />

      <PageBreadcrumb
        pageTitle="Installers"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-4">
        {/* =================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                text-lg
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              Installers
            </h1>

            <p
              className="
                mt-1
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              Manage installer
              profiles, services,
              service areas and
              verification.
            </p>
          </div>

          <Link
            to="/installers/add"
            className="
              inline-flex
              h-10
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-[#ff4b1f]
              px-4
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-[#e83c12]
            "
          >
            <PlusIcon />

            Add Installer
          </Link>
        </div>

        {/* =================================================
            SUMMARY
        ================================================== */}

        <div
          className="
            grid
            grid-cols-2
            gap-3
            xl:grid-cols-3
          "
        >
          <StatCard
            label="Total Installers"
            value={
              totalInstallers
            }
          />

          <StatCard
            label="Verified on Page"
            value={
              verifiedCount
            }
          />

          <StatCard
            label="Active on Page"
            value={
              activeCount
            }
          />
        </div>

        {/* =================================================
            FILTERS
        ================================================== */}

        <section
          className="
            rounded-xl
            border
            border-gray-200
            bg-white
            p-4
            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              xl:flex-row
            "
          >
            {/* SEARCH */}

            <div
              className="
                relative
                flex-1
              "
            >
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
                placeholder="Search installer, service, city, phone or email..."
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-gray-200
                  bg-transparent
                  pl-10
                  pr-3
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-[#ff4b1f]

                  dark:border-gray-700
                  dark:text-white
                "
              />
            </div>

            {/* VERIFICATION */}

            <div
              className="
                relative
                w-full
                xl:w-[190px]
              "
            >
              <select
                value={
                  verificationFilter
                }
                onChange={(
                  event
                ) =>
                  handleVerificationFilter(
                    event.target
                      .value as VerificationFilter
                  )
                }
                className="
                  h-10
                  w-full
                  appearance-none
                  rounded-lg
                  border
                  border-gray-200
                  bg-transparent
                  px-3
                  pr-9
                  text-sm
                  text-gray-700
                  outline-none
                  transition
                  focus:border-[#ff4b1f]

                  dark:border-gray-700
                  dark:bg-[#101828]
                  dark:text-gray-300
                "
              >
                <option value="all">
                  All Verification
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="under_review">
                  Under Review
                </option>

                <option value="verified">
                  Verified
                </option>

                <option value="rejected">
                  Rejected
                </option>
              </select>

              <ChevronIcon />
            </div>

            {/* STATUS */}

            <div
              className="
                relative
                w-full
                xl:w-[170px]
              "
            >
              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  handleStatusFilter(
                    event.target
                      .value as StatusFilter
                  )
                }
                className="
                  h-10
                  w-full
                  appearance-none
                  rounded-lg
                  border
                  border-gray-200
                  bg-transparent
                  px-3
                  pr-9
                  text-sm
                  text-gray-700
                  outline-none
                  transition
                  focus:border-[#ff4b1f]

                  dark:border-gray-700
                  dark:bg-[#101828]
                  dark:text-gray-300
                "
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

                <option value="suspended">
                  Suspended
                </option>
              </select>

              <ChevronIcon />
            </div>
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================== */}

        {errorMessage && (
          <div
            className="
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700

              dark:border-red-500/20
              dark:bg-red-500/10
              dark:text-red-400
            "
          >
            {errorMessage}
          </div>
        )}

        {/* =================================================
            INSTALLER TABLE
        ================================================== */}

        <section
          className="
            w-full
            min-w-0
            max-w-full
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          {/* TABLE HEADER */}

          <div
            className="
              flex
              flex-col
              gap-2
              border-b
              border-gray-200
              px-5
              py-4

              dark:border-gray-800

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-sm
                  font-semibold
                  text-gray-900
                  dark:text-white
                "
              >
                Installer List
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-gray-500
                "
              >
                {loading
                  ? "Loading installers..."
                  : `${totalInstallers} installer${
                      totalInstallers !==
                      1
                        ? "s"
                        : ""
                    }`}
              </p>
            </div>

            {!loading &&
              totalInstallers >
                0 && (
                <p
                  className="
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Page {page}
                  {totalPages >
                  0
                    ? ` of ${totalPages}`
                    : ""}
                </p>
              )}
          </div>

          <div
            className="
              block
              w-full
              max-w-full
              overflow-x-auto
            "
          >
            <table
              className="
                min-w-[1540px]
                w-full
              "
            >
              <thead>
                <tr
                  className="
                    border-b
                    border-gray-200
                    bg-gray-50/70

                    dark:border-gray-800
                    dark:bg-white/[0.02]
                  "
                >
                  <TableHeading>
                    Installer
                  </TableHeading>

                  <TableHeading>
                    Location
                  </TableHeading>

                  <TableHeading>
                    Service Area
                  </TableHeading>

                  <TableHeading>
                    Services
                  </TableHeading>

                  <TableHeading>
                    Rating
                  </TableHeading>

                  <TableHeading>
                    Verification
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <TableHeading>
                    Internal Contact
                  </TableHeading>

                  <th
                    className="
                      px-4
                      py-3
                      text-center
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                    "
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* =========================================
                    LOADING
                ========================================== */}

                {loading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="
                        px-6
                        py-16
                        text-center
                      "
                    >
                      <div
                        className="
                          mx-auto
                          size-7
                          animate-spin
                          rounded-full
                          border-2
                          border-gray-200
                          border-t-[#ff4b1f]

                          dark:border-gray-700
                          dark:border-t-[#ff4b1f]
                        "
                      />

                      <p
                        className="
                          mt-3
                          text-xs
                          text-gray-500
                        "
                      >
                        Loading installers...
                      </p>
                    </td>
                  </tr>
                )}

                {/* =========================================
                    INSTALLERS
                ========================================== */}

                {!loading &&
                  installers.map(
                    (
                      installer
                    ) => {
                      const displayName =
                        installer
                          .displayName ||
                        installer
                          .companyName;

                      const image =
                        installer.logo ||
                        installer.bannerImage;

                      const contactName =
                        installer
                          .internalContact
                          ?.name ||
                        "Not specified";

                      const contactPhone =
                        installer
                          .internalContact
                          ?.phone ||
                        installer.phone ||
                        "";

                      const contactEmail =
                        installer
                          .internalContact
                          ?.email ||
                        installer.email ||
                        "";

                      return (
                        <tr
                          key={
                            installer
                              .installerId
                          }
                          className="
                            border-b
                            border-gray-100
                            transition
                            last:border-0
                            hover:bg-gray-50/70

                            dark:border-gray-800
                            dark:hover:bg-white/[0.02]
                          "
                        >
                          {/* INSTALLER */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >
                            <div
                              className="
                                flex
                                min-w-[285px]
                                items-center
                                gap-3
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-[58px]
                                  w-[88px]
                                  shrink-0
                                  items-center
                                  justify-center
                                  overflow-hidden
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-gradient-to-br
                                  from-orange-50
                                  to-purple-50

                                  dark:border-gray-700
                                  dark:from-orange-500/10
                                  dark:to-purple-500/10
                                "
                              >
                                {image ? (
                                  <img
                                    src={
                                      image
                                    }
                                    alt={
                                      displayName
                                    }
                                    className="
                                      h-full
                                      w-full
                                      object-cover
                                    "
                                  />
                                ) : (
                                  <span
                                    className="
                                      text-lg
                                      font-bold
                                      uppercase
                                      text-[#5b2eff]
                                    "
                                  >
                                    {displayName
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div
                                className="
                                  min-w-0
                                "
                              >
                                <div
                                  className="
                                    flex
                                    items-center
                                    gap-2
                                  "
                                >
                                  <p
                                    className="
                                      max-w-[200px]
                                      truncate
                                      text-sm
                                      font-semibold
                                      text-gray-900
                                      dark:text-white
                                    "
                                  >
                                    {
                                      displayName
                                    }
                                  </p>

                                  {installer.verificationStatus ===
                                    "verified" && (
                                    <VerifiedIcon />
                                  )}
                                </div>

                                <p
                                  className="
                                    mt-1
                                    font-mono
                                    text-[11px]
                                    text-gray-400
                                  "
                                >
                                  {
                                    installer.installerId
                                  }
                                </p>

                                {installer.companyName !==
                                  displayName && (
                                  <p
                                    className="
                                      mt-0.5
                                      max-w-[200px]
                                      truncate
                                      text-[11px]
                                      text-gray-500
                                    "
                                  >
                                    {
                                      installer.companyName
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* LOCATION */}

                          <td
                            className="
                              whitespace-nowrap
                              px-4
                              py-3
                            "
                          >
                            <div
                              className="
                                flex
                                items-center
                                gap-1.5
                                text-sm
                                text-gray-600

                                dark:text-gray-300
                              "
                            >
                              <LocationIcon />

                              {installer.city ||
                                installer
                                  .address
                                  ?.city ||
                                "Not specified"}
                            </div>
                          </td>

                          {/* SERVICE AREA */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >
                            <div
                              className="
                                flex
                                min-w-[200px]
                                max-w-[260px]
                                flex-wrap
                                gap-1.5
                              "
                            >
                              {installer
                                .serviceArea
                                ?.length >
                              0 ? (
                                installer.serviceArea.map(
                                  (
                                    area
                                  ) => (
                                    <span
                                      key={
                                        area
                                      }
                                      className="
                                        rounded-md
                                        bg-gray-100
                                        px-2
                                        py-1
                                        text-[10px]
                                        font-medium
                                        text-gray-600

                                        dark:bg-white/5
                                        dark:text-gray-400
                                      "
                                    >
                                      {
                                        area
                                      }
                                    </span>
                                  )
                                )
                              ) : (
                                <span
                                  className="
                                    text-xs
                                    text-gray-400
                                  "
                                >
                                  Not specified
                                </span>
                              )}
                            </div>
                          </td>

                          {/* SERVICES */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >
                            <div
                              className="
                                flex
                                min-w-[260px]
                                max-w-[320px]
                                flex-wrap
                                gap-1.5
                              "
                            >
                              {installer
                                .services
                                ?.length >
                              0 ? (
                                installer.services.map(
                                  (
                                    service
                                  ) => (
                                    <span
                                      key={
                                        service
                                      }
                                      className="
                                        inline-flex
                                        rounded-md
                                        bg-[#5b2eff]/10
                                        px-2
                                        py-1
                                        text-[10px]
                                        font-semibold
                                        text-[#7255ff]

                                        dark:text-[#9d89ff]
                                      "
                                    >
                                      {
                                        service
                                      }
                                    </span>
                                  )
                                )
                              ) : (
                                <span
                                  className="
                                    text-xs
                                    text-gray-400
                                  "
                                >
                                  No services
                                </span>
                              )}
                            </div>
                          </td>

                          {/* RATING */}

                          <td
                            className="
                              whitespace-nowrap
                              px-4
                              py-3
                            "
                          >
                            {installer
                              .rating
                              ?.average >
                            0 ? (
                              <div>
                                <div
                                  className="
                                    flex
                                    items-center
                                    gap-1.5
                                  "
                                >
                                  <StarIcon />

                                  <span
                                    className="
                                      text-sm
                                      font-semibold
                                      text-gray-900

                                      dark:text-white
                                    "
                                  >
                                    {installer.rating.average.toFixed(
                                      1
                                    )}
                                  </span>
                                </div>

                                <p
                                  className="
                                    mt-1
                                    text-[10px]
                                    text-gray-400
                                  "
                                >
                                  {installer
                                    .rating
                                    .reviewCount ||
                                    0}{" "}
                                  review
                                  {installer
                                    .rating
                                    .reviewCount !==
                                  1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>
                            ) : (
                              <span
                                className="
                                  text-xs
                                  text-gray-400
                                "
                              >
                                No rating
                              </span>
                            )}
                          </td>

                          {/* VERIFICATION */}

                          <td
                            className="
                              whitespace-nowrap
                              px-4
                              py-3
                            "
                          >
                            <VerificationBadge
                              status={
                                installer.verificationStatus
                              }
                            />
                          </td>

                          {/* STATUS */}

                          <td
                            className="
                              whitespace-nowrap
                              px-4
                              py-3
                            "
                          >
                            <StatusBadge
                              status={
                                installer.status
                              }
                            />
                          </td>

                          {/* INTERNAL CONTACT */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >
                            <div
                              className="
                                min-w-[245px]
                              "
                            >
                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  text-gray-900

                                  dark:text-white
                                "
                              >
                                {
                                  contactName
                                }
                              </p>

                              {contactPhone ? (
                                <div
                                  className="
                                    mt-1.5
                                    flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    text-gray-500

                                    dark:text-gray-400
                                  "
                                >
                                  <PhoneIcon />

                                  <span>
                                    {
                                      contactPhone
                                    }
                                  </span>
                                </div>
                              ) : (
                                <p
                                  className="
                                    mt-1.5
                                    text-xs
                                    text-gray-400
                                  "
                                >
                                  No phone
                                </p>
                              )}

                              {contactEmail && (
                                <div
                                  className="
                                    mt-1
                                    flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    text-gray-500

                                    dark:text-gray-400
                                  "
                                >
                                  <MailIcon />

                                  <span
                                    className="
                                      max-w-[200px]
                                      truncate
                                    "
                                  >
                                    {
                                      contactEmail
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* ACTIONS */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >
                            <div
                              className="
                                flex
                                items-center
                                justify-center
                                gap-1
                              "
                            >
                              <Link
                                to={`/installers/${installer.installerId}`}
                                title="View Installer"
                                className="
                                  flex
                                  size-8
                                  items-center
                                  justify-center
                                  rounded-lg
                                  text-gray-400
                                  transition

                                  hover:bg-[#ff4b1f]/10
                                  hover:text-[#ff4b1f]
                                "
                              >
                                <EyeIcon />
                              </Link>

                              <Link
                                to={`/installers/${installer.installerId}/edit`}
                                title="Edit Installer"
                                className="
                                  flex
                                  size-8
                                  items-center
                                  justify-center
                                  rounded-lg
                                  text-gray-400
                                  transition

                                  hover:bg-[#5b2eff]/10
                                  hover:text-[#8f78ff]
                                "
                              >
                                <PencilIcon />
                              </Link>

                              <button
                                type="button"
                                title="Delete Installer"
                                onClick={() =>
                                  setInstallerToDelete(
                                    installer
                                  )
                                }
                                className="
                                  flex
                                  size-8
                                  items-center
                                  justify-center
                                  rounded-lg
                                  text-gray-400
                                  transition

                                  hover:bg-red-500/10
                                  hover:text-red-500
                                "
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}

                {/* =========================================
                    EMPTY
                ========================================== */}

                {!loading &&
                  installers.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={
                          9
                        }
                        className="
                          px-6
                          py-14
                          text-center
                        "
                      >
                        <div
                          className="
                            mx-auto
                            flex
                            size-11
                            items-center
                            justify-center
                            rounded-full
                            bg-gray-100
                            text-gray-400

                            dark:bg-gray-800
                          "
                        >
                          <SearchEmptyIcon />
                        </div>

                        <h3
                          className="
                            mt-3
                            text-sm
                            font-semibold
                            text-gray-900

                            dark:text-white
                          "
                        >
                          No installers found
                        </h3>

                        <p
                          className="
                            mt-1
                            text-xs
                            text-gray-500
                          "
                        >
                          Try changing
                          your search or
                          filters.
                        </p>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          {/* ===============================================
              PAGINATION
          ================================================ */}

          {!loading &&
            totalPages > 1 && (
              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-t
                  border-gray-200
                  px-5
                  py-4

                  dark:border-gray-800
                "
              >
                <p
                  className="
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Page {page} of{" "}
                  {totalPages}
                </p>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <button
                    type="button"
                    disabled={
                      page <= 1
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                    className="
                      h-9
                      rounded-lg
                      border
                      border-gray-200
                      px-3
                      text-xs
                      font-semibold
                      text-gray-600
                      transition

                      hover:bg-gray-50

                      disabled:cursor-not-allowed
                      disabled:opacity-40

                      dark:border-gray-700
                      dark:text-gray-300
                      dark:hover:bg-white/5
                    "
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >=
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.min(
                            totalPages,
                            current +
                              1
                          )
                      )
                    }
                    className="
                      h-9
                      rounded-lg
                      border
                      border-gray-200
                      px-3
                      text-xs
                      font-semibold
                      text-gray-600
                      transition

                      hover:bg-gray-50

                      disabled:cursor-not-allowed
                      disabled:opacity-40

                      dark:border-gray-700
                      dark:text-gray-300
                      dark:hover:bg-white/5
                    "
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>

      {/* =================================================
          DELETE MODAL
      ================================================== */}

      {installerToDelete && (
        <div
          className="
            fixed
            inset-0
            z-[99999]
            flex
            items-center
            justify-center
            p-4
          "
        >
          <button
            type="button"
            aria-label="Close delete modal"
            disabled={deleting}
            onClick={() =>
              setInstallerToDelete(
                null
              )
            }
            className="
              absolute
              inset-0
              bg-black/55
              backdrop-blur-[2px]
            "
          />

          <div
            className="
              relative
              z-10
              w-full
              max-w-[430px]
              overflow-hidden
              rounded-2xl
              border
              border-gray-200
              bg-white
              shadow-2xl

              dark:border-gray-800
              dark:bg-[#101828]
            "
          >
            <div
              className="
                p-6
              "
            >
              <div
                className="
                  flex
                  size-11
                  items-center
                  justify-center
                  rounded-full
                  bg-red-500/10
                  text-red-500
                "
              >
                <TrashIcon />
              </div>

              <h3
                className="
                  mt-4
                  text-lg
                  font-semibold
                  text-gray-900

                  dark:text-white
                "
              >
                Delete Installer?
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-500

                  dark:text-gray-400
                "
              >
                Are you sure you
                want to permanently
                delete{" "}
                <span
                  className="
                    font-semibold
                    text-gray-900
                    dark:text-white
                  "
                >
                  {installerToDelete
                    .displayName ||
                    installerToDelete
                      .companyName}
                </span>
                ?
              </p>

              <p
                className="
                  mt-3
                  text-xs
                  leading-5
                  text-gray-500

                  dark:text-gray-400
                "
              >
                For normal
                operational removal,
                consider using
                inactive or suspended
                status instead.
              </p>
            </div>

            <div
              className="
                flex
                justify-end
                gap-2
                border-t
                border-gray-200
                bg-gray-50
                px-6
                py-4

                dark:border-gray-800
                dark:bg-white/[0.02]
              "
            >
              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() =>
                  setInstallerToDelete(
                    null
                  )
                }
                className="
                  h-10
                  rounded-lg
                  border
                  border-gray-200
                  bg-white
                  px-4
                  text-sm
                  font-semibold
                  text-gray-600
                  transition
                  hover:bg-gray-50

                  disabled:cursor-not-allowed
                  disabled:opacity-50

                  dark:border-gray-700
                  dark:bg-transparent
                  dark:text-gray-300
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() =>
                  void confirmDelete()
                }
                className="
                  h-10
                  rounded-lg
                  bg-red-500
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-red-600

                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Installer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        bg-white
        px-4
        py-3

        dark:border-gray-800
        dark:bg-white/[0.03]
      "
    >
      <p
        className="
          text-[10px]
          font-semibold
          uppercase
          tracking-wide
          text-gray-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-xl
          font-bold
          text-gray-900

          dark:text-white
        "
      >
        {value}
      </p>
    </div>
  );
}

function TableHeading({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <th
      className="
        whitespace-nowrap
        px-4
        py-3
        text-left
        text-[11px]
        font-semibold
        uppercase
        tracking-wide
        text-gray-500
      "
    >
      {children}
    </th>
  );
}

/* =========================================================
   VERIFICATION BADGE
========================================================= */

function VerificationBadge({
  status,
}: {
  status:
    InstallerVerificationStatus;
}) {
  const config: Record<
    InstallerVerificationStatus,
    {
      label: string;
      classes: string;
    }
  > = {
    pending: {
      label:
        "Pending",

      classes:
        "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },

    under_review: {
      label:
        "Under Review",

      classes:
        "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },

    verified: {
      label:
        "Verified",

      classes:
        "bg-green-500/10 text-green-600 dark:text-green-400",
    },

    rejected: {
      label:
        "Rejected",

      classes:
        "bg-red-500/10 text-red-600 dark:text-red-400",
    },
  };

  const item =
    config[status];

  return (
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

        ${item.classes}
      `}
    >
      {status ===
        "verified" && (
        <VerifiedIcon />
      )}

      {item.label}
    </span>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    InstallerStatus;
}) {
  const config: Record<
    InstallerStatus,
    {
      label: string;
      classes: string;
    }
  > = {
    active: {
      label:
        "Active",

      classes:
        "bg-green-500/10 text-green-500",
    },

    inactive: {
      label:
        "Inactive",

      classes:
        "bg-gray-500/10 text-gray-500",
    },

    suspended: {
      label:
        "Suspended",

      classes:
        "bg-red-500/10 text-red-500",
    },
  };

  const item =
    config[status];

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-2.5
        py-1
        text-xs
        font-semibold

        ${item.classes}
      `}
    >
      {item.label}
    </span>
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="
        pointer-events-none
        absolute
        left-3
        top-1/2
        size-4
        -translate-y-1/2
        text-gray-400
      "
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
      className="
        pointer-events-none
        absolute
        right-3
        top-1/2
        size-4
        -translate-y-1/2
        text-gray-400
      "
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="
        size-4
        text-[#5b2eff]
      "
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="#f59e0b"
      stroke="#f59e0b"
      strokeWidth="1.5"
      className="size-4"
    >
      <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z" />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="
        size-3.5
      "
    >
      <path d="M12 3 15 5l3-.1.9 2.9L21 10l-1.4 2.7.4 3-2.7 1.4L15.5 20 12 19l-3.5 1-1.8-2.9L4 15.7l.4-3L3 10l2.1-2.2L6 4.9 9 5l3-2Z" />

      <path d="m8.5 11.5 2.2 2.2 4.8-5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="
        size-3.5
        shrink-0
        text-[#ff4b1f]
      "
    >
      <path d="M7.5 3.5 10 8l-2 2c1.3 2.6 3.4 4.7 6 6l2-2 4.5 2.5-.5 3c-.1.8-.8 1.5-1.7 1.5C10.4 21 3 13.6 3 5.7 3 4.8 3.7 4.1 4.5 4l3-.5Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="
        size-3.5
        shrink-0
        text-[#5b2eff]
      "
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
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