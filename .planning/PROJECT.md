# Torrin.me

## What This Is

My personal website and resume surface. It presents my work, experience, projects, and contact details, and it also generates a downloadable PDF resume from a Python script.

## Core Value

Keep the public website and generated resume content in sync so both always reflect the same current story.

## Requirements

### Validated

- ✓ Personal landing page exists and is publicly served — existing
- ✓ Resume PDF is generated from `resume_pdf_generator.py` — existing
- ✓ Experience, projects, and skills are shown on the landing page — existing
- ✓ The resume and landing page already share overlapping content — existing

### Active

- [ ] Keep `frontend/pages/Landing.jsx` and `resume_pdf_generator.py` synchronized whenever experience or project wording changes
- [ ] Document the sync workflow so future updates stay aligned across the landing page and PDF resume
- [ ] Preserve a polished, personal-portfolio tone across both outputs

### Out of Scope

- Rebuilding the site into a different framework — the current stack already works and should be refined in place
- Adding unrelated product features — this project is about the website and resume presentation, not a new app

## Context

This is an existing brownfield personal website in a monorepo-style workspace. The main public landing page lives in `frontend/pages/Landing.jsx`, and the downloadable resume is generated from `resume_pdf_generator.py` and copied into `frontend/public/Torrin_Leonard_Resume.pdf`.

The immediate need is to document and preserve the workflow of updating both sources together. The website should continue to present a cohesive story without one artifact drifting from the other.

## Constraints

- **Sync**: Landing content and resume content should stay aligned — drift creates inconsistent public-facing messaging.
- **Existing stack**: Changes should fit the current React + Python PDF generator setup — avoid unnecessary rewrites.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep landing page and resume generator as paired sources of truth | Prevents content drift between public site and PDF resume | ✓ Good |
| Document the sync workflow as part of the project scope | Makes future updates easier to repeat safely | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (`/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (`/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-24 after initialization*
