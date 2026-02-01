import {
	Typography,
	suspend,
	LoadingDots,
	StageContext,
	Observer,
	Paper,
	Button,
	Icon,
	Stage,
	Select,
	Default,
} from 'destamatic-ui';
import Editor from '../editor/Editor';

const destamaticUiExamples = import.meta.glob(
	'../../destamatic-ui/components/**/**/*.example.jsx',
	{ as: 'raw', eager: true }
);

const fetchDestamDomExamples = async ({ // TODO filter out index.jsx file from being included
	owner = "Nefsen402",
	repo = "destam-dom",
	branch = "main",
	path = "examples",
} = {}) => {
	const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;

	const res = await fetch(apiUrl, {
		headers: {
			Accept: "application/vnd.github+json",
		},
	});

	if (!res.ok) {
		throw new Error(`Failed to list contents: ${res.status} ${res.statusText}`);
	}

	const items = await res.json();

	// Flat dir assumption: no nesting. Only pull .js/.jsx files.
	const files = items.filter(
		(it) =>
			it.type === "file" &&
			(it.name.endsWith(".js") || it.name.endsWith(".jsx")) &&
			it.download_url
	);

	const pairs = await Promise.all(
		files.map(async (file) => {
			const r = await fetch(file.download_url);
			if (!r.ok) throw new Error(`Failed to fetch ${file.name}: ${r.status} ${r.statusText}`);
			const text = await r.text();
			return [file.name, text];
		})
	);

	return Object.fromEntries(pairs);
};

// start this ASAP so deep links don’t wait for the user to click
const destamDomExamplesPromise = fetchDestamDomExamples().then(x => normalize('destam-dom', x));

const stripExt = (name) => name.replace(/\.(jsx?|tsx?)$/i, '');
const normalize = (library, mapLike) => {
	const out = {};
	for (const [key, code] of Object.entries(mapLike)) {
		const file = key.split('/').pop();
		const exampleName = stripExt(file);
		const dictKey = `${library}-${exampleName}`;
		out[dictKey] = { library, name: exampleName, file, sourceKey: key, code };
	}
	return out;
};

const makeExampleActs = (lib, examplesByKey) => {
	const exActs = Object.fromEntries(
		Object.entries(examplesByKey).filter(([, v]) => v.library === lib)
	);

	return Object.fromEntries(
		Object.entries(exActs).map(([, v]) => {
			const hSelector =
				lib === 'destam' ? null :
					lib === 'destam-dom' ? 'destam-dom' :
						lib === 'destamatic-ui' ? 'destamatic-ui' :
							undefined;

			return [v.name, () => (
				<Editor
					code={Observer.mutable(v.code)}
					h={hSelector}
				/>
			)];
		})
	);
};

const ExampleStage = ({ exampleActs }) => {
	const exampleNames = Object.keys(exampleActs);

	const exampleConfig = {
		acts: exampleActs,
		initial: exampleNames[0],     // keep default when URL has no example segment
		template: Default,
		ssg: true,
	};

	const Controls = StageContext.use(exStage => () => (
		<div theme='row' style={{ gap: 10 }}>
			<Typography type='p1' label='Example: ' />
			<Select
				type='outlined'
				options={exampleNames}
				value={exStage.observer.path('current')}
				onChange={(val) => exStage.open({ name: val })}
				style={{ width: 240 }}
			/>
		</div>
	));

	return (
		<StageContext value={exampleConfig}>
			<Controls />
			<Stage />
		</StageContext>
	);
};

const DestamaticUiLib = () => {
	const examples = normalize('destamatic-ui', destamaticUiExamples);
	const exampleActs = makeExampleActs('destamatic-ui', examples);
	return <ExampleStage exampleActs={exampleActs} />;
};

const DestamDomLib = suspend(LoadingDots, async () => {
	const examples = await destamDomExamplesPromise;
	const exampleActs = makeExampleActs('destam-dom', examples);
	return <ExampleStage exampleActs={exampleActs} />;
});

const DestamLib = () => <Paper>
	<Typography type="p1" label="TODO: destam examples" />
</Paper>;

const Playground = StageContext.use(s => () => {
	s.parent.props.enabled.set(false);

	const libs = ['destamatic-ui', 'destam-dom', 'destam'];

	// KEY FIX: acts are defined immediately (not later in an async loader)
	const libraryConfig = {
		acts: {
			'destamatic-ui': DestamaticUiLib,
			'destam-dom': DestamDomLib,
			'destam': DestamLib,
		},
		initial: 'destamatic-ui',
		template: Default,
		ssg: true,
	};

	const Hero = StageContext.use(stage => () => {
		const Libraries = ({ each }) => (
			<Button
				label={each}
				focused={stage.observer.path('current').map(c => c === each)}
				onClick={() => stage.open({ name: each })}
			/>
		);

		return <>
			<Paper theme='column_fill_center' style={{ background: 'none', paddingBottom: 10 }}>
				<div theme="column_fill_center" style={{ gap: 12 }}>
					<Typography type='h1' label='Playground' />
					<Typography type='p1' label='Try building with the destam stack before installing anything.' />
				</div>

				<div theme="row" style={{ gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
					<Button
						type="contained"
						label="Documentation"
						href="/destamatic-ui/documentation"
						onClick={() => window.open('/destamatic-ui/documentation', '_self')}
						icon={
							<Icon
								name="feather:book-open"
								size="clamp(0.85rem, 0.85vw + 0.4rem, 1.4rem)"
								style={{ marginLeft: 4 }}
							/>
						}
						iconPosition="right"
					/>
					<Button
						type="outlined"
						label="GitHub"
						href="https://github.com/torrinworx/destamatic-ui"
						onClick={() =>
							window.open('https://github.com/torrinworx/destamatic-ui', '_blank')
						}
						icon={
							<Icon
								name="feather:github"
								size="clamp(0.85rem, 0.85vw + 0.4rem, 1.4rem)"
								style={{ marginRight: 4 }}
							/>
						}
						iconPosition="left"
					/>
				</div>
			</Paper>

			<Typography type='p1' label='Explore examples from the three libraries to see how they are built!' />

			<div theme='column_center' style={{ gap: 10 }}>
				<Paper theme='row_tight' style={{ padding: 5 }}>
					<Libraries each={libs} />
				</Paper>
			</div>
			<Stage />
		</>;
	});

	return <StageContext value={libraryConfig}>
		<Hero />
	</StageContext>;
});

export default Playground;
