
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
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
  Clock3,
  FileText,
  GitBranch,
  GripVertical,
  Loader2,
  MapPin,
  RefreshCw,
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
} from "../../services/careers/career";

import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";

/* =========================================================
   SOLAR TRADE HUB
   CANDIDATE PIPELINE

   Route:
   /careers/pipeline

   Features:
   - Eight recruitment stages
   - Live candidate records
   - Drag and drop
   - Recruitment status updates
   - Decision history notes
   - Job filtering
   - Applicant search
   - Independent stage pagination
   - Backend-confirmed updates
   - Role-based access control
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type StageConfig = {
  status: CareerApplicationStatus;
  label: string;
  description: string;
  textColor: string;
  headerColor: string;
  dotColor: string;
};

type StageData = {
  items: CareerApplication[];
  total: number;
  totalPages: number;
  error: string;
};

type StagePages = Record<
  CareerApplicationStatus,
  number
>;

type StageResults = Record<
  CareerApplicationStatus,
  StageData
>;

type PendingMove = {
  application: CareerApplication;
  targetStatus: CareerApplicationStatus;
};

/* =========================================================
   CONSTANTS
========================================================= */

const STAGE_LIMIT = 20;

const STAGES: StageConfig[] = [
  {
    status: "new",
    label: "New",
    description: "Recently submitted applications",
    textColor:
      "text-blue-700 dark:text-blue-300",
    headerColor:
      "bg-blue-50 dark:bg-blue-500/10",
    dotColor: "bg-blue-500",
  },
  {
    status: "reviewing",
    label: "Reviewing",
    description: "Candidate evaluation",
    textColor:
      "text-amber-700 dark:text-amber-300",
    headerColor:
      "bg-amber-50 dark:bg-amber-500/10",
    dotColor: "bg-amber-500",
  },
  {
    status: "shortlisted",
    label: "Shortlisted",
    description: "Selected for further assessment",
    textColor:
      "text-violet-700 dark:text-violet-300",
    headerColor:
      "bg-violet-50 dark:bg-violet-500/10",
    dotColor: "bg-violet-500",
  },
  {
    status: "interview",
    label: "Interview",
    description: "Interview and assessment",
    textColor:
      "text-indigo-700 dark:text-indigo-300",
    headerColor:
      "bg-indigo-50 dark:bg-indigo-500/10",
    dotColor: "bg-indigo-500",
  },
  {
    status: "offered",
    label: "Offered",
    description: "Offer issued to candidate",
    textColor:
      "text-cyan-700 dark:text-cyan-300",
    headerColor:
      "bg-cyan-50 dark:bg-cyan-500/10",
    dotColor: "bg-cyan-500",
  },
  {
    status: "hired",
    label: "Hired",
    description: "Successfully recruited",
    textColor:
      "text-green-700 dark:text-green-300",
    headerColor:
      "bg-green-50 dark:bg-green-500/10",
    dotColor: "bg-green-500",
  },
  {
    status: "rejected",
    label: "Rejected",
    description: "Not selected for the position",
    textColor:
      "text-red-700 dark:text-red-300",
    headerColor:
      "bg-red-50 dark:bg-red-500/10",
    dotColor: "bg-red-500",
  },
  {
    status: "withdrawn",
    label: "Withdrawn",
    description: "Application withdrawn",
    textColor:
      "text-gray-600 dark:text-gray-300",
    headerColor:
      "bg-gray-100 dark:bg-gray-800",
    dotColor: "bg-gray-400",
  },
];

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
  "w-full rounded-xl border border-gray-200 " +
  "bg-white px-3 py-2.5 text-sm text-gray-900 " +
  "outline-none focus:border-[#5b2eff] " +
  "focus:ring-2 focus:ring-[#5b2eff]/10 " +
  "dark:border-gray-700 dark:bg-gray-900 " +
  "dark:text-white";

const buttonClass =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-xl px-4 py-2.5 text-sm font-semibold " +
  "transition disabled:cursor-not-allowed " +
  "disabled:opacity-50";

