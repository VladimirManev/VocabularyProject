import "./ProgressBar.css";

export function ProgressBar({ progress, color }) {
  const progressBarStyle = {
    width: `${progress}%`,
    backgroundColor: color,
  };

  return <div className="progress-bar" style={progressBarStyle}></div>;
}
