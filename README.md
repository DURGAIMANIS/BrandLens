# BrandLens 🔍

> **Automated Brand Guidelines, Terminology & Approved Fact Checker with Human-in-the-Loop Governance.**

Built for hackathons and marketing teams who need to ensure every word, price, claim, and visual asset adheres to company brand guidelines before publication.

---

## 🌟 The Core Problem & Solution

Companies spend millions crafting brand guidelines, positioning playbooks, and verified fact repositories. Yet marketing drafts frequently ship with:
- Outdated pricing and discontinued promotion codes
- Unsubstantiated claims (e.g. *"98% of customers prefer us"*)
- Banned buzzwords (e.g. *"cheap"*, *"bulletproof"*, greenwashing terms)
- Tone drift (high-pressure FOMO tactics or shaming copy)
- Inaccessible visual combinations (failing WCAG AA color contrast, missing image alt text)

**BrandLens** verifies content in seconds against approved brand rules, explains each issue with an exact guideline or fact citation, suggests an intent-preserving fix, and lets humans make the final decision.

---

## 🏗️ System Architecture

```
                                +------------------------------------------+
                                |             User Browser                 |
                                | (Role Switcher: Creator/Reviewer/Manager)|
                                +--------------------+---------------------+
                                                     |
                                                     v
                                +------------------------------------------+
                                |       Next.js 14 Frontend (Vercel)       |
                                |  - Review Workspace (Interactive Spans)  |
                                |  - Brand Library Browser                 |
                                |  - Manager Approvals Queue               |
                                |  - Version History & Audit Trail         |
                                |  - Compliance Insights Analytics         |
                                +--------------------+---------------------+
                                                     |
                                                     v
                                +------------------------------------------+
                                |      FastAPI Backend (Render/Railway)    |
                                |               /api/review                |
                                +--------------------+---------------------+
                                                     |
                   +---------------------------------+---------------------------------+
                   |                                                                   |
                   v                                                                   v
     +----------------------------+                                      +----------------------------+
     |  1. Deterministic Engine   |                                      |      2. AI Review Call     |
     | - Banned & preferred terms |                                      | - Strict JSON schema       |
     | - Outdated prices & dates  |                                      | - Tone & messaging nuance  |
     | - Unsupported superlatives |                                      | - Intent preservation      |
     | - WCAG AA contrast ratio   |                                      | - Graceful Fallback Mode   |
     | - Pillow image palette/alt |                                      |   (zero error if no key)   |
     +-------------+--------------+                                      +--------------+-------------+
                   |                                                                    |
                   +---------------------------------+----------------------------------+
                                                     |
                                                     v
                                +------------------------------------------+
                                |         3. Traceability Verifier         |
                                | - Discards ungrounded/fake citations     |
                                | - Validates exact substring quotes       |
                                | - Computes precise start/end spans       |
                                | - Deduplicates overlapping findings      |
                                +--------------------+---------------------+
                                                     |
                                                     v
                                +------------------------------------------+
                                |         SQLite / SQLModel Storage        |
                                | - Clauses (27)        - Facts (11)       |
                                | - Terms (10)          - Drafts & Versions|
                                | - Findings & Comments - Decisions        |
                                +------------------------------------------+
```

---

## 🚀 Key Features

1. **Zero-Friction Demo Experience**
   - No login wall. A persistent demo role switcher (`Creator`, `Reviewer`, `Manager`, `Admin`) in the header allows testing multi-user workflows instantly.
2. **Pre-Seeded Fictional Brand: *Nova Outdoor Gear***
   - **27 Numbered Guideline Clauses**: Tone, Terminology, Messaging, Claims, Visual, Accessibility.
   - **11 Approved Facts**: Official prices, certified lab tests, customer surveys, warranties, and expired historical benchmarks.
   - **10 Banned & Preferred Terms**: Clear substitution rules and rationale.
   - **6 Brand Palette Colors**: Accurate hex codes and WCAG AA contrast warnings.
   - **3 Planted Sample Drafts**: 1-click loading to demonstrate immediate error detection.
