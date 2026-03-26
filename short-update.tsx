import { updateTodoShort } from "./persistence";
import { appErrorResponse, htmlResponse, } from "./response";

import { ShortDisplay } from "./short";
 
 
async function handleTodoUpdateShort(
  request: Request,
  id: number,
): Promise<Response> {
  const form = await request.formData();
 
  const parsedShort = String(form.get("short") ?? "").trim();

  const updatedResult = await updateTodoShort(id, parsedShort);
  if (!updatedResult.ok) {
    return appErrorResponse(updatedResult.error);
  }
  
  return htmlResponse(<ShortDisplay todo={updatedResult.value} />);
}

export { handleTodoUpdateShort };