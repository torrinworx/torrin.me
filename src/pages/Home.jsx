import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import FloatingBox from "../components/FloatingBox";

const Home = () => {
  return (
    <Grid container spacing={3} justifyContent="center">
      <Grid item xs={12}>
        <FloatingBox bgColor="transparent">
          <Grid container alignItems="center">
            <Grid item xs={12} md={6}>
              <Box p={3}>
                <Typography variant="h2" gutterBottom>
                  Custom 3D <br />
                  NFT Generation
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: "400px", width: "100%" }}>
                {/* Set explicit height here */}
              </Box>
            </Grid>
          </Grid>
        </FloatingBox>
      </Grid>

      {/* Big element at the top of the grid with custom height */}
      <Grid item xs={12} md={12}>
        <FloatingBox bgColor="transparent">
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
        </FloatingBox>
      </Grid>
      {/* First 1x2 element with custom height */}
      <Grid item xs={12} md={6}>
        <FloatingBox>
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
        </FloatingBox>
      </Grid>
      {/* Second 1x2 element with custom height */}
      <Grid item xs={12} md={6}>
        <FloatingBox>
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
        </FloatingBox>
      </Grid>
      {/* Add more Grid items with FloatingBox cards as needed */}
    </Grid>
  );
};

export default Home;
