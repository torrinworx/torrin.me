import React from 'react'

import { AppBar, Box, Toolbar, Container } from "@mui/material/";

import FloatingCard from "./FloatingCard";
import { contentMargin } from "../Theme"

const Footer = () => {
  return <>
    <FloatingCard
      type="translucentSecondary"
      component={AppBar}
      position="relative"
      marginTop={contentMargin}
    >
      <Container maxWidth="xl">
        {/* Set a fixed height for the Toolbar (twice as large) */}
        <Toolbar disableGutters sx={{ height: "96px" }}>
          Footer tbd
        </Toolbar>
      </Container>
    </FloatingCard>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: contentMargin,
      }}
    >
      © Torrin Leonard {new Date().getFullYear()}
    </Box>
  </>
}

export default Footer;
