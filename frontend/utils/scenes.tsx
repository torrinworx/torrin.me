// The pixel scenes in a post (work order 519): blog.tsx's `code` hook renders one for each
// `scene:<name>` fence, from the data the build checked (content/scenes.ts).
//
// The page the build writes has every word, laid out, and an empty canvas. Once the page is
// alive, the canvas reads where the words went and frontend/scenes.ts paints the pictures and the
// motion around them. On a map it says where each word goes. The story plays once when half the
// scene is on screen, and again from the button. With motion off the scene shows its end. In a
// feed a scene is its still frame, which the build painted, and its words as a list.

import { mutable } from '@aweftjs/core';
import { h } from '@aweftjs/ui';

import type { Cluster, Fanout, Match, Numbers, Pipeline, Scene, Schedule, Toggle } from '../../content/scenes.ts';
import {
	GLIDE, changedOf, createBranches, createDeploy, createMap, createMatch, createNumbers, createPipeline, createPrompts, createSchedule, deployLayout,
	landing, mapArea, mapOf, narrowMap, pipelineLength,
} from '../scenes.ts';
import type { Box, Explainer, Seek, Size } from '../scenes.ts';
import { heroScale, motion, runScene } from '../strip.ts';
import type { Running } from '../strip.ts';
import { ModeContext } from '../theme.ts';
import type { IconName } from '../theme.ts';
import { nightOf } from './forest.tsx';

type Cleanup = (...fns: (() => void)[]) => void;

/** A pixel icon beside words, in their colour. */
const Pixels = (props: { name: IconName }): unknown => <span theme={['scene_icon', `scene_icon_${props.name}`]} data-icon="" aria-hidden="true" />;

// --- the stage: the canvas, run, and the words placed or moved where the painter says -----------

/** What a scene's wiring can reach once the page is alive. */
interface Live {
	readonly host: HTMLElement;
	/** The moment the story started, or null while it waits. */
	started: number | null;
	/** Each placed thing's size, and each laid-out thing's and picture slot's box, in strip pixels. */
	readonly sizes: Map<string, Size>;
	readonly boxes: Map<string, Box>;
	again(): void;
}

interface StageSpec {
	readonly paint: (night: boolean, width: number, height: number, moving: boolean, live: Live) => Explainer;
	/** After each frame, with the painter and the size of a strip pixel. */
	readonly drawn?: (painter: Explainer, size: number, live: Live) => void;
	/** Runs when the story starts, for a scene with a sequence of its own. */
	readonly begin?: (live: Live) => void;
	/** Puts a scene with a sequence of its own at the end of it, for motion that is off. */
	readonly end?: () => void;
}

/**
 * Run a scene on the stage with this id once the page is alive, and stop it with the component.
 * Answers what the scene's controls call: `play` starts the story over, `again` lays it out anew,
 * and `redraw` shows a change of state, which a still scene draws no frame of its own for.
 */
