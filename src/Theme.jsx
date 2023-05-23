import React, { createContext, useContext, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

export const PalletContext = createContext();

// Colours:
const pallets = {

  // ### Dark Themes ###
  // https://coolors.co/141414-a30029-660019-666666-d6d6d6
  red: {
    colors: {
      primary: "#141414",
      secondary: "#A30029",
      tertiary: "#660019",
      quinary: "#666666",
      text: "#D6D6D6",
    },
    materials: {
      primaryMaterial: {
        color: "#141414",
        roughness: 0.5,
        metalness: 0.2,
      },
      secondaryMaterial: {
        color: "#A30029",
        roughness: 0.8,
        metalness: 0,
        emissiveIntensity: 0,
        emissive: "#A30029",
      },
    },
  },

  // https://coolors.co/141414-6021c0-46188c-666666-d6d6d6
  purple: {
    colors: {
      primary: "#141414",
      secondary: "#6021c0",
      tertiary: "#46188c",
      quinary: "#666666",
      text: "#d6d6d6",
    },
    materials: {
      primaryMaterial: {
        color: "#141414",
        roughness: 0.5,
        metalness: 0.2,
      },
      secondaryMaterial: {
        color: "#6622CC",
        roughness: 0.8,
        metalness: 0,
        emissiveIntensity: 0.1,
        emissive: "#A755C2",
      },
    },
  },

  // ### Light Themes ###
  // https://coolors.co/141414-368f8b-246a73-666666-d6d6d6
  cyan: {
    colors: {
      primary: "#D6D6D6",
      secondary: "#368F8B",
      tertiary: "#246A73",
      quinary: "#666666",
      text: "#141414",
    },
    materials: {
      primaryMaterial: {
        color: "#D6D6D6",
        roughness: 0.5,
        metalness: 0.2,
      },
      secondaryMaterial: {
        color: "#368F8B",
        roughness: 0.8,
        metalness: 0,
        emissiveIntensity: 0.1,
        emissive: "#368F8B",
      },
    },
  },

  // https://coolors.co/141414-fabc2a-db9b06-666666-d6d6d6
  gold: {
    colors: {
      primary: "#D6D6D6",
      secondary: "#FABC2A",
      tertiary: "#DB9B06",
      quinary: "#666666",
      text: "#141414",
    },
    materials: {
      primaryMaterial: {
        color: "#D6D6D6",
        roughness: 0.5,
        metalness: 0.2,
      },
      secondaryMaterial: {
        color: "#FABC2A",
        roughness: 0.8,
        metalness: 0,
        emissiveIntensity: 0.1,
        emissive: "#FABC2A",
      },
    },
  },
};

// Other tweakables
export const shadow = "0px 4px 6px rgba(0, 0, 0, 0.1)"
export const bevelRadius = "20px"
export const pagePadding = "4%"
export const contentMargin = "4%"

export const PalletRadioSelector = ({ onChange, palletOptions, pallets, selectedPallet }) => {
  const selectedPalletData = useContext(PalletContext);

  const hexToRgba = (hex, alpha) => {
    const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // Check if selectedPalletData and selectedPalletData.colors exist before using them
  const backgroundColor = selectedPalletData && selectedPalletData.colors
    ? hexToRgba(selectedPalletData.colors.secondary, 0.3)
    : 'rgba(0,0,0,0.3)';  // Provide a default value

  return (
    <Box sx={{
      display: "flex",
      justifyContent: "center",
    }}>
      <Box sx={{
        position: "relative",
        top: "0",
        zIndex: 2,
        backgroundColor: backgroundColor,
        borderRadius: bevelRadius,
        boxShadow: shadow,
        backdropFilter: "blur(25px)",
        marginTop: "1%",
        marginBottom: "-3%",
        paddingLeft: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <RadioGroup
          value={selectedPallet}
          onChange={onChange}
          row
        >
          {palletOptions.map((option) => (
            <FormControlLabel
              value={option}
              control={
                <Radio sx={{ color: pallets[option].colors.secondary, '&.Mui-checked': { color: pallets[option].colors.secondary } }} />
              }
              key={option}
            />
          ))}
        </RadioGroup>
      </Box>
    </Box>
  );
}

export const ThemeWrapper = ({ children }) => {
  const localStoragePallet = localStorage.getItem('selectedPallet');
  const [selectedPalletName, setSelectedPalletName] = useState(localStoragePallet || "purple");

  const handlePalletChange = (event) => {
    setSelectedPalletName(event.target.value);
    localStorage.setItem('selectedPallet', event.target.value);
  };

  const selectedPallet = pallets[selectedPalletName];


  const theme = createTheme({
    palette: {
      primary: {
        main: selectedPallet.colors.primary,
      },
      secondary: {
        main: selectedPallet.colors.secondary,
      },
      text: {
        primary: selectedPallet.colors.text,
        secondary: selectedPallet.colors.text,
        disabled: selectedPallet.colors.text,
        hint: selectedPallet.colors.text,
      },
    },
    typography: {
      fontFamily:
        "'Poppins', 'Inter', 'Fira Sans', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      h1: {
        fontWeight: 700,
        fontSize: "3.5rem",
        color: selectedPallet.colors.text,
      },
      h2: {
        fontWeight: 600,
        fontSize: "2rem",
        color: selectedPallet.colors.text,
      },
      h3: {
        fontWeight: 500,
        fontSize: "1.75rem",
        color: selectedPallet.colors.text,
      },
      body1: {
        fontWeight: 400,
        fontSize: "1rem",
        color: selectedPallet.colors.text,
      },
      body2: {
        fontWeight: 400,
        fontSize: "0.875rem",
        color: selectedPallet.colors.text,
      },
    },
    // Style override for Background gradient
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage:
              `linear-gradient(to top right, ${selectedPallet.colors.secondary}, ${selectedPallet.colors.primary}, ${selectedPallet.colors.primary})`,
            minHeight: "100vh",
            // Add this to customize scrollbar
            '&::-webkit-scrollbar': {
              width: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: selectedPallet.colors.tertiary,
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-track-piece': {
              background: selectedPallet.colors.primary,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: selectedPallet.colors.secondary,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            color: selectedPallet.colors.text,
            transition: 'background-color 0.3s ease-in', // 0.3s is the duration of the transition. You can adjust this value.
            '&:hover': {
              backgroundColor: selectedPallet.colors.tertiary, // Use whatever color you want for the hover color
            },
          },
        },
      },
    },
  });

  const palletOptions = Object.keys(pallets);

  return (
    <PalletContext.Provider value={selectedPallet}>
      <ThemeProvider theme={theme}>
        <PalletRadioSelector onChange={handlePalletChange} palletOptions={palletOptions} pallets={pallets} selectedPallet={selectedPalletName} />
        <CssBaseline />
        <Box padding={pagePadding}>
          {children}
        </Box>
      </ThemeProvider>
    </PalletContext.Provider>
  );
};

export default ThemeWrapper;
