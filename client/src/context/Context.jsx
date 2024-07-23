import { createContext, useState } from "react";

export const Context = createContext();

export const Provider = ({ children }) => {
  const [userData, setUserData] = useState();
  const [themeData, setThemeData] = useState();
  const [currentTrainingData, setCurrentTrainingData] = useState();
  const [message, setMessage] = useState();

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

  function showMessage(title, text) {
    setMessage({ title, text });
  }

  function hideMessage() {
    setMessage(undefined);
  }

  return (
    <Context.Provider
      value={{
        setContextUserData,
        clearContextUserData,
        setContextThemeData,
        setContextCurrentTrainingData,
        showMessage,
        hideMessage,
        userData,
        themeData,
        currentTrainingData,
        message,
      }}
    >
      {children}
    </Context.Provider>
  );
};
