My personal website and portfolio, check it out at [torrin.me](https://torrin.me)!

Built on [aweft](https://github.com/torrinworx). Two pages, written out as files at build time and
taken over in the browser, served by one Node process that also answers the contact form.

## Getting it running

The stack is not published yet, so it is cloned beside this project rather than installed:

```
git clone <aweft> aweft     # into this directory; it is gitignored
npm install                 # links aweft/packages/* as workspaces
npm run dev                 # vite, on port 3000
```

`npm start` runs the real server against `dist/`, reading `.env` if there is one.

## Building and deploying

```
./build.sh                        # dist/, then a zip of everything the droplet needs
PUBLIC_IP=<droplet> ./deploy.sh   # ships the zip and runs setup.sh on the far end
```

There is no CI. GitHub Actions cannot build this site while aweft has no remote to check out, so
the build happens here and the zip goes up. When aweft is pushed, aweft becomes a submodule and the
workflow comes back.

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
| `main.ts` | the server |
| `modules/` | the site's own server modules: the gate, and the contact form |
