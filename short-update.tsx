
import type { FormDataEntryValue } from "bun";
import type { AppError, Result } from "./error";

import { updateTodoShort } from "./persistence";
import { appErrorResponse, htmlResponse, } from "./response";

import ShortDisplay from "./short";

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

export default handleTodoUpdateShort;