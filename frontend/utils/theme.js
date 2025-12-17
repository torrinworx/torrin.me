import color from 'destamatic-ui/util/color';
import { OObject, Observer, atomic } from 'destamatic-ui'
import SimpleIcons from "destamatic-ui/components/icons/SimpleIcons/SimpleIcons";
import FeatherIcons from "destamatic-ui/components/icons/FeatherIcons/FeatherIcons";
import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";


const transformHSV = callback => (c, ...params) => {
	let [r, g, b, a] = color(c);
	let [h, s, v] = color.rgbToHsv(r, g, b);

	[h, s, v] = callback(h, s, v, ...params.map(p => parseFloat(p)));

	[r, g, b] = color.hsvToRgb(h, s, v);
	return color.toCSS([r, g, b, a]);
};

const math = cb => (a, b) => {
	return String(cb(parseFloat(a), parseFloat(b)));
};

const luminance = (r, g, b) => {
	const adjust = (value) => {
		return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
	};

	return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);
};

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);


const mainColors = {
	$color_white: '#D6D6D6',
	$color_black: '#141414',
	$color_red: '#A30029',
	$color_purple: '#6021c0',
	$color_cyan: '#368F8B',
	$color_gold: '#FABC2A',
};

const colorModes = {
	red: {
		$color: mainColors.$color_red,
	},
	purple: {
		$color: mainColors.$color_purple,
	},
	cyan: {
		$color: mainColors.$color_cyan,
	},
	gold: {
		$color: mainColors.$color_gold,
	},
};

const themeModes = {
	light: {
		$color_main: '$color',
		$color_text: '$contrast_text($color)',
		$color_top: '$contrast_text($color)',
		$color_hover_top: '$color_white',
		$color_grad_tr: '$color_white',
		$color_grad_bl: '$color',
	},

	dark: {
		$color_main: '$color',
		$color_text: '$contrast_text($color)',
		$color_top: '$contrast_text($color)',
		$color_hover_top: '$color_white',
		$color_grad_tr: '$color_black',
		$color_grad_bl: '$color',
	}
};

const transition = '250ms ease-in-out';

