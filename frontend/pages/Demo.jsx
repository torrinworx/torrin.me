import { Observer, OObject } from 'destam';
import color from 'destamatic-ui/util/color';
import { StageContext, Paper, Typography, Button, Icon, ColorPicker, Checkbox, Slider, Theme, ThemeContext, Country, Shown, Select } from 'destamatic-ui';

const Demo = ThemeContext.use(h => StageContext.use(s => () => {
    s.props.enabled.set(false);

    // Button
    const doneCheck = Observer.mutable(false);
    doneCheck.watch(() => {
        if (doneCheck.get()) {
            setTimeout(() => {
                doneCheck.set(false);
            }, 5000);
        }
    });

    // Checkbox
    const checkboxCount = Observer.mutable(0);

    // Color Picker
    const specialTheme = OObject({
        special: OObject({
            $color_text: '$contrast_text($color)'
        })
    });

    // Slider
    const sliderValue1 = Observer.mutable(50);
    const sliderValue2 = Observer.mutable(25);
    const sliderValue3 = Observer.mutable(75);

    // Country
    const value = Observer.mutable(null);
    const country = Observer.mutable(null);
    country.watch(() => console.log('country: ', country.get()));

    const region = Observer.mutable(null);
    region.watch(() => console.log('region: ', region.get()));

    return <>
        <Paper theme='column_fill_center'>
             <Country value={value} type='contained' country={country} placeholder='Select a Country' />

            <div theme='column_fill_center'>
                <Typography type='h1' label='destamatic-ui' />
                <Typography type='p1' label='Fast, snappy, and reactive ui framework.' />
                <Typography type='p1' label='All the componentes you could ever need.' />
            </div>
            <div theme='column_start_fill'>
                <Typography type='h1' label='Inputs' />
            </div>
            <div theme='divider' />
            <div theme='column_start_fill'>
                <Typography type='h4' label='Buttons' />
            </div>
            <div theme='row_fill_center' style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
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
                    onClick={async () => new Promise(ok => setTimeout(() => { doneCheck.set(true); ok() }, 100000000))}
                />
            </div>
            <div theme='column_start_fill'>
                <Typography type='h4' label={checkboxCount.map(c => `CheckBoxes - ${c}`)} />
            </div>
            <div theme='row_fill_center' style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {Array.from({ length: 19 }).map(() => <Checkbox value={Observer.mutable(false)} onChange={val => {
                    if (val) checkboxCount.set(checkboxCount.get() + 1);
                    else checkboxCount.set(checkboxCount.get() - 1);
                }} />)}
            </div>
            <div theme='column_start_fill'>
                <Theme value={specialTheme}>
                    <ThemeContext value="special">
                        <Typography type='h4' label='ColorPicker' />
                    </ThemeContext>
                </Theme>
            </div>
            <div theme='row_fill_center' style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <ColorPicker value={specialTheme.observer.path(['special', '$color_text']).setter((val, set) => set(color.toCSS(val)))} />
                <ColorPicker value={specialTheme.observer.path(['special', '$color_text']).setter((val, set) => set(color.toCSS(val)))} />
                <ColorPicker value={specialTheme.observer.path(['special', '$color_text']).setter((val, set) => set(color.toCSS(val)))} />
            </div>
            <div theme='column_start_fill'>
                <Typography type='h4' label={Observer.all([sliderValue1, sliderValue2, sliderValue3]).map(([s1, s2, s3]) => `Slider - ${Math.trunc(s1)} ${Math.trunc(s2)} ${Math.trunc(s3)}`)} />
            </div>
            <div theme='column_fill' style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <Slider min={0} max={100} value={sliderValue1} />
                <Slider min={0} max={100} value={sliderValue2} />
                <Slider min={0} max={100} value={sliderValue3} />
            </div>


            <div theme='column_start_fill'>
                <Typography type='h4' label='Country' />
            </div>
            <div theme='column_fill_center'>
                <Typography type='h4' label='Country' />
                <Country value={value} type='contained' country={country} placeholder='Select a Country' />

                <Shown value={country.map(c => {
                    region.set('Select a Region');
                    return c && Array.isArray(c[2]);
                })}>
                    <Typography type='h4' label='Region' />
                    <Select
                        type='contained'
                        placeholder='Select Region'
                        value={region}
                        options={country.map(c => c[2].map(r => r[0]))} // we set region to the string, but r contains region name and code: ['Ontario', 'ON']
                    />
                </Shown>
            </div>









            <div theme='column_start_fill'>
                <Typography type='h1' label='Display' />
            </div>
            <div theme='divider' />
            <div theme='column_start_fill'>
                <Typography type='h4' label='Typography' />
                <Typography type='p1' >Robust typography support for universal font orgnaization and theming accross your frontend stack.</Typography>
            </div>
            <div theme='column_fill_center'>
                <Typography type='h2' label='Typography' />
                <Typography type='h3' label='Typography' />
                <Typography type='h4' label='Typography' />
                <Typography type='h5' label='Typography' />
                <Typography type='h6' label='Typography' />
                <Typography type='p1' label='Typography' />
                <Typography type='p2' label='Typography' />
            </div>


            <div theme='column_start_fill'>
                <Typography type='h1' label='icons' />
            </div>
            <div theme='divider' />
            <div theme='column_start_fill'>
                <Typography type='h1' label='Navigation' />
            </div>
            <div theme='divider' />
            <div theme='column_start_fill'>
                <Typography type='h1' label='Utils' />
            </div>
            <div theme='divider' />
        </Paper>
    </>;
}));

export default Demo;
