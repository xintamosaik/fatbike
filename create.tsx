import { createTodo } from "./persistence";
import TodoList from "./table";
import { appErrorResponse, htmlResponse } from "./response";

async function handleTodoCreate(): Promise<Response> {
    const createResult = await createTodo();
    if (!createResult.ok) {
        return appErrorResponse(createResult.error);
    }

    return htmlResponse(<TodoList todos={createResult.value} />);
}

export default handleTodoCreate;
 