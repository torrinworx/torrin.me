import React from "react";

import Routes from "./Routes";
import ThemeWrapper from "./Theme";
import Header from "./components/Header";
import InteractiveSpheres from "./components/InteractiveSpheres";

export const App = () => {
  return <div>
    <InteractiveSpheres>
      <ThemeWrapper>
        <Header />
        <Routes />
      </ThemeWrapper>
    </InteractiveSpheres>
  </div>
};

export default App;
