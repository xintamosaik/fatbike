import type { TodoRow } from "./types";
import ShortDisplay from "./short";
import DueDateDisplay from "./due-date";
import EffortDisplay from "./effort";
import CostOfDelayDisplay from "./cost-of-delay";

/**
 * Table fragments for todo list rendering.
 *
 * Architectural role:
 * - define reusable HTML fragments for the list read model
 * - keep handlers free from table markup
 */

/**
 * Renders a single todo row.
 *
 * This fragment is used both when rendering the full list and when appending
 * one newly created todo to the existing table body.
 */
function TodoRowDisplay(props: { todo: TodoRow }) {
  return (
    <tr>
      <td>
        <ShortDisplay todo={props.todo} />
      </td>
      <td>
        <DueDateDisplay todo={props.todo} />
      </td>
      <td>
        <CostOfDelayDisplay todo={props.todo} />
      </td>
      <td>
        <EffortDisplay todo={props.todo} />
      </td>
    </tr>
  );
}

/**
 * Renders the full todo table.
 *
 * The table body is also a swap target for row-level updates such as
 * appending newly created todos.
 */
function TodoList(props: { todos: TodoRow[] }) {
  return (
    <section>
      <h2>Todos</h2>

      <table>
        <thead>
          <tr>
            <th>Short</th>
            <th>Due Date</th>
            <th>Cost of Delay</th>
            <th>Effort</th>
          </tr>
        </thead>
        <tbody id="todos-list">
          <tr>
            <td colSpan={4}>
              <a href="/todos/new" fx-action="/todos/new" fx-target="#todos-list" fx-method="POST" fx-swap="beforeend">
                + New Todo
              </a>
            </td>
          </tr>
          {props.todos.map((todo) => (
            <TodoRowDisplay key={todo.id} todo={todo} />
          ))}
        </tbody>
      </table>
    </section>
  );
}


export { TodoList, TodoRowDisplay };