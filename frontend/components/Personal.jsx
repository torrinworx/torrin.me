import { Observer, OObject, OArray } from "destam-dom";
import { Button, Shown } from "destamatic-ui";

import ExifReader from 'exifreader';

const getExifDate = (base64) => {
	try {
		const binaryString = window.atob(base64);
		const len = binaryString.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		const tags = ExifReader.load(bytes.buffer, { expanded: true });

		if (tags.exif && tags.exif.DateTimeOriginal) {
			const raw = tags.exif.DateTimeOriginal.description;
			const safeStr = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
			const parsed = Date.parse(safeStr);
			if (!isNaN(parsed)) {
				return new Date(parsed)
			};
		}
	} catch (err) {
		console.warn('Could not parse EXIF date:', err);
	}
	return new Date(0);
};

export default ({ ws, keywords }) => {
	const images = OArray([]); // On load, search for all images already loaded in the indexeddb.
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

	const CollectionButton = ({ each }) => <Button type='contained' onClick={() => {
		images.splice(0, images.length);
		ws.send(JSON.stringify({ num: 100, index: 0, tags: [each] }));
	}} label={each} />;

	// TODO: Find a dynamic way to load high def ones and image requests on scrolling down the page:
	// ws.send(JSON.stringify({ num: 50, index: 0, tags: ['finished'] }));

	// ws.onmessage handler
	ws.onmessage = (msg) => {
		try {
			const message = JSON.parse(msg.data);
			const { fileName, type, data } = message;

			if (type === 'low') {
				// 1) Parse EXIF for the low-res data
				const exifDate = getExifDate(data);

				// 2) Build a new object
				const newImage = OObject({
					...message,
					date: exifDate,
					type: 'low',
				});

				// 3) Check if we already have an entry for fileName
				const existingIndex = images.findIndex(img => img.fileName === fileName);
				if (existingIndex === -1) {
					// Not found, insert
					images.push(newImage);
				} else {
					// Found, replace
					images.splice(existingIndex, 1, newImage);
				}

				// 4) Sort by date descending, then splice back
				const sorted = [...images].sort((a, b) => b.date - a.date);
				images.splice(0, images.length, ...sorted);

			} else if (type === 'high') {
				// 5) Look for an existing "low" entry
				const existingIndex = images.findIndex(img => img.fileName === fileName);
				if (existingIndex !== -1) {
					// => Overwrite that entry in place, preserving date
					const oldDate = images[existingIndex].date;
					images.splice(existingIndex, 1, OObject({
						...images[existingIndex],
						data,
						type: 'high',
						date: oldDate, // preserve the same date so the order doesn’t change
					}));
				} else {
					// 6) If no existing entry was found (rare edge case),
					//    insert a new one + parse EXIF + sort
					const exifDate = getExifDate(data);
					images.push(OObject({
						...message,
						date: exifDate,
						type: 'high',
					}));
					const sorted = [...images].sort((a, b) => b.date - a.date);
					images.splice(0, images.length, ...sorted);
				}
			}
		} catch (e) {
			console.error("Error parsing message:", e);
		}
	};

	return <div>
		<div theme='row_spread'>
			<CollectionButton each={keywords} />
		</div>
		<div >
			<Image each={images.observer.ignore('data').ignore('type')} />
		</div>
	</div>;
};
