// GET /api/health, through the real server: what deploy.sh polls after shipping a build, and what
// it reads to tell the build it shipped from the one it meant to replace.

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { boot, type Site } from './boot.ts';

let site: Site;

before(async () => {
	site = await boot({ 'health/Check': { info: { build: 'abc1234-20260101000000' } } });
});
after(async () => { await site.stop(); });

test('the poll is answered 200, ok, with the build id the site was stamped with', async () => {
	const answer = await fetch(`${site.url}/api/health`);
	assert.equal(answer.status, 200);
	assert.equal(answer.headers.get('cache-control'), 'no-store');
	const body = await answer.json() as { ok: boolean; info: { build: string } };
	assert.equal(body.ok, true);
	assert.equal(body.info.build, 'abc1234-20260101000000');
});

test('HEAD answers the same status and no body, for a probe that sends it', async () => {
	const answer = await fetch(`${site.url}/api/health`, { method: 'HEAD' });
	assert.equal(answer.status, 200);
	assert.equal(await answer.text(), '');
});

test('the route answers ahead of the files, so a shell never stands in for it', async () => {
	// The files module answers every URL no route matched; this one is a route, so the body is
	// the answer and not a page.
	const answer = await fetch(`${site.url}/api/health`);
	assert.equal(answer.headers.get('content-type'), 'application/json');
});
