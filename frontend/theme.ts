// The site's look, as one partial theme handed to `<Theme value={...}>`.
//
// The brand is studio/brand/tokens.json, copied here by value because a theme is data and that
// file is in another repository. Five greens on paper: forest and pine are the two inks, moss is
// the one accent, sage and lime are fills only. Everything the theme names `$accent` is moss.
//
// Four type sizes exist on purpose, which is what keeps the page from growing a font size per
// component: the display heading, the section heading, the paragraph, and the mono label.
// Source Serif 4 is the heading face, IBM Plex Sans the paragraph face, and JetBrains Mono the
// label face: eyebrows, dates and the controls, set uppercase and tracked.

import type { Definitions } from '@aweftjs/ui';

import { fontFaces } from './fonts.ts';

const SANS = '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, '
	+ '"Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, '
	+ '"Liberation Mono", monospace';
const SERIF = '"Source Serif 4", Georgia, "Times New Roman", serif';

// The palette, as tokens.json names it.
export const FOREST = '#132A13';
export const PINE = '#31572C';
/**
 * The one accent: links, the rule under a heading, the edge of a control, the halo on the
 * headshot, the focus ring. Measured at 4.8:1 on paper and 4.94:1 on paper-a, so it passes
 * WCAG 2 AA as text on either, which is what lets it be the link colour and not only a line.
 */
export const MOSS = '#4F772D';
export const LIME = '#ECF39E';
export const PAPER = '#F4F6EC';
export const PAPER_A = '#FAF8F4';
const MUTED = '#5C6A56';
const LINE = 'rgba(19, 42, 19, 0.16)';

// The paragraph, once: `p1` and `body` were two faces on the old site and are the same face now.
// Both names stay because both pages reach for both.
const paragraph = {
	fontSize: '$sizeBody',
	lineHeight: '$lhBody',
	maxWidth: '$measure',
	fontWeight: 400,
};

