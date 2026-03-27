import { updateTodoShort } from "./persistence";
import { appErrorResponse, htmlResponse, } from "./response";

import { ShortDisplay } from "./short";


async function handleTodoUpdateShort(
  request: Request,
  id: number,
): Promise<Response> {
  const form = await request.formData();

  const parsedShort = String(form.get("short") ?? "").trim();
  if (parsedShort.length < 3 || parsedShort.length > 120) {
    return appErrorResponse({
      kind: "validation",
      message: "Short must be 3-120 chars",
    });
  }
  const updatedResult = await updateTodoShort(id, parsedShort);
  if (!updatedResult.ok) {
    return appErrorResponse(updatedResult.error);
  }

  return htmlResponse(<ShortDisplay todo={updatedResult.value} />);
}

export { handleTodoUpdateShort };