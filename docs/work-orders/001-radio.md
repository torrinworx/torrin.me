# 001: the radio

Approved 2026-09-24. Shaped from Torrin's ask for a station like the lofi girl stream: server
side, one live broadcast shared by every listener, generative, no cuts.

## Design note (build, 2026-09-24)

What was decided while building, why, and what would reverse it.

- **The radio is standalone.** `radio/` imports nothing from `@aweftjs/*` and serves its stream
  with `node:http`. It has to run from its own directory on the droplet, on Node's own TypeScript
  support, so that a site deploy can replace `deploy/` under it without touching it. One route and
  no gate is not enough to need the stack's server. Reversed if the radio ever needs the store,
  the gate or a second route worth a module.
- **The tone is ffmpeg's.** The low-pass and the loudness are `-af` filters on the encoder, not
  code in the sampler. Reversed if the sound needs something ffmpeg's filters cannot do.
- **GeneralUser GS v2.0.3** is the soundfont: 32 MB, its license allows this use. Fetched once
  by `npm run soundfont` from the official GitHub repository at a pinned commit, checked against a
  sha256, kept out of git, shipped in the zip. Its license asks for a local copy rather than a
  link to its download, which the zip is.
- **Two channel banks crossfade tracks.** A new track starts on the other four channels at zero
  volume and both ramp on CC7 over the crossfade; drums stay on channel 10 and belong to the newer
  track, fading by velocity over a track's first and last bars.
- **Every step is computable on its own.** The track is seeded by its slot (wall clock over track
  length) and a step's chance events by a hash of slot and step, so a restart resumes mid-track
  with the same notes and no state is kept anywhere.
- **The sampler is a `Voice` the station is handed.** Tests use a plain tone generator, so the
  suite needs neither the soundfont nor a network; the proof uses the real one.
- **nginx talks to the radio directly** at `/radio/stream`, buffering off, and the vite dev server
  proxies the same path, so the page uses one relative URL everywhere. The site's process never
  carries audio.

## What gets built

A radio station at torrin.me/radio. One process on the droplet composes music in code around the
clock, plays it through a free soundfont, encodes one MP3 stream, and every listener hears the same
live stream. A play button on the page, lock-screen controls on a phone.

## The sound

Smooth, ethereal, floating, almost-sleeping, relaxing. Slow (58 to 70 bpm), a soft chord bed
(electric piano or pad), a quiet bass, sparse soft drums that the config can turn down to none, an
occasional melody. No vinyl crackle. A gentle low-pass keeps it warm.

## The tool shape

- `radio/` in this repo, its own process. The composer picks a key, a chord progression, a bass
  line, a drum pattern and a melody now and then, and moves to a new track every few minutes with
  a crossfade, so it never stops or cuts.
- The sampler is FluidSynth compiled to WebAssembly (npm `js-synthesizer`), playing a free
  soundfont under 40 MB (the droplet has about 320 MB free).
- ffmpeg encodes to MP3 at 128 kbps. The process serves the stream on a local port, keeps the last
  second of audio so a new listener starts at once, and fans one encoder out to everyone.
- nginx proxies `/radio/stream` to that port with buffering off. `setup.sh` writes a second unit,
  `torrin.me-radio`, beside the site's, and installs ffmpeg if it is missing.
- The build ships the radio inside the same zip. `setup.sh` restarts the radio unit only when the
  radio's own files changed, so a site-only deploy never cuts the stream.
- `/radio`, a page in the site with the play button and one line about what it is, listed in the
  hamburger menu. The audio element lives outside the page template so moving between pages does
  not stop it. The Media Session API supplies title, artwork and play/pause on a phone's lock screen.
- The composition's state is derived from the wall clock (the seed is the current track slot), so
  a restart resumes the same track instead of starting a new one, and nothing generated is stored.

## What it never decides

- The sound beyond the brief above is Torrin's. The chord banks, tempo range, instruments and drum
  density sit in one file he can edit.
- It never autoplays: the browser forbids it and the play button is the start.
- No listener cap.

## His calls

- Sound: "smooth, ethereal, floating, almost sleeping vibes, relaxing. no vinal crackle."
- Source: a soundfont, nothing recorded.
- Deploy: "separate systemd is fine as long as the build process can update the generator."
- Placement: "/radio page separate, accessible from the dropdown hamburger menu."
- Background play on a phone: yes, with lock-screen controls.

## Not in scope

Listener count, a visualizer, requests or chat, an archive of past audio, a route that plays a past
time, a second station, an installable app.

## Definition of done

The repo's gate is green (content, typecheck, build, test, proof). Tests: the composer is
deterministic for a seed; the stream route sends MP3 frames continuously and a listener joining
mid-stream gets audio within a second. The proof records ten seconds from the running process and
checks it is not silent.

## Evidence the build must produce

- CPU and memory of the radio unit on the droplet after deploy, target under 15% of the one core.
  The probes on 2026-09-24: the sampler at 1% of a core and 102 MB resident, ffmpeg at 2% and
  53 MB, both for 20 s of real-time audio at 48 kHz stereo.
- A site deploy while listening, with no cut.
- Lock-screen controls checked on Torrin's phone.
- Two fresh-context reviews passed.
