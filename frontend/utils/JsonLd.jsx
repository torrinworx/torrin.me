import { Script } from '@destamatic/ui';

export const SITE_NAME = 'Torrin Leonard | Full-Stack Engineer';
export const BASE_URL = 'https://torrin.me';
export const AUTHOR_NAME = 'Torrin Leonard';
export const AUTHOR_ID = `${BASE_URL}/#person`;
export const WEBSITE_ID = `${BASE_URL}/#website`;

const baseJsonLd = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'Person',
			'@id': AUTHOR_ID,
			name: AUTHOR_NAME,
			givenName: 'Torrin',
			familyName: 'Leonard',
			alternateName: ['Torrin', 'torrinworx'],
			url: BASE_URL,
			image: `${BASE_URL}/profile.dark.png`,
			jobTitle: [
				'Full-stack software engineer',
				'AI & UI tools engineer',
			],
			description:
				'Full-stack software engineer building AI-powered web apps, custom UI frameworks, and the infrastructure they run on.',
			worksFor: {
				'@type': 'Organization',
				'@id': 'https://equatorstudios.com/#organization',
			},
			alumniOf: [
				{
					'@type': 'CollegeOrUniversity',
					name: 'University of Waterloo',
					sameAs: 'https://uwaterloo.ca/',
				},
			],
			address: {
				'@type': 'PostalAddress',
				addressLocality: 'Waterloo',
				addressRegion: 'Ontario',
				addressCountry: 'CA',
			},
			homeLocation: {
				'@type': 'Place',
				name: 'Waterloo, Ontario, Canada',
			},
			knowsAbout: [
				'Full-stack web development',
				'Frontend development',
				'Backend development',
				'JavaScript',
				'TypeScript',
				'Python',
				'React',
				'destamatic-ui',
				'WebGL',
				'Three.js',
				'Node.js',
				'Express',
				'FastAPI',
				'REST APIs',
				'WebSockets',
				'MongoDB',
				'MariaDB',
				'Redis',
				'DevOps',
				'Docker',
				'GitHub Actions',
				'GitLab CI/CD',
				'NGINX',
				'Linux',
				'Web accessibility (WCAG)',
				'Test automation',
				'TestCafe',
				'AI and machine learning',
				'OpenAI API',
				'Whisper',
				'Hugging Face',
				'Vector search',
				'Qdrant',
				'LangChain',
			],
			knowsLanguage: [
				{
					'@type': 'Language',
					name: 'English',
				},
			],
			email: 'mailto:torrin@torrin.me',
			sameAs: [
				'https://www.linkedin.com/in/torrin-leonard-8343a1154/',
				'https://github.com/torrinworx',
				'https://gitlab.com/torrin1',
				'https://www.instagram.com/torrinleonard/',
				'https://www.youtube.com/@TorrinZLeonard',
				'https://medium.com/@torrin_1169',
				'https://dev.to/torrin',
				'https://news.ycombinator.com/user?id=torrinleonard',
				'https://opengig.org',
				'https://github.com/torrinworx/OpenGig.org',
				'https://github.com/torrinworx/destamatic-ui',
				'https://github.com/torrinworx/MangoSync',
				'https://github.com/torrinworx/Blend_My_NFTs',
			],
			mainEntityOfPage: {
				'@id': `${BASE_URL}/#webpage`,
			},
		},
		{
			'@type': 'Organization',
			'@id': 'https://equatorstudios.com/#organization',
			name: 'Equator Studios',
			url: 'https://equatorstudios.com/',
		},
		{
			'@type': ['WebSite', 'Blog'],
			'@id': WEBSITE_ID,
			url: BASE_URL,
			name: SITE_NAME,
			description:
				'Portfolio of Torrin Leonard, a full-stack software engineer building AI-powered web apps, custom UI frameworks, and the infrastructure they run on.',
			inLanguage: 'en-CA',
			publisher: {
				'@id': AUTHOR_ID,
			},
			author: {
				'@id': AUTHOR_ID,
			},
			creator: {
				'@id': AUTHOR_ID,
			},
			sameAs: [
				'https://www.linkedin.com/in/torrin-leonard-8343a1154/',
				'https://github.com/torrinworx',
				'https://gitlab.com/torrin1',
				'https://www.youtube.com/@TorrinZLeonard',
			],
		},
		{
			'@type': ['WebPage', 'ProfilePage'],
			'@id': `${BASE_URL}/#webpage`,
			url: BASE_URL,
			name: SITE_NAME,
			isPartOf: {
				'@id': WEBSITE_ID,
			},
			about: {
				'@id': AUTHOR_ID,
			},
			inLanguage: 'en-CA',
			primaryImageOfPage: {
				'@type': 'ImageObject',
				url: `${BASE_URL}/profile.dark.png`,
			},
		},
	],
};

const JsonLd = ({ extraNodes = [] }) => {
	const full = {
		...baseJsonLd,
		'@graph': [
			...baseJsonLd['@graph'],
			...(Array.isArray(extraNodes) ? extraNodes : [extraNodes]),
		],
	};

	const jsonText = JSON.stringify(full);

	return <Script type="application/ld+json" group="jsonld">
		{jsonText}
	</Script>;
};

export default JsonLd;
