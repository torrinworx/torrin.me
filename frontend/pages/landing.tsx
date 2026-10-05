// The landing page.
//
// Content lives in frontend/data/resume.json and nowhere else. resume_pdf_generator.py reads the
// same file at build time, so the page and the downloadable PDF cannot drift. The adapters below
// only reshape that data into what <Entry> expects; add resume content by editing the JSON.

import { mutable } from '@aweftjs/core';
import type { Derived } from '@aweftjs/core';
import { Button, Icon, Typography, h } from '@aweftjs/ui';

import resume from '../data/resume.json' with { type: 'json' };
import { heroScale, heroScene, runPerch, runStrip } from '../strip.ts';
import { ModeContext, dark } from '../theme.ts';
import { Contact } from '../utils/contact.tsx';
import { Email } from '../utils/email.tsx';
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

const Section = (props: { title: string; children?: unknown[] }): unknown => (
	<div theme="content">
		<Typography theme={['row', 'wide', 'start']} type="h2" label={props.title} />
		{/* Every section heading carries one. The live site drew a rule under Experience and
		    Projects only, and that was the first entry's own rule showing through rather than a
		    decision: Skills and Education, whose first child is not an entry, had none. */}
		<div theme="divider" />
		{props.children}
	</div>
);

const STRIP = 'hero-strip';
const BIRD = 'hero-bird';

/**
 * The top of the landing page: the pixel strip across the window, the name, the role, a sentence and
 * the photo in its sky, and on its water the resume, the two ways to get in touch, and where the work
 * can happen.
 *
 * The strip only exists in a browser. The page the build writes has the words and an empty canvas,
 * and the scene starts on the first frame after the page comes alive, in the mode the page is in.
 * On that frame a bird sets off for the resume button too. A change of mode repaints both and
 * sends neither back to the start.
 */
const Hero = ModeContext.use((mode) => (
	props: { focused: Derived<boolean> },
	cleanup: (...fns: (() => void)[]) => void,
): unknown => {
	if (typeof requestAnimationFrame === 'function') {
		let stop = (): void => {};
		let off = (): void => {};
		const start = (night: boolean): void => {
			stop();
			const host = document.getElementById(STRIP);
			stop = host === null ? () => {} : runStrip(host, (width) => heroScene(night, width), heroScale);
		};
		let perch = (): void => {};
		const first = requestAnimationFrame(() => {
			if (mode === null) start(false);
			else off = mode.effect((held) => { start(held === dark); });
			const hero = document.getElementById(STRIP)?.parentElement;
			const bird = document.getElementById(BIRD);
			const resume = hero?.querySelector<HTMLElement>('a[download]');
			if (hero && bird instanceof HTMLCanvasElement && resume) {
				perch = runPerch(hero, bird, resume, heroScale, () => mode?.get() === dark);
			}
		});
		cleanup(() => { cancelAnimationFrame(first); off(); stop(); perch(); });
	}

	return (
		<div theme="hero">
			<div id={STRIP} theme="hero_strip" aria-hidden="true">
				<canvas theme="hero_canvas" />
			</div>
			<div theme="hero_over">
				<div theme="hero_sky">
					<div theme="hero_intro">
						<Typography type="h1" label={profile.name} />
						<Typography type="date" label={profile.heroLabel} />
						<Typography type="p1" theme="hero_lede" label={profile.heroLede} />
					</div>
					{/* A square head-and-shoulders crop of headshot.webp (800px from x 200, y 360), at 360px. */}
					<img theme="hero_photo" src="/headshot-square.webp" width="120" height="120" alt="Profile image of Torrin Leonard." />
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

		<Section title="Experience">
			<div theme="column" style={{ width: '100%', gap: 20 }}>
				{work.map((item) => <Entry item={item} />)}
			</div>
		</Section>,

		<Section title="Projects">
			<div theme="column" style={{ width: '100%', gap: 20 }}>
				{projects.map((item) => <Entry item={item} />)}
			</div>
		</Section>,

		<Section title="Skills">
			<ul style={{ paddingLeft: 25 }}>
				{resume.skills.map((skill) => (
					<li>
						<Typography type="body_bold" label={`${skill.label}:`} />
						<Typography type="body" label={` ${skill.text}`} />
					</li>
				))}
			</ul>
		</Section>,

		<Section title="Education">
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

		<Contact focused={focused} />,
	];
};
