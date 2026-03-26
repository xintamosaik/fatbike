// This file uses a json
import type { AppError, Result } from "./error";
import type { TodoRow } from "./types";

const file = "todos.json";
async function readTodos(): Promise<TodoRow[]> {
  const contents = Bun.file(file);
  return await contents.json();
}

async function writeTodos(todos: TodoRow[]): Promise<void> {
  await Bun.write(file, JSON.stringify(todos, null, 2));
}

async function createTodo(): Promise<Result<TodoRow[], AppError>> {
  try {
    const todos = await readTodos();
    const newTodo: TodoRow = {
      id: todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1,
      short: "",
      due_date: "",
      cost_of_delay: 0,
      effort: "mins",
    };

    todos.push(newTodo);
    await writeTodos(todos);
    return { ok: true, value: todos };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to create todo." },
    };
  }
}


async function getTodos(): Promise<Result<TodoRow[], AppError>> {
  try {
    const todos = await readTodos();
    return { ok: true, value: todos };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to load todos." },
    };
  }
}

async function getTodo(id: number): Promise<Result<TodoRow, AppError>> {
  try {
    const todos = await readTodos();
    const row = todos.find((t) => t.id === id);

    if (!row) {
      return {
        ok: false,
        error: { kind: "not_found", message: "Todo not found." },
      };
    }

    return { ok: true, value: row };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to load todo." },
    };
  }
}

async function updateTodoShort(
  id: number,
  short: string,
): Promise<Result<TodoRow, AppError>> {
  try {
    const todos = await readTodos();
    const index = todos.findIndex((t) => t.id === id);

    if (index === -1) {
      return {
        ok: false,
        error: { kind: "not_found", message: "Todo not found." },
      };
    }

    const existing = todos[index]!;

    const updated: TodoRow = { ...existing, short };

    todos[index] = updated;

    await writeTodos(todos);

    return { ok: true, value: updated };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to update todo." },
    };
  }
}


export { getTodos, getTodo, updateTodoShort, createTodo };