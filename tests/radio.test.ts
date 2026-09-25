// The radio: the composer answers the same notes for the same moment and keeps each style's
// rules, the schedule alternates the styles, the station turns it all into sound and crossfades
// tracks, and the stream reaches a listener from the moment they ask. The voice here is the tone
// generator, so no soundfont is read, and the encoder is the real ffmpeg.

import assert from 'node:assert/strict';
import { after, before, describe, it, test } from 'node:test';

import { levels, listen as analyse, now, radio, sourceFor, state } from '../frontend/radio.ts';
import { STEPS_PER_BAR, events, holding, stepAt, track } from '../radio/compose.ts';
import type { Event, Track } from '../radio/compose.ts';
import { config } from '../radio/config.ts';
import type { Config } from '../radio/config.ts';
import { pace } from '../radio/pace.ts';
import { at, firstSlot, slotOf } from '../radio/schedule.ts';
import { serve } from '../radio/serve.ts';
import type { Radio } from '../radio/serve.ts';
import { station } from '../radio/station.ts';
import { broadcast } from '../radio/stream.ts';
import type { Broadcast } from '../radio/stream.ts';
import { tone } from '../radio/tone.ts';
import { DRUM_CHANNEL, SAMPLE_RATE, tone as toneVoice } from '../radio/voice.ts';
import type { Voice } from '../radio/voice.ts';

// The synthwave breakdown, as the composer places it: eight bars from 60% of the track.
const breakdown = (of: Track): [number, number] => {
	const start = Math.floor((of.steps / STEPS_PER_BAR) * 0.6) * STEPS_PER_BAR;
	return [start, start + 8 * STEPS_PER_BAR];
};

describe('the schedule', () => {
	it('lays the styles out in blocks, in order, and counts slots up forever', () => {
		assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map((slot) => slotOf(slot).style), ['sleep', 'sleep', 'sleep', 'synthwave', 'synthwave', 'synthwave', 'sleep']);
		const sleep = config.style.sleep.trackSeconds;
		const synth = config.style.synthwave.trackSeconds;
		assert.equal(slotOf(3).begins, 3 * sleep);
		assert.equal(slotOf(0).blockEnds, 3 * sleep);
		assert.equal(slotOf(4).blockEnds, 3 * sleep + 3 * synth);
		assert.equal(slotOf(6).begins, 3 * sleep + 3 * synth);
		assert.equal(slotOf(6).seconds, sleep);
	});

	it('answers, for any moment, the slot whose span holds it', () => {
		for (const time of [0, 1, 299.9, 300, 899, 900, 1529, 1530, 1790287680.4, 4e9 + 17]) {
			const where = at(time);
			assert.ok(where.begins <= time && time < where.begins + where.seconds, `${String(time)} is inside slot ${String(where.slot)}`);
			assert.deepEqual(slotOf(where.slot), where);
		}
	});
});

