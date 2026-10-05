// The two modes (work order 485): the dark one is the brand's dark roles, and every pair of colours
// the site sets text in passes WCAG 2 AA in both.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dark, light, siteTheme } from '../frontend/theme.ts';
import type { Mode } from '../frontend/theme.ts';

const tokens = (mode: Mode): Record<string, string> => mode['*'] as Record<string, string>;

// The WCAG 2 contrast ratio of two `#rrggbb` colours.
const luminance = (hex: string): number => {
	const [r, g, b] = [1, 3, 5].map((at) => {
		const c = parseInt(hex.slice(at, at + 2), 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const ratio = (a: string, b: string): number => {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi! + 0.05) / (lo! + 0.05);
};

// Text over the ground it is set on: the paragraph, the second ink (dates, labels), the muted ink,
// a link, a button's label on the accent, and a field's text on its raised box.
const PAIRS = [
	['$foreground', '$background'],
	['$ink2', '$background'],
	['$mutedForeground', '$background'],
	['$link', '$background'],
	['$accentForeground', '$accent'],
	['$surfaceForeground', '$surface'],
] as const;

describe('the modes', () => {
	for (const [name, mode] of [['light', light], ['dark', dark]] as const) {
		for (const [text, ground] of PAIRS) {
			it(`${name}: ${text} on ${ground} reads at 4.5:1 or more`, () => {
				const t = tokens(mode)[text]!, g = tokens(mode)[ground]!;
				assert.ok(ratio(t, g) >= 4.5, `${t} on ${g} is ${ratio(t, g).toFixed(2)}:1`);
			});
		}
	}

	it('the dark mode is the brand dark roles: a forest page, paper ink, sage second ink, lime accent', () => {
		const set = tokens(dark);
		assert.deepEqual(
			[set['$background'], set['$foreground'], set['$ink2'], set['$accent']],
			['#132A13', '#FAF8F4', '#90A955', '#ECF39E'],
		);
	});

	// The modes sit outside siteTheme (frontend/site.tsx), so a colour siteTheme set would win over
	// both and pin the page to one mode.
	it('hold every colour, and siteTheme none of them', () => {
		const shared = Object.keys(siteTheme['*'] as object).filter((key) => key in tokens(light) || key in tokens(dark));
		assert.deepEqual(shared, []);
	});

	it('set the same site colours, so a colour added to one is not missing from the other', () => {
		const ours = (mode: Mode): string[] => Object.keys(tokens(mode)).filter((key) => /^\$[a-z]/.test(key)).sort();
		assert.deepEqual(ours(light), ours(dark));
	});
});
