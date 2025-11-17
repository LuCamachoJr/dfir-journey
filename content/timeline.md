---
title: "DFIR Journey Timeline"
url: "/timeline/"
layout: "single"
---

# DFIR Journey — Timeline

A chronological view of key milestones, labs, and write-ups.  
The home page shows latest posts first — this page keeps the **story arc in order**.

---

## 2025

### November 2025

#### 2025-11-02 — ForenSynth AI v2.3.4 “Polish” Run
- Turned the original Chainsaw + Sigma EVTX summarizer into a **visual, analyst-friendly DFIR report engine**.
- Added:
  - Donut + heatmap visuals mapped to MITRE ATT&CK phases.
  - Evidence CSV export for quick pivoting in Excel/SIEM.
  - Micro-sampling “governor” to handle **2k–3k+ detections** at reasonable cost/latency.
  - Real OpenAI billing usage wired into the footer for honest cost reporting.
- Live report (HTML):  
  👉 [ForenSynth AI — DFIR Report (2025-11-02 Polish Run)](/forensynth/2025-11-02-polish-run/)  
- Code & examples:  
  👉 [ForenSynth AI on GitHub](https://github.com/LuCamachoJr/ForenSynth-AI)

---

### October 2025

#### 2025-10-25 — Post-Hunt Sampling (POC)
- Realized that **full micro-summaries on 2k–3k detections** can be slow and expensive.
- Implemented **post-hunt sampling**:
  - `--limit-detections` and `--sample-step` to cap and stratify detections.
  - Example: `2705 → 902` sampled detections with stable narrative quality.
- This became the foundation for the micro “governor” used in v2.3.4.

#### 2025-10-24 — ForenSynth AI v2.3.3 (Visual Refresh)
- First full version with:
  - HTML **charts** (bars + donuts) for phase / event distribution.
  - Evidence appendix and CSV exports.
  - Executable executive summary suitable for **copy/paste into IR reports**.
- Used against multi-day Windows EVTX logs to generate a narrative of:
  - Encoded PowerShell abuse  
  - LOLBINs (rundll32/regsvr32)  
  - Scheduled tasks, Run keys, and account creation  
  - Defense evasion and log tampering.

#### 2025-10-22 — Random DFIR Noise Simulator (PowerShell)
- Built a **PowerShell “noise generator”** to create realistic-but-controlled Windows:
  - Process creation events
  - PowerShell activity
  - Account changes, scheduled tasks, etc.
- Purpose:
  - Give Chainsaw/Sigma and ForenSynth AI **repeatable, offline DFIR playground data**.
  - Avoid relying only on “real incidents” or synthetic toy logs.
- Script + README live in the ForenSynth AI repo under `examples/`.

#### Early October 2025 — Windows Event Logs & Finding Evil (HTB)
- Worked through an HTB module on **Windows Event Logs & Finding Evil**.
- Pain point: manually pivoting from raw EVTX → human-readable narrative.
- This is where the core idea appeared:
  > “What if Chainsaw + Sigma results could flow into an AI that writes a DFIR-style executive report for me?”

That question eventually turned into **ForenSynth AI**.

---

### Before October 2025 — DFIR Foundations

- Completed **CHFI** and began deep-dive hands-on DFIR practice.
- Started **Let’sDefend DFIR path** and **HTB Sherlocks** to build real-world IR muscles:
  - Windows / Linux forensics
  - Memory forensics
  - Network forensics
- Created the **DFIR Journey** brand and GitHub repos to publicly track:
  - Labs
  - Tools
  - Write-ups
  - Automation experiments like ForenSynth AI.

---

More entries coming as the journey continues —  
HTB Sherlocks, Let’sDefend cases, memory forensics, and more ForenSynth AI iterations.

