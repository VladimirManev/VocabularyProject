import "./TrainingDetails.css";
import { useContext, useEffect } from "react";
import { Context } from "../../../context/Context";
import { deleteTraining, getCurrentTraining } from "../../../services/units";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { useProgress } from "../../../hooks/useProgress";
import { ProgressBar } from "../../progressBar/ProgressBar";

export function TrainingDetails(props) {
  const { contextData, setContextData } = useContext(Context);
  const { currentTrainingId } = useParams();
  const { knownSentencesCount, progressInPercent } = useProgress(
    currentTrainingId,
    contextData.currentTrainingData?.sentencesCount
  );

  const isUser = Boolean(contextData.userData);
  let isOwner = Boolean(
    contextData.currentTrainingData &&
      contextData.userData &&
      contextData.currentTrainingData._ownerId === contextData.userData._id
  );
  const navigate = useNavigate();

  //get currentTrainingData
  useEffect(() => {
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const fetchData = await getCurrentTraining(currentTrainingId);
        if (fetchData) {
          setContextData((prevData) => ({
            ...prevData,
            currentTrainingData: fetchData,
          }));
        }
      } catch (error) {
        alert(error.message);
      }
      props.loading(false);
    };
    fetchFunction();
  }, []);

  async function deleteClickHandler(e) {
    try {
      await deleteTraining(contextData.currentTrainingData._id);
      navigate("/allTraining");
    } catch (error) {
      alert(error.message);
    }
  }

  if (contextData.currentTrainingData) {
    return (
      <div className="training-details-container">
        <h2>{contextData.currentTrainingData.title}</h2>
        <div className="level-container">
          <span className="level">{contextData.currentTrainingData.level}</span>
        </div>
        {isUser && (
          <div className="progress">
            <ProgressBar progress={progressInPercent} />
            <p className="progress-text">
              {`Your progress:   ${progressInPercent}% (${knownSentencesCount}/${contextData.currentTrainingData.sentencesCount})`}
            </p>
          </div>
        )}
        <p className="description">
          {contextData.currentTrainingData.description}
        </p>
        <div className="buttons">
          {isOwner && (
            <Link to={"/editTraining"}>
              <PrimaryButton text="Edit" />
            </Link>
          )}
          {isOwner && (
            <PrimaryButton text="Delete" onClick={deleteClickHandler} />
          )}

          {isUser && progressInPercent < 100 && (
            <Link to={"/vocabulary"}>
              <PrimaryButton text="Training" />
            </Link>
          )}
        </div>
      </div>
    );
  } else {
    return null;
  }
}
