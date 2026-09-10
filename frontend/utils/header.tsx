// The hamburger and what it opens: home, resume, contact, GitHub and the address.
//
// `Detached` places the panel and `Card` paints it. Every row is a `Button` with a real `href`, so
// the two internal links are in the markup a crawler reads and `router.links` turns a click into a
// navigation with nothing wired here.

import { mutable } from '@aweftjs/core';
import { Button, Card, Detached, Icon, h, mark, useAbort } from '@aweftjs/ui';

import { Email } from './email.tsx';
import { Resume } from './resume.tsx';

const ROW = ['bare', 'brand'];

export const Header = (
	_props: Record<string, unknown>,
	cleanup: (...fns: (() => void)[]) => void,
): unknown => {
	const open = mutable(false);

	// `Detached` closes itself when the page scrolls under the anchor, but not on Escape or on a
	// click elsewhere: its own popup's dismissal writes the placement, which the placement loop
	// puts straight back on the next frame. So the panel listens for both itself.
	const listen = useAbort((signal: AbortSignal) => {
		const inside = (target: unknown): boolean =>
			target instanceof Element && target.closest('[data-menu]') !== null;
		window.addEventListener('keydown', (event) => {
			if ((event as KeyboardEvent).key === 'Escape') open.set(false);
		}, { signal });
		window.addEventListener('pointerdown', (event) => {
			if (!inside((event as PointerEvent).target)) open.set(false);
		}, { signal });
	});

	let stop: (() => void) | null = null;
	cleanup(
		open.effect((on) => {
			stop?.();
			stop = on ? listen() : null;
		}),
		() => { stop?.(); },
	);

	const close = (): void => { open.set(false); };

	return (
		<div theme="bar">
			<Detached
				enabled={open}
				locations={['below-end', 'above-end', 'below-start', 'above-start']}
				style={{
					overflow: 'auto',
					boxSizing: 'border-box',
					maxWidth: 'calc(100vw - 10px)',
					maxHeight: 'calc(100vh - 10px)',
				}}
			>
				<Button
					data-menu=""
					theme={['bare', 'hamburger']}
					title="Menu"
					aria-label="Menu"
					aria-expanded={open.map((on) => (on ? 'true' : 'false'))}
					size="icon"
					onClick={() => { open.set(!open.get()); }}
					icon={<Icon name="feather:menu" />}
				/>

				<mark.popup>
					<Card
						data-menu=""
						theme="brandBox"
						style={{ padding: 10, minWidth: 150 }}
					>
						<div theme={['column', 'tight']} style={{ gap: 5 }}>
							<Button
								theme={ROW}
								title="Go to home"
								label="Home"
								icon={<Icon name="feather:home" />}
								iconPosition="right"
								href="/"
								hrefNewTab={false}
								onClick={close}
							/>
							<Resume theme={ROW} />
							<Button
								theme={ROW}
								title="Get in touch"
								label="Contact"
								icon={<Icon name="feather:mail" />}
								iconPosition="right"
								href="/contact"
								hrefNewTab={false}
								onClick={close}
							/>
							<Button
								theme={ROW}
								title="Torrin Leonard's Github"
								label="GitHub"
								icon={<Icon name="feather:github" />}
								iconPosition="right"
								href="https://github.com/torrinworx"
							/>
							<Email theme={ROW} />
						</div>
					</Card>
				</mark.popup>
			</Detached>
		</div>
	);
};
