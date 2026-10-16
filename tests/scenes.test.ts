// The pixel scenes a post can hold: the check each scene's YAML goes through, the painters, run
// in Node on pixel buffers as the strip's tests run it, and the markup the build writes, in Chrome.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { Theme, context, h, render } from '@aweftjs/ui';
import { chromium } from 'playwright';

import { SceneError, readFigure, readScene, sceneOf, wordsOf } from '../content/scenes.ts';
import type { Fanout, Numbers, Pipeline, Schedule } from '../content/scenes.ts';
import {
	EMBLEM_LENGTH, changedOf, createBranches, createDeploy, createEmblem, createMap, createMatch, createNumbers, createPipeline, createPrompts, createSchedule, deployLayout, inksOf, landing,
	mapArea, mapOf, narrowMap, pipelineLength, scheduleLength, stillFrame, uploadsOf,
} from '../frontend/scenes.ts';
import type { Box, Explainer, Seek, Size } from '../frontend/scenes.ts';
import { pack } from '../frontend/strip.ts';
import { LIME, MOSS, siteTheme } from '../frontend/theme.ts';
import { SceneBlock } from '../frontend/utils/scenes.tsx';

const refused = (name: string, yaml: string): { line: number; message: string } => {
	try {
		readScene(name, yaml);
	} catch (error) {
		assert.ok(error instanceof SceneError, String(error));
		return { line: error.line, message: error.message };
	}
	assert.fail(`scene:${name} was taken:\n${yaml}`);
};

const PIPELINE = 'caption: c\nlanes:\n  - label: Up\n    steps:\n      - kind: files\n        items: [a.pdf, b.pdf]\n      - kind: database\n        name: Store\n  - steps:\n      - kind: searches\n        items: [q]\n        reach: Store\n      - kind: found\n        items: [hit]\n';
const SCHEDULE = 'caption: c\nitems:\n  - name: Keynote\n    line: on going the distance\n  - name: Quantum\n    kind: panel\n  - name: Biergarten\n    line: Until six\n    kind: drinks\n';
const CLUSTER = 'caption: c\nid: m\nregions:\n  - name: A\n    snippets: [one, two]\n  - name: B\n    snippets: [three]\nsearches:\n  - words: w\n    at: [A]\n';

