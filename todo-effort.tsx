import type { TodoRow } from "./types";
import type { FormDataEntryValue } from "bun";
import type { AppError, Result } from "./error";

import { appErrorResponse, htmlResponse } from "./response";
import { getTodo, updateExistingTodo } from "./persistence";

type EffortValue = "mins" | "hours" | "days" | "weeks" | "months";
const effortValues = ["mins", "hours", "days", "weeks", "months"] as const satisfies readonly EffortValue[];

/**
 * The data shape for a `todo_effort_updated` event data, which captures a
 * change to the `effort` field of a todo.
 */
type TodoEffortUpdatedData = {
    effort: EffortValue;
};
/**
 * The shape of a `todo_effort_updated` event, which captures an update to
 * the `effort` field of an existing todo.
 */
type TodoEffortUpdatedEvent = {
    seq: number;
    stream: "todo";
    kind: "todo_effort_updated";
    entity_id: number;
    at: string;
    data: TodoEffortUpdatedData;
};
function updateTodoEffort( id: number, effort: TodoEffortUpdatedData["effort"]): Promise<Result<TodoRow, AppError>> {
    return updateExistingTodo({
        id,
        hasChanged: (existing) => existing.effort !== effort,
        makeEvent: ({ seq, at }) => ({
            seq,
            stream: "todo",
            kind: "todo_effort_updated",
            entity_id: id,
            at,
            data: { effort },
        }),
    });
}

/**
 * Edit fragment for the todo effort field.
 *
 * Architectural role:
 * - render the editable form for one field
 * - keep the edit interaction local to the field being changed
 */
function EffortEditor(props: { todo: TodoRow }) {
    return (
        <form
            style={{ display: "flex", gap: "1ch", alignItems: "center" }}
            fx-action={`/todos/${props.todo.id}/update/effort`}
            fx-method="POST"
            fx-swap="outerHTML"
        >
            {effortValues.map((v) => (
                <button key={v} type="submit" name="effort" value={v}>
                    {v}
                </button>
            ))}
        </form>
    );
}

/**
 * Loads one todo and returns the effort-field edit fragment.
 */
async function handleTodoEditEffort(id: number): Promise<Response> {
    const todoResult = await getTodo(id);
    if (!todoResult.ok) {
        return appErrorResponse(todoResult.error);
    }

    return htmlResponse(<EffortEditor todo={todoResult.value} />);
}




/**
 * Update interaction for the todo effort field.
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
 * Parses and validates the submitted effort value.
 */
function parseEffortUpdate(
    form: FormLike,
): Result<{ effort: EffortValue }, AppError> {
    const rawEffort = form.get("effort");

    if (typeof rawEffort !== "string") {
        return {
            ok: false,
            error: {
                kind: "validation",
                message: "Effort is required.",
            },
        };
    }

    if (!(effortValues as readonly string[]).includes(rawEffort)) {
        return {
            ok: false,
            error: {
                kind: "validation",
                message: "Effort must be one of mins, hours, days, weeks, months.",
            },
        };
    }

    return { ok: true, value: { effort: rawEffort as EffortValue } };
}

/**
 * Handles submission of the effort-field edit form.
 *
 * On success, returns the field in display mode rather than the whole row or
 * whole table, matching the local swap strategy.
 */
async function handleTodoUpdateEffort(
    request: Request,
    id: number,
): Promise<Response> {
    const form = await request.formData();
    const parsed = parseEffortUpdate(form);

    if (!parsed.ok) {
        return appErrorResponse(parsed.error);
    }

    const updatedResult = await updateTodoEffort(id, parsed.value.effort);
    if (!updatedResult.ok) {
        return appErrorResponse(updatedResult.error);
    }

    return htmlResponse(<EffortDisplay todo={updatedResult.value} />);
}




/**
 * Read-only display fragment for the todo effort field.
 *
 * Clicking the field swaps this display fragment for its edit fragment.
 */
function EffortDisplay(props: { todo: TodoRow }) {
    const link = `/todos/${props.todo.id}/edit/effort`;
    return (
        <button fx-action={link} fx-method="POST" fx-swap="outerHTML">
            {props.todo.effort}
        </button>
    );
}

export {
    EffortDisplay,
    handleTodoEditEffort,
    handleTodoUpdateEffort
};

export type {
    TodoEffortUpdatedEvent,
    TodoEffortUpdatedData,
};