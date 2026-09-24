// The radio: the composer answers the same notes for the same moment, the station turns them
// into sound and crossfades tracks, and the stream reaches a listener from the moment they ask.
// The voice here is the tone generator, so no soundfont is read; the encoder is the real ffmpeg.

import assert from 'node:assert/strict';
import { after, before, describe, it, test } from 'node:test';

import { STEPS_PER_BAR, chance, events, holding, stepAt, track } from '../radio/compose.ts';
import type { Event } from '../radio/compose.ts';
import { config } from '../radio/config.ts';
import { pace } from '../radio/pace.ts';
import { serve } from '../radio/serve.ts';
import type { Radio } from '../radio/serve.ts';
import { station } from '../radio/station.ts';
import { broadcast } from '../radio/stream.ts';
import type { Broadcast } from '../radio/stream.ts';
import { DRUM_CHANNEL, SAMPLE_RATE, tone } from '../radio/voice.ts';
import type { Voice } from '../radio/voice.ts';

describe('the composer', () => {
	it('answers the same track for the same slot, and different tracks for different slots', () => {
		assert.deepEqual(track(1234), track(1234));
		const seen = new Set(Array.from({ length: 40 }, (_, slot) => JSON.stringify(track(slot))));
		assert.ok(seen.size >= 39, `${String(seen.size)} distinct tracks over 40 slots`);
	});

	it('answers the same events for the same step, computed on their own', () => {
		const of = track(77);
		const whole = Array.from({ length: of.steps }, (_, step) => events(of, step));
		// A step asked for alone, out of order, is the step the walk saw.
		for (const step of [of.steps - 1, 0, 37, 512, 129]) assert.deepEqual(events(of, step), whole[step]);
	});

	it('stops every note it starts, except the chord it ends on', () => {
		for (const slot of [3, 8, 21]) {
			const of = track(slot);
			const sounding = new Map<string, number>();
			for (let step = 0; step < of.steps; step++) {
				for (const event of events(of, step)) {
					if (event.part === 'drums') continue;
					const name = `${event.part}:${String(event.key)}`;
					if (event.velocity > 0) sounding.set(name, (sounding.get(name) ?? 0) + 1);
					else {
						assert.ok((sounding.get(name) ?? 0) > 0, `slot ${String(slot)} step ${String(step)}: ${name} stopped without starting`);
						sounding.set(name, (sounding.get(name) ?? 0) - 1);
					}
				}
			}
			const left = [...sounding.entries()].filter(([, count]) => count > 0).map(([name]) => name);
			assert.ok(left.every((name) => !name.startsWith('melody:')), `slot ${String(slot)}: a melody note never stopped: ${left.join(', ')}`);
			assert.ok(left.length <= 7, `slot ${String(slot)}: only the last chord is left sounding, not ${left.join(', ')}`);
		}
	});

	it('keeps the tempo in range and the drums to the middle of a track', () => {
		for (let slot = 0; slot < 30; slot++) {
			const of = track(slot);
			assert.ok(of.tempo >= config.tempo.min && of.tempo <= config.tempo.max, `slot ${String(slot)} tempo ${String(of.tempo)}`);
			assert.equal(events(of, 0).filter((event) => event.part === 'drums').length, 0, 'no drum on the first step');
			const middle = Math.floor(of.steps / 2 / STEPS_PER_BAR) * STEPS_PER_BAR;
			assert.ok(events(of, middle).some((event) => event.part === 'drums'), 'a kick on the first step of a middle bar');
		}
		const silent = track(5, { ...config, drums: 0 });
		for (let step = 0; step < silent.steps; step++) {
			assert.ok(!events(silent, step, { ...config, drums: 0 }).some((event) => event.part === 'drums'), 'drums at 0 is no drums');
		}
	});

	it('holds the fifth, not the root, when joining after the bass stepped up to it', () => {
		const span = config.barsPerChord * STEPS_PER_BAR;
		// A chord whose last beat steps up: the same dice `events` throws, read from a boundary.
		let found: { of: ReturnType<typeof track>; boundary: number } | undefined;
		for (let slot = 0; slot < 400 && found === undefined; slot++) {
			const of = track(slot);
			for (let boundary = span; boundary < of.steps; boundary += span) {
				if (chance(of, boundary - 4, 10) < 0.3) { found = { of, boundary }; break; }
			}
		}
		assert.ok(found !== undefined);
		const { of, boundary } = found;
		const struck = events(of, boundary - 4).find((event) => event.part === 'bass' && event.velocity > 0);
		assert.ok(struck !== undefined, 'the fifth is struck four steps before the boundary');
		const held = holding(of, boundary - 2).find((event) => event.part === 'bass');
		assert.equal(held?.key, struck.key, 'and joining two steps later holds that same note');
		const stopped = events(of, boundary).filter((event) => event.part === 'bass' && event.velocity === 0);
		assert.deepEqual(stopped.map((event) => event.key), [struck.key], 'which the boundary then stops');
		const before = holding(of, boundary - 8).find((event) => event.part === 'bass');
		assert.notEqual(before?.key, struck.key, 'while joining before the step-up holds the root');
	});

	it('pushes the off-beat sixteenths late and never the on-beats', () => {
		const of = track(9);
		const step = 60 / of.tempo / 4;
		assert.equal(stepAt(of, 4), step * 4);
		assert.ok(stepAt(of, 5) > step * 5 && stepAt(of, 5) < step * 5.5);
	});
});

