import { d, Task } from '@serenity-js/core';
import { DeleteRequest, GetRequest, PatchRequest, PostRequest, PutRequest, Send } from '@serenity-js/rest';

// Relative to the actor's base URL (…/admin-api/): a leading slash would resolve against the host root.
const relative = (path: string) => path.replace(/^\//, '');

/** Admin API calls; the actor's CallAnApi ability already carries its own OAuth token and scopes. */
export const UseTheAdminApi = {
  get: (path: string) => Task.where(d`#actor consulta GET ${path} en la Admin API`, Send.a(GetRequest.to(relative(path)))),
  post: (path: string, body: object) => Task.where(d`#actor envía POST ${path} a la Admin API`, Send.a(PostRequest.to(relative(path)).with(body))),
  patch: (path: string, body: object) => Task.where(d`#actor envía PATCH ${path} a la Admin API`, Send.a(PatchRequest.to(relative(path)).with(body))),
  put: (path: string) => Task.where(d`#actor envía PUT ${path} a la Admin API`, Send.a(PutRequest.to(relative(path)).with({}))),
  delete: (path: string) => Task.where(d`#actor envía DELETE ${path} a la Admin API`, Send.a(DeleteRequest.to(relative(path)))),
};