const useStage = (cleanup: Cleanup, id: string, spec: StageSpec, night: ReturnType<typeof nightOf>): { play: () => void; again: () => void; redraw: () => void; live: () => Live | null; time: () => number } => {
	let live: Live | null = null, running: Running | null = null;
	const play = (): void => {
		if (live === null || !motion.get()) return;
		// The scene's time, not performance.now(). It only advances while the scene runs, so a start
		// taken from performance.now() came that much later than the scene's time reached it.
		live.started = running?.time() ?? 0;
		spec.begin?.(live);
	};
	const redraw = (): void => { running?.draw(); };
	const out = { play, again: () => { running?.again(); }, redraw, live: () => live, time: () => running?.time() ?? 0 };
	if (typeof requestAnimationFrame !== 'function') return out;
	let watched: IntersectionObserver | null = null, offMotion = (): void => {}, offPointer = (): void => {}, seen = false;
	const first = requestAnimationFrame(() => {
		const host = document.getElementById(id);
		if (host === null) return;
		const things = new Map<string, HTMLElement>();
		for (const element of Array.from(host.querySelectorAll<HTMLElement>('[data-thing]'))) things.set(element.dataset['thing']!, element);
		const slots = Array.from(host.querySelectorAll<HTMLElement>('[data-slot]'));
		// A stage narrower than the column stands in the middle of it (theme.ts), and its pixels are
		// still the scene's size, which the scene's own width sets for its words' boxes.
		const figure = host.closest<HTMLElement>('[data-scene]') ?? host;
		const scale = (): number => heroScale(figure.getBoundingClientRect().width);
		const state: Live = { host, started: null, sizes: new Map(), boxes: new Map(), again: () => { running?.again(); } };
		live = state;
		// Where everything stands, read once per layout: laid-out things by their box, placed ones by their size.
		const measure = (size: number): void => {
			const origin = host.getBoundingClientRect();
			for (const [name, element] of things) {
				// A placed thing's size takes in the margin its pixel outline is drawn in.
				const style = getComputedStyle(element);
				const across = element.offsetWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight), down = element.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
				state.sizes.set(name, { width: Math.ceil(across / size), height: Math.ceil(down / size) });
				if (element.dataset['placed'] !== undefined) continue;
				const box = element.getBoundingClientRect();
				state.boxes.set(name, { x: Math.round((box.left - origin.left) / size), y: Math.round((box.top - origin.top) / size), width: Math.round(box.width / size), height: Math.round(box.height / size) });
			}
			for (const slot of slots) {
				const box = slot.getBoundingClientRect();
				state.boxes.set(`slot:${slot.dataset['slot']!}`, { x: Math.round((box.left - origin.left) / size), y: Math.round((box.top - origin.top) / size), width: Math.round(box.width / size), height: Math.round(box.height / size) });
			}
		};
		running = runScene(host, {
			scale,
			paint: (dark, width, height, _css, moving) => {
				// A laid-out thing is measured where it stands, so any move the last frame gave it comes off first.
				for (const element of things.values()) if (element.dataset['placed'] === undefined) element.style.transform = '';
				measure(scale());
				return spec.paint(dark, width, height, moving, state);
			},
			drawn: (painter, _shown, size) => {
				const scene = painter as Explainer;
				for (const [name, anchor] of scene.anchors) {
					const element = things.get(name);
					if (element === undefined) continue;
					// A thing placed by its middle, as a name over a picture is, goes half its own width left.
					const left = element.dataset['middle'] === undefined ? 0 : (state.sizes.get(name)?.width ?? 0) / 2;
					element.style.transform = anchor.x === 0 && anchor.y === 0 && anchor.offset === true ? '' : `translate(${String(Math.round(anchor.x - left) * size)}px, ${String(Math.round(anchor.y) * size)}px)`;
					element.style.opacity = anchor.offset === true && anchor.alpha >= 1 ? '' : String(anchor.alpha);
					if (anchor.alpha <= 0) element.setAttribute('aria-hidden', 'true'); else element.removeAttribute('aria-hidden');
					if (anchor.found !== undefined) element.toggleAttribute('data-found', anchor.found);
				}
				// Placed words the painter has never placed are not on screen, as a search the scene has not made yet.
				for (const [name, element] of things) if (element.dataset['placed'] !== undefined && !scene.anchors.has(name)) element.setAttribute('aria-hidden', 'true');
				// Typed words keep the space of all of them, the rest held unseen, so nothing below moves as they are written.
				for (const [name, done] of scene.typed) {
					const words = things.get(name)?.querySelector<HTMLElement>('[data-typed]'), rest = things.get(name)?.querySelector<HTMLElement>('[data-rest]');
					const full = words?.dataset['typed'] ?? '', shown = Math.round(done * full.length);
					if (words === undefined || words === null || rest === undefined || rest === null || words.textContent?.length === shown) continue;
					words.textContent = full.slice(0, shown);
					rest.textContent = full.slice(shown);
				}
				spec.drawn?.(scene, size, state);
			},
		}, night);
		document.fonts?.ready.then(() => { running?.again(); }).catch(() => {});
		watched = new IntersectionObserver(([entry]) => {
			seen = entry?.isIntersecting ?? false;
			if (seen && state.started === null) play();
		}, { threshold: 0.5 });
		watched.observe(host);
		// Still, a scene stops its own sequence at its end, and the pointer still shows what is under
		// it. The stage says which it is, for a map's still height (Height).
		const still = (): void => { host.dataset['motion'] = 'off'; spec.end?.(); redraw(); };
		offMotion = motion.watch((moving) => {
			if (!moving) still();
			else {
				host.dataset['motion'] = 'on';
				if (seen && state.started === null) play();
			}
		});
		if (motion.get()) host.dataset['motion'] = 'on'; else still();
		const point = (): void => { if (!motion.get()) redraw(); };
		host.addEventListener('pointermove', point);
		host.addEventListener('pointerleave', point);
		offPointer = () => { host.removeEventListener('pointermove', point); host.removeEventListener('pointerleave', point); };
	});
	cleanup(() => { cancelAnimationFrame(first); running?.stop(); watched?.disconnect(); offMotion(); offPointer(); });
	return out;
};

/**
 * How tall a stage with a fixed picture is: a spacer per width the scene's own width falls in.
 * `still` is how tall a narrow one is while motion is off, when it has more words to show.
 */
const Height = (props: { wide: number; mid: number; narrow: number; still?: number }): unknown => [
	<div theme={['scene_height', 'scene_height_wide']} style={{ height: `${String(props.wide)}px` }} />,
	<div theme={['scene_height', 'scene_height_mid']} style={{ height: `${String(props.mid)}px` }} />,
	<div theme={['scene_height', 'scene_height_narrow', props.still === undefined ? null : 'scene_height_yields']} style={{ height: `${String(props.narrow)}px` }} />,
	props.still === undefined ? null : <div theme={['scene_height', 'scene_height_still']} style={{ height: `${String(props.still)}px` }} />,
];

