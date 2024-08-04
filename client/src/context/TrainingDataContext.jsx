import { createContext, useState } from "react";

export const TrainingDataContext = createContext();

export const TrainingDataContextProvider = ({ children }) => {
  const [state, setFunction] = useState();

  function setContextCurrentTrainingData(data) {
    setFunction({ ...data });
  }

  return (
    <TrainingDataContext.Provider
      value={{
        setContextCurrentTrainingData,
        currentTrainingData: state,
      }}
    >
      {children}
    </TrainingDataContext.Provider>
  );
};
