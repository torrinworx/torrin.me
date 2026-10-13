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
npm run build                        # dist/, then a zip of everything the droplet needs
npm run deploy                       # ships the zip and runs setup.sh on the far end
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

The tab and home screen icons (`frontend/public/favicon-16.png`, `favicon-32.png` and
`apple-touch-icon.png`) are the landing hero's third tree, drawn by the strip's own generator.
`npm run favicons` redraws them, and the tests fail when the committed files no longer match it.
The hero's photo, `frontend/public/portrait.webp`, is a 600 by 800 crop of `headshot.webp`. The
strip draws it floating above the bank, with its reflection in the pond.

## Accessibility

`npm run proof` checks the landing, contact, the blog's index, the newest post, every post with a
pixel scene, the radio and the 404 against WCAG 2.1 AA, light and dark, at 1280, 600 and 320 CSS
pixels wide. It runs axe-core over the markup. Axe cannot see into a canvas, so the proof also
checks each word and icon against what the browser painted under it. Neither check looks at
keyboard focus: where it goes and whether it shows. On each post with a scene the proof also
checks that:

- the Tab key reaches every scene control,
- with reduced motion no scene moves, every word of it shows, and its switches still change what
  it shows,
- the scenes' nodes are the ones the server wrote, and they hydrate with no mismatch on a
  development bundle, which keeps the checks a release bundle drops,
- a post reached by a link from `/blog` draws its scenes too,
- dragging on a map selects no text.

The canvases the scenes are drawn on are hidden from assistive technology. The menu's Motion switch holds every
scene still, stops the button shine and the contact block's blink, and leaves the block's halo
still (SC 2.2.2). It starts off when the system asks for reduced motion, and a visitor's choice is
kept in `localStorage` as `motionChoice`.

## The radio

`/radio` plays one live station: `radio/` composes music in code, plays it through a soundfont
(FluidSynth compiled to WebAssembly, over GeneralUser GS) and encodes one MP3 stream with ffmpeg,
which every listener is handed from the moment they press play. The composition is a function of
the wall clock, so every listener hears the same moment and a restart resumes the same track.

Two styles take turns, three tracks each: sleep (low pads and a drone, nothing struck, a low-pass
near 600 Hz) and synthwave (a kick on every beat, a bass that ducks under it, pads, a saw lead, a
breakdown). Each track has a name made from its seed. `GET /radio/now` says what is on the air,
and the page sets the height of each drawn reed from the music: the real spectrum on a desktop, a pulse on the beat on a phone,
where the audio is never routed through the browser's audio engine so lock-screen play holds.

```
npm run soundfont           # fetches the 32 MB soundfont into radio/assets/, once
npm run radio               # the station on RADIO_PORT (3010). The dev server proxies /radio/stream and /radio/now to it
npm run radio:render -- synthwave 90 proof-shots/radio-synthwave.mp3   # ninety seconds of one style, to listen to
```

The radio is its own process and imports nothing from the stack: on the droplet it runs as the
`torrin.me-radio` unit from `/var/www/torrin.me/radio`, and `setup.sh` replaces and restarts it
only when what shipped under `radio/` changed, so a deploy that touched the site alone never cuts
the stream. nginx proxies `/radio/stream` to it with buffering off. The site's process never
carries audio. What it plays is `radio/config.ts`: per style, the tempo, modes, progressions,
instruments, kit, levels and low-pass, and the block length that alternates them. `GET /health` on
its port says what is playing and how many are listening. `RADIO_START` starts the process's clock
at a given moment, which is how the proof lands on a known track. A render pins its own start.

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

### Pixel scenes

A post can hold a pixel scene: a small illustration of one idea, drawn in the site's pixel style
with its words as real text. Write it as a fence named `scene:<name>`, with YAML inside, on its own
between paragraphs:

````markdown
```scene:numbers
caption: My share of the commits
figures:
  - label: of the commits
    value: 56%
```
````

A scene plays once when half of it is on screen, then rests. Play again plays it again. With
motion off, or a system that asks for reduced motion, it shows its end and nothing moves, but its
switches, the drag and the pointer still change what it shows. Every word of that end shows,
except three kinds that show only when the reader asks:

- a page's name in a deploy, under the pointer,
- the words of the state a switch is not on,
- a map's snippets its search did not find, when the map has no room for all of them beside
  their own points. A tap on the map shows the ones near it.

