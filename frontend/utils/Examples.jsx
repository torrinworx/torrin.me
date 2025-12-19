import { } from 'destam';
import color from 'destamatic-ui/util/color';
import {
	Paper,
	Typography,
	Button,
	Icon,
	ColorPicker,
	Checkbox,
	Slider,
	Theme,
	ThemeContext,
	LoadingDots,
	Toggle,
	TextField,
	Shown,
	Date as DateComponent,
	TextArea,
	FileDrop,
	Radio,
	TextModifiers,
	RichField,
	RichArea,
	is_node,
	suspend,
	Validate,
	ValidateContext,
	Switch,
	useRipples,
	Observer,
	OObject,
	OArray,
	Icons,
} from 'destamatic-ui';

import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";

// import TypographyExample from "destamatic-ui/components/display/Typography/typography.example.jsx?raw";
// import ButtonExample from "destamatic-ui/components/inputs/Button/button.example.jsx?raw";
// import CheckboxExample from 'destamatic-ui/components/inputs/Checkbox/checkbox.example.jsx?raw';
// import ThemeExample from 'destamatic-ui/components/utils/Theme/theme.example.jsx?raw';

const examples = [
	{
		title: 'Button',
		category: 'inputs',
		description: 'Versatile button component with contained, outlined, icon, loading, and async states for UI actions.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Button.jsx',
		component: () => {
			const doneCheck = Observer.mutable(false);
			doneCheck.watch(() => {
				if (doneCheck.get()) {
					setTimeout(() => {
						doneCheck.set(false);
					}, 1200);
				}
			});

			return <div
				style={{
					display: 'flex',
					flexDirection: 'row',
					flexWrap: 'wrap',
					gap: 10,
				}}
			>
				<Button type="contained" label="Contained" onClick={() => { }} />
				<Button type="outlined" label="Outlined" onClick={() => { }} />
				<Button type="text" label="Text" onClick={() => { }} />
				<Button
					type="contained"
					iconPosition="right"
					label="Download"
					icon={<Icon name="download" size="clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)" />}
					onClick={() => { }}
				/>
				<Button
					type="outlined"
					icon={<Icon name="upload" size="clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)" />}
					onClick={() => { }}
				/>
				<Button type="outlined" icon={<LoadingDots />} onClick={() => { }} />
				<Button
					type="outlined"
					iconPosition="right"
					label={doneCheck.map(c => (c ? "Done!" : "Delay"))}
					icon={doneCheck.map(c =>
						c ? (
							<Icon name="check" style={{ fill: "none" }} size="clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)" />
						) : (
							<Icon
								name="upload"
								style={{ fill: "none", marginLeft: 5 }}
								size="clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)"
							/>
						)
					)}
					onClick={async () => new Promise(ok => setTimeout(() => { doneCheck.set(true); ok(); }, 800))}
				/>
				<Button type="contained" label="Disabled" onClick={() => { }} disabled />
			</div>;
		},
	},
	{
		title: 'Checkbox',
		category: 'inputs',
		description: 'Modern checkbox group with reactive state management, ideal for dynamic forms, filters, and multi-select options.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Checkbox.jsx',
		component: () => {
			const checkboxCount = Observer.mutable(0);
			return <div theme='column_center'>
				<Typography
					type='p1'
					label={checkboxCount.map(c => `Boxes checked: ${c}`)}
				/>

				<div theme='column'>
					{Array.from({ length: 8 }).map(() => <div theme='row'>{Array.from({ length: 8 }).map(() => Observer.mutable(false)).map(box =>

						<Checkbox
							value={box}
							onChange={val => {
								if (val) {
									checkboxCount.set(checkboxCount.get() + 1);
									setTimeout(() => {
										if (box.get()) {
											box.set(false);
											checkboxCount.set(checkboxCount.get() - 1);
										}
									}, 5000);
								} else {
									checkboxCount.set(checkboxCount.get() - 1);
								}
							}}
						/>
					)}</div>)}
				</div>
			</div>;
		},
	},
	{
		title: 'ColorPicker',
		category: 'inputs',
		description: 'Intuitive color picker with live theme binding, perfect for custom branding, design tools, and UI personalization.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/ColorPicker.jsx',
		component: () => {
			const specialTheme = OObject({
				special: OObject({
					transition: 'none',
					$color_text: '$contrast_text($color)'
				})
			});

			return <div theme='column_center'>
				<Theme value={specialTheme}>
					<ThemeContext value="special">
						<Typography type='h4' label='Hello World!' />
					</ThemeContext>
				</Theme>

				<div theme='row_fill_center' style={{ gap: 20 }}>
					<ColorPicker value={specialTheme.observer.path(['special', '$color_text']).setter((val, set) => set(color.toCSS(val)))} />
					<ColorPicker value={specialTheme.observer.path(['special', '$color_text']).setter((val, set) => set(color.toCSS(val)))} />
				</div>
			</div>
		},
	},
	{
		title: 'Country',
		category: 'inputs',
		disabled: true,
		description: '',
		componentUrl: '',
		component: () => { },
	},
	{
		title: 'Date',
		category: 'inputs',
		description: 'Scrollable date picker with rich theming and programmatic control, great for booking, scheduling, and forms.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Date.jsx',
		component: () => {
			const date = Observer.mutable(new Date());
			const fmt = d =>
				`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

			return <div theme='column_center' style={{ gap: 10 }}>
				<Typography
					type='p1'
					label={date.map(d => `Selected date: 📅 ${fmt(d)}`)}
				/>

				<DateComponent value={date} />

				<div theme='row' style={{ gap: 10 }}>
					<Button
						type='outlined'
						label='Today'
						onClick={() => date.set(new Date())}
					/>
					<Button
						type='contained'
						label='Advance 1 year'
						onClick={() => {
							const d = new Date(date.get());
							d.setFullYear(d.getFullYear() + 1);
							date.set(d);
						}}
					/>
				</div>

				<Typography
					type='p2'
					label={date.map(d => d.toString())}
				/>
			</div>;
		},
	},
	{
		title: 'Slider',
		category: 'inputs',
		description: 'Smooth, responsive slider control for numeric input, ranges, and real-time value adjustments in your UI.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Slider.jsx',
		component: () => {
			const sliderValue1 = Observer.mutable(50);
			const sliderValue2 = Observer.mutable(25);
			const sliderValue3 = Observer.mutable(75);

			return <>
				<div theme='column_center'>
					<Typography
						type='h4'
						label={Observer
							.all([sliderValue1, sliderValue2, sliderValue3])
							.map(([s1, s2, s3]) =>
								`${Math.trunc(s1)} ${Math.trunc(s2)} ${Math.trunc(s3)}`
							)}
					/>
				</div>
				<div
					theme='column_fill'
					style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}
				>
					<Slider min={0} max={100} value={sliderValue1} />
					<Slider min={0} max={100} value={sliderValue2} />
					<Slider min={0} max={100} value={sliderValue3} />
				</div>
			</>;
		},
	},
	{
		title: 'Toggle',
		category: 'inputs',
		description: 'Accessible toggle switch for on/off settings, dark mode, feature flags, and quick configuration controls.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Toggle.jsx',
		component: () => {
			const toggle1 = Observer.mutable(false);
			const toggle2 = Observer.mutable(true);

			return <div
				theme='column_center'
				style={{
					gap: 16,
					userSelect: 'none',
					WebkitUserSelect: 'none',
					MozUserSelect: 'none',
					msUserSelect: 'none',
				}}
			>
				<Typography
					type='p1'
					label={Observer
						.all([toggle1, toggle2])
						.map(([t1, t2]) =>
							`${t1 ? '✅' : '❌'} | ${t2 ? '✅' : '❌'}`
						)}
				/>

				<div theme='row' style={{ gap: 20, alignItems: 'center' }}>
					<div theme='column_center'>
						<Typography
							type='p2'
							label={toggle1.map(v => `Default: ${v ? '🔓' : '🔒'}`)}
						/>
						<Toggle value={toggle1} />
					</div>

					<div theme='column_center'>
						<Typography
							type='p2'
							label={toggle2.map(v => `Primary: ${v ? '🌞' : '🌙'}`)}
						/>
						<Toggle value={toggle2} type='primary' />
					</div>

					<div theme='column_center'>
						<Typography type='p2' label='Disabled: 🚫' />
						<Toggle value={Observer.immutable(true)} disabled />
					</div>
				</div>
			</div>;
		},
	},
	{
		title: 'TextField',
		category: 'inputs',
		description: 'Flexible text input component with password support, controlled focus, and keyboard-friendly submit handling.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/TextField.jsx',
		component: () => {
			const text = Observer.mutable('');
			const password = Observer.mutable('');
			const focused = Observer.mutable(false);
			const submitted = Observer.mutable(false);
			const submit = () => {
				submitted.set(true);
				setTimeout(() => submitted.set(false), 1200);
			};

			return <div theme='column_center' style={{ gap: 16, maxWidth: 400 }}>
				<Typography type='p1' label={text} />
				<Shown value={submitted}>
					<Typography
						type='h4'
						label='Submitted!'
						style={{ textAlign: 'center' }}
					/>
				</Shown>


				<div theme='column_fill' style={{ gap: 10 }}>
					<TextField
						placeholder='Type something...'
						value={text}
						onEnter={submit}
					/>

					<TextField
						placeholder='Password'
						type='password'
						value={password}
						onEnter={submit}
					/>

					<div theme='row' style={{ gap: 10, alignItems: 'center' }}>
						<TextField
							placeholder='Click button to focus me'
							value={Observer.mutable('')}
							focused={focused}
							onEnter={submit}
						/>
						<Button
							type='outlined'
							label='Focus'
							onClick={() => focused.set(true)}
						/>
					</div>
				</div>
			</div>;
		},
	},
	{
		title: 'TextArea',
		category: 'inputs',
		description: 'Auto-resizing multiline textarea with max-height control, ideal for comments, descriptions, and long-form input.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/TextArea.jsx',
		component: () => {
			const text = Observer.mutable('This is a multiline textarea.\nTry typing more to see it grow.');
			const focused = Observer.mutable(false);
			return <div theme='column_center' style={{ gap: 16, maxWidth: 500 }}>
				<Typography
					type='p2'
					label={text.map(t => `Length: ${t.length}`)}
				/>

				<TextArea
					placeholder='Type your message here...'
					value={text}
					maxHeight={200}
					style={{ width: '100%' }}
				/>

				<div theme='row' style={{ gap: 10, alignItems: 'center' }}>
					<TextArea
						placeholder='Click "Focus" to focus me'
						value={Observer.mutable('')}
						focused={focused}
						style={{ width: '100%' }}
					/>
					<Button
						type='outlined'
						label='Focus'
						onClick={() => focused.set(true)}
					/>
				</div>
			</div>;
		},
	},
	// {
	// 	title: 'Map',
	// 	// disabled: is_node(),
	// 	disabled: true, // TODO: Fix async import issue because leaflet doesn't work with ssg.
	// 	category: 'inputs',
	// 	description: 'Interactive Leaflet map with click-to-set location, zoom, and geolocation support for location-aware apps.',
	// 	componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Map.jsx',
	// 	component: suspend(LoadingDots, async () => {
	// 		let Map = (await import('destamatic-ui/components/inputs/Map')).default;
	// 		const location = Observer.mutable({ lat: 43.4643, lng: -80.5204 });

	// 		return <div theme='column_center' style={{ gap: 10, width: '100%' }}>
	// 			<Typography
	// 				type='p1'
	// 				label={location.map(loc =>
	// 					`Location: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
	// 				)}
	// 			/>

	// 			<div style={{ width: '100%', height: '1000px', position: 'relative' }}>
	// 				<Map location={location} />
	// 			</div>

	// 			<div theme='row' style={{ gap: 10 }}>
	// 				<Button
	// 					type='outlined'
	// 					label='Reset'
	// 					onClick={() => location.set({ lat: 43.4643, lng: -80.5204 })}
	// 				/>
	// 			</div>
	// 		</div>;
	// 	}),
	// },
	{
		title: 'Radio',
		category: 'inputs',
		description: 'Simple, accessible radio group for single-select options, powered by a shared observable state.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Radio.jsx',
		component: () => {
			const selected = Observer.mutable(1);
			const RadioGroup = Radio(selected);

			const options = [
				{ value: 0, label: 'Option A' },
				{ value: 1, label: 'Option B' },
				{ value: 2, label: 'Option C' },
				{ value: 3, label: 'No label example (icon only)' },
			];

			return <div theme='column_center' style={{ gap: 16 }}>
				<Typography
					type='p1'
					label={selected.map(v => `Selected: ${v}`)}
				/>

				<div theme='column_fill' style={{ gap: 10 }}>
					{options.map(o => (
						<RadioGroup
							key={o.value}
							value={o.value}
							label={o.value === 3 ? null : o.label}
						/>
					))}
				</div>

				<div theme='row' style={{ gap: 10 }}>
					<Button
						type='outlined'
						label='Select A'
						onClick={() => selected.set(0)}
					/>
					<Button
						type='outlined'
						label='Select C'
						onClick={() => selected.set(2)}
					/>
				</div>
			</div>;
		},
	},
	{
		title: 'RichField',
		category: 'inputs',
		description: 'Inline rich text input built on our RichEngine and TextModifiers system for dynamic and truly rich text rendering.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/RichField.jsx',
		component: () => {
			const value = Observer.mutable('Try typing: TODO, @mention, #tag, *emphasis*, or !!strong!! text.');

			const modifiers = [
				{
					check: /\b(TODO|DONE)\b/g,
					atomic: true,
					return: match => (
						<span
							style={{
								display: 'inline-block',
								padding: '0 4px',
								borderRadius: 4,
								background: match === 'DONE' ? 'green' : 'orange',
								color: 'white',
								fontWeight: 600,
							}}
						>
							{match}
						</span>
					),
				},
				{
					check: /@\w+/g,
					atomic: false,
					return: match => (
						<span
							style={{
								display: 'inline-block',
								color: 'blue',
								fontWeight: 500,
							}}
						>
							{match}
						</span>
					),
				},
				{
					check: /#\w+/g,
					atomic: false,
					return: match => (
						<span
							style={{
								display: 'inline-block',
								color: 'green',
								fontWeight: 500,
							}}
						>
							{match}
						</span>
					),
				},
				{
					check: /!!(.+?)!!/g,
					atomic: false,
					return: match => (
						<span style={{ fontWeight: 700, display: 'inline-block' }}>
							{match.slice(2, -2)}
						</span>
					),
				},
				{
					check: /\*(.+?)\*/g,
					atomic: false,
					return: match => (
						<span style={{ fontStyle: 'italic', display: 'inline-block' }}>
							{match.slice(1, -1)}
						</span>
					),
				},
			];

			return <div theme='column_fill' style={{ gap: 12, maxWidth: 600 }}>
				<Typography
					type='p2'
					label='Rich note editor: type TODO, @mentions, #tags, or *emphasis* / **strong**.'
				/>
				<Paper theme='tight' style={{ padding: 10, gap: 0 }}>
					<TextModifiers value={modifiers}>
						<RichField value={value} type='p1' />
					</TextModifiers>
				</Paper>

				<Typography
					type='p2'
					label='Raw value:'
					style={{ marginTop: 4 }}
				/>
				<Paper
					theme='row_tight'
					style={{
						padding: 10,
						maxWidth: '100%'
					}}
				>
					<Typography type='p1' label={value} />
				</Paper>
			</div>;
		},
	},
	{
		title: 'RichArea',
		category: 'inputs',
		description: 'Multiline rich text built on our RichEngine and TextModifiers system for dynamic and truly rich text rendering.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/RichArea.jsx',
		component: () => {
			const value = Observer.mutable(
				`Grocery list (try multi-line):

	- TODO buy milk
	- DONE grab coffee
	- Ask @sam about #party
	- Remember: *italics* and !!strong!! still work here.`
			);

			const modifiers = [
				{
					// TODO / DONE badges
					check: /\b(TODO|DONE)\b/g,
					atomic: true,
					return: match => (
						<span
							style={{
								display: 'inline-block',
								padding: '0 4px',
								borderRadius: 4,
								background: match === 'DONE' ? 'green' : 'orange',
								color: 'white',
								fontWeight: 600,
							}}
						>
							{match}
						</span>
					),
				},
				{
					// @mentions
					check: /@\w+/g,
					atomic: false,
					return: match => (
						<span
							style={{
								display: 'inline-block',
								color: 'blue',
								fontWeight: 500,
							}}
						>
							{match}
						</span>
					),
				},
				{
					// #tags
					check: /#\w+/g,
					atomic: false,
					return: match => (
						<span
							style={{
								display: 'inline-block',
								color: 'green',
								fontWeight: 500,
							}}
						>
							{match}
						</span>
					),
				},
				{
					// !!strong!!
					check: /!!(.+?)!!/g,
					atomic: false,
					return: match => (
						<span style={{ fontWeight: 700, display: 'inline-block' }}>
							{match.slice(2, -2)}
						</span>
					),
				},
				{
					// *emphasis*
					check: /\*(.+?)\*/g,
					atomic: false,
					return: match => (
						<span style={{ fontStyle: 'italic', display: 'inline-block' }}>
							{match.slice(1, -1)}
						</span>
					),
				},
			];

			return <div theme='column_fill' style={{ gap: 12, maxWidth: 700 }}>
				<Typography
					type='p2'
					label='RichArea: multiline rich text. Try new lines, TODO/DONE, @mentions, #tags, *italics*, and !!strong!!'
				/>

				{/* Rich multiline area */}
				<Paper
					theme='tight'
					style={{
						padding: 10,
						gap: 0,
						width: '100%',
						maxWidth: '100%',
					}}
				>
					<TextModifiers value={modifiers}>
						<RichArea
							value={value}
							placeholder='Type a multi-line rich note...'
							maxHeight={200}
						/>
					</TextModifiers>
				</Paper>

				{/* Raw text preview */}
				<Typography
					type='p2'
					label='Raw value:'
					style={{ marginTop: 4 }}
				/>
				<Paper
					theme='row_tight'
					style={{
						padding: 10,
						maxWidth: '100%',
						whiteSpace: 'pre-wrap',
						fontFamily: 'monospace',
					}}
				>
					<Typography type='p2' label={value} />
				</Paper>
			</div>;
		},
	},
	{ // TODO: Disable, this component needs work before displaying like this.
		title: 'FileDrop',
		disabled: true,
		category: 'inputs',
		description: 'Drag-and-drop file uploader with size limits, async loader hooks, and upload status feedback.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/FileDrop.jsx',
		component: () => {
			const files = OArray([]);
			const ready = Observer.mutable(null);

			const loader = (file, fileObj) => {
				return new Promise((resolve, reject) => {
					setTimeout(() => {
						if (file.size > 1024 * 1024 * 2) { // > 2MB
							reject('Simulated processing error (file too large for loader)');
						} else {
							resolve(`Loaded: ${file.name} (${file.size} bytes)`);
						}
					}, 1000);

					resolve();
				});
			};

			const limitBytes = 5 * 1024 * 1024;

			return <div theme='column_center' style={{ gap: 16, width: '100%' }}>
				<Typography
					type='p1'
					label='Drop files here or click to browse.'
				/>

				<Typography
					type='p2'
					label={ready.map(r => {
						if (!r) return 'No fully ready files yet.';
						if (Array.isArray(r)) {
							return `Ready results (${r.length}):\n` + r.join('\n');
						}
						return `Ready result: ${r}`;
					})}
					style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}
				/>

				<FileDrop
					files={files}
					extensions={['.png', '.jpg', '.jpeg', '.pdf']}
					multiple
					loader={loader}
					limit={limitBytes}
					ready={ready}
					style={{ width: '100%', maxWidth: 500, minHeight: 120 }}
					clickable={true}
				/>

				<div theme='row' style={{ gap: 10 }}>
					<Button
						type='outlined'
						label='Clear files'
						onClick={() => {
							files.splice(0, files.length);
							ready.set(null);
						}}
					/>
				</div>
			</div>;
		},
	},
	{
		title: 'Suspend',
		category: 'utils',
		description:
			'Lightweight async loader utility that shows a fallback state while awaiting a promise, perfect for lazy views and remote content.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/utils/Suspend.jsx',
		component: () => {
			const AsyncHello = suspend(
				() => <div theme="row_fill_center" style={{ gap: 10 }}>
					<Typography type="h4" label="Loading greeting" />
					<LoadingDots />
				</div>,
				async () => {
					await new Promise(resolve => setTimeout(resolve, 2500));

					return <Typography
						type="h4"
						label="Hello from async content!"
						style={{ textAlign: 'center' }}
					/>;
				}
			);

			return <div theme="column_fill_center" style={{ gap: 16, maxWidth: 600 }}>
				<Typography
					type="p1"
					label="This component uses suspend to wait 1 second before showing the greeting."
					style={{ textAlign: 'center', maxWidth: 500 }}
				/>

				<Paper
					theme="column_fill_center"
					style={{ padding: 16, minHeight: 80, minWidth: 260 }}
				>
					<AsyncHello />
				</Paper>
			</div>;
		},
	},
	{
		title: 'Theme',
		category: 'utils',
		description: 'Hell and back theming: comprehensive and intuitive context based theming, creating infinite possiblities with a seamless developer interface.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/utils/Theme.jsx',
		component: () => {
			const candyTheme = OObject({
				'*': {
					fontFamily: '"Roboto", system-ui',
					transition: '150ms ease-in-out',
				},

				candyPrimary: OObject({
					$color: '#ff4da6',
					$color_alt: '#ffd54f',
					$color_bg: '#1a1a1f',
					$color_text: '$contrast_text($color)',
					$color_text_subtle: '$alpha($color_text, 0.7)',
				}),

				primary: {
					extends: 'candyPrimary',
					$color_main: '$color',
					$color_top: '$contrast_text($color_main)',
					$color_hover: '$saturate($shiftBrightness($color_main, -.25), -.25)',
				},

				typography_h1_candy: {
					extends: 'typography_h1',
					color: '$color_alt',
					textShadow: '0 0 12px $alpha($color, 0.6)',
				},
				typography_p1_muted: {
					extends: 'typography_p1',
					color: '$color_text_subtle',
				},

				paper: {
					extends: 'candyPrimary',
					background: 'linear-gradient(135deg, $shiftBrightness($color, .1), $shiftBrightness($color_alt, .1))',
				},

				candyCard: {
					extends: 'paper_radius',
					background: 'radial-gradient(circle at top left, $color, $color_alt)',
					color: '$contrast_text($color)',
					padding: 30,
					gap: 18,
					maxWidth: 520,
					boxShadow: '0 12px 35px $alpha($color_black, 0.6)',
				},

				button: {
					borderRadius: 999,
					padding: '12px 22px',
					letterSpacing: '0.04em',
					textTransform: 'uppercase',
					userSelect: 'none',
					border: 'none',
					cursor: 'pointer',
					position: 'relative',
					overflow: 'clip',
				},

				button_contained: {
					extends: 'button',
					background: 'linear-gradient(135deg, $color, $color_alt)',
					color: '$contrast_text($color)',
					boxShadow: '0 6px 16px $alpha($color, 0.5)',
				},

				button_contained_hovered: {
					extends: 'button_contained',
					background:
						'linear-gradient(135deg, $shiftBrightness($color, .1), $shiftBrightness($color_alt, .1))',
					transform: 'translateY(-1px)',
					boxShadow: '0 10px 24px $alpha($color, 0.7)',
				},

				button_outlined: {
					extends: 'button',
					borderWidth: 2,
					borderStyle: 'solid',
					borderColor: '$color',
					color: '$color',
					background: 'transparent',
				},

				button_outlined_hovered: {
					extends: 'button_outlined',
					borderColor: '$color_alt',
					color: '$color_alt',
				},
			});

			const useCandy = Observer.mutable(true);

			// shared card body so both sides stay identical structurally
			const CardBody = ({ title, subtitleType = 'p2', subtitle }) => (
				<>
					<Typography type="h3" label={title} />
					<Typography type={subtitleType} label={subtitle} />

					<div style={{ height: 16 }} />

					<Typography type="h4" label="Primary Button" />

					<div theme="row" style={{ gap: 12, flexWrap: 'wrap' }}>
						<Button type="contained" label="Contained" />
						<Button type="outlined" label="Outlined" />
					</div>

					<div style={{ height: 16 }} />

					<Typography
						type="p1"
						label="This text shows how typography + colors change with the theme."
					/>
				</>
			);

			return <div theme="column_fill_center" style={{ gap: 24 }}>
				<div theme="column" style={{ gap: 12, alignItems: 'center' }}>
					<Typography
						type="p2"
						label={useCandy.map(on =>
							on ? 'Using custom candy theme on the right' : 'Candy theme disabled'
						)}
					/>
					<Toggle value={useCandy} type="primary" />
				</div>

				<div
					theme="row_fill_center"
					style={{
						gap: 24,
						alignItems: 'stretch',
						flexWrap: 'wrap',
					}}
				>
					{/* LEFT: app theme card (no Theme wrapper) */}
					<div
						style={{
							flex: 1,
							minWidth: 260,
							display: 'flex',
						}}
					>
						<Paper
							theme="column_tight"
							style={{
								padding: 24,
								width: '100%',
								display: 'flex',
								flexDirection: 'column',
								flex: 1,
							}}
						>
							<CardBody
								title="App Theme"
								subtitle="This card uses the global app theme."
							/>
						</Paper>
					</div>

					{/* RIGHT: same layout + content, optionally wrapped in candy Theme */}
					<div
						style={{
							flex: 1,
							minWidth: 260,
							display: 'flex',
						}}
					>
						<Shown value={useCandy}>
							<Theme value={candyTheme}>
								<Paper
									theme="candyCard"
									style={{
										width: '100%',
										display: 'flex',
										flexDirection: 'column',
										flex: 1,
									}}
								>
									{/* use candy-specific title style, but layout is identical */}
									<Typography type="h1_candy" label="Candy Theme" />
									<Typography
										type="p1_muted"
										label="Same layout as the left, but themed via a local Theme wrapper."
									/>

									<div style={{ height: 16 }} />

									<Typography type="h4" label="Primary Button" />

									<div theme="row" style={{ gap: 12, flexWrap: 'wrap' }}>
										<Button type="contained" label="Contained" />
										<Button type="outlined" label="Outlined" />
									</div>

									<div style={{ height: 16 }} />

									<Typography
										type="p1"
										label="Typography + button styles here are driven by candyTheme."
									/>
								</Paper>
							</Theme>

							<mark:else>
								{/* When disabled, show the same layout but faded, still structurally identical */}
								<Paper
									theme="column_tight"
									style={{
										padding: 24,
										width: '100%',
										display: 'flex',
										flexDirection: 'column',
										flex: 1,
										opacity: 0.4,
									}}
								>
									<CardBody
										title="Candy Theme (off)"
										subtitle="Toggle on to apply the custom Theme to this card."
									/>
								</Paper>
							</mark:else>
						</Shown>
					</div>
				</div>
			</div>;
		},
	},
	{
		title: 'Shown',
		category: 'utils',
		description:
			'Tiny conditional renderer with then/else marks for clean inline branching, ideal for loading, empty, and success states.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/utils/Shown.jsx',
		component: () => {
			const loading = Observer.mutable(false);
			const loggedIn = Observer.mutable(false);

			return <div theme="column_fill_center" style={{ gap: 20, maxWidth: 600 }}>
				<Paper theme="column_tight_center" style={{ padding: 12, gap: 12 }}>
					<Typography type="h4" label="Then / Else states" />

					<div theme="row" style={{ gap: 10 }}>
						<Button
							type="outlined"
							label={loading.map(l => (l ? 'Set idle' : 'Set loading'))}
							onClick={() => loading.set(!loading.get())}
						/>
					</div>

					<Shown value={loading}>
						<mark:then>
							<div theme="row_fill_center" style={{ gap: 8 }}>
								<LoadingDots />
								<Typography
									type="p1"
									label="Fetching data…"
								/>
							</div>
						</mark:then>

						<mark:else>
							<Typography
								type="p1"
								label="Content is ready. Nothing is loading."
							/>
						</mark:else>
					</Shown>
				</Paper>

				<Paper theme="column_tight_center" style={{ padding: 12, gap: 12 }}>
					<Typography type="h4" label="Login / Logout UI" />

					<div theme="row" style={{ gap: 10 }}>
						<Button
							type="outlined"
							label={loggedIn.map(v => (v ? 'Log out' : 'Log in'))}
							onClick={() => loggedIn.set(!loggedIn.get())}
						/>
					</div>

					<Shown value={loggedIn}>
						<Typography
							type="p1"
							label="Welcome back! You are logged in."
						/>

						<mark:else>
							<Typography
								type="p1"
								label="You are logged out. Please sign in to continue."
							/>
						</mark:else>
					</Shown>
				</Paper>
			</div>;
		},
	},
	{
		title: 'Switch',
		category: 'utils',
		description: 'Declarative conditional renderer with mark-based cases and a priority-aware mode for multiple boolean signals.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/utils/Switch.jsx',
		component: () => {
			const color = Observer.mutable('red');

			const one = Observer.mutable(false);
			const two = Observer.mutable(false);
			const three = Observer.mutable(false);

			return <div theme="column_fill_center" style={{ gap: 24, maxWidth: 600 }}>
				<Paper theme="column_tight" style={{ padding: 12, gap: 12 }}>
					<Typography type="h4" label="Value-based Switch" />

					<Switch value={color}>
						<mark:case value="blue">
							<Typography
								type="h5"
								label="You picked blue."
								style={{ color: 'var(--color-primary, blue)' }}
							/>
						</mark:case>

						<mark:case value="green">
							<Typography
								type="h5"
								label="Green, nice choice."
								style={{ color: 'green' }}
							/>
						</mark:case>

						<mark:case value="pink">
							<Typography
								type="h5"
								label="Going bold with pink."
								style={{ color: 'hotpink' }}
							/>
						</mark:case>

						<mark:default>
							<Typography
								type="h5"
								label="Not blue, green, or pink (yet)."
							/>
						</mark:default>
					</Switch>

					<div theme="row" style={{ gap: 10, flexWrap: 'wrap' }}>
						<Button
							type="contained"
							label="Green"
							style={{ backgroundColor: 'green' }}
							onClick={() => color.set('green')}
						/>
						<Button
							type="outlined"
							label="Blue"
							style={{ backgroundColor: 'blue', color: 'white' }}
							onClick={() => color.set('blue')}
						/>
						<Button
							type="outlined"
							label="Pink"
							style={{ backgroundColor: 'pink' }}
							onClick={() => color.set('pink')}
						/>
						<Button
							type="text"
							label="Reset"
							onClick={() => color.set('red')}
						/>
					</div>
				</Paper>

				<Paper theme="column_tight" style={{ padding: 12, gap: 12 }}>
					<Typography type="h4" label="Priority-based cases" />
					<Typography
						type="p2"
						label="The first truthy case wins; later cases only apply if earlier ones are off."
					/>

					<div theme="row" style={{ gap: 16, alignItems: 'center' }}>
						<div theme="column_center" style={{ gap: 4 }}>
							<Typography type="p2" label="One" />
							<Toggle value={one} />
						</div>
						<div theme="column_center" style={{ gap: 4 }}>
							<Typography type="p2" label="Two" />
							<Toggle value={two} />
						</div>
						<div theme="column_center" style={{ gap: 4 }}>
							<Typography type="p2" label="Three" />
							<Toggle value={three} />
						</div>
					</div>

					<Switch cases={{ one, two, three }}>
						<mark:case value="one">
							<Typography
								type="p1"
								label="The first toggle is on and overrides the others."
							/>
						</mark:case>

						<mark:case value="two">
							<Typography
								type="p1"
								label="The first toggle is off, and the second toggle is on."
							/>
						</mark:case>

						<mark:case value="three">
							<Typography
								type="p1"
								label="Only the third toggle is on."
							/>
						</mark:case>

						<mark:default>
							<Typography
								type="p1"
								label="No toggles are switched on."
							/>
						</mark:default>
					</Switch>
				</Paper>
			</div>;
		},
	},
	{
		title: 'Ripple',
		category: 'utils',
		description:
			'Hook for material-style click ripples. Attach it to any element to get animated, theme-aware ripple feedback.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/utils/Ripple.jsx',
		component: () => {
			const [ripples, createRipple] = useRipples();

			const clickCount = Observer.mutable(0);

			return <div
				theme="column_fill_center"
				style={{
					gap: 16,
					maxWidth: 500,
					textAlign: 'center',
					userSelect: 'none',
				}}
			>
				<Typography
					type="p2"
					label={clickCount.map(c => `Clicks: ${c}`)}
				/>

				<div
					onClick={e => {
						createRipple(e);
						clickCount.set(clickCount.get() + 1);
					}}
					theme='center'
					style={{
						position: 'relative',
						overflow: 'hidden',
						borderRadius: 12,
						padding: '20px 40px',
						cursor: 'pointer',
						background:
							'linear-gradient(135deg, var(--color-primary, #3b82f6), var(--color-primary-alt, #1d4ed8))',
						color: 'white',
						minWidth: 220,
						minHeight: 220,
					}}
				>
					<Typography
						type="p1"
						label="Click me"
						style={{ pointerEvents: 'none' }}
					/>
					{ripples}
				</div>

				<Typography
					type="p2"
					label="The ripple expands from the click position and fades out automatically."
					style={{ maxWidth: 400 }}
				/>
			</div>;
		},
	},
	{
		title: 'Validate',
		category: 'utils',
		description:
			'Validation helpers for text inputs, with built-in rules (phone, email, card, date, etc.) and group validation via ValidateContext.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/utils/Validate.jsx',
		component: () => {
			const phone = Observer.mutable('');
			const email = Observer.mutable('');
			const pan = Observer.mutable('');
			const expDate = Observer.mutable('');
			const postalCode = Observer.mutable('');
			const date = Observer.mutable('');
			const number = Observer.mutable('');
			const float = Observer.mutable('');

			const name = Observer.mutable('');
			const age = Observer.mutable('');
			const submit = Observer.mutable(false);
			const allValid = Observer.mutable(true);

			return <div theme="column_fill" style={{ gap: 20, maxWidth: 600 }}>
				<Paper theme="column_tight" style={{ padding: 10, gap: 12 }}>
					<Typography type="h4" label="Built-in validators" />

					<div theme="column_fill" style={{ gap: 8 }}>
						<Typography type="p2" label="Phone" />
						<TextField placeholder="Phone" value={phone} />
						<Validate value={phone} validate="phone" />

						<Typography type="p2" label="Email" />
						<TextField placeholder="Email" value={email} />
						<Validate value={email} validate="email" />

						<Typography type="p2" label="Credit Card (PAN)" />
						<TextField placeholder="16-digit card" value={pan} />
						<Validate value={pan} validate="pan" />

						<Typography type="p2" label="Expiration (MM/YY)" />
						<TextField placeholder="MM/YY" value={expDate} />
						<Validate value={expDate} validate="expDate" />

						<Typography type="p2" label="Postal Code (US ZIP or Canadian)" />
						<TextField placeholder="Postal Code" value={postalCode} />
						<Validate value={postalCode} validate="postalCode" />

						<Typography type="p2" label="Date (dd/mm/yyyy)" />
						<TextField placeholder="dd/mm/yyyy" value={date} />
						<Validate value={date} validate="date" />

						<Typography type="p2" label="Integer" />
						<TextField placeholder="Number" value={number} />
						<Validate value={number} validate="number" />

						<Typography type="p2" label="Float" />
						<TextField placeholder="Float (e.g. 12.34)" value={float} />
						<Validate value={float} validate="float" />
					</div>
				</Paper>

				<Paper theme="column_tight" style={{ padding: 10, gap: 12 }}>
					<Typography
						type="h4"
						label="Form validation with ValidateContext"
					/>
					<Typography
						type="p2"
						label="Click submit to trigger validations for all fields in this context."
					/>

					<ValidateContext value={allValid}>
						<div theme="column_fill" style={{ gap: 8 }}>
							<Typography type="p2" label="Name (no numbers)" />
							<TextField placeholder="Name" value={name} />
							<Validate
								value={name}
								validate={val => {
									const v = val.get() || '';
									if (!v.trim()) return 'Name is required.';
									if (/\d/.test(v)) return 'Name cannot contain numbers.';
									return '';
								}}
								signal={submit}
							/>

							<Typography type="p2" label="Age (number)" />
							<TextField placeholder="Age" value={age} />
							<Validate
								value={age}
								validate={val => {
									const v = (val.get() || '').trim();
									if (!v) return 'Age is required.';
									if (isNaN(v)) return 'Age must be a number.';
									if (Number(v) <= 0) return 'Age must be greater than 0.';
									return '';
								}}
								signal={submit}
							/>

							<div
								theme="row"
								style={{ gap: 10, alignItems: 'center', marginTop: 8 }}
							>
								<Button
									type="contained"
									label="Submit"
									onClick={() => {
										// trigger all validators that use this signal
										submit.set({ value: true });

										// small timeout allows ValidateContext to aggregate
										setTimeout(() => {
											if (allValid.get()) {
												console.log('Form submitted!');
											} else {
												console.log(
													'Please fix validation errors before submitting.'
												);
											}
										}, 0);
									}}
								/>
								<Typography
									type="p2"
									label={allValid.map(v =>
										v ? '✅ All fields valid' : '❌ Some fields invalid'
									)}
								/>
							</div>
						</div>
					</ValidateContext>
				</Paper>
			</div>;
		},
	},
	{
		title: 'Typography',
		category: 'display',
		description: 'Consistent, responsive typography scale for headings and body text, tuned for clean, readable UI layouts.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/display/Typography/',
		component: () => {
			return <div theme='column_fill_center'>
				<Typography type='h2' label='Typography' />
				<Typography type='h3' label='Typography' />
				<Typography type='h4' label='Typography' />
				<Typography type='h5' label='Typography' />
				<Typography type='h6' label='Typography' />
				<Typography type='p1' label='Typography' />
				<Typography type='p2' label='Typography' />
			</div>;
		}
	},
	{
		title: 'Icons',
		category: 'display',
		description:
			'Extensible and context based icon system. Plug in one or more icon packs, or create your own! Then simply render any icon by name.',
		componentUrl: 'https://github.com/torrinworx/destamatic-ui/tree/main/components/icons',
		component: () => {
			const libraryLabels = {
				feather: 'Feather Icons',
				lineicons: 'Line Icons',
				tabler: 'Tabler Icons',
				simpleIcons: 'Simple Icons',
			};

			const iconExamples = {
				feather: [
					{ name: 'home', label: 'home' },
					{ name: 'camera', label: 'camera' },
					{ name: 'search', label: 'search' },
					{ name: 'heart', label: 'heart' },
					{ name: 'settings', label: 'settings' },
					{ name: 'user', label: 'user' },
				],
				simpleIcons: [
					{ name: 'linux', label: 'Linux' },
					{ name: 'docker', label: 'Docker' },
					{ name: 'react', label: 'React' },
					{ name: 'github', label: 'GitHub' },
					{ name: 'vite', label: 'Vite' },
					{ name: 'javascript', label: 'JavaScript' },
				],
				lineicons: [
					{ name: 'home', label: 'home' },
					{ name: 'camera', label: 'camera' },
					{ name: 'search', label: 'search' },
					{ name: 'heart', label: 'heart' },
					{ name: 'cog', label: 'cog' },
					{ name: 'user', label: 'user' },
				],
				tabler: [
					{ name: 'home', label: 'home' },
					{ name: 'camera', label: 'camera' },
					{ name: 'search', label: 'search' },
					{ name: 'heart', label: 'heart' },
					{ name: 'settings', label: 'settings' },
					{ name: 'user', label: 'user' },
				],
			};
			return <div
				theme="column_fill_center"
				style={{ padding: 16, gap: 24, alignItems: 'stretch' }}
			>
				{Object.keys(libraryLabels).map((libKey) => {
					const icons = iconExamples[libKey];
					if (!icons || !icons.length) return null;

					return <div
						key={libKey}
						theme="column_fill_center"
						style={{ gap: 12 }}
					>
						<Typography
							type="h3"
							label={libraryLabels[libKey] ?? libKey}
						/>

						<div
							theme="row"
							style={{
								gap: 20,
								flexWrap: 'wrap',
								alignItems: 'center',
							}}
						>
							{icons.map((icon) => (
								<div
									key={icon.name}
									theme="column_center"
									style={{ gap: 8, minWidth: 80 }}
								>
									<Icon
										name={`${libKey}:${icon.name}`}
										size={50}
										style={{
											fill: 'none',
											color: '$color_top',
										}}
									/>
									<Typography
										type="p2"
										label={icon.label}
									/>
								</div>
							))}
						</div>
					</div>;
				})}
			</div>;
		},
	},
];

export default examples;
