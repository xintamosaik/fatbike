import type { TodoRow } from "./types";
import type { FormDataEntryValue } from "bun";
import type { AppError, Result } from "./error";

import { appErrorResponse, htmlResponse } from "./response";
import { getTodo, updateTodoCostOfDelay } from "./persistence";

/**
 * The data shape for a `todo_cost_of_delay_updated` event data, which captures
 * a change to the `cost_of_delay` field of a todo.
 */
type TodoCostOfDelayUpdatedData = {
    cost_of_delay: -2 | -1 | 0 | 1 | 2;
};

/**
 * The shape of a `todo_cost_of_delay_updated` event, which captures an update
 * to the `cost_of_delay` field of an existing todo.
 */
type TodoCostOfDelayUpdatedEvent = {
    seq: number;
    stream: "todo";
    kind: "todo_cost_of_delay_updated";
    entity_id: number;
    at: string;
    data: TodoCostOfDelayUpdatedData;
};

/**
 * Edit fragment for the todo cost of delay field.
 *
 * Architectural role:
 * - render the editable form for one field
 * - keep the edit interaction local to the field being changed
 */
function CostOfDelayEditor(props: { todo: TodoRow }) {
    return (
        <form
            fx-action={`/todos/${props.todo.id}/update/cost-of-delay`}
            fx-method="POST"
            fx-swap="outerHTML"
        >
            <label>
                Cost of Delay{" "}
                <select name="cost_of_delay" value={String(props.todo.cost_of_delay)} required>
                    <option value="-2">-2</option>
                    <option value="-1">-1</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                </select>
            </label>{" "}
            <button type="submit">Save</button>
        </form>
    );
}

/**
 * Loads one todo and returns the cost-of-delay-field edit fragment.
 */
async function handleTodoEditCostOfDelay(id: number): Promise<Response> {
    const todoResult = await getTodo(id);
    if (!todoResult.ok) {
        return appErrorResponse(todoResult.error);
    }

    return htmlResponse(<CostOfDelayEditor todo={todoResult.value} />);
}




/**
 * Update interaction for the todo cost of delay field.
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

const costOfDelayValues = ["-2", "-1", "0", "1", "2"] as const;
type CostOfDelayValue = -2 | -1 | 0 | 1 | 2;

/**
 * Parses and validates the submitted cost of delay value.
 */
function parseCostOfDelayUpdate(
    form: FormLike,
): Result<{ costOfDelay: CostOfDelayValue }, AppError> {
    const rawCostOfDelay = form.get("cost_of_delay");

    if (typeof rawCostOfDelay !== "string") {
        return {
            ok: false,
            error: {
                kind: "validation",
                message: "Cost of delay is required.",
            },
        };
    }

    if (!costOfDelayValues.includes(rawCostOfDelay as (typeof costOfDelayValues)[number])) {
        return {
            ok: false,
            error: {
                kind: "validation",
                message: "Cost of delay must be one of -2, -1, 0, 1, 2.",
            },
        };
    }

    return { ok: true, value: { costOfDelay: Number(rawCostOfDelay) as CostOfDelayValue } };
}

/**
 * Handles submission of the cost-of-delay-field edit form.
 *
 * On success, returns the field in display mode rather than the whole row or
 * whole table, matching the local swap strategy.
 */
async function handleTodoUpdateCostOfDelay(
    request: Request,
    id: number,
): Promise<Response> {
    const form = await request.formData();
    const parsed = parseCostOfDelayUpdate(form);

    if (!parsed.ok) {
        return appErrorResponse(parsed.error);
    }

    const updatedResult = await updateTodoCostOfDelay(id, parsed.value.costOfDelay);
    if (!updatedResult.ok) {
        return appErrorResponse(updatedResult.error);
    }

    return htmlResponse(<CostOfDelayDisplay todo={updatedResult.value} />);
}



/**
 * Read-only display fragment for the todo cost of delay field.
 *
 * Clicking the field swaps this display fragment for its edit fragment.
 */
function CostOfDelayDisplay(props: { todo: TodoRow }) {
    const link = `/todos/${props.todo.id}/edit/cost-of-delay`;
    return (
        <a href={link} fx-action={link} fx-method="POST" fx-swap="outerHTML">
            {props.todo.cost_of_delay}
        </a>
    );
}
export {
    handleTodoUpdateCostOfDelay,
    CostOfDelayDisplay,
    handleTodoEditCostOfDelay
}

export type {
    TodoCostOfDelayUpdatedEvent,
    TodoCostOfDelayUpdatedData,
}