/**
 * The button under every scene, a switch where the scene has one, and what is invented. The
 * caption is for a screen reader only. The figure carries it as `aria-label` too, since Chrome
 * takes no figure's name from its figcaption.
 */
const Foot = (props: { caption: string; example?: string | undefined; play: () => void; extra?: unknown }): unknown => [
	<div theme="scene_controls">
		<button type="button" theme="scene_again" onClick={props.play}>Play again</button>
		{props.extra ?? null}
	</div>,
	props.example === undefined ? null : <p theme="scene_example">{props.example}</p>,
	<figcaption theme="scene_unseen">{props.caption}</figcaption>,
];

/** A two-way switch: which of two states the scene shows. */
const Switch = (props: { label: string; first: string; second: string; second$: ReturnType<typeof mutable<boolean>>; choose: (second: boolean) => void }): unknown => (
	<div theme="scene_pick" role="group" aria-label={props.label}>
		<button type="button" theme="scene_choice" aria-pressed={props.second$.map((on) => String(!on))} onClick={() => { props.choose(false); }}>{props.first}</button>
		<button type="button" theme="scene_choice" aria-pressed={props.second$.map((on) => String(on))} onClick={() => { props.choose(true); }}>{props.second}</button>
	</div>
);

// --- pipeline ------------------------------------------------------------------------------------

const ITEM_ICON: Readonly<Record<string, IconName>> = { files: 'file', searches: 'search', found: 'found' };

/** Things carried through steps, lane by lane. On a narrow page the steps stack. */
const PipelineScene = ModeContext.use((mode) => (props: { id: string; data: Pipeline }, cleanup: Cleanup): unknown => {
	const data = props.data;
	const stage = useStage(cleanup, props.id, {
		paint: (night, width, height, moving, live) => createPipeline({ width, height, night, moving, started: () => live.started, boxes: () => live.boxes, shape: data }),
	}, nightOf(mode));
	return (
		<figure theme="scene" data-scene="pipeline" aria-label={data.caption}>
			<div id={props.id} theme={['scene_stage', 'scene_stage_flow', 'scene_stage_fit']}>
				<canvas theme="scene_paint" aria-hidden="true" />
				{data.lanes.map((lane, l) => (
					<section theme="scene_lane">
						{lane.label === undefined ? null : <p theme="scene_tag" data-thing={`lane:${String(l)}`}>{lane.label}</p>}
						<ol theme="scene_steps">
							{lane.steps.map((step, s) => {
								const key = `${String(l)}.${String(s)}`;
								if (step.items !== undefined) {
									const tone = step.kind === 'searches' ? 'scene_search' : step.kind === 'found' ? 'scene_found' : 'scene_card';
									return (
										<li theme={['scene_step', 'scene_step_items']}>
											{step.name === undefined ? null : <span theme="scene_eyebrow">{step.name}</span>}
											{step.items.map((item, k) => (
												<span theme={tone} data-thing={`item:${key}.${String(k)}`}><Pixels name={ITEM_ICON[step.kind] ?? 'file'} />{item}</span>
											))}
											{step.reach === undefined ? null : (
												<span theme="scene_echo"><span theme={['scene_slot', 'scene_slot_database']} data-slot={`echo:${key}`} /><span theme="scene_tag">{step.reach}</span></span>
											)}
										</li>
									);
								}
								if (step.text !== undefined || step.kind === 'prompt') {
									const icon: IconName = step.kind === 'draft' ? 'draft' : step.kind === 'prompt' ? 'prompt' : 'request';
									return (
										<li theme={['scene_step', 'scene_step_card']}>
											<span theme={['scene_card', 'scene_card_wide']} data-thing={`card:${key}`}>
												<Pixels name={icon} />
												<span>
													{step.name === undefined || step.kind === 'prompt' ? null : <span theme="scene_eyebrow">{step.name}</span>}
													{step.kind === 'prompt' ? <span theme="scene_name">{step.name}</span> : null}
													{step.kind === 'prompt' && step.line !== undefined ? <span theme="scene_line">{` ${step.line}`}</span> : null}
													{step.kind === 'draft' ? [<span aria-hidden="true"><span data-typed={step.text}>{step.text}</span><span data-rest="" theme="scene_rest" /></span>, <span theme="scene_unseen">{step.text}</span>] : step.text ?? null}
												</span>
											</span>
										</li>
									);
								}
								return (
									<li theme={['scene_step', 'scene_step_pictured']}>
										<span theme={['scene_slot', `scene_slot_${step.kind}`]} data-slot={key} />
										<span theme="scene_words" data-thing={`step:${key}`}>
											<span theme="scene_name">
												{step.name}
												{step.badge === undefined ? null : <span theme="scene_badge">{step.badge}</span>}
											</span>
											{step.line === undefined ? null : <span theme="scene_line">{step.line}</span>}
											{step.shows === undefined ? null : <span theme="scene_shows" data-thing={`shows:${key}`}>{step.shows}</span>}
										</span>
									</li>
								);
							})}
						</ol>
					</section>
				))}
				{data.note === undefined ? null : <p theme="scene_note" data-thing="note">{data.note}</p>}
			</div>
			<Foot caption={data.caption} example={data.example} play={stage.play} />
		</figure>
	);
});

