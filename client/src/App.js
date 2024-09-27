import React from "react";
import { Routes, Route } from "react-router-dom"; // Do not import BrowserRouter here
import Home from "./Home";
import CreateWord from "./CreateWord";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateWord />} />
      </Routes>
    </div>
  );
}

export default App;
