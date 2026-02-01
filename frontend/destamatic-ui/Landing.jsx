import { Typography, Icon, Theme, Button, Observer, LoadingDots, suspend } from 'destamatic-ui';

import JsxBlock from './JsxBlock.jsx';
import Paper from '../utils/Paper.jsx';
import OnlinePulse from '../utils/OnlinePulse.jsx';

Theme.define({
	landingHero: {
		gap: 18,
		alignItems: 'center',
	},

	landingHeroCopy: {
		gap: 12,
		alignItems: 'center',
		width: '100%',
		maxWidth: 980,
	},

	landingChipDot: {
		width: 8,
		height: 8,
		borderRadius: 99,
		background: '$color',
		boxShadow: '0 0 0 0 $alpha($color, 0.55)',
		animation: 'landingPulse 1.4s infinite',
	},

	landingStats: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
		gap: 12,
		width: '100%',
		maxWidth: 980,
		marginTop: 12,
	},

	landingStat: {
		padding: 16,
		borderRadius: 18,
		border: '1px solid $alpha($color_top, 0.10)',
		background: '$alpha($color_top, 0.02)',
	},

	landingSplit: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
		gap: 24,
		alignItems: 'start',
		width: '100%',
	},

	landingBullets: {
		display: 'flex',
		flexDirection: 'column',
		gap: 10,
		marginTop: 8,
	},

	landingBullet: {
		display: 'flex',
		gap: 10,
		alignItems: 'flex-start',
	},

	landingCards: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
		gap: 16,
		width: '100%',
	},

	landingCompareGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
		gap: 16,
		width: '100%',
	},

	landingFooterCta: {
		padding: 20,
		borderRadius: 22,
		border: '1px solid $alpha($color_top, 0.10)',
		background: '$alpha($color, 0.06)',
	},
});

const size2 = 'clamp(1.45rem, 1.2rem + 1.1vw, 2rem)';
const size3 = 'clamp(1.05rem, 0.95rem + 0.5vw, 1.25rem)';

