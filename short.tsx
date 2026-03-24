import type { TodoRow } from "./types";
function ShortDisplay(props: { todo: TodoRow }) {
  return (
    <div>
      <span>{props.todo.short}</span>{" "}
      <button
        fx-action={`/todos/${props.todo.id}/edit/short`}
        fx-method="POST"
 
        fx-swap="outerHTML"
      >
        Edit
      </button>
    </div>
  );
}

export { ShortDisplay };