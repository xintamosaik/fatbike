import { getTodos } from "./persistence";
import { appErrorResponse, htmlResponse } from "./response";

import type { TodoRow } from "./types";
import { ShortDisplay } from "./todo-short";
import { DueDateDisplay } from "./todo-due-date";
import { EffortDisplay } from "./todo-effort";
import { CostOfDelayDisplay } from "./todo-cost-of-delay";

/**
 * Handles the initial todo list read.
 *
 * Architectural role:
 * - loads the current read model from persistence
 * - renders the full table view
 *
 * Unlike create/update handlers, this returns a collection fragment because
 * the list page is the entry point for the UI.
 */
async function handleTodosList(): Promise<Response> {
  const todosResult = await getTodos();
  if (!todosResult.ok) {
    return appErrorResponse(todosResult.error);
  }

  return htmlResponse(<TodoList todos={todosResult.value} />);
}

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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", fontWeight: "bold" }}>
      <div>
        <ShortDisplay todo={props.todo} />
      </div>
      <div>
        <DueDateDisplay todo={props.todo} />
      </div>
      <div>
        <CostOfDelayDisplay todo={props.todo} />
      </div>
      <div>
        <EffortDisplay todo={props.todo} />
      </div>
    </div>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "1ch" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", fontWeight: "bold" }}>
          <span>Short</span>
          <span>Due Date</span>
          <span>Cost of Delay</span>
          <span>Effort</span>
        </div>
        <div>
          <button fx-action="/todos/new" fx-target="#todos-list" fx-method="POST" fx-swap="beforeend">
            + New Todo
          </button>
        </div>
        <div id="todos-list" style={{ display: "grid", gridTemplateColumns: "1fr", fontWeight: "bold", gap: "1ch" }}>
          {props.todos.map((todo) => (
            <TodoRowDisplay key={todo.id} todo={todo} />
          ))}
        </div>
      </div>
    </section>
  );
}


export { TodoList, TodoRowDisplay, handleTodosList };