import { get, post, put, del } from "./api.js";

const endpoints = {
  catalog: "/data/a1",
  byId: "/data/a1",
  like: "/data/likes",
  learnedSentences: "/data/learnedSentences",
  allTraining: "/data/vocabulary?select=_id%2Ctitle%2CsentencesCount",
  currentTraining: "/data/vocabulary/",
};

//get all training
export async function getAllTraining() {
  return get(endpoints.allTraining);
}

//get my training
export async function getMyTraining(_ownerId) {
  return get(endpoints.allTraining + `&where=_ownerId%3D%22${_ownerId}%22`);
}

//get a training
export async function getCurrentTraining(trainingId) {
  return get(endpoints.currentTraining + trainingId);
}

//create new training
export async function createTraining(data) {
  return post(endpoints.currentTraining, data);
}

//delete a training
export async function deleteTraining(id) {
  return del(endpoints.currentTraining + "/" + id);
}

//edit a trining
export async function updateTraining(id, data) {
  return put(endpoints.currentTraining + "/" + id, data);
}

//get all known sentences for current user
export async function getKnownSentences(_ownerId, trainingId) {
  return get(
    endpoints.learnedSentences +
      `?where=_ownerId%3D%22${_ownerId}%22%20AND%20trainingId%3D%22${trainingId}%22`
  );
}

//get count to all known sentences for current user
export async function getKnownSentencesCount(_ownerId, trainingId) {
  return get(
    endpoints.learnedSentences +
      `?where=_ownerId%3D%22${_ownerId}%22%20AND%20trainingId%3D%22${trainingId}%22&distinct=sentenceId&count`
  );
}

//set unknown sentence to known sentence
export async function iKnowItUnit(sentenceId, trainingId) {
  return post(endpoints.learnedSentences, {
    sentenceId,
    trainingId,
  });
}
export async function getAllUnits() {
  return get(endpoints.catalog);
}

export async function getById(id) {
  return get(endpoints.byId + "/" + id);
}

export async function createUnit(data) {
  return post(endpoints.byId, data);
}

export async function updateUnit(id, data) {
  return put(endpoints.byId + "/" + id, data);
}

export async function deleteUnit(id) {
  return del(endpoints.byId + "/" + id);
}

export async function getUnitsCount() {
  return get(`/data/vocabulary?count`);
}

//Option search
export async function searchUnits(query) {
  return get(`/data/cars?where=model%20LIKE%20%22${query}%22`);
}

//Option Like
// export async function likeUnit(data) {
//   return post(endpoints.like, data);
// }

export async function isAlreadyLiked(factId, userId) {
  return get(
    `/data/likes?where=factId%3D%22${factId}%22%20and%20_ownerId%3D%22${userId}%22&count`
  );
}
