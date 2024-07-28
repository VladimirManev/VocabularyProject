import { createContext, useState } from "react";

export const TranslateModeContext = createContext();

export const TranslateModeProvider = ({ children }) => {
  const [state, setFunction] = useState(
    '{"sourceLanguage": "bg","translationLanguage1": "en"}'
  );

  //   const translateMode = JSON.parse(state);

  function setTranslateMode(data) {
    setFunction(data);
  }

  return (
    <TranslateModeContext.Provider
      value={{
        translateModeJSON: state,
        setTranslateMode,
      }}
    >
      {children}
    </TranslateModeContext.Provider>
  );
};
