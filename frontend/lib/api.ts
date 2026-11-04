/**
 * BrandLens API Client
 * Typed fetch helpers connecting Next.js frontend to Python FastAPI backend.
 * Base URL defaults to process.env.NEXT_PUBLIC_API_URL or http://localhost:8000.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export interface Clause {
  id: number;
  code: string;
  category: "tone" | "terminology" | "messaging" | "claims" | "visual" | "accessibility";
  title: string;
  text: string;
  rationale?: string;
}

export interface Fact {
  id: number;
  code: string;
  topic: string;
  statement: string;
  value: string;
  source: string;
  valid_until?: string;
}

export interface Term {
  id: number;
  banned_term: string;
  preferred_term: string;
  category: string;
  reason: string;
  rule_code?: string;
}

export interface BrandColor {
  name: string;
  hex: string;
  role: string;
  usage: string;
}

export interface SampleDraft {
  id_key: string;
  title: string;
  author_role: string;
  target_intent: string;
  content: string;
  mistakes_summary: string[];
}

export interface LibraryResponse {
  company_name: string;
  clauses: Clause[];
  facts: Fact[];
  terms: Term[];
  brand_palette: BrandColor[];
  sample_drafts: SampleDraft[];
}

export interface DraftVersion {
  id: number;
  draft_id: number;
  version_num: number;
  content: string;
  change_summary?: string;
  created_at: string;
}

export interface Finding {
  id: number;
  draft_id: number;
  draft_version_id?: number;
  category: "tone" | "terminology" | "messaging" | "claims" | "visual" | "accessibility";
  severity: "high" | "medium" | "low";
  span_start: number;
  span_end: number;
  excerpt: string;
  explanation: string;
  source_type: "clause" | "fact";
  source_code: string;
  source_quote: string;
  suggestion: string;
  confidence: number;
  status: "open" | "accepted" | "edited" | "dismissed";
  dismiss_reason?: string;
  created_at: string;
}

export interface Comment {
  id: number;
  draft_id: number;
  author_role: string;
  content: string;
  created_at: string;
}

export interface Decision {
  id: number;
  draft_id: number;
  reviewer_role: string;
  action: "approve" | "request_changes";
  reason: string;
  created_at: string;
}

export interface DraftDetailResponse {
  id: number;
  title: string;
  author_role: string;
  target_intent?: string;
  status: "draft" | "submitted" | "approved" | "changes_requested";
  created_at: string;
  updated_at: string;
  current_version?: DraftVersion;
  versions: DraftVersion[];
  findings: Finding[];
  comments: Comment[];
  decisions: Decision[];
}

export interface AINotice {
  ai_used: boolean;
  model_name: string;
  text_sent: string;
  banner_message?: string | null;
}

export interface ReviewResponse {
  draft_id: number;
  version_id: number;
  findings: Finding[];
  dropped_count: number;
  ai_notice: AINotice;
}

export interface FindingPatchResponse {
  finding: Finding;
  updated_draft_content?: string;
  new_version_num?: number;
}

export interface UploadResponse {
  filename: string;
  file_type: string;
  extracted_text?: string;
  image_analysis?: {
    width?: number;
    height?: number;
    format?: string;
    dominant_colors?: string[];
    brand_color_alignment?: Array<{
      dominant_color: string;
      nearest_brand_color: string;
      color_distance: number;
      is_brand_aligned: boolean;
    }>;
    alt_text_status?: string;
    error?: string;
  };
}

export interface InsightsResponse {
  total_findings: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  by_clause: Array<{
    source_code: string;
    category: string;
    total_flagged: number;
    dismissed_count: number;
    accepted_count: number;
  }>;
  dismissal_rate_per_clause: Array<{
    source_code: string;
    category: string;
    total_flagged: number;
    dismissed_count: number;
    dismissal_rate_pct: number;
  }>;
  status_counts: Record<string, number>;
}

// Network fetch wrapper with friendly error handling
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const body = await response.json();
        if (body.detail) errorDetail = body.detail;
      } catch {
        // use default errorDetail
      }
      throw new Error(errorDetail);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err.name === "TypeError" && err.message?.includes("fetch")) {
      throw new Error(
        `Unable to reach BrandLens API at ${API_BASE_URL}. Ensure the backend server is running.`
      );
    }
    throw err;
  }
}

// --- API METHODS ---

export async function checkHealth(): Promise<{ status: string; app: string; company: string }> {
  return request<{ status: string; app: string; company: string }>("/health");
}

export async function fetchLibrary(): Promise<LibraryResponse> {
  return request<LibraryResponse>("/api/library");
}

export async function createDraft(payload: {
  title?: string;
  content: string;
  author_role?: string;
  target_intent?: string;
}): Promise<DraftDetailResponse> {
  return request<DraftDetailResponse>("/api/drafts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listDrafts(): Promise<DraftDetailResponse[]> {
  return request<DraftDetailResponse[]>("/api/drafts");
}

export async function getDraft(draftId: number): Promise<DraftDetailResponse> {
  return request<DraftDetailResponse>(`/api/drafts/${draftId}`);
}

export async function reviewDraft(
  draftId: number,
  payload: { content?: string; target_intent?: string }
): Promise<ReviewResponse> {
  return request<ReviewResponse>(`/api/drafts/${draftId}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function patchFinding(
  findingId: number,
  payload: {
    action: "accept" | "edit" | "dismiss";
    custom_text?: string;
    dismiss_reason?: string;
    user_role?: string;
  }
): Promise<FindingPatchResponse> {
  return request<FindingPatchResponse>(`/api/findings/${findingId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function submitDraft(
  draftId: number,
  payload: { user_role?: string; note?: string }
): Promise<{ message: string; status: string }> {
  return request<{ message: string; status: string }>(`/api/drafts/${draftId}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recordDecision(
  draftId: number,
  payload: { reviewer_role?: string; action: "approve" | "request_changes"; reason: string }
): Promise<{ message: string; status: string; decision_id: number }> {
  return request<{ message: string; status: string; decision_id: number }>(
    `/api/drafts/${draftId}/decision`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function addComment(
  draftId: number,
  payload: { author_role?: string; content: string }
): Promise<Comment> {
  return request<Comment>(`/api/drafts/${draftId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${API_BASE_URL}/api/upload`;
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchInsights(): Promise<InsightsResponse> {
  return request<InsightsResponse>("/api/insights");
}
