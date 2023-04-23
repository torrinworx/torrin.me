import React, { useEffect } from "react";

import Routes from "./Routes";
import ThemeWrapper from "./Theme";
import Header from "./components/Header";
import { SphereCanvas } from "./components/SphereCanvas";

export const App = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "./scripts/main";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return <div>
    <SphereCanvas />
    <ThemeWrapper>
        <Header />
        <Routes />
    </ThemeWrapper>
  </div>
};

export default App;
