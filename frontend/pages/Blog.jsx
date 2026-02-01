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
} from 'destamatic-ui';
import Markdown from '../utils/Markdown';
import JsonLd, {
	SITE_NAME,
	BASE_URL,
	AUTHOR_NAME,
	AUTHOR_ID,
	WEBSITE_ID,
} from '../utils/JsonLd';

const BlogPage = StageContext.use(s => suspend(LoadingDots, async () => {
	const slug = s.current;
	const meta = s.blogs?.[`${slug}.md`] || s.blogs?.[slug];

	const response = await fetch(`/blog/${meta.name}`);
	let content = await response.text();

	const cleanupMd = (md) => {
		md = md.replace(/#\s*header\s*\n([^#]*)\n+/i, '');
		md = md.replace(/#\s*description\s*\n((?:[^\n]+\n?)*)/i, '');
		return md.trim();
	};

	content = cleanupMd(content);

	const formatDate = (dateString) => {
		const date = new Date(dateString);
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
	const description = meta.description || 'Blog post by Torrin Leonard, full-stack developer.';

	const createdIso = meta.created
		? new Date(meta.created).toISOString()
		: undefined;
	const modifiedIso = meta.modified
		? new Date(meta.modified).toISOString()
		: createdIso;

	const imageUrl = meta.image
		? (meta.image.startsWith('http')
			? meta.image
			: `${BASE_URL}${meta.image}`)
		: 'https://torrin.me/profile.dark.png';

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
		{imageUrl && (
			<Meta property="og:image" content={imageUrl} />
		)}

		<Meta name="twitter:card" content="summary_large_image" />
		<Meta name="twitter:title" content={title} />
		<Meta name="twitter:description" content={description} />
		{imageUrl && (
			<Meta name="twitter:image" content={imageUrl} />
		)}

		{createdIso && (
			<Meta
				property="article:published_time"
				content={createdIso}
			/>
		)}
		{modifiedIso && (
			<Meta
				property="article:modified_time"
				content={modifiedIso}
			/>
		)}

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
				"author": {
					"@id": AUTHOR_ID,
				},
				"publisher": {
					"@id": AUTHOR_ID,
				},
				...(imageUrl && {
					"image": {
						"@type": "ImageObject",
						"url": imageUrl,
					},
				}),
				"isPartOf": {
					"@id": WEBSITE_ID,
				},
			}}
		/>

		<div theme="content_col " style={{ gap: 40, width: '100%', minWidth: 0 }}>
			<Markdown value={content} />
		</div>
	</>;
}));

const BlogLanding = StageContext.use(stage => () => {
	const blogs = Object.values(stage.blogs); // could sort by date, however dates are currently based on file date values, which are sanatized by github for some reason.

	const pageUrl = `${BASE_URL}/blog`;
	const pageTitle = 'Blog | Torrin.me';
	const pageDescription =
		'Blog posts and articles by Torrin Leonard, full-stack developer.';

	const Card = ({ each }) => {
		const name = each.name.replace(/\.[^/.]+$/, '');

		return <Paper theme="column_fill">
			<Typography type="h4" label={each.header} />
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
