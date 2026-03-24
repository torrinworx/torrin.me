# Torrin.me Roadmap

Core value: keep the public website and generated resume content in sync so both always reflect the same current story.

## Phases

- [ ] **Phase 1: Sync contract and content hygiene** - Keep shared portfolio copy aligned between the landing page and resume source.
- [ ] **Phase 2: PDF regeneration and validation** - Regenerate, replace, and check the resume PDF so the published artifact stays current.
- [ ] **Phase 3: Site polish and update documentation** - Finish the landing-page presentation and document the update workflow for future changes.

## Phase Details

### Phase 1: Sync contract and content hygiene
**Goal**: Torrin can update shared portfolio content once and keep `frontend/pages/Landing.jsx` and `resume_pdf_generator.py` aligned.
**Depends on**: Nothing (first phase)
**Requirements**: RESM-02, SYNC-01
**Success Criteria** (what must be TRUE):
  1. When shared portfolio wording changes, the updated wording appears consistently in both the landing page and the resume generator source.
  2. The landing page and PDF use the same current story for shared sections instead of drifting into separate copy.
  3. Torrin can review the paired sources and confirm no unexplained mismatch exists before publishing a resume update.
**Plans**: TBD

### Phase 2: PDF regeneration and validation
**Goal**: Torrin can regenerate and validate the public resume PDF so the downloaded artifact matches the current site story.
**Depends on**: Phase 1
**Requirements**: RESM-01, SYNC-02
**Success Criteria** (what must be TRUE):
  1. Visitor can download the PDF resume from the website.
  2. Torrin can regenerate `frontend/public/Torrin_Leonard_Resume.pdf` after a content update.
  3. The published PDF reflects the same shared content as the landing page for the overlapping sections.
  4. Torrin can visually review the regenerated PDF before it is published.
**Plans**: TBD

### Phase 3: Site polish and update documentation
**Goal**: The landing page presents a polished portfolio story and the update workflow is documented.
**Depends on**: Phase 2
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, CONT-01, SYNC-03
**Success Criteria** (what must be TRUE):
  1. Visitor can see Torrin's current role and a short personal introduction on the landing page.
  2. Visitor can scan experience entries with dates, titles, and supporting bullets.
  3. Visitor can scan projects with descriptions and links.
  4. Visitor can scan a concise skill summary and find clear contact paths from the landing page.
  5. Torrin has a written sync workflow that makes future changes go into both sources together.
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Sync contract and content hygiene | 0/0 | Not started | - |
| 2. PDF regeneration and validation | 0/0 | Not started | - |
| 3. Site polish and update documentation | 0/0 | Not started | - |
