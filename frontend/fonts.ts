// The three self-hosted families, as `@font-face` directives for one theme entry.
//
// The engine emits each of these once per render however many class chains reach the entry that
// holds them, so they go through the theme rather than through a <Style> tag the page would have
// to place itself. The files are under frontend/public and are served from the site root.

const JETBRAINS = '/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono';
const PLEX = '/ibm-plex-sans/woff2/IBMPlexSans';
// The 4.005R release of github.com/adobe-fonts/source-serif, OFL 1.1; the licence sits beside
// the files. The variable cut rather than the static weights: it carries the optical size axis,
// so a 50px h1 and a 24px h2 each get the serifs drawn for that size, which is what the brand
// specimen shows and no pair of static files does.
const SOURCE_SERIF = '/source-serif-4.005/SourceSerif4Variable';

/** One weight of a family: the number, then the upright and italic file stems. */
type Face = readonly [weight: number, upright: string, italic: string];

const jetbrains: readonly Face[] = [
	[100, 'Thin', 'ThinItalic'],
	[200, 'ExtraLight', 'ExtraLightItalic'],
	[300, 'Light', 'LightItalic'],
	[400, 'Regular', 'Italic'],
	[500, 'Medium', 'MediumItalic'],
	[600, 'SemiBold', 'SemiBoldItalic'],
	[700, 'Bold', 'BoldItalic'],
	[800, 'ExtraBold', 'ExtraBoldItalic'],
];

const plex: readonly Face[] = [
	[100, 'Thin', 'ThinItalic'],
	[200, 'ExtraLight', 'ExtraLightItalic'],
	[300, 'Light', 'LightItalic'],
	[400, 'Regular', 'Italic'],
	[450, 'Text', 'TextItalic'],
	[500, 'Medium', 'MediumItalic'],
	[600, 'SemiBold', 'SemiBoldItalic'],
	[700, 'Bold', 'BoldItalic'],
];

const facesOf = (
	prefix: string,
	family: string,
	base: string,
	faces: readonly Face[],
): Record<string, Record<string, unknown>> => {
	const out: Record<string, Record<string, unknown>> = {};
	for (const [weight, upright, italic] of faces) {
		for (const [style, stem] of [['normal', upright], ['italic', italic]] as const) {
			out[`_fontFace_${prefix}${String(weight)}${style}`] = {
				fontFamily: family,
				src: `url("${base}-${stem}.woff2") format("woff2")`,
				fontWeight: String(weight),
				fontStyle: style,
				fontDisplay: 'swap',
			};
		}
	}
	return out;
};

/** A variable family: one file per style, declaring the whole weight axis. */
const variableOf = (
	prefix: string,
	family: string,
	base: string,
	range: string,
): Record<string, Record<string, unknown>> => {
	const out: Record<string, Record<string, unknown>> = {};
	for (const [style, stem] of [['normal', 'Roman'], ['italic', 'Italic']] as const) {
		out[`_fontFace_${prefix}${style}`] = {
			fontFamily: family,
			src: `url("${base}-${stem}.otf.woff2") format("woff2")`,
			fontWeight: range,
			fontStyle: style,
			fontDisplay: 'swap',
		};
	}
	return out;
};

/** The 34 faces the site ships, keyed as directives of whichever entry they are spread into. */
export const fontFaces: Record<string, Record<string, unknown>> = {
	...facesOf('jb', '"JetBrains Mono"', JETBRAINS, jetbrains),
	...facesOf('plex', '"IBM Plex Sans"', PLEX, plex),
	...variableOf('serif', '"Source Serif 4"', SOURCE_SERIF, '200 900'),
};
