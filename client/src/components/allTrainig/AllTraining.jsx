import "./AllTraining.css";
import { useContext, useEffect, useState } from "react";
import { getAllTraining } from "../../services/units";
import { Training } from "./training/Training";
import { Link } from "react-router-dom";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { Context } from "../../context/Context";

export function AllTraining(props) {
  const [allTrainigData, setAllTrainingdata] = useState([]);
  const { userData } = useContext(Context);

  useEffect(() => {
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const fetchedData = await getAllTraining();
        if (fetchedData) {
          setAllTrainingdata(fetchedData);
        }
      } catch (error) {
        alert(error);
      }
      props.loading(false);
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
      {userData && (
        <Link to={"/createTraining"}>
          <PrimaryButton text="Add new training" />
        </Link>
      )}
    </div>
  );
}
