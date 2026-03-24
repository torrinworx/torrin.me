<!-- GSD:project-start source:PROJECT.md -->
## Project

**Torrin.me**

My personal website and resume surface. It presents my work, experience, projects, and contact details, and it also generates a downloadable PDF resume from a Python script.

**Core Value:** Keep the public website and generated resume content in sync so both always reflect the same current story.

### Constraints

- **Sync**: Landing content and resume content should stay aligned — drift creates inconsistent public-facing messaging.
- **Existing stack**: Changes should fit the current React + Python PDF generator setup — avoid unnecessary rewrites.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES modules) - app server, Vite configs, build scripts, and UI code in `server.js`, `vite.config.js`, `vite.config.ssg.js`, `build.sh`, `frontend/**/*.jsx`, and `destamatic-ui/**/*.jsx`.
- Shell/Bash - build and deployment orchestration in `build.sh` and `setup.sh`.
- CSS-in-JS strings - theme definitions and inline styles in `frontend/utils/theme.js` and component files under `destamatic-ui/components/**`.
## Runtime
- Node.js 25 - pinned in GitHub Actions and the generated `run.sh` from `build.sh`.
- Browser runtime - client rendering and analytics bootstrapping in `frontend/index.jsx` and `frontend/App.jsx`.
- npm - used for install, test, build, and publish flows in `package.json` and `destamatic-ui/package.json`.
- Lockfiles: present at `package-lock.json` and `destamatic-ui/package-lock.json`.
## Frameworks
- Vite 7.2.x - dev server, client bundle, and SSG bundle in `vite.config.js`, `vite.config.ssg.js`, and `destamatic-ui/vite.config.js`.
- destam - fine-grained observer/state layer used throughout `frontend/**` and `destamatic-ui/**`.
- destam-dom - DOM renderer and transform hooks used in `vite.config.js`, `server.js`, and `destamatic-ui/ssg/**`.
- `@destamatic/ui` - local package dependency (`file:destamatic-ui`) that supplies components, theming, routing, and SSG helpers.
- Node test runner - root `npm test` runs `node --test` from `package.json`.
- Vitest - library tests in `destamatic-ui/package.json` and `destamatic-ui/vitest.config.js`.
- `build.sh` - production build, SSG generation, bundle packaging, and zip creation.
- `server.js` - dev middleware server and production static/contact server.
- `destamatic-ui/ssg/build.js` - renders routes to static HTML and builds `sitemap.xml`.
- `destamatic-ui/ssg/render.js` - serializes the DOM produced by destamatic-ui.
## Key Dependencies
- `destam` - observer primitives, reactive values, and data flow.
- `destam-dom` - direct DOM updates and JSX transform runtime.
- `@destamatic/ui` - main component and routing system for the site and demos.
- `resend` - contact form email delivery in `server.js`.
- `@plausible-analytics/tracker` - client analytics bootstrapping in `frontend/App.jsx`.
- `@babel/core`, `@babel/parser`, `@babel/generator`, `@babel/types`, `@babel/traverse`, `@babel/register` - JSX and HTML-literal transform pipeline in Vite and library tooling.
- `esbuild` - Vite JSX compilation support.
- `nodemon` - local dev restart loop in `package.json`.
- `rollup-plugin-copy`, `rollup-plugin-terser` - library packaging in `destamatic-ui/package.json`.
- Icon/data packs: `@iconify-json/feather`, `@iconify-json/lineicons`, `@iconify-json/simple-icons`, `@iconify-json/tabler`, `@iconify-json/svg-spinners`, `@material-design-icons/svg`.
- UI/data helpers: `leaflet`, `country-region-data`, `prismjs`.
## Configuration
- Development env is loaded manually from `.env` in `server.js`; the file exists at the repository root.
- Runtime variables consumed by `server.js`: `NODE_ENV`, `PORT`, `ENV`, `RESEND_API`, `EMAIL_FROM`, `EMAIL_TO`, `EMAIL_SUBJECT`.
- Client analytics is hardcoded to the self-hosted Plausible endpoint `https://stats.torrin.me/api/event` in `frontend/App.jsx`.
- `vite.config.js` - root app build config with `root: './frontend'`, `base: ''`, alias `util -> util/`, and optimized dependency exclusions for `@destamatic/ui`, `destam-dom`, and `destam`.
- `vite.config.ssg.js` - SSR bundle config for `frontend/index.ssg.jsx`.
- `destamatic-ui/vite.config.js` - library/example build config rooted at `./examples`.
- `.github/workflows/*.yml` - CI and deploy automation.
## Platform Requirements
- Node.js 25+, npm, and a browser.
- Local Vite dev server for UI work; `server.js` proxies to Vite in development.
- Self-hosted Linux server running `server.js` under systemd, behind nginx, with Let’s Encrypt managed by `setup.sh`.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Component modules use `PascalCase` filenames inside a matching directory, e.g. `components/inputs/Button/Button.jsx`, `components/inputs/TextField/TextField.jsx`, and `components/display/Stage/Stage.jsx`.
- Tests use lower-case filenames that mirror the component name, e.g. `components/inputs/Button/button.test.jsx`, `components/inputs/Toggle/toggle.test.jsx`, and `components/display/Stage/stage.test.jsx`.
- Example/demo files follow the same lower-case pattern, e.g. `components/inputs/Button/button.example.jsx` and `components/display/Stage/stage.example.jsx`.
- Component factories and helpers use `camelCase` (`createContext` in `components/utils/Context/Context.jsx`, `useRipples` in `components/utils/Ripple/Ripple.jsx`, `handleClick` in `components/inputs/Toggle/Toggle.jsx`).
- Public component exports are default-exported as component names (`Button`, `Toggle`, `TextField`, `Checkbox`) and imported with matching casing.
- Context-like singletons use `PascalCase` (`ThemeContext`, `InputContext`, `StageContext`).
- Theme keys use lower-case + underscores for variants and states (`button_contained_disabled`, `togglethumb_checked`) in `components/inputs/Button/Button.jsx` and `components/inputs/Toggle/Toggle.jsx`.
## Code Style
- Source files in `components/**` use semicolons, multiline trailing commas, and JSX returned directly from arrow functions.
- Tabs appear throughout most component/test files; config files such as `package.json` and `vitest.config.js` use two-space indentation.
- Keep theme blocks visually separated with blank lines, as in `components/inputs/Button/Button.jsx` and `components/inputs/TextField/TextField.jsx`.
- No project-local ESLint/Prettier config is detected in the repository root or `destamatic-ui/`.
- Not detected. Preserve the local file style instead of assuming a formatter will normalize it.
## Import Organization
- No project alias config is detected; package exports provide `@destamatic/ui` for consumers and tests, as seen in `destamatic-ui/package.json` and the test files under `components/**`.
- Internal modules prefer relative paths such as `../../utils/Theme/Theme.jsx` and `../Button/Button.jsx`.
## Component Patterns
- Component modules call `Theme.define(...)` at module scope before exporting the component, e.g. `components/inputs/Button/Button.jsx`, `components/inputs/Checkbox/Checkbox.jsx`, and `components/display/Stage/Stage.jsx`.
- Theme names encode base, variant, and state with underscores and are referenced through `theme={[...]}` arrays.
- Stateful components are commonly wrapped in `ThemeContext.use(...)` and/or `InputContext.use(...)`, e.g. `components/inputs/Button/Button.jsx` and `components/inputs/TextField/TextField.jsx`.
- Context factories are created with `createContext(def, transform)` in `components/utils/Context/Context.jsx` and consumed with `.use(...)`.
- Plain values are converted to `Observer` instances at the component boundary (`Observer.mutable(...)` or `Observer.immutable(...)`) before use, as in `Button.jsx`, `Toggle.jsx`, `TextField.jsx`, and `Checkbox.jsx`.
- Props are passed through with `...props`, but component-specific behavior is wired through reactive props like `theme`, `disabled`, `focused`, `hover`, `loading`, and `value`.
- `ref` is usually an `Observer.mutable(null)` rather than a raw DOM variable, enabling DOM access from reactive logic in `TextField.jsx` and `Checkbox.jsx`.
- JSX is used directly as the render return; parenthesized JSX wrappers are avoided.
## Error Handling
- Guard clauses are preferred for disabled/immutable states before mutation (`Button.jsx`, `TextField.jsx`, `Checkbox.jsx`, `Toggle.jsx`).
- Invalid configuration throws explicit errors, e.g. `Stage.open` in `components/display/Stage/Stage.jsx` throws when `name` is neither string nor array.
- Non-fatal anomalies use `console.warn` or `console.error`, such as missing stage acts in `Stage.jsx` and promise rejection logging in `Button.jsx`.
- Preserve state consistency with `try/finally` when a DOM update must happen even after a callback error, as in `components/inputs/Checkbox/Checkbox.jsx`.
## Comments
- Comments are used to explain edge cases, API constraints, and behavior choices rather than obvious code.
- TODO/FIXME notes exist in `components/inputs/Toggle/Toggle.jsx` and `components/display/Stage/Stage.jsx`; treat them as active design constraints.
- JSDoc is used selectively for subtle helper APIs, especially in `components/utils/Context/Context.jsx` and `components/inputs/Checkbox/Checkbox.jsx`.
## Function Design
- Keep render functions small enough to normalize props, define handlers, and return JSX without splitting into unrelated modules unless the behavior is shared.
- Prefer destructured props with defaults (`type = 'contained'`, `round = false`, `hrefNewTab = true`).
- Use rest props to forward unknown attributes to the underlying element.
- Components return JSX directly; helpers return observers, closures, or plain values as appropriate.
## Module Design
- Components are default exports; utilities often combine default exports with named exports (`Stage`, `StageContext`, `stageRegistry` in `components/display/Stage/Stage.jsx`).
- `destamatic-ui/index.js` re-exports the public API; add new public modules there when they should be consumable from `@destamatic/ui`.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- The public site boots from `frontend/index.jsx` and renders a single `App` component into `document.body`.
- Navigation, page state, and URL sync are handled by `Stage` / `StageContext` from `destamatic-ui`, not a React router.
- The repository contains two app surfaces: the personal site in `frontend/` and the `destamatic-ui` showcase app in `frontend/destamatic-ui/`.
## Layers
- Purpose: serves the built site, development Vite middleware, and the contact endpoint.
- Location: `server.js`
- Contains: Node `http` server, static file handling, `/contact` POST handler, Vite dev middleware.
- Depends on: `resend`, `vite`, Node `fs/path/url`.
- Used by: production start path and local development.
- Purpose: compiles frontend assets, generates blog indexes, and copies docs content into build output.
- Location: `build.sh`, `vite.config.js`, `vite.config.ssg.js`, `buildBlog.js`, `buildDocs.js`
- Contains: Vite config, SSG entry, blog/doc index generators.
- Depends on: `destam-dom` transforms, Vite, filesystem APIs.
- Used by: `npm run build` and dev server watch hooks.
- Purpose: defines site pages, SEO metadata, shared layout, and contact/blog flows.
- Location: `frontend/App.jsx`, `frontend/pages/*`, `frontend/utils/*`
- Contains: stage definitions, page components, markdown renderer, shared header/footer utilities.
- Depends on: `@destamatic/ui`, `destam`, static assets in `frontend/public/`.
- Used by: `frontend/index.jsx` and `frontend/index.ssg.jsx`.
- Purpose: provides reusable components, context helpers, theme system, and SSG utilities.
- Location: `destamatic-ui/index.js`, `destamatic-ui/components/*`, `destamatic-ui/util/*`, `destamatic-ui/ssg/*`
- Contains: primitives like `Button`, `Stage`, `Theme`, `Popup`, `Shown`, and `createContext`.
- Depends on: `destam`, `destam-dom`.
- Used by: both `frontend/` apps and the library’s own examples/tests.
## Data Flow
- UI state is stored in `Observer`, `OObject`, and `OArray` instances from `destam`/`destam-dom`.
- Global page routing state is stored in stage objects created by `StageContext`.
- Theme state is reactive and cascades through `ThemeContext`.
## Key Abstractions
- Purpose: route-like page composition with nested acts, fallback acts, and URL synchronization.
- Examples: `frontend/App.jsx`, `frontend/pages/Blog.jsx`, `frontend/destamatic-ui/App.jsx`, `destamatic-ui/components/display/Stage/Stage.jsx`
- Pattern: the root `StageContext` owns `acts`, `initial`, `fallback`, and `urlRouting`; child stages can be nested and opened by name.
- Purpose: generate CSS classes from reactive theme definitions.
- Examples: `frontend/utils/theme.js`, `frontend/utils/Markdown.jsx`, `destamatic-ui/components/utils/Theme/Theme.jsx`
- Pattern: `Theme.define(...)` registers style trees; `theme={[...classes]}` resolves classes and reactive variables.
- Purpose: extend DOM rendering with event helpers, reactive styles, and `each` support.
- Examples: `destamatic-ui/components/utils/h/h.jsx`, `destamatic-ui/components/utils/ThemeContext/ThemeContext.jsx`
- Pattern: JSX compiles to `h(...)`; components can be wrapped with `ThemeContext.use(...)` and `createContext(...)`.
- Purpose: render blog content without a full markdown runtime dependency.
- Examples: `frontend/utils/Markdown.jsx`
- Pattern: parses blocks and inline tokens manually, then renders through `Typography`, `Button`, `Checkbox`, and `TextModifiers`.
- Purpose: keep blog/docs pages data-driven.
- Examples: `frontend/public/blog/index.json`, `frontend/public/destamatic-ui/docs/index.json`
- Pattern: generated JSON is fetched at runtime and used to create stage acts.
## Entry Points
- Location: `frontend/index.jsx`
- Triggers: browser load via `frontend/index.html`
- Responsibilities: clear the body with `wipe()` and mount the main app.
- Location: `frontend/index.ssg.jsx`
- Triggers: `vite build --config vite.config.ssg.js`
- Responsibilities: render `App` to string after regenerating blog JSON.
- Location: `server.js`
- Triggers: `npm start`, `npm run dev`, production process launch
- Responsibilities: static file serving, SPA fallback, and `/contact` email handling.
- Location: `destamatic-ui/index.js`
- Triggers: imports from `@destamatic/ui`
- Responsibilities: export components, utilities, SSG helpers, and destam primitives from one package root.
## Error Handling
- `server.js` returns `400` for missing contact fields and `500` for unexpected handler failures.
- `frontend/pages/Blog.jsx` renders a not-found state when blog metadata or markdown cannot be loaded.
- `destamatic-ui/components/display/Stage/Stage.jsx` logs missing acts and falls back to configured fallback acts.
- `buildBlog.js` and `buildDocs.js` catch file-system errors per file and continue processing remaining content.
## Cross-Cutting Concerns
## Frontend / Backend Relationship
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
