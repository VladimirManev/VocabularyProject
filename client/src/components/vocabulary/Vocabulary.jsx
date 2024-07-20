import "./Vocabulary.css";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  unknownSentencesSorter,
  getRandomElementFromArr,
} from "../../services/util";
import { getKnownSentences, iKnowItUnit } from "../../services/units";
import { Context } from "../../context/Context";

import { PrimaryButton } from "../buttons/PrimaryButton";

export function Vocabulary(props) {
  const [unknownSentences, setUnknownSentences] = useState([]);
  const [showCongratulationModal, setShowCongratulationModal] = useState(false);

  const [currentSentence, setCurrentSentence] = useState({});
  const [lastSentence, setLastSentence] = useState({});
  const [showTranslation, setShowTranslation] = useState(false);
  const { contextData } = useContext(Context);

  const navigate = useNavigate();

  //temporary hardcored. It will be set in context
  const translateMode = {
    sourceLanguage: "bg",
    traslationLanguage: "en",
  };

  //set abbreviation for backend
  const abbreviationTranslateMode = `${translateMode.sourceLanguage}_${translateMode.traslationLanguage}`;

  useEffect(() => {
    // get all known sentences and set all unknown sentences
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const knownSentences = await getKnownSentences(
          contextData.userData._id,
          contextData.currentTrainingData._id,
          abbreviationTranslateMode
        );

        if (knownSentences) {
          setUnknownSentences(
            unknownSentencesSorter(allSentences, knownSentences)
          );
        }
      } catch (error) {
        alert(error);
      }
      props.loading(false);
    };

    //creates allSentaces if currentTrainingData and userData exist else navigates to login page
    let allSentences = [];
    if (contextData.currentTrainingData && contextData.userData) {
      allSentences = Object.entries(
        JSON.parse(contextData.currentTrainingData.data)
      ).map(([_id, data]) => ({ _id, ...data }));
      fetchFunction();
    } else {
      navigate("/login");
      return;
    }
  }, []);

  //sets the current sentence as learned
  async function iKnowItClickHandler(e) {
    if (unknownSentences.length === 1) {
      setShowCongratulationModal(true);
    }

    try {
      props.loading(true);
      await iKnowItUnit(
        currentSentence._id,
        contextData.currentTrainingData._id,
        abbreviationTranslateMode
      );
      setUnknownSentences((data) =>
        data.filter((x) => x._id !== currentSentence._id)
      );
    } catch (error) {
      alert(error);
    }
    setShowTranslation(false);
    props.loading(false);
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
      {showCongratulationModal && (
        <div className="congratulation-modal">
          <h2 className="congratulation-text">
            Congratulations! You learned all the sentences!
          </h2>
          <Link to="/allTraining">
            <PrimaryButton text="OK" />
          </Link>
        </div>
      )}
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
          <PrimaryButton
            className="test"
            text="I know it !"
            onClick={iKnowItClickHandler}
          />
          <PrimaryButton text="Next" onClick={nextClickHandler} />
        </div>
      </div>
    </>
  );
}
