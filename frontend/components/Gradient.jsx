import { Observer } from "destam-dom";
import { Theme } from "destamatic-ui";

export default Theme.use(theme => ({ children }) => {
	const primaryColor = theme('primary').vars('color');
	const secondaryColor = theme('secondary').vars('color');

	const gradient = Observer.all([primaryColor, secondaryColor]).map(([p, s]) => {
		return `linear-gradient(to top right, ${p}, ${s}, ${s})`;
	});

	const currentGradient = Observer.mutable(gradient.get());
	const nextGradient = Observer.mutable(gradient.get());
	const opacityTop = Observer.mutable(1);

	gradient.watch(() => {
		// If transition already running, immediately update for new target
		let ongoingTransition = opacityTop.get() < 1;
		nextGradient.set(gradient.get());

		// Start transition only if not ongoing
		if (!ongoingTransition) {
			opacityTop.set(0);

			setTimeout(() => {
				currentGradient.set(nextGradient.get());
				opacityTop.set(1);
			}, 250);
		}
	});

	return <div style={{ position: "relative", zIndex: 0, minHeight: "100vh" }}>
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundImage: currentGradient,
				transition: "opacity 250ms ease-in-out",
				opacity: opacityTop,
				zIndex: -1,
			}}
		/>
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundImage: nextGradient,
				zIndex: -2,
			}}
		/>
		{children}
	</div>;
});