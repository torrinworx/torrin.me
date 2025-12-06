import { Typography, Button, Paper, StageContext, LoadingDots, suspend, Default, Stage } from 'destamatic-ui';
import Markdown from '../utils/Markdown';

/*
// This can be it's own file:
const Something = StageContext.use(s => suspend(LoadingDots, async ({ key, value }) => {
    s.props.enabled.set(false);
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

const blogPages = Object.entries(blogs).reduce((acc, [key, value]) => {
    const baseName = key.replace(/\.[^/.]+$/, '');
    const routeKey = `blog/${baseName}`;
    acc[baseName] = () => <Something key={key} value={value} />;
    return acc;
}, {});



const Blog = StageContext.use(stage => () => {
    const blogs = Object.values(stage.props.blogs); // somehow sort by date, most recent at top?

    const Card = ({ each }) => {
        const nameWithoutExtension = each.name.replace(/\.[^/.]+$/, '');

        return <Paper theme='column_fill'>
            <Typography type='h4' label={each.header} />
            <Typography type='p1' label={each.description} />
            <Button type='outlined' label='View' onClick={() => stage.open({ name: 'blog/' + nameWithoutExtension })} href={`/blog/${nameWithoutExtension}`}/>
        </Paper>;
    };

    return <>
        <div theme='row'>
            <Button type='outlined' label='Back' onClick={() => stage.open({ name: 'landing' })} href='/' />
        </div>
        <Card each={blogs} />
    </>;
});

export default Blog;
*/


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

const Blog = suspend(LoadingDots, async () => {

    const response = await fetch('/blog/index.json');
    const blogs = await response.json();
    const BlogsConfig = {
        acts: {
            Blog: BlogLanding,
        },
        initial: 'Blog',
        template: Default,
        blogs,
    }

    return <StageContext value={BlogsConfig}>
        <Stage />
    </StageContext>
});

export default Blog;
