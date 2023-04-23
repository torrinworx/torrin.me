import React, { useRef } from 'react'

import { AppBar, Box, Toolbar, IconButton, Typography, Menu, Container, Button, Link, MenuItem } from "@mui/material/";
import MenuIcon from "@mui/icons-material/Menu";
import { keyframes } from '@mui/system';

import FloatingBox from "./FloatingBox";
import { tertiary } from "../Theme"

const pages = ["About", "Services", "Contact"];

const HeaderProfileImage = () => {
  const underlineHoverExpand = keyframes`
    from {
      width: 0;
    }
    to {
      width: 100%;
    }
  `;

  const underlineHoverContract = keyframes`
    from {
      width: 100%;
    }
    to {
      width: 0;
    }
  `;

  const profileImage = "./torrin-profile.png";
  const linkRef = useRef(null);

  const handleMouseLeave = () => {
    linkRef.current.classList.add('hovered');
    setTimeout(() => {
      linkRef.current.classList.remove('hovered');
    }, 600);
  };

  return (
    <Link
      ref={linkRef}
      href="/"
      underline="none"
      sx={{
        display: "inline-flex",
        alignItems: "center", // Horizontally align the image and text
        textDecoration: 'none', // Remove default link underline
        '& .underline': {
          position: "relative",
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '0',
            height: '2px',
            background: tertiary,
          },
        },
        '&:hover .underline': {
          '&::before': {
            animation: `${underlineHoverExpand} 0.6s forwards`,
          },
        },
        '&.hovered .underline': {
          '&::before': {
            animation: `${underlineHoverContract} 0.6s forwards`,
          },
        },
      }}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        sx={{
          height: "80px",
          width: "80px", // Set a fixed width
          marginRight: "20px",
          borderRadius: "50%", // Crop container into a circle
          overflow: "hidden", // Hide any overflow outside the borderRadius
        }}
      >
        <Box
          component="img"
          src={profileImage}
          alt="Logo"
          sx={{
            height: "90px", // Set a larger height for the image
            width: "auto",
            position: "relative",
            top: "-5px", // Adjust the position accordingly
            left: "-2px", // Adjust the position accordingly
          }}
        />
      </Box>
      <Typography
        variant="h2"
        className="underline"
        sx={{
          position: "relative",
        }}
      >
        Torrin Leonard
      </Typography>
    </Link>
  );
};

function Header() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  // const theme = useTheme();
  // const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <FloatingBox
      bgColor="translucentSecondary"
      component={AppBar}
      position="static"
      marginBottom="1.5em"
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
                  display: "block",
                  fontSize: "18px", // Increase font size
                  padding: "8px 16px", // Increase padding
                  color: tertiary, // Apply text color
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
    </FloatingBox>
  );
}

export default Header;
