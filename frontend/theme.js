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
			$color: '#A30029',
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
			$color: '#6021c0',
			$color_hover: '$shiftBrightness($color, 0.1)',
			$color_error: 'red',
			$color_top: '$contrast_text($color)',
		},
		flow: {
			extends: 'primary',
			$color_text: '$color',
		},
	},
	'cyan': {
		primary: {
			$color: '#368F8B',
			$color_hover: '$shiftBrightness($color, 0.1)',
			$color_error: 'red',
			$color_top: '$contrast_text($color)',
		},
		flow: {
			extends: 'primary',
			$color_text: '$color',
		},
	},
	'gold': {
		primary: {
			$color: '#FABC2A',
			$color_hover: '$shiftBrightness($color, 0.1)',
			$color_error: 'red',
			$color_top: '$contrast_text($color)',
		},
		flow: {
			extends: 'primary',
			$color_text: '$color',
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
	},

	center: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},

	radius: {
		borderRadius: 20,
	},

	drawer: {
		extends: 'secondary',
		outlineColor: '$color',
		outlineWidth: 1,
		outlineStyle: 'solid',
	},

	disabled: {
		cursor: 'default',
		pointerEvents: 'none',
		backgroundColor: 'none',
	},
	disabledoverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		pointerEvents: 'none',
	},

	focusable: {
		borderStyle: 'solid',
		borderWidth: 0.5,
		borderColor: '$color',
		transitionDuration: '0.3s',
		transitionProperty: 'border-color, background-color, box-shadow',
	},

	field: {
		extends: 'primary_radius_typography_p1_regular_focusable',
		outline: 0,
		padding: 10,
		background: '$color_top',
		color: '$color_text',
	},

	focused: {
		boxShadow: '$color 0 0 0 0.2rem',
	},

	expand: {
		flexGrow: 1,
		height: '100%',
	},

	typography: {
		extends: 'secondary',
		color: '$color_top',
	},

	paper: {
        extends: 'radius',
        background: '$alpha($color, 0.2)',
        color: '$color_top',
        boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
        padding: 10,
        maxWidth: 'inherit',
        maxHeight: 'inherit',
        overflow: 'hidden',
        blur: "25px",
    },

	switchknob: {
        extends: 'secondary',
        position: 'absolute',
        width: '23px',
        height: '23px',
        background: '$color_top',
        borderRadius: '50%',
        transition: '100ms',
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

export const define = obj => atomic(() => {
	for (const o in obj) {
		if (o in theme) throw new Error("Theme.define: theme definition already exists: " + o);
		theme[o] = obj[o];
	}
});

export default theme;
