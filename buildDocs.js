import path from "path";
import fs from "fs/promises";

const buildBlog = async ({ __dirname }) => {
	const srcRoot = path.resolve(__dirname, "destamatic-ui/docs");
	const destRoot = path.resolve(
		__dirname,
		"frontend",
		"public",
		"destamatic-ui",
		"docs"
	);
	const indexFile = path.join(destRoot, "index.json");

	await fs.mkdir(destRoot, { recursive: true });

	const traverse = async (srcDir, relativePath = "") => {
		const indexObject = {};
		const entries = await fs.readdir(srcDir, { withFileTypes: true });

		for (const entry of entries) {
			const childSrc = path.join(srcDir, entry.name);
			const childRel = path.join(relativePath, entry.name); // relative to srcRoot
			const childDest = path.join(destRoot, childRel);      // always relative to destRoot

			if (entry.isDirectory()) {
				const childIndex = await traverse(childSrc, childRel);
				if (Object.keys(childIndex).length > 0) {
					indexObject[entry.name] = childIndex;
				}
				continue;
			}

			if (entry.isFile() && path.extname(entry.name) === ".md") {
				try {
					const fileContent = await fs.readFile(childSrc, "utf8");

					// Skip if the file has a disabled tag
					if (fileContent.match(/#\s*disabled\s*\n([^#]*)\n+/i)) continue;

					const stats = await fs.stat(childSrc);

					const headerMatch = fileContent.match(/#\s*header\s*\n([^#]*)\n+/i);
					const descriptionMatch = fileContent.match(
						/#\s*description\s*\n((?:[^\n]+\n?)*?)(?=\n#|$)/i
					);

					indexObject[entry.name] = {
						name: entry.name,
						header: headerMatch ? headerMatch[1].trim() : "",
						description: descriptionMatch ? descriptionMatch[1].trim() : "",
						modified: stats.mtime.toISOString(),
						created: stats.ctime.toISOString(),
					};

					// Copy file
					await fs.mkdir(path.dirname(childDest), { recursive: true });
					await fs.copyFile(childSrc, childDest);
				} catch (err) {
					console.error(`Error processing file ${childSrc}:`, err);
				}
			}
		}

		return indexObject;
	};

	const index = await traverse(srcRoot);
	await fs.writeFile(indexFile, JSON.stringify(index, null, 2), "utf8");

	return index;
};

export default buildBlog;
