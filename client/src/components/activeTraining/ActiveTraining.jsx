import { useContext, useEffect, useState } from "react";
import { getActiveTraining, getAllTraining } from "../../services/units";
import { AuthContext } from "../../context/Context";
import { Training } from "../allTrainig/training/Training";
import { activeTrainingSorter } from "../../services/util";
import { LanguageContext } from "../../context/LanguageContext";
import { NotificationContext } from "../../context/NotificationContext";

export function ActiveTraining(props) {
  const [activeTrainigData, setActiveTrainingdata] = useState([]);
  const { userData } = useContext(AuthContext);
  const { showNotification } = useContext(NotificationContext);

  const { STR } = useContext(LanguageContext);

  useEffect(() => {
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const allTraining = await getAllTraining(userData._id);
        const activeTrainingIds = await getActiveTraining(userData._id);
        const activeTraining = activeTrainingSorter(
          allTraining,
          activeTrainingIds
        );
        setActiveTrainingdata(activeTraining);
      } catch (error) {
        showNotification("Error", error.message);
      }
      props.loading(false);
    };
    fetchFunction();
  }, []);

  return (
    <div className="allTraining-container">
      <h1>{STR.str4}</h1>
      {activeTrainigData.length === 0 && (
        <p className="no-training">{STR.str5}</p>
      )}
      {activeTrainigData.length !== 0 && (
        <ul className="list">
          {activeTrainigData.map((x) => (
            <li className="list-item" key={x._id}>
              <Training data={x} loading={props.loading} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
