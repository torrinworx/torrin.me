import { Observer } from 'destam-dom';
import { Button, Typography, Paper, Icon, Detached, StageContext } from 'destamatic-ui';

const work = [
    {
        'start': '2023-03-01',
        'image': '/EquatorLogo.svg',
        'url': 'https://equatorstudios.com/',
        'header': 'Equator Studios',
        'position': 'Software Developer',
        'content': 'As a Software Developer at Equator Studios, I\'ve spent the past few months focusing on enhancing our mapping and design software. Our platform is used by professionals all over the world, and my goal is to make it as easy and intuitive as possible for them to create and share their maps. With Equator Studios, I\'ve had the chance to use and deepen my knowledge in a range of technologies including React, JavaScript, Express.js, MongoDB, WSL, Linux/Ubuntu, Docker, GitLab, and CI. Some of the exciting projects I\'ve worked on include the implementation of our new Site Selector and the development of our Segmentation AI product. I\'m eager to continue expanding my skillset and contributing to the ongoing evolution of Equator Studios.'
    },
    {
        'start': '2021-10-01',
        'image': '/ThisCozyStudioLogo.svg',
        // 'url': 'https://www.thiscozystudio.com/',
        'header': 'This Cozy Studio',
        'position': 'Co-Founder, CEO, Lead Software Engineer and Web Developer',
        'content': 'As the Co-Founder, CEO, and Lead Software Engineer of This Cozy Studio Inc, I\'ve driven the company\'s growth through my diverse technical abilities, leadership, and management skills. My contributions include the development of \'Blend_My_NFTs\', a popular 3D model NFT generator operating as a Blender add-on, and the creation of multiple NFT collections for our clients, among them Cozy Place, Vox Coodles, Omni Coin, Metapanda, and AKidCalledBeast. Additionally, I designed and developed our company\'s website, ThisCozyStudio.com, and implemented a cloud rendering, storage, and NFT minting platform, making it easier for 3D graphical artists to launch their own 3D NFT collections.'
    },
    {
        'start': '2021-03-01',
        'end': '2022-05-01',
        'image': '/LeagueLogo.jpg',
        'url': 'https://www.league.com/',
        'style': { 'borderRadius': '50%' },
        'header': 'League',
        'position': 'QA, Accessibility, and Automation Software Tester',
        'content': 'As a Quality Assurance Engineer at League, I had the privilege of working on the development of President Choice\'s \'PC Health\' app and League\'s Health OS website. I utilized my TypeScript/JavaScript skills to develop automated tests using TestCafe. I also conducted manual testing and accessibility testing to ensure that the app and website met the WCAG accessibility standards. I worked closely with the development team and my colleagues at worX4you Inc. to provide feedback and suggestions for improvements. This was an enriching experience where I could apply my skills in automated testing, accessibility testing, and teamwork.'
    },
    {
        'start': '2013-06-01',
        'image': '/worX4youLogo.jpg',
        'url': 'https://www.worx4you.com/',
        'style': { 'borderRadius': '50%' },
        'header': 'worX4you Inc.',
        'position': 'QA, Accessibility, and Automation Software Tester',
        'content': 'As a Software Assurance Engineer contractor at worx4You, I had the opportunity to work on multiple projects for companies such as THRILLWORKS, League, TunnelBear, Hubba, and Hopscotch. In this role, I was responsible for manual and automation testing using tools such as Jira, Slack, Visual Studio Code, JavaScript, TypeScript, and TestCafe. Additionally, I conducted research on and implemented WCAG accessibility standards to ensure that the companies I worked with were following accessibility standards. Through my work at worx4You, I gained valuable experience in software testing and accessibility, and I am excited to continue to develop my skills in these areas.'
    }
];

