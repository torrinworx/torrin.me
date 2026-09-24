// The encoder and the fan-out. One ffmpeg turns the station's samples into MP3, and every listener
// is handed the same bytes as they come, after the last second or so of them, so playback starts
// at once. A listener that stops reading is dropped rather than buffered without end.

import { spawn } from 'node:child_process';
import type { ChildProcessByStdio } from 'node:child_process';
import type { ServerResponse } from 'node:http';
import type { Readable, Writable } from 'node:stream';

import { config } from './config.ts';
import { SAMPLE_RATE } from './voice.ts';

export interface BroadcastOptions {
	/** The ffmpeg to run. */
	readonly ffmpeg?: string;
	/** Bytes of the most recent audio a new listener is handed first. */
	readonly backlogBytes?: number;
	/** Bytes a listener may fall behind before it is dropped. */
	readonly laggingBytes?: number;
	readonly onExit?: (code: number | null) => void;
}

export interface Broadcast {
	/** Hand the encoder a block of 16-bit stereo samples. Resolves when it has taken them. */
	write(pcm: Buffer): Promise<void>;
	/** Start sending the stream to one response, backlog first. */
	attach(response: ServerResponse): void;
	listeners(): number;
	/** End every listener and let the encoder finish; resolves when it has exited. */
	stop(): Promise<void>;
}

// 128 kbps is 16 KB a second, so a second and a half of it is what a joining listener gets.
const BACKLOG = 24 * 1024;
const LAGGING = 1024 * 1024;

export const broadcast = (options: BroadcastOptions = {}): Broadcast => {
	const backlogBytes = options.backlogBytes ?? BACKLOG;
	const laggingBytes = options.laggingBytes ?? LAGGING;
	const listening = new Set<ServerResponse>();
	const backlog: Buffer[] = [];
	let held = 0;

	const encoder: ChildProcessByStdio<Writable, Readable, null> = spawn(options.ffmpeg ?? 'ffmpeg', [
		'-hide_banner', '-loglevel', 'error', '-nostdin',
		// The input is raw samples whose shape is given, so there is nothing to probe. Left to its
		// default, ffmpeg reads five megabytes (26 seconds) of it before it encodes anything.
		'-probesize', '32', '-analyzeduration', '0',
		'-f', 's16le', '-ar', String(SAMPLE_RATE), '-ac', '2', '-i', 'pipe:0',
		// The low-pass is the tone. The compressor evens the level between tracks and the limiter
		// is the last stop before the encoder clips. Neither looks ahead, so a frame leaves as
		// soon as it is made. (dynaudnorm was tried first and held thirty seconds back.)
		'-af', `lowpass=f=${String(config.lowpassHz)},acompressor=threshold=-22dB:ratio=3:attack=40:release=900:makeup=6dB,alimiter=limit=0.9`,
		'-c:a', 'libmp3lame', '-b:a', config.bitrate,
		// No tag at the front and no duration frame: a stream has neither, and a listener joining
		// later never sees the front anyway. Every frame leaves as it is made, so the backlog is
		// whole frames and a listener is never more than one frame behind the encoder.
		'-f', 'mp3', '-id3v2_version', '0', '-write_xing', '0', '-flush_packets', '1',
		'pipe:1',
	], { stdio: ['pipe', 'pipe', 'inherit'] });

	encoder.on('exit', (code) => { options.onExit?.(code); });
	encoder.stdin.on('error', () => {});

	encoder.stdout.on('data', (chunk: Buffer) => {
		backlog.push(chunk);
		held += chunk.length;
		while (held > backlogBytes && backlog.length > 1) held -= backlog.shift()!.length;
		for (const response of listening) {
			if (response.writableLength > laggingBytes) {
				response.destroy();
				continue;
			}
			response.write(chunk);
		}
	});

	return {
		write: (pcm) => new Promise<void>((done) => {
			if (encoder.stdin.destroyed) { done(); return; }
			if (encoder.stdin.write(pcm)) done();
			else encoder.stdin.once('drain', done);
		}),
		attach: (response) => {
			listening.add(response);
			response.on('close', () => { listening.delete(response); });
			if (backlog.length > 0) response.write(Buffer.concat(backlog));
		},
		listeners: () => listening.size,
		stop: () => new Promise<void>((done) => {
			for (const response of listening) response.end();
			listening.clear();
			if (encoder.exitCode !== null) { done(); return; }
			// The end of its input is how ffmpeg is told to finish. A kill would leave it writing
			// into a pipe nobody reads, which it reports as a broken pipe.
			const timer = setTimeout(() => { encoder.kill('SIGKILL'); }, 2000);
			encoder.once('exit', () => { clearTimeout(timer); done(); });
			encoder.stdin.end();
		}),
	};
};
