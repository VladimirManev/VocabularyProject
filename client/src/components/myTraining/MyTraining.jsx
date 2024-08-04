import { useContext, useEffect, useState } from "react";
import { getMyTraining } from "../../services/units";
import { AuthContext } from "../../context/Context";
import { Training } from "../allTrainig/training/Training";
import { LanguageContext } from "../../context/LanguageContext";
import { NotificationContext } from "../../context/NotificationContext";

export function MyTraining(props) {
  const { STR } = useContext(LanguageContext);
  const [myTrainigData, setMyTrainingdata] = useState([]);
  const { userData } = useContext(AuthContext);
  const { showNotification } = useContext(NotificationContext);

  useEffect(() => {
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const fetchedData = await getMyTraining(userData._id);
        if (fetchedData) {
          setMyTrainingdata(fetchedData);
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
      <h1>{STR.str30}</h1>
      {myTrainigData.length === 0 && <p className="no-training">{STR.str31}</p>}
      {myTrainigData.length !== 0 && (
        <ul className="list">
          {myTrainigData.map((x) => (
            <li className="list-item" key={x._id}>
              <Training data={x} loading={props.loading} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
