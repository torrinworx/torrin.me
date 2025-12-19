import { suspend, LoadingDots, StageContext, Observer } from 'destamatic-ui';
import { h as domH } from 'destam-dom';

import theme from '../utils/theme';
import Editor from './editor/Editor';

/*
	   <div theme='divider' style={{ margin: '10px 15px 10px 15px' }} />
	   <div theme='column' style={{ padding: '10px 15px 10px 15px' }}>
			<Typography type='h6' label='Playground:' />
			<Editor code={each.code} rootTheme={theme} />
		</div>
*/

const destamaticUiExamples = import.meta.glob(
	'../../destamatic-ui/components/**/**/*.example.jsx',
	{ as: 'raw', eager: true }
);

const fetchDestamDomExamples = async ({
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
}

const Playground = StageContext.use(s => suspend(() => <div theme='column_fill_center'><LoadingDots /></div>, async () => {
	s.parent.props.enabled.set(false);

	const examples = {
		'destamatic-ui': destamaticUiExamples,
		'destam-dom': await fetchDestamDomExamples(),
		'destam': '', // TODO: Simple destam/observer examples.
	}

	console.log();

	const destamDomTest = Observer.mutable(examples['destam-dom']['comments.jsx']);
	// const destamDomTest = Observer.mutable(examples['destam-dom']['2048.jsx']);
	const test = Observer.mutable(examples['destamatic-ui']['../../destamatic-ui/components/inputs/Button/button.example.jsx'])

	return <>
		playground
		<Editor code={destamDomTest} libs={{ h: domH }} />

		<Editor code={test} />
	</>;
}));

export default Playground;
