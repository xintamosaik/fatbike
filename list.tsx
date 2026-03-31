import { getTodos } from "./persistence";
import { appErrorResponse, htmlResponse } from "./response";

import { TodoList } from "./table";
/**
 * Handles the initial todo list read.
 *
 * Architectural role:
 * - loads the current read model from persistence
 * - renders the full table view
 *
 * Unlike create/update handlers, this returns a collection fragment because
 * the list page is the entry point for the UI.
 */
async function handleTodosList(): Promise<Response> {
  const todosResult = await getTodos();
  if (!todosResult.ok) {
    return appErrorResponse(todosResult.error);
  }

  return htmlResponse(<TodoList todos={todosResult.value} />);
}

export default handleTodosList;