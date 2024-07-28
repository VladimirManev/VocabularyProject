import { createContext, useState } from "react";
import { languagesData } from "../languages/languages";

export const LanguageContext = createContext();

export const LanguageContextProvider = ({ children }) => {
  const [state, setState] = useState("en");

  function setLanguageContextData(data) {
    setState(data);
  }
  const STR = languagesData[state];

  return (
    <LanguageContext.Provider
      value={{
        STR,
        setLanguageContextData,
        languageContextAbriviation: state,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
