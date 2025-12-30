import { OObject } from 'destamatic-ui'

const theme = OObject({
	'*': {
		fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
	},

	primary: OObject({
		$color: '#4AA9FC',
		$color_hover: '$shiftBrightness($color, 0.1)',
		$color_error: 'red',
		$color_top: 'black',
		$color_background: '#0B3954',
	}),

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
});

export default theme
