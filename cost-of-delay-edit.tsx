import { getTodo } from "./persistence";
import type { TodoRow } from "./types";
import { appErrorResponse, htmlResponse } from "./response";

/**
 * Edit fragment for the todo cost of delay field.
 *
 * Architectural role:
 * - render the editable form for one field
 * - keep the edit interaction local to the field being changed
 */
function CostOfDelayEditor(props: { todo: TodoRow }) {
  return (
    <form
      fx-action={`/todos/${props.todo.id}/update/cost-of-delay`}
      fx-method="POST"
      fx-swap="outerHTML"
    >
      <label>
        Cost of Delay{" "}
        <select name="cost_of_delay" value={String(props.todo.cost_of_delay)} required>
          <option value="-2">-2</option>
          <option value="-1">-1</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
      </label>{" "}
      <button type="submit">Save</button>
    </form>
  );
}

/**
 * Loads one todo and returns the cost-of-delay-field edit fragment.
 */
async function handleTodoEditCostOfDelay(id: number): Promise<Response> {
  const todoResult = await getTodo(id);
  if (!todoResult.ok) {
    return appErrorResponse(todoResult.error);
  }

  return htmlResponse(<CostOfDelayEditor todo={todoResult.value} />);
}

export default handleTodoEditCostOfDelay;
