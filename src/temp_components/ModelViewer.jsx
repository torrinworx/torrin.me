import React from "react";

const ModelViewer = ({ src, alt = "3D Model" }) => {
  return (
    <model-viewer
      src={src}
      alt={alt}
      ar
      auto-rotate
      camera-controls
      style={{ width: "100%", height: "400px" }}
    ></model-viewer>
  );
};

export default ModelViewer;
