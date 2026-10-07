// The landing page.
//
// Content lives in frontend/data/resume.json and nowhere else. resume_pdf_generator.py reads the
// same file at build time, so the page and the downloadable PDF cannot drift. The adapters below
// only reshape that data into what <Entry> expects; add resume content by editing the JSON.

import { mutable } from '@aweftjs/core';
import type { Derived } from '@aweftjs/core';
import { Button, Icon, Typography, h } from '@aweftjs/ui';

import resume from '../data/resume.json' with { type: 'json' };
import { heroScale, heroScene, photoBox, runPerch, runScene, stripPainter } from '../strip.ts';
import type { Painter } from '../strip.ts';
import { ModeContext } from '../theme.ts';
import { Contact } from '../utils/contact.tsx';
import { Email } from '../utils/email.tsx';
import { Rule, nightOf } from '../utils/forest.tsx';
import { Resume } from '../utils/resume.tsx';

const { profile } = resume;

/** One block of the page: a heading, a rule, an optional logo line, dates and bullets. */
interface Item {
	readonly header: string;
	readonly headerUrl?: string;
	readonly image?: string;
	readonly imageStyle?: Record<string, unknown>;
	readonly imageName?: string;
	readonly url?: string | null;
	readonly start?: string;
	readonly end?: string | null;
	readonly description?: string;
	readonly bullets: readonly string[];
}

const work: readonly Item[] = resume.work.map((job) => ({
	header: job.role,
	image: job.logo,
	imageName: job.company,
	...(job.logoStyle === undefined ? {} : { imageStyle: job.logoStyle }),
	url: job.companyUrl,
	start: job.start,
	end: job.end,
	// An entry may omit its stack (worX4you's is League's), and no description hides the row.
	...(job.tech ? { description: `Tech: ${job.tech}` } : {}),
	bullets: job.bullets,
}));

const projects: readonly Item[] = resume.projects.map((project) => ({
	header: project.name,
	headerUrl: project.url,
	description: project.description,
	bullets: project.bullets,
}));

const monthOf = (iso: string | null | undefined): string => {
	if (!iso) return '';
	const [year, month] = iso.split('-').map(Number);
	const date = new Date(year ?? 0, (month ?? 1) - 1, 1);
	return `${date.toLocaleString('en-US', { month: 'short' })} ${String(date.getFullYear())}`;
};

const span = (start: string | undefined, end: string | null | undefined): string =>
	`${monthOf(start)} to ${end ? monthOf(end) : 'Present'}`;

const Away = (): unknown => <Icon name="feather:external-link" style={{ marginLeft: 3 }} />;

const Entry = (props: { item: Item }): unknown => {
	const item = props.item;
	return (
		<div theme="column">
			{item.headerUrl === undefined
				? <Typography type="p1_bold" label={item.header} />
				: (
					<div theme="row">
						<Button
							inline
							iconPosition="right"
							icon={<Away />}
							href={item.headerUrl}
							label={<Typography type="p1_bold" label={item.header} />}
						/>
					</div>
				)}

			<div theme={['divider', 'entry']} />

			<div theme={['row', 'wrap']}>
				<div theme="row">
					{item.image === undefined ? null : (
						<img
							src={item.image}
							theme="logo"
							alt={`Logo of ${item.imageName ?? item.header}`}
							style={{
								boxSizing: 'border-box',
								// A square box rather than a width with the file's own height. One logo
								// is 1.098:1 and came out 35.156px tall, and that fraction pushed every
								// rule below it off a device pixel row.
								width: 'clamp(1rem, 15vw, 2rem)',
								height: 'clamp(1rem, 15vw, 2rem)',
								objectFit: 'contain',
								margin: 2,
								...item.imageStyle,
							}}
						/>
					)}
					{item.imageName === undefined ? null : item.url
						? (
							<Button
								inline
								iconPosition="right"
								icon={<Away />}
								style={{ padding: 2, margin: 2 }}
								href={item.url}
								label={<Typography type="p1" label={item.imageName} />}
							/>
						)
						: (
							<Typography
								style={{ textAlign: 'right', paddingLeft: 10 }}
								type="p1"
								label={item.imageName}
							/>
						)}
				</div>
			</div>

			{item.start === undefined && !item.end ? null
				: <Typography type="date" label={span(item.start, item.end)} />}

			{item.description === undefined ? null
				: <Typography type="body_bold" label={item.description} />}

			<ul style={{ paddingLeft: 25 }}>
				{item.bullets.map((said) => <li><Typography type="body" label={said} /></li>)}
			</ul>
		</div>
	);
};

