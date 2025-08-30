import { Observer } from 'destam-dom';
import { Button, Typography, Paper, Icon, StageContext, Shown, mark, ThemeContext } from 'destamatic-ui';

const work = [
    {
        start: '2023-03-01',
        image: '/EquatorLogo.svg',
        url: 'https://equatorstudios.com/',
        header: 'Equator Studios',
        position: 'Full Stack Software Developer',
        description: 'As a Full Stack Software Developer at Equator Studios, I led the development of innovative mapping and AI-driven tools that streamline workflows for professionals worldwide. I built our flagship AI proposal creation tool from the ground up, designed and deployed internal and production servers, and created a custom UI framework that powers both our GIS mapping and AI applications. My work involved building functional and accessible interfaces, integrating AI technologies such as ChatGPT, Qdrant, image generation, and geospatial models, as well as implementing Stripe payment systems. I also gained hands-on experience with deployment pipelines, Docker, Linux/Ubuntu, GitLab CI/CD, and server/domain setup. In addition to deepening my expertise in JavaScript, React, Express.js, FastAPI, and MongoDB, I spearheaded the development of reusable UI libraries, guided other developers through onboarding, and established internal tools and processes to support efficient collaboration.'
    },
    {
        start: '2021-10-01',
        end: '2025-01-01',
        image: '/ThisCozyStudioLogo.svg',
        header: 'This Cozy Studio',
        position: 'Co-Founder, CEO, Lead Software Developer',
        description: 'As the Co-Founder, CEO, and Lead Software Engineer of This Cozy Studio Inc., I combined technical expertise with leadership to grow the company and deliver innovative Web3 and 3D solutions. I developed Blend_My_NFTs, a widely adopted Blender add-on for generating 3D NFT models, which has earned nearly 1,000 stars on GitHub and been customized for client needs. My work also included building and deploying multiple NFT collections—such as Cozy Place, Vox Coodles, Omni Coin, Metapanda, and AKidCalledBeast—as well as designing our company website and creating a cloud rendering, storage, and NFT minting platform for 3D artists. Beyond engineering, I managed a small creative team, oversaw finances and client relationships, and streamlined workflows with Python-based automation systems. My experience spans blockchain ecosystems like Ethereum, Cardano, and Polygon, as well as decentralized storage solutions such as Arweave, giving me a unique mix of technical, creative, and managerial skills.'
    },
    {
        start: '2021-03-01',
        end: '2022-05-01',
        image: '/LeagueLogo.jpg',
        url: 'https://www.league.com/',
        style: { 'borderRadius': '50%' },
        header: 'League',
        position: 'QA, Accessibility, and Automation Software Tester',
        description: 'As a Quality Assurance Engineer at League, I contributed to the development of President’s Choice’s PC Health app and League’s Health OS platform by ensuring functionality, usability, and accessibility across web and mobile. I built and maintained automated tests in TypeScript/JavaScript using TestCafe, conducted manual and accessibility testing in alignment with WCAG standards, and collaborated closely with developers to identify and resolve issues before release. I also leveraged tools like Jira, Slack, GitHub, and VS Code to streamline workflows and improve communication between teams. This role strengthened my skills in automated testing, accessibility compliance, and cross-team collaboration while ensuring a seamless experience for end users.'
    },
    {
        start: '2020-08-01',
        end: '2021-10-01',
        image: '/PivotCareersLogo.jpeg',
        style: { 'borderRadius': '50%' },
        header: 'Pivot Careers',
        position: 'Founder and CEO',
        description: 'As the Founder and CEO of Pivot Careers, I researched and developed an online onboarding platform designed to help companies create training courses for new hires. I conducted market research, spoke with professionals in the recruitment industry, and explored ways to improve the efficiency of employee onboarding through technology. While not heavily technical, this role highlighted my entrepreneurial drive, product design thinking, and ability to identify business opportunities.'
    },
    {
        start: '2017-04-01',
        end: '2021-02-01',
        image: '/TunnelBearLogo.svg',
        header: 'TunnelBear',
        url: 'https://www.tunnelbear.com/',
        position: 'Software QA Tester',
        description: 'As a Software QA Tester at TunnelBear, I tested and assured the quality of products such as the TunnelBear VPN, Remembear Password Manager, and MacOS VPN applications. I worked closely with the development team to identify, reproduce, and document issues, ensuring secure, reliable, and user-friendly releases. My nearly four years at TunnelBear gave me valuable experience in software testing, quality assurance, and collaborating with a dedicated team on widely used consumer applications.'
    },
    {
        start: '2013-06-01',
        end: '2025-06-01',
        image: '/worX4youLogo.jpg',
        url: 'https://www.worx4you.com/',
        style: { 'borderRadius': '50%' },
        header: 'worX4you Inc.',
        position: 'QA, Accessibility, and Automation Software Tester',
        description: 'As a Software Assurance Engineer contractor at worX4you, I worked on projects for clients including THRILLWORKS, League, TunnelBear, Hubba, and Hopscotch, where I focused on both manual and automated testing. Using tools such as JavaScript, TypeScript, TestCafe, Jira, Slack, GitHub, and VS Code, I developed and executed test plans to ensure product quality and reliability. A key part of my role was researching and applying WCAG accessibility standards, helping teams improve inclusivity and compliance across their applications. This experience allowed me to strengthen my expertise in software testing, accessibility, and cross-team collaboration across diverse projects and industries.'
    }
];

