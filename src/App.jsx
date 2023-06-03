import React from "react";

import Routes from "./Routes";
import { ThemeWrapper } from "./Theme";

import api from "./Api";

export const App = () => {
  return <ThemeWrapper>
      <Routes />
  </ThemeWrapper>
};

export default App;
