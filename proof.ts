// The site doing its real job, in a real browser, against the real server.
//
// Tests pin pieces; this proves the whole thing: the server serves what the build wrote, the page
// comes alive without replacing anything the server sent, every route works as a deep link (the
// blog index and the newest post among them, with the title as the h1 and every image loaded),
// the contact form actually posts, the pages look right at desktop and phone width, every page
// passes axe's WCAG 2.1 AA rules in both modes and every word on it stands out from the scenes
// drawn behind it, the Motion switch holds the scenes still, the pixel scenes in posts keep what
// reduced motion promises and come alive on a development bundle with nothing thrown, and the
// radio process, run as the droplet runs it, streams audio that is not silence to a listener
// joining now.
//
// Run: npm run proof   (after npm run build, or at least
//      vite build --configLoader native && npm run pages). It builds the development bundle
//      itself, into a temporary directory.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { visit, visits } from '@aweftjs/logs';
import { audit } from '@aweftjs/testing/browser';
import { chromium } from 'playwright';

import { mapArea, mapOf, narrowMap } from './frontend/scenes.ts';
import { heroScale } from './frontend/strip.ts';
import { firstSlot, slotOf } from './radio/schedule.ts';
import type { StyleName } from './radio/config.ts';
import { boot, mailbox } from './tests/boot.ts';

const shots = fileURLToPath(new URL('./proof-shots/', import.meta.url));
mkdirSync(shots, { recursive: true });

// The mail credentials live in the environment, as they do in production; only the endpoint is
// moved, so nothing leaves this machine.
process.env['RESEND_API'] = 'proof-key';
process.env['EMAIL_FROM'] = 'proof@torrin.me';
process.env['EMAIL_TO'] = 'torrin@torrin.me';
process.env['EMAIL_SUBJECT'] = 'torrin.me proof run';

interface Heard { readonly frames: number; readonly rms: number; readonly health: { ok: boolean; listeners: number }; readonly now: { style: string; name: string } }

/** The moment thirty seconds into the first track of a style, so the recording has the drums in it and not the intro's fade. */
const startOf = (style: StyleName): number => slotOf(firstSlot(style)).begins + 30;

const tuneIn = async (seconds: number, style: StyleName): Promise<Heard> => {
	const port = 4174;
	const radio = spawn(process.execPath, [fileURLToPath(new URL('./radio/main.ts', import.meta.url))], {
		env: { ...process.env, RADIO_PORT: String(port), RADIO_START: String(startOf(style)) },
		stdio: ['ignore', 'pipe', 'inherit'],
	});
	try {
		await new Promise<void>((ready, failed) => {
			radio.stdout.on('data', (line: Buffer) => { if (line.toString().includes('radio on')) ready(); });
			radio.once('exit', (code) => { failed(new Error(`the radio exited with ${String(code)} before it was ready`)); });
		});
		const stopper = new AbortController();
		setTimeout(() => { stopper.abort(); }, seconds * 1000);
		const answer = await fetch(`http://127.0.0.1:${String(port)}/stream`, { signal: stopper.signal });
		assert.equal(answer.headers.get('content-type'), 'audio/mpeg');
		const health = await (await fetch(`http://127.0.0.1:${String(port)}/health`)).json() as Heard['health'];
		const now = await (await fetch(`http://127.0.0.1:${String(port)}/now`)).json() as Heard['now'];
		const chunks: Uint8Array[] = [];
		try {
			const reader = answer.body!.getReader();
			for (;;) {
				const next = await reader.read();
				if (next.done) break;
				chunks.push(next.value);
			}
		} catch (error) {
			if ((error as Error).name !== 'AbortError') throw error;
		}
		const mp3 = Buffer.concat(chunks);
		let frames = 0;
		for (let i = 0; i < mp3.length - 1; i++) if (mp3[i] === 0xff && ((mp3[i + 1] ?? 0) & 0xe0) === 0xe0) frames++;

		// Decoded by ffmpeg, the same tool the radio encodes with, to 16-bit mono samples.
		const decoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-f', 's16le', '-ac', '1', '-ar', '48000', 'pipe:1'], { stdio: ['pipe', 'pipe', 'inherit'] });
		const decoded: Buffer[] = [];
		decoder.stdout.on('data', (chunk: Buffer) => { decoded.push(chunk); });
		decoder.stdin.end(mp3);
		await new Promise<void>((done) => { decoder.once('exit', () => { done(); }); });
		const pcm = Buffer.concat(decoded);
		let sum = 0;
		for (let i = 0; i + 1 < pcm.length; i += 2) { const sample = pcm.readInt16LE(i) / 32768; sum += sample * sample; }
		const rms = Math.sqrt(sum / Math.max(1, pcm.length / 2));
		return { frames, rms, health, now };
	} finally {
		radio.kill('SIGTERM');
	}
};

// The answer the page's fetch of /radio/now gets. The site's server has no such route (in
// production nginx proxies it to the radio), so the browser is given this one.
const ON_AIR = {
	time: Date.now() / 1000, backlogSeconds: 1.5, slot: 7, style: 'synthwave', name: 'Proof Signal', tempo: 100,
	key: 'A minor', bar: 3, bars: 52, begins: Date.now() / 1000 - 30, seconds: 210, blockEnds: Date.now() / 1000 + 600,
};
const onAir = async (view: import('playwright').Page): Promise<void> => {
	await view.route('**/radio/now', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ON_AIR) }));
};

// A word or an icon on a page: its colour, the contrast it needs, and its box in the window.
interface Mark { readonly what: string; readonly color: string; readonly need: number; readonly box: readonly [number, number, number, number] }

/**
 * Every visible word and icon on the page. A word's own line box, not its element's, since a
 * heading's box runs the width of the column. Emoji are left out: they are drawn in their own
 * colours. 4.5:1 for text, 3:1 for large text (24px, or 18.66px bold) and for icons.
 */
const marksOf = (): Mark[] => {
	const found: Mark[] = [];
	const large = (style: CSSStyleDeclaration): boolean => {
		const size = parseFloat(style.fontSize);
		return size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
	};
	// Visually hidden text, for a screen reader only, is clipped to nothing.
	const hidden = (element: Element): boolean => {
		for (let at: Element | null = element; at !== null; at = at.parentElement) if (getComputedStyle(at).clip.startsWith('rect')) return true;
		return !element.checkVisibility({ opacityProperty: true, visibilityProperty: true });
	};
	const box = (rect: DOMRect): Mark['box'] => [rect.left, rect.top, rect.right, rect.bottom];
	// What of a word shows: a code block that scrolls sideways hides the rest of a long line.
	const shown = (element: Element, rect: DOMRect): Mark['box'] => {
		let [left, top, right, bottom] = box(rect);
		for (let at = element.parentElement; at !== null; at = at.parentElement) {
			const style = getComputedStyle(at);
			if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
			const clip = at.getBoundingClientRect();
			left = Math.max(left, clip.left); top = Math.max(top, clip.top);
			right = Math.min(right, clip.right); bottom = Math.min(bottom, clip.bottom);
		}
		return [left, top, right, bottom];
	};
	const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
		const parent = node.parentElement;
		if (parent === null || parent.closest('script, style, noscript, svg, textarea') !== null || hidden(parent)) continue;
		const style = getComputedStyle(parent);
		for (const word of (node.textContent ?? '').matchAll(/\S+/gu)) {
			if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(word[0])) continue;
			const range = document.createRange();
			range.setStart(node, word.index);
			range.setEnd(node, word.index + word[0].length);
			for (const rect of Array.from(range.getClientRects())) {
				const [left, top, right, bottom] = shown(parent, rect);
				if (right - left >= 2 && bottom - top >= 2) found.push({ what: word[0], color: style.color, need: large(style) ? 3 : 4.5, box: [left, top, right, bottom] });
			}
		}
	}
	for (const icon of Array.from(document.querySelectorAll('svg, [data-icon]'))) {
		const rect = icon.getBoundingClientRect();
		if (hidden(icon) || rect.width < 2 || rect.height < 2) continue;
		found.push({ what: icon.closest('[aria-label]')?.getAttribute('aria-label') ?? 'an icon', color: getComputedStyle(icon).color, need: 3, box: box(rect) });
	}
	return found;
};

