import { atomic } from "destam/Network";
import { OObject, Observer } from "destam-dom";

// Theme only affects secondary color, primary color is the main color from the list
const themeModes = {
	'light': {
		secondary: {
			$color: "#D6D6D6",
			$color_hover: '$shiftBrightness($color, 0.1)',
			$color_error: 'red',
			$color_top: '$contrast_text($color)',
		},
	},
	'dark': {
		secondary: {
			$color: "#141414",
			$color_hover: '$shiftBrightness($color, 0.1)',
			$color_error: 'red',
			$color_top: '$contrast_text($color)',
		},
	}
};

const colorModes = {
	'red': {
		primary: {
			$color: '$color_red',
			$color_hover: '$shiftBrightness($color, 0.1)',
			$color_error: 'red',
			$color_top: '$contrast_text($color)',
		},
		flow: {
			extends: 'primary',
			$color_text: '$color',
		},
	},
	'purple': {
		primary: {
			$color: '$color_purple',
			$color_hover: '$shiftBrightness($color, 0.1)',
			$color_error: 'red',
			$color_top: '$contrast_text($color)',
		},
	},
	'cyan': {
		primary: {
			$color: '$color_cyan',
			$color_hover: '$shiftBrightness($color, 0.1)',
			$color_error: 'red',
			$color_top: '$contrast_text($color)',
		},
	},
	'gold': {
		primary: {
			$color: '$color_gold',
			$color_hover: '$shiftBrightness($color, 0.1)',
			$color_error: 'red',
			$color_top: '$contrast_text($color)',
		},
	},
};

const theme = OObject({
	"*": {
        fontFamily: 'IBM Plex Sans',
        fontWeight: 600,
		boxSizing: 'border-box',
		transition: 'opacity 250ms ease-out, box-shadow 250ms ease-out, background-color 250ms ease-in-out',
		$color_text: 'black',
		$color_red: '#A30029',
		$color_purple: '#6021c0',
		$color_cyan: '#368F8B',
		$color_gold: '#FABC2A',
	},

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
        blur: "25px",
    },
});

window.colorMode = Observer.mutable('red');
window.themeMode = Observer.mutable(window.matchMedia("(prefers-color-scheme:dark)").matches ? 'dark' : 'light');
window.theme = theme;

window.colorMode.effect(color => atomic(() => {
	for (const [key, val] of Object.entries(colorModes[color])) {
		theme[key] = OObject(val);
	}
}));

window.themeMode.effect(mode => atomic(() => {
	for (const [key, val] of Object.entries(themeModes[mode])) {
		theme[key] = OObject(val);
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

			if (name in theme) throw new Error("Theme.define: theme definition already exists: " + o);
			theme[name] = obj[o];
		}
	}),
};
