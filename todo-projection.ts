import type { TodoRow } from "./types";
import type { TodoEvent } from "./todo-events";

import { readEventsFromFile } from "./todo-store";

const byId = new Map<number, TodoRow>();
const orderedIds: number[] = [];

let nextId = 1;
let nextSeq = 1;

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

function byEventSequence(a: TodoEvent, b: TodoEvent): number {
  return a.seq - b.seq;
}

async function replayEventsFromDisk(): Promise<void> {
  const events = await readEventsFromFile();
  events.sort(byEventSequence);

  for (const event of events) {
    applyEvent(event);
  }
}

function getTodoById(id: number): TodoRow | undefined {
  return byId.get(id);
}

function getAllTodos(): TodoRow[] {
  return cloneTodos();
}

function getNextTodoId(): number {
  return nextId;
}

function getNextEventSeq(): number {
  return nextSeq;
}

export {
  applyEvent,
  replayEventsFromDisk,
  getTodoById,
  getAllTodos,
  getNextTodoId,
  getNextEventSeq,
};
