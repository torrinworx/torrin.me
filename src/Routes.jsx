import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Collision from "./components/Collision/Collision"

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import { Test1 } from "./pages/Test1";

const AppRoutes = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Collision children={<Home />} />} />
        <Route path="/games" element={<Collision children={<ComingSoon />} />} />
        <Route path="/contact" element={<Collision children={<ComingSoon />} />} />
        <Route path="/test1" element={<Test1 />} />

        {/* Add more routes here */}

        {/* Catch-all route for undefined paths */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default AppRoutes;