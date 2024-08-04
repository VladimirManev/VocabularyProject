import "./Themen.css";
import { useContext, useEffect, useState } from "react";

import { themenData } from "./themenData";
import { LanguageContext } from "../../../context/LanguageContext";
import { ThemenContext } from "../../../context/ThemenContext";

export function Themen(props) {
  const { STR } = useContext(LanguageContext);
  const { setContextThemeData, themeData } = useContext(ThemenContext);
  const [currentTheme, setCurrentTheme] = useState(
    themeData ? themeData.name : "piano"
  );
  useEffect(() => {
    setContextThemeData(themenData[currentTheme]);
  }, [currentTheme]);

  function themeChangeHandler(e) {
    setCurrentTheme(e.target.value);
  }

  return (
    <div className="themen-container">
      <h3>{STR.str35}</h3>
      <select
        className="select-item"
        onChange={themeChangeHandler}
        value={currentTheme}
        name=""
        id=""
      >
        <option className="option-item" value="piano">
          {STR.str36}
        </option>
        <option className="option-item" value="moon">
          {STR.str37}
        </option>
        <option className="option-item" value="fruits">
          {STR.str38}
        </option>
        <option className="option-item" value="crazy">
          {STR.str39}
        </option>
      </select>
    </div>
  );
}
