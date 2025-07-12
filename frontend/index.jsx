import { mount, Observer } from 'destam-dom';
import {
	Button,
	Theme,
	Typography,
	Paper,
	Gradient,
	Icons,
	Radio,
	Toggle,
	PopupContext,
	StageContext,
	Stage,
	Shown,
} from 'destamatic-ui';

import Blog from './Blog';
import theme from './theme';
import Landing from './Landing';
import Collision from './Collision';

Theme.define({
	clear: {
		padding: 20,
		gap: 40,
		display: 'flex',
		flexDirection: 'column',
	},
	pages: {
		padding: '60px 40px 40px 40px',
		gap: 40,
		display: 'flex',
		flexDirection: 'column',
	},
});

const NotFound = StageContext.use(s => () => <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
	<Typography type='h4' style={{ marginBottom: '20px' }}>404 Page Not Found</Typography>
	<Typography type='p1' style={{ marginBottom: '20px' }}>The page you are trying to access is either unavailable or restricted.</Typography>
	<Button type='outlined' label='Go back' onClick={() => s.open({ name: 'landing' })} />
</div>);

const Controls = () => {
	const SelectRadio = Radio(window.colorMode);

	return <div
		theme='center'
		style={{
			paddingTop: 20,
			position: 'sticky',
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

const pages = {
	stages: { // TODO: use this to create a site map to feed to google and cross link on pages.
		landing: Landing,
		blog: Blog,
		fallback: NotFound,
		'blog/test': Landing
	},
	template: ({ children }) => children,
	enabled,
};

const Pages = StageContext.use(s => (_, cleanup, mounted) => {
	const pathResolve = () => {
		const path = window.location.pathname;

		if (path === '/') s.open({ name: 'landing' });
		else {
			const page = pages.stages[path.slice(1)];
			if (page) {
				s.open({ name: path.slice(1) });
			} else {
				s.open({ name: 'fallback' });
			}
		}
	};

	cleanup(s.observer.path('current').effect(c => {
		if (!c) return; // ignore null/undefined

		if (c === 'landing') {
			history.pushState({ page: 'home' }, "Home", '/');
			return;
		} else if (c != 'fallback') {
			console.log(c);
			history.pushState({ page: c }, c, '/' + c);
		}
	}));

	mounted(() => {
		pathResolve();
	});

	return <Stage />;
});


const App = () => {

	window.location.pathname === '/' ? <></> : <NotFound />

	return <Theme value={theme.theme}>
		<Icons value={theme.icons}>
			<PopupContext >
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
		</Icons >
	</Theme>;
};

mount(document.body, <App />);
