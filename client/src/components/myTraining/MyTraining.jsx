import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyTraining } from "../../services/units";
import { Context } from "../../context/Context";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { Training } from "../allTrainig/training/Training";

export function MyTraining(props) {
  const [myTrainigData, setMyTrainingdata] = useState([]);
  const { userData, showNotification } = useContext(Context);

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
      <h1>My Training</h1>
      {myTrainigData.length === 0 && (
        <p className="no-training">You don't have any training yet</p>
      )}
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
