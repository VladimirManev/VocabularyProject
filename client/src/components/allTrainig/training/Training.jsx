import { PrimaryButton } from "../../buttons/PrimaryButton";
import "./Training.css";
import { Link } from "react-router-dom";
import { ProgressBar } from "../../progressBar/ProgressBar";
import { useProgress } from "../../../hooks/useProgress";
import { useContext } from "react";
import { LanguageContext } from "../../../context/LanguageContext";

export function Training(props) {
  const { STR } = useContext(LanguageContext);
  const { _id, title, sentencesCount } = props.data;
  const { progressInPercent } = useProgress(_id, sentencesCount);

  return (
    <div className="training-container">
      <ProgressBar progress={progressInPercent} />
      <h3 className="heading">{title}</h3>
      <Link to={`/trainingDetails/${_id}`}>
        <PrimaryButton text={STR.str14} />
      </Link>
    </div>
  );
}
