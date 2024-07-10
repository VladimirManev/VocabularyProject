import { useContext } from "react";
import "./Training.css"
import { Context } from "../../context/Context";


export function Training(props) {

    const {contextData, setContextData} = useContext(Context);
  

    function openClickHandler(e) {
        console.log(contextData);
    }

    const currentTrainingData = props.data;
    return (
        <div className="training-container">
            <h3 className="heading">{currentTrainingData.title}</h3>
            <button onClick={openClickHandler} className="btn">Open</button>
        </div>
    )
}