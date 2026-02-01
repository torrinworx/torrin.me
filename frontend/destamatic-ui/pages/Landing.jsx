import { Typography, Icon, Theme, Button, Observer, LoadingDots, suspend, StageContext } from 'destamatic-ui';

import useShine from '../../utils/Shine.jsx';
import JsxBlock from '../utils/JsxBlock.jsx';
import Paper from '../../utils/Paper.jsx';
import OnlinePulse from '../../utils/OnlinePulse.jsx';

Theme.define({
	landingStats: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
		gap: 12,
		width: '100%',
		maxWidth: 980,
		marginTop: 12,
	},

	landingStat: {
		extends: 'radius',
		padding: 16,
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
		marginTop: 20,
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
});

const size2 = 'clamp(1.45rem, 1.2rem + 1.1vw, 2rem)';
const size3 = 'clamp(1.05rem, 0.95rem + 0.5vw, 1.25rem)';

const Cta = StageContext.use(stage => (_, cleanup, mounted) => {
	const [shines, createShine] = useShine();
	cleanup(Observer.timer(2000).watch(t => t.value % 2 === 0 && createShine()));
	mounted(() => createShine());

	return <div theme='row_wrap_center' style={{ gap: 10 }}>
		<div theme='tight_radius_shadow'>
			<Button
				type="contained"
				label="Get started"
				href="/destamatic-ui/docs"
				onClick={() =>
					stage.open({ name: 'docs' })
				}
				iconPosition="right"
				icon={<Icon name="feather:arrow-right" />}
			>
				{shines}
			</Button>
		</div>
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
	</div>;
});

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

  return <Box display="flex" flexDirection="column" gap={10}>
    <Box fontSize={28} fontWeight={700}>{count}</Box>

    <Box display="flex" gap={5}>
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
  </Box>;
};
`;

	const type = Observer.mutable('destam');

	const Release = suspend(LoadingDots, async () => {
		const release = await fetch(`https://api.github.com/repos/torrinworx/destamatic-ui/releases/latest`)
			.then(response => response.json());

		return <Button inline type='link' label={`${release.tag_name}`} href='https://github.com/torrinworx/destamatic-ui/releases/latest' />
	})

	return <div theme='content_col' style={{ gap: 200 }}>
		<div theme='row_center' style={{ gap: 10 }}>
			<OnlinePulse />
			<Typography type="p1" label='Live now' />
			<Icon name="feather:zap" size={16} />
			<Release />
		</div>
		<div theme='column_fill_center' style={{ gap: 50, minHeight: '50vh', marginBottom: 300 }}>
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

		<div theme='column_fill' style={{ gap: 20 }}>
			<Typography
				type="h2_bold"
				label="An all-in-one alternative to the React + MUI + Redux + Next stack."
				style={{ color: '$color', textAlign: 'center' }}
			/>
			<div theme='divider' />

			<Typography
				type="p1"
				style={{ textAlign: 'center' }}
			>
				No VDOM, fine-grained state Observers, component library, page routing, SSG/SEO tools, extensive theming, and more.
			</Typography>

			<Typography
				style={{ textAlign: 'center' }}
				type='p1_bold'
				label='Built to ship fast with a simpler mental model.'
			/>
			<Cta />
			<div theme='column_fill_center'>
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
		</div>

		<div theme='column_fill' style={{ gap: 20 }}>
			<Typography type="h2_bold" label="Simple model. Serious speed." style={{ color: '$color', textAlign: 'center' }} />
			<div theme="divider" />

			<div theme="landingSplit">
				<div>
					<Typography type="p1" label="Ditch complex state and rerender gotchas. Build with clean, composable primitives." style={{ maxWidth: 760 }} />

					<div theme="landingBullets">
						<div theme="landingBullet">
							<Icon name="feather:check" />
							<Typography type="p1" label="Direct UI updates (no reconciliation)" />
						</div>
						<div theme="landingBullet">
							<Icon name="feather:check" />
							<Typography type="p1" label="Reactive theming (no styling maze)" />
						</div>
						<div theme="landingBullet">
							<Icon name="feather:check" />
							<Typography type="p1" label="Routing/SSG/SEO handled by Stage" />
						</div>
						<div theme="landingBullet">
							<Icon name="feather:check" />
							<Typography type="p1" label="Built-in inputs + tracking hooks" />
						</div>
					</div>
				</div>

				<div theme="landingCards">
					<Paper>
						<div theme="row_spread">
							<Typography type="h2_bold" label="Fast by default" style={{ color: '$color' }} />
							<Icon size={size2} name="feather:zap" />
						</div>
						<Typography type="p1" label="Precise updates. No rerender loops." />
					</Paper>

					<Paper>
						<div theme="row_spread">
							<Typography type="h2_bold" label="DX-first" style={{ color: '$color' }} />
							<Icon size={size2} name="feather:tool" />
						</div>
						<Typography type="p1" label="Vite-friendly, JSX-first, opinionated." />
					</Paper>

					<Paper>
						<div theme="row_spread">
							<Typography type="h2_bold" label="Production-proven" style={{ color: '$color' }} />
							<Icon size={size2} name="feather:shield" />
						</div>
						<Typography type="p1" label="Optimized for real UI bottlenecks." />
					</Paper>
				</div>
			</div>
		</div>

		<div theme='column_fill' style={{ gap: 20 }}>
			<div theme="row_wrap_center_fill" style={{ gap: 20 }}>
				<Typography type="h2_bold" label="Familiar JSX syntax." style={{ color: '$color' }} />

				<div theme='tight_radius_shadow'>
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
							type={type.map(f => f === 'react' ? 'contained_disabled' : 'text')}
							onClick={() => type.set('react')}
							iconPosition="right"
							icon={<Icon name="simpleIcons:react" />}
						/>
					</div>
				</div>
			</div>
			<div theme="divider" />
			<Typography
				type="p1"
				label="Build with destamatic-ui using familiar JSX syntax and conventions."
				style={{ textAlign: 'center' }}
			/>
			<JsxBlock code={type.map(t => t === 'destam' ? codeDestam : codeReact)} />
		</div>

		<div theme='column_fill' style={{ gap: 20 }}>
			<Typography type="h2_bold" label="Batteries included" style={{ color: '$color', textAlign: 'center' }} />
			<div theme="divider" />
			<Typography
				type="p1"
				label="All the creature comforts you could possible need."
				style={{ textAlign: 'center' }}
			/>
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
					<Typography type="p1" label="Wire your analytics once, track consistently across the app." style={{ opacity: 0.9 }} />
				</Paper>

				<Paper>
					<div theme="row_spread">
						<Typography type="p1_bold" label="Accessibility-minded" />
						<Icon size={size2} name="feather:eye" />
					</div>
					<Typography type="p1" label="Practical defaults + components you can audit and control." style={{ opacity: 0.9 }} />
				</Paper>
			</div>
		</div>

		<div theme='column_fill' style={{ gap: 20 }}>
			<Typography type="h2_bold" label="What you'll replace" style={{ color: '$color', textAlign: 'center' }} />
			<div theme="divider" />
			<Typography type="p1" label="Nothing to lose, everything to gain." style={{ textAlign: 'center' }} />

			<div theme="landingCompareGrid">
				<Paper>
					<Typography type="h3_bold" label="destamatic-ui" />
					<div theme="landingBullets">
						<div theme="landingBullet"><Icon name="feather:check" size={size3} /><Typography type="p1" label="State: Observers" /></div>
						<div theme="landingBullet"><Icon name="feather:check" size={size3} /><Typography type="p1" label="UI: direct DOM updates (destam-dom)" /></div>
						<div theme="landingBullet"><Icon name="feather:check" size={size3} /><Typography type="p1" label="Themes: extensive/reactive CSS" /></div>
						<div theme="landingBullet"><Icon name="feather:check" size={size3} /><Typography type="p1" label="Routing/SSG/SEO: Stage" /></div>
						<div theme="landingBullet"><Icon name="feather:check" size={size3} /><Typography type="p1" label="Components: integrated library" /></div>
					</div>
				</Paper>

				<div theme="landingStat">
					<Typography type="p1" label="Typical React stack" style={{ opacity: 0.6 }} />
					<div theme="landingBullets">
						<div theme="landingBullet"><Icon name="feather:layers" size={size3} style={{ opacity: 0.6 }} /><Typography type="p1" label="React + reconciler rules + memo/effect patterns" style={{ opacity: 0.6 }} /></div>
						<div theme="landingBullet"><Icon name="feather:layers" size={size3} style={{ opacity: 0.6 }} /><Typography type="p1" label="MUI (or similar) + theme setup + complex overrides" style={{ opacity: 0.6 }} /></div>
						<div theme="landingBullet"><Icon name="feather:layers" size={size3} style={{ opacity: 0.6 }} /><Typography type="p1" label="Redux/Zustand + middleware + patterns" style={{ opacity: 0.6 }} /></div>
						<div theme="landingBullet"><Icon name="feather:layers" size={size3} style={{ opacity: 0.6 }} /><Typography type="p1" label="Next/router + app structure decisions" style={{ opacity: 0.6 }} /></div>
						<div theme="landingBullet"><Icon name="feather:layers" size={size3} style={{ opacity: 0.6 }} /><Typography type="p1" label="A bunch of glue code to make it feel cohesive" style={{ opacity: 0.6 }} /></div>
					</div>
				</div>
			</div>
		</div>

		<div theme='column_fill_center' style={{ gap: 20, marginBottom: 200 }}>
			<Typography type="h2_bold" label="Ship the app, not the plumbing." style={{ color: '$color', textAlign: 'center' }} />
			<div theme="divider" />
			<Typography
				type="p1"
				label="If you like frameworks, you'll enjoy the internals. If you hate frameworks, you'll enjoy how little you need to think about them."
				style={{ textAlign: 'center' }}
			/>
			<Cta />
		</div>
	</div>;
};

export default Landing;
