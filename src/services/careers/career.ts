
import axios from "axios";
import api from "../api";

/* =========================================================
   SOLAR TRADE HUB — CAREERS SERVICE

   File:
   src/services/careers/career.ts

   Backend:
   /api/v1/careers

   FEATURES
   - Career CRUD
   - Email / Online job configuration
   - Career statistics
   - Candidate application listing
   - Application statistics
   - Candidate recruitment statuses
   - Recruiter notes
   - Interview scheduling
   - CV / Resume metadata
   - Authenticated PDF/DOC/DOCX download

   Uses existing Axios API authentication,
   base URL, cookies and interceptors.
========================================================= */

/* =========================================================
   CAREER TYPES
========================================================= */

export type CareerStatus =
  | "draft"
  | "open"
  | "closed"
  | "archived";

export type CareerApplicationMethod =
  | "email"
  | "online";

export type CareerEmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary";

export type CareerWorkMode =
  | "onsite"
  | "hybrid"
  | "remote";

export type CareerExperienceLevel =
  | "intern"
  | "entry"
  | "mid"
  | "senior"
  | "lead";

export type CareerCurrency =
  | "PKR"
  | "USD";

export type CareerSalaryPeriod =
  | "monthly"
  | "yearly"
  | "hourly"
  | "project";

/* =========================================================
   SALARY
========================================================= */

export interface CareerSalary {
  min?: number | null;
  max?: number | null;

  currency?: CareerCurrency;
  period?: CareerSalaryPeriod;

  isPublic?: boolean;
}

/* =========================================================
   CAREER DOCUMENT
========================================================= */

export interface Career {
  _id?: string;
  id?: string;

  careerId: string;

  title: string;
  description: string;
  department?: string;

  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];

  employmentType?: CareerEmploymentType;
  workMode?: CareerWorkMode;
  experienceLevel?: CareerExperienceLevel;

  city?: string;
  province?: string;
  country?: string;

  salary?: CareerSalary;

  applicationMethod?: CareerApplicationMethod;
  applicationEmail?: string;
  onlineApplicationsEnabled?: boolean;
  applicationDeadline?: string | null;

  status: CareerStatus;
  publishedAt?: string | null;

  sortOrder?: number;

  createdAt?: string;
  updatedAt?: string;

  createdBy?: string | null;
  updatedBy?: string | null;
}

/* =========================================================
   CREATE / UPDATE INPUT
========================================================= */

export interface CareerInput {
  title: string;
  description: string;
  department?: string;

  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];

  employmentType?: CareerEmploymentType;
  workMode?: CareerWorkMode;
  experienceLevel?: CareerExperienceLevel;

  city?: string;
  province?: string;
  country?: string;

  salary?: CareerSalary;

  applicationMethod?: CareerApplicationMethod;
  applicationEmail?: string;
  onlineApplicationsEnabled?: boolean;
  applicationDeadline?: string | null;

  status?: CareerStatus;
  sortOrder?: number;
}

export type UpdateCareerInput =
  Partial<CareerInput>;

/* =========================================================
   CAREER SUMMARY
========================================================= */

export interface CareerSummary {
  total: number;
  draft: number;
  open: number;
  closed: number;
  archived: number;
}

/* =========================================================
   PAGINATION
========================================================= */

export interface CareerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/* =========================================================
   DASHBOARD CAREER LIST
========================================================= */

export interface CareerListResult {
  careers: Career[];
  pagination: CareerPagination;
}

export interface CareerListQuery {
  page?: number;
  limit?: number;
  search?: string;

  status?: CareerStatus;

  employmentType?: CareerEmploymentType;
  workMode?: CareerWorkMode;
  experienceLevel?: CareerExperienceLevel;

  city?: string;
  department?: string;

  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "publishedAt"
    | "applicationDeadline"
    | "title"
    | "city"
    | "department"
    | "status"
    | "sortOrder";

  sortOrder?: "asc" | "desc";
}

/* =========================================================
   PUBLIC CAREER
========================================================= */

export interface PublicCareer {
  careerId: string;

  title: string;
  description: string;
  department?: string;

  responsibilities: string[];
  requirements: string[];
  benefits: string[];

  employmentType?: CareerEmploymentType;
  workMode?: CareerWorkMode;
  experienceLevel?: CareerExperienceLevel;

  city: string;
  province: string;
  country: string;

  salary:
    | Omit<CareerSalary, "isPublic">
    | null;

  applicationMethod: CareerApplicationMethod;
  applicationEmail: string;

  onlineApplicationsEnabled?: boolean;

  applicationDeadline: string | null;
  publishedAt: string | null;

