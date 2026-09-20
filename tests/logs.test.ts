// The logs battery on this site: a page's batch lands in the store as a visit, through the
// real server with the site's own gate (no users, so the visit is anonymous), and the
// production configuration keeps a visit 90 days.

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { visit } from '@aweftjs/logs';

import { boot, type Site } from './boot.ts';

let site: Site;

before(async () => {
	site = await boot({ 'logs/Visits': { build: 'abc1234-20260101000000' } });
});
after(async () => { await site.stop(); });

test('a batch posted to /api/logs is a visit the store holds, anonymous, on this build', async () => {
	const batch = {
		visit: 'logs-test-visit',
		build: 'abc1234-20260101000000',
		entries: [
			{ at: Date.now(), kind: 'error', message: 'TypeError: boom', stack: 'at Site' },
			{ at: Date.now(), kind: 'click', id: 'resume' },
		],
	};
	const answer = await fetch(`${site.url}/api/logs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(batch) });
	assert.equal(answer.status, 200);
	assert.deepEqual(await answer.json(), { kept: 2 });

	const seen = await visit(site.store, 'visit:logs-test-visit');
	assert.ok(seen, 'the visit exists');
	assert.equal(seen.user, null);
	assert.equal(seen.build, 'abc1234-20260101000000');
	assert.equal(seen.errors, 1);
	assert.deepEqual(seen.entries.map((entry) => entry.kind), ['error', 'click']);
	assert.equal(seen.entries[1]?.['id'], 'resume');
});

test('a body that is not a batch is refused with reasons, not kept', async () => {
	const answer = await fetch(`${site.url}/api/logs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"nope":true}' });
	assert.equal(answer.status, 400);
	assert.ok(Array.isArray((await answer.json() as { reasons: unknown[] }).reasons));
});