describe('the composer', () => {
	it('answers the same track for the same slot, and different tracks for different slots', () => {
		assert.deepEqual(track(1234), track(1234));
		const seen = new Set(Array.from({ length: 40 }, (_, slot) => JSON.stringify(track(slot))));
		assert.ok(seen.size >= 39, `${String(seen.size)} distinct tracks over 40 slots`);
	});

	it('answers the same events for the same step, computed on their own', () => {
		for (const slot of [firstSlot('sleep'), firstSlot('synthwave')]) {
			const of = track(slot);
			const whole = Array.from({ length: of.steps }, (_, step) => events(of, step));
			for (const step of [of.steps - 1, 0, 37, 512, 129]) assert.deepEqual(events(of, step), whole[step]);
		}
	});

	it('names a track with a word from each of its style\'s lists, and keeps its tempo in range', () => {
		for (let slot = 0; slot < 12; slot++) {
			const of = track(slot);
			const style = config.style[of.style];
			const [first, second] = of.name.split(' ');
			assert.ok(style.names.first.includes(first!) && style.names.second.includes(second!), of.name);
			assert.ok(of.tempo >= style.tempo.min && of.tempo <= style.tempo.max, `${of.style} ${String(of.tempo)} bpm`);
			assert.ok(Object.keys(style.modes).includes(of.mode));
		}
	});

	it('sleep strikes nothing: no drums, no lead, no duck, and every pad note stops', () => {
		for (const slot of [0, 1, 2, 6]) {
			const of = track(slot);
			assert.equal(of.style, 'sleep');
			const sounding = new Map<string, number>();
			for (let step = 0; step < of.steps; step++) {
				for (const event of events(of, step)) {
					assert.ok(event.part === 'pad' || event.part === 'bass', `slot ${String(slot)} step ${String(step)}: a ${event.part} event`);
					const name = `${event.part}:${String(event.key)}`;
					if (event.velocity > 0) sounding.set(name, (sounding.get(name) ?? 0) + 1);
					else {
						assert.ok((sounding.get(name) ?? 0) > 0, `slot ${String(slot)} step ${String(step)}: ${name} stopped without starting`);
						sounding.set(name, (sounding.get(name) ?? 0) - 1);
					}
				}
			}
			const left = [...sounding.entries()].filter(([, count]) => count > 0);
			assert.ok(left.length <= 5, `only the last chord is left sounding, not ${left.map(([name]) => name).join(', ')}`);
			// Low: the pad's root under middle C, the drone under the bass clef's bottom line.
			for (const chord of of.chords) {
				assert.ok(chord.pad[0]! < 60 && chord.bass < 48, `pad ${String(chord.pad[0])} drone ${String(chord.bass)}`);
			}
		}
	});

	it('synthwave puts a kick on every beat and ducks the bass under it, outside the intro, the breakdown and the outro', () => {
		for (const slot of [3, 4, 5, 9]) {
			const of = track(slot);
			assert.equal(of.style, 'synthwave');
			const fade = config.style.synthwave.drumFadeBars * STEPS_PER_BAR;
			const [quietFrom, quietTo] = breakdown(of);
			for (let step = fade; step < of.steps - fade; step++) {
				const fired = events(of, step);
				const kick = fired.some((event) => event.part === 'drums' && event.key === 36);
				const duck = fired.find((event) => event.part === 'duck');
				const quiet = step >= quietFrom && step < quietTo;
				if (step % 4 === 0 && !quiet) {
					assert.ok(kick, `slot ${String(slot)} step ${String(step)}: a kick on the beat`);
					assert.equal(duck?.velocity, 35, 'and the bass ducked under it');
				}
				if (quiet) assert.ok(!fired.some((event) => event.part === 'drums'), `slot ${String(slot)} step ${String(step)}: no drums in the breakdown`);
				if (step % 4 === 3 && !quiet) assert.equal(duck?.velocity, 100, 'the bass is back up before the next beat');
			}
		}
	});

	it('synthwave keeps every note it starts paired with a stop, drums aside', () => {
		for (const slot of [3, 4, 5]) {
			const of = track(slot);
			const sounding = new Map<string, number>();
			for (let step = 0; step < of.steps; step++) {
				for (const event of events(of, step)) {
					if (event.part === 'drums' || event.part === 'duck') continue;
					const name = `${event.part}:${String(event.key)}`;
					if (event.velocity > 0) sounding.set(name, (sounding.get(name) ?? 0) + 1);
					else {
						assert.ok((sounding.get(name) ?? 0) > 0, `slot ${String(slot)} step ${String(step)}: ${name} stopped without starting`);
						sounding.set(name, (sounding.get(name) ?? 0) - 1);
					}
				}
			}
			const left = [...sounding.entries()].filter(([, count]) => count > 0).map(([name]) => name);
			assert.ok(left.every((name) => !name.startsWith('lead:')), `slot ${String(slot)}: a lead note never stopped: ${left.join(', ')}`);
			assert.ok(left.length <= 4, `slot ${String(slot)}: only the last chord and bass note are left: ${left.join(', ')}`);
		}
	});

	it('synthwave cuts a sung lead note when an arpeggio begins, so the two never share a key', () => {
		// A sung note whose length runs into the first step of an arpeggio pair: found by search,
		// because the dice decide where one falls.
		let found = 0;
		for (let slot = 3; slot < 60 && found < 3; slot++) {
			const of = track(slot);
			if (of.style !== 'synthwave') continue;
			for (let step = 32; step < of.steps - 32; step += 32) {
				const before = new Set(events(of, step - 1).filter((event) => event.part === 'lead' && event.velocity > 0).map((event) => event.key));
				if (before.size === 0) continue;
				const fired = events(of, step);
				const arpeggio = fired.filter((event) => event.part === 'lead' && event.velocity > 0).length === 1 && fired.some((event) => event.part === 'lead' && event.velocity === 0);
				if (!arpeggio) continue;
				// A note started one step before the pair cannot have ended yet: it has to be cut here.
				for (const key of before) assert.ok(fired.some((event) => event.part === 'lead' && event.velocity === 0 && event.key === key), `slot ${String(slot)} step ${String(step)}: the sung note ${String(key)} was cut`);
				found++;
			}
		}
		assert.ok(found > 0, 'a sung note ran into an arpeggio somewhere in sixty slots');
	});

	it('synthwave sits on the grid and sleep swings its off-beats', () => {
		const synth = track(firstSlot('synthwave'));
		assert.equal(stepAt(synth, 5), (60 / synth.tempo / 4) * 5);
		const sleep = track(firstSlot('sleep'));
		const step = 60 / sleep.tempo / 4;
		assert.equal(stepAt(sleep, 4), step * 4);
		assert.ok(stepAt(sleep, 5) > step * 5 && stepAt(sleep, 5) < step * 5.5);
	});

	it('holds the chord a joining station is inside', () => {
		const sleep = track(firstSlot('sleep'));
		const held = holding(sleep, 70);
		assert.ok(held.some((event) => event.part === 'pad') && held.some((event) => event.part === 'bass'));
		const synth = track(firstSlot('synthwave'));
		assert.ok(holding(synth, 70).every((event) => event.part === 'pad'), 'synthwave holds the pad alone: its bass is struck every step');
	});
});