/** What a page looks like with its words and icons taken off: everything they are drawn over. */
const BARE = `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important;
	text-decoration-color: transparent !important; text-shadow: none !important; transition: none !important; }
svg, [data-icon] { visibility: hidden !important; }`;

/**
 * The words of the pixel scenes on a page that do not show, those that cover each other, those a
 * screen reader is still given though they do not show, and the maps where no search found
 * anything. All show but those the reader brings up: a deploy's page names, under the pointer,
 * the state a switch is not on, and in a scene under 440px wide, a phone's, the snippets a map's
 * search did not find, which a tap brings up. Every snippet it found shows.
 */
const sceneWords = (): { hidden: string[]; overlaps: string[]; unseen: string[]; unfound: string[] } => {
	const things = Array.from(document.querySelectorAll<HTMLElement>('[data-scene] [data-thing]')).map((element) => ({
		element, name: element.dataset['thing']!, scene: element.closest<HTMLElement>('[data-scene]')!, box: element.getBoundingClientRect(),
	}));
	const shown = things.filter((thing) => Number(getComputedStyle(thing.element).opacity) >= 1);
	const hidden = things.filter((thing) => !shown.includes(thing) && !/^page:|^seek:one$/.test(thing.name)
		&& !(thing.name.startsWith('snippet:') && !thing.element.hasAttribute('data-found') && thing.scene.getBoundingClientRect().width < 440)).map((thing) => thing.name);
	const overlaps: string[] = [];
	for (const a of shown) for (const b of shown) {
		if (a.name >= b.name || a.scene !== b.scene || a.element.contains(b.element) || b.element.contains(a.element)) continue;
		// An admin's edit lies over the prompt it replaces.
		if (a.name.replace('edit:', 'prompt:') === b.name) continue;
		const across = Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left), down = Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top);
		if (across > 3 && down > 3) overlaps.push(`${a.name} and ${b.name}`);
	}
	const unseen = things.filter((thing) => !shown.includes(thing) && thing.element.closest('[aria-hidden="true"]') === null).map((thing) => thing.name);
	const unfound = Array.from(document.querySelectorAll<HTMLElement>('[data-scene="cluster"], [data-scene="fanout"]'))
		.filter((scene) => scene.querySelector('[data-thing^="snippet:"]') !== null && scene.querySelector('[data-found]') === null).map((scene) => scene.dataset['scene']!);
	return { hidden, overlaps, unseen, unfound };
};

/** What a scene shows: its canvas, and how much of each of its words. */
const sceneState = (scene: Element): string =>
	`${scene.querySelector('canvas')!.toDataURL()} ${Array.from(scene.querySelectorAll<HTMLElement>('[data-thing]')).map((thing) => `${getComputedStyle(thing).opacity}${thing.style.transform}${thing.textContent ?? ''}`).join()}`;

/** A post's scene fences, as the build wrote them beside the post. */
type Fence = { scene?: { name: string; data: { caption: string; example?: string; kind?: string; searches?: { words: string }[]; regions?: { name: string; snippets: string[] }[] } } };

/** Each map on the page: its stage's size, and the box of each word it shows, from the stage's corner. */
const mapWords = (): { width: number; height: number; words: { name: string; box: readonly [number, number, number, number] }[] }[] => Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).filter((scene) => scene.querySelector('[data-thing^="snippet:"]') !== null).map((scene) => {
	const stage = scene.querySelector<HTMLElement>('[id]')!.getBoundingClientRect();
	return {
		width: stage.width, height: stage.height,
		words: Array.from(scene.querySelectorAll<HTMLElement>('[data-thing]')).filter((word) => Number(getComputedStyle(word).opacity) >= 1).map((word) => {
			const box = word.getBoundingClientRect();
			return { name: word.dataset['thing']!, box: [box.left - stage.left, box.top - stage.top, box.right - stage.left, box.bottom - stage.top] as const };
		}),
	};
});

/**
 * The words on maps that break a rule: a snippet nearer the middle of another region than its own
 * point, which makes it look like part of that region, and two words that cover each other. The
 * points and middles are where the painter puts them for a stage this size.
 */
const misplaced = (maps: ReturnType<typeof mapWords>, regions: readonly (readonly { name: string; snippets: readonly string[] }[])[]): string[] => {
	const away = (box: readonly number[], [x, y]: readonly [number, number]): number => Math.hypot(Math.max(box[0]! - x, 0, x - box[2]!), Math.max(box[1]! - y, 0, y - box[3]!));
	return maps.flatMap((map, k) => {
		const size = heroScale(map.width), W = Math.ceil(map.width / size), area = mapArea(W, Math.ceil(map.height / size));
		const at = (x: number, y: number): readonly [number, number] => [(area.x + x * area.width) * size, (area.y + y * area.height) * size];
		const laid = mapOf(regions[k]!, narrowMap(W));
		const strays = map.words.filter((word) => {
			if (!word.name.startsWith('snippet:')) return false;
			const [i, j] = word.name.slice('snippet:'.length).split('.').map(Number) as [number, number];
			const own = away(word.box, at(laid[i]!.snippets[j]!.x, laid[i]!.snippets[j]!.y));
			return laid.some((region, r) => r !== i && away(word.box, at(region.x, region.y)) <= own);
		}).map((word) => `map ${String(k + 1)}: ${word.name} is by another region`);
		const covered = map.words.flatMap((a) => map.words.filter((b) => a.name < b.name
			&& Math.min(a.box[2], b.box[2]) - Math.max(a.box[0], b.box[0]) > 3 && Math.min(a.box[3], b.box[3]) - Math.max(a.box[1], b.box[1]) > 3).map((b) => `map ${String(k + 1)}: ${a.name} and ${b.name} overlap`));
		return [...strays, ...covered];
	});
};

/**
 * What is wrong with where each pixel scene stands and where its canvas draws. The canvas covers
 * the stage at the scene's pixel size. A scene whose words, set on one line, are narrower than the
 * column stands in its middle, to 2px. In a scene the page lays out, every pixel drawn is among
 * its words and pictures, and each picture's box on the canvas has drawing in it. A map and a
 * deploy place their own words on their drawing, across the column, so for them only the first holds.
 */
