import { Observer } from "destam-dom";
import { Theme } from "destamatic-ui";

export default Theme.use(theme => ({ children }) => {
	const primaryColor = theme('primary').vars('color');
	const secondaryColor = theme('secondary').vars('color');

	const gradient = Observer.all([primaryColor, secondaryColor]).map(([p, s]) => {
		return `linear-gradient(to top right, ${p}, ${s})`;
	});

	const currentGradient = Observer.mutable(gradient.get());
	const nextGradient = Observer.mutable(gradient.get());
	const opacityTop = Observer.mutable(1);

	gradient.watch(() => {
		// If the transition is already running, immediately update for the new target
		let ongoingTransition = opacityTop.get() < 1;

		nextGradient.set(gradient.get());

		// Start transition to new gradient only if not ongoing
		if (!ongoingTransition) {
			opacityTop.set(0);

			setTimeout(() => {
				currentGradient.set(nextGradient.get());
				opacityTop.set(1);
			}, 250);
		}
	});

	return <>
		<div style={{
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundImage: currentGradient,
			transition: 'opacity 250ms ease-in-out',
			opacity: opacityTop,
			zIndex: -1
		}} />
		<div style={{
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundImage: nextGradient,
			zIndex: -2
		}} />
		{children}
	</>
});
