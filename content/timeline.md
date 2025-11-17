---
title: "DFIR Journey Timeline"
description: "Chronological log of labs, tools, and DFIR experiments."
---

# DFIR Journey — Timeline

This timeline tracks my **DFIR Journey** from foundations → labs → tools.  
Entries are ordered **oldest to newest** so you can follow the arc as it actually unfolded.

---

## 2025

### Before October 2025 — Foundations & Direction

- Spent years as a **tinkerer**: home labs, break/fix, and tech troubleshooting.
- Completed **B.S. in Cybersecurity (CTU)** and started **M.S. in Cybersecurity & Information Assurance (WGU)**.
- Decided to focus on **Digital Forensics & Incident Response (DFIR)** and **SOC-style analysis** as the primary career lane.
- Began building a personal brand around this path under the umbrella of **“DFIR Journey.”**

---

### Early October 2025 — HTB “Windows Event Logs & Finding Evil”

- Worked through a **Hack The Box module on Windows Event Logs & Finding Evil**.
- Learned how painful it is to manually read **EVTX** at scale and how powerful **Chainsaw + Sigma** can be.
- Seed idea formed: *“What if an AI co-pilot could help narrate these detections like a human analyst?”*
- This was the spark that eventually became **ForenSynth AI**.

---

### 2025-10-22 — Random DFIR Noise Simulator (POC)

- Built a **Random DFIR Noise Simulator** PowerShell script to generate:
  - Safe but realistic **Windows process, logon, and file activity**.
  - Repeatable patterns to test detections and summarization.
- Purpose:
  - Create **controlled “fake evil”** for tuning log workflows.
  - Avoid using real malware while still exercising DFIR muscles.
- Logged artifacts and early output as part of the **DFIR Journey lab archive**.

---

### 2025-10-24 — ForenSynth AI v2.3.3 (Visual Refresh)

- Shipped **ForenSynth AI v2.3.3**, a DFIR report generator that:
  - Consumes **Chainsaw JSON output** from Sigma hunts.
  - Uses **OpenAI (gpt-5-mini + gpt-5)** to generate structured summaries:
    - Executive narrative
    - TTP/ATT&CK mapping
    - Recommendations & quick wins
- Added the first **visual HTML report elements**:
  - Event **heatmap** over time.
  - Donut charts by **attack phase**.
- Ran it against multi-day EVTX logs and captured **screenshots + reports** for GitHub and the DFIR Journey site.

---

### 2025-10-25 — Sampling & Micro-Governor (POC)

- Faced real-world constraint: some hunts produced **2K–3K+ detections**, which made summarization:
  - Expensive
  - Slow
  - Operationally unrealistic for everyday use
- Implemented **post-hunt sampling**:
  - `--limit-detections` and `--sample-step` to down-select detections (e.g., 2705 → 902).
  - Preserved **representative coverage** instead of blindly summarizing everything.
- Introduced the idea of a **“micro-governor”**:
  - Controls how many micro-summaries are sent to the model.
  - Keeps runtime and cost **bounded** while still producing a coherent executive report.
- Validated that ForenSynth AI can still tell a strong story with **sampled detections**, not just full sets.

---

### 2025-11-02 — ForenSynth AI v2.3.4 Polish Run

- Released **v2.3.4 (Polish)** with multiple quality-of-life and “consultancy polish” upgrades:
  - **HTML report** refinements:
    - Donut charts relabeled with **MITRE-style phases** (Execution, Persistence, Lateral, Defense Evasion, Unmapped/Multiple).
    - Clearer legends with **counts + percentages**.
    - Heatmap caption and **Event ID footnote** so readers understand what they’re seeing.
  - **Evidence Appendix**:
    - CSV export of key evidence (`--export-evidence-csv`).
    - Easier to pivot into SIEM, spreadsheets, or ticketing systems.
  - **Cost realism**:
    - Switched from estimated token costs to **actual billing usage** via `resp.usage`.
    - Aligned local cost display with OpenAI dashboard numbers.
- Captured a full **polish run** and published artifacts:
  - Markdown report
  - HTML report
  - Evidence CSV
  - `detections.json`
- Integrated this run into:
  - **ForenSynth AI GitHub** (`examples/2025-11-2-polish-run`)
  - **DFIR Journey site** with a live HTML report link under `/forensynth/2025-11-02-polish-run/`.

---
