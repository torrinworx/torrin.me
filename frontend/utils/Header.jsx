import { Button, Icon, StageContext, Shown } from '@destamatic/ui';
import Hamburger from './Hamburger.jsx';
import Email from './Email.jsx';
import Resume from './Resume.jsx';

// TODO: json-ld, link/meta/title tags etc.

const Header = StageContext.use(s => () => {
    // Get the root stage (for navigation and visibility check)
    const getRootStage = (stage) => {
        let root = stage;
        while (root.parent && typeof root.parent === 'object') {
            root = root.parent;
        }
        return root;
    };

    const rootStage = getRootStage(s);

    return <Shown value={s.observer.path('current').map(c => c != 'destamatic-ui')}>
        <div theme='row_fill_spread_end_content'>
            <Hamburger>
                <div theme='column_tight' style={{ gap: 5, minWidth: 150 }}>
                    <Button
                        type='text'
                        title='Go to home'
                        label='Home'
                        icon={<Icon name='feather:home' />}
                        iconPosition='right'
                        onClick={() => rootStage.open({ name: 'landing' })}
                        href='/'
                    />
                    <Resume type='text' />
                    <Button
                        type='text'
                        title='Get in touch'
                        label='Contact'
                        icon={<Icon name='feather:mail' />}
                        iconPosition='right'
                        onClick={() => rootStage.open({ name: 'contact' })}
                        href='/contact'
                    />
                    <Button
                        type='text'
                        title='Freelance services'
                        label='Freelance'
                        icon={<Icon name='feather:briefcase' />}
                        iconPosition='right'
                        onClick={() => rootStage.open({ name: 'freelance' })}
                        href='/freelance'
                    />
                    <Button
                        type='text'
                        title='Read blog posts'
                        label='Blog'
                        icon={<Icon name='feather:book-open' />}
                        iconPosition='right'
                        onClick={() => rootStage.open({ name: 'blog' })}
                        href='/blog'
                    />
                    <Button
                        type='text'
                        title="Torrin Leonard's Github"
                        label='GitHub'
                        icon={<Icon name='feather:github' />}
                        iconPosition='right'
                        onClick={() => window.open('https://github.com/torrinworx', '_blank')}
                        href='https://github.com/torrinworx'
                    />
                    <Email type='text' />
                </div>
            </Hamburger>
        </div>
    </Shown>;
});

export default Header;
