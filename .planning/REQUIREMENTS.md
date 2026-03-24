# Requirements: Torrin.me

**Defined:** 2026-03-24
**Core Value:** Keep the public website and generated resume content in sync so both always reflect the same current story.

## v1 Requirements

Requirements for the current release. Each maps to roadmap phases.

### Portfolio

- [ ] **PORT-01**: Visitor can see Torrin's current role and a short personal introduction on the landing page
- [ ] **PORT-02**: Visitor can view experience entries with dates, titles, and supporting bullets
- [ ] **PORT-03**: Visitor can view projects with descriptions and links
- [ ] **PORT-04**: Visitor can view a concise skill summary

### Resume

- [ ] **RESM-01**: Visitor can download a PDF resume from the website
- [ ] **RESM-02**: The PDF resume reflects the same current content as the landing page for shared sections

### Contact

- [ ] **CONT-01**: Visitor can find clear contact paths from the landing page

### Sync

- [ ] **SYNC-01**: Torrin can update shared portfolio content in one workflow and keep `frontend/pages/Landing.jsx` and `resume_pdf_generator.py` aligned
- [ ] **SYNC-02**: Torrin can regenerate and replace `frontend/public/Torrin_Leonard_Resume.pdf` after content updates without manual drift
- [ ] **SYNC-03**: The update workflow is documented so future content changes are made in both sources together

## v2 Requirements

Deferred to future release. Tracked but not in the current roadmap.

### Presentation polish

- **PRES-01**: Optional content/visual refinements beyond keeping the current site coherent and accurate
- **PRES-02**: Optional alternate presentation ideas that do not change the sync workflow

## Out of Scope

Explicitly excluded for v1.

| Feature | Reason |
|---------|--------|
| Full CMS or admin panel | Too much infrastructure for a personal website; the current source-of-truth files are enough |
| Rebuilding the stack | The existing React + Python setup already works and only needs disciplined syncing |
| Separate resume source unrelated to the landing page | Would increase drift risk instead of reducing it |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

Phase names: Phase 1 = Sync contract and content hygiene; Phase 2 = PDF regeneration and validation; Phase 3 = Site polish and update documentation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PORT-01 | Phase 3 | Pending |
| PORT-02 | Phase 3 | Pending |
| PORT-03 | Phase 3 | Pending |
| PORT-04 | Phase 3 | Pending |
| RESM-01 | Phase 2 | Pending |
| RESM-02 | Phase 1 | Pending |
| CONT-01 | Phase 3 | Pending |
| SYNC-01 | Phase 1 | Pending |
| SYNC-02 | Phase 2 | Pending |
| SYNC-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after initialization*
