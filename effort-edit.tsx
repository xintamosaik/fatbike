import { getTodo } from "./persistence";
import type { TodoRow } from "./types";
import { appErrorResponse, htmlResponse } from "./response";

/**
 * Edit fragment for the todo effort field.
 *
 * Architectural role:
 * - render the editable form for one field
 * - keep the edit interaction local to the field being changed
 */
function EffortEditor(props: { todo: TodoRow }) {
  return (
    <form
      fx-action={`/todos/${props.todo.id}/update/effort`}
      fx-method="POST"
      fx-swap="outerHTML"
    >
      <label>
        Effort{" "}
        <select name="effort" value={props.todo.effort} required>
          <option value="mins">mins</option>
          <option value="hours">hours</option>
          <option value="days">days</option>
          <option value="weeks">weeks</option>
          <option value="months">months</option>
        </select>
      </label>{" "}
      <button type="submit">Save</button>
    </form>
  );
}

/**
 * Loads one todo and returns the effort-field edit fragment.
 */
async function handleTodoEditEffort(id: number): Promise<Response> {
  const todoResult = await getTodo(id);
  if (!todoResult.ok) {
    return appErrorResponse(todoResult.error);
  }

  return htmlResponse(<EffortEditor todo={todoResult.value} />);
}

export default handleTodoEditEffort;
