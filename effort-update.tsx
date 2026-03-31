import type { FormDataEntryValue } from "bun";
import type { AppError, Result } from "./error";

import { updateTodoEffort } from "./persistence";
import { appErrorResponse, htmlResponse } from "./response";

import EffortDisplay from "./effort";

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

const effortValues = ["mins", "hours", "days", "weeks", "months"] as const;
type EffortValue = (typeof effortValues)[number];

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

  if (!effortValues.includes(rawEffort as EffortValue)) {
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

export default handleTodoUpdateEffort;
