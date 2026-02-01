// Old and not used anywhere. Might get rid of? 

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


const examples = [
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
