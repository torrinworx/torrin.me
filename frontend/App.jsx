import { Observer } from 'destam-dom';
import {
	Theme, Typography, Gradient, Icons, PopupContext,
	StageContext, Stage, Shown, Popup, is_node, Head,
	Title, Script, Style
} from 'destamatic-ui';

import Blog from './pages/Blog';
import Demo from './pages/Demo';
import theme from './utils/theme';
import Landing from './pages/Landing';
import Controls from './utils/Controls';
import NotFound from './pages/NotFound';
import Collision from './utils/Collision';

const enabled = Observer.mutable(true);
const pages = {
	acts: {
		landing: Landing,
		blog: Blog,
		fallback: NotFound,
		'destamatic-ui-demo': Demo,
	},
	template: ({ children }) => children,
	ssg: true,
	initial: 'landing',
	urlRouting: true,
	enabled,
	fallback: 'fallback'
};

const HeadTags = () => <>
	<Title text='Something' />
	
	<Style>
		{`
          /* Hide body content while we're "preloading" */
          html.preload body {
            visibility: hidden;
          }

          /* Explicit white background so users just see a blank screen */
          html.preload {
            background: #ffffff;
			}
		`}
	</Style>
	<Script type="module" crossorigin src="/index.js" />
</>

const App = () => <Head>
	<HeadTags />
	<Theme value={theme.theme}>
		<Icons value={theme.icons}>
			<PopupContext>
				<Gradient>
					<Shown value={enabled.map(e => e && !is_node())}>
						<Collision />
					</Shown>
					<StageContext value={pages}>
						<div theme='pages'>
							<Stage />
							<div theme='center_clear' >
								<Typography type='p2'> © Torrin Leonard {new Date().getFullYear()} 🇨🇦</Typography>
							</div>
							<Popup />
						</div>
					</StageContext>
				</Gradient>
				<Controls />
			</PopupContext>
		</Icons>
	</Theme>
</Head>;

export default App;
