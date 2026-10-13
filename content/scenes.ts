// The scenes a post can hold, each with the fields its YAML may have (work order 519).
//
// A post writes one as a fence named `scene:<name>`. content/blog.ts finds those fences and
// hands each one here: the YAML is read with its line numbers, checked against the scene's
// fields, and comes back as plain data for the page (frontend/utils/scenes.tsx). A scene added to
// SCENES below is a new name a post may use, with nothing else in the build to change.

import { LineCounter, isMap, isScalar, isSeq, parseDocument } from 'yaml';

/**
 * A word or phrase of the post's own text, drawn the way the scene draws the same thing: a
 * `search` as a search chip, `found` as a found snippet, a `thing` underlined in the second ink,
 * `changed` underlined in the accent.
 */
export interface Term {
	readonly text: string;
	readonly as: 'search' | 'found' | 'thing' | 'changed';
}

/** What every scene has: what it shows, in a line under it, and what of it is invented. */
interface Common {
	readonly caption: string;
	/** Says what in the scene is an invented example, shown with it. */
	readonly example?: string;
	readonly terms?: readonly Term[];
	/** The feed's still frame of the scene, and its words in reading order, written by the build. */
	readonly frame?: string;
	readonly words?: readonly string[];
}

/** What a step of a pipeline is, which says how it is drawn. */
export const STEP_KINDS = ['files', 'model', 'database', 'request', 'searches', 'found', 'prompt', 'draft', 'data', 'build', 'pages', 'upload', 'cloud'] as const;
export type StepKind = typeof STEP_KINDS[number];

export interface Step {
	readonly kind: StepKind;
	readonly name?: string;
	readonly line?: string;
	/** Who did it, as a small tag beside the name: "me", "colleague". */
	readonly badge?: string;
	/** The files, searches or found snippets the step holds. */
	readonly items?: readonly string[];
	/** A request's or a draft's words. */
	readonly text?: string;
	/** What a model's output looks like, as a small tag beside it. */
	readonly shows?: string;
	/** For searches: the name of the database step, in another lane, they search. */
	readonly reach?: string;
}

export interface Lane {
	readonly label?: string;
	readonly steps: readonly Step[];
}

/** Things carried through steps, lane by lane. */
export interface Pipeline extends Common {
	readonly lanes: readonly Lane[];
	readonly note?: string;
}

/** A neighbourhood of the map of meanings, and the snippets that sit in it. */
export interface Region {
	readonly name: string;
	readonly snippets: readonly string[];
}

/** Snippets on a map where similar meanings sit close together, and searches that land on it. */
export interface Cluster extends Common {
	/** The name a fanout in the same post gives to draw on this map. */
	readonly id?: string;
	readonly regions: readonly Region[];
	/** Example searches, each landing in or between the regions it names. */
	readonly searches: readonly { readonly words: string; readonly at: readonly string[] }[];
}

/** One of the things a fanout splits into: on a map, a search and where it lands; without one, a page and its line. */
export interface Branch {
	readonly name: string;
	readonly line?: string;
	readonly at?: readonly string[];
}

/** One thing split into several: searches landing on a cluster's map, or outputs of one build. */
export interface Fanout extends Common {
	/** The `id` of a cluster in the same post whose map the branches land on. */
	readonly map?: string;
	/** That cluster's regions, filled in by the build. */
	readonly regions?: readonly Region[];
	readonly from: { readonly name: string; readonly line?: string; readonly label?: string };
	readonly into: readonly Branch[];
	/** The same thing as one branch, behind a toggle, and the toggle's word for it. */
	readonly one?: { readonly name: string; readonly toggle: string };
	/** The toggle's word for the split state. */
	readonly toggle?: string;
}

/** The same scene in two states, switched: a deploy's uploads, or the prompts behind tasks. */
export interface Toggle extends Common {
	readonly kind: 'deploy' | 'prompts';
	readonly first: string;
	readonly second: string;
	/** For a deploy: where the pages go, how many there are and how many changed. */
	readonly store?: string;
	readonly pages?: string;
	readonly changed?: string;
	readonly names?: readonly string[];
	/** For prompts: each task, its prompt from the code, and an admin's edit of it. */
	readonly tasks?: readonly { readonly name: string; readonly prompt: string; readonly edit?: string }[];
}

/** Two columns joined by lines: what was asked for, and what answers each part of it. */
export interface Match extends Common {
	readonly left: { readonly label: string; readonly items: readonly string[] };
	readonly right: {
		readonly label: string;
		readonly items: readonly { readonly text: string; readonly kind?: 'file' | 'cv' | 'proposal' | 'page' | 'search'; readonly answers: readonly string[] }[];
	};
}

