import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box"; // Correct import for Box component

// Colours:
// https://coolors.co/f8f9fa-e9ecef-dee2e6-ced4da-adb5bd-6c757d-495057-343a40-212529
// https://coolors.co/03071e-370617-6a040f-9d0208-d00000-dc2f02-e85d04-f48c06-faa307-ffba08
export const primary = "#000000"
export const secondary = "#800020"
export const tertiary = "#660019"
export const quinary = "#333333"

export const text = "#D6D6D6" // Text

export const shadow = "0px 4px 6px rgba(0, 0, 0, 0.1)"
export const bevelRadius = "20px"
export const pagePadding = "4%"
export const contentMargin = "4%"

const theme = createTheme({
  palette: {
    primary: {
      main: primary,
    },
    secondary: {
      main: secondary,
    },
    text: {
      primary: text,
      secondary: text,
      disabled: text,
      hint: text,
    },
  },
  typography: {
    fontFamily:
      "'Poppins', 'Inter', 'Fira Sans', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: "3.5rem",
      color: text,
    },
    h2: {
      fontWeight: 600,
      fontSize: "2rem",
      color: text,
    },
    h3: {
      fontWeight: 500,
      fontSize: "1.75rem",
      color: text,
    },
    body1: {
      fontWeight: 400,
      fontSize: "1rem",
      color: text,
    },
    body2: {
      fontWeight: 400,
      fontSize: "0.875rem",
      color: text,
    },
  },
  // Style override for Background gradient
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            `linear-gradient(to top right, ${secondary}, ${primary}, ${primary})`,
          minHeight: "100vh",
          // Add this to customize scrollbar
          '&::-webkit-scrollbar': {
            width: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: tertiary,
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-track-piece': {
            background: primary, 
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: secondary,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: text,
          transition: 'background-color 0.3s ease-in', // 0.3s is the duration of the transition. You can adjust this value.
          '&:hover': {
            backgroundColor: tertiary, // Use whatever color you want for the hover color
          },
        },
      },
    },
  },
});

const ThemeWrapper = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box padding={pagePadding}>
        {children}
      </Box>
    </ThemeProvider>
  );
};

export default ThemeWrapper;
