
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router";

import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  FileText,
  FilterX,
  GitBranch,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  careerService,
  CareerApiError,
  CAREER_APPLICATION_STATUSES,
  type Career,
  type CareerApplication,
  type CareerApplicationCounts,
  type CareerApplicationStatus,
  type CareerApplicationListQuery,
  type CareerInterviewMode,
} from "../../services/careers/career";

import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";

/* =========================================================
   SOLAR TRADE HUB — APPLICATIONS MANAGEMENT

   Features:
   - Recruitment summary
   - Candidate search and filters
   - Server-side pagination
   - Candidate detail modal
   - CV metadata
   - Authenticated CV downloads
   - Download loading and error states
   - Recruitment status management
   - Recruiter notes
   - Interview scheduling
   - Application history

   Security:
   careers.view   => view and download
   careers.manage => recruitment updates
========================================================= */

const PAGE_SIZE = 15;

const EMPTY_COUNTS: CareerApplicationCounts = {
  total: 0,
  new: 0,
  reviewing: 0,
  shortlisted: 0,
  interview: 0,
  offered: 0,
  hired: 0,
  rejected: 0,
  withdrawn: 0,
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white " +
  "px-3 py-2.5 text-sm text-gray-900 outline-none " +
  "transition focus:border-[#5b2eff] focus:ring-2 " +
  "focus:ring-[#5b2eff]/10 dark:border-gray-700 " +
  "dark:bg-gray-900 dark:text-white";

const buttonClass =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-xl px-4 py-2.5 text-sm font-semibold " +
  "transition disabled:cursor-not-allowed " +
  "disabled:opacity-50";

const STATUS_LABELS: Record<
  CareerApplicationStatus,
  string
> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const STATUS_COLORS: Record<
  CareerApplicationStatus,
  string
> = {
  new:
    "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  reviewing:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  shortlisted:
    "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  interview:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  offered:
    "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
  hired:
    "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  rejected:
    "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  withdrawn:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value?: string | null,
  includeTime = false
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
    timeZone: "Asia/Karachi",
  }).format(date);
}

function toDatetimeLocal(
  value?: string | null
): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Karachi",
    }
  ).formatToParts(date);

  const get = (type: string) =>
    parts.find(
      (part) => part.type === type
    )?.value ?? "";

  return `${get("year")}-${get("month")}-${get(
    "day"
  )}T${get("hour")}:${get("minute")}`;
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof CareerApiError) {
    const details = error.errors
      .map(
        (item) =>
          `${item.field}: ${item.message}`
      )
      .join(" ");

    return details || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to complete this request.";
}

function isApplicationStatus(
  value: string | null
): value is CareerApplicationStatus {
  return CAREER_APPLICATION_STATUSES.includes(
    value as CareerApplicationStatus
  );
}

