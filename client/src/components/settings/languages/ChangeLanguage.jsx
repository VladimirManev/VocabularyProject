import "./ChangeLanguage.css";
import { useContext, useEffect, useState } from "react";

import { Context } from "../../../context/Context";
import { LanguageContext } from "../../../context/LanguageContext";

export function ChangeLanguage(props) {
  const { STR, languageContextAbriviation, setLanguageContextData } =
    useContext(LanguageContext);

  function languageChangeHandler(e) {
    setLanguageContextData(e.target.value);
  }

  return (
    <div className="language-settings-container">
      <h3>{STR.str49}</h3>
      <select
        className="select-item"
        onChange={languageChangeHandler}
        value={languageContextAbriviation}
        name=""
        id=""
      >
        <option className="option-item" value="en">
          {STR.str50}
        </option>
        <option className="option-item" value="bg">
          {STR.str51}
        </option>
        <option className="option-item" value="de">
          {STR.str52}
        </option>
      </select>
    </div>
  );
}
