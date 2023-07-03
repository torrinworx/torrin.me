import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Header from "./components/Header";
import Collision from "./components/Collision/Collision";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import AresMarketMaster from "./pages/AresMarketMaster";
import OrbKingdom from "./OrbKingdom/pages/OrbKingdom";
import SignUp from "./OrbKingdom/pages/SignUp";
import SignIn from "./OrbKingdom/pages/SignIn";

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

        {/* Add more routes here */}

        {/* Catch-all route for undefined paths */}
        <Route path="*" element={<Collision children={<NotFound />} />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
