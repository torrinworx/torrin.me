import { Typography, Button } from 'destamatic-ui';

const Blog = ({ stage }) => {
    const blogs = Object.values(stage.props.blogs); // somehow sort by date, most recent at top?

    const Card = ({ each }) => {
        console.log(each);
        return <Button
            type='contained_column'
            style={{ padding: 50 }}
            onClick={() => {
                const nameWithoutExtension = each.name.replace(/\.[^/.]+$/, "");
                stage.open({ name: "blog/" + nameWithoutExtension });
            }}
        >
            <Typography type='h4' style={{ color: 'inherit' }} label={each.header} />
            <Typography type='p1' style={{ color: 'inherit' }} label={each.description} />
        </Button>;
    };

    return <div theme='column' style={{ gap: 40 }}>
        <div theme='row_spread'>
            <Button type='outlined' label='Back' onClick={() => stage.open({ name: 'landing' })} />
        </div>
        <Card each={blogs} />
    </div>;
};

export default Blog;
