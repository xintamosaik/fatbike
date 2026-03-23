import { renderToReadableStream } from "react-dom/server";
import type { ReactElement } from "react";
import homepage from "./index.html";

import { getTodo, getTodos, updateTodoShort } from "./pg";
import type { AppError } from "./error";
import type { TodoRow } from "./types";

function shortSlotId(id: number): string {
  return `todo-short-${id}`;
}

function ShortDisplay(props: { todo: TodoRow }) {
  const slotId = shortSlotId(props.todo.id);

  return (
    <div id={slotId}>
      <span>{props.todo.short}</span>{" "}
      <button
        fx-action={`/todos/${props.todo.id}/edit/short`}
        fx-method="POST"
        fx-target={`#${slotId}`}
        fx-swap="outerHTML"
      >
        Edit
      </button>
    </div>
  );
}

function ShortEditor(props: { todo: TodoRow }) {
  const slotId = shortSlotId(props.todo.id);

  return (
    <form
      id={slotId}
      fx-action={`/todos/${props.todo.id}/update/short`}
      fx-method="POST"
      fx-target={`#${slotId}`}
      fx-swap="outerHTML"
    >
      <label>
        Short{" "}
        <input
          name="short"
          value={props.todo.short}
          required
          minLength={3}
          maxLength={120}
        />
      </label>{" "}
      <button type="submit">Save</button>
    </form>
  );
}

function TodoList(props: { todos: TodoRow[] }) {
  return (
    <section>
      <h2>Todos</h2>
    
      <table>
        <thead>
          <tr>
            <th>Short</th>
            <th>Due Date</th>
            <th>Cost of Delay</th>
            <th>Effort</th>
          </tr>
        </thead>
        <tbody>
          {props.todos.map((todo) => (
            <tr key={todo.id}>
              <td>
                <ShortDisplay todo={todo} />
              </td>
              <td>{todo.due_date}</td>
              <td>{todo.cost_of_delay}</td>
              <td>{todo.effort}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

async function htmlResponse(fragment: ReactElement): Promise<Response> {
  const stream = await renderToReadableStream(fragment);

  return new Response(stream, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function appErrorResponse(error: AppError): Response {
  switch (error.kind) {
    case "not_found":
      return new Response(error.message, { status: 404 });
    case "validation":
      return new Response(error.message, { status: 400 });
    case "internal":
      return new Response(error.message, { status: 500 });
    default:
      return new Response("Unexpected error", { status: 500 });
  }
}

const editShortPattern = new URLPattern({ pathname: "/todos/:id/edit/short" });
const updateShortPattern = new URLPattern({ pathname: "/todos/:id/update/short" });

async function handleTodosList(): Promise<Response> {
  const todosResult = await getTodos();
  if (!todosResult.ok) {
    return appErrorResponse(todosResult.error);
  }

  return htmlResponse(<TodoList todos={todosResult.value} />);
}

async function handleTodoEditShort(id: number): Promise<Response> {
  const todoResult = await getTodo(id);
  if (!todoResult.ok) {
    return appErrorResponse(todoResult.error);
  }

  return htmlResponse(<ShortEditor todo={todoResult.value} />);
}

async function handleTodoUpdateShort(
  request: Request,
  id: number,
): Promise<Response> {
  const form = await request.formData();
  const short = String(form.get("short") ?? "").trim();

  if (short.length < 3) {
    return new Response("Short must be at least 3 characters.", {
      status: 400,
    });
  }

  const updatedResult = await updateTodoShort(id, short);
  if (!updatedResult.ok) {
    return appErrorResponse(updatedResult.error);
  }

  return htmlResponse(<ShortDisplay todo={updatedResult.value} />);
}

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

async function handlePostTodosRoutes(request: Request, url: URL): Promise<Response> {
  const editMatch = editShortPattern.exec(url);
  if (editMatch) {
    const id = parseTodoId(editMatch.pathname.groups["id"]);
    if (id === null) {
      return new Response("Not Found", { status: 404 });
    }

    return handleTodoEditShort(id);
  }

  const updateMatch = updateShortPattern.exec(url);
  if (updateMatch) {
    const id = parseTodoId(updateMatch.pathname.groups["id"]);
    if (id === null) {
      return new Response("Not Found", { status: 404 });
    }

    return handleTodoUpdateShort(request, id);
  }

  return new Response("Not Found", { status: 404 });
}

Bun.serve({
  routes: {
    "/": homepage,
    "/todos/list": handleTodosList,
  },
  fetch: async (request) => {
    const url = new URL(request.url);

    if (request.method === "POST") {
      return handlePostTodosRoutes(request, url);
    }

    return new Response("Not Found", { status: 404 });
  },
});