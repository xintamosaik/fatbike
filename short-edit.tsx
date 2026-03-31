import { getTodo } from "./persistence";
import type { TodoRow } from "./types";
import { appErrorResponse, htmlResponse, } from "./response";

/**
 * Edit fragment for the todo short field.
 *
 * Architectural role:
 * - render the editable form for one field
 * - keep the edit interaction local to the field being changed
 */
function ShortEditor(props: { todo: TodoRow }) {
  return (
    <form
      fx-action={`/todos/${props.todo.id}/update/short`}
      fx-method="POST"
      fx-swap="outerHTML"
    >
      <label>
        Short{" "}
        <input
          name="short"
          value={props.todo.short}
          required
          minLength={3}
          maxLength={120}
        />
      </label>{" "}
      <button type="submit">Save</button>
    </form>
  );
}

/**
 * Loads one todo and returns the short-field edit fragment.
 */
async function handleTodoEditShort(id: number): Promise<Response> {
  const todoResult = await getTodo(id);
  if (!todoResult.ok) {
    return appErrorResponse(todoResult.error);
  }

  return htmlResponse(<ShortEditor todo={todoResult.value} />);
}

export default handleTodoEditShort;