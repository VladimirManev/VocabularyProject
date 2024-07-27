import { useContext, useEffect, useState } from "react";
import "./EditTraining.css";
import { useNavigate } from "react-router-dom";
import { Context } from "../../../context/Context";
import { useForm } from "../../../hooks/useForm";
import { updateTraining } from "../../../services/units";
import { PrimaryButton } from "../../buttons/PrimaryButton";

export function EditTraining(props) {
  const navigate = useNavigate();
  const { userData, currentTrainingData, showNotification } =
    useContext(Context);

  useEffect(() => {
    if (!userData) {
      navigate("/login");
      return;
    }
  }, []);

  if (!currentTrainingData) {
    return <></>;
  }

  const { values, changeHandler } = useForm({
    title: currentTrainingData.title,
    level: currentTrainingData.level,
    description: currentTrainingData.description,
    sentencesCount: currentTrainingData.sentencesCount,
    data: currentTrainingData.data,
  });

  async function onSubmit(e) {
    e.preventDefault();

    try {
      if (
        values.title === "" ||
        values.level === "" ||
        values.description === "" ||
        values.sentencesCount === "" ||
        values.data === ""
      ) {
        throw new Error("Please fill out all required fields.");
      }
      props.loading(true);
      await updateTraining(currentTrainingData._id, values);
      navigate(`/trainingDetails/${currentTrainingData._id}`);
    } catch (error) {
      showNotification("Error", error.message);
    }
    props.loading(false);
  }

  return (
    <div className="createTraining-container">
      <h2 className="title">Edit training</h2>
      <form onSubmit={onSubmit} action="" className="form">
        <input
          onChange={changeHandler}
          type="text"
          className="input"
          name="title"
          placeholder="title"
          value={values.title}
        />
        <input
          onChange={changeHandler}
          type="text"
          className="input"
          name="level"
          placeholder="level"
          value={values.level}
        />
        <input
          onChange={changeHandler}
          type="text"
          className="input"
          name="description"
          placeholder="description"
          value={values.description}
        />
        <input
          onChange={changeHandler}
          type="number"
          className="input"
          name="sentencesCount"
          placeholder="sentences count"
          value={values.sentencesCount}
        />
        <input
          onChange={changeHandler}
          type="text"
          className="input"
          name="data"
          placeholder="data"
          value={values.data}
        />
        <PrimaryButton text={"Edit"} />
      </form>
    </div>
  );
}
