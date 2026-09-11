My personal website and portfolio, check it out at [torrin.me](https://torrin.me)!

Built on [aweft](https://github.com/torrinworx). Two pages, written out as files at build time and
taken over in the browser, served by one Node process that also answers the contact form.

## Getting it running

The stack is the `aweft` submodule, pinned to a commit of `github.com/torrinworx/aweft`:

```
git clone --recurse-submodules <this repo>
npm install                 # links aweft/packages/* as workspaces
npm run dev                 # vite, on port 3000
```

A checkout that predates the submodule takes it with `git submodule update --init`. Moving the pin
to the top of aweft's main branch is `git submodule update --remote`, and the new pin is a change to
commit here like any other.

What the submodule holds is TypeScript source, while the stack's packages point their exports at the
compiled `dist/` a published package carries. So everything here asks for the source by name: the
`node-options` line in `.npmrc` for what npm runs, `customConditions` in `tsconfig.json` for the
typecheck, `resolve.conditions` in `vite.config.ts` for the bundle, and `--configLoader native` on
vite so that config is loaded by Node instead of being pre-resolved by the bundler, which has no way
to know about the condition.

`npm start` runs the real server against `dist/`, reading `.env` if there is one.

## Building and deploying

```
./build.sh                        # dist/, then a zip of everything the droplet needs
PUBLIC_IP=<droplet> ./deploy.sh   # ships the zip and runs setup.sh on the far end
```

`build.sh` stamps what it ships with a build id (the commit and the time) in `build/build.json`, and
the server answers it from `GET /api/health` through `@aweftjs/health`, beside `ok` and when the
process started. `deploy.sh` polls that route after the restart until the build answering is the
one it shipped, and exits nonzero if it never is; it does not roll back. A checkout with no stamp
answers `null` for the build.

There is no CI: the build happens here and the zip goes up. The reason it could not was that aweft
had no remote for a workflow to check out. It has one now, and the submodule is what a workflow
would take with `submodules: recursive`, so the workflow is a thing to write rather than a thing
that is blocked.

`build.sh` regenerates `frontend/public/Torrin_Leonard_Resume.pdf` from `frontend/data/resume.json`
before anything else, so the page and the downloadable PDF cannot drift. `npm run resume:pdf` does
it on its own.

## Layout

| path | what it is |
|---|---|
| `frontend/site.tsx` | the acts: the landing page, the contact page, and the fallback |
| `frontend/entry.tsx` | what the browser runs |
| `frontend/pages.ts` | writes every page, `404.html`, `shell.html` and `sitemap.xml` |
| `frontend/data/resume.json` | the content, shared with the resume generator |
| `main.ts` | the server: the site's modules, the health and static batteries, the build stamp |
| `modules/` | the site's own server modules: the gate, and the contact form |
