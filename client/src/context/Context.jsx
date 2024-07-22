import { createContext, useState } from "react";

export const Context = createContext();

export const Provider = ({ children }) => {
  const [userData, setUserData] = useState();
  const [themeData, setThemeData] = useState();
  const [currentTrainingData, setCurrentTrainingData] = useState();

  function setContextUserData(data) {
    setUserData({ ...data });
  }

  function setContextThemeData(data) {
    setThemeData({ ...data });
  }

  function clearContextUserData() {
    setUserData(undefined);
  }

  function setContextCurrentTrainingData(data) {
    setCurrentTrainingData({ ...data });
  }

  return (
    <Context.Provider
      value={{
        setContextUserData,
        clearContextUserData,
        setContextThemeData,
        setContextCurrentTrainingData,
        userData,
        themeData,
        currentTrainingData,
      }}
    >
      {children}
    </Context.Provider>
  );
};
