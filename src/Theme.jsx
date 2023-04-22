import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box"; // Correct import for Box component

const theme = createTheme({
  palette: {
    primary: {
      main: "rgb(255,1,126)",
    },
    secondary: {
      main: "rgb(0,79,254)",
    },
    tertiary: {
      main: "rgb(75,207,238)",
    },
  },
  typography: {
    fontFamily:
      "'Poppins', 'Inter', 'Fira Sans', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
    },
    h2: {
      fontWeight: 600,
      fontSize: "2rem",
    },
    h3: {
      fontWeight: 500,
      fontSize: "1.75rem",
    },
    body1: {
      fontWeight: 400,
      fontSize: "1rem",
    },
    body2: {
      fontWeight: 400,
      fontSize: "0.875rem",
    },
  },
  // Style ovverride for Background gradient
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "linear-gradient(to top right, #ff33bd, #79a1ff, #33eaff)",
          minHeight: "100vh",
        },
      },
    },
  },
});

const ThemeWrapper = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Apply padding to the ThemeWrapper and margin to its children */}
      <Box padding="1.5em">
        {children}
      </Box>
    </ThemeProvider>
  );
};

export default ThemeWrapper;
