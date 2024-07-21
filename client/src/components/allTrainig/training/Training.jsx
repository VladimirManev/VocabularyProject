import { PrimaryButton } from "../../buttons/PrimaryButton";
import "./Training.css";
import { Link } from "react-router-dom";
import { ProgressBar } from "../../progressBar/ProgressBar";
import { useProgress } from "../../../hooks/useProgress";

export function Training(props) {
  const { _id, title, sentencesCount } = props.data;
  const { progressInPercent } = useProgress(_id, sentencesCount);

  return (
    <div className="training-container">
      <ProgressBar progress={progressInPercent} />
      {/* <span className="progress-counter">{`${knownSentencesCount}/${sentencesCount}`}</span> */}
      <h3 className="heading">{title}</h3>
      <Link to={`/trainingDetails/${_id}`}>
        <PrimaryButton text="Details" />
      </Link>
    </div>
  );
}
