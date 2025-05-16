import { atomic } from 'destam/Network';
import { OObject, Observer } from 'destam-dom';

const colors = {
	$color_white: '#D6D6D6',
	$color_black: '#141414',
	$color_red: '#A30029',
	$color_purple: '#6021c0',
	$color_cyan: '#368F8B',
	$color_gold: '#FABC2A',
};

const colorModes = {
	red: {
		$color: colors.$color_red,
	},
	purple: {
		$color: colors.$color_purple,
	},
	cyan: {
		$color: colors.$color_cyan,
	},
	gold: {
		$color: colors.$color_gold,
	},
};

const themeModes = {
	light: {
		$color_main: colors.$color_white,
		$color_text: '$color',
		$color_top: '$color',
		$color_hover: '$shiftBrightness($color_white, 0.1)',
		$color_hover_top: colors.$color_white,
	},

	dark: {
		$color_main: '$color',
		$color_text: colors.$color_white,
		$color_top: colors.$color_white,
		$color_hover: '$shiftBrightness($color_white, 0.1)',
		$color_hover_top: colors.$color_white,
	},
};

const transition = '250ms ease-in-out';

const theme = OObject({
	'*': OObject({
		fontFamily: 'IBM Plex Sans',
		fontWeight: 600,
		boxSizing: 'border-box',
		transition: `opacity ${transition}, box-shadow ${transition}, background-color ${transition}, color ${transition}, border-color ${transition}`,
		...colors,
	}),

	center: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},

	radius: {
		borderRadius: 20,
	},

	paper: {
		background: '$alpha($color, 0.2)',
		boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
		padding: 10,
		maxWidth: 'inherit',
		maxHeight: 'inherit',
		blur: '25px',
	},

	// The issue with the gradient not updating to the right color isn't an issue with the theme,
	// because other components like typography work just fine with updating $color_text.
	// it's specifically an issue with how gradient is setup to react to variable changes
	// in the theme.
	gradient: OObject({
		extends: ['*'],
		$gradientCSS: 'linear-gradient(to top right, $color_main, $color_top)',
	}),

	typography: {
		color: '$color_text',
		display: 'block'
	},
	typography_h1: {
		color: '$color_text',
		fontSize: 62
	},
	typography_h2: {
		color: '$color_text',
		fontSize: 56
	},
	typography_h3: {
		color: '$color_text',
		fontSize: 36
	},
	typography_h4: {
		color: '$color_text',
		fontSize: 30
	},
	typography_h5: {
		color: '$color_text',
		fontSize: 24
	},
	typography_h6: {
		color: '$color_text',
		fontSize: 20
	},
	typography_p1: {
		color: '$color_text',
		fontSize: 16
	},
	typography_p2: {
		color: '$color_text',
		fontSize: 14
	},
});

window.colorMode = Observer.mutable('red');
window.themeMode = Observer.mutable(window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
window.theme = theme;

window.colorMode.effect(color => atomic(() => {
	for (const [key, val] of Object.entries(colorModes[color])) {
		theme['*'][key] = val;
	}
}));

window.themeMode.effect(mode => atomic(() => {
	mode = mode ? 'dark' : 'light'; // if mode is true => dark mode, else false => light mode
	for (const [key, val] of Object.entries(themeModes[mode])) {
		theme['*'][key] = val;
	}
}));

export default {
	theme,
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
