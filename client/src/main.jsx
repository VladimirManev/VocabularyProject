import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "./context/Context";
import { BrowserRouter } from "react-router-dom";
import { TranslateModeProvider } from "./context/TranslateModeContext.jsx";
import { LanguageContextProvider } from "./context/LanguageContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <BrowserRouter>
    <Provider>
      <TranslateModeProvider>
        <LanguageContextProvider>
          <App />
        </LanguageContextProvider>
      </TranslateModeProvider>
    </Provider>
  </BrowserRouter>
  // </StrictMode>
);
