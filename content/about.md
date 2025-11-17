---
title: "About"
description: "Who I am, what DFIR Journey is, and how I’m using AI to learn and ship DFIR work."
date: 2025-11-16
---

# About DFIR Journey

I’m Luis, a career-changer moving into **Digital Forensics & Incident Response (DFIR)** and blue-team work.

`DFIR Journey` is my public notebook: a place to capture the labs, tools, and experiments I’m running as I learn how to think and operate like a DFIR analyst.

I’m not pretending to be a 10-year veteran. This site is about **showing the work**—mistakes, reworks, “why did I do it that way?” moments—and turning them into something reusable for the next investigation.

---

## What this site is

This project started as a simple idea after working through a Hack The Box module on **Windows Event Logs & Finding Evil**. From there it evolved into:

- A **timeline** of the labs I’m running (HTB, Let’s Defend, home lab cases).
- A place to host **artifacts**: EVTX sets, reports, CSVs, notes, and tools.
- A way to document my shift from “student” to “practitioner” in DFIR.

If you browse around, you’ll see:

- **Case write-ups**: what I was investigating, what I actually found, and what I’d do differently next time.  
- **Tooling experiments**: things like *ForenSynth AI*, my EVTX → AI summary pipeline.  
- **Lab infrastructure**: noise generators, Chainsaw/Sigma hunts, Sysmon configs, and other pieces of the stack.

---

## Human-led, AI-assisted

A big part of this journey is learning how to **pair DFIR skills with AI**, instead of letting AI pretend to be the analyst.

Most of the heavier Python in my repos (like `forensynth_ai_v2_3_4_polish.py`) was:

- **Architected and driven by me**: I defined the goals, flows, flags, guardrails, and how the outputs should look for an analyst.
- **Co-written with AI**: I used ChatGPT to generate and refine code, but I’m the one wiring it into my lab, running it against real logs, checking the outputs, and adjusting the design.

In other words:  
> **Models surface patterns. Humans make the call.**

My role on these projects is **designer, operator, and reviewer**—not “magically fluent senior Python dev.” That distinction matters, especially in DFIR where accountability and interpretation are everything.

---

## ForenSynth AI and this site

`ForenSynth AI` is a small proof-of-concept born inside this journey:

- It ingests **Chainsaw + Sigma** detections from Windows logs.
- It builds **micro-summaries** for detection clusters.
- It compiles a **single executive DFIR report** with:
  - MITRE-mapped phases
  - Donut and heatmap visuals
  - Evidence appendix CSVs
  - Cost/runtime summaries for the AI calls

It started as **vibe-coding an idea** into reality, and it only worked because I already had:

- A baseline understanding of **cybersecurity & DFIR concepts**  
- Enough **coding fundamentals** to reason about structure, flags, and failure modes  
- An AI partner to handle the repetitive “wiring” while I focused on analysis and design

This site hosts those outputs (like the **2025-11-02 Polish run** report) so you can see the actual artefacts, not just screenshots.

---

## What you can expect next

As this journey continues, I’ll keep:

- Adding **new cases** from HTB, Let’s Defend, and my home lab.
- Evolving **ForenSynth AI** and related tools as my skills grow.
- Documenting **what I learn about working with AI safely** in a DFIR workflow.

If you’re also breaking into DFIR, I hope this gives you something honest and practical to compare your own journey against—and maybe a nudge to start publishing your work too.

`∴ runquiet — DFIR Journey continues.`
