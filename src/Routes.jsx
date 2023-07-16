import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Header from "./Components/Header";
import Collision from "./Components/Collision/Collision";

import Home from "./Pages/Home";
import NotFound from "./Pages/NotFound";
import ComingSoon from "./Pages/ComingSoon";
import AresMarketMaster from "./Pages/AresMarketMaster";
import OrbKingdomTest from "./Pages/OrbKingdomGameTest";
import OrbKingdom from "./OrbKingdom/Pages/OrbKingdom";
import SignUp from "./OrbKingdom/Pages/SignUp";
import SignIn from "./OrbKingdom/Pages/SignIn";

const AppRoutes = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Collision children={<Home />} />} />
        <Route path="/games" element={<Collision children={<ComingSoon />} />} />
        <Route path="/contact" element={<Collision children={<ComingSoon />} />} />
        <Route path="/aresmarketmaker" element={<AresMarketMaster />} />

        <Route path="/orbkingdom" element={<OrbKingdom />} />
        <Route path="/orbkingdom/sign-up" element={<SignUp />} />
        <Route path="/orbkingdom/sign-in" element={<SignIn />} />

        <Route path="/orbkingdom-test" element={<OrbKingdomTest />} />


        {/* Add more routes here */}

        {/* Catch-all route for undefined paths */}
        <Route path="*" element={<Collision children={<NotFound />} />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
