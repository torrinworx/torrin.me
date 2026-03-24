# Codebase Structure

**Analysis Date:** 2026-03-24

## Directory Layout

```text
torrin.me/
├── frontend/                # Main website source, assets, and stage-based pages
├── destamatic-ui/           # Local UI library package and its examples/docs
├── server.js                # HTTP server and contact endpoint
├── build.sh                 # Production build and packaging script
├── buildBlog.js             # Blog index generator
├── buildDocs.js             # Docs index/copy generator for destamatic-ui
├── vite.config.js           # Main Vite config for the website
├── vite.config.ssg.js      # SSG Vite config for HTML rendering
└── package.json             # Root package manifest
```

## Directory Purposes

**`frontend/`:**
- Purpose: contains the public site and the embedded `destamatic-ui` showcase.
- Contains: entrypoints, page components, shared utilities, and static public assets.
- Key files: `frontend/App.jsx`, `frontend/index.jsx`, `frontend/index.ssg.jsx`, `frontend/pages/Blog.jsx`, `frontend/utils/Markdown.jsx`.

**`frontend/public/`:**
- Purpose: static files served directly by Vite and `server.js`.
- Contains: images, fonts, blog markdown, blog indexes, and copied docs.
- Key files: `frontend/public/blog/index.json`, `frontend/public/blog/*.md`, `frontend/public/destamatic-ui/docs/index.json`, `frontend/public/favicon.png`.

**`frontend/pages/`:**
- Purpose: top-level portfolio stage acts.
- Contains: the landing page, blog page, and 404 page.
- Key files: `frontend/pages/Landing.jsx`, `frontend/pages/Blog.jsx`, `frontend/pages/NotFound.jsx`.

**`frontend/utils/`:**
- Purpose: shared site shell helpers and presentation utilities.
- Contains: header, contact form, markdown renderer, SEO helpers, theme, fonts, and small UI helpers.
- Key files: `frontend/utils/Header.jsx`, `frontend/utils/Contact.jsx`, `frontend/utils/JsonLd.jsx`, `frontend/utils/theme.js`, `frontend/utils/fonts.js`.

**`frontend/destamatic-ui/`:**
- Purpose: in-repo landing/docs surface for the local `@destamatic/ui` package.
- Contains: its own `App.jsx`, showcase pages, playground/editor code, and helper utilities.
- Key files: `frontend/destamatic-ui/App.jsx`, `frontend/destamatic-ui/pages/*`, `frontend/destamatic-ui/utils/*`.

**`destamatic-ui/`:**
- Purpose: local package implementation of the `@destamatic/ui` runtime/components.
- Contains: exported component groups, theming, context helpers, SSG helpers, and utility modules.
- Key files: `destamatic-ui/index.js`, `destamatic-ui/components/*`, `destamatic-ui/util/*`, `destamatic-ui/ssg/*`.

**`destamatic-ui/components/`:**
- Purpose: component library organized by UI concern.
- Contains: `display`, `head`, `icons`, `inputs`, `navigation`, `stage_templates`, and `utils`.
- Key files: `destamatic-ui/components/display/Stage/Stage.jsx`, `destamatic-ui/components/inputs/Button/Button.jsx`, `destamatic-ui/components/utils/Theme/Theme.jsx`.

**`destamatic-ui/util/`:**
- Purpose: shared low-level helpers for styling, color, document tracking, and mount helpers.
- Contains: `defaultTheme.js`, `categories.js`, `trackedMount.js`, `abort.js`, `index.js`.
- Key files: `destamatic-ui/util/defaultTheme.js`, `destamatic-ui/util/index.js`.

**`destamatic-ui/ssg/`:**
- Purpose: server-side rendering and build support for the component package.
- Contains: `render.js`, `wipe.js`, `build.js`, route discovery, sitemap generation, and node detection helpers.
- Key files: `destamatic-ui/ssg/render.js`, `destamatic-ui/ssg/build.js`, `destamatic-ui/ssg/is_node.js`.

**`.github/workflows/`:**
- Purpose: CI/build automation.
- Contains: build and publish workflows.
- Key files: `.github/workflows/build.yml`, `.github/workflows/cicd.yml`.

