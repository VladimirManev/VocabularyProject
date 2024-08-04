import "./TrainingDetails.css";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../../context/Context";
import { getCurrentTraining } from "../../../services/units";
import { useParams, Link } from "react-router-dom";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { useProgress } from "../../../hooks/useProgress";
import { ProgressBar } from "../../progressBar/ProgressBar";
import { LanguageContext } from "../../../context/LanguageContext";
import { NotificationContext } from "../../../context/NotificationContext";
import { TrainingDataContext } from "../../../context/TrainingDataContext";

export function TrainingDetails(props) {
  const { STR } = useContext(LanguageContext);

  const { userData } = useContext(AuthContext);
  const { currentTrainingData, setContextCurrentTrainingData } =
    useContext(TrainingDataContext);

  const { showNotification } = useContext(NotificationContext);

  const { currentTrainingId } = useParams();

  const { knownSentencesCount, progressInPercent } = useProgress(
    currentTrainingId,
    currentTrainingData?.sentencesCount
  );

  const isUser = Boolean(userData);

  let isOwner = Boolean(
    currentTrainingData &&
      userData &&
      currentTrainingData._ownerId === userData._id
  );

  //get currentTrainingData and set it in Context
  useEffect(() => {
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const fetchData = await getCurrentTraining(currentTrainingId);
        if (fetchData) {
          setContextCurrentTrainingData(fetchData);
        }
      } catch (error) {
        showNotification("Error", error.message);
      }
      props.loading(false);
    };
    fetchFunction();
  }, []);

  if (!currentTrainingData) {
    return null;
  }

  return (
    <div className="training-details-container">
      <h2>{currentTrainingData.title}</h2>
      <div className="level-container">
        <span className="level">{currentTrainingData.level}</span>
      </div>

      {isUser && (
        <div className="progress">
          <ProgressBar progress={progressInPercent} />
          <p className="progress-text">
            {`${STR.str15}   ${progressInPercent}% (${knownSentencesCount}/${currentTrainingData.sentencesCount})`}
          </p>
        </div>
      )}

      <p className="description">{currentTrainingData.description}</p>

      <div className="buttons">
        {isOwner && (
          <Link to={"/editTraining"}>
            <PrimaryButton text={STR.str16} />
          </Link>
        )}

        {isOwner && (
          <Link to={`/deleteTraining/${currentTrainingData._id}`}>
            <PrimaryButton text={STR.str17} />
          </Link>
        )}

        {isUser && progressInPercent < 100 && (
          <Link to={"/vocabulary"}>
            <PrimaryButton text={STR.str18} />
          </Link>
        )}
      </div>
    </div>
  );
}
