import type { FormDataEntryValue } from "bun";
import type { AppError, Result } from "./error";

import { updateTodoCostOfDelay } from "./persistence";
import { appErrorResponse, htmlResponse } from "./response";

import CostOfDelayDisplay from "./cost-of-delay";

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

export default handleTodoUpdateCostOfDelay;
