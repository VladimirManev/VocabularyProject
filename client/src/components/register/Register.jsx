import { useState } from "react";
import "./Register.css";
import { register } from "../../services/auth";
import { useNavigate } from "react-router-dom";
import { useForm } from "../../hooks/useForm";

export function Register(params) {
    const navigate = useNavigate();

    const { values, changeHandler } = useForm({ email: "", password: "", repass: "" });

    async function onSubmit(e) {
        e.preventDefault();
        await register(values.email, values.password);
        //TODO errorHandler
        navigate("/allTraining");
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
                <input type="submit" className="btn" value="Register" />
            </form>
        </div>
    );
}
