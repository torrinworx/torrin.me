import * as React from 'react';
import { useEffect, useState } from 'react';

import { Box } from '@mui/material';

import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import Typography from '@mui/material/Typography';

const experience = [
    {
        "id": 1,
        "startDate": "2021-10-01",
        "image": "./images/TCS_Icon_SVG.svg",
        "imageStyle": { "height": "5rem" },
        "header": "This Cozy Studio Inc.",
        "content": "As the Co-Founder, CEO, and Lead Software Engineer of This Cozy Studio Inc, I've driven the company's growth through my diverse technical abilities, leadership, and management skills. My contributions include the development of 'Blend_My_NFTs', a popular 3D model NFT generator operating as a Blender add-on, and the creation of multiple NFT collections for our clients, among them Cozy Place, Vox Coodles, Omni Coin, Metapanda, and AKidCalledBeast. Additionally, I designed and developed our company's website, ThisCozyStudio.com, and implemented a cloud rendering, storage, and NFT minting platform, making it easier for 3D graphical artists to launch their own 3D NFT collections"
    },
    {
        "id": 2,
        "startDate": "2013-06-01",
        "image": "./images/worx4you.jpg",
        "imageStyle": { "height": "5rem", "width": "auto", "borderRadius": "50%" },
        "header": "worX4you Inc.",
        "content": "As a Software Assurance Engineer contractor at worx4You, I had the opportunity to work on multiple projects for companies such as THRILLWORKS, League, TunnelBear, Hubba, and Hopscotch. In this role, I was responsible for manual and automation testing using tools such as Jira, Slack, Visual Studio Code, Javascript, TypeScript, and TestCafe. Additionally, I conducted research on and implemented WCAG accessibility standards to ensure that the companies I worked with were following accessibility standards. Through my work at worx4You, I gained valuable experience in software testing and accessibility, and I am excited to continue to develop my skills in these areas."
    }
]

export const CustomizedTimeline = () => {
    const [data, setData] = useState([]);

    const calculatePeriod = (startDate) => {
        const start = new Date(startDate);
        const end = new Date();

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();

        if (months < 0 || (months === 0 && end.getDate() < start.getDate())) {
            years--;
            months += 12;
        }

        return `${start.toLocaleString('default', { month: 'long', year: 'numeric' })} - Present (${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''})`;
    };

    useEffect(() => {
        const enrichedData = experience.map(item => ({
            ...item,
            period: calculatePeriod(item.startDate),
        }));
        setData(enrichedData);
    }, []);

    return (
        <Timeline position="alternate">
            {data.map((item) => (
                <TimelineItem key={item.id}>
                    <TimelineOppositeContent
                        sx={{ m: 'auto 0' }}
                        align="right"
                        variant="body2"
                        color="text.secondary"
                    >
                        <Typography variant="body1">{item.period}</Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                        <TimelineConnector />
                        <Box component="img" src={item.image} sx={item.imageStyle} />
                        <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Typography variant="h1">{item.header}</Typography>
                        <Typography variant="body1">{item.content}</Typography>
                    </TimelineContent>
                </TimelineItem>
            ))}
        </Timeline>
    );
}

export default CustomizedTimeline;
