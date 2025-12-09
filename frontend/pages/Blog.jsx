import { Typography, Button, Paper, StageContext, LoadingDots, suspend, Default, Stage } from 'destamatic-ui';
import Markdown from '../utils/Markdown';
import NotFound from './NotFound';

const BlogPage = StageContext.use(s => suspend(LoadingDots, async (_, cleanup) => {
    const slug = s.current;
    const meta = s.blogs?.[`${slug}.md`] || s.blogs?.[slug];
    s.parent.props.enabled.set(false);
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

    cleanup(() => s.parent.props.enabled.set(true));

    return (
        <div theme='column' style={{ gap: 40 }}>
            <div theme='row_spread'>
                <Button
                    type='outlined'
                    label='Back'
                    onClick={() => s.open({ name: 'blog' })}
                />
            </div>
            <Paper>
                <Typography
                    type='p1'
                    label={`Created on: ${formatDate(meta.created)}`}
                />
                <Typography
                    type='p1'
                    label={`Modified on: ${formatDate(meta.modified)}`}
                />
                <Markdown value={content} />
            </Paper>
        </div>
    );
}));

const BlogLanding = StageContext.use(stage => () => {
    const blogs = Object.values(stage.blogs); // TODO: sort by date, most recent at top?
    const Card = ({ each }) => {
        const name = each.name.replace(/\.[^/.]+$/, '');

        return <Paper theme='column_fill'>
            <Typography type='h4' label={each.header} />
            <Typography type='p1' label={each.description} />
            <div theme='row_center'>
                <Button type='outlined' label='View' onClick={() => stage.open({ name })} href={`/Blog/${name}`} />
            </div>
        </Paper>;
    };

    return <>
        <div theme='row'>
            <Button type='outlined' label='Back' onClick={() => stage.parent.open({ name: 'landing' })} href='/' />
        </div>
        <Card each={blogs} />
    </>;
});

// Suspending the loading of the stage context overrides the .open that the parent stage context sends through micro task queue.
const Blog = () => {
    const BlogsConfig = {
        acts: {
            blog: BlogLanding,
            // fallback: NotFound,
        },
        initial: 'blog',
        template: Default,
    }

    const BlogLoader = StageContext.use(s => suspend(LoadingDots, async () => {
        const response = await fetch('/blog/index.json');
        const blogs = await response.json();

        const blogPages = Object.entries(blogs).reduce((acc, [key, value]) => {
            const baseName = key.replace(/\.[^/.]+$/, '');
            acc[baseName] = BlogPage;
            return acc;
        }, {});

        Object.assign(s.acts, blogPages);
        s.blogs = blogs;

        return <Stage />
    }));

    return <StageContext value={BlogsConfig}>
        <BlogLoader />
    </StageContext>
};

export default Blog;
