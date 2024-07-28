import { useContext } from "react";
import "./Settings.css";
import { Themen } from "./themen/Themen";
import { TranslateMode } from "./translateMode/TranslateMode";
import { LanguageContext } from "../../context/LanguageContext";
import { ChangeLanguage } from "./languages/ChangeLanguage";

export function Settings(props) {
  const { STR } = useContext(LanguageContext);

  return (
    <div className="settings-container">
      <h1>{STR.str41}</h1>
      <ul className="list">
        <li className="list-item">
          <Themen />
        </li>
        <li className="list-item">
          <TranslateMode />
        </li>
        <li className="list-item">
          <ChangeLanguage />
        </li>
      </ul>
    </div>
  );
}