describe('the tone', () => {
	it('passes what is under the cutoff and takes down what is far above it', () => {
		const measure = (hz: number, cutoff: number): number => {
			const filter = tone(cutoff);
			const left = new Float32Array(SAMPLE_RATE);
			const right = new Float32Array(SAMPLE_RATE);
			for (let i = 0; i < left.length; i++) { left[i] = Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE); right[i] = left[i]!; }
			filter.apply(left, right);
			let peak = 0;
			for (let i = SAMPLE_RATE / 2; i < left.length; i++) peak = Math.max(peak, Math.abs(left[i]!));
			return 20 * Math.log10(peak);
		};
		assert.ok(measure(100, 600) > -1, `100 Hz through a 600 Hz cutoff: ${measure(100, 600).toFixed(1)} dB`);
		assert.ok(measure(4000, 600) < -25, `4 kHz through a 600 Hz cutoff: ${measure(4000, 600).toFixed(1)} dB`);
		assert.ok(measure(4000, 2600) > -12, `4 kHz through a 2.6 kHz cutoff: ${measure(4000, 2600).toFixed(1)} dB`);
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

// One track per block, twenty seconds each, four of crossfade: slot 0 sleep, 1 synthwave, 2 sleep.
const QUICK: Config = {
	...config,
	tracksPerBlock: 1,
	crossfadeSeconds: 4,
	style: {
		sleep: { ...config.style.sleep, trackSeconds: 20 },
		synthwave: { ...config.style.synthwave, trackSeconds: 20, drumFadeBars: 0 },
	},
};

describe('the station', () => {
	it('renders exactly the audio its clock advances, with the slot the clock is in', () => {
		const voice = toneVoice();
		const playing = station({ voice, start: 1000 * 40 + 3, settings: QUICK });
		let bytes = 0;
		for (let i = 0; i < 50; i++) bytes += playing.next().length;
		assert.equal(bytes, 5 * SAMPLE_RATE * 4, 'fifty blocks of a tenth of a second, 16-bit stereo');
		assert.ok(Math.abs(playing.time - (1000 * 40 + 8)) < 1e-6);
		assert.equal(playing.playing().slot, 2000);
		assert.equal(playing.playing().style, 'sleep');
	});

	it('strikes the chord it joins in the middle of, so the first block is not silence', () => {
		const voice = listening();
		const playing = station({ voice, start: 50 * 40 + 7.3, settings: QUICK });
		playing.next();
		const struck = voice.told.filter((said) => said.what === 'on' && said.channel !== DRUM_CHANNEL);
		assert.ok(struck.length >= 4, `pad and drone were struck: ${String(struck.length)} notes`);
		const heard = toneVoice();
		const sound = station({ voice: heard, start: 50 * 40 + 7.3, settings: QUICK });
		const block = sound.next();
		let peak = 0;
		for (let i = 0; i < block.length; i += 2) peak = Math.max(peak, Math.abs(block.readInt16LE(i)));
		assert.ok(peak > 300, `the first block has sound in it: peak ${String(peak)}`);
	});

	it('crossfades into the next style on the other bank, sets its kit, and silences the old bank after', () => {
		const voice = listening();
		const begin = 10 * 40;
		// Slot 20 is sleep on channels 0 to 3, and slot 21 is synthwave on 4 to 7.
		const playing = station({ voice, start: begin + 20 - 1.05, settings: QUICK });
		for (let i = 0; i < 11; i++) playing.next();
		voice.told.length = 0;
		playing.next();
		assert.equal(playing.playing().slot, 21);
		assert.equal(playing.playing().style, 'synthwave');
		const programs = voice.told.filter((said) => said.what === 'program').map((said) => said.channel);
		assert.deepEqual(programs, [4, 6, 7, DRUM_CHANNEL], 'pad, bass and lead on the new bank, then the kit');
		assert.equal(voice.told.find((said) => said.what === 'program' && said.channel === DRUM_CHANNEL)?.value, config.style.synthwave.kit);
		const first = voice.told.find((said) => said.what === 'volume' && said.channel === 4);
		assert.ok((first?.value ?? 99) <= 2, `the new bank starts at nothing: ${String(first?.value)}`);
		for (const part of [4, 6]) assert.ok(voice.told.some((said) => said.what === 'on' && said.channel === part), `channel ${String(part)} was struck on the new track's first block`);
		assert.ok(!voice.told.some((said) => said.what === 'allOff' && said.channel < 4), 'the old bank still sounds');

		for (let i = 0; i < 20; i++) playing.next();
		const rising = voice.told.filter((said) => said.what === 'volume' && said.channel === 4).map((said) => said.value ?? 0);
		assert.ok(rising.at(-1)! > 0 && rising.at(-1)! < config.style.synthwave.levels.pad, `two seconds in, the pad is on its way up: ${String(rising.at(-1))}`);
		const falling = voice.told.filter((said) => said.what === 'volume' && said.channel === 0).map((said) => said.value ?? 0);
		assert.ok(falling.at(-1)! < config.style.sleep.levels.pad && falling.at(-1)! > 0, `and the old pad on its way down: ${String(falling.at(-1))}`);

		for (let i = 0; i < 25; i++) playing.next();
		assert.ok([0, 1, 2, 3].every((channel) => voice.told.some((said) => said.what === 'allOff' && said.channel === channel)), 'the old bank was silenced after the crossfade');
	});

	it('ducks the bass channel on every kick and gives the drums to the newer track only', () => {
		const voice = listening();
		const begin = 30 * 40 + 20;
		const playing = station({ voice, start: begin + 5, settings: QUICK });
		playing.next();
		voice.told.length = 0;
		for (let i = 0; i < 30; i++) playing.next();
		const kicks = voice.told.filter((said) => said.what === 'on' && said.channel === DRUM_CHANNEL && said.key === 36).length;
		assert.ok(kicks >= 4, `${String(kicks)} kicks in three seconds`);
		// The bass is on channel 6 (bank 4, third part). Its level dips to 35% of its setting at
		// the kick itself, between the pad's own level for the block and the kick's note on, not
		// only at the top of the next block.
		const dipped = Math.round(config.style.synthwave.levels.bass * 0.35);
		let atTheKick = 0;
		for (let i = 0; i < voice.told.length; i++) {
			const said = voice.told[i]!;
			if (said.what !== 'on' || said.channel !== DRUM_CHANNEL || said.key !== 36) continue;
			for (let back = i - 1; back >= 0; back--) {
				const before = voice.told[back]!;
				if (before.what === 'volume' && before.channel === 4) break;
				if (before.what === 'volume' && before.channel === 6 && before.value === dipped) { atTheKick++; break; }
			}
		}
		assert.ok(atTheKick >= 4, `${String(atTheKick)} kicks had the bass set to ${String(dipped)} just before them`);
		const bass = voice.told.filter((said) => said.what === 'volume' && said.channel === 6).map((said) => said.value ?? 0);
		assert.ok(bass.includes(config.style.synthwave.levels.bass), 'and back to full between kicks');
	});

	it('jumps: silences everything and continues from the time given', () => {
		const voice = listening();
		const playing = station({ voice, start: 5000, settings: QUICK });
		playing.next();
		voice.told.length = 0;
		playing.jump(9000);
		assert.deepEqual(voice.told.filter((said) => said.what === 'allOff').map((said) => said.channel), [0, 1, 2, 3]);
		assert.equal(playing.time, 9000);
		playing.next();
		assert.equal(playing.playing().slot, at(9000, QUICK).slot);
	});
});

describe('the pace', () => {
	it('keeps the station a block ahead of the clock, and jumps rather than racing after a stall', async () => {
		const voice = toneVoice();
		const playing = station({ voice, settings: QUICK });
		let writes = 0;
		let stalled = false;
		const started = Date.now();
		const write = async (): Promise<void> => {
			writes++;
			if (writes === 3 && !stalled) { stalled = true; await new Promise((done) => setTimeout(done, 2500)); }
		};
		await pace(playing, write, () => Date.now() - started < 3300);
		assert.ok(writes >= 8 && writes <= 14, `${String(writes)} blocks written`);
		assert.ok(Math.abs(playing.time - Date.now() / 1000) < 0.3, 'and the station ends where the clock is');
	});
});

const isFrameStart = (bytes: Buffer, at: number): boolean =>
	bytes[at] === 0xff && ((bytes[at + 1] ?? 0) & 0xe0) === 0xe0;

/** Read a live response for `ms`, then drop the connection. Answers the bytes that arrived. */
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
	const voice = toneVoice();
	const playing = station({ voice });

	before(async () => {
		encoder = broadcast();
		radio = await serve({ station: playing, broadcast: encoder });
		void pace(playing, encoder.write, () => !stopped);
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
		assert.ok(heard.bytes.length > 24 * 1024, `${String(heard.bytes.length)} bytes in two seconds`);
		let frames = 0;
		for (let i = 0; i < heard.bytes.length - 1; i++) if (isFrameStart(heard.bytes, i)) frames++;
		assert.ok(frames > 50, `${String(frames)} frame headers`);
		assert.ok(isFrameStart(heard.bytes, 0), 'and the first byte is the start of a frame');
	});

	test('a joining listener is handed the backlog first, so play starts at once', async () => {
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

	test('now says the track the stream is playing, with the clock and the backlog beside it', async () => {
		const answer = await fetch(`http://127.0.0.1:${String(radio.port)}/now`);
		assert.equal(answer.headers.get('cache-control'), 'no-store');
		const heard = await answer.json() as { time: number; backlogSeconds: number; slot: number; style: string; name: string; tempo: number; key: string; begins: number; seconds: number; blockEnds: number };
		const onAir = playing.playing();
		assert.equal(heard.slot, onAir.slot);
		assert.equal(heard.name, onAir.name);
		assert.equal(heard.style, onAir.style);
		assert.ok(Math.abs(heard.time - Date.now() / 1000) < 2, 'the server\'s clock');
		assert.ok(heard.backlogSeconds > 1 && heard.backlogSeconds < 2, `the backlog is about a second and a half: ${heard.backlogSeconds.toFixed(2)}`);
		// The station renders one block ahead of the clock, so at a boundary the track named can
		// begin a tenth of a second after the time given.
		assert.ok(heard.begins <= heard.time + 0.2 && heard.time < heard.begins + heard.seconds, 'and the moment is inside the track');
		assert.ok(heard.blockEnds >= heard.begins + heard.seconds);
		assert.match(heard.key, /^[A-G]#? (major|minor|dorian|lydian|mixolydian)$/);
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

describe('the page', () => {
	it('draws the bars from the tempo on a touch screen and from the spectrum elsewhere', () => {
		assert.equal(sourceFor({ coarsePointer: true, webAudio: true }), 'tempo');
		assert.equal(sourceFor({ coarsePointer: false, webAudio: false }), 'tempo');
		assert.equal(sourceFor({ coarsePointer: false, webAudio: true }), 'spectrum');
	});

	it('does not anchor the bars on a now answer that lands after a stop', async () => {
		// The browser's pieces the player touches, stood in for: an audio element that plays at
		// once, and a now route that answers late the first time and not at all the second.
		const held = globalThis as unknown as Record<string, unknown>;
		const before = { Audio: held['Audio'], fetch: held['fetch'] };
		let answers = 0;
		held['Audio'] = class {
			preload = ''; src = ''; currentTime = 0;
			addEventListener(): void {}
			removeAttribute(): void {}
			load(): void {}
			pause(): void {}
			play(): Promise<void> { return Promise.resolve(); }
		};
		held['fetch'] = async (): Promise<Response> => {
			answers++;
			if (answers > 1) return new Response('', { status: 503 });
			await new Promise((done) => setTimeout(done, 60));
			return new Response(JSON.stringify({ time: 1000, backlogSeconds: 1.5, style: 'synthwave', name: 'Late Answer', tempo: 100, key: 'A minor', begins: 900, seconds: 210, blockEnds: 1500 }), { status: 200, headers: { 'content-type': 'application/json' } });
		};
		try {
			radio.play();
			radio.stop();
			await new Promise((done) => setTimeout(done, 120));
			radio.play();
			await new Promise((done) => setTimeout(done, 30));
			state.set('playing');
			const out = new Float32Array(24);
			levels(out, 0);
			assert.ok(out.every((bar) => bar < 0.12), `with no anchor of its own, the second play shows idle bars: ${out[0]!.toFixed(3)}`);
		} finally {
			radio.stop();
			now.set(null);
			held['Audio'] = before.Audio;
			held['fetch'] = before.fetch;
		}
	});

	it('routes the element through the audio engine for the spectrum, and never for the tempo', () => {
		// An audio engine that only remembers whether it was built and what it was handed.
		const made: string[] = [];
		class Engine {
			readonly destination = {};
			constructor() { made.push('context'); }
			createAnalyser(): unknown { return { fftSize: 0, smoothingTimeConstant: 0, frequencyBinCount: 1024, connect: () => {} }; }
			createMediaElementSource(element: unknown): unknown { made.push(`source:${String((element as { id: string }).id)}`); return { connect: () => {} }; }
		}
		const element = { id: 'the-stream' } as unknown as HTMLAudioElement;
		analyse(element, 'tempo', Engine as unknown as typeof AudioContext);
		assert.deepEqual(made, [], 'the tempo source builds no engine and touches no element');
		analyse(element, 'spectrum', Engine as unknown as typeof AudioContext);
		assert.deepEqual(made, ['context', 'source:the-stream']);
		analyse(element, 'spectrum', Engine as unknown as typeof AudioContext);
		assert.deepEqual(made, ['context', 'source:the-stream'], 'and a second call builds nothing more');
	});
});

test('an off is a velocity of zero and nothing else, and every key is on a piano', () => {
	for (const slot of [0, 3]) {
		const of = track(slot);
		const all: Event[] = [];
		for (let step = 0; step < of.steps; step++) all.push(...events(of, step));
		assert.ok(all.every((event) => Number.isInteger(event.velocity) && event.velocity >= 0 && event.velocity <= 127));
		assert.ok(all.filter((event) => event.part !== 'duck').every((event) => Number.isInteger(event.key) && event.key >= 21 && event.key <= 108), 'every key is on a piano');
	}
});
