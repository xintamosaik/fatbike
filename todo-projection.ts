import type { TodoRow } from "./types";
import type { TodoEvent } from "./todo-events";

import { readEventsFromFile } from "./todo-store";
/**
 * In-memory current-state projection for todos.
 *
 * Architectural role:
 * - rebuild current state from the event log
 * - apply events to the read model
 * - expose read-model accessors and next-id/sequence helpers
 *
 * This file owns current state in memory. It does not write to disk.
 */

/**
 * The in-memory projection of todos, keyed by ID and ordered by creation.
 */
const byId = new Map<number, TodoRow>();

const orderedIds: number[] = [];

let nextId = 1;
let nextSeq = 1;

function cloneTodos(): TodoRow[] {
    return orderedIds
        .map((id) => byId.get(id))
        .filter((todo): todo is TodoRow => Boolean(todo));
}

/**
 * Applies one event to the in-memory todo projection.
 *
 * This is the central projection rule for current todo state.
 */
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

        case "todo_due_date_updated": {
            const existing = byId.get(event.entity_id);
            if (!existing) {
                nextSeq = Math.max(nextSeq, event.seq + 1);
                return;
            }

            byId.set(event.entity_id, {
                ...existing,
                due_date: event.data.due_date,
            });

            nextSeq = Math.max(nextSeq, event.seq + 1);
            return;
        }

        case "todo_effort_updated": {
            const existing = byId.get(event.entity_id);
            if (!existing) {
                nextSeq = Math.max(nextSeq, event.seq + 1);
                return;
            }

            byId.set(event.entity_id, {
                ...existing,
                effort: event.data.effort,
            });

            nextSeq = Math.max(nextSeq, event.seq + 1);
            return;
        }
    }

    const exhaustiveCheck: never = event;
    throw new Error(`Unhandled event: ${JSON.stringify(exhaustiveCheck)}`);
}

/**
 * Compares two events by their sequence number.
 * Sorts events by their sequence number, which is the global ordering of all events in the system. 
 * This is necessary to ensure that we apply events in the correct order when rebuilding the projection from disk.
 */
function byEventSequence(a: TodoEvent, b: TodoEvent): number {
    return a.seq - b.seq;
}

/**
 * Rebuilds the in-memory projection from the persisted event log.
 */
async function replayEventsFromDisk(): Promise<void> {
    const events = await readEventsFromFile();
    events.sort(byEventSequence);

    for (const event of events) {
        applyEvent(event);
    }
}

/**
 * Returns one todo from the current projection, if present.
 */
function getTodoById(id: number): TodoRow | undefined {
    return byId.get(id);
}

/**
 * Returns all todos from the current projection in display order.
 */
function getAllTodos(): TodoRow[] {
    return cloneTodos();
}

/**
 * Returns the next todo id implied by the current projection.
 */
function getNextTodoId(): number {
    return nextId;
}

/**
 * Returns the next event sequence number implied by the current projection.
 */
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
