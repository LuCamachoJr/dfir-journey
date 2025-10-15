+++
title = "ForenSynth AI Evolution — From Chainsaw to Visual DFIR Reports"
date = 2025-10-14T00:00:00Z
draft = false
description = "Tracing the evolution of ForenSynth AI from the original Chainsaw summarizer to the Visual DFIR reporting engine powered by GPT-5."
tags = ["DFIR", "AI", "Chainsaw", "Sigma", "Forensics", "LLM"]
categories = ["DFIR Journey"]
author = "Luis Camacho Jr."
slug = "forensynth-ai-evolution"
showToc = true
canonicalURL = "https://LuCamachoJr.github.io/dfir-journey/posts/forensynth-ai-evolution/"
resources = []
cover = { image = "", caption = "ForenSynth AI — Visual DFIR Reporting", alt = "DFIR report automation pipeline diagram", relative = true }
+++

> **Automation shouldn’t replace judgment; it should buy you time to use it.**

## Problem
DFIR analysts burn hours turning raw detections into readable narratives. EVTX hunts surface signals, but write-ups lag behind, delaying remediation and weakening portfolio proof. We need a repeatable way to go from logs → findings → human-ready report without sacrificing accuracy or analyst judgment.

## Approach
Small pipeline: **Chainsaw** (Sigma EVTX hunting) → **SwiftOnSecurity** Sysmon config (clean telemetry) → **PowerShell simulator** (lab noise) → **Python LLM summarizer** (structured narrative + IOC table). Human stays in the loop for validation and context, not rote drafting.

## How It Works
1. Collect EVTX from a Windows lab with Sysmon (SwiftOnSecurity config).  
2. Hunt with Chainsaw using Sigma rules; export JSON.  
3. Parse detections (technique, evidence, timestamps, host/user).  
4. Feed concise, structured chunks to the Python LLM script.  
5. Generate a narrative organized by MITRE tactics, plus IOC and timeline sections.  
6. Analyst verifies, annotates caveats, and adds reproduction steps.

## Output
One report per run: executive summary, technique table, evidence snippets, IOC list, minimal timeline, and **How to Reproduce** steps. Export to Markdown and PDF. Link back to case folder, rulesets, and scripts for transparency.

## Guardrails
- Spot-check raw detections, confirm artifacts, and mark assumptions.  
- Deterministic prompts (schemas), pin tool versions, and log run metadata.  
- Document limitations (false positives, lab constraints).  
- **Credit:** Chainsaw + SwiftOnSecurity; note local config tweaks.

## Findings (sample scaffold)
{{< mitre-table >}}
<tr><td>Discovery</td><td>T1057 Process Discovery</td><td><code>4688</code> w/ PowerShell</td><td>Enumeration behavior observed</td><td>Correlate with user/session</td></tr>
<tr><td>Execution</td><td>T1059.001 PowerShell</td><td>EncodedCommand runs</td><td>Common initial access follow-on</td><td>Check ScriptBlock logs</td></tr>
{{< /mitre-table >}}

## IOCs
{{< ioc >}}
<li><strong>IP:</strong> <code>203.0.113.42</code></li>
<li><strong>Domain:</strong> <code>evil.example.test</code></li>
<li><strong>Hash:</strong> <code>e3b0c44298fc1c149afbf4c8996fb924...</code></li>
{{< /ioc >}}

## Reproduce It
```bash
# Chainsaw hunt example (adjust paths)
chainsaw hunt /path/to/evtx --rules /path/to/sigma/rules --mapping /path/to/sigma-event-logs-all.yml --json out/detections.json
```

## Acknowledgments
- Chainsaw (Sigma), SwiftOnSecurity Sysmon config, and open-source DFIR community.
