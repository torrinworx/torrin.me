import { Typography, Head, Theme, Style, Button, TextField, Observer, DropDown, Icons, Icon, Toggle, Slider } from 'destamatic-ui';

import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";

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
const theme = {
	'*': {
		fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
	},

	typography_body: {
		extends: 'typography',
		fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
		fontSize: 'clamp(1.0rem, 0.95rem + 0.35vw, 1.15rem)',
		lineHeight: '$lh_body',
		maxWidth: '$measure',
		fontWeight: '400',
	},

	divider: {
		width: '100%',
		height: '2px',
		background: 'black',
		margin: '10px 0px 10px 0px',
	},
};

const doneCheck = Observer.mutable(false);
doneCheck.watch(() => {
	if (doneCheck.get()) {
		setTimeout(() => {
			doneCheck.set(false);
		}, 1200);
	}
});

const disable_buttons = Observer.mutable(false);
const disable_textfields = Observer.mutable(false);
const disable_toggles = Observer.mutable(false);

const disable_slider = Observer.mutable(false);
const show_cover = Observer.mutable(true);
const expand_slider = Observer.mutable(false);

const hValue = Observer.mutable(50);
const vValue = Observer.mutable(50);

const step_value = Observer.mutable(1); // user types: 1, 5, 10, etc.
const slider_step = step_value.map(s => {
	const n = parseFloat(s);
	return Number.isFinite(n) && n > 0 ? n : 1;
});

