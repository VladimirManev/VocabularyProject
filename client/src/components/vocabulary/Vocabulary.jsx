import { useEffect, useState } from "react";
import "./Vocabulary.css";
import {
  getAllUnits,
  getKnownSentences,
  iKnowItUnit,
} from "../../services/units";
import { unknownSentencesSorter } from "../../services/util";

const translateMode = "bgToEn";

export function Vocabulary(props) {
  const [allSentences, setAllSentences] = useState([]);
  const [knownSentences, setKnownSentences] = useState([]);
  const [unknownSentences, setUnknownSentences] = useState([]);

  useEffect(() => {
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const data = await getAllUnits();
        if (data) {
          setAllSentences(data);
        }
        props.loading(false);
      } catch (error) {
        alert(error);
      }
    };
    fetchFunction();
  }, []);

  useEffect(() => {
    const _ownerId = JSON.parse(sessionStorage.getItem("userData"))._id;
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const data = await getKnownSentences(_ownerId, translateMode);
        if (data) {
          setKnownSentences(data);
        }
        props.loading(false);
      } catch (error) {
        alert(error);
      }
    };
    fetchFunction();
  }, []);

  useEffect(() => {
    setUnknownSentences(unknownSentencesSorter(allSentences, knownSentences));
  }, [knownSentences, allSentences]);

  let currentSentence = { bg: "", en: "" };

  if (unknownSentences.length > 0) {
    const randomIndex = Math.floor(Math.random() * unknownSentences.length);
    currentSentence = unknownSentences[randomIndex];
  }

  // const id = 1;

  // useEffect(() => {
  //   const currentSentence = async () => {
  //     try {
  //       props.loading(true);
  //       const data = await getById(id);
  //       if (data) {
  //         setSentence(data);
  //       }
  //       props.loading(false);
  //     } catch (error) {
  //       alert(error);
  //     }
  //   };
  //   currentSentence();
  // }, []);

  // const res = arr1.filter((x) => arr2.every((y) => y !== x));

  function iKnowItClickHandler(e) {
    iKnowItUnit(currentSentence._id, translateMode);
  }

  return (
    <>
      <div className="vocabulary-container">
        <div className="task-container">
          <p className="task">{currentSentence.bg}</p>
        </div>
        <div className="solution-container">
          <p className="solution">{currentSentence.en}</p>
        </div>
        <div className="btn-container">
          <button onClick={iKnowItClickHandler} className="known-btn">
            I know it !
          </button>
          <button className="next-btn">Next</button>
        </div>
      </div>
    </>
  );
}
