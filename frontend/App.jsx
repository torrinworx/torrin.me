import { Observer } from 'destam-dom';
import {
	Theme, Typography, Gradient, Icons, PopupContext,
	StageContext, Stage, Shown, Popup, is_node, Head,
	Title, Script, Style, Meta, Link
} from 'destamatic-ui';

import Blog from './pages/Blog';
import Demo from './pages/Demo';
import theme from './utils/theme';
import Landing from './pages/Landing';
import Controls from './utils/Controls';
import NotFound from './pages/NotFound';
import Collision from './utils/Collision';
import JsonLd from './utils/JsonLd';

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

		<Meta name="description" content={description} />
		<Meta name="author" content="Torrin Leonard" />
		<Meta name="robots" content="index, follow" />
		<Meta name="geo.placename" content="Waterloo, Ontario, Canada" />
		<Meta name="geo.region" content="CA-ON" />
		<Meta name="theme-color" content="#000000" />

		<Meta property="og:title" content={pageTitle} />
		<Meta property="og:description" content={description} />
		<Meta property="og:type" content="website" />
		<Meta property="og:url" content={siteUrl} />
		<Meta property="og:image" content={imageUrl} />
		<Meta property="og:site_name" content="Torrin's Portfolio" />
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

		<Link rel="preconnect" href="https://fonts.googleapis.com" />
		<Link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
		<Link
			rel="stylesheet"
			href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap"
		/>
		<Link
			rel="preload"
			as="font"
			type="font/woff2"
			href="/fonts/ibm-plex-sans-latin.woff2"
			crossorigin=""
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
			`}
		</Style>

		<Script type="module" crossorigin src="/index.js" />
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