const theme = OObject({
	'*': OObject({
		// _fontFace_IBMPlexSansNormal: {
		// 	fontFamily: 'IBM Plex Sans',
		// 	fontStyle: 'normal',
		// 	fontWeight: '100 700',
		// 	fontStretch: '100%',
		// 	fontDisplay: 'swap',
		// 	src: "url('/IBM_Plex_Sans/IBMPlexSans-VariableFont_wdth,wght.ttf') format('truetype')"
		// },
		// _fontFace_IBMPlexSansItalic: {
		// 	fontFamily: 'IBM Plex Sans',
		// 	fontStyle: 'italic',
		// 	fontWeight: '100 700',
		// 	fontStretch: '100%',
		// 	fontDisplay: 'swap',
		// 	src: "url('/IBM_Plex_Sans/IBMPlexSans-Italic-VariableFont_wdth,wght.ttf') format('truetype')"
		// },
		fontFamily: 'IBM Plex Sans',
		fontWeight: 500,
		fontSize: '100%',
		boxSizing: 'border-box',
		transition: `opacity ${transition}, box-shadow ${transition}, background-color ${transition}, color ${transition}, border-color ${transition}, stroke ${transition}, fill ${transition}`,
		$shiftBrightness: transformHSV((h, s, v, amount) => {
			if (v > 0.5) {
				v -= amount;
			} else {
				v += amount;
			}

			return [h, s, v];
		}),

		/*
		Adjusts the saturation of the input colour by shifting it's value in the HSV colour space. Accepts colours
		in hexadecimal, RGB, or HSV.
		*/
		$saturate: transformHSV((h, s, v, amount) => {
			return [h, clamp(s + amount, 0, 1), v];
		}),

		/*
		Adjusts the hue of the input colour by shifting it's value in the HSV colour space. Accepts colours in
		hexadecimal, RGB, or HSV.
		*/
		$hue: transformHSV((h, s, v, amount) => {
			return [clamp(h + amount, 0, 1), s, v];
		}),

		$brightness: transformHSV((h, s, v, amount) => {
			return [h, s, clamp(v + amount, 0, 1)];
		}),

		/*
		Inverts the RGB components of the input colour. Accepts colours in hexadecimal, RGB, or HSV.
		*/
		$invert: (c) => {
			let [r, g, b, a] = color(c);
			return color.toCSS([1 - r, 1 - g, 1 - b, a]);
		},

		/*
		Applies an alpha (transparency) value to the input colour. Accepts colours in hexadecimal, RGB, or HSV.
		*/
		$alpha: (c, amount) => {
			let [r, g, b] = color(c);
			return color.toCSS([r, g, b, parseFloat(amount)]);
		},

		/*
		Computes a contrast color (black or white) based on the luminance of the input colour to ensure readability
		compliant with WCAG 2.0 AAA standards. Accepts colours in hexadecimal, RGB, or HSV.
		*/
		$contrast_text: (c, ...colors) => {
			if (colors.length === 0) colors = ['white', 'black'];

			const [r, g, b, a] = color(c);
			const backgroundLuminance = luminance(r, g, b);

			let bestColor;
			let bestContrast = 0;
			for (const colorCompare of colors) {
				const [r, g, b] = color(colorCompare);
				const contrast = Math.abs(backgroundLuminance - luminance(r, g, b));

				if (bestContrast <= contrast) {
					bestContrast = contrast;
					bestColor = [r, g, b, a];
				}
			}

			return color.toCSS(bestColor);
		},

		$add: math((a, b) => a + b),
		$sub: math((a, b) => a - b),
		$div: math((a, b) => a / b),
		$mul: math((a, b) => a * b),
		$mod: math((a, b) => a % b),
		$min: math(Math.min),
		$max: math(Math.max),
		$floor: a => String(Math.floor(parseFloat(a))),
		$ceil: a => String(Math.ceil(parseFloat(a))),
		$round: a => String(Math.round(parseFloat(a))),
		$if: (cond, a, b) => parseFloat(cond) ? a : b,
		...mainColors,
	}),

	white: {
		$color: '$color_white',
	},
	black: {
		$color: '$color_black',
	},
	red: {
		$color: '$color_red',
	},
	purple: {
		$color: '$color_purple',
	},
	cyan: {
		$color: '$color_cyan',
	},
	gold: {
		$color: '$color_gold',
	},

	// Override destamatic-ui primary theme
	primary: {
		$color: '$color_main',
		$color_text: '$contrast_text($color_main)',
		$color_top: '$contrast_text($color_main)',
		$color_hover: '$saturate($shiftBrightness($color_main, -.3), -.3)',
	},

	gradient: OObject({
		extends: ['*'],
		$gradientCSS: 'linear-gradient(to top right, $color_grad_bl, $color_grad_tr)',
	}),

	shadow: {
		boxShadow: '4px 4px 10px $alpha($color_top, 0.2)',
	},

	paper: {
		extends: ['*', 'radius',],
		color: '$color_main',
		background: '$alpha($color_main, 0.4)',
		backdropFilter: 'blur(25px)',
		padding: 40,
		gap: 40,
		maxWidth: 1000
	},

	radius: {
		borderRadius: 16
	},

	toggle: {
		display: 'flex',
		alignItems: 'center',
		cursor: 'pointer',
		overflow: 'clip',
		position: 'relative',
		width: '60px',
		height: '30px',
		background: '$color_top',
		borderRadius: '37.5px',
	},

	toggle_hovered: {
		background: '$color_hover'
	},

	toggleknob: {
		position: 'absolute',
		top: '50%',
		transform: 'translateX(4px) translateY(-50%) scale(1)',
		width: '23px',
		height: '23px',
		background: '$color_main',
		borderRadius: '50%',
		transition: 'transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1), background-color 150ms ease-in-out',
	},

	typography: { color: '$color_text' },
	typography_h1: {
		color: '$color_text',
		fontSize: 'clamp(2rem, 2vw + 1rem, 3.5rem)',
	},
	typography_h2: {
		color: '$color_text',
		fontSize: 'clamp(1.75rem, 1.75vw + 0.875rem, 3rem)',
	},
	typography_h3: {
		color: '$color_text',
		fontSize: 'clamp(1.5rem, 1.5vw + 0.75rem, 2.5rem)',
	},
	typography_h4: {
		color: '$color_text',
		fontSize: 'clamp(1.25rem, 1.25vw + 0.625rem, 2rem)',
	},
	typography_h5: {
		color: '$color_text',
		fontSize: 'clamp(1rem, 1vw + 0.5rem, 1.75rem)'
	},
	typography_h6: {
		color: '$color_text',
		fontSize: 'clamp(0.875rem, 0.875vw + 0.4375rem, 1.5rem)',
	},
	typography_p1: {
		color: '$color_text',
		fontSize: 'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)',
	},
	typography_p2: {
		color: '$color_text',
		fontSize: 'clamp(0.625rem, 0.625vw + 0.3125rem, 1rem)',
	},
	typography_regular: { fontStyle: 'normal' },
	typography_bold: { fontWeight: 'bold' },
	typography_italic: { fontStyle: 'italic' },
	typography_center: { textAlign: 'center' },
	typography_inline: { display: 'inline' },

	button: {
		extends: 'center_radius',
		padding: '10px 15px',
		userSelect: 'none',
		border: 'none',
		cursor: 'pointer',
		textDecoration: 'none',
		position: 'relative',
		overflow: 'clip',
		color: '$color_top',
		boxShadow: 'none',
		background: 'none',
		_cssProp_focus: { outline: 'none' },
	},

	button_text_hovered: {
		background: 'none',
		color: '$color_hover'
	},

	button_contained: {
		extends: 'typography_p1_bold',
		color: '$color_top',
		background: '$alpha($color_main, 0.4)',
		backdropFilter: 'blur(25px)',
	},

	button_contained_hovered: {
		background: '$color_top',
		color: '$color_hover'
	},

	button_outlined: {
		extends: 'typography_p1_bold',
		borderWidth: 2,
		borderStyle: 'solid',
		borderColor: '$color_top',
		color: '$color_top',
	},

	button_outlined_hovered: {
		color: '$color_hover',
		borderColor: '$color_hover',
	},

	button_outlined_disabled: {
		borderColor: '$saturate($color, -1)',
		color: '$saturate($color, -1)',
	},

	button_contained_disabled: {
		$bg: '$saturate($color, -1)',
		background: '$bg',
		color: '$contrast_text($bg)',
	},

	button_icon: {
		color: '$color_top',
	},

	button_icon_hovered: {
		color: '$color_hover',
	},

	text: {
		extends: 'typography_p1_regular',
		color: '$color_top'
	},

	text_hovered: {
		color: '$color_hover'
	},

	focusable: {
		borderStyle: 'solid',
		borderWidth: 2,
		borderColor: '$color_top',
		transitionDuration: '0.3s',
		transitionProperty: 'border-color, background-color, box-shadow',
	},

	focused: {
		boxShadow: '$color_hover 0 0 0 0.2rem',
	},

	field: {
		extends: 'radius_typography_p1_regular_focusable',
		outline: 0,
		padding: 10,
		background: '$color_main',
		color: '$color_top',
	},

	loadingDots_dot: {
		_keyframes_animationName: `
			0%, 100% { opacity: 0; }
			50% { opacity: 1; }
		`,

		background: '$color_top',
		display: 'inline-block',
		width: 'clamp(0.3rem, 0.6vw, 0.6rem)',
		height: 'clamp(0.3rem, 0.6vw, 0.6rem)',
		borderRadius: '50%',
		animationName: '$animationName',
		animationDuration: '1s',
		animationIterationCount: 'infinite',
		animationTimingFunction: 'ease-in-out',
		margin: '10px 4px',
	},

	page: {
		background: '$color_main',
		padding: '20px',
		gap: '40px',
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		minHeight: '100vh'
	},
	pages: {
		extends: 'column_center',
		padding: '10vh clamp(0rem, 10vw, 0rem)',
		gap: '3vh',
	},
	divider: {
		width: '100%',
		height: '2px',
		background: '$color_text',
		margin: '10px 0px 10px 0px',
	},

	slider: {
		$size: 25,
		$trackSize: 8,
		position: 'relative',
	},

	slider_horizontal: {
		$movementAnchor: 'left',
		$eventAnchor: 'clientX',
		$sizeAnchor: 'width',
		width: '100%',
		height: '$size$px',
	},

	slider_vertical: {
		$movementAnchor: 'top',
		$eventAnchor: 'clientY',
		$sizeAnchor: 'height',

		width: '$size$px',
		height: '100%',
	},

	slider_track: {
		background: '$saturate($shiftBrightness($color_top, 0.1), -1)',

		position: 'absolute',
		borderRadius: '$div($trackSize, 2)px',
		cursor: 'pointer',
	},

	slider_track_active: {
		pointerEvents: 'none',
		position: 'absolute',
		transition: 'width ease-in-out 100ms, height ease-in-out 100ms',
		background: '$shiftBrightness($color_top, 0.1)',
	},

	slider_vertical_track_active: {
		top: 0,
	},

	slider_horizontal_track_active: {
		left: 0,
	},

	slider_horizontal_track: {
		top: '50%',
		width: '100%',
		height: '$trackSize$px',
		transform: 'translateY(-50%)',
	},

	slider_vertical_track: {
		left: '50%',
		width: '$trackSize$px',
		height: '100%',
		transform: 'translateX(-50%)',
	},

	slider_track_hovered: {
		background: '$shiftBrightness($color_hover, 0.1)',
	},

	slider_thumb: {
		width: `$size$px`,
		height: `$size$px`,
		background: '$color',

		position: 'absolute',
		borderRadius: '50%',
		cursor: 'pointer',
	},

	slider_horizontal_thumb: {
		top: '50%',
		transform: 'translateY(-50%)'
	},

	slider_vertical_thumb: {
		left: '50%',
		transform: 'translateX(-50%)'
	},

	slider_thumb_hovered: {
		background: '$color_hover',
	},
});