// A voice that only remembers what it was told, for watching the station's channels.
interface Told { readonly what: string; readonly channel: number; readonly key?: number; readonly value?: number }
const listening = (): Voice & { readonly told: Told[] } => {
	const told: Told[] = [];
	return {
		told,
		program: (channel, program) => { told.push({ what: 'program', channel, value: program }); },
		on: (channel, key, velocity) => { told.push({ what: 'on', channel, key, value: velocity }); },
		off: (channel, key) => { told.push({ what: 'off', channel, key }); },
		volume: (channel, level) => { told.push({ what: 'volume', channel, value: level }); },
		allOff: (channel) => { told.push({ what: 'allOff', channel }); },
		render: (left, right) => { left.fill(0); right.fill(0); },
		close: () => {},
	};
};

const QUICK = { ...config, trackSeconds: 20, crossfadeSeconds: 4 };

describe('the station', () => {
	it('renders exactly the audio its clock advances, with the slot the clock is in', () => {
		const voice = tone();
		const at = station({ voice, start: 1000 * QUICK.trackSeconds + 3, settings: QUICK });
		let bytes = 0;
		for (let i = 0; i < 50; i++) bytes += at.next().length;
		assert.equal(bytes, 5 * SAMPLE_RATE * 4, 'fifty blocks of a tenth of a second, 16-bit stereo');
		assert.ok(Math.abs(at.time - (1000 * QUICK.trackSeconds + 8)) < 1e-6);
		assert.equal(at.playing().slot, 1000);
	});

	it('strikes the chord it joins in the middle of, so the first block is not silence', () => {
		const voice = listening();
		const at = station({ voice, start: 50 * QUICK.trackSeconds + 7.3, settings: QUICK });
		at.next();
		const struck = voice.told.filter((said) => said.what === 'on' && said.channel !== DRUM_CHANNEL);
		assert.ok(struck.length >= 5, `pad, keys and bass were struck: ${String(struck.length)} notes`);
		const heard = tone();
		const sound = station({ voice: heard, start: 50 * QUICK.trackSeconds + 7.3, settings: QUICK });
		const block = sound.next();
		let peak = 0;
		for (let i = 0; i < block.length; i += 2) peak = Math.max(peak, Math.abs(block.readInt16LE(i)));
		assert.ok(peak > 300, `the first block has sound in it: peak ${String(peak)}`);
	});

	it('crossfades into the next slot on the other bank and silences the old one after', () => {
		const voice = listening();
		const begin = 10 * QUICK.trackSeconds;
		const at = station({ voice, start: begin + QUICK.trackSeconds - 1.05, settings: QUICK });
		for (let i = 0; i < 11; i++) at.next();
		voice.told.length = 0;
		at.next();
		assert.equal(at.playing().slot, 11);
		// Slot 10 is on channels 0 to 3, slot 11 on 4 to 7; the new bank starts at nothing.
		const programs = voice.told.filter((said) => said.what === 'program').map((said) => said.channel);
		assert.deepEqual(programs, [4, 5, 6, 7]);
		const first = voice.told.find((said) => said.what === 'volume' && said.channel === 4);
		assert.ok((first?.value ?? 99) <= 2, `the new bank starts at nothing: ${String(first?.value)}`);
		// The boundary fell inside the last block, and the new track's first chord is still struck.
		for (const part of [4, 5, 6]) assert.ok(voice.told.some((said) => said.what === 'on' && said.channel === part), `channel ${String(part)} was struck on the new track's first block`);
		assert.ok(!voice.told.some((said) => said.what === 'allOff' && said.channel < 4), 'the old bank still sounds');

		for (let i = 0; i < 20; i++) at.next();
		const midway = voice.told.filter((said) => said.what === 'volume' && said.channel === 4).map((said) => said.value ?? 0);
		assert.ok(midway.at(-1)! > 0 && midway.at(-1)! < config.levels.pad, `two seconds in, the pad is on its way up: ${String(midway.at(-1))}`);
		const old = voice.told.filter((said) => said.what === 'volume' && said.channel === 0).map((said) => said.value ?? 0);
		assert.ok(old.at(-1)! < config.levels.pad && old.at(-1)! > 0, `and the old pad on its way down: ${String(old.at(-1))}`);

		for (let i = 0; i < 25; i++) at.next();
		assert.ok([0, 1, 2, 3].every((channel) => voice.told.some((said) => said.what === 'allOff' && said.channel === channel)), 'the old bank was silenced after the crossfade');
		assert.equal(at.playing().slot, 11);
	});

	it('gives the drums to the newer track only', () => {
		// A boundary the old track's steps run past, so its drums would sound if they were let.
		const loud = { ...QUICK, drums: 1, drumFadeBars: 0 };
		const slot = Array.from({ length: 200 }, (_, i) => i + 30).find((candidate) => {
			const old = track(candidate, loud);
			return stepAt(old, old.steps - 1) > loud.trackSeconds + 1;
		})!;
		const voice = listening();
		const begin = slot * loud.trackSeconds;
		const at = station({ voice, start: begin + loud.trackSeconds - 0.05, settings: loud });
		at.next();
		voice.told.length = 0;
		const window = 3;
		for (let i = 0; i < window * 10; i++) at.next();
		const drums = voice.told.filter((said) => said.what === 'on' && said.channel === DRUM_CHANNEL);
		// Exactly the new track's hits inside the window, not one of the old track's.
		const fresh = track(slot + 1, loud);
		let expected = 0;
		for (let step = 0; step < fresh.steps && stepAt(fresh, step) < window + 0.05; step++) {
			expected += events(fresh, step, loud).filter((event) => event.part === 'drums').length;
		}
		assert.ok(expected > 0, 'the new track drums in its first bars');
		assert.equal(drums.length, expected);
	});

	it('jumps: silences everything and continues from the time given', () => {
		const voice = listening();
		const at = station({ voice, start: 5000, settings: QUICK });
		at.next();
		voice.told.length = 0;
		at.jump(9000);
		// The four channels of the bank that was playing, before anything new starts.
		assert.deepEqual(voice.told.filter((said) => said.what === 'allOff').map((said) => said.channel), [0, 1, 2, 3]);
		assert.equal(at.time, 9000);
		at.next();
		assert.equal(at.playing().slot, Math.floor(9000 / QUICK.trackSeconds));
	});
});

