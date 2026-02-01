import { Observer } from 'destamatic-ui';
import { Theme, ThemeContext, Typography, TextModifiers } from 'destamatic-ui';

import { modifiers, codeColours } from './JsxModifiers.jsx';

Theme.define({
	codeBlock: {
		borderRadius: 16,
		overflow: 'hidden',
		background: '#0b1020',
		boxShadow: '0 18px 60px $alpha($color_top, 0.25)',
	},

	codeBlockBar: {
		padding: '10px 12px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10,
		background: '#0b1020',
	},

	codeBlockDots: {
		display: 'flex',
		gap: 8,
		alignItems: 'center',
	},

	codeDot: {
		width: 15,
		height: 15,
		borderRadius: 999,
		background: 'rgba(255,255,255,0.25)',
	},

	codeBlockBody: {
		padding: 14,
		background: '#0b1020',
	},
});

const Dots = () =>
	<div theme="codeBlockDots">
		<div theme="codeDot" style={{ background: '#ff5f57' }} />
		<div theme="codeDot" style={{ background: '#febc2e' }} />
		<div theme="codeDot" style={{ background: '#28c840' }} />
	</div>;

const JsxBlock = ThemeContext.use(h => ({ code, style }) => {
	if (!(code instanceof Observer)) code = Observer.mutable(String(code ?? ''));

	const copied = Observer.mutable(false);
	copied.watch(() => {
		if (copied.get()) setTimeout(() => copied.set(false), 1200);
	});

	return <div theme="codeBlock" style={style}>
		<div theme="codeBlockBar">
			<Dots />
		</div>
		<div theme="codeBlockBody">
			<TextModifiers value={modifiers}>
				<Typography
					type="p2"
					style={{
						color: codeColours.fg,
						fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
					}}
					label={code}
				/>
			</TextModifiers>
		</div>
	</div>;
});

export default JsxBlock;
