# Architecture

**Analysis Date:** 2026-03-24

## Pattern Overview

**Overall:** Vite-built JSX application with a custom destam/destam-dom UI runtime and a Stage-based route tree.

**Key Characteristics:**
- The public site boots from `frontend/index.jsx` and renders a single `App` component into `document.body`.
- Navigation, page state, and URL sync are handled by `Stage` / `StageContext` from `destamatic-ui`, not a React router.
- The repository contains two app surfaces: the personal site in `frontend/` and the `destamatic-ui` showcase app in `frontend/destamatic-ui/`.

## Layers

**Runtime / HTTP layer:**
- Purpose: serves the built site, development Vite middleware, and the contact endpoint.
- Location: `server.js`
- Contains: Node `http` server, static file handling, `/contact` POST handler, Vite dev middleware.
- Depends on: `resend`, `vite`, Node `fs/path/url`.
- Used by: production start path and local development.

**Build layer:**
- Purpose: compiles frontend assets, generates blog indexes, and copies docs content into build output.
- Location: `build.sh`, `vite.config.js`, `vite.config.ssg.js`, `buildBlog.js`, `buildDocs.js`
- Contains: Vite config, SSG entry, blog/doc index generators.
- Depends on: `destam-dom` transforms, Vite, filesystem APIs.
- Used by: `npm run build` and dev server watch hooks.

**Site application layer:**
- Purpose: defines site pages, SEO metadata, shared layout, and contact/blog flows.
- Location: `frontend/App.jsx`, `frontend/pages/*`, `frontend/utils/*`
- Contains: stage definitions, page components, markdown renderer, shared header/footer utilities.
- Depends on: `@destamatic/ui`, `destam`, static assets in `frontend/public/`.
- Used by: `frontend/index.jsx` and `frontend/index.ssg.jsx`.

**UI library layer:**
- Purpose: provides reusable components, context helpers, theme system, and SSG utilities.
- Location: `destamatic-ui/index.js`, `destamatic-ui/components/*`, `destamatic-ui/util/*`, `destamatic-ui/ssg/*`
- Contains: primitives like `Button`, `Stage`, `Theme`, `Popup`, `Shown`, and `createContext`.
- Depends on: `destam`, `destam-dom`.
- Used by: both `frontend/` apps and the library’s own examples/tests.

## Data Flow

**Request/response flow:**
1. `server.js` serves `frontend/` in development through Vite middleware and serves `./build/dist` in production.
2. `frontend/index.jsx` wipes the DOM and mounts `App`.
3. `frontend/App.jsx` creates the root `StageContext` tree and renders `Header`, `Stage`, and `Footer`.
4. `Stage` resolves the current stage, syncs URL path/query state, and mounts the active page component.

**Content flow:**
1. Blog markdown lives in `frontend/public/blog/*.md`.
2. `buildBlog.js` scans markdown, extracts frontmatter-like headings, and writes `index.json`.
3. `frontend/pages/Blog.jsx` loads `/blog/index.json`, maps entries to stage acts, then fetches and renders the selected post markdown.
4. `buildDocs.js` copies `destamatic-ui/docs/**/*.md` into `frontend/public/destamatic-ui/docs/` and writes an index.

**Contact flow:**
1. `frontend/utils/Contact.jsx` validates inputs with `Validate` and `ValidateContext`.
2. The form POSTs JSON to `/contact`.
3. `server.js` forwards the message via `Resend` using environment-driven sender/recipient fields.

**State management:**
- UI state is stored in `Observer`, `OObject`, and `OArray` instances from `destam`/`destam-dom`.
- Global page routing state is stored in stage objects created by `StageContext`.
- Theme state is reactive and cascades through `ThemeContext`.

## Key Abstractions

**Stage tree:**
- Purpose: route-like page composition with nested acts, fallback acts, and URL synchronization.
- Examples: `frontend/App.jsx`, `frontend/pages/Blog.jsx`, `frontend/destamatic-ui/App.jsx`, `destamatic-ui/components/display/Stage/Stage.jsx`
- Pattern: the root `StageContext` owns `acts`, `initial`, `fallback`, and `urlRouting`; child stages can be nested and opened by name.

