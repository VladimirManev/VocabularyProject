import "./Login.css";
import { login } from "../../services/auth";
import { useNavigate } from "react-router-dom";
import { useForm } from "../../hooks/useForm";
import { useContext } from "react";
import { Context } from "../../context/Context";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { LanguageContext } from "../../context/LanguageContext";

export function Login(props) {
  const { STR } = useContext(LanguageContext);
  const navigate = useNavigate();
  const { values, changeHandler } = useForm({ email: "", password: "" });
  const { setContextUserData, showNotification } = useContext(Context);

  async function onSubmit(e) {
    e.preventDefault();

    //validation
    try {
      if (values.email === "" || values.password === "") {
        throw new Error("Please fill out all required fields.");
      }
      props.loading(true);
      const user = await login(values.email, values.password);

      setContextUserData(user);
      navigate("/allTraining");
      props.loading(false);
    } catch (error) {
      props.loading(false);
      showNotification("Error", error.message);
    }
  }

  return (
    <div className="login-container">
      <h2 className="title">{STR.str26}</h2>
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
        <PrimaryButton text={STR.str29} type="submit" />
      </form>
    </div>
  );
}
