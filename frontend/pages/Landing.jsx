import { Typography, Button, Icon, Observer, Shown, StageContext } from '@destamatic/ui';

import Email from '../utils/Email.jsx';
import useShine from '../utils/Shine.jsx'
import Contact from '../utils/Contact.jsx';
import Resume from '../utils/Resume.jsx';

const work = [
    {
        start: '2023-03-01',
        image: '/EquatorLogoDark.svg',
        url: 'https://equatorstudios.com/',
        imgName: 'Equator',
        header: 'Full Stack Software Developer',
        description: 'Tech: Node.js/Express, React + destamatic-ui, TypeScript, MongoDB, Python/FastAPI, OpenAI (embeddings + fine-tuning), Qdrant, ChromaDB, GeoPandas, Docker, GitLab CI/CD, GitHub Actions, DigitalOcean, AWS, Proxmox, Linux',
        bullets: [
            'Owned 0->1 AI proposal product end-to-end and shipped to production as sole engineer.',
            'Built vector ingestion + retrieval pipeline with OpenAI embeddings, Qdrant, and ChromaDB; integrated into our main application.',
            'Implemented client fine-tuning pipeline with OpenAI fine-tuning API and productionized services.',
            'Designed and built safeguards for model failures, fine-tuning evals, hallucinations, prompt injection, and continuous context retrieval/management.',
            'Integrated server-hosted GIS segmentation models for satellite imagery selection in the main app.',
            'Added Stripe payment systems and supported site-based pricing rollout with product.',
            'Onboarded and mentored 2 developers; participated in interviews and code reviews.',
        ],
    },
    {
        start: '2021-10-01',
        end: '2023-03-01',
        image: '/ThisCozyStudioLogo.svg',
        imgName: 'This Cozy Studio',
        header: 'Co-Founder, CEO, Lead Software Developer',
        description: 'Tech: React, Node.js, Django, Python, Blender API, HTML/CSS/JavaScript, AWS',
        bullets: [
            'Led client-facing delivery for 3D/NFT pipeline projects; scoped contracts, managed timelines, and shipped quickly.',
            'Built and maintained Blend_My_NFTs (Python/Blender API), reaching ~1k GitHub stars.',
            'Developed web tooling for asset pipelines and automated rendering/export workflows.',
        ],
    },
    {
        start: '2021-03-01',
        end: '2022-05-01',
        image: '/LeagueLogo.jpg',
        url: 'https://www.league.com/',
        style: { borderRadius: '50%' },
        imgName: 'League',
        header: 'Automation & Accessibility Engineer (Contract / Part-time)',
        description: 'Tech: JavaScript/TypeScript, TestCafe, Node/npm, Git, Jira, WCAG',
        bullets: [
            'Built TestCafe regression suites in TypeScript/JavaScript, reducing manual cycles and improving release confidence.',
            'Performed WCAG accessibility audits and partnered with engineers/PMs to ship compliant releases.',
            'Maintained automation and triaged defects within CI workflows.',
        ],
    },
    {
        start: '2013-06-01',
        end: '2021-03-01',
        image: '/worX4youLogo.jpg',
        url: 'https://worx4you.com/',
        style: { borderRadius: '50%' },
        imgName: 'worX4you',
        header: 'Automation & Accessibility Engineer (Contract / Part-time)',
        description: 'Tech: JavaScript/TypeScript, TestCafe, Node/npm, Git, Jira, WCAG',
        bullets: [
            'Delivered automation and accessibility testing for startup clients; strengthened regression coverage.',
            'Created reusable test tooling and cross-browser checklists to support WCAG-aligned releases.',
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
        description: 'Lightweight UI layer built on top of existing company DOM/state tooling to package in-house primitives into a polished, reusable interface.',
        bullets: [
            'Used for Equator mapping/AI platform, torrin.me, and OpenGig.org.',
            'Built a sleek UI library on top of established internal tooling, improving developer ergonomics without disrupting existing React-based conventions.',
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
        header: 'Blend_My_NFTs',
        headerUrl: 'https://github.com/torrinworx/Blend_My_NFTs',
        description: 'Blender add-on for generating 3D NFT collections.',
        bullets: [
            'Reached ~1k GitHub stars, 200K+ views on YouTube, used by multiple studios and NFT projects.',
            'Automates 3D asset generation and export pipelines from Blender.',
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
        bold: 'Languages:',
        text: ' JavaScript, TypeScript, Python'
    },
    {
        bold: 'Frontend:',
        text: ' React, destamatic-ui, HTML/CSS'
    },
    {
        bold: 'Backend:',
        text: ' Node.js, Express, FastAPI, Django'
    },
    {
        bold: 'Databases:',
        text: ' MongoDB, Qdrant, ChromaDB'
    },
    {
        bold: 'Cloud & DevOps:',
        text: ' Docker, GitLab CI/CD, GitHub Actions, DigitalOcean, AWS, Proxmox, Linux (Ubuntu/Arch)'
    },
    {
        bold: 'AI & Data:',
        text: ' OpenAI API (embeddings + fine-tuning), GeoPandas, pandas'
    },
    {
        bold: 'Accessibility:',
        text: ' WCAG audits, W3C Web Accessibility (WAI0.1x)'
    },
    {
        bold: 'Testing:',
        text: ' TestCafe, automation testing'
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
                        label="Torrin Leonard"
                    />
                    <Typography
                        theme="row_fill_start"
                        type="p1"
                        label='Full-stack software engineer.'
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
                label="I build AI-powered web apps, vector search pipelines, and accessible UI systems (WCAG)."
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

        <Contact ref={contactRef} focused={contactFocused} />
    </>;
});

export default Landing;
