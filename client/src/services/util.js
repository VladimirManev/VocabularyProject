export function getUserData() {
  return JSON.parse(sessionStorage.getItem("userData"));
}

export function setUserData(data) {
  sessionStorage.setItem("userData", JSON.stringify(data));
}

export function clearUserData() {
  sessionStorage.removeItem("userData");
}

// export function createSubmitHandler(callback) {
//   return function (event) {
//     event.preventDefault();
//     const form = event.currentTarget;
//     const formData = new FormData(form);
//     const data = Object.fromEntries(formData.entries());

//     callback(data, form);
//   };
// }

export function unknownSentencesSorter(allSentances, knownSentences) {
  if (allSentances.length !== 0) {
    return allSentances.filter((x) =>
      knownSentences.every((y) => y.sentenceId !== x._id)
    );
  }
  return [];
}

export function activeTrainingSorter(allTraining, activeTrainingIds) {
  if (allTraining.length !== 0) {
    return allTraining.filter((x) =>
      activeTrainingIds.some((y) => y.trainingId === x._id)
    );
  }
  return [];
}

export function getRandomElementFromArr(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

export function TrainingDataValidator(data) {
  let dataAsObj;
  // check parse to JSON
  try {
    dataAsObj = JSON.parse(data);
  } catch (error) {
    throw new Error(
      `Incorrect data format. Please use the following format: {"unique id":{"bg": "котка","en": "cat","de": "Katze",}, ...} Data cannot be parsed`
    );
  }

  //check if dataAsObj is a object
  if (typeof dataAsObj !== "object") {
    throw new Error(
      `Incorrect data format. Please use the following format: {"unique id":{"bg": "котка","en": "cat","de": "Katze",}, ...} Data is no object`
    );
  }

  //check if three languages are available

  const firstUnit = Object.values(dataAsObj)[0];

  if (
    !firstUnit.hasOwnProperty("bg") ||
    !firstUnit.hasOwnProperty("en") ||
    !firstUnit.hasOwnProperty("de")
  ) {
    throw new Error(
      `Incorrect data format. Please use the following format: {"unique id":{"bg": "котка","en": "cat","de": "Katze",}, ...} No all languages available`
    );
  }
}
