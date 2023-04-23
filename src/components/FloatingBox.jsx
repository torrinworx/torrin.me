import * as React from "react";
import Box from "@mui/material/Box";
import { primary, secondary } from "../Theme";

const FloatingBox = ({ children, bgColor, ...props }) => {
  const hexToRgba = (hex, alpha) => {
    const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // Define a mapping of color names to their corresponding values
  const colorMap = {
    translucentPrimary: hexToRgba(primary, 0.3),
    translucentSecondary: hexToRgba(secondary, 0.3),
    transparent: "rgba(255, 255, 255, 0.0)",
  };
  // Determine the background color based on the provided prop
  const backgroundColor =
    colorMap[bgColor] || bgColor || colorMap.translucentWhite;

  return (
    <Box
      sx={{
        backgroundColor, // Use the determined background color
        borderRadius: "20px", // Beveled corners
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", // Add shadow style
        ...props.sx, // Allow for additional styles to be passed
      }}
      {...props} // Pass through any additional props
    >
      {children}
    </Box>
  );
};

export default FloatingBox;
