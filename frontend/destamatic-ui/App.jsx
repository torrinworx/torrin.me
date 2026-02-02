import {
	Theme,
	Icons,
	Stage,
	StageContext,
	Title,
	Meta,
	Link,
	Head,
	Observer,
	Button,
	Icon,
	Popup,
	Typography,
} from 'destamatic-ui';
import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";

import Demo from './pages/Demo.jsx';
import Docs from './pages/Docs.jsx';
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

const SideBar = StageContext.use(stage => () => {
	const sidebar = Observer.mutable(false);

	const transformStyle = sidebar.map(open => open ? 'translateX(0)' : 'translateX(-100%)');
	return <Popup>
		<Button
			type='contained'
			icon={<Icon name='feather:sidebar' />}
			onClick={() => sidebar.set(!sidebar.get())}
			style={{ position: 'fixed', top: 0, left: 0, margin: 10 }}
		/>
		<div
			theme={[sidebar.bool('shadow', null)]}
			style={{
				borderRadius: '0 50px 50px 0',
				position: 'fixed',
				top: 0,
				left: 0,
				height: '100vh',
				background: '#f5f5f5',
				maxWidth: 400,
				transform: transformStyle,
				transition: 'transform 0.3s ease',
				padding: 20,
				gap: 20,
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<div>
				<div theme='row_spread' style={{ gap: 20 }}>
					<Typography type='h2' label='destamatic-ui' style={{ color: '$color' }} />
					<Button
						type="contained"
						icon={<Icon name='feather:x' />}
						onClick={() => sidebar.set(false)}
					/>
				</div>

				<div theme='divider' />

				<div theme='column' style={{ gap: 4 }}>
					<Button
						type={stage.observer.path('current').map(c => c === 'landing' ? 'contained_row_spread' : 'text_row_spread')}
						label="Home"
						href="/destamatic-ui/"
						onClick={() => stage.open({ name: 'landing' })}
						icon={<Icon name="feather:home" />}
						iconPosition="right"
						style={{ padding: '4px 10px' }}
					/>
					<Button
						type={stage.observer.path('current').map(c => c === 'playground' ? 'contained_row_spread' : 'text_row_spread')}
						label="Playground (coming soon)"
						href="/destamatic-ui/playground"
						onClick={() => stage.open({ name: 'playground' })}
						icon={<Icon name="feather:terminal" />}
						iconPosition="right"
						style={{ padding: '4px 10px' }}
						disabled
					/>
					<Button
						type={stage.observer.path('current').map(c => c === 'docs' ? 'contained_row_spread' : 'text_row_spread')}
						label="Docs (coming soon)"
						href="/destamatic-ui/docs"
						onClick={() => stage.open({ name: 'docs' })}
						icon={<Icon name="feather:book-open" />}
						iconPosition="right"
						style={{ padding: '4px 10px' }}
						disabled
					/>
					<Button
						type={stage.observer.path('current').map(c => c === 'demo' ? 'contained_row_spread' : 'text_row_spread')}
						label="Demos"
						href="/destamatic-ui/demo"
						onClick={() => stage.open({ name: 'demo' })}
						icon={<Icon name="feather:grid" />}
						iconPosition="right"
						style={{ padding: '4px 10px' }}
					/>
				</div>
			</div>

			<div style={{ flex: 1, overflowY: 'auto' }}>
				<Typography type='h2' label={stage.observer.path('current').map(c => c.charAt(0).toUpperCase() + c.slice(1))} style={{ color: '$color' }} />
				<div theme='divider' />

			</div>

			{/* {children} */}
			{/* Footer, above content scrolls if it's longer but this always stays */}
			<div theme='column'>
				<div theme='divider' />
				<Button
					type="text_row_spread"
					label="Github"
					href="https://github.com/torrinworx/destamatic-ui"
					icon={<Icon name="feather:github" />}
					iconPosition="right"
				/>
				<Button
					type="text_row_spread"
					label="Discord"
					iconPosition="right"
					href="https://discord.gg/BJMPpVwdhz"
					onClick={() =>
						window.open('https://discord.gg/BJMPpVwdhz', '_blank')
					}
					icon={<Icon name="simpleIcons:discord" />}
				/>
			</div>
		</div>
	</Popup>;
});

const App = () => {
	const pageUrl = `${BASE_URL}/destamatic-ui`;
	const pageTitle = `destamatic-ui`;
	const pageDescription = 'An all-in-one alternative to the React + MUI + Redux + Next stack.';
	const imageUrl = 'https://torrin.me/profile.dark.png';

	const stage = {
		acts: {
			landing: Landing,
			demo: Demo,
			docs: Docs,
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

	return <>
		<Theme value={theme}>
			<Icons value={[IconifyIcons]} >
				<StageContext value={stage}>
					<Head>
						<Title>destamatic-ui | A batteries-included UI framework.</Title>

						<Meta name="description" content={pageDescription} />
						<Meta name="author" content={AUTHOR_NAME} />
						<Meta name="robots" content="index,follow" />

						<Link rel="canonical" href={pageUrl} />

						<Meta property="og:type" content="website" />
						<Meta property="og:title" content='destamatic-ui | A batteries-included UI framework.' />
						<Meta property="og:description" content={pageDescription} />
						<Meta property="og:url" content={pageUrl} />
						<Meta property="og:site_name" content={SITE_NAME} />
						<Meta property="og:image" content={imageUrl} />

						<Meta name="twitter:card" content="summary_large_image" />
						<Meta name="twitter:title" content='destamatic-ui | A batteries-included UI framework.' />
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
						<SideBar />
						<Stage />
					</Head>
				</StageContext>
			</Icons>
		</Theme>
	</>;
};

export default App;
