import React from "react";

import Routes from "./Routes";
import ThemeWrapper from "./Theme";
import Header from "./components/Header";
import SphereCanvas from "./components/SphereCanvas"
export const App = () => {
  return (
    <ThemeWrapper>
        <Header />
        <Routes />
    </ThemeWrapper>
  );
};

export default App;
