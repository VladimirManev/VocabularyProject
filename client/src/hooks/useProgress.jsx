import { useContext, useEffect, useState } from "react";
import { getKnownSentencesCount } from "../services/units";
import { Context } from "../context/Context";

export function useProgress(trainingId, sentencesCount) {
  const [knownSentencesCount, setKnownSentencesCount] = useState(0);
  const { userData } = useContext(Context);

  useEffect(() => {
    try {
      async function fetchFunction() {
        const count = await getKnownSentencesCount(userData._id, trainingId);
        setKnownSentencesCount(count);
      }
      if (userData) {
        fetchFunction();
      }
    } catch (error) {
      alert(error);
    }
  }, []);

  const progressInPercent = Math.round(
    (knownSentencesCount / sentencesCount) * 100
  );

  return { knownSentencesCount, progressInPercent };
}