/**
 * A section of the page under its heading. The heading's rule is the bank of a small strip whose
 * tree grows taller under each heading down the page (forest.tsx); `index` is its place.
 */
const Section = (props: { title: string; index: number; children?: unknown[] }): unknown => (
	<div theme="content">
		<div theme="heading">
			<Typography theme={['row', 'wide', 'start', 'heading_title']} type="h2" label={props.title} />
			<Rule index={props.index} />
		</div>
		{props.children}
	</div>
);

const STRIP = 'hero-strip';
const BIRD = 'hero-bird';
const PHOTO = 'hero-photo';
const FRONT = 'hero-front';

/**
 * The photo's pixels at a size, read from the photo the page already shows, or null until it has
 * loaded. Each size is read once.
 */
const pixelsOf = (photo: HTMLImageElement): ((width: number, height: number) => Uint32Array | null) => {
	const read = new Map<string, Uint32Array>();
	return (width, height) => {
		const key = `${String(width)}x${String(height)}`;
		const held = read.get(key);
		if (held !== undefined) return held;
		if (!photo.complete || photo.naturalWidth === 0) return null;
		const canvas = document.createElement('canvas');
		canvas.width = width; canvas.height = height;
		const context = canvas.getContext('2d');
		if (context === null) return null;
		context.imageSmoothingQuality = 'high';
		context.drawImage(photo, 0, 0, width, height);
		const pixels = new Uint32Array(context.getImageData(0, 0, width, height).data.buffer.slice(0));
		read.set(key, pixels);
		return pixels;
	};
};

/**
 * Keep the sharp photo over the strip's pixel copy of it, and lay over the photo whatever the strip
 * draws in front of it: the pixels of the copy that are not the photo's own are a leaf, a vine or a
 * bird, and go on the canvas above. Moved by transform, so its floating is never a layout shift.
 */
const overlay = (
	photo: HTMLImageElement,
	cover: HTMLCanvasElement,
	pixels: (width: number, height: number) => Uint32Array | null,
	box: () => { readonly width: number; readonly height: number },
): ((painter: Painter, shown: Uint32Array, size: number) => void) => {
	let image: ImageData | null = null, sized = '', placed = '';
	return (painter, shown, size) => {
		const at = 'stoneAt' in painter ? (painter.stoneAt as { x: number; y: number } | null) : null;
		const { width, height } = box(), iw = width - 2, ih = height - 2, own = pixels(iw, ih);
		if (at === null || own === null) return;
		const left = at.x + 1, top = at.y + 1;
		const fit = `${String(iw)} ${String(ih)} ${String(size)}`;
		if (fit !== sized) {
			sized = fit;
			for (const element of [photo, cover]) { element.style.width = `${String(iw * size)}px`; element.style.height = `${String(ih * size)}px`; }
		}
		const where = `translate(${String(left * size)}px, ${String(top * size)}px)`;
		if (where !== placed) { placed = where; photo.style.transform = where; cover.style.transform = where; }
		const context = cover.getContext('2d');
		if (context === null) return;
		if (cover.width !== iw || cover.height !== ih || image === null) { cover.width = iw; cover.height = ih; image = context.createImageData(iw, ih); }
		const out = new Uint32Array(image.data.buffer), W = painter.width, H = painter.height;
		for (let y = 0; y < ih; y++) {
			const row = top + y;
			for (let x = 0; x < iw; x++) {
				const col = left + x, c = row >= 0 && row < H && col >= 0 && col < W ? shown[row * W + col]! : 0;
				out[y * iw + x] = c === own[y * iw + x] ? 0 : c;
			}
		}
		context.putImageData(image, 0, 0);
	};
};

/**
 * The top of the landing page: the pixel strip across the window with the photo floating over its
 * bank, the name, the role and a sentence in its sky, and on its water the resume, the two ways to
 * get in touch, and where the work can happen.
 *
 * The strip only exists in a browser. The page the build writes has the words, the photo near where
 * it floats, and an empty canvas, and the scene starts on the first frame after the page comes
 * alive, in the mode the page is in; once the photo has loaded the strip takes it in. On that frame
 * a bird sets off for the resume button too.
 */
