import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box"; // Correct import for Box component

// Colours:
export const primary = "#212529"
export const secondary = "#ADB5BD"
export const tertiary = "#F8F9FA" // Text

// https://coolors.co/f8f9fa-e9ecef-dee2e6-ced4da-adb5bd-6c757d-495057-343a40-212529
// https://coolors.co/03071e-370617-6a040f-9d0208-d00000-dc2f02-e85d04-f48c06-faa307-ffba08

const theme = createTheme({
  palette: {
    primary: {
      main: primary,
    },
    secondary: {
      main: secondary,
    },
    text: {
      primary: tertiary,
      secondary: tertiary,
      disabled: tertiary,
      hint: tertiary,
    },
  },
  typography: {
    fontFamily:
      "'Poppins', 'Inter', 'Fira Sans', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
      color: tertiary,
    },
    h2: {
      fontWeight: 600,
      fontSize: "2rem",
      color: tertiary,
    },
    h3: {
      fontWeight: 500,
      fontSize: "1.75rem",
      color: tertiary,
    },
    body1: {
      fontWeight: 400,
      fontSize: "1rem",
      color: tertiary,
    },
    body2: {
      fontWeight: 400,
      fontSize: "0.875rem",
      color: tertiary,
    },
  },
  // Style override for Background gradient
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            `linear-gradient(to top right, ${secondary}, ${primary})`,
          minHeight: "100vh",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        label: {
          color: tertiary,
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
