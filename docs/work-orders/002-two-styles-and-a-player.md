# 002: two styles and a player

Approved 2026-09-24. Shaped from Torrin's verdict on 001 ("seems to be a good first iteration")
and his ask for a music-player look, plainer copy, and better music modelled on the Lofi Girl
sleep stream (https://www.youtube.com/watch?v=nI725iVsyoQ, the same feed as
https://www.youtube.com/watch?v=xORCbIptqcc) and the synthwave stream
(https://www.youtube.com/watch?v=4xDzrJKXOOY), switching back and forth.

## What was measured (six minutes of each stream, 2026-09-24)

- Sleep: no beat, almost nothing above 500 Hz (spectral centroid 190 to 350 Hz, 85% rolloff 340
  to 540 Hz), mostly major keys, level steady, -17.2 LUFS, LRA 5.
- Synthwave: 86 bpm then 136 bpm across two tracks, drums throughout (3 to 6.5 onsets a second),
  minor keys mostly, centroid 700 to 1200 Hz, rolloff 1000 to 2700 Hz, -16.7 LUFS, LRA 12.
- Today's station: centroid 855 Hz, rolloff 1689 Hz, crest 12, between the two and like neither.
- The soundfont carries the 808/909, Electronic and Dance kits, saw and square leads, synth basses
  and the pads, and all of them play through the sampler.

## Design note (build, 2026-09-24)

- **The low-pass is the station's, not ffmpeg's.** ffmpeg cannot change a filter's cutoff on a
  running stream, and two styles overlap during a crossfade. `radio/tone.ts` is a two-pole
  low-pass over the station's output whose cutoff ramps from the ending style's to the
  starting style's across the crossfade. ffmpeg keeps the compressor and the limiter only.
  Reversed if a style needs a tone ffmpeg's filters give and a biquad cannot.
- **Tracks are laid out by a schedule, not a fixed slot length.** Sleep tracks are longer than
  synthwave ones, so `radio/schedule.ts` repeats a cycle of three of each and answers, for any
  moment, which track that is and when it began. The slot number is still what seeds a track.
- **Ducking is composed, not measured.** The synthwave composer emits a `duck` event on every
  kick and on the steps after it, and the station turns those into the bass channel's level. A
  sidechain that listened to the audio would cost a detector for a thing the composer already
  knows.
- **The stream's clock reaches the page through `/now`.** It answers the server's time and the
  backlog length beside the track, so a phone can place the audible beat without touching the
  audio: what is heard is the server's time at the press, less the backlog, plus the element's
  own position.
- **`RADIO_START` pins the clock.** The process, the proof and the render script can start the
  station at a given moment, which is how a render of one style or a test of a boundary is made.

## What gets built

The station plays two styles, sleep and synthwave, in blocks of three tracks each, and the page
becomes a small music player with a bar visualizer in the site's colours and plain copy.

## The tool shape

- `radio/config.ts` grows a section per style: tempo range, modes, progressions, instruments,
  drum kit, levels, low-pass, track length. Style order and block length sit beside them.
- `radio/compose.ts` composes per style. Sleep: low pads and a sub drone, chords held four bars
  or more, no drums, no melody. Synthwave: kick on every beat, snare on two and four,
  sixteenth-note octave bass that ducks on each kick, minor-key pad progressions, a saw lead for
  arpeggios and short lines, drums in over the intro and out for a breakdown. A track also gets a
  generated name from its seed.
- `radio/station.ts` picks the style from the slot (three slots per style, alternating) and keeps
  the crossfade. The encoder's low-pass and loudness follow the style, so a style change is a
  filter change on the running ffmpeg or a second filter chain. The build settles which and
  records it.
- `radio/serve.ts` gains `GET /now`: style, track name, key, tempo, bar, and the block's remaining
  time. nginx proxies `/radio/now` to it.
- `frontend/pages/radio.tsx` becomes the player: name and style line, play and stop, the bars, a
  status word. Copy is plain: "Radio. Live, the same for everyone, composed as it plays." Status
  words: Playing, Tuning, Stopped, Not reachable.
- `frontend/radio.ts` adds the visualizer source: on desktop the real spectrum through the
  browser's analyser, on phones bars pulsing to the tempo from `/now`, both drawn on a canvas in
  the theme's greens on paper.

## What it never decides

- Which style plays when is a setting, not code.
- Nothing autoplays.
- Phones never route audio through the browser's audio engine.

## His calls

- "go with you recommendations": blocks of three tracks per style; real spectrum on desktop and
  tempo bars on phones; a now-playing line with a generated name.
- The sleep style has no drums, because the reference has none.
- Two ninety-second renders he listens to and approves before anything deploys.

## Not in scope

Listener-chosen stations, time-of-day scheduling, vinyl crackle, vocals or samples from the
reference streams, a route that plays a past time.

## Definition of done

Gate green. Tests: each style's composer is deterministic and keeps to its rules (no drums in
sleep, a kick on every beat in synthwave, the bass ducks on kicks), the style alternates on the
block boundary, `/now` answers the same track the stream plays, the visualizer picks the tempo
source on a touch device. The proof records ten seconds of each style. Before deploy, two
ninety-second renders in `proof-shots/` that Torrin listens to and approves.

## Evidence the build must produce

- Spectral centroid and loudness of each style's render next to the references (sleep: centroid
  under 400 Hz, about -17 LUFS; synthwave: centroid 700 to 1200 Hz, about -17 LUFS).
- Mutants on the new rules.
- Two fresh-context reviews.
- CPU and memory on the droplet after deploy.
- Torrin's phone check of the tempo bars and lock-screen play.
