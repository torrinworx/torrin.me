# Architecture Patterns

**Domain:** personal website + resume sync surface  
**Researched:** 2026-03-24  
**Confidence:** HIGH

## Recommended Architecture

Keep this as a brownfield split-brain content system: the public site is a Vite/JSX app, while the PDF resume is a separate ReportLab generator. The right mental model is **one site shell + one page source + one PDF assembly script**, with content manually mirrored at the page-data boundary.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `frontend/App.jsx` | Site shell, global header/footer, stage tree wiring | `frontend/pages/*`, `frontend/utils/*` |
| `frontend/pages/Landing.jsx` | Public landing content: hero, experience, projects, skills, contact CTA | `frontend/utils/Resume.jsx`, `frontend/utils/Contact.jsx`, `@destamatic/ui` |
| `frontend/utils/Resume.jsx` | Download button for the PDF asset | `frontend/public/Torrin_Leonard_Resume.pdf` |
| `resume_pdf_generator.py` | Generates the actual resume PDF | ReportLab, output file `Torrin_Leonard_Resume.pdf` |
| `build.sh` | Builds the site bundle and packages the app | `vite`, `destamatic-ui/ssg/build.js`, `server.js` |
| `frontend/public/` | Served static assets, including the downloaded resume PDF | Browser, Vite, production server |

### Data Flow

1. `frontend/App.jsx` mounts the public site shell and routes to `frontend/pages/Landing.jsx`.
2. `Landing.jsx` renders the public story from local arrays (`work`, `projects`, `skills`) plus hero/contact UI.
3. `frontend/utils/Resume.jsx` links to the static PDF asset `Torrin_Leonard_Resume.pdf`.
4. `resume_pdf_generator.py` independently assembles the PDF from its own `SUMMARY`, `POSITIONS`, `PROJECTS`, and `SKILLS` constants.
5. The generated PDF is copied into `frontend/public/Torrin_Leonard_Resume.pdf`, which is the artifact the site downloads.

## Sync Boundary

The sync boundary is **content data, not layout**.

Shared meaning that must stay aligned:
- name/title/summary
- experience entries
- project entries
- skill categories
- contact links and branding tone

What is *not* shared:
- JSX layout/styling in `frontend/pages/Landing.jsx`
- PDF composition/layout in `resume_pdf_generator.py`
- download behavior in `frontend/utils/Resume.jsx`

So the practical boundary is: **edit the story once, then mirror it into both renderers**. Today there is no shared content source, so drift is prevented by process, not code reuse.

## Build / Update Order

Use this order for future content changes:

1. **Update the landing page copy first** in `frontend/pages/Landing.jsx`.
2. **Mirror the same content in** `resume_pdf_generator.py`.
3. **Regenerate the PDF** to `Torrin_Leonard_Resume.pdf`.
4. **Copy the PDF into** `frontend/public/Torrin_Leonard_Resume.pdf`.
5. **Run `build.sh`** to package the site after both outputs are in sync.

Why this order:
- `build.sh` does **not** generate the PDF; it only bundles the already-built site and copies server/runtime files.
- `frontend/utils/Resume.jsx` always downloads the static public PDF, so the public asset must be refreshed before release.
- Updating landing copy first keeps the public-facing story authoritative, then the PDF is brought back into parity.

## Anti-Patterns to Avoid

### Duplicate-but-divergent content
**What:** changing `frontend/pages/Landing.jsx` without updating `resume_pdf_generator.py`, or vice versa.  
**Why bad:** the site and PDF tell different stories.  
**Instead:** treat both files as a paired publish set and update them in the same change.

### Baking PDF generation into the wrong build step
**What:** assuming `build.sh` produces the resume PDF.  
**Why bad:** the current build only packages the app; the PDF remains stale.  
**Instead:** run the Python generator explicitly, then copy the output into `frontend/public/`.

### Sharing layout instead of content
**What:** trying to unify the JSX page and PDF renderer at the component level.  
**Why bad:** the render targets are different and will fight each other.  
**Instead:** share content discipline, not UI primitives.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Content drift | Manual review is enough | Add a single content source or sync check | Centralize content generation |
| PDF delivery | Static file is fine | Keep CDN/cache headers stable | Generate/version PDFs predictably |
| Build correctness | Human validation | Add a release checklist | Automate PDF generation in CI |

## Sources

- `.planning/PROJECT.md` — states the project goal is to keep landing content and resume content in sync
- `.planning/codebase/ARCHITECTURE.md` — confirms the Vite + Stage-based app structure
- `.planning/codebase/STRUCTURE.md` — maps `frontend/pages/` and the build/package layout
- `frontend/pages/Landing.jsx` — landing content arrays and download CTA
- `frontend/utils/Resume.jsx` — PDF download path `Torrin_Leonard_Resume.pdf`
- `resume_pdf_generator.py` — separate ReportLab resume source of truth
- `build.sh` — build packaging flow; no PDF generation step

## Summary

The site is organized as a stage-routed React-like frontend with the landing page as the main portfolio surface. The resume PDF is intentionally separate, so the key engineering problem is keeping the duplicated content in sync without redesigning the stack.
