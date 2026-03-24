# External Integrations

**Analysis Date:** 2026-03-24

## APIs & External Services

**Email Delivery:**
- Resend - sends contact form messages from `server.js` via `Resend`.
  - SDK/Client: `resend`
  - Auth: `RESEND_API`
  - Related env: `EMAIL_FROM`, `EMAIL_TO`, `EMAIL_SUBJECT`
  - Route: `POST /contact` in `server.js`

**Analytics:**
- Plausible Analytics - client tracking bootstrapped in `frontend/App.jsx`.
  - SDK/Client: `@plausible-analytics/tracker`
  - Endpoint: `https://stats.torrin.me/api/event`
  - Script: `https://stats.torrin.me/js/pa-y1DeMbOTUm55YjS0JWtyU.js`

**GitHub API:**
- Releases metadata and repository contents in `frontend/destamatic-ui/pages/Landing.jsx`, `frontend/destamatic-ui/pages/Docs.jsx`, and `frontend/destamatic-ui/pages/Playground.jsx`.
  - Used for: latest release badge and remote example loading
  - Auth: not required for the current usage

**Maps:**
- OpenStreetMap tile service - Leaflet tiles in `destamatic-ui/components/inputs/Map/Map.jsx`.
  - SDK/Client: `leaflet`
  - Tile URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

**Package Registry:**
- npm registry - publish pipeline for `destamatic-ui` in `destamatic-ui/.github/workflows/publish.yml`.

## Data Storage

**Databases:**
- Not detected.

**File Storage:**
- Local filesystem only.
  - Blog sources: `frontend/public/blog/*.md`
  - Blog index: `frontend/public/blog/index.json`
  - Documentation sources: `destamatic-ui/docs/**/*.md`
  - Generated docs: `frontend/public/destamatic-ui/docs/index.json` and copied `.md` files
  - Build output: `build/dist` and `build.zip`

**Caching:**
- Not detected.

## Authentication & Identity

**Auth Provider:**
- Not detected.

**Deployment Access:**
- SSH key-based access in GitHub Actions (`secrets.SSH_KEY`) for deployment to the server identified by `secrets.PUBLIC_IP` in `.github/workflows/cicd.yml`.

## Monitoring & Observability

**Error Tracking:**
- Not detected.

**Analytics/Logs:**
- Plausible analytics for page and event tracking.
- Console logging in `server.js`, `buildBlog.js`, `buildDocs.js`, and `destamatic-ui/ssg/**`.

## CI/CD & Deployment

**Hosting:**
- Self-hosted Linux deployment target.
  - App runs from `/var/www/torrin.me/deploy/run.sh` via systemd in `setup.sh`.
  - nginx terminates HTTPS and proxies to the Node process.
  - Certbot manages TLS certificates in `setup.sh`.

**CI Pipeline:**
- GitHub Actions:
  - Root build/deploy: `.github/workflows/build.yml`, `.github/workflows/cicd.yml`
  - Library tests: `destamatic-ui/.github/workflows/build.yml`
  - Library publish: `destamatic-ui/.github/workflows/publish.yml`

## Environment Configuration

**Required env vars:**
- `RESEND_API`
- `EMAIL_FROM`
- `EMAIL_TO`
- `EMAIL_SUBJECT`
- `PORT`
- `NODE_ENV`
- `ENV`

**Secrets location:**
- GitHub Actions secrets for deploy credentials in `.github/workflows/cicd.yml`.
- Local development env file at `.env` (presence detected; contents not read).

## Webhooks & Callbacks

**Incoming:**
- `POST /contact` in `server.js` receives contact form submissions from `frontend/utils/Contact.jsx`.

**Outgoing:**
- Resend email API from `server.js`.
- Plausible analytics endpoint from `frontend/App.jsx`.
- GitHub API requests from `frontend/destamatic-ui/pages/*.jsx`.
- OpenStreetMap tile requests from `destamatic-ui/components/inputs/Map/Map.jsx`.

## Internal Services

**Self-hosted analytics endpoint:**
- `stats.torrin.me` is used as the Plausible event collector in `frontend/App.jsx`.

**Static content endpoints:**
- `/blog/index.json` and `/destamatic-ui/docs/index.json` are generated locally by `buildBlog.js` and `buildDocs.js` and served by the app.

---

*Integration audit: 2026-03-24*
