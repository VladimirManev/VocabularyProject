import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState();

  function setContextUserData(data) {
    setUserData({ ...data });
  }

  function clearContextUserData() {
    setUserData(undefined);
  }

  return (
    <AuthContext.Provider
      value={{
        setContextUserData,
        clearContextUserData,
        userData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
