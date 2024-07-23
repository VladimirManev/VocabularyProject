import "./TrainingDetails.css";
import { useContext, useEffect } from "react";
import { Context } from "../../../context/Context";
import { deleteTraining, getCurrentTraining } from "../../../services/units";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { useProgress } from "../../../hooks/useProgress";
import { ProgressBar } from "../../progressBar/ProgressBar";

export function TrainingDetails(props) {
  const {
    userData,
    currentTrainingData,
    setContextCurrentTrainingData,
    showMessage,
  } = useContext(Context);
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
  const navigate = useNavigate();

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
        showMessage("Error", error.message);
      }
      props.loading(false);
    };
    fetchFunction();
  }, []);

  async function deleteClickHandler(e) {
    try {
      await deleteTraining(currentTrainingData._id);
      navigate("/allTraining");
    } catch (error) {
      showMessage("Error", error.message);
    }
  }

  if (currentTrainingData) {
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
              {`Your progress:   ${progressInPercent}% (${knownSentencesCount}/${currentTrainingData.sentencesCount})`}
            </p>
          </div>
        )}
        <p className="description">{currentTrainingData.description}</p>
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