const Landing = () => {
	const codeDestam = `import { Observer, Button } from 'destamatic-ui';

const Counter = () => {
  const count = Observer.mutable(0);

  return <div theme="column" style={{ gap: 12 }}>
    <div style={{ fontSize: 28, fontWeight: 700 }}>
      {count}
    </div>

    <div theme="row" style={{ gap: 10, flexWrap: 'wrap' }}>
      <Button
        type="contained"
        label="Increment"
        onClick={() => count.set(count.get() + 1)}
      />
      <Button
        type="outlined"
        label="Reset"
        onClick={() => count.set(0)}
      />
    </div>
  </div>;
};
`;

	const codeReact = `import { useState } from 'react';
import { Box, Button } from '@mui/material';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box fontSize={28} fontWeight={700}>
        {count}
      </Box>

      <Box display="flex" gap={1} flexWrap="wrap">
        <Button
          variant="contained"
          onClick={() => setCount(count + 1)}
        >
          Increment
        </Button>
        <Button
          variant="outlined"
          onClick={() => setCount(0)}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
};`;

	const type = Observer.mutable('destam');

	const Release = suspend(LoadingDots, async () => {
		const release = await fetch(`https://api.github.com/repos/torrinworx/destamatic-ui/releases/latest`)
			.then(response => response.json());

		return <Button inline type='link' label={`${release.tag_name}`} href='https://github.com/torrinworx/destamatic-ui/releases/latest' />
	})

	return <>
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 10,
				padding: '6px 14px',
				borderRadius: 999,
			}}
		>
			<OnlinePulse />
			<Typography type="p1" label='Live now' />
			<Icon name="feather:zap" size={16} />
			<Release />
		</div>
		<div theme='column_fill_center' style={{ gap: 50, minHeight: '70vh', marginBottom: 120 }}>
			<Typography
				type="h1_bold"
				label="destamatic-ui"
				style={{
					textAlign: 'center',
					fontSize: 'clamp(2.4rem, 2.6rem + 2.6vw, 10rem)',
					color: '$color',
				}}
			/>

			<Typography
				type="h2"
				label="The tools you need to start building now."
				style={{ textAlign: 'center', maxWidth: '400px' }}
			/>
		</div>

		<div theme='column_fill_contentContainer' style={{ gap: 20 }}>
			<div theme='column_fill_center'>
				<Typography
					type="h2_bold"
					label="An all-in-one alternative to the React + MUI + Redux + Next stack."
					style={{ color: '$color', textAlign: 'center' }}
				/>
				<div theme='divider' />
			</div>

			<Typography
				type="p1"
				style={{ textAlign: 'center' }}
			>
				No VDOM, fine-grained Observers, component library, page routing, SSG/SEO tools, extensive theming, and more.
			</Typography>

			<Typography
				style={{ textAlign: 'center' }}
				type='p1_bold'
				label='Built to ship fast with a simpler mental model.'
			/>
			<div theme='row_wrap_center' style={{
				gap: 10,
			}}>
				<Button
					type="contained"
					label="Get started"
					href="https://github.com/torrinworx/destamatic-ui"
					onClick={() =>
						window.open('https://github.com/torrinworx/destamatic-ui', '_blank')
					}
					iconPosition="right"
					icon={<Icon name="feather:arrow-right" />}
				/>
				<Button
					type="outlined"
					label="GitHub"
					href="https://github.com/torrinworx/destamatic-ui"
					onClick={() =>
						window.open('https://github.com/torrinworx/destamatic-ui', '_blank')
					}
					iconPosition="left"
					icon={<Icon name="feather:github" />}
				/>
				<Button
					type="outlined"
					label="Discord"
					href="https://discord.gg/BJMPpVwdhz"
					onClick={() =>
						window.open('https://discord.gg/BJMPpVwdhz', '_blank')
					}
					iconPosition="left"
					icon={<Icon name="simpleIcons:discord" />}
				/>
			</div>
		</div>

		<div theme='column_fill_center_contentContainer'>
			<div theme="landingStats">
				<div theme="landingStat">
					<Typography type="p1_bold" label="No VDOM" />
					<Typography type="p2" label="Observers update exactly what changed. No rerender trees." />
				</div>
				<div theme="landingStat">
					<Typography type="p1_bold" label="Batteries included" />
					<Typography type="p2" label="Components, themes, routing/SSG, rich text, validation, inputs." />
				</div>
				<div theme="landingStat">
					<Typography type="p1_bold" label="One package" />
					<Typography type="p2" label="Less glue code, fewer dependencies, less framework tax." />
				</div>
			</div>
		</div>

		<div theme='column_fill_contentContainer' style={{ gap: 20 }}>
			<div theme='column_fill_center'>
				<Typography type="h2_bold" label="Simple mental model." style={{ color: '$color', textAlign: 'center' }} />
				<Typography type="h2_bold" label="Serious performance." style={{ color: '$color', textAlign: 'center' }} />
				<div theme="divider" />
			</div>

			<div theme="landingSplit">
				<div>
					<Typography
						type="p1"
						label="Stop juggling state libraries, effects, memo rules, and rerender gotchas. Build UI with a tiny set of primitives that compose cleanly."
						style={{ maxWidth: 760 }}
					/>

					<div theme="landingBullets">
						<div theme="landingBullet">
							<Icon name="feather:check" />
							<Typography type="p1" label="Observers drive UI updates directly — no reconciliation step." />
						</div>
						<div theme="landingBullet">
							<Icon name="feather:check" />
							<Typography type="p1" label="Theming is reactive and cascading (context-based), without a styling maze." />
						</div>
						<div theme="landingBullet">
							<Icon name="feather:check" />
							<Typography type="p1" label="Stage handles routing, URL resolution, and SSG/SEO-friendly rendering." />
						</div>
						<div theme="landingBullet">
							<Icon name="feather:check" />
							<Typography type="p1" label="Input components + optional tracking hooks built into the stack." />
						</div>
					</div>
				</div>

				<div theme="landingCards">
					<Paper>
						<div theme="row_spread">
							<Typography type="h2_bold" label="Fast by default" style={{ color: '$color' }} />
							<Icon size={size2} name="feather:zap" />
						</div>
						<Typography
							type="p1"
							label="No rerender loops. No diffing. Just precise updates where the data changed."
							style={{ opacity: 0.9 }}
						/>
					</Paper>

					<Paper>
						<div theme="row_spread">
							<Typography type="h2_bold" label="DX-first" style={{ color: '$color' }} />
							<Icon size={size2} name="feather:tool" />
						</div>
						<Typography
							type="p1"
							label="A tight, opinionated setup that stays out of your way. Vite-friendly. JSX-first."
							style={{ opacity: 0.9 }}
						/>
					</Paper>

					<Paper>
						<div theme="row_spread">
							<Typography type="h2_bold" label="Production-proven" style={{ color: '$color' }} />
							<Icon size={size2} name="feather:shield" />
						</div>
						<Typography
							type="p1"
							label="Used in real apps for years — optimized around real UI bottlenecks."
							style={{ opacity: 0.9 }}
						/>
					</Paper>
				</div>
			</div>
		</div>


		{/* Everything below this point needs to be updated: */}

		<div theme='column_fill_contentContainer'>


			<div theme="divider" />

			{/* CODE SECTION (KEEPING YOUR EXAMPLE) */}
			<div theme="row_center_fill_spread">
				<Typography type="h2_bold" label="Familiar JSX syntax." style={{ color: '$color' }} />

				<div theme="row_radius_primary_focused_tight" style={{ overflow: 'clip' }}>
					<Button
						style={{ borderRadius: '0px' }}
						label="destam"
						type={type.map(f => f === 'destam' ? 'contained' : 'text')}
						onClick={() => type.set('destam')}
						iconPosition="right"
						icon={<Icon name="feather:code" />}
					/>
					<Button
						style={{ borderRadius: '0px' }}
						label="React"
						type={type.map(f => f === 'react' ? 'contained' : 'text')}
						onClick={() => type.set('react')}
						iconPosition="right"
						icon={<Icon name="simpleIcons:react" />}
					/>
				</div>
			</div>

			<JsxBlock code={type.map(t => t === 'destam' ? codeDestam : codeReact)} />

			<div theme="divider" />

			{/* BATTERIES INCLUDED */}
			<Typography type="h2_bold" label="Batteries included (for real)" style={{ color: '$color' }} />
			<div theme="landingCards">
				<Paper>
					<div theme="row_spread">
						<Typography type="p1_bold" label="Component library" />
						<Icon size={size2} name="feather:layout" />
					</div>
					<Typography type="p1" label="Inputs, navigation, display, icons, utilities — designed to work together." style={{ opacity: 0.9 }} />
				</Paper>

				<Paper>
					<div theme="row_spread">
						<Typography type="p1_bold" label="Reactive themes" />
						<Icon size={size2} name="feather:droplet" />
					</div>
					<Typography type="p1" label="Cascading theme contexts + reactive CSS variables/functions. Easy to brand." style={{ opacity: 0.9 }} />
				</Paper>

				<Paper>
					<div theme="row_spread">
						<Typography type="p1_bold" label="Stage routing + SSG" />
						<Icon size={size2} name="feather:map" />
					</div>
					<Typography type="p1" label="URL resolution, Stage trees, static generation, SEO-friendly head tags." style={{ opacity: 0.9 }} />
				</Paper>

				<Paper>
					<div theme="row_spread">
						<Typography type="p1_bold" label="Validation + rich inputs" />
						<Icon size={size2} name="feather:check-square" />
					</div>
					<Typography type="p1" label="Input components built for real apps, with clean integration points." style={{ opacity: 0.9 }} />
				</Paper>

				<Paper>
					<div theme="row_spread">
						<Typography type="p1_bold" label="Input tracking hooks" />
						<Icon size={size2} name="feather:activity" />
					</div>
					<Typography type="p1" label="Wire analytics once, track consistently across the app (optional/opt-in)." style={{ opacity: 0.9 }} />
				</Paper>

				<Paper>
					<div theme="row_spread">
						<Typography type="p1_bold" label="Accessibility-minded" />
						<Icon size={size2} name="feather:eye" />
					</div>
					<Typography type="p1" label="Practical defaults + components you can audit and control." style={{ opacity: 0.9 }} />
				</Paper>
			</div>

			<div theme="divider" />

			{/* COMPARISON */}
			<Typography type="h2_bold" label="What you replace" style={{ color: '$color' }} />
			<div theme="landingCompareGrid">
				<Paper>
					<Typography type="p1_bold" label="destamatic-ui" />
					<div theme="landingBullets">
						<div theme="landingBullet"><Icon name="feather:check" size={size3} /><Typography type="p1" label="State: Observers + OObject/OArray" /></div>
						<div theme="landingBullet"><Icon name="feather:check" size={size3} /><Typography type="p1" label="UI: direct DOM updates (destam-dom)" /></div>
						<div theme="landingBullet"><Icon name="feather:check" size={size3} /><Typography type="p1" label="Themes: reactive CSS generation" /></div>
						<div theme="landingBullet"><Icon name="feather:check" size={size3} /><Typography type="p1" label="Routing/SSG/SEO: Stage" /></div>
						<div theme="landingBullet"><Icon name="feather:check" size={size3} /><Typography type="p1" label="Components: integrated library" /></div>
					</div>
				</Paper>

				<Paper>
					<Typography type="p1_bold" label="Typical React stack" />
					<div theme="landingBullets">
						<div theme="landingBullet"><Icon name="feather:layers" size={size3} /><Typography type="p1" label="React + reconciler rules + memo/effect patterns" /></div>
						<div theme="landingBullet"><Icon name="feather:layers" size={size3} /><Typography type="p1" label="MUI (or similar) + theme setup + overrides" /></div>
						<div theme="landingBullet"><Icon name="feather:layers" size={size3} /><Typography type="p1" label="Redux/Zustand + middleware + patterns" /></div>
						<div theme="landingBullet"><Icon name="feather:layers" size={size3} /><Typography type="p1" label="Next/router + app structure decisions" /></div>
						<div theme="landingBullet"><Icon name="feather:layers" size={size3} /><Typography type="p1" label="A bunch of glue code to make it feel cohesive" /></div>
					</div>
				</Paper>
			</div>

			<div theme="divider" />

			{/* CTA */}
			<div theme="landingFooterCta">
				<div theme="landingSplit" style={{ alignItems: 'center' }}>
					<div>
						<Typography type="h2_bold" label="Ship the app, not the plumbing." style={{ color: '$color' }} />
						<Typography
							type="p1"
							label="If you like frameworks, you’ll enjoy the internals. If you hate frameworks, you’ll enjoy how little you need to think about them."
							style={{ opacity: 0.9, maxWidth: 760 }}
						/>
					</div>

					<div theme="row_wrap" style={{ gap: 12, justifyContent: 'flex-end' }}>
						<Button
							type="contained"
							label="Install / Docs"
							href="https://github.com/torrinworx/destamatic-ui"
							onClick={() =>
								window.open('https://github.com/torrinworx/destamatic-ui', '_blank')
							}
							iconPosition="right"
							icon={<Icon name="feather:arrow-right" />}
						/>
						<Button
							type="outlined"
							label="Join Discord"
							href="https://discord.gg/BJMPpVwdhz"
							onClick={() =>
								window.open('https://discord.gg/BJMPpVwdhz', '_blank')
							}
							iconPosition="left"
							icon={<Icon name="simpleIcons:discord" />}
						/>
					</div>
				</div>
			</div>
		</div>
	</>;
};

export default Landing;