3. **Multi-Engine Review Pipeline**
   - **Deterministic Rules Engine**: Instant, zero-cost checking of terms, prices, superlatives, contrast math, and image metadata.
   - **Anthropic Claude Integration**: Contextual intent-aware review with strict JSON schemas.
   - **Graceful Fallback Mode**: If `ANTHROPIC_API_KEY` is omitted or unavailable, BrandLens automatically runs in rule-based mode with an informational banner. Never crashes or shows an error screen.
4. **Strict Traceability Verifier**
   - Every finding is mathematically verified against the database. Any finding citing a non-existent ID, a non-verbatim quote, or an invalid span offset is discarded in code.
5. **Human-in-the-Loop Editorial Controls**
   - **Accept**: Applies the suggested fix and automatically records a new version in the audit trail.
   - **Edit**: Lets the writer fine-tune the rewrite before saving.
   - **Dismiss**: Requires a documented reason for exception tracking.
6. **Editorial Governance & Manager Approvals**
   - Writers submit drafts for review. Managers review compliance summaries and issue formal decisions (`Approve` or `Request Changes`) with documented reasoning.
7. **Complete Version History & Audit Trail**
   - Every change, draft version, finding status, comment, and manager decision is preserved at `/history/[draftId]`.
8. **Compliance Insights & Friction Analytics**
   - Aggregates violation frequencies, category distributions, and most-dismissed clauses at `/insights` to identify policy friction.

---

## 🧪 Testing & Accuracy Benchmark

BrandLens includes automated test suites covering deterministic checks, fact mismatch detection, verifier filtering, and state transitions.

### Running Backend Unit Tests:
```bash
# In backend virtualenv
pytest tests/test_backend.py -v
```

### Running the Golden Benchmark:
The evaluation script runs 15 planted scenarios across all compliance categories from `tests/golden_drafts.json`:
```bash
python tests/eval.py
```

Results are saved to `EVAL_RESULTS.md`:
- **Overall Precision**: `100.0%`
- **Overall Recall**: `100.0%`
- **Audit Verifier**: 100% of findings grounded in approved sources.

---

## 🛠️ Local Development Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn backend.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📦 Tech Stack & Libraries Used

### Backend
- **FastAPI**: Modern, high-performance async Python web framework.
- **SQLModel & SQLAlchemy**: Pydantic-powered ORM for SQLite database models.
- **Anthropic Claude API**: LLM for nuance, tone, and intent-aware compliance.
- **Pillow**: Image processing, color quantization, and dominant brand palette matching.
- **python-docx**: Parsing and text extraction from `.docx` files.
- **pytest & httpx**: Comprehensive unit testing and API simulation.

### Frontend
- **Next.js 14 (App Router)**: Fast, server-rendered React framework.
- **TypeScript**: Type safety ensuring sync with backend Pydantic models.
- **Tailwind CSS**: Clean, responsive styling following Nova Outdoor Gear's palette.
- **Lucide React**: Crisp iconography for findings, statuses, and navigation.

---

## 👥 Demo Roles Guide

| Role | Permissions & Workflow |
| :--- | :--- |
| **Creator** | Paste copy, load sample drafts, upload files, run checks, accept/edit/dismiss findings, submit for approval. |
| **Reviewer** | Examine draft findings, add editorial review comments. |
| **Manager** | View submitted drafts in Approvals queue, authorize publication (`Approve`), or request revisions (`Request Changes`). |
| **Admin** | Full system visibility, insights inspection, and brand library management. |

---

## 🛡️ Brand Compliance Principles

- **Human in the Loop**: AI never changes copy automatically. Every change requires an explicit user action.
- **Traceability**: Every finding quotes an approved clause or fact verbatim.
- **Substantiated Claims**: Claims without a verified fact are labeled `"Unsupported (no approved source)"`, never falsely asserted.
