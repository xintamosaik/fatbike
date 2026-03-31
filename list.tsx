import { getTodos } from "./persistence";
import { appErrorResponse, htmlResponse } from "./response";

import {TodoList} from "./table";

async function handleTodosList(): Promise<Response> {
  const todosResult = await getTodos();
  if (!todosResult.ok) {
    return appErrorResponse(todosResult.error);
  }

  return htmlResponse(<TodoList todos={todosResult.value} />);
}

export default handleTodosList;