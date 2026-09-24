// The radio page: what it is, and the one button.

import { Button, Head, Icon, Link, Meta, Shown, Title, Typography, h, mark } from '@aweftjs/ui';

import { SITE_URL } from '../head.tsx';
import { radio, state } from '../radio.ts';
import type { State } from '../radio.ts';

const RADIO_URL = `${SITE_URL}/radio`;
const TITLE = 'Radio | Torrin Leonard';
const DESCRIPTION = 'A station that never stops: slow, floating music composed as it plays, the same for everyone listening.';

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
	stopped: 'Off the air on this device. Everyone who presses play hears the same moment.',
	tuning: 'Tuning in.',
	playing: 'On the air. It keeps playing with the screen off.',
	failed: 'The stream could not be reached. Try again in a moment.',
};

export const RadioPage = (): unknown => [
	<RadioHead />,
	<div theme="content">
		<Typography theme={['row', 'wide', 'start']} type="h1" label="Radio" />
		<div theme="divider" />
		<Typography theme={['row', 'wide', 'start']} type="p1" label={DESCRIPTION} />
		<div theme={['row', 'wrap', 'wide', 'start']} style={{ marginTop: 10, gap: 10, alignItems: 'center' }}>
			<Shown value={state.map((now) => now === 'playing' || now === 'tuning')}>
				<mark.then>
					<Button
						id="radio-stop"
						title="Stop the radio"
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
						title="Play the radio"
						label="Play"
						icon={<Icon name="feather:play" />}
						iconPosition="right"
						onClick={() => { radio.play(); }}
					/>
				</mark.else>
			</Shown>
			<Typography type="p1" label={state.map((now) => SAID[now])} />
		</div>
	</div>,
];
