import { getTodo, updateTodoShort } from "./pg";
import type { TodoRow } from "./types";
import { appErrorResponse, htmlResponse, } from "./response";
import type { Result, AppError } from "./error";
function parseShort(raw: string): Result<string, AppError> {
  const trimmed = raw.trim();

  if (trimmed.length < 3) {
    return {
      ok: false,
      error: {
        kind: "validation",
        message: "Short must be at least 3 characters.",
      },
    };
  }

  if (trimmed.length > 120) {
    return {
      ok: false,
      error: {
        kind: "validation",
        message: "Short must be at most 120 characters.",
      },
    };
  }

  return { ok: true, value: trimmed };
}
function shortSlotId(id: number): string {
  return `todo-short-${id}`;
}

function ShortDisplay(props: { todo: TodoRow }) {
  const slotId = shortSlotId(props.todo.id);

  return (
    <div id={slotId}>
      <span>{props.todo.short}</span>{" "}
      <button
        fx-action={`/todos/${props.todo.id}/edit/short`}
        fx-method="POST"
        fx-target={`#${slotId}`}
        fx-swap="outerHTML"
      >
        Edit
      </button>
    </div>
  );
}

function ShortEditor(props: { todo: TodoRow }) {
  const slotId = shortSlotId(props.todo.id);

  return (
    <form
      id={slotId}
      fx-action={`/todos/${props.todo.id}/update/short`}
      fx-method="POST"
      fx-target={`#${slotId}`}
      fx-swap="outerHTML"
    >
      <label>
        Short{" "}
        <input
          name="short"
          value={props.todo.short}
          required
          minLength={3}
          maxLength={120}
        />
      </label>{" "}
      <button type="submit">Save</button>
    </form>
  );
}

async function handleTodoEditShort(id: number): Promise<Response> {
  const todoResult = await getTodo(id);
  if (!todoResult.ok) {
    return appErrorResponse(todoResult.error);
  }

  return htmlResponse(<ShortEditor todo={todoResult.value} />);
}

async function handleTodoUpdateShort(
  request: Request,
  id: number,
): Promise<Response> {
  const form = await request.formData();
 
  const parsedShort = parseShort(String(form.get("short") ?? "").trim());
  if (!parsedShort.ok) {
    return appErrorResponse(parsedShort.error);
  }

  const updatedResult = await updateTodoShort(id, parsedShort.value);
  if (!updatedResult.ok) {
    return appErrorResponse(updatedResult.error);
  }
  
  return htmlResponse(<ShortDisplay todo={updatedResult.value} />);
}

export { ShortDisplay, handleTodoEditShort, handleTodoUpdateShort };