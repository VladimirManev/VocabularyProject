import "./Settings.css";
import { Themen } from "./themen/Themen";
import { TranslateMode } from "./translateMode/TranslateMode";

export function Settings(props) {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <ul className="list">
        <li className="list-item">
          <Themen />
        </li>
        <li className="list-item">
          <TranslateMode />
        </li>
      </ul>
    </div>
  );
}
