
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { Link, useNavigate } from "react-router";

import {
  BriefcaseBusiness,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Eye,
  CalendarDays,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Archive,
  Clock3,
  FileText,
  Users,
  GitBranch,
  Mail,
  Globe2,
  Paperclip,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";

import api from "../../services/api";

import {
  careerService,
  CareerApiError,
  type Career,
  type CareerInput,
  type CareerStatus,
  type CareerSummary,
} from "../../services/careers/career";

import { useAuth } from "../../context/AuthContext";
import { hasUserPermission } from "../../services/auth.service";

/* =========================================================
   SOLAR TRADE HUB — CAREERS MANAGEMENT

   Route: /careers

   FEATURES
   - Real dashboard job statistics
   - Real application counts
   - Job listing, search and pagination
   - Create / edit / delete vacancies
   - Email / online application settings
   - Publishing controls
   - Salary and deadline management
   - Navigation to Applications and Pipeline
   - Recruitment permission checks

   Backend:
   /api/v1/careers

   IMPORTANT:
   CV/Resume attachment is mandatory for online
   applications, but the corresponding upload
   enforcement must also be implemented in the
   backend application endpoint.
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type ApplicationMethod = "email" | "online";

type SalaryPeriod =
  | "monthly"
  | "yearly"
  | "hourly"
  | "project";

type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary";

type WorkMode =
  | "onsite"
  | "hybrid"
  | "remote";

type ExperienceLevel =
  | "intern"
  | "entry"
  | "mid"
  | "senior"
  | "lead";

type CareerForm = {
  title: string;
  department: string;
  description: string;

  responsibilities: string;
  requirements: string;
  benefits: string;

  employmentType: EmploymentType;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;

  city: string;
  province: string;
  country: string;

  applicationMethod: ApplicationMethod;
  applicationEmail: string;
  onlineApplicationsEnabled: boolean;

  applicationDeadline: string;

  salaryMin: string;
  salaryMax: string;
  salaryCurrency: "PKR" | "USD";
  salaryPeriod: SalaryPeriod;
  salaryPublic: boolean;

  status: CareerStatus;
  sortOrder: string;
};

/*
   These fields are supported by the updated
   backend Career model. Keep this local extension
   until career.ts service types are updated.
*/

type RecruitmentCareer = Career & {
  applicationMethod?: ApplicationMethod;
  onlineApplicationsEnabled?: boolean;
};

type ApplicationCount = {
  total: number;
  new: number;
  reviewing: number;
  shortlisted: number;
  interview: number;
  offered: number;
  hired: number;
  rejected: number;
  withdrawn: number;
};

type ApplicationSummaryResponse = {
  success: boolean;
  data?: {
    overall?: Partial<ApplicationCount>;
    byCareer?: Record<
      string,
      Partial<ApplicationCount>
    >;
  };
  message?: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_SUMMARY: CareerSummary = {
  total: 0,
  draft: 0,
  open: 0,
  closed: 0,
  archived: 0,
};

const EMPTY_APPLICATION_COUNTS: ApplicationCount = {
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

const EMPTY_FORM: CareerForm = {
  title: "",
  department: "",
  description: "",

  responsibilities: "",
  requirements: "",
  benefits: "",

  employmentType: "full_time",
  workMode: "onsite",
  experienceLevel: "entry",

  city: "",
  province: "",
  country: "Pakistan",

  applicationMethod: "online",
  applicationEmail: "",
  onlineApplicationsEnabled: true,

  applicationDeadline: "",

  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "PKR",
  salaryPeriod: "monthly",
  salaryPublic: false,

  status: "draft",
  sortOrder: "0",
};

const STATUSES: CareerStatus[] = [
  "draft",
  "open",
  "closed",
  "archived",
];

const EMPLOYMENT_OPTIONS: {
  value: EmploymentType;
  label: string;
}[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
];

const WORK_MODE_OPTIONS: {
  value: WorkMode;
  label: string;
}[] = [
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

const EXPERIENCE_OPTIONS: {
  value: ExperienceLevel;
  label: string;
}[] = [
  { value: "intern", label: "Intern" },
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "lead", label: "Lead" },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white " +
  "px-3 py-2.5 text-sm text-gray-900 outline-none " +
  "transition focus:border-[#5b2eff] focus:ring-2 " +
  "focus:ring-[#5b2eff]/10 " +
  "dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const buttonClass =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-xl px-4 py-2.5 text-sm font-semibold " +
  "transition disabled:cursor-not-allowed " +
  "disabled:opacity-50";

const labelClass =
  "mb-1.5 block text-sm font-medium " +
  "text-gray-700 dark:text-gray-300";

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value?: string | null): string {
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

function toDateInput(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Karachi",
  }).format(date);
}

function splitLines(value: string): string[] {
  return [
    ...new Set(
      value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof CareerApiError) {
    const validation = error.errors
      .map(
        (item) =>
          `${item.field}: ${item.message}`
      )
      .join(" ");

    return validation || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getApplicationMethod(
  career: RecruitmentCareer
): ApplicationMethod {
  return career.applicationMethod === "online"
    ? "online"
    : "email";
}

function careerToForm(
  career: RecruitmentCareer
): CareerForm {
  const applicationMethod =
    getApplicationMethod(career);

  return {
    title: career.title || "",
    department: career.department || "",
    description: career.description || "",

    responsibilities:
      career.responsibilities?.join("\n") || "",

    requirements:
      career.requirements?.join("\n") || "",

    benefits:
      career.benefits?.join("\n") || "",

    employmentType:
      (career.employmentType as EmploymentType) ||
      "full_time",

    workMode:
      (career.workMode as WorkMode) ||
      "onsite",

    experienceLevel:
      (career.experienceLevel as ExperienceLevel) ||
      "entry",

    city: career.city || "",
    province: career.province || "",
    country: career.country || "Pakistan",

    applicationMethod,
    applicationEmail:
      career.applicationEmail || "",

    onlineApplicationsEnabled:
      applicationMethod === "online" &&
      career.onlineApplicationsEnabled === true,

    applicationDeadline: toDateInput(
      career.applicationDeadline
    ),

    salaryMin:
      career.salary?.min == null
        ? ""
        : String(career.salary.min),

    salaryMax:
      career.salary?.max == null
        ? ""
        : String(career.salary.max),

    salaryCurrency:
      career.salary?.currency === "USD"
        ? "USD"
        : "PKR",

    salaryPeriod:
      career.salary?.period || "monthly",

    salaryPublic:
      career.salary?.isPublic === true,

    status: career.status,
    sortOrder: String(career.sortOrder ?? 0),
  };
}

function buildPayload(form: CareerForm): CareerInput {
  const online =
    form.applicationMethod === "online";

  const payload: CareerInput = {
    title: form.title.trim(),
    department: form.department.trim(),
    description: form.description.trim(),

    responsibilities: splitLines(
      form.responsibilities
    ),

    requirements: splitLines(
      form.requirements
    ),

    benefits: splitLines(
      form.benefits
    ),

    employmentType: form.employmentType,
    workMode: form.workMode,
    experienceLevel: form.experienceLevel,

    city: form.city.trim(),
    province: form.province.trim(),
    country:
      form.country.trim() || "Pakistan",

    applicationMethod:
      form.applicationMethod,

    applicationEmail: online
      ? ""
      : form.applicationEmail.trim().toLowerCase(),

    onlineApplicationsEnabled: online,

    applicationDeadline:
      form.applicationDeadline
        ? `${form.applicationDeadline}T23:59:59+05:00`
        : null,

    status: form.status,

    sortOrder: Number(
      form.sortOrder || 0
    ),
  } as CareerInput;

  const min =
    form.salaryMin.trim() === ""
      ? null
      : Number(form.salaryMin);

  const max =
    form.salaryMax.trim() === ""
      ? null
      : Number(form.salaryMax);

  payload.salary = {
    min,
    max,
    currency: form.salaryCurrency,
    period: form.salaryPeriod,
    isPublic: form.salaryPublic,
  };

  return payload;
}

function statusStyle(status: CareerStatus): string {
  switch (status) {
    case "open":
      return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";

    case "draft":
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

    case "closed":
      return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";

    case "archived":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className={labelClass}>
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Careers() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const canManage =
    isAdmin ||
    hasUserPermission(user, "careers.manage");

  const [careers, setCareers] =
    useState<RecruitmentCareer[]>([]);

  const [summary, setSummary] =
    useState<CareerSummary>(EMPTY_SUMMARY);

  const [
    applicationCounts,
    setApplicationCounts,
  ] = useState<
    Record<string, Partial<ApplicationCount>>
  >({});

  const [
    overallApplications,
    setOverallApplications,
  ] = useState<ApplicationCount>(
    EMPTY_APPLICATION_COUNTS
  );

  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchInput, setSearchInput] =
    useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<CareerStatus | "">("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] =
    useState(1);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCareer, setEditingCareer] =
    useState<RecruitmentCareer | null>(null);

  const [form, setForm] =
    useState<CareerForm>({ ...EMPTY_FORM });

  const [deleteTarget, setDeleteTarget] =
    useState<RecruitmentCareer | null>(null);

  const [viewTarget, setViewTarget] =
    useState<RecruitmentCareer | null>(null);

  /* =======================================================
     FETCH JOBS AND REAL APPLICATION COUNTS
  ======================================================= */

  const loadCareers = useCallback(async () => {
    setLoading(true);
    setCountsLoading(true);
    setError("");

    const jobsRequest = Promise.all([
      careerService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
      careerService.getSummary(),
    ]);

    const countsRequest =
      api.get<ApplicationSummaryResponse>(
        "/careers/applications/summary"
      );

    const [jobsOutcome, countsOutcome] =
      await Promise.allSettled([
        jobsRequest,
        countsRequest,
      ]);

    if (jobsOutcome.status === "fulfilled") {
      const [listResult, summaryResult] =
        jobsOutcome.value;

      setCareers(
        (listResult.careers || []) as
          RecruitmentCareer[]
      );

      setSummary(summaryResult);

      setTotal(listResult.pagination.total);

      setTotalPages(
        Math.max(
          1,
          listResult.pagination.totalPages
        )
      );
    } else {
      setError(
        getErrorMessage(jobsOutcome.reason)
      );
      setCareers([]);
      setSummary(EMPTY_SUMMARY);
      setTotal(0);
      setTotalPages(1);
    }

    if (countsOutcome.status === "fulfilled") {
      const result =
        countsOutcome.value.data;

      if (
        result.success &&
        result.data
      ) {
        setApplicationCounts(
          result.data.byCareer || {}
        );

        setOverallApplications({
          ...EMPTY_APPLICATION_COUNTS,
          ...(result.data.overall || {}),
        });
      } else {
        setApplicationCounts({});
        setOverallApplications(
          EMPTY_APPLICATION_COUNTS
        );
      }
    } else {
      setApplicationCounts({});
      setOverallApplications(
        EMPTY_APPLICATION_COUNTS
      );
    }

    setLoading(false);
    setCountsLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    void loadCareers();
  }, [loadCareers]);

  /* =======================================================
     SEARCH
  ======================================================= */

  function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  /* =======================================================
     FORM STATE
  ======================================================= */

  function updateField<K extends keyof CareerForm>(
    key: K,
    value: CareerForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function openCreate() {
    if (!canManage) return;

    setEditingCareer(null);
    setForm({ ...EMPTY_FORM });

    setModalError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEdit(
    career: RecruitmentCareer
  ) {
    if (!canManage) return;

    setEditingCareer(career);
    setForm(careerToForm(career));

    setModalError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingCareer(null);
    setForm({ ...EMPTY_FORM });
    setModalError("");
  }

  function changeApplicationMethod(
    method: ApplicationMethod
  ) {
    setForm((previous) => ({
      ...previous,
      applicationMethod: method,
      onlineApplicationsEnabled:
        method === "online",
    }));
  }

  /* =======================================================
     FORM VALIDATION
  ======================================================= */

  function validateForm(): string | null {
    if (!form.title.trim()) {
      return "Job title is required.";
    }

    if (!form.description.trim()) {
      return "Job description is required.";
    }

    if (
      form.applicationMethod === "online" &&
      !form.onlineApplicationsEnabled
    ) {
      return "Online applications must be enabled.";
    }

    if (
      form.applicationMethod === "email" &&
      form.status === "open" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.applicationEmail.trim()
      )
    ) {
      return "Enter a valid application email before publishing this vacancy.";
    }

    if (
      form.salaryPublic &&
      (
        form.salaryMin.trim() === "" ||
        form.salaryMax.trim() === ""
      )
    ) {
      return "Public salary requires minimum and maximum values.";
    }

    const salaryMin =
      form.salaryMin.trim() === ""
        ? null
        : Number(form.salaryMin);

    const salaryMax =
      form.salaryMax.trim() === ""
        ? null
        : Number(form.salaryMax);

    if (
      (salaryMin !== null &&
        (!Number.isFinite(salaryMin) ||
          salaryMin < 0)) ||
      (salaryMax !== null &&
        (!Number.isFinite(salaryMax) ||
          salaryMax < 0))
    ) {
      return "Salary amounts must be valid positive numbers.";
    }

    if (
      salaryMin !== null &&
      salaryMax !== null &&
      salaryMax < salaryMin
    ) {
      return "Maximum salary cannot be less than minimum salary.";
    }

    if (
      form.sortOrder.trim() === "" ||
      !Number.isSafeInteger(
        Number(form.sortOrder)
      ) ||
      Number(form.sortOrder) < 0
    ) {
      return "Sort order must be a non-negative integer.";
    }

    if (
      form.status === "open" &&
      form.applicationDeadline
    ) {
      const deadline = new Date(
        `${form.applicationDeadline}T23:59:59+05:00`
      );

      if (
        Number.isNaN(deadline.getTime()) ||
        deadline <= new Date()
      ) {
        return "Application deadline must be in the future.";
      }
    }

    return null;
  }

  /* =======================================================
     CREATE / UPDATE
  ======================================================= */

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canManage || saving) return;

    const validationError =
      validateForm();

    if (validationError) {
      setModalError(validationError);
      return;
    }

    const payload = buildPayload(form);

    setSaving(true);
    setModalError("");
    setError("");
    setSuccess("");

    try {
      if (editingCareer) {
        const {
          status: _status,
          ...details
        } = payload;

        await careerService.update(
          editingCareer.careerId,
          details
        );

        if (
          form.status !== editingCareer.status
        ) {
          await careerService.updateStatus(
            editingCareer.careerId,
            form.status
          );
        }

        setSuccess(
          "Career opportunity updated successfully."
        );
      } else {
        await careerService.create(payload);

        setSuccess(
          "Career opportunity created successfully."
        );
      }

      setModalOpen(false);
      setEditingCareer(null);
      setForm({ ...EMPTY_FORM });

      await loadCareers();
    } catch (err) {
      setModalError(
        getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     CHANGE PUBLICATION STATUS
  ======================================================= */

  async function handleStatusChange(
    career: RecruitmentCareer,
    status: CareerStatus
  ) {
    if (
      !canManage ||
      saving ||
      status === career.status
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await careerService.updateStatus(
        career.careerId,
        status
      );

      setSuccess(
        `Career status changed to ${formatLabel(
          status
        )}.`
      );

      await loadCareers();
    } catch (err) {
      setError(
        getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function handleDelete() {
    if (
      !deleteTarget ||
      !canManage ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await careerService.delete(
        deleteTarget.careerId
      );

      setSuccess(
        "Career opportunity deleted successfully."
      );

      setDeleteTarget(null);

      if (
        careers.length === 1 &&
        page > 1
      ) {
        setPage(
          (previous) => previous - 1
        );
      } else {
        await loadCareers();
      }
    } catch (err) {
      setError(
        getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     SUMMARY CARDS
  ======================================================= */

  const cards = [
    {
      label: "Total Jobs",
      value: summary.total,
      icon: BriefcaseBusiness,
      color: "text-[#5b2eff]",
      background: "bg-[#5b2eff]/10",
    },
    {
      label: "Open Positions",
      value: summary.open,
      icon: CheckCircle2,
      color: "text-green-600",
      background:
        "bg-green-50 dark:bg-green-500/10",
    },
    {
      label: "Draft Jobs",
      value: summary.draft,
      icon: FileText,
      color: "text-amber-600",
      background:
        "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Closed Positions",
      value: summary.closed,
      icon: Clock3,
      color: "text-red-600",
      background:
        "bg-red-50 dark:bg-red-500/10",
    },
    {
      label: "Archived Jobs",
      value: summary.archived,
      icon: Archive,
      color: "text-gray-600",
      background:
        "bg-gray-100 dark:bg-gray-800",
    },
    {
      label: "Applications",
      value: overallApplications.total,
      icon: Users,
      color: "text-blue-600",
      background:
        "bg-blue-50 dark:bg-blue-500/10",
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
            <span className="text-[#5b2eff]">
              Careers
            </span>
            <span>/</span>
            <span>Job Openings</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Careers Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage recruitment vacancies, applicants
            and publishing settings.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadCareers()}
            disabled={loading}
            className={`${buttonClass} border border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200`}
          >
            <RefreshCw
              size={16}
              className={
                loading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>

          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className={`${buttonClass} bg-[#5b2eff] text-white hover:bg-[#4924d5]`}
            >
              <Plus size={17} />
              Add Career
            </button>
          )}
        </div>
      </div>

      {/* RECRUITMENT NAVIGATION */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          to="/careers"
          className="flex items-center gap-3 rounded-2xl border border-[#5b2eff]/30 bg-[#5b2eff]/5 p-4 text-[#5b2eff] transition hover:bg-[#5b2eff]/10 dark:bg-[#5b2eff]/10"
        >
          <BriefcaseBusiness size={20} />
          <span className="flex-1 text-sm font-semibold">
            Job Openings
          </span>
          <ArrowRight size={16} />
        </Link>

        <Link
          to="/careers/applications"
          className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-gray-700 transition hover:border-[#5b2eff]/30 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
        >
          <Users size={20} />
          <span className="flex-1 text-sm font-semibold">
            Applications
          </span>
          <ArrowRight size={16} />
        </Link>

        <Link
          to="/careers/pipeline"
          className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-gray-700 transition hover:border-[#5b2eff]/30 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
        >
          <GitBranch size={20} />
          <span className="flex-1 text-sm font-semibold">
            Candidate Pipeline
          </span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* GLOBAL MESSAGES */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
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
          className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400"
        >
          <span>{success}</span>

          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccess("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;

          const cardLoading =
            card.label === "Applications"
              ? countsLoading
              : loading;

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

              <p className="mt-5 text-sm font-medium text-gray-500">
                {card.label}
              </p>

              <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {cardLoading ? "..." : card.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* RECRUITMENT POLICY */}

      <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/20 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#5b2eff] dark:bg-gray-900">
          <ShieldCheck size={21} />
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            Online Recruitment Policy
          </p>

          <p className="mt-1 text-xs leading-6 text-gray-600 dark:text-gray-400">
            All online candidate applications must
            include a CV or resume attachment.
            Allowed formats: PDF, DOC and DOCX.
            Maximum file size: 5 MB.
          </p>

          <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            Backend file upload and required-file
            enforcement are still pending.
            Do not open online applications to the
            public until those checks are deployed.
          </p>
        </div>

        <Paperclip
          size={19}
          className="text-[#5b2eff]"
        />
      </div>

      {/* VACANCIES TABLE */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        {/* TABLE HEADER */}

        <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Career Opportunities
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {total} vacancies matching current filters
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <form
              onSubmit={handleSearch}
              className="relative"
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
                placeholder="Search careers..."
                className={`${inputClass} pl-10 sm:w-64`}
              />

              <button
                type="submit"
                className="sr-only"
              >
                Search
              </button>
            </form>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as
                    | CareerStatus
                    | ""
                );
                setPage(1);
              }}
              className={inputClass}
              aria-label="Filter careers by status"
            >
              <option value="">
                All Statuses
              </option>

              {STATUSES.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/50">
              <tr>
                {[
                  "Career",
                  "Department",
                  "Location",
                  "Application Type",
                  "Applicants",
                  "Deadline",
                  "Status",
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
                    colSpan={8}
                    className="py-16 text-center"
                  >
                    <Loader2
                      size={28}
                      className="mx-auto animate-spin text-[#5b2eff]"
                    />

                    <p className="mt-3 text-sm text-gray-500">
                      Loading career opportunities...
                    </p>
                  </td>
                </tr>
              ) : careers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center"
                  >
                    <BriefcaseBusiness
                      size={36}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200">
                      No careers found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Create a new vacancy or change
                      your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                careers.map((career) => {
                  const method =
                    getApplicationMethod(career);

                  const applicationCount =
                    applicationCounts[
                      career.careerId
                    ]?.total ?? 0;

                  return (
                    <tr
                      key={career.careerId}
                      className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {career.title}
                        </div>

                        <div className="mt-1 font-mono text-xs text-gray-500">
                          {career.careerId}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {career.department || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <MapPin size={14} />
                          {career.city || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            method === "online"
                              ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                          }`}
                        >
                          {method === "online" ? (
                            <Globe2 size={13} />
                          ) : (
                            <Mail size={13} />
                          )}

                          {method === "online"
                            ? "Online"
                            : "Email"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/careers/applications?careerId=${encodeURIComponent(
                                career.careerId
                              )}`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-[#5b2eff] hover:bg-[#5b2eff]/10"
                        >
                          <Users size={16} />

                          {countsLoading
                            ? "..."
                            : applicationCount}

                          <ArrowRight size={14} />
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <CalendarDays size={14} />
                          {formatDate(
                            career.applicationDeadline
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(
                            career.status
                          )}`}
                        >
                          {career.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="View career"
                            aria-label={`View ${career.title}`}
                            onClick={() =>
                              setViewTarget(career)
                            }
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Eye size={17} />
                          </button>

                          {canManage && (
                            <>
                              <button
                                type="button"
                                title="Edit career"
                                aria-label={`Edit ${career.title}`}
                                onClick={() =>
                                  openEdit(career)
                                }
                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                              >
                                <Pencil size={17} />
                              </button>

                              <select
                                disabled={saving}
                                value={career.status}
                                aria-label={`Change status of ${career.title}`}
                                onChange={(event) =>
                                  void handleStatusChange(
                                    career,
                                    event.target.value as CareerStatus
                                  )
                                }
                                className="max-w-28 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs dark:border-gray-700 dark:bg-gray-900"
                              >
                                {STATUSES.map(
                                  (status) => (
                                    <option
                                      key={status}
                                      value={status}
                                    >
                                      {formatLabel(
                                        status
                                      )}
                                    </option>
                                  )
                                )}
                              </select>

                              <button
                                type="button"
                                title="Delete career"
                                aria-label={`Delete ${career.title}`}
                                onClick={() =>
                                  setDeleteTarget(career)
                                }
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          )}
                        </div>
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
            Page {page} of {totalPages} ·{" "}
            {total} results
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage(
                  (previous) => previous - 1
                )
              }
              className={`${buttonClass} border border-gray-200 dark:border-gray-700`}
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                page >= totalPages || loading
              }
              onClick={() =>
                setPage(
                  (previous) => previous + 1
                )
              }
              className={`${buttonClass} border border-gray-200 dark:border-gray-700`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}

      {modalOpen && canManage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              editingCareer
                ? "Edit career"
                : "Create new career"
            }
            className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 p-5 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingCareer
                    ? "Edit Career"
                    : "Create New Career"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Complete the job information and
                  recruitment configuration.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={(event) =>
                void handleSave(event)
              }
              className="overflow-y-auto p-6"
            >
              <div className="space-y-7">

                {/* BASIC DETAILS */}

                <section>
                  <div className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                    <Building2
                      size={19}
                      className="text-[#5b2eff]"
                    />

                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Job Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      label="Job Title"
                      required
                    >
                      <input
                        required
                        maxLength={200}
                        value={form.title}
                        onChange={(event) =>
                          updateField(
                            "title",
                            event.target.value
                          )
                        }
                        className={inputClass}
                        placeholder="Solar Project Engineer"
                      />
                    </FormField>

                    <FormField label="Department">
                      <input
                        maxLength={160}
                        value={form.department}
                        onChange={(event) =>
                          updateField(
                            "department",
                            event.target.value
                          )
                        }
                        className={inputClass}
                        placeholder="Engineering"
                      />
                    </FormField>

                    <div className="md:col-span-2">
                      <FormField
                        label="Job Description"
                        required
                      >
                        <textarea
                          required
                          rows={5}
                          maxLength={10000}
                          value={form.description}
                          onChange={(event) =>
                            updateField(
                              "description",
                              event.target.value
                            )
                          }
                          className={inputClass}
                          placeholder="Describe the position, team, responsibilities and expectations..."
                        />
                      </FormField>
                    </div>

                    {(
                      [
                        [
                          "responsibilities",
                          "Responsibilities",
                        ],
                        [
                          "requirements",
                          "Requirements",
                        ],
                        [
                          "benefits",
                          "Benefits",
                        ],
                      ] as const
                    ).map(([key, label]) => (
                      <div
                        key={key}
                        className="md:col-span-2"
                      >
                        <FormField
                          label={label}
                          hint="Enter one item per line."
                        >
                          <textarea
                            rows={4}
                            value={form[key]}
                            onChange={(event) =>
                              updateField(
                                key,
                                event.target.value
                              )
                            }
                            className={inputClass}
                            placeholder="One item per line"
                          />
                        </FormField>
                      </div>
                    ))}

                    <FormField label="Employment Type">
                      <select
                        value={form.employmentType}
                        onChange={(event) =>
                          updateField(
                            "employmentType",
                            event.target.value as EmploymentType
                          )
                        }
                        className={inputClass}
                      >
                        {EMPLOYMENT_OPTIONS.map(
                          (option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField label="Work Mode">
                      <select
                        value={form.workMode}
                        onChange={(event) =>
                          updateField(
                            "workMode",
                            event.target.value as WorkMode
                          )
                        }
                        className={inputClass}
                      >
                        {WORK_MODE_OPTIONS.map(
                          (option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField label="Experience Level">
                      <select
                        value={form.experienceLevel}
                        onChange={(event) =>
                          updateField(
                            "experienceLevel",
                            event.target.value as ExperienceLevel
                          )
                        }
                        className={inputClass}
                      >
                        {EXPERIENCE_OPTIONS.map(
                          (option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField label="City">
                      <input
                        maxLength={120}
                        value={form.city}
                        onChange={(event) =>
                          updateField(
                            "city",
                            event.target.value
                          )
                        }
                        className={inputClass}
                        placeholder="Lahore"
                      />
                    </FormField>

                    <FormField label="Province">
                      <input
                        maxLength={120}
                        value={form.province}
                        onChange={(event) =>
                          updateField(
                            "province",
                            event.target.value
                          )
                        }
                        className={inputClass}
                        placeholder="Punjab"
                      />
                    </FormField>

                    <FormField label="Country">
                      <input
                        maxLength={120}
                        value={form.country}
                        onChange={(event) =>
                          updateField(
                            "country",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </FormField>
                  </div>
                </section>

                {/* APPLICATION SETTINGS */}

                <section>
                  <div className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                    <Users
                      size={19}
                      className="text-[#5b2eff]"
                    />

                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Recruitment Settings
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    <div className="md:col-span-2">
                      <FormField
                        label="Application Method"
                        required
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() =>
                              changeApplicationMethod(
                                "online"
                              )
                            }
                            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                              form.applicationMethod ===
                              "online"
                                ? "border-[#5b2eff] bg-[#5b2eff]/5"
                                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                            }`}
                          >
                            <Globe2
                              size={21}
                              className="text-[#5b2eff]"
                            />

                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                Online Application
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Website form and candidate
                                tracking
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              changeApplicationMethod(
                                "email"
                              )
                            }
                            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                              form.applicationMethod ===
                              "email"
                                ? "border-[#5b2eff] bg-[#5b2eff]/5"
                                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                            }`}
                          >
                            <Mail
                              size={21}
                              className="text-[#5b2eff]"
                            />

                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                Email Application
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Applicant contacts the
                                recruitment email
                              </p>
                            </div>
                          </button>
                        </div>
                      </FormField>
                    </div>

                    {form.applicationMethod ===
                    "email" ? (
                      <div className="md:col-span-2">
                        <FormField
                          label="Application Email"
                          required={
                            form.status === "open"
                          }
                        >
                          <input
                            type="email"
                            maxLength={254}
                            required={
                              form.status === "open"
                            }
                            value={
                              form.applicationEmail
                            }
                            onChange={(event) =>
                              updateField(
                                "applicationEmail",
                                event.target.value
                              )
                            }
                            className={inputClass}
                            placeholder="recruitment@yourdomain.com"
                          />
                        </FormField>

                        <p className="mt-2 text-xs text-gray-500">
                          Email applications are not
                          automatically recorded as
                          dashboard applicants.
                        </p>
                      </div>
                    ) : (
                      <div className="md:col-span-2">
                        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
                          <div className="flex gap-3">
                            <Paperclip
                              size={21}
                              className="shrink-0 text-[#5b2eff]"
                            />

                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                Mandatory Candidate CV
                              </p>

                              <p className="mt-1 text-xs leading-6 text-gray-600 dark:text-gray-400">
                                Candidates must attach a
                                PDF, DOC or DOCX resume,
                                maximum 5 MB, before an
                                application is accepted.
                              </p>

                              <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                Server-side attachment
                                enforcement must be added
                                before public applications
                                are activated.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <FormField label="Application Deadline">
                      <input
                        type="date"
                        value={
                          form.applicationDeadline
                        }
                        onChange={(event) =>
                          updateField(
                            "applicationDeadline",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Career Status">
                      <select
                        value={form.status}
                        onChange={(event) =>
                          updateField(
                            "status",
                            event.target.value as CareerStatus
                          )
                        }
                        className={inputClass}
                      >
                        {STATUSES.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {formatLabel(status)}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </section>

                {/* SALARY */}

                <section>
                  <div className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                    <FileText
                      size={19}
                      className="text-[#5b2eff]"
                    />

                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Salary & Display
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField label="Minimum Salary">
                      <input
                        type="number"
                        min="0"
                        value={form.salaryMin}
                        onChange={(event) =>
                          updateField(
                            "salaryMin",
                            event.target.value
                          )
                        }
                        className={inputClass}
                        placeholder="50000"
                      />
                    </FormField>

                    <FormField label="Maximum Salary">
                      <input
                        type="number"
                        min="0"
                        value={form.salaryMax}
                        onChange={(event) =>
                          updateField(
                            "salaryMax",
                            event.target.value
                          )
                        }
                        className={inputClass}
                        placeholder="100000"
                      />
                    </FormField>

                    <FormField label="Salary Currency">
                      <select
                        value={form.salaryCurrency}
                        onChange={(event) =>
                          updateField(
                            "salaryCurrency",
                            event.target.value as
                              | "PKR"
                              | "USD"
                          )
                        }
                        className={inputClass}
                      >
                        <option value="PKR">
                          PKR
                        </option>
                        <option value="USD">
                          USD
                        </option>
                      </select>
                    </FormField>

                    <FormField label="Salary Period">
                      <select
                        value={form.salaryPeriod}
                        onChange={(event) =>
                          updateField(
                            "salaryPeriod",
                            event.target.value as SalaryPeriod
                          )
                        }
                        className={inputClass}
                      >
                        <option value="monthly">
                          Monthly
                        </option>
                        <option value="yearly">
                          Yearly
                        </option>
                        <option value="hourly">
                          Hourly
                        </option>
                        <option value="project">
                          Project
                        </option>
                      </select>
                    </FormField>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="salaryPublic"
                        checked={form.salaryPublic}
                        onChange={(event) =>
                          updateField(
                            "salaryPublic",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 accent-[#5b2eff]"
                      />

                      <label
                        htmlFor="salaryPublic"
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        Display salary publicly
                      </label>
                    </div>

                    <FormField label="Sort Order">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.sortOrder}
                        onChange={(event) =>
                          updateField(
                            "sortOrder",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </FormField>
                  </div>
                </section>
              </div>

              {modalError && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertCircle
                    size={18}
                    className="shrink-0"
                  />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="mt-7 flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className={`${buttonClass} border border-gray-200 dark:border-gray-700`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={`${buttonClass} bg-[#5b2eff] text-white hover:bg-[#4924d5]`}
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingCareer
                    ? "Save Changes"
                    : "Create Career"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW CAREER MODAL */}

      {viewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {viewTarget.title}
                </h2>

                <p className="mt-1 font-mono text-xs text-gray-500">
                  {viewTarget.careerId}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewTarget(null)
                }
                aria-label="Close career details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <strong>Department:</strong>{" "}
                {viewTarget.department || "—"}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {[
                  viewTarget.city,
                  viewTarget.province,
                  viewTarget.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {formatLabel(viewTarget.status)}
              </p>

              <p>
                <strong>Application Method:</strong>{" "}
                {getApplicationMethod(viewTarget) ===
                "online"
                  ? "Online Form"
                  : "Email"}
              </p>

              {getApplicationMethod(viewTarget) ===
                "email" && (
                <p>
                  <strong>Application Email:</strong>{" "}
                  {viewTarget.applicationEmail || "—"}
                </p>
              )}

              <p>
                <strong>Recorded Applicants:</strong>{" "}
                {countsLoading
                  ? "Loading..."
                  : applicationCounts[
                      viewTarget.careerId
                    ]?.total ?? 0}
              </p>

              <p>
                <strong>Deadline:</strong>{" "}
                {formatDate(
                  viewTarget.applicationDeadline
                )}
              </p>

              <div>
                <h3 className="font-semibold">
                  Description
                </h3>

                <p className="mt-2 whitespace-pre-wrap">
                  {viewTarget.description}
                </p>
              </div>

              {(
                [
                  [
                    "Responsibilities",
                    viewTarget.responsibilities,
                  ],
                  [
                    "Requirements",
                    viewTarget.requirements,
                  ],
                  [
                    "Benefits",
                    viewTarget.benefits,
                  ],
                ] as const
              ).map(([heading, items]) =>
                items?.length ? (
                  <div key={heading}>
                    <h3 className="font-semibold">
                      {heading}
                    </h3>

                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {items.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ) : null
              )}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/careers/applications?careerId=${encodeURIComponent(
                      viewTarget.careerId
                    )}`
                  )
                }
                className={`${buttonClass} bg-[#5b2eff] text-white`}
              >
                View Applications
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {deleteTarget && canManage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10">
              <Trash2 size={23} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Delete Career?
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to permanently
              delete{" "}
              <strong>{deleteTarget.title}</strong>?
              This action cannot be undone.
            </p>

            <p className="mt-3 text-xs text-gray-500">
              Jobs containing candidate applications
              cannot be deleted. Archive them to
              preserve recruitment history.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setDeleteTarget(null)
                }
                className={`${buttonClass} border border-gray-200 dark:border-gray-700`}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void handleDelete()
                }
                className={`${buttonClass} bg-red-600 text-white hover:bg-red-700`}
              >
                {saving
                  ? "Deleting..."
                  : "Delete Career"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
