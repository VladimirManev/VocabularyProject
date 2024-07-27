import "./Vocabulary.css";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  unknownSentencesSorter,
  getRandomElementFromArr,
} from "../../services/util";
import { getKnownSentences, iKnowItUnit } from "../../services/units";
import { Context } from "../../context/Context";

import { PrimaryButton } from "../buttons/PrimaryButton";
import { TranslateModeContext } from "../../context/TranslateModeContext";

export function Vocabulary(props) {
  const [unknownSentences, setUnknownSentences] = useState([]);
  const [currentSentence, setCurrentSentence] = useState({});
  const [lastSentence, setLastSentence] = useState({});
  const [showTranslation1, setShowTranslation1] = useState(false);
  const [showTranslation2, setShowTranslation2] = useState(false);

  const { userData, currentTrainingData, showNotification } =
    useContext(Context);
  const { translateModeJSON } = useContext(TranslateModeContext);
  const translateMode = JSON.parse(translateModeJSON);

  const navigate = useNavigate();

  useEffect(() => {
    // get all known sentences and set all unknown sentences
    const fetchFunction = async () => {
      try {
        props.loading(true);
        const knownSentences = await getKnownSentences(
          userData._id,
          currentTrainingData._id
        );

        if (knownSentences) {
          setUnknownSentences(
            unknownSentencesSorter(allSentences, knownSentences)
          );
        }
      } catch (error) {
        showNotification("Error", error.message);
      }
      props.loading(false);
    };

    //creates allSentaces if currentTrainingData and userData exist else navigates to login page
    let allSentences = [];
    if (currentTrainingData && userData) {
      allSentences = Object.entries(JSON.parse(currentTrainingData.data)).map(
        ([_id, data]) => ({ _id, ...data })
      );
      fetchFunction();
    } else {
      navigate("/login");
      return;
    }
  }, []);

  //sets the current sentence as learned
  async function iKnowItClickHandler(e) {
    if (unknownSentences.length === 1) {
      showNotification("Congratulations! ", "You learned all the sentences!");
      navigate(`/trainingDetails/${currentTrainingData._id}`);
    }

    try {
      props.loading(true);
      await iKnowItUnit(currentSentence._id, currentTrainingData._id);
      setUnknownSentences((data) =>
        data.filter((x) => x._id !== currentSentence._id)
      );
    } catch (error) {
      showNotification("Error", error.message);
    }
    setShowTranslation1(false);
    setShowTranslation2(false);
    props.loading(false);
  }

  function nextClickHandler(e) {
    setShowTranslation1(false);
    setShowTranslation2(false);
    currentSentenceSetter();
  }

  function translateClickHandler1() {
    setShowTranslation1(true);
  }

  function translateClickHandler2() {
    setShowTranslation2(true);
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
    }
  }

  useEffect(() => {
    currentSentenceSetter();
  }, [unknownSentences]);

  return (
    <>
      <div className="vocabulary-container">
        <div className="task-container">
          <div className="language-info-container">
            <p className="laguage-info-text">{translateMode.sourceLanguage}</p>
            <div
              className="language-info-flag"
              style={{
                backgroundImage: `url(./src/components/vocabulary/img/${translateMode.sourceLanguage}.png)`,
              }}
            ></div>
          </div>
          <p className="task">
            {currentSentence[translateMode.sourceLanguage]}
          </p>
        </div>
        <div className="solution-container" onClick={translateClickHandler1}>
          <div className="language-info-container">
            <p className="laguage-info-text">
              {translateMode.translationLanguage1}
            </p>
            <div
              className="language-info-flag"
              style={{
                backgroundImage: `url(./src/components/vocabulary/img/${translateMode.translationLanguage1}.png)`,
              }}
            ></div>
          </div>

          {showTranslation1 ? (
            <p className="solution">
              {currentSentence[translateMode.translationLanguage1]}
            </p>
          ) : (
            <p className="click-to-translate">Click to translate!</p>
          )}
        </div>
        {translateMode.translationLanguage2 && (
          <div className="solution-container" onClick={translateClickHandler2}>
            <div className="language-info-container">
              <p className="laguage-info-text">
                {translateMode.translationLanguage2}
              </p>
              <div
                className="language-info-flag"
                style={{
                  backgroundImage: `url(./src/components/vocabulary/img/${translateMode.translationLanguage2}.png)`,
                }}
              ></div>
            </div>

            {showTranslation2 ? (
              <p className="solution">
                {currentSentence[translateMode.translationLanguage2]}
              </p>
            ) : (
              <p className="click-to-translate">Click to translate!</p>
            )}
          </div>
        )}
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
