import { Button, Icon, Observer } from '@destamatic/ui';
import useShine from './Shine.jsx';

const Resume = ({ ...props }, cleanup, mounted) => {
    const downloadCheck = Observer.mutable(false);
    downloadCheck.watch(() => {
        if (downloadCheck.get()) {
            setTimeout(() => {
                downloadCheck.set(false);
            }, 5000);
        }
    });

    const [shines, createShine] = useShine();
    cleanup(Observer.timer(2000).watch(t => t.value % 2 === 0 && createShine()));
    mounted(() => createShine());

    return <Button
        {...props}
        title="Download Torrin Leonard's resume PDF."
        type={props.type || 'contained'}
        iconPosition='right'
        label={downloadCheck.map(c => c ? 'Downloaded!' : 'Resume')}
        icon={downloadCheck.map(c => c
            ? <Icon name='feather:check' />
            : <Icon name='feather:download' />)}
        onClick={() => {
            const a = document.createElement('a');
            a.href = 'Torrin_Leonard_Resume.pdf';
            a.download = 'Torrin_Leonard_Resume.pdf';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();

            downloadCheck.set(true);
        }}
    >
        {shines}
    </Button>;
};

export default Resume;
