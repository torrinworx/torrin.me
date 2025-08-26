import { mount, Observer } from 'destam-dom';
import {
	Button, Theme, Typography, Paper, Gradient, Icons,
	Radio, Toggle, PopupContext, StageContext, Stage,
	Shown, LoadingDots, suspend,
} from 'destamatic-ui';

import Blog from './Blog';
import theme from './theme';
import Landing from './Landing';
import Collision from './Collision';
import Markdown from './Markdown';

const NotFound = StageContext.use(s => () => <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
	<Typography type='h4' style={{ marginBottom: '20px' }}>404 Page Not Found</Typography>
	<Typography type='p1' style={{ marginBottom: '20px' }}>The page you are trying to access is either unavailable or restricted.</Typography>
	<Button type='outlined' label='Go back' onClick={() => s.open({ name: 'landing' })} />
</div>);

const Controls = () => {
	const SelectRadio = Radio(window.colorMode);

	return <div
		theme='center_wide'
		style={{
			paddingTop: 20,
			position: 'fixed',
			top: 0,
		}}
	>
		<Paper style={{ padding: 0 }}>
			<div theme='center_row' style={{ padding: 10, gap: 10 }}>
				<SelectRadio theme='red' value={'red'} />
				<SelectRadio theme='purple' value={'purple'} />
				<SelectRadio theme='cyan' value={'cyan'} />
				<SelectRadio theme='gold' value={'gold'} />
				<Toggle value={window.themeMode} />
			</div>
		</Paper>
	</div>;
};

const enabled = Observer.mutable(true);

const response = await fetch('/blog/index.json');
const blogs = await response.json();

// This can be it's own file:
const Something = StageContext.use(s => suspend(LoadingDots, async ({ key, value }) => {
	s.props.enabled.set(false);
	let content = await fetch(`/blog/${key}`).then(r => r.text());

	const cleanupMd = (md) => {
		md = md.replace(/#\s*header\s*\n([^#]*)\n+/i, '');
		md = md.replace(/#\s*description\s*\n((?:[^\n]+\n?)*)/i, '');
		return md.trim();
	};

	content = cleanupMd(content);

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			hour12: false,
		}).format(date);
	};

	return <div theme='column' style={{ gap: 40 }}>
		<div theme='row_spread'>
			<Button type='outlined' label='Back' onClick={() => s.open({ name: 'blog' })} />
		</div>
		<Paper>
			<Typography type='p1' label={`Created on: ${formatDate(value.created)}`} />
			<Typography type='p1' label={`Modified on: ${formatDate(value.modified)}`} />
			<Markdown value={content} />
		</Paper>
	</div>;
}));

const blogPages = Object.entries(blogs).reduce((acc, [key, value]) => {
	const baseName = key.replace(/\.[^/.]+$/, '');
	const routeKey = `blog/${baseName}`;
	acc[routeKey] = () => <Something key={key} value={value} />;
	return acc;
}, {});

const pages = {
	stages: {
		landing: Landing,
		blog: Blog,
		fallback: NotFound,
		...blogPages,
	},
	template: ({ children }) => children,
	enabled,
	blogs,
};

const Pages = StageContext.use(s => (_, cleanup) => {
	let isPopState = false;

	const getPath = () => {
		const rawPath = window.location.pathname;
		return rawPath.endsWith('/') && rawPath.length > 1 ? rawPath.slice(0, -1) : rawPath;
	};

	const urlResolve = () => {
		s.props?.enabled.set(true);

		isPopState = true;
		const path = getPath();

		if (path === '/') {
			s.open({ name: 'landing' });
		} else {
			const name = path.slice(1);
			const page = pages.stages[name];
			if (page) {
				s.open({ name });
			} else {
				s.open({ name: 'fallback' });
			}
		}
		queueMicrotask(() => {
			isPopState = false;
		});
	};

	urlResolve();

	cleanup(s.observer.path('current').effect(c => {
		s.props?.enabled.set(true);

		if (!c || isPopState) return;

		if (c === 'landing') {
			history.pushState({ page: 'home' }, 'Home', '/');
		} else if (c !== 'fallback') {
			history.pushState({ page: c }, c, '/' + c);
		}
	}));

	window.addEventListener('popstate', urlResolve);
	cleanup(() => window.removeEventListener('popstate', urlResolve));

	return <Stage />;
});

mount(document.body, <Theme value={theme.theme}>
	<Icons value={theme.icons}>
		<PopupContext>
			<Gradient>
				<Shown value={enabled}>
					<Collision />
				</Shown>
				<StageContext value={pages}>
					<div theme='pages'>
						<Pages />
					</div>
				</StageContext>
			</Gradient>
			<Controls />
		</PopupContext>
	</Icons>
</Theme>);
