import { Button, Typography, StageContext } from 'destamatic-ui';

const NotFound = StageContext.use(s => () => <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
	<Typography type='h4' style={{ marginBottom: '20px' }}>404 Page Not Found</Typography>
	<Typography type='p1' style={{ marginBottom: '20px' }}>The page you are trying to access is either unavailable or restricted.</Typography>
	<Button type='outlined' label='Go back' onClick={() => s.open({ name: 'landing' })} />
</div>);

export default NotFound;