window.colorMode = Observer.mutable('red');
window.themeMode = Observer.mutable(true);
window.theme = theme;

window.colorMode.effect(color => {
	for (const [key, val] of Object.entries(colorModes[color])) {
		theme['*'][key] = val;
	}
});

window.themeMode.effect(mode => atomic(() => {
	mode = mode ? 'dark' : 'light'; // if mode is true => dark mode, else false => light mode
	for (const [key, val] of Object.entries(themeModes[mode])) {
		theme['*'][key] = val;
	}
}));

export default {
	theme,
	icons: [{
		linkedinFI: FeatherIcons('linkedin'),
		gitlabFI: FeatherIcons('gitlab'),
		githubFI: FeatherIcons('github'),
	},
		FeatherIcons,
		SimpleIcons,
		IconifyIcons,
	],
	define: (...args) => atomic(() => {
		let prefix = '';
		let i = 0;

		for (; i < args.length; i++) {
			if (typeof args[i] === 'string') {
				prefix += args[i] + '_';
			} else {
				break;
			}
		}

		const obj = args[i];
		for (const o in obj) {
			let name;
			if (o === '*') {
				name = prefix.substring(0, prefix.length - 1);
			} else {
				name = prefix + o;
			}

			if (name in theme) throw new Error('Theme.define: theme definition already exists: ' + o);
			theme[name] = obj[o];
		}
	}),
};
