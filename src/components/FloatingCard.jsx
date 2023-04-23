import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { primary, secondary, shadow, bevelRadius } from "../Theme";

const FloatingCard = ({ children, type, size, ...props }) => {
  /*
  types: translucentPrimary, trnalsucentSecondary, invisible
  
  sizes: large, medium, small, haldWidth
  */
  const hexToRgba = (hex, alpha) => {
    const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const colorMap = {
    translucentPrimary: hexToRgba(primary, 0.3),
    translucentSecondary: hexToRgba(secondary, 0.3),
    invisible: "rgba(255, 255, 255, 0.0)",
  };

  const sizeConfig = {
    large: { height: "800px", xs: 12, sm: 12, md: 12 },
    medium: { height: "400px", xs: 12, sm: 12, md: 12 },
    small: { height: "200px", xs: 12, sm: 12, md: 12 },
    halfWidth: { height: "200px", xs: 12, sm: 12, md: 6 },
  };

  const backgroundColor = colorMap[type];
  const { height, xs, sm, md } = sizeConfig[size] || {};

  return (
    <Grid item xs={xs} sm={sm} md={md}>
      <Box
        sx={{
          backgroundColor,
          borderRadius: bevelRadius,
          boxShadow: type === "invisible" ? "none" : shadow,
          height,
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
