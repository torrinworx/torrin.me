// The radio page: a small player. The bars, the track on the air, one button, a status word.

import { Button, Head, Icon, Link, Meta, Shown, Title, Typography, h, mark } from '@aweftjs/ui';

import { SITE_URL } from '../head.tsx';
import { BARS, levels, now, radio, refresh, state } from '../radio.ts';
import type { Now, State } from '../radio.ts';
import { LINE, MOSS } from '../theme.ts';

const RADIO_URL = `${SITE_URL}/radio`;
const TITLE = 'Radio | Torrin Leonard';
const DESCRIPTION = 'Live, the same for everyone, composed as it plays.';

const RadioHead = (): unknown => (
	<Head>
		<Title>{TITLE}</Title>
		<Meta name="description" content={DESCRIPTION} />
		<Meta property="og:title" content={TITLE} />
		<Meta property="og:description" content={DESCRIPTION} />
		<Meta property="og:url" content={RADIO_URL} />
		<Meta name="twitter:title" content={TITLE} />
		<Meta name="twitter:description" content={DESCRIPTION} />
		<Link rel="canonical" href={RADIO_URL} />
	</Head>
);

const SAID: Readonly<Record<State, string>> = {
	stopped: 'Stopped',
	tuning: 'Tuning',
	playing: 'Playing',
	failed: 'Not reachable',
};

const STYLE: Readonly<Record<Now['style'], string>> = { sleep: 'Sleep', synthwave: 'Synthwave' };

const line = (heard: Now | null): string =>
	(heard === null ? 'On the air' : `${heard.name} · ${STYLE[heard.style]} · ${heard.key} · ${String(heard.tempo)} bpm`);

const CANVAS = 'radio-bars';

/** A canvas of vertical rectangles, one per band, drawn every frame from `levels` in the accent colour. */
const Bars = (_props: Record<string, unknown>, cleanup: (...fns: (() => void)[]) => void): unknown => {
	if (typeof requestAnimationFrame === 'function') {
		const heights = new Float32Array(BARS);
		let frame = 0;
		const draw = (at: number): void => {
			frame = requestAnimationFrame(draw);
			const canvas = document.getElementById(CANVAS) as HTMLCanvasElement | null;
			const context = canvas?.getContext('2d');
			if (canvas === null || canvas === undefined || !context) return;
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			if (canvas.width !== width * devicePixelRatio || canvas.height !== height * devicePixelRatio) {
				canvas.width = width * devicePixelRatio;
				canvas.height = height * devicePixelRatio;
			}
			context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
			context.clearRect(0, 0, width, height);
			levels(heights, at);
			const gap = 3;
			const bar = (width - gap * (BARS - 1)) / BARS;
			context.fillStyle = MOSS;
			for (let i = 0; i < BARS; i++) {
				const tall = Math.max(2, heights[i]! * height);
				context.fillRect(i * (bar + gap), height - tall, bar, tall);
			}
			context.fillStyle = LINE;
			context.fillRect(0, height - 1, width, 1);
		};
		frame = requestAnimationFrame(draw);
		cleanup(() => { cancelAnimationFrame(frame); });
	}
	return <canvas id={CANVAS} aria-hidden="true" style={{ width: '100%', height: 96, display: 'block' }} />;
};

export const RadioPage = (
	_props: Record<string, unknown>,
	cleanup: (...fns: (() => void)[]) => void,
): unknown => {
	// What is on the air, kept fresh while the page is open, playing or not: every twenty
	// seconds, or sooner when the track on the air ends before that.
	if (typeof window !== 'undefined') {
		let timer: ReturnType<typeof setTimeout> | undefined;
		const again = (): void => {
			void refresh().then((heard) => {
				const left = heard === null ? 20 : Math.min(20, Math.max(1, heard.begins + heard.seconds - heard.time + 1));
				timer = setTimeout(again, left * 1000);
			});
		};
		again();
		cleanup(() => { clearTimeout(timer); });
	}
	return [
		<RadioHead />,
		<div theme="content">
			<Typography theme={['row', 'wide', 'start']} type="h1" label="Radio" />
			<div theme="divider" />
			<Typography theme={['row', 'wide', 'start']} type="p1" label={DESCRIPTION} />
			<div
				theme={['column', 'wide']}
				style={{ marginTop: 16, padding: 16, gap: 12, boxSizing: 'border-box', border: `1px solid ${LINE}`, borderRadius: 12 }}
			>
				<Bars />
				<Typography type="p1_bold" label={now.map(line)} />
				<div theme={['row', 'wrap', 'wide', 'start']} style={{ gap: 10, alignItems: 'center' }}>
					<Shown value={state.map((at) => at === 'playing' || at === 'tuning')}>
						<mark.then>
							<Button
								id="radio-stop"
								title="Stop"
								label="Stop"
								icon={<Icon name="feather:pause" />}
								iconPosition="right"
								onClick={() => { radio.stop(); }}
							/>
						</mark.then>
						<mark.else>
							<Button
								id="radio-play"
								theme="shiny"
								title="Play"
								label="Play"
								icon={<Icon name="feather:play" />}
								iconPosition="right"
								onClick={() => { radio.play(); }}
							/>
						</mark.else>
					</Shown>
					<Typography type="date" label={state.map((at) => SAID[at])} />
				</div>
			</div>
		</div>,
	];
};
