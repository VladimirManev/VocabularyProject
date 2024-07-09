import { useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components/header/Header";
import { Welcome } from "./components/welcome/Welcome";
import { Vocabulary } from "./components/vocabulary/Vocabulary";
import { Settings } from "./components/settings/Settings";
import { Spinner } from "./components/spinner/Spinner";
import { Login } from "./components/login/Login";
import { Register } from "./components/register/Register";
import { AllTraining } from "./components/allTrainig/AllTraining";

function App() {
  const [isLoading, setIsLoading] = useState(false);

  function loading(status) {
    setIsLoading(status);
  }

  return (
    <>
      {isLoading && <Spinner />}
      <Header />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/vocabulary" element={<Vocabulary loading={loading} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/allTraining" element={<AllTraining loading={loading}/>} />
      </Routes>
    </>
  );
}

export default App;
