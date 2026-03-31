import { appendFile } from "node:fs/promises";

import type { TodoEvent } from "./todo-events";

/**
 * Raw event-log storage.
 *
 * Architectural role:
 * - read persisted todo events from disk
 * - append new todo events to disk
 *
 * This file knows about the on-disk event log but not about current-state
 * projection rules.
 */

/**
 * The filename for the on-disk event log. Each line is a JSON-serialized `TodoEvent`.
 */
const eventsFile = "events.todo.jsonl";
let writeQueue: Promise<void> = Promise.resolve();

/**
 * Reads and parses all events currently stored in the todo event log file.
 */
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

/**
 * Appends one event to the todo event log.
 *
 * Writes are serialized through an in-process queue so multiple appends do not
 * interleave at the file level.
 */
function appendEvent(event: TodoEvent): Promise<void> {
  const line = `${JSON.stringify(event)}\n`;
  writeQueue = writeQueue.then(() => appendFile(eventsFile, line, "utf8"));
  return writeQueue;
}

export { readEventsFromFile, appendEvent };
