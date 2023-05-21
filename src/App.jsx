import React from "react";

import Routes from "./Routes";
import ThemeWrapper from "./Theme";
import Header from "./components/Header";
import InteractiveSpheres from "./components/InteractiveSpheres";
import Footer from "./components/Footer";

export const App = () => {
  return <InteractiveSpheres>
    <ThemeWrapper>
      <Header />
      <Routes />
      <Footer />
    </ThemeWrapper>
  </InteractiveSpheres>
};

export default App;
