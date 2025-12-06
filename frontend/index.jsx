import { mount, Observer } from 'destam-dom';
import {
	Button, Theme, Typography, Gradient, Icons,
	PopupContext, StageContext, Stage, Shown, Popup
} from 'destamatic-ui';

import Blog from './pages/Blog';
import Demo from './pages/Demo';
import theme from './utils/theme';
import Landing from './pages/Landing';
import Controls from './utils/Controls';
import Collision from './utils/Collision';

const enabled = Observer.mutable(true);

const NotFound = StageContext.use(s => () => <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
	<Typography type='h4' style={{ marginBottom: '20px' }}>404 Page Not Found</Typography>
	<Typography type='p1' style={{ marginBottom: '20px' }}>The page you are trying to access is either unavailable or restricted.</Typography>
	<Button type='outlined' label='Go back' onClick={() => s.open({ name: 'landing' })} />
</div>);

const pages = {
	acts: {
		landing: Landing,
		blog: Blog,
		fallback: NotFound,
		'destamatic-ui-demo': Demo,
	},
	template: ({ children }) => children,
	enabled
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
			if (pages.acts[name]) {
				s.open({ name });
			} else {
				s.open({ name: 'fallback' });
			}
		}
		queueMicrotask(() => isPopState = false);
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
</Theme>);
