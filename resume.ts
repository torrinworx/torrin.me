// The downloadable resume, built from the same JSON the site renders.
//
// Replaces a reportlab script and the 70 MB virtualenv it needed. The layout is the one that
// script drew, in points on US Letter, because the document goes to employers and an applicant
// tracking system reads its text layer.
//
// Two things here are not decoration and should not be tidied away:
//   - the contact line is flowed text, not part of the drawn header, because a parser reads the
//     text layer and never sees a link annotation. Without it a regex looking for an email, a
//     phone or a LinkedIn URL finds nothing.
//   - the remote line is stated in extractable text, because location is one of the most common
//     hard knockout filters and a screener should not have to guess.
//
// Run: npm run resume:pdf

import { mkdirSync, readFileSync } from 'node:fs';
import { createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import PDFDocument from 'pdfkit';

const here = fileURLToPath(new URL('.', import.meta.url));
const DATA = join(here, 'frontend/data/resume.json');
// Straight into the served asset directory: the download button fetches
// /Torrin_Leonard_Resume.pdf, so writing anywhere else leaves the live download stale.
const OUT = join(here, 'frontend/public/Torrin_Leonard_Resume.pdf');

interface Entry { readonly pdf?: boolean }
interface Job extends Entry {
	readonly role: string; readonly company: string; readonly location: string;
	readonly start: string; readonly end: string | null; readonly tech?: string | null;
	readonly bullets: readonly string[];
}
interface Project extends Entry {
	readonly name: string; readonly url: string; readonly description: string;
	readonly bullets: readonly string[];
}
interface Credential extends Entry { readonly name: string; readonly issuer: string; readonly year: number | string }
interface Resume {
	readonly profile: Record<string, string>;
	readonly work: readonly Job[];
	readonly projects: readonly Project[];
	readonly skills: readonly { readonly label: string; readonly text: string }[];
	readonly education?: { readonly summary: string; readonly credentials?: readonly Credential[] };
}

const resume = JSON.parse(readFileSync(DATA, 'utf8')) as Resume;
const profile = resume.profile;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2023-03-01` to `Mar 2023`. */
const month = (iso: string): string => {
	const [year, index] = iso.split('-');
	return `${MONTHS[Number(index) - 1] ?? ''} ${String(year)}`;
};

/** A plain hyphen, not an en dash: text extraction handles it more predictably. */
const range = (start: string, end: string | null | undefined): string =>
	`${month(start)} - ${end === null || end === undefined ? 'Present' : month(end)}`;

/**
 * The site has unlimited room and the PDF does not. An entry saying `"pdf": false` stays on the
 * site and is dropped here.
 */
const forPdf = <T extends Entry>(entries: readonly T[]): T[] => entries.filter((one) => one.pdf !== false);

const LETTER: [number, number] = [612, 792];
const MARGIN = 54;
const HEADER_X = 72;
const LINKS: readonly [string, string][] = [
	['Website', profile['website']!],
	['GitHub', profile['github']!],
	['LinkedIn', profile['linkedin']!],
];

const doc = new PDFDocument({ size: 'LETTER', margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN }, autoFirstPage: false });
mkdirSync(dirname(OUT), { recursive: true });
const written = doc.pipe(createWriteStream(OUT));

/** The compact running header every page after the first carries. */
const runningHeader = (): void => {
	doc.font('Helvetica-Bold').fontSize(9).fillColor('black')
		.text(`${profile['name']!}, ${profile['title']!}`, HEADER_X, 42, { lineBreak: false });
	doc.font('Helvetica').fontSize(8)
		.text(profile['website']!, LETTER[0] - HEADER_X - 200, 42, { width: 200, align: 'right', lineBreak: false });
};

let first = true;
doc.on('pageAdded', () => { if (!first) runningHeader(); });

doc.addPage();

// The drawn header: name, title, email, and three buttons that are real link annotations.
doc.font('Helvetica-Bold').fontSize(17).fillColor('black').text(profile['name']!, HEADER_X, 62 - 17, { lineBreak: false });
doc.font('Helvetica').fontSize(10).text(profile['title']!, HEADER_X, 80 - 10, { lineBreak: false });
doc.fontSize(10).text(`Email: ${profile['email']!}`, HEADER_X, 122 - 10, { lineBreak: false });

const BUTTON_Y = 146 - 16;
let x = HEADER_X;
for (const [label, url] of LINKS) {
	doc.font('Helvetica-Bold').fontSize(8.5);
	const width = doc.widthOfString(label) + 16;
	doc.roundedRect(x, BUTTON_Y, width, 16, 4).fill('lightgrey');
	doc.fillColor('black').text(label, x + 8, BUTTON_Y + 5, { lineBreak: false });
	doc.link(x, BUTTON_Y, width, 16, url);
	x += width + 8;
}

// Everything below flows, and flowing starts under the drawn header.
doc.fillColor('black');
doc.x = MARGIN;
doc.y = MARGIN + 100;
first = false;

const CONTENT = LETTER[0] - MARGIN * 2;

const body = (text: string, options: PDFKit.Mixins.TextOptions = {}): void => {
	doc.font('Helvetica').fontSize(8.5).fillColor('black').text(text, { width: CONTENT, lineGap: 2, ...options });
};
const bold = (text: string): void => {
	doc.font('Helvetica-Bold').fontSize(8.5).fillColor('black').text(text, { width: CONTENT, lineGap: 2 });
};
const italic = (text: string): void => {
	doc.font('Helvetica-Oblique').fontSize(8).fillColor('black').text(text, { width: CONTENT, lineGap: 2 });
};
const heading = (text: string): void => {
	doc.moveDown(0.5);
	doc.font('Helvetica-Bold').fontSize(11).fillColor('black').text(text, { width: CONTENT });
	doc.moveDown(0.2);
};
const bullets = (items: readonly string[]): void => {
	doc.font('Helvetica').fontSize(8.5).fillColor('black')
		.list([...items], { width: CONTENT, bulletRadius: 1.4, textIndent: 10, bulletIndent: 0, lineGap: 2 });
};

// The contact details, as flowed text a parser can extract. 8pt, not the body's 8.5, because at
// 8.5 the line wraps and splits the GitHub URL across two lines.
const contact = (text: string): void => {
	doc.font('Helvetica').fontSize(8).fillColor('black').text(text, MARGIN, doc.y, { width: CONTENT, lineGap: 2 });
};
contact([
	profile['location']!,
	profile['email']!,
	profile['phone']!,
	profile['website']!.replace('https://', ''),
	profile['linkedin']!.replace('https://www.', '').replace(/\/$/, ''),
	profile['github']!.replace('https://', ''),
].join(' | '));
doc.font('Helvetica-Bold').fontSize(8).text(profile['remote']!, MARGIN, doc.y, { width: CONTENT, lineGap: 2 });

heading('Summary');
body(profile['summary']!);

heading('Experience');
for (const job of forPdf(resume.work)) {
	bold(`${job.role}, ${job.company}`);
	italic(`${range(job.start, job.end)} | ${job.location}`);
	if (job.tech !== undefined && job.tech !== null && job.tech !== '') bold(`Tech: ${job.tech}`);
	bullets(job.bullets);
	doc.moveDown(0.3);
}

heading('Projects');
for (const project of forPdf(resume.projects)) {
	// One line in three runs, as the old generator drew it: the name, a separator, then the URL in
	// blue and linked. `continued` is what keeps the runs from colliding.
	doc.font('Helvetica-Bold').fontSize(8.5).fillColor('black')
		.text(project.name, MARGIN, doc.y, { width: CONTENT, continued: true });
	doc.font('Helvetica').text(' | ', { continued: true });
	doc.fillColor('blue').text(project.url, { link: project.url, underline: false });
	doc.fillColor('black');
	doc.x = MARGIN;
	italic(project.description);
	bullets(project.bullets);
	doc.moveDown(0.3);
}

heading('Skills');
for (const skill of resume.skills) {
	doc.font('Helvetica-Bold').fontSize(8.5).fillColor('black')
		.text(`${skill.label}: `, MARGIN, doc.y, { width: CONTENT, lineGap: 2, continued: true });
	doc.font('Helvetica').text(skill.text);
	doc.x = MARGIN;
}

// Kept to one line: a self-taught candidate needs the heading present so form parsers find an
// education field, and needs the on-domain credentials extractable, but a list of courses reads
// as padding.
if (resume.education !== undefined) {
	heading('Education');
	const credentials = forPdf(resume.education.credentials ?? [])
		.map((one) => `${one.name} (${one.issuer}, ${String(one.year)})`)
		.join(', ');
	body(credentials === '' ? resume.education.summary : `${resume.education.summary} ${credentials}.`);
}

doc.end();
await new Promise<void>((done, fail) => { written.on('finish', () => { done(); }); written.on('error', fail); });
console.log(`Created frontend/public/Torrin_Leonard_Resume.pdf from frontend/data/resume.json`);
