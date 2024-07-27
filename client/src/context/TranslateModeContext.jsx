import { createContext, useState } from "react";

export const TranslateModeContext = createContext();

export const TranslateModeProvider = ({ children }) => {
  const [state, setFunction] = useState(
    '{"sourceLanguage": "bg","translationLanguage1": "en"}'
  );

  const translateMode = JSON.parse(state);

  function setTranslateMode(mode) {
    setFunction(mode);
  }

  return (
    <TranslateModeContext.Provider
      value={{
        translateMode,
        setTranslateMode,
      }}
    >
      {children}
    </TranslateModeContext.Provider>
  );
};
