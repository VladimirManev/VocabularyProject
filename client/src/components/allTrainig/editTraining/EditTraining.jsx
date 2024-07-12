import { useContext, useEffect, useState } from "react";
import "./EditTraining.css";
import { useNavigate } from "react-router-dom";
import { Context } from "../../context/Context";
import { useForm } from "../../../hooks/useForm";
import { updateTraining } from "../../../services/units";

export function EditTraining(props) {
    const navigate = useNavigate();
    const { contextData, setContextData } = useContext(Context);

    useEffect(() => {
        if (!contextData.userData) {
            navigate("/login");
            return;
        }
    }, [])

    if (!contextData.currentTrainingData) {
        return (<></>)
    }

    const { values, changeHandler } = useForm({ title: contextData.currentTrainingData.title, level: contextData.currentTrainingData.level, description: contextData.currentTrainingData.description, data: contextData.currentTrainingData.data });


    async function onSubmit(e) {
        e.preventDefault();

        try {
            props.loading(true);
            await updateTraining(contextData.currentTrainingData._id, values);
            navigate(`/trainingDetails/${contextData.currentTrainingData._id}`);
        } catch (error) {
            alert(error.message);
        }
        props.loading(false);
    }

    return (
        <div className="createTraining-container">
            <h2 className="title">Edit training</h2>
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
                <input type="submit" className="btn" value="Edit" />
            </form>
        </div>
    );
}
