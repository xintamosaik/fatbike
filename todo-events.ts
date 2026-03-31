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
 * The data shape for a `todo_short_updated` event data, which captures a change to the
 * `short` field of a todo.
 */
type TodoShortUpdatedData = {
    short: string;
};

/**
 * The data shape for a `todo_due_date_updated` event data, which captures a
 * change to the `due_date` field of a todo.
 */
type TodoDueDateUpdatedData = {
    due_date: string;
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
 * The shape of a `todo_short_updated` event, which captures an update to the `short`
 * field of an existing todo.
 */
type TodoShortUpdatedEvent = {
    seq: number;
    stream: "todo";
    kind: "todo_short_updated";
    entity_id: number;
    at: string;
    data: TodoShortUpdatedData;
};

/**
 * The shape of a `todo_due_date_updated` event, which captures an update to
 * the `due_date` field of an existing todo.
 */
type TodoDueDateUpdatedEvent = {
    seq: number;
    stream: "todo";
    kind: "todo_due_date_updated";
    entity_id: number;
    at: string;
    data: TodoDueDateUpdatedData;
};

/**
 * The union of all event shapes for the todo stream.
 */
type TodoEvent = TodoCreatedEvent | TodoShortUpdatedEvent | TodoDueDateUpdatedEvent;

export type {
    TodoCreatedData,
    TodoShortUpdatedData,
    TodoDueDateUpdatedData,
    TodoCreatedEvent,
    TodoShortUpdatedEvent,
    TodoDueDateUpdatedEvent,
    TodoEvent,
};
