import React from 'react';
import { createRoot } from 'react-dom/client';

import Routes from "./Routes";
import { ThemeWrapper } from "./Theme";

export const App = () => {
    return <ThemeWrapper>
        <Routes />
    </ThemeWrapper>
};

const rootElement = document.getElementById('root');
createRoot(rootElement).render(<App />);
