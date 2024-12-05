import { OArray } from "destam-dom";

const ImageSection = ({ ws }) => {
	const images = OArray([]);

	const Image = ({ each: image }) => {
		return <div>
			<div style={{ height: '750px', margin: '10px', display: 'inline-block' }}>
					<img src={`data:image/jpeg;base64,${image.data}`} style={{ width: '100%', height: '100%' }} />
				</div>
		</div>;
	};

    ws.send(JSON.stringify({ num: 10, index: 0 }));

    ws.onmessage = (msg) => {
		try {
			const message = JSON.parse(msg.data);
			images.push(message);
		} catch (e) {
			console.error("Error parsing message:", e);
		}
	};

	return <div>
		<Image each={images} />
	</div>;
};

export default ({ ws }) => {
	return <div>
		Personal
		<ImageSection ws={ws} />
	</div>;
};
