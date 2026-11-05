# BrandLens Evaluation Results
**Benchmark Run**: 2026-11-04 07:48:28 UTC
**Test Suite**: 15 Golden Drafts with planted brand issues across all categories

## Summary Metrics Table

| Category | True Positives (TP) | False Positives (FP) | False Negatives (FN) | Precision | Recall | F1 Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Claims | 7 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| Terminology | 2 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| Tone | 4 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| Accessibility | 2 | 0 | 0 | 100.0% | 100.0% | 100.0% |
| **OVERALL** | 15 | 0 | 0 | 100.0% | 100.0% | 100.0% |

## Per-Draft Evaluation Detail

| Draft # | Test Scenario | Expected | Detected | Outcome |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Outdated Price Launch | 1 | 1 | `PASS` |
| 2 | Banned Term Cheap | 1 | 1 | `PASS` |
| 3 | Unsubstantiated Customer Metric | 1 | 1 | `PASS` |
| 4 | Unqualified Superlative Best | 1 | 1 | `PASS` |
| 5 | Aggressive Tone Urgency | 1 | 1 | `PASS` |
| 6 | Shaming Slacker Copy | 1 | 1 | `PASS` |
| 7 | Extreme Altitude Claim | 1 | 1 | `PASS` |
| 8 | Banned Term Waterproof Claim | 1 | 1 | `PASS` |
| 9 | Vague Eco-Friendly Buzzword | 1 | 1 | `PASS` |
| 10 | Alarmist Solo Hiking Copy | 1 | 1 | `PASS` |
| 11 | Conquest of Nature Ethos | 1 | 1 | `PASS` |
| 12 | Violent Slang Term | 1 | 1 | `PASS` |
| 13 | Failing WCAG Contrast Ratio | 1 | 1 | `PASS` |
| 14 | Missing Image Alt Text | 1 | 1 | `PASS` |
| 15 | Unsubstantiated No 1 Ranking | 1 | 1 | `PASS` |

## Audit Trail & Verifier Performance
- **Traceability Rule**: 100% of detected findings were strictly verified against DB clauses or facts.
- **Span Precision**: 100% of offsets calculated cleanly without offset drift.
- **Fallback Mode Verification**: Zero network dependencies required for rule-based benchmark.
