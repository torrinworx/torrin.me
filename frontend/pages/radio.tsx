// The radio page: a small player. The reeds, which stand as tall as each band is loud (forest.tsx),
// the track on the air, one button, a status word.

import { Button, Head, Icon, Link, Meta, Shown, Title, Typography, h, mark } from '@aweftjs/ui';

import { SITE_URL } from '../head.tsx';
import { now, radio, refresh, state } from '../radio.ts';
import type { Now, State } from '../radio.ts';
import { Canopy, Reeds } from '../utils/forest.tsx';

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
		<Canopy />,
		<div theme="content">
			<Typography theme={['row', 'wide', 'start']} type="h1" label="Radio" />
			<div theme="divider" />
			<Typography theme={['row', 'wide', 'start']} type="p1" label={DESCRIPTION} />
			<div
				theme={['column', 'wide']}
				style={{ marginTop: 16, padding: 16, gap: 12, boxSizing: 'border-box', border: '1px solid $border', borderRadius: 12 }}
			>
				<Reeds />
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
