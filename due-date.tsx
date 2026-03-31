import type { TodoRow } from "./types";

/**
 * Read-only display fragment for the todo due date field.
 *
 * Clicking the field swaps this display fragment for its edit fragment.
 */
function DueDateDisplay(props: { todo: TodoRow }) {
  const link = `/todos/${props.todo.id}/edit/due-date`;
  return (
    <a href={link} fx-action={link} fx-method="POST" fx-swap="outerHTML">
      {props.todo.due_date || "<ADD>"}
    </a>
  );
}

export default DueDateDisplay;
