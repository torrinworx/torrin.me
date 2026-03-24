# Technology Stack

**Analysis Date:** 2026-03-24

## Languages

**Primary:**
- JavaScript (ES modules) - app server, Vite configs, build scripts, and UI code in `server.js`, `vite.config.js`, `vite.config.ssg.js`, `build.sh`, `frontend/**/*.jsx`, and `destamatic-ui/**/*.jsx`.

**Secondary:**
- Shell/Bash - build and deployment orchestration in `build.sh` and `setup.sh`.
- CSS-in-JS strings - theme definitions and inline styles in `frontend/utils/theme.js` and component files under `destamatic-ui/components/**`.

## Runtime

**Environment:**
- Node.js 25 - pinned in GitHub Actions and the generated `run.sh` from `build.sh`.
- Browser runtime - client rendering and analytics bootstrapping in `frontend/index.jsx` and `frontend/App.jsx`.

**Package Manager:**
- npm - used for install, test, build, and publish flows in `package.json` and `destamatic-ui/package.json`.
- Lockfiles: present at `package-lock.json` and `destamatic-ui/package-lock.json`.

## Frameworks

**Core:**
- Vite 7.2.x - dev server, client bundle, and SSG bundle in `vite.config.js`, `vite.config.ssg.js`, and `destamatic-ui/vite.config.js`.
- destam - fine-grained observer/state layer used throughout `frontend/**` and `destamatic-ui/**`.
- destam-dom - DOM renderer and transform hooks used in `vite.config.js`, `server.js`, and `destamatic-ui/ssg/**`.
- `@destamatic/ui` - local package dependency (`file:destamatic-ui`) that supplies components, theming, routing, and SSG helpers.

**Testing:**
- Node test runner - root `npm test` runs `node --test` from `package.json`.
- Vitest - library tests in `destamatic-ui/package.json` and `destamatic-ui/vitest.config.js`.

**Build/Dev:**
- `build.sh` - production build, SSG generation, bundle packaging, and zip creation.
- `server.js` - dev middleware server and production static/contact server.
- `destamatic-ui/ssg/build.js` - renders routes to static HTML and builds `sitemap.xml`.
- `destamatic-ui/ssg/render.js` - serializes the DOM produced by destamatic-ui.

## Key Dependencies

**Critical:**
- `destam` - observer primitives, reactive values, and data flow.
- `destam-dom` - direct DOM updates and JSX transform runtime.
- `@destamatic/ui` - main component and routing system for the site and demos.
- `resend` - contact form email delivery in `server.js`.
- `@plausible-analytics/tracker` - client analytics bootstrapping in `frontend/App.jsx`.

**Infrastructure:**
- `@babel/core`, `@babel/parser`, `@babel/generator`, `@babel/types`, `@babel/traverse`, `@babel/register` - JSX and HTML-literal transform pipeline in Vite and library tooling.
- `esbuild` - Vite JSX compilation support.
- `nodemon` - local dev restart loop in `package.json`.
- `rollup-plugin-copy`, `rollup-plugin-terser` - library packaging in `destamatic-ui/package.json`.
- Icon/data packs: `@iconify-json/feather`, `@iconify-json/lineicons`, `@iconify-json/simple-icons`, `@iconify-json/tabler`, `@iconify-json/svg-spinners`, `@material-design-icons/svg`.
- UI/data helpers: `leaflet`, `country-region-data`, `prismjs`.

## Configuration

**Environment:**
- Development env is loaded manually from `.env` in `server.js`; the file exists at the repository root.
- Runtime variables consumed by `server.js`: `NODE_ENV`, `PORT`, `ENV`, `RESEND_API`, `EMAIL_FROM`, `EMAIL_TO`, `EMAIL_SUBJECT`.
- Client analytics is hardcoded to the self-hosted Plausible endpoint `https://stats.torrin.me/api/event` in `frontend/App.jsx`.

**Build:**
- `vite.config.js` - root app build config with `root: './frontend'`, `base: ''`, alias `util -> util/`, and optimized dependency exclusions for `@destamatic/ui`, `destam-dom`, and `destam`.
- `vite.config.ssg.js` - SSR bundle config for `frontend/index.ssg.jsx`.
- `destamatic-ui/vite.config.js` - library/example build config rooted at `./examples`.
- `.github/workflows/*.yml` - CI and deploy automation.

## Platform Requirements

**Development:**
- Node.js 25+, npm, and a browser.
- Local Vite dev server for UI work; `server.js` proxies to Vite in development.

**Production:**
- Self-hosted Linux server running `server.js` under systemd, behind nginx, with Let’s Encrypt managed by `setup.sh`.

---

*Stack analysis: 2026-03-24*
