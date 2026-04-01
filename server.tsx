import homepage from "./index.html";
import { handleTodosList } from "./todo-list";
import handleTodoCreate from "./todo-create";
import { handleTodoUpdateShort, handleTodoEditShort } from "./todo-short";
import { handleTodoEditDueDate, handleTodoUpdateDueDate } from "./todo-due-date";

import { handleTodoEditEffort, handleTodoUpdateEffort } from "./todo-effort";

import { handleTodoEditCostOfDelay, handleTodoUpdateCostOfDelay } from "./todo-cost-of-delay";
import { initializeStore } from "./persistence";

/**
 * HTTP entry point.
 *
 * Architectural role:
 * - defines route-to-handler wiring
 * - performs route-level parameter parsing
 * - initializes the store on process startup
 *
 * Business and persistence logic should stay out of this file.
 */

/**
 * Parses and validates a todo id from a route parameter.
 *
 * Returns `null` when the parameter is missing or invalid.
 */
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
  const result = await initializeStore();
  if (!result.ok) {
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
    "/todos/:id/edit/due-date": {
      POST: (request) => {
        const id = parseTodoId(request.params.id);
        if (id === null) {
          return new Response("Not Found", { status: 404 });
        }

        return handleTodoEditDueDate(id);
      },
    },
    "/todos/:id/update/due-date": {
      POST: (request) => {
        const id = parseTodoId(request.params.id);
        if (id === null) {
          return new Response("Not Found", { status: 404 });
        }

        return handleTodoUpdateDueDate(request, id);
      },
    },
    "/todos/:id/edit/effort": {
      POST: (request) => {
        const id = parseTodoId(request.params.id);
        if (id === null) {
          return new Response("Not Found", { status: 404 });
        }

        return handleTodoEditEffort(id);
      },
    },
    "/todos/:id/update/effort": {
      POST: (request) => {
        const id = parseTodoId(request.params.id);
        if (id === null) {
          return new Response("Not Found", { status: 404 });
        }

        return handleTodoUpdateEffort(request, id);
      },
    },
    "/todos/:id/edit/cost-of-delay": {
      POST: (request) => {
        const id = parseTodoId(request.params.id);
        if (id === null) {
          return new Response("Not Found", { status: 404 });
        }

        return handleTodoEditCostOfDelay(id);
      },
    },
    "/todos/:id/update/cost-of-delay": {
      POST: (request) => {
        const id = parseTodoId(request.params.id);
        if (id === null) {
          return new Response("Not Found", { status: 404 });
        }

        return handleTodoUpdateCostOfDelay(request, id);
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