export const siteTheme: Definitions = {
	'*': {
		$font: SANS,
		$fontMono: MONO,
		$fontSerif: SERIF,

		$background: PAPER,
		$foreground: FOREST,
		// The second ink: dates and eyebrows, quieter than a paragraph and still 7.6:1 on paper.
		$ink2: PINE,
		// A raised block: the fields, and the box the brand calls paper-a.
		$surface: PAPER_A,
		$surfaceForeground: FOREST,
		$mutedForeground: MUTED,

		$accent: MOSS,
		// Paper-a on moss is 4.94:1. White is 5.24:1 and is not one of the page's colours.
		$accentForeground: PAPER_A,
		$link: MOSS,
		// Every focus ring on the page is drawn from this, so tabbing through the site is moss.
		$ring: MOSS,
		$input: MOSS,
		$border: LINE,

		// Editorial edges. A control keeps two pixels so a 2px border does not alias at the
		// corner; a block is square, as the specimen's cards are.
		$radius: '2px',
		$radiusSm: '2px',
		$radiusLg: '0px',

		// Rounded to whole pixels. The sizes are fluid `clamp()` values, so a plain ratio gives a
		// fractional line box (18.4px x 1.55 = 28.52px), those fractions accumulate down the page,
		// and a 2px rule then lands mid-device-row and antialiases across three of them. The ratios
		// are the brand's: 1.18 for display, 1.55 for body.
		$lhHead: 'round(1.18em, 1px)',
		$lhBody: 'round(1.55em, 1px)',
		// The brand's measure: 66 characters at most.
		$measure: '66ch',
		$sizeH1: 'clamp(2rem, 1.4rem + 2.4vw, 3.1rem)',
		$sizeH2: 'clamp(1.5rem, 1.2rem + 1.1vw, 1.9rem)',
		$sizeBody: 'clamp(1.0rem, 0.95rem + 0.35vw, 1.15rem)',
		// The label size. Uppercase tracked mono at the body size shouts; the specimen keeps its
		// labels between 0.75rem and 0.85rem.
		$sizeLabel: 'clamp(0.8rem, 0.75rem + 0.25vw, 0.9rem)',
		$tracking: '0.12em',
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
	content_radius: { borderRadius: '$radiusLg' },

	// aweft's `row_fill` is flex-grow; the old stack's `fill` meant "the whole width", which is
	// what a left-aligned heading inside a centred column needs. Pinned to the start too: a
	// paragraph capped at the measure is narrower than the column and would otherwise centre in it.
	wide: { width: '100%', alignSelf: 'flex-start' },

	// A `Button` given an `href` is an `<a>`, and nothing in the library's `button` entry turns the
	// host's underline off. `button_inline` still wins, because it matches later in the chain.
	button_quiet: { color: '$accent', borderColor: '$accent' },

	// The menu button. `bare` leaves it the width of its icon plus padding, which is a rectangle;
	// this makes the box square.
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
	},

	// A control is a label: the mono face, uppercase and tracked, at the label size.
	button: {
		textDecoration: 'none',
		// 2px, the same as the divider, the fields and the halo on the headshot. The library's own
		// control is 1px, which read as three different weights on one page.
		borderWidth: '2px',
		fontFamily: '$fontMono',
		fontWeight: 500,
		fontSize: '$sizeLabel',
		textTransform: 'uppercase',
		letterSpacing: '$tracking',
		padding: '10px 16px',
		minHeight: '44px',
	},
	// A link inside a line of text is text: the transform and the tracking are inherited
	// properties and would reach the label it wraps.
	button_inline: { textTransform: 'none', letterSpacing: 'normal' },

	// The form fields: a raised box with the 2px moss edge every other control has, in the
	// paragraph face because what a person types is a paragraph, 49px tall as the live site's
	// were. The library's own input is a grey-on-grey control at 36px.
	input: {
		background: '$surface',
		color: '$surfaceForeground',
		border: '2px solid $accent',
		borderRadius: '$radius',
		fontFamily: '$font',
		fontSize: '$sizeBody',
		height: 'auto',
		minHeight: '49px',
		padding: '10px 16px',
		boxShadow: 'none',
		_cssProp_placeholder: { color: '$mutedForeground' },
	},
	// A text area is sized by what is in it, so it keeps its own height and takes the rest.
	textarea: { height: 'auto', minHeight: '49px', padding: '10px 16px' },

	text_h1: {
		fontFamily: '$fontSerif',
		fontSize: '$sizeH1',
		lineHeight: '$lhHead',
		fontWeight: 600,
		letterSpacing: '-0.01em',
	},
	text_h2: {
		fontFamily: '$fontSerif',
		fontSize: '$sizeH2',
		lineHeight: '$lhHead',
		fontWeight: 600,
		letterSpacing: '-0.01em',
	},
	text_p1: paragraph,
	text_body: paragraph,
	// The date line under an entry: an eyebrow in the second ink.
	text_date: {
		fontFamily: '$fontMono',
		fontSize: '$sizeLabel',
		lineHeight: '$lhBody',
		fontWeight: 500,
		textTransform: 'uppercase',
		letterSpacing: '$tracking',
		color: '$ink2',
	},

	// The main landmark. It spans the page so the act inside it can centre, which `wide` alone
	// does not do: that sets a width and leaves the children aligned wherever they fall.
	region: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },

	// Two weights, so a page of green lines still reads as a hierarchy. The section rule under a
	// heading is the solid moss one; the rule under an entry's own title is the brand's hairline,
	// which separates entries without competing with the heading above them.
	divider: { height: '2px', background: '$accent', marginTop: '10px', marginBottom: '10px' },
	divider_entry: { height: '1px', background: '$border' },

	icon: { $iconSize: 'clamp(1.2rem, 1.05rem + 0.6vw, 1.5rem)' },

	// A button with no box at all: the hamburger, the social row, and the rows inside the menu.
	// The icons are moss, not the ink, which is what the library's own button gives.
	bare: { background: 'none', borderColor: 'transparent', boxShadow: 'none', color: '$accent' },
	bare_brand: { color: '$accentForeground' },

	// A block painted in the accent: the menu panel and the "Received!" confirmation.
	brandBox: {
		background: '$accent',
		color: '$accentForeground',
		borderColor: '$accent',
		borderRadius: '$radiusLg',
	},

	// A solid halo around the headshot, on a square photo.
	ring: { boxShadow: '0 0 0 2px $accent', borderRadius: '$radiusLg' },

	// The same halo, blinking, until the pointer reaches the block. A keyframes body is written
	// out as it stands, so the colour is the literal here rather than `$accent`.
	blink: {
		_keyframes_blink: `0%, 50% { box-shadow: 0 0 0 0.2rem ${MOSS}; } 50.01%, 100% { box-shadow: none; }`,
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
