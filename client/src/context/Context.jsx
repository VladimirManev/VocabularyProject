import { createContext, useState } from "react";

export const Context = createContext();

export const Provider = ({ children }) => {
  const [userData, setUserData] = useState();
  const [themeData, setThemeData] = useState();
  const [currentTrainingData, setCurrentTrainingData] = useState();
  const [notification, setnotification] = useState();

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

  function showNotification(title, text) {
    setnotification({ title, text });
  }

  function hideNotification() {
    setnotification(undefined);
  }

  return (
    <Context.Provider
      value={{
        setContextUserData,
        clearContextUserData,
        setContextThemeData,
        setContextCurrentTrainingData,
        showNotification,
        hideNotification,
        userData,
        themeData,
        currentTrainingData,
        notification,
      }}
    >
      {children}
    </Context.Provider>
  );
};
