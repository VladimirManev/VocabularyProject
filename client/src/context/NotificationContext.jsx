import { createContext, useState } from "react";

export const NotificationContext = createContext();

export const NotificationContextProvider = ({ children }) => {
  const [state, setFunction] = useState();

  function showNotification(title, text) {
    setFunction({ title, text });
  }

  function hideNotification() {
    setFunction(undefined);
  }

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        hideNotification,
        notification: state,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
