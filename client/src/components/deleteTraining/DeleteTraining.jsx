import "./DeleteTraining.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { useContext } from "react";
import { LanguageContext } from "../../context/LanguageContext";
import { deleteTraining } from "../../services/units";
import { Context } from "../../context/Context";

export function DeleteTraining() {
  const { STR } = useContext(LanguageContext);
  const { showNotification } = useContext(Context);
  const { currentTrainingId } = useParams();
  const navigate = useNavigate();

  async function deleteClickHandler(e) {
    try {
      await deleteTraining(currentTrainingId);
      navigate("/allTraining");
    } catch (error) {
      showNotification("Error", error.message);
    }
  }

  function cancelClickHandler(e) {
    navigate(-1);
  }

  return (
    <div className="deleteTraining-container">
      <h2 className="heading">{STR.str53}</h2>
      <div className="buttons">
        <Link>
          <PrimaryButton onClick={deleteClickHandler} text={STR.str17} />
        </Link>

        <Link>
          <PrimaryButton text={STR.str54} onClick={cancelClickHandler} />
        </Link>
      </div>
    </div>
  );
}