/** How long a pipeline plays, for the proof and the tests. */
export const pipelineSeconds = (data: Pipeline): number => pipelineLength(data);

// --- the map of meanings: cluster, and fanout on a map -----------------------------------------

/** The words of a map: the regions' names and each snippet, placed by the painter. */
const MapWords = (props: { regions: Cluster['regions'] }): unknown => props.regions.flatMap((region, i) => [
	<span theme={['scene_tag', 'scene_placed']} data-thing={`region:${String(i)}`} data-placed="">{region.name}</span>,
	...region.snippets.map((snippet, j) => <span theme={['scene_found', 'scene_placed']} data-thing={`snippet:${String(i)}.${String(j)}`} data-placed="">{snippet}</span>),
]);

// A map's stage: as tall as its painter lays the map out for, at each width, and on a phone
// taller while still, so every word its story ends on has room beside its point.
const MAP_HEIGHT = { wide: 360, mid: 510, narrow: 420, still: 640 } as const;

/**
 * Snippets on a map where similar meanings are close together, and a search the reader drags,
 * whose nearest snippets light up. Until the reader touches it, the search moves through each
 * example once, and with motion off it stays at the last. The pin is the handle: a drag there
 * moves it and never selects text. A tap elsewhere on the map moves it there and leaves the page
 * free to scroll. The arrow keys move it too.
 */
const ClusterScene = ModeContext.use((mode) => (props: { id: string; data: Cluster }, cleanup: Cleanup): unknown => {
	const data = props.data, spots = data.searches;
	// The map as the painter last laid it out, for where a search about regions stands now.
	let map = mapOf(data.regions);
	const words = mutable(spots[0]!.words);
	let seek: Seek = { id: 'q', x: 0, y: 0, from: [0, 0], to: spots[0]!.at, fromTo: spots[0]!.at, at: 0, near: 3 };
	let touched = false, tour = 0, timer: ReturnType<typeof setInterval> | undefined;
	const here = (): readonly [number, number] => (seek.to === undefined ? [seek.x, seek.y] : landing(map, seek.to));
	const go = (x: number, y: number): void => {
		const at: readonly [number, number] = [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))];
		seek = { id: 'q', x: at[0], y: at[1], from: at, at: 0, near: 3 };
		stage.redraw();
	};
	// The tour glides from one example to the next.
	const step = (): void => {
		if (touched || tour >= spots.length - 1) { clearInterval(timer); return; }
		const from = seek.to ?? spots[tour]!.at;
		tour++;
		seek = { id: 'q', x: 0, y: 0, from: [0, 0], to: spots[tour]!.at, fromTo: from, at: motion.get() ? stage.time() : 0, near: 3 };
		words.set(spots[tour]!.words);
	};
	const stage = useStage(cleanup, props.id, {
		paint: (night, width, height, moving, live) => {
			map = mapOf(data.regions, narrowMap(width));
			return createMap({ width, height, night, moving, started: () => live.started, regions: data.regions, seeks: () => [seek], sizes: () => live.sizes });
		},
		// The tour starts once the map is half on screen, unless the reader has already taken the search.
		begin: () => {
			if (touched) return;
			tour = 0;
			seek = { id: 'q', x: 0, y: 0, from: [0, 0], to: spots[0]!.at, fromTo: spots[0]!.at, at: 0, near: 3 };
			words.set(spots[0]!.words);
			clearInterval(timer);
			timer = setInterval(step, 4200);
		},
		end: () => {
			clearInterval(timer);
			if (touched) return;
			tour = spots.length - 1;
			seek = { id: 'q', x: 0, y: 0, from: [0, 0], to: spots[tour]!.at, fromTo: spots[tour]!.at, at: 0, near: 3 };
			words.set(spots[tour]!.words);
		},
	}, nightOf(mode));
	cleanup(() => { clearInterval(timer); });

	// Dragging: where on the map, from 0 to 1, a pointer is.
	const toMap = (event: PointerEvent): readonly [number, number] => {
		const host = stage.live()!.host, box = host.getBoundingClientRect(), size = heroScale(box.width);
		const area = mapArea(Math.ceil(box.width / size), Math.ceil(box.height / size));
		return [((event.clientX - box.left) / size - area.x) / area.width, ((event.clientY - box.top) / size - area.y) / area.height];
	};
	let dragging: number | null = null, tap = false;
	const take = (): void => { touched = true; clearInterval(timer); words.set('your search'); };
	const down = (event: PointerEvent): void => {
		if (stage.live() === null || event.button > 0) return;
		const host = stage.live()!.host;
		// Only the pin starts a drag on a touch screen. Anywhere else a touch may be the page
		// scrolling, which cancels it, so it moves the search only if it ends.
		tap = event.pointerType !== 'mouse' && (event.target as Element).closest('[data-thing="seek:q"]') === null;
		if (tap) return;
		take();
		const [x, y] = toMap(event);
		go(x, y);
		event.preventDefault();
		getSelection()?.removeAllRanges();
		dragging = event.pointerId;
		host.setPointerCapture(event.pointerId);
		host.dataset['dragging'] = '';
	};
	const drag = (event: PointerEvent): void => {
		if (dragging !== event.pointerId) return;
		event.preventDefault();
		const [x, y] = toMap(event);
		go(x, y);
	};
	const up = (event: PointerEvent): void => {
		if (tap && event.type === 'pointerup') {
			take();
			const [x, y] = toMap(event);
			go(x, y);
		}
		tap = false;
		if (dragging !== event.pointerId) return;
		dragging = null;
		const host = stage.live()?.host;
		if (host !== undefined) { delete host.dataset['dragging']; if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId); }
	};
	const key = (event: KeyboardEvent): void => {
		const by = { ArrowLeft: [-0.04, 0], ArrowRight: [0.04, 0], ArrowUp: [0, -0.04], ArrowDown: [0, 0.04] }[event.key];
		if (by === undefined) return;
		event.preventDefault();
		const [x, y] = here();
		take();
		go(x + by[0]!, y + by[1]!);
	};

	return (
		<figure theme="scene" data-scene="cluster" aria-label={data.caption}>
			<div id={props.id} theme={['scene_stage', 'scene_stage_map']} onPointerDown={down} onPointerMove={drag} onPointerUp={up} onPointerCancel={up} onDragStart={(event: Event) => { event.preventDefault(); }}>
				<canvas theme="scene_paint" aria-hidden="true" />
				<Height {...MAP_HEIGHT} />
				<MapWords regions={data.regions} />
				<button type="button" theme={['scene_search', 'scene_placed', 'scene_handle']} data-thing="seek:q" data-placed="" aria-label={words.map((said) => `Search: ${said}. The arrow keys move it across the map.`)} onKeyDown={key}>
					<Pixels name="search" />{words}
				</button>
			</div>
			<Foot caption={data.caption} example={data.example} play={() => { touched = false; stage.play(); }} />
		</figure>
	);
});

