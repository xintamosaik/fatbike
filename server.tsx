import homepage from "./index.html";

import { handleTodosList } from "./list";
import { handleTodoCreate } from "./create";
import { handleTodoUpdateShort } from "./short-update";
import { handleTodoEditShort  } from "./short-edit";

function parseTodoId(rawId: string | undefined): number | null {
  if (!rawId) {
    return null;
  }

  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) {
    return null;
  }

  return id;
}

const server = Bun.serve({
  routes: {
    "/": homepage,
    "/todos/list": {
      GET: handleTodosList,
    },
    "/todos/new": {
      POST: handleTodoCreate,
    },
    "/todos/:id/edit/short": {
      POST: (request) => {
        const id = parseTodoId(request.params.id);
        if (id === null) {
          return new Response("Not Found", { status: 404 });
        }

        return handleTodoEditShort(id);
      },
    },
    "/todos/:id/update/short": {
      POST: (request) => {
        const id = parseTodoId(request.params.id);
        if (id === null) {
          return new Response("Not Found", { status: 404 });
        }

        return handleTodoUpdateShort(request, id);
      },
    },
  },
  fetch: () => {
    return new Response("Not Found", { status: 404 });
  },
  error: (error) => {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`Server running at ${server.url}`);