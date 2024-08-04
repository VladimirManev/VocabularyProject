import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/Context";
import { BrowserRouter } from "react-router-dom";
import { TranslateModeProvider } from "./context/TranslateModeContext.jsx";
import { LanguageContextProvider } from "./context/LanguageContext.jsx";
import { ThemenContextProvider } from "./context/ThemenContext.jsx";
import { NotificationContextProvider } from "./context/NotificationContext.jsx";
import { TrainingDataContextProvider } from "./context/TrainingDataContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <TrainingDataContextProvider>
        <NotificationContextProvider>
          <ThemenContextProvider>
            <TranslateModeProvider>
              <LanguageContextProvider>
                <App />
              </LanguageContextProvider>
            </TranslateModeProvider>
          </ThemenContextProvider>
        </NotificationContextProvider>
      </TrainingDataContextProvider>
    </AuthProvider>
  </BrowserRouter>
  // </StrictMode>
);
