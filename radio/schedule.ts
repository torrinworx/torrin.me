// Which track plays when. The styles take turns in blocks of a few tracks, and a sleep track is
// longer than a synthwave one, so the timeline is a repeating cycle: one block of each style in
// order. A moment in time is a position inside that cycle, which names the track, its style and
// when it began. The slot number is what seeds a track, and it counts up forever.

import { config } from './config.ts';
import type { Config, StyleName } from './config.ts';

export interface Slot {
	readonly slot: number;
	readonly style: StyleName;
	/** Seconds since the epoch the track begins. */
	readonly begins: number;
	/** How long the track lasts. */
	readonly seconds: number;
	/** Seconds since the epoch the block of this style ends: the same for every slot in the block. */
	readonly blockEnds: number;
}

/** The cycle's tracks in order: each style's block, one after the other. */
const cycle = (settings: Config): { style: StyleName; seconds: number }[] => {
	const out: { style: StyleName; seconds: number }[] = [];
	for (const style of settings.styles) {
		for (let i = 0; i < settings.tracksPerBlock; i++) out.push({ style, seconds: settings.style[style].trackSeconds });
	}
	return out;
};

const cycleSeconds = (settings: Config): number =>
	cycle(settings).reduce((sum, one) => sum + one.seconds, 0);

/** The track with this slot number. */
export const slotOf = (slot: number, settings: Config = config): Slot => {
	const tracks = cycle(settings);
	const round = Math.floor(slot / tracks.length);
	const index = slot - round * tracks.length;
	let begins = round * cycleSeconds(settings);
	for (let i = 0; i < index; i++) begins += tracks[i]!.seconds;
	const one = tracks[index]!;
	let blockEnds = begins + one.seconds;
	for (let i = index + 1; i < tracks.length && tracks[i]!.style === one.style; i++) blockEnds += tracks[i]!.seconds;
	return { slot, style: one.style, begins, seconds: one.seconds, blockEnds };
};

/** The first slot of a style, counting from zero. */
export const firstSlot = (style: StyleName, settings: Config = config): number => {
	let slot = 0;
	while (slotOf(slot, settings).style !== style) slot++;
	return slot;
};

/** The track playing at a moment, seconds since the epoch. */
export const at = (time: number, settings: Config = config): Slot => {
	const tracks = cycle(settings);
	const whole = cycleSeconds(settings);
	const round = Math.floor(time / whole);
	let left = time - round * whole;
	let index = 0;
	while (index < tracks.length - 1 && left >= tracks[index]!.seconds) {
		left -= tracks[index]!.seconds;
		index++;
	}
	return slotOf(round * tracks.length + index, settings);
};