  status: "open";
}

export interface PublicCareerListQuery {
  page?: number;
  limit?: number;
  search?: string;

  city?: string;
  department?: string;

  employmentType?: CareerEmploymentType;
  workMode?: CareerWorkMode;

  sortBy?:
    | "publishedAt"
    | "createdAt"
    | "applicationDeadline"
    | "title";

  sortOrder?: "asc" | "desc";
}

export interface PublicCareerListResult {
  careers: PublicCareer[];
  pagination: CareerPagination;
}

/* =========================================================
   APPLICATION STATUSES
========================================================= */

export type CareerApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn";

export const CAREER_APPLICATION_STATUSES:
  CareerApplicationStatus[] = [
    "new",
    "reviewing",
    "shortlisted",
    "interview",
    "offered",
    "hired",
    "rejected",
    "withdrawn",
  ];

/* =========================================================
   APPLICATION COUNTS
========================================================= */

export interface CareerApplicationCounts {
  total: number;

  new: number;
  reviewing: number;
  shortlisted: number;
  interview: number;
  offered: number;
  hired: number;
  rejected: number;
  withdrawn: number;
}

export interface CareerApplicationSummary {
  overall: CareerApplicationCounts;

  byCareer: Record<
    string,
    CareerApplicationCounts
  >;
}

/* =========================================================
   CV / RESUME METADATA

   storageKey is deliberately excluded.

   Backend must only return public-safe
   attachment metadata to authorized dashboard
   users. Actual files are downloaded through
   a protected route.
========================================================= */

export interface CareerResumeAttachment {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
}

/* =========================================================
   STATUS HISTORY
========================================================= */

export interface CareerApplicationHistory {
  status: CareerApplicationStatus;
  changedAt: string;

  changedBy?: string | null;
  note?: string;
}

/* =========================================================
   INTERVIEW
========================================================= */

export type CareerInterviewMode =
  | "onsite"
  | "online"
  | "phone";

export interface CareerInterview {
  scheduledAt: string | null;
  mode: CareerInterviewMode;

  location?: string;
  meetingLink?: string;
  notes?: string;

  scheduledBy?: string | null;
}

/* =========================================================
   CANDIDATE APPLICATION

   Private authenticated dashboard data.
========================================================= */

export interface CareerApplication {
  _id: string;
  id?: string;

  applicationId: string;

  career: string;
  careerId: string;

  applicantName: string;
  email: string;
  phone: string;

  city?: string;
  experienceYears: number;

  coverLetter?: string;
  source?: "website" | "admin";

  status: CareerApplicationStatus;
  appliedAt: string;

  reviewedAt?: string | null;
  reviewedBy?: string | null;

  recruiterNotes?: string;

  interview?: CareerInterview | null;
  statusHistory?: CareerApplicationHistory[];

  // Null is allowed for legacy applications.
  resume?: CareerResumeAttachment | null;

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   APPLICATION LIST
========================================================= */

export interface CareerApplicationListQuery {
  page?: number;
  limit?: number;

  careerId?: string;
  status?: CareerApplicationStatus;
  search?: string;

  sortBy?:
    | "appliedAt"
    | "createdAt"
    | "updatedAt"
    | "status"
    | "applicantName";

  sortOrder?: "asc" | "desc";
}

export interface CareerApplicationListResult {
  applications: CareerApplication[];
  pagination: CareerPagination;
}

/* =========================================================
   RECRUITMENT INPUTS
========================================================= */

export interface CareerApplicationStatusInput {
  status: CareerApplicationStatus;
  note?: string;
}

export interface CareerInterviewInput {
  scheduledAt: string;
  mode: CareerInterviewMode;

  location?: string;
  meetingLink?: string;
  notes?: string;
}

/* =========================================================
   PUBLIC APPLICATION INPUT
========================================================= */

export interface PublicCareerApplicationInput {
  applicantName: string;
  email: string;
  phone: string;

  city?: string;
  experienceYears?: number;
  coverLetter?: string;

  resume: File;
}

/* =========================================================
   APPLICATION RECEIPT
========================================================= */

export interface CareerApplicationReceipt {
  applicationId: string;
  careerId: string;

  submittedAt: string;
  message: string;
}

/* =========================================================
   VALIDATION ERRORS
========================================================= */

export interface CareerValidationError {
  field: string;
  message: string;
}

interface CareerResponse<T> {
  success: boolean;
  message?: string;
  data: T;

  errors?: CareerValidationError[];
  code?: string;
}

/* =========================================================
   ERROR CLASS
========================================================= */

export class CareerApiError extends Error {
  status: number;
  code?: string;

