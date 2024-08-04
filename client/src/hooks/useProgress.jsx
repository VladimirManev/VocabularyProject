import { useContext, useEffect, useState } from "react";
import { getKnownSentencesCount } from "../services/units";
import { AuthContext } from "../context/Context";
import { NotificationContext } from "../context/NotificationContext";

export function useProgress(trainingId, sentencesCount) {
  const [knownSentencesCount, setKnownSentencesCount] = useState(0);
  const { userData } = useContext(AuthContext);
  const { showNotification } = useContext(NotificationContext);

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
      showNotification("Error", error.message);
    }
  }, []);

  const progressInPercent = Math.round(
    (knownSentencesCount / sentencesCount) * 100
  );

  return { knownSentencesCount, progressInPercent };
}
