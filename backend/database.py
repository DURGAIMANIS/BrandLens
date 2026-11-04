from sqlmodel import SQLModel, create_engine, Session, select
from backend.config import settings
from backend.models import Clause, Fact, Term, Draft, DraftVersion
from backend.seed_data import SEED_CLAUSES, SEED_FACTS, SEED_TERMS, SEED_SAMPLE_DRAFTS

# Connect args for SQLite to allow multi-threading in FastAPI
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)

def get_session():
    with Session(engine, expire_on_commit=False) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)
    seed_database_if_empty()

def seed_database_if_empty():
    with Session(engine) as session:
        existing_clause = session.exec(select(Clause)).first()
        if not existing_clause:
            print("[BrandLens DB] Seeding initial clauses...")
            for c in SEED_CLAUSES:
                clause = Clause(**c)
                session.add(clause)
            session.commit()

        existing_fact = session.exec(select(Fact)).first()
        if not existing_fact:
            print("[BrandLens DB] Seeding initial facts...")
            for f in SEED_FACTS:
                fact = Fact(**f)
                session.add(fact)
            session.commit()

        existing_term = session.exec(select(Term)).first()
        if not existing_term:
            print("[BrandLens DB] Seeding initial terms...")
            for t in SEED_TERMS:
                term = Term(**t)
                session.add(term)
            session.commit()

        existing_draft = session.exec(select(Draft)).first()
        if not existing_draft:
            print("[BrandLens DB] Seeding sample drafts...")
            for s in SEED_SAMPLE_DRAFTS:
                draft = Draft(
                    title=s["title"],
                    author_role=s["author_role"],
                    target_intent=s["target_intent"],
                    status="draft"
                )
                session.add(draft)
                session.commit()
                session.refresh(draft)

                # Create initial draft version
                version = DraftVersion(
                    draft_id=draft.id,
                    version_num=1,
                    content=s["content"],
                    change_summary="Initial sample draft with planted brand issues"
                )
                session.add(version)
                session.commit()
            print("[BrandLens DB] Seeding complete!")
