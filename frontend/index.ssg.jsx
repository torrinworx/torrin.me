import App from './App';
import { render } from '@destamatic/ui';

export const renderAppToString = async () => {
	return await render(App);
};