const Hero = ModeContext.use((mode) => (
	props: { focused: Derived<boolean> },
	cleanup: (...fns: (() => void)[]) => void,
): unknown => {
	if (typeof requestAnimationFrame === 'function') {
		const night = nightOf(mode);
		let stop = (): void => {};
		let perch = (): void => {};
		const first = requestAnimationFrame(() => {
			const host = document.getElementById(STRIP);
			const photo = document.getElementById(PHOTO);
			const cover = document.getElementById(FRONT);
			if (host === null || !(photo instanceof HTMLImageElement) || !(cover instanceof HTMLCanvasElement)) return;
			const pixels = pixelsOf(photo);
			let width = host.getBoundingClientRect().width;
			const running = runScene(host, {
				paint: (dark, across, down, css, moving) => {
					width = css;
					return stripPainter(heroScene(dark, css, pixels), across, down, moving);
				},
				drawn: overlay(photo, cover, pixels, () => photoBox(width)),
			}, night);
			stop = running.stop;
			// The photo is in the page the build wrote, so it is often loaded by now; when it is not,
			// the strip starts without it and takes it in once it is.
			photo.decode().then(() => { running.again(); }, () => {});
			const hero = host.parentElement;
			const bird = document.getElementById(BIRD);
			const resume = hero?.querySelector<HTMLElement>('a[download]');
			if (hero && bird instanceof HTMLCanvasElement && resume) {
				perch = runPerch(hero, bird, resume, heroScale, () => night.get(), { shy: true }).stop;
			}
		});
		cleanup(() => { cancelAnimationFrame(first); stop(); perch(); });
	}

	return (
		<div theme="hero">
			<div id={STRIP} theme="hero_strip">
				<canvas theme="hero_canvas" aria-hidden="true" />
				{/* A head-and-shoulders crop of headshot.webp (930 by 1240 from x 135, y 356), at 600 by 800.
				    Pressing it dips it into the pond. */}
				<img
					id={PHOTO}
					theme="hero_photo"
					src="/portrait.webp"
					width="600"
					height="800"
					alt="Torrin Leonard, head and shoulders, in front of evergreens."
					draggable="false"
				/>
				<canvas id={FRONT} theme="hero_front" aria-hidden="true" />
			</div>
			<div theme="hero_over">
				<div theme="hero_sky">
					<div theme="hero_intro">
						<Typography type="h1" label={profile.name} />
						<Typography type="date" label={profile.heroLabel} />
						<Typography type="p1" theme="hero_lede" label={profile.heroLede} />
					</div>
				</div>
				<div theme="hero_water">
					<div theme="hero_actions">
						<Resume />
						<button
							type="button"
							theme="quietlink"
							title="Get in touch with Torrin Leonard."
							onClick={() => {
								const block = document.getElementById('contact');
								if (block === null) return;
								props.focused.set(true);
								block.scrollIntoView({ behavior: 'smooth', block: 'start' });
							}}
						>
							Contact
						</button>
						<Email theme="quietlink" />
					</div>
					<p theme="hero_where">{profile.heroWhere}</p>
				</div>
			</div>
			<canvas id={BIRD} theme="hero_bird" aria-hidden="true" width="8" height="6" />
		</div>
	);
});

export const Landing = (): unknown => {
	const focused = mutable(false);

	return [
		<Hero focused={focused} />,

		<Section title="Experience" index={0}>
			<div theme="column" style={{ width: '100%', gap: 20 }}>
				{work.map((item) => <Entry item={item} />)}
			</div>
		</Section>,

		<Section title="Projects" index={1}>
			<div theme="column" style={{ width: '100%', gap: 20 }}>
				{projects.map((item) => <Entry item={item} />)}
			</div>
		</Section>,

		<Section title="Skills" index={2}>
			<ul style={{ paddingLeft: 25 }}>
				{resume.skills.map((skill) => (
					<li>
						<Typography type="body_bold" label={`${skill.label}:`} />
						<Typography type="body" label={` ${skill.text}`} />
					</li>
				))}
			</ul>
		</Section>,

		<Section title="Education" index={3}>
			<Typography theme={['row', 'wide', 'start']} type="p1" label={resume.education.summary} />
			<ul style={{ paddingLeft: 25 }}>
				{resume.education.credentials.map((credential) => (
					<li>
						<Button
							inline
							iconPosition="right"
							icon={<Away />}
							href={credential.url}
							label={<Typography type="body" label={credential.name} />}
						/>
						<Typography type="body" label={` (${credential.issuer}, ${credential.year})`} />
					</li>
				))}
			</ul>
		</Section>,

		<Contact focused={focused} rule={4} />,
	];
};
