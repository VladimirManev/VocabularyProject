import "./AllTraining.css";
import { useContext, useEffect, useState } from "react";
import { getAllTraining } from "../../services/units";
import { Training } from "./training/Training";
import { Context } from "../../context/Context";
import { LanguageContext } from "../../context/LanguageContext";

export function AllTraining(props) {
  const { STR } = useContext(LanguageContext);
  const [allTrainigData, setAllTrainingdata] = useState([]);
  const { showNotification } = useContext(Context);

  useEffect(() => {
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const fetchedData = await getAllTraining();
        if (fetchedData) {
          setAllTrainingdata(fetchedData);
        }
      } catch (error) {
        showNotification("Error", error.message);
      }
      props.loading(false);
    };
    fetchFunction();
  }, []);

  return (
    <div className="allTraining-container">
      <h1>{STR.str19}</h1>
      {allTrainigData.length === 0 && (
        <p className="no-training">{STR.str20}</p>
      )}
      {allTrainigData.length !== 0 && (
        <ul className="list">
          {allTrainigData.map((x) => (
            <li className="list-item" key={x._id}>
              <Training data={x} loading={props.loading} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
