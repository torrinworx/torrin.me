import { atomic } from "destam/Network";
import { OObject } from "destam-dom";

const theme = OObject({
});

export const define = obj => atomic(() => {
	for (const o in obj) {
		if (o in theme) throw new Error("Theme.define: theme definition already exists: " + o);
		theme[o] = obj[o];
	}
});

export default theme;
