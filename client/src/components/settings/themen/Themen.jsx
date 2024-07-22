import "./Themen.css";
import { useContext, useEffect, useState } from "react";

import { Context } from "../../../context/Context";
import { themenData } from "./themenData";

export function Themen(props) {
  const { setContextThemeData, themeData } = useContext(Context);
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
      <h3>Theme</h3>
      <select
        className="select-item"
        onChange={themeChangeHandler}
        value={currentTheme}
        name=""
        id=""
      >
        <option className="option-item" value="piano">
          Piano
        </option>
        <option className="option-item" value="moon">
          Moon
        </option>
        <option className="option-item" value="fruits">
          Fruits
        </option>
        <option className="option-item" value="crazy">
          Crazy
        </option>
      </select>
    </div>
  );
}
