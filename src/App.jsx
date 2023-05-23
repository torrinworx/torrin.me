import React from "react";

import Routes from "./Routes";
import { ThemeWrapper } from "./Theme";
import InteractiveSpheres from "./components/InteractiveSpheres";

export const App = () => {
  return <ThemeWrapper>
    <InteractiveSpheres>
      <Routes />
    </InteractiveSpheres>
  </ThemeWrapper>
};

export default App;
