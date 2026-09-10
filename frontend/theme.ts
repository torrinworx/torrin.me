// The site's look, as one partial theme handed to `<Theme value={...}>`.
//
// A translation of the old destamatic-ui theme, not a copy: the brand blue, the two sizes and the
// radius become aweft's role and size names, and everything the old theme named `primary` or
// `$color` is now `$accent`. Only three type sizes exist on purpose, which is what keeps the page
// from growing a font size per component.
//
// JetBrains Mono is the heading and control face; IBM Plex Sans is the paragraph face. That is why
// `text` takes `$fontMono` while the `body` variant takes `$font`.

import type { Definitions } from '@aweftjs/ui';

import { fontFaces } from './fonts.ts';

const SANS = '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, '
	+ '"Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, '
	+ '"Liberation Mono", monospace';

/**
 * The brand blue. One shade everywhere: text, borders, the rule under a heading, the halo on the
 * headshot. A first pass kept the old lighter blue for the decorative parts and it read as two
 * different blues on one page, which is worse than either alone.
 *
 * The value is the old `#4AA9FC` walked down in lightness, same hue, until white on it and it on
 * white both clear the 4.5:1 WCAG 2 AA target for text. Computed rather than picked: it is the
 * lightest same-hue blue that passes with headroom, at 4.61:1. The old one measured 2.51:1, and
 * Lighthouse failed 22 elements on the live site because of it.
 */
export const BRAND = '#0475D9';

