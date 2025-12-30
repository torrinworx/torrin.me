import { Typography, Button, Head, Title, Theme, Style, Icons, Icon, Stage, StageContext, Link, Meta, is_node, Script } from 'destamatic-ui';
import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";

import Blog from './pages/Blog';
import DestamaticUI from './destamatic-ui/DestamaticUI';

import fonts from './utils/fonts.js';
import theme from './utils/theme.js';
import JsonLd from './utils/JsonLd.jsx';
import Landing from './pages/Landing.jsx';
import NotFound from './pages/NotFound.jsx';

/*
Notes on theme and styles:

JetBrains Mono is used for headers, and any text used in inputs like button labels.

IBM Plex Sans is used for paragraph text.

Purposefully chose only three typography styles for simplicity:
h1: main hero style headers
h2: sub headers/content headers to be used inside text content
body: text body content

This drastically reduces the multiplicity of font sizes around the site that need to be
worried about.
*/

const HeadTags = () => {
	const siteUrl = 'https://torrin.me';
	const pageTitle = 'Torrin Leonard | Full-Stack Engineer';
	const description =
		'Full-stack software engineer building AI-powered web apps, custom UI frameworks, and the infrastructure they run on.';
	const imageUrl = `${siteUrl}/site-card.png`;

	return <>
		<Title text={pageTitle} />

		<Meta name="description" content={description} />
		<Meta name="author" content="Torrin Leonard" />
		<Meta name="robots" content="index, follow" />
		<Meta name="geo.placename" content="Waterloo, Ontario, Canada" />
		<Meta name="geo.region" content="CA-ON" />
		<Meta name="theme-color" content="#ffffff" />

		<Meta property="og:title" content={pageTitle} />
		<Meta property="og:description" content={description} />
		<Meta property="og:type" content="website" />
		<Meta property="og:url" content={siteUrl} />
		<Meta property="og:image" content={imageUrl} />
		<Meta property="og:site_name" content="Torrin Leonard" />
		<Meta property="og:locale" content="en_CA" />

		<Meta name="twitter:card" content="summary_large_image" />
		<Meta name="twitter:title" content={pageTitle} />
		<Meta name="twitter:description" content={description} />
		<Meta name="twitter:image" content={imageUrl} />

		<Link rel="canonical" href={siteUrl} />
		<Link
			rel="icon"
			href="/favicon.svg"
			sizes="any"
			type="image/svg+xml"
		/>

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
			${fonts}
            `}
		</Style>

		{is_node() ? <Script type="module" crossorigin src="/index.js" /> : null}
		<JsonLd />

		<Script
			group="plausible-js"
			async
			defer
			src="https://stats.torrin.me/js/pa-y1DeMbOTUm55YjS0JWtyU.js"
		/>

		<Script
			group="plausible-inline"
			type="text/javascript"
		>
			{`
                window.plausible = window.plausible || function() {
                  (plausible.q = plausible.q || []).push(arguments)
                };
                plausible.init = plausible.init || function (opts) {
                  plausible.o = opts || {};
                };
                plausible.init();
            `}
		</Script>
	</>;
};
const config = {
	acts: {
		landing: Landing,
		blog: Blog,
		'destamatic-ui': DestamaticUI,
		fallback: NotFound,
	},
	template: ({ children }) => children,
	ssg: true,
	initial: 'landing',
	urlRouting: true,
	fallback: 'fallback',
	_theme: theme
};

const App = () => <Theme value={theme}>
	<Icons value={[IconifyIcons]} >
		<Head>
			<HeadTags />
			<StageContext value={config}>
				<div theme='column_fill_center'>
					<div theme='column_fill_center' style={{ padding: 20, gap: 60, maxWidth: 800 }} >
						<Stage />
						<Typography style={{ textAlign: 'center' }} type='p1' label={`© Torrin Leonard ${new Date().getFullYear()} 🇨🇦 | Built with `} />
						<Button
							type='link'
							iconPosition='right'
							icon={<Icon name='feather:external-link' />}
							label='destamatic-ui'
							onClick={() => window.open('https://github.com/torrinworx/destamatic-ui', '_blank')}
							href='https://github.com/torrinworx/destamatic-ui'
						/>
					</div>
				</div>
			</StageContext>
		</Head>
	</Icons>
</Theme>;

export default App;
