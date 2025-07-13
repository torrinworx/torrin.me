
const Blog = ({ stage }) => {
    stage.props.enabled.set(false);

    const blogPages = Object.fromEntries(
        Object.entries(stage.stages).filter(([key, _]) => key.startsWith('blog/'))
    );
    console.log(blogPages);

    return <>

        blog
    </>;
};

export default Blog;
