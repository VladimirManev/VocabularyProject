import { useContext, useEffect, useState } from "react";
import { Context } from "../../../context/Context";
import "./TrainingDetails.css";
import { deleteTraining, getCurrentTraining } from "../../../services/units";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PrimaryButton } from "../../buttons/PrimaryButton";

export function TrainingDetails(props) {
  const { contextData, setContextData } = useContext(Context);
  const { currentTrainingId } = useParams();
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
      <>
        <h2>{contextData.currentTrainingData.title}</h2>
        <p>Level:{contextData.currentTrainingData.level}</p>
        <p>
          Number of items:
          {Object.keys(JSON.parse(contextData.currentTrainingData.data)).length}
        </p>
        <p>Description:{contextData.currentTrainingData.description}</p>
        <div className="buttons">
          {isOwner && (
            <Link to={"/editTraining"}>
              <PrimaryButton text="Edit" />
            </Link>
          )}
          {isOwner && (
            <PrimaryButton text="Delete" onClick={deleteClickHandler} />
          )}

          {isUser && (
            <Link to={"/vocabulary"}>
              <PrimaryButton text="Training" />
            </Link>
          )}
        </div>
      </>
    );
  } else {
    return null;
  }
}