/**
 * One thing split into several. On a map: the request above it lands as one search between the
 * regions, then splits into one search per branch, each landing where it names, and a switch goes
 * between the two. Without one: the source makes each branch, carried to it.
 */
const FanoutScene = ModeContext.use((mode) => (props: { id: string; data: Fanout }, cleanup: Cleanup): unknown => {
	const data = props.data;
	if (data.regions === undefined) return <BranchesScene id={props.id} data={data} />;
	const regions = data.regions;
	// The one search is about every region the branches are: it lands between them all.
	const all = [...new Set(data.into.flatMap((branch) => branch.at ?? []))];
	const top = [0.5, -0.12] as const;
	// What the scene ends on, and so what a reader with motion off sees: one search per branch.
	const split = mutable(true);
	let seeks: Seek[] = data.into.map((branch, k) => ({ id: `b${String(k)}`, x: 0, y: 0, from: top, to: branch.at ?? [], at: 0, near: 2 }));
	let pending: ReturnType<typeof setTimeout> | undefined;
	const set = (three: boolean): void => {
		split.set(three);
		const t = motion.get() ? stage.time() : 0, one = seeks.some((seek) => seek.id === 'one');
		seeks = three || data.one === undefined
			? data.into.map((branch, k) => ({ id: `b${String(k)}`, x: 0, y: 0, from: top, to: branch.at ?? [], at: t, near: 2, ...(one ? { fromTo: all } : {}) }))
			: [{ id: 'one', x: 0, y: 0, from: top, to: all, at: t, near: 3 }];
		stage.redraw();
	};
	const stage = useStage(cleanup, props.id, {
		paint: (night, width, height, moving, live) => createMap({ width, height, night, moving, started: () => live.started, regions, seeks: () => seeks, sizes: () => live.sizes }),
		// The story: the whole request as one search, then the split.
		begin: () => {
			clearTimeout(pending);
			if (data.one === undefined) { set(true); return; }
			set(false);
			pending = setTimeout(() => { pending = undefined; set(true); }, (GLIDE + 2.7) * 1000);
		},
		end: () => {
			if (pending === undefined) return;
			clearTimeout(pending);
			pending = undefined;
			set(true);
		},
	}, nightOf(mode));
	cleanup(() => { clearTimeout(pending); });
	return (
		<figure theme="scene" data-scene="fanout" aria-label={data.caption}>
			<p theme={['scene_card', 'scene_card_wide', 'scene_card_request']}><Pixels name="request" /><span>{data.from.label === undefined ? null : <span theme="scene_eyebrow">{data.from.label}</span>}{data.from.name}</span></p>
			<div id={props.id} theme={['scene_stage', 'scene_stage_map']}>
				<canvas theme="scene_paint" aria-hidden="true" />
				<Height {...MAP_HEIGHT} />
				<MapWords regions={data.regions} />
				{data.one === undefined ? null : <span theme={['scene_search', 'scene_placed']} data-thing="seek:one" data-placed=""><Pixels name="search" />{data.one.name}</span>}
				{data.into.map((branch, k) => <span theme={['scene_search', 'scene_placed']} data-thing={`seek:b${String(k)}`} data-placed=""><Pixels name="search" />{branch.name}</span>)}
			</div>
			<Foot
				caption={data.caption}
				example={data.example}
				play={stage.play}
				extra={data.one === undefined ? null : (
					<Switch label={data.caption} first={data.one.toggle} second={data.toggle!} second$={split} choose={(three) => { clearTimeout(pending); pending = undefined; set(three); }} />
				)}
			/>
		</figure>
	);
});