const test = () => <Theme value={theme}>
	<Icons value={[IconifyIcons]} >
		<Head>
			<Style>
				{`
/* JetBrains Mono*/  

/* 100 Thin */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Thin.woff2") format("woff2");
  font-weight: 100;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-ThinItalic.woff2") format("woff2");
  font-weight: 100;
  font-style: italic;
  font-display: swap;
}  

/* 200 ExtraLight */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-ExtraLight.woff2") format("woff2");
  font-weight: 200;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-ExtraLightItalic.woff2") format("woff2");
  font-weight: 200;
  font-style: italic;
  font-display: swap;
}  

/* 300 Light */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Light.woff2") format("woff2");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-LightItalic.woff2") format("woff2");
  font-weight: 300;
  font-style: italic;
  font-display: swap;
}  

/* 400 Regular */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Italic.woff2") format("woff2");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}  

/* 500 Medium */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Medium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-MediumItalic.woff2") format("woff2");
  font-weight: 500;
  font-style: italic;
  font-display: swap;
}  

/* 600 SemiBold */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-SemiBold.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-SemiBoldItalic.woff2") format("woff2");
  font-weight: 600;
  font-style: italic;
  font-display: swap;
}  

/* 700 Bold */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-BoldItalic.woff2") format("woff2");
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}  

/* 800 ExtraBold */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-ExtraBold.woff2") format("woff2");
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/JetBrainsMono-2.304/fonts/webfonts/JetBrainsMono-ExtraBoldItalic.woff2") format("woff2");
  font-weight: 800;
  font-style: italic;
  font-display: swap;
}

/* IBM Plex Sans */

/* IBM Plex Sans (local woff2) */
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Thin.woff2") format("woff2");
  font-weight: 100;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-ThinItalic.woff2") format("woff2");
  font-weight: 100;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-ExtraLight.woff2") format("woff2");
  font-weight: 200;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-ExtraLightItalic.woff2") format("woff2");
  font-weight: 200;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Light.woff2") format("woff2");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-LightItalic.woff2") format("woff2");
  font-weight: 300;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Italic.woff2") format("woff2");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Text.woff2") format("woff2");
  font-weight: 450;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-TextItalic.woff2") format("woff2");
  font-weight: 450;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Medium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-MediumItalic.woff2") format("woff2");
  font-weight: 500;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-SemiBold.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-SemiBoldItalic.woff2") format("woff2");
  font-weight: 600;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "IBM Plex Sans";
  src: url("/ibm-plex-sans/woff2/IBMPlexSans-BoldItalic.woff2") format("woff2");
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}

html {
	-webkit-text-size-adjust: none;
	text-size-adjust: none;
}
body {
	margin: 16px;
	text-rendering: optimizeLegibility;
	-webkit-font-smoothing: antialiased; /* mostly macOS */
	-moz-osx-font-smoothing: grayscale;
}
		`}
			</Style>

			<DropDown
				label={<Typography type='p1' label='Typography' />}
				iconOpen={<Icon name="feather:chevron-up" />}
				iconClose={<Icon name="feather:chevron-down" />}
			>
				<div theme='column_center'>
					<Typography type='h1' label='Header' />
					<div theme='column_tight'>
						<Typography type='h2' label='Subheader' />
						<div theme='divider' />
						<Typography type='body' label={`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam condimentum quam ut pellentesque egestas. Nunc a purus nec dolor porttitor vestibulum. Sed tincidunt augue purus, a condimentum nunc tincidunt nec. Nulla facilisi. Cras vitae turpis sit amet lectus interdum sodales vel vitae urna. Vivamus lobortis tellus laoreet sollicitudin consequat. In eleifend vestibulum ipsum a ullamcorper.`} />
					</div>
					<div theme='column_tight'>
						<Typography type='h1_bold' label={`h1_bold: The quick brown fox jumps over the lazy dog.`} />
						<Typography type='h1_italic' label={`h1_italic: The quick brown fox jumps over the lazy dog.`} />
						<Typography type='h1' label={`h1: The quick brown fox jumps over the lazy dog.`} />
						<Typography type='h2' label={`h2: The quick brown fox jumps over the lazy dog.`} />
						<Typography type='body' label={`body: The quick brown fox jumps over the lazy dog.`} />
					</div>
				</div>
			</DropDown>
			<DropDown
				label={<Typography type='p1' label='Button' />}
				iconOpen={<Icon name="feather:chevron-up" />}
				iconClose={<Icon name="feather:chevron-down" />}
			>
				<div theme='row_fill_center' style={{ margin: 10 }}>
					<Typography type='p1' label='Disable Buttons: ' />
					<Toggle value={disable_buttons} />
				</div>

				<Typography type='h2' label='Contained' />
				<div theme='row_center_wrap'>
					<Button
						type="contained"
						label="Click Me"
						disabled={disable_buttons}
						onClick={() => { }}
					/>
					<Button
						type="contained"
						disabled={disable_buttons}
						iconPosition="right"
						label="Click Me"
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="contained"
						disabled={disable_buttons}
						iconPosition="left"
						label="Click Me"
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="contained_round"
						disabled={disable_buttons}
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="contained"
						disabled={disable_buttons}
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="contained"
						iconPosition="right"
						disabled={disable_buttons}
						label={doneCheck.map(c => (c ? "Done!" : "Delay"))}
						icon={doneCheck.map(c =>
							c ? <Icon name="feather:check" />
								: <Icon name="feather:upload" />
						)}
						onClick={async () => {
							disable_buttons.set(true)
							return new Promise(ok => setTimeout(() => { doneCheck.set(true); ok(); disable_buttons.set(false) }, 1000))
						}}
					/>
				</div>

				<Typography type='h2' label='Outlined ' />
				<div theme='row_center_wrap'>
					<Button
						type="outlined"
						label="Click Me"
						disabled={disable_buttons}
						onClick={() => { }}
					/>
					<Button
						type="outlined"
						disabled={disable_buttons}
						iconPosition="right"
						label="Click Me"
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="outlined"
						disabled={disable_buttons}
						iconPosition="left"
						label="Click Me"
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="outlined_round"
						disabled={disable_buttons}
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="outlined"
						disabled={disable_buttons}
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="outlined"
						iconPosition="right"
						disabled={disable_buttons}
						label={doneCheck.map(c => (c ? "Done!" : "Delay"))}
						icon={doneCheck.map(c =>
							c ? <Icon name="feather:check" />
								: <Icon name="feather:upload" />
						)}
						onClick={async () => {
							disable_buttons.set(true)
							return new Promise(ok => setTimeout(() => { doneCheck.set(true); ok(); disable_buttons.set(false) }, 1000))
						}}
					/>
				</div>

				<Typography type='h2' label='Text' />
				<div theme='row_center_wrap'>
					<Button
						type="text"
						label="Click Me"
						disabled={disable_buttons}
						onClick={() => { }}
					/>
					<Button
						type="text"
						disabled={disable_buttons}
						iconPosition="right"
						label="Click Me"
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="text"
						disabled={disable_buttons}
						iconPosition="left"
						label="Click Me"
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="text_round"
						disabled={disable_buttons}
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="text"
						disabled={disable_buttons}
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="text"
						iconPosition="right"
						disabled={disable_buttons}
						label={doneCheck.map(c => (c ? "Done!" : "Delay"))}
						icon={doneCheck.map(c =>
							c ? <Icon name="feather:check" />
								: <Icon name="feather:upload" />
						)}
						onClick={async () => {
							disable_buttons.set(true)
							return new Promise(ok => setTimeout(() => { doneCheck.set(true); ok(); disable_buttons.set(false) }, 1000))
						}}
					/>
				</div>

				<Typography type='h2' label='Link' />
				<div theme='row_center_wrap'>
					<Button
						type="link"
						label="Click Me"
						disabled={disable_buttons}
						onClick={() => { }}
					/>
					<Button
						type="link"
						disabled={disable_buttons}
						iconPosition="right"
						label="Click Me"
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="link"
						disabled={disable_buttons}
						iconPosition="left"
						label="Click Me"
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="link"
						disabled={disable_buttons}
						icon={<Icon name="feather:external-link" />}
						onClick={() => { }}
					/>
					<Button
						type="link"
						iconPosition="right"
						disabled={disable_buttons}
						label={doneCheck.map(c => (c ? "Done!" : "Delay"))}
						icon={doneCheck.map(c =>
							c ? <Icon name="feather:check" />
								: <Icon name="feather:upload" />
						)}
						onClick={async () => {
							disable_buttons.set(true)
							return new Promise(ok => setTimeout(() => { doneCheck.set(true); ok(); disable_buttons.set(false) }, 1000))
						}}
					/>
				</div>
			</DropDown>
			<DropDown
				label={<Typography type='p1' label='TextField' />}
				iconOpen={<Icon name="feather:chevron-up" />}
				iconClose={<Icon name="feather:chevron-down" />}
			>
				<div theme='row_fill_center' style={{ margin: 10 }}>
					<Typography type='p1' label='Disable TextFields: ' />
					<Toggle value={disable_textfields} />
				</div>

				<Typography type='h2' label='Contained' />
				<div theme='row_center_wrap'>
					<TextField
						type='contained'
						disabled={disable_textfields}
						placeholder='textfield'
						value={Observer.mutable('')}
					/>
				</div>

				<Typography type='h2' label='outlined' />
				<div theme='row_center_wrap'>
					<TextField
						type='outlined'
						disabled={disable_textfields}
						placeholder='textfield'
						value={Observer.mutable('')}
					/>
				</div>

				<Typography type='h2' label='text' />
				<div theme='row_center_wrap'>
					<TextField
						type='text'
						disabled={disable_textfields}
						placeholder='textfield'
						value={Observer.mutable('')}
					/>
				</div>
			</DropDown>
			<DropDown
				label={<Typography type='p1' label='Toggle' />}
				iconOpen={<Icon name="feather:chevron-up" />}
				iconClose={<Icon name="feather:chevron-down" />}
			>
				<div theme='row_fill_center' style={{ margin: 10 }}>
					<Typography type='p1' label='Disable Toggles: ' />
					<Toggle value={disable_toggles} />
				</div>

				<Typography type='h2' label='Contained' />
				<div theme='row_center_wrap'>
					<Toggle type='contained' value={Observer.mutable(false)} disabled={disable_toggles} />
				</div>

				<Typography type='h2' label='Outlined' />
				<div theme='row_center_wrap'>
					<Toggle type='outlined' value={Observer.mutable(false)} disabled={disable_toggles} />
				</div>
			</DropDown>

			<DropDown
				label={<Typography type='p1' label='Slider' />}
				iconOpen={<Icon name="feather:chevron-up" />}
				iconClose={<Icon name="feather:chevron-down" />}
			>
				<div theme='row_fill_center' style={{ margin: 10, gap: 20, flexWrap: 'wrap' }}>
					<div theme='row_center_wrap' style={{ gap: 8 }}>
						<Typography type='p1' label='Disabled:' />
						<Toggle value={disable_slider} />
					</div>

					<div theme='row_center_wrap' style={{ gap: 8 }}>
						<Typography type='p1' label='Cover:' />
						<Toggle value={show_cover} />
					</div>

					<div theme='row_center_wrap' style={{ gap: 8 }}>
						<Typography type='p1' label='Expand:' />
						<Toggle value={expand_slider} />
					</div>

					<div theme='row_center_wrap' style={{ gap: 8 }}>
						<Typography type='p1' label='Steps:' />
						<TextField
							type='outlined'
							value={step_value}
							disabled={disable_slider}
							placeholder='1'
							style={{ width: 80 }}
							inputMode='numeric'
						/>
						<Typography type='p1' label={slider_step.map(s => `step=${s}`)} />
					</div>
				</div>

				<Typography
					type='p1'
					label={Observer.all([hValue, vValue]).map(([h, v]) =>
						`Horizontal: ${Math.round(h)} | Vertical: ${Math.round(v)}`
					)}
				/>

				<Typography type='h2' label='Horizontal' />
				<div theme='row_fill_center' style={{ width: '100%' }}>
					<Slider
						type='horizontal'
						disabled={disable_slider}
						cover={show_cover}
						expand={expand_slider}
						value={hValue}
						step={slider_step}
						min={Observer.immutable(0)}
						max={Observer.immutable(100)}
					/>
				</div>

				<Typography type='h2' label='Vertical' />
				<div
					theme='row_center_wrap'
					style={{
						height: expand_slider.map(e => e ? 600 : null),
						padding: 10,
						boxSizing: 'border-box',
					}}
				>
					<Slider
						type='vertical'
						disabled={disable_slider}
						cover={show_cover}
						expand={expand_slider}
						value={vValue}
						step={slider_step}
						min={Observer.immutable(0)}
						max={Observer.immutable(100)}
					/>
				</div>
			</DropDown>
		</Head>
	</Icons>
</Theme>;

export default test;
