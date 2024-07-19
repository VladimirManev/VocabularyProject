import { createContext, useState } from "react";

export const Context = createContext();

export const Provider = ({ children }) => {
  const [contextData, setContextData] = useState({});

  return (
    <Context.Provider value={{ contextData, setContextData }}>
      {children}    
    </Context.Provider>
  );
};
