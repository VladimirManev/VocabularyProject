import { LanguageContext } from "../../../context/LanguageContext";
import { TranslateModeContext } from "../../../context/TranslateModeContext";
import "./TranslateMode.css";
import { useContext } from "react";

export function TranslateMode() {
  const { STR } = useContext(LanguageContext);
  const { translateModeJSON, setTranslateMode } =
    useContext(TranslateModeContext);

  function translateModeChangeHandler(e) {
    setTranslateMode(e.target.value);
  }

  return (
    <div className="translate-mode-container">
      <h3>{STR.str40}</h3>
      <select
        className="select-item"
        onChange={translateModeChangeHandler}
        value={translateModeJSON}
        name=""
        id=""
      >
        <option
          className="option-item"
          value='{"sourceLanguage": "bg","translationLanguage1": "en"}'
        >
          BG &gt; EN
        </option>
        <option
          className="option-item"
          value='{"sourceLanguage": "bg","translationLanguage1": "de"}'
        >
          BG &gt; DE
        </option>
        <option
          className="option-item"
          value='{"sourceLanguage": "bg","translationLanguage1": "en","translationLanguage2": "de"}'
        >
          BG &gt; EN + DE
        </option>
        <option
          className="option-item"
          value='{"sourceLanguage": "en","translationLanguage1": "bg"}'
        >
          EN &gt; BG
        </option>
        <option
          className="option-item"
          value='{"sourceLanguage": "en","translationLanguage1": "de"}'
        >
          EN &gt; DE
        </option>
        <option
          className="option-item"
          value='{"sourceLanguage": "en","translationLanguage1": "bg","translationLanguage2": "de"}'
        >
          EN &gt; BG + DE
        </option>
        <option
          className="option-item"
          value='{"sourceLanguage": "de","translationLanguage1": "bg"}'
        >
          DE &gt; BG
        </option>
        <option
          className="option-item"
          value='{"sourceLanguage": "de","translationLanguage1": "en"}'
        >
          DE &gt; EN
        </option>
        <option
          className="option-item"
          value='{"sourceLanguage": "de","translationLanguage1": "en","translationLanguage2": "bg"}'
        >
          DE &gt; EN + BG
        </option>
      </select>
    </div>
  );
}
