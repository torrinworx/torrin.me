import {
    StageContext,
    Typography,
    Button,
    Icon,
    ThemeContext,

    DropDown,
} from 'destamatic-ui';

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
        >
            <ExampleComp globalTheme={s.props._theme} />
        </DropDown>;
    };


    return <>
            <div
                theme="column_fill_center"
                style={{ gap: 20 }}
            >
                <div theme="column_fill_center" style={{ gap: 12 }}>
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

                <div theme="row" style={{ gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {/* <Button
                        type="contained"
                        label="Try in the browser"
                        href="/destamatic-ui/playground"
                        onClick={() => {
                            s.open({ name: 'playground' })
                        }}
                        icon={
                            <Icon
                                name="feather:terminal"
                                size="clamp(0.85rem, 0.85vw + 0.4rem, 1.4rem)"
                                style={{ marginLeft: 4 }}
                            />
                        }
                        iconPosition="right"

                    /> */}
                    <Button
                        type="outlined"
                        label="GitHub"
                        href="https://github.com/torrinworx/destamatic-ui"
                        onClick={() =>
                            window.open('https://github.com/torrinworx/destamatic-ui', '_blank')
                        }
                        icon={
                            <Icon
                                name="feather:github"
                                size="clamp(0.85rem, 0.85vw + 0.4rem, 1.4rem)"
                                style={{ marginRight: 4 }}
                            />
                        }
                        iconPosition="left"
                    />
                    <Button
                        type="outlined"
                        label="Discord"
                        href="https://discord.gg/BJMPpVwdhz"
                        onClick={() =>
                            window.open('https://discord.gg/BJMPpVwdhz', '_blank')
                        }
                        icon={
                            <Icon
                                name="simpleIcons:discord"
                                size="clamp(0.85rem, 0.85vw + 0.4rem, 1.4rem)"
                                style={{ marginRight: 4 }}
                            />
                        }
                        iconPosition="left"
                    />
                </div>
            </div>

            <div theme='column_fill' style={{
                height: '100%',
                minHeight: '100vh'
            }}>
                <Examples each={examples} />
            </div>
    </>;
}));

export default Demo;