  errors: CareerValidationError[];

  constructor(
    message: string,
    status: number,
    code?: string,
    errors: CareerValidationError[] = []
  ) {
    super(message);

    this.name = "CareerApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;

    Object.setPrototypeOf(
      this,
      CareerApiError.prototype
    );
  }
}

/* =========================================================
   API HELPERS
========================================================= */

const CAREERS_ENDPOINT = "/careers";

type QueryValue =
  | string
  | number
  | boolean
  | undefined
  | null;

const buildQuery = (
  query: Record<string, QueryValue> = {}
): string => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        params.set(
          key,
          String(value)
        );
      }
    }
  );

  const result = params.toString();

  return result
    ? `?${result}`
    : "";
};

/* =========================================================
   NORMAL REQUEST HANDLER

   Uses existing src/services/api.ts.
========================================================= */

const careerRequest = async <T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    data?: unknown;
  } = {}
): Promise<T> => {
  try {
    const response =
      await api.request<CareerResponse<T>>({
        url: `${CAREERS_ENDPOINT}${endpoint}`,
        method: options.method ?? "GET",

        ...(options.data !== undefined
          ? { data: options.data }
          : {}),
      });

    const result = response.data;

    if (
      !result ||
      result.success !== true
    ) {
      throw new CareerApiError(
        result?.message ||
          "Career request failed.",
        response.status,
        result?.code,
        result?.errors ?? []
      );
    }

    return result.data;
  } catch (error: unknown) {
    if (error instanceof CareerApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const responseData =
        error.response?.data as
          | Partial<CareerResponse<unknown>>
          | undefined;

      throw new CareerApiError(
        responseData?.message ||
          error.message ||
          "Unable to connect to the server.",

        error.response?.status ?? 0,

        responseData?.code,

        Array.isArray(
          responseData?.errors
        )
          ? responseData.errors
          : []
      );
    }

    throw error;
  }
};

/* =========================================================
   SECURE RESUME DOWNLOAD HELPERS
========================================================= */

const sanitizeDownloadFilename = (
  value?: string
): string => {
  const filename = (
    value || "candidate-resume"
  )
    .replace(/\\/g, "/")
    .split("/")
    .pop() || "candidate-resume";

  const sanitized = filename
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .trim()
    .slice(0, 180);

  return sanitized || "candidate-resume";
};

const parseContentDispositionFilename = (
  header?: string
): string | undefined => {
  if (!header) {
    return undefined;
  }

  /*
   * RFC 5987 filename* is preferred.
   *
   * Example:
   * attachment; filename*=UTF-8''candidate%20cv.pdf
   */

  const encodedMatch = header.match(
    /filename\*\s*=\s*(?:UTF-8'')([^;]+)/i
  );

  if (encodedMatch?.[1]) {
    try {
      return sanitizeDownloadFilename(
        decodeURIComponent(
          encodedMatch[1].replace(
            /^"|"$/g,
            ""
          )
        )
      );
    } catch {
      // Try ordinary filename below.
    }
  }

  const normalMatch = header.match(
    /filename\s*=\s*(?:"([^"]+)"|([^;]+))/i
  );

  const filename =
    normalMatch?.[1] ||
    normalMatch?.[2];

  return filename
    ? sanitizeDownloadFilename(
        filename.trim()
      )
    : undefined;
};

/* =========================================================
   BLOB ERROR HANDLING

   Axios with responseType="blob" returns
   JSON error bodies as Blob as well.

   Decode those errors so the dashboard receives
   meaningful backend messages such as:
   - Resume not found
   - Session expired
   - Permission denied
========================================================= */

const getResumeDownloadError = async (
  error: unknown
): Promise<CareerApiError> => {
  if (error instanceof CareerApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status =
      error.response?.status ?? 0;

    let responseData: {
      message?: string;
      code?: string;
      errors?: CareerValidationError[];
    } | null = null;

    const rawData =
      error.response?.data;

    try {
      if (rawData instanceof Blob) {
        const text =
          await rawData.text();

        responseData = JSON.parse(text);
      } else if (
        rawData &&
        typeof rawData === "object"
      ) {
        responseData = rawData;
      }
    } catch {
      responseData = null;
    }

    return new CareerApiError(
      responseData?.message ||
        error.message ||
        "Unable to download candidate CV.",

      status,

      responseData?.code,

      Array.isArray(responseData?.errors)
        ? responseData.errors
        : []
    );
  }

  return new CareerApiError(
    error instanceof Error
      ? error.message
      : "Unable to download candidate CV.",
    0
  );
};

