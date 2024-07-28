import { useContext, useState } from "react";
import "./Register.css";
import { register } from "../../services/auth";
import { useNavigate } from "react-router-dom";
import { useForm } from "../../hooks/useForm";
import { Context } from "../../context/Context";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { LanguageContext } from "../../context/LanguageContext";

export function Register(props) {
  const { STR } = useContext(LanguageContext);
  const navigate = useNavigate();
  const { setContextUserData, showNotification } = useContext(Context);

  const { values, changeHandler } = useForm({
    email: "",
    password: "",
    repass: "",
  });

  async function onSubmit(e) {
    e.preventDefault();

    try {
      if (
        values.email === "" ||
        values.password === "" ||
        values.repass === ""
      ) {
        throw new Error("Please fill out all required fields.");
      }

      if (values.password !== values.repass) {
        throw new Error("Passwords do not match. Please try again.");
      }
      props.loading(true);
      const user = await register(values.email, values.password);

      setContextUserData(user);

      navigate("/allTraining");
      props.loading(false);
    } catch (error) {
      props.loading(false);
      showNotification("Error", error.message);
    }
  }

  return (
    <div className="register-container">
      <h2 className="title">Register</h2>
      <form onSubmit={onSubmit} action="" className="form">
        <input
          onChange={changeHandler}
          type="email"
          className="input"
          name="email"
          placeholder={STR.str27}
          value={values.email}
        />
        <input
          onChange={changeHandler}
          type="password"
          className="input"
          name="password"
          placeholder={STR.str28}
          value={values.password}
        />
        <input
          onChange={changeHandler}
          type="password"
          className="input"
          name="repass"
          placeholder={STR.str33}
          value={values.repass}
        />
        <PrimaryButton text={STR.str34} type="submit" />
      </form>
    </div>
  );
}
