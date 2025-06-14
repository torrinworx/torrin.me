import { Paper, Radio, Toggle } from 'destamatic-ui';
import theme from '../theme';

theme.define({

})

const Controls = () => {
    const SelectRadio = Radio(window.colorMode);

    return <div
        theme='center'
        style={{
            paddingTop: 20,
            userSelect: 'none',
            position: 'sticky',
            top: 0,
        }}
    >
        <Paper style={{ padding: 0 }}>
            <div theme='center_row' style={{ padding: 10, gap: 10 }}>
                <SelectRadio theme='red' value={'red'} />
                <SelectRadio theme='purple' value={'purple'} />
                <SelectRadio theme='cyan' value={'cyan'} />
                <SelectRadio theme='gold' value={'gold'} />
                <Toggle value={window.themeMode} />
            </div>
        </Paper>
    </div>;
};

export default Controls
