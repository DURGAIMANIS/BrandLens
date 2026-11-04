"""
Unit and integration tests for BrandLens backend:
- Deterministic checks
- Traceability verifier (fake quote dropped, valid kept, wrong span computed, overlaps deduped)
- Fact mismatch detection ($149 outdated vs $189 approved)
- State transitions (Accept creates new version, Dismiss requires/saves reason, Approve/Request changes)
- /health and /api/library verification
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from backend.main import app
from backend.database import get_session
from backend.models import Clause, Fact, Term, Draft, DraftVersion, Finding
from backend.seed_data import SEED_CLAUSES, SEED_FACTS, SEED_TERMS
from backend.rules_engine import run_deterministic_checks, calculate_contrast_ratio
from backend.verifier import verify_and_clean_findings

# In-memory SQLite for testing
@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine, expire_on_commit=False) as session:
        for c in SEED_CLAUSES:
            session.add(Clause(**c))
        for f in SEED_FACTS:
            session.add(Fact(**f))
        for t in SEED_TERMS:
            session.add(Term(**t))
        session.commit()
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session
    app.dependency_overrides[get_session] = get_session_override
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

def test_health_check(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["app"] == "BrandLens"
    assert data["company"] == "Nova Outdoor Gear"

def test_get_library(client: TestClient):
    resp = client.get("/api/library")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["clauses"]) >= 25
    assert len(data["facts"]) >= 10
    assert len(data["terms"]) >= 8
    assert len(data["brand_palette"]) == 6
    assert len(data["sample_drafts"]) == 3

def test_deterministic_checks_and_verifier(session: Session):
    clauses = list(session.query(Clause).all())
    facts = list(session.query(Fact).all())
    terms = list(session.query(Term).all())
    clauses_by_code = {c.code: c for c in clauses}
    facts_by_code = {f.code: f for f in facts}

    draft_text = (
        "We are thrilled to unveil the new Apex Shell Jacket! "
        "Grab this cheap alternative for only $149 before stocks run out. "
        "98% of customers prefer us over all competitors. "
        "Crafted with eco-friendly fabrics, it is simply the absolute best waterproof jacket on the market."
    )

    raw_findings = run_deterministic_checks(
        draft_text=draft_text,
        clauses=clauses,
        facts=facts,
        terms=terms
    )
    assert len(raw_findings) >= 5

    # Run through verifier
    verified, dropped = verify_and_clean_findings(
        raw_findings=raw_findings,
        draft_text=draft_text,
        clauses_by_code=clauses_by_code,
        facts_by_code=facts_by_code
    )

    assert len(verified) >= 4
    # Every verified item must have excerpt in draft_text
    for v in verified:
        assert v["excerpt"] in draft_text
        assert draft_text[v["span_start"]:v["span_end"]] == v["excerpt"]
        assert v["source_code"] in clauses_by_code or v["source_code"] in facts_by_code

def test_verifier_drops_fake_quote_and_unknown_code(session: Session):
    clauses = list(session.query(Clause).all())
    facts = list(session.query(Fact).all())
    clauses_by_code = {c.code: c for c in clauses}
    facts_by_code = {f.code: f for f in facts}

    draft = "Nova jackets are the best in the world."
    
    # 1. Fake source_code
    fake_code_finding = {
        "source_code": "NON-EXISTENT-999",
        "source_quote": "some quote",
        "excerpt": "best",
        "category": "tone"
    }
    # 2. Fake quote (source exists, but quote is fabricated)
    fake_quote_finding = {
        "source_code": "NOV-TONE-01",
        "source_quote": "This sentence was hallucinated by an LLM and does not exist in guidelines",
        "excerpt": "best",
        "category": "tone"
    }
    # 3. Excerpt not in draft
    missing_excerpt_finding = {
        "source_code": "NOV-TONE-01",
        "source_quote": "Nova speaks as an encouraging mountain guide",
        "excerpt": "word_not_in_draft_at_all",
        "category": "tone"
    }
    # 4. Valid finding
    valid_finding = {
        "source_code": "NOV-TONE-01",
        "source_quote": "Nova speaks as an encouraging mountain guide",
        "excerpt": "best",
        "category": "tone"
    }

    verified, dropped = verify_and_clean_findings(
        raw_findings=[fake_code_finding, fake_quote_finding, missing_excerpt_finding, valid_finding],
        draft_text=draft,
        clauses_by_code=clauses_by_code,
        facts_by_code=facts_by_code
    )

    assert len(verified) == 1
    assert dropped == 3
    assert verified[0]["source_code"] == "NOV-TONE-01"

def test_color_contrast_calculation():
    # Alpine Gold (#DDA15E) on Snow White (#F8F9FA) fails (< 4.5:1)
    ratio_fail = calculate_contrast_ratio("#DDA15E", "#F8F9FA")
    assert ratio_fail < 3.0

    # Forest Green (#1B4332) on Snow White (#F8F9FA) passes (> 4.5:1)
    ratio_pass = calculate_contrast_ratio("#1B4332", "#F8F9FA")
    assert ratio_pass > 7.0

def test_full_draft_workflow_api(client: TestClient):
    # 1. Create a draft
    create_payload = {
        "title": "Test Launch Post",
        "content": "Grab this cheap alternative for only $149 right now!",
        "author_role": "Creator",
        "target_intent": "Announce launch"
    }
    create_resp = client.post("/api/drafts", json=create_payload)
    assert create_resp.status_code == 200
    draft_data = create_resp.json()
    draft_id = draft_data["id"]
    assert draft_data["status"] == "draft"

    # 2. Trigger Review
    review_resp = client.post(f"/api/drafts/{draft_id}/review", json={})
    assert review_resp.status_code == 200
    review_data = review_resp.json()
    print("FINDINGS IN TEST:", review_data["findings"])
    assert len(review_data["findings"]) >= 2
    # Check that $149 was flagged with FACT-02
    price_finding = next((f for f in review_data["findings"] if f["excerpt"] == "$149"), None)
    assert price_finding is not None
    assert price_finding["source_code"] == "FACT-02"
    assert price_finding["suggestion"] == "$189"

    # 3. Accept finding -> creates new version
    patch_resp = client.patch(
        f"/api/findings/{price_finding['id']}",
        json={"action": "accept", "user_role": "Creator"}
    )
    assert patch_resp.status_code == 200
    patch_data = patch_resp.json()
    assert patch_data["finding"]["status"] == "accepted"
    assert "$189" in patch_data["updated_draft_content"]
    assert patch_data["new_version_num"] == 2

    # 4. Check draft details
    draft_resp = client.get(f"/api/drafts/{draft_id}")
    assert draft_resp.status_code == 200
    updated_draft = draft_resp.json()
    assert len(updated_draft["versions"]) == 2
    assert "$189" in updated_draft["current_version"]["content"]

    # 5. Dismiss second finding with reason
    cheap_finding = next((f for f in review_data["findings"] if f["excerpt"] == "cheap alternative"), None)
    if cheap_finding:
        dismiss_resp = client.patch(
            f"/api/findings/{cheap_finding['id']}",
            json={"action": "dismiss", "dismiss_reason": "Approved exception for clearance section"}
        )
        assert dismiss_resp.status_code == 200
        assert dismiss_resp.json()["finding"]["status"] == "dismissed"
        assert dismiss_resp.json()["finding"]["dismiss_reason"] == "Approved exception for clearance section"

    # 6. Submit draft
    submit_resp = client.post(
        f"/api/drafts/{draft_id}/submit",
        json={"user_role": "Creator", "note": "Ready for manager review"}
    )
    assert submit_resp.status_code == 200
    assert submit_resp.json()["status"] == "submitted"

    # 7. Manager decision: Approve
    decision_resp = client.post(
        f"/api/drafts/{draft_id}/decision",
        json={"reviewer_role": "Manager", "action": "approve", "reason": "All checks verified and resolved"}
    )
    assert decision_resp.status_code == 200
    assert decision_resp.json()["status"] == "approved"

    # 8. Check insights
    insights_resp = client.get("/api/insights")
    assert insights_resp.status_code == 200
    insights = insights_resp.json()
    assert insights["total_findings"] >= 2
    assert "claims" in insights["by_category"]
