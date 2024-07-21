import "./Settings.css";
import { Themen } from "./themen/Themen";

export function Settings(props) {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <ul className="list">
        <li className="list-item">
          <Themen />
        </li>
      </ul>
    </div>
  );
}
