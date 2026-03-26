import { getTodos } from "./persistence";
import type { TodoRow } from "./types";
import { appErrorResponse, htmlResponse } from "./response";
import { ShortDisplay } from "./short";

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
        <tbody>
          <tr>
            <td colSpan={4}>
              <a href="/todos/new" fx-action="/todos/new" fx-target="#output" fx-method="POST" fx-swap="outerHTML">
                + New Todo
              </a>   
            </td>
          </tr>
          {props.todos.map((todo) => (
            <tr key={todo.id}>
              <td>
                <ShortDisplay todo={todo} />
              </td>
              <td>
                {todo.due_date}
              </td>
              <td>
                {todo.cost_of_delay}
              </td>
              <td>
                {todo.effort}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

async function handleTodosList(): Promise<Response> {
  const todosResult = await getTodos();
  if (!todosResult.ok) {
    return appErrorResponse(todosResult.error);
  }

  return htmlResponse(<TodoList todos={todosResult.value} />);
}

export { handleTodosList, TodoList };