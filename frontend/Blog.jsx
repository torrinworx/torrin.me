import { Typography, Button, Paper } from 'destamatic-ui';

const Blog = ({ stage }) => {
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
};

export default Blog;
