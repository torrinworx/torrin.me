import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import FloatingCard from "../components/FloatingCard";
import SphereTest from "../components/InteractiveSpheres";

import { contentMargin } from "../Theme";

const Home = () => {
  return <>

    <Grid container spacing={contentMargin} justifyContent="center">
      <Grid item xs={12}>
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
      </Grid>

      {/* Big element at the top of the grid with custom height */}
      <Grid item xs={12} md={12}>
        <FloatingCard type="translucentSecondary">
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
      </Grid>
      {/* First 1x2 element with custom height */}
      <Grid item xs={12} md={6}>
        <FloatingCard type="translucentSecondary">
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
      </Grid>
      {/* Second 1x2 element with custom height */}
      <Grid item xs={12} md={6}>
        <FloatingCard type="translucentSecondary">
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
      </Grid>
      {/* Add more Grid items with FloatingBox cards as needed */}
    </Grid>
    <SphereTest />

    </>
};

export default Home;
