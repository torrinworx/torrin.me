import {
    Observer,
    StageContext,
    Paper,
    Typography,
    Button,
    Icon,
    ThemeContext,
    Title,
    Meta,
    Link,
    Head,
    Stage,
    Default,
} from 'destamatic-ui';

import JsonLd, {
    SITE_NAME,
    BASE_URL,
    AUTHOR_NAME,
    AUTHOR_ID,
    WEBSITE_ID,
} from '../utils/JsonLd';
import examples from './Examples';
import Playground from './Playground';

const Landing = ThemeContext.use(h => StageContext.use(s => () => {
    s.parent.props.enabled.set(false);

    const Examples = ({ each }) => <Paper theme='column_fill_center' style={{ gap: 20 }}>
        <div theme='column_fill_start'>
            <div theme='row'>
                <Button
                    type='text'
                    label={<Typography type='h3' label={each.title} style={{ color: 'inherit' }} />}
                    icon={<Icon name='external-link' size={'clamp(1.75rem, 1.75vw + 0.875rem, 3rem)'} style={{ marginLeft: 5 }} />}
                    iconPosition='right'
                    href={each.componentUrl}
                    onClick={() => window.open(each.componentUrl, '_blank')}
                />
            </div>
            <div style={{ padding: '10px 15px 10px 15px' }}>
                <Typography type='p1' label={each.description} />
            </div>
        </div>
        <each.component />
    </Paper>;

    const focused = Observer.mutable('inputs');
    const categories = Array.from(new Set(examples.map(e => e.category)))

    const Category = ({ each }) => <Button
        label={String(each).charAt(0).toUpperCase() + String(each).slice(1)}
        focused={focused.map(f => f === each)}
        onClick={() => focused.set(each)}
    />

    const pageUrl = `${BASE_URL}/destamatic-ui`;
    const pageTitle = `destamatic-ui Demo | ${SITE_NAME}`;
    const pageDescription = 'Interactive demo of destamatic-ui components: inputs, display, utilities, theming, and more.';
    const imageUrl = 'https://torrin.me/profile.dark.png';

    return <>
        <Head>
            <Title>{pageTitle}</Title>

            <Meta name="description" content={pageDescription} />
            <Meta name="author" content={AUTHOR_NAME} />
            <Meta name="robots" content="index,follow" />

            <Link rel="canonical" href={pageUrl} />

            <Meta property="og:type" content="website" />
            <Meta property="og:title" content={pageTitle} />
            <Meta property="og:description" content={pageDescription} />
            <Meta property="og:url" content={pageUrl} />
            <Meta property="og:site_name" content={SITE_NAME} />
            <Meta property="og:image" content={imageUrl} />

            <Meta name="twitter:card" content="summary_large_image" />
            <Meta name="twitter:title" content={pageTitle} />
            <Meta name="twitter:description" content={pageDescription} />
            <Meta name="twitter:image" content={imageUrl} />

            <JsonLd
                extraNodes={[{
                    '@type': ['WebPage', 'Product', 'SoftwareApplication'],
                    '@id': `${pageUrl}#webpage`,
                    name: 'destamatic-ui Demo',
                    url: pageUrl,
                    description: pageDescription,
                    inLanguage: 'en-CA',
                    isPartOf: {
                        '@id': WEBSITE_ID,
                    },
                    about: {
                        '@id': AUTHOR_ID,
                    },
                    applicationCategory: 'WebApplication',
                    operatingSystem: 'Any',
                }]}
            />
            {/* TODO: Move back button to controls somehow?  */}
            {/* <div theme="row">
                <Button
                    type="outlined"
                    label="Back"
                    onClick={() => s.open({ name: 'landing' })}
                    href="/"
                />
            </div> */}

            <Paper
                theme="column_fill_center"
                style={{ gap: 20 }}
            >
                <div theme="column_fill_center" style={{ gap: 12 }}>
                    <Button
                        type="text"
                        label={
                            <Typography
                                type="h1"
                                label="destamatic-ui"
                                style={{ color: 'inherit' }}
                            />
                        }
                        icon={
                            <Icon
                                name="external-link"
                                size="clamp(1.75rem, 1.75vw + 0.875rem, 3rem)"
                                style={{ marginLeft: 5 }}
                            />
                        }
                        iconPosition="right"
                        href="https://github.com/torrinworx/destamatic-ui"
                        onClick={() =>
                            window.open(
                                'https://github.com/torrinworx/destamatic-ui',
                                '_blank'
                            )
                        }
                    />

                    <Typography
                        type="p1"
                        label="A batteries-included frontend framework built on fine-grained Observers."
                    />
                    <Typography
                        type="p1"
                        label="No React, no VDOM, no Next, no Redux. Just fast DOM updates, integrated components, routing, SSG/SEO, theming, and rich text in one lightweight stack."
                    />
                </div>

                <div theme="row" style={{ gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                        type="contained"
                        label="Try in the browser"
                        href="/destamatic-ui/playground"
                        onClick={() => {
                            s.open({ name: 'playground' })
                        }}
                        icon={
                            <Icon
                                name="feather:terminal"
                                size="clamp(0.85rem, 0.85vw + 0.4rem, 1.4rem)"
                                style={{ marginLeft: 4 }}
                            />
                        }
                        iconPosition="right"

                    />
                    <Button
                        type="outlined"
                        label="GitHub"
                        href="https://github.com/torrinworx/destamatic-ui"
                        onClick={() =>
                            window.open('https://github.com/torrinworx/destamatic-ui', '_blank')
                        }
                        icon={
                            <Icon
                                name="feather:github"
                                size="clamp(0.85rem, 0.85vw + 0.4rem, 1.4rem)"
                                style={{ marginRight: 4 }}
                            />
                        }
                        iconPosition="left"
                    />
                </div>

                <div theme="row" style={{ gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Typography
                        type="p2"
                        label="Used in production for 5+ years at Equator Studios and across personal projects."
                    />
                </div>
            </Paper>
            <Paper theme='column_fill_center' style={{ background: 'none' }}>
                <Typography type='h1' label='Components' />
                <Typography type='p1' label='A sample of some of the components and tools built into destamatic-ui.' />

                <Paper theme='row_tight' style={{ padding: 5 }}>
                    <Category each={categories} />
                </Paper>
            </Paper>

            <Examples each={focused.map(f => examples.filter(ex => ex.category === f && !ex.disabled))} />
        </Head>
    </>;
}));

const DestamaticUI = () => {
    const config = {
        acts: {
            landing: Landing,
            playground: Playground,
        },
        initial: 'landing',
        template: Default,
        ssg: true,
    };

    return <StageContext value={config}>
        <Stage />
    </StageContext>
}

export default DestamaticUI;


{/* point to bench marks: https://krausest.github.io/js-framework-benchmark/current.html */ }
{/* TODO: Create destamatic-ui landing page, explain destam, show side by side difference between destamatic-ui and react.
    landing page needs to be highly marketable.
    TODO: update destamatic-ui template repository, link here. Explain how to get started. 
    TODO: Create destamatic-ui/demo and migrate this code there
    TODO: Create destamatic-ui/docs and build a docs page, seo indexable through stages, dynamically built based on destamatic-ui/components folder in current submodule.
    
<Typography type='p1' label='No React, no VDOM. UI, state, routing, SSG, SEO, themes, rich text, and more. All tightly integrated for the best frontend developer experience.' />

    NEED NEED NEED Interactive playground setup for users so that they can just test it out without investing time in setting up a repo.

    TODO: In docs, create a list of example projects, each project has a playground, each project has a nice big documentation, each project has a youtube tutorial on how to build it from scratch.

    Hero section:
    > A batteries-included frontend framework built on fine-grained Observers. No React, no VDOM, no Next. Just fast, reactive DOM, integrated components, routing, SSG/SEO, theming, and rich text in one lightweight stack.

    destamatic-ui is for: Indie devs and small teams who are tired of wiring React + Next + 6 other libraries
*/}