import { Observer } from 'destam-dom';
import {
	Theme, Typography, Gradient, Icons, PopupContext,
	StageContext, Stage, Shown, Popup, is_node, Head,
	Title, Script, Style
} from 'destamatic-ui';

import Blog from './pages/Blog';
import Demo from './pages/Demo';
import theme from './utils/theme';
import Landing from './pages/Landing';
import Controls from './utils/Controls';
import NotFound from './pages/NotFound';
import Collision from './utils/Collision';

const enabled = Observer.mutable(true);
const pages = {
	acts: {
		landing: Landing,
		blog: Blog,
		fallback: NotFound,
		'destamatic-ui-demo': Demo,
	},
	template: ({ children }) => children,
	ssg: true,
	initial: 'landing',
	urlRouting: true,
	enabled,
	fallback: 'fallback'
};

const HeadTags = () => {
	const siteUrl = 'https://torrin.me';
	const pageTitle = 'Torrin | Full-Stack Developer, Software Engineer';
	const description =
		'Full-stack developer with 8+ years of professional experience building production-grade web apps, AI-driven tools, and custom UI frameworks with a focus on performance, accessibility, and scalability.';
	const imageUrl = `${siteUrl}/site-card.png`;

	return <>
		<Title text={pageTitle} group="title" />

		{/* Basic SEO meta */}
		<Meta name="description" content={description} />
		<Meta name="author" content="Torrin Leonard" />
		<Meta name="robots" content="index, follow" />
		{/* Keywords barely matter anymore for Google, but won’t hurt */}
		<Meta
			name="keywords"
			content="Torrin, Torrin Leonard, Software Engineer, Full-Stack Developer, Web Developer, React, Node.js, JavaScript, Developer Portfolio"
		/>
		<Meta name="geo.placename" content="Waterloo, Ontario, Canada" />
		<Meta name="geo.region" content="CA-ON" />
		<Meta name="theme-color" content="#000000" />
		{/* If you verify with Google Search Console, drop your token here:
        <Meta name="google-site-verification" content="YOUR_TOKEN_HERE" />
      */}

		{/* Open Graph (for rich previews) */}
		<Meta property="og:title" content={pageTitle} />
		<Meta property="og:description" content={description} />
		<Meta property="og:type" content="website" />
		<Meta property="og:url" content={siteUrl} />
		<Meta property="og:image" content={imageUrl} />
		<Meta property="og:site_name" content="Torrin's Portfolio" />
		<Meta property="og:locale" content="en_CA" />

		{/* Twitter Card */}
		<Meta name="twitter:card" content="summary_large_image" />
		<Meta name="twitter:title" content={pageTitle} />
		<Meta name="twitter:description" content={description} />
		<Meta name="twitter:image" content={imageUrl} />
		{/* If you actually use X/Twitter, set your handle:
        <Meta name="twitter:creator" content="@your_handle" />
      */}

		{/* Canonical + icons */}
		<Link rel="canonical" href={siteUrl} />
		<Link
			rel="icon"
			href="/favicon.svg"
			sizes="any"
			type="image/svg+xml"
		/>
		<Link
			rel="apple-touch-icon"
			sizes="180x180"
			href="/apple-touch-icon.png"
		/>
		<Link rel="manifest" href="/site.webmanifest" />

		{/* Fonts + perf hints */}
		<Link rel="preconnect" href="https://fonts.googleapis.com" />
		<Link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
		<Link
			rel="stylesheet"
			href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap"
		/>
		{/*
        <Link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/ibm-plex-sans-latin.woff2"
          crossorigin=""
        />
      */}

		<Style>
			{`
          /* Hide body content while we're "preloading" */
          html.preload body {
            visibility: hidden;
          }

          /* Explicit white background so users just see a blank screen */
          html.preload {
            background: #ffffff;
          }
        `}
		</Style>

		{/* Main app bundle (grouped by src so you only get one) */}
		<Script type="module" crossorigin src="/index.js" />

		{/* JSON-LD (Person + WebSite + ProfilePage) */}
		{/* Note: Script groups inline by type, so this will be THE ld+json block.
          If you ever want multiple ld+json blocks, pass group={null} on the others. */}
		<Script type="application/ld+json">
			{`{
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
        }`}
		</Script>
	</>;
};

const App = () => <Head>
	<HeadTags />
	<Theme value={theme.theme}>
		<Icons value={theme.icons}>
			<PopupContext>
				<Gradient>
					<Shown value={enabled.map(e => e && !is_node())}>
						<Collision />
					</Shown>
					<StageContext value={pages}>
						<div theme='pages'>
							<Stage />
							<div theme='center_clear' >
								<Typography type='p2'> © Torrin Leonard {new Date().getFullYear()} 🇨🇦</Typography>
							</div>
							<Popup />
						</div>
					</StageContext>
				</Gradient>
				<Controls />
			</PopupContext>
		</Icons>
	</Theme>
</Head>;

export default App;
