"""
FastAPI application for BrandLens.
Includes health check, CORS middleware, all required REST endpoints,
file uploads (.txt, .docx, image checks), and insights calculations.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import io
import re
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from PIL import Image
import docx

from backend.config import settings
from backend.database import init_db, get_session
from backend.models import Clause, Fact, Term, Draft, DraftVersion, Finding, Comment, Decision
from backend.schemas import (
    LibraryResponse,
    DraftCreate,
    DraftDetailResponse,
    ReviewRequest,
    ReviewResponse,
    FindingPatchRequest,
    FindingPatchResponse,
    SubmitRequest,
    DecisionRequest,
    CommentCreate,
    UploadResponse,
    InsightsResponse,
    AINotice
)
from backend.seed_data import COMPANY_NAME, BRAND_PALETTE, SEED_SAMPLE_DRAFTS
from backend.review_service import execute_review_pipeline
from backend.rules_engine import hex_to_rgb

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed database on startup if empty
    init_db()
    yield

app = FastAPI(
    title="BrandLens API",
    description="Automated Brand Guidelines and Fact Checker API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for hackathon/Vercel previews
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. HEALTH CHECK ---
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": "BrandLens",
        "company": COMPANY_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# --- 2. LIBRARY ENDPOINT ---
@app.get("/api/library", response_model=LibraryResponse)
def get_library(session: Session = Depends(get_session)):
    clauses = list(session.exec(select(Clause)).all())
    facts = list(session.exec(select(Fact)).all())
    terms = list(session.exec(select(Term)).all())
    return LibraryResponse(
        company_name=COMPANY_NAME,
        clauses=clauses,
        facts=facts,
        terms=terms,
        brand_palette=BRAND_PALETTE,
        sample_drafts=SEED_SAMPLE_DRAFTS
    )

# --- 3. DRAFTS ENDPOINTS ---
@app.post("/api/drafts", response_model=DraftDetailResponse)
def create_draft(payload: DraftCreate, session: Session = Depends(get_session)):
    draft = Draft(
        title=payload.title or "Untitled Draft",
        author_role=payload.author_role or "Creator",
        target_intent=payload.target_intent,
        status="draft"
    )
    session.add(draft)
    session.commit()
    session.refresh(draft)

    # Create initial version 1
    version = DraftVersion(
        draft_id=draft.id,
        version_num=1,
        content=payload.content,
        change_summary="Initial draft created"
    )
    session.add(version)
    session.commit()
    session.refresh(version)

    return DraftDetailResponse(
        id=draft.id,
        title=draft.title,
        author_role=draft.author_role,
        target_intent=draft.target_intent,
        status=draft.status,
        created_at=draft.created_at,
        updated_at=draft.updated_at,
        current_version=version,
        versions=[version],
        findings=[],
        comments=[],
        decisions=[]
    )

@app.get("/api/drafts", response_model=List[DraftDetailResponse])
def list_drafts(session: Session = Depends(get_session)):
    drafts = list(session.exec(select(Draft).order_by(Draft.updated_at.desc())).all())
    result = []
    for d in drafts:
        versions = list(session.exec(select(DraftVersion).where(DraftVersion.draft_id == d.id).order_by(DraftVersion.version_num.desc())).all())
        findings = list(session.exec(select(Finding).where(Finding.draft_id == d.id)).all())
        comments = list(session.exec(select(Comment).where(Comment.draft_id == d.id)).all())
        decisions = list(session.exec(select(Decision).where(Decision.draft_id == d.id)).all())
        current_version = versions[0] if versions else None
        result.append(DraftDetailResponse(
            id=d.id,
            title=d.title,
            author_role=d.author_role,
            target_intent=d.target_intent,
            status=d.status,
            created_at=d.created_at,
            updated_at=d.updated_at,
            current_version=current_version,
            versions=list(reversed(versions)),
            findings=findings,
            comments=comments,
            decisions=decisions
        ))
    return result

@app.get("/api/drafts/{draft_id}", response_model=DraftDetailResponse)
def get_draft(draft_id: int, session: Session = Depends(get_session)):
    draft = session.get(Draft, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    versions = list(session.exec(select(DraftVersion).where(DraftVersion.draft_id == draft.id).order_by(DraftVersion.version_num.asc())).all())
    findings = list(session.exec(select(Finding).where(Finding.draft_id == draft.id)).all())
    comments = list(session.exec(select(Comment).where(Comment.draft_id == draft.id).order_by(Comment.created_at.asc())).all())
    decisions = list(session.exec(select(Decision).where(Decision.draft_id == draft.id).order_by(Decision.created_at.asc())).all())

    current_version = versions[-1] if versions else None

    return DraftDetailResponse(
        id=draft.id,
        title=draft.title,
        author_role=draft.author_role,
        target_intent=draft.target_intent,
        status=draft.status,
        created_at=draft.created_at,
        updated_at=draft.updated_at,
        current_version=current_version,
        versions=versions,
        findings=findings,
        comments=comments,
        decisions=decisions
    )

# --- 4. REVIEW ENDPOINT ---
@app.post("/api/drafts/{draft_id}/review", response_model=ReviewResponse)
def review_draft(draft_id: int, payload: ReviewRequest, session: Session = Depends(get_session)):
    draft = session.get(Draft, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    # Get latest version
    latest_version = session.exec(
        select(DraftVersion).where(DraftVersion.draft_id == draft.id).order_by(DraftVersion.version_num.desc())
    ).first()

    content_to_review = payload.content if payload.content is not None else (latest_version.content if latest_version else "")
    intent_to_use = payload.target_intent if payload.target_intent is not None else draft.target_intent

    # If payload provided new content and it differs from latest version, record as a new draft version or update
    if payload.content is not None and (not latest_version or latest_version.content != payload.content):
        next_ver = (latest_version.version_num + 1) if latest_version else 1
        new_v = DraftVersion(
            draft_id=draft.id,
            version_num=next_ver,
            content=payload.content,
            change_summary="Updated content prior to review"
        )
        session.add(new_v)
        session.commit()
        session.refresh(new_v)
        latest_version = new_v

    if intent_to_use != draft.target_intent:
        draft.target_intent = intent_to_use
        draft.updated_at = datetime.now(timezone.utc)
        session.add(draft)
        session.commit()

    findings, dropped_count, ai_notice = execute_review_pipeline(
        session=session,
        draft_id=draft.id,
        version_id=latest_version.id if latest_version else 0,
        content=content_to_review,
        target_intent=intent_to_use
    )

    return ReviewResponse(
        draft_id=draft.id,
        version_id=latest_version.id if latest_version else 0,
        findings=findings,
        dropped_count=dropped_count,
        ai_notice=ai_notice
    )

# --- 5. FINDINGS PATCH (ACCEPT / EDIT / DISMISS) ---
@app.patch("/api/findings/{finding_id}", response_model=FindingPatchResponse)
def patch_finding(finding_id: int, payload: FindingPatchRequest, session: Session = Depends(get_session)):
    finding = session.get(Finding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    draft = session.get(Draft, finding.draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Associated draft not found")

    latest_version = session.exec(
        select(DraftVersion).where(DraftVersion.draft_id == draft.id).order_by(DraftVersion.version_num.desc())
    ).first()

    current_text = latest_version.content if latest_version else ""
    updated_text = current_text
    new_version_num = None

    if payload.action == "accept":
        replacement = payload.custom_text if payload.custom_text is not None else finding.suggestion
        # Apply replacement: replace finding excerpt in draft text
        if finding.excerpt in current_text:
            updated_text = current_text.replace(finding.excerpt, replacement, 1)
        
        finding.status = "accepted"
        session.add(finding)

        # Create new version
        new_version_num = (latest_version.version_num + 1) if latest_version else 1
        new_v = DraftVersion(
            draft_id=draft.id,
            version_num=new_version_num,
            content=updated_text,
            change_summary=f"Accepted fix for {finding.source_code}: '{finding.excerpt}' -> '{replacement}'"
        )
        session.add(new_v)
        draft.updated_at = datetime.now(timezone.utc)
        session.add(draft)
        session.commit()
        session.refresh(finding)

    elif payload.action == "edit":
        replacement = payload.custom_text or finding.suggestion
        if finding.excerpt in current_text:
            updated_text = current_text.replace(finding.excerpt, replacement, 1)

        finding.status = "edited"
        finding.suggestion = replacement
        session.add(finding)

        # Create new version
        new_version_num = (latest_version.version_num + 1) if latest_version else 1
        new_v = DraftVersion(
            draft_id=draft.id,
            version_num=new_version_num,
            content=updated_text,
            change_summary=f"Custom edit for {finding.source_code}: '{finding.excerpt}' -> '{replacement}'"
        )
        session.add(new_v)
        draft.updated_at = datetime.now(timezone.utc)
        session.add(draft)
        session.commit()
        session.refresh(finding)

    elif payload.action == "dismiss":
        finding.status = "dismissed"
        finding.dismiss_reason = payload.dismiss_reason or "Dismissed by reviewer as intentional exception"
        session.add(finding)
        draft.updated_at = datetime.now(timezone.utc)
        session.add(draft)
        session.commit()
        session.refresh(finding)

    else:
        raise HTTPException(status_code=400, detail=f"Invalid action '{payload.action}'")

    return FindingPatchResponse(
        finding=finding,
        updated_draft_content=updated_text,
        new_version_num=new_version_num
    )

# --- 6. APPROVALS, DECISIONS, COMMENTS ---
@app.post("/api/drafts/{draft_id}/submit")
def submit_draft(draft_id: int, payload: SubmitRequest, session: Session = Depends(get_session)):
    draft = session.get(Draft, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    draft.status = "submitted"
    draft.updated_at = datetime.now(timezone.utc)
    session.add(draft)

    if payload.note:
        comment = Comment(
            draft_id=draft.id,
            author_role=payload.user_role or "Creator",
            content=f"Submission note: {payload.note}"
        )
        session.add(comment)

    session.commit()
    return {"message": "Draft submitted for manager review", "status": draft.status}

@app.post("/api/drafts/{draft_id}/decision")
def record_decision(draft_id: int, payload: DecisionRequest, session: Session = Depends(get_session)):
    draft = session.get(Draft, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if payload.action not in ["approve", "request_changes"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'request_changes'")

    new_status = "approved" if payload.action == "approve" else "changes_requested"
    draft.status = new_status
    draft.updated_at = datetime.now(timezone.utc)
    session.add(draft)

    decision = Decision(
        draft_id=draft.id,
        reviewer_role=payload.reviewer_role or "Manager",
        action=payload.action,
        reason=payload.reason
    )
    session.add(decision)
    session.commit()
    session.refresh(decision)

    return {"message": f"Decision recorded: {payload.action}", "status": draft.status, "decision_id": decision.id}

@app.post("/api/drafts/{draft_id}/comments")
def add_comment(draft_id: int, payload: CommentCreate, session: Session = Depends(get_session)):
    draft = session.get(Draft, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    comment = Comment(
        draft_id=draft.id,
        author_role=payload.author_role or "Reviewer",
        content=payload.content
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment

# --- 7. UPLOAD ENDPOINT (.txt, .docx, images) ---
@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_file"
    contents = await file.read()
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    extracted_text = ""
    image_analysis = None

    if ext == "txt":
        extracted_text = contents.decode("utf-8", errors="ignore")
    elif ext == "docx":
        doc_stream = io.BytesIO(contents)
        doc = docx.Document(doc_stream)
        extracted_text = "\n\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    elif ext in ["png", "jpg", "jpeg", "webp"]:
        try:
            img = Image.open(io.BytesIO(contents)).convert("RGB")
            # Resize for fast color quantification
            img_small = img.resize((150, 150))
            # Quantize to 5 dominant colors
            quantized = img_small.quantize(colors=5)
            palette = quantized.getpalette()[:15]  # 5 RGB tuples
            dominant_colors = []
            for i in range(0, len(palette), 3):
                r, g, b = palette[i], palette[i+1], palette[i+2]
                hex_val = f"#{r:02X}{g:02X}{b:02X}"
                dominant_colors.append(hex_val)

            # Check closeness to Nova brand colors
            brand_hexes = [b["hex"] for b in BRAND_PALETTE]
            brand_matches = []
            for d_hex in dominant_colors:
                dr, dg, db = hex_to_rgb(d_hex)
                best_match = None
                min_dist = 999999
                for b_hex in brand_hexes:
                    br, bg, bb = hex_to_rgb(b_hex)
                    dist = ((dr - br)**2 + (dg - bg)**2 + (db - bb)**2) ** 0.5
                    if dist < min_dist:
                        min_dist = dist
                        best_match = b_hex
                brand_matches.append({
                    "dominant_color": d_hex,
                    "nearest_brand_color": best_match,
                    "color_distance": round(min_dist, 1),
                    "is_brand_aligned": min_dist < 60
                })

            image_analysis = {
                "width": img.width,
                "height": img.height,
                "format": img.format or ext.upper(),
                "dominant_colors": dominant_colors,
                "brand_color_alignment": brand_matches,
                "alt_text_status": "Missing alt text descriptor (NOV-ACC-01 recommended)"
            }
            extracted_text = f"[Image Asset Uploaded: {filename} - {img.width}x{img.height}px. Dominant colors: {', '.join(dominant_colors)}. Missing alt text!]"
        except Exception as e:
            image_analysis = {"error": f"Failed to analyze image: {str(e)}"}
            extracted_text = f"[Uploaded file: {filename}]"
    else:
        extracted_text = contents.decode("utf-8", errors="ignore")

    return UploadResponse(
        filename=filename,
        file_type=ext,
        extracted_text=extracted_text,
        image_analysis=image_analysis
    )

# --- 8. INSIGHTS ENDPOINT ---
@app.get("/api/insights", response_model=InsightsResponse)
def get_insights(session: Session = Depends(get_session)):
    all_findings = list(session.exec(select(Finding)).all())
    
    total = len(all_findings)
    by_category: dict[str, int] = {}
    by_severity: dict[str, int] = {"high": 0, "medium": 0, "low": 0}
    by_clause_map: dict[str, dict] = {}
    status_counts: dict[str, int] = {"open": 0, "accepted": 0, "edited": 0, "dismissed": 0}

    for f in all_findings:
        by_category[f.category] = by_category.get(f.category, 0) + 1
        by_severity[f.severity] = by_severity.get(f.severity, 0) + 1
        status_counts[f.status] = status_counts.get(f.status, 0) + 1

        code = f.source_code
        if code not in by_clause_map:
            by_clause_map[code] = {
                "source_code": code,
                "category": f.category,
                "total_flagged": 0,
                "dismissed_count": 0,
                "accepted_count": 0
            }
        by_clause_map[code]["total_flagged"] += 1
        if f.status == "dismissed":
            by_clause_map[code]["dismissed_count"] += 1
        elif f.status in ["accepted", "edited"]:
            by_clause_map[code]["accepted_count"] += 1

    by_clause_list = sorted(by_clause_map.values(), key=lambda x: -x["total_flagged"])

    dismissal_rate_list = []
    for item in by_clause_list:
        total_fl = item["total_flagged"]
        d_count = item["dismissed_count"]
        rate = round((d_count / total_fl) * 100, 1) if total_fl > 0 else 0.0
        dismissal_rate_list.append({
            "source_code": item["source_code"],
            "category": item["category"],
            "total_flagged": total_fl,
            "dismissed_count": d_count,
            "dismissal_rate_pct": rate
        })

    return InsightsResponse(
        total_findings=total,
        by_category=by_category,
        by_severity=by_severity,
        by_clause=by_clause_list,
        dismissal_rate_per_clause=sorted(dismissal_rate_list, key=lambda x: -x["dismissal_rate_pct"]),
        status_counts=status_counts
    )
