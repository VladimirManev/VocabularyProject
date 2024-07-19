import "./Login.css";
import { login } from "../../services/auth";
import { useNavigate } from "react-router-dom";
import { useForm } from "../../hooks/useForm";
import { useContext } from "react";
import { Context } from "../../context/Context";

export function Login(props) {
  const navigate = useNavigate();
  const { values, changeHandler } = useForm({ email: "", password: "" });
  const {contextData, setContextData} = useContext(Context);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      props.loading(true);
      const user = await login(values.email, values.password);
      setContextData(prevData => ({
        ...prevData,
        userData:user
      }));
      navigate("/allTraining");
      props.loading(false);
    } catch (error) {
      props.loading(false);
      alert(error.message);
    }
   
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
