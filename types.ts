
type Todo = {
  id: number;
  short: string;
  dueDate: string;
  costOfDelay: number;
  effort: number;
};

type TodoRow = {
  id: number;
  short: string;
  due_date: string;
  cost_of_delay: number;
  effort: number;
};

export type { Todo, TodoRow };