On a phone a still map is taller than a moving one, so every word shown at the end of its story
fits beside its own point, never by another region. For a system that asks for reduced motion, the
page the build writes already has that height, so nothing jumps once the page is alive. In a feed a
scene is a still frame, drawn by the build, with its words as a list.

The fence holds YAML, so a value with a colon and a space in it (`"CV: water resources lead"`)
or one that starts with `[` goes in quotes.

Every scene takes these three fields beside its own:

- `caption` (needed): one line saying what the scene shows. The page does not show it. A screen
  reader reads it as the scene's name, and a feed shows it under the scene's still frame.
- `example`: says what in the scene is made up to show the idea, shown under it, as
  `Example request, searches and snippets`. Anything invented is labelled here. The build
  refuses a scene without it that shows a figure (any number in its words) the post's own text
  does not state. A scene with it may show made-up figures, such as a deploy's 48 pages.
- `terms`: up to six phrases of the post's own text, each drawn the way the scene draws the same
  thing, the first time the post says it: `text` (exactly as the post writes it) and `as`, one of
  `search` (a search chip), `found` (a found snippet), `thing` (underlined) or `changed`
  (underlined in the accent). The build refuses a term the post never says. Only words a reader
  sees count, for terms and figures alike: a link's target and code do not.

The build refuses a scene it cannot draw, and names the file and line. It refuses a name that is
no scene, YAML that does not parse, a field the scene does not have, a field it needs but lacks, a
field it has but would not draw in that place, empty text, and a list too long or too short. It
also refuses two things with the same name where the scene finds things by name: two databases,
regions or left items, or two clusters with the same `id`. Each scene's own rules below add more.
For a draft these are warnings. A scene's YAML is left out of the post's reading time.

**`pipeline`**: things carried through steps, lane by lane. `lanes` (1 to 3), each with an
optional `label` and `steps` (1 to 5). Each step has a `kind`, which says how it is drawn and
what else it takes:

- `files`, `searches` and `found` hold `items` (1 to 4, shown as file cards, search chips and
  found snippets), with an optional `name` over them.
- `request` and `draft` hold `text` in a card, with an optional `name` over it. A draft is typed
  out as the story plays.
- `prompt` has a `name` and an optional `line` beside it, in a card.
- `model`, `database`, `data`, `build`, `pages`, `upload` and `cloud` have a `name` and are drawn
  as a picture of their own, with an optional `line` under the name, a `badge` beside it (`me`,
  `colleague`) and `shows`, a small tag of what it makes.

A field a step's kind does not list is refused. A `searches` step may `reach` a `database` step
in another lane, by its exact `name`. Lines then run from each search to that database. When the
next step in the searches' lane is `found`, its snippets are drawn coming from the database.
`note`: a line under the lanes.

```yaml
caption: From the data to a page in Google
lanes:
  - steps:
      - kind: data
        name: Data
        line: gathered for each county and region
        badge: colleague
      - kind: build
        name: Generate
        line: every page type in one build
      - kind: cloud
        name: Serve
        line: from object storage to people and Google
```

**`cluster`**: snippets on a map where similar meanings are close together, and a search the
reader drags, whose nearest snippets light up. `regions` (2 to 4), each a `name` and its
`snippets` (1 to 4). `searches` (1 to 3), each `words` and `at`, one or two regions to place it
in or between, written exactly as their `name`. Until the reader touches it, the search moves
through each example once, and with motion off it stays at the last. `id` names the map for a
`fanout` in the same post.

```yaml
caption: Similar meanings sit close together
id: meanings
regions:
  - name: Stormwater
    snippets: [culvert sizing, stormwater pond retrofit]
  - name: Roads
    snippets: [pavement rehabilitation, intersection redesign]
searches:
  - words: detention pond design
    at: [Stormwater]
```

**`fanout`**: one thing split into several, `from` and `into` (2 to 4 branches, each a `name`).
It is drawn one of two ways, and the fields follow:

- Without `map`, the branches are pages the `from` makes: `from` has a `name` and an optional
  `line` under it, and so does each branch.
- With `map`, the `id` of a cluster in the same post, `from` is drawn above the map as a request:
  its `name`, and an optional `label`, a small word above it. Each branch is one search on the
  map. Its `name` is the search's words, and it needs `at`: one or two of the map's region names,
  written exactly. No `line` on a map.
- A fanout on a map can first show the whole request as one search. For that, add `one`, with a
  `name` for that search and a `toggle`, the switch's word for it, and a top-level `toggle`, the
  switch's word for the split. The scene then places the whole of `from` between the regions as
  one search, splits it into the branches, and shows a switch to go between the two.

