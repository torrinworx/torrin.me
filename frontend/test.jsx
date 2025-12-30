import { Typography, Button, Head, Theme, Style, Icons, Icon, Stage, StageContext, Link } from 'destamatic-ui';
import IconifyIcons from "destamatic-ui/components/icons/IconifyIcons/IconifyIcons";

import fonts from './utils/fonts.js';
import theme from './utils/theme.js';
import Landing from './pages/Landing.jsx';

/*
Notes on theme and styles:

JetBrains Mono is used for headers, and any text used in inputs like button labels.

IBM Plex Sans is used for paragraph text.

Purposefully chose only three typography styles for simplicity:
h1: main hero style headers
h2: sub headers/content headers to be used inside text content
body: text body content

This drastically reduces the multiplicity of font sizes around the site that need to be
worried about.
*/


const config = {
	acts: {
		landing: Landing,
	},
	template: ({ children }) => children,
	ssg: true,
	initial: 'landing',
	urlRouting: true,
	fallback: 'fallback'
};

const test = () => <Theme value={theme}>
	<Icons value={[IconifyIcons]} >
		<Head>
			<Style>
				{fonts}
			</Style>
			<Link rel='icon' type='image/x-icon' href='/favicon.svg' />
		</Head>

		<StageContext value={config}>
			<div theme='column_center_fill'>
				<Stage />
				<div theme='row_center_fill_wrap_tight' style={{ padding: 40, maxWidth: 800 }}>
					<Typography style={{ textAlign: 'center' }} type='p1' label={`© Torrin Leonard ${new Date().getFullYear()} 🇨🇦 | Built with `} />
					<Button
						type='link'
						iconPosition='right'
						icon={<Icon name='feather:external-link' />}
						label='destamatic-ui'
						onClick={() => window.open('https://github.com/torrinworx/destamatic-ui', '_blank')}
						href='https://github.com/torrinworx/destamatic-ui'
					/>
				</div>
			</div>
		</StageContext>
	</Icons>
</Theme>;

export default test;
