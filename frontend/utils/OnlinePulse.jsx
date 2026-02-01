import { Theme } from 'destamatic-ui';

Theme.define({
	pulseDot: {
		position: 'relative',
		display: 'inline-block',
		width: '10px',
		height: '10px',
		borderRadius: '999px',
		flex: '0 0 auto',

		_keyframes_opacityAnimation: `
      0% { opacity: 0; }
      100% { opacity: 1; }
    `,
		animationName: '$opacityAnimation',
		animationDuration: '1s',
		animationTimingFunction: 'linear',
		animationFillMode: 'both',

		_keyframes_pulseAnimation: `
      0%   { transform: translate(-50%, -50%) scale(0); opacity: .8; }
      70%  { transform: translate(-50%, -50%) scale(3); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    `,
		_cssProp_before: {
			content: '""',
			position: 'absolute',
			top: '50%',
			left: '50%',
			width: '100%',
			height: '100%',
			borderRadius: '999px',

			background: 'currentColor',
			opacity: 0.5,

			animationName: '$pulseAnimation',
			animationDuration: '3s',
			animationIterationCount: 'infinite',
			animationTimingFunction: 'ease-out',
		},
	},

	pulseDot_green: {
		background: '#00e600',
		color: '#00e600',
	},

	pulseDot_orange: {
		background: '#ff9900',
		color: '#ff9900',
	},

	pulseDot_red: {
		background: '#e60000',
		color: '#e60000',
	},
})


const OnlinePulse = ({ type = 'green' }) => <span theme={['pulseDot', type]} style={{ marginLeft: 'auto' }} />


export default OnlinePulse;
