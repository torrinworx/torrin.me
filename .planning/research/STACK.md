# Stack Research

**Domain:** personal website + resume sync workflow
**Researched:** 2026-03-24
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| JavaScript ES modules | repo standard | App/server/UI code | The site is already built around ESM across `package.json`, `server.js`, `vite.config.js`, and `frontend/**/*.jsx`; preserving this avoids rewriting the brownfield app. |
| Vite | `^7.2.7` | Frontend dev server and production build | `vite.config.js` is the main client build entrypoint and already handles the app root, JSX transforms, and prod output. |
| Node.js HTTP server | current repo runtime | Dev middleware + production static hosting + contact form | `server.js` serves the site, proxies Vite in dev, and handles `POST /contact`; this is the operational spine of the site. |
| Python + ReportLab | system script dependency | Generate the PDF resume | `resume_pdf_generator.py` is the canonical PDF source; keep it rather than introducing a second resume pipeline. |
| `@destamatic/ui` (local package) | `file:destamatic-ui` | UI primitives, routing, and shared component system | The landing page is built on this package, so preserving it keeps the site styling/behavior consistent. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `destam` | `^0.8.0` | Reactive state primitives | Required for the current UI/data flow in the landing page and local component system. |
| `destam-dom` | `^0.14.0` | DOM renderer + JSX/runtime transforms | Required by `vite.config.js` and the `@destamatic/ui` stack; do not replace unless the whole UI layer changes. |
| `@babel/*` toolchain | pinned in `package.json` | JSX/HTML literal transforms | Must remain stable because `vite.config.js` depends on custom transform behavior. |
| `resend` | `^6.6.0` | Contact form email delivery | Needed for `server.js` `/contact`; unrelated to resume sync but part of the site stack. |
| `nodemon` | `^3.1.7` | Dev restart loop | Keeps the brownfield dev workflow usable while editing both the site and PDF generator. |
| `@plausible-analytics/tracker` | `^0.4.4` | Client analytics | Preserve if you want the current site telemetry unchanged. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `vite.config.js` | App build/dev config | Keep the custom plugins and `root: './frontend'` setup intact. |
| `server.js` | Local/prod server entry | Keep `NODE_ENV` switching, Vite middleware, and static serving behavior stable. |
| `build.sh` | Production build orchestration | It likely coordinates app build + PDF generation + deploy packaging; do not decouple the resume step from it. |
| `resume_pdf_generator.py` | PDF generation script | This is the resume source of truth for the downloadable artifact. |

## What to Preserve for Sync

### Single content flow

The landing page and PDF resume are already synchronized by duplicated content blocks, not by a shared CMS. Preserve that workflow unless you are ready to introduce a real shared data source.

- Landing content lives in `frontend/pages/Landing.jsx`.
- PDF content lives in `resume_pdf_generator.py`.
- The generated PDF is copied to `frontend/public/Torrin_Leonard_Resume.pdf` so the website can serve it as a static asset.

### Shared sections that must stay aligned

| Content area | Landing source | PDF source |
|--------------|----------------|------------|
| Summary/title | `frontend/pages/Landing.jsx` | `resume_pdf_generator.py` |
| Experience | `work` in `frontend/pages/Landing.jsx` | `POSITIONS` in `resume_pdf_generator.py` |
| Projects | `projects` in `frontend/pages/Landing.jsx` | `PROJECTS` in `resume_pdf_generator.py` |
| Skills | `skills` in `frontend/pages/Landing.jsx` | `SKILLS` in `resume_pdf_generator.py` |

### Stability requirements

Keep these unchanged or update them together:

- `frontend/pages/Landing.jsx` content arrays and labels
- `resume_pdf_generator.py` section data and wording
- PDF filename/path: `Torrin_Leonard_Resume.pdf` and `frontend/public/Torrin_Leonard_Resume.pdf`
- `@destamatic/ui`, `destam`, and `destam-dom`
- `vite.config.js` custom transform plugins
- `server.js` static serving behavior

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Keep React/Vite + Python ReportLab split | Move resume generation into React-only tooling | Only if you are willing to replace the existing PDF workflow entirely. |
| Keep duplicated content in two files | Introduce a shared JSON/YAML source of truth | Only if sync drift becomes frequent enough to justify refactoring. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Rewriting the site into a new frontend framework | It adds migration risk without fixing sync drift by itself | Preserve the current Vite + `@destamatic/ui` stack. |
| Making the PDF a manual, separately edited artifact | Drift is guaranteed | Keep `resume_pdf_generator.py` as the generated source of truth. |
| Splitting resume and landing content into unrelated sources | Breaks the current sync workflow | Update the paired content in `frontend/pages/Landing.jsx` and `resume_pdf_generator.py` together. |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `vite@^7.2.7` | `@babel/*`, `destam-dom`, `@destamatic/ui` | `vite.config.js` depends on custom JSX/literal transforms and excludes local packages from optimizeDeps. |
| `destam@^0.8.0` | `destam-dom@^0.14.0` | These are paired in the current UI stack; keep them aligned. |
| `server.js` | `resend@^6.6.0` | Contact form delivery depends on the Resend SDK and env vars. |

## Sources

- `package.json` — runtime, scripts, and package versions
- `frontend/pages/Landing.jsx` — landing-page content and shared sections
- `resume_pdf_generator.py` — PDF resume content and generator
- `vite.config.js` — build/runtime transform pipeline
- `server.js` — dev/prod server and contact form flow
- `.planning/PROJECT.md` — sync requirement and generated PDF location

---
*Stack research for: personal website + resume sync workflow*
*Researched: 2026-03-24*
