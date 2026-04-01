/**
 * Event schema for the todo stream.
 *
 * Architectural role:
 * - define the durable event shapes written to the event log
 * - provide a single source of truth for event structure
 *
 * These types describe persisted facts, not UI fragments and not projection
 * state.
 */
import type {
    TodoShortUpdatedEvent,
    TodoShortUpdatedData,
} from "./todo-short";

import type {
    TodoCostOfDelayUpdatedEvent,
    TodoCostOfDelayUpdatedData,
} from "./todo-cost-of-delay";

import type {
    TodoDueDateUpdatedEvent,
    TodoDueDateUpdatedData,
} from "./todo-due-date";

import type {
    TodoEffortUpdatedEvent,
    TodoEffortUpdatedData,  
} from "./todo-effort";

/**
 * The data shape for a `todo_created` event data, which captures the initial state of
 * a todo.
 */
type TodoCreatedData = {
    short: string;
    due_date: string;
    cost_of_delay: -2 | -1 | 0 | 1 | 2;
    effort: "mins" | "hours" | "days" | "weeks" | "months";
};


/**
 * The shape of a `todo_created` event, which captures the creation of a new todo.
 */
type TodoCreatedEvent = {
    seq: number;
    stream: "todo";
    kind: "todo_created";
    entity_id: number;
    at: string;
    data: TodoCreatedData;
};

/**
 * The union of all event shapes for the todo stream.
 */
type TodoEvent =
    | TodoCreatedEvent
    | TodoShortUpdatedEvent
    | TodoDueDateUpdatedEvent
    | TodoEffortUpdatedEvent
    | TodoCostOfDelayUpdatedEvent;

export type {
    TodoCreatedData,
    TodoShortUpdatedData,
    TodoDueDateUpdatedData,
    TodoEffortUpdatedData,
    TodoCostOfDelayUpdatedData,
    TodoCreatedEvent,
    TodoShortUpdatedEvent,
    TodoDueDateUpdatedEvent,
    TodoEffortUpdatedEvent,
    TodoCostOfDelayUpdatedEvent,
    TodoEvent,
};
