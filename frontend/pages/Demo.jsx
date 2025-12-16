import { Observer, OObject, OArray } from 'destam';
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
    LoadingDots,
    Toggle,
    TextField,
    Shown,
    Date as DateComponent,
    TextArea,
    FileDrop,
    Radio,
    TextModifiers,
    RichField,
    RichArea,
    is_node,
    suspend,
} from 'destamatic-ui';

const Demo = StageContext.use(stage => ThemeContext.use(h => StageContext.use(s => () => {
    s.props.enabled.set(false);
    const examples = [
        {
            title: 'Buttons',
            category: 'inputs',
            description: 'Simple button components',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Button.jsx',
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
                    <Button type='contained' label='Contained' onClick={() => { }} />
                    <Button type='outlined' label='Outlined' onClick={() => { }} />
                    <Button type='text' label='Text' onClick={() => { }} />
                    <Button type='contained' iconPosition='right' label='Download' icon={<Icon name='download' size={'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)'} />} onClick={() => { }} />
                    <Button type='outlined' icon={<Icon name='upload' size={'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)'} />} onClick={() => { }} />
                    <Button type='outlined' icon={<LoadingDots />} onClick={() => { }} />
                    <Button
                        type='outlined'
                        iconPosition='right'
                        label={doneCheck.map(c => c ? 'Done!' : 'Delay')}
                        icon={doneCheck.map(c => c
                            ? <Icon name='check' style={{ fill: 'none' }} size={'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)'} />
                            : <Icon name='upload' style={{ fill: 'none', marginLeft: 5 }} size={'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)'} />)}
                        onClick={async () => new Promise(ok => setTimeout(() => { doneCheck.set(true); ok(); }, 800))}
                    />
                    <Button type='contained' label='Disabled' onClick={() => { }} disabled />
                </>
            },
        },
        {
            title: 'Checkboxes',
            category: 'inputs',
            description: '',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Checkbox.jsx',
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
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/ColorPicker.jsx',
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
                            <Typography type='h4' label='Hello World!' />
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
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Slider.jsx',
            component: () => {
                const sliderValue1 = Observer.mutable(50);
                const sliderValue2 = Observer.mutable(25);
                const sliderValue3 = Observer.mutable(75);

                return <>
                    <div theme='column_center'>
                        <Typography
                            type='h4'
                            label={Observer
                                .all([sliderValue1, sliderValue2, sliderValue3])
                                .map(([s1, s2, s3]) =>
                                    `${Math.trunc(s1)} ${Math.trunc(s2)} ${Math.trunc(s3)}`
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
            title: 'Toggle',
            category: 'inputs',
            description: 'Simple toggle/switch component.',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Toggle.jsx',
            component: () => {
                const toggle1 = Observer.mutable(false);
                const toggle2 = Observer.mutable(true);

                return <div
                    theme='column_center'
                    style={{
                        gap: 16,
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none',
                    }}
                >
                    <Typography
                        type='p1'
                        label={Observer
                            .all([toggle1, toggle2])
                            .map(([t1, t2]) =>
                                `${t1 ? '✅' : '❌'} | ${t2 ? '✅' : '❌'}`
                            )}
                    />

                    <div theme='row' style={{ gap: 20, alignItems: 'center' }}>
                        <div theme='column_center'>
                            <Typography
                                type='p2'
                                label={toggle1.map(v => `Default: ${v ? '🔓' : '🔒'}`)}
                            />
                            <Toggle value={toggle1} />
                        </div>

                        <div theme='column_center'>
                            <Typography
                                type='p2'
                                label={toggle2.map(v => `Primary: ${v ? '🌞' : '🌙'}`)}
                            />
                            <Toggle value={toggle2} type='primary' />
                        </div>

                        <div theme='column_center'>
                            <Typography type='p2' label='Disabled: 🚫' />
                            <Toggle value={Observer.immutable(true)} disabled />
                        </div>
                    </div>
                </div>;
            },
        },
        {
            title: 'Date',
            category: 'inputs',
            description: 'Scrollable date picker with theming and programmatic changes.',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Date.jsx',
            component: () => {
                const date = Observer.mutable(new Date());
                const fmt = d =>
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                return <div theme='column_center' style={{ gap: 10 }}>
                    <Typography
                        type='p1'
                        label={date.map(d => `Selected date: 📅 ${fmt(d)}`)}
                    />

                    <DateComponent value={date} />

                    <div theme='row' style={{ gap: 10 }}>
                        <Button
                            type='outlined'
                            label='Today'
                            onClick={() => date.set(new Date())}
                        />
                        <Button
                            type='contained'
                            label='Advance 1 year'
                            onClick={() => {
                                const d = new Date(date.get());
                                d.setFullYear(d.getFullYear() + 1);
                                date.set(d);
                            }}
                        />
                    </div>

                    <Typography
                        type='p2'
                        label={date.map(d => d.toString())}
                    />
                </div>;
            },
        },
        {
            title: 'TextField',
            category: 'inputs',
            description: 'Basic controlled text inputs with focus, and type variants.',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/TextField.jsx',
            component: () => {
                const text = Observer.mutable('');
                const password = Observer.mutable('');
                const focus = Observer.mutable(false);
                const submitted = Observer.mutable(false);
                const submit = () => {
                    submitted.set(true);
                    setTimeout(() => submitted.set(false), 1200);
                };

                return <div theme='column_center' style={{ gap: 16, maxWidth: 400 }}>
                    <Typography type='p1' label={text} />
                    <Shown value={submitted}>
                        <Typography
                            type='h4'
                            label='Submitted!'
                            style={{ textAlign: 'center' }}
                        />
                    </Shown>


                    <div theme='column_fill' style={{ gap: 10 }}>
                        <TextField
                            placeholder='Type something...'
                            value={text}
                            onEnter={submit}
                        />

                        <TextField
                            placeholder='Password'
                            type='password'
                            value={password}
                            onEnter={submit}
                        />

                        <div theme='row' style={{ gap: 10, alignItems: 'center' }}>
                            <TextField
                                placeholder='Click button to focus me'
                                value={Observer.mutable('')}
                                focus={focus}
                                onEnter={submit}
                            />
                            <Button
                                type='outlined'
                                label='Focus'
                                onClick={() => focus.set(true)}
                            />
                        </div>
                    </div>
                </div>;
            },
        },
        {
            title: 'TextArea',
            category: 'inputs',
            description: 'Multiline text input with auto-resize up to a max height.',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/TextArea.jsx',
            component: () => {
                const text = Observer.mutable('This is a multiline textarea.\nTry typing more to see it grow.');
                const focus = Observer.mutable(false);
                return <div theme='column_center' style={{ gap: 16, maxWidth: 500 }}>
                    <Typography
                        type='p2'
                        label={text.map(t => `Length: ${t.length}`)}
                    />

                    <TextArea
                        placeholder='Type your message here...'
                        value={text}
                        maxHeight={200}
                        style={{ width: '100%' }}
                    />

                    <div theme='row' style={{ gap: 10, alignItems: 'center' }}>
                        <TextArea
                            placeholder='Click "Focus" to focus me'
                            value={Observer.mutable('')}
                            focus={focus}
                            style={{ width: '100%' }}
                        />
                        <Button
                            type='outlined'
                            label='Focus'
                            onClick={() => focus.set(true)}
                        />
                    </div>
                </div>;
            },
        },
        {
            title: 'Map',
            // disabled: is_node(),
            disabled: true, // TODO: Fix async import issue because leaflet doesn't work with ssg.
            category: 'inputs',
            description: 'Interactive Leaflet map with click-to-set location, zoom controls, and geolocation fallback.',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Map.jsx',
            component: suspend(LoadingDots, async () => {
                let Map = (await import('destamatic-ui/components/inputs/Map')).default;
                const location = Observer.mutable({ lat: 43.4643, lng: -80.5204 });

                return <div theme='column_center' style={{ gap: 10, width: '100%' }}>
                    <Typography
                        type='p1'
                        label={location.map(loc =>
                            `Location: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
                        )}
                    />

                    <div style={{ width: '100%', height: '1000px', position: 'relative' }}>
                        <Map location={location} />
                    </div>

                    <div theme='row' style={{ gap: 10 }}>
                        <Button
                            type='outlined'
                            label='Reset'
                            onClick={() => location.set({ lat: 43.4643, lng: -80.5204 })}
                        />
                    </div>
                </div>;
            }),
        },
        {
            title: 'Radio',
            category: 'inputs',
            description: 'Single-select options using a shared Observer.',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/Radio.jsx',
            component: () => {
                const selected = Observer.mutable(1);
                const RadioGroup = Radio(selected);

                const options = [
                    { value: 0, label: 'Option A' },
                    { value: 1, label: 'Option B' },
                    { value: 2, label: 'Option C' },
                    { value: 3, label: 'No label example (icon only)' },
                ];

                return (
                    <div theme='column_center' style={{ gap: 16 }}>
                        <Typography
                            type='p1'
                            label={selected.map(v => `Selected: ${v}`)}
                        />

                        <div theme='column_fill' style={{ gap: 10 }}>
                            {options.map(o => (
                                <RadioGroup
                                    key={o.value}
                                    value={o.value}
                                    label={o.value === 3 ? null : o.label}
                                />
                            ))}
                        </div>

                        <div theme='row' style={{ gap: 10 }}>
                            <Button
                                type='outlined'
                                label='Select A'
                                onClick={() => selected.set(0)}
                            />
                            <Button
                                type='outlined'
                                label='Select C'
                                onClick={() => selected.set(2)}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'RichField',
            category: 'inputs',
            description: 'Rich text input with inline highlighting and live plain-text preview.',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/RichField.jsx',
            component: () => {
                const value = Observer.mutable('Try typing: TODO, @mention, #tag, *emphasis*, or !!strong!! text.');

                const modifiers = [
                    {
                        check: /\b(TODO|DONE)\b/g,
                        atomic: true,
                        return: match => (
                            <span
                                style={{
                                    display: 'inline-block',
                                    padding: '0 4px',
                                    borderRadius: 4,
                                    background: match === 'DONE' ? 'green' : 'orange',
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            >
                                {match}
                            </span>
                        ),
                    },
                    {
                        check: /@\w+/g,
                        atomic: false,
                        return: match => (
                            <span
                                style={{
                                    display: 'inline-block',
                                    color: 'blue',
                                    fontWeight: 500,
                                }}
                            >
                                {match}
                            </span>
                        ),
                    },
                    {
                        check: /#\w+/g,
                        atomic: false,
                        return: match => (
                            <span
                                style={{
                                    display: 'inline-block',
                                    color: 'green',
                                    fontWeight: 500,
                                }}
                            >
                                {match}
                            </span>
                        ),
                    },
                    {
                        check: /!!(.+?)!!/g,
                        atomic: false,
                        return: match => (
                            <span style={{ fontWeight: 700, display: 'inline-block' }}>
                                {match.slice(2, -2)}
                            </span>
                        ),
                    },
                    {
                        check: /\*(.+?)\*/g,
                        atomic: false,
                        return: match => (
                            <span style={{ fontStyle: 'italic', display: 'inline-block' }}>
                                {match.slice(1, -1)}
                            </span>
                        ),
                    },
                ];

                return <div theme='column_fill' style={{ gap: 12, maxWidth: 600 }}>
                    <Typography
                        type='p2'
                        label='Rich note editor: type TODO, @mentions, #tags, or *emphasis* / **strong**.'
                    />
                    <Paper theme='tight' style={{ padding: 10, gap: 0 }}>
                        <TextModifiers value={modifiers}>
                            <RichField value={value} type='p1' />
                        </TextModifiers>
                    </Paper>

                    <Typography
                        type='p2'
                        label='Raw value:'
                        style={{ marginTop: 4 }}
                    />
                    <Paper
                        theme='row_tight'
                        style={{
                            padding: 10,
                            maxWidth: '100%'
                        }}
                    >
                        <Typography type='p1' label={value} />
                    </Paper>
                </div>;
            },
        },
        {
            title: 'RichArea',
            category: 'inputs',
            description: 'Multiline rich text area with inline highlighting and live plain-text preview.',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/RichArea.jsx',
            component: () => {
                const value = Observer.mutable(
                    `Grocery list (try multi-line):

- TODO buy milk
- DONE grab coffee
- Ask @sam about #party
- Remember: *italics* and !!strong!! still work here.`
                );

                const modifiers = [
                    {
                        // TODO / DONE badges
                        check: /\b(TODO|DONE)\b/g,
                        atomic: true,
                        return: match => (
                            <span
                                style={{
                                    display: 'inline-block',
                                    padding: '0 4px',
                                    borderRadius: 4,
                                    background: match === 'DONE' ? 'green' : 'orange',
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            >
                                {match}
                            </span>
                        ),
                    },
                    {
                        // @mentions
                        check: /@\w+/g,
                        atomic: false,
                        return: match => (
                            <span
                                style={{
                                    display: 'inline-block',
                                    color: 'blue',
                                    fontWeight: 500,
                                }}
                            >
                                {match}
                            </span>
                        ),
                    },
                    {
                        // #tags
                        check: /#\w+/g,
                        atomic: false,
                        return: match => (
                            <span
                                style={{
                                    display: 'inline-block',
                                    color: 'green',
                                    fontWeight: 500,
                                }}
                            >
                                {match}
                            </span>
                        ),
                    },
                    {
                        // !!strong!!
                        check: /!!(.+?)!!/g,
                        atomic: false,
                        return: match => (
                            <span style={{ fontWeight: 700, display: 'inline-block' }}>
                                {match.slice(2, -2)}
                            </span>
                        ),
                    },
                    {
                        // *emphasis*
                        check: /\*(.+?)\*/g,
                        atomic: false,
                        return: match => (
                            <span style={{ fontStyle: 'italic', display: 'inline-block' }}>
                                {match.slice(1, -1)}
                            </span>
                        ),
                    },
                ];

                return <div theme='column_fill' style={{ gap: 12, maxWidth: 700 }}>
                    <Typography
                        type='p2'
                        label='RichArea: multiline rich text. Try new lines, TODO/DONE, @mentions, #tags, *italics*, and !!strong!!'
                    />

                    {/* Rich multiline area */}
                    <Paper
                        theme='tight'
                        style={{
                            padding: 10,
                            gap: 0,
                            width: '100%',
                            maxWidth: '100%',
                        }}
                    >
                        <TextModifiers value={modifiers}>
                            <RichArea
                                value={value}
                                placeholder='Type a multi-line rich note...'
                                maxHeight={200}
                            />
                        </TextModifiers>
                    </Paper>

                    {/* Raw text preview */}
                    <Typography
                        type='p2'
                        label='Raw value:'
                        style={{ marginTop: 4 }}
                    />
                    <Paper
                        theme='row_tight'
                        style={{
                            padding: 10,
                            maxWidth: '100%',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                        }}
                    >
                        <Typography type='p2' label={value} />
                    </Paper>
                </div>;
            },
        },
        { // TODO: Disable, this component needs work before displaying like this.
            title: 'FileDrop',
            disabled: true,
            category: 'inputs',
            description: 'Drag-and-drop file upload with optional loader and size limit.',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/inputs/FileDrop.jsx',
            component: () => {
                const files = OArray([]);
                const ready = Observer.mutable(null);

                const loader = (file, fileObj) => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            if (file.size > 1024 * 1024 * 2) { // > 2MB
                                reject('Simulated processing error (file too large for loader)');
                            } else {
                                resolve(`Loaded: ${file.name} (${file.size} bytes)`);
                            }
                        }, 1000);

                        resolve();
                    });
                };

                const limitBytes = 5 * 1024 * 1024;

                return <div theme='column_center' style={{ gap: 16, width: '100%' }}>
                    <Typography
                        type='p1'
                        label='Drop files here or click to browse.'
                    />

                    <Typography
                        type='p2'
                        label={ready.map(r => {
                            if (!r) return 'No fully ready files yet.';
                            if (Array.isArray(r)) {
                                return `Ready results (${r.length}):\n` + r.join('\n');
                            }
                            return `Ready result: ${r}`;
                        })}
                        style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}
                    />

                    <FileDrop
                        files={files}
                        extensions={['.png', '.jpg', '.jpeg', '.pdf']}
                        multiple
                        loader={loader}
                        limit={limitBytes}
                        ready={ready}
                        style={{ width: '100%', maxWidth: 500, minHeight: 120 }}
                        clickable={true}
                    />

                    <div theme='row' style={{ gap: 10 }}>
                        <Button
                            type='outlined'
                            label='Clear files'
                            onClick={() => {
                                files.splice(0, files.length);
                                ready.set(null);
                            }}
                        />
                    </div>
                </div>;
            },
        },
        {
            title: 'Typography',
            category: 'display',
            description: 'Type scale for headings and paragraphs.',
            componentUrl: 'https://github.com/torrinworx/destamatic-ui/blob/main/components/display/Typography.jsx',
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

    const Examples = ({ each }) => {
        const Comp = each.component;
        return <>
            <div theme='column_start_fill'>
                <div theme='row_start_fill'>
                    <Button
                        type='text'
                        label={<Typography type='h3' label={each.title} style={{ color: 'inherit' }} />}
                        icon={<Icon name='external-link' size={'clamp(1.75rem, 1.75vw + 0.875rem, 3rem)'} style={{ marginLeft: 5 }} />}
                        iconPosition='right'
                        href={each.componentUrl}
                        onClick={() => window.open(each.componentUrl, '_blank')}
                    />
                </div>
                <div theme='divider' />
                <div style={{ padding: '10px 15px 10px 15px' }}>
                    <Typography type='p1' label={each.description} />
                </div>
            </div>

            <div theme='row_fill_center' style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <Comp />
            </div>
        </>;
    };

    const focused = Observer.mutable('inputs');
    const categories = Array.from(new Set(examples.map(e => e.category)))

    const Category = ({ each }) => <Button
        label={String(each).charAt(0).toUpperCase() + String(each).slice(1)}
        focused={focused.map(f => f === each)}
        onClick={() => focused.set(each)}
    />

    return <>
        <div theme="row">
            <Button
                type="outlined"
                label="Back"
                onClick={() => stage.open({ name: 'landing' })}
                href="/"
            />
        </div>

        <Paper theme='column_fill_center'>

            <div theme='column_fill_center'>
                <Button
                    type='text'
                    label={<Typography type='h1' label='destamatic-ui' style={{ color: 'inherit' }} />}
                    icon={<Icon name='external-link' size={'clamp(1.75rem, 1.75vw + 0.875rem, 3rem)'} style={{ marginLeft: 5 }} />}
                    iconPosition='right'
                    href='https://github.com/torrinworx/destamatic-ui'
                    onClick={() => window.open('https://github.com/torrinworx/destamatic-ui', '_blank')}
                />
                <Typography type='p1' label='Snappy, light-weight, and comprehensive UI framework.' />
                <Typography type='p1' label='All the tools you could ever need for frontend development, and more.' />
            </div>

            <Paper theme='row_tight' style={{ padding: 10 }}>
                <Category each={categories} />
            </Paper>

            <Examples each={focused.map(f => examples.filter(ex => ex.category === f && !ex.disabled))} />
        </Paper>
    </>;
})));

export default Demo;
