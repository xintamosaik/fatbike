type TodoCreatedData = {
  short: string;
  due_date: string;
  cost_of_delay: -2 | -1 | 0 | 1 | 2;
  effort: "mins" | "hours" | "days" | "weeks" | "months";
};

type TodoShortUpdatedData = {
  short: string;
};

type TodoCreatedEvent = {
  seq: number;
  stream: "todo";
  kind: "todo_created";
  entity_id: number;
  at: string;
  data: TodoCreatedData;
};

type TodoShortUpdatedEvent = {
  seq: number;
  stream: "todo";
  kind: "todo_short_updated";
  entity_id: number;
  at: string;
  data: TodoShortUpdatedData;
};

type TodoEvent = TodoCreatedEvent | TodoShortUpdatedEvent;

export type {
  TodoCreatedData,
  TodoShortUpdatedData,
  TodoCreatedEvent,
  TodoShortUpdatedEvent,
  TodoEvent,
};