const sceneLayout = (): string[] => {
	const wrong: string[] = [];
	Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).forEach((scene, k) => {
		const name = `scene ${String(k + 1)} (${scene.dataset['scene']!})`;
		const stage = scene.querySelector<HTMLElement>('[id]')!, canvas = stage.querySelector('canvas')!;
		const column = scene.getBoundingClientRect(), on = stage.getBoundingClientRect(), drawn = canvas.getBoundingClientRect();
		const size = drawn.width / canvas.width, px = column.width >= 440 ? 3 : 2;
		if (Math.abs(drawn.left - on.left) > 0.5 || Math.abs(drawn.top - on.top) > 0.5) wrong.push(`${name}: its canvas is not at its stage's corner`);
		if (Math.abs(size - px) > 0.01) wrong.push(`${name}: its canvas draws ${String(size)}px pixels, and the scene's are ${String(px)}px`);
		if (stage.querySelector('[data-placed]') !== null) return;

		// What it shows: each thing and picture box, a boxed thing with its pixel outline, and any other words.
		const boxes: DOMRect[] = [];
		for (const element of Array.from(stage.querySelectorAll<HTMLElement>('[data-thing], [data-slot]'))) {
			const box = element.getBoundingClientRect(), style = getComputedStyle(element);
			if (box.width < 1 || box.height < 1 || Number(style.opacity) === 0) continue;
			const out = style.boxShadow === 'none' ? 0 : px;
			boxes.push(new DOMRect(box.x - out, box.y - out, box.width + 2 * out, box.height + 2 * out));
		}
		const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
		for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
			const parent = node.parentElement!;
			if ((node.textContent ?? '').trim() === '' || parent.closest('[data-thing]') !== null || !parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
			const range = document.createRange();
			range.selectNodeContents(node);
			boxes.push(...Array.from(range.getClientRects()));
		}
		const left = Math.min(...boxes.map((box) => box.left)), right = Math.max(...boxes.map((box) => box.right));
		const top = Math.min(...boxes.map((box) => box.top)), bottom = Math.max(...boxes.map((box) => box.bottom));

		// How wide its words are on one line: a hidden copy of the scene, its stage as wide as they need.
		const copy = scene.cloneNode(true) as HTMLElement;
		copy.querySelectorAll('[id]').forEach((element) => { element.removeAttribute('id'); });
		Object.assign(copy.style, { position: 'absolute', left: '0', top: '0', width: `${String(column.width)}px`, visibility: 'hidden' });
		scene.after(copy);
		const own = copy.querySelector('canvas')!.parentElement!;
		Object.assign(own.style, { width: 'max-content', maxWidth: 'none' });
		const needs = own.getBoundingClientRect().width;
		copy.remove();
		const fromLeft = left - column.left, fromRight = column.right - right;
		if (needs < column.width - 2 && Math.abs(fromLeft - fromRight) > 2) wrong.push(`${name}: ${String(Math.round(needs))}px wide on one line in a ${String(Math.round(column.width))}px column, and ${String(Math.round(fromLeft))}px from its left and ${String(Math.round(fromRight))}px from its right`);

		const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
		const inked = (x0: number, y0: number, x1: number, y1: number): boolean => {
			for (let y = Math.max(0, y0); y < Math.min(canvas.height, y1); y++) for (let x = Math.max(0, x0); x < Math.min(canvas.width, x1); x++) if (data[(y * canvas.width + x) * 4 + 3]! > 0) return true;
			return false;
		};
		let inkLeft = Infinity, inkRight = -Infinity, inkTop = Infinity, inkBottom = -Infinity;
		for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
			if (data[(y * canvas.width + x) * 4 + 3] === 0) continue;
			inkLeft = Math.min(inkLeft, x); inkRight = Math.max(inkRight, x + 1); inkTop = Math.min(inkTop, y); inkBottom = Math.max(inkBottom, y + 1);
		}
		const slack = 2 * size, at = (x: number, y: number): readonly [number, number] => [drawn.left + x * size, drawn.top + y * size];
		const [l, t] = at(inkLeft, inkTop), [r, b] = at(inkRight, inkBottom);
		if (l < left - slack || r > right + slack || t < top - slack || b > bottom + slack) wrong.push(`${name}: it draws from ${String(Math.round(l))} to ${String(Math.round(r))} across, and its words and pictures run from ${String(Math.round(left))} to ${String(Math.round(right))}`);
		for (const slot of Array.from(stage.querySelectorAll<HTMLElement>('[data-slot]'))) {
			const box = slot.getBoundingClientRect();
			if (box.width < 1 || box.height < 1 || box.left < drawn.left || box.right > drawn.right || box.top < drawn.top || box.bottom > drawn.bottom) continue;
			if (!inked(Math.floor((box.left - drawn.left) / size), Math.floor((box.top - drawn.top) / size), Math.ceil((box.right - drawn.left) / size), Math.ceil((box.bottom - drawn.top) / size))) wrong.push(`${name}: nothing is drawn in its picture ${slot.dataset['slot']!}`);
		}
	});
	return wrong;
};

/**
 * What is wrong with what each pixel scene shows around its pictures, beside what its fence says: a
 * caption that shows, and an example that does not, since a post promises that what it made up is
 * labelled.
 */
const sceneFeet = (said: readonly { caption: string; example: string | null }[]): string[] => {
	const shown = (node: Node): boolean => {
		const parent = node.parentElement!;
		if (!parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
		for (let at: Element | null = parent; at !== null; at = at.parentElement) if (getComputedStyle(at).clip.startsWith('rect')) return false;
		const range = document.createRange();
		range.selectNodeContents(node);
		return Array.from(range.getClientRects()).some((rect) => rect.width >= 2 && rect.height >= 2);
	};
	return Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).flatMap((scene, k) => {
		const name = `scene ${String(k + 1)} (${scene.dataset['scene']!})`, fence = said[k];
		if (fence === undefined) return [`${name}: no fence says it`];
		const texts: string[] = [];
		const walker = document.createTreeWalker(scene, NodeFilter.SHOW_TEXT);
		for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) if ((node.textContent ?? '').trim() !== '' && shown(node)) texts.push((node.textContent ?? '').trim());
		const wrong: string[] = [];
		if (texts.includes(fence.caption)) wrong.push(`${name}: its caption shows`);
		if (fence.example !== null && !texts.includes(fence.example)) wrong.push(`${name}: its example, "${fence.example}", does not show`);
		return wrong;
	});
};

/** Each pixel scene's role and name, as Chrome gives them to a screen reader. */
const sceneNames = async (view: import('playwright').Page): Promise<string[]> => {
	const cdp = await view.context().newCDPSession(view);
	const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
	const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '[data-scene]' });
	const named: string[] = [];
	for (const nodeId of nodeIds) {
		const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
		named.push(`${String(nodes[0]?.role?.value)}: ${String(nodes[0]?.name?.value)}`);
	}
	await cdp.detach();
	return named;
};

/** Where a post's scenes stand and draw, and what they show around their pictures, at one width in one mode. */
const scenesHold = async (view: import('playwright').Page, fences: readonly Fence[], where: string): Promise<void> => {
	assert.deepEqual(await view.evaluate(sceneLayout), [], `${where}: each scene stands in its column, and its canvas draws under and beside its words`);
	const said = fences.flatMap((fence) => (fence.scene === undefined ? [] : [{ caption: fence.scene.data.caption, example: fence.scene.data.example ?? null }]));
	assert.deepEqual(await view.evaluate(sceneFeet, said), [], `${where}: no scene shows its caption, and each shows its example`);
	assert.deepEqual(await sceneNames(view), said.map((scene) => `figure: ${scene.caption}`), `${where}: each scene is a figure named by its caption`);
};

