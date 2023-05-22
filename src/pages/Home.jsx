import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import FloatingCard from "../components/FloatingCard";
// import InteractiveSpheres from "../components/InteractiveSpheres";

import { contentMargin } from "../Theme";

const Home = () => {
  return <Grid container spacing={contentMargin} justifyContent="center">
    <FloatingCard type="invisible" size="large">
      <Grid container alignItems="center">
        <Grid item xs={12} md={12}>
          <Box p={3}>
            <Typography variant="h1" gutterBottom>
              Full Stack <br />
              Software Developer
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: "400px", width: "100%" }}>
            {/* Set explicit height here */}
          </Box>
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