function formatFileSize(
  size: number
): string {
  if (!Number.isFinite(size) || size < 0) {
    return "Unknown size";
  }

  if (size < 1024) {
    return `${size} bytes`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(2)} MB`;
}

function isFinalized(
  status: CareerApplicationStatus
) {
  return [
    "hired",
    "rejected",
    "withdrawn",
  ].includes(status);
}

function StatusBadge({
  status,
}: {
  status: CareerApplicationStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        STATUS_COLORS[status] ??
        STATUS_COLORS.new
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* =========================================================
   APPLICATIONS DASHBOARD
========================================================= */

export default function ApplicationsCareers() {
  const { user, isAdmin } = useAuth();

  const canManage =
    isAdmin ||
    hasUserPermission(user, "careers.manage");

  const [searchParams, setSearchParams] =
    useSearchParams();

  const careerIdFilter =
    searchParams.get("careerId") || "";

  const statusParam =
    searchParams.get("status");

  const statusFilter = isApplicationStatus(
    statusParam
  )
    ? statusParam
    : "";

  const pageParam = Number(
    searchParams.get("page") || 1
  );

  const page =
    Number.isSafeInteger(pageParam) &&
    pageParam > 0
      ? pageParam
      : 1;

  const search =
    searchParams.get("search") || "";

  /* DATA */

  const [applications, setApplications] =
    useState<CareerApplication[]>([]);

  const [careers, setCareers] =
    useState<Career[]>([]);

  const [counts, setCounts] =
    useState<CareerApplicationCounts>(
      EMPTY_COUNTS
    );

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [summaryLoading, setSummaryLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [summaryError, setSummaryError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [searchInput, setSearchInput] =
    useState(search);

  /* CANDIDATE DETAIL */

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [candidate, setCandidate] =
    useState<CareerApplication | null>(
      null
    );

  const [candidateLoading, setCandidateLoading] =
    useState(false);

  const [candidateError, setCandidateError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [modalSuccess, setModalSuccess] =
    useState("");

  /* NEW: CV DOWNLOAD STATE */

  const [downloadingResumeId, setDownloadingResumeId] =
    useState<string | null>(null);

  const [resumeError, setResumeError] =
    useState("");

  const [resumeSuccess, setResumeSuccess] =
    useState("");

  /* RECRUITMENT FORM */

  const [nextStatus, setNextStatus] =
    useState<CareerApplicationStatus>(
      "new"
    );

  const [statusNote, setStatusNote] =
    useState("");

  const [recruiterNotes, setRecruiterNotes] =
    useState("");

  /* INTERVIEW FORM */

  const [interviewDate, setInterviewDate] =
    useState("");

  const [interviewMode, setInterviewMode] =
    useState<CareerInterviewMode>(
      "online"
    );

  const [interviewLocation, setInterviewLocation] =
    useState("");

  const [meetingLink, setMeetingLink] =
    useState("");

  const [interviewNotes, setInterviewNotes] =
    useState("");

  /* =======================================================
     FILTERS
  ======================================================= */

  const updateFilters = useCallback(
    (
      updates: Record<string, string>
    ) => {
      const params =
        new URLSearchParams(searchParams);

      for (
        const [key, value] of Object.entries(
          updates
        )
      ) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      setSearchParams(params);
    },
    [
      searchParams,
      setSearchParams,
    ]
  );

  const refresh = useCallback(() => {
    setRefreshKey(
      (previous) => previous + 1
    );
  }, []);

  /* =======================================================
     LOAD JOB OPTIONS
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadJobs = async () => {
      try {
        const result =
          await careerService.getAll({
            page: 1,
            limit: 100,
            sortBy: "createdAt",
            sortOrder: "desc",
          });

        if (active) {
          setCareers(
            result.careers || []
          );
        }
      } catch {
        if (active) {
          setCareers([]);
        }
      }
    };

    void loadJobs();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  /* =======================================================
     LOAD APPLICATIONS AND SUMMARY
  ======================================================= */

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setSummaryLoading(true);
      setError("");
      setSummaryError("");

      const query: CareerApplicationListQuery = {
        page,
        limit: PAGE_SIZE,
        sortBy: "appliedAt",
        sortOrder: "desc",
        careerId:
          careerIdFilter || undefined,
        status:
          statusFilter || undefined,
        search:
          search || undefined,
      };

      const [
        listResult,
        summaryResult,
      ] = await Promise.allSettled([
        careerService.getApplications(
          query
        ),
        careerService.getApplicationSummary(
          careerIdFilter || undefined
        ),
      ]);

      if (!active) return;

      if (
        listResult.status === "fulfilled"
      ) {
        setApplications(
          listResult.value.applications ||
            []
        );

        setTotal(
          listResult.value.pagination.total
        );

        setTotalPages(
          Math.max(
            1,
            listResult.value.pagination
              .totalPages
          )
        );
      } else {
        setApplications([]);
        setTotal(0);
        setTotalPages(1);

        setError(
          getErrorMessage(
            listResult.reason
          )
        );
      }

      if (
        summaryResult.status === "fulfilled"
      ) {
        setCounts({
          ...EMPTY_COUNTS,
          ...summaryResult.value.overall,
        });
      } else {
        setCounts(EMPTY_COUNTS);

        setSummaryError(
          getErrorMessage(
            summaryResult.reason
          )
        );
      }

      setLoading(false);
      setSummaryLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [
    page,
    careerIdFilter,
    statusFilter,
    search,
    refreshKey,
  ]);

  /* =======================================================
     POPULATE CANDIDATE FORM
  ======================================================= */

  const populateCandidateForm =
    useCallback(
      (
        application: CareerApplication
      ) => {
        setNextStatus(
          application.status
        );

        setStatusNote("");

        setRecruiterNotes(
          application.recruiterNotes || ""
        );

        setInterviewDate(
          toDatetimeLocal(
            application.interview?.scheduledAt
          )
        );

        setInterviewMode(
          application.interview?.mode ||
            "online"
        );

        setInterviewLocation(
          application.interview?.location ||
            ""
        );

        setMeetingLink(
          application.interview?.meetingLink ||
            ""
        );

        setInterviewNotes(
          application.interview?.notes ||
            ""
        );
      },
      []
    );

  /* =======================================================
     LOAD SELECTED APPLICATION
  ======================================================= */

  useEffect(() => {
    if (!selectedId) return;

    let active = true;

    const loadCandidate = async () => {
      setCandidateLoading(true);
      setCandidate(null);
      setCandidateError("");
      setModalSuccess("");
      setResumeError("");
      setResumeSuccess("");

      try {
        const result =
          await careerService.getApplicationById(
            selectedId
          );

        if (!active) return;

        setCandidate(result);
        populateCandidateForm(
          result
        );
      } catch (requestError) {
        if (!active) return;

        setCandidateError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        if (active) {
          setCandidateLoading(
            false
          );
        }
      }
    };

    void loadCandidate();

    return () => {
      active = false;
    };
  }, [
    selectedId,
    populateCandidateForm,
    refreshKey,
  ]);

  /* =======================================================
     MODAL SCROLL / ESCAPE
  ======================================================= */

  useEffect(() => {
    if (!selectedId) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const onKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape" &&
        !saving &&
        !downloadingResumeId
      ) {
        setSelectedId(null);
      }
    };

    document.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [
    selectedId,
    saving,
    downloadingResumeId,
  ]);

  /* =======================================================
     NEW: DOWNLOAD CANDIDATE CV

     Uses authenticated Axios Blob method.

     The backend checks:
     - Authentication
     - careers.view / careers.manage
     - Application ID
     - Private file availability

     No public CV URL is generated.
  ======================================================= */

  async function handleResumeDownload(
    application: CareerApplication
  ) {
    if (
      !application.resume ||
      !application._id ||
      downloadingResumeId
    ) {
      return;
    }

    setDownloadingResumeId(
      application._id
    );

    setResumeError("");
    setResumeSuccess("");
    setCandidateError("");

    try {
      await careerService.downloadApplicationResume(
        application._id,
        application.resume.originalName
      );

      setResumeSuccess(
        "CV download started successfully."
      );
    } catch (requestError) {
      setResumeError(
        getErrorMessage(
          requestError
        )
      );
    } finally {
      setDownloadingResumeId(
        null
      );
    }
  }

  /* =======================================================
     UPDATE RECRUITMENT STATUS
  ======================================================= */

  async function handleStatusUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !canManage ||
      !candidate ||
      saving ||
      nextStatus === candidate.status
    ) {
      return;
    }

    setSaving(true);
    setCandidateError("");
    setModalSuccess("");

    try {
      const updated =
        await careerService.updateApplicationStatus(
          candidate._id,
          {
            status: nextStatus,
            note: statusNote.trim(),
          }
        );

      setCandidate(updated);
      populateCandidateForm(
        updated
      );

      setModalSuccess(
        "Candidate status updated successfully."
      );

      setSuccess(
        "Recruitment status updated."
      );

      refresh();
    } catch (requestError) {
      setCandidateError(
        getErrorMessage(
          requestError
        )
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     UPDATE RECRUITER NOTES
  ======================================================= */

  async function handleNotesUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !canManage ||
      !candidate ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setCandidateError("");
    setModalSuccess("");

    try {
      const updated =
        await careerService.updateApplicationNotes(
          candidate._id,
          recruiterNotes.trim()
        );

      setCandidate({
        ...candidate,
        ...updated,
        recruiterNotes:
          recruiterNotes.trim(),
      });

      setModalSuccess(
        "Recruiter notes saved successfully."
      );
    } catch (requestError) {
      setCandidateError(
        getErrorMessage(
          requestError
        )
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     SCHEDULE INTERVIEW
  ======================================================= */

  async function handleInterviewUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !canManage ||
      !candidate ||
      saving
    ) {
      return;
    }

    if (!interviewDate) {
      setCandidateError(
        "Select an interview date and time."
      );
      return;
    }

    const scheduledAt = new Date(
      `${interviewDate}:00+05:00`
    );

    if (
      Number.isNaN(
        scheduledAt.getTime()
      ) ||
      scheduledAt <= new Date()
    ) {
      setCandidateError(
        "Interview date must be in the future."
      );
      return;
    }

    setSaving(true);
    setCandidateError("");
    setModalSuccess("");

    try {
      const updated =
        await careerService.scheduleInterview(
          candidate._id,
          {
            scheduledAt:
              scheduledAt.toISOString(),

            mode: interviewMode,

            location:
              interviewLocation.trim(),

            meetingLink:
              meetingLink.trim(),

            notes:
              interviewNotes.trim(),
          }
        );

      setCandidate(updated);
      populateCandidateForm(
        updated
      );

      setModalSuccess(
        "Interview scheduled successfully."
      );

      refresh();
    } catch (requestError) {
      setCandidateError(
        getErrorMessage(
          requestError
        )
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     SUMMARY CARDS
  ======================================================= */

  const summaryCards = [
    {
      label: "Total Applications",
      value: counts.total,
      icon: Users,
      color: "text-[#5b2eff]",
      bg: "bg-[#5b2eff]/10",
    },
    {
      label: "New",
      value: counts.new,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      label: "Reviewing",
      value: counts.reviewing,
      icon: Clock3,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Shortlisted",
      value: counts.shortlisted,
      icon: CheckCircle2,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-500/10",
    },
    {
      label: "Interviews",
      value: counts.interview,
      icon: CalendarClock,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      label: "Hired",
      value: counts.hired,
      icon: UserRound,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-500/10",
    },
  ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <span>Management</span>
            <span>/</span>

            <Link
              to="/careers"
              className="hover:text-[#5b2eff]"
            >
              Careers
            </Link>

            <span>/</span>

            <span className="text-[#5b2eff]">
              Applications
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Candidate Applications
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review applicants, manage recruitment
            decisions and schedule interviews.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={refresh}
          className={`${buttonClass} border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200`}
        >
          <RefreshCw
            size={17}
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh Applications
        </button>
      </div>

      {/* NAVIGATION */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          to="/careers"
          className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-700 hover:border-[#5b2eff]/30 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
        >
          <span className="flex items-center gap-2">
            <BriefcaseBusiness size={18} />
            Job Openings
          </span>
          <ArrowRight size={16} />
        </Link>

        <Link
          to="/careers/applications"
          className="flex items-center justify-between gap-2 rounded-xl border border-[#5b2eff]/30 bg-[#5b2eff]/5 p-4 text-sm font-semibold text-[#5b2eff]"
        >
          <span className="flex items-center gap-2">
            <Users size={18} />
            Applications
          </span>
          <ArrowRight size={16} />
        </Link>

        <Link
          to="/careers/pipeline"
          className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-700 hover:border-[#5b2eff]/30 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
        >
          <span className="flex items-center gap-2">
            <GitBranch size={18} />
            Candidate Pipeline
          </span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* PAGE MESSAGES */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"
        >
          <AlertCircle
            size={18}
            className="shrink-0"
          />
          <span className="flex-1">
            {error}
          </span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300"
        >
          <span>{success}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setSuccess("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {summaryError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
        >
          Application statistics could not be
          loaded: {summaryError}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg} ${card.color}`}
              >
                <Icon size={21} />
              </div>

              <p className="mt-4 text-sm font-medium text-gray-500">
                {card.label}
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {summaryLoading || summaryError
                  ? "—"
                  : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* FILTERS / APPLICATIONS */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Applicant Records
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {total} applications matching current
                filters
              </p>
            </div>

            {(careerIdFilter ||
              statusFilter ||
              search) && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchParams({});
                }}
                className={`${buttonClass} border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300`}
              >
                <FilterX size={16} />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_190px]">
            <form
              onSubmit={(
                event: FormEvent<HTMLFormElement>
              ) => {
                event.preventDefault();

                updateFilters({
                  search: searchInput.trim(),
                  page: "1",
                });
              }}
              className="relative"
            >
              <Search
                size={17}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                placeholder="Search name, email, phone or reference..."
                className={`${inputClass} pl-10`}
                maxLength={200}
                aria-label="Search applications"
              />

              <button
                type="submit"
                className="sr-only"
              >
                Search
              </button>
            </form>

            <select
              className={inputClass}
              value={careerIdFilter}
              aria-label="Filter by job"
              onChange={(event) =>
                updateFilters({
                  careerId: event.target.value,
                  page: "1",
                })
              }
            >
              <option value="">
                All Job Openings
              </option>

              {careers.map((career) => (
                <option
                  key={career.careerId}
                  value={career.careerId}
                >
                  {career.title} ({career.careerId})
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              value={statusFilter}
              aria-label="Filter by recruitment status"
              onChange={(event) =>
                updateFilters({
                  status: event.target.value,
                  page: "1",
                })
              }
            >
              <option value="">
                All Statuses
              </option>

              {CAREER_APPLICATION_STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {STATUS_LABELS[status]}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
              <tr>
                {[
                  "Candidate",
                  "Job",
                  "Experience",
                  "Applied",
                  "Status",
                  "CV",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center"
                  >
                    <Loader2
                      size={29}
                      className="mx-auto animate-spin text-[#5b2eff]"
                    />
                    <p className="mt-3 text-sm text-gray-500">
                      Loading applications...
                    </p>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center"
                  >
                    <ClipboardList
                      size={35}
                      className="mx-auto text-gray-300"
                    />
                    <h3 className="mt-3 font-semibold text-gray-700 dark:text-gray-200">
                      No Applications Found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No candidate records match
                      the selected filters.
                    </p>
                  </td>
                </tr>
              ) : (
                applications.map((application) => {
                  const relatedCareer =
                    careers.find(
                      (career) =>
                        career.careerId ===
                        application.careerId
                    );

                  return (
                    <tr
                      key={application._id}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {application.applicantName}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {application.email}
                        </p>
                        <p className="mt-1 font-mono text-xs text-gray-400">
                          {application.applicationId}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {relatedCareer?.title ||
                            application.careerId}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {application.careerId}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {application.experienceYears ?? 0}{" "}
                        years
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(
                          application.appliedAt,
                          true
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={application.status}
                        />
                      </td>

                      {/* CV METADATA */}

                      <td className="px-5 py-4">
                        {application.resume ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600">
                            <FileText size={15} />
                            Attached
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600">
                            Not attached
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedId(
                              application._id
                            )
                          }
                          className={`${buttonClass} border border-violet-200 text-[#5b2eff] hover:bg-[#5b2eff]/5 dark:border-violet-900`}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} · {total} records
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={
                page <= 1 || loading
              }
              onClick={() =>
                updateFilters({
                  page: String(page - 1),
                })
              }
              className={`${buttonClass} border border-gray-200 dark:border-gray-700`}
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <button
              type="button"
              disabled={
                page >= totalPages || loading
              }
              onClick={() =>
                updateFilters({
                  page: String(page + 1),
                })
              }
              className={`${buttonClass} border border-gray-200 dark:border-gray-700`}
            >
              Next
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* CANDIDATE DETAIL MODAL */}

      {selectedId && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-3 sm:p-5"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving &&
              !downloadingResumeId
            ) {
              setSelectedId(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Candidate application details"
            className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
          >
            {/* MODAL HEADER */}

            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Candidate Application
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {candidate?.applicationId ||
                    "Loading candidate details..."}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  saving ||
                  Boolean(downloadingResumeId)
                }
                onClick={() =>
                  setSelectedId(null)
                }
                aria-label="Close application details"
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              {candidateLoading ? (
                <div className="flex min-h-52 flex-col items-center justify-center gap-3">
                  <Loader2
                    size={30}
                    className="animate-spin text-[#5b2eff]"
                  />
                  <p className="text-sm text-gray-500">
                    Loading candidate profile...
                  </p>
                </div>
              ) : candidate ? (
                <div className="space-y-6">
                  {/* MESSAGES */}

                  {candidateError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                      {candidateError}
                    </div>
                  )}

                  {modalSuccess && (
                    <div
                      role="status"
                      className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
                    >
                      {modalSuccess}
                    </div>
                  )}

                  {/* PERSONAL DETAILS */}

                  <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5b2eff]/10 text-[#5b2eff]">
                          <UserRound size={24} />
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {candidate.applicantName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {candidate.applicationId}
                          </p>
                        </div>
                      </div>

                      <StatusBadge
                        status={candidate.status}
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Mail size={17} />
                        <a
                          href={`mailto:${candidate.email}`}
                          className="break-all hover:text-[#5b2eff]"
                        >
                          {candidate.email}
                        </a>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Phone size={17} />
                        <span>{candidate.phone}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin size={17} />
                        <span>
                          {candidate.city ||
                            "Not provided"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <BriefcaseBusiness size={17} />
                        <span>
                          {candidate.experienceYears ??
                            0}{" "}
                          years of experience
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarClock size={17} />
                        <span>
                          Applied{" "}
                          {formatDate(
                            candidate.appliedAt,
                            true
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <ClipboardList size={17} />
                        <span>
                          {candidate.careerId}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* COVER LETTER */}

                  <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                      <MessageSquareText
                        size={19}
                        className="text-[#5b2eff]"
                      />
                      Cover Letter
                    </h3>

                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-gray-600 dark:text-gray-300">
                      {candidate.coverLetter ||
                        "No cover letter submitted."}
                    </p>
                  </section>

                  {/* CV / RESUME */}

                  <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                      <FileText
                        size={19}
                        className="text-[#5b2eff]"
                      />
                      CV / Resume
                    </h3>

                    {candidate.resume ? (
                      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50 sm:flex-row sm:items-center">
                        <div className="flex-1">
                          <p className="break-all text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {candidate.resume.originalName}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatFileSize(
                              candidate.resume.size
                            )}{" "}
                            · {candidate.resume.mimeType}
                          </p>

                          {candidate.resume.uploadedAt && (
                            <p className="mt-1 text-xs text-gray-500">
                              Uploaded{" "}
                              {formatDate(
                                candidate.resume.uploadedAt,
                                true
                              )}
                            </p>
                          )}
                        </div>

                        {/* ACTIVE DOWNLOAD BUTTON */}

                        <button
                          type="button"
                          disabled={
                            downloadingResumeId ===
                            candidate._id
                          }
                          onClick={() =>
                            void handleResumeDownload(
                              candidate
                            )
                          }
                          className={`${buttonClass} bg-[#5b2eff] text-white hover:bg-[#4924d5]`}
                        >
                          {downloadingResumeId ===
                          candidate._id ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Download size={16} />
                          )}

                          {downloadingResumeId ===
                          candidate._id
                            ? "Downloading..."
                            : "Download CV"}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
                        No CV attachment is recorded for
                        this application. This may be a
                        legacy application submitted
                        before private CV storage was
                        introduced.
                      </div>
                    )}

                    {/* CV DOWNLOAD ERROR */}

                    {resumeError && (
                      <div
                        role="alert"
                        className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"
                      >
                        <AlertCircle
                          size={17}
                          className="mt-0.5 shrink-0"
                        />

                        <span className="flex-1">
                          {resumeError}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setResumeError("")
                          }
                          aria-label="Dismiss CV error"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}

                    {/* CV DOWNLOAD SUCCESS */}

                    {resumeSuccess && (
                      <div
                        role="status"
                        className="mt-3 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300"
                      >
                        <CheckCircle2
                          size={17}
                          className="shrink-0"
                        />

                        {resumeSuccess}
                      </div>
                    )}

                    <p className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                      <ShieldCheck
                        size={15}
                        className="shrink-0"
                      />
                      Resume files are downloaded
                      securely through authenticated
                      backend requests.
                    </p>
                  </section>

                  {/* RECRUITMENT STATUS */}

                  <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Recruitment Decision
                    </h3>

                    {canManage ? (
                      <form
                        onSubmit={(event) =>
                          void handleStatusUpdate(event)
                        }
                        className="mt-4 space-y-4"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Application Status
                            </label>

                            <select
                              value={nextStatus}
                              onChange={(event) =>
                                setNextStatus(
                                  event.target
                                    .value as CareerApplicationStatus
                                )
                              }
                              className={inputClass}
                            >
                              {CAREER_APPLICATION_STATUSES.map(
                                (status) => (
                                  <option
                                    key={status}
                                    value={status}
                                  >
                                    {
                                      STATUS_LABELS[
                                        status
                                      ]
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="submit"
                              disabled={
                                saving ||
                                nextStatus ===
                                  candidate.status
                              }
                              className={`${buttonClass} w-full bg-[#5b2eff] text-white hover:bg-[#4924d5]`}
                            >
                              {saving ? (
                                <Loader2
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Save size={17} />
                              )}
                              Update Status
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Decision Note
                          </label>

                          <textarea
                            value={statusNote}
                            onChange={(event) =>
                              setStatusNote(
                                event.target.value
                              )
                            }
                            rows={3}
                            maxLength={1000}
                            className={inputClass}
                            placeholder="Optional reason or recruitment note..."
                          />
                        </div>
                      </form>
                    ) : (
                      <div className="mt-4">
                        <StatusBadge
                          status={candidate.status}
                        />
                        <p className="mt-3 text-xs text-gray-500">
                          View-only access. Recruitment
                          updates require careers.manage.
                        </p>
                      </div>
                    )}
                  </section>

                  {/* RECRUITER NOTES */}

                  <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Internal Recruiter Notes
                    </h3>

                    {canManage ? (
                      <form
                        className="mt-4 space-y-3"
                        onSubmit={(event) =>
                          void handleNotesUpdate(event)
                        }
                      >
                        <textarea
                          value={recruiterNotes}
                          onChange={(event) =>
                            setRecruiterNotes(
                              event.target.value
                            )
                          }
                          rows={5}
                          maxLength={10000}
                          className={inputClass}
                          placeholder="Internal candidate evaluation, strengths, concerns and follow-up notes..."
                        />

                        <button
                          type="submit"
                          disabled={saving}
                          className={`${buttonClass} bg-[#5b2eff] text-white`}
                        >
                          <Save size={16} />
                          Save Notes
                        </button>
                      </form>
                    ) : (
                      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-500">
                        {candidate.recruiterNotes ||
                          "No recruiter notes available."}
                      </p>
                    )}
                  </section>

                  {/* INTERVIEW SCHEDULING */}

                  <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                      <CalendarClock
                        size={19}
                        className="text-[#5b2eff]"
                      />
                      Interview Scheduling
                    </h3>

                    {candidate.interview?.scheduledAt && (
                      <div className="mt-4 rounded-xl bg-violet-50 p-4 text-sm text-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
                        Scheduled:{" "}
                        <strong>
                          {formatDate(
                            candidate.interview.scheduledAt,
                            true
                          )}
                        </strong>
                        {" · "}
                        {candidate.interview.mode}
                      </div>
                    )}

                    {canManage ? (
                      isFinalized(candidate.status) ? (
                        <p className="mt-4 text-sm text-gray-500">
                          This application has reached a
                          final recruitment status.
                        </p>
                      ) : (
                        <form
                          className="mt-4 space-y-4"
                          onSubmit={(event) =>
                            void handleInterviewUpdate(
                              event
                            )
                          }
                        >
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Interview Date & Time
                              </label>

                              <input
                                required
                                type="datetime-local"
                                value={interviewDate}
                                onChange={(event) =>
                                  setInterviewDate(
                                    event.target.value
                                  )
                                }
                                className={inputClass}
                              />

                              <p className="mt-1 text-xs text-gray-500">
                                Pakistan time (PKT)
                              </p>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Interview Mode
                              </label>

                              <select
                                value={interviewMode}
                                onChange={(event) =>
                                  setInterviewMode(
                                    event.target
                                      .value as CareerInterviewMode
                                  )
                                }
                                className={inputClass}
                              >
                                <option value="online">
                                  Online
                                </option>
                                <option value="onsite">
                                  On-site
                                </option>
                                <option value="phone">
                                  Phone
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Location
                              </label>

                              <input
                                maxLength={500}
                                value={
                                  interviewLocation
                                }
                                onChange={(event) =>
                                  setInterviewLocation(
                                    event.target.value
                                  )
                                }
                                className={inputClass}
                                placeholder="Office or interview venue"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Meeting Link
                              </label>

                              <input
                                type="url"
                                maxLength={1000}
                                value={meetingLink}
                                onChange={(event) =>
                                  setMeetingLink(
                                    event.target.value
                                  )
                                }
                                className={inputClass}
                                placeholder="https://meet.example.com/..."
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Interview Notes
                            </label>

                            <textarea
                              rows={3}
                              maxLength={2000}
                              value={interviewNotes}
                              onChange={(event) =>
                                setInterviewNotes(
                                  event.target.value
                                )
                              }
                              className={inputClass}
                              placeholder="Interview instructions or assessment notes..."
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={saving}
                            className={`${buttonClass} bg-[#5b2eff] text-white`}
                          >
                            {saving ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <CalendarClock size={16} />
                            )}
                            Save Interview Schedule
                          </button>
                        </form>
                      )
                    ) : (
                      <p className="mt-4 text-sm text-gray-500">
                        Interview scheduling requires
                        careers.manage permission.
                      </p>
                    )}
                  </section>

                  {/* STATUS HISTORY */}

                  <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Recruitment History
                    </h3>

                    {candidate.statusHistory?.length ? (
                      <div className="mt-5 space-y-4">
                        {[...candidate.statusHistory]
                          .reverse()
                          .map((entry, index) => (
                            <div
                              key={`${entry.changedAt}-${index}`}
                              className="flex gap-3 border-l-2 border-violet-200 pl-4"
                            >
                              <div className="flex-1">
                                <StatusBadge
                                  status={entry.status}
                                />

                                <p className="mt-2 text-xs text-gray-500">
                                  {formatDate(
                                    entry.changedAt,
                                    true
                                  )}
                                </p>

                                {entry.note && (
                                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
                                    {entry.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">
                        No recruitment history recorded.
                      </p>
                    )}
                  </section>
                </div>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                  {candidateError ||
                    "Unable to load candidate information."}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}

            <div className="flex shrink-0 justify-end border-t border-gray-100 p-4 dark:border-gray-800">
              <button
                type="button"
                disabled={
                  saving ||
                  Boolean(downloadingResumeId)
                }
                onClick={() =>
                  setSelectedId(null)
                }
                className={`${buttonClass} border border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
