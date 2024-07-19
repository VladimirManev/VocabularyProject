import "./AllTraining.css";
import { useEffect, useState } from "react";
import { getAllTraining } from "../../services/units";
import { Training } from "./training/Training";
import { Link } from "react-router-dom";
import { PrimaryButton } from "../buttons/PrimaryButton";

export function AllTraining(props) {
  const [allTrainigData, setAllTrainingdata] = useState([]);

  useEffect(() => {
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const fetchedData = await getAllTraining();
        if (fetchedData) {
          setAllTrainingdata(fetchedData);
        }
        props.loading(false);
      } catch (error) {
        alert(error);
      }
    };
    fetchFunction();
  }, []);

  return (
    <div className="allTraining-container">
      <h1>All Training</h1>
      <ul className="list">
        {allTrainigData.map((x) => (
          <li className="list-item" key={x._id}>
            <Training data={x} loading={props.loading} />
          </li>
        ))}
      </ul>
      <Link to={"/createTraining"}>
        <PrimaryButton text="Add new training" />
      </Link>
    </div>
  );
}
