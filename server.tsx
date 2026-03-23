import { renderToReadableStream } from "react-dom/server";
import type { ReactElement } from "react";
import homepage from "./index.html";

import { getTodo, getTodos, updateTodoShort } from "./pg";
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

Bun.serve({
  routes: {
    "/": homepage,
    "/todos/list": async () => {
      const todosResult = await getTodos();
      if (!todosResult.ok) {
        return new Response(todosResult.error.message, { status: 500 });
      }
      const todos = todosResult.value;
      return htmlResponse(<TodoList todos={todos} />);
    },
  },
  fetch: async (request) => {
    const url = new URL(request.url);

    if (request.method === "POST") {
      const editMatch = url.pathname.match(/^\/todos\/(\d+)\/edit\/short$/);
      if (editMatch) {
        const id = Number(editMatch[1]);
        const todoResult = await getTodo(id);
        if (!todoResult.ok) {
          return new Response(todoResult.error.message, { status: 404 });
        }
        const todo = todoResult.value;

        return htmlResponse(<ShortEditor todo={todo} />);
      }

      const updateMatch = url.pathname.match(/^\/todos\/(\d+)\/update\/short$/);
      if (updateMatch) {
        const id = Number(updateMatch[1]);
        const form = await request.formData();
        const short = String(form.get("short") ?? "").trim();

        if (short.length < 3) {
          return new Response("Short must be at least 3 characters.", {
            status: 400,
          });
        }

        const updatedResult = await updateTodoShort(id, short);
        if (!updatedResult.ok) {
          return new Response(updatedResult.error.message, { status: 404 });
        }
        const updatedTodo = updatedResult.value;

        return htmlResponse(<ShortDisplay todo={updatedTodo} />);
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});