import { getTodo } from "./persistence";
import type { TodoRow } from "./types";
import { appErrorResponse, htmlResponse } from "./response";

/**
 * Edit fragment for the todo due date field.
 *
 * Architectural role:
 * - render the editable form for one field
 * - keep the edit interaction local to the field being changed
 */
function DueDateEditor(props: { todo: TodoRow }) {
  return (
    <form
      fx-action={`/todos/${props.todo.id}/update/due-date`}
      fx-method="POST"
      fx-swap="outerHTML"
    >
      <label>
        Due Date{" "}
        <input name="due_date" type="date" value={props.todo.due_date} />
      </label>{" "}
      <button type="submit">Save</button>
    </form>
  );
}

/**
 * Loads one todo and returns the due-date-field edit fragment.
 */
async function handleTodoEditDueDate(id: number): Promise<Response> {
  const todoResult = await getTodo(id);
  if (!todoResult.ok) {
    return appErrorResponse(todoResult.error);
  }

  return htmlResponse(<DueDateEditor todo={todoResult.value} />);
}

export default handleTodoEditDueDate;
