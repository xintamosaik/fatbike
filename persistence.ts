import pg from "pg";
import type { AppError, Result } from "./error";
import type { TodoRow } from "./types";

const { Pool } = pg;
const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString: databaseUrl });
 
async function getTodos(): Promise<Result<TodoRow[], AppError>> {
  try {
    const result = await pool.query<TodoRow>(
      `
        SELECT id, short, due_date, cost_of_delay, effort
        FROM todos
        ORDER BY id ASC
        LIMIT 50
      `,
    );

    return { ok: true, value: result.rows };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to load todos." },
    };
  }
}


async function getTodo(id: number): Promise<Result<TodoRow, AppError>> {
  try {
    const result = await pool.query<TodoRow>(
      `
        SELECT id, short, due_date, cost_of_delay, effort
        FROM todos
        WHERE id = $1
      `,
      [id],
    );

    const row = result.rows[0];
    if (!row) {
      return {
        ok: false,
        error: { kind: "not_found", message: "Todo not found." },
      };
    }

    return { ok: true, value: row };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to load todo." },
    };
  }
}

async function updateTodoShort(id: number, short: string): Promise<Result<TodoRow, AppError>> {
  try {
    const result = await pool.query<TodoRow>(
      `
        UPDATE todos
        SET short = $2
        WHERE id = $1
        RETURNING id, short, due_date, cost_of_delay, effort
      `,
      [id, short],
    );

    const row = result.rows[0];
    if (!row) {
      return {
        ok: false,
        error: { kind: "not_found", message: "Todo not found." },
      };
    }

    return { ok: true, value: row };
  } catch {
    return {
      ok: false,
      error: { kind: "internal", message: "Failed to update todo." },
    };
  }
}

export { getTodos, getTodo, updateTodoShort };