import { mount } from 'destam-dom';
import { Button, Theme, Typography, Radio, Toggle, Paper, Gradient, Icons, Icon } from 'destamatic-ui';

import theme from './theme';
import Collision from './components/Collision';

Theme.define({
	clear: {
		padding: 20,
		gap: 40,
		display: 'flex',
		flexDirection: 'column',
	}
});

const NotFound = () => <Theme value={theme.theme}>
	<Gradient>
		<Controls />
		<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
			<Typography type='h4' style={{ marginBottom: '20px' }}>404 Page Not Found</Typography>
			<Typography type='p1' style={{ marginBottom: '20px' }}>The page you are trying to access is either unavailable or restricted.</Typography>
			<Button
				type='contained'
				label='Return to Site'
				onMouseDown={() => {
					if (window.location.pathname !== '/') {
						window.location.href = '/';
					}
				}}
			/>
		</div>
	</Gradient>
</Theme>;

const Controls = () => {
	const SelectRadio = Radio(window.colorMode);

	return <div theme='center' style={{ paddingTop: 20, userSelect: 'none' }}>
		<Paper style={{ width: 250, padding: 10 }}>
			<div theme='center_row' style={{ gap: 8 }}>
				<SelectRadio style={{ color: '$color_red' }} value={'red'} />
				<SelectRadio style={{ color: '$color_purple' }} value={'purple'} />
				<SelectRadio style={{ color: '$color_cyan' }} value={'cyan'} />
				<SelectRadio style={{ color: '$color_gold' }} value={'gold'} />
				<Toggle value={window.themeMode} />
			</div>
		</Paper>
	</div>;
};

