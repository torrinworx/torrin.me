import { createTheme } from "@mui/material/styles";

export const ThemeDefinition = (selectedPalette) => {
    return createTheme({
        palette: {
            primary: {
                main: selectedPalette.colors.primary,
            },
            secondary: {
                main: selectedPalette.colors.secondary,
            },
            text: {
                primary: selectedPalette.colors.text,
                secondary: selectedPalette.colors.text,
                disabled: selectedPalette.colors.text,
                hint: selectedPalette.colors.text,
            },
        },
        typography: {
            fontFamily:
                "'Poppins', 'Inter', 'Fira Sans', 'Roboto', 'Helvetica', 'Arial', sans-serif",
            h1: {
                fontWeight: 700,
                fontSize: "3.5rem",
                color: selectedPalette.colors.text,
            },
            h2: {
                fontWeight: 600,
                fontSize: "2rem",
                color: selectedPalette.colors.text,
            },
            h3: {
                fontWeight: 500,
                fontSize: "1.75rem",
                color: selectedPalette.colors.text,
            },
            body1: {
                fontWeight: 400,
                fontSize: "1rem",
                color: selectedPalette.colors.text,
            },
            body2: {
                fontWeight: 400,
                fontSize: "0.875rem",
                color: selectedPalette.colors.text,
            },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundImage:
                            `linear-gradient(to top right, ${selectedPalette.colors.secondary}, ${selectedPalette.colors.primary}, ${selectedPalette.colors.primary})`,
                        minHeight: "100vh",
                        '&::-webkit-scrollbar': {
                            width: '10px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: selectedPalette.colors.tertiary,
                            borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-track-piece': {
                            background: selectedPalette.colors.primary,
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: selectedPalette.colors.secondary,
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        color: selectedPalette.colors.text,
                        transition: 'background-color 0.3s ease-in',
                        '&:hover': {
                            backgroundColor: selectedPalette.colors.tertiary,
                        },
                    },
                },
            },
        },
    });
};

export default ThemeDefinition;
