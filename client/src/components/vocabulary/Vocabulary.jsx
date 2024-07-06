import "./Vocabulary.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  unknownSentencesSorter,
  getRandomElementFromArr,
} from "../../services/util";
import {
  getAllUnits,
  getKnownSentences,
  iKnowItUnit,
} from "../../services/units";

export function Vocabulary(props) {
  const [allSentences, setAllSentences] = useState([]);
  const [unknownSentences, setUnknownSentences] = useState([]);
  const [currentSentence, setCurrentSentence] = useState({});
  const [lastSentence, setLastSentence] = useState({});
  const [showTranslation, setShowTranslation] = useState(false);

  const navigate = useNavigate();

  //temporary hardcored. It will be set in context
  const translateMode = {
    sourceLanguage: "bg",
    traslationLanguage: "en",
  };
  //set abbreviation for backend
  const abbreviationTranslateMode = `${translateMode.sourceLanguage}_${translateMode.traslationLanguage}`;

  //get all sentences
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

  //get known sentences for current user and set all unknown sentences
  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    let _ownerId;
    if (userData) {
      _ownerId = userData._id;
    } else {
      navigate("/login");
    }

    const fetchFunction = async () => {
      try {
        props.loading(true);
        const knownSentences = await getKnownSentences(
          _ownerId,
          abbreviationTranslateMode
        );
        if (knownSentences) {
          setUnknownSentences(
            unknownSentencesSorter(allSentences, knownSentences)
          );
        }
        props.loading(false);
      } catch (error) {
        alert(error);
      }
    };
    fetchFunction();
  }, [allSentences]);

  //sets the current sentence as learned
  function iKnowItClickHandler(e) {
    iKnowItUnit(currentSentence._id, abbreviationTranslateMode);
    setShowTranslation(false);
    setUnknownSentences((data) =>
      data.filter((x) => x._id !== currentSentence._id)
    );
  }

  function nextClickHandler(e) {
    setShowTranslation(false);
    currentSentenceSetter();
  }

  function translateClickHandler() {
    setShowTranslation(true);
  }

  //check if there are unknown sentences and set currentSentence
  function currentSentenceSetter() {
    let randomSentence = getRandomElementFromArr(unknownSentences);
    if (unknownSentences.length > 0) {
      if (unknownSentences.length > 1) {
        while (randomSentence === lastSentence) {
          randomSentence = getRandomElementFromArr(unknownSentences);
        }
        setLastSentence(randomSentence);
      }
      setCurrentSentence(randomSentence);
    } else {
      //todo
    }
  }

  useEffect(() => {
    currentSentenceSetter();
  }, [unknownSentences]);

  return (
    <>
      <div className="vocabulary-container">
        <div className="task-container">
          <p className="task">
            {currentSentence[translateMode.sourceLanguage]}
          </p>
        </div>
        <div className="solution-container" onClick={translateClickHandler}>
          {showTranslation ? (
            <p className="solution">
              {currentSentence[translateMode.traslationLanguage]}
            </p>
          ) : (
            <p className="click-to-translate">Click to translate!</p>
          )}
        </div>
        <div className="btn-container">
          <button onClick={iKnowItClickHandler} className="known-btn">
            I know it !
          </button>
          <button onClick={nextClickHandler} className="next-btn">
            Next
          </button>
        </div>
      </div>
    </>
  );
}