describe('a scene\'s YAML', () => {
	it('names a scene only with the scene: prefix', () => {
		assert.equal(sceneOf('scene:pipeline'), 'pipeline');
		assert.equal(sceneOf('pipeline'), null);
		assert.equal(sceneOf(null), null);
	});

	it('comes back as the data the page draws, text kept as written', () => {
		const scene = readScene('pipeline', `${PIPELINE}note: "2026, in one build"\n`);
		assert.equal(scene.name, 'pipeline');
		assert.deepEqual(scene.data, {
			caption: 'c',
			lanes: [
				{ label: 'Up', steps: [{ kind: 'files', items: ['a.pdf', 'b.pdf'] }, { kind: 'database', name: 'Store' }] },
				{ steps: [{ kind: 'searches', items: ['q'], reach: 'Store' }, { kind: 'found', items: ['hit'] }] },
			],
			note: '2026, in one build',
		});
		assert.deepEqual((readScene('cluster', CLUSTER.replace('[one, two]', '[2026, two]')).data as unknown as { regions: { snippets: string[] }[] }).regions[0]!.snippets, ['2026', 'two'], 'a number is text');
	});

	it('refuses a name that is no scene, own names only', () => {
		assert.deepEqual(refused('maze', 'caption: c'), { line: 0, message: 'there is no scene called "maze"; the scenes are pipeline, cluster, fanout, toggle, match, numbers, schedule' });
		assert.match(refused('constructor', 'caption: c').message, /no scene called "constructor"/);
	});

	it('refuses YAML that does not parse, or is not fields, at its line', () => {
		assert.deepEqual(refused('pipeline', 'caption: c\ncaption: d\n'), { line: 2, message: 'the YAML does not parse: Map keys must be unique' });
		assert.match(refused('pipeline', '- a list\n').message, /^the scene has to be fields, as name: value lines; the fields are caption, example, terms, lanes, note$/);
		assert.match(refused('numbers', '').message, /the scene has to be fields/);
	});

	it('refuses a field the scene lacks, a field it needs, empty text, a list for text and a list out of its limits, each at its line', () => {
		assert.deepEqual(refused('pipeline', `${PIPELINE}notes: x\n`), { line: 15, message: 'there is no field "notes"; the fields are caption, example, terms, lanes, note' });
		assert.deepEqual(refused('pipeline', PIPELINE.replace('        name: Store\n', '')), { line: 7, message: 'lane 1, step 2: a database step needs name' });
		assert.deepEqual(refused('pipeline', PIPELINE.replace('caption: c', 'caption: "  "')), { line: 1, message: 'caption is empty' });
		assert.deepEqual(refused('pipeline', PIPELINE.replace('name: Store', 'name: [a, b]')), { line: 8, message: 'lane 1, step 2: name has to be text' });
		assert.deepEqual(refused('pipeline', PIPELINE.replace('items: [hit]', 'items: [hit, [x]]')), { line: 14, message: 'lane 2, step 2, item 2: item has to be text' });
		assert.deepEqual(refused('cluster', CLUSTER.replace('  - name: B\n    snippets: [three]\n', '')), { line: 3, message: 'regions holds 1 region, and it holds 2 to 4' });
		assert.deepEqual(refused('pipeline', 'caption: c\nlanes: none\n'), { line: 2, message: 'lanes has to be a list of lanes, each line starting with "- "' });
	});

	it('takes only the kinds of step there are, each with what it needs, and searches reaching a database in another lane', () => {
		assert.match(refused('pipeline', PIPELINE.replace('kind: files', 'kind: filez')).message, /^lane 1, step 1: kind is "filez", and it is one of files, model, database, request, searches, found, prompt, draft, data, build, pages, upload, cloud$/);
		assert.match(refused('pipeline', PIPELINE.replace('items: [a.pdf, b.pdf]', 'name: f')).message, /lane 1, step 1: a files step needs items/);
		assert.match(refused('pipeline', PIPELINE.replace('reach: Store', 'reach: Shop')).message, /lane 2, step 1: reach names "Shop", which is no database step in another lane/);
		assert.match(refused('pipeline', PIPELINE.replace('      - kind: found\n        items: [hit]\n', '      - kind: found\n        items: [hit]\n        reach: Store\n')).message, /only searches reach into a database/);
	});

	it('lands a cluster\'s searches only in its regions, and a fanout\'s branches on a map or not at all', () => {
		assert.match(refused('cluster', CLUSTER.replace('at: [A]', 'at: [C]')).message, /search 1: at names "C", which is no region; the regions are A, B/);
		const fan = (extra: string, at = '\n    at: [A]'): string => `caption: c\nmap: m\nfrom:\n  name: ask\ninto:\n  - name: x${at}\n  - name: y${at}\n${extra}`;
		assert.deepEqual((readScene('fanout', fan('one:\n  name: all\n  toggle: One\ntoggle: Several\n')).data as Fanout).one, { name: 'all', toggle: 'One' });
		assert.match(refused('fanout', fan('', '')).message, /branch 1 needs at: the regions it lands in/);
		assert.match(refused('fanout', fan('').replace('map: m\n', '')).message, /branch 1: at is only for a fanout on a map/);
		assert.match(refused('fanout', fan('one:\n  name: all\n  toggle: One\n')).message, /^one needs toggle beside it/);
		assert.match(refused('fanout', fan('toggle: Several\n')).message, /^toggle is only for a fanout with one/);
		assert.match(refused('fanout', fan('one:\n  name: all\n  toggle: One\ntoggle: Several\n', '').replace('map: m\n', '')).message, /one is only for a fanout on a map/);
	});

	it('takes only the fields a scene draws: a step, a branch or a toggle refuses one it would not show', () => {
		assert.deepEqual(refused('pipeline', PIPELINE.replace('items: [a.pdf, b.pdf]', 'items: [a.pdf, b.pdf]\n        badge: me')), { line: 7, message: 'lane 1, step 1: a files step does not draw badge; it takes items, name' });
		assert.match(refused('pipeline', 'caption: c\nlanes:\n  - steps:\n      - kind: request\n        text: Ask\n        line: a line\n').message, /lane 1, step 1: a request step does not draw line; it takes text, name/);
		assert.match(refused('pipeline', 'caption: c\nlanes:\n  - steps:\n      - kind: model\n        name: M\n        text: words\n').message, /a model step does not draw text; it takes name, line, badge, shows/);
		const fan = 'caption: c\nmap: m\nfrom:\n  name: ask\ninto:\n  - name: x\n    at: [A]\n  - name: y\n    at: [A]\n';
		assert.deepEqual(refused('fanout', fan.replace('  - name: x\n', '  - name: x\n    line: a line\n')), { line: 7, message: 'branch 1: line is only for a fanout without a map; on a map a branch is a search, and shows its name' });
		assert.match(refused('fanout', fan.replace('  name: ask\n', '  name: ask\n  line: a line\n')).message, /^from: line is only for a fanout without a map/);
		assert.match(refused('fanout', 'caption: c\nfrom:\n  name: build\n  label: Request\ninto:\n  - name: x\n  - name: y\n').message, /^from: label is only for a fanout on a map/);
		assert.match(refused('fanout', fan.replace('  - name: x\n', '  - name: x\n    finds: a thing\n')).message, /branch 1: there is no field "finds"/);
		assert.match(refused('toggle', 'caption: c\nkind: deploy\nfirst: A\nsecond: B\nstore: S\npages: "8"\nchanged: "2"\ntasks:\n  - name: t\n    prompt: p\n').message, /^tasks is only for prompts$/);
		assert.match(refused('toggle', 'caption: c\nkind: prompts\nfirst: A\nsecond: B\nstore: S\ntasks:\n  - name: t\n    prompt: p\n').message, /^store is only for a deploy$/);
	});

	it('refuses two of a name a scene finds things by: a database, a region, a left item', () => {
		assert.deepEqual(refused('pipeline', `${PIPELINE}      - kind: database\n        name: Store\n`), { line: 16, message: 'two database steps are called "Store", and a search reaches one by its name' });
		assert.deepEqual(refused('cluster', CLUSTER.replace('name: B', 'name: A')), { line: 6, message: 'two regions are called "A", and a search lands in one by its name' });
		assert.match(refused('match', 'caption: c\nleft:\n  label: L\n  items: [one, one]\nright:\n  label: R\n  items:\n    - text: a\n      answers: [one]\n').message, /^left item 2: "one" is there twice/);
	});

	it('takes a toggle as a deploy or as prompts, each with what it needs', () => {
		const deploy = 'caption: c\nkind: deploy\nfirst: All\nsecond: Changed\nstore: S\npages: "8"\nchanged: "2"\n';
		assert.equal(readScene('toggle', deploy).name, 'toggle');
		assert.match(refused('toggle', deploy.replace('kind: deploy', 'kind: party')).message, /kind is "party", and it is deploy or prompts/);
		assert.match(refused('toggle', deploy.replace('store: S\n', '')).message, /a deploy needs store/);
		assert.match(refused('toggle', deploy.replace('"8"', '"80"')).message, /pages is how many pages the scene draws, a whole number from 2 to 48/);
		assert.match(refused('toggle', deploy.replace('"2"', '"8"')).message, /changed is how many of those pages changed, a whole number under pages/);
		assert.match(refused('toggle', `${deploy}names: [a, b]\n`).message, /names has 2 names, and there are 8 pages/);
		assert.match(refused('toggle', 'caption: c\nkind: prompts\nfirst: A\nsecond: B\n').message, /prompts needs tasks/);
	});

	it('joins a match\'s right items only to its left ones', () => {
		const match = 'caption: c\nleft:\n  label: Asks\n  items: [one, two]\nright:\n  label: Answers\n  items:\n    - text: a\n      kind: cv\n      answers: [one, two]\n';
		assert.equal(readScene('match', match).name, 'match');
		assert.match(refused('match', match.replace('answers: [one, two]', 'answers: [one, three]')).message, /right item 1: answers "three", which is no left item/);
		assert.match(refused('match', match.replace('kind: cv', 'kind: resume')).message, /right item 1: kind is "resume", and it is one of file, cv, proposal, page, search/);
	});

	it('takes figures only as the post writes them, and reads off what to draw', () => {
		assert.deepEqual(readFigure('56%'), { value: 56, under: false, percent: true });
		assert.deepEqual(readFigure('under 1,000'), { value: 1000, under: true, percent: false });
		assert.deepEqual(readFigure('6.17 million'), { value: 6170000, under: false, percent: false });
		assert.equal(readFigure('fifty'), null);
		assert.equal(readFigure('5-6'), null);
		const numbers = readScene('numbers', 'caption: c\nfigures:\n  - label: commits\n    value: 56%\n  - label: releases\n    value: "70"\n  - label: clicks\n    from: under 1,000\n    to: 52,100\n').data as Numbers;
		assert.deepEqual(numbers.figures.map((figure) => [figure.share, figure.count, figure.ends, figure.under]), [[0.56, undefined, undefined, undefined], [undefined, 70, undefined, undefined], [undefined, undefined, [1000, 52100], [true, false]]]);
		assert.match(refused('numbers', 'caption: c\nfigures:\n  - label: x\n    value: lots\n').message, /figure 1: value "lots" is no figure the scene can draw; write it as the post does/);
		assert.match(refused('numbers', 'caption: c\nfigures:\n  - label: x\n    value: "52,100"\n').message, /a value on its own is a percentage or a count of 200 or fewer/);
		assert.match(refused('numbers', 'caption: c\nfigures:\n  - label: x\n    from: "1"\n').message, /figure 1 needs value, or from and to/);
		assert.match(refused('numbers', 'caption: c\nfigures:\n  - label: x\n    value: 5%\n    from: "1"\n    to: "2"\n').message, /^figure 1 has value and from, and it takes value, or from and to, not both$/);
	});

	it('takes a schedule\'s items in order, each a talk, a panel or drinks, and no time', () => {
		const schedule = readScene('schedule', SCHEDULE).data as Schedule;
		assert.deepEqual(schedule.items, [{ name: 'Keynote', line: 'on going the distance' }, { name: 'Quantum', kind: 'panel' }, { name: 'Biergarten', line: 'Until six', kind: 'drinks' }]);
		assert.deepEqual(refused('schedule', SCHEDULE.replace('kind: panel', 'kind: workshop')), { line: 6, message: 'item 2: kind is "workshop", and it is one of talk, panel, drinks' });
		assert.deepEqual(refused('schedule', SCHEDULE.replace('    kind: panel\n', '    kind: panel\n    time: "2:00"\n')), { line: 7, message: 'item 2: there is no field "time"; the fields are name, line, kind' });
		assert.match(refused('schedule', 'caption: c\nitems:\n  - name: Keynote\n').message, /^items holds 1 item, and it holds 2 to 6$/);
		assert.match(refused('schedule', 'caption: c\nitems:\n  - name: A\n  - line: b\n').message, /^item 2: name is missing$/);
	});

	it('checks each term\'s kind', () => {
		assert.match(refused('cluster', `${CLUSTER}terms:\n  - text: x\n    as: shout\n`).message, /term 1: as is "shout", and it is one of search, found, thing, changed/);
	});

	it('takes every example the README gives, as a post would have it', () => {
		const text = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
		const section = text.slice(text.indexOf('### Pixel scenes'), text.indexOf('## Layout'));
		const examples = [...section.matchAll(/\*\*`(\w+)`\*\*[\s\S]*?```yaml\n([\s\S]*?)```/g)];
		assert.deepEqual(examples.map((example) => example[1]), ['pipeline', 'cluster', 'fanout', 'toggle', 'match', 'numbers', 'schedule'], 'one example for every scene');
		for (const [, name, yaml] of examples) assert.equal(readScene(name!, yaml!).name, name);
	});

	it('lists a scene\'s words in reading order, for a feed', () => {
		assert.deepEqual(wordsOf(readScene('pipeline', PIPELINE)), ['Up', 'a.pdf', 'b.pdf', 'Store', 'q', 'hit']);
		assert.deepEqual(wordsOf(readScene('cluster', CLUSTER)), ['A: one; two', 'B: three']);
		assert.deepEqual(wordsOf(readScene('schedule', SCHEDULE)), ['Keynote: on going the distance', 'Quantum', 'Biergarten: Until six']);
		assert.deepEqual(wordsOf(readScene('numbers', 'caption: c\nfigures:\n  - label: of the commits\n    value: 56%\n  - label: clicks\n    from: under 1,000\n    to: 52,100\n')), ['56% of the commits', 'clicks: under 1,000 to 52,100']);
	});
});

