// A render of one style to an MP3, to listen to before a deploy: the first track of that style
// in the schedule, from its start (so its first twelve seconds are the fade-in), through the
// same sampler, low-pass and encoder the station streams with. The start is pinned here, not
// through RADIO_START, which is the process's own way of doing the same.
//
// Run: node radio/render.ts <sleep|synthwave> <seconds> <out.mp3>

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config.ts';
import type { StyleName } from './config.ts';
import { firstSlot, slotOf } from './schedule.ts';
import { station } from './station.ts';
import { encoderArgs } from './stream.ts';
import { fluid } from './voice.ts';

const [style, seconds, out] = process.argv.slice(2) as [StyleName | undefined, string | undefined, string | undefined];
if (style === undefined || !(style in config.style) || seconds === undefined || out === undefined) {
	throw new Error('usage: node radio/render.ts <sleep|synthwave> <seconds> <out.mp3>');
}

if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).error !== undefined) {
	throw new Error('ffmpeg is not on the path: nothing can encode the render without it');
}

const begins = slotOf(firstSlot(style)).begins;

const soundfont = process.env['RADIO_SOUNDFONT'] ?? fileURLToPath(new URL('./assets/GeneralUser-GS.sf2', import.meta.url));
const voice = await fluid(readFileSync(soundfont));
const playing = station({ voice, start: begins });

const encoder = spawn('ffmpeg', encoderArgs(out), { stdio: ['pipe', 'inherit', 'inherit'] });

for (let i = 0; i < Number(seconds) * 10; i++) {
	if (!encoder.stdin.write(playing.next())) await new Promise((done) => encoder.stdin.once('drain', done));
}
encoder.stdin.end();
await new Promise<void>((done, fail) => {
	encoder.once('exit', (code) => { code === 0 ? done() : fail(new Error(`ffmpeg exited with ${String(code)}`)); });
});
voice.close();
const now = playing.playing();
console.log(`${style}: ${seconds} s of "${now.name}" (${now.key}, ${String(now.tempo)} bpm) written to ${out}`);
