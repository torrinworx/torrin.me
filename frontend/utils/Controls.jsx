import { Paper, Toggle, Radio } from 'destamatic-ui';

const Controls = () => {
	const SelectRadio = Radio(window.colorMode);

	return <div
		theme='center_wide'
		style={{
			paddingTop: 20,
			position: 'fixed',
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

export default Controls;
