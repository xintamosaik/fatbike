import type { TodoRow } from "./types";

/**
 * Read-only display fragment for the todo effort field.
 *
 * Clicking the field swaps this display fragment for its edit fragment.
 */
function EffortDisplay(props: { todo: TodoRow }) {
  const link = `/todos/${props.todo.id}/edit/effort`;
  return (
    <a href={link} fx-action={link} fx-method="POST" fx-swap="outerHTML">
      {props.todo.effort}
    </a>
  );
}

export default EffortDisplay;