// --- the painters --------------------------------------------------------------------------------

const W = 200, H = 120;
const stage = (night: boolean, moving: boolean, started: number | null = 0) => ({ width: W, height: H, night, moving, started: () => started });
const boxes = (entries: Record<string, readonly [number, number, number, number]>): (() => ReadonlyMap<string, Box>) => {
	const held = new Map(Object.entries(entries).map(([name, [x, y, w, h]]) => [name, { x, y, width: w, height: h }]));
	return () => held;
};
const SHAPE: Pipeline = readScene('pipeline', PIPELINE).data as Pipeline;
const PIPELINE_BOXES = boxes({
	'item:0.0.0': [10, 10, 30, 8], 'item:0.0.1': [10, 22, 30, 8], 'slot:0.1': [80, 8, 22, 28], 'step:0.1': [110, 14, 30, 8],
	'item:1.0.0': [10, 70, 30, 8], 'item:1.1.0': [120, 70, 40, 8],
});
const MATCH_BOXES = boxes({ 'left:0': [14, 10, 50, 8], 'slot:mark:0': [6, 10, 5, 8], 'left:1': [14, 30, 50, 8], 'slot:mark:1': [6, 30, 5, 8], 'right:0': [120, 10, 50, 8], 'slot:marks:0': [174, 10, 20, 8], 'right:1': [120, 30, 50, 8], 'slot:marks:1': [174, 30, 20, 8] });
const PROMPTS_BOXES = boxes({ 'task:0': [6, 10, 50, 8], 'slot:who:0': [70, 8, 16, 14], 'prompt:0': [96, 10, 90, 8], 'edit:0': [96, 10, 90, 8] });
const SCHEDULE_BOXES = boxes({
	'slot:bunting': [4, 2, 192, 14],
	'slot:rail:0': [4, 18, 14, 20], 'slot:item:0': [20, 19, 26, 18], 'item:0': [52, 24, 80, 10],
	'slot:rail:1': [4, 40, 14, 20], 'slot:item:1': [20, 41, 26, 18], 'item:1': [52, 46, 80, 10],
	'slot:rail:2': [4, 62, 14, 20], 'slot:item:2': [20, 63, 26, 18], 'item:2': [52, 68, 80, 10],
});
const BRANCHES_BOXES = boxes({ 'slot:from': [10, 40, 20, 20], 'slot:branch:0': [120, 10, 22, 18], 'slot:branch:1': [120, 70, 22, 18], from: [6, 64, 30, 8], 'branch:0': [146, 14, 40, 8], 'branch:1': [146, 74, 40, 8] });
const REGIONS = [{ name: 'A', snippets: ['one', 'two'] }, { name: 'B', snippets: ['three', 'four'] }];
const seekAt = (to: readonly string[]): Seek => ({ id: 'q', x: 0, y: 0, from: [0, 0], to, fromTo: to, at: 0, near: 2 });

