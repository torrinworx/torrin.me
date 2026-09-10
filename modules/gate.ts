// The site's gate. It has no users, so `access` allows everything; `identify` exists only to
// put the caller's address in the context, which is what lets the contact module count
// requests per address (design 071).

import type { Gate, Identified, Peer } from '@aweftjs/server';

/** What every hook on this site receives: where the request came from, when that is knowable. */
export interface Visitor {
	readonly address: string | undefined;
}

export default (): Gate<Visitor> => ({
	// In production nginx is in front and the socket address is always 127.0.0.1, which would
	// make the rate limit one shared count for the whole internet. `X-Real-IP` is set by our
	// own nginx from `$remote_addr` and replaces whatever the client sent, so it is the
	// address to trust here; `X-Forwarded-For` is not, because nginx appends to the client's
	// copy and the first entry is the client's own word.
	identify: (request: Request, peer: Peer): Identified<Visitor> => ({
		context: { address: request.headers.get('x-real-ip') ?? peer.address },
	}),
	access: () => [],
});
