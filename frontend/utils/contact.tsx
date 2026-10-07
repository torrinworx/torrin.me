// The contact form: three fields, a spam trap, and one POST to /contact.
//
// The same block appears at the foot of the landing page and as the whole of the /contact page.
// On the landing page the "Contact" button hands it a `focused` cell, which rings and blinks the
// block until the pointer reaches it, and its heading's rule is the last of the landing's growing
// trees.
//
// One of the strip's birds lands on the form once the whole form is on screen, hops to Submit once
// the form would send, and carries a letter off when it is sent (strip.ts).

import { all, mutable } from '@aweftjs/core';
import type { Derived } from '@aweftjs/core';
import {
	Button,
	Icon,
	Shown,
	StageContext,
	TextArea,
	TextField,
	Typography,
	Validate,
	h,
	mark,
} from '@aweftjs/ui';

import { heroScale, motion, runPerch } from '../strip.ts';
import type { Flight } from '../strip.ts';
import { ModeContext } from '../theme.ts';
import { Rule, nightOf } from './forest.tsx';

/** What the server is sent. `company` is the trap: a person never sees it, so it stays empty. */
interface Message {
	readonly fullName: string;
	readonly email: string;
	readonly message: string;
	readonly page: string;
	readonly company: string;
}

/** A check is handed the cell, not its value, so a formatter can write back. */
type Cell = { get(): unknown; set(value: unknown): void };

const words = (cell: Cell): string => {
	const said = String(cell.get() ?? '');
	if (!said.trim()) return 'This field is required.';
	if (/\d/.test(said)) return 'This field cannot contain numbers.';
	return '';
};

// A message is anything said: digits included, since a message may well carry a phone number.
const filled = (cell: Cell): string => (String(cell.get() ?? '').trim() ? '' : 'This field is required.');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const address = (cell: Cell): string => {
	const said = String(cell.get() ?? '').trim();
	cell.set(said);
	if (!said) return 'Email address is required.';
	if (!EMAIL.test(said)) return 'Please enter a valid email address.';
	return '';
};