// One of every painter, in a mode, moving or still, from a story that started at 0.
const PAINTERS: Readonly<Record<string, (night: boolean, moving: boolean, started?: number | null) => Explainer>> = {
	pipeline: (night, moving, started = 0) => createPipeline({ ...stage(night, moving, started), boxes: PIPELINE_BOXES, shape: SHAPE }),
	map: (night, moving, started = 0) => createMap({ ...stage(night, moving, started), regions: REGIONS, seeks: () => [seekAt(['A'])] }),
	deploy: (night, moving, started = 0) => createDeploy({ ...stage(night, moving, started), height: deployLayout(W, 16).height, pages: 16, changed: changedOf(16, 3), deploy: () => ({ every: true, started }) }),
	branches: (night, moving, started = 0) => createBranches({ ...stage(night, moving, started), boxes: BRANCHES_BOXES, branches: 2 }),
	prompts: (night, moving, started = 0) => createPrompts({ ...stage(night, moving, started), boxes: PROMPTS_BOXES, tasks: [{ edit: true }], edits: () => ({ on: true, since: 0 }) }),
	match: (night, moving, started = 0) => createMatch({ ...stage(night, moving, started), boxes: MATCH_BOXES, links: [[0, 0], [1, 0], [1, 1]], left: 2, right: 2 }),
	schedule: (night, moving, started = 0) => createSchedule({ ...stage(night, moving, started), boxes: SCHEDULE_BOXES, kinds: ['talk', 'panel', 'drinks'] }),
	numbers: (night, moving, started = 0) => createNumbers({ ...stage(night, moving, started), boxes: boxes({ 'slot:bar:0': [10, 10, 100, 6], 'slot:bar:1': [10, 30, 100, 9], 'slot:bar:2:from': [10, 60, 100, 5], 'slot:bar:2:to': [10, 70, 100, 5] }), figures: [{ share: 0.56 }, { count: 70 }, { ends: [1000, 52100], under: [true, false] }] }),
};
const play = (painter: Explainer, until: number): Explainer => {
	for (let t = 0; t <= until; t += 1 / 30) painter.frame(1 / 30, t);
	return painter;
};

