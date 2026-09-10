// The landing page.
//
// Content lives in frontend/data/resume.json and nowhere else. resume_pdf_generator.py reads the
// same file at build time, so the page and the downloadable PDF cannot drift. The adapters below
// only reshape that data into what <Entry> expects; add resume content by editing the JSON.

import { mutable } from '@aweftjs/core';
import { Button, Icon, Typography, h } from '@aweftjs/ui';

import resume from '../data/resume.json' with { type: 'json' };
import { Contact } from '../utils/contact.tsx';
import { Email } from '../utils/email.tsx';
import { Resume } from '../utils/resume.tsx';
import { useShine } from '../utils/shine.tsx';

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

const ordinal = (day: number): string => {
	const teens = day % 100;
	if (teens >= 11 && teens <= 13) return 'th';
	switch (day % 10) {
		case 1: return 'st';
		case 2: return 'nd';
		case 3: return 'rd';
		default: return 'th';
	}
};

const dayOf = (iso: string | null | undefined): string => {
	if (!iso) return '';
	const [year, month, day] = iso.split('-').map(Number);
	const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
	return `${date.toLocaleString('en-US', { month: 'short' })} ${String(date.getDate())}`
		+ `${ordinal(date.getDate())}, ${String(date.getFullYear())}`;
};

const span = (start: string | undefined, end: string | null | undefined): string =>
	`${dayOf(start)} to ${end ? dayOf(end) : 'Present'}`;

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
				: <Typography type="p1_italic" label={span(item.start, item.end)} />}

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

export const Landing = (
	_props: Record<string, unknown>,
	cleanup: (...fns: (() => void)[]) => void,
): unknown => {
	const focused = mutable(false);

	return [
		<div theme={['content', 'start']}>
			<div
				theme={['row', 'wide', 'start']}
				style={{ alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
			>
				<div style={{ flex: '1 1 0', minWidth: 0 }}>
					<Typography theme={['row', 'wide', 'start']} type="h1" label={profile.name} />
					<Typography theme={['row', 'wide', 'start']} type="p1" label={profile.tagline} />
					<Typography theme={['row', 'wide', 'start']} type="p1" label={profile.intro} />
				</div>

				<div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end' }}>
					<img
						src="/headshot.webp"
						theme="ring"
						alt="Profile image of Torrin Leonard."
						style={{
							borderRadius: 20,
							// A whole-pixel width and a 3:4 box, so the height is an integer. Left to the
							// file's own ratio it came out 239.656px tall, and that fraction was the
							// origin of every blurred rule below it: the live site has the same one.
							width: 'round(20vw, 3px)',
							maxWidth: 180,
							minWidth: 141,
							aspectRatio: '3 / 4',
							height: 'auto',
							objectFit: 'cover',
							display: 'block',
						}}
					/>
				</div>
			</div>

			<div theme="divider" style={{ marginTop: 16 }} />

			<Typography theme={['row', 'wide', 'start']} type="p1_bold" label={profile.locationDisplay} />
			<Typography
				theme={['row', 'wide', 'start']}
				type="p1"
				label={`${profile.availability} ${profile.remote}`}
			/>

			<div theme={['row', 'wrap', 'wide', 'start']} style={{ marginTop: 10, gap: 10 }}>
				<Resume />
				<Button
					id="get-in-touch"
					theme="shiny"
					title="Get in touch with Torrin Leonard."
					label="Contact"
					icon={<Icon name="feather:mail" />}
					iconPosition="right"
					onClick={() => {
						const block = document.getElementById('contact');
						if (block === null) return;
						focused.set(true);
						block.scrollIntoView({ behavior: 'smooth', block: 'start' });
					}}
				>
					{useShine(cleanup)}
				</Button>
				<Email type="quiet" />
				<Button
					type="quiet"
					title="Torrin Leonard's Github."
					label="Github"
					icon={<Icon name="feather:github" />}
					iconPosition="right"
					href={profile.github}
				/>
			</div>
		</div>,

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