const projects = [
    {
        url: 'https://github.com/torrinworx/destam-web-core',
        header: 'destam web core',
        description: 'A library package that contains core abstractions and utilities of a full stack platform. destam-web-core simplifies and implements features like client/server websocket state synchronization, observer-based state syncing, MongoDB server state storage, backend websocket module routing system, user signup/login flow, and db management, user websocket authentication.',
    },
    {
        url: 'https://opengig.org',
        header: 'OpenGig.org',
        description: 'An Open Source platform passion project built for gig workers and customers. A full stack, state streaming, websocket-based reactive web application that uses JavaScript on the backend and frontend.',
    },
    {
        url: 'https://github.com/torrinworx/MangoSync',
        header: 'MangoSync',
        description: 'A music player that enhances your albums with metadata like lyrics, animated art, descriptions, and tags. MangoSync uses a locally modified Whisper audio-to-text AI model to auto transcribe lyrics, first searching online, then aligning and transcribing your songs for Apple Music-style synchronized lyrics.'
    },
    {
        url: 'https://github.com/torrinworx/destamatic-ui',
        header: 'destamatic ui',
        description: 'A custom UI component library built on destam and destam-dom reactivity libraries. Similar in style and functionality to MaterialUI components, but snappier thanks to the speed of destam-dom\'s lack of a virtual DOM.',
    },
    {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        header: 'torrin.me',
        description: 'Designed and developed a fully custom interactive portfolio using my own UI library (destamatic-ui), a DOM manipulation framework built from scratch (destam-dom), and Three.js. The site features a real-time theming system that synchronizes UI and 3D WebGL scenes, with smooth color transitions and support for dark/light modes plus four accent themes. I built touch and desktop input handling, optimized object collisions and animations using spatial partitioning and frustum culling, and integrated a blog engine powered by a custom Markdown renderer.',
    },
];