describe('the pace', () => {
	it('keeps the station a block ahead of the clock, and jumps rather than racing after a stall', async () => {
		const voice = tone();
		const at = station({ voice, settings: QUICK });
		let writes = 0;
		let stalled = false;
		const started = Date.now();
		const write = async (): Promise<void> => {
			writes++;
			if (writes === 3 && !stalled) { stalled = true; await new Promise((done) => setTimeout(done, 2500)); }
		};
		await pace(at, write, () => Date.now() - started < 3300);
		// Nine or ten blocks for the 0.8 s the clock ran, plus one after the stall: catching up
		// on the 2.5 s the stall took would have been 25 more.
		assert.ok(writes >= 8 && writes <= 14, `${String(writes)} blocks written`);
		assert.ok(Math.abs(at.time - Date.now() / 1000) < 0.3, 'and the station ends where the clock is');
	});
});

const isFrameStart = (bytes: Buffer, at: number): boolean =>
	bytes[at] === 0xff && ((bytes[at + 1] ?? 0) & 0xe0) === 0xe0;

/** Read a live response for `ms`, then drop the connection; answers the bytes that arrived. */
const listen = async (url: string, ms: number): Promise<{ bytes: Buffer; firstAfterMs: number }> => {
	const started = Date.now();
	const stopper = new AbortController();
	const timer = setTimeout(() => { stopper.abort(); }, ms);
	const answer = await fetch(url, { signal: stopper.signal });
	assert.equal(answer.status, 200);
	assert.equal(answer.headers.get('content-type'), 'audio/mpeg');
	const chunks: Uint8Array[] = [];
	let firstAfterMs = -1;
	try {
		const reader = answer.body!.getReader();
		for (;;) {
			const next = await reader.read();
			if (next.done) break;
			if (firstAfterMs < 0) firstAfterMs = Date.now() - started;
			chunks.push(next.value);
		}
	} catch (error) {
		if ((error as Error).name !== 'AbortError') throw error;
	} finally {
		clearTimeout(timer);
	}
	return { bytes: Buffer.concat(chunks), firstAfterMs };
};

