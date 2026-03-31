import type { AppError, Result } from "./error";
import type { TodoRow } from "./types";
import { appendFile } from "node:fs/promises";

const eventsFile = "events.todo.jsonl";

type TodoCreatedData = {
  short: string;
  due_date: string;
  cost_of_delay: -2 | -1 | 0 | 1 | 2;
  effort: "mins" | "hours" | "days" | "weeks" | "months";
};

type TodoShortUpdatedData = {
  short: string;
};

type TodoCreatedEvent = {
  seq: number;
  stream: "todo";
  kind: "todo_created";
  entity_id: number;
  at: string;
  data: TodoCreatedData;
};

type TodoShortUpdatedEvent = {
  seq: number;
  stream: "todo";
  kind: "todo_short_updated";
  entity_id: number;
  at: string;
  data: TodoShortUpdatedData;
};

type TodoEvent = TodoCreatedEvent | TodoShortUpdatedEvent;

const byId = new Map<number, TodoRow>();
const orderedIds: number[] = [];

let nextId = 1;
let nextSeq = 1;

let isInitialized = false;
let initPromise: Promise<void> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function cloneTodos(): TodoRow[] {
  return orderedIds
    .map((id) => byId.get(id))
    .filter((todo): todo is TodoRow => Boolean(todo));
}

function applyEvent(event: TodoEvent): void {
  switch (event.kind) {
    case "todo_created": {
      const row: TodoRow = {
        id: event.entity_id,
        short: event.data.short,
        due_date: event.data.due_date,
        cost_of_delay: event.data.cost_of_delay,
        effort: event.data.effort,
      };

      const alreadyExists = byId.has(event.entity_id);
      byId.set(event.entity_id, row);

      if (!alreadyExists) {
        orderedIds.push(event.entity_id);
        orderedIds.sort((a, b) => a - b);
      }

      nextId = Math.max(nextId, event.entity_id + 1);
      nextSeq = Math.max(nextSeq, event.seq + 1);
      return;
    }

    case "todo_short_updated": {
      const existing = byId.get(event.entity_id);
      if (!existing) {
        nextSeq = Math.max(nextSeq, event.seq + 1);
        return;
      }

      byId.set(event.entity_id, {
        ...existing,
        short: event.data.short,
      });

      nextSeq = Math.max(nextSeq, event.seq + 1);
      return;
    }
  }

  const exhaustiveCheck: never = event;
  throw new Error(`Unhandled event: ${JSON.stringify(exhaustiveCheck)}`);
}

function appendEvent(event: TodoEvent): Promise<void> {
  const line = `${JSON.stringify(event)}\n`;
  writeQueue = writeQueue.then(() => appendFile(eventsFile, line, "utf8"));
  return writeQueue;
}

async function readEventsFromFile(path: string): Promise<TodoEvent[]> {
  const file = Bun.file(path);

  if (!(await file.exists())) {
    return [];
  }

  const text = await file.text();
  if (!text.trim()) {
    return [];
  }

  const events: TodoEvent[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const parsed = JSON.parse(trimmed) as TodoEvent;
    events.push(parsed);
  }

  return events;
}

function byEventSequence(a: TodoEvent, b: TodoEvent): number {
  return a.seq - b.seq;
}

async function replayEventsFromDisk(): Promise<void> {
  const events = await readEventsFromFile(eventsFile);
  events.sort(byEventSequence);

  for (const event of events) {
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
      seq: nextSeq,
      stream: "todo",
      kind: "todo_created",
      entity_id: nextId,
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
      seq: nextSeq,
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

    return { ok: true, value: byId.get(id)! };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to update todo." },
    };
  }
}

export { initializeStore, getTodos, getTodo, updateTodoShort, createTodo };