**`.planning/codebase/`:**
- Purpose: generated codebase analysis docs for GSD planning.
- Contains: architecture, structure, conventions, testing, or concern notes.

## Key File Locations

**Entry Points:**
- `frontend/index.jsx`: browser boot entry.
- `frontend/index.ssg.jsx`: SSG entry used by `vite.config.ssg.js`.
- `server.js`: Node HTTP entry.
- `destamatic-ui/index.js`: package export surface.

**Configuration:**
- `package.json`: root scripts and dependency graph.
- `vite.config.js`: main dev/build config for `frontend/`.
- `vite.config.ssg.js`: SSG build config.
- `destamatic-ui/package.json`: package metadata and exports for the local UI library.
- `destamatic-ui/vite.config.js`: example/package build config for the library.

**Core Logic:**
- `frontend/App.jsx`: root site shell and stage graph.
- `frontend/pages/Blog.jsx`: blog listing and post rendering.
- `frontend/utils/Contact.jsx`: contact form and submission logic.
- `frontend/utils/Markdown.jsx`: custom markdown parser/renderer.
- `destamatic-ui/components/display/Stage/Stage.jsx`: stage routing and URL synchronization.
- `destamatic-ui/components/utils/Theme/Theme.jsx`: reactive theme engine.
- `destamatic-ui/components/utils/h/h.jsx`: JSX host with event/style/theme extensions.

**Testing:**
- `destamatic-ui/components/**/**/*.test.jsx`: component-level tests.
- `destamatic-ui/vitest.config.js`: test configuration for the library package.

## Naming Conventions

**Files:**
- React/JSX components use `PascalCase.jsx` inside feature folders, e.g. `frontend/pages/Landing.jsx` and `destamatic-ui/components/inputs/Button/Button.jsx`.
- Helper modules use `camelCase.js` or `camelCase.jsx`, e.g. `frontend/utils/theme.js`, `frontend/utils/fonts.js`, `buildBlog.js`.
- Test files use `.test.jsx`, e.g. `destamatic-ui/components/inputs/Button/button.test.jsx`.

**Directories:**
- Component families are grouped by concern, then by component name, e.g. `destamatic-ui/components/inputs/TextField/`.
- Public content is grouped by feature, e.g. `frontend/public/blog/` and `frontend/public/destamatic-ui/docs/`.

## Where to Add New Code

**New site page or route:**
- Primary code: `frontend/pages/<Name>.jsx`
- Shell wiring: `frontend/App.jsx`
- Shared utilities: `frontend/utils/`

**New blog content:**
- Markdown source: `frontend/public/blog/*.md`
- Index generation: `buildBlog.js`
- Blog rendering: `frontend/pages/Blog.jsx`

**New docs content for the UI package:**
- Source docs: `destamatic-ui/docs/*.md`
- Copy/index generation: `buildDocs.js`
- Public output: `frontend/public/destamatic-ui/docs/`

**New UI library component:**
- Implementation: `destamatic-ui/components/<group>/<Name>/<Name>.jsx`
- Theme definitions: colocated in the component file or `destamatic-ui/util/defaultTheme.js` when shared.
- Example/test files: colocated under the same component folder.

**New shared low-level helper:**
- Shared helpers: `destamatic-ui/util/`

**New showcase page for destamatic-ui:**
- Implementation: `frontend/destamatic-ui/pages/<Name>.jsx`
- Supporting helpers: `frontend/destamatic-ui/utils/`

## Special Directories

**`frontend/public/`:**
- Purpose: build-time and runtime static asset root.
- Generated: partially (blog/docs indexes and copied docs are generated into it).
- Committed: yes.

**`destamatic-ui/examples/`:**
- Purpose: runnable examples for the package.
- Generated: no.
- Committed: yes.

**`destamatic-ui/docs/`:**
- Purpose: markdown docs that are copied into the website build.
- Generated: no.
- Committed: yes.

**`build/` and `build.zip`:**
- Purpose: production output created by `build.sh`.
- Generated: yes.
- Committed: no.

---

*Structure analysis: 2026-03-24*
