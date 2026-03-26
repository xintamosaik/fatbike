import type { TodoRow } from "./types";
function ShortDisplay(props: { todo: TodoRow }) {
  return (
    <a
      fx-action={`/todos/${props.todo.id}/edit/short`}
      fx-method="POST"
      fx-swap="outerHTML"
    >
      {props.todo.short}
    </a>
  );
}

export { ShortDisplay };