import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Collision from "./components/Collision/Collision"

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import AresMarketMaster from "./pages/AresMarketMaster";
import { Test1 } from "./pages/Test1";

const AppRoutes = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Collision children={<Home />} />} />
        <Route path="/games" element={<Collision children={<ComingSoon />} />} />
        <Route path="/contact" element={<Collision children={<ComingSoon />} />} />
        <Route path="/aresmarketmaker" element={<AresMarketMaster />} />

        <Route path="/test1" element={<Test1 />} />

        {/* Add more routes here */}

        {/* Catch-all route for undefined paths */}
        <Route path="*" element={<Collision children={<NotFound />} />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default AppRoutes;