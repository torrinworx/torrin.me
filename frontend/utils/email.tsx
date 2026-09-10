// Copy the address to the clipboard, and say so for five seconds.

import { mutable } from '@aweftjs/core';
import { Button, Icon, h } from '@aweftjs/ui';
import check from '@aweftjs/icons/feather/check';
import copy from '@aweftjs/icons/feather/copy';

export const ADDRESS = 'torrin@torrin.me';

export const Email = (props: { type?: unknown; theme?: unknown }): unknown => {
	const copied = mutable(false);
	return (
		<Button
			type={props.type}
			theme={props.theme}
			title="Copy email to clipboard."
			iconPosition="right"
			label={copied.map((done) => (done ? 'Copied!' : 'Email'))}
			icon={<Icon name={copied.map((done) => (done ? check : copy))} />}
			onClick={() => {
				// Deliberately not returned: a promise here would put the button in its loading
				// state for a copy that is over before anybody sees it.
				void navigator.clipboard.writeText(ADDRESS);
				copied.set(true);
				setTimeout(() => { copied.set(false); }, 5000);
			}}
		/>
	);
};
