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
  useNavigate,
  useParams,
} from "react-router";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

import {
  formatInstallerStatus,
  formatInstallerVerificationStatus,
  getInstaller,
  getInstallerErrorMessage,
  type Installer,
  type InstallerStatus,
  type InstallerVerificationStatus,
} from "../../services/installer/installer.service";

/* =========================================================
   SOLAR TRADE HUB
   VIEW INSTALLER
========================================================= */

/* =========================================================
   PAGE
========================================================= */

export default function ViewInstaller() {
  const navigate =
    useNavigate();

  /*
   * Supports either route style:
   *
   * /installers/:id
   *
   * OR
   *
   * /installers/:installerId
   *
   * Current list passes public ID:
   * STH-I-0001
   */

  const params =
    useParams();

  const installerReference =
    params.installerId ||
    params.id ||
    "";

  const [
    installer,
    setInstaller,
  ] =
    useState<Installer | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  /* =======================================================
     LOAD INSTALLER
  ======================================================= */

  useEffect(() => {
    let ignore =
      false;

    const loadInstaller =
      async () => {
        if (
          !installerReference
        ) {
          setErrorMessage(
            "Installer identifier is missing."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setErrorMessage(
            ""
          );

          const result =
            await getInstaller(
              installerReference
            );

          if (
            ignore
          ) {
            return;
          }

          setInstaller(
            result
          );
        } catch (
          error
        ) {
          if (
            ignore
          ) {
            return;
          }

          setInstaller(
            null
          );

          setErrorMessage(
            getInstallerErrorMessage(
              error,
              "Unable to load installer."
            )
          );
        } finally {
          if (
            !ignore
          ) {
            setLoading(
              false
            );
          }
        }
      };

    void loadInstaller();

    return () => {
      ignore =
        true;
    };
  }, [
    installerReference,
  ]);

  /* =======================================================
     DERIVED VALUES
  ======================================================= */

  const displayName =
    installer?.displayName?.trim() ||
    installer?.companyName?.trim() ||
    "Installer";

  const profileImage =
    installer?.logo ||
    installer?.bannerImage ||
    "";

  const formattedAddress =
    useMemo(() => {
      if (
        !installer
      ) {
        return "—";
      }

      const parts = [
        installer.address
          ?.line1,
        installer.address
          ?.line2,
        installer.address
          ?.city ||
          installer.city,
        installer.address
          ?.province,
        installer.address
          ?.postalCode,
        installer.address
          ?.country,
      ]
        .map(
          (value) =>
            value?.trim()
        )
        .filter(Boolean);

      return (
        parts.join(
          ", "
        ) || "—"
      );
    }, [
      installer,
    ]);

  const serviceAreaText =
    installer?.serviceArea
      ?.length
      ? installer.serviceArea.join(
          ", "
        )
      : "Not specified";

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <>
        <PageMeta
          title="Installer Details | Solar Trade Hub"
          description="Loading installer details"
        />

        <PageBreadcrumb
          pageTitle="Installer Details"
        />

        <div
          className="
            rounded-xl
            border
            border-gray-200
            bg-white
            p-10
            text-center

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <div
            className="
              mx-auto
              size-8
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
              text-sm
              text-gray-500

              dark:text-gray-400
            "
          >
            Loading installer...
          </p>
        </div>
      </>
    );
  }

  /* =======================================================
     NOT FOUND / ERROR
  ======================================================= */

  if (
    !installer
  ) {
    return (
      <>
        <PageMeta
          title="Installer Not Found | Solar Trade Hub"
          description="Installer not found"
        />

        <PageBreadcrumb
          pageTitle="Installer Details"
        />

        <div
          className="
            rounded-xl
            border
            border-gray-200
            bg-white
            p-8
            text-center

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <h2
            className="
              text-lg
              font-semibold
              text-gray-900

              dark:text-white
            "
          >
            Installer not found
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            {errorMessage ||
              "The requested installer record does not exist."}
          </p>

          <Link
            to="/installers"
            className="
              mt-5
              inline-flex
              h-10
              items-center
              justify-center
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
            Back to Installers
          </Link>
        </div>
      </>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <PageMeta
        title={`${displayName} | Solar Trade Hub`}
        description={`Installer profile for ${displayName}`}
      />

      <PageBreadcrumb
        pageTitle="Installer Details"
      />

      <div
        className="
          space-y-4
        "
      >
        {/* =================================================
            HEADER
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <div
            className="
              p-5
            "
          >
            <div
              className="
                flex
                flex-col
                gap-5

                xl:flex-row
                xl:items-center
                xl:justify-between
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-4

                  sm:flex-row
                  sm:items-center
                "
              >
                {/* IMAGE */}

                <div
                  className="
                    flex
                    h-[120px]
                    w-full
                    shrink-0
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-xl
                    border
                    border-gray-200
                    bg-gradient-to-br
                    from-orange-50
                    to-purple-50

                    sm:w-[180px]

                    dark:border-gray-700
                    dark:from-orange-500/10
                    dark:to-purple-500/10
                  "
                >
                  {profileImage ? (
                    <img
                      src={
                        profileImage
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
                        text-3xl
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

                {/* BASIC INFO */}

                <div>
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      gap-2
                    "
                  >
                    <h1
                      className="
                        text-xl
                        font-bold
                        text-gray-900

                        dark:text-white
                      "
                    >
                      {
                        displayName
                      }
                    </h1>

                    <VerificationBadge
                      status={
                        installer.verificationStatus
                      }
                    />

                    <StatusBadge
                      status={
                        installer.status
                      }
                    />
                  </div>

                  <p
                    className="
                      mt-2
                      font-mono
                      text-xs
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
                        mt-1
                        text-sm
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
                      mt-3
                      flex
                      flex-wrap
                      gap-3
                      text-xs
                      text-gray-500

                      dark:text-gray-400
                    "
                  >
                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                      "
                    >
                      <LocationIcon />

                      {installer.city ||
                        installer.address
                          ?.city ||
                        "Not specified"}
                    </span>

                    <span>
                      {
                        serviceAreaText
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}

              <div
                className="
                  flex
                  flex-wrap
                  gap-2
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      -1
                    )
                  }
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-gray-200
                    px-4
                    text-sm
                    font-semibold
                    text-gray-600
                    transition

                    hover:bg-gray-50

                    dark:border-gray-700
                    dark:text-gray-300
                  "
                >
                  Back
                </button>

                <Link
                  to={`/installers/${installer.installerId}/edit`}
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
                  <PencilIcon />

                  Edit Installer
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            SUMMARY
        ================================================== */}

        <div
          className="
            grid
            grid-cols-2
            gap-3

            xl:grid-cols-4
          "
        >
          <InfoMetric
            label="Location"
            value={
              installer.city ||
              installer.address
                ?.city ||
              "Not specified"
            }
          />

          <InfoMetric
            label="Rating"
            value={
              installer.rating
                ?.average >
              0
                ? `${installer.rating.average.toFixed(
                    1
                  )} / 5`
                : "No rating"
            }
          />

          <InfoMetric
            label="Services"
            value={String(
              installer.services
                ?.length ||
                0
            )}
          />

          <InfoMetric
            label="Verification"
            value={formatInstallerVerificationStatus(
              installer.verificationStatus
            )}
          />
        </div>

        {/* =================================================
            MAIN INFORMATION
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-4

            xl:grid-cols-2
          "
        >
          {/* ===============================================
              INSTALLER INFORMATION
          ================================================ */}

          <section
            className="
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white

              dark:border-gray-800
              dark:bg-white/[0.03]
            "
          >
            <SectionHeader
              title="Installer Information"
              description="Marketplace installer profile details."
            />

            <div
              className="
                divide-y
                divide-gray-100
                px-5

                dark:divide-gray-800
              "
            >
              <DetailRow
                label="Installer ID"
                value={
                  <span
                    className="
                      font-mono
                    "
                  >
                    {
                      installer.installerId
                    }
                  </span>
                }
              />

              <DetailRow
                label="Company Name"
                value={
                  installer.companyName ||
                  "—"
                }
              />

              <DetailRow
                label="Display Name"
                value={
                  installer.displayName ||
                  "—"
                }
              />

              <DetailRow
                label="City"
                value={
                  installer.city ||
                  installer.address
                    ?.city ||
                  "—"
                }
              />

              <DetailRow
                label="Service Area"
                value={
                  serviceAreaText
                }
              />

              <DetailRow
                label="Status"
                value={
                  <StatusBadge
                    status={
                      installer.status
                    }
                  />
                }
              />

              <DetailRow
                label="Verification"
                value={
                  <VerificationBadge
                    status={
                      installer.verificationStatus
                    }
                  />
                }
              />
            </div>
          </section>

          {/* ===============================================
              INTERNAL CONTACT
          ================================================ */}

          <section
            className="
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white

              dark:border-gray-800
              dark:bg-white/[0.03]
            "
          >
            <SectionHeader
              title="Internal Contact"
              description="Solar Trade Hub administrative contact details."
            />

            <div
              className="
                divide-y
                divide-gray-100
                px-5

                dark:divide-gray-800
              "
            >
              <DetailRow
                label="Contact Person"
                value={
                  installer.internalContact
                    ?.name ||
                  "—"
                }
              />

              <DetailRow
                label="Phone"
                value={
                  installer.internalContact
                    ?.phone ? (
                    <a
                      href={`tel:${installer.internalContact.phone}`}
                      className="
                        font-medium
                        text-[#ff4b1f]

                        hover:underline
                      "
                    >
                      {
                        installer.internalContact.phone
                      }
                    </a>
                  ) : (
                    "—"
                  )
                }
              />

              <DetailRow
                label="Email"
                value={
                  installer.internalContact
                    ?.email ? (
                    <a
                      href={`mailto:${installer.internalContact.email}`}
                      className="
                        font-medium
                        text-[#5b2eff]

                        hover:underline
                      "
                    >
                      {
                        installer.internalContact.email
                      }
                    </a>
                  ) : (
                    "—"
                  )
                }
              />

              <DetailRow
                label="WhatsApp"
                value={
                  installer.internalContact
                    ?.whatsapp ||
                  "—"
                }
              />
            </div>
          </section>
        </div>

        {/* =================================================
            BUSINESS CONTACT / ADDRESS
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-4

            xl:grid-cols-2
          "
        >
          {/* BUSINESS CONTACT */}

          <section
            className="
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white

              dark:border-gray-800
              dark:bg-white/[0.03]
            "
          >
            <SectionHeader
              title="Business Contact"
              description="Installer business contact information."
            />

            <div
              className="
                divide-y
                divide-gray-100
                px-5

                dark:divide-gray-800
              "
            >
              <DetailRow
                label="Email"
                value={
                  installer.email ? (
                    <a
                      href={`mailto:${installer.email}`}
                      className="
                        font-medium
                        text-[#5b2eff]

                        hover:underline
                      "
                    >
                      {
                        installer.email
                      }
                    </a>
                  ) : (
                    "—"
                  )
                }
              />

              <DetailRow
                label="Phone"
                value={
                  installer.phone ? (
                    <a
                      href={`tel:${installer.phone}`}
                      className="
                        font-medium
                        text-[#ff4b1f]

                        hover:underline
                      "
                    >
                      {
                        installer.phone
                      }
                    </a>
                  ) : (
                    "—"
                  )
                }
              />

              <DetailRow
                label="WhatsApp"
                value={
                  installer.whatsapp ||
                  "—"
                }
              />

              <DetailRow
                label="Website"
                value={
                  installer.website ? (
                    <a
                      href={
                        installer.website
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="
                        break-all
                        font-medium
                        text-[#5b2eff]

                        hover:underline
                      "
                    >
                      {
                        installer.website
                      }
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </section>

          {/* ADDRESS */}

          <section
            className="
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white

              dark:border-gray-800
              dark:bg-white/[0.03]
            "
          >
            <SectionHeader
              title="Business Address"
              description="Installer office or operational address."
            />

            <div
              className="
                divide-y
                divide-gray-100
                px-5

                dark:divide-gray-800
              "
            >
              <DetailRow
                label="Address"
                value={
                  formattedAddress
                }
              />

              <DetailRow
                label="Province"
                value={
                  installer.address
                    ?.province ||
                  "—"
                }
              />

              <DetailRow
                label="Country"
                value={
                  installer.address
                    ?.country ||
                  "Pakistan"
                }
              />

              <DetailRow
                label="Postal Code"
                value={
                  installer.address
                    ?.postalCode ||
                  "—"
                }
              />
            </div>
          </section>
        </div>

        {/* =================================================
            BUSINESS REGISTRATION
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Business Registration"
            description="Company and tax registration information."
          />

          <div
            className="
              grid
              grid-cols-1
              gap-4
              p-5

              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            <MiniCard
              label="NTN"
              value={
                installer.ntn ||
                "—"
              }
            />

            <MiniCard
              label="STRN"
              value={
                installer.strn ||
                "—"
              }
            />

            <MiniCard
              label="Company Registration"
              value={
                installer.companyRegistrationNo ||
                "—"
              }
            />
          </div>
        </section>

        {/* =================================================
            SERVICES
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Solar Services"
            description="Services provided by this installer."
          />

          <div
            className="
              flex
              flex-wrap
              gap-2
              p-5
            "
          >
            {installer.services
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
                      rounded-lg
                      bg-[#5b2eff]/10
                      px-3
                      py-2
                      text-xs
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
              <p
                className="
                  text-sm
                  text-gray-500

                  dark:text-gray-400
                "
              >
                No services added.
              </p>
            )}
          </div>
        </section>

        {/* =================================================
            DESCRIPTION
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Installer Description"
            description="Profile and capability information."
          />

          <div
            className="
              p-5
            "
          >
            <p
              className="
                whitespace-pre-wrap
                text-sm
                leading-6
                text-gray-600

                dark:text-gray-300
              "
            >
              {installer.description ||
                "No description added for this installer."}
            </p>
          </div>
        </section>

        {/* =================================================
            MARKETPLACE INFORMATION
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Marketplace Information"
            description="System-managed installer marketplace information."
          />

          <div
            className="
              grid
              grid-cols-1
              gap-4
              p-5

              sm:grid-cols-2
              xl:grid-cols-5
            "
          >
            <MiniCard
              label="Installer ID"
              value={
                installer.installerId
              }
            />

            <MiniCard
              label="Rating"
              value={
                installer.rating
                  ?.average >
                0
                  ? installer.rating.average.toFixed(
                      1
                    )
                  : "—"
              }
            />

            <MiniCard
              label="Reviews"
              value={String(
                installer.rating
                  ?.reviewCount ||
                  0
              )}
            />

            <MiniCard
              label="Verification"
              value={formatInstallerVerificationStatus(
                installer.verificationStatus
              )}
            />

            <MiniCard
              label="Status"
              value={formatInstallerStatus(
                installer.status
              )}
            />
          </div>
        </section>

        {/* =================================================
            VERIFICATION NOTES
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white

            dark:border-gray-800
            dark:bg-white/[0.03]
          "
        >
          <SectionHeader
            title="Verification Notes"
            description="Administrative verification information."
          />

          <div
            className="
              p-5
            "
          >
            <p
              className="
                whitespace-pre-wrap
                text-sm
                leading-6
                text-gray-600

                dark:text-gray-300
              "
            >
              {installer.verificationNotes ||
                "No verification notes added."}
            </p>

            {installer.verifiedAt && (
              <p
                className="
                  mt-3
                  text-xs
                  text-gray-400
                "
              >
                Verified:{" "}
                {new Date(
                  installer.verifiedAt
                ).toLocaleString()}
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        border-b
        border-gray-200
        px-5
        py-4

        dark:border-gray-800
      "
    >
      <h2
        className="
          text-sm
          font-semibold
          text-gray-900

          dark:text-white
        "
      >
        {title}
      </h2>

      <p
        className="
          mt-1
          text-xs
          text-gray-500

          dark:text-gray-400
        "
      >
        {description}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div
      className="
        grid
        grid-cols-1
        gap-1
        py-4

        sm:grid-cols-[150px_1fr]
        sm:gap-4
      "
    >
      <p
        className="
          text-xs
          font-medium
          text-gray-400
        "
      >
        {label}
      </p>

      <div
        className="
          break-words
          text-sm
          font-medium
          text-gray-800

          dark:text-gray-200
        "
      >
        {value}
      </div>
    </div>
  );
}

function InfoMetric({
  label,
  value,
}: {
  label: string;
  value: string;
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
          truncate
          text-sm
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

function MiniCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        px-4
        py-3

        dark:border-gray-700
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
          break-words
          text-sm
          font-semibold
          text-gray-900

          dark:text-white
        "
      >
        {value}
      </p>
    </div>
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

      {
        item.label
      }
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
      {
        item.label
      }
    </span>
  );
}

/* =========================================================
   ICONS
========================================================= */

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

function VerifiedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-3.5"
    >
      <path d="M12 3 15 5l3-.1.9 2.9L21 10l-1.4 2.7.4 3-2.7 1.4L15.5 20 12 19l-3.5 1-1.8-2.9L4 15.7l.4-3L3 10l2.1-2.2L6 4.9 9 5l3-2Z" />

      <path d="m8.5 11.5 2.2 2.2 4.8-5" />
    </svg>
  );
}