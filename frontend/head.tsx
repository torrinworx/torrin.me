// Everything that goes in the document head, and the structured data under it.
//
// A crawler never runs the page's JavaScript, so every tag here has to be in the file the build
// writes. It is: `Head`, `Meta`, `Link`, `Script` and `Style` render nothing where they are
// written and put a tag in the render's head list, which `@aweftjs/ssg` stamps into the shell.

import { Link, Meta, Script, Style, Title, h } from '@aweftjs/ui';

import { BRAND } from './theme.ts';

const SITE_URL = 'https://torrin.me';
const PAGE_TITLE = 'Torrin Leonard | Product Engineer';
const DESCRIPTION = 'Product engineer, full stack and applied AI. Took an AI product from 0 to 1 as '
	+ 'its sole engineer, ran production releases, and mentored developers.';
const IMAGE_URL = `${SITE_URL}/site-card.png`;

const AUTHOR_NAME = 'Torrin Leonard';
const AUTHOR_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const jsonLd = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'Person',
			'@id': AUTHOR_ID,
			name: AUTHOR_NAME,
			givenName: 'Torrin',
			familyName: 'Leonard',
			alternateName: ['Torrin', 'torrinworx'],
			url: SITE_URL,
			image: `${SITE_URL}/profile.dark.png`,
			jobTitle: [
				'Product engineer',
				'Full-stack and AI engineer',
			],
			description: DESCRIPTION,
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
				'Retrieval-augmented generation',
				'Claude Code',
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
				'@id': `${SITE_URL}/#webpage`,
			},
		},
		{
			'@type': 'WebSite',
			'@id': WEBSITE_ID,
			url: SITE_URL,
			name: PAGE_TITLE,
			description:
				'Portfolio of Torrin Leonard, a product engineer working across the full stack and applied AI.',
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
			'@id': `${SITE_URL}/#webpage`,
			url: SITE_URL,
			name: PAGE_TITLE,
			isPartOf: {
				'@id': WEBSITE_ID,
			},
			about: {
				'@id': AUTHOR_ID,
			},
			inLanguage: 'en-CA',
			primaryImageOfPage: {
				'@type': 'ImageObject',
				url: `${SITE_URL}/profile.dark.png`,
			},
		},
	],
};

// The two rules that reach `html` and `body`. No theme entry can, because a generated class only
// ever lands on an element the page built.
const DOCUMENT_CSS = `
html { -webkit-text-size-adjust: none; text-size-adjust: none; }
body { margin: 0; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
::selection { background: ${BRAND}; color: #ffffff; }
::-moz-selection { background: ${BRAND}; color: #ffffff; }
`;

/** Every head tag the site has. Written once in the template, so both pages carry it. */
export const SiteHead = (): unknown => <>
	<Title>{PAGE_TITLE}</Title>

	<Meta name="description" content={DESCRIPTION} />
	<Meta name="author" content="Torrin Leonard" />
	<Meta name="robots" content="index, follow" />
	<Meta name="geo.placename" content="Waterloo, Ontario, Canada" />
	<Meta name="geo.region" content="CA-ON" />
	<Meta name="theme-color" content="#ffffff" />

	<Meta property="og:title" content={PAGE_TITLE} />
	<Meta property="og:description" content={DESCRIPTION} />
	<Meta property="og:type" content="website" />
	<Meta property="og:url" content={SITE_URL} />
	<Meta property="og:image" content={IMAGE_URL} />
	<Meta property="og:site_name" content="Torrin Leonard" />
	<Meta property="og:locale" content="en_CA" />

	<Meta name="twitter:card" content="summary_large_image" />
	<Meta name="twitter:title" content={PAGE_TITLE} />
	<Meta name="twitter:description" content={DESCRIPTION} />
	<Meta name="twitter:image" content={IMAGE_URL} />
	<Meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

	<Link rel="canonical" href={SITE_URL} />
	<Link rel="icon" href="/favicon.png" sizes="any" type="image/png" />

	<Style>{DOCUMENT_CSS}</Style>

	<Script key="jsonld" type="application/ld+json">{JSON.stringify(jsonLd)}</Script>
</>;
