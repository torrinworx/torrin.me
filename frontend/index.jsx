import { mount } from 'destam-dom';
import { Button, Theme, Typography } from 'destamatic-ui';

import theme from './theme';

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
    return <Theme value={theme}>
        Hello World!
    </Theme>;
};

mount(document.body, window.location.pathname === '/' ? <App /> : <NotFound />);
