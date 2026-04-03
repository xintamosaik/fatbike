import type { TodoRow } from "./types";
import type { FormDataEntryValue } from "bun";
import type { AppError, Result } from "./error";
import { appErrorResponse, htmlResponse, } from "./response";
import { updateExistingTodo, getTodo } from "./persistence";

/**
 * The data shape for a `todo_short_updated` event data, which captures a change to the
 * `short` field of a todo.
 */
type TodoShortUpdatedData = {
    short: string;
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
function updateTodoShort(id: number, short: TodoShortUpdatedData["short"]): Promise<Result<TodoRow, AppError>> {
    return updateExistingTodo({
        id,
        hasChanged: (existing) => existing.short !== short,
        makeEvent: ({ seq, at }) => ({
            seq,
            stream: "todo",
            kind: "todo_short_updated",
            entity_id: id,
            at,
            data: { short },
        }),
    });
}

/**
 * Read-only display fragment for the todo short field.
 *
 * Clicking the field swaps this display fragment for its edit fragment.
 */
function ShortDisplay(props: { todo: TodoRow }) {
    const link = `/todos/${props.todo.id}/edit/short`;
    return (
        <button
            fx-action={link}
            fx-method="POST"
            fx-swap="outerHTML"
        >
            {props.todo.short || "<ADD>"}
        </button>
    );
}


/**
 * Update interaction for the todo short field.
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
 *
 * This is intentionally smaller than `Request` or full `FormData`: it depends
 * only on the `get()` capability it actually needs.
 */
type FormLike = {
    get(name: string): FormDataEntryValue | null;
};

/**
 * Parses and validates the submitted short value.
 *
 * This helper is intentionally smaller than `Request` or full `FormData`:
 * it depends only on the `get()` capability it actually needs.
 */
function parseShortUpdate(
    form: FormLike,
): Result<{ short: string }, AppError> {
    const rawShort = form.get("short");

    if (typeof rawShort !== "string") {
        return {
            ok: false,
            error: {
                kind: "validation",
                message: "Short is required.",
            },
        };
    }

    const short = rawShort.trim();

    if (short.length < 3 || short.length > 120) {
        return {
            ok: false,
            error: {
                kind: "validation",
                message: "Short must be 3-120 chars",
            },
        };
    }

    return { ok: true, value: { short } };
}

/**
 * Handles submission of the short-field edit form.
 *
 * On success, returns the field in display mode rather than the whole row or
 * whole table, matching the local swap strategy.
 */
async function handleTodoUpdateShort(
    request: Request,
    id: number,
): Promise<Response> {
    const form = await request.formData();
    const parsed = parseShortUpdate(form);

    if (!parsed.ok) {
        return appErrorResponse(parsed.error);
    }

    const updatedResult = await updateTodoShort(id, parsed.value.short);
    if (!updatedResult.ok) {
        return appErrorResponse(updatedResult.error);
    }

    return htmlResponse(<ShortDisplay todo={updatedResult.value} />);
}

/**
 * Edit fragment for the todo short field.
 *
 * Architectural role:
 * - render the editable form for one field
 * - keep the edit interaction local to the field being changed
 */
function ShortEditor(props: { todo: TodoRow }) {
    return (
        <form
            fx-action={`/todos/${props.todo.id}/update/short`}
            fx-method="POST"
            fx-swap="outerHTML"
        >
            <input
                name="short"
                value={props.todo.short}
                required
                minLength={3}
                maxLength={120}
            />
        </form>
    );
}

/**
 * Loads one todo and returns the short-field edit fragment.
 */
async function handleTodoEditShort(id: number): Promise<Response> {
    const todoResult = await getTodo(id);
    if (!todoResult.ok) {
        return appErrorResponse(todoResult.error);
    }

    return htmlResponse(<ShortEditor todo={todoResult.value} />);
}

export {
    handleTodoUpdateShort,
    ShortDisplay,
    handleTodoEditShort,

};

export type {
    TodoShortUpdatedEvent,
    TodoShortUpdatedData,
};