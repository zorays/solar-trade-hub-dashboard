import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Download,
  ShieldX,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  formatReportChange,
  formatReportNumber,
  getReportErrorMessage,
  getUsersReport,
  type AccountStatusItem,
  type ReportMetric,
  type ReportRange,
  type UsersReport as UsersReportData,
  type VerificationStatItem,
} from "../../services/reports/report.service";

/* =========================================================
   UI TYPES
========================================================= */

type MetricCardData = {
  label: string;
  metric: ReportMetric;
};

/* =========================================================
   HELPERS
========================================================= */

const formatRoleName = (
  role: string
) => {
  return role
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
};

/* =========================================================
   PAGE
========================================================= */

const UsersReport = () => {
  const [
    range,
    setRange,
  ] =
    useState<ReportRange>(
      "30d"
    );

  const [
    report,
    setReport,
  ] =
    useState<UsersReportData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     LOAD REPORT
  ======================================================= */

  useEffect(
    () => {
      let active =
        true;

      const loadReport =
        async () => {
          try {
            setLoading(
              true
            );

            setError(
              ""
            );

            const data =
              await getUsersReport(
                range
              );

            if (
              !active
            ) {
              return;
            }

            setReport(
              data
            );
          } catch (
            requestError
          ) {
            if (
              !active
            ) {
              return;
            }

            setError(
              getReportErrorMessage(
                requestError
              )
            );
          } finally {
            if (
              active
            ) {
              setLoading(
                false
              );
            }
          }
        };

      loadReport();

      return () => {
        active =
          false;
      };
    },
    [range]
  );

  /* =======================================================
     METRICS
  ======================================================= */

  const metrics =
    useMemo<
      MetricCardData[]
    >(
      () => {
        if (
          !report
        ) {
          return [];
        }

        return [
          {
            label:
              "New Users",

            metric:
              report.metrics
                .newUsers,
          },

          {
            label:
              "Verified Users",

            metric:
              report.metrics
                .verifiedUsers,
          },

          {
            label:
              "Active Users",

            metric:
              report.metrics
                .activeUsers,
          },

          {
            label:
              "Blocked Users",

            metric:
              report.metrics
                .blockedUsers,
          },
        ];
      },
      [report]
    );

  /* =======================================================
     REGISTRATION CHART MAXIMUM
  ======================================================= */

  const maxRegistration =
    useMemo(
      () => {
        if (
          !report ||
          report.registrationTrend
            .length === 0
        ) {
          return 0;
        }

        return Math.max(
          ...report.registrationTrend.map(
            (item) =>
              item.users
          )
        );
      },
      [report]
    );

  /* =======================================================
     RETRY
  ======================================================= */

  const handleRetry =
    async () => {
      try {
        setLoading(
          true
        );

        setError(
          ""
        );

        const data =
          await getUsersReport(
            range
          );

        setReport(
          data
        );
      } catch (
        requestError
      ) {
        setError(
          getReportErrorMessage(
            requestError
          )
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  return (
    <>
      <PageMeta
        title="Users Report | Solar Trade Hub"
        description="Solar Trade Hub user analytics report."
      />

      <PageBreadcrumb
        pageTitle="Users Report"
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
                  <Users
                    size={23}
                  />
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                    Reports
                  </p>

                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                    User Analytics
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    User growth,
                    verification,
                    activity and account
                    distribution across
                    Solar Trade Hub.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={range}
                  disabled={
                    loading
                  }
                  onChange={(
                    event
                  ) =>
                    setRange(
                      event.target
                        .value as ReportRange
                    )
                  }
                  className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="7d">
                    Last 7 Days
                  </option>

                  <option value="30d">
                    Last 30 Days
                  </option>

                  <option value="90d">
                    Last 90 Days
                  </option>

                  <option value="year">
                    This Year
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() =>
                    window.alert(
                      "Users report export will be connected later."
                    )
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <Download
                    size={16}
                  />

                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Unable to load
                  users report
                </p>

                <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleRetry
                }
                disabled={
                  loading
                }
                className="inline-flex h-10 items-center justify-center rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading &&
        !report ? (
          <ReportLoading />
        ) : null}

        {/* =====================================================
            REPORT CONTENT
        ====================================================== */}

        {report ? (
          <>
            {/* =================================================
                TOP METRICS
            ================================================== */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(
                (
                  item,
                  index
                ) => (
                  <MetricCard
                    key={
                      item.label
                    }
                    label={
                      item.label
                    }
                    metric={
                      item.metric
                    }
                    icon={
                      index ===
                      0 ? (
                        <TrendingUp
                          size={
                            20
                          }
                        />
                      ) : index ===
                        1 ? (
                        <CheckCircle2
                          size={
                            20
                          }
                        />
                      ) : index ===
                        2 ? (
                        <UserCheck
                          size={
                            20
                          }
                        />
                      ) : (
                        <Ban
                          size={
                            20
                          }
                        />
                      )
                    }
                    iconClass={
                      index === 0
                        ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                        : index ===
                            1
                          ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                          : index ===
                              2
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                    }
                  />
                )
              )}
            </div>

            {/* =================================================
                REGISTRATION TREND
            ================================================== */}

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    User
                    Registration
                    Trend
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Marketplace
                    registrations
                    during the last
                    six calendar
                    months.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <CalendarDays
                    size={14}
                  />

                  Last 6 Months
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex h-64 items-end gap-3 sm:gap-6">
                  {report.registrationTrend.map(
                    (
                      item
                    ) => {
                      const height =
                        maxRegistration >
                        0
                          ? (item.users /
                              maxRegistration) *
                            100
                          : 0;

                      return (
                        <div
                          key={
                            item.key
                          }
                          className="flex flex-1 flex-col items-center justify-end"
                        >
                          <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {formatReportNumber(
                              item.users
                            )}
                          </p>

                          <div className="flex h-44 w-full max-w-[70px] items-end overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
                            <div
                              className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-purple-600 transition-all"
                              style={{
                                height: `${height}%`,
                              }}
                            />
                          </div>

                          <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                            {
                              item.label
                            }
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* =================================================
                ROLE DISTRIBUTION
            ================================================== */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  User Role
                  Distribution
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Current account
                  distribution
                  across Solar
                  Trade Hub roles.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                    <tr>
                      <TableHeading>
                        Role
                      </TableHeading>

                      <TableHeading align="right">
                        Users
                      </TableHeading>

                      <TableHeading align="right">
                        Share
                      </TableHeading>

                      <TableHeading>
                        Distribution
                      </TableHeading>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {report.roleDistribution.map(
                      (
                        role
                      ) => (
                        <tr
                          key={
                            role.role
                          }
                          className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <div className="flex min-w-[180px] items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                <UserRound
                                  size={
                                    16
                                  }
                                />
                              </div>

                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatRoleName(
                                  role.role
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                            {formatReportNumber(
                              role.users
                            )}
                          </td>

                          <td className="px-5 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
                            {role.percentage.toFixed(
                              1
                            )}
                            %
                          </td>

                          <td className="px-5 py-4">
                            <div className="min-w-[180px]">
                              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-purple-600"
                                  style={{
                                    width: `${Math.min(
                                      role.percentage,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    )}

                    {report
                      .roleDistribution
                      .length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={
                            4
                          }
                          className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          No role
                          data
                          available.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                VERIFICATION + ACCOUNT STATUS
            ================================================== */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <StatusCard
                title="Verification"
                description="Current email and phone verification across Solar Trade Hub accounts."
              >
                {report.verificationStats.map(
                  (
                    item
                  ) => (
                    <VerificationRow
                      key={
                        item.key
                      }
                      item={
                        item
                      }
                    />
                  )
                )}
              </StatusCard>

              <StatusCard
                title="Account Status"
                description="Current Solar Trade Hub account states."
              >
                {report.accountStatus.map(
                  (
                    item
                  ) => (
                    <AccountStatusRow
                      key={
                        item.status
                      }
                      item={
                        item
                      }
                    />
                  )
                )}
              </StatusCard>
            </div>

            {/* =================================================
                REPORT FOOTER
            ================================================== */}

            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-5 py-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Total registered
                users:{" "}
                <strong className="font-semibold text-gray-700 dark:text-gray-300">
                  {formatReportNumber(
                    report.totalUsers
                  )}
                </strong>
              </span>

              <span>
                Range metrics are
                based on account
                creation date.
              </span>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

/* =========================================================
   METRIC CARD
========================================================= */

const MetricCard = ({
  label,
  metric,
  icon,
  iconClass,
}: {
  label: string;
  metric: ReportMetric;
  icon: ReactNode;
  iconClass: string;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {formatReportNumber(
              metric.value
            )}
          </p>

          <p
            className={`mt-2 text-xs font-semibold ${
              metric.positive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {formatReportChange(
              metric.changePct
            )}{" "}
            vs previous period
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

/* =========================================================
   STATUS CARD
========================================================= */

const StatusCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};

/* =========================================================
   VERIFICATION ROW
========================================================= */

const VerificationRow = ({
  item,
}: {
  item: VerificationStatItem;
}) => {
  return (
    <ProgressRow
      label={
        item.label
      }
      value={
        item.value
      }
      percentage={
        item.percentage
      }
      icon={
        <CheckCircle2
          size={15}
        />
      }
    />
  );
};

/* =========================================================
   ACCOUNT STATUS ROW
========================================================= */

const AccountStatusRow = ({
  item,
}: {
  item: AccountStatusItem;
}) => {
  const icon =
    item.status ===
    "active" ? (
      <UserCheck
        size={15}
      />
    ) : item.status ===
      "blocked" ? (
      <Ban
        size={15}
      />
    ) : (
      <ShieldX
        size={15}
      />
    );

  return (
    <ProgressRow
      label={
        item.label
      }
      value={
        item.value
      }
      percentage={
        item.percentage
      }
      icon={
        icon
      }
    />
  );
};

/* =========================================================
   PROGRESS ROW
========================================================= */

const ProgressRow = ({
  label,
  value,
  percentage,
  icon,
}: {
  label: string;
  value: number;
  percentage: number;
  icon: ReactNode;
}) => {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-purple-600 dark:text-purple-400">
            {icon}
          </span>

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>

        <div className="text-right">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatReportNumber(
              value
            )}
          </span>

          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            {percentage.toFixed(
              1
            )}
            %
          </span>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-purple-600"
          style={{
            width: `${Math.min(
              percentage,
              100
            )}%`,
          }}
        />
      </div>
    </div>
  );
};

/* =========================================================
   TABLE HEADING
========================================================= */

const TableHeading = ({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?:
    | "left"
    | "right";
}) => {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-6 ${
        align ===
        "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
};

/* =========================================================
   LOADING
========================================================= */

const ReportLoading =
  () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map(
            (
              _,
              index
            ) => (
              <div
                key={
                  index
                }
                className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="space-y-3 p-5">
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />

                  <div className="h-7 w-20 rounded bg-gray-200 dark:bg-gray-800" />

                  <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            )
          )}
        </div>

        <div className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />

        <div className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
      </div>
    );
  };

export default UsersReport;