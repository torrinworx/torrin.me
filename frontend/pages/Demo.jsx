import { Observer, OObject } from 'destam';
import color from 'destamatic-ui/util/color';
import {
    StageContext,
    Paper,
    Typography,
    Button,
    Icon,
    ColorPicker,
    Checkbox,
    Slider,
    Theme,
    ThemeContext,
    // TextField,
    TextModifiers,
    Title,
} from 'destamatic-ui';

const Demo = ThemeContext.use(h => StageContext.use(s => () => {
    s.props.enabled.set(false);
    const examples = [
        {
            title: 'Buttons',
            category: 'inputs',
            description: '',
            component: () => {
                const doneCheck = Observer.mutable(false);
                doneCheck.watch(() => {
                    if (doneCheck.get()) {
                        setTimeout(() => {
                            doneCheck.set(false);
                        }, 1200);
                    }
                });

                return <>
                    <Button type='contained' label='Click me' onClick={() => { }} />
                    <Button type='outlined' label='Click me' onClick={() => { }} />
                    <Button type='text' label='Click me' onClick={() => { }} />
                    <Button type='contained' iconPosition='right' label='Download' icon={<Icon name='download' size={'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)'} />} onClick={() => { }} />
                    <Button type='outlined' icon={<Icon name='upload' size={'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)'} />} onClick={() => { }} />
                    <Button
                        type='outlined'
                        iconPosition='right'
                        label={doneCheck.map(c => c ? 'Done!' : 'Delay')}
                        icon={doneCheck.map(c => c
                            ? <Icon name='check' style={{ fill: 'none' }} size={'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)'} />
                            : <Icon name='upload' style={{ fill: 'none', marginLeft: 5 }} size={'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)'} />)}
                        onClick={async () => new Promise(ok => setTimeout(() => { doneCheck.set(true); ok(); }, 800))}
                    />
                </>
            },
        },
        {
            title: 'Checkboxes',
            category: 'inputs',
            description: '',
            component: () => {
                const checkboxCount = Observer.mutable(0);
                const boxes = Array.from({ length: 10 }).map(() =>
                    Observer.mutable(false)
                );

                return <div theme='column_center'>
                    <Typography
                        type='p1'
                        label={checkboxCount.map(c => `Boxes checked: ${c}`)}
                    />

                    <div theme='row'>
                        {boxes.map(box =>
                            <Checkbox
                                value={box}
                                onChange={val => {
                                    if (val) {
                                        checkboxCount.set(checkboxCount.get() + 1);
                                        setTimeout(() => {
                                            if (box.get()) {
                                                box.set(false);
                                                checkboxCount.set(checkboxCount.get() - 1);
                                            }
                                        }, 2500);
                                    } else {
                                        checkboxCount.set(checkboxCount.get() - 1);
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>;
            },
        },
        {
            title: 'ColorPicker',
            category: 'inputs',
            description: '',
            component: () => {
                const specialTheme = OObject({
                    special: OObject({
                        transition: 'none',
                        $color_text: '$contrast_text($color)'
                    })
                });

                return <div theme='column_center'>
                    <Theme value={specialTheme}>
                        <ThemeContext value="special">
                            <Typography type='h4' label='Hello World !' />
                        </ThemeContext>
                    </Theme>

                    <div theme='row_fill_center' style={{ gap: 20 }}>
                        <ColorPicker value={specialTheme.observer.path(['special', '$color_text']).setter((val, set) => set(color.toCSS(val)))} />
                        <ColorPicker value={specialTheme.observer.path(['special', '$color_text']).setter((val, set) => set(color.toCSS(val)))} />
                        <ColorPicker value={specialTheme.observer.path(['special', '$color_text']).setter((val, set) => set(color.toCSS(val)))} />
                    </div>
                </div>
            },
        },
        {
            title: 'Sliders',
            category: 'inputs',
            description: '',
            component: () => {
                const sliderValue1 = Observer.mutable(50);
                const sliderValue2 = Observer.mutable(25);
                const sliderValue3 = Observer.mutable(75);

                return <>
                    <div theme='column_start_fill'>
                        <Typography
                            type='h4'
                            label={Observer
                                .all([sliderValue1, sliderValue2, sliderValue3])
                                .map(([s1, s2, s3]) =>
                                    `Slider - ${Math.trunc(s1)} ${Math.trunc(s2)} ${Math.trunc(s3)}`
                                )}
                        />
                    </div>
                    <div
                        theme='column_fill'
                        style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}
                    >
                        <Slider min={0} max={100} value={sliderValue1} />
                        <Slider min={0} max={100} value={sliderValue2} />
                        <Slider min={0} max={100} value={sliderValue3} />
                    </div>
                </>;
            },
        },
        {
            title: 'Typography',
            category: 'display',
            description: 'Type scale for headings and paragraphs.',
            component: () => {
                return <div theme='column_fill_center'>
                    <Typography type='h2' label='Typography' />
                    <Typography type='h3' label='Typography' />
                    <Typography type='h4' label='Typography' />
                    <Typography type='h5' label='Typography' />
                    <Typography type='h6' label='Typography' />
                    <Typography type='p1' label='Typography' />
                    <Typography type='p2' label='Typography' />
                </div>;
            },
        },
    ];

    const Examples = ({ each }) => { // TODO: It would be overengineering but it would be cool to have a live playground text area for each of these.

        const Comp = each.component;
        return <>
            <div theme='column_start_fill'>
                <Typography type='h4' label={each.title} />
                <Typography type='p1' label={each.description} />
            </div>

            <div theme='row_fill_center' style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <Comp />
            </div>
        </>;
    };

    return <>
        <Paper theme='column_fill_center'>
            <div theme='column_fill_center'>
                <Typography type='h1' label='destamatic-ui' />
                <Typography type='p1' label='Snappy, light-weight, and comprehensive UI framework.' />
                <Typography type='p1' label='All the tools you could ever need for frontend development, and more.' />
            </div>

            <Examples each={examples} />

        </Paper>
    </>;
}));

export default Demo;
