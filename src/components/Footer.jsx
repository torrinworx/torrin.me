import React from 'react';

import { Box } from "@mui/material/";

import { contentMargin } from "../Theme";

const Footer = () => {
  return <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: contentMargin,
      }}
    >
    © Torrin Leonard {new Date().getFullYear()}
    </Box>
}

export default Footer;
