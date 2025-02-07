import { Observer, OObject, OArray } from "destam-dom";
import { Button, Shown } from "destamatic-ui";

import ExifReader from 'exifreader';

// Utility function to convert a base64 string to an ArrayBuffer
const base64ToArrayBuffer = (base64) => {
	const binaryString = window.atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes.buffer;
};

// Attempt to read the EXIF "DateTimeOriginal" tag from the binary
// If found, return that date as a JS Date object; otherwise, default to Date(0) or now().
const getExifDate = (base64) => {
	try {
		const arrayBuffer = base64ToArrayBuffer(base64);
		const tags = ExifReader.load(arrayBuffer, { expanded: true });

		// Check typical EXIF structures
		if (tags.exif && tags.exif.DateTimeOriginal) {
			// ExifReader usually gives "YYYY:MM:DD HH:mm:ss"
			const raw = tags.exif.DateTimeOriginal.description;
			// For safety, replace ":" in the date portion with "-" so Date.parse() doesn't choke:
			const safeStr = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
			const parsed = Date.parse(safeStr);
			if (!isNaN(parsed)) {
				// console.log(new Date(parsed))
				return new Date(parsed)
			};
		}
	} catch (err) {
		console.warn('Could not parse EXIF date:', err);
	}
	// Fallback:
	return new Date(0);
};

const ImageSection = ({ ws, images}) => {
	// TODO: Somehow need to cache images, then on each component mount check for cached imaged so that we don't make repeated requests.

	// TODO: Sort images rendered order so that they appear based on capture date, not export date. oldest last. newest first

	const Image = ({ each: image }) => {
		const showHighDef = Observer.mutable(false);
		const hideLowDef = Observer.mutable(false);

		const imageIndex = images.findIndex(img => img.fileName === image.fileName);
		const imageObs = images[imageIndex];

		imageObs.observer.watch(() => {
			if (imageObs.type === 'high') {
				showHighDef.set(true);
			}
		});

		return <div style={{ position: 'relative', height: '700px' }}>
			<Shown value={imageObs} >
				<img src={`data:image/jpeg;base64,${images[imageIndex].data}`} style={{ height: 'inherit', position: 'absolute', top: 0, left: 0 }} />
			</Shown>
			{showHighDef.map(show => show
				? <img
					onLoad={() => hideLowDef.set(true)}
					src={`data:image/jpeg;base64,${images[imageIndex].data}`}
					style={{ height: 'inherit', position: 'absolute', top: 0, left: 0 }}
				/> : null
			)}
		</div>;
	};

	// TODO: Find a dynamic way to load high def ones and image requests on scrolling down the page:
	// ws.send(JSON.stringify({ num: 50, index: 0, tags: ['finished'] }));

	ws.onmessage = (msg) => {
		try {
			const message = JSON.parse(msg.data);

			// If it’s the low-res image, we parse EXIF & store in OArray
			if (message.type === 'low') {
				// Grab EXIF date from the base64 data
				const exifDate = getExifDate(message.data);
				// console.log(exifDate)

				// Create a new OObject for the “low” image
				// Include our computed date in the object:
				const newImage = OObject({
					...message,
					date: exifDate, // Store the parsed date
				});

				// Push into array
				images.push(newImage);

				// Re-sort images  (newest first, for example):
				// images.sort((a, b) => b.date - a.date);

			} else if (message.type === 'high') {
				// If it’s the high-res image, augment the existing array entry
				const imageIndex = images.findIndex(img => img.fileName === message.fileName);
				if (imageIndex !== -1) {
					// Update the object in place
					images[imageIndex].data = message.data;
					images[imageIndex].type = 'high';
				}
			}
		} catch (e) {
			console.error("Error parsing message:", e);
		}
	};

	return <Image each={images.observer.ignore('data').ignore('type')} />;
};

export default ({ ws, keywords }) => {
	const images = OArray([]); // On load, search for all images already loaded in the indexeddb.

	const CollectionButton = ({ each }) => {

		return <Button type='contained' onClick={() => {
			images.splice(0, images.length);
			ws.send(JSON.stringify({ num: 10, index: 0, tags: [each] }));
		}} label={each} />
	}
	// console.log(keywords);
	return <div>
		<div theme='row_spread'>
			<CollectionButton each={keywords} />
		</div>

		<ImageSection ws={ws} keywords={keywords} images={images}/>
	</div>;
};
