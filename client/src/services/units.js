import { get, post, put, del } from "./api.js";

const trainingEndpoint = "/data/vocabulary";
const sentansesEndpoint = "/data/learnedSentences";

//**TRAINING**

//get all training
export async function getAllTraining(skip, take) {
  return get(
    trainingEndpoint +
      `?select=_id%2Ctitle%2CsentencesCount&offset=${skip}&pageSize=${take}`
  );
}

//get all training count
export async function getAllTrainingCount() {
  return get(trainingEndpoint + "?count");
}

//get my training
export async function getMyTraining(_ownerId) {
  return get(
    trainingEndpoint +
      `?select=_id%2Ctitle%2CsentencesCount&where=_ownerId%3D%22${_ownerId}%22`
  );
}

//get my active training ids
export async function getActiveTraining(_ownerId) {
  return get(
    sentansesEndpoint +
      `?where=_ownerId%3D%22${_ownerId}%22&distinct=trainingId&select=trainingId`
  );
}

//get one training by id
export async function getCurrentTraining(trainingId) {
  return get(trainingEndpoint + "/" + trainingId);
}

//create new training
export async function createTraining(data) {
  return post(trainingEndpoint + "/", data);
}

//edit a trining
export async function updateTraining(id, data) {
  return put(trainingEndpoint + "/" + "/" + id, data);
}

//delete a training
export async function deleteTraining(id) {
  return del(trainingEndpoint + "/" + id);
}

//**SENTANSES**

//get all known sentences for current user
export async function getKnownSentences(_ownerId, trainingId) {
  return get(
    sentansesEndpoint +
      `?where=_ownerId%3D%22${_ownerId}%22%20AND%20trainingId%3D%22${trainingId}%22`
  );
}

//get count of all known sentences for current user
export async function getKnownSentencesCount(_ownerId, trainingId) {
  return get(
    sentansesEndpoint +
      `?where=_ownerId%3D%22${_ownerId}%22%20AND%20trainingId%3D%22${trainingId}%22&distinct=sentenceId&count`
  );
}

//set unknown sentence to known sentence
export async function iKnowItUnit(sentenceId, trainingId) {
  return post(sentansesEndpoint, {
    sentenceId,
    trainingId,
  });
}
