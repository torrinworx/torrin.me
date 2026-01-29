import { Typography, StageContext } from 'destamatic-ui';
import Contact from '../utils/Contact.jsx';

const ContactPage = StageContext.use(s => () => {
    return <>
        <div theme="column_center_fill_start">
            <Typography
                theme="row_fill_start"
                type="h1"
                label="Contact"
            />
            <Typography
                theme="row_fill_start"
                type="p1"
                label="Get in touch with Torrin Leonard."
            />
        </div>
        <Contact />
    </>;
});

export default ContactPage;