/** A fanout with no map: the source, and each branch it makes. */
const BranchesScene = ModeContext.use((mode) => (props: { id: string; data: Fanout }, cleanup: Cleanup): unknown => {
	const data = props.data;
	const stage = useStage(cleanup, props.id, {
		paint: (night, width, height, moving, live) => createBranches({ width, height, night, moving, started: () => live.started, boxes: () => live.boxes, branches: data.into.length }),
	}, nightOf(mode));
	return (
		<figure theme="scene" data-scene="fanout" aria-label={data.caption}>
			<div id={props.id} theme={['scene_stage', 'scene_stage_flow', 'scene_stage_fit', 'scene_stage_branches']}>
				<canvas theme="scene_paint" aria-hidden="true" />
				<div theme="scene_source">
					<span theme={['scene_slot', 'scene_slot_build']} data-slot="from" />
					<span theme="scene_words" data-thing="from">
						<span theme="scene_name">{data.from.name}</span>
						{data.from.line === undefined ? null : <span theme="scene_line">{data.from.line}</span>}
					</span>
				</div>
				<ol theme="scene_branches">
					{data.into.map((branch, k) => (
						<li theme="scene_branch">
							<span theme={['scene_slot', 'scene_slot_pages']} data-slot={`branch:${String(k)}`} />
							<span theme="scene_words" data-thing={`branch:${String(k)}`}>
								<span theme="scene_name">{branch.name}</span>
								{branch.line === undefined ? null : <span theme="scene_line">{branch.line}</span>}
							</span>
						</li>
					))}
				</ol>
			</div>
			<Foot caption={data.caption} example={data.example} play={stage.play} />
		</figure>
	);
});

// --- toggle --------------------------------------------------------------------------------------

/** The same scene in two states, and a switch between them. */
const ToggleScene = (props: { id: string; data: Toggle }): unknown => (props.data.kind === 'deploy'
	? <DeployScene id={props.id} data={props.data} />
	: <PromptsScene id={props.id} data={props.data} />);

/** A site's pages under its storage: every page uploaded, then only the changed ones. */
const DeployScene = ModeContext.use((mode) => (props: { id: string; data: Toggle }, cleanup: Cleanup): unknown => {
	const data = props.data, pages = Number(data.pages), changed = changedOf(pages, Number(data.changed));
	const second = mutable(true);
	let every = false, began: number | null = null, pending: ReturnType<typeof setTimeout> | undefined;
	const run = (all: boolean): void => {
		every = all;
		second.set(!all);
		began = motion.get() ? stage.time() : 0;
		stage.redraw();
	};
	const stage = useStage(cleanup, props.id, {
		paint: (night, width, height, moving) => createDeploy({ width, height, night, moving, started: () => began, pages, changed, deploy: () => ({ every, started: began }) }),
		drawn: (painter, _size, live) => {
			const count = live.host.querySelector('[data-thing="count"]');
			const deploy = painter as Explainer & { uploaded: number; total: number };
			if (count !== null) count.textContent = deploy.uploaded >= deploy.total ? `${String(deploy.total)} of ${String(pages)} pages uploaded` : `${String(deploy.uploaded)} of ${String(deploy.total)} uploading`;
		},
		// The story: every page, then only the changed ones.
		begin: () => {
			clearTimeout(pending);
			run(true);
			pending = setTimeout(() => { pending = undefined; run(false); }, (0.3 + pages * 0.07 + 0.9 + 1.4) * 1000);
		},
		end: () => {
			if (pending === undefined) return;
			clearTimeout(pending);
			pending = undefined;
			run(false);
		},
	}, nightOf(mode));
	cleanup(() => { clearTimeout(pending); });
	const height = (width: number, size: number): number => deployLayout(width, pages).height * size;
	return (
		<figure theme="scene" data-scene="toggle" aria-label={data.caption}>
			<div id={props.id} theme={['scene_stage', 'scene_stage_map']}>
				<canvas theme="scene_paint" aria-hidden="true" />
				<Height wide={height(253, 3)} mid={height(173, 3)} narrow={height(155, 2)} />
				<span theme={['scene_tag', 'scene_placed']} data-thing="store" data-placed="" data-middle="">{data.store}</span>
				<span theme={['scene_count', 'scene_placed']} data-thing="count" data-placed="" data-middle="">{`${String(changed.length)} of ${String(pages)} pages uploaded`}</span>
				{(data.names ?? []).map((name, i) => <span theme={['scene_card', 'scene_placed', 'scene_card_small']} data-thing={`page:${String(i)}`} data-placed="" data-middle="">{name}</span>)}
			</div>
			<Foot
				caption={data.caption}
				example={data.example}
				play={stage.play}
				extra={<Switch label={data.caption} first={data.first} second={data.second} second$={second} choose={(changedOnly) => { clearTimeout(pending); pending = undefined; run(!changedOnly); }} />}
			/>
		</figure>
	);
});

