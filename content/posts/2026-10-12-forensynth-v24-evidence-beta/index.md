---
title: "ForenSynth AI v2.4: evidence first, analyst reviewed"
slug: "forensynth-v24-evidence-beta"
date: 2026-10-12T00:00:00-04:00
description: "A beta focused on source preservation, traceable findings, a local desktop workflow, and basic STIX 2.1 export."
tags: ["ForenSynth AI", "DFIR", "STIX", "Evidence"]
---

ForenSynth AI v2.4 moves the project toward an evidence model that an analyst can inspect. The beta implementation is being prepared for review. It is not a claim of validated production readiness.

## What changed

- **Evidence preservation:** original detection export bytes, SHA-256 artifact hashes, and a run manifest.
- **Normalized records:** individual and aggregate Chainsaw detections, unique events, rule matches, hosts, users, and process fields.
- **Visible coverage:** full parsed evidence stays in exports; selected, omitted, rejected, and AI-skipped records are recorded separately.
- **Offline reporting:** a useful report can be generated without an API key.
- **Referenced AI findings:** optional cloud outputs must cite supplied evidence IDs and remain pending analyst review.
- **STIX 2.1:** observations and behavior notes are exported; indicators require an explicit analyst assessment.
- **Windows/Linux desktop:** a local GUI for choosing inputs, generating reports, and verifying run checksums.

## The distinction that matters

“A Sigma rule matched” is an observation. “This system is compromised” is an interpretation that needs supporting context. Repeated alerts can reflect an attacker, an authorized simulation, or routine administration.

Referencing evidence improves traceability. It does not prove a model's statement is correct. The analyst remains responsible for verifying the claim, checking missing telemetry, and deciding what action is justified.

## A local desktop workflow

The GUI defaults to offline processing. It uses the same package as the CLI. Cloud synthesis requires an explicit choice and authorization to send selected evidence fields. API keys are read from the environment rather than saved in project outputs.

Each completed run has a SHA-256 manifest. The GUI and CLI can recheck it later. Checksums detect changes relative to a manifest; unsigned manifests do not establish publisher identity or replace a documented chain of custody.

[Desktop setup and packaging](https://github.com/LuCamachoJr/ForenSynth-AI/blob/feature/v2.4-evidence-beta/docs/DESKTOP.md) · [v2.4 source](https://github.com/LuCamachoJr/ForenSynth-AI/tree/feature/v2.4-evidence-beta)

## Inspect the output

Open the [generated synthetic demonstration report](/dfir-journey/forensynth/v2.4-demo/) to inspect the actual output. Its data is deliberately synthetic and does not represent a live incident.

The [historical v2.3.4 report](/dfir-journey/forensynth/2025-11-02-polish-run/) remains available as an earlier lab artifact. Its generated interpretations should be read in their simulation context.

## What still needs validation

The automated suite exercises parsing, aggregates, coverage, reference checks, bounded mocked AI calls, export escaping, and STIX semantics. Live model behavior, real EVTX hunting, platform deployment, and analyst time savings require separate evaluation.

The next useful test is a comparison against labeled benign, malicious, and simulated datasets, followed by independent analyst feedback. Measure unsupported claims and critical misses alongside any reporting time saved.
