import type { TodoRow } from "./types";
function ShortDisplay(props: { todo: TodoRow }) {
  return (
    <a href={`/todos/${props.todo.id}/edit/short`}
      fx-action={`/todos/${props.todo.id}/edit/short`}
      fx-method="POST"
      fx-swap="outerHTML"
    >
      {props.todo.short || "<ADD>"}
    </a>
  );
}

export default ShortDisplay;