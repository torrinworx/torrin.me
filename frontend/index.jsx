import { mount, Observer } from 'destam-dom';
import { Button, Theme, Typography, Tabs, Radio } from 'destamatic-ui';

import theme from './theme';
import Personal from './components/Personal';
import Portfolio from './components/Portfolio';
import Collision from './components/Collision';
import Wrap from './components/Wrap';

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
    const currentTheme = Observer.mutable('light')
    const themes = [
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' },
    ];

    currentTheme.watch(() => {
        window.themeMode.set(currentTheme.get());
        console.log(window.themeMode.get());
    });

    return <Theme value={theme}>
        <Collision>
            <Wrap>
                <Radio items={themes} value={currentTheme} />

                <Tabs style={{ width: '100%' }}>
                    <mark:tab name='Portfolio'>
                        <Portfolio />
                    </mark:tab>
                    <mark:tab name='Personal'>
                        <Personal />
                    </mark:tab>
                </Tabs>
            </Wrap>
        </Collision>
    </Theme >;
};

mount(document.body, window.location.pathname === '/' ? <App /> : <NotFound />);
