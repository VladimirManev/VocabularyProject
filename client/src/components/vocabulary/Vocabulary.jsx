import { useEffect, useState } from "react";
import "./Vocabulary.css";
import { getById, getUnitsCount } from "../../services/units";

export function Vocabulary(props) {
  const [sentence, setSentence] = useState({ bg: "", en: "" });

  const id = 1;
  const count = async () => {
    console.log(await getUnitsCount());
  };
  count();

  useEffect(() => {
    const currentSentence = async () => {
      try {
        props.loading(true);
        const data = await getById(id);
        if (data) {
          setSentence(data);
        }
        props.loading(false);
      } catch (error) {
        alert(error);
      }
    };
    currentSentence();
  }, []);

  return (
    <>
      <div className="vocabulary-container">
        <div className="task-container">
          <p className="task">{sentence.bg}</p>
        </div>
        <div className="solution-container">
          <p className="solution">{sentence.en}</p>
        </div>
        <div className="btn-container">
          <button className="known-btn">I know it !</button>
          <button className="next-btn">Next</button>
        </div>
      </div>
    </>
  );
}
