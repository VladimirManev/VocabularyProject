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

export function getRandomElementFromArr(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}
