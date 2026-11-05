from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from backend.models import Clause, Fact, Term, DraftVersion, Finding, Comment, Decision

class AINotice(BaseModel):
    ai_used: bool
    model_name: str
    text_sent: str
    banner_message: Optional[str] = None

class LibraryResponse(BaseModel):
    company_name: str
    clauses: List[Clause]
    facts: List[Fact]
    terms: List[Term]
    brand_palette: List[Dict[str, Any]]
    sample_drafts: List[Dict[str, Any]]

class DraftCreate(BaseModel):
    title: Optional[str] = "Untitled Draft"
    content: str
    author_role: Optional[str] = "Creator"
    target_intent: Optional[str] = None

class DraftDetailResponse(BaseModel):
    id: int
    title: str
    author_role: str
    target_intent: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    current_version: Optional[DraftVersion] = None
    versions: List[DraftVersion] = []
    findings: List[Finding] = []
    comments: List[Comment] = []
    decisions: List[Decision] = []

class ReviewRequest(BaseModel):
    content: Optional[str] = None
    target_intent: Optional[str] = None

class ReviewResponse(BaseModel):
    draft_id: int
    version_id: int
    findings: List[Finding]
    dropped_count: int = 0
    ai_notice: AINotice

class FindingPatchRequest(BaseModel):
    action: str  # "accept" | "edit" | "dismiss"
    custom_text: Optional[str] = None
    dismiss_reason: Optional[str] = None
    user_role: Optional[str] = "Creator"

class FindingPatchResponse(BaseModel):
    finding: Finding
    updated_draft_content: Optional[str] = None
    new_version_num: Optional[int] = None

class SubmitRequest(BaseModel):
    user_role: Optional[str] = "Creator"
    note: Optional[str] = None

class DecisionRequest(BaseModel):
    reviewer_role: Optional[str] = "Manager"
    action: str  # "approve" | "request_changes"
    reason: str

class CommentCreate(BaseModel):
    author_role: Optional[str] = "Reviewer"
    content: str

class UploadResponse(BaseModel):
    filename: str
    file_type: str
    extracted_text: Optional[str] = None
    image_analysis: Optional[Dict[str, Any]] = None

class InsightsResponse(BaseModel):
    total_findings: int
    by_category: Dict[str, int]
    by_severity: Dict[str, int]
    by_clause: List[Dict[str, Any]]
    dismissal_rate_per_clause: List[Dict[str, Any]]
    status_counts: Dict[str, int]

