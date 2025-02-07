import OArray from 'destam/Array';
import { mount, Observer } from 'destam-dom';
import { Button, Theme, Typography, Tabs, Radio, Toggle, Paper } from 'destamatic-ui';

import theme from './theme';
import Personal from './components/Personal';
import Portfolio from './components/Portfolio';
// import Collision from './components/Collision';
import Gradient from './components/Gradient';

const keywords = OArray([]);

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

const App = ({ ws }) => {
	const SelectRadio = Radio(window.colorMode);

	return <Theme value={theme.theme}>
		<Gradient>
			{/* <Collision> */}
			<div style={{
				padding: 40,
				gap: 40,
				display: 'flex',
				flexDirection: 'column',
			}}>
				<Paper>
					<div theme='center_row' style={{ gap: 8 }}>
						<SelectRadio style={{ color: '$color_red' }} value={'red'} />
						<SelectRadio style={{ color: '$color_purple' }} value={'purple'} />
						<SelectRadio style={{ color: '$color_cyan' }} value={'cyan'} />
						<SelectRadio style={{ color: '$color_gold' }} value={'gold'} />
						<Toggle
							value={Observer.mutable(true)}
							onChange={isChecked => {
								window.themeMode.set(isChecked ? 'dark' : 'light');
							}}
						/>
					</div>
				</Paper>
				<Paper>
					<Tabs style={{ width: '100%' }}>
						<mark:tab name='Personal'>
							<Personal ws={ws} keywords={keywords} />
						</mark:tab>
						<mark:tab name='Portfolio'>
							<Portfolio />
						</mark:tab>
					</Tabs>
				</Paper>
			</div>
			{/* </Collision> */}
		</Gradient>
	</Theme>;
};

window.addEventListener("load", () => {
	const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
	const wsURL = `${protocol}${window.location.hostname}:${window.location.port}`;
	const ws = new WebSocket(wsURL);

	ws.addEventListener('open', () => {
		mount(document.body, window.location.pathname === '/' ? <App ws={ws} /> : <NotFound />);
	});

	ws.addEventListener('message', msg => {
		const message = JSON.parse(msg.data);
		if (message.keywords) keywords.push(...message.keywords);
	});
});
