import { createTodo } from "./persistence";
import { TodoRowDisplay } from "./todo-list";
import { appErrorResponse, htmlResponse } from "./response";

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
 * Handles the "create todo" interaction.
 *
 * Architectural role:
 * - accepts a create request
 * - delegates persistence to the app-facing persistence API
 * - returns the HTML fragment for the newly created row
 *
 * This handler deliberately renders only the created row rather than the full
 * list. That keeps the interaction local and matches the UI swap strategy.
 */
async function handleTodoCreate(): Promise<Response> {
    const createResult = await createTodo();
    if (!createResult.ok) {
        return appErrorResponse(createResult.error);
    }

    return htmlResponse(<TodoRowDisplay todo={createResult.value} />);
}

export default handleTodoCreate;
export type { TodoCreatedEvent };