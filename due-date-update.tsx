import type { FormDataEntryValue } from "bun";
import type { AppError, Result } from "./error";

import { updateTodoDueDate } from "./persistence";
import { appErrorResponse, htmlResponse } from "./response";

import DueDateDisplay from "./due-date";

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

export default handleTodoUpdateDueDate;
