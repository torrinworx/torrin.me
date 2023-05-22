import React from "react";

import Routes from "./Routes";
import { ThemeWrapper } from "./Theme";
import Header from "./components/Header";
import Footer from "./components/Footer";

export const App = () => {
  return <ThemeWrapper>
      <Header />
      <Routes />
      <Footer />
  </ThemeWrapper>
};

export default App;
