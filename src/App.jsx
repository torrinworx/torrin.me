import React from "react";
// import { BrowserRouter as useRoutesMatch } from "react-router-dom";

import Routes from "./Routes";
import ThemeWrapper from "./Theme";
import Header from "./components/Header";
import InteractiveSpheres from "./components/InteractiveSpheres";

export const App = () => {
  return <InteractiveSpheres>
      <ThemeWrapper>
        <Header />
        <Routes />
      </ThemeWrapper>
    </InteractiveSpheres>
};

export default App;