/** True once runScene has sized every scene canvas matching the selector. A canvas whose host has no width or height is skipped, as runScene never paints it. */
const drawn = (selector: string): boolean => Array.from(document.querySelectorAll<HTMLCanvasElement>(selector)).every((canvas) => {
	const box = canvas.parentElement!.getBoundingClientRect();
	return canvas.style.width !== '' || box.width === 0 || box.height === 0;
});

/** The marks with any pixel under them, in a screenshot of the bare page, below the contrast they need. */
const judge = async ([shot, marks]: readonly [string, Mark[]]): Promise<string[]> => {
	const image = new Image();
	image.src = `data:image/png;base64,${shot}`;
	await image.decode();
	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	const context = canvas.getContext('2d')!;
	context.drawImage(image, 0, 0);
	const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
	const channel = (v: number): number => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
	const luminance = (r: number, g: number, b: number): number => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
	const low: string[] = [];
	for (const mark of marks) {
		const [r, g, b] = (mark.color.match(/[\d.]+/g) ?? []).map(Number);
		const ink = luminance(r!, g!, b!);
		let worst = Infinity, count = 0;
		const [x0, y0, x1, y1] = mark.box.map(Math.round) as [number, number, number, number];
		for (let y = Math.max(0, y0); y < Math.min(canvas.height, y1); y++) {
			for (let x = Math.max(0, x0); x < Math.min(canvas.width, x1); x++) {
				const i = (y * canvas.width + x) * 4, under = luminance(data[i]!, data[i + 1]!, data[i + 2]!);
				const ratio = (Math.max(ink, under) + 0.05) / (Math.min(ink, under) + 0.05);
				if (ratio < mark.need) { count++; worst = Math.min(worst, ratio); }
			}
		}
		if (count > 0) low.push(`"${mark.what}" at (${String(x0)}, ${String(y0)}): ${worst.toFixed(2)}:1 under ${String(count)} pixels, needs ${String(mark.need)}:1`);
	}
	return low;
};

const post = await mailbox();
// A fixed port, because the page's own origin has to be allowed before the server starts.
const port = 4173;
const site = await boot({
	Contact: { endpoint: post.url, origins: [`http://127.0.0.1:${String(port)}`] },
	'static/Files': { dir: fileURLToPath(new URL('./dist', import.meta.url)), unknown: '404' },
}, port);
const browser = await chromium.launch();

const problems: string[] = [];

// The newest published post, from the index the build wrote: the page a reader lands on from the
// feed, and the one the blog's markup is proven on.
const index = JSON.parse(readFileSync(new URL('./frontend/data/posts.json', import.meta.url), 'utf8')) as { slug: string; title: string; scenes: number }[];
const newest = index[0]!;
// Every post with a pixel scene in it, which the WCAG pass and the scene checks below cover too.
const sceneful = index.filter((post) => post.scenes > 0);
const PAGES: readonly (readonly [name: string, path: string, h1: string | null])[] = [
	['landing', '/', null],
	['contact', '/contact', null],
	['radio', '/radio', 'Radio'],
	['blog', '/blog', 'Blog'],
	['post', `/blog/${newest.slug}`, newest.title],
];

