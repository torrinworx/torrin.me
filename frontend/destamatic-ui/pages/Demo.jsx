import {
    StageContext,
    Typography,
    Icon,
    ThemeContext,

    DropDown,
} from '@destamatic/ui';

const Demo = ThemeContext.use(h => StageContext.use(s => () => {
    const examples = Object.values(
        import.meta.glob(
            '../../../destamatic-ui/components/**/**/*.example.jsx',
            { eager: true }
        )
    ).map(e => e.default);

    const Examples = ({ each: example }) => {
        const { header, example: ExampleComp } = example;

        return <DropDown
            open={example.open}
            label={<Typography type="p1" label={header} />}
            iconOpen={<Icon name="feather:chevron-up" />}
            iconClose={<Icon name="feather:chevron-down" />}
            style={{width: '100%'}}
        >
            <ExampleComp globalTheme={s.props._theme} />
        </DropDown>;
    };

    return <>
        <div
            theme="content_col"
            style={{ gap: 20 }}
        >
            <div theme="content_col" style={{ gap: 12 }}>
                <Typography
                    type="h1"
                    label="destamatic-ui"
                    style={{ color: '$color' }}
                />

                <Typography
                    style={{ textAlign: 'center' }}
                    type="p1"
                    label="A batteries-included frontend framework built on fine-grained Observers."
                />
                <Typography
                    style={{ textAlign: 'center' }}
                    type="p1"
                    label="No React, no VDOM, no Next, no Redux. Just fast DOM updates, integrated components, routing, SSG/SEO, theming, and rich text in one lightweight stack."
                />
                <Typography
                    style={{ textAlign: 'center' }}
                    type="p1"
                    label="Used in production for 5+ years at Equator Studios and across personal projects."
                />
            </div>
        </div>

        <div theme='content_col' style={{
            height: '100%',
            minHeight: '100vh'
        }}>
            <Examples each={examples} />
        </div>
    </>;
}));

export default Demo;
