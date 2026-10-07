// The top of every page. The name, a link home, heads every page but the landing, whose hero
// carries it. The hamburger floats at the top right of the window on every page, and opens home,
// resume, contact, the blog, the radio, GitHub, the address, the dark mode switch and the switch
// that holds the forest still.
//
// `Detached` places the panel and `Card` paints it. Every row is a `Button` with a real `href`, so
// the four internal links are in the markup a crawler reads and `router.links` turns a click into
// a navigation with nothing wired here. The row that points at the page already showing is left out.

import { mutable } from '@aweftjs/core';
import { Button, Card, Detached, Icon, StageContext, Theme, Toggle, h, mark, useAbort } from '@aweftjs/ui';

import { motion } from '../strip.ts';
import { ModeContext, dark, light, menuSwitch } from '../theme.ts';
import { Email } from './email.tsx';
import { crossfade } from './forest.tsx';
import { Resume } from './resume.tsx';

const ROW = ['bare', 'brand'];

export const Header = StageContext.use((stage) => ModeContext.use((mode) => (
	_props: Record<string, unknown>,
	cleanup: (...fns: (() => void)[]) => void,
): unknown => {
	const open = mutable(false);
	const current = stage?.current;
	const unless = (act: string, row: unknown): unknown =>
		(current === undefined ? row : current.map((showing) => (showing === act ? null : row)));

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
			// The panel is placed outside the header, so Tab from the button would skip it. Two frames:
			// the panel is hidden for the one frame before it has been placed.
			if (on && typeof requestAnimationFrame === 'function') {
				requestAnimationFrame(() => requestAnimationFrame(() => {
					document.querySelector<HTMLElement>('[data-menu] a, [data-menu] input')?.focus();
				}));
			}
		}),
		() => { stop?.(); },
	);

	const close = (): void => { open.set(false); };

	const darkOn = mode?.map((held) => held === dark).setter((on) => { crossfade(); mode.set(on ? dark : light); });

	return [
		unless('', (
			<div theme="bar">
				<a theme="wordmark" href="/" title="Go to home">Torrin Leonard</a>
			</div>
		)),
		<nav theme="float" aria-label="Site">
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
							{unless('', (
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
							))}
							<Resume theme={ROW} />
							{unless('contact', (
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
							))}
							{unless('blog', (
								<Button
									theme={ROW}
									title="Read the blog"
									label="Blog"
									icon={<Icon name="feather:book-open" />}
									iconPosition="right"
									href="/blog"
									hrefNewTab={false}
									onClick={close}
								/>
							))}
							{unless('radio', (
								<Button
									theme={ROW}
									title="Listen to the radio"
									label="Radio"
									icon={<Icon name="feather:radio" />}
									iconPosition="right"
									href="/radio"
									hrefNewTab={false}
									onClick={close}
								/>
							))}
							<Button
								theme={ROW}
								title="Torrin Leonard's Github"
								label="GitHub"
								icon={<Icon name="feather:github" />}
								iconPosition="right"
								href="https://github.com/torrinworx"
							/>
							<Email theme={ROW} />
							<Theme value={menuSwitch}>
								{darkOn === undefined ? null : (
									<div theme={['row', 'center']} style={{ padding: '8px 10px' }}>
										<Toggle value={darkOn} label="Dark mode" theme="brandswitch" />
									</div>
								)}
								{/* Off, nothing on the site moves on its own: the forest, its birds, the shine
								    on the buttons and the contact block's blink (WCAG 2.2.2). */}
								<div theme={['row', 'center']} style={{ padding: '8px 10px' }}>
									<Toggle value={motion} label="Motion" theme="brandswitch" />
								</div>
							</Theme>
						</div>
					</Card>
				</mark.popup>
			</Detached>
		</nav>,
	];
}));
