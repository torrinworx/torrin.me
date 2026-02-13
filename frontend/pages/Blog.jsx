import {
	Typography,
	Button,
	Paper,
	StageContext,
	LoadingDots,
	suspend,
	Default,
	Stage,
	Title,
	Meta,
	Link,
	Shown,
} from 'destamatic-ui';
import Markdown from '../utils/Markdown';
import JsonLd, {
	SITE_NAME,
	BASE_URL,
	AUTHOR_NAME,
	AUTHOR_ID,
	WEBSITE_ID,
} from '../utils/JsonLd';

const BlogPage = StageContext.use(s =>
	suspend(LoadingDots, async () => {
		const slug = s.current;
		const meta = s.blogs?.[`${slug}.md`] || s.blogs?.[slug];

		// If a slug is missing from `index.json` (or the index is still loading),
		// don't crash the whole app.
		if (!meta?.name) {
			const postUrl = `${BASE_URL}/blog/${slug}`;
			return <>
				<Title>{`Blog Post Not Found | ${SITE_NAME}`}</Title>
				<Meta name="robots" content="noindex,follow" />
				<Link rel="canonical" href={postUrl} />

				<div theme="content_col">
					<Typography type="h1" label="Post not found" />
					<Typography
						type="p1"
						label="This blog post isn't in the blog index."
					/>
				</div>
			</>;
		}

		const response = await fetch(`/blog/${meta.name}`);
		if (!response.ok) {
			const postUrl = `${BASE_URL}/blog/${slug}`;
			return <>
				<Title>{`Blog Post Not Found | ${SITE_NAME}`}</Title>
				<Meta name="robots" content="noindex,follow" />
				<Link rel="canonical" href={postUrl} />

				<div theme="content_col">
					<Typography type="h1" label="Post not found" />
					<Typography
						type="p1"
						label={`Couldn't load /blog/${meta.name} (${response.status}).`}
					/>
				</div>
			</>;
		}

		let content = await response.text();

		const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		const getSectionLine = (md, name) => {
			const m = md.match(
				new RegExp(`#\\s*${escapeRegExp(name)}\\s*\\n([^\\n]+)`, 'i')
			);
			return m ? m[1].trim() : '';
		};

		const getFirstSectionLine = (md, names) => {
			for (const name of names) {
				const v = getSectionLine(md, name);
				if (v) return v;
			}
			return '';
		};

		const cleanupMd = (md) => {
			md = md.replace(/#\s*header\s*\n([^#]*)\n+/i, '');
			md = md.replace(/#\s*description\s*\n((?:[^\n]+\n?)*)/i, '');
			// Support legacy and variant keys (created/createdAt/created at)
			md = md.replace(/#\s*created(?:\s*at)?\s*\n([^\n]+)\n+/i, '');
			md = md.replace(/#\s*modified(?:\s*at)?\s*\n([^\n]+)\n+/i, '');
			return md.trim();
		};

		// Pull dates from markdown content
		const createdRaw = getFirstSectionLine(content, [
			'createdAt',
			'created at',
			'created',
		]);
		const modifiedRaw = getFirstSectionLine(content, [
			'modifiedAt',
			'modified at',
			'modified',
		]);

		// Then remove the meta blocks from the markdown body
		content = cleanupMd(content);

		const formatDate = (dateString) => {
			const t = Date.parse(dateString);
			if (!Number.isFinite(t)) return ''; // don't show garbage
			const date = new Date(t);
			return new Intl.DateTimeFormat('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				hour12: false,
			}).format(date);
		};

		const postUrl = `${BASE_URL}/blog/${slug}`;
		const title = meta.header || slug;
		const description =
			meta.description || 'Blog post by Torrin Leonard, full-stack developer.';

		const toIso = (dateString) => {
			if (!dateString) return undefined;
			const t = Date.parse(dateString);
			if (!Number.isFinite(t)) return undefined;
			return new Date(t).toISOString();
		};

		// Prefer markdown dates, fallback to index.json meta (supports createdAt/modifiedAt too)
		const createdIso =
			toIso(createdRaw) || toIso(meta.createdAt) || toIso(meta.created);

		const modifiedIso =
			toIso(modifiedRaw) || toIso(meta.modifiedAt) || toIso(meta.modified) || createdIso;

		const imageUrl = meta.image
			? (meta.image.startsWith('http') ? meta.image : `${BASE_URL}${meta.image}`)
			: 'https://torrin.me/profile.dark.png';

		const createdLabel = formatDate(createdRaw || meta.createdAt || meta.created);
		const modifiedLabel = formatDate(modifiedRaw || meta.modifiedAt || meta.modified);

		return <>
			<Title>{`${title} | ${SITE_NAME}`}</Title>

			<Meta name="description" content={description} />
			<Meta name="author" content={AUTHOR_NAME} />
			<Meta name="robots" content="index,follow" />

			<Link rel="canonical" href={postUrl} />

			<Meta property="og:type" content="article" />
			<Meta property="og:title" content={title} />
			<Meta property="og:description" content={description} />
			<Meta property="og:url" content={postUrl} />
			<Meta property="og:site_name" content={SITE_NAME} />
			{imageUrl ? <Meta property="og:image" content={imageUrl} /> : null}

			<Meta name="twitter:card" content="summary_large_image" />
			<Meta name="twitter:title" content={title} />
			<Meta name="twitter:description" content={description} />
			{imageUrl ? <Meta name="twitter:image" content={imageUrl} /> : null}

			{createdIso ? <Meta property="article:published_time" content={createdIso} /> : null}
			{modifiedIso ? <Meta property="article:modified_time" content={modifiedIso} /> : null}

			<JsonLd
				extraNodes={{
					"@type": "BlogPosting",
					"@id": `${postUrl}#blogposting`,
					"mainEntityOfPage": {
						"@type": "WebPage",
						"@id": `${postUrl}#webpage`,
					},
					"headline": title,
					"description": description,
					"articleBody": content,
					"url": postUrl,
					"inLanguage": "en-CA",
					...(createdIso && { "datePublished": createdIso }),
					...(modifiedIso && { "dateModified": modifiedIso }),
					"author": { "@id": AUTHOR_ID },
					"publisher": { "@id": AUTHOR_ID },
					...(imageUrl && {
						"image": { "@type": "ImageObject", "url": imageUrl },
					}),
					"isPartOf": { "@id": WEBSITE_ID },
				}}
			/>

			<div theme="content_col">
				<Typography type="h1" label={title} />

				<div theme="divider" />
				<Typography type="p1_bold" label="Torrin Leonard" />
				<Shown value={createdLabel || modifiedLabel}>
					<div theme="content_col" style={{ gap: 6 }}>
						<Shown value={createdLabel}>
							<Typography type="p2" label={`Published: ${createdLabel}`} />
						</Shown>
						<Shown value={modifiedLabel && modifiedLabel !== createdLabel}>
							<Typography type="p2" label={`Updated: ${modifiedLabel}`} />
						</Shown>
					</div>
				</Shown>
			</div>

			<div theme="content_col" style={{ gap: 40, width: '100%', minWidth: 0 }}>
				<Markdown value={content} />
			</div>
		</>;
	})
);

const BlogLanding = StageContext.use(stage => () => {
	const blogs = Object.values(stage.blogs);

	// todo: move this to server side/buildDocs.js so that we don't have to compute this client side.
	const toTime = (meta) => {
		const raw = meta.modifiedAt || meta.modified || meta.createdAt || meta.created;
		if (!raw) return 0;
		const t = Date.parse(raw);
		return Number.isFinite(t) ? t : 0;
	};

	blogs.sort((a, b) => toTime(b) - toTime(a));

	const pageUrl = `${BASE_URL}/blog`;
	const pageTitle = 'Blog | Torrin Leonard';
	const pageDescription =
		'Blog posts and articles by Torrin Leonard, full-stack developer.';

	const Card = ({ each }) => {
		const name = each.name.replace(/\.[^/.]+$/, '');

		return <Paper theme="column_fill">
			<Typography type="h4" label={each.header || name} />
			<Typography type="p1" label={each.description} />
			<div theme="row_center">
				<Button
					theme='antiPrimary'
					type="outlined"
					label="View"
					onClick={() => stage.open({ name })}
					href={`/blog/${name}`}
				/>
			</div>
		</Paper>;
	};

	return <>
		<Title>{pageTitle}</Title>

		<Meta name="description" content={pageDescription} />
		<Meta name="robots" content="index,follow" />

		<Link rel="canonical" href={pageUrl} />

		<Meta property="og:type" content="website" />
		<Meta property="og:title" content={pageTitle} />
		<Meta property="og:description" content={pageDescription} />
		<Meta property="og:url" content={pageUrl} />
		<Meta property="og:site_name" content={SITE_NAME} />
		<Meta
			property="og:image"
			content="https://torrin.me/profile.dark.png"
		/>

		<Meta name="twitter:card" content="summary_large_image" />
		<Meta name="twitter:title" content={pageTitle} />
		<Meta name="twitter:description" content={pageDescription} />
		<Meta
			name="twitter:image"
			content="https://torrin.me/profile.dark.png"
		/>

		<JsonLd
			extraNodes={{
				"@type": ["WebPage", "CollectionPage", "Blog"],
				"@id": `${pageUrl}#webpage`,
				"url": pageUrl,
				"name": "Blog | Torrin.me",
				"description": pageDescription,
				"inLanguage": "en-CA",
				"isPartOf": {
					"@id": WEBSITE_ID,
				},
				"about": {
					"@id": AUTHOR_ID,
				},
			}}
		/>

		<div theme='content_col'>
			<Card each={blogs} />
		</div>
	</>;
});

const Blog = () => {
	const BlogsConfig = {
		acts: {
			blog: BlogLanding,
		},
		initial: 'blog',
		template: Default,
		ssg: true,
		truncateInitial: true,
	};

	const BlogLoader = StageContext.use(s =>
		suspend(LoadingDots, async () => {
			const response = await fetch('/blog/index.json');
			const blogs = await response.json();

			const blogPages = Object.entries(blogs).reduce(
				(acc, [key, value]) => {
					const baseName = key.replace(/\.[^/.]+$/, '');
					acc[baseName] = BlogPage;
					return acc;
				},
				{}
			);

			Object.assign(s.acts, blogPages);
			s.blogs = blogs;

			return <Stage />;
		})
	);

	return <StageContext value={BlogsConfig}>
		<BlogLoader />
	</StageContext>;
};

export default Blog;