`at` without a map, `label` without a map, and `one` without a map are refused.

```yaml
caption: One search for the whole request, or one for each part of it
map: meanings
from:
  label: Request
  name: Describe your stormwater experience on road projects.
into:
  - name: stormwater design
    at: [Stormwater]
  - name: road reconstruction
    at: [Roads]
one:
  name: the whole request
  toggle: One search
toggle: Several searches
```

**`toggle`**: the same scene in two states, and a switch between them: `first` and `second` are
the switch's words. `kind` is `deploy` or `prompts`. A deploy draws `pages` (2 to 48) under its
`store`, `changed` of them marked, and uploads every page, then only the changed ones. `names`
(one per page) shows each page's name under the pointer. Prompts draws `tasks` (1 to 4), each a
`name`, its `prompt` from the code and an optional `edit`, an admin's edit shown over it while
the first state is on.

```yaml
kind: deploy
caption: Every page uploaded, or only the changed ones
example: "Example: 48 county pages, 5 changed"
first: Every page
second: Only changed pages
store: Object storage
pages: "48"
changed: "5"
```

**`match`**: two columns joined by lines. `left` (`label`, `items`: 1 to 5) and `right` (`label`,
`items`: 1 to 8, each `text`, `answers`, the left items it answers, and an optional `kind` for its
icon: `file`, `cv`, `proposal`, `page` or `search`). Each left item has a mark, and each right
item gets the marks of the items it answers.

```yaml
caption: An RFP's criteria, and the past work that answers each
left:
  label: The RFP asks for
  items: [Stormwater design experience, A qualified project lead]
right:
  label: From the firm's past work
  items:
    - text: "CV: water resources lead"
      kind: cv
      answers: [A qualified project lead]
```

**`numbers`**: the post's figures as pixel bars, 1 to 4 of them, each a `label` and either a
`value` or both `from` and `to`, never the two together, written as the post writes them. A
percentage fills that much of a bar, a whole number of 200 or fewer is that many blocks, and from
and to are two bars on one scale. Nothing is drawn between the two ends, on purpose: a curve
would need the figures in between, and a post rarely has them. A figure that starts with "under"
ends in a dither. The build reads the bars off the words, and refuses a figure the post's text
does not state, as for every scene.

```yaml
caption: Organic search over six months
figures:
  - label: clicks
    from: under 1,000
    to: 52,100
```

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
| `frontend/data/resume.json` | the content, shared with the resume generator; the hero's three lines are its `hero*` fields |
| `frontend/theme.ts` | the look: a light and a dark mode holding the colours, and `siteTheme` holding the rest |
| `frontend/strip.ts` | the pixel-art scenes: the strip painter (no DOM) for the landing's hero and the smaller scenes on other pages, the canopy and reeds painters, the canvas runner, the Motion switch's cell, and the bird that lands on the resume button or the contact form |
| `frontend/scenes.ts` | the pixel scenes in posts: one painter per kind of scene, no DOM, run in Node by the tests and the feed's still frames |
| `frontend/utils/scenes.tsx` | the scenes' components: their words laid out, the canvas under them, the story, the switches and the drag |
| `frontend/utils/forest.tsx` | where each pixel-art scene goes on the pages (under each landing heading, in an inner page's margins, beside and above each post, in the footer, on the radio and on the 404), and the fade between modes |
| `favicons.ts` | draws the icons from the strip's generator |
| `content/blog/` | the posts and their media |
| `content/blog.ts` | the blog's build step. `content/highlight.ts` turns its code fences into tokens, `content/cards.ts` renders the cards a link unfurls to, and `content/scenes.ts` lists the scenes a post can hold and checks their YAML |
| `frontend/pages/radio.tsx` | the radio page, and `frontend/radio.ts` the player, one audio element for the whole site |
| `main.ts` | the server: the site's modules, the health and static batteries, the build stamp |
| `modules/` | the site's own server modules: the gate, and the contact form |
| `radio/` | the station: `config.ts` holds its settings, `schedule.ts` lays the tracks out in time, `compose.ts` picks the notes, `station.ts` times them, `tone.ts` is the low-pass, `pace.ts` keeps that on the wall clock, `voice.ts` plays them, `stream.ts` encodes and fans out, `serve.ts` answers HTTP, `main.ts` starts it all, `render.ts` writes one style to a file |
