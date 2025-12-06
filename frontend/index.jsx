import { mount, Observer } from 'destam-dom';
import {
	Theme, Typography, Gradient, Icons, PopupContext,
	StageContext, Stage, Shown, Popup
} from 'destamatic-ui';

import Blog from './pages/Blog';
import Demo from './pages/Demo';
import theme from './utils/theme';
import Landing from './pages/Landing';
import Controls from './utils/Controls';
import NotFound from './pages/NotFound';
import Collision from './utils/Collision';

// TODO: Move url stuff to Stage component, have Stage component have in built url route handling.
// TODO: Stage Context tree, allow the ability to have .route() function that finds the most eldest parent in the tree and routes from that parents .open() function for top of tree navigation.
// 		or somehow ensure 'root' parent is always passed down to children so that they can open/route? Problem this solves: child context component, cut off, has to manually do stage.parent.open({...}). might be hard to navigate multiple nests of stage contexts
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
			if (s.acts[name]) {
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

const enabled = Observer.mutable(true);
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
