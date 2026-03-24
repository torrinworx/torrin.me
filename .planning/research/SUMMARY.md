# Project Research Summary

**Project:** Torrin.me
**Domain:** personal website + resume sync workflow
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

This is a brownfield personal portfolio site with a separate generated PDF resume. Experts should treat it as a presentation system, not a CMS problem: keep the current Vite/JS site, preserve the Python/ReportLab resume pipeline, and enforce content parity between the landing page and PDF as the core product requirement.

The recommended approach is to keep the existing stack and tighten the update workflow around one story: the landing page is the public source of truth, and the PDF must be mirrored from it on every content change. The main risk is drift — small mismatches in titles, dates, project wording, or links quickly undermine trust. Mitigate that with a paired-change discipline now, then a shared content model or validation layer later if manual syncing becomes painful.

## Key Findings

### Recommended Stack

Keep the current brownfield stack. The safest path is to preserve the JS/Vite frontend, the Node server, the local `@destamatic/ui` layer, and the Python ReportLab resume generator instead of rewriting the site or forcing a single-runtime solution. This avoids migration risk while protecting the resume download flow and the existing public presentation.

**Core technologies:**
- JavaScript ES modules — repo-wide code standard; avoids replatforming the app
- Vite `^7.2.7` — current frontend build/dev pipeline
- Node.js HTTP server — serves site, dev middleware, and contact form
- Python + ReportLab — canonical PDF generation path
- `@destamatic/ui` — shared UI primitives and site behavior

### Expected Features

The product is a portfolio/resume surface, so the baseline is straightforward: a clear hero, experience, projects, skills, a downloadable PDF, and contact paths. The differentiator is not more content — it is a consistent story across web and PDF.

**Must have (table stakes):**
- Hero with identity, role, location, availability — immediate context
- Experience / projects / skills — proof of work and scanability
- Resume PDF download — recruiter-friendly offline artifact
- Contact options — form plus direct links
- Web/PDF content parity — the project’s core promise

**Should have (competitive):**
- Single-story branding across web + PDF — feels intentional
- Strong technical positioning — makes the target role clear
- Polished card layout and multi-channel contact — improves usability

**Defer (v2+):**
- CMS/editor workflow — only if manual sync becomes painful
- Extra public content sections — only if they support hiring signal

### Architecture Approach

Use a split-brain content architecture: `frontend/pages/Landing.jsx` renders the website, `resume_pdf_generator.py` independently assembles the PDF, and the generated artifact is copied to `frontend/public/Torrin_Leonard_Resume.pdf`. The architecture boundary is content, not layout — share the story, not the renderer.

**Major components:**
1. `frontend/App.jsx` — site shell and routing
2. `frontend/pages/Landing.jsx` — public story and CTA surface
3. `resume_pdf_generator.py` — PDF assembly and artifact source
4. `frontend/utils/Resume.jsx` — downloads the static PDF

### Critical Pitfalls

The dominant risk is credibility drift. If web and PDF diverge, the site looks neglected. The second risk is stale artifacts: a regenerated PDF that never reaches `frontend/public/` is effectively broken.

1. **Two sources of truth drift apart** — update landing page and PDF generator together; ideally move to a canonical content source later
2. **PDF artifact becomes stale** — regenerate and copy the PDF every content change; verify the public asset
3. **Layout parity is assumed instead of checked** — review the rendered PDF, not just the text
4. **Small factual mismatches create credibility drift** — normalize names, dates, URLs, and locations

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Sync contract and content hygiene
**Rationale:** This is the highest-risk dependency chain; drift is the project’s main failure mode.
**Delivers:** Paired update rules, normalized fields, and a clear edit order for landing page + PDF copy.
**Addresses:** Hero/experience/projects/skills parity, resume download correctness, contact consistency.
**Avoids:** Two-source drift and small factual mismatches.

### Phase 2: PDF regeneration and validation workflow
**Rationale:** The public PDF is a checked-in artifact, so build/release discipline matters as much as code.
**Delivers:** Explicit PDF rebuild step, artifact refresh in `frontend/public/`, and rendered PDF review.
**Uses:** Python + ReportLab, static asset publishing, existing build scripts.
**Implements:** Resume generator + public asset delivery path.
**Avoids:** Stale PDF artifacts and layout parity assumptions.

### Phase 3: Documentation and light polish
**Rationale:** Once sync is reliable, improve maintainability without expanding scope.
**Delivers:** Update workflow docs, review checklist, and small UX polish if it doesn’t slow the scan path.
**Addresses:** Better editor guidance and safer future updates.
**Avoids:** Overengineering, CMS creep, and unnecessary feature sprawl.

### Phase Ordering Rationale

- Start with content parity because the site already works; the primary problem is coherence, not missing infrastructure.
- Keep web and PDF changes coupled so the public story stays trustworthy.
- Defer any shared-schema or CMS work until the manual sync cost is proven painful.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** canonical content model / schema normalization if you decide to reduce manual mirroring
- **Phase 2:** PDF validation and release automation, especially if CI should enforce artifact freshness

Phases with standard patterns (skip research-phase):
- **Phase 3:** documentation and light polish — established, low-risk work

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Stack is clearly supported by the existing repo files and current runtime/build setup |
| Features | HIGH | Feature set is well-defined and directly reflected in the current landing page + resume flow |
| Architecture | HIGH | Component boundaries and data flow are explicit and stable |
| Pitfalls | HIGH | Drift and stale artifact risks are concrete and repeatedly evidenced |

**Overall confidence:** HIGH

### Gaps to Address

- Canonical sync mechanism is not defined: decide later whether to keep manual paired edits or introduce a shared content source.
- Artifact enforcement is not proven: confirm whether CI, pre-merge checks, or a release checklist will verify PDF freshness.
- Render parity is manual: plan a human review step for PDF layout after content edits.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — stack choices, versions, and sync workflow
- `.planning/research/FEATURES.md` — table stakes, differentiators, and v2 deferrals
- `.planning/research/ARCHITECTURE.md` — component boundaries and data flow
- `.planning/research/PITFALLS.md` — drift, artifact freshness, and layout risks

### Secondary (MEDIUM confidence)
- `.planning/PROJECT.md` — project goal, constraints, and sync requirement

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
