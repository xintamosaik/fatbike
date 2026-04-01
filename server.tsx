import homepage from "./index.html";
import handleTodosList from "./list";
import handleTodoCreate from "./create";
import {handleTodoUpdateShort, handleTodoEditShort} from "./todo-short";
import handleTodoEditDueDate from "./due-date-edit";
import handleTodoUpdateDueDate from "./due-date-update";
import handleTodoEditEffort from "./effort-edit";
import handleTodoUpdateEffort from "./effort-update";
import handleTodoEditCostOfDelay from "./cost-of-delay-edit";
import handleTodoUpdateCostOfDelay from "./cost-of-delay-update";
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