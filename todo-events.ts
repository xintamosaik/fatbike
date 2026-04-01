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
import type { TodoCreatedEvent } from "./todo-create";
import type { TodoShortUpdatedEvent } from "./todo-short";
import type { TodoCostOfDelayUpdatedEvent } from "./todo-cost-of-delay";
import type { TodoDueDateUpdatedEvent } from "./todo-due-date";
import type { TodoEffortUpdatedEvent } from "./todo-effort";

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
    TodoEvent, TodoCreatedEvent
};
