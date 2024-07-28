import { useContext, useEffect } from "react";
import "./EditTraining.css";
import { useNavigate } from "react-router-dom";
import { Context } from "../../../context/Context";
import { useForm } from "../../../hooks/useForm";
import { updateTraining } from "../../../services/units";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { LanguageContext } from "../../../context/LanguageContext";

export function EditTraining(props) {
  const { STR } = useContext(LanguageContext);
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
      <h2 className="title">{STR.str13}</h2>
      <form onSubmit={onSubmit} action="" className="form">
        <input
          onChange={changeHandler}
          type="text"
          className="input"
          name="title"
          placeholder={STR.str7}
          value={values.title}
        />
        <input
          onChange={changeHandler}
          type="text"
          className="input"
          name="level"
          placeholder={STR.str8}
          value={values.level}
        />
        <input
          onChange={changeHandler}
          type="text"
          className="input"
          name="description"
          placeholder={STR.str9}
          value={values.description}
        />
        <input
          onChange={changeHandler}
          type="number"
          className="input"
          name="sentencesCount"
          placeholder={STR.str10}
          value={values.sentencesCount}
        />
        <input
          onChange={changeHandler}
          className="input"
          name="data"
          placeholder={STR.str11}
          value={values.data}
        />
        <PrimaryButton text={STR.str16} />
      </form>
    </div>
  );
}
