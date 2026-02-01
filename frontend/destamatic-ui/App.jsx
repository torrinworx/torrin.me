import {
	Theme,
	Icons,
	Stage,
	StageContext,
} from 'destamatic-ui';
import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";

import Demo from './pages/Demo.jsx';
import Landing from './pages/Landing.jsx';

import theme from '../utils/theme.js';
import NotFound from '../pages/NotFound.jsx';

const stage = {
	acts: {
		landing: Landing,
		demo: Demo,
		fallback: NotFound,
	},
	onOpen: () => {
		window.scrollTo(0, 0);
	},
	template: ({ children }) => children,
	ssg: true,
	initial: 'landing',
	urlRouting: true,
	fallback: 'fallback',
	truncateInitial: true,
};

const App = () => <Theme value={theme}>
	<Icons value={[IconifyIcons]} >
		<StageContext value={stage}>
			<Stage />
		</StageContext>
	</Icons>
</Theme>;

export default App;
