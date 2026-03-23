import { renderToReadableStream } from "react-dom/server";
import pg from "pg";
import type { ReactElement } from "react";
import homepage from "./index.html";

const { Pool } = pg;

type Todo = {
  id: number;
  short: string;
  dueDate: string;
  costOfDelay: number;
  effort: number;
};

type TodoRow = {
  id: number;
  short: string;
  due_date: string;
  cost_of_delay: number;
  effort: number;
};

const fallbackTodos: Todo[] = [
  {
    id: 1,
    short: "Replace worn brake pads",
    dueDate: "2026-03-29",
    costOfDelay: 8,
    effort: 2,
  },
  {
    id: 2,
    short: "Plan spring trail loop",
    dueDate: "2026-04-02",
    costOfDelay: 5,
    effort: 3,
  },
  {
    id: 3,
    short: "Order tubeless sealant",
    dueDate: "2026-03-26",
    costOfDelay: 7,
    effort: 1,
  },
];

const todoStore = new Map<number, Todo>(fallbackTodos.map((todo) => [todo.id, todo]));
const databaseUrl = process.env["DATABASE_URL"];
const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    short: row.short,
    dueDate: row.due_date,
    costOfDelay: row.cost_of_delay,
    effort: row.effort,
  };
}

async function getTodos(): Promise<Todo[]> {
  if (!pool) {
    return Array.from(todoStore.values()).sort((a, b) => a.id - b.id);
  }

  const result = await pool.query<TodoRow>(
    `
      SELECT id, short, due_date, cost_of_delay, effort
      FROM todos
      ORDER BY id ASC
      LIMIT 50
    `,
  );

  return result.rows.map(toTodo);
}

async function getTodo(id: number): Promise<Todo | null> {
  if (!pool) {
    return todoStore.get(id) ?? null;
  }

  const result = await pool.query<TodoRow>(
    `
      SELECT id, short, due_date, cost_of_delay, effort
      FROM todos
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] ? toTodo(result.rows[0]) : null;
}

async function updateTodoShort(id: number, short: string): Promise<Todo | null> {
  if (!pool) {
    const existing = todoStore.get(id);
    if (!existing) {
      return null;
    }

    const updated = { ...existing, short };
    todoStore.set(id, updated);
    return updated;
  }

  const result = await pool.query<TodoRow>(
    `
      UPDATE todos
      SET short = $2
      WHERE id = $1
      RETURNING id, short, due_date, cost_of_delay, effort
    `,
    [id, short],
  );

  return result.rows[0] ? toTodo(result.rows[0]) : null;
}

function shortSlotId(id: number): string {
  return `todo-short-${id}`;
}

function ShortDisplay(props: { todo: Todo }) {
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

function ShortEditor(props: { todo: Todo }) {
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

function TodoList(props: { todos: Todo[] }) {
  return (
    <section>
      <h2>Todos</h2>
      <p>{pool ? "Source: Postgres" : "Source: in-memory fallback"}</p>
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
              <td>{todo.dueDate}</td>
              <td>{todo.costOfDelay}</td>
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
      const todos = await getTodos();
      return htmlResponse(<TodoList todos={todos} />);
    },
  },
  fetch: async (request) => {
    const url = new URL(request.url);

    if (request.method === "POST") {
      const editMatch = url.pathname.match(/^\/todos\/(\d+)\/edit\/short$/);
      if (editMatch) {
        const id = Number(editMatch[1]);
        const todo = await getTodo(id);
        if (!todo) {
          return new Response("Not Found", { status: 404 });
        }

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

        const updatedTodo = await updateTodoShort(id, short);
        if (!updatedTodo) {
          return new Response("Not Found", { status: 404 });
        }

        return htmlResponse(<ShortDisplay todo={updatedTodo} />);
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});