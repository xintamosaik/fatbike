import { createTodo } from "./persistence";
import { TodoRowDisplay } from "./table";
import { appErrorResponse, htmlResponse } from "./response";

/**
 * Handles the "create todo" interaction.
 *
 * Architectural role:
 * - accepts a create request
 * - delegates persistence to the app-facing persistence API
 * - returns the HTML fragment for the newly created row
 *
 * This handler deliberately renders only the created row rather than the full
 * list. That keeps the interaction local and matches the UI swap strategy.
 */
async function handleTodoCreate(): Promise<Response> {
    const createResult = await createTodo();
    if (!createResult.ok) {
        return appErrorResponse(createResult.error);
    }

    return htmlResponse(<TodoRowDisplay todo={createResult.value} />);
}

export default handleTodoCreate;