/** Tasks beside their prompts: an admin's edit live, or the default from the code. */
const PromptsScene = ModeContext.use((mode) => (props: { id: string; data: Toggle }, cleanup: Cleanup): unknown => {
	const data = props.data, tasks = data.tasks ?? [];
	const off = mutable(false);
	let edits = { on: true, since: 0 };
	const stage = useStage(cleanup, props.id, {
		paint: (night, width, height, moving, live) => createPrompts({ width, height, night, moving, started: () => live.started, boxes: () => live.boxes, tasks: tasks.map((task) => ({ edit: task.edit !== undefined })), edits: () => edits }),
	}, nightOf(mode));
	const choose = (defaults: boolean): void => {
		off.set(defaults);
		edits = { on: !defaults, since: motion.get() ? stage.time() : 0 };
		stage.redraw();
	};
	return (
		<figure theme="scene" data-scene="toggle" aria-label={data.caption}>
			<div id={props.id} theme={['scene_stage', 'scene_stage_flow', 'scene_stage_tasks']}>
				<canvas theme="scene_paint" aria-hidden="true" />
				<ol theme="scene_tasks">
					{tasks.map((task, k) => (
						<li theme="scene_task">
							<span theme="scene_card" data-thing={`task:${String(k)}`}><Pixels name="prompt" /><span theme="scene_name">{task.name}</span></span>
							<span theme={['scene_slot', 'scene_slot_who']} data-slot={`who:${String(k)}`} />
							<span theme="scene_prompt">
								<span theme={['scene_card', 'scene_card_under']} data-thing={`prompt:${String(k)}`}><Pixels name="code" />{task.prompt}</span>
								{task.edit === undefined ? null : <span theme={['scene_found', 'scene_found_edit']} data-thing={`edit:${String(k)}`}><Pixels name="person" />{task.edit}</span>}
							</span>
						</li>
					))}
				</ol>
			</div>
			<Foot
				caption={data.caption}
				example={data.example}
				play={stage.play}
				extra={<Switch label={data.caption} first={data.first} second={data.second} second$={off} choose={choose} />}
			/>
		</figure>
	);
});

// --- match -----------------------------------------------------------------------------------------

const KIND_ICON: Readonly<Record<string, IconName>> = { file: 'file', cv: 'cv', proposal: 'proposal', page: 'page', search: 'search' };

/** What was asked for, and what answers each part of it, joined by lines. */
const MatchScene = ModeContext.use((mode) => (props: { id: string; data: Match }, cleanup: Cleanup): unknown => {
	const data = props.data;
	const links = data.right.items.flatMap((item, j) => item.answers.map((answer) => [data.left.items.indexOf(answer), j] as const));
	const stage = useStage(cleanup, props.id, {
		paint: (night, width, height, moving, live) => createMatch({ width, height, night, moving, started: () => live.started, boxes: () => live.boxes, links, left: data.left.items.length, right: data.right.items.length }),
	}, nightOf(mode));
	return (
		<figure theme="scene" data-scene="match" aria-label={data.caption}>
			<div id={props.id} theme={['scene_stage', 'scene_stage_flow', 'scene_stage_fit', 'scene_stage_match']}>
				<canvas theme="scene_paint" aria-hidden="true" />
				<div theme="scene_side">
					<p theme="scene_tag">{data.left.label}</p>
					<ol theme="scene_rows">
						{data.left.items.map((item, k) => (
							<li theme="scene_row"><span theme={['scene_slot', 'scene_slot_mark']} data-slot={`mark:${String(k)}`} /><span theme="scene_card" data-thing={`left:${String(k)}`}>{item}</span></li>
						))}
					</ol>
				</div>
				<div theme={'scene_side'}>
					<p theme="scene_tag">{data.right.label}</p>
					<ol theme="scene_rows">
						{data.right.items.map((item, j) => (
							<li theme="scene_row">
								<span theme="scene_found" data-thing={`right:${String(j)}`}><Pixels name={KIND_ICON[item.kind ?? 'file'] ?? 'file'} />{item.text}</span>
								<span theme={['scene_slot', 'scene_slot_marks']} data-slot={`marks:${String(j)}`} />
							</li>
						))}
					</ol>
				</div>
			</div>
			<Foot caption={data.caption} example={data.example} play={stage.play} />
		</figure>
	);
});

// --- numbers ---------------------------------------------------------------------------------------

