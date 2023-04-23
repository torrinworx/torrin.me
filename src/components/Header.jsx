import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import FloatingBox from "./FloatingBox";
import { tertiary } from "../Theme"

const pages = ["About", "Services", "Contact"];

function Header() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  // Set the correct paths to the logo images
  const logoImagePath = "/Logo.png";
  const smallScreenLogoImagePath = "/icon-512x512.png";

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
          {/* Wrap the logo image with a button and set the onClick handler */}
          <Link
            href="/"
            underline="none"
            sx={{ padding: 0, display: "inline-flex" }}
          >
            <img
              src={isSmallScreen ? smallScreenLogoImagePath : logoImagePath}
              alt="Logo"
              style={{
                // Set different heights for the regular logo and smaller icon
                height: isSmallScreen ? "64px" : "80px",
                marginRight: "8px",
                width: "auto",
              }}
            />
          </Link>

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
