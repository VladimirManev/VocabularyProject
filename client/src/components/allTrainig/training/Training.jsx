import "./Training.css"
import { Link } from "react-router-dom";


export function Training(props) {
    const { _id, title } = props.data;

    return (
        <div className="training-container">
            <h3 className="heading">{title}</h3>
            <Link to={`/trainingDetails/${_id}`}>
                <button  className="btn">Details</button>
            </Link>
        </div>
    )
}