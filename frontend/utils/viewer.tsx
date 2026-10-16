// The photo viewer: a click on a post's photo shows it large in a modal, its words under it.
//
// Each photo is a real link to its file, so a feed, a page with no script and a click with a
// modifier key still reach the whole photo. `data-no-route` keeps the router from taking that link
// for a page of the site, which is what turned a click into the 404. The modal is the platform's
// own `<dialog>`: the top layer, the inert page behind it, the focus inside it and Escape come
// with it. Nothing in it moves, so reduced motion asks nothing more of it.

import { mutable } from '@aweftjs/core';
import { Icon, h } from '@aweftjs/ui';

interface Showing {
	readonly src: string;
	readonly alt: string;
	/** The link that opened it, which gets the keyboard back on close. */
	readonly from: HTMLElement;
}

const showing = mutable<Showing | null>(null);

/** A photo as a link to its whole file that opens the viewer on a plain click. */
export const Photo = (props: { src: string; alt: string; theme: unknown; children?: unknown[] }): unknown => (
	<a
		theme={props.theme}
		href={props.src}
		data-photo=""
		data-no-route=""
		onClick={(event: MouseEvent) => {
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			event.preventDefault();
			showing.set({ src: props.src, alt: props.alt, from: event.currentTarget as HTMLElement });
		}}
	>
		{props.children}
	</a>
);

/** The modal every `Photo` on the page opens: the photo as large as the window allows, and its alt text. */
export const Viewer = (_props: Record<string, unknown>, cleanup: (...fns: (() => void)[]) => void): unknown => {
	const src = mutable(''), alt = mutable('');
	const close = (): void => { (document.getElementById('photo-viewer') as HTMLDialogElement | null)?.close(); };
	cleanup(showing.effect((photo) => {
		if (photo === null) return;
		const dialog = document.getElementById('photo-viewer') as HTMLDialogElement | null;
		if (dialog === null) return;
		src.set(photo.src);
		alt.set(photo.alt);
		document.documentElement.style.overflow = 'hidden';
		// The dialog fills the window, so a click anywhere but the photo and its words is on the
		// backdrop. The keyboard closes it with Escape or the button.
		const backdrop = (event: MouseEvent): void => { if (!(event.target as Element).matches('img, figcaption')) close(); };
		dialog.addEventListener('click', backdrop);
		dialog.addEventListener('close', () => {
			dialog.removeEventListener('click', backdrop);
			document.documentElement.style.overflow = '';
			showing.set(null);
			photo.from.focus();
		}, { once: true });
		dialog.showModal();
	}));
	return (
		<dialog id="photo-viewer" theme="viewer" aria-label={alt}>
			<button type="button" theme="viewer_close" aria-label="Close" onClick={close}>
				<Icon name="feather:x" size={28} />
			</button>
			<figure theme="viewer_figure">
				{src.map((held) => (held === '' ? null : <img theme="viewer_image" src={held} alt={alt} />))}
				<figcaption theme="viewer_caption">{alt}</figcaption>
			</figure>
		</dialog>
	);
};