/* =========================================================
   AUTHENTICATED RESUME DOWNLOAD

   GET /careers/applications/:id/resume

   - Uses existing auth interceptor
   - Requests binary Blob
   - Never exposes backend storage key
   - Downloads original file name where available
   - Cleans temporary object URL
========================================================= */

const downloadApplicationResume = async (
  applicationId: string,
  originalName?: string
): Promise<void> => {
  const id = applicationId.trim();

  if (!id) {
    throw new CareerApiError(
      "Application ID is required.",
      400,
      "APPLICATION_ID_REQUIRED"
    );
  }

  try {
    const response = await api.get<Blob>(
      `${CAREERS_ENDPOINT}/applications/${encodeURIComponent(id)}/resume`,
      {
        responseType: "blob",
        headers: {
          Accept:
            "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/octet-stream",
        },
      }
    );

    const blob = response.data;

    if (
      !(blob instanceof Blob) ||
      blob.size === 0
    ) {
      throw new CareerApiError(
        "The server returned an empty resume file.",
        502,
        "EMPTY_RESUME_FILE"
      );
    }

    /*
     * Defensively reject any unexpected JSON
     * response from the download endpoint.
     */

    const contentType = String(
      response.headers["content-type"] || ""
    ).toLowerCase();

    if (
      contentType.includes("application/json")
    ) {
      let message =
        "The server did not return a resume file.";

      try {
        const data = JSON.parse(
          await blob.text()
        );

        if (typeof data?.message === "string") {
          message = data.message;
        }
      } catch {
        // Use generic message.
      }

      throw new CareerApiError(
        message,
        response.status,
        "INVALID_RESUME_RESPONSE"
      );
    }

    const responseFilename =
      parseContentDispositionFilename(
        String(
          response.headers[
            "content-disposition"
          ] || ""
        )
      );

    const filename =
      responseFilename ||
      sanitizeDownloadFilename(
        originalName
      );

    const objectUrl =
      URL.createObjectURL(blob);

    try {
      const link =
        document.createElement("a");

      link.href = objectUrl;
      link.download = filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      window.setTimeout(
        () => URL.revokeObjectURL(objectUrl),
        1000
      );
    }
  } catch (error: unknown) {
    throw await getResumeDownloadError(
      error
    );
  }
};

/* =========================================================
   DASHBOARD CAREERS SERVICE
========================================================= */

