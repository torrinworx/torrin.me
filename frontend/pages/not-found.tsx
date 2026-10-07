// The page for an address that names nothing: a tree on its own across the window, then the words.

import { Button, Icon, Typography, h } from '@aweftjs/ui';

import { Lost } from '../utils/forest.tsx';

export const NotFound = (): unknown => [
	<Lost />,
	<div theme="content" style={{ minHeight: '30vh' }}>
		<Typography type="h1" style={{ textAlign: 'center' }}>404 Page Not Found</Typography>
		<Typography type="p1" style={{ textAlign: 'center' }}>
			The page you are trying to access is either unavailable or restricted.
		</Typography>
		<Button
			label="Go Home"
			href="/"
			hrefNewTab={false}
			iconPosition="right"
			icon={<Icon name="feather:arrow-right" />}
		/>
	</div>,
];
