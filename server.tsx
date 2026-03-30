import homepage from "./index.html";
import handleTodosList from "./list";
import handleTodoCreate from "./create";
import handleTodoUpdateShort from "./short-update";
import handleTodoEditShort from "./short-edit";
import type { TodoRow } from "./types";
import { getTodos } from "./pg";

const todos: TodoRow[] = []; // We hold the todos in memory and update on init. Other than that we record events and update only memory.

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

(async function init() {
  // read the todos from the create table and update the in-memory list after parsing the events. 
  // This is a simple event sourcing approach that allows us to have a single source of truth for the todos and also allows us to replay the events if needed.
  // For now we only read the todos on init, because we do not have events yet. They would need to be implemented
  const result = await getTodos();
  if (result.ok) {
    todos.push(...result.value);
  } else {
    console.error("Failed to load todos on init", result.error);
  }
})();

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