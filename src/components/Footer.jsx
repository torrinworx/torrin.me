import React, { useRef, useState } from 'react'

import { AppBar, Box, Toolbar, IconButton, Typography, Container, Button, Link } from "@mui/material/";

import FloatingCard from "./FloatingCard";
import { text, contentMargin } from "../Theme"


const Footer = () => {
  return (
    <FloatingCard
      type="translucentSecondary"
      component={AppBar}
      position="relative"
      marginTop={contentMargin}
      elevation={0}
    >
      <Container maxWidth="xl">
        {/* Set a fixed height for the Toolbar (twice as large) */}
        <Toolbar disableGutters sx={{ height: "96px" }}>
          Footer tbd
        </Toolbar>
      </Container>
    </FloatingCard>
  );
}

export default Footer;