const tools = [
    { name: 'JavaScript', icon: 'javascript' },
    { name: 'Python', icon: 'python' },
    { name: 'TypeScript', icon: 'typescript' },
    { name: 'Go', icon: 'go' },
    { name: 'Rust', icon: 'rust' },

    { name: 'Node.js', icon: 'nodedotjs' },
    { name: 'React', icon: 'react' },
    { name: 'Express', icon: 'express' },
    { name: 'Django', icon: 'django' },
    { name: 'FastAPI', icon: 'fastapi' },
    { name: 'Three.js', icon: 'threedotjs' },
    { name: 'WordPress', icon: 'wordpress' },

    { name: 'OpenAI API', icon: 'openai' },
    { name: 'Hugging Face', icon: 'huggingface' },
    { name: 'Ollama', icon: 'ollama' },
    { name: 'PyTorch', icon: 'pytorch' },
    { name: 'LangChain', icon: 'langchain' },
    { name: 'Anaconda', icon: 'anaconda' },
    { name: 'Conda Forge', icon: 'condaforge' },

    { name: 'Git', icon: 'git' },
    { name: 'GitHub', icon: 'github' },
    { name: 'GitLab', icon: 'gitlab' },
    { name: 'Docker', icon: 'docker' },
    { name: 'NGINX', icon: 'nginx' },
    { name: 'npm', icon: 'npm' },
    { name: 'Vite', icon: 'vite' },
    { name: 'Webpack', icon: 'webpack' },

    { name: 'MongoDB', icon: 'mongodb' },
    { name: 'MariaDB', icon: 'mariadb' },
    { name: 'CockroachDB', icon: 'cockroachlabs' },
    { name: 'Redis', icon: 'redis' },

    { name: 'DigitalOcean', icon: 'digitalocean' },
    { name: 'Heroku', icon: 'heroku' },
    { name: 'GoDaddy', icon: 'godaddy' },
    { name: 'AWS', icon: 'amazonwebservices' },
    { name: 'Google App Script', icon: 'googleappsscript' },

    { name: 'Ubuntu', icon: 'ubuntu' },
    { name: 'Arch Linux', icon: 'archlinux' },
    { name: 'Linux Mint', icon: 'linuxmint' },
    { name: 'Shell/Terminal', icon: 'gnometerminal' },

    { name: 'Blender', icon: 'blender' },
];

const references = [
    {
        url: '',
        header: 'Bobby John',
        description: 'Torrin did amazing work doing xyz on project xyz and I can vouch for him.',
        image: 'https://randomuser.me/api/portraits/men/28.jpg',
        style: { 'borderRadius': '50%' },

    }
];

const skills = [
    "💻 JavaScript / TypeScript / Python",
    "⚛️ React, Express.js, FastAPI, Node.js",
    "🎨 Custom UI Libraries (destamatic-ui, destam-dom)",
    "🌐 Three.js / WebGL / Responsive Design",
    "♿ Accessibility (WCAG Compliance)",
    "🗄️ MongoDB, Redis, Docker, NGINX",
    "☁️ GitLab CI/CD, Linux Servers, DigitalOcean, AWS",
    "🤖 OpenAI API / ChatGPT, Qdrant, LangChain",
    "🎶 Whisper Speech-to-Text, Image & Segmentation Models",
    "🔗 Ethereum, Polygon, Cardano",
    "🖼️ NFT Smart Contracts & 3D NFT Pipelines (Blender API, Arweave)",
    "🧪 Automated Testing (TestCafe), Manual QA, Accessibility Testing",
    "👥 Leadership, Mentorship, Entrepreneurship"
];

const education = [
    {
        start: '2017-09-01',
        end: '2021-06-01',
        image: './wrdsbLogo.jpg',
        style: { 'borderRadius': '50%' },
        header: 'Laurel Heights Secondary School',
        headerType: 'h4',
        description: 'Graduated Laurel Heights Secondary School (previously known as Sir John A. Macdonald) in Waterloo, Ontario in June of 2021.'
    },
    {
        start: '2021-06-01',
        end: '2026-06-01',
        image: './uwLogo.png',
        style: { 'borderRadius': '50%' },
        header: 'University of Waterloo',
        headerType: 'h4',
        description: 'Attended the University of Waterloo for Honours Co-op, Astronomy and Physics.'
    },
];

