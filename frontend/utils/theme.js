import { OObject } from 'destamatic-ui'

const theme = OObject({
	'*': {
		fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',

	},

	primary: OObject({
		$color: '#4AA9FC',
		$color_hover: '$shiftBrightness($color, 0.1)',
		$color_error: 'red',
		$color_top: 'black',
		$color_background: '#0B3954',
	}),

	jetbrains: {
		fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
	},

	typography: {
		extends: 'jetbrains'
	},

	typography_body: {
		extends: 'typography',
		fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
		fontSize: 'clamp(1.0rem, 0.95rem + 0.35vw, 1.15rem)',
		lineHeight: '$lh_body',
		maxWidth: '$measure',
		fontWeight: '400',
	},

	button_link: {
		extends: 'typography_p1_regular',
		borderRadius: 'none',
		padding: 1,
		overflow: 'visible',
		color: '$color',
		textDecoration: 'underline',
	},

	divider: {
		marginTop: 10,
		marginBottom: 10
	},

	paper: {
		extends: 'radius_shadow_primary',
		background: '$color',
		color: '$contrast_text($color_top)',
		padding: 10,
		maxWidth: 'inherit',
		maxHeight: 'inherit',
	},
});

export default theme