const Work = ({ each }) => {
    const index = work.indexOf(each);

    const Header = () => <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: index % 2 === 0 ? 'flex-end' : 'flex-start',
        flex: 1,
        paddingRight: '20px',
        maxWidth: '800px',
        height: 'inherit',
    }}>
        <Typography type='h2' label={each.header} />
    </div>;

    const Position = () => <div style={{ flex: 1, paddingLeft: '20px', maxWidth: '800px' }}>
        <div theme='column'>
            <Typography type='h4' label={each.position} />
            <Typography type='p1' label={each.content} />
        </div>
    </div>;

    return <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between' }}>
        {index % 2 === 0 ? <Header /> : <Position />}

        <div theme='column_center' style={{ flex: 'none', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div theme='primary' style={{ height: '100%', borderLeft: '3px solid $color_top', borderRight: '3px solid $color_top' }} />
            <img src={each.image} style={{ boxSizing: 'border-box', padding: '20px', height: '125px', width: 'auto', ...each?.style }} />
            <div theme='primary' style={{ height: '100%', borderLeft: '3px solid $color_top', borderRight: '3px solid $color_top' }} />
        </div>

        {index % 2 === 0 ? <Position /> : <Header />}
    </div>;
};

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

const Tools = ({ each }) => {
    return <div theme='column_center'>
        <Icon name={each.icon} size={75} style={{ fill: '$color_top' }} />
        <Typography type='h4' label={each.name} />
    </div>;
};

const projects = [
    {
        url: 'https://github.com/torrinworx/destam-web-core',
        name: 'destam web core',
        description: 'A library package that contains core abstractions and utilities of a full stack platform. destam-web-core simplifies and implements features like client/server websocket state synchronization, observer-based state syncing, MongoDB server state storage, backend websocket module routing system, user signup/login flow, and db management, user websocket authentication.',
    },
    {
        url: 'https://opengig.org',
        name: 'OpenGig.org',
        description: 'An Open Source platform passion project built for gig workers and customers. A full stack, state streaming, websocket-based reactive web application that uses JavaScript on the backend and frontend.',
    },
    {
        url: 'https://github.com/torrinworx/MangoSync',
        name: 'MangoSync',
        description: 'A music player that enhances your albums with metadata like lyrics, animated art, descriptions, and tags. MangoSync uses a locally modified Whisper audio-to-text AI model to auto transcribe lyrics, first searching online, then aligning and transcribing your songs for Apple Music-style synchronized lyrics.'
    },
    {
        url: 'https://github.com/torrinworx/destamatic-ui',
        name: 'destamatic ui',
        description: 'A custom UI component library built on destam and destam-dom reactivity libraries. Similar in style and functionality to MaterialUI components, but snappier thanks to the speed of destam-dom\'s lack of a virtual DOM.',
    },
    {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        name: 'torrin.me',
        description: 'My personal website! Built using destamatic-ui, destam-dom, and destam state management. Where does this link go? 🤔',
    },
];

const Projects = ({ each }) => {
    return <div style={{ maxWidth: 500, padding: '20px', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
        <Typography type='h2' label={each.name} />
        <Typography type='p1' label={each.description} style={{ marginBottom: '10px' }} />
        <Button type='outlined' label='View' onClick={() => window.open(each.url, '_blank')} />
    </div>;
};

const Kebab = ({ icon, children, ...props }) => {
    const focused = Observer.mutable(false);

    return <Detached enabled={focused}>
        <Button
            type='icon'
            onClick={() => focused.set(!focused.get())}
            title={props.title}
            icon={icon}
        />
        <mark:popup>
            <Paper {...props}>
                {children}
            </Paper>
        </mark:popup>
    </Detached>
};

const Landing = StageContext.use(s => () => <>
    <div theme='clear' style={{ height: '75', minHeight: '75vh' }}>
        <Typography type='h1'>Torrin Leonard</Typography>
        <Typography type='p1'>Full Stack Software Developer, located in <i>Waterloo, Ontario, Canada</i></Typography>
    </div>
    <Paper theme='row'>
        <div theme='column' style={{ width: '100%' }}>
            <Typography type='h1'>Me</Typography>
            <Typography style={{ maxWidth: 600 }} type='p1' label={'I am a full stack software developer very passionate about open source, creating clean reliable code that others can use and build on. I like working along side others because it motivates me to create tools that those around me can use and create with. Programming is one of those rare jobs that let\'s you build for yourself and those around you, while giving you the potential to improve the work and lives of others. I am passionate about create ethical and moral tools that can help those around me and those who will be here long after I\'m gone.'} />
            <Typography style={{ marginTop: 20, maxWidth: 600 }} type='p1' label={'Outside of tech I\'m a digital photographer who loves long walks and bike rides and a good capachino, big supporter of public transit and love walkable pedestrian focused cities. I also love home labbing and have built and run my own rack mount server which houses a NAS and a mineraft server.'} />

            <div theme='row' style={{ padding: '40px 0 0 0' }}>
                <Button type='outlined' label='View my Blog' onClick={() => s.open({ name: 'blog' })} />
            </div>
        </div>
        <img theme='radius' src={window.themeMode.map(m => m ? '/profile.dark.png' : '/profile.light.png')} style={{ height: '30vh' }} />
    </Paper>
    <Paper theme='column' style={{ paddingBottom: '100px' }}>
        <Typography type='h1'>Work</Typography>
        <Typography type='p1' label='A bit about my work experience.' />

        <div theme='center_column'>
            <Work each={work} />
        </div>
    </Paper>
    <Paper theme='column'>
        <Typography label='Tools' type='h1' />
        <Typography type='p1' label='These are the tools that I have experience with or have used in my work or on personal projects.' />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
            <Tools each={tools} />
        </div>
    </Paper>
    <Paper theme='column'>
        <Typography type='h1'>Projects</Typography>
        <Typography type='p1' label='Some personal projects I am proud of and want to show off.' />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
            <Projects each={projects} />
        </div>
    </Paper>

    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <Button
            title='LinkedIn'
            type='icon'
            icon={<Icon name='linkedinFI' size={65} />}
            onClick={() => window.open('https://www.linkedin.com/in/torrin-leonard-8343a1154/', '_blank')}
        />
        <Button
            title='GitHub'
            type='icon'
            icon={<Icon name='githubFI' size={65} />}
            onClick={() => window.open('https://github.com/torrinworx', '_blank')}
        />
        <Button
            title='GitLab'
            type='icon'
            icon={<Icon name='gitlabFI' size={65} />}
            onClick={() => window.open('https://gitlab.com/torrin1', '_blank')}
        />
        <Button
            title='dev.to'
            type='icon'
            icon={<Icon name='devdotto' size={65} />}
            onClick={() => window.open('https://dev.to/torrin', '_blank')}
        />
        <Kebab icon={<Icon name='at-sign' style={{ fill: 'none' }} size={65} />} style={{ padding: 10, gap: 10 }} title='Email'>
            <Button title='Copy email address to clipboard.' type='outlined' label='Copy' onClick={() => navigator.clipboard.writeText('torrin@torrin.me')} />
            <Button title='Open email address in default mailer.' type='outlined' label='Open' onClick={() => window.open('mailto:torrin@torrin.me', '_blank')} />
        </Kebab>
    </div>

    <div theme='center_clear' >
        <Typography type='p2'> © Torrin Leonard {new Date().getFullYear()}</Typography>
    </div>
</>);

export default Landing;
