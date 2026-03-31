import type { AppError, Result } from "./error";
import type { TodoRow } from "./types";
import type { TodoCreatedEvent, TodoShortUpdatedEvent } from "./todo-events";

import { appendEvent } from "./todo-store";
import {
  applyEvent,
  getAllTodos,
  getNextEventSeq,
  getNextTodoId,
  getTodoById,
  replayEventsFromDisk,
} from "./todo-projection";

let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function initializeStore(): Promise<Result<void, AppError>> {
  try {
    if (isInitialized) {
      return { ok: true, value: undefined };
    }

    if (!initPromise) {
      initPromise = (async () => {
        await replayEventsFromDisk();
        isInitialized = true;
      })();
    }

    await initPromise;
    return { ok: true, value: undefined };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to initialize todo store." },
    };
  }
}

async function createTodo(): Promise<Result<TodoRow, AppError>> {
  const initResult = await initializeStore();
  if (!initResult.ok) {
    return initResult;
  }

  try {
    const event: TodoCreatedEvent = {
      seq: getNextEventSeq(),
      stream: "todo",
      kind: "todo_created",
      entity_id: getNextTodoId(),
      at: new Date().toISOString(),
      data: {
        short: "",
        due_date: "",
        cost_of_delay: 0,
        effort: "mins",
      },
    };

    await appendEvent(event);
    applyEvent(event);

    const created = getTodoById(event.entity_id);
    if (!created) {
      return {
        ok: false,
        error: { kind: "internal", message: "Failed to create todo." },
      };
    }

    return { ok: true, value: created };

  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to create todo." },
    };
  }
}

async function getTodos(): Promise<Result<TodoRow[], AppError>> {
  const initResult = await initializeStore();
  if (!initResult.ok) {
    return initResult;
  }

  return { ok: true, value: getAllTodos() };
}

async function getTodo(id: number): Promise<Result<TodoRow, AppError>> {
  const initResult = await initializeStore();
  if (!initResult.ok) {
    return initResult;
  }

  const todo = getTodoById(id);
  if (!todo) {
    return {
      ok: false,
      error: { kind: "not_found", message: "Todo not found." },
    };
  }

  return { ok: true, value: todo };
}

async function updateTodoShort(
  id: number,
  short: string,
): Promise<Result<TodoRow, AppError>> {
  const initResult = await initializeStore();
  if (!initResult.ok) {
    return initResult;
  }

  const existing = getTodoById(id);
  if (!existing) {
    return {
      ok: false,
      error: { kind: "not_found", message: "Todo not found." },
    };
  }

  if (existing.short === short) {
    return { ok: true, value: existing };
  }
  
  try {
    const event: TodoShortUpdatedEvent = {
      seq: getNextEventSeq(),
      stream: "todo",
      kind: "todo_short_updated",
      entity_id: id,
      at: new Date().toISOString(),
      data: {
        short,
      },
    };

    await appendEvent(event);
    applyEvent(event);

    const updated = getTodoById(id);
    if (!updated) {
      return {
        ok: false,
        error: { kind: "internal", message: "Failed to update todo." },
      };
    }

    return { ok: true, value: updated };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to update todo." },
    };
  }
}

export { initializeStore, getTodos, getTodo, updateTodoShort, createTodo };