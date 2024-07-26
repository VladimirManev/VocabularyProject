import { useContext, useEffect, useState } from "react";
import "./CreateTraining.css";
import { useNavigate } from "react-router-dom";
import { Context } from "../../../context/Context";
import { useForm } from "../../../hooks/useForm";
import { createTraining } from "../../../services/units";
import { PrimaryButton } from "../../buttons/PrimaryButton";

export function CreateTraining(props) {
  const navigate = useNavigate();
  const { userData, showNotification } = useContext(Context);

  useEffect(() => {
    if (!userData) {
      navigate("/login");
    }
  }, []);

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
      props.loading(true);
      await createTraining(values);
      navigate("/allTraining");
    } catch (error) {
      showNotification("Error", error.message);
    }
    props.loading(false);
  }

  return (
    <div className="createTraining-container">
      <h2 className="title">Create new training</h2>
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
          className="input"
          name="data"
          placeholder="data"
          value={values.data}
        />

        <PrimaryButton text={"Create"} />
      </form>
    </div>
  );
}
