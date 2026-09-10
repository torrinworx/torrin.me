// The contact form: three fields, a spam trap, and one POST to /contact.
//
// The same block appears at the foot of the landing page and as the whole of the /contact page.
// On the landing page the "Contact" button hands it a `focused` cell, which rings and blinks the
// block until the pointer reaches it.

import { mutable } from '@aweftjs/core';
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

const address = (cell: Cell): string => {
	const said = String(cell.get() ?? '').trim();
	cell.set(said);
	if (!said) return 'Email address is required.';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(said)) return 'Please enter a valid email address.';
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

export const Contact = StageContext.use((stage) => (
	props: { focused?: Derived<boolean> },
): unknown => {
	const focused = props.focused;
	const submitted = mutable(false);

	const fullName = mutable('');
	const email = mutable('');
	const message = mutable('');
	const company = mutable('');
	const asked = mutable(false);

	const quiet = (): void => { focused?.set(false); };

	return (
		<div
			id="contact"
			theme={['content', 'radius', focused === undefined ? null : focused.bool('blink', null)]}
			onMouseDown={quiet}
			onMouseEnter={quiet}
		>
			<Typography theme={['row', 'wide', 'start']} type="h2" label="Interested? Let's talk! " />
			<div theme="divider" />
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
					<div theme={['column', 'center']} style={{ width: '100%', gap: 10 }}>
						<div theme={['column', 'center']} style={{ width: '100%', maxWidth: 400, gap: 10 }}>
							<Validate value={fullName} validate={words} signal={asked}>
								<TextField placeholder="Full Name*" aria-label="Full Name" value={fullName} />
							</Validate>

							<Validate value={email} validate={address} signal={asked}>
								<TextField placeholder="Email*" aria-label="Email" value={email} />
							</Validate>

							<Validate value={message} validate={words} signal={asked}>
								{/* `rows` so the page the build writes is the height the browser settles on. A text area
								    measures its content once it can, and until then it is the host default of two
								    rows, which made the field 64px in the written page and 49px after hydration. */}
								<TextArea rows={1} placeholder="Message*" aria-label="Message" value={message} />
							</Validate>

							{/* The trap. Off the screen, out of the reading order and out of the tab
							    order, so only something filling every field reaches it. */}
							<input
								theme="trap"
								name="company"
								type="text"
								tabindex="-1"
								autocomplete="off"
								aria-hidden="true"
								onInput={(event: unknown) => {
									company.set(String((event as { target: { value: string } }).target.value));
								}}
							/>
						</div>

						<Button
							label="Submit"
							onClick={async () => {
								// The checks run here rather than through a `ValidateContext`, so
								// the answer is known in this handler instead of one delivery later.
								const problems = [words(fullName), address(email), words(message)];
								asked.set(true);
								if (problems.some((said) => said !== '')) return;

								await send({
									fullName: fullName.get(),
									email: email.get(),
									message: message.get(),
									page: stage?.current.get() || 'landing',
									company: company.get(),
								});
								submitted.set(true);
							}}
						/>
					</div>
				</mark.else>
			</Shown>
		</div>
	);
});