/** A figure as the post states it, and what the build read off it for the drawing. */
export interface Figure {
	readonly label: string;
	readonly value?: string;
	readonly from?: string;
	readonly to?: string;
	/** A share of a whole, for a value written as a percentage. */
	readonly share?: number;
	/** A count drawn as blocks, for a small whole number. */
	readonly count?: number;
	/** The two ends, for a figure that went from one to the other, and whether each is an "under". */
	readonly ends?: readonly [from: number, to: number];
	readonly under?: readonly [from: boolean, to: boolean];
}

/** Big figures with pixel bars: shares, counts, or from and to, and nothing between the two ends. */
export interface Numbers extends Common {
	readonly figures: readonly Figure[];
}

/** A scene as the page gets it: its name, and its checked data. */
export type Scene =
	| { readonly name: 'pipeline'; readonly data: Pipeline }
	| { readonly name: 'cluster'; readonly data: Cluster }
	| { readonly name: 'fanout'; readonly data: Fanout }
	| { readonly name: 'toggle'; readonly data: Toggle }
	| { readonly name: 'match'; readonly data: Match }
	| { readonly name: 'numbers'; readonly data: Numbers };

// --- the fields --------------------------------------------------------------------------

/**
 * What a field holds: text, optional text, a group of fields, or a list, of groups or of text. A
 * list names what one of its items is called, for the messages, and how many it may hold.
 */
type Field = 'text' | 'text?' | Group | List;
interface Group { readonly fields: Fields; readonly optional?: boolean }
interface List { readonly each: string; readonly fields?: Fields; readonly min: number; readonly max: number; readonly optional?: boolean }
type Fields = Readonly<Record<string, Field>>;

const isList = (field: Field): field is List => typeof field === 'object' && 'each' in field;
const plural = (word: string): string => (/(s|x|ch|sh)$/.test(word) ? `${word}es` : `${word}s`);

/** A refusal, at a line of the YAML counted from 1, or at 0 for the fence's own line. */
export class SceneError extends Error {
	readonly line: number;
	constructor(line: number, what: string) {
		super(what);
		this.name = 'SceneError';
		this.line = line;
	}
}

type Fault = { readonly at: readonly (string | number)[]; readonly what: string } | null;

interface Kind {
	readonly fields: Fields;
	/** What the fields alone cannot say, as the path of the field at fault and why. */
	readonly check?: (data: never) => Fault;
	/** What the build reads off the checked data for the drawing. */
	readonly derive?: (data: never) => unknown;
}

const COMMON: Fields = {
	caption: 'text',
	example: 'text?',
	terms: { each: 'term', min: 1, max: 6, optional: true, fields: { text: 'text', as: 'text' } },
};
const TERMS = ['search', 'found', 'thing', 'changed'];
const terms = (data: Common): Fault => {
	const at = (data.terms ?? []).findIndex((term) => !TERMS.includes(term.as));
	return at < 0 ? null : { at: ['terms', at, 'as'], what: `term ${String(at + 1)}: as is "${data.terms![at]!.as}", and it is one of ${TERMS.join(', ')}` };
};
const first = (...faults: (() => Fault)[]): Fault => {
	for (const fault of faults) { const found = fault(); if (found !== null) return found; }
	return null;
};

// What each kind of pipeline step needs: its items, its words, or its name.
const NEEDS: Readonly<Record<StepKind, 'items' | 'text' | 'name'>> = {
	files: 'items', searches: 'items', found: 'items', request: 'text', draft: 'text',
	model: 'name', database: 'name', prompt: 'name', data: 'name', build: 'name', pages: 'name', upload: 'name', cloud: 'name',
};
// What each kind draws beside its kind. A field it does not draw would be checked, listed in the
// feed and never shown, so it is refused.
const PICTURED = ['name', 'line', 'badge', 'shows'];
const DRAWS: Readonly<Record<StepKind, readonly string[]>> = {
	files: ['items', 'name'], searches: ['items', 'name', 'reach'], found: ['items', 'name'], request: ['text', 'name'], draft: ['text', 'name'], prompt: ['name', 'line'],
	model: PICTURED, database: PICTURED, data: PICTURED, build: PICTURED, pages: PICTURED, upload: PICTURED, cloud: PICTURED,
};

