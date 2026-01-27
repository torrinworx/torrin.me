import { Typography, Button, Icon, Observer, Shown, StageContext } from 'destamatic-ui';

import Email from '../utils/Email.jsx';
import useShine from '../utils/Shine.jsx'
import Contact from '../utils/Contact.jsx';

const Resume = ({ }, cleanup, mounted) => {
    const downloadCheck = Observer.mutable(false);
    downloadCheck.watch(() => {
        if (downloadCheck.get()) {
            setTimeout(() => {
                downloadCheck.set(false);
            }, 5000);
        }
    });

    const [shines, createShine] = useShine();
    cleanup(Observer.timer(2000).watch(t => t.value % 2 === 0 && createShine()));
    mounted(() => createShine());

    return <Button
        title={`Download Torrin Leonard's resume PDF.`}
        type='contained'
        iconPosition='right'
        label={downloadCheck.map(c => c ? 'Downloaded!' : 'Resume')}
        icon={downloadCheck.map(c => c
            ? <Icon name='feather:check' />
            : <Icon name='feather:download' />)}
        onClick={() => {
            const a = document.createElement('a');
            a.href = 'Torrin_Leonard_Resume.pdf';
            a.download = 'Torrin_Leonard_Resume.pdf';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();

            downloadCheck.set(true);
        }}
    >
        {shines}
    </Button>;
};

const work = [
    {
        start: '2023-03-01',
        image: '/EquatorLogoDark.svg',
        url: 'https://equatorstudios.com/',
        imgName: 'Equator',
        header: 'Full Stack Software Developer',
        bullets: [
            'Built and shipped an AI-driven proposal tool (backend + frontend).',
            'Created accessible UI component library used across GIS and AI products.',
        ],
    },
    {
        start: '2021-10-01',
        end: '2025-01-01',
        image: '/ThisCozyStudioLogo.svg',
        imgName: 'This Cozy Studio',
        header: 'Co-Founder, CEO, Lead Software Developer',
        bullets: [
            'Created Blend_My_NFTs, a Blender add-on with ~1k GitHub stars.',
            'Designed and maintained tools for 3D project pipelines.',
        ],
    },
    {
        start: '2021-03-01',
        end: '2022-05-01',
        image: '/LeagueLogo.jpg',
        url: 'https://www.league.com/',
        style: { borderRadius: '50%' },
        imgName: 'League',
        header: 'Automation and Accessibility QA',
        bullets: [
            'Wrote TestCafe automation for regression testing.',
            'Performed accessibility audits against WCAG guidelines.',
        ],
    },
    {
        start: '2013-06-01',
        end: '2025-06-01',
        image: '/worX4youLogo.jpg',
        url: 'https://worx4you.com/',
        style: { borderRadius: '50%' },
        imgName: 'worX4you',
        header: 'Automation and Accessibility QA',
        bullets: [
            'Provided QA and automation for multiple startup clients.',
            'Focused on cross-browser testing and accessibility issues.',
        ],
    },
];

const projects = [
    {
        header: 'destamatic-ui',
        headerUrl: {
            func: (s) => s.open({ name: 'destamatic-ui' }),
            href: '/destamatic-ui'
        },
        description: 'A batteries-included frontend framework built on fine-grained Observers.',
        bullets: [
            'No React, no VDOM. Components, routing, SSG/SEO, theming, icons, and rich text in one stack.',
            'Used for Equator Studios Mapping/AI platform, torrin.me, and my project OpenGig.org.',
            'Replaces heavier React + MUI stacks with a smaller, fast, and predictable component system.',
        ],
    },
    {
        header: 'OpenGig.org',
        headerUrl: 'https://opengig.org',
        description: 'Open-source platform for gig workers and customers.',
        bullets: [
            'Built a full-stack app in JavaScript with a custom UI framework, database state-sync, and websocket layer.',
            'Deployed to a DigitalOcean droplet behind NGINX, with GitHub Actions for CI.',
        ],
    },
    {
        header: 'MangoSync',
        headerUrl: 'https://github.com/torrinworx/MangoSync',
        description: 'Local music player with AI-assisted lyrics and metadata.',
        bullets: [
            'Uses Whisper to auto-generate and align lyrics for time-synced playback.',
            'Displays time-synced lyrics in an Apple-style karaoke mode lyric scroller.',
            'Enhances albums with additional metadata like artwork and descriptions.',
        ],
    },
    {
        header: 'Blend_My_NFTs',
        headerUrl: 'https://github.com/torrinworx/Blend_My_NFTs',
        description: 'Blender add-on for generating 3D NFT collections.',
        bullets: [
            'Reached ~1k GitHub stars, 200K+ views on YouTube, used by multiple studios and NFT projects.',
            'Automates 3D asset generation and export pipelines from Blender.',
        ],
    },
];

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

