import { useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Welcome } from "./components/Welcome";
import { Vocabulary } from "./components/Vocabulary";
import { Settings } from "./components/Settings";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}

export default App;
