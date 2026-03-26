import { updateTodoShort } from "./persistence";
import { appErrorResponse, htmlResponse, } from "./response";
import type { Result, AppError } from "./error";
import { ShortDisplay } from "./short";
 

function parseShort(raw: string): Result<string, AppError> {
  const trimmed = raw.trim();

  if (trimmed.length < 3) {
    return {
      ok: false,
      error: {
        kind: "validation",
        message: "Short must be at least 3 characters.",
      },
    };
  }

  if (trimmed.length > 120) {
    return {
      ok: false,
      error: {
        kind: "validation",
        message: "Short must be at most 120 characters.",
      },
    };
  }

  return { ok: true, value: trimmed };
}
 
 
async function handleTodoUpdateShort(
  request: Request,
  id: number,
): Promise<Response> {
  const form = await request.formData();
 
  const parsedShort = parseShort(String(form.get("short") ?? "").trim());
  if (!parsedShort.ok) {
    return appErrorResponse(parsedShort.error);
  }

  const updatedResult = await updateTodoShort(id, parsedShort.value);
  if (!updatedResult.ok) {
    return appErrorResponse(updatedResult.error);
  }
  
  return htmlResponse(<ShortDisplay todo={updatedResult.value} />);
}

export { handleTodoUpdateShort };