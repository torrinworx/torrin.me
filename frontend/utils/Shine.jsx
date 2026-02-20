import { Theme, OArray, Observer } from '@destamatic/ui';

Theme.define({
	shine: {
		extends: 'primary',
		pointerEvents: 'none',
		position: 'absolute',
		top: 0,
		left: 0,
		width: '200%',
		height: '100%',
		background:
			'linear-gradient(120deg,' +
			'rgba(255,255,255,0) 0%,' +
			'rgba(255,255,255,0) 35%,' +
			'rgba(255,255,255,0.7) 50%,' +
			'rgba(255,255,255,0) 65%,' +
			'rgba(255,255,255,0) 100%)',

		borderRadius: 'inherit',
		mixBlendMode: 'screen',
		transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
	},
});

const useShine = () => {
	const shines = OArray();

	const createShine = (_eventOrElem) => {
		const offset = Observer.mutable(-150);
		const opacity = Observer.mutable(0.9);

		shines.push(
			<span
				theme="shine"
				style={{
					transform: offset.map(
						o => `translateX(${o}%) skewX(-20deg)`
					),
					opacity,
				}}
			/>,
		);

		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				offset.set(150);
				opacity.set(0);

				setTimeout(() => {
					shines.splice(0, 1);
				}, 800);
			}),
		);
	};

	return [shines, createShine];
};

export default useShine;