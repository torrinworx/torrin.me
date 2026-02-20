import { Button, Icon, Observer } from '@destamatic/ui'

const Email = ({ type = 'outlined'}) => {
    const emailCheck = Observer.mutable(false);
    emailCheck.watch(() => {
        if (emailCheck.get()) {
            setTimeout(() => {
                emailCheck.set(false);
            }, 5000);
        }
    });

    return <Button
        type={type}
        title='Copy email to clipboard.'
        iconPosition='right'
        label={emailCheck.map(c => c ? 'Copied!' : 'Email')}
        icon={emailCheck.map(c => c
            ? <Icon name='feather:check' />
            : <Icon name='feather:copy' />)}
        onClick={async () => {
            emailCheck.set(true);
            await navigator.clipboard.writeText('torrin@torrin.me')
        }}
        loading={false}
    />;
};

export default Email;
