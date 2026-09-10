// The resume download button, and the five seconds of "Downloaded!" after a click.

import { mutable } from '@aweftjs/core';
import { Button, Icon, h } from '@aweftjs/ui';
import check from '@aweftjs/icons/feather/check';
import download from '@aweftjs/icons/feather/download';

import { useShine } from './shine.tsx';

const FILE = '/Torrin_Leonard_Resume.pdf';

export const Resume = (
	props: { theme?: unknown },
	cleanup: (...fns: (() => void)[]) => void,
): unknown => {
	const downloaded = mutable(false);
	// A real `download` link: the router leaves the click alone and a crawler sees the file.
	return (
		<Button
			theme={['shiny', props.theme]}
			href={FILE}
			download="Torrin_Leonard_Resume.pdf"
			hrefNewTab={false}
			title="Download Torrin Leonard's resume PDF."
			iconPosition="right"
			label={downloaded.map((done) => (done ? 'Downloaded!' : 'Resume'))}
			icon={<Icon name={downloaded.map((done) => (done ? check : download))} />}
			onClick={() => {
				downloaded.set(true);
				setTimeout(() => { downloaded.set(false); }, 5000);
			}}
		>
			{useShine(cleanup)}
		</Button>
	);
};
