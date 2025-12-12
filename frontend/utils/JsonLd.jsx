import { Observer } from 'destam-dom';
import { Script } from 'destamatic-ui';

export const SITE_NAME = 'Torrin | Full-Stack Developer, Software Engineer';
export const BASE_URL = 'https://torrin.me';
export const AUTHOR_NAME = 'Torrin Leonard';
export const AUTHOR_ID = 'https://torrin.me/#person';
export const WEBSITE_ID = 'https://torrin.me/#website';

const baseJsonLd = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "Person",
			"@id": "https://torrin.me/#person",
			"name": "Torrin Leonard",
			"givenName": "Torrin",
			"familyName": "Leonard",
			"alternateName": [
				"Torrin",
				"torrinworx"
			],
			"url": "https://torrin.me",
			"image": "https://torrin.me/profile.dark.png",
			"jobTitle": [
				"Full-Stack Software Developer",
				"AI & UI Specialist",
				"Web App Architect"
			],
			"description": "Full-stack developer with 8+ years of professional experience building production-grade web apps, AI-driven tools, and custom UI frameworks with a focus on performance, accessibility, and scalability.",
			"worksFor": {
				"@type": "Organization",
				"@id": "https://equatorstudios.com/#organization"
			},
			"alumniOf": [
				{
					"@type": "CollegeOrUniversity",
					"name": "University of Waterloo",
					"sameAs": "https://uwaterloo.ca/"
				}
			],
			"address": {
				"@type": "PostalAddress",
				"addressLocality": "Waterloo",
				"addressRegion": "Ontario",
				"addressCountry": "CA"
			},
			"homeLocation": {
				"@type": "Place",
				"name": "Waterloo, Ontario, Canada"
			},
			"knowsAbout": [
				"Full-stack web development",
				"Frontend development",
				"Backend development",
				"JavaScript",
				"TypeScript",
				"React",
				"WebGL",
				"Three.js",
				"Node.js",
				"Express",
				"Django",
				"FastAPI",
				"Go",
				"Rust",
				"MongoDB",
				"MariaDB",
				"CockroachDB",
				"DevOps",
				"Docker",
				"GitHub Actions",
				"GitLab CI/CD",
				"NGINX",
				"Linux",
				"Web accessibility (WCAG)",
				"Test automation",
				"AI and machine learning",
				"OpenAI API",
				"Hugging Face",
				"Vector search",
				"Whisper",
				"Blockchain development",
				"Ethereum",
				"Polygon",
				"Cardano"
			],
			"knowsLanguage": [
				{
					"@type": "Language",
					"name": "English"
				}
			],
			"email": "mailto:torrin@torrin.me",
			"sameAs": [
				"https://www.linkedin.com/in/torrin-leonard-8343a1154/",
				"https://github.com/torrinworx",
				"https://github.com/torrinworx/torrin.me",
				"https://gitlab.com/torrin1",
				"https://stackoverflow.com/users/15739035/torrin-worx?tab=profile",
				"https://www.youtube.com/c/ThisCozyStudio",
				"https://www.torrinleonard.com",
				"https://torrinleonard.ca",
				"https://opengig.org",
				"https://github.com/torrinworx/OpenGig.org",
				"https://github.com/torrinworx/destamatic-ui",
				"https://github.com/torrinworx/destam-web-core",
				"https://github.com/Nefsen402/destam-dom",
				"https://github.com/equator-studios/destam",
				"https://github.com/Equator-Studios"
			],
			"mainEntityOfPage": {
				"@id": "https://torrin.me/#webpage"
			}
		},
		{
			"@type": "Organization",
			"@id": "https://equatorstudios.com/#organization",
			"name": "Equator Studios",
			"url": "https://equatorstudios.com/"
		},
		{
			"@type": [
				"WebSite",
				"Blog"
			],
			"@id": "https://torrin.me/#website",
			"url": "https://torrin.me",
			"name": "Torrin | Full-Stack Developer, Software Engineer",
			"description": "Full-Stack Developer specializing in modern web technologies like React and Node.js. Explore my projects, blog posts, and get in touch.",
			"inLanguage": "en-CA",
			"publisher": {
				"@id": "https://torrin.me/#person"
			},
			"author": {
				"@id": "https://torrin.me/#person"
			},
			"creator": {
				"@id": "https://torrin.me/#person"
			},
			"sameAs": [
				"https://www.linkedin.com/in/torrin-leonard-8343a1154/",
				"https://github.com/torrinworx",
				"https://gitlab.com/torrin1",
				"https://www.youtube.com/c/ThisCozyStudio"
			]
		},
		{
			"@type": [
				"WebPage",
				"ProfilePage"
			],
			"@id": "https://torrin.me/#webpage",
			"url": "https://torrin.me",
			"name": "Torrin | Full-Stack Developer, Software Engineer",
			"isPartOf": {
				"@id": "https://torrin.me/#website"
			},
			"about": {
				"@id": "https://torrin.me/#person"
			},
			"inLanguage": "en-CA",
			"primaryImageOfPage": {
				"@type": "ImageObject",
				"url": "https://torrin.me/profile.dark.png"
			}
		}
	]
};

const JsonLd = ({ extraNodes = [] }) => {
	const full = {
		...baseJsonLd,
		"@graph": [
			...baseJsonLd["@graph"],
			...(Array.isArray(extraNodes) ? extraNodes : [extraNodes])
		]
	};

	const jsonText = JSON.stringify(full);

	console.log(jsonText);
	return <Script
		type="application/ld+json"
		group="jsonld"
	>
		{jsonText}
	</Script>;
};

export default JsonLd;
