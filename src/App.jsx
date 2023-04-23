import React from "react";

import Routes from "./Routes";
import ThemeWrapper from "./Theme";
import Header from "./components/Header";

export const App = () => {

  return <div>
    <ThemeWrapper>
        <Header />
        <Routes />
    </ThemeWrapper>
  </div>
};

export default App;
