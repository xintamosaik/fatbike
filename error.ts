type Ok<T> = { ok: true; value: T };
type Err<E> = { ok: false; error: E };
type Result<T, E> = Ok<T> | Err<E>;
type AppError =
  | { kind: "not_found"; message: string }
  | { kind: "validation"; message: string }
  | { kind: "internal"; message: string };
export type { Ok, Err, Result, AppError };