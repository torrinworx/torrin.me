import { mount, Observer } from 'destam-dom';
import { Button, Theme, Typography, Tabs, Radio, Switch, Checkbox } from 'destamatic-ui';

import theme from './theme';
import Personal from './components/Personal';
import Portfolio from './components/Portfolio';
import Collision from './components/Collision';
import Gradient from './components/Gradient';

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
    const colors = [
        { label: 'Red', value: 'red' },
        { label: 'Purple', value: 'purple' },
        { label: 'Cyan', value: 'cyan' },
        { label: 'Gold', value: 'gold' },
    ];

    return <Theme value={theme}>
        <Gradient>
            <Collision>
                <Switch
                    value={Observer.mutable(true)}
                    onChange={isChecked => {
                        window.themeMode.set(isChecked ? 'dark' : 'light');
                    }}
                />
                <Checkbox value={Observer.mutable(false)} />
                <Radio items={colors} value={window.colorMode} />
                <Typography type='h5'>HI THERE</Typography>
                <Tabs style={{ width: '100%' }}>
                    <mark:tab name='Portfolio'>
                        <Portfolio />
                    </mark:tab>
                    <mark:tab name='Personal'>
                        <Personal />
                    </mark:tab>
                </Tabs>
            </Collision>
        </Gradient>
    </Theme>;
};


mount(document.body, window.location.pathname === '/' ? <App /> : <NotFound />);
