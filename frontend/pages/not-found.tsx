import { Button, Icon, Typography, h } from '@aweftjs/ui';

export const NotFound = (): unknown => (
	<div theme="content" style={{ height: '60vh' }}>
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
	</div>
);
