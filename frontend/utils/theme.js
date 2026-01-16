import { OObject } from 'destamatic-ui'

/*
Notes on theme and styles:

JetBrains Mono is used for headers, and any text used in inputs like button labels.

IBM Plex Sans is used for paragraph text.

Purposefully chose only three typography styles for simplicity:
h1: main hero style headers
h2: sub headers/content headers to be used inside text content
body: text body content

This drastically reduces the multiplicity of font sizes around the site that need to be
worried about.
*/

const theme = OObject({
	'*': {
		fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',

	},

	primary: OObject({
		$color: '#4AA9FC',
		$color_error: 'red',
		$color_top: 'black',
	}),

	antiPrimary: OObject({
		$color: 'white',
		$color_top: '#4AA9FC',
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
