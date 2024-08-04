import { Link } from "react-router-dom";
import "./Welcome.css";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { useContext } from "react";
import { LanguageContext } from "../../context/LanguageContext";

export function Welcome(props) {
  const { STR } = useContext(LanguageContext);
  return (
    <>
      <div className="welcome-container">
        <h1 className="title">{STR.str1}</h1>
        <h2 className="subtitle">
          {STR.str2} <span>Vocabulary</span>
        </h2>
        <Link to="/login">
          <PrimaryButton text={STR.str3} />
        </Link>
      </div>
    </>
  );
}
