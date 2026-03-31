import type { TodoRow } from "./types";

import ShortDisplay from "./short";
function TodoRowDisplay(props: { todo: TodoRow }) {
  return (
    <tr>
      <td>
        <ShortDisplay todo={props.todo} />
      </td>
      <td>
        {props.todo.due_date}
      </td>
      <td>
        {props.todo.cost_of_delay}
      </td>
      <td>
        {props.todo.effort}
      </td>
    </tr>
  );
}

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