describe('the stream', () => {
	let encoder: Broadcast;
	let radio: Radio;
	let stopped = false;
	const voice = tone();
	const at = station({ voice });

	before(async () => {
		encoder = broadcast();
		radio = await serve({ station: at, broadcast: encoder });
		void pace(at, encoder.write, () => !stopped);
		await new Promise((done) => setTimeout(done, 1500));
	});
	after(async () => {
		stopped = true;
		await radio.stop();
		await encoder.stop();
	});

	test('a listener gets MP3 frames at once and keeps getting them', async () => {
		const heard = await listen(`http://127.0.0.1:${String(radio.port)}/stream`, 2000);
		assert.ok(heard.firstAfterMs >= 0 && heard.firstAfterMs < 1000, `first bytes inside a second: ${String(heard.firstAfterMs)} ms`);
		// Two seconds at 128 kbps is 32 KB; the backlog adds a second and a half on top.
		assert.ok(heard.bytes.length > 24 * 1024, `${String(heard.bytes.length)} bytes in two seconds`);
		let frames = 0;
		for (let i = 0; i < heard.bytes.length - 1; i++) if (isFrameStart(heard.bytes, i)) frames++;
		assert.ok(frames > 50, `${String(frames)} frame headers`);
		assert.ok(isFrameStart(heard.bytes, 0), 'and the first byte is the start of a frame');
	});

	test('a joining listener is handed the backlog first, so play starts at once', async () => {
		// A third of a second of live stream is 5 KB; the backlog in front of it is 24 KB.
		const heard = await listen(`http://127.0.0.1:${String(radio.port)}/stream`, 330);
		assert.ok(heard.bytes.length > 16 * 1024, `${String(heard.bytes.length)} bytes in the first third of a second`);
	});

	test('a second listener joining later is answered inside a second too', async () => {
		const [one, two] = await Promise.all([
			listen(`http://127.0.0.1:${String(radio.port)}/stream`, 1500),
			new Promise((done) => setTimeout(done, 700)).then(() => listen(`http://127.0.0.1:${String(radio.port)}/stream`, 800)),
		]);
		assert.ok(one.bytes.length > 0 && two.bytes.length > 0);
		assert.ok(two.firstAfterMs >= 0 && two.firstAfterMs < 1000, `the late joiner's first bytes: ${String(two.firstAfterMs)} ms`);
	});

	test('HEAD answers the headers and no body; health says what plays and who listens', async () => {
		const head = await fetch(`http://127.0.0.1:${String(radio.port)}/stream`, { method: 'HEAD' });
		assert.equal(head.status, 200);
		assert.equal(head.headers.get('content-type'), 'audio/mpeg');
		assert.equal(await head.text(), '');
		const health = await fetch(`http://127.0.0.1:${String(radio.port)}/health`);
		const body = await health.json() as { ok: boolean; listeners: number; playing: { slot: number; tempo: number } };
		assert.equal(body.ok, true);
		assert.equal(typeof body.playing.tempo, 'number');
		assert.equal(body.listeners, 0);
		const [, counted] = await Promise.all([
			listen(`http://127.0.0.1:${String(radio.port)}/stream`, 400),
			new Promise((done) => setTimeout(done, 150)).then(() => fetch(`http://127.0.0.1:${String(radio.port)}/health`).then((seen) => seen.json() as Promise<{ listeners: number }>)),
		]);
		assert.equal(counted.listeners, 1, 'a listener is counted while it listens');
		const missing = await fetch(`http://127.0.0.1:${String(radio.port)}/anything`);
		assert.equal(missing.status, 404);
	});

	test('a listener that stops reading is dropped, not buffered without end', async () => {
		// A response that never drains: what a client that went away without closing looks like.
		let destroyed = false;
		const stuck = {
			writableLength: 2 * 1024 * 1024,
			write: () => false,
			on: () => stuck,
			destroy: () => { destroyed = true; },
			end: () => {},
		};
		encoder.attach(stuck as never);
		await new Promise((done) => setTimeout(done, 400));
		assert.ok(destroyed, 'the encoder destroyed it on the next chunk');
	});
});

// The events' shape is what the station relies on: an off is a velocity of zero.
test('an off is a velocity of zero and nothing else', () => {
	const of = track(2);
	const all: Event[] = [];
	for (let step = 0; step < of.steps; step++) all.push(...events(of, step));
	assert.ok(all.every((event) => Number.isInteger(event.velocity) && event.velocity >= 0 && event.velocity <= 127));
	assert.ok(all.every((event) => Number.isInteger(event.key) && event.key >= 24 && event.key <= 108), 'every key is on a piano');
});