/** The post's figures, each with its bar, its blocks, or its two ends. */
const NumbersScene = ModeContext.use((mode) => (props: { id: string; data: Numbers }, cleanup: Cleanup): unknown => {
	const data = props.data;
	const figures = data.figures.map((figure) => (figure.share !== undefined ? { share: figure.share }
		: figure.count !== undefined ? { count: figure.count } : { ends: figure.ends!, under: figure.under! }));
	const stage = useStage(cleanup, props.id, {
		paint: (night, width, height, moving, live) => createNumbers({ width, height, night, moving, started: () => live.started, boxes: () => live.boxes, figures }),
	}, nightOf(mode));
	return (
		<figure theme="scene" data-scene="numbers" aria-label={data.caption}>
			<div id={props.id} theme={['scene_stage', 'scene_stage_flow']}>
				<canvas theme="scene_paint" aria-hidden="true" />
				<ol theme="scene_figures">
					{data.figures.map((figure, k) => (
						<li theme="scene_figure">
							<span theme="scene_words" data-thing={`figure:${String(k)}`}>
								<span theme="scene_value">{figure.value ?? figure.to}</span>
								<span theme="scene_line">{figure.label}</span>
							</span>
							{figure.from === undefined
								? <span theme={['scene_slot', figure.count === undefined ? 'scene_slot_bar' : 'scene_slot_blocks']} data-slot={`bar:${String(k)}`} />
								: (
									<span theme="scene_ends">
										<span theme="scene_end">{figure.from}</span>
										<span theme={['scene_slot', 'scene_slot_bar']} data-slot={`bar:${String(k)}:from`} />
										<span theme="scene_end">{figure.to}</span>
										<span theme={['scene_slot', 'scene_slot_bar']} data-slot={`bar:${String(k)}:to`} />
									</span>
								)}
						</li>
					))}
				</ol>
			</div>
			<Foot caption={data.caption} example={data.example} play={stage.play} />
		</figure>
	);
});

// --- schedule --------------------------------------------------------------------------------------

/** An event's program under bunting, each item reached in turn down a rail. */
const ScheduleScene = ModeContext.use((mode) => (props: { id: string; data: Schedule }, cleanup: Cleanup): unknown => {
	const data = props.data, kinds = data.items.map((item) => item.kind ?? 'talk');
	const stage = useStage(cleanup, props.id, {
		paint: (night, width, height, moving, live) => createSchedule({ width, height, night, moving, started: () => live.started, boxes: () => live.boxes, kinds }),
	}, nightOf(mode));
	return (
		<figure theme="scene" data-scene="schedule" aria-label={data.caption}>
			<div id={props.id} theme={['scene_stage', 'scene_stage_flow']}>
				<canvas theme="scene_paint" aria-hidden="true" />
				<span theme={['scene_slot', 'scene_slot_bunting']} data-slot="bunting" />
				<ol theme="scene_program">
					{data.items.map((item, k) => (
						<li theme="scene_event">
							<span theme={['scene_slot', 'scene_slot_rail']} data-slot={`rail:${String(k)}`} />
							<span theme={['scene_slot', 'scene_slot_event']} data-slot={`item:${String(k)}`} />
							<span theme="scene_words" data-thing={`item:${String(k)}`}>
								<span theme="scene_name">{item.name}</span>
								{item.line === undefined ? null : <span theme="scene_line">{item.line}</span>}
							</span>
						</li>
					))}
				</ol>
			</div>
			<Foot caption={data.caption} example={data.example} play={stage.play} />
		</figure>
	);
});

// --- in a feed, and the hook -----------------------------------------------------------------------

/** A scene in a feed: its still frame, which the build painted, and its words as a list. */
const InFeed = (props: { scene: Scene }): unknown => {
	const data = props.scene.data;
	return (
		<figure>
			{data.frame === undefined ? null : <img src={data.frame} alt={data.caption} />}
			<ul>{(data.words ?? []).map((word) => <li>{word}</li>)}</ul>
			<figcaption>{data.example === undefined ? data.caption : `${data.caption} ${data.example}.`}</figcaption>
		</figure>
	);
};

/**
 * A scene from a post's fence, by its name. `id` names its stage, and is the same on the server
 * and in the browser. `feed` gives the feed's still frame and list of words instead.
 */
export const SceneBlock = (props: { id: string; scene: Scene; feed?: boolean }): unknown => {
	const scene = props.scene;
	if (props.feed === true) return <InFeed scene={scene} />;
	switch (scene.name) {
		case 'pipeline': return <PipelineScene id={props.id} data={scene.data} />;
		case 'cluster': return <ClusterScene id={props.id} data={scene.data} />;
		case 'fanout': return <FanoutScene id={props.id} data={scene.data} />;
		case 'toggle': return <ToggleScene id={props.id} data={scene.data} />;
		case 'match': return <MatchScene id={props.id} data={scene.data} />;
		case 'numbers': return <NumbersScene id={props.id} data={scene.data} />;
		case 'schedule': return <ScheduleScene id={props.id} data={scene.data} />;
	}
};