export const careerService = {
  /* -------------------------------------------------------
     GET ALL CAREERS
  ------------------------------------------------------- */

  async getAll(
    query: CareerListQuery = {}
  ): Promise<CareerListResult> {
    return careerRequest<CareerListResult>(
      buildQuery(
        query as Record<string, QueryValue>
      )
    );
  },

  /* -------------------------------------------------------
     CAREER SUMMARY
  ------------------------------------------------------- */

  async getSummary(): Promise<CareerSummary> {
    const result = await careerRequest<{
      summary: CareerSummary;
    }>("/summary");

    return result.summary;
  },

  /* -------------------------------------------------------
     SINGLE CAREER
  ------------------------------------------------------- */

  async getById(
    careerId: string
  ): Promise<Career> {
    const result = await careerRequest<{
      career: Career;
    }>(
      `/${encodeURIComponent(careerId)}`
    );

    return result.career;
  },

  /* -------------------------------------------------------
     CREATE CAREER
  ------------------------------------------------------- */

  async create(
    payload: CareerInput
  ): Promise<Career> {
    const result = await careerRequest<{
      career: Career;
    }>("", {
      method: "POST",
      data: payload,
    });

    return result.career;
  },

  /* -------------------------------------------------------
     UPDATE CAREER
  ------------------------------------------------------- */

  async update(
    careerId: string,
    payload: UpdateCareerInput
  ): Promise<Career> {
    const result = await careerRequest<{
      career: Career;
    }>(
      `/${encodeURIComponent(careerId)}`,
      {
        method: "PATCH",
        data: payload,
      }
    );

    return result.career;
  },

  /* -------------------------------------------------------
     UPDATE CAREER STATUS
  ------------------------------------------------------- */

  async updateStatus(
    careerId: string,
    status: CareerStatus
  ): Promise<Career> {
    const result = await careerRequest<{
      career: Career;
    }>(
      `/${encodeURIComponent(careerId)}/status`,
      {
        method: "PATCH",
        data: { status },
      }
    );

    return result.career;
  },

  /* -------------------------------------------------------
     DELETE CAREER
  ------------------------------------------------------- */

  async delete(
    careerId: string
  ): Promise<{
    careerId: string;
    title: string;
  }> {
    const result = await careerRequest<{
      career: {
        careerId: string;
        title: string;
      };
    }>(
      `/${encodeURIComponent(careerId)}`,
      {
        method: "DELETE",
      }
    );

    return result.career;
  },

  /* -------------------------------------------------------
     PUBLIC CAREER LIST
  ------------------------------------------------------- */

  async getPublicCareers(
    query: PublicCareerListQuery = {}
  ): Promise<PublicCareerListResult> {
    return careerRequest<PublicCareerListResult>(
      `/public${buildQuery(
        query as Record<string, QueryValue>
      )}`
    );
  },

  /* -------------------------------------------------------
     PUBLIC SINGLE CAREER
  ------------------------------------------------------- */

  async getPublicCareer(
    careerId: string
  ): Promise<PublicCareer> {
    const result = await careerRequest<{
      career: PublicCareer;
    }>(
      `/public/${encodeURIComponent(
        careerId
      )}`
    );

    return result.career;
  },

  /* =======================================================
     RECRUITMENT APPLICATION SERVICES
  ======================================================= */

  /* -------------------------------------------------------
     APPLICATION SUMMARY
  ------------------------------------------------------- */

  async getApplicationSummary(
    careerId?: string
  ): Promise<CareerApplicationSummary> {
    return careerRequest<CareerApplicationSummary>(
      `/applications/summary${buildQuery({
        careerId,
      })}`
    );
  },

  /* -------------------------------------------------------
     APPLICATION LIST
  ------------------------------------------------------- */

  async getApplications(
    query: CareerApplicationListQuery = {}
  ): Promise<CareerApplicationListResult> {
    return careerRequest<CareerApplicationListResult>(
      `/applications${buildQuery(
        query as Record<string, QueryValue>
      )}`
    );
  },

  /* -------------------------------------------------------
     SINGLE APPLICATION DETAILS
  ------------------------------------------------------- */

  async getApplicationById(
    id: string
  ): Promise<CareerApplication> {
    const result = await careerRequest<{
      application: CareerApplication;
    }>(
      `/applications/${encodeURIComponent(id)}`
    );

    return result.application;
  },

  /* -------------------------------------------------------
     UPDATE APPLICATION STATUS
  ------------------------------------------------------- */

  async updateApplicationStatus(
    id: string,
    payload: CareerApplicationStatusInput
  ): Promise<CareerApplication> {
    const result = await careerRequest<{
      application: CareerApplication;
    }>(
      `/applications/${encodeURIComponent(
        id
      )}/status`,
      {
        method: "PATCH",
        data: payload,
      }
    );

    return result.application;
  },

  /* -------------------------------------------------------
     UPDATE RECRUITER NOTES
  ------------------------------------------------------- */

  async updateApplicationNotes(
    id: string,
    recruiterNotes: string
  ): Promise<CareerApplication> {
    const result = await careerRequest<{
      application: CareerApplication;
    }>(
      `/applications/${encodeURIComponent(
        id
      )}/notes`,
      {
        method: "PATCH",
        data: {
          recruiterNotes,
        },
      }
    );

    return result.application;
  },

  /* -------------------------------------------------------
     SCHEDULE INTERVIEW
  ------------------------------------------------------- */

  async scheduleInterview(
    id: string,
    payload: CareerInterviewInput
  ): Promise<CareerApplication> {
    const result = await careerRequest<{
      application: CareerApplication;
    }>(
      `/applications/${encodeURIComponent(
        id
      )}/interview`,
      {
        method: "PATCH",
        data: payload,
      }
    );

    return result.application;
  },

  /* -------------------------------------------------------
     DOWNLOAD PRIVATE RESUME

     applicationId must be MongoDB application _id,
     not the public STH-APP-000001 reference.

     originalName comes from application.resume.
  ------------------------------------------------------- */

  async downloadApplicationResume(
    applicationId: string,
    originalName?: string
  ): Promise<void> {
    return downloadApplicationResume(
      applicationId,
      originalName
    );
  },
};

/* =========================================================
   RECRUITMENT SERVICE ALIAS

   Preserves existing dashboard imports.
========================================================= */

export const careerApplicationsService = {
  getSummary:
    careerService.getApplicationSummary,

  getAll:
    careerService.getApplications,

  getById:
    careerService.getApplicationById,

  updateStatus:
    careerService.updateApplicationStatus,

  updateNotes:
    careerService.updateApplicationNotes,

  scheduleInterview:
    careerService.scheduleInterview,

  downloadResume:
    careerService.downloadApplicationResume,
};

/* =========================================================
   EXISTING EXPORTS
========================================================= */

export const careersApi = careerService;

export default careerService;
