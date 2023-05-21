import React, { useRef, useState } from 'react'

import { AppBar, Box, Toolbar, IconButton, Typography, Menu, Container, Button, Link, MenuItem, useMediaQuery } from "@mui/material/";
import MenuIcon from "@mui/icons-material/Menu";

import FloatingCard from "./FloatingCard";
import { text, contentMargin } from "../Theme"

const pages = ["About", "Services", "Contact"];

const HeaderProfileImage = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const profileImage = './torrin-profile.png';
  const linkRef = useRef(null);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  return (
    <Link
      ref={linkRef}
      href="/"
      underline="none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        display: 'inline-flex',
        alignItems: 'center', // Horizontally align the image and text
        textDecoration: 'none', // Remove default link underline
      }}
    >
      <Box
        sx={{
          height: '80px',
          width: '80px', // Set a fixed width
          marginRight: '20px',
          borderRadius: '50%', // Crop container into a circle
          overflow: 'hidden', // Hide any overflow outside the borderRadius
        }}
      >
        <Box
          component="img"
          src={profileImage}
          alt="Logo"
          sx={{
            height: '90px', // Set a larger height for the image
            width: 'auto',
            position: 'relative',
            top: '-5px', // Adjust the position accordingly
            left: '-2px', // Adjust the position accordingly
          }}
        />
      </Box>
      <Typography
        variant="h2"
        style={{
          display: isMobile ? 'none' : 'inline-block',
          position: 'relative',
        }}
      >
        Torrin Leonard
        <Box
          style={{
            width: isMobile || !isHovered ? '0%' : '100%',
            height: '4px',
            backgroundColor: text,
            position: 'absolute',
            bottom: '-2px',
            left: 0,
            transition: 'width 0.6s cubic-bezier(0.2,0.5,0.6,1)',
          }}
        />
      </Typography>
    </Link>
  );
};

const Header = () => {
  const [anchorElNav, setAnchorElNav] = React.useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <FloatingCard
      type="translucentSecondary"
      component={AppBar}
      position="relative"
      marginBottom={contentMargin}
      elevation={0}
    >
      <Container maxWidth="xl">
        {/* Set a fixed height for the Toolbar (twice as large) */}
        <Toolbar disableGutters sx={{ height: "96px" }}>
          <HeaderProfileImage />

          {/* Use flexGrow to push buttons and Hamburger to the right */}
          <Box sx={{ flexGrow: 1 }}></Box>

          {/* Render larger buttons on larger screens */}
          <Box sx={{ display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={handleCloseNavMenu}
                sx={{
                  my: 2,
                  mx: 0.5, // Apply horizontal margin
                  display: "inline-block", // Change display to inline-block
                  fontSize: "18px", // Increase font size
                  padding: "8px 16px", // Increase padding
                  color: text, // Apply text color
                }}
              >
                {page}
              </Button>
            ))}
          </Box>

          {/* Hamburger menu icon only on smaller screens */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleOpenNavMenu}
            color="inherit"
            height="80px"
            width="auto"
            sx={{ display: { xs: "flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Navigation menu for smaller screens */}
          <Menu
            id="menu-appbar"
            anchorEl={anchorElNav}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{
              display: { xs: "block", md: "none" },
            }}
          >
            {pages.map((page) => (
              <MenuItem key={page} onClick={handleCloseNavMenu}>
                <Typography textAlign="center">{page}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </Container>
    </FloatingCard>
  );
}

export default Header;
