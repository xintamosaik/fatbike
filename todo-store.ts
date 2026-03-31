import { appendFile } from "node:fs/promises";

import type { TodoEvent } from "./todo-events";

const eventsFile = "events.todo.jsonl";
let writeQueue: Promise<void> = Promise.resolve();

async function readEventsFromFile(): Promise<TodoEvent[]> {
  const file = Bun.file(eventsFile);

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

function appendEvent(event: TodoEvent): Promise<void> {
  const line = `${JSON.stringify(event)}\n`;
  writeQueue = writeQueue.then(() => appendFile(eventsFile, line, "utf8"));
  return writeQueue;
}

export { readEventsFromFile, appendEvent };
