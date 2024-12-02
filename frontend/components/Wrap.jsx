import { Observer } from "destam-dom";
import { Theme } from "destamatic-ui";

export default Theme.use(theme => ({ children }) => {
    const primaryColor = theme('primary').vars('color');
    const secondaryColor = theme('secondary').vars('color');

    return <div style={{
        padding: '20px',
        background: Observer.all([primaryColor, secondaryColor]).map(([p, s]) => {
            return `linear-gradient(to top right, ${p}, ${s})`
        })
    }}>
        {children}
    </div>;
});
