import "./ProgressBar.css";
import { useContext } from "react";
import { Context } from "../../context/Context";

export function ProgressBar({ progress }) {
  const { themeData } = useContext(Context);
  const progressBarStyle = {
    width: `${progress}%`,
    backgroundColor: themeData?.color3
      ? themeData?.color3
      : "rgb(20, 163, 220)",
  };

  return <div className="progress-bar" style={progressBarStyle}></div>;
}
