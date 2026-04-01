import type { AppError, Result } from "./error";
import type { TodoRow } from "./types";

import type { TodoCreatedEvent, TodoEvent } from "./todo-events";

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

/**
 * App-facing persistence API for todos.
 *
 * Architectural role:
 * - exposes the storage operations the rest of the app is allowed to use
 * - hides event-log storage details from handlers
 * - coordinates append + projection update for writes
 *
 * This file is intentionally thin:
 * - event shapes live in `todo-events.ts`
 * - raw event-log IO lives in `todo-store.ts`
 * - in-memory read model / replay logic lives in `todo-projection.ts`
 */

/**
 * Ensures the in-memory projection has been rebuilt from the event log.
 *
 * Safe to call multiple times. Replay only happens once per process.
 */
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

/**
 * Creates a new todo by appending a `todo_created` event and applying it to
 * the current in-memory projection.
 *
 * Returns the projected current state of the created todo.
 */
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

/**
 * Returns all todos from the current projection.
 *
 * This is a read-model operation: it returns current state, not event history.
 */
async function getTodos(): Promise<Result<TodoRow[], AppError>> {
  const initResult = await initializeStore();
  if (!initResult.ok) {
    return initResult;
  }

  return { ok: true, value: getAllTodos() };
}

/**
 * Returns one todo from the current projection by id.
 */
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
async function updateTodoWithEvent<TEvent extends TodoEvent>(
  args: {
    id: number;
    hasChanged: (existing: TodoRow) => boolean;
    makeEvent: (meta: { seq: number; at: string }) => TEvent;
  },
): Promise<Result<TodoRow, AppError>> {
  const initResult = await initializeStore();
  if (!initResult.ok) {
    return initResult;
  }

  const existing = getTodoById(args.id);
  if (!existing) {
    return {
      ok: false,
      error: { kind: "not_found", message: "Todo not found." },
    };
  }

  if (!args.hasChanged(existing)) {
    return { ok: true, value: existing };
  }

  try {
    const event = args.makeEvent({
      seq: getNextEventSeq(),
      at: new Date().toISOString(),
    });

    await appendEvent(event);
    applyEvent(event);

    const updated = getTodoById(args.id);
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
export {
  initializeStore,
  getTodos,
  getTodo,
  updateTodoWithEvent,
  createTodo,
};