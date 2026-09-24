// The clock the station is kept in step with. Each block is rendered just ahead of the wall
// clock and handed to `write`, then the loop waits for the clock to reach it. A process paused
// for longer than a couple of seconds jumps rather than racing to catch up, because listeners
// would hear the race as a burst.

import type { Station } from './station.ts';

export interface PaceOptions {
	/** Seconds each block covers, matching the station's. A tenth by default. */
	readonly blockSeconds?: number;
	/** Seconds since the epoch. The wall clock by default. */
	readonly now?: () => number;
	/** Seconds behind the clock past which the station jumps instead of catching up. */
	readonly tolerance?: number;
}

export const pace = async (
	playing: Station,
	write: (pcm: Buffer) => Promise<void>,
	running: () => boolean,
	options: PaceOptions = {},
): Promise<void> => {
	const blockSeconds = options.blockSeconds ?? 0.1;
	const now = options.now ?? (() => Date.now() / 1000);
	const tolerance = options.tolerance ?? 2;
	while (running()) {
		const at = now();
		if (playing.time < at - tolerance) playing.jump(at);
		await write(playing.next());
		const wait = (playing.time - blockSeconds - now()) * 1000;
		if (wait > 0) await new Promise((done) => setTimeout(done, wait));
	}
};
