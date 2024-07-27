import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "./context/Context";
import { BrowserRouter } from "react-router-dom";
import { TranslateModeProvider } from "./context/TranslateModeContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Provider>
        <TranslateModeProvider>
          <App />
        </TranslateModeProvider>
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