const work = [
	{
		'start': '2023-03-01',
		'image': './EquatorLogo.svg',
		'url': 'https://equatorstudios.com/',
		'header': 'Equator Studios',
		'position': 'Software Developer',
		'content': 'As a Software Developer at Equator Studios, I\'ve spent the past few months focusing on enhancing our mapping and design software. Our platform is used by professionals all over the world, and my goal is to make it as easy and intuitive as possible for them to create and share their maps. With Equator Studios, I\'ve had the chance to use and deepen my knowledge in a range of technologies including React, JavaScript, Express.js, MongoDB, WSL, Linux/Ubuntu, Docker, GitLab, and CI. Some of the exciting projects I\'ve worked on include the implementation of our new Site Selector and the development of our Segmentation AI product. I\'m eager to continue expanding my skillset and contributing to the ongoing evolution of Equator Studios.'
	},
	{
		'start': '2021-10-01',
		'image': './ThisCozyStudioLogo.svg',
		// 'url': 'https://www.thiscozystudio.com/',
		'header': 'This Cozy Studio',
		'position': 'Co-Founder, CEO, Lead Software Engineer and Web Developer',
		'content': 'As the Co-Founder, CEO, and Lead Software Engineer of This Cozy Studio Inc, I\'ve driven the company\'s growth through my diverse technical abilities, leadership, and management skills. My contributions include the development of \'Blend_My_NFTs\', a popular 3D model NFT generator operating as a Blender add-on, and the creation of multiple NFT collections for our clients, among them Cozy Place, Vox Coodles, Omni Coin, Metapanda, and AKidCalledBeast. Additionally, I designed and developed our company\'s website, ThisCozyStudio.com, and implemented a cloud rendering, storage, and NFT minting platform, making it easier for 3D graphical artists to launch their own 3D NFT collections.'
	},
	{
		'start': '2021-03-01',
		'end': '2022-05-01',
		'image': './LeagueLogo.jpg',
		'url': 'https://www.league.com/',
		'style': { 'borderRadius': '50%' },
		'header': 'League',
		'position': 'QA, Accessibility, and Automation Software Tester',
		'content': 'As a Quality Assurance Engineer at League, I had the privilege of working on the development of President Choice\'s \'PC Health\' app and League\'s Health OS website. I utilized my TypeScript/JavaScript skills to develop automated tests using TestCafe. I also conducted manual testing and accessibility testing to ensure that the app and website met the WCAG accessibility standards. I worked closely with the development team and my colleagues at worX4you Inc. to provide feedback and suggestions for improvements. This was an enriching experience where I could apply my skills in automated testing, accessibility testing, and teamwork.'
	},
	{
		'start': '2013-06-01',
		'image': './worX4youLogo.jpg',
		'url': 'https://www.worx4you.com/',
		'style': { 'borderRadius': '50%' },
		'header': 'worX4you Inc.',
		'position': 'QA, Accessibility, and Automation Software Tester',
		'content': 'As a Software Assurance Engineer contractor at worx4You, I had the opportunity to work on multiple projects for companies such as THRILLWORKS, League, TunnelBear, Hubba, and Hopscotch. In this role, I was responsible for manual and automation testing using tools such as Jira, Slack, Visual Studio Code, Javascript, TypeScript, and TestCafe. Additionally, I conducted research on and implemented WCAG accessibility standards to ensure that the companies I worked with were following accessibility standards. Through my work at worx4You, I gained valuable experience in software testing and accessibility, and I am excited to continue to develop my skills in these areas.'
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
	{ name: 'Node.js', icon: 'nodedotjs' },
	{ name: 'Python', icon: 'python' },
	{ name: 'Rust', icon: 'rust' },
	{ name: 'Django', icon: 'django' },
	{ name: 'FastAPI', icon: 'fastapi' },
	{ name: 'React', icon: 'react' },
	{ name: 'Express', icon: 'express' },
	{ name: 'Vite', icon: 'vite' },
	{ name: 'Three.js', icon: 'threedotjs' },
	{ name: 'Blender', icon: 'blender' },
	{ name: 'Ubuntu', icon: 'ubuntu' },
	{ name: 'Arch Linux', icon: 'archlinux' },
	{ name: 'NGINX', icon: 'nginx' },
	{ name: 'OpenAI API', icon: 'openai' },
	{ name: 'Docker', icon: 'docker' },
	{ name: 'Hugging Face', icon: 'huggingface' },
	{ name: 'Ollama', icon: 'ollama' },
	{ name: 'DigitalOcean', icon: 'digitalocean' },
	{ name: 'AWS', icon: 'amazonwebservices' },
	{ name: 'Heroku', icon: 'heroku' },

];

const Tools = ({ each }) => {
	return <div theme='column_center'>
		<Icon name={each.icon} size={100} style={{ fill: '$color_top' }} />
		<Typography type='h4' label={each.name} />
	</div>;
};

const Page = () => {
	return <div style={{
		padding: '40px',
		gap: '40px',
		display: 'flex',
		flexDirection: 'column',
	}}>
		<div theme='clear' style={{ height: '75', minHeight: '75vh' }}>
			<Typography type='h1'>Torrin Z. Leonard</Typography>
			<Typography type='p1'>Full Stack Software Developer, located in <i>Waterloo, Ontario, Canada</i></Typography>
		</div>

		<Paper style={{ paddingBottom: '100px' }}>
			<Typography type='h1'>Work</Typography>
			<div theme='center_column'>
				<Work each={work} />
			</div>
		</Paper>
		<Paper>
			<Typography type='h1'>Tools</Typography>
			<div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
				<Tools each={tools} />
			</div>
		</Paper>

		<Paper>
			<Typography type='h1'>Projects</Typography>
			<div theme='center_column'>
				{/* List out github projects */}
			</div>
		</Paper>
	</div>;
};

mount(document.body, window.location.pathname === '/' ? <Theme value={theme.theme}>
	<Icons value={theme.icons}>
		<Gradient>
			<Collision />
			<Controls />
			<Page />
		</Gradient>
	</Icons >
</Theme> : <NotFound />);
