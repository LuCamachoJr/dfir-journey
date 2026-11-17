# BreachSum — Security+ Readiness Lab

Public, buildless Security+ SY0-701 practice app. Hosted by the parent repository's existing Hugo → GitHub Pages workflow. Hugo copies `static/securityplus/` directly to `/securityplus/`.

## Features

- 264 original items available for new sessions: 249 scenario questions and 15 hands-on PBQs. Ten earlier case studies remain available for reviewing or resuming saved sessions.
- Timed 90-question exams: D1 11, D2 20, D3 16, D4 25, D5 18; one PBQ per domain.
- Random question/option order, unseen questions preferred, two completely fresh full exams supported by the bank.
- Adaptive 20-question practice; targeted domain practice; PBQ workshop.
- Exact-match MCQ scoring and equal partial credit inside PBQs. One possible point per exam item.
- Deferred exam feedback; optional immediate practice feedback with answer locking; per-option explanations.
- Individual local profiles, saved sessions, timer persistence, confidence/flag review, domain/objective reports, history, export/import.
- Readiness heuristics explicitly separated from CompTIA scoring and pass probabilities.

## Use

Open the page, create a nickname, and start a timed diagnostic. After submission, indicate whether it was completed closed-book. Review mistakes and uncertain answers, adjust estimated improvement potential under Progress, then use focused practice. Validate readiness with unfamiliar independent material.

## Storage / identity

This release intentionally has no authentication backend, email collection, analytics, or central scores. Profiles use browser `localStorage` under `breachsum-readiness-v1`. Profiles are **not authenticated or protected from other people sharing the browser**. Clearing site data removes them. Export backups before changing devices; import makes a separate profile to avoid overwriting existing progress.

For real sign-in and cloud sync, configure a maintained identity provider and database (for example, Supabase Auth + Postgres row-level security). Keep service-role secrets off GitHub Pages, isolate records by authenticated user ID, implement account deletion/export, and test authorization server-side. No fake login form or password storage is included.

## Scoring method

The dashboard, Progress page and score report display the same recommendation. “Ready to schedule” uses the last 30 days. The two latest qualifying closed-book, timed full exams must each have at least 63 first-seen items and meet 85% overall, 75% in every domain and 75% on PBQs. A later weak closed-book exam flags review even if it used repeated items. Quiz evidence requires 80% on the last 20 first-seen adaptive or domain quiz items, or 75% on the last five first-seen workshop cases. Both must meet target if both samples are large enough. A smaller sample remains provisional. Historical case-study workshops do not count as hands-on evidence. If both qualifying exams used the earlier case format, a qualifying hands-on workshop is required. These locally chosen thresholds have no validated conversion to CompTIA scoring.

The remaining fresh capacity respects domain and item quotas. The app flags when fewer than 63 first-seen items remain for a new local exam and directs the learner to independent material. It cannot observe exams or quizzes taken elsewhere.

Priority = domain weight × smoothed gap × learner-estimated improvement potential. Smoothed gap is `1 − (points + 1)/(items + 2)` across the last three completed sessions. Potential defaults to 1; user can select 0.75 / 1 / 1.25. Adaptive allocation starts with two per domain and allocates ten more toward priority. Low sample sizes and repeated items are visible.

## Development

Requires no production packages or build step. Use an HTTP static server to preview; ES modules and JSON fetch do not work reliably over `file://`.

```sh
node --test engine.test.mjs
```

Tests cover blueprint consistency over 1,000 randomized exams, option-key remapping, uniqueness, coverage, two fresh exams, partial/exact scoring, adaptive allocation, and readiness exclusions. The tests also exercise freshness limits, quiz and workshop corroboration, equivalent text and numeric entries, the firewall preview, and legacy profile backups.

The original bank in `questions.json` and the additional bank in `applied.json` have domain/objective IDs, original stems, answer options, correct indices, and feedback for every option. Current PBQs use separate exhibit tables and configuration or evidence-entry fields. Menus and scenario choices are shuffled. Dates, event timelines and field order retain their operational meaning. Typed entries support explicit equivalent answers; number fields accept equivalent decimal and thousands formatting. The firewall preview computes the behavior of the entered rule against sample traffic. Preserve IDs across wording-only fixes; use new IDs for materially different assessment items so prior first-seen history remains meaningful. Public answer keys make this a learning app, not a proctored assessment.

## References

- [CompTIA official SY0-701 objectives](https://assets.ctfassets.net/82ripq7fjls2/6TYWUym0Nudqa8nGEnegjG/0f9b974d3b1837fe85ab8e6553f4d623/CompTIA-Security-Plus-SY0-701-Exam-Objectives.pdf)
- [CompTIA PBQ format and public simulation example](https://www.comptia.org/en-us/resources/test-policies/exam-development/performance-based-questions-explained/)
- [NIST SP 800-61 Rev. 3](https://doi.org/10.6028/NIST.SP.800-61r3)
- [NIST SP 800-207](https://doi.org/10.6028/NIST.SP.800-207)
- [NIST SP 800-30 Rev. 1](https://doi.org/10.6028/NIST.SP.800-30r1)

SY0-701 phase terminology is retained for exam alignment; the Method page distinguishes current NIST incident-response guidance. Vendor-specific examples are supplemental. Independent educational project; not affiliated with or endorsed by CompTIA.
