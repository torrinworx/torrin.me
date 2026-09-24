My personal website and portfolio, check it out at [torrin.me](https://torrin.me)!

Built on [aweft](https://github.com/torrinworx). The landing page, the contact page and a blog,
written out as files at build time and taken over in the browser, served by one Node process that
also answers the contact form.

## Getting it running

The stack is the `aweft` submodule, pinned to a commit of `github.com/torrinworx/aweft`:

```
git clone --recurse-submodules <this repo>
npm install                 # links aweft/packages/* as workspaces
npm run dev                 # the blog's build step, then vite on port 3000
```

The blog's build step renders the card a link to a post unfurls to from the studio kit's template
(`kit/templates/og.html` in [studio](https://github.com/torrinworx/studio), beside the brand's
fonts), so it wants that repository checked out beside this one, or `STUDIO_DIR` pointing at it.
Playwright's Chromium renders the cards; `npx playwright install chromium` once if it is missing.

A checkout that predates the submodule takes it with `git submodule update --init`. Moving the pin
to the top of aweft's main branch is `git submodule update --remote`, and the new pin is a change to
commit here like any other.

What the submodule holds is TypeScript source, while the stack's packages point their exports at the
compiled `dist/` a published package carries. So everything here asks for the source by name: the
`node-options` line in `.npmrc` for what npm runs, `customConditions` in `tsconfig.json` for the
typecheck, `resolve.conditions` in `vite.config.ts` for the bundle, and `--configLoader native` on
vite so that config is loaded by Node instead of being pre-resolved by the bundler, which has no way
to know about the condition.

`npm start` runs the real server against `dist/`, reading `.env` if there is one. It needs the
`db` line in that file even to serve the static pages: the logs battery keeps its visits in
Postgres, and `main.ts` refuses to start without a reachable database.

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
it on its own. Then `npm run content` builds the blog (below), before vite copies what it wrote.

## The radio

`/radio` plays one live station: `radio/` composes slow music in code, plays it through a soundfont
(FluidSynth compiled to WebAssembly, over GeneralUser GS) and encodes one MP3 stream with ffmpeg,
which every listener is handed from the moment they press play. The composition is a function of
the wall clock, so every listener hears the same moment and a restart resumes the same track.

```
npm run soundfont           # fetches the 32 MB soundfont into radio/assets/, once
npm run radio               # the station on RADIO_PORT (3010); the dev server proxies /radio/stream to it
```

The radio is its own process and imports nothing from the stack: on the droplet it runs as the
`torrin.me-radio` unit from `/var/www/torrin.me/radio`, and `setup.sh` replaces and restarts it
only when what shipped under `radio/` changed, so a deploy that touched the site alone never cuts
the stream. nginx proxies `/radio/stream` to it with buffering off; the site's process never
carries audio. What it plays is `radio/config.ts`: tempo, modes, instruments, drums, levels and
the encoder's tone. `GET /health` on its port says what is playing and how many are listening.

## Writing a post

A post is `content/blog/<slug>.md`, its media in `content/blog/<slug>/`, and the slug is the URL:
`/blog/<slug>`, which never changes once a post is out. The file starts with YAML front matter:

```yaml
---
title: Why Compilers Exist
description: One sentence for the index and the meta description.
date: 2026-02-20T01:21:00-05:00     # YYYY-MM-DD, with or without THH:MM(:SS) and Z or ±HH:MM
updated: 2026-03-01                  # optional, the same shape
draft: true                          # optional; a draft is checked but has no page
future: true                         # optional; a published post dated after today is refused without it
discuss: https://news.ycombinator.com/item?id=...   # optional, the "Discuss on Hacker News" line
image: A shorter headline for the card                # optional
---
```

`draft` and `future` take the YAML booleans `true` and `false` and nothing else: `yes` or
`"true"` is refused rather than read as one or the other. `discuss` has to be a thread on
`news.ycombinator.com`, since it goes into the page as a link.

The body is markdown as `@aweftjs/ui`'s `Markdown` reads it: headings, paragraphs, fences, lists
three deep, tables, quotes, rules, and an image alone on its line as a figure with its alt text as
the caption. An image is referenced by its bare file name, `![The caption](pic.png)`, and lives
beside the markdown in `content/blog/<slug>/`. On top of that the site adds `^superscript^`, a
callout (a quote whose first word is `Note:`), and a YouTube video: write it as an image whose
source is the video's URL, `![What it shows](https://youtu.be/<id>)`, and the page shows the
poster with a Play button; the player loads from `youtube-nocookie.com` only after the click.

`npm run content` (`content/blog.ts`) reads every post and refuses one with no title or date, a
published one with no description, a published one dated after today without `future: true`, or
two files that would share a URL. It rewrites `[text][n]` references to inline links, copies each
image into `frontend/public/media/<slug>/` under a name carrying its content hash, fetches a
video's poster once into the post's folder (commit it), runs shiki over the fences, renders the
cards, and writes the index the bundle imports (`frontend/data/posts.json`), a markdown twin and
the fence tokens per post (`frontend/public/blog/`). A published post fails the build when an
image is missing, when an image line would show as text (a space in the source, a size that is
not `=WxH`), or when it links `/blog/<slug>` to a draft or to no post; for a draft the first two
are warnings and the links go unchecked. An image whose path climbs out of the post's folder
fails the build either way. Everything it writes is generated and ignored by git; the sources
under `content/` are what is committed.

The pages step then writes `/blog`, a page per published post, and three feeds beside the
sitemap: `feed.xml` (Atom, full text), `feed.json` (JSON Feed 1.1) and `feed-summary.xml` (the
description, the first paragraph and a link, for dev.to's import).

## Layout

| path | what it is |
|---|---|
| `frontend/site.tsx` | the acts: the landing page, the contact page, the blog, and the fallback |
| `frontend/pages/blog.tsx` | the blog index and the post page: head tags, structured data, the contents list, the modifiers |
| `frontend/posts.ts` | the post index the bundle carries, and where a post's body comes from on each side |
| `frontend/feeds.ts` | the three feeds |
| `frontend/entry.tsx` | what the browser runs; a post page fetches its twin before it takes over |
| `frontend/pages.ts` | writes every page, `404.html`, `shell.html`, `sitemap.xml` and the feeds |
| `frontend/data/resume.json` | the content, shared with the resume generator |
| `content/blog/` | the posts and their media |
| `content/blog.ts` | the blog's build step; `content/highlight.ts` and `content/cards.ts` are its fences and its cards |
| `frontend/pages/radio.tsx` | the radio page; `frontend/radio.ts` is the player, one audio element for the whole site |
| `main.ts` | the server: the site's modules, the health and static batteries, the build stamp |
| `modules/` | the site's own server modules: the gate, and the contact form |
| `radio/` | the station: `config.ts` is the sound, `compose.ts` the notes, `station.ts` the clock, `pace.ts` keeps it on the wall clock, `voice.ts` the sampler, `stream.ts` the encoder and fan-out, `serve.ts` its port, `main.ts` the process |
