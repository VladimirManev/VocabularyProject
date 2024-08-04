import { ThemenContext } from "../../context/ThemenContext";
import "./ProgressBar.css";
import { useContext } from "react";

export function ProgressBar({ progress }) {
  const { themeData } = useContext(ThemenContext);
  const progressBarStyle = {
    width: `${progress}%`,
    backgroundColor: themeData?.color3
      ? themeData?.color3
      : "rgb(20, 163, 220)",
  };

  return <div className="progress-bar" style={progressBarStyle}></div>;
}
