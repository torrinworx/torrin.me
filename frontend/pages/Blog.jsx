import { Typography, Button, Paper, StageContext, LoadingDots, suspend, Default, Stage } from 'destamatic-ui';
import Markdown from '../utils/Markdown';
import NotFound from './NotFound';

const BlogPage = StageContext.use(s => suspend(LoadingDots, async ({ key, value }, cleanup) => {
    s.parent.props.enabled.set(false);
    let content = await fetch(`/blog/${key}`).then(r => r.text());

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

    cleanup(() => s.parent.props.enabled.set(true))

    return <div theme='column' style={{ gap: 40 }}>
        <div theme='row_spread'>
            <Button type='outlined' label='Back' onClick={() => s.open({ name: 'blog' })} />
        </div>
        <Paper>
            <Typography type='p1' label={`Created on: ${formatDate(value.created)}`} />
            <Typography type='p1' label={`Modified on: ${formatDate(value.modified)}`} />
            <Markdown value={content} />
        </Paper>
    </div>;
}));

const BlogLanding = StageContext.use(stage => () => {
    const blogs = Object.values(stage.globalProps.blogs); // TODO: sort by date, most recent at top?

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

const Blog = StageContext.use(s => suspend(LoadingDots, async () => {
    const response = await fetch('/blog/index.json');
    const blogs = await response.json();

    const BlogsConfig = {
        acts: {
            blog: BlogLanding,
            fallback: NotFound,
            ...Object.entries(blogs).reduce((acc, [key, value]) => {
                const baseName = key.replace(/\.[^/.]+$/, '');
                acc[baseName] = () => <BlogPage key={key} value={value} />;
                return acc;
            }, {}),
        },
        initial: 'blog',
        template: Default,
        blogs,
        ssg: true
    }

    return <StageContext value={BlogsConfig}>
        <Stage />
    </StageContext>
}));

export default Blog;