const send = async (body: Message): Promise<void> => {
	const answer = await fetch('/contact', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	const said = await answer.json() as { ok?: boolean; error?: string };
	if (!answer.ok || said.ok !== true) throw new Error(said.error ?? 'Failed to send message');
};

const BIRD = 'contact-bird';
const FORM = 'contact-form';
const SUBMIT = 'contact-submit';
// How long the bird is given to carry the letter off before the form gives way to its answer.
const CARRY = 700;

export const Contact = StageContext.use((stage) => ModeContext.use((mode) => (
	props: { focused?: Derived<boolean>; rule?: number },
	cleanup: (...fns: (() => void)[]) => void,
): unknown => {
	const focused = props.focused;
	const submitted = mutable(false);

	const fullName = mutable('');
	const email = mutable('');
	const message = mutable('');
	const company = mutable('');
	const asked = mutable(false);

	const quiet = (): void => { focused?.set(false); };

	// Whether the form would send as it stands, asked without the email check's tidying.
	const ready = (): boolean => words(fullName) === '' && EMAIL.test(email.get().trim()) && filled(message) === '';
	let flight: Flight | null = null;
	if (typeof requestAnimationFrame === 'function') {
		const night = nightOf(mode);
		let off = (): void => {};
		const first = requestAnimationFrame(() => {
			const block = document.getElementById('contact');
			const bird = document.getElementById(BIRD);
			const form = document.getElementById(FORM);
			const name = form?.querySelector<HTMLElement>('input');
			const submit = document.getElementById(SUBMIT);
			if (block === null || !(bird instanceof HTMLCanvasElement) || !form || !name || submit === null) return;
			const bound = runPerch(block, bird, name, heroScale, () => night.get(), { wait: true, letter: true });
			flight = bound;
			const toward = (): HTMLElement => (ready() ? submit : name);
			const typed = all([fullName, email, message]).watch(() => { bound.land(toward()); });
			// It comes once the whole form is in view, so it is never landing on something half off screen.
			const shown = new IntersectionObserver(([entry]) => {
				if ((entry?.intersectionRatio ?? 0) >= 0.99 && !submitted.get()) { bound.land(toward()); bound.start(); }
			}, { threshold: [0.99] });
			shown.observe(form);
			off = () => { typed(); shown.disconnect(); bound.stop(); };
		});
		cleanup(() => { cancelAnimationFrame(first); off(); });
	}

	return (
		<div
			id="contact"
			theme={['content', 'radius', 'contact', focused === undefined ? null : all([focused, motion]).map(([on, moving]) => (on ? (moving ? 'blink' : 'ring') : null))]}
			onMouseDown={quiet}
			onMouseEnter={quiet}
		>
			{props.rule === undefined
				? [
					<Typography theme={['row', 'wide', 'start']} type="h2" label="Interested? Let's talk! " />,
					<div theme="divider" />,
				]
				: (
					<div theme="heading">
						<Typography theme={['row', 'wide', 'start', 'heading_title']} type="h2" label="Interested? Let's talk! " />
						<Rule index={props.rule} />
					</div>
				)}
			<Typography type="p1" theme={['row', 'wide', 'start']}>
				Fill out the form below, email me directly, or dm me on LinkedIn. Either way I'll get back to you quickly!
			</Typography>

			<Shown value={submitted}>
				<div theme={['row', 'spread', 'brandBox']} style={{ width: '100%', padding: 20 }}>
					<div theme="column">
						<Typography
							type="h2"
							label="Received!"
							style={{ color: '$accentForeground' }}
						/>
						<Typography
							type="body"
							label="Thank you for reaching out, I will get back to you shortly."
							style={{ color: '$accentForeground' }}
						/>
					</div>
					<Icon name="feather:check" size={40} style={{ color: '$accentForeground' }} />
				</div>

				<mark.else>
					<div id={FORM} theme={['column', 'center']} style={{ width: '100%', gap: 10 }}>
						<div theme={['column', 'center']} style={{ width: '100%', maxWidth: 400, gap: 10 }}>
							<Validate value={fullName} validate={words} signal={asked}>
								<TextField placeholder="Full Name*" aria-label="Full Name" value={fullName} />
							</Validate>

							<Validate value={email} validate={address} signal={asked}>
								<TextField placeholder="Email*" aria-label="Email" value={email} />
							</Validate>

							<Validate value={message} validate={filled} signal={asked}>
								{/* `rows` so the page the build writes is the height the browser settles on. A text area
								    measures its content once it can, and until then it is the host default of two
								    rows, which made the field 64px in the written page and 49px after hydration. */}
								<TextArea rows={1} placeholder="Message*" aria-label="Message" value={message} />
							</Validate>

							{/* The trap. Off the screen, out of the reading order and out of the tab
							    order, so only something filling every field reaches it. The label is
							    for the build's rule; aria-hidden keeps it out of a reader's order. */}
							<input
								theme="trap"
								name="company"
								type="text"
								tabindex="-1"
								autocomplete="off"
								aria-hidden="true"
								aria-label="Company"
								onInput={(event: unknown) => {
									company.set(String((event as { target: { value: string } }).target.value));
								}}
							/>
						</div>

						<Button
							id={SUBMIT}
							label="Submit"
							onClick={async () => {
								// The checks run here rather than through a `ValidateContext`, so
								// the answer is known in this handler instead of one delivery later.
								const problems = [words(fullName), address(email), filled(message)];
								asked.set(true);
								if (problems.some((said) => said !== '')) return;

								await send({
									fullName: fullName.get(),
									email: email.get(),
									message: message.get(),
									page: stage?.current.get() || 'landing',
									company: company.get(),
								});
								if (flight?.state === 'perch' || flight?.state === 'in') {
									flight.leave(true);
									await new Promise((done) => { setTimeout(done, CARRY); });
								}
								submitted.set(true);
							}}
						/>
					</div>
				</mark.else>
			</Shown>
			{/* Always on the page, so a screen reader hears the answer when it arrives (WCAG 4.1.3). */}
			<p theme="unseen" role="status">{submitted.map((sent) => (sent ? 'Received! Thank you for reaching out.' : ''))}</p>
			<canvas id={BIRD} theme="perch" aria-hidden="true" />
		</div>
	);
}));
