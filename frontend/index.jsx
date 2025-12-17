import App from './App';
import { wipe, mount } from 'destamatic-ui';

wipe()
mount(document.body, <App />);
