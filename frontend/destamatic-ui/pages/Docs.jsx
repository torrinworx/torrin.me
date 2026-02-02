import { Typography, Icon, Button, LoadingDots, suspend } from 'destamatic-ui';

import useShine from '../../utils/Shine.jsx';
import JsxBlock from '../utils/JsxBlock.jsx';
import Paper from '../../utils/Paper.jsx';
import OnlinePulse from '../../utils/OnlinePulse.jsx';

const Docs = suspend(LoadingDots, async () => {
	const Release = suspend(LoadingDots, async () => {
		const release = await fetch(`https://api.github.com/repos/torrinworx/destamatic-ui/releases/latest`)
			.then(response => response.json());

		return <Button inline type='link' label={`${release.tag_name}`} href='https://github.com/torrinworx/destamatic-ui/releases/latest' />
	})

	const docs = await fetch('/destamatic-ui/docs/index.json')
	// console.log(docs);


	return <>
		<div theme='content_col' style={{ gap: 200 }}>
			<div theme='row_center' style={{ gap: 10 }}>
				<OnlinePulse />
				<Typography type="p1" label='Live now' />
				<Icon name="feather:zap" size={16} />
				<Release />
			</div>
		</div>

	</>;
});

export default Docs;
