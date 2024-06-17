import { h } from "destamatic-ui";

// import _ from 'lodash';

// import React, { useContext } from "react";
// import { Grid, Box, Typography, IconButton } from "@mui/material";
// import FloatingCard from "../Components/FloatingCard";

// import YouTubeIcon from '@mui/icons-material/YouTube';
// import TwitterIcon from '@mui/icons-material/Twitter';
// import LinkedInIcon from '@mui/icons-material/LinkedIn';
// import GitHubIcon from '@mui/icons-material/GitHub';

// import { ThemeContext, contentMargin, bevelRadius, themeModes } from "../Theme";
// import CustomizedTimeline from "../Components/ExperienceTimeline";

export const Home = () => {
    return <div>Hello World</div>
//   const { selectedThemeMode } = useContext(ThemeContext);

//   const profileImage = _.isEqual(selectedThemeMode, themeModes.dark) ? '/images/torrin-profile.dark-mode.png' : '/images/torrin-profile.light-mode.png';

//   return (
//     <Grid container spacing={contentMargin} justifyContent="center">
//       <FloatingCard type="invisible" size="medium">
//         <Grid container direction="column" sx={{ minHeight: '100%' }}>
//           <Grid item xs={12}>
//             <Typography variant="h1" gutterBottom>
//               CEO/CO-Founder <br />
//               Full Stack Software Developer <br />
//             </Typography>
//           </Grid>
//           <Grid item xs={12} md={6} sx={{ marginTop: 'auto' }}>
//             <Typography variant="h3" gutterBottom>
//               Creating cool 3D and open-source stuff,<br />
//               because why not ok?!
//             </Typography>
//           </Grid>
//         </Grid>
//       </FloatingCard>
//       <FloatingCard type="translucentSecondary">
//         <Grid container spacing={2} alignItems="center">
//           <Grid item xs={12} md={6} sx={{ padding: 2 }}>
//             <Typography variant="h1" gutterBottom>
//               About Me
//             </Typography>
//             <Typography variant="body1" paragraph>
//               Hi there, I'm Torrin Leonard. I started my career in tech at worX4you and League, working on automation and QA. This experience sparked my interest in software development which led me to gain interest in the fascinating world of 3D graphics and animation. I eventually co-founded This Cozy Studio Inc., along with my two brothers, where I served as its CEO and lead software engineer. Here, I created Blend_My_NFTs and developed ThisCozyStudio.com, contributing significantly to projects that made AI-generated tiled textures and 3D NFT collections easily accessible and open source. I also prototyped a cloud platform to simplify gpu intensive rendering and NFT minting.
//             </Typography>
//             <Typography variant="body1" paragraph>
//               Currently I'm working as a Full Stack Software Developer at Equator Studios, fine-tuning our mapping and design software for the benefit of professionals worldwide.
//             </Typography>
//             <Typography variant="body1" paragraph>
//               It's all in a day's work. Ok well... maybe a few year's work... quite a few years...
//             </Typography>
//           </Grid>
//           <Grid item xs={12} md={6} sx={{ padding: 2, display: 'flex', justifyContent: 'flex-end' }}>
//             <Box sx={{
//               width: "100%",
//               height: 0,
//               paddingBottom: "100%",
//               position: "relative",
//               borderRadius: bevelRadius
//             }}>
//               <Box
//                 component="img"
//                 src={profileImage}
//                 sx={{
//                   position: "absolute",
//                   top: 0,
//                   bottom: 0,
//                   left: 0,
//                   right: 0,
//                   height: "100%",
//                   width: "100%",
//                   objectFit: "cover",
//                   borderRadius: bevelRadius
//                 }}
//               />
//             </Box>
//           </Grid>
//         </Grid>
//       </FloatingCard>

//       <FloatingCard type="invisible" zIndex="1">
//         <Grid container justifyContent="center">
//           <IconButton aria-label="YouTube" component="a" href="https://www.youtube.com/c/thiscozystudio" target="_blank" rel="noopener">
//             <YouTubeIcon sx={{ color: 'red', fontSize: '5rem' }} />
//           </IconButton>
//           <IconButton aria-label="Twitter" component="a" href="https://twitter.com/LeonardTorrin" target="_blank" rel="noopener">
//             <TwitterIcon sx={{ color: '#1DA1F2', fontSize: '5rem' }} />
//           </IconButton>
//           <IconButton aria-label="LinkedIn" component="a" href="https://www.linkedin.com/in/torrin-leonard-8343a1154/" target="_blank" rel="noopener">
//             <LinkedInIcon sx={{ color: '#0077b5', fontSize: '5rem' }} />
//           </IconButton>
//           <IconButton aria-label="GitHub" component="a" href="https://github.com/torrinworx" target="_blank" rel="noopener">
//             <GitHubIcon sx={{ color: 'white', fontSize: '5rem' }} />
//           </IconButton>
//         </Grid>
//       </FloatingCard>
      
//       {/* Big element at the top of the grid with custom height */}
//       <FloatingCard type="translucentSecondary">
//         <CustomizedTimeline />
//       </FloatingCard>
//     </Grid>
//   );
};

export default Home;
