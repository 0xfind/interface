import { Route, Routes } from "react-router-dom";

import Assets from "./pages/assets";
import Claim from "./pages/claim";
import Detail from "./pages/detail";
import Home from "./pages/home";
import Create from "./pages/create";
import Page404 from "./pages/404";

const RouterMap = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:tokenId" element={<Detail />} />
      <Route path="/:tokenId/claim" element={<Claim />} />
      <Route path="/create" element={<Create />} />
      <Route path="/assets" element={<Assets />} />
      <Route path="/404" element={<Page404 />} />
    </Routes>
  );
};

export default RouterMap;