/** The place of the first text in a list that an earlier one already is, or -1. */
const twice = (texts: readonly string[]): number => texts.findIndex((text, at) => texts.indexOf(text) < at);

/**
 * Reads a figure as the post writes it: a percentage, a whole number, or a number with
 * "thousand" or "million" after it, any of them after "under". Null for anything else.
 */
export const readFigure = (text: string): { value: number; under: boolean; percent: boolean } | null => {
	const found = /^(under\s+)?(\d{1,3}(?:,\d{3})*|\d+)(\.\d+)?(\s+thousand|\s+million|\s+billion)?(%)?$/i.exec(text.trim());
	if (found === null) return null;
	const scale = { ' thousand': 1e3, ' million': 1e6, ' billion': 1e9 }[found[4]?.toLowerCase().replace(/\s+/, ' ') ?? ''] ?? 1;
	return { value: Number(`${found[2]!.replace(/,/g, '')}${found[3] ?? ''}`) * scale, under: found[1] !== undefined, percent: found[5] !== undefined };
};

/**
 * Every scene there is, by the name its fence uses. The limits are the post column's: five steps
 * side by side in a 760px column leave each about 150px, and four regions, branches or figures are
 * as many as stay readable on a phone.
 */
const SCENES: Readonly<Record<Scene['name'], Kind>> = {
	pipeline: {
		fields: {
			...COMMON,
			lanes: {
				each: 'lane', min: 1, max: 3, fields: {
					label: 'text?',
					steps: {
						each: 'step', min: 1, max: 6, fields: {
							kind: 'text', name: 'text?', line: 'text?', badge: 'text?', text: 'text?', shows: 'text?', reach: 'text?',
							items: { each: 'item', min: 1, max: 4, optional: true },
						},
					},
				},
			},
			note: 'text?',
		},
		check: (data: Pipeline) => first(() => terms(data), () => {
			// A search reaches a database by its name, so no two have the same one.
			const databases = data.lanes.flatMap((lane, l) => lane.steps.map((step, s) => ({ step, at: ['lanes', l, 'steps', s, 'name'] }))).filter(({ step }) => step.kind === 'database' && step.name !== undefined);
			const again = twice(databases.map(({ step }) => step.name!));
			if (again >= 0) return { at: databases[again]!.at, what: `two database steps are called "${databases[again]!.step.name!}", and a search reaches one by its name` };
			for (const [l, lane] of data.lanes.entries()) for (const [s, step] of lane.steps.entries()) {
				const at = ['lanes', l, 'steps', s];
				if (!(STEP_KINDS as readonly string[]).includes(step.kind)) return { at: [...at, 'kind'], what: `lane ${String(l + 1)}, step ${String(s + 1)}: kind is "${step.kind}", and it is one of ${STEP_KINDS.join(', ')}` };
				const need = NEEDS[step.kind];
				if (step[need] === undefined) return { at, what: `lane ${String(l + 1)}, step ${String(s + 1)}: a ${step.kind} step needs ${need}` };
				if (step.reach !== undefined) {
					if (step.kind !== 'searches') return { at: [...at, 'reach'], what: `lane ${String(l + 1)}, step ${String(s + 1)}: only searches reach into a database` };
					const target = data.lanes.flatMap((other, o) => other.steps.filter((x) => x.kind === 'database' && x.name === step.reach).map(() => o));
					if (target.length !== 1 || target[0] === l) return { at: [...at, 'reach'], what: `lane ${String(l + 1)}, step ${String(s + 1)}: reach names "${step.reach}", which is no database step in another lane` };
				}
				const stray = Object.keys(step).find((key) => key !== 'kind' && !DRAWS[step.kind].includes(key));
				if (stray !== undefined) return { at: [...at, stray], what: `lane ${String(l + 1)}, step ${String(s + 1)}: a ${step.kind} step does not draw ${stray}; it takes ${DRAWS[step.kind].join(', ')}` };
			}
			return null;
		}),
	},
	cluster: {
		fields: {
			...COMMON,
			id: 'text?',
			regions: { each: 'region', min: 2, max: 4, fields: { name: 'text', snippets: { each: 'snippet', min: 1, max: 4 } } },
			searches: { each: 'search', min: 1, max: 3, fields: { words: 'text', at: { each: 'region', min: 1, max: 2 } } },
		},
		check: (data: Cluster) => first(() => terms(data), () => {
			const names = data.regions.map((region) => region.name);
			const again = twice(names);
			if (again >= 0) return { at: ['regions', again, 'name'], what: `two regions are called "${names[again]!}", and a search lands in one by its name` };
			for (const [s, search] of data.searches.entries()) for (const [a, name] of search.at.entries()) {
				if (!names.includes(name)) return { at: ['searches', s, 'at', a], what: `search ${String(s + 1)}: at names "${name}", which is no region; the regions are ${names.join(', ')}` };
			}
			return null;
		}),
	},
	fanout: {
		fields: {
			...COMMON,
			map: 'text?',
			from: { fields: { name: 'text', line: 'text?', label: 'text?' } },
			into: { each: 'branch', min: 2, max: 4, fields: { name: 'text', line: 'text?', at: { each: 'region', min: 1, max: 2, optional: true } } },
			one: { optional: true, fields: { name: 'text', toggle: 'text' } },
			toggle: 'text?',
		},
		check: (data: Fanout) => first(() => terms(data), () => {
			if (data.one !== undefined && data.toggle === undefined) return { at: ['one'], what: 'one needs toggle beside it: the toggle\'s word for the split state, as one.toggle is for this one' };
			if (data.one === undefined && data.toggle !== undefined) return { at: ['toggle'], what: 'toggle is only for a fanout with one, the state the toggle switches to' };
			if (data.one !== undefined && data.map === undefined) return { at: ['one'], what: 'one is only for a fanout on a map: the one search lands between the regions' };
			const at = data.into.findIndex((branch) => (branch.at === undefined) === (data.map !== undefined));
			if (at >= 0) return { at: ['into', at], what: data.map === undefined ? `branch ${String(at + 1)}: at is only for a fanout on a map` : `branch ${String(at + 1)} needs at: the regions it lands in` };
			if (data.map !== undefined) {
				if (data.from.line !== undefined) return { at: ['from', 'line'], what: 'from: line is only for a fanout without a map; on a map the request shows its label and name' };
				const lined = data.into.findIndex((branch) => branch.line !== undefined);
				if (lined >= 0) return { at: ['into', lined, 'line'], what: `branch ${String(lined + 1)}: line is only for a fanout without a map; on a map a branch is a search, and shows its name` };
			} else if (data.from.label !== undefined) return { at: ['from', 'label'], what: 'from: label is only for a fanout on a map, where it stands over the request' };
			return null;
		}),
	},
	toggle: {
		fields: {
			...COMMON,
			kind: 'text',
			first: 'text',
			second: 'text',
			store: 'text?',
			pages: 'text?',
			changed: 'text?',
			names: { each: 'name', min: 1, max: 48, optional: true },
			tasks: { each: 'task', min: 1, max: 4, optional: true, fields: { name: 'text', prompt: 'text', edit: 'text?' } },
		},
		check: (data: Toggle) => first(() => terms(data), () => {
			if (data.kind !== 'deploy' && data.kind !== 'prompts') return { at: ['kind'], what: `kind is "${String(data.kind)}", and it is deploy or prompts` };
			if (data.kind === 'deploy') {
				for (const key of ['store', 'pages', 'changed'] as const) if (data[key] === undefined) return { at: [], what: `a deploy needs ${key}` };
				const pages = Number(data.pages), changed = Number(data.changed);
				if (!Number.isInteger(pages) || pages < 2 || pages > 48) return { at: ['pages'], what: 'pages is how many pages the scene draws, a whole number from 2 to 48' };
				if (!Number.isInteger(changed) || changed < 1 || changed >= pages) return { at: ['changed'], what: 'changed is how many of those pages changed, a whole number under pages' };
				if (data.names !== undefined && data.names.length !== pages) return { at: ['names'], what: `names has ${String(data.names.length)} names, and there are ${String(pages)} pages` };
				if (data.tasks !== undefined) return { at: ['tasks'], what: 'tasks is only for prompts' };
			}
			if (data.kind === 'prompts') {
				if (data.tasks === undefined) return { at: [], what: 'prompts needs tasks' };
				const stray = (['store', 'pages', 'changed', 'names'] as const).find((key) => data[key] !== undefined);
				if (stray !== undefined) return { at: [stray], what: `${stray} is only for a deploy` };
			}
			return null;
		}),
	},
	match: {
		fields: {
			...COMMON,
			left: { fields: { label: 'text', items: { each: 'item', min: 1, max: 5 } } },
			right: { fields: { label: 'text', items: { each: 'item', min: 1, max: 8, fields: { text: 'text', kind: 'text?', answers: { each: 'answer', min: 1, max: 5 } } } } },
		},
		check: (data: Match) => first(() => terms(data), () => {
			const KINDS = ['file', 'cv', 'proposal', 'page', 'search'];
			const again = twice(data.left.items);
			if (again >= 0) return { at: ['left', 'items', again], what: `left item ${String(again + 1)}: "${data.left.items[again]!}" is there twice, and a right item answers one by its words` };
			for (const [i, item] of data.right.items.entries()) {
				if (item.kind !== undefined && !KINDS.includes(item.kind)) return { at: ['right', 'items', i, 'kind'], what: `right item ${String(i + 1)}: kind is "${item.kind}", and it is one of ${KINDS.join(', ')}` };
				for (const [a, answer] of item.answers.entries()) {
					if (!data.left.items.includes(answer)) return { at: ['right', 'items', i, 'answers', a], what: `right item ${String(i + 1)}: answers "${answer}", which is no left item` };
				}
			}
			return null;
		}),
	},
	numbers: {
		fields: {
			...COMMON,
			figures: { each: 'figure', min: 1, max: 4, fields: { label: 'text', value: 'text?', from: 'text?', to: 'text?' } },
		},
		check: (data: Numbers) => first(() => terms(data), () => {
			const SHAPE = 'write it as the post does: 56%, 70, 52,100, under 1,000 or 6.17 million';
			for (const [f, figure] of data.figures.entries()) {
				const pair = figure.from !== undefined || figure.to !== undefined;
				if (figure.value !== undefined && pair) return { at: ['figures', f], what: `figure ${String(f + 1)} has value and ${figure.from === undefined ? 'to' : 'from'}, and it takes value, or from and to, not both` };
				if (figure.value === undefined && (figure.from === undefined || figure.to === undefined)) return { at: ['figures', f], what: `figure ${String(f + 1)} needs value, or from and to` };
				for (const key of ['value', 'from', 'to'] as const) {
					const text = figure[key];
					if (text !== undefined && readFigure(text) === null) return { at: ['figures', f, key], what: `figure ${String(f + 1)}: ${key} "${text}" is no figure the scene can draw; ${SHAPE}` };
				}
				const value = figure.value === undefined ? null : readFigure(figure.value)!;
				if (value !== null && !value.percent && (!Number.isInteger(value.value) || value.value > 200)) {
					return { at: ['figures', f, 'value'], what: `figure ${String(f + 1)}: a value on its own is a percentage or a count of 200 or fewer; give from and to for anything else` };
				}
			}
			return null;
		}),
		derive: (data: Numbers): Numbers => ({
			...data,
			figures: data.figures.map((figure) => {
				if (figure.value !== undefined) {
					const read = readFigure(figure.value)!;
					return read.percent ? { ...figure, share: read.value / 100 } : { ...figure, count: read.value };
				}
				const from = readFigure(figure.from!)!, to = readFigure(figure.to!)!;
				return { ...figure, ends: [from.value, to.value] as const, under: [from.under, to.under] as const };
			}),
		}),
	},
};