**Theme system:**
- Purpose: generate CSS classes from reactive theme definitions.
- Examples: `frontend/utils/theme.js`, `frontend/utils/Markdown.jsx`, `destamatic-ui/components/utils/Theme/Theme.jsx`
- Pattern: `Theme.define(...)` registers style trees; `theme={[...classes]}` resolves classes and reactive variables.

**Custom JSX host:**
- Purpose: extend DOM rendering with event helpers, reactive styles, and `each` support.
- Examples: `destamatic-ui/components/utils/h/h.jsx`, `destamatic-ui/components/utils/ThemeContext/ThemeContext.jsx`
- Pattern: JSX compiles to `h(...)`; components can be wrapped with `ThemeContext.use(...)` and `createContext(...)`.

**Markdown renderer:**
- Purpose: render blog content without a full markdown runtime dependency.
- Examples: `frontend/utils/Markdown.jsx`
- Pattern: parses blocks and inline tokens manually, then renders through `Typography`, `Button`, `Checkbox`, and `TextModifiers`.

**Content indexes:**
- Purpose: keep blog/docs pages data-driven.
- Examples: `frontend/public/blog/index.json`, `frontend/public/destamatic-ui/docs/index.json`
- Pattern: generated JSON is fetched at runtime and used to create stage acts.

## Entry Points

**Browser entry:**
- Location: `frontend/index.jsx`
- Triggers: browser load via `frontend/index.html`
- Responsibilities: clear the body with `wipe()` and mount the main app.

**SSG entry:**
- Location: `frontend/index.ssg.jsx`
- Triggers: `vite build --config vite.config.ssg.js`
- Responsibilities: render `App` to string after regenerating blog JSON.

**Server entry:**
- Location: `server.js`
- Triggers: `npm start`, `npm run dev`, production process launch
- Responsibilities: static file serving, SPA fallback, and `/contact` email handling.

**Library entry:**
- Location: `destamatic-ui/index.js`
- Triggers: imports from `@destamatic/ui`
- Responsibilities: export components, utilities, SSG helpers, and destam primitives from one package root.

## Error Handling

**Strategy:** Fail fast in build/runtime utilities, degrade to fallback UI in page code, and return JSON errors for the contact API.

**Patterns:**
- `server.js` returns `400` for missing contact fields and `500` for unexpected handler failures.
- `frontend/pages/Blog.jsx` renders a not-found state when blog metadata or markdown cannot be loaded.
- `destamatic-ui/components/display/Stage/Stage.jsx` logs missing acts and falls back to configured fallback acts.
- `buildBlog.js` and `buildDocs.js` catch file-system errors per file and continue processing remaining content.

## Cross-Cutting Concerns

**Logging:** `console.error` and `console.warn` are used in `server.js`, `buildBlog.js`, `buildDocs.js`, and core library utilities.

**Validation:** Form validation lives in `frontend/utils/Contact.jsx` with `Validate` and `ValidateContext`; runtime assertions live in `destamatic-ui/components/utils/h/h.jsx` and `destamatic-ui/components/utils/ThemeContext/ThemeContext.jsx`.

**Authentication:** Not detected; the site is public and the only protected-like action is the contact email relay in `server.js`.

## Frontend / Backend Relationship

**Root site:** `frontend/App.jsx` is the shared shell for the public site. It mounts `Header`, a `Stage` tree, and `Footer`, and it injects theme, icon, input, and popup contexts.

**Backend:** `server.js` is the only custom server. It does not expose a broader API surface; it mainly serves files and accepts the contact form.

**Shared contract:** `frontend/utils/Contact.jsx` posts to `/contact`, and `server.js` expects `{ email, fullName, message, page }` in JSON. Blog and docs pages both depend on generated JSON indexes under `frontend/public/`.

**Internal showcase app:** `frontend/destamatic-ui/App.jsx` is another `Stage` tree mounted from the same root app. It is a documentation/demo surface for the local `destamatic-ui` package and lives beside the main portfolio pages.

---

*Architecture analysis: 2026-03-24*
