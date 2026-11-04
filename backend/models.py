from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Clause(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    category: str = Field(index=True)  # tone, terminology, messaging, claims, visual, accessibility
    title: str
    text: str
    rationale: Optional[str] = None

class Fact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    topic: str
    statement: str
    value: str
    source: str
    valid_until: Optional[str] = None  # YYYY-MM-DD or 'permanent'

class Term(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    banned_term: str = Field(index=True)
    preferred_term: str
    category: str
    reason: str
    rule_code: Optional[str] = None

class Draft(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(default="Untitled Draft")
    author_role: str = Field(default="Creator")
    target_intent: Optional[str] = None
    status: str = Field(default="draft")  # draft, submitted, approved, changes_requested
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class DraftVersion(SQLModel, table=True):
    __tablename__ = "draft_version"
    id: Optional[int] = Field(default=None, primary_key=True)
    draft_id: int = Field(foreign_key="draft.id", index=True)
    version_num: int = Field(default=1)
    content: str
    change_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)

class Finding(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    draft_id: int = Field(foreign_key="draft.id", index=True)
    draft_version_id: Optional[int] = Field(default=None, foreign_key="draft_version.id", index=True)
    category: str = Field(index=True)  # tone, terminology, messaging, claims, visual, accessibility
    severity: str = Field(default="medium")  # high, medium, low
    span_start: int = Field(default=0)
    span_end: int = Field(default=0)
    excerpt: str
    explanation: str
    source_type: str = Field(default="clause")  # clause | fact
    source_code: str = Field(index=True)
    source_quote: str
    suggestion: str
    confidence: float = Field(default=1.0)
    status: str = Field(default="open")  # open | accepted | edited | dismissed
    dismiss_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)

class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    draft_id: int = Field(foreign_key="draft.id", index=True)
    author_role: str = Field(default="Reviewer")
    content: str
    created_at: datetime = Field(default_factory=utc_now)

class Decision(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    draft_id: int = Field(foreign_key="draft.id", index=True)
    reviewer_role: str = Field(default="Manager")
    action: str = Field(index=True)  # approve | request_changes
    reason: str
    created_at: datetime = Field(default_factory=utc_now)
