import { createContext, useState } from "react";

export const ThemenContext = createContext();

export const ThemenContextProvider = ({ children }) => {
  const [state, setFunction] = useState();

  function setContextThemeData(data) {
    setFunction({ ...data });
  }

  return (
    <ThemenContext.Provider
      value={{
        themeData: state,
        setContextThemeData,
      }}
    >
      {children}
    </ThemenContext.Provider>
  );
};
