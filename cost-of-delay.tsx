import type { TodoRow } from "./types";

/**
 * Read-only display fragment for the todo cost of delay field.
 *
 * Clicking the field swaps this display fragment for its edit fragment.
 */
function CostOfDelayDisplay(props: { todo: TodoRow }) {
  const link = `/todos/${props.todo.id}/edit/cost-of-delay`;
  return (
    <a href={link} fx-action={link} fx-method="POST" fx-swap="outerHTML">
      {props.todo.cost_of_delay}
    </a>
  );
}

export default CostOfDelayDisplay;
