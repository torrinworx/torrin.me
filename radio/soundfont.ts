// Fetches the soundfont the station plays, once. GeneralUser GS v2.0.3, from the official
// repository at a pinned commit, checked against its hash, into assets/ beside this file. The
// file is 32 MB and stays out of git. build.sh runs this when it is missing and ships the copy.
//
// Run: npm run soundfont

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const COMMIT = '97049183643d5fc5a9322a69c5b09efb667c6c3a';
const URL_OF = `https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/${COMMIT}/GeneralUser-GS.sf2`;
const SHA256 = '9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe';

export const SOUNDFONT = fileURLToPath(new URL('./assets/GeneralUser-GS.sf2', import.meta.url));

if (existsSync(SOUNDFONT)) {
	console.log(`soundfont: ${SOUNDFONT} is already here`);
} else {
	console.log(`soundfont: fetching ${URL_OF}`);
	const answer = await fetch(URL_OF);
	if (!answer.ok) throw new Error(`soundfont: ${URL_OF} answered ${String(answer.status)}`);
	const bytes = Buffer.from(await answer.arrayBuffer());
	const hash = createHash('sha256').update(bytes).digest('hex');
	if (hash !== SHA256) throw new Error(`soundfont: the download's sha256 is ${hash}, not ${SHA256}`);
	mkdirSync(fileURLToPath(new URL('./assets/', import.meta.url)), { recursive: true });
	writeFileSync(SOUNDFONT, bytes);
	console.log(`soundfont: ${String(bytes.length)} bytes written to ${SOUNDFONT}`);
}
