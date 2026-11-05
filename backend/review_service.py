"""
End-to-end Review Pipeline Service for BrandLens.
Pipeline stages:
1. Run deterministic checks (plain code).
2. Run AI check with strict JSON (falls back to rule-based if key is absent or call fails).
3. Verifier: drops unverified/hallucinated findings, computes spans, dedupes overlapping items.
4. Sorts by severity (high, medium, low) and persists to DB.
"""

from typing import Tuple, List, Optional
from sqlmodel import Session, select
from backend.models import Draft, DraftVersion, Finding, Clause, Fact, Term
from backend.schemas import AINotice
from backend.rules_engine import run_deterministic_checks
from backend.ai_engine import run_ai_review
from backend.verifier import verify_and_clean_findings

def execute_review_pipeline(
    session: Session,
    draft_id: int,
    version_id: int,
    content: str,
    target_intent: Optional[str] = None
) -> Tuple[List[Finding], int, AINotice]:
    """
    Executes the 4-stage pipeline and returns (persisted_findings, dropped_count, ai_notice).
    """
    # Fetch guidelines, facts, and terms
    clauses = list(session.exec(select(Clause)).all())
    facts = list(session.exec(select(Fact)).all())
    terms = list(session.exec(select(Term)).all())

    clauses_by_code = {c.code: c for c in clauses}
    facts_by_code = {f.code: f for f in facts}

    # 1. Deterministic checks
    deterministic_raw = run_deterministic_checks(
        draft_text=content,
        clauses=clauses,
        facts=facts,
        terms=terms,
        target_intent=target_intent
    )

    # 2. AI check (with graceful fallback)
    ai_raw, ai_used, model_name, text_sent, banner_message = run_ai_review(
        draft_text=content,
        target_intent=target_intent,
        all_clauses=clauses,
        all_facts=facts
    )

    ai_notice = AINotice(
        ai_used=ai_used,
        model_name=model_name,
        text_sent=text_sent,
        banner_message=banner_message
    )

    # Combine candidates
    combined_raw = deterministic_raw + ai_raw

    # 3. Verifier
    verified_data, dropped_count = verify_and_clean_findings(
        raw_findings=combined_raw,
        draft_text=content,
        clauses_by_code=clauses_by_code,
        facts_by_code=facts_by_code
    )

    # 4. Clear any existing open findings for this draft and version to avoid stale duplicates
    existing_findings = session.exec(
        select(Finding).where(Finding.draft_id == draft_id)
    ).all()
    for ef in existing_findings:
        session.delete(ef)
    session.commit()

    # Persist verified findings to database
    persisted: List[Finding] = []
    for f_data in verified_data:
        finding = Finding(
            draft_id=draft_id,
            draft_version_id=version_id,
            category=f_data["category"],
            severity=f_data["severity"],
            span_start=f_data["span_start"],
            span_end=f_data["span_end"],
            excerpt=f_data["excerpt"],
            explanation=f_data["explanation"],
            source_type=f_data["source_type"],
            source_code=f_data["source_code"],
            source_quote=f_data["source_quote"],
            suggestion=f_data["suggestion"],
            confidence=f_data["confidence"],
            status="open",
            dismiss_reason=None
        )
        session.add(finding)
        session.commit()
        session.refresh(finding)
        persisted.append(finding)

    return persisted, dropped_count, ai_notice

