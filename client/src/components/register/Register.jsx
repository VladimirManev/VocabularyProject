import { useContext, useState } from "react";
import "./Register.css";
import { register } from "../../services/auth";
import { useNavigate } from "react-router-dom";
import { useForm } from "../../hooks/useForm";
import { Context } from "../../context/Context";
import { PrimaryButton } from "../buttons/PrimaryButton";

export function Register(props) {
  const navigate = useNavigate();
  const { setContextUserData, showMessage } = useContext(Context);

  const { values, changeHandler } = useForm({
    email: "",
    password: "",
    repass: "",
  });

  async function onSubmit(e) {
    e.preventDefault();

    try {
      props.loading(true);
      const user = await register(values.email, values.password);

      setContextUserData(user);

      navigate("/allTraining");
      props.loading(false);
    } catch (error) {
      props.loading(false);
      showMessage("Error", error.message);
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
          placeholder="email"
          value={values.email}
        />
        <input
          onChange={changeHandler}
          type="password"
          className="input"
          name="password"
          placeholder="password"
          value={values.password}
        />
        <input
          onChange={changeHandler}
          type="password"
          className="input"
          name="repass"
          placeholder="repeat password"
          value={values.repass}
        />
        <PrimaryButton text="Register" type="submit" />
      </form>
    </div>
  );
}
