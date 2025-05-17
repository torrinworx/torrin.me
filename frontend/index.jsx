import { mount, Observer } from 'destam-dom';
import { Button, Theme, Typography, Radio, Toggle, Paper, Gradient, TextField } from 'destamatic-ui';

import theme from './theme';
import Portfolio from './components/Portfolio';
import Collision from './components/Collision';

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
			{/* somehow have to make this render below the child content but the mount() in this waits and makes it render after the below is already rendered. */}
			<Collision />
			<div theme='center' style={{ paddingTop: 20, userSelect: 'none' }}>
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

				<Paper>
					<Typography type='h5' label='UI Component Test:' />

					<Typography type='h1' label='Header 1' />
					<Typography type='h1' label='Header 2' />
					<Typography type='h1' label='Header 3' />
					<Typography type='h1' label='Header 4' />
					<Typography type='h1' label='Header 5' />
					<Typography type='h1' label='Header 6' />
					<Typography type='h1' label='Paragraph 1' />
					<Typography type='h1' label='Paragraph 2' />
					<Typography type='p1_regular' label='Paragraph 1 Regular' />
					<Typography type='p1_bold' label='Paragraph 1 Bold' />
					<Typography type='p1_italic' label='Paragraph 1 Italic' />
					<div theme='row' style={{ gap: 10 }}>
						<Button type='contained' label='Button' onClick={() => { }} />
						<Button type='outlined' label='Button' onClick={() => { }} />
						<Button type='text' label='Button' onClick={() => { }} />
					</div>
					<div theme='column' style={{ gap: 10 }} >
						<TextField placeholder='Email' value={Observer.mutable('')} />
						<TextField />
						<TextField />
					</div>
					<Toggle value={Observer.mutable(false)} />
				</Paper>
			</div>
		</Gradient>
	</Theme>;
};

mount(document.body, window.location.pathname === '/' ? <App /> : <NotFound />);