const certificates = [
    {
        url: 'https://courses.edx.org/certificates/05d8dc2dc24e42238e616f83329ee2f0',
        date: '2021-02-09',
        image: './wcagLogo.png',
        style: { borderRadius: '16px', background: 'white' },
        header: 'WAI0.1x',
        headerType: 'h4',
        description: 'Completed a W3Cx Web Accessibility course provided by the World Wide Web Consortium on how to implement WCAG 2.2/3.0 web accessibility standards.'
    },
    {
        url: 'https://courses.edx.org/certificates/24e0a4eb8d2c4bee94503c85ba31a7d5',
        date: '2020-10-13',
        image: './anuLogo.png',
        style: { borderRadius: '16px', background: 'white' },
        header: 'ANU-ASTRO1x',
        headerType: 'h4',
        description: 'Completed ANU-ASTRO1x: Greatest Unsolved Mysteries of the Universe, a course provided by Australian National University'
    },
    {
        url: 'https://courses.edx.org/certificates/4671ce0c456844ff81684660be3095e2',
        date: '2021-02-09',
        image: './mitLogo.png',
        style: { borderRadius: '16px', background: 'white' },
        header: 'Intro to Aerospace Engineering',
        headerType: 'h4',
        description: 'Completed  16.00x: Introduction to Aerospace Engineering: Astronautics and Human Spaceflight, a course provided by Massachusetts Institute of Technology.'
    },
    {
        // url: 'https://courses.edx.org/certificates/4671ce0c456844ff81684660be3095e2',
        date: '2019-03-01',
        image: './st._john_ambulance_canadaLogo.png',
        style: { borderRadius: '16px', background: 'white' },
        header: 'Emergancy First Aid - CPR A - AED',
        headerType: 'h4',
        description: 'Completed first aid training at  St. John Ambulance Canada | Ambulance Saint-Jean. Credential ID EFA-A-16-SJKWA-140319-2979.'
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
    const month = date.toLocaleString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}${getOrdinal(day)}, ${year}`;
};

const formatDateRange = (start, end) => {
    const startStr = formatDate(start);
    const endStr = end ? formatDate(end) : 'Present';
    return `${startStr} to ${endStr}`;
};

const Card = ({ each }) => <div theme='fill'>
    <div theme='row'>
        <Shown value={each.image}>
            <img
                src={each.image}
                style={{
                    boxSizing: 'border-box',
                    padding: 20,
                    marginRight: 20,
                    width: 'clamp(3rem, 25vw, 10rem)',
                    ...each?.style
                }}
            />
        </Shown>
        <Shown value={each.url}>
            <mark:then>
                <Button
                    iconPosition='right'
                    icon={<Icon name='external-link' size={32} style={{ marginLeft: 5 }} />}
                    type='text'
                    label={<Typography type={each.headerType ? each.headerType : 'h2'} style={{ color: 'inherit' }} label={each.header} />}
                    onClick={() => window.open(each.url, '_blank')}
                    href={each.url}
                />
            </mark:then>
            <mark:else>
                <Typography type={each.headerType ? each.headerType : 'h2'} label={each.header} />
            </mark:else>
        </Shown>
    </div>
    <Shown value={each.position}>
        <Typography type='p2' label={each.position} />
    </Shown>
    <Shown value={each.start || each.end}>
        <Typography type='p2' label={formatDateRange(each.start, each.end)} />
    </Shown>
    <Shown value={each.date}>
        <Typography type='p2' label={formatDate(each.date)} />
    </Shown>
    <div theme='divider' />
    <Shown value={each.description}>
        <Typography type='p1' label={each.description} />
    </Shown>
</div>;

const Skills = ({ each }) => {
    return <div
        theme={['*', 'radius']}
        style={{
            padding: 10,
            color: '$color_text',
            maxWidth: 'inherit',
            maxHeight: 'inherit',
            border: 'solid $color_top 2px'
        }}>
        <Typography type='p1' label={each} />
    </div>
};

const Tools = ({ each }) => {
    return <div theme='column_center' style={{ gap: 10 }}>
        <Icon name={each.icon} style={{ fill: '$color_top', width: 'clamp(1rem, 10vw, 5rem)' }} />
        <Typography type='p1' label={each.name} />
    </div>;
};

const Resume = ({ type = 'icon' }) => {
    const downloadCheck = Observer.mutable(false);
    downloadCheck.watch(() => {
        if (downloadCheck.get()) {
            setTimeout(() => {
                downloadCheck.set(false);
            }, 5000);
        }
    });

    return <Button
        title='Download resume.'
        type={type}
        iconPosition='right'
        label={downloadCheck.map(c => c ? 'Downloaded!' : 'Resume')}
        icon={downloadCheck.map(c => c
            ? <Icon name='check' style={{ fill: 'none' }} size={25} />
            : <Icon name='download' style={{ fill: 'none', marginLeft: 5 }} size={25} />)}
        onClick={() => {
            const a = document.createElement('a');
            a.href = 'Torrin-Leonard-Software-Developer-Resume.pdf';
            a.download = 'Torrin-Leonard-Software-Developer-Resume.pdf';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();

            downloadCheck.set(true);
        }}
    />;
};

const Email = ({ type = 'icon' }) => {
    const emailCheck = Observer.mutable(false);
    emailCheck.watch(() => {
        if (emailCheck.get()) {
            setTimeout(() => {
                emailCheck.set(false);
            }, 5000);
        }
    });

    return <Button
        title='Copy email to clipboard.'
        type={type}
        iconPosition='right'
        label={emailCheck.map(c => c ? 'Copied to Clipboard!' : 'Email')}
        icon={emailCheck.map(c => c
            ? <Icon name='check' style={{ fill: 'none' }} size={25} />
            : <Icon name='copy' style={{ fill: 'none', marginLeft: 5 }} size={25} />)}
        onClick={async () => {
            emailCheck.set(true);
            await navigator.clipboard.writeText('torrin@torrin.me')
        }}
        loading={false}
    />;
};

const Landing = ThemeContext.use(h => StageContext.use(s => (_, cleanup, mounted) => {
    const blinkInterval = 400;
    const timeToFirstBlink = 250;
    const topOPage = Observer.mutable(true);
    const lastScrolledTop = Observer.mutable(Date.now());
    const isAtTop = () => (window.scrollY || window.pageYOffset) <= 0;

    const onScroll = () => {
        if (isAtTop()) {
            topOPage.set(true);
            lastScrolledTop.set(Date.now());
        } else {
            topOPage.set(false);
        }
    };

    mounted(() => {
        window.addEventListener('scroll', onScroll);
    });

    cleanup(() => {
        window.removeEventListener('scroll', onScroll);
    });

    return <>
        <div theme={['*', 'radius', 'fill']} style={{
            height: '75', minHeight: '75vh', textAlign: 'left',
            color: '$color_main',
            padding: 40,
            gap: 40,
            maxWidth: 1000
        }}>
            <Typography type='h1' label='Torrin Leonard' />
            <Typography type='p2'>Full Stack Software Developer, living in Waterloo, Ontario, Canada.</Typography>
            <Typography type='p2'>{new Date().getFullYear() - 2017} years professional experience. Open to US/Canada remote/hybrid.</Typography>
        </div>
        <Paper theme='column_fill'>
            <div theme='row'>
                <div
                    style={{
                        width: 'clamp(3rem, 25vw, 10rem)',
                        margin: 10,
                        aspectRatio: '1 / 1',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flex: '0 0 auto',
                        alignSelf: 'center'
                    }}
                >
                    <img
                        alt=""
                        src={window.themeMode ? '/profile.dark.png' : '/profile.light.png'}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                        }}
                    />
                </div>
                <Typography type='h1'>About Me</Typography>
            </div>
            <Typography type='p1' label={'Hi there, I\'m Torrin Leonard, my love for coding began in high school building  Python calculators and Django servers, eventually leading me to the creation of a Blender plugin with my brothers. Outside of coding, you\'ll catch me doing some digital photography, long bike rides, and indulging in a great cappuccino. Passionate about open source projects, my goal has always been to create clean, user/developer friendly software. Checkout the rest of my profile below to learn more about my work and journey!'} />

            <div theme='row' style={{ padding: '40px 0 0 0', gap: 20 }}>
                <Button type='outlined' label='View my Blog' onClick={() => s.open({ name: 'blog' })} href='/blog' />
                <Email type='outlined' />
                <Resume type='outlined' />

            </div>
        </Paper>
        <Paper theme='column_fill' style={{
            paddingBottom: '100px',
            background: 'none',
            backdropFilter: 'none',
        }}>
            <Typography type='h1'>At A Glance</Typography>
            <div theme='center' style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <Skills each={skills} />
            </div>
        </Paper>
        <Paper theme='column_fill' style={{ paddingBottom: '100px' }}>
            <Typography type='h1'>Work Experience</Typography>
            <div theme='center_column' style={{ gap: 20 }}>
                <Card each={[...work].sort((a, b) => +new Date(b.end ?? b.start) - +new Date(a.end ?? a.start))} />
            </div>
        </Paper>
        <Paper theme='column_fill' style={{
            background: 'none',
            backdropFilter: 'none',
        }}>
            <Typography label='Tools I Use' type='h1' />
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
                <Tools each={tools} />
            </div>
        </Paper>
        <Paper theme='column_fill'>
            <Typography type='h1'>Personal Projects</Typography>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
                <Card each={projects} />
            </div>
        </Paper>
        <Paper theme='column_fill' style={{
            paddingBottom: '100px',
            background: 'none',
            backdropFilter: 'none',
        }}>
            <Typography type='h1'>Education</Typography>
            <div theme='column' style={{ gap: 20 }}>
                <Card each={[...education].sort((a, b) => +new Date(b.end ?? b.start) - +new Date(a.end ?? a.start))} />
            </div>

        </Paper>
        <Paper theme='column_fill' >
            <Typography type='h1'>Certificates</Typography>
            <div theme='column' style={{ gap: 20 }}>
                <Card each={[...certificates].sort((a, b) => {
                    const ts = v => (v == null || /present/i.test(v)) ? Infinity : +new Date(v);
                    return ts(b.date) - ts(a.date);
                })} />
            </div>
        </Paper>
        {/* <Paper theme='column_fill' style={{
            background: 'none',
            backdropFilter: 'none',
        }}>
            <Typography label='References and Praise' type='h1' />
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
                <Card each={references} />
            </div>
        </Paper> */}
        <div theme='row_center' style={{ gap: 20 }}>
            <Button
                title='LinkedIn'
                type='icon'
                icon={<Icon name='linkedinFI' size={65} />}
                onClick={() => window.open('https://www.linkedin.com/in/torrin-leonard-8343a1154/', '_blank')}
                href='https://www.linkedin.com/in/torrin-leonard-8343a1154/'
            />
            <Button
                title='GitHub'
                type='icon'
                icon={<Icon name='githubFI' size={65} />}
                onClick={() => window.open('https://github.com/torrinworx', '_blank')}
                href='https://github.com/torrinworx'
            />
            <Button
                title='GitLab'
                type='icon'
                icon={<Icon name='gitlabFI' size={65} />}
                onClick={() => window.open('https://gitlab.com/torrin1', '_blank')}
                href='https://gitlab.com/torrin1'
            />
            <Button
                title='dev.to'
                type='icon'
                icon={<Icon name='devdotto' size={65} />}
                onClick={() => window.open('https://dev.to/torrin', '_blank')}
                href='https://dev.to/torrin'
            />
        </div>
        <div theme='row_center' style={{ gap: 20 }}>
            <Email />
            <Resume />
        </div>

        <Shown value={topOPage}>
            <div
                theme="row_center"
                style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: '20vh',
                    height: 64,
                    alignItems: 'center',
                }}
            >
                <Button
                    type="icon"
                    icon={
                        <Icon
                            name="arrow-down"
                            size={50}
                            style={{
                                opacity: Observer.timer(blinkInterval).map(() => {
                                    const delta = Date.now() - lastScrolledTop.get();
                                    if (delta < timeToFirstBlink) return 1;
                                    return Math.floor((delta - timeToFirstBlink) / blinkInterval) % 2 === 0 ? 1 : 0;
                                }),
                            }}
                        />
                    }
                    onClick={() => window.scrollBy({ top: 500, behavior: 'smooth' })}
                />
            </div>
        </Shown>
    </>
}));

export default Landing;
