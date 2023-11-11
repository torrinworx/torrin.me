import React, { useContext } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { ThemeContext, shadow, bevelRadius, contentPadding } from "../Theme";

const FloatingCard = ({ children, type, size, zIndex, ...props }) => {
  /*
  types: translucentPrimary, translucentSecondary, invisible
  
  sizes: large, medium, small, halfWidth
  */
  const { selectedPalette } = useContext(ThemeContext);

  const hexToRgba = (hex, alpha) => {
    const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const colorMap = {
    translucentPrimary: {
      color: hexToRgba(selectedPalette.colors.primary, 0.3),
      defaultZIndex: 1,
      blur: "25px",
    },
    translucentSecondary: {
      color: hexToRgba(selectedPalette.colors.secondary, 0.3),
      defaultZIndex: 1,
      blur: "25px",
    },
    invisible: {
      color: "rgba(255, 255, 255, 0.0)",
      defaultZIndex: -1,
    },
  };

  const sizeConfig = {
    large: { height: "75vh", xs: 12, sm: 12, md: 12 },
    medium: { height: "50rem", xs: 12, sm: 12, md: 12 },
    small: { height: "25rem", xs: 12, sm: 12, md: 12 },
    halfWidth: { height: "25rem", xs: 12, sm: 12, md: 6 },
    default: { xs: 12, sm: 12, md: 12 },
  };

  const { color, defaultZIndex, blur } = colorMap[type] || {};
  const { height, xs, sm, md } = size ? sizeConfig[size] : sizeConfig.default;

  // Override the default zIndex with the user provided zIndex, if available
  const appliedZIndex = zIndex !== undefined ? zIndex : defaultZIndex;

  return (
    <Grid item xs={xs} sm={sm} md={md} style={{ zIndex: appliedZIndex }}>
      <Box
        sx={{
          backgroundColor: color,
          borderRadius: bevelRadius,
          boxShadow: type === "invisible" ? "none" : shadow,
          ...(height && { height }),
          backdropFilter: blur ? `blur(${blur})` : "none",
          padding: contentPadding,
          zIndex: appliedZIndex,
          ...props.sx,
        }}
        {...props}
      >
        {children}
      </Box>
    </Grid>
  );
};

export default FloatingCard;
