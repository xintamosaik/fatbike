import type { AppError, Result } from "./error";
import type { TodoRow } from "./types";
import { appendFile } from "node:fs/promises";

const eventsFile = "todos.events.jsonl";
const legacySnapshotFile = "todos.json";

type TodoCreatedEvent = {
  kind: "todo_created";
  id: number;
  short: string;
  due_date: string;
  cost_of_delay: -2 | -1 | 0 | 1 | 2;
  effort: "mins" | "hours" | "days" | "weeks" | "months";
  at: string;
};

type TodoShortUpdatedEvent = {
  kind: "todo_short_updated";
  id: number;
  short: string;
  at: string;
};

type TodoEvent = TodoCreatedEvent | TodoShortUpdatedEvent;

const byId = new Map<number, TodoRow>();
const orderedIds: number[] = [];
let nextId = 1;

let isInitialized = false;
let initPromise: Promise<void> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function cloneTodos(): TodoRow[] {
  return orderedIds
    .map((id) => byId.get(id))
    .filter((todo): todo is TodoRow => Boolean(todo));
}

function applyEvent(event: TodoEvent): void {
  if (event.kind === "todo_created") {
    const row: TodoRow = {
      id: event.id,
      short: event.short,
      due_date: event.due_date,
      cost_of_delay: event.cost_of_delay,
      effort: event.effort,
    };

    const alreadyExists = byId.has(event.id);
    byId.set(event.id, row);
    if (!alreadyExists) {
      orderedIds.push(event.id);
      orderedIds.sort((a, b) => a - b);
    }
    nextId = Math.max(nextId, event.id + 1);
    return;
  }

  const existing = byId.get(event.id);
  if (!existing) {
    return;
  }

  byId.set(event.id, { ...existing, short: event.short });
}

function appendEvent(event: TodoEvent): Promise<void> {
  const line = `${JSON.stringify(event)}\n`;
  writeQueue = writeQueue.then(async () => {
    await appendFile(eventsFile, line, "utf8");
  });
  return writeQueue;
}

async function replayEventsFromDisk(): Promise<void> {
  const file = Bun.file(eventsFile);
  if (!(await file.exists())) {
    return;
  }

  const text = await file.text();
  if (!text.trim()) {
    return;
  }

  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const parsed = JSON.parse(trimmed) as TodoEvent;
    applyEvent(parsed);
  }
}

async function bootstrapFromLegacySnapshotIfNeeded(): Promise<void> {
  if (orderedIds.length > 0) {
    return;
  }

  const file = Bun.file(legacySnapshotFile);
  if (!(await file.exists())) {
    return;
  }

  const todos = (await file.json()) as TodoRow[];
  for (const todo of todos) {
    const event: TodoCreatedEvent = {
      kind: "todo_created",
      id: todo.id,
      short: todo.short,
      due_date: todo.due_date,
      cost_of_delay: todo.cost_of_delay,
      effort: todo.effort,
      at: new Date().toISOString(),
    };

    await appendEvent(event);
    applyEvent(event);
  }
}

async function initializeStore(): Promise<Result<void, AppError>> {
  try {
    if (isInitialized) {
      return { ok: true, value: undefined };
    }

    if (!initPromise) {
      initPromise = (async () => {
        await replayEventsFromDisk();
        await bootstrapFromLegacySnapshotIfNeeded();
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

async function createTodo(): Promise<Result<TodoRow[], AppError>> {
  const initResult = await initializeStore();
  if (!initResult.ok) {
    return initResult;
  }

  try {
    const event: TodoCreatedEvent = {
      kind: "todo_created",
      id: nextId,
      short: "",
      due_date: "",
      cost_of_delay: 0,
      effort: "mins",
      at: new Date().toISOString(),
    };

    await appendEvent(event);
    applyEvent(event);

    return { ok: true, value: cloneTodos() };
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

  return { ok: true, value: cloneTodos() };
}

async function getTodo(id: number): Promise<Result<TodoRow, AppError>> {
  const initResult = await initializeStore();
  if (!initResult.ok) {
    return initResult;
  }

  const todo = byId.get(id);
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

  const existing = byId.get(id);
  if (!existing) {
    return {
      ok: false,
      error: { kind: "not_found", message: "Todo not found." },
    };
  }

  try {
    const event: TodoShortUpdatedEvent = {
      kind: "todo_short_updated",
      id,
      short,
      at: new Date().toISOString(),
    };

    await appendEvent(event);
    applyEvent(event);

    return { ok: true, value: byId.get(id)! };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to update todo." },
    };
  }
}

export { initializeStore, getTodos, getTodo, updateTodoShort, createTodo };