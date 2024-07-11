import { useContext, useEffect, useState } from "react";
import "./CreateTraining.css";
import { useNavigate } from "react-router-dom";
import { Context } from "../../context/Context";
import { useForm } from "../../../hooks/useForm";
import { createTraining } from "../../../services/units";

export function CreateTraining(props) {
    const navigate = useNavigate();
    const { contextData, setContextData } = useContext(Context);

    useEffect(() => {
        if (!contextData.userData) {
            navigate("/login");
        }
    }, [])


    const { values, changeHandler } = useForm({ title: "", level: "", description: "", data: "" });

    async function onSubmit(e) {
        e.preventDefault();

        try {
            props.loading(true);
            await createTraining(values);
            navigate("/allTraining");
        } catch (error) {
            alert(error.message);
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
                    type="text"
                    className="input"
                    name="data"
                    placeholder="data"
                    value={values.data}
                />
                <input type="submit" className="btn" value="Create" />
            </form>
        </div>
    );
}
