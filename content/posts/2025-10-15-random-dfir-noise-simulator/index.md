+++
title = "Random DFIR Noise Simulator — Building Realistic Detection Data"
date = 2025-10-15T00:00:00Z
draft = false
description = "Creating synthetic yet authentic Windows event activity for Chainsaw and Sysmon testing."
tags = ["DFIR", "PowerShell", "Sigma", "Sysmon", "Chainsaw", "Simulator"]
categories = ["DFIR Journey"]
author = "Luis Camacho Jr."
slug = "random-dfir-noise-simulator"
showToc = true
cover = { image = "", caption = "Simulated activity events feeding Chainsaw detections", alt = "PowerShell DFIR Noise Simulator", relative = true }
+++

## Purpose
During DFIR analysis, it’s easy to rely on static data.  
To train and validate detections, I built a PowerShell-based **Random DFIR Noise Simulator** that produces realistic but safe Windows event activity for hunting and Sigma rule tuning.

## Evolution of the Simulator
During early DFIR lab builds, I wrote a sequence of PowerShell scripts to simulate benign Windows activity and inject lightweight IOC noise into Sysmon and Security logs for Chainsaw and Sigma testing.

### 🧱 Phase 1 — Static Event Generator (`Simulate-DFIR-Noise.ps1`)
- Deterministic event sequences (logons, file operations, encoded PowerShell commands)  
- Perfect for parser validation because each run produced identical logs  
- Proved the value of synthetic telemetry for Sigma mapping  

```powershell
# Example (static baseline)
.\Simulate-DFIR-Noise.ps1 -Preset Default -OfflineMode On
```

**Limitation:** predictability — identical 4688 / 4104 / 1 events every run.

---

### 🧩 Phase 2 — Static + Encoded Commands (`Simulate-DFIR-Noise-PS EncodedCommand`)
- Added Base64-encoded PowerShell commands to trigger Event ID 4104 and 4688  
- Brought attacker-like realism to rule testing  

```powershell
# EncodedCommand sample
powershell.exe -EncodedCommand JAB0AGkAbQBlACAAPQAgACcAMgAnADsA
```

---

### 🔀 Phase 3 — Randomized DFIR Noise (`Random_DFIR_Noise_Simulator.ps1`)
To mimic real systems, I redesigned the simulator with controlled entropy.

**Key Upgrades**
- **Random variety:** `-Variety high` shuffles event order and timestamps  
- **Dynamic IOC source:** reads `custom-iocs.json` for IPs/domains/hashes  
- **Offline-mode safe:** `-OfflineMode Auto` avoids network egress  
- **Encoded bursts:** optional Base64 payloads  
- **Per-run subfolders:** unique log sets per execution  

```powershell
.\Random_DFIR_Noise_Simulator.ps1 `
  -Preset custom `
  -ConfigFile .\custom-iocs.json `
  -PerRunSubfolder `
  -Scenario Random `
  -Variety high `
  -OfflineMode Auto `
  -DetectionsMax 1700
```

Each run now behaves like a unique mini-incident, ideal for validating detection resiliency and AI summarization in **ForenSynth AI**.

---

### 📊 Version Comparison Overview

| Version | Noise Type | IOC Variety | EncodedCommand Activity | Purpose | Outcome |
|----------|------------|-------------|--------------------------|----------|----------|
| `Simulate-DFIR-Noise.ps1` | Static | None | No | Baseline Chainsaw/Sigma parser validation | Reliable but predictable |
| `Simulate-DFIR-Noise-PS EncodedCommand` | Static + PowerShell | Moderate | Yes | Introduce attacker-like 4104/4688 events | Adds realism |
| `Random_DFIR_Noise_Simulator.ps1` | Dynamic | High (via JSON) | Optional bursts | Stress-test detections + AI summaries | Closest to real endpoint noise |

---

### 🧠 Lessons Learned
Developing these simulators proved that **noise is data with context**.  
Each iteration deepened my understanding of how telemetry behaves under controlled chaos:

- Deterministic scripts verify that the pipeline works.  
- Randomized scripts test whether it *still works* when nothing repeats.  
- Offline-safe automation + per-run logging preserve **forensic integrity** while enabling endless experimentation.  

This *simulate → observe → refine* loop defines my DFIR Journey approach, culminating in **ForenSynth AI**, where structured randomness fuels both detection accuracy and analyst speed.

---

### ⚙️ Integration Workflow
1. Run the simulator to populate fresh logs.  
2. Hunt with Chainsaw + Sigma.  
3. Feed detections into **ForenSynth AI** for summarization.  
4. Compare findings across runs for coverage validation.

---

🧭 *This utility turns empty environments into living DFIR sandboxes — perfect for sharpening detection engineering and AI-assisted analysis.*
