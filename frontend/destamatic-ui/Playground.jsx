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
import Editor from './editor/Editor';

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

const stripExt = (name) => name.replace(/\.(jsx?|tsx?)$/i, '');

const normalize = (library, mapLike) => {
	const out = {};

	for (const [key, code] of Object.entries(mapLike)) {
		// key might be a full path (glob) or just filename (github list)
		const file = key.split('/').pop();          // e.g. "button.example.jsx" or "comments.jsx"
		const exampleName = stripExt(file);         // e.g. "button.example" or "comments"
		const dictKey = `${library}-${exampleName}`; // "destam-dom-comments"

		if (out[dictKey]) {
			throw new Error(
				`Duplicate example key "${dictKey}". You have multiple files named "${file}" in ${library}.`
			);
		}

		out[dictKey] = {
			library,
			name: exampleName,
			file,
			sourceKey: key, // original key/path
			code,
		};
	}

	return out;
};
// TODO: Use stages here so that we can direct link to the playground and a specific example inside the playground.

/*
Scope:
This is not the documentation for the stack, this is simply a page built to display and show examples.

Documentation will be built out on another page, that documentation may have playground style examples within it,
but the primary purposes between /playground and /docs is distinct.
*/

const Playground = StageContext.use(s => () => {
	s.parent.props.enabled.set(false);

	const libs = ['destamatic-ui', 'destam-dom', 'destam'];
	const focused = Observer.mutable('destamatic-ui');

	const libraryConfig = {
		acts: {},
		initial: 'destamatic-ui',
		template: Default,
		ssg: true
	};

	const Loader = StageContext.use(stage => suspend(LoadingDots, async () => {
		const examples = {
			...normalize('destamatic-ui', destamaticUiExamples),
			...normalize('destam-dom', await fetchDestamDomExamples()),
			// ...normalizeToDict('destam', destamExamples),
		};

		const options = Observer.mutable({});

		options.set(examples);

		const currentOptions = Observer.all([focused, options]).map(([foc, opt]) => {
			const selected = Object.entries(opt)
				.filter(([key, value]) => value.library === foc)
				.map(([key, value]) => value.name);

			return selected;
		});

		const libActs = libs.reduce((acc, lib) => {
			acc[lib] = StageContext.use(libStage => () => {
				const exActs = Object.fromEntries(
					Object.entries(examples).filter(([key, value]) => value.library === lib)
				)

				// why is something not a key value object with keys being the value.name and value being the () => <Editor...? 
				const exampleActs = Object.entries(exActs).reduce((exAcc, [key, value]) => {
					console.log(lib)
					// I hate this:
					const hSelector = lib === 'destam' ? null : lib === 'destam-dom' ? 'destam-dom' : lib === 'destamatic-ui' ? 'destamatic-ui' : undefined
					exAcc[value.name] = () => {
						return <Editor
							code={Observer.mutable(value.code)}
							h={hSelector}
						/>
					};
					return exAcc;
				}, {});

				const exampleConfig = {
					acts: exampleActs,
					initial: Object.keys(exampleActs)[0],
					template: Default,
					ssg: true,
				};

				return <StageContext value={exampleConfig}>
					<div theme='row' style={{ gap: 10 }}>
						<Typography type='p1' label='Example:  ' />
						<Select
							type='outlined'
							options={currentOptions}
							value={libStage.observer.path('current')}
							style={{ width: 200 }}
						/>
					</div>
					<Stage />
				</StageContext>
			});

			return acc;
		}, {});

		stage.acts = libActs;


		return <Stage />
	}));

	const Hero = StageContext.use(stage => () => {
		const Libraris = ({ each }) => <Button
			label={each}
			focused={stage.observer.path('current').map(c => c === each)}
			onClick={() => stage.open({ name: each })}
		/>;

		return <>
			<Paper theme='column_fill_center' style={{ background: 'none' }}>
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
					<Libraris each={libs} />
				</Paper>
			</div>
			<Loader />
		</>
	});

	// TODO: Filter Select examples to only include ones from the current focused library
	// TODO: Pass in h: domH to editor for destam-dom examples, and h: null for just destam examples

	return <StageContext value={libraryConfig}>
		<Hero />
	</StageContext>;
});

export default Playground;
