import { useEffect, useContext, useState } from "react";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import "./Training.css";
import { Link } from "react-router-dom";
import { getKnownSentencesCount } from "../../../services/units";
import { Context } from "../../../context/Context";
import { ProgressBar } from "../../progressBar/ProgressBar";

export function Training(props) {
  const [knownSentencesCount, setKnownSentencesCount] = useState(0);
  const { _id, title, sentencesCount } = props.data;
  const { contextData } = useContext(Context);

  const progressInPercent = (knownSentencesCount / sentencesCount) * 100;

  // get count of all knownSentences
  useEffect(() => {
    try {
      async function fetchFunction() {
        const count = await getKnownSentencesCount(
          contextData.userData._id,
          _id
        );
        setKnownSentencesCount(count);
      }
      if (contextData.userData) {
        fetchFunction();
      }
    } catch (error) {
      alert(error);
    }
  }, []);

  return (
    <div className="training-container">
      <ProgressBar progress={progressInPercent} color={"rgb(20, 163, 220)"} />
      <span className="progress-counter">{`${knownSentencesCount}/${sentencesCount}`}</span>
      <h3 className="heading">{title}</h3>
      <Link to={`/trainingDetails/${_id}`}>
        <PrimaryButton text="Details" />
      </Link>
    </div>
  );
}
