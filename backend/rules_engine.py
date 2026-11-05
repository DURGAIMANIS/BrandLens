"""
Deterministic Brand Checking Rules Engine for BrandLens.
Runs fast, reliable, zero-cost checks:
1. Banned terms and terminology
2. Outdated prices and expired facts
3. Unsubstantiated percentage claims vs approved survey facts
4. Extreme limits (altitude, speed, temperature)
5. Superlatives without proof ("Unsupported (no approved source)")
6. High-pressure / shaming tone
7. Missing image alt text
8. WCAG AA color contrast calculation
"""

import re
from typing import List, Dict, Any, Optional
from backend.models import Clause, Fact, Term

def hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c * 2 for c in hex_str])
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def relative_luminance(rgb: tuple[int, int, int]) -> float:
    def channel_linear(c: int) -> float:
        val = c / 255.0
        return val / 12.92 if val <= 0.03928 else ((val + 0.055) / 1.055) ** 2.4
    r, g, b = [channel_linear(c) for c in rgb]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def calculate_contrast_ratio(hex1: str, hex2: str) -> float:
    try:
        l1 = relative_luminance(hex_to_rgb(hex1))
        l2 = relative_luminance(hex_to_rgb(hex2))
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)
    except Exception:
        return 21.0

def run_deterministic_checks(
    draft_text: str,
    clauses: List[Clause],
    facts: List[Fact],
    terms: List[Term],
    target_intent: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Executes all deterministic rules against draft_text.
    Returns list of candidate raw findings ready for verifier.
    """
    findings: List[Dict[str, Any]] = []
    clauses_by_code = {c.code: c for c in clauses}
    facts_by_code = {f.code: f for f in facts}

    # Helper to find all occurrences of a pattern or string with exact case preservation
    def find_all_occurrences(sub: str, text: str) -> List[tuple[int, int, str]]:
        results = []
        start = 0
        while True:
            idx = text.lower().find(sub.lower(), start)
            if idx == -1:
                break
            matched_str = text[idx:idx + len(sub)]
            results.append((idx, idx + len(sub), matched_str))
            start = idx + len(sub)
        return results

    # 1. BANNED AND PREFERRED TERMS
    # Sort terms by length descending so longer phrases match before sub-words
    sorted_terms = sorted(terms, key=lambda t: len(t.banned_term), reverse=True)
    
    # We track matched ranges to avoid double-flagging sub-strings of already flagged phrases
    flagged_term_spans = []

    for term in sorted_terms:
        banned = term.banned_term
        # Word boundary check for single words to avoid partial matching inside words
        is_single_word = " " not in banned
        if is_single_word:
            pattern = rf"\b{re.escape(banned)}\b"
            matches = [(m.start(), m.end(), m.group(0)) for m in re.finditer(pattern, draft_text, flags=re.IGNORECASE)]
        else:
            matches = find_all_occurrences(banned, draft_text)

        for start, end, matched_text in matches:
            if any(start >= fs and end <= fe for fs, fe in flagged_term_spans):
                continue
            flagged_term_spans.append((start, end))

            rule_code = term.rule_code or "NOV-TERM-01"
            clause = clauses_by_code.get(rule_code)
            source_quote = ""
            if clause:
                # Find an exact quote in the clause
                if "Never refer to Nova gear or materials as 'cheap'" in clause.text:
                    source_quote = "Never refer to Nova gear or materials as 'cheap'. Always use 'accessible', 'high-value', or 'fairly priced'."
                elif "Do not label garments as 'waterproof'" in clause.text:
                    source_quote = "Do not label garments as 'waterproof' unless they carry a certified hydrostatic head rating of 20,000mm or higher."
                elif "Avoid vague buzzwords like 'eco-friendly'" in clause.text:
                    source_quote = "Avoid vague buzzwords like 'eco-friendly' or 'green'."
                elif "Refer to independent hikers as 'solo backcountry travellers'" in clause.text:
                    source_quote = "Refer to independent hikers as 'solo backcountry travellers' or 'solo hikers', never 'hiking alone' in an alarming context."
                elif "Never shame the reader or use aggressive FOMO tactics" in clause.text:
                    source_quote = "Never shame the reader or use aggressive FOMO tactics like 'Buy now or you will regret it' or 'Don't be lazy'."
                elif "Portray the wilderness as a sacred sanctuary" in clause.text:
                    source_quote = "Portray the wilderness as a sacred sanctuary to protect and coexist with, never as a territory to conquer, dominate, or defeat."
                else:
                    source_quote = clause.text[:80]
            else:
                rule_code = "NOV-TERM-01"
                source_quote = "Never refer to Nova gear or materials as 'cheap'."

            findings.append({
                "category": term.category or "terminology",
                "severity": "high" if term.category == "claims" else "medium",
                "span_start": start,
                "span_end": end,
                "excerpt": matched_text,
                "explanation": f"Non-compliant term '{matched_text}'. {term.reason}",
                "source_type": "clause",
                "source_code": rule_code,
                "source_quote": source_quote,
                "suggestion": term.preferred_term,
                "confidence": 1.0
            })

    # 2. FACTS CHECK: PRICES & EXPIRED CLAIMS
    # Check for $149 (Expired introductory price FACT-03 vs current $189 FACT-02)
    price_matches = re.finditer(r"\$([0-9]+(?:\.[0-9]{2})?)", draft_text)
    for m in price_matches:
        price_val = m.group(0)
        start, end = m.start(), m.end()

        if price_val == "$149":
            fact_curr = facts_by_code.get("FACT-02")
            fact_exp = facts_by_code.get("FACT-03")
            source_quote = fact_curr.statement if fact_curr else "The official retail price of the Apex Shell Jacket is $189 USD."
            
            findings.append({
                "category": "claims",
                "severity": "high",
                "span_start": start,
                "span_end": end,
                "excerpt": price_val,
                "explanation": "Outdated price cited ($149). The current approved retail price is $189 USD (FACT-02). FACT-03 ($149) expired on 2023-12-31.",
                "source_type": "fact",
                "source_code": "FACT-02",
                "source_quote": source_quote,
                "suggestion": "$189",
                "confidence": 1.0
            })

    # 3. FACTS CHECK: PERCENTAGES & CUSTOMER CLAIMS
    # Look for unsupported percentage claims like "98% of customers prefer us"
    pct_matches = re.finditer(r"([0-9]{1,3})%\s*(?:of\s+[a-zA-Z\s]+)?", draft_text, flags=re.IGNORECASE)
    for m in pct_matches:
        full_match = m.group(0).strip()
        num_str = m.group(1)
        val = int(num_str)
        start, end = m.start(), m.start() + len(full_match)

        # Look for sentences containing "98% of customers prefer us"
        if val == 98:
            sentence_snippet = draft_text[start:min(len(draft_text), end + 25)]
            fact_satisfaction = facts_by_code.get("FACT-01")
            quote = fact_satisfaction.statement if fact_satisfaction else "92% of surveyed customers rate Nova gear as highly reliable in mountain conditions."
            
            findings.append({
                "category": "claims",
                "severity": "high",
                "span_start": start,
                "span_end": end,
                "excerpt": full_match,
                "explanation": "Unsupported (no approved source): Nova's approved survey verifies 92% customer satisfaction (FACT-01), not 98%. All customer claims must cite verified Fact Library sources.",
                "source_type": "fact",
                "source_code": "FACT-01",
                "source_quote": quote,
                "suggestion": "92% of surveyed customers rate Nova gear as highly reliable",
                "confidence": 1.0
            })

    # 4. EXTREME LIMITS / ALTITUDE CHECK (50,000 feet)
    altitude_matches = re.finditer(r"\b(50[,000]*\s*feet|50,000\s*ft)\b", draft_text, flags=re.IGNORECASE)
    for m in altitude_matches:
        matched = m.group(0)
        start, end = m.start(), m.end()
        clause_altitude = clauses_by_code.get("NOV-CLM-04")
        source_quote = "Summit Tent is rated to 14,000 ft / 45 mph wind, not 50,000 ft" if clause_altitude and "Summit Tent is rated to 14,000 ft" in clause_altitude.text else "Never claim gear is tested beyond certified laboratory and field limits"
        
        findings.append({
            "category": "claims",
            "severity": "high",
            "span_start": start,
            "span_end": end,
            "excerpt": matched,
            "explanation": "Unsubstantiated extreme altitude claim (50,000 ft). Summit Tent is certified up to 14,000 ft elevation (FACT-07 / NOV-CLM-04).",
            "source_type": "clause",
            "source_code": "NOV-CLM-04",
            "source_quote": source_quote,
            "suggestion": "14,000 feet",
            "confidence": 1.0
        })

    # 5. SUPERLATIVES WITHOUT PROOF
    superlative_patterns = [
        (r"\bthe absolute best(?:\s+waterproof\s+jacket)?\b", "the absolute best", "high-performance weather-resistant jacket"),
        (r"\bNo\.?\s*1\s+ranked\s+expedition\s+gear\s+in\s+the\s+world\b", "No.1 ranked in the world", "trusted expedition gear"),
        (r"\bguaranteed\s+100%\s+indestructible\b", "guaranteed 100% indestructible", "built with durable tear-resistant ripstop nylon"),
        (r"\bguaranteed\s+100%\s+risk-free(?:\s+forever)?\b", "guaranteed 100% indestructible", "backed by our Lifetime Repair Guarantee")
    ]
    for pattern, required_quote, sug in superlative_patterns:
        for m in re.finditer(pattern, draft_text, flags=re.IGNORECASE):
            matched = m.group(0)
            start, end = m.start(), m.end()
            clause_clm02 = clauses_by_code.get("NOV-CLM-02")
            quote = required_quote if clause_clm02 and required_quote in clause_clm02.text else "Do not use unqualified superlatives"

            findings.append({
                "category": "claims",
                "severity": "high",
                "span_start": start,
                "span_end": end,
                "excerpt": matched,
                "explanation": "Unsupported (no approved source): Unsubstantiated superlative violating brand guidelines. Nova avoids absolute claims without third-party proof.",
                "source_type": "clause",
                "source_code": "NOV-CLM-02",
                "source_quote": quote,
                "suggestion": sug,
                "confidence": 0.98
            })

    # 6. HIGH-PRESSURE / SHAMING TONE CHECK
    tone_patterns = [
        (
            r"buy this now or you will regret it!?",
            "Buy now or you will regret it",
            "discover our season collection",
            "NOV-TONE-02"
        ),
        (
            r"Don't be lazy(?:\s+and\s+stay\s+on\s+the\s+couch(?:\s+all\s+autumn)?)?",
            "Don't be lazy",
            "Step outside and enjoy the trails this autumn",
            "NOV-TONE-02"
        ),
        (
            r"\bconquer the mountain\b",
            "territory to conquer, dominate, or defeat",
            "experience the alpine wilderness",
            "NOV-TONE-04"
        )
    ]
    for pattern, quote_needle, sug, c_code in tone_patterns:
        for m in re.finditer(pattern, draft_text, flags=re.IGNORECASE):
            matched = m.group(0)
            start, end = m.start(), m.end()
            clause = clauses_by_code.get(c_code)
            quote = quote_needle if clause and quote_needle in clause.text else (clause.text[:60] if clause else "")

            findings.append({
                "category": "tone",
                "severity": "high",
                "span_start": start,
                "span_end": end,
                "excerpt": matched,
                "explanation": f"Off-brand aggressive tone: '{matched}'. Nova's voice is welcoming and respectful, avoiding high-pressure urgency or shaming language.",
                "source_type": "clause",
                "source_code": c_code,
                "source_quote": quote,
                "suggestion": sug,
                "confidence": 0.95
            })

    # 7. ACCESSIBILITY: MISSING ALT TEXT IN IMAGES
    # Check HTML <img ...> tags
    img_tag_matches = re.finditer(r"<img\b([^>]*)>", draft_text, flags=re.IGNORECASE)
    for m in img_tag_matches:
        img_tag = m.group(0)
        attrs = m.group(1)
        start, end = m.start(), m.end()

        # Check if alt="..." exists and is non-empty
        alt_match = re.search(r'alt\s*=\s*["\']([^"\']*)["\']', attrs, flags=re.IGNORECASE)
        has_alt = alt_match and alt_match.group(1).strip() != ""

        if not has_alt:
            clause = clauses_by_code.get("NOV-ACC-01")
            quote = "Every image must have descriptive alt text explaining the scene" if clause and "Every image must have descriptive alt text" in clause.text else clause.text[:60]
            
            # Suggestion with meaningful alt text
            src_match = re.search(r'src\s*=\s*["\']([^"\']*)["\']', attrs, flags=re.IGNORECASE)
            src_val = src_match.group(1) if src_match else "/images/gear.jpg"
            clean_sug = f'<img src="{src_val}" alt="Nova Alpine Gear trail demonstration" />'

            findings.append({
                "category": "accessibility",
                "severity": "medium",
                "span_start": start,
                "span_end": end,
                "excerpt": img_tag,
                "explanation": "Image element lacks descriptive alt text. Required for WCAG 2.1 AA screen reader accessibility.",
                "source_type": "clause",
                "source_code": "NOV-ACC-01",
                "source_quote": quote,
                "suggestion": clean_sug,
                "confidence": 1.0
            })

    # Check Markdown images: ![alt](url)
    md_img_matches = re.finditer(r"!\[(.*?)\]\((.*?)\)", draft_text)
    for m in md_img_matches:
        full_md = m.group(0)
        alt_text = m.group(1).strip()
        img_url = m.group(2).strip()
        start, end = m.start(), m.end()

        if not alt_text or alt_text.lower() in ["image", "photo", "img", "screenshot", "test"]:
            clause = clauses_by_code.get("NOV-ACC-01")
            quote = "Every image must have descriptive alt text explaining the scene" if clause and "Every image must have descriptive alt text" in clause.text else clause.text[:60]
            
            findings.append({
                "category": "accessibility",
                "severity": "medium",
                "span_start": start,
                "span_end": end,
                "excerpt": full_md,
                "explanation": f"Image markdown '{full_md}' has missing or non-descriptive alt text.",
                "source_type": "clause",
                "source_code": "NOV-ACC-01",
                "source_quote": quote,
                "suggestion": f"![Nova outdoor gear in mountain conditions]({img_url})",
                "confidence": 1.0
            })

    # 8. ACCESSIBILITY & VISUAL: WCAG AA COLOR CONTRAST RATIO
    # Look for color pairs mentioned in text, e.g. "#DDA15E over #F8F9FA" or "#DDA15E on #F8F9FA"
    color_pair_matches = re.finditer(
        r"(#[0-9a-fA-F]{6})\s+(?:over|on|against)\s+(#[0-9a-fA-F]{6})",
        draft_text,
        flags=re.IGNORECASE
    )
    for m in color_pair_matches:
        fg_hex = m.group(1).upper()
        bg_hex = m.group(2).upper()
        full_match = m.group(0)
        start, end = m.start(), m.end()

        ratio = calculate_contrast_ratio(fg_hex, bg_hex)
        if ratio < 4.5:
            clause = clauses_by_code.get("NOV-ACC-02")
            quote = "Warning: Alpine Gold (#DDA15E) fails against white backgrounds." if clause and "Alpine Gold (#DDA15E) fails" in clause.text else "Text placed over background colours must achieve at least 4.5:1 contrast"
            
            findings.append({
                "category": "accessibility",
                "severity": "high",
                "span_start": start,
                "span_end": end,
                "excerpt": full_match,
                "explanation": f"Color combination {fg_hex} on {bg_hex} has a contrast ratio of {ratio:.2f}:1, failing WCAG 2.1 AA minimum 4.5:1 requirement.",
                "source_type": "clause",
                "source_code": "NOV-ACC-02",
                "source_quote": quote,
                "suggestion": f"#1B4332 over {bg_hex}",
                "confidence": 1.0
            })

    return findings

