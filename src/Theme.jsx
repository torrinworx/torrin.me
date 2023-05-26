import _ from 'lodash';

import React, { useEffect, useMemo, createContext, useContext, useState } from "react";

import { Box, Radio, RadioGroup, FormControlLabel, Switch } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { PalettesOptions, themeModes } from "./Palettes";
import ThemeDefinition from "./ThemeDefinition";

const defaultThemeMode = themeModes.dark
const defaultPalette = PalettesOptions(defaultThemeMode).red;

export const ThemeContext = createContext({
  selectedThemeMode: defaultThemeMode,
  selectedPalette: defaultPalette,
  setSelectedThemeMode: () => { },
  setSelectedPalette: () => { },
});

// Other tweakables
export const shadow = "0px 4px 6px rgba(0, 0, 0, 0.1)"
export const bevelRadius = "20px"
export const pagePadding = "4%"
export const contentMargin = "4%"

const hexToRgba = (hex, alpha) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

const ThemeSelector = () => {
  const { selectedThemeMode, selectedPalette, setSelectedThemeMode, setSelectedPalette } = useContext(ThemeContext);

  // Update palettes when themeMode changes
  const handleThemeChange = (newThemeMode) => {
    setSelectedThemeMode(newThemeMode);
    // Also update the palette for the new theme mode
    const newPalettes = PalettesOptions(newThemeMode);
    const newPalette = newPalettes[Object.keys(newPalettes).find(key => _.isEqual(selectedPalette.name, newPalettes[key].name))];
    setSelectedPalette(newPalette);
  };

  const handlePaletteChange = (palette) => {
    setSelectedPalette(palette);
  };

  const palettes = PalettesOptions(selectedThemeMode)

  const backgroundColor = selectedPalette?.colors?.secondary
    ? hexToRgba(selectedPalette.colors.secondary, 0.3)
    : 'rgba(0,0,0,0.3)';

  return (
    <Box sx={{
      display: "flex",
      justifyContent: "flex-start",
      alignItems: "center",
      flexDirection: "column",
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <RadioGroup
          value={selectedPalette}
          onChange={(event) => handlePaletteChange(palettes[event.target.value])}
          row
        >
          {Object.keys(palettes).map((option) => {
            return (
              <FormControlLabel
                value={option}
                control={
                  <Radio sx={{ color: palettes[option].colors.secondary, '&.Mui-checked': { color: palettes[option].colors.secondary } }} />
                }
                checked={_.isEqual(selectedPalette, palettes[option])}
                key={option}
              />
            );
          })}
        </RadioGroup>
        <Switch
          checked={_.isEqual(selectedThemeMode, themeModes.dark)}
          onChange={(event) => {
            handleThemeChange(event.target.checked ? themeModes.dark : themeModes.light);
          }}
          sx={{
            '&.MuiSwitch-switchBase.Mui-checked': {
              color: 'white',
            },
            '&.MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: 'white',
            },
            '&.Mui-checked + .MuiSwitch-track': {
              backgroundColor: 'black',
            },
          }}
        />
      </Box>
    </Box>
  );
}

export const ThemeWrapper = ({ children }) => {
  const [selectedThemeMode, setSelectedThemeMode] = useState(themeModes[localStorage.getItem('themeMode')] || defaultThemeMode);
  const [selectedPalette, setSelectedPalette] = useState(PalettesOptions(selectedThemeMode)[localStorage.getItem('palette')] || defaultPalette);

  useEffect(() => {
    localStorage.setItem('themeMode', selectedThemeMode.name);
  }, [selectedThemeMode]);

  useEffect(() => {
    localStorage.setItem('palette', selectedPalette.name);
  }, [selectedPalette]);

  const contextValue = useMemo(() => ({
    selectedThemeMode,
    selectedPalette,
    setSelectedThemeMode,
    setSelectedPalette
  }), [selectedThemeMode, selectedPalette]);

  const theme = ThemeDefinition(selectedPalette)

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <ThemeSelector />
        <CssBaseline />
        <Box padding={pagePadding}>
          {children}
        </Box>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeWrapper;
