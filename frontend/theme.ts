// The site's look: two modes holding the colours, and one partial theme holding everything else.
//
// The brand is studio/brand/tokens.json, copied here by value because a theme is data and that
// file is in another repository. Five greens on paper: forest and pine are the two inks, moss is
// the one accent, sage and lime are fills only. Everything the light mode names `$accent` is moss.
// The dark mode is the brand's dark roles: a forest page, paper ink, sage for the second ink and
// lime for the accent.
//
// The pages are written light. Only a visitor who picks dark with the menu's switch gets dark,
// once the page is alive; their system setting is never read (work order 485, as builderloo.ca).
//
// Four type sizes exist on purpose, which is what keeps the page from growing a font size per
// component: the display heading, the section heading, the paragraph, and the mono label.
// Source Serif 4 is the heading face, IBM Plex Sans the paragraph face, and JetBrains Mono the
// label face: eyebrows, dates and the controls, set uppercase and tracked.

import type { Derived } from '@aweftjs/core';
import { createContext, dark as baseDark, light as baseLight } from '@aweftjs/ui';
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
 * The one accent: links, the rule under a heading, the edge of a control, the focus ring. Measured at 4.8:1 on paper and 4.94:1 on paper-a, so it passes
 * WCAG 2 AA as text on either, which is what lets it be the link colour and not only a line.
 */
export const MOSS = '#4F772D';
export const SAGE = '#90A955';
export const LIME = '#ECF39E';
export const PAPER = '#F4F6EC';
export const PAPER_A = '#FAF8F4';
const MUTED = '#5C6A56';
export const LINE = 'rgba(19, 42, 19, 0.16)';

/**
 * The widest screen, in CSS pixels, that stacks the landing's words above its strip. Narrower
 * than about 860, the first tree's crown reaches under the sentence. The strip lays its trees out
 * for the same width (strip.ts), so this is the one place it is set.
 */
export const STACKED = 860;
const stacked = `_media_(max-width: ${String(STACKED)}px)`;

/** What the switch moves between: one of the two modes below. */
export type Mode = Definitions;

const lightTokens: Record<string, string> = {
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
};

// The brand's dark roles. Lime on forest is 13:1 and sage 5.8:1 (tokens.json); the muted ink is
// 8:1. The raised block is forest lifted one step, since paper-a would be a light box on a dark page.
const darkTokens: Record<string, string> = {
	$background: FOREST,
	$foreground: PAPER_A,
	$ink2: SAGE,
	$surface: '#1A331A',
	$surfaceForeground: PAPER_A,
	$mutedForeground: '#B4C2A6',

	$accent: LIME,
	$accentForeground: FOREST,
	$link: LIME,
	$ring: LIME,
	$input: LIME,
	$border: 'rgba(250, 248, 244, 0.16)',
};

/** The light mode, which is how every page is written. */
export const light: Mode = { ...baseLight, '*': { ...baseLight['*'], ...lightTokens } };

/**
 * The dark mode. A company logo drawn for a light page gets a paper tile under it, or a dark mark
 * on a transparent ground would vanish into the forest.
 */
export const dark: Mode = {
	...baseDark,
	'*': { ...baseDark['*'], ...darkTokens },
	logo: { background: PAPER_A, borderRadius: '$radius' },
};

/**
 * What the menu's switch is wrapped in: its label set as a menu row is, in the panel's ink. A field's
 * label is one fixed entry for every field, so only a provider around this one can restyle it.
 */
export const menuSwitch: Definitions = {
	field_label: {
		fontFamily: '$fontMono',
		fontWeight: 500,
		fontSize: '$sizeLabel',
		textTransform: 'uppercase',
		letterSpacing: '$tracking',
		color: '$accentForeground',
		cursor: 'pointer',
	},
};

