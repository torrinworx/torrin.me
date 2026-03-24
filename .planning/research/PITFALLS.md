# Pitfalls Research

**Domain:** Brownfield personal website + resume sync
**Researched:** 2026-03-24
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Two sources of truth drift apart

**What goes wrong:**
The landing page in `frontend/pages/Landing.jsx` and the resume generator in `resume_pdf_generator.py` get edited independently, so experience bullets, job titles, project blurbs, and skills slowly diverge.

**Why it happens:**
Both files hardcode the same story in different shapes (`work`/`projects`/`skills` arrays in React vs. `POSITIONS`/`PROJECTS`/`SKILLS` in Python). Manual copy edits are easy to miss, and each renderer encourages slightly different wording.

**How to avoid:**
Create one canonical content source and generate both outputs from it. If that is too big for the next phase, at minimum require every resume change to touch both `frontend/pages/Landing.jsx` and `resume_pdf_generator.py` in the same PR.

**Warning signs:**
- A title, date range, or company name changes in one file but not the other.
- The landing page says one thing while `frontend/public/Torrin_Leonard_Resume.pdf` still shows older text.
- Similar facts differ slightly, like `This Cozy Studio` vs. `This Cozy Studio Inc.` or `Waterloo, Ontario 🇨🇦` vs. `Waterloo, Ontario, Canada`.

**Phase to address:**
Phase 1 — establish the shared content model / sync contract.

---

### Pitfall 2: The PDF artifact becomes stale even when source code is updated

**What goes wrong:**
`resume_pdf_generator.py` changes, but `frontend/public/Torrin_Leonard_Resume.pdf` is not regenerated and committed, so the public download lags behind the repo.

**Why it happens:**
The PDF is a checked-in binary artifact, which is easy to forget during content updates. There is no visible enforcement in the files reviewed that proves the PDF was rebuilt from the latest generator.

**How to avoid:**
Make PDF generation part of the normal update flow and verify the artifact in CI or pre-merge checks. Use a simple rule: no content PR is complete unless the generator script and the PDF artifact both changed together.

**Warning signs:**
- Text in `frontend/public/Torrin_Leonard_Resume.pdf` is behind the source files.
- The PR only changes `resume_pdf_generator.py` or only changes the landing page.
- Reviewers ask, “Did you rebuild the PDF?”

**Phase to address:**
Phase 2 — automate regeneration and artifact validation.

---

### Pitfall 3: Layout parity is assumed instead of checked

**What goes wrong:**
Even when the words match, the rendered experiences look different: web sections wrap differently, bullets break awkwardly in the PDF, or the PDF header/footer carries different emphasis than the landing page.

**Why it happens:**
`frontend/pages/Landing.jsx` is responsive React UI, while `resume_pdf_generator.py` uses fixed-page ReportLab layout with `Paragraph`, `Spacer`, and `ListFlowable`. Similar content does not guarantee similar reading order or visual hierarchy.

**How to avoid:**
Treat the PDF as a separate render target that needs explicit visual review. Keep the PDF concise, prefer stable text blocks, and add a “render check” step after content edits.

**Warning signs:**
- Bullets split across pages or become hard to scan.
- Section order or emphasis differs enough that the two versions feel like different narratives.
- A small wording tweak causes major page-flow changes in the PDF.

**Phase to address:**
Phase 2 — lock down PDF layout and review workflow.

---

### Pitfall 4: Small factual mismatches create credibility drift

**What goes wrong:**
Tiny details disagree across outputs: dates, locations, company suffixes, URLs, or role labels. These are easy to dismiss individually but make the site feel unmaintained.

**Why it happens:**
The same facts are stored and formatted twice, and each format has different conventions. For example, `frontend/pages/Landing.jsx` uses relative/interactive headers like `headerUrl`, while `resume_pdf_generator.py` prints a different URL presentation and date style.

**How to avoid:**
Normalize the content schema so dates, organization names, and URLs are authored once and rendered consistently. Add a quick human review checklist for every sync update.

**Warning signs:**
- Dates differ in punctuation or month format.
- One artifact uses a different company name or headline than the other.
- The same project URL appears in different forms (`https://torrin.me/destamatic-ui` vs `/destamatic-ui`).

**Phase to address:**
Phase 1 — schema normalization and field-level consistency.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Edit only `frontend/pages/Landing.jsx` | Fast landing-page update | PDF drifts immediately | Never |
| Edit only `resume_pdf_generator.py` | Fast resume refresh | Website drifts immediately | Never |
| Manually copy text between files | No refactor needed | Repeated human error | Only for one-off emergency fixes |
| Keep `frontend/public/Torrin_Leonard_Resume.pdf` checked in without validation | Easy downloads | Stale artifact risk | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PDF generation | Regenerating locally but not updating `frontend/public/Torrin_Leonard_Resume.pdf` | Make the PDF artifact part of the update checklist and CI |
| Landing page content | Updating React content without updating the resume script | Treat `frontend/pages/Landing.jsx` and `resume_pdf_generator.py` as a paired change |
| Release process | Assuming a checked-in PDF updates automatically on deploy | Explicitly rebuild and commit the artifact |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Manual sync workflow | Frequent review comments about mismatched content | Shared schema + validation | As soon as edits happen in more than one place |
| PDF visual drift | Resume looks broken on some updates | Snapshot/review the rendered PDF every change | Whenever content length changes materially |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Treating the checked-in PDF as “source” | People trust stale resume data | Keep the generator as the source and validate the artifact |
| Letting old content linger in `frontend/public/Torrin_Leonard_Resume.pdf` | Public-facing misinformation | Rebuild on every content change |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Website and PDF tell slightly different stories | Makes the brand feel inconsistent | Use the same canonical copy for both |
| Resume text is technically synced but hard to scan in PDF | Visitors miss key details | Review line wrapping and hierarchy after every content edit |
| Links or labels are phrased differently across outputs | Lowers trust | Normalize names, roles, and URLs |

## "Looks Done But Isn't" Checklist

- [ ] **Resume update:** `frontend/public/Torrin_Leonard_Resume.pdf` was regenerated after editing `resume_pdf_generator.py`.
- [ ] **Landing sync:** `frontend/pages/Landing.jsx` and `resume_pdf_generator.py` were reviewed together for wording drift.
- [ ] **Rendering check:** The new PDF was opened and scanned for line breaks, page breaks, and header consistency.
- [ ] **Fact check:** Company names, dates, titles, and URLs match across both artifacts.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Dual-source drift | MEDIUM | Diff the landing page against the generator, reconcile the copy, then rebuild the PDF |
| Stale PDF artifact | LOW | Regenerate `frontend/public/Torrin_Leonard_Resume.pdf` and verify the download |
| Layout parity issues | MEDIUM | Trim copy, reflow the PDF, and review the rendered output |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Two sources of truth drift apart | Phase 1 | One canonical content owner; no PR merges with mismatched copy |
| Stale PDF artifact | Phase 2 | CI or release checklist confirms regenerated `frontend/public/Torrin_Leonard_Resume.pdf` |
| Layout parity is assumed instead of checked | Phase 2 | Human review of the rendered PDF after every content change |
| Small factual mismatches create credibility drift | Phase 1 | Shared schema / content diff confirms titles, dates, and URLs match |

## Sources

- `frontend/pages/Landing.jsx`
- `resume_pdf_generator.py`
- `frontend/public/Torrin_Leonard_Resume.pdf`
- `.planning/PROJECT.md`
- `.planning/codebase/CONCERNS.md`

---
*Pitfalls research for: brownfield personal website + resume sync*
*Researched: 2026-03-24*
