import "./ProgressBar.css";
import { useContext } from "react";
import { Context } from "../../context/Context";

export function ProgressBar({ progress }) {
  const { contextData } = useContext(Context);
  const progressBarStyle = {
    width: `${progress}%`,
    backgroundColor: contextData.currentThemenData?.color3,
  };

  return <div className="progress-bar" style={progressBarStyle}></div>;
}
