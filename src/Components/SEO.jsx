import React from "react";
import { Helmet } from "react-helmet";

const SEO = ({
    title = "Torrin Leonard",
    description = "Torrin Leonard: Building open source and 3D projects as the CEO and Co-Founder of This Cozy Studio and as a Software Developer at Equator Studios.",
    url = window.location.href,
    image = "https://www.torrinleonard.com/images/site-card.png",
    locale = "en_CA",
    keywords = "Torrin Leonard, Software development, This Cozy Studio Inc, CEO, Lead software engineer, Blend_My_NFTs, Open source, Generative AI, 3D Graphics, worX4you, Equator Studios"
}) => {
    const jsonLd = {
        "@context": "http://schema.org",
        "@type": "WebPage",
        "url": url,
        "name": title,
        "description": description,
        "primaryImageOfPage": {
            "@type": "ImageObject",
            "url": image,
            "name": "The front page of TorrinLeonard.com"
        },
        "author": {
            "@type": "Person",
            "name": "Torrin Leonard",
            "worksFor": [
                {
                    "@type": "Organization",
                    "name": "This Cozy Studio Inc",
                    "url": "https://www.thiscozystudio.com/",
                    // add more properties specific to the company if necessary, like address, contact etc.
                },
                {
                    "@type": "Organization",
                    "name": "Equator Studios",
                    "url": "https://www.equatorstudios.com/",
                    // add more properties specific to the company if necessary, like address, contact etc.
                }
            ],
            "sameAs": [
                "https://twitter.com/LeonardTorrin",
                "https://github.com/torrinworx",
                "https://www.linkedin.com/in/torrin-leonard-8343a1154/",
                "https://www.thiscozystudio.com/",
                "https://www.youtube.com/c/ThisCozyStudio"
            ]
        },
        "about": {
            "@type": "SoftwareApplication",
            "name": "Blend_My_NFTs",
            "applicationCategory": "DesignApplication",
            "operatingSystem": "Windows, macOS, Linux",
            "softwareVersion": "4.6.0",
            "downloadUrl": "https://github.com/torrinworx/Blend_My_NFTs",
            "license": "https://www.gnu.org/licenses/gpl-3.0.en.html"
        }
    };
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={url} />
            <meta name="robots" content="index, follow" />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:locale" content={locale} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Helmet>
    );
};

export default SEO;
