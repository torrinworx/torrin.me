import {
	Theme,
	Icons,
	Stage,
	StageContext,
	Title,
	Meta,
	Link,
	Head,
} from 'destamatic-ui';
import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";

import Demo from './pages/Demo.jsx';
import Landing from './pages/Landing.jsx';
import Playground from './pages/Playground';

import theme from '../utils/theme.js';
import NotFound from '../pages/NotFound.jsx';

import JsonLd, {
	SITE_NAME,
	BASE_URL,
	AUTHOR_NAME,
	AUTHOR_ID,
	WEBSITE_ID,
} from '../utils/JsonLd';

const stage = {
	acts: {
		landing: Landing,
		demo: Demo,
		playground: Playground,
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
	_theme: theme,
};

const pageUrl = `${BASE_URL}/destamatic-ui`;
const pageTitle = `destamatic-ui`;
const pageDescription = 'An all-in-one alternative to the React + MUI + Redux + Next stack.';
const imageUrl = 'https://torrin.me/profile.dark.png';

const App = () => <Theme value={theme}>
	<Icons value={[IconifyIcons]} >
		<Head>
			<Title>{pageTitle}</Title>

			<Meta name="description" content={pageDescription} />
			<Meta name="author" content={AUTHOR_NAME} />
			<Meta name="robots" content="index,follow" />

			<Link rel="canonical" href={pageUrl} />

			<Meta property="og:type" content="website" />
			<Meta property="og:title" content={pageTitle} />
			<Meta property="og:description" content={pageDescription} />
			<Meta property="og:url" content={pageUrl} />
			<Meta property="og:site_name" content={SITE_NAME} />
			<Meta property="og:image" content={imageUrl} />

			<Meta name="twitter:card" content="summary_large_image" />
			<Meta name="twitter:title" content={pageTitle} />
			<Meta name="twitter:description" content={pageDescription} />
			<Meta name="twitter:image" content={imageUrl} />

			<JsonLd
				extraNodes={[{
					'@type': ['WebPage', 'Product', 'SoftwareApplication'],
					'@id': `${pageUrl}#webpage`,
					name: 'destamatic-ui',
					url: pageUrl,
					description: pageDescription,
					inLanguage: 'en-CA',
					isPartOf: {
						'@id': WEBSITE_ID,
					},
					about: {
						'@id': AUTHOR_ID,
					},
					applicationCategory: 'WebApplication',
					operatingSystem: 'Any',
				}]}
			/>
			<StageContext value={stage}>
				<Stage />
			</StageContext>
		</Head>
	</Icons>
</Theme>;

export default App;
