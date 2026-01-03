import { Typography, Button, Head, Title, Theme, Style, Icons, Icon, Stage, StageContext, Link, Meta, is_node, Script, OObject } from 'destamatic-ui';
import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";

import Blog from './pages/Blog';
import DestamaticUI from './destamatic-ui/DestamaticUI';

import fonts from './utils/fonts.js';
import theme from './utils/theme.js';
import JsonLd from './utils/JsonLd.jsx';
import Landing from './pages/Landing.jsx';
import Services from './pages/Services.jsx';
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
		<Meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

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

const socialLinks = [
	{
		title: 'LinkedIn',
		icon: 'simpleIcons:linkedin',
		href: 'https://www.linkedin.com/in/torrin-leonard-8343a1154/'
	},
	{
		title: 'Instagram',
		icon: 'simpleIcons:instagram',
		href: 'https://www.instagram.com/torrinleonard/',
	},
	{
		title: 'GitHub',
		icon: 'simpleIcons:github',
		href: 'https://github.com/torrinworx',
	},
	{
		title: 'GitLab',
		icon: 'simpleIcons:gitlab',
		href: 'https://gitlab.com/torrin1',
	},
	{
		title: 'YouTube',
		icon: 'simpleIcons:youtube',
		href: 'https://www.youtube.com/@TorrinZLeonard',
	},
	{
		title: 'Medium',
		icon: 'simpleIcons:medium',
		href: 'https://medium.com/@torrin_1169',
	},
	{
		title: 'dev.to',
		icon: 'simpleIcons:devdotto',
		href: 'https://dev.to/torrin',
	},
	{
		title: 'Hacker News',
		icon: 'simpleIcons:ycombinator',
		href: 'https://news.ycombinator.com/user?id=torrinleonard',
	},
];

const SocialButton = ({ each }) => <Button
	style={{ height: 50, width: 50 }}
	title={each.title}
	type='text'
	icon={<Icon name={each.icon} size={30} />}
	onClick={() => window.open(each.href, '_blank')}
	href={each.href}
/>;

const config = {
	acts: {
		landing: Landing,
		services: Services,
		blog: Blog,
		'destamatic-ui': DestamaticUI,
		fallback: NotFound,
	},
	onOpen: () => {
		window.scrollTo(0, 0);
	},
	template: ({ children }) => children,
	ssg: true,
	initial: 'landing',
	urlRouting: true,
	fallback: 'fallback',
	truncateInitial: true,
	_theme: theme
};

const Footer = StageContext.use(s => () => <>
	<Typography style={{ textAlign: 'center' }} type='p1' label={`© Torrin Leonard ${new Date().getFullYear()} 🇨🇦 | Built with `} />
	<Button
		type='link'
		iconPosition='right'
		icon={<Icon name='feather:external-link' />}
		label='destamatic-ui'
		onClick={() => s.open({ name: 'destamatic-ui' })}
		href='https://github.com/torrinworx/destamatic-ui'
	/>
</>)

const App = () => <Theme value={theme}>
	<Icons value={[IconifyIcons]} >
		<Head>
			<HeadTags />
			<StageContext value={config}>
				<div theme='column_fill_center'>
					<div theme='column_fill_center' style={{ padding: 20, gap: 60, maxWidth: 800 }} >
						<Stage />
						<div theme='column_fill_center' >
							<div theme='column_center_fill' style={{ gap: 10 }}>
								<div theme='row_wrap_fill_center' style={{ gap: 10 }}>
									<SocialButton each={socialLinks} />
								</div>
							</div>
							<div theme='row_center_fill_wrap_tight'>
								<Footer />
							</div>
						</div>
					</div>
				</div>
			</StageContext>
		</Head>
	</Icons>
</Theme >;

export default App;