describe('the scenes\' painters', () => {
	for (const [name, make] of Object.entries(PAINTERS)) {
		it(`${name}: fades into the page at its edges, in both modes`, () => {
			for (const night of [false, true]) {
				const painter = play(make(night, true), 30);
				const { width: w, height: h, pixels } = painter;
				for (let x = 0; x < w; x++) { assert.equal(pixels[x], 0, `top row, ${String(x)}`); assert.equal(pixels[(h - 1) * w + x], 0, `bottom row, ${String(x)}`); }
				for (let y = 0; y < h; y++) { assert.equal(pixels[y * w], 0, `left column, ${String(y)}`); assert.equal(pixels[y * w + w - 1], 0, `right column, ${String(y)}`); }
				assert.ok(pixels.filter((c) => c !== 0).length > 20, 'and it draws something inside them');
			}
		});

		it(`${name}: with motion off, shows the end of its story and holds it whatever the clock says`, () => {
			const still = make(false, false, null);
			still.frame(0, 1);
			const first = Uint32Array.from(still.pixels);
			const alphas = [...still.anchors.values()].map((anchor) => anchor.alpha);
			still.frame(0.5, 9.3);
			assert.deepEqual(still.pixels, first, 'nothing moved');
			const ended = play(make(false, true, 0), 40);
			assert.deepEqual(still.pixels, ended.pixels, 'and it is where the story ends');
			assert.deepEqual([...still.anchors.values()].map((anchor) => anchor.alpha), alphas);
		});

		it(`${name}: paints the night in the night's colours`, () => {
			const night = play(make(true, true), 30).pixels, day = play(make(false, true), 30).pixels;
			assert.ok(!night.includes(pack(MOSS)), 'no moss, the day\'s accent, at night');
			assert.ok(day.includes(inksOf(false).accent) || day.includes(inksOf(false).ink2), 'the day draws in its own inks');
			assert.ok(night.includes(inksOf(true).accent) || night.includes(inksOf(true).ink2), 'the night in its own');
		});
	}

	it('lifts a thing under the pointer a pixel, and no more', () => {
		const laid = { pipeline: PIPELINE_BOXES, match: MATCH_BOXES, prompts: PROMPTS_BOXES, branches: BRANCHES_BOXES, schedule: SCHEDULE_BOXES };
		for (const [name, things] of Object.entries(laid)) {
			const painter = play(PAINTERS[name]!(false, true), 30);
			const under = [...things()].filter(([key]) => !key.startsWith('slot:') && painter.anchors.has(key));
			assert.ok(under.length > 0, `${name}: the pointer has a thing to land on`);
			for (const [, box] of under) {
				// Of things laid over each other, as an admin's edit is over its prompt, the last is on top.
				const thing = under.filter(([, other]) => box.x + 1 >= other.x && box.x + 1 < other.x + other.width && box.y + 1 >= other.y && box.y + 1 < other.y + other.height).at(-1)![0];
				const where = (): readonly [number, number] => [painter.anchors.get(thing)!.x + 0, painter.anchors.get(thing)!.y + 0];
				assert.deepEqual(where(), [0, 0], `${name}: ${thing} stands where the page put it`);
				painter.move(box.x + 1, box.y + 1);
				painter.frame(1 / 30, 31);
				assert.deepEqual(where(), [0, -1], `${name}: ${thing}, under the pointer, stands a pixel higher`);
				painter.leave();
				painter.frame(1 / 30, 31);
				assert.deepEqual(where(), [0, 0], `${name}: ${thing} comes back down`);
			}
		}
		const deploy = play(PAINTERS['deploy']!(false, true), 30);
		const before = Uint32Array.from(deploy.pixels);
		const { grid } = deployLayout(W, 16);
		deploy.move(grid.x + 3, grid.y + 4);
		deploy.frame(1 / 30, 31);
		assert.equal(deploy.anchors.get('page:0')!.alpha, 1, 'the page under the pointer shows its name');
		let moved = 0;
		for (let i = 0; i < before.length; i++) if (before[i] !== deploy.pixels[i]) moved++;
		assert.ok(moved > 0 && moved <= 63, `and stands a pixel higher, one page's pixels at most: ${String(moved)} changed`);
	});

	it('plays a pipeline in order: nothing before it starts, each step as its turn comes, all of it at the end', () => {
		const waiting = createPipeline({ ...stage(false, true, null), boxes: PIPELINE_BOXES, shape: SHAPE });
		waiting.frame(0, 5);
		assert.ok([...waiting.anchors.values()].every((anchor) => anchor.alpha === 0), 'before the story, no step shows');
		const playing = createPipeline({ ...stage(false, true, 0), boxes: PIPELINE_BOXES, shape: SHAPE });
		playing.frame(0, 1.6);
		assert.equal(playing.anchors.get('item:0.0.0')!.alpha, 1, 'the files are in');
		assert.equal(playing.anchors.get('item:1.1.0')!.alpha, 0, 'what is found is not yet');
		play(playing, pipelineLength(SHAPE) + 1);
		assert.ok([...playing.anchors.values()].every((anchor) => anchor.alpha === 1), 'at the end, every step shows');
	});

	it('lights a search\'s nearest snippets on the map, one each on a narrow map with several searches, and lands a search between the regions it names', () => {
		const map = mapOf(REGIONS);
		assert.deepEqual(landing(map, ['A', 'B']), [(map[0]!.x + map[1]!.x) / 2 + 0.02, (map[0]!.y + map[1]!.y) / 2 + 0.03]);
		const lit = (painter: Explainer): string[] => [...painter.anchors].filter(([key, anchor]) => key.startsWith('snippet:') && anchor.alpha === 1).map(([key]) => key).sort();
		const wide = play(createMap({ ...stage(false, true), regions: REGIONS, seeks: () => [seekAt(['A'])] }), 3);
		assert.deepEqual(lit(wide), ['snippet:0.0', 'snippet:0.1']);
		const narrow = play(createMap({ ...stage(false, true), width: 120, height: 210, regions: REGIONS, seeks: () => [seekAt(['A']), { ...seekAt(['B']), id: 'r' }] }), 3);
		assert.equal(lit(narrow).length, 2, 'one for each of the two searches');
	});

	it('shows every snippet\'s words on a still map with room for them all, and else what the story ends on', () => {
		const shown = (painter: Explainer): string[] => [...painter.anchors].filter(([key, anchor]) => key.startsWith('snippet:') && anchor.alpha === 1).map(([key]) => key).sort();
		const found = (painter: Explainer): string[] => [...painter.anchors].filter(([key, anchor]) => key.startsWith('snippet:') && anchor.found === true).map(([key]) => key).sort();
		const still = createMap({ ...stage(false, false), regions: REGIONS, seeks: () => [seekAt(['A'])] });
		still.frame(0, 0);
		assert.equal(shown(still).length, 4, 'every word shows');
		const ended = play(createMap({ ...stage(false, true), regions: REGIONS, seeks: () => [seekAt(['A'])] }), 3);
		assert.deepEqual(still.pixels, ended.pixels, 'the same two points are lit, with their lines');
		assert.deepEqual(found(still), ['snippet:0.0', 'snippet:0.1'], 'and the page is told which two');
		// Eight snippets, each as wide as a phone's map: there is room for some, and not for all.
		const crowd = [{ name: 'A', snippets: ['a1', 'a2', 'a3', 'a4'] }, { name: 'B', snippets: ['b1', 'b2', 'b3', 'b4'] }];
		const sizes = (): ReadonlyMap<string, Size> => new Map(['0.0', '0.1', '0.2', '0.3', '1.0', '1.1', '1.2', '1.3'].map((key) => [`snippet:${key}`, { width: 100, height: 18 }] as const));
		const narrow = { width: 120, height: 210, regions: crowd, seeks: () => [seekAt(['A'])], sizes };
		const phone = createMap({ ...stage(false, false), ...narrow });
		phone.frame(0, 0);
		const story = play(createMap({ ...stage(false, true), ...narrow }), 3);
		assert.deepEqual(shown(phone), found(phone), 'a phone\'s still map shows only what the search found');
		assert.deepEqual(shown(phone), shown(story), 'as the story ends');
		assert.ok(shown(phone).length > 0);
	});

	it('never puts a word on a map nearer another region than its own point, narrow or wide, moving or still', () => {
		const away = (box: Box, [x, y]: readonly [number, number]): number => Math.hypot(Math.max(box.x - x, 0, x - box.x - box.width), Math.max(box.y - y, 0, y - box.y - box.height));
		const strays = (painter: Explainer, regions: typeof REGIONS, sizes: ReadonlyMap<string, Size>): string[] => {
			const area = mapArea(painter.width, painter.height), laid = mapOf(regions, narrowMap(painter.width));
			const at = (x: number, y: number): readonly [number, number] => [area.x + x * area.width, area.y + y * area.height];
			return [...painter.anchors].filter(([key, anchor]) => key.startsWith('snippet:') && anchor.alpha === 1).filter(([key, anchor]) => {
				const [i, j] = key.slice('snippet:'.length).split('.').map(Number) as [number, number], box = { x: anchor.x, y: anchor.y, ...sizes.get(key)! };
				const own = away(box, at(laid[i]!.snippets[j]!.x, laid[i]!.snippets[j]!.y));
				return laid.some((region, r) => r !== i && away(box, at(region.x, region.y)) <= own);
			}).map(([key]) => key);
		};
		const shown = (painter: Explainer): number => [...painter.anchors].filter(([key, anchor]) => key.startsWith('snippet:') && anchor.alpha === 1).length;
		// A map 120 pixels wide, as on a phone, with words 80 pixels wide.
		const four = ['A', 'B', 'C', 'D'].map((name) => ({ name, snippets: [`${name}1`, `${name}2`] }));
		const phone = new Map(four.flatMap((region, i) => region.snippets.map((_, j) => [`snippet:${String(i)}.${String(j)}`, { width: 80, height: 8 }] as const)));
		// The post's map at 1280px, with its words at the sizes the page measured, and 330px tall as it
		// was before. At that height the word for B3 had no free place by its own point.
		const post = ['A', 'B', 'C', 'D'].map((name) => ({ name, snippets: [`${name}1`, `${name}2`, `${name}3`] }));
		const desktop = new Map<string, Size>([
			...[34, 18, 21, 24].map((width, i) => [`region:${String(i)}`, { width, height: 6 }] as const),
			...[[33, 57, 72], [56, 50, 68], [67, 54, 54], [57, 63, 58]].flatMap((row, i) => row.map((width, j) => [`snippet:${String(i)}.${String(j)}`, { width, height: 10 }] as const)),
			['seek:q', { width: 71, height: 9 }], ['seek:b0', { width: 57, height: 10 }], ['seek:b1', { width: 63, height: 10 }], ['seek:b2', { width: 60, height: 10 }],
		]);
		const cases = [
			{ width: 120, height: 210, regions: four, sizes: phone, seeks: [seekAt(['A'])] },
			{ width: 242, height: 110, regions: post, sizes: desktop, seeks: [{ ...seekAt(['C', 'D']), near: 3 }] },
			{ width: 242, height: 110, regions: post, sizes: desktop, seeks: ['A', 'B', 'C'].map((name, k): Seek => ({ id: `b${String(k)}`, x: 0, y: 0, from: [0.5, -0.12], to: [name], at: 0, near: 2 })) },
		];
		for (const { seeks, sizes, ...map } of cases) {
			const where = `${String(map.width)} by ${String(map.height)}, ${String(seeks.length)} searches`;
			const moving = play(createMap({ ...stage(false, true), ...map, seeks: () => seeks, sizes: () => sizes }), 3);
			const still = createMap({ ...stage(false, false), ...map, seeks: () => seeks, sizes: () => sizes });
			still.frame(0, 0);
			assert.deepEqual(strays(moving, map.regions, sizes), [], `${where}, moving`);
			assert.deepEqual(strays(still, map.regions, sizes), [], `${where}, still`);
			assert.ok(shown(moving) > 0 && shown(still) > 0, `${where}: and words show`);
		}
	});

	it('places the words on a map where they cover no other words', () => {
		const sizes = new Map<string, { width: number; height: number }>([...['region:0', 'region:1'].map((key) => [key, { width: 30, height: 6 }] as const), ...['snippet:0.0', 'snippet:0.1', 'snippet:1.0', 'snippet:1.1'].map((key) => [key, { width: 40, height: 7 }] as const), ['seek:q', { width: 44, height: 8 }] as const]);
		const painter = createMap({ ...stage(false, false), regions: REGIONS, seeks: () => [seekAt(['A'])], sizes: () => sizes });
		painter.frame(0, 0);
		const shown = [...painter.anchors].filter(([, anchor]) => anchor.alpha === 1).map(([key, anchor]) => ({ key, x: anchor.x, y: anchor.y, ...sizes.get(key)! }));
		for (const a of shown) {
			assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.width <= W && a.y + a.height <= H, `${a.key} stays on the stage`);
			for (const b of shown) if (a !== b) assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y, `${a.key} and ${b.key} overlap`);
		}
	});

	it('uploads every page or only the changed ones, and counts them', () => {
		assert.deepEqual(changedOf(48, 5), changedOf(48, 5), 'the same pages every time');
		assert.equal(new Set(changedOf(48, 5)).size, 5, 'five different pages');
		assert.ok(changedOf(48, 5).every((page) => page >= 0 && page < 48));
		assert.equal(uploadsOf(48, changedOf(48, 5), true).length, 48);
		assert.equal(uploadsOf(48, changedOf(48, 5), false).length, 5);
		const deploy = createDeploy({ ...stage(false, true), height: deployLayout(W, 16).height, pages: 16, changed: changedOf(16, 3), deploy: () => ({ every: false, started: 0 }) });
		play(deploy, 0.1);
		assert.equal(deploy.uploaded, 0, 'none has arrived at the start');
		play(deploy, 3);
		assert.deepEqual([deploy.uploaded, deploy.total], [3, 3]);
		const still = createDeploy({ ...stage(false, false, null), height: deployLayout(W, 16).height, pages: 16, changed: changedOf(16, 3), deploy: () => ({ every: false, started: null }) });
		still.frame(0, 1);
		assert.deepEqual([still.uploaded, still.total], [3, 3], 'still, every upload has arrived, though no deploy began');
	});

	it('draws a share as that much of its bar, a count as that many blocks, and a change as two bars on one scale', () => {
		const painter = play(PAINTERS['numbers']!(false, true), 30), accent = inksOf(false).accent, soft = inksOf(false).soft;
		const row = (y: number, colour: number): number => { let n = 0; for (let x = 0; x < W; x++) if (painter.pixels[y * W + x] === colour) n++; return n; };
		assert.equal(row(12, accent), 56, 'the 56% bar fills 56 of its 100 pixels');
		let blocks = 0;
		for (let y = 30; y < 39; y++) for (let x = 10; x < 110; x++) if (painter.pixels[y * W + x] === accent) blocks++;
		assert.equal(blocks, 70 * 4, 'seventy blocks of two by two');
		assert.equal(row(72, accent), 100, 'the larger end fills the bar');
		assert.ok(row(62, soft) <= 2, 'and the smaller one is a sliver, as 1,000 is of 52,100');
	});

	it('draws a match\'s lines one left item at a time, and marks each right item with the items it answers', () => {
		const painter = PAINTERS['match']!(false, true, 0);
		play(painter, 1.2);
		const marks = (j: number): number => { let n = 0; for (let y = 10 + j * 20; y < 18 + j * 20; y++) for (let x = 174; x < 194; x++) if (painter.pixels[y * W + x] !== 0) n++; return n; };
		assert.equal(marks(0), 0, 'no marks before the lines reach');
		play(painter, 30);
		assert.ok(marks(0) > marks(1) && marks(1) > 0, 'the first answers two items, the second one');
	});

	it('strings the bunting from the left, reaches each item of a schedule in turn, fills the stein last, and rests at the last item', () => {
		const painter = PAINTERS['schedule']!(false, true, 0);
		const inked = (x0: number, y0: number, w: number, h: number, colour?: number): number => {
			let n = 0;
			for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (colour === undefined ? painter.pixels[y * W + x] !== 0 : painter.pixels[y * W + x] === colour) n++;
			return n;
		};
		const alphas = (): number[] => [0, 1, 2].map((k) => painter.anchors.get(`item:${String(k)}`)!.alpha);
		play(painter, 0.5);
		assert.ok(inked(4, 2, 60, 12) > 0 && inked(136, 2, 60, 12) === 0, 'the bunting is part way across');
		assert.deepEqual(alphas(), [0, 0, 0], 'no item before the marker reaches it');
		play(painter, 2);
		assert.deepEqual(alphas(), [1, 0, 0], 'the first item, once the marker is there');
		assert.ok(inked(20, 19, 26, 18) > 0 && inked(20, 41, 26, 18) === 0, 'and its picture, and not the next');
		play(painter, scheduleLength(3));
		assert.deepEqual(alphas(), [1, 1, 1]);
		const beer = inked(20, 63, 26, 18, inksOf(false).accent);
		const still = PAINTERS['schedule']!(false, false, null);
		still.frame(0, 0);
		assert.ok(beer > 20, `the stein is full of beer: ${String(beer)} pixels`);
		// The marker stands to the left of the last stop, and nowhere by the first.
		const marker = (p: Explainer, y: number): number => { let n = 0; for (let j = y - 3; j <= y + 3; j++) for (let x = 5; x < 9; x++) if (p.pixels[j * W + x] !== 0) n++; return n; };
		assert.ok(marker(still, 72) > 0 && marker(still, 28) === 0, 'still, the marker rests at the last item');
	});

	it('plays an animated heading: its emblem moves and a curtain covers the words, then the emblem rests and the words are bare', () => {
		const mark = 20, W = 120, H = 22;
		for (const style of ['atoms', 'qubits', 'bits']) {
			let started: number | null = null;
			const painter = createEmblem({ width: W, height: H, night: false, moving: true, started: () => started, style, mark });
			const count = (from: number, to: number): number => { let n = 0; for (let y = 0; y < H; y++) for (let x = from; x < to; x++) if (painter.pixels[y * W + x] !== 0) n++; return n; };
			painter.frame(0, 5);
			assert.ok(count(mark + 2, W) > (W - mark - 2) * H * 0.9, `${style}: waiting, the curtain covers the words`);
			started = 5;
			painter.frame(0, 5.4);
			const early = painter.pixels.slice();
			painter.frame(0, 5.9);
			assert.ok(early.some((c, i) => c !== painter.pixels[i]), `${style}: it moves`);
			painter.frame(0, 5 + EMBLEM_LENGTH);
			assert.equal(count(mark + 2, W), 0, `${style}: at the end the words are bare`);
			assert.ok(count(0, mark) > 15, `${style}: and the emblem stands beside them`);
			const end = painter.pixels.slice();
			const still = createEmblem({ width: W, height: H, night: false, moving: false, started: () => null, style, mark });
			still.frame(0, 0);
			assert.deepEqual([...still.pixels], [...end], `${style}: with motion off it shows that end`);
		}
	});

	it('runs a schedule\'s rail across when the page puts its stops in a row, and rests the marker over the last one', () => {
		const across = boxes(Object.fromEntries([0, 1, 2].flatMap((k) => [
			[`slot:rail:${String(k)}`, [4 + k * 64, 20, 60, 10]], [`slot:item:${String(k)}`, [21 + k * 64, 32, 26, 18]], [`item:${String(k)}`, [10 + k * 64, 54, 48, 10]],
		])) as Record<string, [number, number, number, number]>);
		const still = createSchedule({ ...stage(false, false, null), boxes: across, kinds: ['talk', 'panel', 'drinks'] });
		still.frame(0, 0);
		const above = (x: number): number => { let n = 0; for (let y = 18; y <= 22; y++) for (let i = x - 3; i <= x + 3; i++) if (still.pixels[y * W + i] !== 0) n++; return n; };
		assert.ok(above(162) > 0, 'the marker points down at the last stop');
		assert.equal(above(34), 0, 'and is nowhere over the first');
		let rail = 0;
		for (let x = 34; x <= 162; x++) if (still.pixels[25 * W + x] !== 0) rail++;
		assert.equal(rail, 129, 'the rail runs the whole way across between the stops');
	});

	it('shows an admin\'s edit over its default while edits are live, and the default once they are not', () => {
		let on = true;
		const painter = createPrompts({ ...stage(false, true), boxes: boxes({ 'task:0': [6, 10, 50, 8], 'prompt:0': [96, 10, 90, 8] }), tasks: [{ edit: true }], edits: () => ({ on, since: 0 }) });
		play(painter, 2);
		assert.equal(painter.anchors.get('edit:0')!.alpha, 1);
		on = false;
		painter.frame(1 / 30, 5);
		assert.equal(painter.anchors.get('edit:0')!.alpha, 0);
	});

	it('paints a still frame of every kind of scene for the feeds', () => {
		const stills = [
			stillFrame({ kind: 'pipeline', shape: SHAPE }),
			stillFrame({ kind: 'branches', branches: 3 }),
			stillFrame({ kind: 'prompts', tasks: [{ edit: true }, { edit: false }] }),
			stillFrame({ kind: 'match', links: [[0, 0]], left: 1, right: 1 }),
			stillFrame({ kind: 'numbers', figures: [{ share: 0.5 }] }),
			stillFrame({ kind: 'schedule', kinds: ['talk', 'panel', 'panel', 'drinks'] }),
			stillFrame({ kind: 'map', regions: REGIONS, seeks: [seekAt(['A'])] }),
			stillFrame({ kind: 'deploy', pages: 8, changed: [1, 5] }),
		];
		for (const still of stills) {
			assert.equal(still.pixels.length, still.width * still.height);
			assert.ok(still.pixels.filter((c) => c !== 0).length > 50, 'something drawn');
			assert.ok(!still.pixels.includes(pack(LIME)) || still.pixels.includes(pack(MOSS)), 'in the day\'s inks');
		}
	});
});

