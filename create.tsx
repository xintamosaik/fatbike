import { createTodo } from "./persistence";
import { TodoRowDisplay } from "./table";
import { appErrorResponse, htmlResponse } from "./response";

async function handleTodoCreate(): Promise<Response> {
    const createResult = await createTodo();
    if (!createResult.ok) {
        return appErrorResponse(createResult.error);
    }

    return htmlResponse(<TodoRowDisplay todo={createResult.value} />);
}

export default handleTodoCreate;
 