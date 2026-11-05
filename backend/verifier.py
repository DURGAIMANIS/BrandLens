"""
Traceability Verifier for BrandLens.
Ensures every finding is 100% auditable and strictly traceable:
1. source_code must exist in DB (Clause or Fact).
2. source_quote must be an exact substring of the stored source text.
3. excerpt must be an exact substring of the draft text.
4. Spans (span_start, span_end) are calculated accurately in Python code.
5. Overlapping spans are deduped (keeping higher severity / higher confidence).
6. Dropped findings are logged.
"""

from typing import List, Tuple, Dict, Any, Optional
import logging
from backend.models import Clause, Fact

logger = logging.getLogger("brandlens.verifier")

SEVERITY_WEIGHT = {
    "high": 3,
    "medium": 2,
    "low": 1
}

def verify_and_clean_findings(
    raw_findings: List[Dict[str, Any]],
    draft_text: str,
    clauses_by_code: Dict[str, Clause],
    facts_by_code: Dict[str, Fact]
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Validates, filters, calculates exact offsets, and dedupes candidate findings.
    Returns (verified_findings, dropped_count).
    """
    verified: List[Dict[str, Any]] = []
    dropped_count = 0

    for idx, f in enumerate(raw_findings):
        source_code = (f.get("source_code") or "").strip()
        source_type = (f.get("source_type") or "clause").strip().lower()
        source_quote = (f.get("source_quote") or "").strip()
        excerpt = (f.get("excerpt") or "").strip()

        # 1. Check source existence
        source_obj = None
        if source_type == "fact" or source_code.startswith("FACT-"):
            source_obj = facts_by_code.get(source_code)
            source_type = "fact"
        else:
            source_obj = clauses_by_code.get(source_code)
            source_type = "clause"

        if not source_obj:
            logger.warning(f"Drop finding #{idx}: Unknown source_code '{source_code}'")
            dropped_count += 1
            continue

        # 2. Check source_quote is an exact substring of the stored source
        stored_text = ""
        if isinstance(source_obj, Fact):
            # Check statement, value, or source
            stored_text = f"{source_obj.statement} {source_obj.value} {source_obj.source}"
        elif isinstance(source_obj, Clause):
            stored_text = f"{source_obj.title} {source_obj.text}"

        if not source_quote or source_quote not in stored_text:
            logger.warning(
                f"Drop finding #{idx}: source_quote '{source_quote}' not found in stored {source_code} ('{stored_text[:60]}...')"
            )
            dropped_count += 1
            continue

        # 3. Check excerpt is an exact substring of the draft
        if not excerpt or excerpt not in draft_text:
            logger.warning(f"Drop finding #{idx}: excerpt '{excerpt}' is not a substring of draft")
            dropped_count += 1
            continue

        # 4. Compute accurate span offsets in draft_text
        # Find first matching index, or use provided span if it matches excerpt exactly
        provided_start = f.get("span_start")
        provided_end = f.get("span_end")
        
        computed_start = -1
        computed_end = -1

        if (
            isinstance(provided_start, int)
            and isinstance(provided_end, int)
            and 0 <= provided_start < provided_end <= len(draft_text)
            and draft_text[provided_start:provided_end] == excerpt
        ):
            computed_start = provided_start
            computed_end = provided_end
        else:
            # Locate exact occurrence in draft_text
            computed_start = draft_text.find(excerpt)
            if computed_start == -1:
                dropped_count += 1
                continue
            computed_end = computed_start + len(excerpt)

        # Standardize fields
        clean_finding = {
            "category": f.get("category", "messaging"),
            "severity": f.get("severity", "medium").lower(),
            "span_start": computed_start,
            "span_end": computed_end,
            "excerpt": excerpt,
            "explanation": f.get("explanation", "Flagged by brand guidelines check."),
            "source_type": source_type,
            "source_code": source_code,
            "source_quote": source_quote,
            "suggestion": f.get("suggestion", ""),
            "confidence": float(f.get("confidence", 0.95)),
            "status": "open",
            "dismiss_reason": None
        }

        # Normalize severity
        if clean_finding["severity"] not in ["high", "medium", "low"]:
            clean_finding["severity"] = "medium"

        verified.append(clean_finding)

    # 5. Deduplicate overlapping findings
    # Sort by span_start asc, then by severity weight desc, then confidence desc
    verified.sort(
        key=lambda x: (
            x["span_start"],
            -SEVERITY_WEIGHT.get(x["severity"], 1),
            -x["confidence"],
            -(x["span_end"] - x["span_start"])
        )
    )

    non_overlapping: List[Dict[str, Any]] = []
    for item in verified:
        overlaps = False
        for kept in non_overlapping:
            # Overlap check: [start1, end1) and [start2, end2)
            if max(item["span_start"], kept["span_start"]) < min(item["span_end"], kept["span_end"]):
                # Overlaps! If duplicate excerpt or identical span, skip it
                overlaps = True
                break
        if not overlaps:
            non_overlapping.append(item)
        else:
            logger.info(f"Deduplicated overlapping finding at [{item['span_start']}, {item['span_end']}]: '{item['excerpt']}'")
            dropped_count += 1

    # 6. Sort final findings by severity (high -> medium -> low), then span_start
    non_overlapping.sort(
        key=lambda x: (
            -SEVERITY_WEIGHT.get(x["severity"], 1),
            x["span_start"]
        )
    )

    logger.info(f"Verifier kept {len(non_overlapping)} findings, dropped {dropped_count}")
    return non_overlapping, dropped_count

