import pg from "pg";
import type { Result } from "./error";
import type { TodoRow } from "./types";

const { Pool } = pg;
const databaseUrl = process.env["DATABASE_URL"];
const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;
 
async function getTodos(): Promise<Result<TodoRow[], Error>> {
  if (!pool) {
    return { ok: false, error: new Error("No database connection") };
  }

  const result = await pool.query<TodoRow>(
    `
      SELECT id, short, due_date, cost_of_delay, effort
      FROM todos
      ORDER BY id ASC
      LIMIT 50
    `,
  );

  return { ok: true, value: result.rows };
}


async function getTodo(id: number): Promise<Result<TodoRow, Error>> {
  if (!pool) {
    return { ok: false, error: new Error("No database connection") };
  }

  const result = await pool.query<TodoRow>(
    `
      SELECT id, short, due_date, cost_of_delay, effort
      FROM todos
      WHERE id = $1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return { ok: false, error: new Error("Todo not found") };
  }

  if (!result.rows[0]) {
    return { ok: false, error: new Error("Todo short description is null") };
  }

  return { ok: true, value: result.rows[0] };
}

async function updateTodoShort(id: number, short: string): Promise<Result<TodoRow, Error>> {
  if (!pool) {
    return { ok: false, error: new Error("No database connection") };
  }

  const result = await pool.query<TodoRow>(
    `
      UPDATE todos
      SET short = $2
      WHERE id = $1
      RETURNING id, short, due_date, cost_of_delay, effort
    `,
    [id, short],
  );

  if (result.rows.length === 0) {
    return { ok: false, error: new Error("Todo not found") };
  }
  if (!result.rows[0]) {
    return { ok: false, error: new Error("Todo short description is null") };
  }
  return { ok: true, value: result.rows[0] };
}

export { getTodos, getTodo, updateTodoShort };