/** The mode the page shows, a cell the menu's switch writes. Absent above a component, it is light. */
export const ModeContext = createContext<Derived<Mode> | null>(null);

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
		// The landing's strip runs the full width of the window, wider than this padded box; the
		// part a scrollbar covers is cut off rather than scrolled to.
		overflowX: 'clip',
		// What the canopy over an inner page is placed against, from the top of the window.
		position: 'relative',
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

	// The name's row above every page but the landing: the same width as the content column, and as
	// tall as the menu button, so the name lines up with it.
	bar: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		boxSizing: 'border-box',
		width: '100%',
		maxWidth: '800px',
		minHeight: '44px',
		padding: '0 20px',
	},
	// The name at the start of the strip, in the heading face, a link home.
	wordmark: {
		fontFamily: '$fontSerif',
		fontWeight: 600,
		fontSize: '1.15rem',
		letterSpacing: '-0.01em',
		color: '$foreground',
		textDecoration: 'none',
		'_cssProp_focus-visible': { outline: '2px solid $ring', outlineOffset: '4px' },
	},
	// The menu button, pinned to the top right of the window on every page, on a tile of the page
	// colour with the photo's halo, so it reads over whatever scrolls under it.
	float: {
		position: 'fixed',
		top: '20px',
		right: '20px',
		zIndex: 10,
		display: 'flex',
		background: '$background',
		boxShadow: '0 0 0 2px $accent',
		borderRadius: '$radius',
	},
	// The dark mode switch at the foot of the menu, drawn in the panel's ink: the library's switch is
	// filled with the accent when on, which is the panel's own colour, so it would vanish.
	brandswitch: {
		border: '2px solid $accentForeground',
		background: 'transparent',
		_cssProp_before: { background: '$accentForeground' },
		_cssProp_checked: { background: '$accentForeground', borderColor: '$accentForeground' },
		'_cssProp_:checked::before': { background: '$accent' },
		// The page's ring is the panel's own colour, so focus is drawn in the panel's ink.
		'_cssProp_focus-visible': { outline: '2px solid $accentForeground', outlineOffset: '3px', boxShadow: 'none' },
	},
	// --- the landing's hero: the strip, with the name in its sky and the actions on its water ---

	// The whole width of the window. On a wide screen the words sit over the strip; at STACKED and
	// narrower the three take turns: the words, a shorter strip, then the actions.
	// 680px tall so the words and the photo sit above the crowns: the trees keep their size and stand
	// lower (strip.ts). It starts below the band the menu button floats in, so the name has room
	// above it.
	hero: {
		position: 'relative',
		width: '100vw',
		height: '680px',
		marginTop: '64px',
		[stacked]: { height: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' },
	},
	hero_strip: {
		position: 'absolute',
		inset: 0,
		overflow: 'hidden',
		touchAction: 'pan-y',
		// Taller when stacked, so the photo floats over the bank with the sky above it.
		[stacked]: { position: 'relative', inset: 'auto', height: '440px', order: 1 },
	},
	hero_canvas: { position: 'absolute', left: 0, top: 0, display: 'block', imageRendering: 'pixelated' },
	// The photo floating over the strip's bank, kept over the strip's pixel copy of it (landing.tsx).
	// Placed by transform, so its bobbing never shifts the layout. Until the page comes alive it
	// stands about where it floats: at the end of the words' column, or centred when stacked.
	hero_photo: {
		position: 'absolute',
		left: 0,
		top: 0,
		zIndex: 1,
		display: 'block',
		width: '174px',
		height: '234px',
		objectFit: 'cover',
		transform: 'translate(calc(100vw - max(0px, (100vw - 840px) / 2) - 217px), 69px)',
		transition: 'none',
		cursor: 'pointer',
		userSelect: 'none',
		WebkitUserSelect: 'none',
		touchAction: 'pan-y',
		[stacked]: { width: '128px', height: '172px', transform: 'translate(calc(50vw - 64px), 48px)' },
	},
	// What the strip draws in front of the photo: a leaf, a vine, a bird on its top edge.
	hero_front: { position: 'absolute', left: 0, top: 0, zIndex: 2, width: 0, height: 0, display: 'block', pointerEvents: 'none', imageRendering: 'pixelated', transition: 'none' },
	// The bird that lands on the resume button (strip.ts). Above everything in the hero, out of the
	// pointer's way, and not shown until the browser flies it in. The library eases every transform
	// over 0.15s, which would trail the bird behind its own flight.
	hero_bird: { position: 'absolute', left: 0, top: 0, zIndex: 1, display: 'none', pointerEvents: 'none', imageRendering: 'pixelated', transition: 'none' },
	hero_over: {
		position: 'absolute',
		inset: 0,
		pointerEvents: 'none',
		boxSizing: 'border-box',
		// The column the sections below sit in, with the page's own padding around it, so the words
		// line up with them at every width; on a phone they flow, with the same two paddings.
		maxWidth: '840px',
		margin: '0 auto',
		// Stacked, its two halves are the hero's own rows, so the strip can stand between them.
		[stacked]: { display: 'contents' },
	},
	// The words at the start of the column. The row itself lets pointer events through to the strip,
	// and only the words receive them.
	hero_sky: {
		position: 'absolute',
		top: '16px',
		left: '40px',
		right: '40px',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: '24px',
		[stacked]: { position: 'static', boxSizing: 'border-box', padding: '16px 40px 0' },
	},
	hero_intro: { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '420px', minWidth: 0, pointerEvents: 'auto' },
	hero_water: {
		position: 'absolute',
		bottom: '56px',
		left: '40px',
		// As wide as what it holds and no wider, so the pointer reaches the pond beside the actions.
		maxWidth: 'calc(100% - 80px)',
		display: 'flex',
		flexDirection: 'column',
		gap: '14px',
		pointerEvents: 'auto',
		[stacked]: { position: 'static', maxWidth: 'none', order: 2, padding: '0 40px 56px' },
	},
	hero_actions: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '10px 20px' },
	// The one-sentence intro: a size up from a paragraph, kept to a short measure.
	hero_lede: { fontSize: '1.1em', lineHeight: '$lhBody', maxWidth: '46ch', margin: 0 },
	// Where the work can happen, quiet, in the label face without the capitals.
	hero_where: { fontFamily: '$fontMono', fontSize: '0.85em', color: '$ink2', margin: 0 },
	// A text action on the water: the label face, underlined, the accent colour.
	quietlink: {
		fontFamily: '$fontMono',
		fontWeight: 500,
		fontSize: '$sizeLabel',
		textTransform: 'uppercase',
		letterSpacing: '$tracking',
		color: '$accent',
		textDecoration: 'underline',
		textDecorationThickness: '1px',
		textUnderlineOffset: '5px',
		background: 'none',
		border: 'none',
		padding: 0,
		cursor: 'pointer',
		// The library's button gives an icon side its own padding, by rules that outrank a plain
		// `padding`; the Email link carries an icon, so it zeroes them the same way.
		'_cssProp_has(> svg:first-child)': { paddingLeft: 0 },
		'_cssProp_has(> svg:last-child)': { paddingRight: 0 },
		// The library's halo is the ring at half strength, 2:1 on paper; a link with no box of its
		// own needs the full ring to be seen.
		'_cssProp_focus-visible': { outline: '2px solid $ring', outlineOffset: '4px' },
		// Under the pointer the underline thickens. The Email action is the library's button, which
		// tints its box on hover; this has no box, so the tint goes.
		_cssProp_hover: { textDecorationThickness: '2px', backgroundImage: 'none' },
		_cssProp_active: { backgroundImage: 'none' },
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
		// 2px, the same as the divider and the fields. The library's own control is 1px, which read
		// as three different weights on one page.
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

	// The halo the landing's "Contact" button puts round the contact block, held still while motion is off.
	ring: { outlineWidth: '0.2rem', outlineStyle: 'solid', outlineColor: '$accent' },

	// The same halo, blinking, until the pointer reaches the block. A keyframes body is written
	// out as it stands, with no token in it, so the frames only switch an outline on and off and
	// the outline takes its colour from the mode.
	blink: {
		_keyframes_blink: '0%, 50% { outline-style: solid; } 50.01%, 100% { outline-style: none; }',
		outlineWidth: '0.2rem',
		outlineColor: '$accent',
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

	// Read by a screen reader and not drawn: the contact form's answer, said as it arrives.
	unseen: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0 0 0 0)',
		whiteSpace: 'nowrap',
		border: 0,
	},

	// --- the forest around the site (forest.tsx) -------------------------------------------

	// A canvas a scene paints, at the top left of its box, its pixels kept square.
	scene_canvas: { position: 'absolute', left: 0, top: 0, display: 'block', imageRendering: 'pixelated' },

	// A section heading on the landing, with its rule: the rule is the bank of a small strip whose
	// tree stands at its end. Until the page comes alive, a plain line in its place. The title and
	// the strip share one cell, so the heading is as tall as its tree and the tree never reaches the
	// section above. Where a long title on a narrow screen meets the tree, the title's own page
	// colour hides the tree behind it, so the words never sit on leaves (WCAG 1.4.3).
	heading: { display: 'grid', alignItems: 'end', width: '100%' },
	heading_title: {
		gridArea: '1 / 1',
		justifySelf: 'start',
		alignSelf: 'end',
		width: 'auto',
		// The padding widens the page colour past the glyphs' ascenders and the last letter.
		padding: '6px 8px 3px 0',
		marginBottom: '10px',
		position: 'relative',
		zIndex: 3,
		background: '$background',
	},
	rule: {
		gridArea: '1 / 1',
		position: 'relative',
		overflow: 'hidden',
		pointerEvents: 'none',
		zIndex: 2,
		background: 'linear-gradient($accent, $accent) bottom / 100% 2px no-repeat',
	},

	// The canopy over an inner page's margins, from the top of the window, out of the pointer's way.
	canopy: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, pointerEvents: 'none', overflow: 'hidden' },

	// A post's tree beside it on the index, and above its title.
	tile: { position: 'relative', width: '72px', height: '108px', overflow: 'hidden', marginTop: '22px' },
	plot: { position: 'relative', width: '100%', height: '220px', overflow: 'hidden' },

	// The footer: a shore across the window, down to its bottom edge, the social row in its sky and
	// the copyright on its water.
	// Stacked, the social row wraps to two lines, so the shore is taller and its trees start below them.
	shore: { position: 'relative', width: '100vw', height: '300px', marginBottom: '-20px', flex: '0 0 auto', [stacked]: { height: '380px' } },
	shore_strip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '300px', overflow: 'hidden' },
	shore_row: {
		position: 'absolute',
		top: '26px',
		left: 0,
		right: 0,
		boxSizing: 'border-box',
		padding: '0 20px',
		display: 'flex',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: '10px',
	},
	shore_line: { position: 'absolute', left: 0, right: 0, bottom: '30px', margin: 0, maxWidth: 'none', textAlign: 'center' },

	// The 404 page's tree, across the window above the words.
	lost: { position: 'relative', width: '100vw', height: '250px', marginTop: '70px', overflow: 'hidden', flex: '0 0 auto' },

	// The radio's reeds, inside its card.
	reeds: { position: 'relative', width: '100%', height: '120px', overflow: 'hidden' },

	// The contact block holds the bird that lands on its form, and the bird is drawn over it (strip.ts).
	contact: { position: 'relative' },
	perch: { position: 'absolute', left: 0, top: 0, zIndex: 7, display: 'none', pointerEvents: 'none', imageRendering: 'pixelated', transition: 'none' },

	// Off the screen and out of the reading order: the spam trap in the contact form.
	trap: {
		position: 'absolute',
		left: '-9999px',
		width: '1px',
		height: '1px',
		opacity: 0,
	},

	// --- the blog --------------------------------------------------------------------------

	// The index: one entry per post, the title a link in the heading face with no underline until
	// the pointer reaches it, separated by the hairline the landing's entries use.
	// Each entry is its words and, beside them, the post's tree.
	blog_list: { listStyle: 'none', margin: 0, padding: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' },
	blog_entry: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 72px', gap: '24px', alignItems: 'start', paddingBottom: '30px', borderBottom: '1px solid $border' },
	blog_text: { gap: '6px', minWidth: 0 },
	blog_title: { color: '$foreground', textDecoration: 'none', _cssProp_hover: { color: '$accent' } },

	// The post's own lines above the markdown: the eyebrow with the date, and the lede in the
	// second ink.
	post_meta: { display: 'block' },
	post_lede: { color: '$ink2' },

	// The body. The `markdown` box carries the paragraph's face and size so its `$measure` is the
	// paragraph's `$measure`, and every block inside it, a figure or a code box included, stops
	// where a line of text stops.
	markdown: { width: '100%', maxWidth: '$measure', fontSize: '$sizeBody', gap: '20px' },
	markdown_heading: { marginTop: '20px' },
	// A code block: the paper-a box with the hairline, in the mono face at the label size. The
	// library's own is the surface with the control radius, which is a card on this page.
	markdown_code: {
		fontFamily: '$fontMono',
		fontSize: '$sizeLabel',
		lineHeight: '$lhBody',
		padding: '16px 20px',
		background: '$surface',
		border: '1px solid $border',
		borderRadius: '$radiusLg',
		maxWidth: '100%',
		boxSizing: 'border-box',
	},
	markdown_inline: { fontFamily: '$fontMono', fontSize: '0.9em', background: '$surface', border: '1px solid $border', padding: '0 4px', borderRadius: '$radius' },
	// A figure fills the measure and no more; its caption is the second ink, in the paragraph
	// face at the label size, so it reads as a caption and not as the next paragraph.
	markdown_figure: { margin: 0, width: '100%' },
	markdown_image: { width: '100%', border: '1px solid $border' },
	markdown_video: { width: '100%' },
	markdown_caption: { fontFamily: '$font', fontSize: '$sizeLabel', lineHeight: '$lhBody', color: '$ink2', marginTop: '8px' },
	// A quote takes the moss bar; a callout (a quote whose first word is `Note:`) is a paper-a box
	// with the bar, and the modifier's label is its eyebrow.
	markdown_quote: {
		borderLeft: '3px solid $accent',
		paddingLeft: '16px',
		color: '$ink2',
		overflowWrap: 'anywhere',
		'_cssProp_has([data-callout])': { background: '$surface', border: '1px solid $border', borderLeft: '3px solid $accent', padding: '14px 20px', color: '$foreground' },
	},
	callout_label: {
		display: 'block',
		fontFamily: '$fontMono',
		fontSize: '$sizeLabel',
		fontWeight: 500,
		textTransform: 'uppercase',
		letterSpacing: '$tracking',
		color: '$accent',
		marginBottom: '4px',
	},
	sup: { fontSize: '0.75em', lineHeight: 0, verticalAlign: 'super' },

	// The kinds of token the build's highlighter names (content/highlight.ts), each a colour of
	// the brand: comments in the muted ink, strings in pine, keywords and tags in moss. The base
	// entry says the face again, because `*` puts the paragraph face on every themed element and
	// a token is a themed span inside the block.
	code: { fontFamily: '$fontMono' },
	code_comment: { color: '$mutedForeground', fontStyle: 'italic' },
	code_string: { color: '$ink2' },
	code_keyword: { color: '$accent', fontWeight: 600 },
	code_number: { color: '$ink2', fontWeight: 600 },
	code_function: { color: '$foreground', fontWeight: 600 },
	code_tag: { color: '$accent' },
	code_variable: { color: '$foreground' },

	// The contents list: a paper-a box before the body, a numbered list of the second-level
	// headings in the paragraph face.
	toc: { boxSizing: 'border-box', width: '100%', maxWidth: '$measure', fontSize: '$sizeBody', padding: '16px 20px', background: '$surface', border: '1px solid $border' },
	toc_title: { display: 'block', marginBottom: '6px' },
	toc_list: { margin: 0, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '4px' },
	toc_item: { margin: 0 },
	toc_link: { color: '$link', textDecoration: 'underline', fontFamily: '$font', fontSize: '$sizeBody', lineHeight: '$lhBody' },

	// A video before the click: the poster in a 16:9 box with the control edge, the word "Play"
	// on a moss box at its centre. After the click, the frame in the same box. The poster YouTube
	// serves is 4:3 with bars, so it is cropped to the box.
	video: {
		display: 'block',
		position: 'relative',
		width: '100%',
		aspectRatio: '16 / 9',
		padding: 0,
		margin: 0,
		border: '2px solid $accent',
		borderRadius: '$radiusLg',
		background: FOREST,
		cursor: 'pointer',
		overflow: 'hidden',
		'_cssProp_focus-visible': { outline: '2px solid $ring', outlineOffset: '2px' },
	},
	video_poster: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
	video_play: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		padding: '10px 18px',
		background: '$accent',
		color: '$accentForeground',
		fontFamily: '$fontMono',
		fontSize: '$sizeLabel',
		fontWeight: 500,
		textTransform: 'uppercase',
		letterSpacing: '$tracking',
	},
	video_frame: { display: 'block', width: '100%', aspectRatio: '16 / 9', border: '2px solid $accent', borderRadius: '$radiusLg', background: FOREST },
};
