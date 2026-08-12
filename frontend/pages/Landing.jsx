import { Typography, Button, Icon, Observer, Shown, StageContext } from '@destamatic/ui';

import Email from '../utils/Email.jsx';
import useShine from '../utils/Shine.jsx'
import Contact from '../utils/Contact.jsx';
import Resume from '../utils/Resume.jsx';
import resume from '../data/resume.json';

// Content lives in frontend/data/resume.json and nowhere else. resume_pdf_generator.py
// reads the same file at build time, so the page and the downloadable PDF cannot drift.
// The adapters below only reshape that data into what <Card> already expects; add
// resume content by editing the JSON, not here.
const { profile } = resume;

const work = resume.work.map(job => ({
    start: job.start,
    end: job.end,
    image: job.logo,
    url: job.companyUrl,
    imgName: job.company,
    style: job.logoStyle,
    header: job.role,
    // Entries may omit tech (worX4you's stack is identical to League's, so repeating it
    // just costs a line). Undefined hides the row via <Shown>.
    description: job.tech ? `Tech: ${job.tech}` : undefined,
    bullets: job.bullets,
}));

const projects = resume.projects.map(project => ({
    header: project.name,
    headerUrl: project.url,
    description: project.description,
    bullets: project.bullets,
}));

const getOrdinal = (n) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    switch (n % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}${getOrdinal(day)}, ${year}`;
};

const formatDateRange = (start, end) => {
    const startStr = formatDate(start);
    const endStr = end ? formatDate(end) : 'Present';
    return `${startStr} --> ${endStr}`;
};

const Card = StageContext.use(s => ({ each }) => <div theme='column_fill'>
    <Shown value={each.headerUrl}>
        <mark:then>
            <div theme='row'>
                <Button
                    iconPosition='right'
                    icon={<Icon style={{ marginLeft: 3 }} name='feather:external-link' />}
                    type='link'
                    label={<Typography type='p1_bold' label={each.header} />}
                    onClick={() => each.headerUrl.func ? each.headerUrl.func(s) : window.open(each.headerUrl, '_blank')}
                    href={each.headerUrl?.href ? each.headerUrl.href : each.headerUrl}
                />
            </div>
        </mark:then>

        <mark:else>
            <Typography type='p1_bold' label={each.header} />
        </mark:else>
    </Shown>
    <div theme='divider' />
    <div theme='row_wrap'>
        <div theme='row'>
            <Shown value={each.image}>
                <img
                    src={each.image}
                    alt={`Logo of ${each.imgName}`}
                    style={{
                        boxSizing: 'border-box',
                        width: 'clamp(1rem, 15vw, 2rem)',
                        margin: 2,
                        ...each?.style,
                    }}
                />
            </Shown>
            <Shown value={each.url}>
                <mark:then>
                    <Button
                        iconPosition='right'
                        icon={<Icon style={{ marginLeft: 3 }} name='feather:external-link' />}
                        type='link'
                        style={{ padding: 2, margin: 2 }}
                        label={<Typography type='p1' label={each.imgName} />}
                        onClick={() => window.open(each.url, '_blank')}
                        href={each.url}
                    />
                </mark:then>
                <mark:else>
                    <Typography
                        style={{ textAlign: 'right', paddingLeft: 10 }}
                        type='p1'
                        label={each.imgName}
                    />
                </mark:else>
            </Shown>
        </div>
    </div>

    <Shown value={each.start || each.end} >
        <Typography type='p1_italic' label={formatDateRange(each.start, each.end)} />
    </Shown>

    <Shown value={each.description} >
        <Typography type='body_bold' label={each.description} />
    </Shown>
    <Shown value={each.bullets}>
        <ul style={{ paddingLeft: 25 }}>
            {each.bullets.map((b, i) => (
                <li key={i}>
                    <Typography type='body' label={b} />
                </li>
            ))}
        </ul>
    </Shown>
</div>);

const skills = resume.skills.map(skill => ({
    bold: `${skill.label}:`,
    text: ` ${skill.text}`,
}));

// The site lists every credential; the PDF filters to the on-domain ones via "pdf": false.
const education = resume.education;

const Credential = ({ each }) => <li key={each.url}>
    <Button
        type='link'
        iconPosition='right'
        icon={<Icon style={{ marginLeft: 3 }} name='feather:external-link' />}
        label={<Typography type='body' label={`${each.name} (${each.issuer}, ${each.year})`} />}
        onClick={() => window.open(each.url, '_blank')}
        href={each.url}
    />
</li>;

const Skill = ({ each }) => {

    return <li key={each.text}>
        <Typography type='body_bold' label={each.bold} />
        <Typography type='body' label={each.text} />
    </li>;
};

const Landing = StageContext.use(s => ({ }, cleanup, mounted) => {
    const contactRef = Observer.mutable(null);
    const contactFocused = Observer.mutable(false);

    const [shines, createShine] = useShine();
    cleanup(Observer.timer(2000).watch(t => t.value % 2 === 0 && createShine()));
    mounted(() => createShine());

    return <>
        <div theme="content_col_start" >
            <div
                theme='row_fill_start'
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10
                }}
            >
                <div
                    style={{
                        flex: '1 1 0',
                        minWidth: 0,
                    }}
                >
                    <Typography
                        theme="row_fill_start"
                        type="h1"
                        label={profile.name}
                    />
                    <Typography
                        theme="row_fill_start"
                        type="p1"
                        label={profile.tagline}
                    />
                    <Typography
                        theme="row_fill_start"
                        type="p1_bold"
                        label={profile.availability}
                    />
                </div>

                <div
                    style={{
                        flex: '0 0 auto',
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                >
                    <img
                        src="/headshot.webp"
                        theme="primary_focused"
                        alt='Profile image of Torrin Leonard.'
                        style={{
                            borderRadius: 20,
                            width: '20vw',
                            maxWidth: 180,
                            minWidth: 140,
                            height: 'auto',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />
                </div>
            </div>

            <div theme="divider" style={{ marginTop: 16 }} />

            <Typography
                theme="row_fill_start"
                type="p1"
                label={profile.intro}
            />
            <Typography
                theme="row_fill_start"
                type="p1_bold"
                label={profile.locationDisplay}
            />
            <Typography
                theme="row_fill_start"
                type="p1"
                label={profile.remote}
            />

            <div
                theme="row_wrap_fill_start"
                style={{
                    marginTop: 10,
                    gap: 10,
                }}
            >
                <Resume />
                <Button
                    id='get-in-touch'
                    title="Get in touch with Torrin Leonard."
                    label="Contact"
                    type="contained"
                    icon={<Icon name="feather:mail" />}
                    iconPosition="right"
                    onClick={() => {
                        if (contactRef.get()) {
                            contactFocused.set(true);
                            contactRef.get().scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }}
                >
                    {shines}
                </Button>
                <Email />
                <Button
                    title={`Torrin Leonard's Github.`}
                    label="Github"
                    type="outlined"
                    icon={<Icon name="feather:github" />}
                    onClick={() => window.open(profile.github, '_blank')}
                    href={profile.github}
                    iconPosition="right"
                />
            </div>
        </div>

        <div theme='content_col'>
            <Typography theme='row_fill_start' type='h2' label='Experience' />
            <div theme='column_fill' style={{ gap: 20 }}>
                <Card each={work} />
            </div>
        </div>

        <div theme='content_col'>
            <Typography theme='row_fill_start' type='h2' label='Projects' />
            <div theme='column_fill' style={{ gap: 20 }}>
                <Card each={projects} />
            </div>
        </div>

        <div theme='content_col'>
            <Typography theme='row_fill_start' type='h2' label='Skills' />
            <ul style={{ paddingLeft: 25 }}>
                <Skill each={skills} />
            </ul>
        </div>

        <div theme='content_col'>
            <Typography theme='row_fill_start' type='h2' label='Education' />
            <Typography theme='row_fill_start' type='p1' label={education.summary} />
            <ul style={{ paddingLeft: 25 }}>
                <Credential each={education.credentials} />
            </ul>
        </div>

        <Contact ref={contactRef} focused={contactFocused} />
    </>;
});

export default Landing;
