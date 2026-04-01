import type { TodoRow } from "./types";
import type { FormDataEntryValue } from "bun";
import type { AppError, Result } from "./error";

import { appErrorResponse, htmlResponse } from "./response";
import { updateTodoDueDate, getTodo } from "./persistence";

/**
 * The data shape for a `todo_due_date_updated` event data, which captures a
 * change to the `due_date` field of a todo.
 */
type TodoDueDateUpdatedData = {
    due_date: string;
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
 * Edit fragment for the todo due date field.
 *
 * Architectural role:
 * - render the editable form for one field
 * - keep the edit interaction local to the field being changed
 */
function DueDateEditor(props: { todo: TodoRow }) {
    return (
        <form
            fx-action={`/todos/${props.todo.id}/update/due-date`}
            fx-method="POST"
            fx-swap="outerHTML"
        >
            <label>
                Due Date{" "}
                <input name="due_date" type="date" value={props.todo.due_date} />
            </label>{" "}
            <button type="submit">Save</button>
        </form>
    );
}

/**
 * Loads one todo and returns the due-date-field edit fragment.
 */
async function handleTodoEditDueDate(id: number): Promise<Response> {
    const todoResult = await getTodo(id);
    if (!todoResult.ok) {
        return appErrorResponse(todoResult.error);
    }

    return htmlResponse(<DueDateEditor todo={todoResult.value} />);
}


/**
 * Update interaction for the todo due date field.
 *
 * Architectural role:
 * - read request form data
 * - parse and validate the submitted value
 * - persist the change
 * - render the field back into display mode
 *
 * This keeps the edit/save cycle for one field in one place.
 */

/**
 * A minimal interface for parsing form data that supports the operations we need.
 */
type FormLike = {
    get(name: string): FormDataEntryValue | null;
};

/**
 * Parses and validates the submitted due date value.
 */
function parseDueDateUpdate(
    form: FormLike,
): Result<{ dueDate: string }, AppError> {
    const rawDueDate = form.get("due_date");

    if (typeof rawDueDate !== "string") {
        return {
            ok: false,
            error: {
                kind: "validation",
                message: "Due date is required.",
            },
        };
    }

    const dueDate = rawDueDate.trim();

    // Empty string is allowed to clear the value. Otherwise require YYYY-MM-DD.
    if (dueDate !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return {
            ok: false,
            error: {
                kind: "validation",
                message: "Due date must be YYYY-MM-DD.",
            },
        };
    }

    return { ok: true, value: { dueDate } };
}

/**
 * Handles submission of the due-date-field edit form.
 *
 * On success, returns the field in display mode rather than the whole row or
 * whole table, matching the local swap strategy.
 */
async function handleTodoUpdateDueDate(
    request: Request,
    id: number,
): Promise<Response> {
    const form = await request.formData();
    const parsed = parseDueDateUpdate(form);

    if (!parsed.ok) {
        return appErrorResponse(parsed.error);
    }

    const updatedResult = await updateTodoDueDate(id, parsed.value.dueDate);
    if (!updatedResult.ok) {
        return appErrorResponse(updatedResult.error);
    }

    return htmlResponse(<DueDateDisplay todo={updatedResult.value} />);
}

/**
 * Read-only display fragment for the todo due date field.
 *
 * Clicking the field swaps this display fragment for its edit fragment.
 */
function DueDateDisplay(props: { todo: TodoRow }) {
    const link = `/todos/${props.todo.id}/edit/due-date`;
    return (
        <a href={link} fx-action={link} fx-method="POST" fx-swap="outerHTML">
            {props.todo.due_date || "<ADD>"}
        </a>
    );
}

export {
    DueDateDisplay,
    handleTodoEditDueDate,
    handleTodoUpdateDueDate
};

export type {
    TodoDueDateUpdatedEvent,
    TodoDueDateUpdatedData,
};