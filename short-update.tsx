
import type { FormDataEntryValue } from "bun";
import type { AppError, Result } from "./error";

import { updateTodoShort } from "./persistence";
import { appErrorResponse, htmlResponse, } from "./response";

import ShortDisplay from "./short";
type FormLike = {
  get(name: string): FormDataEntryValue | null;
};

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