/** The names a scene fence may use. */
export const sceneNames = Object.keys(SCENES) as Scene['name'][];

/** The scene a fence's language names, or null for a fence that is not a scene. */
export const sceneOf = (language: string | null): string | null =>
	(language !== null && language.startsWith('scene:') ? language.slice('scene:'.length) : null);

/**
 * Read and check one scene's YAML.
 *
 * Throws: `SceneError` at the line at fault, for a name that is no scene, YAML that does not
 * parse, a field the scene does not have, a field it needs and lacks, text that is empty, a
 * list with too few or too many items, or what the scene's own check refuses.
 */
export const readScene = (name: string, yaml: string): Scene => {
	// Own keys only: `constructor` is no scene.
	if (!Object.hasOwn(SCENES, name)) throw new SceneError(0, `there is no scene called "${name}"; the scenes are ${sceneNames.join(', ')}`);
	const kind = SCENES[name as Scene['name']];
	const lines = new LineCounter();
	const doc = parseDocument(yaml, { lineCounter: lines, uniqueKeys: true });
	const lineOf = (node: unknown): number => {
		const range = (node as { range?: readonly number[] } | null)?.range;
		return range === undefined ? 1 : lines.linePos(range[0]!).line;
	};
	const broken = doc.errors[0];
	if (broken !== undefined) throw new SceneError(lines.linePos(broken.pos[0]).line, `the YAML does not parse: ${broken.message.split('\n')[0]!.replace(/ at line \d+, column \d+:?$/, '')}`);

	const textOf = (value: unknown, say: (what: string) => string, key: string): string => {
		if (!isScalar(value) || typeof value.value === 'object') throw new SceneError(lineOf(value), say(`${key} has to be text`));
		const text = String(value.value).trim();
		if (text === '') throw new SceneError(lineOf(value), say(`${key} is empty`));
		return text;
	};
	const read = (node: unknown, fields: Fields, where: string): Record<string, unknown> => {
		const say = (what: string): string => (where === '' ? what : `${where}: ${what}`);
		const names = Object.keys(fields).join(', ');
		if (!isMap(node)) throw new SceneError(lineOf(node), `${where === '' ? 'the scene' : where} has to be fields, as name: value lines; the fields are ${names}`);
		const out: Record<string, unknown> = {};
		for (const pair of node.items) {
			const key = isScalar(pair.key) ? String(pair.key.value) : '';
			if (!Object.hasOwn(fields, key)) throw new SceneError(lineOf(pair.key), say(`there is no field "${key}"; the fields are ${names}`));
		}
		for (const [key, field] of Object.entries(fields)) {
			const pair = node.items.find((item) => isScalar(item.key) && String(item.key.value) === key);
			const value = pair?.value ?? null;
			const absent = value === null || (isScalar(value) && (value.value === null || value.value === undefined));
			const optional = field === 'text?' || (typeof field === 'object' && field.optional === true);
			if (absent) {
				if (optional) continue;
				throw new SceneError(lineOf(pair ?? node), say(`${key} is missing`));
			}
			if (field === 'text' || field === 'text?') {
				out[key] = textOf(value, say, key);
			} else if (isList(field)) {
				if (!isSeq(value)) throw new SceneError(lineOf(value), say(`${key} has to be a list of ${plural(field.each)}, each line starting with "- "`));
				const count = value.items.length;
				if (count < field.min || count > field.max) {
					throw new SceneError(lineOf(pair!.key), say(`${key} holds ${String(count)} ${count === 1 ? field.each : plural(field.each)}, and it holds ${String(field.min)} to ${String(field.max)}`));
				}
				const inner = (at: number): string => `${where === '' ? '' : `${where}, `}${field.each} ${String(at + 1)}`;
				out[key] = value.items.map((item, at) => (field.fields === undefined
					? textOf(item, (what) => `${inner(at)}: ${what}`, field.each)
					: read(item, field.fields, inner(at))));
			} else {
				out[key] = read(value, field.fields, where === '' ? key : `${where}, ${key}`);
			}
		}
		return out;
	};

	const data = read(doc.contents, kind.fields, '');
	const fault = kind.check?.(data as never) ?? null;
	if (fault !== null) throw new SceneError(fault.at.length === 0 ? 1 : lineOf(doc.getIn(fault.at, true) ?? doc.contents), fault.what);
	return { name, data: kind.derive?.(data as never) ?? data } as unknown as Scene;
};

