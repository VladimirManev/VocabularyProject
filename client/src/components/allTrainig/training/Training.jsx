import "./Training.css"

export function Training(props) {

    const currentTrainingData = props.data;
    return (
        <div className="training-container">
            <h3 className="heading">{currentTrainingData.title}</h3>
            <button className="btn">Open</button>
        </div>
    )
}