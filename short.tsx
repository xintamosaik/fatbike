import type { TodoRow } from "./types";

/**
 * Read-only display fragment for the todo short field.
 *
 * Clicking the field swaps this display fragment for its edit fragment.
 */
function ShortDisplay(props: { todo: TodoRow }) {
  const link = `/todos/${props.todo.id}/edit/short`;
  return (
    <a href={link}
      fx-action={link}
      fx-method="POST"
      fx-swap="outerHTML"
    >
      {props.todo.short || "<ADD>"}
    </a>
  );
}

export default ShortDisplay;