// --- the scenes on a page -------------------------------------------------------------------------

describe('a scene as the build writes it into a post', () => {
	// One of every way a scene is laid out, as the page the build writes has it, before any script runs.
	const SCENES = {
		pipeline: readScene('pipeline', 'caption: Three steps\nlanes:\n  - steps:\n      - kind: data\n        name: Data\n      - kind: build\n        name: Build\n      - kind: cloud\n        name: Serve\n'),
		branches: readScene('fanout', 'caption: One build, two pages\nexample: Example pages\nfrom:\n  name: Build\ninto:\n  - name: County\n  - name: State\n'),
		match: readScene('match', 'caption: Asked and answered\nleft:\n  label: Asks\n  items: [one, two]\nright:\n  label: Answers\n  items:\n    - text: a\n      answers: [one, two]\n'),
		prompts: readScene('toggle', 'caption: Prompts\nkind: prompts\nfirst: Edits\nsecond: Defaults\ntasks:\n  - name: Write\n    prompt: Write it.\n    edit: Write it well.\n'),
		numbers: readScene('numbers', 'caption: Commits\nfigures:\n  - label: of the commits\n    value: 56%\n'),
		schedule: readScene('schedule', SCHEDULE),
		map: readScene('cluster', CLUSTER),
		deploy: readScene('toggle', 'caption: A deploy\nkind: deploy\nfirst: All\nsecond: Changed\nstore: S\npages: "8"\nchanged: "2"\n'),
	};
	// Each scene in a column as wide as a post's at a 1280px window, or at a 600px one.
	const page = async (column: number): Promise<string> => {
		const ui = context();
		const html = await render(h(Theme, { value: siteTheme }, Object.entries(SCENES).map(([name, scene]) => h('div', { 'data-column': name, style: `width: ${String(column)}px` }, h(SceneBlock, { id: `scene-${name}`, scene })))), { context: ui });
		return `<!doctype html><style>${ui.theme.markup()}</style><body style="margin: 0">${html}</body>`;
	};
	const placed = async (column: number) => {
		const browser = await chromium.launch();
		try {
			const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
			await view.setContent(await page(column));
			return await view.evaluate(() => Object.fromEntries(Array.from(document.querySelectorAll<HTMLElement>('[data-column]')).map((column) => {
				const stage = column.querySelector('[data-scene] > [id]')!.getBoundingClientRect(), canvas = column.querySelector('canvas')!.getBoundingClientRect(), box = column.getBoundingClientRect();
				return [column.dataset['column']!, { width: Math.round(stage.width), left: stage.left - box.left, right: box.right - stage.right, canvas: [canvas.left - stage.left, canvas.top - stage.top] }];
			})));
		} finally {
			await browser.close();
		}
	};

	it('stands a scene narrower than its column in the middle of it, its canvas with it, and leaves one that needs the column as it is', async () => {
		const wide = await placed(726);
		for (const name of ['pipeline', 'branches', 'match']) {
			const { width, left, right, canvas } = wide[name]!;
			assert.ok(width < 726 && Math.abs(left - right) <= 1, `${name}: ${String(width)}px wide, ${String(left)}px from the left and ${String(right)}px from the right`);
			assert.deepEqual(canvas, [0, 0], `${name}: its canvas at its stage's corner`);
		}
		for (const name of ['prompts', 'numbers', 'schedule', 'map', 'deploy']) assert.equal(wide[name]!.width, 726, `${name} takes the whole column`);
		const stacked = (await placed(520))['prompts']!;
		assert.ok(stacked.width < 520 && Math.abs(stacked.left - stacked.right) <= 1, `prompts stacked: ${String(stacked.width)}px wide, ${String(stacked.left)}px from the left and ${String(stacked.right)}px from the right`);
	});

	it('names each scene by its caption and does not show it, and shows what is invented', async () => {
		const browser = await chromium.launch();
		try {
			const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
			await view.setContent(await page(726));
			const shown = await view.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).map((scene) => {
				const caption = scene.querySelector('figcaption')!, box = caption.getBoundingClientRect();
				return {
					named: scene.getAttribute('aria-label'),
					caption: caption.textContent, seen: box.width > 1 || box.height > 1 || !getComputedStyle(caption).clip.startsWith('rect'),
					example: Array.from(scene.querySelectorAll<HTMLElement>('p')).find((line) => line.textContent === 'Example pages')?.checkVisibility() ?? null,
				};
			}));
			const captions = Object.values(SCENES).map((scene) => scene.data.caption);
			assert.deepEqual(shown.map((scene) => scene.named), captions, 'each figure is named by its caption');
			assert.deepEqual(shown.map((scene) => scene.caption), captions, 'which its figcaption holds');
			assert.deepEqual(shown.map((scene) => scene.seen), captions.map(() => false), 'and does not show');
			assert.equal(shown[1]!.example, true, 'what is made up is labelled');
			// Chrome takes no figure's name from its figcaption, so the name it gives a screen reader is checked too.
			const cdp = await view.context().newCDPSession(view);
			const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
			const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-scene]' });
			const names = await Promise.all(nodeIds.map(async (nodeId) => String((await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })).nodes[0]?.name?.value)));
			assert.deepEqual(names, captions, 'as Chrome gives it to a screen reader');
		} finally {
			await browser.close();
		}
	});
});