try {
	for (const [name, path, h1] of PAGES) {
		const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
		await onAir(view);
		view.on('pageerror', (error) => problems.push(`${name}: ${String(error)}`));
		view.on('console', (message) => {
			if (message.type() === 'error') problems.push(`${name} console: ${message.text()}`);
		});
		// Everything the page loads or posts is its own origin: the fonts, the bundle, the log
		// batches. A request anywhere else is a third-party tag that came back.
		view.on('request', (request) => {
			if (!request.url().startsWith(site.url)) problems.push(`${name} left the origin: ${request.url()}`);
		});

		// A deep link, cold. This is how a reader arrives from a search result, and it is the path
		// that breaks first when the written page and the client tree disagree.
		await view.goto(`${site.url}${path}`, { waitUntil: 'networkidle' });

		// Every element the server wrote is still the same node after the page came alive. Marked
		// before hydration finishes would be racy, so this reads what survived instead: the ssg
		// stamp is removed by `attach` only once it has adopted the body it was given.
		const title = await view.title();
		assert.ok(title.length > 0, `${path} has a title after hydration`);

		const text = await view.textContent('body');
		assert.ok((text ?? '').trim().length > 0, `${path} has visible text`);

		// A blog page's first heading is the title the index carries, and every image on it
		// loaded from this origin: a poster the build did not fetch, or a media path the build
		// rewrote wrong, is a broken image here and not on the live site.
		if (h1 !== null) assert.equal(await view.textContent('h1'), h1, `${path} shows its title as the h1`);
		const images = await view.$$eval('img', (found) => found.map((image) => [image.getAttribute('src') ?? '', (image as HTMLImageElement).naturalWidth] as const));
		for (const [src, width] of images) assert.ok(width > 0, `${path}: the image ${src} loaded`);

		await view.screenshot({ path: `${shots}${name}-desktop.png`, fullPage: true });
		await view.setViewportSize({ width: 390, height: 844 });
		await view.screenshot({ path: `${shots}${name}-phone.png`, fullPage: true });

		// The page posts its own record while it is open: the first batch, with the browser's
		// facts, goes on the recorder's timer, and this waits for the server to have answered it
		// before the page goes, the way a real tab's keepalive request outlives a close.
		const logged = await view.waitForResponse((answer) => answer.url() === `${site.url}/api/logs`, { timeout: 15_000 }).catch(() => undefined);
		assert.ok(logged !== undefined && logged.status() === 200, `${name} posted its log batch and was answered 200`);
		await view.close();
	}

	// The landing's strip, its bird and the dark mode switch, as a visitor uses them: the browser
	// draws the strip with a transparent sky, the menu's switch turns the page and the strip
	// dark, and the choice is still there after a reload (work order 485).
	const landing = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	landing.on('pageerror', (error) => problems.push(`mode: ${String(error)}`));
	// Each load of the page is a visit, and every visit must post its first batch, browser facts
	// and all, before the page reloads or closes, as the pages above do.
	// A wait still pending when a check fails rejects as the page closes. It is caught here, so the
	// failure reported is the check's.
	const posted = (): Promise<unknown> => {
		const answered = landing.waitForResponse((answer) => answer.url() === `${site.url}/api/logs`, { timeout: 15_000 });
		answered.catch(() => undefined);
		return answered;
	};
	let batch = posted();
	await landing.goto(`${site.url}/`, { waitUntil: 'commit' });
	// A bird lands on the resume button in the first second and a half, and flies off when the
	// pointer reaches the button.
	const perched = await landing.waitForFunction(
		() => (document.getElementById('hero-bird')?.dataset['state'] === 'perch' ? performance.now() : false),
		undefined,
		{ polling: 'raf', timeout: 5_000 },
	).then(async (at) => Number(await at.jsonValue()), () => Infinity);
	assert.ok(perched <= 1_500, `the bird lands within 1.5s of the page opening, not at ${String(Math.round(perched))}ms`);
	const resume = landing.locator('#hero-strip ~ * a[download]').first();
	const onEdge = await landing.evaluate(() => {
		const hero = document.getElementById('hero-strip')!.parentElement!;
		return document.getElementById('hero-bird')!.getBoundingClientRect().bottom === hero.querySelector('a[download]')!.getBoundingClientRect().top;
	});
	assert.ok(onEdge, 'with its feet on the button');
	await resume.hover();
	const flown = await landing.waitForFunction(
		() => getComputedStyle(document.getElementById('hero-bird')!).display === 'none',
		undefined,
		{ timeout: 5_000 },
	).then(() => true, () => false);
	assert.ok(flown, 'and is gone once the pointer reaches the button');
	await landing.mouse.move(640, 300);
	await landing.waitForLoadState('networkidle');
	// The sky is transparent, so the page shows through it. The far hills at the strip's left edge,
	// half way down, are pale by day and dark by night.
	const skyIs = async (hills: string): Promise<void> => {
		await landing.waitForFunction((want) => {
			const canvas = document.querySelector<HTMLCanvasElement>('#hero-strip canvas');
			if (canvas === null || canvas.width === 0) return false;
			const context = canvas.getContext('2d')!;
			const sky = context.getImageData(0, 0, 1, 1).data[3];
			const [r, g, b] = context.getImageData(0, Math.floor(canvas.height / 2), 1, 1).data;
			return sky === 0 && `${String(r)},${String(g)},${String(b)}` === want;
		}, hills, { timeout: 5_000 });
	};
	await skyIs('227,234,208');
	// The menu floats at the top right of the window, so a visitor deep in the page still has it.
	await landing.evaluate(() => { document.querySelector('h2')!.scrollIntoView(); });
	const menu = await landing.locator('button[aria-label="Menu"]').boundingBox();
	assert.ok(menu !== null && menu.y === 20 && menu.x + menu.width === 1260, `the menu stays at the top right as the page scrolls, not at ${JSON.stringify(menu)}`);
	await landing.click('button[aria-label="Menu"]');
	await landing.click('text=Dark mode');
	await landing.evaluate(() => { scrollTo(0, 0); });
	await skyIs('27,56,28');
	// The page eases into its new background over a moment, so this waits for it to arrive.
	const forest = await landing.waitForFunction(
		() => getComputedStyle(document.querySelector('main')!.parentElement!).backgroundColor === 'rgb(19, 42, 19)',
		undefined,
		{ timeout: 5_000 },
	).then(() => true, () => false);
	assert.ok(forest, 'the switch turns the page forest');
	await batch;
	batch = posted();
	await landing.reload({ waitUntil: 'networkidle' });
	await skyIs('27,56,28');
	assert.equal(await landing.evaluate(() => localStorage.getItem('modeChoice')), 'dark', 'and the choice is kept across a reload');
	await landing.screenshot({ path: `${shots}landing-dark.png` });
	await batch;
	await landing.close();

	// The form, end to end: filled in a real browser, posted to the real route, landing in the
	// endpoint that stands in for Resend.
	const view = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	view.on('pageerror', (error) => problems.push(`form: ${String(error)}`));
	await view.goto(`${site.url}/contact`, { waitUntil: 'networkidle' });

	const before = post.sent.length;
	const sent = await view.evaluate(async () => {
		const answer = await fetch('/contact', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				fullName: 'A Reader', email: 'reader@example.com',
				message: 'Proof program says hello.', page: 'contact', company: '',
			}),
		});
		return { status: answer.status, body: (await answer.json()) as { ok: boolean } };
	});
	assert.equal(sent.status, 200, 'the form post was accepted');
	assert.equal(sent.body.ok, true, 'and answered ok');
	assert.equal(post.sent.length, before + 1, 'and one message reached the endpoint');
	const delivered = post.sent[post.sent.length - 1]!.body as { text?: string };
	assert.ok(String(delivered.text).includes('Proof program says hello.'), 'carrying what was typed');

	// The same form with the honeypot filled: the sender cannot tell, and nothing is sent.
	const trapped = await view.evaluate(async () => {
		const answer = await fetch('/contact', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				fullName: 'A Bot', email: 'bot@example.com',
				message: 'buy things', page: 'contact', company: 'Bot Industries',
			}),
		});
		return { status: answer.status, body: (await answer.json()) as { ok: boolean } };
	});
	assert.deepEqual(trapped, sent, 'the honeypot answers exactly what a real send answers');
	assert.equal(post.sent.length, before + 1, 'and sent nothing');

	// The form as a visitor fills it, with a phone number in the message: a bird lands on the form
	// once it is all in view, the message is sent, and a live region announces it (SC 4.1.3).
	const landed = await view.waitForFunction(() => document.getElementById('contact-bird')?.dataset['state'] === 'perch', undefined, { timeout: 5_000 }).then(() => true, () => false);
	assert.ok(landed, 'a bird lands on the form');
	await view.fill('[aria-label="Full Name"]', 'A Reader');
	await view.fill('[aria-label="Email"]', 'reader@example.com');
	await view.fill('[aria-label="Message"]', 'Call me at 519 555 0100.');
	await view.click('#contact-submit');
	const heard = await view.waitForFunction(() => document.querySelector('[role="status"]')?.textContent?.includes('Received') === true, undefined, { timeout: 5_000 }).then(() => true, () => false);
	assert.ok(heard, 'the page says it was received, in a live region');
	assert.equal(post.sent.length, before + 2, 'and it reached the endpoint');
	assert.ok(String((post.sent[post.sent.length - 1]!.body as { text?: string }).text).includes('519 555 0100'), 'digits and all');
	const formLogged = await view.waitForResponse((answer) => answer.url() === `${site.url}/api/logs`, { timeout: 15_000 }).catch(() => undefined);
	assert.ok(formLogged !== undefined && formLogged.status() === 200, 'the form page posted its log batch and was answered 200');
	await view.close();

	// The pages recorded themselves: closing a page sends its last batch, so by now the store
	// holds a visit per page opened above, each with the browser's facts and the URL it showed.
	const expected = PAGES.length + 1;
	const recorded = await (async () => {
		for (let attempt = 0; attempt < 50; attempt++) {
			const found = await visits(site.store, {});
			if (found.length >= expected) return found;
			await new Promise((done) => setTimeout(done, 200));
		}
		return visits(site.store, {});
	})();
	assert.ok(recorded.length >= expected, `${String(expected)} pages were opened and ${String(recorded.length)} visits were recorded`);
	const opened = await Promise.all(recorded.map((summary) => visit(site.store, summary.id)));
	const bare = opened.filter((seen) => seen === undefined || seen.browser === null || seen.user !== null);
	assert.deepEqual(bare.map((seen) => JSON.stringify(seen?.entries.find((entry) => entry.kind === 'url') ?? seen?.id)), [], 'each visit carries browser facts and no user');
	assert.ok(opened.some((seen) => seen?.entries.some((entry) => entry.kind === 'url')), 'a visit recorded the URL it showed');

	// On a post, the vine drawn in the left margin gets longer as the reader scrolls. In a 1280 by
	// 800 window, half way down and at the end, its lowest pixel is in the window and above the footer.
	const reader = await browser.newPage({ viewport: { width: 1280, height: 800 } });
	await reader.goto(`${site.url}/blog/${newest.slug}`, { waitUntil: 'networkidle' });
	for (const through of [0.5, 1]) {
		const { tip, shore } = await reader.evaluate(async (at) => {
			scrollTo(0, at * (document.documentElement.scrollHeight - innerHeight));
			await new Promise((done) => { requestAnimationFrame(() => { requestAnimationFrame(done); }); });
			const canvas = document.querySelector<HTMLCanvasElement>('#canopy canvas')!;
			const box = canvas.getBoundingClientRect(), size = box.width / canvas.width;
			// Where createCanopy hangs it: seven strip pixels left of the 800 pixel column.
			const x = Math.floor((canvas.width - 800 / size) / 2 - 7);
			const { data } = canvas.getContext('2d')!.getImageData(x - 3, 0, 7, canvas.height);
			let lowest = -1;
			for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) lowest = Math.floor(i / 4 / 7);
			return { tip: box.top + (lowest + 0.5) * size, shore: document.getElementById('shore')!.getBoundingClientRect().top };
		}, through);
		assert.ok(tip > 20 && tip < Math.min(800, shore), `${String(through * 100)}% through a post, the vine's tip is in the window above the footer, not at ${String(tip)}px`);
	}
	await reader.close();

	// The pages below are opened after the visit check above, which counts every page opened before it.
	// Every page against WCAG 2.1 AA, light and dark, at a desktop, a tablet and the 320 CSS pixels a
	// phone reflows to (SC 1.4.10). axe checks the markup, but it cannot read a canvas, and the
	// scenes' canvases sit behind and beside the words. So each word and icon is also measured
	// against what the browser painted under it, with the words hidden (SC 1.4.3, 1.4.11). The
	// system asks for reduced motion, so every run measures the same frame, and on a page with
	// pixel scenes the proof checks what reduced motion promises them.
	const scenePages = sceneful.filter((post) => post.slug !== newest.slug).map((post) => [`post ${post.slug}`, `/blog/${post.slug}`] as const);
	for (const [name, path] of [...PAGES.map(([page, at]) => [page, at] as const), ...scenePages, ['404', '/nope'] as const]) {
		for (const dark of [false, true]) {
			for (const width of [1280, 600, 320]) {
				const where = `${name}, ${dark ? 'dark' : 'light'}, ${String(width)}px`;
				const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
				await context.addInitScript((night) => {
					if (night) localStorage.setItem('modeChoice', 'dark');
					// How tall each scene with a picture of fixed height (a map, a deploy) is in the page as
					// the build wrote it, before the bundle runs.
					document.addEventListener('readystatechange', () => {
						if (document.readyState === 'interactive') (window as unknown as { written: number[] }).written = Array.from(document.querySelectorAll('[data-scene] [id]')).filter((stage) => stage.querySelector('[data-placed]') !== null).map((stage) => stage.getBoundingClientRect().height);
					});
				}, dark);
				const view = await context.newPage();
				await onAir(view);
				await view.goto(`${site.url}${path}`, { waitUntil: 'networkidle' });
				// Every themed element eases its colours over 0.15s, and a dark page turns dark once it
				// is alive, so the audit waits for the easing to end rather than measure a colour mid-way.
				await view.waitForFunction(() => document.getAnimations().length === 0, undefined, { timeout: 5_000 }).catch(() => undefined);
				const { violations } = await audit(view);
				assert.deepEqual(violations.map((found) => `${found.rule}: ${found.help} (${found.nodes.map((node) => node.target).join(', ')})`), [], `${where}: axe`);

				// The window is made as tall as the page, so every scene is close enough to paint. runScene
				// paints them one per frame, so this waits until all are sized. A canvas that has not painted
				// is still 300 wide, so its width cannot tell.
				const tall = await view.evaluate(() => document.documentElement.scrollHeight);
				await view.setViewportSize({ width, height: tall });
				await view.waitForFunction(drawn, '[aria-hidden="true"] > canvas, [data-scene] canvas');
				const settle = (): Promise<void> => view.evaluate(() => new Promise<void>((done) => { requestAnimationFrame(() => { requestAnimationFrame(() => { done(); }); }); }));
				await settle();
				const scenes = await view.$$('[data-scene]');
				if (scenes.length > 0) {
					const fences = await view.evaluate(async (at) => (await fetch(at)).json() as Promise<Fence[]>, `/blog/${path.split('/').pop()!}.tokens.json`);
					// Such a scene is as tall in the page the build wrote as once it is alive, a still map
					// on a phone included, so nothing below it jumps. A post may have none.
					const fixed = fences.filter((fence) => fence.scene?.data.regions !== undefined || fence.scene?.data.kind === 'deploy').length;
					const heights = await view.evaluate(() => ({ written: (window as unknown as { written: number[] }).written, alive: Array.from(document.querySelectorAll('[data-scene] [id]')).filter((stage) => stage.querySelector('[data-placed]') !== null).map((stage) => stage.getBoundingClientRect().height) }));
					assert.equal(heights.alive.length, fixed, `${where}: a stage for each scene with a picture of fixed height, a map or a deploy`);
					assert.deepEqual(heights.alive, heights.written, `${where}: each is as tall as the build wrote it`);
					// Nothing in a scene moves, and it shows the end of its story with its words.
					const frames = (): Promise<string[]> => view.evaluate(() => Array.from(document.querySelectorAll<HTMLCanvasElement>('[data-scene] canvas')).map((canvas) => canvas.toDataURL()));
					const first = await frames();
					await view.waitForTimeout(1200);
					assert.deepEqual(await frames(), first, `${where}: with reduced motion no scene moves`);
					const words = await view.evaluate(sceneWords);
					assert.deepEqual(words.hidden, [], `${where}: every word of every scene shows`);
					assert.deepEqual(words.overlaps, [], `${where}: and none covers another`);
					assert.deepEqual(words.unseen, [], `${where}: and a word that does not show is hidden from a screen reader too`);
					assert.deepEqual(words.unfound, [], `${where}: a map's search finds snippets, so every found word is checked`);
					// A map rests where its searches end: on the last.
					const cluster = await view.$('[data-scene="cluster"]');
					if (cluster !== null) {
						const searches = fences.find((fence) => fence.scene?.name === 'cluster')!.scene!.data.searches!;
						assert.equal(await cluster.$eval('[data-thing="seek:q"]', (pin) => pin.textContent), searches.at(-1)!.words, `${where}: the map rests on its last search`);
					}
					// Each word a map shows is nearer its own point than the middle of any other region,
					// so no snippet looks like part of the wrong one.
					const regionsOf = fences.flatMap((fence) => (fence.scene?.data.regions === undefined ? [] : [fence.scene.data.regions]));
					const maps = await view.evaluate(mapWords);
					assert.equal(maps.length, regionsOf.length, `${where}: a map on the page for each map in the post`);
					assert.deepEqual(misplaced(maps, regionsOf), [], `${where}: every word on a map sits by its own point`);
					await scenesHold(view, fences, where);
				}
				const marks = await view.evaluate(marksOf);
				await view.addStyleTag({ content: BARE });
				await settle();
				const shot = (await view.screenshot()).toString('base64');
				assert.deepEqual(await view.evaluate(judge, [shot, marks] as const), [], `${where}: every word and icon stands out from what is drawn under it`);

				// Still, a scene draws only when something changes, and a switch, the arrow keys on a
				// map and the pointer over a deploy's pages all change what it shows.
				for (const scene of scenes) {
					const kind = await scene.getAttribute('data-scene');
					const changes = async (act: () => Promise<void>, what: string): Promise<void> => {
						const before = await scene.evaluate(sceneState);
						await act();
						await settle();
						assert.notEqual(await scene.evaluate(sceneState), before, `${where}: still, ${what} changes what the ${String(kind)} scene shows`);
					};
					const choice = await scene.$('[aria-pressed="false"]');
					if (choice !== null) await changes(() => choice.click(), `its switch, ${String(await choice.textContent())},`);
					const pin = await scene.$('[data-thing="seek:q"]');
					if (pin !== null) await changes(async () => { await pin.focus(); for (let press = 0; press < 3; press++) await view.keyboard.press('ArrowRight'); }, 'the arrow keys');
					if (await scene.$('[data-thing^="page:"]') !== null) {
						const named = async (): Promise<boolean> => scene.evaluate((element) => Array.from(element.querySelectorAll<HTMLElement>('[data-thing^="page:"]')).some((page) => page.style.opacity === '1'));
						const stage = (await (await scene.$('[id]'))!.boundingBox())!, size = width >= 440 ? 3 : 2;
						let found = false;
						// Along the first row of pages, which a deploy draws 64 strip pixels down.
						for (let x = stage.x; x < stage.x + stage.width && !found; x += size * 2) {
							await view.mouse.move(x, stage.y + 68 * size);
							found = await named();
						}
						assert.ok(found, `${where}: still, the pointer over a page shows its name`);
					}
				}
				await context.close();
			}
		}
	}

	// The pixel scenes in posts (work order 519), on every post that has one.
	for (const post of sceneful) {
		const path = `/blog/${post.slug}`;
		// The nodes the server wrote for each scene are still the page's after it comes alive: held
		// when parsing ends, before the bundle runs, and compared once it has.
		const alive = await browser.newPage({ viewport: { width: 1280, height: 900 } });
		alive.on('pageerror', (error) => problems.push(`${post.slug}: ${String(error)}`));
		await alive.addInitScript(() => {
			document.addEventListener('readystatechange', () => {
				if (document.readyState === 'interactive') (window as unknown as { held: Element[] }).held = Array.from(document.querySelectorAll('[data-scene], [data-scene] [data-thing]'));
			});
		});
		await alive.goto(`${site.url}${path}`, { waitUntil: 'networkidle' });
		const kept = await alive.evaluate(() => {
			const held = (window as unknown as { held: Element[] }).held;
			const now = Array.from(document.querySelectorAll('[data-scene], [data-scene] [data-thing]'));
			return { held: held.length, same: held.length === now.length && held.every((node, i) => node === now[i]) };
		});
		assert.ok(kept.held > 0 && kept.same, `${post.slug}: the ${String(kept.held)} scene nodes the server wrote are the same nodes once the page is alive`);

		// Every control in a scene is reached with the Tab key, in the order of the page.
		const controls = await alive.evaluate(() => {
			const found = Array.from(document.querySelectorAll<HTMLElement>('[data-scene] button'));
			found.forEach((button, k) => { button.dataset['proof'] = String(k); });
			return found.length;
		});
		const reached = new Set<string>();
		await alive.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); scrollTo(0, 0); });
		for (let press = 0; press < 400 && reached.size < controls; press++) {
			await alive.keyboard.press('Tab');
			const at = await alive.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset['proof'] ?? null);
			if (at !== null) reached.add(at);
		}
		assert.equal(reached.size, controls, `${post.slug}: Tab reaches all ${String(controls)} of the scenes' controls`);

		// Dragging the search across a map moves it and selects no text, wherever it goes.
		const map = await alive.$('[data-scene="cluster"] [id]');
		if (map !== null) {
			await map.scrollIntoViewIfNeeded();
			const box = (await map.boundingBox())!;
			await alive.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
			await alive.mouse.down();
			for (let step = 1; step <= 12; step++) await alive.mouse.move(box.x + box.width * (0.2 + step * 0.06), box.y + box.height * (0.3 + step * 0.04));
			await alive.mouse.move(box.x + box.width * 1.4, box.y + box.height * 1.3);
			await alive.mouse.up();
			const after = await alive.evaluate(() => ({
				selected: getSelection()?.toString() ?? '',
				words: document.querySelector('[data-scene="cluster"] [data-thing="seek:q"]')?.textContent ?? '',
				touch: getComputedStyle(document.querySelector('[data-scene="cluster"] [data-thing="seek:q"]')!).touchAction,
			}));
			assert.equal(after.selected, '', `${post.slug}: a drag across the map selects no text`);
			assert.equal(after.words, 'your search', `${post.slug}: and moves the search`);
			assert.equal(after.touch, 'none', `${post.slug}: the pin takes a drag on a touch screen, and the page scrolls anywhere else`);
		}
		await alive.close();

		// The menu's Motion switch, pressed while the scenes play, stops them at the end of their
		// story, and nothing changes after.
		const playing = await browser.newPage({ viewport: { width: 1280, height: 900 } });
		await playing.goto(`${site.url}${path}`, { waitUntil: 'networkidle' });
		await playing.setViewportSize({ width: 1280, height: await playing.evaluate(() => document.documentElement.scrollHeight) });
		await playing.waitForTimeout(1500);
		await playing.click('button[aria-label="Menu"]');
		await playing.click('text="Motion"');
		await playing.keyboard.press('Escape');
		await playing.waitForTimeout(600);
		const stopped = async (): Promise<string[]> => Promise.all((await playing.$$('[data-scene]')).map((scene) => scene.evaluate(sceneState)));
		const held = await stopped();
		await playing.waitForTimeout(5000);
		assert.deepEqual(await stopped(), held, `${post.slug}: Motion switched off mid-story holds every scene where it stopped`);
		await playing.close();

		// With motion on, once every scene has finished its story: each stands in its column and draws
		// under its words, and shows no caption. On a map, each word it shows is by its own point and
		// no two words cover each other. At 1280, 600 and 320, light and dark.
		const fences = await (await fetch(`${site.url}/blog/${post.slug}.tokens.json`)).json() as Fence[];
		const regionsOf = fences.flatMap((fence) => (fence.scene?.data.regions === undefined ? [] : [fence.scene.data.regions]));
		const last = fences.find((fence) => fence.scene?.name === 'cluster')?.scene?.data.searches?.at(-1)?.words;
		for (const dark of [false, true]) for (const width of [1280, 600, 320]) {
			const where = `${post.slug}, ${dark ? 'dark' : 'light'}, ${String(width)}px, at the end of the story`;
			const context = await browser.newContext({ viewport: { width, height: 900 } });
			await context.addInitScript((night) => { if (night) localStorage.setItem('modeChoice', 'dark'); }, dark);
			const ended = await context.newPage();
			await ended.goto(`${site.url}${path}`, { waitUntil: 'networkidle' });
			// The whole page in the window, so every scene plays at once.
			await ended.setViewportSize({ width, height: await ended.evaluate(() => document.documentElement.scrollHeight) });
			// A cluster's tour ends on its last search. After that, the scenes are at their end once
			// nothing in them changes for three seconds, longer than a fanout waits before it splits.
			if (last !== undefined) await ended.waitForFunction((words) => document.querySelector('[data-scene="cluster"] [data-thing="seek:q"]')?.textContent === words, last, { timeout: 30_000 });
			const shows = async (): Promise<string> => (await Promise.all((await ended.$$('[data-scene]')).map((scene) => scene.evaluate(sceneState)))).join();
			let before = '', now = await shows();
			for (let tries = 0; now !== before && tries < 10; tries++) {
				await ended.waitForTimeout(3000);
				[before, now] = [now, await shows()];
			}
			assert.equal(now, before, `${where}: the scenes come to rest`);
			if (regionsOf.length > 0) {
				const maps = await ended.evaluate(mapWords);
				assert.equal(maps.length, regionsOf.length, `${where}: a map on the page for each map in the post`);
				assert.ok(maps.every((map) => map.words.some((word) => word.name.startsWith('snippet:'))), `${where}: each map shows what its searches found`);
				assert.deepEqual(misplaced(maps, regionsOf), [], `${where}: every word on a map sits by its own point, and none covers another`);
			}
			await scenesHold(ended, fences, where);
			await context.close();
		}

		// On a phone, a finger that scrolls the page from a map, away from its pin, scrolls the page
		// and leaves the search where it was.
		if (map !== null) {
			const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
			const swiped = await phone.newPage();
			await swiped.goto(`${site.url}${path}`, { waitUntil: 'networkidle' });
			const stage = swiped.locator('[data-scene="cluster"] [id]');
			await stage.scrollIntoViewIfNeeded();
			const box = (await stage.boundingBox())!;
			const before = await swiped.evaluate(() => [scrollY, document.querySelector('[data-thing="seek:q"]')!.textContent] as const);
			const touch = await phone.newCDPSession(swiped);
			const x = box.x + 20, y = box.y + box.height * 0.75;
			await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
			for (let step = 1; step <= 12; step++) await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 25 }] });
			await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
			await swiped.waitForTimeout(500);
			const after = await swiped.evaluate(() => [scrollY, document.querySelector('[data-thing="seek:q"]')!.textContent] as const);
			assert.ok(after[0] > before[0], `${post.slug}: a swipe from the map scrolls the page`);
			assert.notEqual(after[1], 'your search', `${post.slug}: and does not take the search`);
			await phone.close();
		}
	}

	// A development bundle keeps the checks a release bundle drops, among them the one that throws
	// when the page the server wrote and the page the bundle builds disagree on an element or an
	// attribute. On it, every page with a scene comes alive, light and dark, with nothing thrown or
	// logged, and so does each one reached by a link from /blog, its icons drawn.
	const developed = mkdtempSync(join(tmpdir(), 'torrin-me-dev-'));
	const built = (command: string, args: string[], env: Record<string, string>): void => {
		const run = spawnSync(command, args, { env: { ...process.env, ...env }, stdio: 'inherit' });
		assert.equal(run.status, 0, `${command} ${args.join(' ')} exited ${String(run.status)}`);
	};
	built('npx', ['--no-install', 'vite', 'build', '--configLoader', 'native', '--outDir', developed, '--emptyOutDir', '--logLevel', 'warn'], { NODE_ENV: 'development' });
	built('npm', ['run', 'pages', '--silent'], { PAGES_DIR: developed });
	const devSite = await boot({ 'static/Files': { dir: developed, unknown: '404' } });
	try {
		for (const dark of [false, true]) {
			const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
			await context.addInitScript((night) => { if (night) localStorage.setItem('modeChoice', 'dark'); }, dark);
			for (const post of sceneful) {
				for (const linked of [false, true]) {
					const where = `${post.slug}, ${dark ? 'dark' : 'light'}, development bundle${linked ? ', by a link from /blog' : ''}`;
					const view = await context.newPage();
					const said: string[] = [];
					view.on('pageerror', (error) => said.push(String(error)));
					view.on('console', (message) => { if (message.type() === 'error') said.push(message.text()); });
					await onAir(view);
					if (linked) {
						await view.goto(`${devSite.url}/blog`, { waitUntil: 'networkidle' });
						await view.click(`a[href="/blog/${post.slug}"]`);
						await view.waitForSelector('[data-scene]');
					} else await view.goto(`${devSite.url}/blog/${post.slug}`, { waitUntil: 'networkidle' });
					await view.setViewportSize({ width: 1280, height: await view.evaluate(() => document.documentElement.scrollHeight) });
					await view.waitForFunction(drawn, '[data-scene] canvas');
					const icons = await view.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('[data-scene] [data-icon]')).filter((icon) => {
						const style = getComputedStyle(icon), box = icon.getBoundingClientRect();
						return style.maskImage.startsWith('url(') && box.width >= 8 && box.height >= 8;
					}).length);
					const all = await view.evaluate(() => document.querySelectorAll('[data-scene] [data-icon]').length);
					assert.ok(all > 0 && icons === all, `${where}: ${String(icons)} of ${String(all)} icons drawn`);
					assert.deepEqual(said, [], `${where}: nothing thrown or logged`);
					await view.close();
				}
			}
			await context.close();
		}
	} finally {
		await devSite.stop();
		rmSync(developed, { recursive: true, force: true });
	}

	// The menu's Motion switch stops the scenes for a visitor who finds motion distracting
	// (SC 2.2.2), and the choice is kept.
	const calm = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	calm.on('pageerror', (error) => problems.push(`motion: ${String(error)}`));
	await calm.goto(`${site.url}/`, { waitUntil: 'networkidle' });
	const frameOf = (): Promise<string> => calm.evaluate(() => document.querySelector<HTMLCanvasElement>('#hero-strip canvas')!.toDataURL());
	const pause = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));
	const moving = await frameOf();
	await pause(400);
	assert.notEqual(await frameOf(), moving, 'the forest moves');
	await calm.click('button[aria-label="Menu"]');
	await calm.click('text="Motion"');
	await pause(200);
	const held = await frameOf();
	await pause(400);
	assert.equal(await frameOf(), held, 'and holds still once Motion is off');
	assert.equal(await calm.evaluate(() => localStorage.getItem('motionChoice')), 'off', 'and the choice is kept');
	await calm.close();

	// The radio page has its button and its reeds before anything is pressed.
	const dial = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	await onAir(dial);
	await dial.goto(`${site.url}/radio`, { waitUntil: 'networkidle' });
	assert.equal(await dial.textContent('#radio-play'), 'Play', 'the radio page offers Play');
	assert.ok(await dial.$('#radio-reeds canvas') !== null, 'and draws its reeds');
	assert.ok((await dial.textContent('main'))?.includes('Proof Signal · Synthwave · A minor · 100 bpm'), 'and says what is on the air');
	await dial.close();

	// The radio, the way the droplet runs it: the process on a port, started thirty seconds into
	// a track of each style, a listener joining now, ten seconds of the stream decoded back to
	// samples and measured. Every other check here would pass on silence, so this one measures
	// the sound.
	for (const style of ['sleep', 'synthwave'] as const) {
		const heard = await tuneIn(10, style);
		assert.equal(heard.now.style, style, `the station started on a ${style} track`);
		assert.ok(heard.now.name.includes(' '), `with a name: ${heard.now.name}`);
		assert.ok(heard.frames > 300, `${style}: ${String(heard.frames)} MP3 frames in ten seconds`);
		assert.ok(heard.rms > 0.003, `${style} is not silence: rms ${heard.rms.toFixed(4)}`);
		assert.ok(heard.health.ok && heard.health.listeners === 1, `${style}: health saw the one listener`);
	}

	assert.deepEqual(problems, [], 'no page threw and no console error was logged');
	console.log(`proof: ok. screenshots in ${shots}`);
} finally {
	await browser.close();
	await site.stop();
	await post.stop();
}
