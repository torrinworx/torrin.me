# Codebase Concerns

**Analysis Date:** 2026-03-24

## Tech Debt

**Build/deploy flow is split across multiple ad hoc entrypoints:**
- `build.sh`, `setup.sh`, `server.js`, `vite.config.js`, and `vite.config.ssg.js` all participate in release/runtime setup.
- `build.sh` hardcodes `nvm use 25`, so releases depend on a local NVM install and a specific Node toolchain.
- `setup.sh` assumes root access, `systemd`, `nginx`, and `certbot` paths on a Linux host.

**Blog/docs metadata logic is duplicated:**
- `buildBlog.js` extracts header/description/date metadata from markdown.
- `frontend/pages/Blog.jsx` re-parses dates and sorts posts client-side again.
- `buildDocs.js` also reads markdown metadata and copies docs into `frontend/public/destamatic-ui/docs`.

**Generated content is rebuilt with full-tree scans:**
- `vite.config.js` and `vite.config.ssg.js` rebuild markdown indices from scratch on every `.md` change.
- This is simple, but it scales poorly as `frontend/public/blog` and `destamatic-ui/docs` grow.

## Security Risks

**Public contact endpoint is spam-prone:**
- `server.js` exposes `POST /contact` with no auth, rate limiting, CAPTCHA, origin check, or sender verification.
- User-controlled `fullName`, `email`, and `message` are passed straight into the outgoing email payload.

**Editor sandbox is not isolated:**
- `frontend/destamatic-ui/editor/Editor.jsx` compiles user code and executes it with `new Function('__runtime', compiled)`.
- The preview mounts into the live page DOM instead of an iframe, so arbitrary code shares the same browser context as the app.

## Performance Concerns

**Markdown rendering is heavy and client-side:**
- `frontend/utils/Markdown.jsx` is a large parser/renderer with many regex passes, token rewrites, embeds, and footnote handling.
- Blog pages load markdown over the network and then render it in the browser (`frontend/pages/Blog.jsx`), which can become expensive for long posts.

**Stage URL synchronization is complex:**
- `destamatic-ui/components/display/Stage/Stage.jsx` uses observers, microtasks, and double `requestAnimationFrame` locks to keep URL and stage state in sync.
- That makes the routing path expensive to reason about and easy to regress when adding new stage behavior.

## Fragile Implementation Areas

**Theme engine relies on global singleton state:**
- `destamatic-ui/components/utils/Theme/Theme.jsx` mounts a single `<style>` into `document.head` at import time.
- Duplicate theme definitions throw in `Theme.define`, and theme parsing/caching is built around shared mutable globals.

**Rich text engine depends on browser selection APIs:**
- `destamatic-ui/components/utils/RichEngine/RichEngine.js` uses `document.caretRangeFromPoint`, `document.caretPositionFromPoint`, and live DOM measurements.
- Selection behavior is likely to vary across browsers and is hard to test without a real DOM.

**Static doc generation does not clean stale files:**
- `buildDocs.js` copies markdown files into `frontend/public/destamatic-ui/docs` but never removes destinations for deleted source files.
- Old docs can remain served even after the source markdown disappears.

## Maintainability Issues

**Environment contract is incomplete:**
- `server.js` expects `RESEND_API`, `EMAIL_FROM`, `EMAIL_TO`, and `EMAIL_SUBJECT`, but `.example.env` only documents `ENV`, `PORT`, `RESEND_API`, `EMAIL_FROM`, and `EMAIL_TO`.
- Missing validation means the contact flow can fail at request time instead of failing fast on startup.

**Client and build logic diverge:**
- `frontend/pages/Blog.jsx` contains date parsing and fallback logic that overlaps with `buildBlog.js`.
- `frontend/utils/Markdown.jsx` is the main presentation parser, but its behavior is difficult to keep aligned with the metadata extraction used during build.

## Test Coverage Gaps

**Root app and deploy scripts are untested:**
- `package.json` runs `node --test`, but the repository root has no `*.test.*` files for `server.js`, `buildBlog.js`, `buildDocs.js`, `build.sh`, or `setup.sh`.
- The only explicit tests live under `destamatic-ui/components/...` and use Vitest from `destamatic-ui/package.json`.

**High-risk flows lack dedicated tests:**
- `server.js` `/contact` validation, `buildDocs.js` stale-file behavior, and `Editor.jsx` runtime compilation/error recovery all lack direct coverage.
- `destamatic-ui/components/display/Stage/Stage.jsx` has tests, but the broader URL/build/deploy pipeline does not.

---

*Concerns audit: 2026-03-24*
