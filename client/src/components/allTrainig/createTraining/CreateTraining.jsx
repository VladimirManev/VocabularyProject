import { useContext, useEffect, useState } from "react";
import "./CreateTraining.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/Context";
import { useForm } from "../../../hooks/useForm";
import { createTraining } from "../../../services/units";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { LanguageContext } from "../../../context/LanguageContext";
import { TrainingDataValidator } from "../../../services/util";
import { NotificationContext } from "../../../context/NotificationContext";

export function CreateTraining(props) {
  const navigate = useNavigate();
  const { STR } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);

  const { values, changeHandler } = useForm({
    title: "",
    level: "",
    description: "",
    sentencesCount: "",
    data: "",
  });

  async function onSubmit(e) {
    e.preventDefault();

    try {
      //validation for all fields
      if (
        values.title === "" ||
        values.level === "" ||
        values.description === "" ||
        values.sentencesCount === "" ||
        values.data === ""
      ) {
        throw new Error("Please fill out all required fields!");
      }
      //validation for data
      TrainingDataValidator(values.data);

      props.loading(true);
      await createTraining(values);
      navigate("/MyTraining");
    } catch (error) {
      showNotification("Error", error.message);
    }
    props.loading(false);
  }

  return (
    <div className="createTraining-container">
      <h2 className="title">{STR.str6}</h2>
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

        <PrimaryButton text={STR.str12} />
      </form>
    </div>
  );
}