export const siteTheme: Definitions = {
	'*': {
		$font: SANS,
		$fontMono: MONO,

		$accent: BRAND,
		// Every focus ring on the page is drawn from this, so tabbing through the site is blue.
		$ring: BRAND,
		$accentForeground: '#ffffff',
		$link: BRAND,

		// The old site painted plain white. aweft's default ground is a warmer off-white.
		$background: '#ffffff',

		$radius: '18px',
		$radiusLg: '18px',

		// Rounded to whole pixels. The sizes are fluid `clamp()` values, so a plain ratio gives a
		// fractional line box (18.4px x 1.65 = 30.36px), those fractions accumulate down the page,
		// and a 2px rule then lands mid-device-row and antialiases across three of them. The live
		// site has the same blur for the same reason.
		$lhHead: 'round(1.15em, 1px)',
		$lhBody: 'round(1.65em, 1px)',
		$measure: '80ch',
		$sizeH1: 'clamp(2.4rem, 1.8rem + 2.6vw, 3.2rem)',
		$sizeH2: 'clamp(1.45rem, 1.2rem + 1.1vw, 1.9rem)',
		$sizeBody: 'clamp(1.0rem, 0.95rem + 0.35vw, 1.15rem)',
	},

	// The whole page. It carries the font faces because a chain reaches this entry on every page,
	// and the engine emits an `@font-face` once per render however many chains reach it.
	page: {
		...fontFaces,
		minHeight: '100vh',
		background: '$background',
		color: '$foreground',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		boxSizing: 'border-box',
		padding: '20px',
		gap: '60px',
	},

	// One column of content, capped at a readable width and centred in the page.
	content: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		boxSizing: 'border-box',
		width: '100%',
		maxWidth: '800px',
		padding: '20px',
		gap: '20px',
	},
	content_start: { alignItems: 'flex-start' },

	// The header strip: the same width as the content column, with the menu pushed to its end.
	bar: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		boxSizing: 'border-box',
		width: '100%',
		maxWidth: '800px',
		padding: '0 20px',
	},
	content_radius: { borderRadius: '$radius' },

	// aweft's `row_fill` is flex-grow; the old stack's `fill` meant "the whole width", which is
	// what a left-aligned heading inside a centred column needs.
	wide: { width: '100%' },

	// A `Button` given an `href` is an `<a>`, and nothing in the library's `button` entry turns the
	// host's underline off. `button_inline` still wins, because it matches later in the chain.
	button_quiet: { color: '$accent', borderColor: '$accent' },

	// The menu button. `bare` leaves it the width of its icon plus padding, which is a rectangle;
	// this makes the box square and squares off the corner a little against the 18px the pill
	// buttons use.
	//
	// Not `menu`: `ui` already has an entry by that name (`menu: { extends: 'listbox' }`, the
	// dropdown panel), and a segment matches by name, so calling it that dressed the button as a
	// listbox panel and beat `bare` to the background.
	button_hamburger: {
		width: '44px',
		minWidth: '44px',
		height: '44px',
		minHeight: '44px',
		padding: 0,
		borderRadius: '12px',
	},

	button: {
		textDecoration: 'none',
		// 2px, the same as the divider, the fields and the halo on the headshot. The library's own
		// control is 1px, which read as three different weights on one page.
		borderWidth: '2px',
		fontFamily: '$fontMono',
		fontWeight: 700,
		fontSize: '$sizeBody',
		padding: '10px',
		minHeight: '44px',
	},

	// The form fields. Measured off the live site at 1280px: the brand blue for the text and a 2px
	// border of the same, no fill, JetBrains Mono at the body size, 49px tall. The library's own
	// input is a grey-on-grey control at 36px in the sans face, which is a different site.
	input: {
		background: 'transparent',
		color: '$accent',
		border: '2px solid $accent',
		borderRadius: '$radius',
		fontFamily: '$fontMono',
		fontSize: '$sizeBody',
		height: 'auto',
		minHeight: '49px',
		padding: '10px 16px',
		boxShadow: 'none',
		_cssProp_placeholder: { color: '$accent', opacity: 0.7 },
	},
	// A text area is sized by what is in it, so it keeps its own height and takes the rest.
	textarea: { height: 'auto', minHeight: '49px', padding: '10px 16px' },

	text: { fontFamily: '$fontMono' },
	text_h1: { fontSize: '$sizeH1', lineHeight: '$lhHead', fontWeight: 500 },
	text_h2: { fontSize: '$sizeH2', lineHeight: '$lhHead', fontWeight: 500 },
	text_p1: { fontSize: '$sizeBody', lineHeight: '$lhBody', maxWidth: '$measure', fontWeight: 400 },
	text_p1_bold: { fontWeight: 700 },
	// The paragraph face: everything the old theme reached with type='body'.
	text_body: {
		fontFamily: '$font',
		fontSize: '$sizeBody',
		lineHeight: '$lhBody',
		maxWidth: '$measure',
		fontWeight: 400,
	},

	// The main landmark. It spans the page so the act inside it can centre, which `wide` alone
	// does not do: that sets a width and leaves the children aligned wherever they fall.
	region: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },

	// Two weights, so a page of blue lines still reads as a hierarchy. The section rule under a
	// heading is the solid one; the rule under an entry's own title is a hairline of the same blue,
	// which separates entries without competing with the heading above them.
	divider: { height: '2px', background: '$accent', marginTop: '10px', marginBottom: '10px' },
	divider_entry: {
		height: '1px',
		background: 'color-mix(in srgb, $accent 30%, transparent)',
	},

	icon: { $iconSize: 'clamp(1.2rem, 1.05rem + 0.6vw, 1.5rem)' },

	// A button with no box at all: the social row, and the rows inside the menu.
	// The icon-only buttons: the hamburger and the social row. Measured off the live site, those
	// icons are the brand blue, not the text colour, which is what the library's own button gives.
	bare: { background: 'none', borderColor: 'transparent', boxShadow: 'none', color: '$accent' },
	bare_brand: { color: '$accentForeground' },

	// A block painted in the brand colour: the menu panel and the "Received!" confirmation.
	brandBox: {
		background: '$accent',
		color: '$accentForeground',
		borderColor: '$accent',
		borderRadius: '$radius',
	},

	// A solid halo around the headshot.
	ring: { boxShadow: '0 0 0 2px $accent' },

	// The same halo, blinking, until the pointer reaches the block. A keyframes body is written
	// out as it stands, so the colour is the literal here rather than `$accent`.
	blink: {
		_keyframes_blink: `0%, 50% { box-shadow: 0 0 0 0.2rem ${BRAND}; } 50.01%, 100% { box-shadow: none; }`,
		animation: '$blink 1s steps(1, end) infinite',
	},

	// The sweep that crosses the resume and contact buttons every few seconds.
	shine: {
		pointerEvents: 'none',
		position: 'absolute',
		top: 0,
		left: 0,
		width: '200%',
		height: '100%',
		background: 'linear-gradient(120deg,'
			+ 'rgba(255,255,255,0) 0%,'
			+ 'rgba(255,255,255,0) 35%,'
			+ 'rgba(255,255,255,0.7) 50%,'
			+ 'rgba(255,255,255,0) 65%,'
			+ 'rgba(255,255,255,0) 100%)',
		borderRadius: 'inherit',
		mixBlendMode: 'screen',
		transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
	},

	// A button holding a shine has to clip it, and the shine is placed against the button.
	shiny: { position: 'relative', overflow: 'clip' },

	// Off the screen and out of the reading order: the spam trap in the contact form.
	trap: {
		position: 'absolute',
		left: '-9999px',
		width: '1px',
		height: '1px',
		opacity: 0,
	},
};
