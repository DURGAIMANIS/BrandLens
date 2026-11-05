"""
AI Review Engine for BrandLens using Anthropic Claude API.
Features:
- Strict JSON output schema.
- Keyword and intent retrieval for relevant clauses/facts (~30 total).
- Graceful fallback to rule-based engine if key is unset, invalid, or API fails.
- Never crashes or shows an error page.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from backend.models import Clause, Fact
from backend.config import settings

logger = logging.getLogger("brandlens.ai_engine")

AI_SYSTEM_PROMPT = """You are BrandLens AI, a brand compliance reviewer for Nova Outdoor Gear.
Analyze the user's draft content against Nova Outdoor Gear's approved brand guidelines and facts.
Focus on subtle nuances in tone, messaging ethos, and unverified claims that keep the writer's intent.

CRITICAL INSTRUCTIONS:
1. Every finding MUST cite an exact `source_code` from the provided guidelines/facts.
2. `source_quote` MUST be an exact verbatim substring of the cited guideline text or fact statement.
3. `excerpt` MUST be an exact verbatim substring of the user draft.
4. Suggestions must preserve the writer's original intent while making the text compliant.
5. If a claim lacks an approved source, label it "Unsupported (no approved source)", never "false".
6. Return strictly valid JSON adhering to the provided JSON schema. No conversational filler.
"""

def select_relevant_clauses_and_facts(
    draft_text: str,
    target_intent: Optional[str],
    all_clauses: List[Clause],
    all_facts: List[Fact],
    limit_clauses: int = 15,
    limit_facts: int = 10
) -> Tuple[List[Clause], List[Fact]]:
    """
    Selects relevant clauses and facts based on keyword and category overlap.
    """
    query_text = f"{draft_text} {target_intent or ''}".lower()
    
    # Score clauses
    scored_clauses = []
    for c in all_clauses:
        score = 0
        keywords = f"{c.category} {c.title} {c.text}".lower()
        # Count keyword overlap
        for word in ["tone", "cheap", "waterproof", "guarantee", "discount", "price", "claim", "mountain", "conquer", "image", "alt", "contrast"]:
            if word in query_text and word in keywords:
                score += 3
        # Direct word matches
        tokens = [t for t in c.title.lower().split() if len(t) > 3]
        for token in tokens:
            if token in query_text:
                score += 2
        scored_clauses.append((score, c))
    
    scored_clauses.sort(key=lambda x: -x[0])
    selected_clauses = [c for _, c in scored_clauses[:limit_clauses]]

    # Score facts
    scored_facts = []
    for f in all_facts:
        score = 0
        fact_tokens = f"{f.topic} {f.statement} {f.value}".lower().split()
        for ft in fact_tokens:
            if len(ft) > 3 and ft in query_text:
                score += 2
        scored_facts.append((score, f))
    
    scored_facts.sort(key=lambda x: -x[0])
    selected_facts = [f for _, f in scored_facts[:limit_facts]]

    return selected_clauses, selected_facts

def run_ai_review(
    draft_text: str,
    target_intent: Optional[str],
    all_clauses: List[Clause],
    all_facts: List[Fact]
) -> Tuple[List[Dict[str, Any]], bool, str, str, Optional[str]]:
    """
    Attempts Anthropic Claude review.
    Returns:
    (raw_findings, ai_used, model_name, text_sent, banner_message)
    """
    api_key = settings.ANTHROPIC_API_KEY or os.environ.get("ANTHROPIC_API_KEY", "")
    text_preview = draft_text[:250] + ("..." if len(draft_text) > 250 else "")

    if not api_key:
        logger.info("No ANTHROPIC_API_KEY provided; falling back to rule-based mode.")
        return [], False, "Rule-based Engine (Fallback)", text_preview, "AI unavailable, rule-based mode"

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        relevant_clauses, relevant_facts = select_relevant_clauses_and_facts(
            draft_text, target_intent, all_clauses, all_facts
        )

        guidelines_payload = [
            {"code": c.code, "category": c.category, "title": c.title, "text": c.text}
            for c in relevant_clauses
        ]
        facts_payload = [
            {"code": f.code, "topic": f.topic, "statement": f.statement, "value": f.value, "valid_until": f.valid_until}
            for f in relevant_facts
        ]

        user_content = json.dumps({
            "target_intent": target_intent or "General brand compliance review",
            "draft_text": draft_text,
            "available_guidelines": guidelines_payload,
            "available_facts": facts_payload,
            "instructions": "Return JSON with schema: {\"findings\": [{\"category\": str, \"severity\": \"high\"|\"medium\"|\"low\", \"excerpt\": str, \"explanation\": str, \"source_type\": \"clause\"|\"fact\", \"source_code\": str, \"source_quote\": str, \"suggestion\": str}]}"
        }, indent=2)

        response = client.messages.create(
            model=settings.AI_MODEL,
            max_tokens=2048,
            temperature=0.1,
            system=AI_SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_content}
            ]
        )

        response_text = ""
        for block in response.content:
            if getattr(block, "text", None):
                response_text += block.text

        # Extract JSON from potential code fences or raw text
        cleaned_json = response_text.strip()
        if "```json" in cleaned_json:
            cleaned_json = cleaned_json.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in cleaned_json:
            cleaned_json = cleaned_json.split("```", 1)[1].split("```", 1)[0].strip()

        data = json.loads(cleaned_json)
        raw_findings = data.get("findings", [])
        logger.info(f"AI returned {len(raw_findings)} candidate findings.")

        return raw_findings, True, settings.AI_MODEL, text_preview, None

    except Exception as exc:
        logger.warning(f"AI call failed ({exc}); falling back gracefully to rule-based mode.")
        return [], False, "Rule-based Engine (Fallback)", text_preview, "AI unavailable, rule-based mode"

