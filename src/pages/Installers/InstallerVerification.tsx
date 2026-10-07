import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router";

import {
  toast,
  Toaster,
} from "sonner";

import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShieldQuestion,
  XCircle,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  getInstallerErrorMessage,
  getInstallers,
  updateInstallerVerification,
  type Installer,
  type InstallerStatus,
  type InstallerVerificationStatus,
} from "../../services/installer/installer.service";

/* =========================================================
   SOLAR TRADE HUB
   INSTALLER VERIFICATION
========================================================= */

type VerificationCounts = {
  pending: number;
  under_review: number;
  verified: number;
  rejected: number;
};

const emptyCounts: VerificationCounts = {
  pending: 0,
  under_review: 0,
  verified: 0,
  rejected: 0,
};

/* =========================================================
   VERIFICATION HELPERS
========================================================= */

const getVerificationLabel = (
  status: InstallerVerificationStatus
) => {
  switch (status) {
    case "verified":
      return "Verified";

    case "under_review":
      return "Under Review";

    case "rejected":
      return "Rejected";

    default:
      return "Pending";
  }
};

const getVerificationClasses = (
  status: InstallerVerificationStatus
) => {
  switch (status) {
    case "verified":
      return `
        border-green-200
        bg-green-50
        text-green-700
        dark:border-green-500/20
        dark:bg-green-500/10
        dark:text-green-400
      `;

    case "under_review":
      return `
        border-purple-200
        bg-purple-50
        text-purple-700
        dark:border-purple-500/20
        dark:bg-purple-500/10
        dark:text-purple-400
      `;

    case "rejected":
      return `
        border-red-200
        bg-red-50
        text-red-700
        dark:border-red-500/20
        dark:bg-red-500/10
        dark:text-red-400
      `;

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

const getVerificationIcon = (
  status: InstallerVerificationStatus
) => {
  switch (status) {
    case "verified":
      return (
        <CheckCircle2
          size={14}
          strokeWidth={2}
        />
      );

    case "under_review":
      return (
        <ShieldQuestion
          size={14}
          strokeWidth={2}
        />
      );

    case "rejected":
      return (
        <XCircle
          size={14}
          strokeWidth={2}
        />
      );

    default:
      return (
        <Clock3
          size={14}
          strokeWidth={2}
        />
      );
  }
};

const getStatusLabel = (
  status: InstallerStatus
) => {
  switch (status) {
    case "active":
      return "Active";

    case "inactive":
      return "Inactive";

    case "suspended":
      return "Suspended";

    default:
      return status;
  }
};

const getStatusClasses = (
  status: InstallerStatus
) => {
  switch (status) {
    case "active":
      return `
        bg-green-50
        text-green-700
        dark:bg-green-500/10
        dark:text-green-400
      `;

    case "suspended":
      return `
        bg-red-50
        text-red-700
        dark:bg-red-500/10
        dark:text-red-400
      `;

    default:
      return `
        bg-gray-100
        text-gray-600
        dark:bg-white/5
        dark:text-gray-400
      `;
  }
};

const getStatusDot = (
  status: InstallerStatus
) => {
  switch (status) {
    case "active":
      return "bg-green-500";

    case "suspended":
      return "bg-red-500";

    default:
      return "bg-gray-400";
  }
};

/* =========================================================
   PAGE
========================================================= */

const InstallerVerification = () => {
  const [
    installers,
    setInstallers,
  ] = useState<Installer[]>([]);

  const [
    counts,
    setCounts,
  ] = useState<VerificationCounts>(
    emptyCounts
  );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(0);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  /* =======================================================
     REVIEW MODAL
  ======================================================= */

  const [
    selectedInstaller,
    setSelectedInstaller,
  ] =
    useState<Installer | null>(
      null
    );

  const [
    verificationStatus,
    setVerificationStatus,
  ] =
    useState<InstallerVerificationStatus>(
      "pending"
    );

  const [
    verificationNotes,
    setVerificationNotes,
  ] = useState("");

  const [
    savingVerification,
    setSavingVerification,
  ] = useState(false);

  const limit = 20;

  /* =======================================================
     LOAD VERIFICATION DATA
  ======================================================= */

  useEffect(() => {
    let ignore = false;

    const loadData =
      async () => {
        try {
          setLoading(true);
          setErrorMessage("");

          const [
            listResult,
            pendingResult,
            reviewResult,
            verifiedResult,
            rejectedResult,
          ] = await Promise.all([
            getInstallers({
              page,
              limit,
              sortBy: "createdAt",
              sortOrder: "desc",
            }),

            getInstallers({
              page: 1,
              limit: 1,
              verificationStatus:
                "pending",
            }),

            getInstallers({
              page: 1,
              limit: 1,
              verificationStatus:
                "under_review",
            }),

            getInstallers({
              page: 1,
              limit: 1,
              verificationStatus:
                "verified",
            }),

            getInstallers({
              page: 1,
              limit: 1,
              verificationStatus:
                "rejected",
            }),
          ]);

          if (ignore) {
            return;
          }

          setInstallers(
            listResult.installers
          );

          setTotal(
            listResult.pagination.total
          );

          setTotalPages(
            listResult.pagination.totalPages
          );

          setCounts({
            pending:
              pendingResult.pagination
                .total,

            under_review:
              reviewResult.pagination
                .total,

            verified:
              verifiedResult.pagination
                .total,

            rejected:
              rejectedResult.pagination
                .total,
          });

          if (
            listResult.pagination
              .totalPages > 0 &&
            page >
              listResult.pagination
                .totalPages
          ) {
            setPage(
              listResult.pagination
                .totalPages
            );
          }
        } catch (error) {
          if (ignore) {
            return;
          }

          setInstallers([]);
          setCounts(emptyCounts);

          setErrorMessage(
            getInstallerErrorMessage(
              error,
              "Unable to load installer verification data."
            )
          );
        } finally {
          if (!ignore) {
            setLoading(false);
          }
        }
      };

    void loadData();

    return () => {
      ignore = true;
    };
  }, [
    page,
    refreshKey,
  ]);

  /* =======================================================
     OPEN REVIEW
  ======================================================= */

  const openReview = (
    installer: Installer
  ) => {
    setSelectedInstaller(
      installer
    );

    setVerificationStatus(
      installer.verificationStatus
    );

    setVerificationNotes(
      installer.verificationNotes ||
        ""
    );
  };

  /* =======================================================
     CLOSE REVIEW
  ======================================================= */

  const closeReview =
    () => {
      if (
        savingVerification
      ) {
        return;
      }

      setSelectedInstaller(
        null
      );

      setVerificationStatus(
        "pending"
      );

      setVerificationNotes("");
    };

  /* =======================================================
     SAVE VERIFICATION
  ======================================================= */

  const saveVerification =
    async () => {
      if (
        !selectedInstaller ||
        savingVerification
      ) {
        return;
      }

      try {
        setSavingVerification(
          true
        );

        const updated =
          await updateInstallerVerification(
            selectedInstaller.installerId,
            verificationStatus,
            verificationNotes.trim()
          );

        toast.success(
          "Verification updated",
          {
            description:
              `${updated.installerId} — ${getVerificationLabel(
                updated.verificationStatus
              )}`,
          }
        );

        setSelectedInstaller(
          null
        );

        setVerificationNotes("");

        setRefreshKey(
          (current) =>
            current + 1
        );
      } catch (error) {
        toast.error(
          "Unable to update verification",
          {
            description:
              getInstallerErrorMessage(
                error,
                "Verification could not be updated."
              ),
          }
        );
      } finally {
        setSavingVerification(
          false
        );
      }
    };

  /* =======================================================
     CURRENT SELECTED NAME
  ======================================================= */

  const selectedName =
    useMemo(() => {
      if (
        !selectedInstaller
      ) {
        return "";
      }

      return (
        selectedInstaller
          .displayName ||
        selectedInstaller
          .companyName
      );
    }, [
      selectedInstaller,
    ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <PageMeta
        title="Installer Verification | Solar Trade Hub"
        description="Review installer verification status on Solar Trade Hub."
      />

      <PageBreadcrumb
        pageTitle="Installer Verification"
      />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />

      <div className="space-y-6">
        {/* =================================================
            PAGE INTRO
        ================================================== */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <div
            className="
              relative
              px-5
              py-6
              sm:px-6
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-12
                -top-20
                h-44
                w-44
                rounded-full
                bg-orange-500/5
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                right-12
                top-0
                h-32
                w-32
                rounded-full
                bg-purple-500/5
              "
            />

            <div
              className="
                relative
                flex
                flex-col
                gap-5
                lg:flex-row
                lg:items-center
                lg:justify-between
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-4
                "
              >
                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    bg-gradient-to-br
                    from-orange-500
                    to-purple-600
                    text-white
                    shadow-sm
                  "
                >
                  <ShieldCheck
                    size={23}
                    strokeWidth={1.9}
                  />
                </div>

                <div>
                  <p
                    className="
                      mb-1
                      text-xs
                      font-semibold
                      uppercase
                      tracking-[0.16em]
                      text-orange-600
                      dark:text-orange-400
                    "
                  >
                    Installer Network
                  </p>

                  <h1
                    className="
                      text-xl
                      font-semibold
                      text-gray-900
                      dark:text-white
                      sm:text-2xl
                    "
                  >
                    Installer Verification
                  </h1>

                  <p
                    className="
                      mt-2
                      max-w-2xl
                      text-sm
                      leading-6
                      text-gray-500
                      dark:text-gray-400
                    "
                  >
                    Review installer
                    profiles before they
                    receive verified
                    marketplace status.
                  </p>
                </div>
              </div>

              <div
                className="
                  inline-flex
                  w-fit
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-orange-200
                  bg-orange-50
                  px-4
                  py-3
                  dark:border-orange-500/20
                  dark:bg-orange-500/10
                "
              >
                <Clock3
                  size={19}
                  className="
                    text-orange-600
                    dark:text-orange-400
                  "
                />

                <div>
                  <p
                    className="
                      text-xs
                      text-orange-700
                      dark:text-orange-400
                    "
                  >
                    Awaiting verification
                  </p>

                  <strong
                    className="
                      text-lg
                      text-orange-700
                      dark:text-orange-400
                    "
                  >
                    {
                      counts.pending
                    }
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            SUMMARY
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <SummaryCard
            label="Pending"
            value={
              counts.pending
            }
            icon={
              <Clock3 size={20} />
            }
            iconClass="
              bg-orange-50
              text-orange-600
              dark:bg-orange-500/10
              dark:text-orange-400
            "
          />

          <SummaryCard
            label="Under Review"
            value={
              counts.under_review
            }
            icon={
              <ShieldQuestion
                size={20}
              />
            }
            iconClass="
              bg-purple-50
              text-purple-600
              dark:bg-purple-500/10
              dark:text-purple-400
            "
          />

          <SummaryCard
            label="Verified"
            value={
              counts.verified
            }
            icon={
              <BadgeCheck
                size={20}
              />
            }
            iconClass="
              bg-green-50
              text-green-600
              dark:bg-green-500/10
              dark:text-green-400
            "
          />

          <SummaryCard
            label="Rejected"
            value={
              counts.rejected
            }
            icon={
              <XCircle
                size={20}
              />
            }
            iconClass="
              bg-red-50
              text-red-600
              dark:bg-red-500/10
              dark:text-red-400
            "
          />
        </div>

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
            {
              errorMessage
            }
          </div>
        )}

        {/* =================================================
            VERIFICATION QUEUE
        ================================================== */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              border-b
              border-gray-200
              px-5
              py-5
              dark:border-gray-800
              sm:px-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-base
                  font-semibold
                  text-gray-900
                  dark:text-white
                "
              >
                Verification Queue
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                "
              >
                {loading
                  ? "Loading installer profiles..."
                  : `${total} installer${
                      total !== 1
                        ? "s"
                        : ""
                    }`}
              </p>
            </div>

            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              <ShieldCheck
                size={15}
              />

              Verification is managed by
              Solar Trade Hub
            </div>
          </div>

          <div className="overflow-x-auto">
            <table
              className="
                min-w-[1250px]
                w-full
              "
            >
              <thead
                className="
                  border-b
                  border-gray-200
                  bg-gray-50/80
                  dark:border-gray-800
                  dark:bg-white/[0.02]
                "
              >
                <tr>
                  <TableHeading>
                    Installer
                  </TableHeading>

                  <TableHeading>
                    Service Area
                  </TableHeading>

                  <TableHeading>
                    Services
                  </TableHeading>

                  <TableHeading>
                    Internal Contact
                  </TableHeading>

                  <TableHeading>
                    Verification
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <th
                    className="
                      px-5
                      py-3.5
                      text-right
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-gray-500
                      dark:text-gray-400
                      sm:px-6
                    "
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-gray-200
                  dark:divide-gray-800
                "
              >
                {/* =========================================
                    LOADING
                ========================================== */}

                {loading && (
                  <tr>
                    <td
                      colSpan={7}
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
                        Loading verification
                        queue...
                      </p>
                    </td>
                  </tr>
                )}

                {/* =========================================
                    ROWS
                ========================================== */}

                {!loading &&
                  installers.map(
                    (
                      installer
                    ) => {
                      const displayName =
                        installer.displayName ||
                        installer.companyName;

                      const contactName =
                        installer
                          .internalContact
                          ?.name ||
                        "Not specified";

                      const contactEmail =
                        installer
                          .internalContact
                          ?.email ||
                        installer.email ||
                        "";

                      const contactPhone =
                        installer
                          .internalContact
                          ?.phone ||
                        installer.phone ||
                        "";

                      return (
                        <tr
                          key={
                            installer.installerId
                          }
                          className="
                            transition-colors
                            hover:bg-gray-50/70
                            dark:hover:bg-white/[0.02]
                          "
                        >
                          {/* INSTALLER */}

                          <td
                            className="
                              px-5
                              py-5
                              align-top
                              sm:px-6
                            "
                          >
                            <div
                              className="
                                flex
                                items-start
                                gap-3
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-10
                                  w-10
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-xl
                                  bg-gradient-to-br
                                  from-orange-50
                                  to-purple-50
                                  text-purple-600
                                  dark:from-orange-500/10
                                  dark:to-purple-500/10
                                  dark:text-purple-400
                                "
                              >
                                <Building2
                                  size={18}
                                />
                              </div>

                              <div>
                                <p
                                  className="
                                    font-medium
                                    text-gray-900
                                    dark:text-white
                                  "
                                >
                                  {
                                    displayName
                                  }
                                </p>

                                <p
                                  className="
                                    mt-0.5
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
                                      text-xs
                                      text-gray-500
                                      dark:text-gray-400
                                    "
                                  >
                                    {
                                      installer.companyName
                                    }
                                  </p>
                                )}

                                <div
                                  className="
                                    mt-1.5
                                    flex
                                    items-center
                                    gap-1
                                    text-xs
                                    text-gray-500
                                    dark:text-gray-400
                                  "
                                >
                                  <MapPin
                                    size={13}
                                  />

                                  {installer.city ||
                                    installer
                                      .address
                                      ?.city ||
                                    "Not specified"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SERVICE AREA */}

                          <td
                            className="
                              px-5
                              py-5
                              align-top
                            "
                          >
                            <div
                              className="
                                flex
                                max-w-[220px]
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
                                        text-xs
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
                              px-5
                              py-5
                              align-top
                            "
                          >
                            <div
                              className="
                                flex
                                max-w-[270px]
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
                                        rounded-md
                                        border
                                        border-purple-100
                                        bg-purple-50
                                        px-2
                                        py-1
                                        text-xs
                                        font-medium
                                        text-purple-700
                                        dark:border-purple-500/20
                                        dark:bg-purple-500/10
                                        dark:text-purple-400
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

                          {/* CONTACT */}

                          <td
                            className="
                              px-5
                              py-5
                              align-top
                            "
                          >
                            <div
                              className="
                                min-w-[190px]
                                space-y-1.5
                              "
                            >
                              <p
                                className="
                                  text-sm
                                  font-medium
                                  text-gray-800
                                  dark:text-gray-200
                                "
                              >
                                {
                                  contactName
                                }
                              </p>

                              {contactEmail && (
                                <div
                                  className="
                                    flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    text-gray-500
                                    dark:text-gray-400
                                  "
                                >
                                  <Mail
                                    size={12}
                                  />

                                  <span
                                    className="
                                      max-w-[180px]
                                      truncate
                                    "
                                  >
                                    {
                                      contactEmail
                                    }
                                  </span>
                                </div>
                              )}

                              {contactPhone && (
                                <div
                                  className="
                                    flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    text-gray-500
                                    dark:text-gray-400
                                  "
                                >
                                  <Phone
                                    size={12}
                                  />

                                  {
                                    contactPhone
                                  }
                                </div>
                              )}
                            </div>
                          </td>

                          {/* VERIFICATION */}

                          <td
                            className="
                              px-5
                              py-5
                              align-top
                            "
                          >
                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-1.5
                                whitespace-nowrap
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-xs
                                font-semibold

                                ${getVerificationClasses(
                                  installer.verificationStatus
                                )}
                              `}
                            >
                              {getVerificationIcon(
                                installer.verificationStatus
                              )}

                              {getVerificationLabel(
                                installer.verificationStatus
                              )}
                            </span>

                            {installer.verificationNotes && (
                              <p
                                className="
                                  mt-2
                                  max-w-[220px]
                                  text-xs
                                  leading-5
                                  text-gray-400
                                "
                              >
                                {
                                  installer.verificationNotes
                                }
                              </p>
                            )}
                          </td>

                          {/* STATUS */}

                          <td
                            className="
                              px-5
                              py-5
                              align-top
                            "
                          >
                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                px-2.5
                                py-1
                                text-xs
                                font-medium

                                ${getStatusClasses(
                                  installer.status
                                )}
                              `}
                            >
                              <span
                                className={`
                                  h-1.5
                                  w-1.5
                                  rounded-full

                                  ${getStatusDot(
                                    installer.status
                                  )}
                                `}
                              />

                              {getStatusLabel(
                                installer.status
                              )}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td
                            className="
                              px-5
                              py-5
                              text-right
                              align-top
                              sm:px-6
                            "
                          >
                            <div
                              className="
                                flex
                                justify-end
                                gap-2
                              "
                            >
                              <Link
                                to={`/installers/${installer.installerId}`}
                                title="View Installer"
                                className="
                                  inline-flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  border-gray-200
                                  text-gray-500
                                  transition

                                  hover:border-orange-200
                                  hover:bg-orange-50
                                  hover:text-orange-600

                                  dark:border-gray-700
                                  dark:hover:border-orange-500/20
                                  dark:hover:bg-orange-500/10
                                "
                              >
                                <Eye
                                  size={15}
                                />
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  openReview(
                                    installer
                                  )
                                }
                                className="
                                  inline-flex
                                  h-9
                                  items-center
                                  justify-center
                                  gap-1.5
                                  rounded-lg
                                  border
                                  border-purple-200
                                  bg-purple-50
                                  px-3
                                  text-xs
                                  font-semibold
                                  text-purple-700
                                  transition

                                  hover:border-purple-300
                                  hover:bg-purple-100

                                  dark:border-purple-500/20
                                  dark:bg-purple-500/10
                                  dark:text-purple-400
                                  dark:hover:bg-purple-500/20
                                "
                              >
                                <ShieldCheck
                                  size={14}
                                />

                                Review
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
                        colSpan={7}
                        className="
                          px-6
                          py-14
                          text-center
                        "
                      >
                        <ShieldCheck
                          size={28}
                          className="
                            mx-auto
                            text-gray-300
                          "
                        />

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
                          Installer verification
                          records will appear
                          here.
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
                  sm:px-6
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
                    "
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* =================================================
            VERIFICATION NOTE
        ================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-purple-100
            bg-gradient-to-r
            from-orange-50/60
            to-purple-50/70
            p-5
            dark:border-purple-500/10
            dark:from-orange-500/5
            dark:to-purple-500/5
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                mt-0.5
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-white
                text-purple-600
                shadow-sm
                dark:bg-white/5
                dark:text-purple-400
              "
            >
              <ShieldCheck
                size={18}
              />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-gray-900
                  dark:text-white
                "
              >
                Verification controls
                marketplace trust
              </p>

              <p
                className="
                  mt-1
                  max-w-3xl
                  text-sm
                  leading-6
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Only active and verified
                installers are available
                through the public
                marketplace installer API.
                Rating remains
                system-generated and is
                not manually managed here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          REVIEW MODAL
      ==================================================== */}

      {selectedInstaller && (
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
            aria-label="Close verification modal"
            disabled={
              savingVerification
            }
            onClick={
              closeReview
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
              max-w-[560px]
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
            {/* MODAL HEADER */}

            <div
              className="
                border-b
                border-gray-200
                px-6
                py-5
                dark:border-gray-800
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    size-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-purple-500/10
                    text-purple-600
                    dark:text-purple-400
                  "
                >
                  <ShieldCheck
                    size={20}
                  />
                </div>

                <div>
                  <h3
                    className="
                      text-base
                      font-semibold
                      text-gray-900
                      dark:text-white
                    "
                  >
                    Review Installer
                  </h3>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-gray-500
                      dark:text-gray-400
                    "
                  >
                    {
                      selectedName
                    }
                  </p>

                  <p
                    className="
                      mt-1
                      font-mono
                      text-[11px]
                      text-gray-400
                    "
                  >
                    {
                      selectedInstaller.installerId
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* MODAL BODY */}

            <div
              className="
                space-y-5
                p-6
              "
            >
              <div>
                <label
                  className="
                    mb-1.5
                    block
                    text-xs
                    font-medium
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  Verification Status
                </label>

                <select
                  value={
                    verificationStatus
                  }
                  disabled={
                    savingVerification
                  }
                  onChange={(
                    event
                  ) =>
                    setVerificationStatus(
                      event.target
                        .value as InstallerVerificationStatus
                    )
                  }
                  className="
                    h-11
                    w-full
                    rounded-lg
                    border
                    border-gray-200
                    bg-transparent
                    px-3
                    text-sm
                    text-gray-800
                    outline-none
                    transition
                    focus:border-[#5b2eff]
                    dark:border-gray-700
                    dark:bg-[#101828]
                    dark:text-gray-200
                  "
                >
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
              </div>

              <div>
                <label
                  className="
                    mb-1.5
                    block
                    text-xs
                    font-medium
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  Verification Notes
                </label>

                <textarea
                  rows={5}
                  maxLength={3000}
                  disabled={
                    savingVerification
                  }
                  value={
                    verificationNotes
                  }
                  onChange={(
                    event
                  ) =>
                    setVerificationNotes(
                      event.target
                        .value
                    )
                  }
                  placeholder="Add verification review notes..."
                  className="
                    w-full
                    resize-y
                    rounded-lg
                    border
                    border-gray-200
                    bg-transparent
                    px-3
                    py-3
                    text-sm
                    text-gray-800
                    outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-[#5b2eff]
                    dark:border-gray-700
                    dark:bg-[#101828]
                    dark:text-gray-200
                  "
                />

                <p
                  className="
                    mt-1
                    text-right
                    text-[10px]
                    text-gray-400
                  "
                >
                  {
                    verificationNotes.length
                  }
                  /3000
                </p>
              </div>

              <div
                className="
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  p-4
                  dark:border-gray-700
                  dark:bg-white/[0.02]
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  Marketplace rule
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Public marketplace
                  listing requires both
                  an active account and
                  verified verification
                  status.
                </p>
              </div>
            </div>

            {/* MODAL FOOTER */}

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
                  savingVerification
                }
                onClick={
                  closeReview
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
                  savingVerification
                }
                onClick={() =>
                  void saveVerification()
                }
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-[#5b2eff]
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#4b22eb]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <ShieldCheck
                  size={15}
                />

                {savingVerification
                  ? "Saving..."
                  : "Save Verification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        dark:border-gray-800
        dark:bg-white/[0.03]
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
        "
      >
        <div>
          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1
              text-2xl
              font-semibold
              text-gray-900
              dark:text-white
            "
          >
            {value}
          </p>
        </div>

        <div
          className={`
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl

            ${iconClass}
          `}
        >
          {icon}
        </div>
      </div>
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
    <th
      className="
        px-5
        py-3.5
        text-left
        text-xs
        font-semibold
        uppercase
        tracking-wide
        text-gray-500
        dark:text-gray-400
        sm:px-6
      "
    >
      {children}
    </th>
  );
}

export default InstallerVerification;