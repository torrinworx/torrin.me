import App from './App';
import { mount } from 'destam-dom';
import { wipe } from 'destamatic-ui';

wipe()
mount(document.body, <App />);
