import { useState } from "react";
import "./Login.css";
import { login } from "../../services/auth";
import { useNavigate } from "react-router-dom";
import { useForm } from "../../hooks/useForm";

export function Login(params) {
  const navigate = useNavigate();
  //   const [values, setValues] = useState({ email: "", password: "" });

  //   function changeHandler(e) {
  //     setValues((state) => ({ ...state, [e.target.name]: e.target.value }));
  //   }

  const { values, changeHandler } = useForm({ email: "", password: "" });

  async function onSubmit(e) {
    e.preventDefault();
    await login(values.email, values.password);
    navigate("/vocabulary");
  }

  return (
    <div className="login-container">
      <h2 className="title">Login</h2>
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
        <input type="submit" className="btn" value="Login" />
      </form>
    </div>
  );
}
