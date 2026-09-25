// The radio process: the soundfont into the voice, the voice into the station, the station's
// blocks into the encoder in step with the wall clock, and the stream on a local port for nginx.
//
// Run: node main.ts   (RADIO_PORT, default 3010, RADIO_SOUNDFONT, default assets/GeneralUser-GS.sf2,
// and RADIO_START, seconds since the epoch to start the station's clock at, for a proof or a
// test that wants a known track. The wall clock otherwise. A pinned clock is the one the pace
// keeps time by and the one /now reports, so nothing sees the station as behind.)

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { pace } from './pace.ts';
import { serve } from './serve.ts';
import { station } from './station.ts';
import { broadcast } from './stream.ts';
import { fluid } from './voice.ts';

const port = Number(process.env['RADIO_PORT'] ?? 3010);
const soundfont = process.env['RADIO_SOUNDFONT'] ?? fileURLToPath(new URL('./assets/GeneralUser-GS.sf2', import.meta.url));
const BLOCK_SECONDS = 0.1;

if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).error !== undefined) {
	throw new Error('ffmpeg is not on the path: the radio cannot encode without it');
}

const voice = await fluid(readFileSync(soundfont));
// The file's bytes are in the synthesizer's heap now and the buffer they came in is garbage,
// but 60 MB of garbage that nothing presses on stays resident. run.sh exposes the collector
// for this one call. Without it the call is a no-op and the memory goes when it goes.
(globalThis as { gc?: () => void }).gc?.();
// A pinned start is a clock of its own: the wall clock, shifted so that now is RADIO_START.
// The pace and the now route read that clock, so nothing sees the station as behind.
const start = process.env['RADIO_START'];
const startedAt = Date.now() / 1000;
const clock = (): number => (start === undefined ? Date.now() / 1000 : Number(start) + Date.now() / 1000 - startedAt);
const playing = station({ voice, blockSeconds: BLOCK_SECONDS, start: clock() });

let stopping = false;
const encoder = broadcast({
	onExit: (code) => {
		if (stopping) return;
		// Without the encoder there is no stream, and the unit restarts the process.
		console.error(`ffmpeg exited with ${String(code)}`);
		process.exit(1);
	},
});
const radio = await serve({ station: playing, broadcast: encoder, port, clock });
console.log(`radio on http://127.0.0.1:${String(radio.port)}/stream`);

const shutdown = (signal: string): void => {
	console.log(`${signal}: stopping`);
	stopping = true;
	radio.stop()
		.then(() => encoder.stop())
		.then(() => { voice.close(); process.exit(0); })
		.catch((error: unknown) => { console.error('stop failed:', error); process.exit(1); });
};
process.once('SIGTERM', () => { shutdown('SIGTERM'); });
process.once('SIGINT', () => { shutdown('SIGINT'); });

await pace(playing, encoder.write, () => !stopping, { blockSeconds: BLOCK_SECONDS, now: clock });