const skills = [
    {
        bold: 'Programming Languages:',
        text: ' JavaScript, TypeScript, Python'
    },
    {
        bold: 'Frontend & UI:',
        text: ' React, destamatic-ui, Three.js/WebGL, responsive and accessible (WCAG)'
    },
    {
        bold: 'Backend & APIs:',
        text: ' Node.js, Express, FastAPI, REST, WebSockets'
    },
    {
        bold: 'Databases:',
        text: ' MongoDB, MariaDB, Redis'
    },
    {
        bold: 'Cloud & DevOps:',
        text: ' Linux (Ubuntu/Arch), Docker, NGINX, DigitalOcean, AWS, GitHub Actions, GitLab CI/CD'
    },
    {
        bold: 'Testing & Quality:',
        text: ' TestCafe, automated regression testing, accessibility audits'
    },
    {
        bold: 'AI & ML:',
        text: ' OpenAI API, Whisper, Hugging Face, Qdrant, LangChain, vector search'
    },
    {
        bold: 'Certifications:',
        text: ' Harvard CS50 (Intro to Computer Science), W3C Web Accessibility (WAI0.1x)'
    }
];

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
        <div theme="column_center_fill_start" >
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
                        label="Torrin Leonard"
                    />
                    <Typography
                        theme="row_fill_start"
                        type="p1"
                        label={`Full-stack software engineer, ${new Date().getFullYear() - 2017
                            } years professional experience.`}
                    />
                    <Typography
                        theme="row_fill_start"
                        type="p1_bold"
                        label="Open to roles and contracts."
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
                label="I build AI-powered web apps, custom UI frameworks, and the infrastructure they run on."
            />
            <Typography
                theme="row_fill_start"
                type="p1_bold"
                label="Based in Waterloo, Ontario 🇨🇦"
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
                <Button
                    title={`Torrin's freelance services for hire.`}
                    label="Freelance"
                    type="outlined"
                    icon={<Icon name="feather:briefcase" />}
                    onClick={() => s.open({ name: 'freelance' })}
                    href="/freelance"
                    iconPosition="right"
                />
                <Email />
                <Button
                    title={`Torrin Leonard's Github.`}
                    label="Github"
                    type="outlined"
                    icon={<Icon name="feather:github" />}
                    onClick={() => window.open('https://github.com/torrinworx', '_blank')}
                    href="https://github.com/torrinworx"
                    iconPosition="right"
                />
            </div>
        </div>

        <div theme='column_center_fill' style={{ gap: 10 }}>
            <Typography theme='row_fill_start' type='h2' label='Positions' />
            <div theme='column_fill' style={{ gap: 20 }}>
                <Card each={work} />
            </div>
        </div>

        <div theme='column_center_fill' style={{ gap: 10 }}>
            <Typography theme='row_fill_start' type='h2' label='Projects' />
            <div theme='column_fill' style={{ gap: 20 }}>
                <Card each={projects} />
            </div>
        </div>

        <div theme='column_center_fill' style={{ gap: 10 }}>
            <Typography theme='row_fill_start' type='h2' label='Skills' />
            <ul style={{ paddingLeft: 25 }}>
                <Skill each={skills} />
            </ul>
        </div>

        <Contact ref={contactRef} focused={contactFocused} />
    </>;
});

export default Landing;
