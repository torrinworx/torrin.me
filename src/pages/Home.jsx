import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import FloatingCard from "../components/FloatingCard";

import { contentMargin } from "../Theme";

export const Home = () => {
  return <Grid container spacing={contentMargin} justifyContent="center">
    <FloatingCard type="invisible" size="medium">
      <Grid container direction="column" sx={{ minHeight: '100%' }}>
        <Grid item xs={12}>
          <Typography variant="h1" gutterBottom>
            CEO/CO-Founder <br />
            Software Developer <br />
          </Typography>
        </Grid>
        <Grid item xs={12} md={6} sx={{ marginTop: 'auto' }}>
          <Typography variant="h3" gutterBottom>
            Creating cool 3D and open-source stuff,<br />
            because why not ok?!
          </Typography>
        </Grid>
      </Grid>
    </FloatingCard>
    {/* Big element at the top of the grid with custom height */}
    <FloatingCard type="translucentSecondary" size="large">
      <Box
        sx={{
          textAlign: "center",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "800px", // Set custom height
        }}
      >
        {/* Content */}
      </Box>
    </FloatingCard>
    {/* First 1x2 element with custom height */}
    <FloatingCard type="translucentSecondary" size="halfWidth">
      <Box
        sx={{
          textAlign: "center",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "200px", // Set custom height
        }}
      >
        {/* Content */}
      </Box>
    </FloatingCard>
    {/* Second 1x2 element with custom height */}
    <FloatingCard type="translucentSecondary" size="halfWidth">
      <Box
        sx={{
          textAlign: "center",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "200px", // Set custom height
        }}
      >
        {/* Content */}
      </Box>
    </FloatingCard>
    {/* Add more Grid items with FloatingBox cards as needed */}
  </Grid>
};

export default Home;
