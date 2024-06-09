import { get, post, put, del } from "./api.js";

const endpoints = {
  catalog: "/jsonstore/campers",
  byId: "/jsonstore/vocabulary",
  like: "/data/likes",
};

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

//Option search
export async function searchUnits(query) {
  return get(`/data/cars?where=model%20LIKE%20%22${query}%22`);
}

//Option Like
export async function likeUnit(data) {
  return post(endpoints.like, data);
}

export async function getLikesCount(factId) {
  return get(
    `/data/likes?where=factId%3D%22${factId}%22&distinct=_ownerId&count`
  );
}

export async function isAlreadyLiked(factId, userId) {
  return get(
    `/data/likes?where=factId%3D%22${factId}%22%20and%20_ownerId%3D%22${userId}%22&count`
  );
}
