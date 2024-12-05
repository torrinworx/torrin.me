import { Observer, OObject, OArray } from "destam-dom";
import { Shown } from "destamatic-ui";

const ImageSection = ({ ws }) => {
	const images = OArray([]);

	const Image = ({ each: image }) => {
		const imageIndex = images.findIndex(img => img.fileName === image.fileName);
		const showHighDef = Observer.mutable(false);
		const imageObs = images[imageIndex];

		const hideLowDef = Observer.mutable(false);

		imageObs.observer.watch(() => {
			console.log(imageObs.type);
			if (imageObs.type === 'high') {
				showHighDef.set(true);
			}
		});

		return <div style={{ position: 'relative', height: '400px' }}>
			<Shown value={imageObs} >
				<img src={`data:image/jpeg;base64,${images[imageIndex].data}`} style={{ height: '400px', position: 'absolute', top: 0, left: 0 }} />
			</Shown>
			{showHighDef.map(show => show
				? <img
					onLoad={() => hideLowDef.set(true)}
					src={`data:image/jpeg;base64,${images[imageIndex].data}`}
					style={{ height: '400px', position: 'absolute', top: 0, left: 0 }}
				/> : null
			)}
		</div>;
	};

	// TODO: Find a dynamic way to load high def ones and image requests on scrolling down the page:
	ws.send(JSON.stringify({ num: 10, index: 0 }));

	ws.onmessage = (msg) => {
		try {
			const message = JSON.parse(msg.data);

			if (message.type === 'low') {
				if (!images.some(img => img.fileName === message.fileName && img.type === 'low')) {
					images.push(OObject(message));
				}
			} else if (message.type === 'high') {
				const imageIndex = images.findIndex(img => img.fileName === message.fileName);
				images[imageIndex].data = message.data;
				images[imageIndex].type = 'high'
			}
		} catch (e) {
			console.error("Error parsing message:", e);
		}
	};

	return <Image each={images.observer.ignore('data').ignore('type')} />;
};

export default ({ ws }) => {
	return <ImageSection ws={ws} />;
};
