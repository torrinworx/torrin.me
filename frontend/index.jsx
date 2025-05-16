import { mount } from 'destam-dom';
import { Button, Theme, Typography, Radio, Toggle, Paper, Gradient } from 'destamatic-ui';

import theme from './theme';
import Portfolio from './components/Portfolio';
// import Collision from './components/Collision';

const NotFound = () => <Theme value={theme}>
	<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
		<Typography type='h4' style={{ marginBottom: '20px' }}>404 Page Not Found</Typography>
		<Typography type='p1' style={{ marginBottom: '20px' }}>The page you are trying to access is either unavailable or restricted.</Typography>
		<Button
			type='contained'
			label='Return to Site'
			onMouseDown={() => {
				state.client.observer.path('openPage').set({ page: "Landing" });
				if (window.location.pathname !== '/') {
					window.location.href = '/';
				}
			}}
		/>
	</div>
</Theme>;

const App = () => {
	const SelectRadio = Radio(window.colorMode);

	return <Theme value={theme.theme}>
		<Gradient>
			{/* <Collision> */}
			<div theme='center' style={{ paddingTop: 20 }}>
				<Paper style={{ width: 250 }}>
					<div theme='center_row' style={{ gap: 8 }}>
						<SelectRadio style={{ color: '$color_red' }} value={'red'} />
						<SelectRadio style={{ color: '$color_purple' }} value={'purple'} />
						<SelectRadio style={{ color: '$color_cyan' }} value={'cyan'} />
						<SelectRadio style={{ color: '$color_gold' }} value={'gold'} />
						<Toggle value={window.themeMode} />
					</div>
				</Paper>
			</div>
			<div style={{
				padding: 20,
				gap: 40,
				display: 'flex',
				flexDirection: 'column',
			}}>


				<Paper>

					<Portfolio />
				</Paper>
			</div>
			{/* </Collision> */}
		</Gradient>
	</Theme>;
};

mount(document.body, window.location.pathname === '/' ? <App /> : <NotFound />);
