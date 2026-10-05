// The landing's pixel strip, the bird on the resume button, and the icons drawn from the strip
// (work order 485). Everything here runs in Node, through createStrip and createPerch, with motion
// where the test needs it and none where a still frame is the point.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { icons } from '../favicons.ts';
import { ARRIVE, createPerch, createStrip, heroScene, pack } from '../frontend/strip.ts';
import { FOREST, PAPER } from '../frontend/theme.ts';

// A wide screen and a phone: CSS width, then the strip's size in its own pixels, then where the
// moon stands across it at night.
const SIZES = [['wide', 1905, 635, 187, 0.6], ['phone', 390, 195, 150, 0.8]] as const;

const still = (night: boolean, css: number, width: number, height: number) => {
	const strip = createStrip(heroScene(night, css), width, height, { motion: false });
	strip.frame(0, 0);
	return strip;
};
const row = (strip: { width: number; pixels: Uint32Array }, y: number): number[] =>
	Array.from(strip.pixels.subarray(y * strip.width, (y + 1) * strip.width));

describe('the hero strip', () => {
	for (const [name, css, width, height, moon] of SIZES) {
		it(`its sky starts at the page colour, light and dark, on a ${name} screen`, () => {
			assert.ok(row(still(false, css, width, height), 0).every((c) => c === pack(PAPER)), 'the light sky starts at paper');
			assert.ok(row(still(true, css, width, height), 0).every((c) => c === pack(FOREST)), 'the night sky starts at forest');
		});

		// The pond is as deep as the sky is tall, so its last row mirrors the top of the sky and
		// nothing standing on the bank runs off the bottom.
		it(`its pond ends on the page colour with no reflection cut off, on a ${name} screen`, () => {
			assert.ok(row(still(false, css, width, height), height - 1).every((c) => c === pack(PAPER)), 'the light pond ends on paper');
			// The moon stands in the top of the night sky, so its reflection is the one thing allowed in
			// the last row: within its radius, its glow and the ripple's sway of either side of it.
			const reach = Math.max(3, Math.round(height * 0.045)) + 3 + 6;
			const night = row(still(true, css, width, height), height - 1);
			const stray = night.filter((c, x) => Math.abs(x - Math.round(width * moon)) > reach && c !== pack(FOREST));
			assert.equal(stray.length, 0, 'the night pond ends on forest, apart from the moon');
		});
	}

	it('draws the same scene from the same seed', () => {
		assert.deepEqual(still(false, 1905, 635, 187).pixels, still(false, 1905, 635, 187).pixels);
	});

	// "25 a second at an easy pace": an easy pace is two strip pixels a move, sixty moves a second.
	it('a second of brushing a crown at an easy pace shakes about 25 leaves loose', () => {
		let seed = 1;
		const random = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
		const strip = createStrip(heroScene(false, 1905), 635, 187, { motion: true, random });
		strip.frame(0, 0);
		// Inside the crown of the hero's second tree: it stands at 0.74 of the width, and its crown is
		// centred well above the bank.
		const x = Math.round(0.74 * 635), y = 52;
		for (let i = 0; i < 60; i++) {
			strip.move(x + (i % 2 ? 1 : -1), y);
			strip.frame(1 / 60, 0.5 + i / 60);
		}
		const shaken = strip.leaves();
		assert.ok(shaken >= 22 && shaken <= 26, `about 25 leaves came loose, not ${String(shaken)}`);
	});

	// Five seconds, past the moment the first leaf would fall on its own.
	it('lets nothing fall with motion off, brushed or not', () => {
		const strip = createStrip(heroScene(false, 1905), 635, 187, { motion: false });
		strip.frame(0, 0);
		for (let i = 0; i < 300; i++) { strip.move(Math.round(0.74 * 635) + (i % 2), 52); strip.frame(1 / 60, i / 60); }
		assert.equal(strip.leaves(), 0);
	});
});

// The bird on the resume button, run frame by frame at sixty a second. Its button's top edge is at
// (300, 500); it sets off from above the page, to the right.
describe('the resume bird', () => {
	const TO = { x: 300, y: 500 }, FROM = { x: 540, y: -110 }, DT = 1 / 60;
	const fly = (seconds: number, bird = createPerch(FROM, () => 0.5), to = TO) => {
		for (let i = 0; i < Math.round(seconds / DT); i++) bird.step(DT, to);
		return bird;
	};

	it('lands on the button within a second, feet on its top edge', () => {
		const bird = createPerch(FROM, () => 0.5);
		let t = 0;
		while (bird.state === 'in' && t < 5) { bird.step(DT, TO); t += DT; }
		assert.equal(bird.state, 'perch');
		assert.ok(ARRIVE <= 1 && t <= ARRIVE + DT, `landed after ${t.toFixed(2)}s`);
		assert.deepEqual([bird.x, bird.y], [TO.x, TO.y]);
	});

	it('pecks the button with its feet still', () => {
		const bird = fly(ARRIVE);
		const feet = (pose: typeof bird.pose) => pose.filter(([x, y]) => y === 0 && x >= -2).map(String).sort();
		const standing = feet(bird.pose);
		let pecks = 0, was = false;
		for (let i = 0; i < 120; i++) {
			bird.step(DT, TO);
			// A peck puts the beak on the feet row, ahead of the feet.
			const down = bird.pose.some(([x, y]) => y === 0 && x < -2);
			if (down && !was) pecks++;
			was = down;
			assert.deepEqual(feet(bird.pose), standing, 'the feet do not move');
		}
		assert.ok(pecks >= 2, `pecked ${String(pecks)} times in two seconds`);
	});

	it('stays on the button as the button moves', () => {
		const bird = fly(ARRIVE + 0.5);
		bird.step(DT, { x: 120, y: 640 });
		assert.deepEqual([bird.x, bird.y], [120, 640]);
	});

	it('flies off up and to the left when scared, from the button or on its way down', () => {
		for (const after of [ARRIVE + 1, ARRIVE / 2]) {
			const bird = fly(after);
			const [x, y] = [bird.x, bird.y];
			bird.scare();
			fly(1, bird);
			assert.equal(bird.state, 'away');
			assert.ok(bird.y < y - 100 && bird.x < x - 50, `scared after ${String(after)}s, it moved from (${String(x)}, ${String(y)}) to (${String(bird.x)}, ${String(bird.y)})`);
			fly(3, bird);
			assert.equal(bird.state, 'away', 'and does not come back');
		}
	});
});

describe('the icons', () => {
	for (const [name, bytes] of Object.entries(icons())) {
		it(`frontend/public/${name} is what the generator draws`, () => {
			const committed = readFileSync(new URL(`../frontend/public/${name}`, import.meta.url));
			assert.ok(committed.equals(bytes), `${name} is stale: run npm run favicons`);
		});
	}

	it('are 16, 32 and 180 pixels square', () => {
		const sizes = Object.fromEntries(Object.entries(icons()).map(([name, bytes]) => [name, bytes.readUInt32BE(16)]));
		assert.deepEqual(sizes, { 'favicon-16.png': 16, 'favicon-32.png': 32, 'apple-touch-icon.png': 180 });
	});
});
