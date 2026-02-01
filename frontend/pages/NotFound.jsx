import { Button, Typography, StageContext, Icon } from 'destamatic-ui';

const NotFound = StageContext.use(s => () => <div theme='content_col' style={{ height: '60vh' }}>
	<Typography type='h1' style={{ textAlign: 'center' }}>404 Page Not Found</Typography>
	<Typography type='p1' style={{ textAlign: 'center' }}>The page you are trying to access is either unavailable or restricted.</Typography>
	<Button
		type='contained'
		label='Go Home'
		onClick={() => s.open({ name: 'landing' })}
		iconPosition='right'
		icon={<Icon name='feather:arrow-right' />}
	/>
</div>);

export default NotFound;
