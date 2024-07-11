import { get, post, put, del } from "./api.js";

const endpoints = {
  catalog: "/data/a1",
  byId: "/data/a1",
  like: "/data/likes",
  userData: "/data/a1UserData",
  allTraining: "/data/vocabulary?select=_id%2Ctitle",
  currentTraining:"/data/vocabulary/",
};

//get all training
export async function getAllTraining() {
  return get(endpoints.allTraining);
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







//get all known sentences for current owner
export async function getKnownSentences(_ownerId, translateMode) {
  return get(
    endpoints.userData +
      `?where=_ownerId%3D%22${_ownerId}%22%20AND%20translateMode%3D%22${translateMode}%22`
  );
}

//set unknown sentence to known sentence
export async function iKnowItUnit(id, translateMode) {
  return post(endpoints.userData, { id, translateMode });
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