/** The words of a scene in reading order, for a feed, which shows them as a list under the still frame. */
export const wordsOf = (scene: Scene): string[] => {
	switch (scene.name) {
		case 'pipeline': return scene.data.lanes.flatMap((lane) => [
			...(lane.label === undefined ? [] : [lane.label]),
			...lane.steps.flatMap((step) => [[step.name, step.badge === undefined ? undefined : `(${step.badge})`].filter(Boolean).join(' '), step.line ?? '', step.text ?? '', ...(step.items ?? [])].filter((word) => word !== '')),
		]);
		case 'cluster': return scene.data.regions.map((region) => `${region.name}: ${region.snippets.join('; ')}`);
		case 'fanout': return [scene.data.from.name, ...scene.data.into.map((branch) => [branch.name, branch.line].filter(Boolean).join(': '))];
		case 'toggle': return scene.data.kind === 'prompts'
			? scene.data.tasks!.map((task) => `${task.name}: ${task.edit === undefined ? task.prompt : `${task.edit} (${scene.data.first}); ${task.prompt} (${scene.data.second})`}`)
			: [`${scene.data.first}: ${String(scene.data.pages)} of ${String(scene.data.pages)} pages uploaded`, `${scene.data.second}: ${String(scene.data.changed)} of ${String(scene.data.pages)} pages uploaded`];
		case 'match': return scene.data.left.items.map((item) => `${item}: ${scene.data.right.items.filter((right) => right.answers.includes(item)).map((right) => right.text).join('; ')}`);
		case 'numbers': return scene.data.figures.map((figure) => (figure.value === undefined ? `${figure.label}: ${figure.from!} to ${figure.to!}` : `${figure.value} ${figure.label}`));
	}
};