/* =========================================================
   INITIAL STATE HELPERS

   Explicitly typed to avoid Object.fromEntries
   and arrow-function syntax problems.
========================================================= */

function createStagePages(): StagePages {
  const result = {} as StagePages;

  for (const status of CAREER_APPLICATION_STATUSES) {
    result[status] = 1;
  }

  return result;
}

function createStageResults(): StageResults {
  const result = {} as StageResults;

  for (const status of CAREER_APPLICATION_STATUSES) {
    result[status] = {
      items: [],
      total: 0,
      totalPages: 1,
      error: "",
    };
  }

  return result;
}

/* =========================================================
   HELPERS
========================================================= */

function getErrorMessage(error: unknown): string {
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

  return "Unable to complete the request.";
}

function formatDate(
  value?: string | null
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
    timeZone: "Asia/Karachi",
  }).format(date);
}

function getStageLabel(
  status: CareerApplicationStatus
): string {
  return (
    STAGES.find(
      (stage) => stage.status === status
    )?.label || status
  );
}

function getApplicationId(
  application: CareerApplication
): string {
  return application._id || application.id || "";
}

/* =========================================================
   CANDIDATE CARD
========================================================= */

type CandidateCardProps = {
  application: CareerApplication;
  jobTitle: string;
  canManage: boolean;
  saving: boolean;
  onView: () => void;
  onMove: () => void;
  onDragStart: (
    event: DragEvent<HTMLDivElement>
  ) => void;
  onDragEnd: () => void;
};

function CandidateCard({
  application,
  jobTitle,
  canManage,
  saving,
  onView,
  onMove,
  onDragStart,
  onDragEnd,
}: CandidateCardProps) {
  return (
    <div
      draggable={canManage && !saving}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={[
        "rounded-xl border border-gray-200",
        "bg-white p-4 shadow-sm transition",
        "hover:border-violet-200 hover:shadow-md",
        "dark:border-gray-800 dark:bg-gray-900",
        canManage && !saving
          ? "cursor-grab active:cursor-grabbing"
          : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        {canManage && (
          <GripVertical
            size={17}
            className="mt-0.5 shrink-0 text-gray-300"
          />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">
            {application.applicantName}
          </h3>

          <p className="mt-1 truncate text-xs text-gray-500">
            {application.email}
          </p>

          <p className="mt-1 truncate font-mono text-[11px] text-gray-400">
            {application.applicationId}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="flex items-start gap-2 text-xs text-gray-500">
          <BriefcaseBusiness
            size={14}
            className="mt-0.5 shrink-0"
          />

          <span className="line-clamp-2">
            {jobTitle}
          </span>
        </p>

        <p className="flex items-center gap-2 text-xs text-gray-500">
          <Clock3 size={14} />

          {application.experienceYears ?? 0}
          {" "}years experience
        </p>

        <p className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin size={14} />

          {application.city || "City not provided"}
        </p>

        <p className="flex items-center gap-2 text-xs text-gray-500">
          <FileText size={14} />

          {application.resume
            ? "CV attached"
            : "CV not recorded"}
        </p>

        <p className="text-xs text-gray-400">
          Applied {formatDate(application.appliedAt)}
        </p>
      </div>

      <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <button
          type="button"
          onClick={onView}
          className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200"
        >
          View Details
        </button>

        {canManage && (
          <button
            type="button"
            disabled={saving}
            onClick={onMove}
            className="rounded-lg bg-[#5b2eff] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4924d5] disabled:opacity-50"
          >
            Move
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PipelineCareers() {
  const navigate = useNavigate();

  const { user, isAdmin } = useAuth();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const canManage =
    isAdmin ||
    hasUserPermission(user, "careers.manage");

  const careerId =
    searchParams.get("careerId") || "";

  const search =
    searchParams.get("search") || "";

  /* =======================================================
     COMPONENT STATE
  ======================================================= */

  const [searchInput, setSearchInput] =
    useState(search);

  const [careers, setCareers] =
    useState<Career[]>([]);

  const [counts, setCounts] =
    useState<CareerApplicationCounts>(
      EMPTY_COUNTS
    );

  const [stages, setStages] =
    useState<StageResults>(
      createStageResults
    );

  const [stagePages, setStagePages] =
    useState<StagePages>(
      createStagePages
    );

  const [loading, setLoading] =
    useState(true);

  const [countsLoading, setCountsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [summaryError, setSummaryError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [pendingMove, setPendingMove] =
    useState<PendingMove | null>(null);

  const [moveNote, setMoveNote] =
    useState("");

  const [moveError, setMoveError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [dragOverStatus, setDragOverStatus] =
    useState<CareerApplicationStatus | null>(
      null
    );

  const draggingId =
    useRef<string | null>(null);

  /* =======================================================
     FILTERS
  ======================================================= */

  const updateFilters = useCallback(
    (changes: Record<string, string>) => {
      const params = new URLSearchParams(
        searchParams
      );

      for (const [key, value] of Object.entries(
        changes
      )) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      setStagePages(createStagePages());

      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const refresh = useCallback(() => {
    setRefreshKey(
      (previous) => previous + 1
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setStagePages(createStagePages());
    setSearchParams({});
  }, [setSearchParams]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  /* =======================================================
     LOAD JOB OPTIONS
  ======================================================= */

  useEffect(() => {
    let active = true;

    async function loadJobs() {
      try {
        const result = await careerService.getAll({
          page: 1,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        if (active) {
          setCareers(result.careers || []);
        }
      } catch {
        if (active) {
          setCareers([]);
        }
      }
    }

    void loadJobs();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  /* =======================================================
     LOAD PIPELINE

     Separate Promise.allSettled calls preserve
     correct TypeScript result types.

     stagePages is a dependency, so changing
     one column's page triggers a new fetch.
  ======================================================= */

  useEffect(() => {
    let active = true;

    async function loadPipeline() {
      setLoading(true);
      setCountsLoading(true);
      setError("");
      setSummaryError("");

      const requestedPages = { ...stagePages };

      const summaryPromise =
        careerService.getApplicationSummary(
          careerId || undefined
        );

      const applicationPromises =
        STAGES.map((stage) =>
          careerService.getApplications({
            page: requestedPages[stage.status],
            limit: STAGE_LIMIT,
            careerId: careerId || undefined,
            status: stage.status,
            search: search || undefined,
            sortBy: "appliedAt",
            sortOrder: "desc",
          })
        );

      const [
        summaryResults,
        applicationResults,
      ] = await Promise.all([
        Promise.allSettled([summaryPromise]),
        Promise.allSettled(applicationPromises),
      ]);

      if (!active) return;

      /* APPLICATION SUMMARY */

      const summaryResult = summaryResults[0];

      if (summaryResult.status === "fulfilled") {
        setCounts({
          ...EMPTY_COUNTS,
          ...summaryResult.value.overall,
        });
      } else {
        setCounts(EMPTY_COUNTS);
        setSummaryError(
          getErrorMessage(summaryResult.reason)
        );
      }

      /* APPLICATION LISTS */

      const nextStages = createStageResults();

      STAGES.forEach((stage, index) => {
        const result = applicationResults[index];

        if (result.status === "fulfilled") {
          nextStages[stage.status] = {
            items: result.value.applications || [],
            total: result.value.pagination.total,
            totalPages: Math.max(
              1,
              result.value.pagination.totalPages
            ),
            error: "",
          };
        } else {
          nextStages[stage.status] = {
            items: [],
            total: 0,
            totalPages: 1,
            error: getErrorMessage(result.reason),
          };
        }
      });

      setStages(nextStages);

      setLoading(false);
      setCountsLoading(false);
    }

    void loadPipeline();

    return () => {
      active = false;
    };
  }, [
    careerId,
    search,
    refreshKey,
    stagePages,
  ]);

  /* =======================================================
     STAGE PAGINATION
  ======================================================= */

  function changeStagePage(
    status: CareerApplicationStatus,
    nextPage: number
  ) {
    if (
      loading ||
      nextPage < 1 ||
      nextPage > stages[status].totalPages ||
      nextPage === stagePages[status]
    ) {
      return;
    }

    setStagePages((previous) => ({
      ...previous,
      [status]: nextPage,
    }));
  }

  /* =======================================================
     JOB TITLE LOOKUP
  ======================================================= */

  const careerTitles = useMemo(() => {
    return new Map(
      careers.map(
        (career) => [
          career.careerId,
          career.title,
        ]
      )
    );
  }, [careers]);

  /* =======================================================
     ACTIVE CANDIDATES
  ======================================================= */

  const activeCandidates =
    counts.new +
    counts.reviewing +
    counts.shortlisted +
    counts.interview +
    counts.offered;

  /* =======================================================
     PREPARE CANDIDATE MOVE
  ======================================================= */

  function openMove(
    application: CareerApplication,
    targetStatus?: CareerApplicationStatus
  ) {
    if (!canManage || saving) return;

    const defaultTarget =
      CAREER_APPLICATION_STATUSES.find(
        (status) =>
          status !== application.status
      );

    const nextStatus =
      targetStatus || defaultTarget;

    if (
      !nextStatus ||
      nextStatus === application.status
    ) {
      return;
    }

    setPendingMove({
      application,
      targetStatus: nextStatus,
    });

    setMoveNote("");
    setMoveError("");
  }

  /* =======================================================
     DRAG AND DROP
  ======================================================= */

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    application: CareerApplication
  ) {
    if (!canManage || saving) {
      event.preventDefault();
      return;
    }

    const id = getApplicationId(application);

    if (!id) {
      event.preventDefault();
      return;
    }

    draggingId.current = id;

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
      "text/plain",
      id
    );
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    status: CareerApplicationStatus
  ) {
    if (
      !canManage ||
      saving ||
      !draggingId.current
    ) {
      return;
    }

    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    setDragOverStatus(status);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    targetStatus: CareerApplicationStatus
  ) {
    event.preventDefault();
    setDragOverStatus(null);

    if (!canManage || saving) return;

    const id = event.dataTransfer.getData(
      "text/plain"
    );

    if (
      !id ||
      id !== draggingId.current
    ) {
      return;
    }

    const application = STAGES
      .flatMap(
        (stage) =>
          stages[stage.status].items
      )
      .find(
        (item) =>
          getApplicationId(item) === id
      );

    draggingId.current = null;

    if (
      !application ||
      application.status === targetStatus
    ) {
      return;
    }

    openMove(
      application,
      targetStatus
    );
  }

  /* =======================================================
     SAVE STATUS CHANGE
  ======================================================= */

  async function confirmMove(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !pendingMove ||
      !canManage ||
      saving
    ) {
      return;
    }

    const id = getApplicationId(
      pendingMove.application
    );

    if (!id) {
      setMoveError(
        "Invalid candidate application ID."
      );
      return;
    }

    setSaving(true);
    setMoveError("");
    setError("");
    setSuccess("");

    try {
      await careerService.updateApplicationStatus(
        id,
        {
          status: pendingMove.targetStatus,
          note: moveNote.trim(),
        }
      );

      setSuccess(
        `${pendingMove.application.applicantName} moved to ${getStageLabel(
          pendingMove.targetStatus
        )} successfully.`
      );

      setPendingMove(null);
      setMoveNote("");

      setStagePages(createStagePages());
      refresh();
    } catch (requestError) {
      setMoveError(
        getErrorMessage(requestError)
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summaryCards = [
    {
      label: "Total Applicants",
      value: counts.total,
      icon: Users,
      color: "text-[#5b2eff]",
      background: "bg-[#5b2eff]/10",
    },
    {
      label: "Active Candidates",
      value: activeCandidates,
      icon: GitBranch,
      color: "text-blue-600",
      background:
        "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      label: "Interviews",
      value: counts.interview,
      icon: CalendarClock,
      color: "text-indigo-600",
      background:
        "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      label: "Hired Candidates",
      value: counts.hired,
      icon: CheckCircle2,
      color: "text-green-600",
      background:
        "bg-green-50 dark:bg-green-500/10",
    },
  ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6 pb-10">

      {/* PAGE HEADER */}

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
              Candidate Pipeline
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Candidate Pipeline
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track candidates and manage their
            recruitment progress.
          </p>
        </div>

        <button
          type="button"
          disabled={loading || saving}
          onClick={refresh}
          className={`${buttonClass} border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200`}
        >
          <RefreshCw
            size={17}
            className={
              loading ? "animate-spin" : ""
            }
          />

          Refresh Pipeline
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
          className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-700 hover:border-[#5b2eff]/30 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
        >
          <span className="flex items-center gap-2">
            <Users size={18} />
            Applications
          </span>
          <ArrowRight size={16} />
        </Link>

        <Link
          to="/careers/pipeline"
          className="flex items-center justify-between gap-2 rounded-xl border border-[#5b2eff]/30 bg-[#5b2eff]/5 p-4 text-sm font-semibold text-[#5b2eff]"
        >
          <span className="flex items-center gap-2">
            <GitBranch size={18} />
            Candidate Pipeline
          </span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* GLOBAL ERROR */}

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
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300"
        >
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY ERROR */}

      {summaryError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
        >
          Pipeline statistics unavailable:{" "}
          {summaryError}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.background} ${card.color}`}
              >
                <Icon size={21} />
              </div>

              <p className="mt-4 text-sm text-gray-500">
                {card.label}
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {countsLoading || summaryError
                  ? "—"
                  : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* FILTERS */}

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault();

            updateFilters({
              search: searchInput.trim(),
            });
          }}
        >
          <Search
            size={17}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            className={`${inputClass} pl-10`}
            placeholder="Search candidates..."
            maxLength={200}
            aria-label="Search candidates"
          />

          <button
            type="submit"
            className="sr-only"
          >
            Search
          </button>
        </form>

        <select
          value={careerId}
          onChange={(event) =>
            updateFilters({
              careerId: event.target.value,
            })
          }
          className={`${inputClass} lg:max-w-xs`}
          aria-label="Filter by job opening"
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

        {(careerId || search) && (
          <button
            type="button"
            onClick={resetFilters}
            className={`${buttonClass} border border-gray-200 dark:border-gray-700`}
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* BOARD INFO */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-gray-500">
          {canManage
            ? "Drag a candidate into another stage, or select Move to change their status."
            : "View applicants across recruitment stages."}
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck size={16} />
          Protected recruitment records
        </div>
      </div>

      {/* KANBAN BOARD */}

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max items-start gap-4">

          {STAGES.map((stage) => {
            const data = stages[stage.status];

            const currentPage =
              stagePages[stage.status];

            const isDragOver =
              dragOverStatus === stage.status;

            return (
              <div
                key={stage.status}
                onDragOver={(event) =>
                  handleDragOver(
                    event,
                    stage.status
                  )
                }
                onDragLeave={() =>
                  setDragOverStatus(null)
                }
                onDrop={(event) =>
                  handleDrop(
                    event,
                    stage.status
                  )
                }
                className={[
                  "flex max-h-[75vh] w-[310px]",
                  "shrink-0 flex-col overflow-hidden",
                  "rounded-2xl border bg-gray-50/70",
                  "dark:bg-gray-900/50",
                  isDragOver
                    ? "border-[#5b2eff] ring-2 ring-[#5b2eff]/20"
                    : "border-gray-200 dark:border-gray-800",
                ].join(" ")}
              >

                {/* COLUMN HEADER */}

                <div
                  className={`shrink-0 border-b border-gray-200 p-4 dark:border-gray-800 ${stage.headerColor}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${stage.dotColor}`}
                      />

                      <h2
                        className={`text-sm font-bold ${stage.textColor}`}
                      >
                        {stage.label}
                      </h2>
                    </div>

                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                      {countsLoading || summaryError
                        ? "—"
                        : counts[stage.status]}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {stage.description}
                  </p>
                </div>

                {/* CANDIDATES */}

                <div className="min-h-[260px] flex-1 space-y-3 overflow-y-auto p-3">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2
                        size={24}
                        className="animate-spin text-[#5b2eff]"
                      />
                    </div>
                  ) : data.error ? (
                    <div
                      role="alert"
                      className="rounded-xl bg-red-50 p-3 text-xs text-red-700"
                    >
                      {data.error}
                    </div>
                  ) : data.items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-7 text-center dark:border-gray-700 dark:bg-gray-900">
                      <UserRound
                        size={26}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 text-xs text-gray-500">
                        No candidates
                      </p>
                    </div>
                  ) : (
                    data.items.map((application) => (
                      <CandidateCard
                        key={getApplicationId(application)}
                        application={application}
                        jobTitle={
                          careerTitles.get(
                            application.careerId
                          ) ||
                          application.careerId
                        }
                        canManage={canManage}
                        saving={saving}
                        onView={() =>
                          navigate(
                            `/careers/applications?careerId=${encodeURIComponent(
                              application.careerId
                            )}&search=${encodeURIComponent(
                              application.applicationId
                            )}`
                          )
                        }
                        onMove={() =>
                          openMove(application)
                        }
                        onDragStart={(event) =>
                          handleDragStart(
                            event,
                            application
                          )
                        }
                        onDragEnd={() => {
                          draggingId.current = null;
                          setDragOverStatus(null);
                        }}
                      />
                    ))
                  )}
                </div>

                {/* COLUMN PAGINATION */}

                <div className="flex shrink-0 items-center justify-between border-t border-gray-200 bg-white px-3 py-3 dark:border-gray-800 dark:bg-gray-900">
                  <button
                    type="button"
                    aria-label={`Previous ${stage.label} page`}
                    disabled={
                      loading ||
                      currentPage <= 1
                    }
                    onClick={() =>
                      changeStagePage(
                        stage.status,
                        currentPage - 1
                      )
                    }
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 disabled:opacity-40 dark:border-gray-700"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  <span className="text-xs text-gray-500">
                    {currentPage} / {data.totalPages}
                  </span>

                  <button
                    type="button"
                    aria-label={`Next ${stage.label} page`}
                    disabled={
                      loading ||
                      currentPage >= data.totalPages
                    }
                    onClick={() =>
                      changeStagePage(
                        stage.status,
                        currentPage + 1
                      )
                    }
                    className="rounded-lg border border-gray-200 p-2 text-gray-600 disabled:opacity-40 dark:border-gray-700"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOVE CANDIDATE MODAL */}

      {pendingMove && canManage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setPendingMove(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Change candidate status"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Move Candidate
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Change recruitment stage.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setPendingMove(null)}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(event) =>
                void confirmMove(event)
              }
              className="mt-5 space-y-4"
            >
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {pendingMove.application.applicantName}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {pendingMove.application.careerId}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Current stage:{" "}
                  <strong>
                    {getStageLabel(
                      pendingMove.application.status
                    )}
                  </strong>
                </p>
              </div>

              <div>
                <label
                  htmlFor="pipeline-target-stage"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Move To
                </label>

                <select
                  id="pipeline-target-stage"
                  className={inputClass}
                  value={pendingMove.targetStatus}
                  onChange={(event) =>
                    setPendingMove({
                      ...pendingMove,
                      targetStatus:
                        event.target.value as CareerApplicationStatus,
                    })
                  }
                >
                  {STAGES.map((stage) => (
                    <option
                      key={stage.status}
                      value={stage.status}
                    >
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="pipeline-move-note"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Decision Note
                </label>

                <textarea
                  id="pipeline-move-note"
                  rows={4}
                  maxLength={1000}
                  value={moveNote}
                  onChange={(event) =>
                    setMoveNote(event.target.value)
                  }
                  className={inputClass}
                  placeholder="Optional reason for moving this candidate..."
                />
              </div>

              {moveError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {moveError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setPendingMove(null)}
                  className={`${buttonClass} border border-gray-200 dark:border-gray-700`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    pendingMove.targetStatus ===
                      pendingMove.application.status
                  }
                  className={`${buttonClass} bg-[#5b2eff] text-white hover:bg-[#4924d5]`}
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Confirm Move
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
